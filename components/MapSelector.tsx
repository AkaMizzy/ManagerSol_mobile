import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface MapSelectorProps {
  value?: { latitude: number; longitude: number } | null;
  onLocationSelect: (latitude: number, longitude: number) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function MapSelector({
  value,
  onLocationSelect,
  placeholder = 'Select location',
  compact = true,
}: MapSelectorProps) {
  const [showMapModal, setShowMapModal] = useState(false);

  // Generate the main interactive map HTML
  const getMapHtml = () => {
    const defaultLat = value?.latitude ?? 33.5731; // Casablanca default
    const defaultLng = value?.longitude ?? -7.5898;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          #map { width: 100%; height: 100vh; }
          .location-info {
            position: absolute;
            top: 15px;
            left: 15px;
            background: white;
            padding: 12px 16px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-size: 14px;
            max-width: 250px;
          }
          .location-info strong {
            color: #1C1C1E;
            display: block;
            margin-bottom: 4px;
          }
          .coordinates {
            color: #007AFF;
            font-weight: 600;
            font-family: monospace;
          }
          .select-button {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #007AFF;
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            z-index: 1000;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
            transition: all 0.2s ease;
          }
          .select-button:hover {
            background: #0056CC;
            transform: translateX(-50%) scale(1.02);
          }
          .select-button:disabled {
            background: #8E8E93;
            cursor: not-allowed;
            transform: translateX(-50%) scale(1);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="location-info">
          <strong>Selected Location</strong>
          <div class="coordinates" id="coordinates">Tap on map to select</div>
        </div>
        <button class="select-button" id="selectBtn" onclick="selectLocation()" disabled>
          Select This Location
        </button>
        
        <script>
          let map, marker, selectedLat, selectedLng;
          const selectBtn = document.getElementById('selectBtn');
          
          // Initialize map
          map = L.map('map').setView([${defaultLat}, ${defaultLng}], ${value ? 15 : 13});
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          // Add existing location marker if value exists
          ${value ? `
            marker = L.marker([${value.latitude}, ${value.longitude}]).addTo(map);
            selectedLat = ${value.latitude};
            selectedLng = ${value.longitude};
            document.getElementById('coordinates').innerHTML = 
              '${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}';
            selectBtn.disabled = false;
            selectBtn.style.background = '#007AFF';
          ` : ''}
          
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
            
            // Enable select button
            selectBtn.disabled = false;
            selectBtn.style.background = '#007AFF';
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
          
          // Try to get user's current location on first load
          if (!${!!value} && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              
              // Center map on user location
              map.setView([lat, lng], 15);
              
              // Add user location indicator (different from selectable marker)
              const userIcon = L.divIcon({
                className: 'user-location',
                html: '<div style="background: #007AFF; border: 3px solid white; border-radius: 50%; width: 12px; height: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
                iconSize: [18, 18],
                iconAnchor: [9, 9]
              });
              
              L.marker([lat, lng], { icon: userIcon })
                .addTo(map)
                .bindPopup('Your current location')
                .openPopup();
            }, function(error) {
              console.log('Geolocation error:', error);
            });
          }
        </script>
      </body>
      </html>
    `;
  };

  // Generate mini map preview HTML
  const getMiniMapHtml = () => {
    if (!value) return '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #miniMap { height: 100%; margin: 0; padding: 0; }
          #miniMap { width: 100%; }
          .leaflet-control-container { display: none; }
        </style>
      </head>
      <body>
        <div id="miniMap"></div>
        <script>
          const miniMap = L.map('miniMap', { 
            zoomControl: false, 
            attributionControl: false,
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false
          }).setView([${value.latitude}, ${value.longitude}], 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
          L.marker([${value.latitude}, ${value.longitude}]).addTo(miniMap);
          
          setTimeout(() => { 
            miniMap.invalidateSize(); 
          }, 100);
        </script>
      </body>
      </html>
    `;
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        onLocationSelect(data.latitude, data.longitude);
        setShowMapModal(false);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const getCoordinateDisplay = () => {
    if (value?.latitude && value?.longitude) {
      return `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`;
    }
    return placeholder;
  };

  const clearLocation = () => {
    onLocationSelect(0, 0); // We'll handle this as "cleared" in the parent
  };

  return (
    <View style={styles.container}>
      {/* Main selector button */}
      <Pressable
        style={styles.selectorButton}
        onPress={() => setShowMapModal(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons 
            name="location-outline" 
            size={20} 
            color={value ? "#007AFF" : "#8E8E93"} 
          />
          <Text style={[
            styles.selectorText,
            !value && styles.placeholderText
          ]}>
            {getCoordinateDisplay()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
      </Pressable>

      {/* Mini map preview */}
      {value && value.latitude !== 0 && value.longitude !== 0 && (
        <View style={styles.previewContainer}>
          <WebView
            source={{ html: getMiniMapHtml() }}
            style={styles.miniMap}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            pointerEvents="none"
          />
          <Pressable style={styles.clearButton} onPress={clearLocation}>
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </Pressable>
        </View>
      )}

      {/* Full-screen map modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setShowMapModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </Pressable>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Map */}
          <WebView
            source={{ html: getMapHtml() }}
            style={styles.fullMap}
            onMessage={handleMapMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={false}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  selectorText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  previewContainer: {
    marginTop: 8,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
  },
  fullMap: {
    flex: 1,
  },
});
