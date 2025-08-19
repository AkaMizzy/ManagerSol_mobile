import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Declaration } from '../types/declaration';
import ImageCarousel from './ImageCarousel';

interface DeclarationCardProps {
  declaration: Declaration;
  onChatPress: (declaration: Declaration) => void;
  onPress?: (declaration: Declaration) => void;
  onViewActions?: (declaration: Declaration) => void;
}

const { width } = Dimensions.get('window');

export default function DeclarationCard({ declaration, onChatPress, onPress, onViewActions }: DeclarationCardProps) {
  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return '#FF3B30'; // High - Red
    if (severity >= 5) return '#FF9500'; // Medium - Orange
    return '#34C759'; // Low - Green
  };

  const getSeverityText = (severity: number) => {
    if (severity >= 8) return 'High';
    if (severity >= 5) return 'Medium';
    return 'Low';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(declaration)}
      activeOpacity={0.95}
    >
      {/* Header with Type and Severity */}
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Ionicons name="document-text" size={16} color="#007AFF" />
          <Text style={styles.typeText}>{declaration.declaration_type_title}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(declaration.severite) }]}>
          <Text style={styles.severityText}>{getSeverityText(declaration.severite)}</Text>
        </View>
      </View>

      {/* Zone and Date */}
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>{declaration.zone_title}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>{formatDate(declaration.date_declaration)}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {truncateDescription(declaration.description)}
      </Text>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="images" size={16} color="#8E8E93" />
          <Text style={styles.statText}>{declaration.photo_count} photos</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubbles" size={16} color="#8E8E93" />
          <Text style={styles.statText}>{declaration.chat_count} messages</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="alert-circle" size={16} color={getSeverityColor(declaration.severite)} />
          <Text style={[styles.statText, { color: getSeverityColor(declaration.severite) }]}>
            Severity {declaration.severite}/10
          </Text>
        </View>
      </View>

      {/* Image Carousel */}
      {declaration.photos && declaration.photos.length > 0 && (
        <ImageCarousel images={declaration.photos} />
      )}

      {/* Chat Button */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => onViewActions?.(declaration)}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={18} color="#1C1C1E" />
          <Text style={styles.secondaryButtonText}>View Actions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => onChatPress(declaration)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#007AFF" />
          <Text style={styles.chatButtonText}>Open Chat</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});
