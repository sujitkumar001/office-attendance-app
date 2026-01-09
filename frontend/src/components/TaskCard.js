import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDate } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function TaskCard({ task, onPress }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return colors.danger;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.info;
      case 'low':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in-progress':
        return colors.info;
      case 'review':
        return colors.warning;
      case 'pending':
        return colors.textSecondary;
      case 'cancelled':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: getPriorityColor(task.priority) },
            ]}
          />
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {task.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(task.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(task.status) },
              ]}
            >
              {getStatusText(task.status)}
            </Text>
          </View>

          {isOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>⚠️ Overdue</Text>
            </View>
          )}
        </View>

        <Text style={styles.dueDate}>
          Due: {formatDate(task.dueDate)}
        </Text>
      </View>

      {task.attachments && task.attachments.length > 0 && (
        <View style={styles.attachmentInfo}>
          <Text style={styles.attachmentText}>
            📎 {task.attachments.length} attachment(s)
          </Text>
        </View>
      )}

      {task.comments && task.comments.length > 0 && (
        <View style={styles.commentInfo}>
          <Text style={styles.commentText}>
            💬 {task.comments.length} comment(s)
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  overdueBadge: {
    backgroundColor: colors.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  attachmentInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  attachmentText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  commentInfo: {
    marginTop: 4,
  },
  commentText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});