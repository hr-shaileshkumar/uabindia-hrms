import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Card, Text, Button } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { getRoleLabel } from '../utils/roleAccess';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const tabBarHeight = useBottomTabBarHeight();

  const showAllLabel = user?.role === 'Admin' || user?.role === 'Department';
  const districtLabel = user?.districts?.length
    ? user.districts.join(', ')
    : (showAllLabel ? 'All' : 'Not mapped');
  const blockLabel = user?.blocks?.length
    ? user.blocks.join(', ')
    : (showAllLabel ? 'All' : 'Not mapped');

  const formatDate = (value) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString();
  };

  const displayName = user?.fullName || user?.userName || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.content}>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.roleChip}>{getRoleLabel(user?.role) || '—'}</Text>
              <Text style={styles.subText}>{user?.mobileNumber || '—'}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{user?.userName || '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.value}>{user?.userId || '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Joined On</Text>
              <Text style={styles.value}>{formatDate(user?.createdAt)}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Districts</Text>
              <Text style={styles.value}>{districtLabel}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Blocks</Text>
              <Text style={styles.value}>{blockLabel}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Access</Text>
            <Text style={styles.value}>
              {user?.allowedPages?.length ? user.allowedPages.join(', ') : '—'}
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={logout}
          style={styles.logoutButton}
          buttonColor="#ef4444"
          textColor="#ffffff"
        >
          Logout
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerCard: {
    marginBottom: 12,
    backgroundColor: '#16a34a',
    borderRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  headerTextBlock: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  roleChip: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#dcfce7',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 4,
  },
  subText: {
    fontSize: 12,
    color: '#dcfce7',
  },
  card: {
    marginBottom: 12,
    borderRadius: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  logoutButton: {
    marginTop: 4,
    borderRadius: 10,
  },
});

export default ProfileScreen;
