import API_CONFIG from '@/app/config/api';
import AppHeader from '@/components/AppHeader';
import CreateManifolderModal from '@/components/CreateManifolderModal';
import ManifoldDetails from '@/components/ManifoldDetails';
import ManifolderQuestions from '@/components/ManifolderQuestions';
import { useAuth } from '@/contexts/AuthContext';
import manifolderService from '@/services/manifolderService';
import { Project, Zone } from '@/types/declaration';
import { ManifolderListItem, ManifolderType } from '@/types/manifolder';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function ManifolderTab() {
  const { token, user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [types, setTypes] = useState<ManifolderType[]>([]);
  const [manifolders, setManifolders] = useState<ManifolderListItem[]>([]);
  
  // View states
  const [currentView, setCurrentView] = useState<'list' | 'questions' | 'details'>('list');
  const [selectedManifoler, setSelectedManifolder] = useState<string | null>(null);
  const [selectedManifolderData, setSelectedManifolderData] = useState<ManifolderListItem | undefined>(undefined);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const [projectId, setProjectId] = useState<string>('');
  const [zoneId, setZoneId] = useState<string>('');
  const [typeId, setTypeId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [heurD, setHeurD] = useState<Date | null>(null);
  const [heurF, setHeurF] = useState<Date | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeD, setShowTimeD] = useState(false);
  const [showTimeF, setShowTimeF] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);


  const getZoneLogo = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone?.logo) {
      return `${API_CONFIG.BASE_URL}${zone.logo}`;
    }
    return null;
  };


  const filteredZones = useMemo(() => {
    if (!projectId) return [];
    return zones.filter(z => (z as any).id_project ? (z as any).id_project === projectId : true);
  }, [zones, projectId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const [prj, zn, tp, mf] = await Promise.all([
          manifolderService.getCompanyProjects(token!),
          manifolderService.getZones(token!),
          manifolderService.getManifolderTypes(token!),
          manifolderService.getManifolders({}, token!),
        ]);
        if (!mounted) return;
        setProjects(prj);
        setZones(zn);
        setTypes(tp);
        setManifolders(mf);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [token]);

  const handleCreateSuccess = async (result: { manifolderId: string; code_formatted: string }) => {
    setIsCreateModalVisible(false);

    try {
      // Re-fetch the list to get all data for the new item
      const updatedManifolders = await manifolderService.getManifolders({}, token!);
      setManifolders(updatedManifolders);

      // Find the full data object for the newly created manifolder
      const newManifolderData = updatedManifolders.find(m => m.id === result.manifolderId);

      if (result.manifolderId && newManifolderData) {
        // Set both the ID and the data object for the new manifolder
        setSelectedManifolder(result.manifolderId);
        setSelectedManifolderData(newManifolderData);
        setCurrentView('questions');
        
        Alert.alert(
          'Manifolder créé avec succès!',
          `Le manifolder ${result.code_formatted} a été créé. Vous pouvez maintenant répondre aux questions et ajouter des signatures.`,
          [
            { text: 'Retour à la liste', onPress: handleBackToList },
            { text: 'Continuer', style: 'default' }
          ]
        );
      } else {
        // Fallback if the new manifolder isn't found
        Alert.alert('Succès', 'Manifolder créé avec succès. Rafraîchissement de la liste...');
        const refreshedManifolders = await manifolderService.getManifolders({}, token!);
        setManifolders(refreshedManifolders);
      }
    } catch (e){
      console.log('Failed to reload manifolders', e);
      Alert.alert('Erreur', 'Impossible de rafraîchir la liste des manifolders.');
    }
  };

  const handleManifolderSelect = (manifolderId: string, manifolderData?: ManifolderListItem) => {
    setSelectedManifolder(manifolderId);
    setSelectedManifolderData(manifolderData);
    setCurrentView('details');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedManifolder(null);
    setSelectedManifolderData(undefined);
  };

  const handleGoToQuestions = () => {
    setCurrentView('questions');
  };

  const handleQuestionsComplete = () => {
    Alert.alert(
      'Success!',
      'Your answers have been submitted successfully.',
      [{ text: 'OK', onPress: handleBackToList }]
    );
  };

  const renderManifolderList = () => (
    <View style={styles.body}>
      <View style={styles.manifoldersSection}>
      <View style={styles.sectionHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icons/manifolder.png')}
              style={styles.manifolderLogo}
              resizeMode="contain"
            />
          </View>
          <Pressable onPress={() => setIsCreateModalVisible(true)} style={styles.createButton}>
          <Ionicons name="add-circle" size={20} color="#f87b1b" />
              <Text style={styles.createButtonText}>Ajouter</Text>
            </Pressable>
          </View>
        {manifolders.length > 0 ? (
          <ScrollView style={styles.manifoldersList} showsVerticalScrollIndicator={false}>
            {manifolders.map((manifolder) => (
              <TouchableOpacity
                key={manifolder.id}
                style={styles.manifolderCard}
                onPress={() => handleManifolderSelect(manifolder.id, manifolder)}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardType}>
                    <Ionicons name="document-text-outline" size={14} color="#11224e" />
                    <Text style={styles.cardTypeText}>{manifolder.type_title}</Text>
                  </View>
                  <View style={styles.statusTag}>
                    <Text style={styles.statusTagText}>{manifolder.code_formatted}</Text>
                  </View>
                </View>
                <Text style={styles.manifolderTitle}>{manifolder.title}</Text>
                <View style={styles.cardSeparator} />
                <View style={styles.cardDetailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="briefcase-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText} numberOfLines={1}>{manifolder.project_title}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText} numberOfLines={1}>{manifolder.zone_title}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color="#f87b1b" />
                    <Text style={styles.detailDate}>{manifolder.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="file-tray-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>Aucun Manifolder</Text>
            <Text style={styles.emptyStateSubtitle}>Appuyez sur &apos;Ajouter&apos; pour en créer un nouveau.</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#11224e" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader user={user || undefined} />

      {currentView === 'questions' && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable onPress={handleBackToList} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11224e" />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{selectedManifolderData?.title || 'Questions'}</Text>
              <View style={styles.headerDetails}>
                <View style={styles.headerDetailItem}>
                  <Text style={styles.headerDetailIcon}>🏢</Text>
                  <Text style={styles.headerDetailText} numberOfLines={1}>{selectedManifolderData?.project_title || 'No project'}</Text>
                </View>
                <View style={styles.headerDetailSeparator} />
                <View style={styles.headerDetailItem}>
                  <Text style={styles.headerDetailIcon}>📍</Text>
                  <Text style={styles.headerDetailText} numberOfLines={1}>{selectedManifolderData?.zone_title || 'No zone'}</Text>
                </View>
                <View style={styles.headerDetailSeparator} />
                <View style={styles.headerDetailItem}>
                  <Text style={styles.headerDetailIcon}>📋</Text>
                  <Text style={styles.headerDetailText} numberOfLines={1}>{selectedManifolderData?.type_title || 'No type'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {currentView === 'list' ? renderManifolderList() : currentView === 'details' ? (
        selectedManifoler && (
          <ManifoldDetails
            manifolderId={selectedManifoler}
            manifolderData={selectedManifolderData}
            onBack={handleBackToList}
            onGoToQuestions={handleGoToQuestions}
          />
        )
      ) : (
        selectedManifoler && (
          <ManifolderQuestions
            manifolderId={selectedManifoler}
            manifolderData={selectedManifolderData}
            onComplete={handleQuestionsComplete}
          />
        )
      )}

      <CreateManifolderModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        projects={projects}
        zones={zones}
        types={types}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContentDetails: {
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#11224e',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
  headerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  headerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  headerDetailIcon: {
    fontSize: 16,
  },
  headerDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  headerDetailSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87b1b',
    marginLeft: 6,
  },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  manifolderLogo: {
    width: 40,
    height: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    color: '#11224e',
    marginTop: 12,
    marginBottom: 6,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdownContainer: {
    marginBottom: 8,
  },
  selectHeader: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    color: '#1C1C1E',
  },
  checkMark: {
    color: '#34C759',
    fontWeight: '700',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  inputText: {
    color: '#111',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11224e',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  secondaryText: {
    color: '#11224e',
    fontWeight: '600',
    fontSize: 16,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
  },
  zoneLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  // New styles for manifolder list
  manifoldersSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f87b1b',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11224e',
  },
  manifoldersList: {
    flex: 1,
  },
  manifolderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#11224e',
  },
  statusTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagText: {
    color: '#f87b1b',
    fontSize: 12,
    fontWeight: '600',
  },
  manifolderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11224e',
    marginBottom: 12,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flexShrink: 1,
  },
  detailDate: {
    fontSize: 12,
    color: '#f87b1b',
    fontWeight: '500',
    flexShrink: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: -50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});


