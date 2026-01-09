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
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import taskService from '../services/taskService';
import colors from '../constants/colors';
import BirthdayBanner from '../components/BirthdayBanner';


export default function ManagerDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate task stats locally from the tasks array
  const taskStats = useMemo(() => {
    const stats = {
      pending: tasks.filter(t => t.status?.toLowerCase() === 'pending').length,
      'in-progress': tasks.filter(t => t.status?.toLowerCase() === 'in-progress').length,
      review: tasks.filter(t => t.status?.toLowerCase() === 'review').length,
      completed: tasks.filter(t => t.status?.toLowerCase() === 'completed').length,
    };
    stats.total = stats.pending + stats['in-progress'] + stats.review + stats.completed;
    return stats;
  }, [tasks]);

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
      setLoading(true);
      const [employeesResult, statsResult, tasksResult] = await Promise.all([
        userService.getAllEmployees(),
        userService.getTeamStats(),
        taskService.getTasks(),
      ]);

      if (employeesResult.success) {
        setEmployees(employeesResult.data);
      }

      if (statsResult.success) {
        setTeamStats(statsResult.data);
      }

      if (tasksResult.success) {
        setTasks(tasksResult.data?.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        {/* Header with Gradient - Same as Employee Dashboard */}
        <LinearGradient
          colors={colors.gradients.secondary}
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
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Manager</Text>
              </View>
            </View>
          </View>
        </LinearGradient>


        <BirthdayBanner />

        {/* Content */}
        <View style={styles.content}>
          {/* Team Statistics */}
          {teamStats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Team Performance</Text>
              
              {/* Top Row Stats */}
              <View style={styles.statsGrid}>
                <LinearGradient
                  colors={['#5B7FFF', '#7B9AFF']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{teamStats.totalEmployees}</Text>
                  <Text style={styles.statLabel}>Total Team</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{teamStats.todayAttendance}</Text>
                  <Text style={styles.statLabel}>Present Today</Text>
                </LinearGradient>
              </View>

              {/* Second Row Stats */}
              <View style={styles.statsGrid}>
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{teamStats.lateToday}</Text>
                  <Text style={styles.statLabel}>Late Today</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#8B5CF6', '#A78BFA']}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{teamStats.attendanceRate}%</Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Task Management Card */}
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            style={styles.taskManagementCard}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Task Management</Text>
                <Text style={styles.cardSubtitle}>
                  {taskStats.total} total tasks
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('ManagerTasks')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Text style={styles.viewAllIcon}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Task Stats Grid */}
            <View style={styles.taskStatsContainer}>
              <View style={styles.taskStatItem}>
                <View style={[styles.taskStatDot, { backgroundColor: colors.warning }]} />
                <View style={styles.taskStatInfo}>
                  <Text style={styles.taskStatValue}>{taskStats.pending}</Text>
                  <Text style={styles.taskStatLabel}>Pending</Text>
                </View>
              </View>

              <View style={styles.taskStatItem}>
                <View style={[styles.taskStatDot, { backgroundColor: colors.info }]} />
                <View style={styles.taskStatInfo}>
                  <Text style={styles.taskStatValue}>{taskStats['in-progress']}</Text>
                  <Text style={styles.taskStatLabel}>In Progress</Text>
                </View>
              </View>

              <View style={styles.taskStatItem}>
                <View style={[styles.taskStatDot, { backgroundColor: colors.primary }]} />
                <View style={styles.taskStatInfo}>
                  <Text style={styles.taskStatValue}>{taskStats.review}</Text>
                  <Text style={styles.taskStatLabel}>Review</Text>
                </View>
              </View>

              <View style={styles.taskStatItem}>
                <View style={[styles.taskStatDot, { backgroundColor: colors.success }]} />
                <View style={styles.taskStatInfo}>
                  <Text style={styles.taskStatValue}>{taskStats.completed}</Text>
                  <Text style={styles.taskStatLabel}>Completed</Text>
                </View>
              </View>
            </View>

            {/* Create Task Button */}
            <TouchableOpacity
              style={styles.createTaskButton}
              onPress={() => navigation.navigate('CreateTask')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createTaskGradient}
              >
                <Text style={styles.createTaskIcon}>+</Text>
                <Text style={styles.createTaskText}>Create New Task</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('AttendanceOverview')}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={['#8B5CF6', '#A78BFA']}
                    style={styles.actionIconGradient}
                  >
                    <Text style={styles.actionCardIcon}>📊</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.actionCardTitle}>Attendance</Text>
                <Text style={styles.actionCardSubtitle}>Overview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('AllReports')}
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
                <Text style={styles.actionCardTitle}>Reports</Text>
                <Text style={styles.actionCardSubtitle}>Review All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('TeamMembers', { employees })}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    style={styles.actionIconGradient}
                  >
                    <Text style={styles.actionCardIcon}>👥</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.actionCardTitle}>Team</Text>
                <Text style={styles.actionCardSubtitle}>{employees.length} Members</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Attendance')}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={['#06B6D4', '#3B82F6']}
                    style={styles.actionIconGradient}
                  >
                    <Text style={styles.actionCardIcon}>⏰</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.actionCardTitle}>My Time</Text>
                <Text style={styles.actionCardSubtitle}>Check-in</Text>
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
              colors={colors.gradients.danger}
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
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
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
  taskManagementCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...colors.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  viewAllIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  taskStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  taskStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48.5%',
    backgroundColor: colors.backgroundDark,
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  taskStatInfo: {
    flex: 1,
  },
  taskStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  taskStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  createTaskButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.primary,
  },
  createTaskGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  createTaskIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  createTaskText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
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
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});