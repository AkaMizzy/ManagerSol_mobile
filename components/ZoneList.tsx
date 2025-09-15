import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
  function formatCoords(lat?: unknown, lng?: unknown): string {
    const latNum = lat === null || lat === undefined ? NaN : Number(lat);
    const lngNum = lng === null || lng === undefined ? NaN : Number(lng);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
    }
    return '';
  }

  const renderZoneItem = ({ item }: { item: UserZone }) => {
    const displayTitle = item.zone_title || item.bloc_title || 'Unknown Zone';
    const displaySubtitle = formatCoords(item.zone_latitude as any, item.zone_longitude as any);
    const logoUrl = item.zone_logo || undefined;

    return (
      <TouchableOpacity
        style={styles.zoneItem}
        onPress={() => onZonePress?.(item)}
        activeOpacity={0.8}
      >
        <View style={styles.zoneContent}>
          <View style={styles.zoneIconContainer}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.zoneLogo}
                contentFit="cover"
              />
            ) : (
              <View style={styles.zoneIconFallback}>
                <Ionicons 
                  name={item.bloc_title ? "cube" : "location"} 
                  size={28} 
                  color="#11224e" 
                />
              </View>
            )}
          </View>
          
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneTitle} numberOfLines={1}>{displayTitle}</Text>
            {displaySubtitle ? (
              <Text style={styles.zoneSubtitle} numberOfLines={1}>{displaySubtitle}</Text>
            ) : null}
            
          </View>
          
          <View style={styles.zoneAction}>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="location-outline" size={80} color="#cbd5e1" />
      </View>
      <Text style={styles.emptyTitle}>No Zones Assigned</Text>
      <Text style={styles.emptySubtitle}>
        You don&apos;t have any zones assigned yet.{'\n'}Contact your administrator to get access to zones.
      </Text>
      <TouchableOpacity style={styles.emptyActionButton} onPress={onCreateInventaire}>
        <Ionicons name="add-circle-outline" size={20} color="#f87b1b" />
        <Text style={styles.emptyActionText}>Request Access</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Your Zones</Text>
          <Text style={styles.headerSubtitle}>{zones.length} zone{zones.length !== 1 ? 's' : ''} assigned</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreateInventaire}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>New Inventaire</Text>
        </TouchableOpacity>
      </View>
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
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11224e',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f87b1b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  zoneItem: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  zoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  zoneIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  zoneLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  zoneIconFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneInfo: {
    flex: 1,
    marginRight: 12,
  },
  zoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11224e',
    marginBottom: 4,
  },
  zoneSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  zoneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  zoneAction: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3f2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fed7d3',
  },
  emptyActionText: {
    fontSize: 14,
    color: '#f87b1b',
    fontWeight: '600',
  },
});
