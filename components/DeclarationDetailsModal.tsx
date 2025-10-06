import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import API_CONFIG from '../app/config/api';
import { useAuth } from '../contexts/AuthContext';
import declarationService from '../services/declarationService';
import { CompanyUser, Declaration, DeclarationPhoto, DeclarationType } from '../types/declaration';

interface Props {
  visible: boolean;
  onClose: () => void;
  declaration: Declaration | null;
}

export default function DeclarationDetailsModal({ visible, onClose, declaration }: Props) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [isUpdateVisible, setIsUpdateVisible] = useState(false);
  const [isDetailsMapVisible, setIsDetailsMapVisible] = useState(false);
  const [isImagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form state (title is read-only per backend PUT support)
  const [form, setForm] = useState({
    id_declaration_type: '',
    severite: 5,
    description: '',
    date_declaration: '',
    id_declarent: '' as string | undefined,
  });

  // Options
  const [types, setTypes] = useState<DeclarationType[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDeclarantDropdown, setShowDeclarantDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!declaration) return;
    setForm({
      id_declaration_type: declaration.id_declaration_type,
      severite: declaration.severite,
      description: declaration.description,
      date_declaration: declaration.date_declaration,
      id_declarent: declaration.id_declarent || undefined,
    });
  }, [declaration]);

  useEffect(() => {
    if (!isUpdateVisible || !token) return;
    let isMounted = true;
    setIsLoadingOptions(true);
    Promise.all([
      declarationService.getDeclarationTypes(token),
      declarationService.getCompanyUsers(token),
    ])
      .then(([t, u]) => {
        if (!isMounted) return;
        setTypes(t);
        setUsers(u);
      })
      .catch((err) => {
        Alert.alert('Error', err.message || 'Failed to load options');
      })
      .finally(() => setIsLoadingOptions(false));
    return () => {
      isMounted = false;
    };
  }, [isUpdateVisible, token]);

  function openUpdateModal() {
    setIsUpdateVisible(true);
  }

  function closeUpdateModal() {
    setIsUpdateVisible(false);
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.date_declaration) return 'La date est requise';
    const date = new Date(form.date_declaration);
    if (isNaN(date.getTime())) return 'Format de date invalide (utiliser AAAA-MM-JJ)';
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (date > endOfToday) return 'La date ne peut pas être dans le futur';
    if (form.severite < 0 || form.severite > 10) return 'La sévérité doit être entre 0 et 10';
    if (!form.id_declaration_type) return 'Le type de déclaration est requis';
    if (!form.description) return 'La description est requise';
    return null;
  }

  async function submitUpdate() {
    if (!declaration || !token) return;
    const errMsg = validate();
    if (errMsg) {
      Alert.alert('Validation', errMsg);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        id_declaration_type: form.id_declaration_type,
        severite: form.severite,
        description: form.description,
        date_declaration: form.date_declaration,
      };
      if (form.id_declarent !== undefined && form.id_declarent !== '') payload.id_declarent = form.id_declarent;

      await declarationService.updateDeclaration(declaration.id, payload, token);
      Alert.alert('Succès', 'Déclaration mise à jour avec succès');
      closeUpdateModal();
      onClose();
    } catch (e: any) {
      Alert.alert('Échec de la mise à jour', e?.message || 'Veuillez réessayer');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGeneratePdf() {
    if (!declaration || !token) return;
    setIsGeneratingPdf(true);
    try {
      const result = await declarationService.generateDeclarationPdf(declaration.id, token);
      const pdfUrl = `${API_CONFIG.BASE_URL}${result.fileUrl}`;
      await WebBrowser.openBrowserAsync(pdfUrl);
    } catch (error: any) {
      Alert.alert('Échec de la génération du PDF', error?.message || 'Une erreur est survenue.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  // Helpers similar to CreateDeclarationModal for consistent UI
  function getDeclarationTypeTitle(id: string) {
    const type = types.find(t => t.id === id);
    return type ? type.title : 'Sélectionner le type de déclaration';
  }

  function getDeclarantName(id?: string) {
    if (!id) return 'Sélectionner le déclarant';
    const user = users.find(u => u.id === id);
    return user ? `${user.firstname} ${user.lastname}` : 'Sélectionner le déclarant';
  }

  function getSeverityColor(severity: number) {
    if (severity >= 7) return '#FF3B30';
    if (severity >= 5) return '#FF9500';
    return '#34C759';
  }

  function getSeverityText(severity: number) {
    if (severity >= 7) return 'Élevée';
    if (severity >= 5) return 'Moyenne';
    return 'Faible';
  }

  // Date helpers (same behavior as create modal)
  function toISODate(d: Date) {
    return d.toISOString().split('T')[0];
  }

  function formatDisplayDate(iso?: string) {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Map integration (Leaflet in WebView)
  function getMiniMapHtml() {
    const lat = declaration?.latitude ? Number(declaration.latitude) : 33.5731;
    const lng = declaration?.longitude ? Number(declaration.longitude) : -7.5898;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style> html, body, #miniMap { height: 100%; } body { margin: 0; padding: 0; } #miniMap { width: 100%; } </style>
      </head>
      <body>
        <div id="miniMap"></div>
        <script>
          const miniMap = L.map('miniMap', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(miniMap);
          L.marker([${lat}, ${lng}]).addTo(miniMap);
          setTimeout(() => { miniMap.invalidateSize(); }, 100);
        </script>
      </body>
      </html>
    `;
  }
  
  function getFullViewMapHtml() {
    if (!declaration?.latitude || !declaration?.longitude) return '';
    const lat = Number(declaration.latitude);
    const lng = Number(declaration.longitude);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style> html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; } </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${lat}, ${lng}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
          L.marker([${lat}, ${lng}]).addTo(map);
        </script>
      </body>
      </html>
    `;
  }

  const renderPhoto = (photoPath?: string) => {
    if (!photoPath) return null;
    const uri = `${API_CONFIG.BASE_URL}${photoPath}`;
    return <Image source={{ uri }} style={styles.photo} contentFit="cover" />;
  };

  const openImagePreview = (index: number) => {
    setSelectedImageIndex(index);
    setImagePreviewVisible(true);
  };

  const renderPhotos = () => {
    if (!declaration?.photos || declaration.photos.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {declaration.photos.map((p, index) => (
            <TouchableOpacity key={p.id} onPress={() => openImagePreview(index)} style={styles.photoItem}>
              {renderPhoto(p.photo)}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!declaration) return null;

  const declarantName = [declaration.declarent_firstname, declaration.declarent_lastname].filter(Boolean).join(' ');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de la déclaration</Text>
          {isGeneratingPdf ? (
            <ActivityIndicator style={styles.headerIcon} />
          ) : (
            <TouchableOpacity onPress={handleGeneratePdf} style={styles.headerIcon}>
              <Ionicons name="document-text-outline" size={24} color="#11224e" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.title}>{declaration.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                <Text style={styles.metaText}>{formatDisplayDate(declaration.date_declaration)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={14} color="#8E8E93" />
                <Text style={styles.metaText}>#{declaration.code_declaration}</Text>
              </View>
            </View>
            <View style={styles.severityBarContainer}>
              <View style={[styles.severityBarFill, { width: `${declaration.severite * 10}%`, backgroundColor: getSeverityColor(declaration.severite) }]} />
              <Text style={styles.severityText}>{declaration.severite}/10 - {getSeverityText(declaration.severite)}</Text>
            </View>
          </View>
          
          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <DetailItem label="Type" value={declaration.declaration_type_title} icon="document-text-outline" />
                <DetailItem label="Déclarant" value={declarantName || '—'} icon="person-outline" />
              </View>
              <View style={styles.detailRow}>
                <DetailItem label="Zone" value={declaration.zone_title} icon="map-outline" />
                <DetailItem label="Projet" value={declaration.project_title || '—'} icon="briefcase-outline" />
              </View>
              <View style={styles.detailRow}>
                <DetailItem label="Entreprise" value={declaration.company_title || '—'} icon="business-outline" />
              </View>
            </View>
          </View>
          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{declaration.description}</Text>
          </View>
          {renderPhotos()}
          {/* Location Section */}
          {(declaration.latitude && declaration.longitude) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Position GPS</Text>
              <TouchableOpacity onPress={() => setIsDetailsMapVisible(true)}>
                <View style={styles.mapContainer}>
                  <WebView
                    source={{ html: getMiniMapHtml() }}
                    style={styles.map}
                    javaScriptEnabled
                    scrollEnabled={false}
                    pointerEvents="none"
                  />
                  <View style={styles.mapOverlay}>
                    <Text style={styles.mapCoordinates}>{`${Number(declaration.latitude).toFixed(5)}, ${Number(declaration.longitude).toFixed(5)}`}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={openUpdateModal} style={styles.primaryButton}>
              <Ionicons name="create-outline" size={20} color="#f87b1b" />
              <Text style={styles.primaryButtonText}>Modifier la Déclaration</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        {isUpdateVisible && (
          <Modal visible={isUpdateVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeUpdateModal}>
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={closeUpdateModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#1C1C1E" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Modifier la Déclaration</Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {`Projet: ${declaration.project_title}  ·  Zone: ${declaration.zone_title || '—'}`}
                  </Text>
                </View>
                <View style={{ width: 24 }} />
              </View>
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                  <Text style={styles.label}>Titre (lecture seule)</Text>
                  <TextInput value={declaration.title} editable={false} style={[styles.input, { backgroundColor: '#F2F2F7' }]} />

                  <Text style={styles.label}>Type</Text>
                  <TouchableOpacity disabled={isLoadingOptions} onPress={() => setShowTypeDropdown(!showTypeDropdown)} style={styles.dropdown}>
                    <Text style={[styles.dropdownText, !form.id_declaration_type && styles.placeholderText]}>
                      {getDeclarationTypeTitle(form.id_declaration_type)}
                    </Text>
                    <Ionicons name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#8E8E93" />
                  </TouchableOpacity>
                  {showTypeDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {types.map((type, index) => (
                          <TouchableOpacity
                            key={type.id}
                            style={[styles.dropdownItem, index === types.length - 1 && styles.dropdownItemLast]}
                            onPress={() => { setField('id_declaration_type', type.id); setShowTypeDropdown(false); }}
                          >
                            <Text style={styles.dropdownItemText}>{type.title}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <Text style={styles.label}>Sévérité *</Text>
                  <View style={styles.severityContainer}>
                    <View style={styles.severityHeader}>
                      <Text style={[styles.severityValue, { color: getSeverityColor(form.severite) }]}>
                        {form.severite}/10
                      </Text>
                      <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(form.severite) }]}>
                        <Text style={styles.severityBadgeText}>{getSeverityText(form.severite)}</Text>
                      </View>
                    </View>
                    <View style={styles.severitySlider}>
                      {[0,1,2,3,4,5,6,7,8,9,10].map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.severityDot,
                            form.severite >= value && [styles.severityDotActive, { backgroundColor: getSeverityColor(form.severite) }],
                            form.severite === value && [styles.severityDotSelected, { borderColor: getSeverityColor(form.severite) }],
                          ]}
                          onPress={() => setField('severite', value)}
                          activeOpacity={0.7}
                        />
                      ))}
                    </View>
                  </View>

                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(v) => setField('description', v)}
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    multiline
                  />

                  <Text style={styles.label}>Date de déclaration *</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                    <Text style={[styles.dropdownText, !form.date_declaration && styles.placeholderText]}>
                      {form.date_declaration ? formatDisplayDate(form.date_declaration) : 'Sélectionner la date de déclaration'}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="date"
                    date={form.date_declaration ? new Date(form.date_declaration) : new Date()}
                    maximumDate={new Date()}
                    onConfirm={(selectedDate) => { setShowDatePicker(false); if (selectedDate) setField('date_declaration', toISODate(selectedDate)); }}
                    onCancel={() => setShowDatePicker(false)}
                  />

                  <Text style={styles.label}>Déclarant (optionnel)</Text>
                  <TouchableOpacity disabled={isLoadingOptions} onPress={() => setShowDeclarantDropdown(!showDeclarantDropdown)} style={styles.dropdown}>
                    <Text style={[styles.dropdownText, !form.id_declarent && styles.placeholderText]}>{getDeclarantName(form.id_declarent)}</Text>
                    <Ionicons name={showDeclarantDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#8E8E93" />
                  </TouchableOpacity>
                  {showDeclarantDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setField('id_declarent', undefined); setShowDeclarantDropdown(false); }}>
                          <Text style={styles.dropdownItemText}>Aucun déclarant</Text>
                        </TouchableOpacity>
                        {users.map((u, index) => (
                          <TouchableOpacity
                            key={u.id}
                            style={[styles.dropdownItem, index === users.length - 1 && styles.dropdownItemLast]}
                            onPress={() => { setField('id_declarent', u.id); setShowDeclarantDropdown(false); }}
                          >
                            <Text style={styles.dropdownItemText}>{`${u.firstname} ${u.lastname}`}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View style={{ height: 12 }} />
                  <TouchableOpacity disabled={isSubmitting} onPress={submitUpdate} style={[styles.primaryButton, isSubmitting && { opacity: 0.6 }]}>
                    <Text style={styles.primaryButtonText}>{isSubmitting ? 'Enregistrement...' : 'Sauvegarder les modifications'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity disabled={isSubmitting} onPress={closeUpdateModal} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Modal>
        )}
        <Modal visible={isDetailsMapVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setIsDetailsMapVisible(false)}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setIsDetailsMapVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Vue Carte</Text>
              <View style={{ width: 24 }} />
            </View>
            <WebView
              source={{ html: getFullViewMapHtml() }}
              style={{ flex: 1 }}
              javaScriptEnabled
            />
          </View>
        </Modal>
        {/* Image Preview Modal */}
        {declaration?.photos && declaration.photos.length > 0 && (
          <Modal visible={isImagePreviewVisible} transparent animationType="fade" onRequestClose={() => setImagePreviewVisible(false)}>
            <ImageViewer
              images={declaration.photos}
              initialIndex={selectedImageIndex}
              onClose={() => setImagePreviewVisible(false)}
            />
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewer = ({ images, initialIndex, onClose }: { images: DeclarationPhoto[], initialIndex: number, onClose: () => void }) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.imageViewerContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentOffset={{ x: initialIndex * screenWidth, y: 0 }}
        style={{ flex: 1 }}
      >
        {images.map((img) => (
          <View key={img.id} style={styles.imageViewerPage}>
            <Image
              source={{ uri: `${API_CONFIG.BASE_URL}${img.photo}` }}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          </View>
        ))}
      </ScrollView>
      <View style={[styles.imageViewerHeader, { top: insets.top }]}>
        <TouchableOpacity onPress={onClose} style={styles.imageViewerClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.imageViewerCounter}>{currentIndex + 1} / {images.length}</Text>
        <View style={{ width: 28 }} />
      </View>
    </View>
  );
};

const DetailItem = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={20} color="#8E8E93" style={styles.detailIcon} />
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E5EA' 
  },
  closeButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },
  headerIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  content: { padding: 16 },
  
  // New Section Styles
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#11224e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Header section
  title: { fontSize: 22, fontWeight: '700', color: '#11224e', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#8E8E93', fontSize: 13 },

  // Severity Section
  severityBarContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    overflow: 'hidden',
    height: 30,
    justifyContent: 'center',
    marginTop: 16,
  },
  severityBarFill: {
    height: '100%',
    position: 'absolute',
  },
  severityText: {
    paddingHorizontal: 12,
    color: '#1C1C1E',
    fontWeight: '600',
    fontSize: 14,
    position: 'relative',
    zIndex: 1
  },

  // Details Grid
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 13,
  },
  detailValue: {
    color: '#11224e',
    fontSize: 14,
    fontWeight: '500',
  },

  // Description
  description: { 
    color: '#3C3C43', 
    fontSize: 15,
    lineHeight: 22, 
  },

  // Location & Map
  mapContainer: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  map: { flex: 1 },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
  },
  mapCoordinates: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },

  // Photos
  photoItem: { width: 120, height: 90, borderRadius: 8, overflow: 'hidden', marginRight: 10 },
  photo: { width: '100%', height: '100%' },

  // Actions
  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f87b1b',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: { 
    color: '#f87b1b',
    fontWeight: '600',
    fontSize: 16
  },
  
  // Styles for the Update Modal (mostly unchanged but kept for completeness)
  severityContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
  },
  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  secondaryButton: { marginTop: 8, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF' },
  secondaryButtonText: { color: '#007AFF', fontWeight: '600' },
  label: { color: '#1C1C1E', fontWeight: '600', marginTop: 12, marginBottom: 8, fontSize: 15 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#1C1C1E' },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { fontSize: 16, color: '#1C1C1E', flex: 1 },
  placeholderText: { color: '#8E8E93' },
  dropdownList: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, marginTop: 4, maxHeight: 200 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemText: { fontSize: 16, color: '#1C1C1E' },
  zoneItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoneSelectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  zoneLogo: { width: 24, height: 24, borderRadius: 4 },
  severityValue: { fontSize: 18, fontWeight: '600' },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  severityBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  severitySlider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  severityDot: { width: 24, height: 24, borderRadius: 11, backgroundColor: '#E5E5EA', borderWidth: 2, borderColor: 'transparent'},
  severityDotActive: {},
  severityDotSelected: { borderColor: '#007AFF' },
  miniMap: { width: '100%', height: '100%' },

  // Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageViewerPage: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  imageViewerHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  imageViewerClose: {
    padding: 8,
  },
  imageViewerCounter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


