import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import taskService from '../services/taskService';
import TaskCard from '../components/TaskCard';
import colors from '../constants/colors';

export default function ManagerTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // Calculate stats locally from the tasks array instead of API call
  const stats = useMemo(() => {
    return {
      pending: tasks.filter(t => t.status?.toLowerCase() === 'pending').length,
      'in-progress': tasks.filter(t => t.status?.toLowerCase() === 'in-progress').length,
      review: tasks.filter(t => t.status?.toLowerCase() === 'review').length,
      completed: tasks.filter(t => t.status?.toLowerCase() === 'completed').length,
    };
  }, [tasks]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [activeFilter, tasks]);

  const fetchData = async () => {
    setLoading(true);
    await fetchTasks();
    setLoading(false);
  };

  const fetchTasks = async () => {
    const result = await taskService.getTasks();
    if (result.success) {
      setTasks(result.data.tasks);
    }
  };

  const filterTasks = () => {
    if (activeFilter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(
        tasks.filter((task) => task.status?.toLowerCase() === activeFilter.toLowerCase())
      );
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const getFilterEmoji = (key) => {
    switch (key) {
      case 'all': return '';
      case 'pending': return '';
      case 'in-progress': return '';
      case 'review': return '';
      case 'completed': return '';
      default: return '';
    }
  };

  const getFilterGradient = (key) => {
    switch (key) {
      case 'pending': return ['#F59E0B', '#FBBF24'];
      case 'in-progress': return ['#3B82F6', '#2563EB'];
      case 'review': return ['#8B5CF6', '#A78BFA'];
      case 'completed': return ['#10B981', '#34D399'];
      default: return colors.gradients.primary;
    }
  };

  const filters = [
    { key: 'all', label: 'All Tasks', count: tasks.length },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'in-progress', label: 'In Progress', count: stats['in-progress'] },
    { key: 'review', label: 'Review', count: stats.review },
    { key: 'completed', label: 'Completed', count: stats.completed },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient - Updated to Primary and SafeArea consistent padding */}
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
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Assigned Tasks</Text>
              <Text style={styles.headerSubtitle}>
                {filteredTasks.length} {activeFilter === 'all' ? 'total' : activeFilter} tasks
              </Text>
            </View>
            <View style={{ width: 60 }} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Create Task Button */}
          <TouchableOpacity
            style={styles.createTaskButtonContainer}
            onPress={() => navigation.navigate('CreateTask')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createTaskButton}
            >
              <Text style={styles.createTaskIcon}>+</Text>
              <Text style={styles.createTaskText}>Create New Task</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsContent}
            >
              <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </LinearGradient>

              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats['in-progress']}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </LinearGradient>

              <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats.review}</Text>
                <Text style={styles.statLabel}>Review</Text>
              </LinearGradient>

              <LinearGradient colors={['#10B981', '#34D399']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </LinearGradient>
            </ScrollView>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filter by Status</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={styles.filterTabContainer}
                  onPress={() => setActiveFilter(filter.key)}
                  activeOpacity={0.7}
                >
                  {activeFilter === filter.key ? (
                    <LinearGradient
                      colors={getFilterGradient(filter.key)}
                      style={styles.filterTab}
                    >
                      <Text style={styles.filterEmoji}>{getFilterEmoji(filter.key)}</Text>
                      <Text style={styles.filterTextActive}>{filter.label}</Text>
                      <View style={styles.filterBadgeActive}>
                        <Text style={styles.filterBadgeTextActive}>{filter.count}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterTabInactive}>
                      <Text style={styles.filterEmoji}>{getFilterEmoji(filter.key)}</Text>
                      <Text style={styles.filterText}>{filter.label}</Text>
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>{filter.count}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Task List */}
          <View style={styles.taskListSection}>
            {filteredTasks.length > 0 ? (
              <>
                <Text style={styles.listTitle}>
                  {activeFilter === 'all' ? 'All Tasks' : `${activeFilter.replace('-', ' ')} Tasks`}
                </Text>
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: task._id })}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.emptyGradient}>
                  <Text style={styles.emptyEmoji}>
                    {activeFilter === 'completed' ? '🎉' : activeFilter === 'all' ? '📋' : '📭'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {activeFilter === 'all' ? 'No tasks yet' : activeFilter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {activeFilter === 'all' ? 'Create your first task to get started' : `No ${activeFilter.replace('-', ' ')} tasks at the moment`}
                  </Text>
                  {activeFilter === 'all' && (
                    <TouchableOpacity
                      style={styles.emptyButtonContainer}
                      onPress={() => navigation.navigate('CreateTask')}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={colors.gradients.primary} style={styles.emptyButton}>
                        <Text style={styles.emptyButtonText}>Create Task</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
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
  scrollContainer: {
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  createTaskButtonContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.large,
  },
  createTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  createTaskIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  createTaskText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsContent: {
    gap: 12,
  },
  statCard: {
    width: 120,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...colors.shadows.medium,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterContent: {
    gap: 12,
  },
  filterTabContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    ...colors.shadows.small,
  },
  filterTabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterEmoji: {
    fontSize: 18,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  filterBadgeTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskListSection: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    marginTop: 40,
    borderRadius: 20,
    overflow: 'hidden',
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
    marginBottom: 20,
  },
  emptyButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.primary,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});