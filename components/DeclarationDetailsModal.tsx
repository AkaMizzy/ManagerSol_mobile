import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import API_CONFIG from '../app/config/api';
import { useAuth } from '../contexts/AuthContext';
import declarationService from '../services/declarationService';
import { CompanyUser, Declaration, DeclarationType, Project, Zone } from '../types/declaration';

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

  // Form state (title is read-only per backend PUT support)
  const [form, setForm] = useState({
    id_declaration_type: '',
    severite: 5,
    id_zone: '',
    description: '',
    date_declaration: '',
    code_declaration: '',
    id_declarent: '' as string | undefined,
    id_project: '' as string | undefined,
    latitude: '' as string | undefined,
    longitude: '' as string | undefined,
  });

  // Options
  const [types, setTypes] = useState<DeclarationType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showDeclarantDropdown, setShowDeclarantDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  const selectedTypeTitle = useMemo(() => {
    const t = types.find(x => x.id === form.id_declaration_type);
    return t ? t.title : 'Select type';
  }, [types, form.id_declaration_type]);

  const selectedZoneTitle = useMemo(() => {
    const z = zones.find(x => x.id === form.id_zone);
    return z ? z.title : 'Select zone';
  }, [zones, form.id_zone]);

  const selectedProjectTitle = useMemo(() => {
    const p = projects.find(x => x.id === form.id_project);
    return p ? p.title : '—';
  }, [projects, form.id_project]);

  const selectedDeclarantName = useMemo(() => {
    const u = users.find(x => x.id === form.id_declarent);
    return u ? `${u.firstname} ${u.lastname}` : '—';
  }, [users, form.id_declarent]);

  useEffect(() => {
    if (!declaration) return;
    setForm({
      id_declaration_type: declaration.id_declaration_type,
      severite: declaration.severite,
      id_zone: declaration.id_zone,
      description: declaration.description,
      date_declaration: declaration.date_declaration,
      code_declaration: declaration.code_declaration,
      id_declarent: declaration.id_declarent || undefined,
      id_project: declaration.id_project || undefined,
      latitude: declaration.latitude != null ? String(declaration.latitude) : undefined,
      longitude: declaration.longitude != null ? String(declaration.longitude) : undefined,
    });
  }, [declaration]);

  useEffect(() => {
    if (!isUpdateVisible || !token) return;
    let isMounted = true;
    setIsLoadingOptions(true);
    Promise.all([
      declarationService.getDeclarationTypes(token),
      declarationService.getZones(token),
      declarationService.getCompanyProjects(token),
      declarationService.getCompanyUsers(token),
    ])
      .then(([t, z, p, u]) => {
        if (!isMounted) return;
        setTypes(t);
        setZones(z);
        setProjects(p);
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
    if (!form.date_declaration) return 'Date is required';
    const date = new Date(form.date_declaration);
    if (isNaN(date.getTime())) return 'Invalid date format (use YYYY-MM-DD)';
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (date > endOfToday) return 'Date cannot be in the future';
    if (form.severite < 0 || form.severite > 10) return 'Severity must be between 0 and 10';
    if (form.latitude !== undefined && form.latitude !== '') {
      const lat = Number(form.latitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
    }
    if (form.longitude !== undefined && form.longitude !== '') {
      const lng = Number(form.longitude);
      if (Number.isNaN(lng) || lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
    }
    if (!form.id_declaration_type) return 'Declaration type is required';
    if (!form.id_zone) return 'Zone is required';
    if (!form.description) return 'Description is required';
    if (!form.code_declaration) return 'Code is required';
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
        id_zone: form.id_zone,
        description: form.description,
        date_declaration: form.date_declaration,
        code_declaration: form.code_declaration,
      };
      if (form.id_declarent !== undefined && form.id_declarent !== '') payload.id_declarent = form.id_declarent;
      if (form.id_project !== undefined && form.id_project !== '') payload.id_project = form.id_project;
      if (form.latitude !== undefined && form.latitude !== '') payload.latitude = Number(form.latitude);
      if (form.longitude !== undefined && form.longitude !== '') payload.longitude = Number(form.longitude);

      await declarationService.updateDeclaration(declaration.id, payload, token);
      Alert.alert('Success', 'Declaration updated successfully');
      closeUpdateModal();
      onClose();
    } catch (e: any) {
      Alert.alert('Update failed', e?.message || 'Please try again');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helpers similar to CreateDeclarationModal for consistent UI
  function getDeclarationTypeTitle(id: string) {
    const type = types.find(t => t.id === id);
    return type ? type.title : 'Select declaration type';
  }

  function getZoneTitle(id: string) {
    const zone = zones.find(z => z.id === id);
    return zone ? zone.title : 'Select zone';
  }

  function getZoneLogo(id: string) {
    const zone = zones.find(z => z.id === id);
    if (!zone || !zone.logo) return null;
    return `${API_CONFIG.BASE_URL}${zone.logo}`;
  }

  function getProjectTitle(id?: string) {
    if (!id) return 'Select project';
    const project = projects.find(p => p.id === id);
    return project ? project.title : 'Select project';
  }

  function getDeclarantName(id?: string) {
    if (!id) return 'Select declarant';
    const user = users.find(u => u.id === id);
    return user ? `${user.firstname} ${user.lastname}` : 'Select declarant';
  }

  function getSeverityColor(severity: number) {
    if (severity >= 7) return '#FF3B30';
    if (severity >= 5) return '#FF9500';
    return '#34C759';
  }

  function getSeverityText(severity: number) {
    if (severity >= 7) return 'High';
    if (severity >= 5) return 'Medium';
    return 'Low';
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
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
        .location-info {
          position: absolute; top: 10px; left: 10px; background: white; padding: 10px; border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000; font-family: Arial, sans-serif; font-size: 14px;
        }
        .select-button {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: #007AFF; color: white; border: none; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: bold; z-index: 1000; cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="location-info"><strong>Selected Location:</strong><br><span id="coordinates">Tap on map to select</span></div>
      <button class="select-button" onclick="selectLocation()">Select This Location</button>
      <script>
        let map, marker, selectedLat, selectedLng;
        map = L.map('map').setView([33.5731, -7.5898], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
        map.on('click', function(e) {
          const lat = e.latlng.lat; const lng = e.latlng.lng;
          if (marker) { map.removeLayer(marker); }
          marker = L.marker([lat, lng]).addTo(map);
          selectedLat = lat; selectedLng = lng;
          document.getElementById('coordinates').innerHTML = lat.toFixed(6) + ', ' + lng.toFixed(6);
        });
        function selectLocation() {
          if (selectedLat !== undefined && selectedLng !== undefined) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'locationSelected', latitude: selectedLat, longitude: selectedLng }));
          }
        }
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude; const lng = position.coords.longitude;
            map.setView([lat, lng], 15);
            L.marker([lat, lng]).addTo(map).bindPopup('Your current location').openPopup();
          });
        }
      </script>
    </body>
    </html>
  `;

  function handleMapMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setField('latitude', String(data.latitude));
        setField('longitude', String(data.longitude));
        setIsMapModalVisible(false);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  }

  function getMiniMapHtml() {
    const lat = form.latitude ? Number(form.latitude) : 33.5731;
    const lng = form.longitude ? Number(form.longitude) : -7.5898;
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

  function getCoordinateDisplay() {
    if (form.latitude && form.longitude) {
      const lat = Number(form.latitude);
      const lng = Number(form.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    }
    return 'Tap map to select location';
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

  const renderPhotos = () => {
    if (!declaration?.photos || declaration.photos.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {declaration.photos.map((p) => (
            <View key={p.id} style={styles.photoItem}>{renderPhoto(p.photo)}</View>
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
          <View style={{ width: 24 }} />
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
            <View style={styles.severityContainer}>
              <View style={[styles.severityBar, { width: `${declaration.severite * 10}%`, backgroundColor: getSeverityColor(declaration.severite) }]} />
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
                <DetailItem label="Project" value={declaration.project_title || '—'} icon="briefcase-outline" />
              </View>
              <View style={styles.detailRow}>
                <DetailItem label="Company" value={declaration.company_title || '—'} icon="business-outline" />
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
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Update Declaration</Text>
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
                <Text style={styles.headerTitle}>Update Declaration</Text>
                <View style={{ width: 24 }} />
              </View>
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                  <Text style={styles.label}>Title (read-only)</Text>
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

                  <Text style={styles.label}>Severity *</Text>
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

                  <Text style={styles.label}>Zone</Text>
                  <TouchableOpacity disabled={isLoadingOptions} onPress={() => setShowZoneDropdown(!showZoneDropdown)} style={styles.dropdown}>
                    {form.id_zone ? (
                      <View style={styles.zoneSelectedRow}>
                        {getZoneLogo(form.id_zone) && (
                          <Image source={{ uri: getZoneLogo(form.id_zone)! }} style={styles.zoneLogo} />
                        )}
                        <Text style={styles.dropdownText}>{getZoneTitle(form.id_zone)}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.dropdownText, styles.placeholderText]}>Select zone</Text>
                    )}
                    <Ionicons name={showZoneDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#8E8E93" />
                  </TouchableOpacity>
                  {showZoneDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {zones.map((zone, index) => (
                          <TouchableOpacity
                            key={zone.id}
                            style={[styles.dropdownItem, index === zones.length - 1 && styles.dropdownItemLast]}
                            onPress={() => { setField('id_zone', zone.id); setShowZoneDropdown(false); }}
                          >
                            <View style={styles.zoneItemRow}>
                              {zone.logo ? (
                                <Image source={{ uri: `${API_CONFIG.BASE_URL}${zone.logo}` }} style={styles.zoneLogo} />
                              ) : null}
                              <Text style={styles.dropdownItemText}>{zone.title}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(v) => setField('description', v)}
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    multiline
                  />

                  <Text style={styles.label}>Declaration Date *</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                    <Text style={[styles.dropdownText, !form.date_declaration && styles.placeholderText]}>
                      {form.date_declaration ? formatDisplayDate(form.date_declaration) : 'Select declaration date'}
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

                  <Text style={styles.label}>Code</Text>
                  <TextInput value={form.code_declaration} onChangeText={(v) => setField('code_declaration', v)} style={styles.input} />

                  <Text style={styles.label}>Declarant (optional)</Text>
                  <TouchableOpacity disabled={isLoadingOptions} onPress={() => setShowDeclarantDropdown(!showDeclarantDropdown)} style={styles.dropdown}>
                    <Text style={[styles.dropdownText, !form.id_declarent && styles.placeholderText]}>{getDeclarantName(form.id_declarent)}</Text>
                    <Ionicons name={showDeclarantDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#8E8E93" />
                  </TouchableOpacity>
                  {showDeclarantDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setField('id_declarent', undefined); setShowDeclarantDropdown(false); }}>
                          <Text style={styles.dropdownItemText}>No declarant</Text>
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

                  <Text style={styles.label}>Project (optional)</Text>
                  <TouchableOpacity disabled={isLoadingOptions} onPress={() => setShowProjectDropdown(!showProjectDropdown)} style={styles.dropdown}>
                    <Text style={[styles.dropdownText, !form.id_project && styles.placeholderText]}>{getProjectTitle(form.id_project)}</Text>
                    <Ionicons name={showProjectDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#8E8E93" />
                  </TouchableOpacity>
                  {showProjectDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setField('id_project', undefined); setShowProjectDropdown(false); }}>
                          <Text style={styles.dropdownItemText}>No project</Text>
                        </TouchableOpacity>
                        {projects.map((p, index) => (
                          <TouchableOpacity
                            key={p.id}
                            style={[styles.dropdownItem, index === projects.length - 1 && styles.dropdownItemLast]}
                            onPress={() => { setField('id_project', p.id); setShowProjectDropdown(false); }}
                          >
                            <Text style={styles.dropdownItemText}>{p.title}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <Text style={styles.label}>Location</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setIsMapModalVisible(true)}>
                    <Ionicons name="map-outline" size={18} color="#8E8E93" />
                    <Text style={[styles.dropdownText, !(form.latitude && form.longitude) && styles.placeholderText]}>
                      {getCoordinateDisplay()}
                    </Text>
                    <Ionicons name={'chevron-forward'} size={20} color="#8E8E93" />
                  </TouchableOpacity>

                  <View style={{ height: 12 }} />
                  <TouchableOpacity disabled={isSubmitting} onPress={submitUpdate} style={[styles.primaryButton, isSubmitting && { opacity: 0.6 }]}>
                    <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving...' : 'Save changes'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity disabled={isSubmitting} onPress={closeUpdateModal} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
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
              <Text style={styles.headerTitle}>Map View</Text>
              <View style={{ width: 24 }} />
            </View>
            <WebView
              source={{ html: getFullViewMapHtml() }}
              style={{ flex: 1 }}
              javaScriptEnabled
            />
          </View>
        </Modal>
        {isMapModalVisible && (
            <Modal visible={isMapModalVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setIsMapModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setIsMapModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#1C1C1E" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Select Location</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <WebView
                        source={{ html: mapHtml }}
                        style={{ flex: 1 }}
                        onMessage={handleMapMessage}
                        javaScriptEnabled
                        domStorageEnabled
                        startInLoadingState
                    />
                </View>
            </Modal>
        )}
      </View>
    </Modal>
  );
}

const DetailItem = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={20} color="#8E8E93" style={styles.detailIcon} />
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

function severityBadgeColor(sev: number) {
  if (sev >= 7) return { backgroundColor: '#FF3B30' };
  if (sev >= 5) return { backgroundColor: '#FF9500' };
  return { backgroundColor: '#34C759' };
}

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
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  content: { padding: 16 },
  
  // New Section Styles
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Header section
  title: { fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#8E8E93', fontSize: 13 },

  // Severity Section
  severityContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    overflow: 'hidden',
    height: 30,
    justifyContent: 'center',
    marginTop: 16,
  },
  severityBar: {
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
    color: '#1C1C1E',
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
    backgroundColor: '#11224e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: { 
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  },
  
  // Styles for the Update Modal (mostly unchanged but kept for completeness)
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
  severityDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E5EA', borderWidth: 2, borderColor: 'transparent' },
  severityDotActive: {},
  severityDotSelected: { borderColor: '#007AFF' },
  miniMap: { width: '100%', height: '100%' },
});


