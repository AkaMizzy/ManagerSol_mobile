import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import CreateInventaireModal from '../../components/CreateInventaireModal';
import ZoneList from '../../components/ZoneList';
import { useAuth } from '../../contexts/AuthContext';
import inventaireService, { CreateInventaireData, InventaireDeclaration, UserZone } from '../../services/inventaireService';

export default function InventaireScreen() {
  const { user, token } = useAuth();
  const [zones, setZones] = useState<UserZone[]>([]);
  const [declarations, setDeclarations] = useState<InventaireDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
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
    // For now, just show zone details
    const title = zone.zone_title || zone.bloc_title || 'Unknown Zone';
    const subtitle = zone.bloc_title ? `Bloc: ${zone.bloc_title}` : 'Zone';
    Alert.alert(title, subtitle);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader user={user || undefined} />
        <ZoneList 
          zones={[]} 
          onCreateInventaire={handleCreateInventaire}
          onZonePress={handleZonePress}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader user={user || undefined} />
      <ZoneList 
        zones={zones}
        onCreateInventaire={handleCreateInventaire}
        onZonePress={handleZonePress}
      />
      
      <CreateInventaireModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitInventaire}
        zones={zones}
        declarations={declarations}
        loading={creating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
});


