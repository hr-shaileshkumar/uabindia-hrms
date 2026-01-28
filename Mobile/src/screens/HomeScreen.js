import React, { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Card, Button, Text, ActivityIndicator, IconButton, Switch } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { getRoleLabel, hasAccess } from '../utils/roleAccess';
import api from '../config/api';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const tabBarHeight = useBottomTabBarHeight();
  const [stats, setStats] = useState({
    totalTreatments: 0,
    totalFarmers: 0,
    recovered: 0,
    improved: 0,
    notImproved: 0,
    totalDistricts: 0,
    totalBlocks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  const showAllLabel = user?.role === 'Admin' || user?.role === 'Department';
  const districtLabel = user?.districts?.length
    ? user.districts.join(', ')
    : (showAllLabel ? 'All' : 'Not mapped');
  const blockLabel = user?.blocks?.length
    ? user.blocks.join(', ')
    : (showAllLabel ? 'All' : 'Not mapped');

  useEffect(() => {
    fetchDashboardStats();
  }, [showTodayOnly]);

  const parseLocalDate = (value) => {
    if (!value) {
      return null;
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`);
    }
    return new Date(value);
  };

  const isToday = (value) => {
    const date = parseLocalDate(value);
    if (!date || Number.isNaN(date.getTime())) {
      return false;
    }
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [treatmentsRes, farmersRes, districtsRes] = await Promise.all([
        api.get('/treatments'),
        api.get('/farmers'),
        api.get('/locations/districts')
      ]);

      const allTreatments = treatmentsRes.data || [];
      const allFarmers = farmersRes.data || [];
      const treatments = showTodayOnly
        ? allTreatments.filter(t => isToday(t.treatmentDate))
        : allTreatments;
      const farmers = showTodayOnly
        ? allFarmers.filter(f => isToday(f.createdAt))
        : allFarmers;
      const districts = districtsRes.data || [];

      let totalBlocks = 0;
      if (districts.length > 0) {
        const blockRequests = districts.map(d => api.get(`/locations/blocks/${d.districtId}`));
        const blockResponses = await Promise.all(blockRequests);
        totalBlocks = blockResponses.reduce((sum, res) => sum + (res.data?.length || 0), 0);
      }

      setStats({
        totalTreatments: treatments.length,
        totalFarmers: farmers.length,
        recovered: treatments.filter(t => t.feedbackStatus === 'Recovered').length,
        improved: treatments.filter(t => t.feedbackStatus === 'Improved').length,
        notImproved: treatments.filter(t => t.feedbackStatus === 'NotImproved').length,
        totalDistricts: districts.length,
        totalBlocks,
      });
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View style={styles.topBarBrand}>
          <Image
            source={require('../../assets/splash.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
          <Text style={styles.topBarTitle}>Project - 1962 MVU Bihar</Text>
        </View>
        <IconButton
          icon="logout"
          mode="contained"
          onPress={logout}
          size={18}
          iconColor="#ffffff"
          containerColor="#ef4444"
          style={styles.logoutIconButton}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.welcomeText}>Welcome, {user?.fullName || user?.mobileNumber}</Text>
            <Text style={styles.roleText}>Role: {getRoleLabel(user?.role)}</Text>
            <Text style={styles.metaText}>
              Districts: {districtLabel}
            </Text>
            <Text style={styles.metaText}>
              Blocks: {blockLabel}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.dashboardHeader}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Today</Text>
            <Switch
              value={showTodayOnly}
              onValueChange={setShowTodayOnly}
              color="#16a34a"
            />
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingLogoWrapper}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.loadingLogo}
                resizeMode="contain"
              />
              <ActivityIndicator color="#16a34a" size={80} style={styles.loadingSpinner} />
            </View>
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardEmerald]}>
              <Text style={styles.statLabel}>Districts</Text>
              <Text style={styles.statValue}>{stats.totalDistricts}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <Text style={styles.statLabel}>Blocks</Text>
              <Text style={styles.statValue}>{stats.totalBlocks}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBlue]}>
              <Text style={styles.statLabel}>Total Treatments</Text>
              <Text style={styles.statValue}>{stats.totalTreatments}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardIndigo]}>
              <Text style={styles.statLabel}>Total Farmers</Text>
              <Text style={styles.statValue}>{stats.totalFarmers}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardTeal]}>
              <Text style={styles.statLabel}>Recovered</Text>
              <Text style={styles.statValue}>{stats.recovered}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardAmber]}>
              <Text style={styles.statLabel}>Improved</Text>
              <Text style={styles.statValue}>{stats.improved}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardRed]}>
              <Text style={styles.statLabel}>Not Improved</Text>
              <Text style={styles.statValue}>{stats.notImproved}</Text>
            </View>
          </View>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            {/* Farmer / Treatment / Reports actions removed (archived) */}
            {!hasAccess(user, 'Farmers') && !hasAccess(user, 'Treatments') && (
              <Text style={styles.noAccessText}>No modules available for your role.</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
    paddingBottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topBarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarLogo: {
    width: 52,
    height: 52,
    backgroundColor: 'transparent',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 20,
  },
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: '#16a34a',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#dcfce7',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#dcfce7',
  },
  card: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 0,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#6b7280',      
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
  },
  statCardEmerald: {
    borderLeftColor: '#10b981',
  },
  statCardGreen: {
    borderLeftColor: '#22c55e',
  },
  statCardBlue: {
    borderLeftColor: '#3b82f6',
  },
  statCardIndigo: {
    borderLeftColor: '#6366f1',
  },
  statCardTeal: {
    borderLeftColor: '#14b8a6',
  },
  statCardAmber: {
    borderLeftColor: '#f59e0b',
  },
  statCardRed: {
    borderLeftColor: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  loadingLogoWrapper: {
    width: 90,
    height: 90,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadingLogo: {
    width: 30,
    height: 30,
    zIndex: 1,
  },
  loadingSpinner: {
    position: 'absolute',
    zIndex: 2,
  },
  loadingText: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionButton: {
    marginBottom: 12,
    backgroundColor: '#16a34a',
  },
  noAccessText: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutIconButton: {
    marginTop: 0,
    alignSelf: 'center',
  },
});

export default HomeScreen;
