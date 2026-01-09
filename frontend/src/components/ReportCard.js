import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDate } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function ReportCard({ report, onPress }) {
  const getProductivityColor = (productivity) => {
    switch (productivity) {
      case 'excellent':
        return colors.success;
      case 'high':
        return colors.info;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getProductivityText = (productivity) => {
    return productivity.charAt(0).toUpperCase() + productivity.slice(1);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(report.date)}</Text>
        <View
          style={[
            styles.productivityBadge,
            { backgroundColor: getProductivityColor(report.productivity) + '20' },
          ]}
        >
          <Text
            style={[
              styles.productivityText,
              { color: getProductivityColor(report.productivity) },
            ]}
          >
            {getProductivityText(report.productivity)}
          </Text>
        </View>
      </View>

      <Text style={styles.workDone} numberOfLines={3}>
        {report.workDone}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.hoursText}>⏱️ {report.hoursWorked}h</Text>
        {report.needsManagerReview && (
          <Text style={styles.reviewBadge}>📋 Needs Review</Text>
        )}
        {report.reviewedAt && (
          <Text style={styles.reviewedBadge}>✓ Reviewed</Text>
        )}
      </View>

      {report.managerComments && (
        <View style={styles.commentBox}>
          <Text style={styles.commentLabel}>Manager's Comment:</Text>
          <Text style={styles.commentText} numberOfLines={2}>
            {report.managerComments}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  productivityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productivityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workDone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hoursText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  reviewBadge: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  reviewedBadge: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  commentBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  commentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
  },
});