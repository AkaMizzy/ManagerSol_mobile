import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionsModal from '../../components/ActionsModal';
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
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);

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
      Alert.alert('Error', 'Failed to load data. Please try again.');
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
      console.log('🔍 Loaded declarations:', data.length);
      data.forEach((declaration, index) => {
        console.log(`🔍 Declaration ${index + 1}:`, {
          id: declaration.id,
          title: declaration.declaration_type_title,
          photos: declaration.photos?.length || 0,
          photo_count: declaration.photo_count,
          hasPhotosArray: !!declaration.photos,
          firstPhoto: declaration.photos?.[0]?.photo
        });
      });
      setDeclarations(data);
    } catch (error) {
      console.error('Failed to load declarations:', error);
      Alert.alert('Error', 'Failed to load declarations. Please try again.');
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
      Alert.alert('Error', 'Failed to load actions. Please try again.');
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
      
      // Show success message
      Alert.alert('Success', 'Declaration created successfully!');
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

  // Calculate statistics
  const getStatistics = () => {
    const totalDeclarations = declarations.length;
    const highPriorityCount = declarations.filter(d => d.severite >= 7).length;
    return { totalDeclarations, highPriorityCount };
  };

  // Filter by title and severity, then sort based on current filter
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
    
    // Sort based on current sort option
    const sorted = [...filtered];
    if (sortBy === 'date') {
      return sorted.sort((a, b) => new Date(b.date_declaration).getTime() - new Date(a.date_declaration).getTime());
    } else {
      return sorted.sort((a, b) => b.severite - a.severite);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading declarations..." />;
  }

  const stats = getStatistics();
  const sortedDeclarations = getSortedDeclarations();

  // Severity helper functions
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Declarations</Text>
            <Text style={styles.subtitle}>
              {stats.totalDeclarations} declarations • {stats.highPriorityCount} high priority
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateDeclaration}>
            <Ionicons name="add" size={24} color="#1C1C1E" />
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
            >Search by title</Text>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Search by title"
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

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'date' && styles.filterButtonActive]}
              onPress={() => setSortBy('date')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'date' && styles.filterButtonTextActive]}>
                By Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'severity' && styles.filterButtonActive]}
              onPress={() => setSortBy('severity')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'severity' && styles.filterButtonTextActive]}>
                By Severity
              </Text>
            </TouchableOpacity>
          </View>

          {/* Compact Severity Filter */}
          <View style={styles.compactSeverityFilter}>
            <View style={styles.severityFilterRow}>
              <Text style={styles.severityFilterLabel}>Severity:</Text>
              <View style={styles.severityDots}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.compactSeverityDot,
                      selectedSeverity === value && [styles.compactSeverityDotActive, { backgroundColor: getSeverityColor(value) }],
                    ]}
                    onPress={() => setSelectedSeverity(selectedSeverity === value ? null : value)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
              {selectedSeverity !== null && (
                <TouchableOpacity
                  style={styles.clearSeverityButton}
                  onPress={() => setSelectedSeverity(null)}
                >
                  <Ionicons name="close-circle" size={14} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
            {selectedSeverity !== null && (
              <View style={styles.severityIndicator}>
                <View style={[styles.severityIndicatorBadge, { backgroundColor: getSeverityColor(selectedSeverity) }]}>
                  <Text style={styles.severityIndicatorText}>{selectedSeverity} - {getSeverityText(selectedSeverity)}</Text>
                </View>
              </View>
            )}
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
            <Text style={styles.emptyStateTitle}>{searchQuery ? 'No matches found' : 'No Declarations Yet'}</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery ? 'Try a different title keyword' : 'Create your first declaration to get started'}
            </Text>
            <View style={styles.emptyStateButton}>
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.emptyStateButtonText}>Create Declaration</Text>
            </View>
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
      />

      {/* Declaration Details Modal */}
      <DeclarationDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        declaration={selectedDeclaration as any}
      />

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    borderColor: '#E5E5EA',
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
  title: {
    fontSize: 28,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  filterContainer: {
    marginTop: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
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
  // Compact severity filter styles
  compactSeverityFilter: {
    marginTop: 8,
  },
  severityFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    minWidth: 60,
  },
  severityDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  compactSeverityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  compactSeverityDotActive: {
    borderColor: '#007AFF',
  },
  clearSeverityButton: {
    padding: 2,
  },
  severityIndicator: {
    marginTop: 6,
  },
  severityIndicatorBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
