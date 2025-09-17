import AppHeader from '@/components/AppHeader';
import CreateQualiPhotoModal from '@/components/CreateQualiPhotoModal';
import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterMode = 'all' | 'project' | 'zone';

export default function QualiPhotoGalleryScreen() {
  const { user, token } = useAuth();
  const [photos, setPhotos] = useState<QualiPhotoItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
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
        id_project: filterMode === 'project' ? selectedProject : undefined,
        id_zone: filterMode === 'zone' ? selectedZone : undefined,
        page: currentPage,
        limit,
      }, token);
      setTotal(t);
      setPhotos(prev => reset ? items : [...prev, ...items]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load QualiPhoto', e);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, limit, filterMode, selectedProject, selectedZone, isLoading]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      await load(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [token, load]);

  useEffect(() => {
    // Reset page to 1 when filters change, then load fresh data
    setPage(1);
    load(true);
  }, [filterMode, selectedProject, selectedZone]);

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

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader user={user || undefined} />
      <View style={styles.content}>
        <View style={styles.filters}>
          <Pressable accessibilityRole="button" accessibilityLabel="Filter by All" onPress={() => { setFilterMode('all'); setSelectedProject(undefined); setSelectedZone(undefined); }} style={[styles.filterBtn, filterMode === 'all' && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filterMode === 'all' && styles.filterTextActive]}>All</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Filter by Project" onPress={() => { setFilterMode('project'); setSelectedZone(undefined); }} style={[styles.filterBtn, filterMode === 'project' && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filterMode === 'project' && styles.filterTextActive]}>By Project</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Filter by Zone" onPress={() => { setFilterMode('zone'); setSelectedProject(undefined); }} style={[styles.filterBtn, filterMode === 'zone' && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filterMode === 'zone' && styles.filterTextActive]}>By Zone</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable accessibilityRole="button" accessibilityLabel="Add QualiPhoto" onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add Photo</Text>
          </Pressable>
        </View>

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
  content: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  addBtn: {
    backgroundColor: '#f87b1b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterBtnActive: {
    backgroundColor: '#11224e',
  },
  filterText: {
    color: '#111827',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
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


