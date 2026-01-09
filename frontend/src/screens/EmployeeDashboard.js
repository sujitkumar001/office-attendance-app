import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import attendanceService from '../services/attendanceService';
import { formatTime } from '../utils/dateHelpers';
import colors from '../constants/colors';
import BirthdayBanner from '../components/BirthdayBanner';

export default function EmployeeDashboard({ navigation, route }) {
  const { user, logout } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attendanceResult, statsResult] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getAttendanceStats(30),
      ]);

      if (attendanceResult.success) {
        setTodayAttendance(attendanceResult.data);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: logout,
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{user?.profileInitial}</Text>
            </TouchableOpacity>
            
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
          </View>
        </LinearGradient>

        <BirthdayBanner />

        {/* Content */}
        <View style={styles.content}>
          {/* Today's Attendance Card */}
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            style={styles.attendanceCard}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Today's Attendance</Text>
                <Text style={styles.cardSubtitle}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              {todayAttendance ? (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusDot}>●</Text>
                  <Text style={styles.statusText}>Present</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.statusBadgeInactive]}>
                  <Text style={[styles.statusDot, styles.statusDotInactive]}>●</Text>
                  <Text style={[styles.statusText, styles.statusTextInactive]}>Absent</Text>
                </View>
              )}
            </View>

            {todayAttendance ? (
              <View style={styles.attendanceInfo}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Check In</Text>
                  <Text style={styles.timeValue}>
                    {formatTime(todayAttendance.checkInTime)}
                  </Text>
                </View>
                
                {todayAttendance.checkOutTime && (
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Check Out</Text>
                    <Text style={styles.timeValue}>
                      {formatTime(todayAttendance.checkOutTime)}
                    </Text>
                  </View>
                )}

                {!todayAttendance.checkOutTime && (
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Status</Text>
                    <Text style={styles.timeValue}>Active</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAttendance}>
                <Text style={styles.noAttendanceIcon}>📅</Text>
                <Text style={styles.noAttendanceText}>
                  You haven't checked in today
                </Text>
                <TouchableOpacity
                  style={styles.checkInButton}
                  onPress={() => navigation.navigate('Attendance')}
                >
                  <LinearGradient
                    colors={colors.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.checkInGradient}
                  >
                    <Text style={styles.checkInButtonText}>Check In Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {todayAttendance?.isLate && (
              <View style={styles.lateWarningBanner}>
                <Text style={styles.lateWarningIcon}>⏰</Text>
                <Text style={styles.lateWarningText}>Late Arrival</Text>
              </View>
            )}
          </LinearGradient>

          {/* Statistics Grid */}
          {stats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Monthly Overview</Text>
              
              <View style={styles.statsGrid}>
                <LinearGradient
                  colors={['#5B7FFF', '#7B9AFF']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{stats.presentDays}</Text>
                  <Text style={styles.statLabel}>Days Present</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{stats.attendancePercentage}%</Text>
                  <Text style={styles.statLabel}>Attendance Rate</Text>
                </LinearGradient>
              </View>

              <View style={styles.statsGrid}>
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{stats.totalWorkHours}h</Text>
                  <Text style={styles.statLabel}>Total Hours</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#8B5CF6', '#A78BFA']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{stats.averageWorkHours}h</Text>
                  <Text style={styles.statLabel}>Avg/Day</Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Attendance')}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={['#8B5CF6', '#A78BFA']}
                    style={styles.actionIconGradient}
                  >
                    <Text style={styles.actionCardIcon}>📅</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.actionCardText}>Attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('DailyReport')}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={['#FF6B9D', '#FFC107']}
                    style={styles.actionIconGradient}
                  >
                    <Text style={styles.actionCardIcon}>📝</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.actionCardText}>Daily Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('ReportHistory')}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    style={styles.actionIconGradient}
                  >
                    <Text style={styles.actionCardIcon}>📋</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.actionCardText}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('EmployeeTasks')}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={['#06B6D4', '#3B82F6']}
                    style={styles.actionIconGradient}
                  >
                    <Text style={styles.actionCardIcon}>✅</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.actionCardText}>My Tasks</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutGradient}
            >
             
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  attendanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...colors.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeInactive: {
    backgroundColor: colors.danger + '20',
  },
  statusDot: {
    fontSize: 12,
    color: colors.success,
    marginRight: 6,
  },
  statusDotInactive: {
    color: colors.danger,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.danger,
  },
  attendanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  noAttendance: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noAttendanceIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noAttendanceText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  checkInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.primary,
  },
  checkInGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  lateWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  lateWarningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  lateWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...colors.shadows.medium,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...colors.shadows.small,
  },
  actionIconContainer: {
    marginBottom: 12,
  },
  actionIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardIcon: {
    fontSize: 28,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.medium,
    marginBottom: 16,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  logoutIcon: {
    fontSize: 24,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});