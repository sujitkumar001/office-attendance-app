import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import reportService from '../services/reportService';
import attendanceService from '../services/attendanceService';
import colors from '../constants/colors';

export default function DailyReportScreen({ navigation }) {
  const [formData, setFormData] = useState({
    workDone: '',
    challenges: '',
    planForTomorrow: '',
    hoursWorked: '',
    productivity: 'medium',
    needsManagerReview: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [checkingData, setCheckingData] = useState(true);

  useEffect(() => {
    checkAttendanceAndReport();
  }, []);

  const checkAttendanceAndReport = async () => {
    try {
      setCheckingData(true);
      
      const attendanceResult = await attendanceService.getTodayAttendance();
      if (attendanceResult.success && attendanceResult.data) {
        setHasAttendance(true);
        
        if (attendanceResult.data.workHours) {
          setFormData(prev => ({
            ...prev,
            hoursWorked: attendanceResult.data.workHours.toString(),
          }));
        }
      } else {
        setHasAttendance(false);
      }

      const reportResult = await reportService.getTodayReport();
      if (reportResult.success && reportResult.data) {
        setExistingReport(reportResult.data);
        setFormData({
          workDone: reportResult.data.workDone,
          challenges: reportResult.data.challenges || '',
          planForTomorrow: reportResult.data.planForTomorrow || '',
          hoursWorked: reportResult.data.hoursWorked.toString(),
          productivity: reportResult.data.productivity,
          needsManagerReview: reportResult.data.needsManagerReview,
        });
      }
    } catch (error) {
      console.error('Error checking data:', error);
    } finally {
      setCheckingData(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.workDone.trim()) {
      newErrors.workDone = 'Please describe what you did today';
    } else if (formData.workDone.trim().length < 20) {
      newErrors.workDone = 'Description must be at least 20 characters';
    }

    if (formData.hoursWorked && (isNaN(formData.hoursWorked) || 
        parseFloat(formData.hoursWorked) < 0 || 
        parseFloat(formData.hoursWorked) > 24)) {
      newErrors.hoursWorked = 'Hours must be between 0 and 24';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    if (!hasAttendance) {
      Alert.alert(
        'No Attendance',
        'Please mark your attendance before submitting a report',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Attendance', onPress: () => navigation.navigate('Attendance') },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      const reportData = {
        ...formData,
        hoursWorked: parseFloat(formData.hoursWorked) || 0,
      };

      const result = existingReport
        ? await reportService.updateReport(existingReport._id, reportData)
        : await reportService.createReport(reportData);

      if (result.success) {
        Alert.alert(
          'Success ✓',
          result.message || 'Report submitted successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const ProductivityButton = ({ value, label, emoji }) => (
    <TouchableOpacity
      style={[
        styles.productivityBtn,
        formData.productivity === value && styles.productivityBtnActive,
      ]}
      onPress={() => setFormData({ ...formData, productivity: value })}
      activeOpacity={0.7}
    >
      {formData.productivity === value && (
        <LinearGradient
          colors={colors.gradients.primary}
          style={styles.productivityBtnGradient}
        />
      )}
      <Text style={styles.productivityEmoji}>{emoji}</Text>
      <Text
        style={[
          styles.productivityBtnText,
          formData.productivity === value && styles.productivityBtnTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (checkingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
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
              <Text style={styles.headerTitle}>
                {existingReport ? 'Edit' : 'Submit'} Report
              </Text>
              <View style={{ width: 60 }} />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {!hasAttendance && (
              <View style={styles.warningCard}>
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A']}
                  style={styles.warningGradient}
                >
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <View style={styles.warningContent}>
                    <Text style={styles.warningText}>
                      Please mark your attendance before submitting a report
                    </Text>
                    <TouchableOpacity
                      style={styles.warningButton}
                      onPress={() => navigation.navigate('Attendance')}
                    >
                      <Text style={styles.warningButtonText}>Mark Attendance →</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Work Done */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                What did you do today? <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.textAreaContainer, errors.workDone && styles.inputError]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe your work in detail..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.workDone}
                  onChangeText={(text) => setFormData({ ...formData, workDone: text })}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              {errors.workDone && (
                <Text style={styles.errorText}>{errors.workDone}</Text>
              )}
              <Text style={styles.charCount}>
                {formData.workDone.length} / 2000 characters
              </Text>
            </View>

            {/* Challenges */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Challenges Faced (Optional)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Any challenges or blockers you faced..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.challenges}
                  onChangeText={(text) => setFormData({ ...formData, challenges: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Plan for Tomorrow */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Plan for Tomorrow (Optional)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="What do you plan to work on tomorrow..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.planForTomorrow}
                  onChangeText={(text) =>
                    setFormData({ ...formData, planForTomorrow: text })
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Hours Worked */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Hours Worked</Text>
              <View style={[styles.inputContainer, errors.hoursWorked && styles.inputError]}>
                
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 8.5"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.hoursWorked}
                  onChangeText={(text) =>
                    setFormData({ ...formData, hoursWorked: text })
                  }
                  keyboardType="decimal-pad"
                />
              </View>
              {errors.hoursWorked && (
                <Text style={styles.errorText}>{errors.hoursWorked}</Text>
              )}
            </View>

            {/* Productivity Level */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Productivity Level</Text>
              <View style={styles.productivityRow}>
                <ProductivityButton value="low" label="Low" />
                <ProductivityButton value="medium" label="Medium" />
              </View>
              <View style={styles.productivityRow}>
                <ProductivityButton value="high" label="High" />
                <ProductivityButton value="excellent" label="Excellent" />
              </View>
            </View>

            {/* Manager Review Toggle */}
            <TouchableOpacity
              style={styles.checkboxCard}
              onPress={() =>
                setFormData({
                  ...formData,
                  needsManagerReview: !formData.needsManagerReview,
                })
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.needsManagerReview && styles.checkboxChecked,
                ]}
              >
                {formData.needsManagerReview && (
                  <LinearGradient
                    colors={colors.gradients.primary}
                    style={styles.checkboxGradient}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxLabel}>Request Manager Review</Text>
                <Text style={styles.checkboxDescription}>
                  Get feedback on your work from your manager
                </Text>
              </View>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButtonContainer}
              onPress={handleSubmit}
              disabled={loading || !hasAttendance}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading || !hasAttendance 
                  ? ['#9CA3AF', '#6B7280'] 
                  : colors.gradients.primary
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    
                    <Text style={styles.submitButtonText}>
                      {existingReport ? 'Update Report' : 'Submit Report'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  warningCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.medium,
  },
  warningGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  warningIcon: {
    fontSize: 32,
  },
  warningContent: {
    flex: 1,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 12,
  },
  warningButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  required: {
    color: colors.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    ...colors.shadows.small,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textAreaContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.shadows.small,
  },
  textArea: {
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  productivityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  productivityBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  productivityBtnActive: {
    borderColor: colors.primary,
  },
  productivityBtnGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  productivityEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  productivityBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  productivityBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.shadows.small,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 16,
    overflow: 'hidden',
  },
  checkboxChecked: {
    borderColor: colors.primary,
  },
  checkboxGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.large,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitButtonIcon: {
    fontSize: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});