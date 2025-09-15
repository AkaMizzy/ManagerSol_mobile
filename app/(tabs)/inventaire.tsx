import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import CreateInventaireModal from '../../components/CreateInventaireModal';
import ZoneInventaireViewer from '../../components/ZoneInventaireViewer';
import ZoneList from '../../components/ZoneList';
import { useAuth } from '../../contexts/AuthContext';
import inventaireService, { CreateInventaireData, InventaireDeclaration, UserZone } from '../../services/inventaireService';

export default function InventaireScreen() {
  const { user, token } = useAuth();
  const [zones, setZones] = useState<UserZone[]>([]);
  const [declarations, setDeclarations] = useState<InventaireDeclaration[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedZone, setSelectedZone] = useState<UserZone | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      const [zonesData, declarationsData] = await Promise.all([
        inventaireService.getUserZones(token),
        inventaireService.getInventaireDeclarations(token),
      ]);

      setZones(zonesData);
      setDeclarations(declarationsData);
    } catch (error) {
      console.error('Error loading inventaire data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleCreateInventaire = useCallback(() => {
    if (declarations.length === 0) {
      Alert.alert('No Inventaires Available', 'There are no inventaire declarations available. Please contact your administrator.');
      return;
    }
    setModalVisible(true);
  }, [declarations]);

  const handleSubmitInventaire = useCallback(async (data: CreateInventaireData) => {
    if (!token) return;

    setCreating(true);
    try {
      await inventaireService.createInventaireZone(data, token);
      Alert.alert('Success', 'Inventaire created successfully!');
      // Refresh data to show the new inventaire
      await loadData();
    } catch (error) {
      console.error('Error creating inventaire:', error);
      Alert.alert('Error', 'Failed to create inventaire. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [token, loadData]);

  const handleZonePress = useCallback((zone: UserZone) => {
    setSelectedZone(zone);
    setViewerVisible(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader user={user || undefined} />
      <View style={styles.content}>
        <ZoneList 
          zones={zones}
          onCreateInventaire={handleCreateInventaire}
          onZonePress={handleZonePress}
        />
      </View>
      
      <CreateInventaireModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitInventaire}
        zones={zones}
        declarations={declarations}
        loading={creating}
      />

      <ZoneInventaireViewer
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        zone={selectedZone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  content: {
    flex: 1,
  },
});


