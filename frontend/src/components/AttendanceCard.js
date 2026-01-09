import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate, formatTime, calculateDuration } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function AttendanceCard({ attendance }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return colors.success;
      case 'late':
        return colors.warning;
      case 'half-day':
        return colors.info;
      case 'absent':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(attendance.date)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(attendance.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(attendance.status) },
            ]}
          >
            {getStatusText(attendance.status)}
          </Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Check In</Text>
          <Text style={styles.timeValue}>
            {formatTime(attendance.checkInTime)}
          </Text>
        </View>

        {attendance.checkOutTime && (
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Check Out</Text>
            <Text style={styles.timeValue}>
              {formatTime(attendance.checkOutTime)}
            </Text>
          </View>
        )}
      </View>

      {attendance.checkOutTime && (
        <View style={styles.footer}>
          <Text style={styles.workHours}>
            Work Hours: {attendance.workHours}h
          </Text>
          <Text style={styles.duration}>
            {calculateDuration(attendance.checkInTime, attendance.checkOutTime)}
          </Text>
        </View>
      )}

      {attendance.isLate && (
        <Text style={styles.lateWarning}>⏰ Late Arrival</Text>
      )}
    </View>
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
  },
  timeItem: {
    flex: 1,
    marginRight: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  workHours: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  lateWarning: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 8,
    fontWeight: '500',
  },
});