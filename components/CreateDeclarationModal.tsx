import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import API_CONFIG from '../app/config/api';
import { CompanyUser, CreateDeclarationData, DeclarationType, Project, Zone } from '../types/declaration';

interface CreateDeclarationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeclarationData) => Promise<void>;
  declarationTypes: DeclarationType[];
  zones: Zone[];
  projects: Project[];
  companyUsers: CompanyUser[];
  currentUser: CompanyUser;
  isLoading?: boolean;
}

const { width } = Dimensions.get('window');

export default function CreateDeclarationModal({
  visible,
  onClose,
  onSubmit,
  declarationTypes,
  zones,
  projects,
  companyUsers,
  currentUser,
  isLoading = false,
}: CreateDeclarationModalProps) {
  const [formData, setFormData] = useState<CreateDeclarationData>({
    title: '',
    id_declaration_type: '',
    severite: 5,
    id_zone: '',
    description: '',
    date_declaration: '',
    code_declaration: '',
    id_declarent: currentUser?.id,
    latitude: undefined,
    longitude: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showDeclarantDropdown, setShowDeclarantDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  // Photo handling state
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; type: string; name: string }[]>([]);
  
  // Location state
  const [showLocationInput, setShowLocationInput] = useState(false);

  // Date helper functions
  const toISODate = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  const formatDisplayDate = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setFormData({
        title: '',
        id_declaration_type: '',
        severite: 5,
        id_zone: '',
        description: '',
        date_declaration: '',
        code_declaration: '',
        id_declarent: currentUser?.id,
        latitude: undefined,
        longitude: undefined,
      });
      setErrors({});
      setSelectedPhotos([]);
      setShowLocationInput(false);
    }
  }, [visible, currentUser?.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.id_declaration_type) {
      newErrors.id_declaration_type = 'Declaration type is required';
    }
    if (!formData.id_zone) {
      newErrors.id_zone = 'Zone is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.date_declaration) {
      newErrors.date_declaration = 'Declaration date is required';
    }
    if (!formData.code_declaration.trim()) {
      newErrors.code_declaration = 'Declaration code is required';
    }
    if (formData.severite < 0 || formData.severite > 10) {
      newErrors.severite = 'Severity must be between 0 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const dataWithPhotos = {
        ...formData,
        photos: selectedPhotos.length > 0 ? selectedPhotos : undefined
      };
      
      console.log('🔍 Submitting declaration with data:', dataWithPhotos);
      console.log('🔍 Selected photos count:', selectedPhotos.length);
      if (selectedPhotos.length > 0) {
        console.log('🔍 Photo details:', selectedPhotos.map(p => ({ name: p.name, type: p.type, uri: p.uri.substring(0, 50) + '...' })));
      }
      
      await onSubmit(dataWithPhotos);
      onClose();
    } catch (error) {
      console.error('❌ Failed to create declaration:', error);
      Alert.alert('Error', 'Failed to create declaration. Please try again.');
    }
  };

  const getDeclarationTypeTitle = (id: string) => {
    const type = declarationTypes.find(t => t.id === id);
    return type ? type.title : 'Select declaration type';
  };

  const getZoneTitle = (id: string) => {
    const zone = zones.find(z => z.id === id);
    return zone ? zone.title : 'Select zone';
  };

  const getZoneLogo = (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (!zone || !zone.logo) return null;
    return `${API_CONFIG.BASE_URL}${zone.logo}`;
  };

  const getProjectTitle = (id: string) => {
    const project = projects.find(p => p.id === id);
    return project ? project.title : 'Select project';
  };

  const getDeclarantName = (id: string) => {
    // First check if it's the current user
    if (id === currentUser?.id) {
      return `${currentUser.firstname} ${currentUser.lastname}`;
    }
    // Then check company users
    const user = companyUsers.find(u => u.id === id);
    return user ? `${user.firstname} ${user.lastname}` : 'Select declarant';
  };

  const handleLocationToggle = () => {
    setShowLocationInput(!showLocationInput);
  };

  const getCoordinateDisplay = () => {
    if (formData.latitude && formData.longitude) {
      return `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`;
    }
    return 'Open map to select location';
  };

  // OpenStreetMap HTML with Leaflet
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
          position: absolute;
          top: 10px;
          left: 10px;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
        .select-button {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #007AFF;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          z-index: 1000;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="location-info">
        <strong>Selected Location:</strong><br>
        <span id="coordinates">Tap on map to select</span>
      </div>
      <button class="select-button" onclick="selectLocation()">Select This Location</button>
      
      <script>
        let map, marker, selectedLat, selectedLng;
        
        // Initialize map
        map = L.map('map').setView([40.7128, -74.0060], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Handle map clicks
        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          
          // Remove existing marker
          if (marker) {
            map.removeLayer(marker);
          }
          
          // Add new marker
          marker = L.marker([lat, lng]).addTo(map);
          
          // Update coordinates display
          selectedLat = lat;
          selectedLng = lng;
          document.getElementById('coordinates').innerHTML = 
            lat.toFixed(6) + ', ' + lng.toFixed(6);
        });
        
        // Function to select location and send to React Native
        function selectLocation() {
          if (selectedLat !== undefined && selectedLng !== undefined) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationSelected',
              latitude: selectedLat,
              longitude: selectedLng
            }));
          }
        }
        
        // Try to get user's current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Center map on user location
            map.setView([lat, lng], 15);
            
            // Add user location marker
            L.marker([lat, lng])
              .addTo(map)
              .bindPopup('Your current location')
              .openPopup();
          });
        }
      </script>
    </body>
    </html>
  `;

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setFormData(prev => ({
          ...prev,
          latitude: data.latitude,
          longitude: data.longitude,
        }));
        setShowLocationInput(false);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return '#FF3B30'; // High - Red
    if (severity >= 5) return '#FF9500'; // Medium - Orange
    return '#34C759'; // Low - Green
  };

  const getSeverityText = (severity: number) => {
    if (severity >= 7) return 'High';
    if (severity >= 5) return 'Medium';
    return 'Low';
  };

  const updateFormData = (field: keyof CreateDeclarationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to select photos.');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        }));
        
        setSelectedPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newPhoto = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        };
        
        setSelectedPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photos',
      'Choose how you want to add photos',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImages },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Declaration</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={[styles.textInput, errors.title && styles.textAreaError]}
              placeholder="Enter a concise title"
              placeholderTextColor="#8E8E93"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
          </View>

          {/* Declaration Code */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Declaration Code *</Text>
            <TextInput
              style={[styles.textInput, errors.code_declaration && styles.textAreaError]}
              placeholder="Enter declaration code"
              placeholderTextColor="#8E8E93"
              value={formData.code_declaration}
              onChangeText={(value) => updateFormData('code_declaration', value)}
            />
            {errors.code_declaration ? <Text style={styles.errorText}>{errors.code_declaration}</Text> : null}
          </View>
          {/* Declarant */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Declarant *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDeclarantDropdown(!showDeclarantDropdown)}
            >
              <Text style={[
                styles.dropdownText,
                !formData.id_declarent && styles.placeholderText
              ]}>
                {getDeclarantName(formData.id_declarent || '')}
              </Text>
              <Ionicons
                name={showDeclarantDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
            {showDeclarantDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormData('id_declarent', undefined);
                      setShowDeclarantDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>No declarant</Text>
                  </TouchableOpacity>
                  {/* Current user first */}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormData('id_declarent', currentUser.id);
                      setShowDeclarantDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{`${currentUser.firstname} ${currentUser.lastname}`} (You)</Text>
                  </TouchableOpacity>
                  
                  {/* Other company users (excluding current user) */}
                  {companyUsers
                    .filter(user => user.id !== currentUser.id)
                    .map((user, index) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.dropdownItem,
                          index === companyUsers.filter(u => u.id !== currentUser.id).length - 1 && styles.dropdownItemLast
                        ]}
                        onPress={() => {
                          updateFormData('id_declarent', user.id);
                          setShowDeclarantDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{`${user.firstname} ${user.lastname}`}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Location Coordinates */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Location (Optional)</Text>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={handleLocationToggle}
            >
              <Ionicons name="map-outline" size={18} color="#8E8E93" />
              <Text style={[
                styles.mapButtonText,
                !formData.latitude && !formData.longitude && styles.placeholderText
              ]}>
                {getCoordinateDisplay()}
              </Text>
              <Ionicons
                name={showLocationInput ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
            
            {showLocationInput && (
              <View style={styles.mapContainer}>
                <WebView
                  source={{ html: mapHtml }}
                  style={styles.map}
                  onMessage={handleMapMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                  bounces={false}
                />
                <View style={styles.mapInstructions}>
                  <Text style={styles.mapInstructionsText}>
                    Tap anywhere on the map to select location, then tap &quot;Select This Location&quot;
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Declaration Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Declaration Date *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.date_declaration && styles.dropdownError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
              <Text style={[
                styles.dropdownText,
                !formData.date_declaration && styles.placeholderText
              ]}>
                {formData.date_declaration ? formatDisplayDate(formData.date_declaration) : 'Select declaration date'}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={formData.date_declaration ? new Date(formData.date_declaration) : new Date()}
              maximumDate={new Date()} // Cannot select future dates
              onConfirm={(selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) updateFormData('date_declaration', toISODate(selectedDate));
              }}
              onCancel={() => setShowDatePicker(false)}
            />
            {errors.date_declaration ? <Text style={styles.errorText}>{errors.date_declaration}</Text> : null}
          </View>

          {/* Declaration Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Declaration Type *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.id_declaration_type && styles.dropdownError]}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={[
                styles.dropdownText,
                !formData.id_declaration_type && styles.placeholderText
              ]}>
                {getDeclarationTypeTitle(formData.id_declaration_type)}
              </Text>
              <Ionicons
                name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {declarationTypes.map((type, index) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.dropdownItem,
                        index === declarationTypes.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => {
                        updateFormData('id_declaration_type', type.id);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {errors.id_declaration_type && (
              <Text style={styles.errorText}>{errors.id_declaration_type}</Text>
            )}
          </View>

          {/* Severity */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Severity *</Text>
            <View style={styles.severityContainer}>
              <View style={styles.severityHeader}>
                <Text style={[styles.severityValue, { color: getSeverityColor(formData.severite) }]}>
                  {formData.severite}/10
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(formData.severite) }]}>
                  <Text style={styles.severityBadgeText}>{getSeverityText(formData.severite)}</Text>
                </View>
              </View>
              <View style={styles.severitySlider}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.severityDot,
                      formData.severite >= value && [styles.severityDotActive, { backgroundColor: getSeverityColor(formData.severite) }],
                      formData.severite === value && [styles.severityDotSelected, { borderColor: getSeverityColor(formData.severite) }],
                    ]}
                    onPress={() => updateFormData('severite', value)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>
            {errors.severite && (
              <Text style={styles.errorText}>{errors.severite}</Text>
            )}
          </View>

          {/* Project */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Project *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowProjectDropdown(!showProjectDropdown)}
            >
              <Text style={[
                styles.dropdownText,
                !formData.id_project && styles.placeholderText
              ]}>
                {getProjectTitle(formData.id_project || '')}
              </Text>
              <Ionicons
                name={showProjectDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
            {showProjectDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormData('id_project', undefined);
                      setShowProjectDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>No project</Text>
                  </TouchableOpacity>
                  {projects.map((project, index) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.dropdownItem,
                        index === projects.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => {
                        updateFormData('id_project', project.id);
                        setShowProjectDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{project.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Zone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Zone *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.id_zone && styles.dropdownError]}
              onPress={() => setShowZoneDropdown(!showZoneDropdown)}
            >
              {formData.id_zone ? (
                <View style={styles.zoneSelectedRow}>
                  {getZoneLogo(formData.id_zone) && (
                    <Image
                      source={{ uri: getZoneLogo(formData.id_zone)! }}
                      style={styles.zoneLogo}
                    />
                  )}
                  <Text style={styles.dropdownText}>{getZoneTitle(formData.id_zone)}</Text>
                </View>
              ) : (
                <Text style={[styles.dropdownText, styles.placeholderText]}>Select zone</Text>
              )}
              <Ionicons
                name={showZoneDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
            {showZoneDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {zones.map((zone, index) => (
                    <TouchableOpacity
                      key={zone.id}
                      style={[
                        styles.dropdownItem,
                        index === zones.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => {
                        updateFormData('id_zone', zone.id);
                        setShowZoneDropdown(false);
                      }}
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
            {errors.id_zone && (
              <Text style={styles.errorText}>{errors.id_zone}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[
                styles.textArea,
                errors.description && styles.textAreaError
              ]}
              placeholder="Describe the issue or request..."
              placeholderTextColor="#8E8E93"
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Photo Upload */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Photos (Optional)</Text>
            
            {/* Add Photo Button */}
            <TouchableOpacity style={styles.photoUpload} onPress={showPhotoOptions}>
              <Ionicons name="camera-outline" size={24} color="#8E8E93" />
              <Text style={styles.photoUploadText}>Add photos</Text>
            </TouchableOpacity>
            
            {/* Selected Photos Grid */}
            {selectedPhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {selectedPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <Text style={styles.photoUploadHint}>
              {selectedPhotos.length > 0 
                ? `${selectedPhotos.length} photo(s) selected`
                : 'Tap to add photos from camera or gallery'
              }
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>Creating...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Create Declaration</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownError: {
    borderColor: '#FF3B30',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dropdownItemLast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  zoneItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  zoneLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  severityContainer: {
    alignItems: 'center',
  },
  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  severityValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 0,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  severitySlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  severityDotActive: {
    borderColor: '#E5E5EA',
  },
  severityDotSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 100,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textAreaError: {
    borderColor: '#FF3B30',
  },
  photoUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    gap: 8,
  },
  photoUploadText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  photoUploadHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  photoItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Map styles
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  mapButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
    marginLeft: 8,
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  map: {
    height: 400,
    width: '100%',
    borderRadius: 8,
  },
  mapInstructions: {
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  mapInstructionsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

});
