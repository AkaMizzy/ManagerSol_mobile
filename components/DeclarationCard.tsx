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
      {/* Header with Title and Severity */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleText} numberOfLines={1}>{declaration.title}</Text>
          <View style={styles.typeContainer}>
            <Ionicons name="document-text" size={14} color="#8E8E93" />
            <Text style={styles.typeSecondaryText}>{declaration.declaration_type_title}</Text>
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(declaration.severite) }]}>
          <Text style={styles.severityText}>{getSeverityText(declaration.severite)}</Text>
        </View>
      </View>

      {/* Zone, Date, and Severity */}
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>{declaration.zone_title}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>{formatDate(declaration.date_declaration)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="alert-circle" size={14} color={getSeverityColor(declaration.severite)} />
          <Text style={[styles.metaText, { color: getSeverityColor(declaration.severite) }]}>
            Sévérité {declaration.severite}/10
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
          <Text style={styles.secondaryButtonText}>Voir les Actions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => onChatPress(declaration)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#f87b1b" />
          <Text style={styles.chatButtonText}>Ouvrir Chat</Text>
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
    borderWidth: 1,
    borderColor: '#f87b1b',
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
  typeSecondaryText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
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
    justifyContent: 'space-between',
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
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f87b1b',
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
    borderColor: '#f87b1b',
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});
