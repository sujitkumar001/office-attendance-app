import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import userService from '../services/userService';
import attendanceService from '../services/attendanceService';
import colors from '../constants/colors';

export default function EmployeeDetails({ navigation, route }) {
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parseWorkHours = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const hourMatch = value.match(/(\d+\.?\d*)/);
      return hourMatch ? parseFloat(hourMatch[1]) : 0;
    }
    return 0;
  };

  const attendanceStats = useMemo(() => {
    const records = attendanceRecords || [];

    if (records.length === 0) {
      return {
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        attendanceRate: 0,
        totalHours: 0,
        avgHours: 0,
      };
    }

    const presentRecords = records.filter(r => r.checkInTime);
    const lateRecords = presentRecords.filter(r => r.isLate === true);

    const totalWorkHours = presentRecords.reduce(
      (sum, r) => sum + parseWorkHours(r.workHours),
      0
    );

    const presentDays = presentRecords.length;
    const lateDays = lateRecords.length;
    const PERIOD_DAYS = records.length;
    const absentDays = Math.max(0, PERIOD_DAYS - presentDays);
    const attendanceRate = PERIOD_DAYS > 0 ? Math.round((presentDays / PERIOD_DAYS) * 100) : 0;
    const avgHours = presentDays > 0 ? parseFloat((totalWorkHours / presentDays).toFixed(1)) : 0;

    return {
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
      totalHours: parseFloat(totalWorkHours.toFixed(1)),
      avgHours,
    };
  }, [attendanceRecords]);

  const recentAttendance = useMemo(() => {
    return [...attendanceRecords]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [attendanceRecords]);

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      const employeeResult = await userService.getEmployeeDetails(employeeId);
      if (employeeResult.success) {
        setEmployee(employeeResult.data.employee);
      }

      const attendanceResult = await attendanceService.getEmployeeAttendance(employeeId, 1, 30);
      
      if (attendanceResult.success) {
        setAttendanceRecords(attendanceResult.data.attendances || []);
      } else {
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      Alert.alert('Error', 'Failed to load employee details');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEmployeeData();
    setRefreshing(false);
  }, [employeeId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return colors.success;
      case 'late': return colors.warning;
      case 'absent': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return '✓';
      case 'late': return '⏰';
      case 'absent': return '✕';
      default: return '?';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading employee details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Employee not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const employeeName = employee.name || '';
  const employeeEmail = employee.email || '';
  const employeeRole = employee.role || '';
  const employeeId_display = employee.employeeId || '';
  const employeeDepartment = employee.department || '';
  const employeePosition = employee.position || '';
  const recordsCount = attendanceRecords?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Employee Details</Text>
            <Text style={styles.headerSubtitle}>{employeeName}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarTextSmall}>
                {employeeName.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#FFFFFF', '#F8F9FF']} style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {employeeName.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            
            <View style={styles.infoDetails}>
              <Text style={styles.employeeName}>{employeeName}</Text>
              <Text style={styles.employeeEmail}>{employeeEmail}</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{employeeRole}</Text>
                </View>
                {employeeId_display ? (
                  <View style={[styles.badge, styles.badgeSecondary]}>
                    <Text style={styles.badgeTextSecondary}>ID: {employeeId_display}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {employeeDepartment ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{employeeDepartment}</Text>
            </View>
          ) : null}

          {employeePosition ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position</Text>
              <Text style={styles.infoValue}>{employeePosition}</Text>
            </View>
          ) : null}

          {employee.createdAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joined Date</Text>
              <Text style={styles.infoValue}>{formatDate(employee.createdAt)}</Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Last {recordsCount} Days Performance</Text>
          
          <View style={styles.statsGrid}>
            <LinearGradient colors={['#10B981', '#34D399']} style={styles.statCard}>
              <Text style={styles.statValue}>{attendanceStats.presentDays}</Text>
              <Text style={styles.statLabel}>Days Present</Text>
            </LinearGradient>

            <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.statCard}>
              <Text style={styles.statValue}>{attendanceStats.attendanceRate}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </LinearGradient>
          </View>

          <View style={styles.statsGrid}>
            <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.statCard}>
              <Text style={styles.statValue}>{attendanceStats.totalHours}h</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </LinearGradient>

            <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.statCard}>
              <Text style={styles.statValue}>{attendanceStats.lateDays}</Text>
              <Text style={styles.statLabel}>Late Days</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.attendanceSection}>
          <Text style={styles.sectionTitle}>Recent Attendance (Last 10 Days)</Text>
          
          {recentAttendance.length > 0 ? (
            recentAttendance.map((record, index) => {
              const status = typeof record?.status === 'string' 
                ? record.status 
                : record?.checkInTime ? 'present' : 'absent';
              
              const displayDate = record?.date ? formatDate(record.date) : 'N/A';
              const displayDay = record?.date 
                ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })
                : '—';
              const displayCheckIn = formatTime(record.checkInTime);
              const displayCheckOut = formatTime(record.checkOutTime);
              const displayHours = parseWorkHours(record.workHours).toFixed(1);
              
              return (
                <View key={record._id || index} style={styles.attendanceCard}>
                  <View style={styles.attendanceHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.attendanceDate}>{displayDate}</Text>
                      <Text style={styles.attendanceDay}>{displayDay}</Text>
                    </View>
                    
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(status) + '20' }
                    ]}>
                      <Text style={[styles.statusIcon, { color: getStatusColor(status) }]}>
                        {getStatusIcon(status)}
                      </Text>
                      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                        {status}
                      </Text>
                    </View>
                  </View>

                  {record.checkInTime ? (
                    <View style={styles.attendanceDetails}>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>Check In</Text>
                        <Text style={styles.timeValue}>{displayCheckIn}</Text>
                      </View>
                      
                      {record.checkOutTime ? (
                        <View style={styles.timeBlock}>
                          <Text style={styles.timeLabel}>Check Out</Text>
                          <Text style={styles.timeValue}>{displayCheckOut}</Text>
                        </View>
                      ) : null}

                      {record.workHours ? (
                        <View style={styles.timeBlock}>
                          <Text style={styles.timeLabel}>Hours</Text>
                          <Text style={styles.timeValue}>{displayHours}h</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {record.isLate ? (
                    <View style={styles.lateIndicator}>
                      <Text style={styles.lateText}>⏰ Late Arrival</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateText}>No attendance records found</Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ==================== Container Styles ====================
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // ==================== Loading & Error States ====================
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ==================== Header Styles ====================
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },

  // ==================== Avatar Styles ====================
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarTextSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ==================== Info Card Styles ====================
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  badgeSecondary: {
    backgroundColor: colors.textSecondary + '20',
  },
  badgeTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  // ==================== Stats Section Styles ====================
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // ==================== Attendance Section Styles ====================
  attendanceSection: {
    marginBottom: 24,
  },
  attendanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  attendanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  attendanceDay: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  attendanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  lateIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lateText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '600',
  },

  // ==================== Empty State Styles ====================
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});