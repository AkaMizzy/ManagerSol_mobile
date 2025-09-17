import AppHeader from '@/components/AppHeader';
import CreateQualiPhotoModal from '@/components/CreateQualiPhotoModal';
import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem, QualiProject, QualiZone } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QualiPhotoGalleryScreen() {
  const { user, token } = useAuth();
  const [photos, setPhotos] = useState<QualiPhotoItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [projects, setProjects] = useState<QualiProject[]>([]);
  const [zones, setZones] = useState<QualiZone[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedZone, setSelectedZone] = useState<string | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);

  const canLoadMore = useMemo(() => photos.length < total, [photos.length, total]);

  const load = useCallback(async (reset = false) => {
    if (!token) return;
    if (isLoading) return;
    setIsLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const { items, total: t } = await qualiphotoService.list({
        id_project: selectedZone ? undefined : selectedProject,
        id_zone: selectedZone || undefined,
        page: currentPage,
        limit,
      }, token);
      setTotal(t);
      setPhotos(prev => reset ? items : [...prev, ...items]);
    } catch (e) {
       
      console.error('Failed to load QualiPhoto', e);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, limit, selectedProject, selectedZone, isLoading]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      await load(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [token, load]);

  // Load projects on mount/token change
  useEffect(() => {
    if (!token) return;
    setLoadingProjects(true);
    qualiphotoService.getProjects(token)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [token]);

  // Load zones when project changes
  useEffect(() => {
    if (!token) return;
    setSelectedZone(undefined);
    setZones([]);
    if (!selectedProject) return;
    setLoadingZones(true);
    qualiphotoService.getZonesByProject(selectedProject, token)
      .then(setZones)
      .catch(() => setZones([]))
      .finally(() => setLoadingZones(false));
  }, [token, selectedProject]);

  // Refetch photos on filter change
  useEffect(() => {
    setPage(1);
    load(true);
  }, [selectedProject, selectedZone]);

  const onEndReached = useCallback(() => {
    if (isLoading || !canLoadMore) return;
    setPage((p) => p + 1);
  }, [isLoading, canLoadMore]);

  useEffect(() => {
    if (page > 1) load(false);
  }, [page]);

  const renderItem = useCallback(({ item }: { item: QualiPhotoItem }) => (
    <View style={styles.card}>
      <Pressable style={({ pressed }) => [styles.imageWrap, pressed && styles.pressed] }>
        <Image source={{ uri: item.photo }} style={styles.image} resizeMode="cover" />
      </Pressable>
      <View style={styles.meta}>
        {item.project_title ? <Text style={styles.metaText} numberOfLines={1}>{item.project_title}</Text> : null}
        {item.zone_title ? <Text style={styles.metaSubText} numberOfLines={1}>{item.zone_title}</Text> : null}
      </View>
    </View>
  ), []);

  const keyExtractor = useCallback((item: QualiPhotoItem) => item.id, []);

  const totalProjects = projects.length;
  const subtitleText = `${total} photos`;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader user={user || undefined} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Ionicons name="images-outline" size={24} color="#11224e" />
            <Text style={styles.subtitle}>{subtitleText}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add QualiPhoto" onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color="#f87b1b" />
            <Text style={styles.addButtonText}>Create</Text>
          </Pressable>
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.filtersRow}>
            {/* Project dropdown */}
            <View style={styles.dropdownWrap}>
              <Pressable accessibilityRole="button" accessibilityLabel="Select project" onPress={() => { setProjectOpen(v => !v); setZoneOpen(false); }} style={styles.selectBtn}>
                <Text style={[styles.selectText, !selectedProject && styles.selectPlaceholder]}>
                  {selectedProject ? (projects.find(p => p.id === selectedProject)?.title || 'Project') : 'Select project'}
                </Text>
              </Pressable>
              {projectOpen && (
                <View style={styles.selectMenu}>
                  <ScrollView>
                    <Pressable style={styles.selectItem} onPress={() => { setSelectedProject(undefined); setProjectOpen(false); }}>
                      <Text style={styles.selectItemText}>All projects</Text>
                    </Pressable>
                    {(loadingProjects ? [] : projects).map(p => (
                      <Pressable key={p.id} style={styles.selectItem} onPress={() => { setSelectedProject(p.id); setProjectOpen(false); }}>
                        <Text numberOfLines={1} style={styles.selectItemText}>{p.title}</Text>
                      </Pressable>
                    ))}
                    {loadingProjects && <View style={styles.selectItem}><Text style={styles.selectItemText}>Loading...</Text></View>}
                    {!loadingProjects && projects.length === 0 && <View style={styles.selectItem}><Text style={styles.selectItemText}>No projects</Text></View>}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Zone dropdown */}
            <View style={[styles.dropdownWrap, !selectedProject && styles.dropdownDisabled]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Select zone" disabled={!selectedProject} onPress={() => { if (!selectedProject) return; setZoneOpen(v => !v); setProjectOpen(false); }} style={[styles.selectBtn, !selectedProject && styles.selectBtnDisabled]}>
                <Text style={[styles.selectText, !selectedZone && styles.selectPlaceholder]}>
                  {selectedZone ? (zones.find(z => z.id === selectedZone)?.title || 'Zone') : (selectedProject ? 'Select zone' : 'Select project first')}
                </Text>
              </Pressable>
              {selectedProject && zoneOpen && (
                <View style={styles.selectMenu}>
                  <ScrollView>
                    <Pressable style={styles.selectItem} onPress={() => { setSelectedZone(undefined); setZoneOpen(false); }}>
                      <Text style={styles.selectItemText}>All zones</Text>
                    </Pressable>
                    {(loadingZones ? [] : zones).map(z => (
                      <Pressable key={z.id} style={styles.selectItem} onPress={() => { setSelectedZone(z.id); setZoneOpen(false); }}>
                        <Text numberOfLines={1} style={styles.selectItemText}>{z.title}</Text>
                      </Pressable>
                    ))}
                    {loadingZones && <View style={styles.selectItem}><Text style={styles.selectItemText}>Loading...</Text></View>}
                    {!loadingZones && zones.length === 0 && <View style={styles.selectItem}><Text style={styles.selectItemText}>No zones</Text></View>}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={photos}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          refreshing={isRefreshing}
          onRefresh={refresh}
          ListFooterComponent={isLoading ? <ActivityIndicator color="#11224e" style={{ marginVertical: 12 }} /> : null}
        />
      </View>

      <CreateQualiPhotoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          setPage(1);
          load(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
    shadowColor: '#f87b1b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87b1b',
    marginLeft: 6,
  },
  filterContainer: {
    marginTop: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  content: {
    flex: 1,
  },
  dropdownWrap: {
    minWidth: 160,
    position: 'relative',
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 0,
  },
  dropdownDisabled: {
    opacity: 0.6,
  },
  selectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  selectBtnDisabled: {
    backgroundColor: '#f9fafb',
  },
  selectText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
  },
  selectPlaceholder: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  selectMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 240,
    zIndex: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  selectItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  selectItemText: {
    color: '#11224e',
    fontWeight: '600',
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#f87b1b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  listContent: {
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.02 }],
  },
  pressed: {
    opacity: 0.9,
  },
  meta: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  metaText: {
    color: '#111827',
    fontWeight: '600',
  },
  metaSubText: {
    color: '#6b7280',
    fontSize: 12,
  },
});


