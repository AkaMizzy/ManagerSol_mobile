import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    tags: string[];
    timeRange?: { start: string; end: string };
    reminders: number;
    comments: number;
    location: string;
    completed: boolean;
    subtasks?: { completed: number; total: number };
  };
  onToggleComplete: (taskId: string) => void;
}

export default function TaskCard({ task, onToggleComplete }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'flag';
      case 'medium': return 'flag-outline';
      case 'low': return 'flag-outline';
      default: return 'ellipse-outline';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          { borderColor: getPriorityColor(task.priority) },
          task.completed && styles.checkboxCompleted
        ]}
        onPress={() => onToggleComplete(task.id)}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Task Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={[
          styles.title,
          task.completed && styles.titleCompleted
        ]}>
          {task.title}
        </Text>

        {/* Description */}
        {task.description && (
          <Text style={[
            styles.description,
            task.completed && styles.descriptionCompleted
          ]}>
            {task.description}
          </Text>
        )}

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          {/* Subtasks */}
          {task.subtasks && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataText}>
                {task.subtasks.completed}/{task.subtasks.total}
              </Text>
            </View>
          )}

          {/* Time Range */}
          {task.timeRange && (
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={14} color="#34C759" />
              <Text style={styles.metadataText}>
                {task.timeRange.start}-{task.timeRange.end}
              </Text>
            </View>
          )}

          {/* Reminders */}
          {task.reminders > 0 && (
            <View style={styles.metadataItem}>
              <Ionicons name="notifications-outline" size={14} color="#8E8E93" />
              <Text style={styles.metadataText}>{task.reminders}</Text>
            </View>
          )}

          {/* Comments */}
          {task.comments > 0 && (
            <View style={styles.metadataItem}>
              <Ionicons name="chatbubble-outline" size={14} color="#8E8E93" />
              <Text style={styles.metadataText}>{task.comments}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {task.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {task.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Location */}
      <View style={styles.locationContainer}>
        <Ionicons name="folder-outline" size={16} color="#8E8E93" />
        <Text style={styles.locationText}>{task.location}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    lineHeight: 22,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20,
  },
  descriptionCompleted: {
    color: '#C7C7CC',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
