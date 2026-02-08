import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text, Card, Menu, Divider } from 'react-native-paper';
import api from '../config/api';
import { AuthContext } from '../context/AuthContext';

const LeaveFormScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [farmerName, setFarmerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [villageName, setVillageName] = useState('');
  const [districtMenuVisible, setDistrictMenuVisible] = useState(false);
  const [blockMenuVisible, setBlockMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      fetchBlocks(selectedDistrict);
    } else {
      setBlocks([]);
    }
  }, [selectedDistrict]);

  const fetchDistricts = async () => {
    try {
      const response = await api.get('/locations/districts');
      const data = response.data || [];
      const mapped = user?.districts?.length
        ? data.filter(d => user.districts.includes(d.districtName))
        : data;
      setDistricts(mapped);
    } catch (error) {
      Alert.alert('Error', 'Failed to load districts');
    }
  };

  const fetchBlocks = async (districtId) => {
    try {
      const response = await api.get(`/locations/blocks/${districtId}`);
      const data = response.data || [];
      const mapped = user?.blocks?.length
        ? data.filter(b => user.blocks.includes(b.blockName))
        : data;
      setBlocks(mapped);
    } catch (error) {
      Alert.alert('Error', 'Failed to load blocks');
    }
  };

  const handleSubmit = async () => {
    if (!farmerName.trim() || !mobileNumber.trim() || !villageName.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!selectedDistrict || !selectedBlock) {
      Alert.alert('Error', 'Please select district and block');
      return;
    }

    if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/farmers', {
        farmerName,
        mobileNumber,
        districtId: selectedDistrict,
        blockId: selectedBlock,
        villageName: villageName.trim(),
      });

      Alert.alert('Success', 'Leave added successfully');
      setFarmerName('');
      setMobileNumber('');
      setSelectedDistrict(null);
      setSelectedBlock(null);
      setVillageName('');
      setDistrictMenuVisible(false);
      setBlockMenuVisible(false);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
            <Card.Content>
          <TextInput
            label="Leave Name"
            value={farmerName}
            onChangeText={setFarmerName}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Mobile Number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
            mode="outlined"
          />

          <Menu
            visible={districtMenuVisible}
            onDismiss={() => setDistrictMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setDistrictMenuVisible(true)}
                style={styles.input}
              >
                {selectedDistrict
                  ? districts.find((d) => d.districtId === selectedDistrict)?.districtName
                  : 'Select District'}
              </Button>
            }
          >
            {districts.map((district) => (
              <Menu.Item
                key={district.districtId}
                onPress={() => {
                  setSelectedDistrict(district.districtId);
                  setSelectedBlock(null);
                  setVillageName('');
                  setDistrictMenuVisible(false);
                }}
                title={district.districtName}
              />
            ))}
          </Menu>

          {selectedDistrict && (
            <Menu
              visible={blockMenuVisible}
              onDismiss={() => setBlockMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setBlockMenuVisible(true)}
                  style={styles.input}
                  disabled={!selectedDistrict}
                >
                  {selectedBlock
                    ? blocks.find((b) => b.blockId === selectedBlock)?.blockName
                    : 'Select Block'}
                </Button>
              }
            >
              {blocks.map((block) => (
                <Menu.Item
                  key={block.blockId}
                  onPress={() => {
                    setSelectedBlock(block.blockId);
                    setVillageName('');
                    setBlockMenuVisible(false);
                  }}
                  title={block.blockName}
                />
              ))}
            </Menu>
          )}

            {selectedBlock && (
              <TextInput
                label="Village Name"
                value={villageName}
                onChangeText={setVillageName}
                style={styles.input}
                mode="outlined"
              />
            )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          >
            Submit
          </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  card: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#16a34a',
  },
});

export default LeaveFormScreen;
