import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatTime } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function EmployeeCard({ employee, onPress }) {
  const getStatusColor = (status) => {
    if (status.hasAttendance && status.checkOutTime) return colors.success;
    if (status.hasAttendance) return colors.info;
    return colors.textSecondary;
  };

  const getStatusText = (status) => {
    if (!status.hasAttendance) return 'Absent';
    if (status.checkOutTime) return 'Completed';
    return 'Present';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>{employee.profileInitial}</Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.name}>{employee.name}</Text>
            <Text style={styles.email}>{employee.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(employee.todayStatus) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(employee.todayStatus) },
              ]}
            >
              {getStatusText(employee.todayStatus)}
            </Text>
          </View>

          {employee.todayStatus.isLate && (
            <View style={styles.lateBadge}>
              <Text style={styles.lateText}>Late</Text>
            </View>
          )}

          {employee.todayStatus.hasReport && (
            <View style={styles.reportBadge}>
              <Text style={styles.reportText}>✓ Report</Text>
            </View>
          )}
        </View>

        {employee.todayStatus.hasAttendance && (
          <View style={styles.timeSection}>
            <Text style={styles.timeText}>
              In: {formatTime(employee.todayStatus.checkInTime)}
            </Text>
            {employee.todayStatus.checkOutTime && (
              <Text style={styles.timeText}>
                Out: {formatTime(employee.todayStatus.checkOutTime)}
              </Text>
            )}
          </View>
        )}
      </View>
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
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusSection: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.warning + '20',
    marginRight: 8,
  },
  lateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  reportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.success + '20',
  },
  reportText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  timeSection: {
    flexDirection: 'row',
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 16,
  },
});