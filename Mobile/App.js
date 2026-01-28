import React, { useContext, useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Image, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import LeaveFormScreen from './src/screens/LeaveFormScreen';
// TeamFormScreen and ReportsScreen moved to archive
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const commonStyle = {
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 12,
        };

        return {
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 16,
            color: '#111827',
          },
          tabBarHideOnKeyboard: true,
          tabBarStyle: commonStyle,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginBottom: 1,
          },
          tabBarItemStyle: {
            marginTop: 1,
          },
          tabBarActiveTintColor: '#16a34a',
          tabBarInactiveTintColor: '#9ca3af',
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="LeaveForm"
        component={LeaveFormScreen}
        options={({ navigation }) => ({
          headerTitle: 'Add Leave',
          headerLeft: () => (
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#111827"
              style={{ marginLeft: 16 }}
              onPress={() => navigation.navigate('Home')}
            />
          ),
          tabBarLabel: 'Add Leave',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-plus" color={color} size={size} />
          ),
        })}
      />
      {/* Reports and TeamForm tabs removed (archived) */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          headerTitle: 'Profile',
          headerLeft: () => (
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#111827"
              style={{ marginLeft: 16 }}
              onPress={() => navigation.navigate('Home')}
            />
          ),
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        })}
      />
    </Tab.Navigator>
  );
};

const LoadingSplash = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require('./assets/logo.png')}
        style={styles.loadingLogo}
        resizeMode="contain"
      />
      <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate }] }]} />
    </View>
  );
};

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSplash />;
  }

  if (!user) {
    return (
      <Stack.Navigator>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LeaveForm"
        component={LeaveFormScreen}
        options={{ title: 'Add Leave' }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted' && !canAskAgain) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to capture images. Enable it in Settings.'
        );
      }
    };

    requestCameraPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  loadingSpinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#16a34a',
    borderTopColor: 'transparent',
    transform: [{ rotate: '0deg' }],
  },
});
