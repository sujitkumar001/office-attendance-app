import React, { useState, useEffect, useCallback } from 'react';
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
import attendanceService from '../services/attendanceService';
import AttendanceCard from '../components/AttendanceCard';
import { formatTime } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function AttendanceScreen({ navigation }) {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTodayAttendance(),
        fetchAttendanceHistory(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    const result = await attendanceService.getTodayAttendance();
    if (result.success) {
      setTodayAttendance(result.data);
    }
  };

  const fetchAttendanceHistory = async () => {
    const result = await attendanceService.getAttendanceHistory(1, 10);
    if (result.success) {
      setAttendanceHistory(result.data.attendances);
    }
  };

  const fetchStats = async () => {
    const result = await attendanceService.getAttendanceStats(30);
    if (result.success) {
      setStats(result.data);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const result = await attendanceService.checkIn();
      if (result.success) {
        Alert.alert('Success ✓', result.message);
        await fetchData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    Alert.alert(
      'Check Out',
      'Are you sure you want to check out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          onPress: async () => {
            setCheckingOut(true);
            try {
              const result = await attendanceService.checkOut();
              if (result.success) {
                Alert.alert('Success ✓', result.message);
                await fetchData();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to check-out');
            } finally {
              setCheckingOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading attendance...</Text>
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
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attendance</Text>
            <View style={{ width: 60 }} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Today's Attendance Card */}
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            style={styles.todayCard}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.todayTitle}>Today's Status</Text>
              <Text style={styles.todayDate}>
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            
            {todayAttendance ? (
              <View>
                <View style={styles.timeContainer}>
                  <View style={styles.timeBlock}>
                    <View style={styles.timeIconContainer}>
                      <LinearGradient
                        colors={['#10B981', '#34D399']}
                        style={styles.timeIcon}
                      >
                        <Text style={styles.timeEmoji}>🕐</Text>
                      </LinearGradient>
                    </View>
                    <Text style={styles.timeLabel}>Check In</Text>
                    <Text style={styles.timeValue}>
                      {formatTime(todayAttendance.checkInTime)}
                    </Text>
                  </View>

                  {todayAttendance.checkOutTime ? (
                    <View style={styles.timeBlock}>
                      <View style={styles.timeIconContainer}>
                        <LinearGradient
                          colors={['#EF4444', '#DC2626']}
                          style={styles.timeIcon}
                        >
                          <Text style={styles.timeEmoji}>🕐</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.timeLabel}>Check Out</Text>
                      <Text style={styles.timeValue}>
                        {formatTime(todayAttendance.checkOutTime)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.timeBlock}>
                      <View style={styles.timeIconContainer}>
                        <LinearGradient
                          colors={['#3B82F6', '#2563EB']}
                          style={styles.timeIcon}
                        >
                          <Text style={styles.timeEmoji}>⚡</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.timeLabel}>Status</Text>
                      <Text style={styles.timeValue}>Active</Text>
                    </View>
                  )}
                </View>

                {todayAttendance.checkOutTime ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedIcon}>✓</Text>
                    <Text style={styles.completedText}>
                      Attendance Completed ({todayAttendance.workHours}h)
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.checkOutButtonContainer}
                    onPress={handleCheckOut}
                    disabled={checkingOut}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.checkOutButton}
                    >
                      {checkingOut ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.checkOutButtonText}>Check Out</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {todayAttendance.isLate && (
                  <View style={styles.lateWarning}>
                    <Text style={styles.lateText}>⏰ Late Arrival Recorded</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAttendanceContainer}>
                <View style={styles.noAttendanceIconContainer}>
                  <LinearGradient
                    colors={['#F59E0B', '#FBBF24']}
                    style={styles.noAttendanceIconGradient}
                  >
                    <Text style={styles.noAttendanceIcon}>📅</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.noAttendanceText}>
                  You haven't checked in today
                </Text>
                <TouchableOpacity
                  style={styles.checkInButtonContainer}
                  onPress={handleCheckIn}
                  disabled={checkingIn}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.checkInButton}
                  >
                    {checkingIn ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonIcon}>👋</Text>
                        <Text style={styles.checkInButtonText}>Check In Now</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>

          {/* Statistics */}
          {stats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Last 30 Days Overview</Text>
              
              <View style={styles.statsRow}>
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{String(stats.presentDays)}</Text>
                  <Text style={styles.statLabel}>Days Present</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{String(stats.attendancePercentage)}%</Text>
                  <Text style={styles.statLabel}>Attendance Rate</Text>
                </LinearGradient>
              </View>

              <View style={styles.statsRow}>
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{String(stats.totalWorkHours)}h</Text>
                  <Text style={styles.statLabel}>Total Hours</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#8B5CF6', '#A78BFA']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{String(stats.lateDays)}</Text>
                  <Text style={styles.statLabel}>Late Days</Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Attendance History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Attendance History</Text>
            {attendanceHistory.length > 0 ? (
              attendanceHistory.map((attendance) => (
                <AttendanceCard key={attendance._id} attendance={attendance} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateText}>No attendance records found</Text>
              </View>
            )}
          </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  todayCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  todayDate: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeIconContainer: {
    marginBottom: 12,
  },
  timeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeEmoji: {
    fontSize: 28,
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
  checkOutButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  checkOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: 16,
    padding: 16,
  },
  completedIcon: {
    fontSize: 20,
    color: colors.success,
    marginRight: 10,
  },
  completedText: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '600',
  },
  lateWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  lateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  noAttendanceContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAttendanceIconContainer: {
    marginBottom: 16,
  },
  noAttendanceIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  noAttendanceIcon: {
    fontSize: 40,
  },
  noAttendanceText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  checkInButtonContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5B7FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
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
  historySection: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});