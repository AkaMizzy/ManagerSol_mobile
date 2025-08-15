import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatModal from '../../components/ChatModal';
import CreateDeclarationModal from '../../components/CreateDeclarationModal';
import DeclarationCard from '../../components/DeclarationCard';
import FloatingActionButton from '../../components/FloatingActionButton';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import declarationService from '../../services/declarationService';
import { CreateDeclarationData, Declaration, DeclarationType, Zone } from '../../types/declaration';

export default function DeclarationScreen() {
  const { user, token } = useAuth();
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  
  // New state for create declaration modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [declarationTypes, setDeclarationTypes] = useState<DeclarationType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isCreating, setIsCreating] = useState(false);

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
      const [declarationsData, typesData, zonesData] = await Promise.all([
        declarationService.getDeclarations(token),
        declarationService.getDeclarationTypes(token),
        declarationService.getZones(token),
      ]);
      
      setDeclarations(declarationsData);
      setDeclarationTypes(typesData);
      setZones(zonesData);
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

  const handleDeclarationPress = (declaration: Declaration) => {
    // TODO: Navigate to declaration detail screen
    console.log('Declaration pressed:', declaration.id);
  };

  const handleCreateDeclaration = () => {
    setCreateModalVisible(true);
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

  if (loading) {
    return <LoadingScreen message="Loading declarations..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Declarations</Text>
          <Text style={styles.subtitle}>
            Manage your reports and requests
          </Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{declarations.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
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
        {declarations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Declarations Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create your first declaration to get started
            </Text>
            <View style={styles.emptyStateButton}>
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.emptyStateButtonText}>Create Declaration</Text>
            </View>
          </View>
        ) : (
          declarations.map((declaration) => (
            <DeclarationCard
              key={declaration.id}
              declaration={declaration}
              onChatPress={handleChatPress}
              onPress={handleDeclarationPress}
            />
          ))
        )}
        
        {/* Bottom spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={handleCreateDeclaration}
        icon="add"
        backgroundColor="#007AFF"
      />

      {/* Chat Modal */}
                   <ChatModal
               visible={chatModalVisible}
               declaration={selectedDeclaration}
               onClose={closeChatModal}
               onSendMessage={handleSendMessage}
               onFetchMessages={handleFetchMessages}
             />

      {/* Create Declaration Modal */}
      <CreateDeclarationModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateDeclarationSubmit}
        declarationTypes={declarationTypes}
        zones={zones}
        isLoading={isCreating}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    marginBottom: 16,
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
  headerStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
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
  bottomSpacing: {
    height: 100, // Space for FAB
  },
});
