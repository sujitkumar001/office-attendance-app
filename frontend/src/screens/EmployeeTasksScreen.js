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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import taskService from '../services/taskService';
import TaskCard from '../components/TaskCard';
import colors from '../constants/colors';

export default function EmployeeTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // Calculate stats locally from the tasks array to fix the "0" display issue
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
      // Accessing data.tasks based on your taskService structure
      const taskList = result.data?.tasks || [];
      setTasks(taskList);
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
    await fetchTasks();
    setRefreshing(false);
  }, []);

  const getFilterGradient = (key) => {
    switch (key) {
      case 'pending': return ['#F59E0B', '#FBBF24'];
      case 'in-progress': return ['#3B82F6', '#2563EB'];
      case 'review': return ['#8B5CF6', '#A78BFA'];
      case 'completed': return ['#10B981', '#34D399'];
      default: return colors.gradients?.primary || ['#4c669f', '#3b5998'];
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
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
        <LinearGradient
          colors={colors.gradients?.primary || ['#4c669f', '#3b5998']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>My Tasks</Text>
              <Text style={styles.headerSubtitle}>
                {tasks.length} total tasks
              </Text>
            </View>
            <View style={{ width: 60 }} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContent}>
              {filters.filter(f => f.key !== 'all').map((stat) => (
                <LinearGradient
                  key={stat.key}
                  colors={getFilterGradient(stat.key)}
                  style={styles.statCard}
                >
                  <Text style={styles.statValue}>{stat.count}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </LinearGradient>
              ))}
            </ScrollView>
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filter by Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={styles.filterTabContainer}
                  onPress={() => setActiveFilter(filter.key)}
                  activeOpacity={0.7}
                >
                  {activeFilter === filter.key ? (
                    <LinearGradient colors={getFilterGradient(filter.key)} style={styles.filterTab}>
                      <Text style={styles.filterTextActive}>{filter.label}</Text>
                      <View style={styles.filterBadgeActive}>
                        <Text style={styles.filterBadgeTextActive}>{filter.count}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterTabInactive}>
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

          {/* List Section */}
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
                  <Text style={styles.emptyEmoji}>{activeFilter === 'completed' ? '🎉' : '📭'}</Text>
                  <Text style={styles.emptyText}>No tasks found</Text>
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
  },
});