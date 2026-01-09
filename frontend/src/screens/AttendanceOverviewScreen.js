import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import userService from '../services/userService';
import { formatDate, formatTime } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function AttendanceOverviewScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, [selectedDate]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const result = await userService.getAttendanceOverview(dateString);
      
      if (result.success) {
        setOverview(result.data);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
      Alert.alert('Error', 'Failed to load attendance overview');
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return ['#10B981', '#34D399'];
      case 'present':
        return ['#3B82F6', '#2563EB'];
      case 'absent':
        return ['#EF4444', '#DC2626'];
      default:
        return ['#6B7280', '#9CA3AF'];
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'present':
        return '🟢';
      case 'absent':
        return '⭕';
      default:
        return '❓';
    }
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
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
      {/* Header with Gradient */}
      <LinearGradient
        colors={colors.gradients.secondary}
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector */}
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FF']}
          style={styles.dateSelector}
        >
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => changeDate(-1)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.dateButtonGradient}
            >
              <Text style={styles.dateButtonText}>←</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            {!isToday() && (
              <TouchableOpacity
                style={styles.todayButtonContainer}
                onPress={() => setSelectedDate(new Date())}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  style={styles.todayButton}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => changeDate(1)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.dateButtonGradient}
            >
              <Text style={styles.dateButtonText}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Summary Statistics */}
        {overview && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Daily Summary</Text>
            
            <View style={styles.summaryGrid}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.summaryCard}
              >
                
                <Text style={styles.summaryValue}>{overview.summary.present}</Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.summaryCard}
              >
                
                <Text style={styles.summaryValue}>{overview.summary.absent}</Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </LinearGradient>
            </View>

            <View style={styles.summaryGrid}>
              <LinearGradient
                colors={['#F59E0B', '#FBBF24']}
                style={styles.summaryCard}
              >
                
                <Text style={styles.summaryValue}>{overview.summary.late}</Text>
                <Text style={styles.summaryLabel}>Late</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                style={styles.summaryCard}
              >
                
                {/* <Text style={styles.summaryValue}>
                  {Math.round((overview.summary.present / overview.summary.total) * 100)}%
                </Text> */}
                <Text style={styles.summaryValue}>
                    {overview.summary.total > 0
                      ? `${Math.round(
                          (overview.summary.present / overview.summary.total) * 100
                        )}%`
                      : '0%'}
                  </Text>

                <Text style={styles.summaryLabel}>Attendance Rate</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Employee List */}
        {overview && (
          <View style={styles.employeeSection}>
            <View style={styles.employeeHeader}>
              <Text style={styles.sectionTitle}>Team Members</Text>
              <View style={styles.employeeCountBadge}>
                <Text style={styles.employeeCountText}>
                  {overview.overview.length}
                </Text>
              </View>
            </View>

            {overview.overview.length > 0 ? (
              overview.overview.map((item, index) => (
                <View key={item.employee._id} style={styles.employeeCard}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8F9FF']}
                    style={styles.employeeCardGradient}
                  >
                    <View style={styles.employeeTop}>
                      <View style={styles.employeeInfo}>
                        <LinearGradient
                          colors={colors.gradients.primary}
                          style={styles.profileCircle}
                        >
                          {/* <Text style={styles.profileInitial}>
                            {item.employee.profileInitial}
                          </Text> */}


                          <Text style={styles.profileInitial}>
                              {item.employee.profileInitial ||
                                item.employee.name?.charAt(0) ||
                                '?'}
                            </Text>

                        </LinearGradient>
                        <View style={styles.employeeDetails}>
                          <Text style={styles.employeeName}>{item.employee.name}</Text>
                          <Text style={styles.employeeEmail}>{item.employee.email}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.statusBadgeContainer}>
                        <LinearGradient
                          colors={getStatusColor(item.status)}
                          style={styles.statusBadge}
                        >
                          <Text style={styles.statusEmoji}>{getStatusEmoji(item.status)}</Text>
                          <Text style={styles.statusText}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>

                    {item.attendance && (
                      <View style={styles.attendanceDetails}>
                        <View style={styles.timeGrid}>
                          <View style={styles.timeItem}>
                            <View style={styles.timeIconContainer}>
                              <LinearGradient
                                colors={['#10B981', '#34D399']}
                                style={styles.timeIcon}
                              >
                                
                              </LinearGradient>
                            </View>
                            <View style={styles.timeContent}>
                              <Text style={styles.timeLabel}>Check In</Text>
                              {/* <Text style={styles.timeValue}>
                                {formatTime(item.attendance.checkInTime)}
                              </Text> */}

                              <Text style={styles.timeValue}>
                                  {item.attendance.checkInTime
                                    ? formatTime(item.attendance.checkInTime)
                                    : '--'}
                                </Text>


                            </View>
                          </View>
                          
                          {item.attendance.checkOutTime && (
                            <View style={styles.timeItem}>
                              <View style={styles.timeIconContainer}>
                                <LinearGradient
                                  colors={['#EF4444', '#DC2626']}
                                  style={styles.timeIcon}
                                >
                                  
                                </LinearGradient>
                              </View>
                              <View style={styles.timeContent}>
                                <Text style={styles.timeLabel}>Check Out</Text>
                                {/* <Text style={styles.timeValue}>
                                  {formatTime(item.attendance.checkOutTime)}
                                </Text> */}
                                <Text style={styles.timeValue}>
                                    {item.attendance.checkOutTime
                                      ? formatTime(item.attendance.checkOutTime)
                                      : '--'}
                                  </Text>


                              </View>
                            </View>
                          )}
                        </View>
                        
                        {/* {item.attendance.workHours && (
                          <View style={styles.workHoursContainer}>
                            
                            <Text style={styles.workHoursText}>
                              Total: {item.attendance.workHours.toFixed(1)} hours
                            </Text>
                          </View>
                        )} */}

                        {typeof item.attendance.workHours === 'number' && (
                                            <View style={styles.workHoursContainer}>
                                              <Text style={styles.workHoursText}>
                                                Total: {item.attendance.workHours.toFixed(1)} hours
                                              </Text>
                                            </View>
                                          )}

                        
                        {item.attendance.isLate && (
                          <View style={styles.lateWarning}>
                            <LinearGradient
                              colors={['#FEF3C7', '#FDE68A']}
                              style={styles.lateWarningGradient}
                            >
                              
                              <Text style={styles.lateWarningText}>Late Arrival</Text>
                            </LinearGradient>
                          </View>
                        )}
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.emptyGradient}
                >
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyText}>No employee records</Text>
                  <Text style={styles.emptySubtext}>
                    There are no employees to display for this date
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
        )}
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
  scrollContent: {
    padding: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    ...colors.shadows.medium,
  },
  dateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dateButtonGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  todayButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  todayButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...colors.shadows.medium,
  },
  summaryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  employeeSection: {
    marginBottom: 20,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  employeeCountBadge: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  employeeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.medium,
  },
  employeeCardGradient: {
    padding: 16,
  },
  employeeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...colors.shadows.small,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadgeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attendanceDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeIconContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  timeIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIconText: {
    fontSize: 18,
  },
  timeContent: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  workHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    gap: 8,
  },
  workHoursIcon: {
    fontSize: 16,
  },
  workHoursText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  lateWarning: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  lateWarningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  lateWarningIcon: {
    fontSize: 16,
  },
  lateWarningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },
});