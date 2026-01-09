import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import taskService from '../services/taskService';
import userService from '../services/userService';
import colors from '../constants/colors';

export default function CreateTaskScreen({ navigation }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: new Date(),
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [errors, setErrors] = useState({});
  
  // UI State
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const result = await userService.getAllEmployees();
      
      if (result.success) {
        setEmployees(result.data);
      } else {
        Alert.alert('Error', 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setFormData({ ...formData, assignedTo: employee._id });
    setShowEmployeeModal(false);
    if (errors.assignedTo) {
      setErrors({ ...errors, assignedTo: '' });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setFormData({ ...formData, dueDate: selectedDate });
      if (errors.dueDate) {
        setErrors({ ...errors, dueDate: '' });
      }
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Please select an employee';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(formData.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const result = await taskService.createTask({
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        dueDate: formData.dueDate.toISOString(),
      });

      if (result.success) {
        Alert.alert('Success ✓', 'Task created successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const priorities = [
    { value: 'low', label: 'Low', emoji: '', gradient: ['#6B7280', '#9CA3AF'] },
    { value: 'medium', label: 'Medium', emoji: '', gradient: ['#3B82F6', '#2563EB'] },
    { value: 'high', label: 'High', emoji: '', gradient: ['#F59E0B', '#FBBF24'] },
    { value: 'urgent', label: 'Urgent', emoji: '', gradient: ['#EF4444', '#DC2626'] },
  ];

  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.employeeItem}
      onPress={() => handleEmployeeSelect(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={formData.assignedTo === item._id 
          ? colors.gradients.primary 
          : ['#E5E7EB', '#D1D5DB']
        }
        style={styles.employeeAvatar}
      >
        <Text style={styles.employeeInitial}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </LinearGradient>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeEmail}>{item.email}</Text>
      </View>
      {formData.assignedTo === item._id && (
        <View style={styles.checkmarkContainer}>
          <LinearGradient
            colors={colors.gradients.success}
            style={styles.checkmarkGradient}
          >
            <Text style={styles.checkmark}>✓</Text>
          </LinearGradient>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
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
            <Text style={styles.headerTitle}>Create Task</Text>
            <View style={{ width: 60 }} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Title Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Task Title <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.title && styles.inputError]}>
              
              <TextInput
                style={styles.input}
                placeholder="Enter task title"
                placeholderTextColor={colors.textSecondary}
                value={formData.title}
                onChangeText={(value) => handleChange('title', value)}
              />
            </View>
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.textAreaContainer, errors.description && styles.inputError]}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the task in detail..."
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(value) => handleChange('description', value)}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Assign To Employee */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Assign To <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, errors.assignedTo && styles.inputError]}
              onPress={() => setShowEmployeeModal(true)}
              disabled={fetchingEmployees}
              activeOpacity={0.7}
            >
              {fetchingEmployees ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : selectedEmployee ? (
                <View style={styles.selectedEmployee}>
                  <LinearGradient
                    colors={colors.gradients.primary}
                    style={styles.selectedEmployeeAvatar}
                  >
                    <Text style={styles.selectedEmployeeInitial}>
                      {selectedEmployee.name.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.selectedEmployeeInfo}>
                    <Text style={styles.selectedEmployeeName}>
                      {selectedEmployee.name}
                    </Text>
                    <Text style={styles.selectedEmployeeEmail}>
                      {selectedEmployee.email}
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.selectIcon}>👤</Text>
                  <Text style={styles.selectPlaceholder}>
                    Select an employee
                  </Text>
                </>
              )}
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {errors.assignedTo && (
              <Text style={styles.errorText}>{errors.assignedTo}</Text>
            )}
          </View>

          {/* Priority Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Priority <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priorityGrid}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={styles.priorityButtonContainer}
                  onPress={() => handleChange('priority', priority.value)}
                  activeOpacity={0.7}
                >
                  {formData.priority === priority.value ? (
                    <LinearGradient
                      colors={priority.gradient}
                      style={styles.priorityButton}
                    >
                      <Text style={styles.priorityEmoji}>{priority.emoji}</Text>
                      <Text style={styles.priorityTextActive}>
                        {priority.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.priorityButtonInactive}>
                      <Text style={styles.priorityEmojiInactive}>{priority.emoji}</Text>
                      <Text style={styles.priorityText}>
                        {priority.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Due Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, errors.dueDate && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateContent}>
                <LinearGradient
                  colors={colors.gradients.info}
                  style={styles.dateIconContainer}
                >
                  <Text style={styles.dateIcon}>📅</Text>
                </LinearGradient>
                <Text style={styles.dateText}>
                  {formatDate(formData.dueDate)}
                </Text>
              </View>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {errors.dueDate && (
              <Text style={styles.errorText}>{errors.dueDate}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButtonContainer}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading 
                ? ['#9CA3AF', '#6B7280'] 
                : colors.gradients.success
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  
                  <Text style={styles.submitButtonText}>Create Task</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Employee Selection Modal */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Select Employee</Text>
              <TouchableOpacity
                onPress={() => setShowEmployeeModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>

            {employees.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.emptyGradient}
                >
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyText}>No employees found</Text>
                  <Text style={styles.emptySubtext}>
                    Employees will appear here once registered
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              <FlatList
                data={employees}
                keyExtractor={(item) => item._id}
                renderItem={renderEmployeeItem}
                style={styles.employeeList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dueDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  selectButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...colors.shadows.small,
  },
  selectIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  selectPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: colors.textSecondary,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedEmployee: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedEmployeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedEmployeeInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedEmployeeInfo: {
    flex: 1,
  },
  selectedEmployeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedEmployeeEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateIcon: {
    fontSize: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priorityButtonContainer: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  priorityButton: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...colors.shadows.small,
  },
  priorityButtonInactive: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityEmoji: {
    fontSize: 24,
  },
  priorityEmojiInactive: {
    fontSize: 24,
    opacity: 0.6,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  priorityTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.large,
    marginTop: 10,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  employeeList: {
    paddingBottom: 20,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.shadows.small,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  employeeInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkmarkContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkmarkGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});