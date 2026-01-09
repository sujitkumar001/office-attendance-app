import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import { formatDate, formatTime } from '../utils/dateHelpers';
import colors from '../constants/colors';

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(null);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    setLoading(true);
    const result = await taskService.getTaskById(taskId);
    if (result.success) {
      setTask(result.data);
    } else {
      Alert.alert('Error', result.message);
      navigation.goBack();
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus) => {
    Alert.alert(
      'Update Status',
      `Change status to "${newStatus.replace('-', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            const result = await taskService.updateTaskStatus(taskId, newStatus);
            if (result.success) {
              Alert.alert('Success ✓', result.message);
              fetchTask();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setAddingComment(true);
    const result = await taskService.addComment(taskId, commentText);
    if (result.success) {
      setCommentText('');
      fetchTask();
    } else {
      Alert.alert('Error', result.message);
    }
    setAddingComment(false);
  };

  const handleUploadFile = async () => {
    setUploadingFile(true);
    const pickerResult = await taskService.pickDocument();
    
    if (pickerResult.success) {
      const uploadResult = await taskService.uploadAttachment(
        taskId,
        pickerResult.data.uri,
        pickerResult.data.name,
        pickerResult.data.type
      );

      if (uploadResult.success) {
        Alert.alert('Success ✓', 'File uploaded successfully');
        fetchTask();
      } else {
        Alert.alert('Error', uploadResult.message);
      }
    }
    setUploadingFile(false);
  };

  // FIXED: Handle opening/viewing attachments - Simply open URL
  const handleOpenAttachment = async (attachment) => {
    try {
      setDownloadingFile(attachment._id);
      
      console.log('Opening attachment:', {
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        mimeType: attachment.mimeType,
      });

      if (!attachment.fileUrl) {
        throw new Error('File URL not found');
      }

      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(attachment.fileUrl);
      
      if (canOpen) {
        // Open the URL - this will open in browser or appropriate app
        await Linking.openURL(attachment.fileUrl);
      } else {
        Alert.alert(
          'Cannot Open File',
          'Unable to open this file. The file may not exist on the server.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Open attachment error:', error);
      Alert.alert(
        'Error Opening File',
        error.message || 'Could not open the file. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDeleteAttachment = (attachmentId, fileName) => {
    Alert.alert(
      'Delete Attachment',
      `Delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await taskService.deleteAttachment(taskId, attachmentId);
            if (result.success) {
              Alert.alert('Success ✓', 'Attachment deleted successfully');
              fetchTask();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return ['#10B981', '#34D399'];
      case 'in-progress': return ['#3B82F6', '#2563EB'];
      case 'review': return ['#8B5CF6', '#A78BFA'];
      case 'pending': return ['#F59E0B', '#FBBF24'];
      case 'cancelled': return ['#EF4444', '#DC2626'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return ['#EF4444', '#DC2626'];
      case 'high': return ['#F59E0B', '#FBBF24'];
      case 'medium': return ['#3B82F6', '#2563EB'];
      case 'low': return ['#6B7280', '#9CA3AF'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '⚡';
      case 'review': return '👀';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getPriorityEmoji = (priority) => {
    switch (priority) {
      case 'urgent': return '🔥';
      case 'high': return '⬆️';
      case 'medium': return '➡️';
      case 'low': return '⬇️';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) return null;

  const isAssignedEmployee = task.assignedTo._id === user.id;
  const isManager = user.role === 'manager';
  const canChangeStatus = isAssignedEmployee || isManager;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <Text style={styles.headerTitle}>Task Details</Text>
            <View style={{ width: 60 }} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Task Info Card */}
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            style={styles.taskCard}
          >
            <Text style={styles.taskTitle}>{task.title}</Text>
            
            <View style={styles.badgeRow}>
              <View style={styles.badgeContainer}>
                <LinearGradient
                  colors={getPriorityColor(task.priority)}
                  style={styles.badge}
                >
                  <Text style={styles.badgeEmoji}>{getPriorityEmoji(task.priority)}</Text>
                  <Text style={styles.badgeText}>{task.priority.toUpperCase()}</Text>
                </LinearGradient>
              </View>

              <View style={styles.badgeContainer}>
                <LinearGradient
                  colors={getStatusColor(task.status)}
                  style={styles.badge}
                >
                  <Text style={styles.badgeEmoji}>{getStatusEmoji(task.status)}</Text>
                  <Text style={styles.badgeText}>
                    {task.status.toUpperCase().replace('-', ' ')}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.description}>{task.description}</Text>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <LinearGradient
                    colors={['#db9292ff', '#da3434ff']}
                    style={styles.infoIconGradient}
                  >
                    <Text style={styles.infoIcon}>📅</Text>
                  </LinearGradient>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Due Date</Text>
                  <Text style={styles.infoValue}>{formatDate(task.dueDate)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    style={styles.infoIconGradient}
                  >
                    <Text style={styles.infoIcon}>👤</Text>
                  </LinearGradient>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Assigned To</Text>
                  <Text style={styles.infoValue}>{task.assignedTo.name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <LinearGradient
                    colors={['#8B5CF6', '#A78BFA']}
                    style={styles.infoIconGradient}
                  >
                    <Text style={styles.infoIcon}>👨‍💼</Text>
                  </LinearGradient>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Assigned By</Text>
                  <Text style={styles.infoValue}>{task.assignedBy.name}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Status Change */}
          {canChangeStatus && task.status !== 'completed' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Status</Text>
              <View style={styles.statusGrid}>
                {['pending', 'in-progress', 'review', 'completed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.statusButtonContainer}
                    onPress={() => handleStatusChange(status)}
                    activeOpacity={0.7}
                    disabled={task.status === status}
                  >
                    <LinearGradient
                      colors={task.status === status 
                        ? getStatusColor(status) 
                        : ['#F3F4F6', '#E5E7EB']
                      }
                      style={styles.statusButton}
                    >
                      <Text style={styles.statusButtonEmoji}>
                        {getStatusEmoji(status)}
                      </Text>
                      <Text style={[
                        styles.statusButtonText,
                        task.status === status && styles.statusButtonTextActive
                      ]}>
                        {status.replace('-', ' ')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Attachments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                📎 Attachments ({task.attachments?.length || 0})
              </Text>
              <TouchableOpacity
                style={styles.uploadButtonContainer}
                onPress={handleUploadFile}
                disabled={uploadingFile}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={styles.uploadButton}
                >
                  {uploadingFile ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.uploadEmoji}>📤</Text>
                      <Text style={styles.uploadButtonText}>Upload</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {task.attachments && task.attachments.length > 0 ? (
              task.attachments.map((attachment) => (
                <View key={attachment._id} style={styles.attachmentItem}>
                  <TouchableOpacity
                    style={styles.attachmentLeft}
                    onPress={() => handleOpenAttachment(attachment)}
                    activeOpacity={0.7}
                    disabled={downloadingFile === attachment._id}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#A78BFA']}
                      style={styles.attachmentIcon}
                    >
                      {downloadingFile === attachment._id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.attachmentEmoji}>📄</Text>
                      )}
                    </LinearGradient>
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {attachment.fileName}
                      </Text>
                      <Text style={styles.attachmentMeta}>
                        By {attachment.uploadedBy.name} • {formatDate(attachment.uploadedAt)}
                      </Text>
                      {downloadingFile === attachment._id && (
                        <Text style={styles.downloadingText}>Opening...</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteAttachment(attachment._id, attachment.fileName)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.deleteGradient}
                    >
                      <Text style={styles.deleteEmoji}>🗑️</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📎</Text>
                <Text style={styles.emptyText}>No attachments yet</Text>
                <Text style={styles.emptySubtext}>Upload files to share with your team</Text>
              </View>
            )}
          </View>

          {/* Comments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              💬 Comments ({task.comments?.length || 0})
            </Text>

            {/* Add Comment */}
            <View style={styles.commentInputCard}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.sendButtonContainer}
                onPress={handleAddComment}
                disabled={addingComment || !commentText.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={addingComment || !commentText.trim()
                    ? ['#9CA3AF', '#6B7280']
                    : colors.gradients.primary
                  }
                  style={styles.sendButton}
                >
                  {addingComment ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.sendEmoji}>📨</Text>
                      <Text style={styles.sendButtonText}>Send</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Comment List */}
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((comment, index) => (
                <View key={comment._id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <LinearGradient
                      colors={index % 2 === 0 
                        ? colors.gradients.primary 
                        : colors.gradients.secondary
                      }
                      style={styles.profileCircle}
                    >
                      <Text style={styles.profileInitial}>
                        {comment.user.profileInitial}
                      </Text>
                    </LinearGradient>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{comment.user.name}</Text>
                      <Text style={styles.commentDate}>
                        {formatDate(comment.createdAt)} • {formatTime(comment.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySubtext}>Be the first to comment</Text>
              </View>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  taskCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    ...colors.shadows.medium,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 32,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  badgeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.small,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.small,
  },
  infoIconGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusButtonContainer: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.small,
  },
  statusButton: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusButtonEmoji: {
    fontSize: 24,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  uploadButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.small,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  uploadEmoji: {
    fontSize: 16,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentEmoji: {
    fontSize: 24,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  attachmentMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  downloadingText: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteEmoji: {
    fontSize: 18,
  },
  commentInputCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.shadows.small,
  },
  commentInput: {
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  sendButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...colors.shadows.small,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  sendEmoji: {
    fontSize: 18,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  commentItem: {
    marginBottom: 20,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.small,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  commentBubble: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    marginLeft: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});