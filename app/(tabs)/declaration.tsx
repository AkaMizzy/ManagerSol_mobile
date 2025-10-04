import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionsModal from '../../components/ActionsModal';
import AppHeader from '../../components/AppHeader';
import ChatModal from '../../components/ChatModal';
import CreateDeclarationModal from '../../components/CreateDeclarationModal';
import DeclarationCard from '../../components/DeclarationCard';
import DeclarationDetailsModal from '../../components/DeclarationDetailsModal';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import declarationService from '../../services/declarationService';
import { CompanyUser, CreateDeclarationData, Declaration, DeclarationType, Project, Zone } from '../../types/declaration';

export default function DeclarationScreen() {
  const { user, token } = useAuth();
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [actionsForDeclaration, setActionsForDeclaration] = useState<import('../../types/declaration').DeclarationAction[] | null>(null);
  
  // New state for create declaration modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [declarationTypes, setDeclarationTypes] = useState<DeclarationType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [severityPickerVisible, setSeverityPickerVisible] = useState(false);

  // Load declarations and required data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Load data in parallel
      const [declarationsData, typesData, zonesData, projectsData, usersData] = await Promise.all([
        declarationService.getDeclarations(token),
        declarationService.getDeclarationTypes(token),
        declarationService.getZones(token),
        declarationService.getCompanyProjects(token),
        declarationService.getCompanyUsers(token),
      ]);
      
      setDeclarations(declarationsData);
      setDeclarationTypes(typesData);
      setZones(zonesData);
      setProjects(projectsData);
      setCompanyUsers(usersData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Erreur', 'Échec du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const loadDeclarations = async () => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('No authentication token available');
      }
      const data = await declarationService.getDeclarations(token);
      
      setDeclarations(data);
    } catch (error) {
      console.error('Failed to load declarations:', error);
      Alert.alert('Erreur', 'Échec du chargement des déclarations. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeclarations();
    setRefreshing(false);
  };

  const handleChatPress = (declaration: Declaration) => {
    setSelectedDeclaration(declaration);
    setChatModalVisible(true);
  };

  const handleDeclarationPress = async (declaration: Declaration) => {
    // Open immediately with available data, then hydrate with full details
    setSelectedDeclaration(declaration);
    setDetailsVisible(true);
    if (!token) return;
    try {
      const full = await declarationService.getDeclarationById(declaration.id, token);
      setSelectedDeclaration(full);
    } catch (e) {
      // keep lightweight view; optional feedback
    }
  };

  const handleCreateDeclaration = () => {
    setCreateModalVisible(true);
  };

  const handleViewActions = async (declaration: Declaration) => {
    if (!token) return;
    try {
      setSelectedDeclaration(declaration);
      setActionsModalVisible(true);
      const actions = await declarationService.getActions(declaration.id, token);
      setActionsForDeclaration(actions);
    } catch (e) {
      console.error('Failed to load actions:', e);
      Alert.alert('Erreur', 'Échec du chargement des actions. Veuillez réessayer.');
    }
  };

  const handleCreateAction = async (data: import('../../types/declaration').CreateActionData) => {
    if (!selectedDeclaration || !token) return;
    await declarationService.createAction(selectedDeclaration.id, data, token);
    const actions = await declarationService.getActions(selectedDeclaration.id, token);
    setActionsForDeclaration(actions);
  };

  const handleUpdateAction = async (actionId: string, data: import('../../types/declaration').CreateActionData) => {
    if (!selectedDeclaration || !token) return;
    await declarationService.updateAction(selectedDeclaration.id, actionId, data, token);
    const actions = await declarationService.getActions(selectedDeclaration.id, token);
    setActionsForDeclaration(actions);
  };

  const handleCreateDeclarationSubmit = async (data: CreateDeclarationData) => {
    if (!token) return;
    
    try {
      setIsCreating(true);
      await declarationService.createDeclaration(data, token);
      
      // Refresh declarations list
      await loadDeclarations();
      
      // NOTE: The success alert has been removed as per the user's request.
      // The modal will now close directly, and the user can proceed
      // to the new declaration from the main list.
      
    } catch (error) {
      console.error('Failed to create declaration:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async (message: string, photo?: { uri: string; type: string; name: string }): Promise<void> => {
    if (!selectedDeclaration || !token) return;

    try {
      await declarationService.addChatMessage(selectedDeclaration.id, {
        description: message,
        photo,
      }, token);
      
      // Refresh the declaration to get updated chat messages
      const updatedDeclaration = await declarationService.getDeclarationById(selectedDeclaration.id, token);
      
      // Update the declaration in the list
      setDeclarations(prev => 
        prev.map(d => d.id === selectedDeclaration.id ? updatedDeclaration : d)
      );
      
      // Update selected declaration for the chat modal
      setSelectedDeclaration(updatedDeclaration);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const closeChatModal = () => {
    setChatModalVisible(false);
    setSelectedDeclaration(null);
  };

  const handleFetchMessages = useCallback(async (declarationId: string): Promise<void> => {
    if (!token) return;

    try {
      console.log('🔄 DeclarationScreen: Fetching messages for declaration:', declarationId);
      const updatedDeclaration = await declarationService.getDeclarationById(declarationId, token);
      
      // Only update if the data has actually changed
      setDeclarations(prev => {
        const existing = prev.find(d => d.id === declarationId);
        if (existing && JSON.stringify(existing.chats) === JSON.stringify(updatedDeclaration.chats)) {
          console.log('🔄 DeclarationScreen: No changes detected, skipping update');
          return prev; // No change, return same array
        }
        console.log('🔄 DeclarationScreen: Updating declaration with new data');
        return prev.map(d => d.id === declarationId ? updatedDeclaration : d);
      });
      
      // Only update selectedDeclaration if it's the same declaration
      if (selectedDeclaration && selectedDeclaration.id === declarationId) {
        setSelectedDeclaration(updatedDeclaration);
      }
    } catch (error) {
      console.error('❌ DeclarationScreen: Failed to fetch messages:', error);
      throw error;
    }
  }, [token, selectedDeclaration]);

  // Filter by title, severity, and date
  const getSortedDeclarations = () => {
    let filtered = [...declarations];
    
    // Filter by search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(d => (d.title || '').toLowerCase().includes(query));
    }
    
    // Filter by severity if selected
    if (selectedSeverity !== null) {
      filtered = filtered.filter(d => d.severite === selectedSeverity);
    }
    
    // Filter by date if selected
    if (selectedDate) {
      // Format date as YYYY-MM-DD in local timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const selectedDateStr = `${year}-${month}-${day}`;
      
      filtered = filtered.filter(d => {
        return d.date_declaration === selectedDateStr;
      });
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date_declaration).getTime() - new Date(a.date_declaration).getTime());
  };

  if (loading) {
    return <LoadingScreen message="Chargement des déclarations..." />;
  }

  const sortedDeclarations = getSortedDeclarations();

  const projectTitle = selectedDeclaration ? projects.find(p => p.id === selectedDeclaration.id_project)?.title : undefined;

  // Severity helper functions
  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return '#FF3B30'; // High - Red
    if (severity >= 5) return '#FF9500'; // Medium - Orange
    return '#34C759'; // Low - Green
  };

  const getSeverityText = (severity: number) => {
    if (severity >= 7) return 'Haute';
    if (severity >= 5) return 'Moyenne';
    return 'Faible';
  };

  // Date helper functions
  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      <AppHeader user={user || undefined} />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
          <Image
              source={require('../../assets/icons/declaration_anomalie.png')}
              style={styles.declarationLogo}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateDeclaration}>
            <Ionicons name="add-circle" size={20} color="#f87b1b" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
        
        {/* Filter Controls */}
        <View style={styles.filterContainer}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <Text
              accessibilityRole="text"
              style={{ display: 'none' }}
            >Rechercher par titre</Text>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Rechercher par titre"
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color="#C7C7CC" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.filterRow}>
            {/* Date Filter */}
            <View style={styles.dateFilterContainer}>
              <Text style={styles.dateFilterLabel}>Date :</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                <Text style={styles.datePickerText}>
                  {selectedDate ? formatDisplayDate(selectedDate) : 'Sélectionner'}
                </Text>
              </TouchableOpacity>
              {selectedDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={clearDateFilter}
                >
                  <Ionicons name="close-circle" size={14} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            {/* Severity Filter Dropdown */}
            <View style={styles.severityFilterContainer}>
              <Text style={styles.severityFilterLabel}>Sévérité :</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setSeverityPickerVisible(true)}
              >
                <Text style={styles.datePickerText}>
                  {selectedSeverity !== null ? `${selectedSeverity}` : 'Toute'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
              {selectedSeverity !== null && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setSelectedSeverity(null)}
                >
                  <Ionicons name="close-circle" size={14} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
      >
        {sortedDeclarations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>{searchQuery ? 'Aucun résultat' : 'Aucune déclaration'}</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery ? 'Essayez un autre mot-clé' : 'Créez votre première déclaration pour commencer'}
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateDeclaration}>
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.emptyStateButtonText}>Créer une déclaration</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedDeclarations.map((declaration) => (
            <DeclarationCard
              key={declaration.id}
              declaration={declaration}
              onChatPress={handleChatPress}
              onPress={handleDeclarationPress}
              onViewActions={handleViewActions}
            />
          ))
        )}
        

      </ScrollView>



      {/* Chat Modal */}
                   <ChatModal
               visible={chatModalVisible}
               declaration={selectedDeclaration}
               onClose={closeChatModal}
               onSendMessage={handleSendMessage}
               onFetchMessages={handleFetchMessages}
             />

      {/* Actions Modal */}
      <ActionsModal
        visible={actionsModalVisible}
        actions={actionsForDeclaration}
        onCreateAction={handleCreateAction}
        onUpdateAction={handleUpdateAction}
        onClose={() => {
          setActionsModalVisible(false);
          setActionsForDeclaration(null);
        }}
        parentZone={selectedDeclaration ? zones.find(z => z.id === selectedDeclaration.id_zone) || null : null}
        childZones={selectedDeclaration ? zones.filter(z => z.id_zone === selectedDeclaration.id_zone) : []}
        projectTitle={projectTitle}
      />

      {/* Declaration Details Modal */}
      <DeclarationDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        declaration={selectedDeclaration as any}
      />

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={selectedDate || new Date()}
        maximumDate={new Date()} // Cannot select future dates
        onConfirm={(date) => {
          setShowDatePicker(false);
          setSelectedDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Severity Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={severityPickerVisible}
        onRequestClose={() => setSeverityPickerVisible(false)}
      >
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSeverityPickerVisible(false)} activeOpacity={1}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Sélectionner la sévérité</Text>
            <ScrollView style={styles.modalScrollView}>
              {[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedSeverity(value === -1 ? null : value);
                    setSeverityPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>
                    {value === -1
                      ? 'Toutes les sévérités'
                      : `${value} - ${getSeverityText(value)}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Declaration Modal */}
      {user && (
        <CreateDeclarationModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onSubmit={handleCreateDeclarationSubmit}
          declarationTypes={declarationTypes}
          zones={zones}
          projects={projects}
          companyUsers={companyUsers}
          currentUser={user}
          isLoading={isCreating}
        />
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    fontSize: 14,
    color: '#1C1C1E',
    paddingVertical: 2,
  },
  declarationLogo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
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
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100, // Add space for tab bar
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  // Date and Severity filter styles
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  dateFilterContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityFilterContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  severityFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  datePickerText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  clearDateButton: {
    padding: 2,
  },

  // Severity Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalScrollView: {
    width: '100%',
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalOptionText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#007AFF',
  },
});
