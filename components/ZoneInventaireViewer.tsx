import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import inventaireService, { InventaireByZoneItem, UserZone } from '../services/inventaireService';

interface ZoneInventaireViewerProps {
  visible: boolean;
  onClose: () => void;
  zone: UserZone | null;
}

export default function ZoneInventaireViewer({ visible, onClose, zone }: ZoneInventaireViewerProps) {
  const { token } = useAuth();
  const [items, setItems] = useState<InventaireByZoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftQte, setDraftQte] = useState<string>('');
  const [draftValider, setDraftValider] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const zoneTitle = useMemo(() => zone?.zone_title || zone?.bloc_title || 'Unknown Zone', [zone]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!visible || !zone?.id_zone || !token) return;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await inventaireService.getInventairesByZone(zone.id_zone, token);
        if (isMounted) setItems(data);
      } catch (e: any) {
        if (isMounted) setErrorMessage(e?.message || 'Failed to load inventaires');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [visible, zone?.id_zone, token]);

  function formatCoords(lat?: number | null, lng?: number | null): string {
    if (lat == null || lng == null) return '';
    const ln = Number(lng);
    const lt = Number(lat);
    if (!Number.isFinite(lt) || !Number.isFinite(ln)) return '';
    return `${lt.toFixed(6)}, ${ln.toFixed(6)}`;
  }

  function HeroHeader() {
    const coords = formatCoords(zone?.zone_latitude ?? null, zone?.zone_longitude ?? null);
    return (
      <View style={styles.heroWrap}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroAvatarWrap}>
            {zone?.zone_logo ? (
              <Image source={{ uri: zone.zone_logo }} style={styles.heroAvatar} contentFit="cover" />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Ionicons name={zone?.bloc_title ? 'cube' : 'location'} size={28} color="#11224e" />
              </View>
            )}
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle} numberOfLines={1}>{zoneTitle}</Text>
            {coords ? <Text style={styles.heroSubtitle}>{coords}</Text> : null}
          </View>
          <View style={styles.countPill}>
            <Ionicons name="documents" size={14} color="#f87b1b" />
            <Text style={styles.countPillText}>{items.length}</Text>
          </View>
        </View>
        <View style={styles.heroChipsRow}>
          <View style={styles.heroChip}>
            <Ionicons name="shield-checkmark" size={12} color="#0ea5e9" />
            <Text style={styles.heroChipText}>Inventaires</Text>
          </View>
          {zone?.bloc_title ? (
            <View style={styles.heroChip}>
              <Ionicons name="cube" size={12} color="#0ea5e9" />
              <Text style={styles.heroChipText}>{zone.bloc_title}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  const renderMeta = (icon: keyof typeof Ionicons.glyphMap, text: string) => (
    <View style={styles.itemRow}>
      <Ionicons name={icon} size={12} color="#334155" />
      <Text style={styles.itemMeta}>{text}</Text>
    </View>
  );

  function startEdit(item: InventaireByZoneItem) {
    setExpandedId(prev => prev === item.id ? null : item.id);
    const qte = item.item_qte == null ? '' : String(item.item_qte);
    const val = Boolean(item.item_valider);
    setDraftQte(qte);
    setDraftValider(val);
  }

  async function saveItem(item: InventaireByZoneItem) {
    if (!token) return;
    setSavingId(item.id);
    try {
      const qteNum = draftQte === '' ? null : Number(draftQte);
      await inventaireService.saveInventaireZoneItem({ id_inventaire_zone: item.id, qte: qteNum, valider: draftValider }, token);
      // update local state
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, item_qte: qteNum, item_valider: draftValider ? 1 : 0 } : it));
      setExpandedId(null);
      setToast('Inventaire saved');
      setTimeout(() => setToast(null), 1600);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to save');
    } finally {
      setSavingId(null);
    }
  }

  const renderItem = (item: InventaireByZoneItem) => {
    const coords = formatCoords(item.declaration_latitude, item.declaration_longitude);
    const isExpanded = expandedId === item.id;
    const summaryRight = item.item_qte != null ? `Qte: ${item.item_qte}` : undefined;
    const validated = Boolean(item.item_valider);

    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardAccent} />
        <TouchableOpacity style={styles.cardBody} activeOpacity={0.85} onPress={() => startEdit(item)}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="document-text" size={18} color="#11224e" />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.inventaire_title}</Text>
            {summaryRight ? <Text style={styles.summaryRight}>{summaryRight}</Text> : null}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#9ca3af"
              style={styles.expandIcon}
            />
          </View>
          {item.declaration_description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>{item.declaration_description}</Text>
          ) : null}
          <View style={styles.cardMetaRow}>
            {renderMeta('albums', item.declaration_type_title)}
            {item.declaration_date ? renderMeta('calendar', new Date(item.declaration_date).toLocaleDateString()) : null}
            {item.declaration_company_name ? renderMeta('business', item.declaration_company_name) : null}
            {coords ? renderMeta('pin', coords) : null}
            {validated ? renderMeta('checkmark-circle', 'Validé') : null}
          </View>
        </TouchableOpacity>

        {isExpanded ? (
          <View style={styles.expandWrap}>
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Quantité (qte)</Text>
                <View style={styles.inputFieldWrap}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDraftQte(prev => {
                    const n = prev === '' ? 0 : Number(prev);
                    return String(Math.max(0, n - 1));
                  })}>
                    <Ionicons name="remove" size={16} color="#334155" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="number-pad"
                    value={draftQte}
                    onChangeText={setDraftQte}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDraftQte(prev => {
                    const n = prev === '' ? 0 : Number(prev);
                    return String(n + 1);
                  })}>
                    <Ionicons name="add" size={16} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Valider</Text>
                <View style={styles.switchWrap}>
                  <Switch value={draftValider} onValueChange={setDraftValider} trackColor={{ true: '#22c55e' }} />
                  <Text style={styles.switchText}>{draftValider ? 'Yes' : 'No'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setExpandedId(null)} disabled={savingId === item.id}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => saveItem(item)} disabled={savingId === item.id}>
                {savingId === item.id ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.btnPrimaryText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={22} color="#64748b" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Zone Inventaires</Text>
            <Text style={styles.headerSubtitle}>Review declarations linked to this zone</Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        {errorMessage ? (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={16} color="#b45309" />
            <Text style={styles.alertBannerText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage(null)}>
              <Ionicons name="close" size={14} color="#b45309" />
            </TouchableOpacity>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#f87b1b" size="large" />
            <Text style={styles.loadingText}>Loading inventaires…</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <HeroHeader />
            {items.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-outline" size={48} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No Inventaires</Text>
                <Text style={styles.emptySubtitle}>This zone has no linked inventaires yet.</Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Linked Inventaires</Text>
                  <View style={styles.sectionCount}>
                    <Text style={styles.sectionCountText}>{items.length}</Text>
                  </View>
                </View>
                {items.map(renderItem)}
                <View style={{ height: 24 }} />
              </>
            )}
          </ScrollView>
        )}

        {toast ? (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iconButton: { padding: 8, width: 40, alignItems: 'center' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#11224e' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { paddingTop: 0, paddingBottom: 12 },

  // Hero styles
  heroWrap: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#f87b1b',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  heroAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 12,
  },
  heroAvatar: { width: 48, height: 48, borderRadius: 12 },
  heroAvatarFallback: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: '#11224e' },
  heroSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  countPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, gap: 6 },
  countPillText: { color: '#f87b1b', fontWeight: '700', fontSize: 12 },
  heroChipsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  heroChipText: { color: '#334155', fontSize: 12, fontWeight: '600' },

  // Empty / loading / alert
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { marginTop: 12, color: '#475569' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  alertBannerText: { color: '#b45309', flex: 1, fontSize: 12 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginTop: 24 },
  emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center' },

  // Cards
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 14, color: '#64748b', fontWeight: '700', letterSpacing: 0.2, textTransform: 'uppercase' },
  sectionCount: { backgroundColor: '#eef2f7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sectionCountText: { color: '#334155', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eef2f7',
    paddingRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: { width: 4, height: 56, backgroundColor: '#11224e', borderTopLeftRadius: 16, borderBottomLeftRadius: 16, position: 'absolute', left: 0, top: 0 },
  cardBody: { paddingVertical: 12, paddingHorizontal: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },
  summaryRight: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  expandIcon: { marginLeft: 6 },
  cardDescription: { fontSize: 13, color: '#475569' },
  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },

  // Expanded
  expandWrap: { borderTopWidth: 1, borderTopColor: '#eef2f7', paddingHorizontal: 12, paddingBottom: 12, paddingTop: 10, marginTop: 6 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputCol: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: '600' },
  inputFieldWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10 },
  stepperBtn: { paddingHorizontal: 10, paddingVertical: 10 },
  inputField: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: '#0f172a' },
  switchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  switchText: { color: '#334155', fontSize: 12, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  btnPrimary: { backgroundColor: '#f87b1b' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  btnSecondary: { backgroundColor: '#e2e8f0' },
  btnSecondaryText: { color: '#334155', fontWeight: '700' },

  // Shared meta
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemMeta: { fontSize: 12, color: '#64748b' },

  // Toast
  toast: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#86efac', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3 },
  toastText: { color: '#065f46', fontSize: 13, fontWeight: '600' },
});


