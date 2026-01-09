import React, { useState, useEffect, useCallback } from 'react';
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
import reportService from '../services/reportService';
import ReportCard from '../components/ReportCard';
import colors from '../constants/colors';

export default function ReportHistoryScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const [historyResult, statsResult] = await Promise.all([
        reportService.getReportHistory(1, 20),
        reportService.getReportStats(now.getFullYear(), now.getMonth() + 1),
      ]);

      // console.log('History Result:', historyResult);
      // console.log('Stats Result:', statsResult);

      if (historyResult.success) {
        // Handle different possible response structures
        const reportsData = historyResult.data?.reports || historyResult.data || [];
        setReports(Array.isArray(reportsData) ? reportsData : []);
      }

      if (statsResult.success) {
        // Handle different possible response structures
        const statsData = statsResult.data?.stats || statsResult.data || {};
        setStats({
            totalReports: statsData.totalReports || 0,
            averageHours: statsData.averageHours || statsData.avgHours || 0,
            reviewed: statsData.reviewed || 0,
            pending: statsData.needsReview || 0,
          });

      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleReportPress = (report) => {
    navigation.navigate('DailyReport');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
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
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>My Reports</Text>
              <Text style={styles.headerSubtitle}>
                {reports.length} total reports
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('DailyReport')}
              style={styles.addButton}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>+ New</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Statistics */}
          {stats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>This Month Overview</Text>
              
              <View style={styles.statsRow}>
                <LinearGradient
                  colors={['#8B5CF6', '#A78BFA']}
                  style={styles.statCard}
                >
                  <Text style={styles.statIcon}>📊</Text>
                  <Text style={styles.statValue}>{stats.totalReports}</Text>
                  <Text style={styles.statLabel}>Total Reports</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  style={styles.statCard}
                >
                  <Text style={styles.statIcon}>⏱️</Text>
                  <Text style={styles.statValue}>{stats.averageHours}h</Text>
                  <Text style={styles.statLabel}>Avg Hours</Text>
                </LinearGradient>
              </View>

              <View style={styles.statsRow}>
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.statCard}
                >
                  <Text style={styles.statIcon}>✅</Text>
                  <Text style={styles.statValue}>{stats.reviewed}</Text>
                  <Text style={styles.statLabel}>Reviewed</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.statCard}
                >
                  <Text style={styles.statIcon}>⏳</Text>
                  <Text style={styles.statValue}>{stats.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Reports List */}
          <View style={styles.reportsContainer}>
            <Text style={styles.sectionTitle}>Report History</Text>
            {reports.length > 0 ? (
              reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onPress={() => handleReportPress(report)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.emptyGradient}
                >
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={styles.emptyText}>No reports yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start documenting your daily work
                  </Text>
                  <TouchableOpacity
                    style={styles.createButtonContainer}
                    onPress={() => navigation.navigate('DailyReport')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={colors.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.createButton}
                    >
                      <Text style={styles.createButtonIcon}>📝</Text>
                      <Text style={styles.createButtonText}>
                        Create Your First Report
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>

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
    flex: 1,
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
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.small,
  },
  addButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
  statsRow: {
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
  reportsContainer: {
    marginBottom: 20,
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
    marginBottom: 24,
  },
  createButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 10,
  },
  createButtonIcon: {
    fontSize: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});