import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import API_CONFIG from '../app/config/api';
import { Declaration } from '../types/declaration';

interface DeclarationCardProps {
  declaration: Declaration;
  onChatPress: (declaration: Declaration) => void;
  onPress?: (declaration: Declaration) => void;
}

const { width } = Dimensions.get('window');

export default function DeclarationCard({ declaration, onChatPress, onPress }: DeclarationCardProps) {
  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return '#FF3B30'; // High - Red
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

      {/* Preview Image if available */}
      {declaration.photos && declaration.photos.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: `${API_CONFIG.BASE_URL}${declaration.photos[0].photo}` }}
            style={styles.imagePreview}
            contentFit="cover"
            transition={200}
          />
          {declaration.photos.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{declaration.photos.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      {/* Chat Button */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => onChatPress(declaration)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles-outline" size={18} color="#007AFF" />
        <Text style={styles.chatButtonText}>Open Chat</Text>
      </TouchableOpacity>
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
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
});
