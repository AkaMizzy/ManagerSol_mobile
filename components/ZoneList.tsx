import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { UserZone } from '../services/inventaireService';

interface ZoneListProps {
  zones: UserZone[];
  onZonePress?: (zone: UserZone) => void;
  onCreateInventaire?: () => void;
}

export default function ZoneList({ zones, onZonePress, onCreateInventaire }: ZoneListProps) {
  const renderZoneItem = ({ item }: { item: UserZone }) => {
    const displayTitle = item.zone_title || item.bloc_title || 'Unknown Zone';
    const displaySubtitle = item.bloc_title ? `Bloc: ${item.bloc_title}` : 'Zone';

    return (
      <TouchableOpacity
        style={styles.zoneItem}
        onPress={() => onZonePress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.zoneContent}>
          <View style={styles.zoneIcon}>
            <Ionicons 
              name={item.bloc_title ? "cube" : "location"} 
              size={24} 
              color="#11224e" 
            />
          </View>
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneTitle}>{displayTitle}</Text>
            <Text style={styles.zoneSubtitle}>{displaySubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="location-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No Zones Assigned</Text>
      <Text style={styles.emptySubtitle}>
        You don&apos;t have any zones assigned yet. Contact your administrator to get access to zones.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Your Zones</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateInventaire}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>New Inventaire</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {zones.length === 0 ? (
        <View style={styles.emptyContainer}>
          {renderEmptyState()}
        </View>
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(item) => item.id}
          renderItem={renderZoneItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11224e',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f87b1b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  zoneItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  zoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  zoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11224e',
    marginBottom: 2,
  },
  zoneSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
