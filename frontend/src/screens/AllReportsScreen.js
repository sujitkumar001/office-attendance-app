import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import reportService from '../services/reportService';
import { formatDate } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function AllReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const result = await reportService.getAllEmployeeReports();
      
      if (result.success) {
        setReports(result.data.reports || []);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }

    if (reviewComment.trim().length < 10) {
      Alert.alert('Error', 'Review comment must be at least 10 characters');
      return;
    }

    try {
      setSubmittingReview(true);
      const result = await reportService.addManagerReview(
        selectedReport._id,
        reviewComment.trim()
      );

      if (result.success) {
        Alert.alert('Success ✓', 'Review added successfully', [
          {
            text: 'OK',
            onPress: () => {
              setSelectedReport(null);
              setReviewComment('');
              fetchReports();
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getFilteredReports = () => {
    switch (filter) {
      case 'pending':
        return reports.filter((r) => r.needsManagerReview && !r.reviewedAt);
      case 'reviewed':
        return reports.filter((r) => r.reviewedAt);
      default:
        return reports;
    }
  };

  const getProductivityColor = (level) => {
    switch (level) {
      case 'excellent': return ['#10B981', '#34D399'];
      case 'high': return ['#3B82F6', '#2563EB'];
      case 'medium': return ['#F59E0B', '#FBBF24'];
      case 'low': return ['#EF4444', '#DC2626'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };

  const getProductivityEmoji = (level) => {
    switch (level) {
      case 'excellent': return '⭐';
      case 'high': return '🚀';
      case 'medium': return '😊';
      case 'low': return '😴';
      default: return '📊';
    }
  };

  const renderReportCard = (report) => (
    <TouchableOpacity
      key={report._id}
      style={styles.reportCardContainer}
      onPress={() => setSelectedReport(report)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FF']}
        style={styles.reportCard}
      >
        <View style={styles.reportHeader}>
          <View style={styles.employeeInfo}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.profileCircle}
            >
              <Text style={styles.profileInitial}>
                {report.user?.profileInitial || report.user?.name?.charAt(0) || '?'}
              </Text>
            </LinearGradient>
            <View style={styles.employeeDetails}>
              <Text style={styles.employeeName}>
                {report.user?.name || 'Unknown'}
              </Text>
              <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
            </View>
          </View>

          <View style={styles.badges}>
            {report.needsManagerReview && !report.reviewedAt && (
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.needsReviewBadge}
              >
                <Text style={styles.needsReviewIcon}>⚠️</Text>
                <Text style={styles.needsReviewText}>Review</Text>
              </LinearGradient>
            )}
            {report.reviewedAt && (
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.reviewedBadge}
              >
                <Text style={styles.reviewedText}>✓ Reviewed</Text>
              </LinearGradient>
            )}
          </View>
        </View>

        <View style={styles.reportContent}>
          <Text style={styles.workDoneLabel}>Work Summary:</Text>
          <Text style={styles.workDoneText} numberOfLines={2}>
            {report.workDone}
          </Text>

          <View style={styles.reportMeta}>
            <View style={styles.metaItemContainer}>
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.metaIcon}
              >
                <Text style={styles.metaEmoji}>⏱️</Text>
              </LinearGradient>
              <View>
                <Text style={styles.metaLabel}>Hours</Text>
                <Text style={styles.metaValue}>{report.hoursWorked}h</Text>
              </View>
            </View>

            <View style={styles.metaItemContainer}>
              <LinearGradient
                colors={getProductivityColor(report.productivity)}
                style={styles.metaIcon}
              >
                <Text style={styles.metaEmoji}>
                  {getProductivityEmoji(report.productivity)}
                </Text>
              </LinearGradient>
              <View>
                <Text style={styles.metaLabel}>Productivity</Text>
                <Text style={[styles.metaValue, { textTransform: 'capitalize' }]}>
                  {report.productivity}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderReportDetail = () => (
    <ScrollView 
      contentContainerStyle={styles.detailScrollContent}
      showsVerticalScrollIndicator={false}
    >
        <LinearGradient
          colors={colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.detailHeaderGradient}
        >
          <View style={styles.detailHeader}>
            <TouchableOpacity 
              onPress={() => setSelectedReport(null)}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>Report Details</Text>
            <View style={{ width: 60 }} />
          </View>
        </LinearGradient>

        <View style={styles.detailContent}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            style={styles.employeeInfoCard}
          >
            <LinearGradient
              colors={colors.gradients.secondary}
              style={styles.profileCircleLarge}
            >
              <Text style={styles.profileInitialLarge}>
                {selectedReport.user?.profileInitial || selectedReport.user?.name?.charAt(0) || '?'}
              </Text>
            </LinearGradient>
            <Text style={styles.employeeNameLarge}>
              {selectedReport.user?.name || 'Unknown'}
            </Text>
            <Text style={styles.employeeEmail}>
              {selectedReport.user?.email || 'No email'}
            </Text>
            <Text style={styles.reportDateLarge}>
              {formatDate(selectedReport.date)}
            </Text>
          </LinearGradient>

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💼</Text>
              <Text style={styles.sectionTitle}>Work Done</Text>
            </View>
            <View style={styles.sectionContentCard}>
              <Text style={styles.sectionContent}>{selectedReport.workDone}</Text>
            </View>
          </View>

          {selectedReport.challenges && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⚠️</Text>
                <Text style={styles.sectionTitle}>Challenges</Text>
              </View>
              <View style={styles.sectionContentCard}>
                <Text style={styles.sectionContent}>{selectedReport.challenges}</Text>
              </View>
            </View>
          )}

          {selectedReport.planForTomorrow && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🎯</Text>
                <Text style={styles.sectionTitle}>Plan for Tomorrow</Text>
              </View>
              <View style={styles.sectionContentCard}>
                <Text style={styles.sectionContent}>
                  {selectedReport.planForTomorrow}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📊</Text>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
            </View>
            <View style={styles.metricsGrid}>
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.metricCard}
              >
                <Text style={styles.metricIcon}>⏱️</Text>
                <Text style={styles.metricValue}>{selectedReport.hoursWorked}h</Text>
                <Text style={styles.metricLabel}>Hours Worked</Text>
              </LinearGradient>

              <LinearGradient
                colors={getProductivityColor(selectedReport.productivity)}
                style={styles.metricCard}
              >
                <Text style={styles.metricIcon}>
                  {getProductivityEmoji(selectedReport.productivity)}
                </Text>
                <Text style={[styles.metricValue, { color: '#FFFFFF' }]}>
                  {selectedReport.productivity}
                </Text>
                <Text style={[styles.metricLabel, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                  Productivity
                </Text>
              </LinearGradient>
            </View>
          </View>

          {selectedReport.reviewedAt ? (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>✅</Text>
                <Text style={styles.sectionTitle}>Manager Review</Text>
              </View>
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.reviewBox}
              >
                <Text style={styles.reviewComment}>
                  "{selectedReport.managerComments}"
                </Text>
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewDate}>
                    Reviewed on {formatDate(selectedReport.reviewedAt)}
                  </Text>
                  {selectedReport.reviewedBy && (
                    <Text style={styles.reviewBy}>
                      By: {selectedReport.reviewedBy.name}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📝</Text>
                <Text style={styles.sectionTitle}>Add Your Review</Text>
              </View>
              <View style={styles.reviewInputCard}>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Enter your review comments (minimum 10 characters)..."
                  placeholderTextColor={colors.textSecondary}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>
                  {reviewComment.length} characters
                </Text>
              </View>
              <TouchableOpacity
                style={styles.submitButtonContainer}
                onPress={handleReviewSubmit}
                disabled={submittingReview || reviewComment.trim().length < 10}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={submittingReview || reviewComment.trim().length < 10
                    ? ['#9CA3AF', '#6B7280']
                    : colors.gradients.primary
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}
                >
                  {submittingReview ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonIcon}>✓</Text>
                      <Text style={styles.submitButtonText}>Submit Review</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedReport) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderReportDetail()}
      </SafeAreaView>
    );
  }

  const filteredReports = getFilteredReports();
  const pendingCount = reports.filter((r) => r.needsManagerReview && !r.reviewedAt).length;
  const reviewedCount = reports.filter((r) => r.reviewedAt).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.headerTitle}>All Reports</Text>
              <Text style={styles.headerSubtitle}>{reports.length} total reports</Text>
            </View>
            <View style={{ width: 60 }} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter Reports</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              <TouchableOpacity
                style={styles.filterTabContainer}
                onPress={() => setFilter('all')}
                activeOpacity={0.7}
              >
                {filter === 'all' ? (
                  <LinearGradient
                    colors={colors.gradients.primary}
                    style={styles.filterTab}
                  >
                    <Text style={styles.filterEmoji}>📋</Text>
                    <Text style={styles.filterTextActive}>All Reports</Text>
                    <View style={styles.filterBadgeActive}>
                      <Text style={styles.filterBadgeTextActive}>{reports.length}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterTabInactive}>
                    <Text style={styles.filterEmoji}>📋</Text>
                    <Text style={styles.filterText}>All Reports</Text>
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{reports.length}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterTabContainer}
                onPress={() => setFilter('pending')}
                activeOpacity={0.7}
              >
                {filter === 'pending' ? (
                  <LinearGradient
                    colors={['#F59E0B', '#FBBF24']}
                    style={styles.filterTab}
                  >
                    <Text style={styles.filterEmoji}>⏳</Text>
                    <Text style={styles.filterTextActive}>Pending</Text>
                    <View style={styles.filterBadgeActive}>
                      <Text style={styles.filterBadgeTextActive}>{pendingCount}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterTabInactive}>
                    <Text style={styles.filterEmoji}>⏳</Text>
                    <Text style={styles.filterText}>Pending</Text>
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{pendingCount}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterTabContainer}
                onPress={() => setFilter('reviewed')}
                activeOpacity={0.7}
              >
                {filter === 'reviewed' ? (
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    style={styles.filterTab}
                  >
                    <Text style={styles.filterEmoji}>✅</Text>
                    <Text style={styles.filterTextActive}>Reviewed</Text>
                    <View style={styles.filterBadgeActive}>
                      <Text style={styles.filterBadgeTextActive}>{reviewedCount}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterTabInactive}>
                    <Text style={styles.filterEmoji}>✅</Text>
                    <Text style={styles.filterText}>Reviewed</Text>
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{reviewedCount}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.reportsContainer}>
            {filteredReports.length > 0 ? (
              filteredReports.map(renderReportCard)
            ) : (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.emptyGradient}
                >
                  <Text style={styles.emptyEmoji}>
                    {filter === 'pending' ? '📭' : filter === 'reviewed' ? '✅' : '📋'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {filter === 'pending' 
                      ? 'No pending reports' 
                      : filter === 'reviewed'
                      ? 'No reviewed reports yet'
                      : 'No reports found'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Check back later for new reports
                  </Text>
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
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
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
  reportsContainer: {
    marginBottom: 20,
  },
  reportCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.medium,
  },
  reportCard: {
    padding: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  reportDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  badges: {
    gap: 6,
  },
  needsReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  needsReviewIcon: {
    fontSize: 14,
  },
  needsReviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  reviewedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reviewedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  reportContent: {
    gap: 12,
  },
  workDoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  workDoneText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  metaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaEmoji: {
    fontSize: 20,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
  },
  // Detail View Styles
  detailScrollContent: {
    flexGrow: 1,
  },
  detailHeaderGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailContent: {
    padding: 20,
  },
  employeeInfoCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    ...colors.shadows.medium,
  },
  profileCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...colors.shadows.medium,
  },
  profileInitialLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  employeeNameLarge: {
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
  reportDateLarge: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionContentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionContent: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...colors.shadows.medium,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reviewBox: {
    borderRadius: 16,
    padding: 20,
    ...colors.shadows.small,
  },
  reviewComment: {
    fontSize: 15,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 16,
  },
  reviewMeta: {
    gap: 4,
  },
  reviewDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reviewBy: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  reviewInputCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  reviewInput: {
    fontSize: 15,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});