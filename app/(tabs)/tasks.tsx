import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_CONFIG from '../../app/config/api';
import { useAuth } from '../../contexts/AuthContext';
import declarationService from '../../services/declarationService';
import { CompanyUser, CreateActionData, DeclarationAction, Zone } from '../../types/declaration';

type TabType = 'created' | 'assigned';

export default function TaskScreen() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [createdActions, setCreatedActions] = useState<DeclarationAction[]>([]);
  const [assignedActions, setAssignedActions] = useState<DeclarationAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DeclarationAction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Edit form states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState<CreateActionData>({});
  const [editPhoto, setEditPhoto] = useState<CreateActionData['photo']>();
  const [showEditPlanPicker, setShowEditPlanPicker] = useState(false);
  const [showEditExecPicker, setShowEditExecPicker] = useState(false);
  const [showEditZoneDropdown, setShowEditZoneDropdown] = useState(false);
  const [showEditUserDropdown, setShowEditUserDropdown] = useState(false);
  
  // Company users and zones
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (iso?: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const pickEditImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets[0]) {
      setEditPhoto({ uri: result.assets[0].uri, type: 'image/jpeg', name: `action_edit_${Date.now()}.jpg` });
    }
  };

  const fetchCompanyUsers = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }
    
    try {
      setLoadingUsers(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/company-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch company users');
      }
      
      const users = await response.json();
      setCompanyUsers(users);
    } catch (error) {
      console.error('Error fetching company users:', error);
      Alert.alert('Error', 'Failed to load company users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchZones = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch zones');
      }
      
      const zonesData = await response.json();
      setZones(zonesData);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  // Fetch company users and zones when edit form is shown
  useEffect(() => {
    if (showEditForm) {
      if (companyUsers.length === 0) {
        fetchCompanyUsers();
      }
      if (zones.length === 0) {
        fetchZones();
      }
    }
  }, [showEditForm, token]);

  const resetEditForm = () => {
    setEditForm({});
    setEditPhoto(undefined);
    setShowEditForm(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedAction) return;
    try {
      // For now, just log the update - you can implement the actual update later
      console.log('Updating action:', selectedAction.id, 'with data:', editForm);
      setShowEditForm(false);
      setSelectedAction(null);
      setEditForm({});
      setEditPhoto(undefined);
      // Refresh the actions list
      await fetchActions();
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to update action');
    }
  };

  const renderZoneOption = (zone: Zone) => {
    return (
      <View style={styles.zoneRow}>
        <Text style={styles.zoneText}>{zone.title}</Text>
      </View>
    );
  };

  const renderUserOption = (user: CompanyUser) => {
  return (
      <View style={styles.userRow}>
        <Text style={styles.userText}>{`${user.firstname} ${user.lastname}`}</Text>
        {user.role && <Text style={styles.userRole}>{user.role}</Text>}
            </View>
    );
  };

  function getZoneTitleById(zoneId?: string | null): string {
    if (!zoneId) return '—';
    const z = zones.find(zz => zz.id === zoneId);
    return z ? z.title : zoneId;
  }

  const fetchActions = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const [myActions, assignedActionsData] = await Promise.all([
        declarationService.getMyActions(token),
        declarationService.getAssignedActions(token),
      ]);
      
      setCreatedActions(myActions);
      setAssignedActions(assignedActionsData);
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActions();
    setRefreshing(false);
  }, [fetchActions]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleActionPress = (action: DeclarationAction) => {
    setSelectedAction(action);
    setShowDetailsModal(true);
  };

  const handleUpdateAction = () => {
    if (!selectedAction) return;
    
    // Initialize edit form with current action data
    setEditForm({
      title: selectedAction.title || '',
      description: selectedAction.description || '',
      status: selectedAction.status as number,
      date_planification: selectedAction.date_planification || '',
      date_execution: selectedAction.date_execution || '',
      assigned_to: selectedAction.assigned_to || '',
      id_zone: selectedAction.id_zone || '',
    });
    setEditPhoto(undefined);
    setShowEditForm(true);
    setShowDetailsModal(false);
  };

  const renderActionCard = (action: DeclarationAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionCard}
      onPress={() => handleActionPress(action)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{action.title || 'Untitled action'}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{String(action.status ?? 'pending')}</Text>
        </View>
      </View>

      {action.description ? (
        <Text style={styles.cardDesc}>{action.description}</Text>
      ) : null}
      
      {action.photo && (
        <Image
          source={{ uri: `${API_CONFIG.BASE_URL}${action.photo}` }}
          style={styles.actionImage}
          contentFit="cover"
        />
      )}
      
      <View style={styles.metaSection}>
        {/* User Information */}
        <View style={styles.userInfoRow}>
          {action.creator_firstname || action.creator_lastname ? (
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Created by</Text>
              <Text style={styles.userInfoValue}>
                {[action.creator_firstname, action.creator_lastname].filter(Boolean).join(' ')}
              </Text>
            </View>
          ) : null}
          
          {action.assigned_firstname || action.assigned_lastname ? (
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Assigned to</Text>
              <Text style={styles.userInfoValue}>
                {[action.assigned_firstname, action.assigned_lastname].filter(Boolean).join(' ')}
              </Text>
            </View>
          ) : null}
        </View>
        
        {/* Additional Information */}
        <View style={styles.additionalInfoRow}>
          {action.date_planification && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Planned</Text>
              <Text style={styles.infoValue}>
                {new Date(action.date_planification).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {action.zone_title && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Zone</Text>
              <Text style={styles.infoValue}>{action.zone_title}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    const actions = activeTab === 'created' ? createdActions : assignedActions;
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading actions...</Text>
        </View>
      );
    }

    if (actions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>
            {activeTab === 'created' 
              ? 'No actions created yet' 
              : 'No actions assigned to you'
            }
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'created' 
              ? 'Actions you create will appear here' 
              : 'Actions assigned to you will appear here'
            }
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#F87B1B"
            colors={['#F87B1B']}
          />
        }
      >
        {actions.map(renderActionCard)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'created' && styles.activeTabButton]}
          onPress={() => setActiveTab('created')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
            Created by Me
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'assigned' && styles.activeTabButton]}
          onPress={() => setActiveTab('assigned')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'assigned' && styles.activeTabText]}>
            Assigned to Me
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Action Details Modal */}
      {showDetailsModal && selectedAction && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Action Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.detailsTitle}>{selectedAction.title || 'Untitled action'}</Text>
              
              {selectedAction.description ? (
                <Text style={styles.detailsDesc}>{selectedAction.description}</Text>
              ) : null}

              {selectedAction.photo && (
                <Image
                  source={{ uri: `${API_CONFIG.BASE_URL}${selectedAction.photo}` }}
                  style={styles.modalActionImage}
                  contentFit="cover"
                />
              )}

              <View style={styles.detailsSection}>
                <Text style={styles.sectionHeader}>People</Text>
                {selectedAction.creator_firstname || selectedAction.creator_lastname ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created by</Text>
                    <Text style={styles.detailValue}>
                      {[selectedAction.creator_firstname, selectedAction.creator_lastname].filter(Boolean).join(' ')}
                    </Text>
                  </View>
                ) : null}
                {selectedAction.assigned_firstname || selectedAction.assigned_lastname ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned to</Text>
                    <Text style={styles.detailValue}>
                      {[selectedAction.assigned_firstname, selectedAction.assigned_lastname].filter(Boolean).join(' ')}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.sectionHeader}>Dates</Text>
                {selectedAction.date_planification && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Planned date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedAction.date_planification).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {selectedAction.date_execution && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Execution date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedAction.date_execution).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.sectionHeader}>Context</Text>
                {selectedAction.zone_title && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Zone</Text>
                    <Text style={styles.detailValue}>{selectedAction.zone_title}</Text>
                  </View>
                )}
                {selectedAction.company_title && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={styles.detailValue}>{selectedAction.company_title}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>{String(selectedAction.status ?? 'pending')}</Text>
                </View>
        </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateAction}>
                  <Ionicons name="create-outline" size={18} color="#F87B1B" />
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addMiniButton}>
                  <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
                  <Text style={styles.addMiniButtonText}>Add Mini Action</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            </View>
          </View>
      )}

      {/* Edit Action Modal */}
      <Modal
        visible={showEditForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetEditForm}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={resetEditForm} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Action</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Update Action</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#8E8E93"
                value={editForm.title}
                onChangeText={(t) => setEditForm((p) => ({ ...p, title: t }))}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#8E8E93"
                value={editForm.description}
                onChangeText={(t) => setEditForm((p) => ({ ...p, description: t }))}
                multiline
              />

              {/* Zone select */}
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Zone</Text>
                <TouchableOpacity
                  style={styles.selectHeader}
                  onPress={() => setShowEditZoneDropdown((s) => !s)}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectedPreview}>
                    <Text style={[styles.dateText, !editForm.id_zone && styles.placeholderText]}>
                      {editForm.id_zone ? getZoneTitleById(editForm.id_zone) : 'Select zone'}
                    </Text>
                  </View>
                  <Ionicons name={showEditZoneDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
                </TouchableOpacity>

                {showEditZoneDropdown ? (
                  <View style={styles.selectBox}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {zones.map((z) => (
                        <TouchableOpacity
                          key={z.id}
                          style={styles.selectItem}
                          onPress={() => {
                            setEditForm((p) => ({ ...p, id_zone: z.id }));
                            setShowEditZoneDropdown(false);
                          }}
                        >
                          <View style={[styles.selectItemInner, editForm.id_zone === z.id && styles.selectItemSelected]}>
                            {renderZoneOption(z)}
                            {editForm.id_zone === z.id ? <Ionicons name="checkmark" size={18} color="#34C759" /> : null}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              {/* User Assignment */}
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Assign To</Text>
                <TouchableOpacity
                  style={styles.selectHeader}
                  onPress={() => setShowEditUserDropdown((s) => !s)}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectedPreview}>
                    <Text style={[styles.dateText, !editForm.assigned_to && styles.placeholderText]}>
                      {(() => {
                        if (!editForm.assigned_to) return 'Select user';
                        const user = companyUsers.find(u => u.id === editForm.assigned_to);
                        return user ? `${user.firstname} ${user.lastname}` : 'Select user';
                      })()}
                    </Text>
                  </View>
                  <Ionicons name={showEditUserDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
                </TouchableOpacity>

                {showEditUserDropdown ? (
                  <View style={styles.selectBox}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {companyUsers.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={styles.selectItem}
                          onPress={() => {
                            setEditForm((p) => ({ ...p, assigned_to: user.id }));
                            setShowEditUserDropdown(false);
                          }}
                        >
                          <View style={[styles.selectItemInner, editForm.assigned_to === user.id && styles.selectItemSelected]}>
                            {renderUserOption(user)}
                            {editForm.assigned_to === user.id ? <Ionicons name="checkmark" size={18} color="#34C759" /> : null}
                          </View>
                        </TouchableOpacity>
        ))}
      </ScrollView>
                  </View>
                ) : null}
              </View>

              <View style={styles.rowGap}>
                {/* Planned date picker */}
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowEditPlanPicker(true)} activeOpacity={0.7}>
                  <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                  <Text style={[styles.dateText, !editForm.date_planification && styles.placeholderText]}>
                    {editForm.date_planification ? formatDisplayDate(editForm.date_planification) : 'Planned date'}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showEditPlanPicker}
                  mode="date"
                  date={editForm.date_planification ? new Date(editForm.date_planification) : new Date()}
                  onConfirm={(selectedDate) => {
                    setShowEditPlanPicker(false);
                    if (selectedDate) setEditForm((p) => ({ ...p, date_planification: toISODate(selectedDate) }));
                  }}
                  onCancel={() => setShowEditPlanPicker(false)}
                />

                {/* Execution date picker */}
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowEditExecPicker(true)} activeOpacity={0.7}>
                  <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                  <Text style={[styles.dateText, !editForm.date_execution && styles.placeholderText]}>
                    {editForm.date_execution ? formatDisplayDate(editForm.date_execution) : 'Execution date'}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showEditExecPicker}
                  mode="date"
                  date={editForm.date_execution ? new Date(editForm.date_execution) : new Date()}
                  onConfirm={(selectedDate) => {
                    setShowEditExecPicker(false);
                    if (selectedDate) setEditForm((p) => ({ ...p, date_execution: toISODate(selectedDate) }));
                  }}
                  onCancel={() => setShowEditExecPicker(false)}
                />
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={styles.photoBtn} onPress={pickEditImage}>
                  <Ionicons name="camera-outline" size={18} color="#8E8E93" />
                  <Text style={styles.photoBtnText}>{editPhoto ? 'Change Photo' : 'Add Photo'}</Text>
                </TouchableOpacity>
                {editPhoto ? <Text style={styles.photoName}>1 photo selected</Text> : null}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleEditSubmit}>
                <Text style={styles.submitBtnText}>Update Action</Text>
      </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#F87B1B',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#F87B1B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#F2F2F7',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Increased from 8 for better spacing
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 10,
  },
  statusPill: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  cardDesc: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16, // Increased from 12 for better spacing
    lineHeight: 20, // Added line height for better readability
  },
  actionImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12, // Added bottom margin for consistency
  },
  metaSection: {
    marginTop: 16, // Increased from 12 for better separation
    paddingTop: 16, // Added top padding for visual separation
    borderTopWidth: 1, // Added subtle border for section separation
    borderTopColor: '#F2F2F7',
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12, // Increased from 8 for better spacing
    paddingHorizontal: 0, // Remove any horizontal padding to align with card content
  },
  userInfoItem: {
    alignItems: 'flex-start', // Align items to the start (left) instead of center
    flex: 1, // Give each item equal space
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  additionalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12, // Increased from 8 for better separation
    paddingHorizontal: 0, // Remove any horizontal padding to align with card content
  },
  infoItem: {
    alignItems: 'flex-start', // Align items to the start (left) instead of center
    flex: 1, // Give each item equal space
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  detailsDesc: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 15,
  },
  modalActionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  detailsSection: {
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from space-around for better distribution
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12, // Added gap between buttons for consistent spacing
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content horizontally
    backgroundColor: '#FFF0E6',
    borderRadius: 10,
    paddingVertical: 12, // Increased for better touch target
    paddingHorizontal: 20, // Increased for better spacing
    width: '45%',
    borderWidth: 1, // Added border for better definition
    borderColor: '#F87B1B', // Border color matching text
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F87B1B',
    marginLeft: 6, // Reduced margin for better alignment
    textAlign: 'center', // Ensure text is centered
  },
  addMiniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content horizontally
    backgroundColor: '#E0F2FF',
    borderRadius: 10,
    paddingVertical: 12, // Increased for better touch target
    paddingHorizontal: 20, // Increased for better spacing
    width: '45%',
    borderWidth: 1, // Added border for better definition
    borderColor: '#007AFF', // Border color matching text
  },
  addMiniButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6, // Reduced margin for better alignment
    textAlign: 'center', // Ensure text is centered
  },
  zoneRow: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  zoneText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  userRow: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  userText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  userRole: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  // New styles for Edit Action Modal
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  label: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1C1C1E',
    marginBottom: 10,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedPreview: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  dateText: {
    color: '#1C1C1E',
    fontSize: 14,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  selectBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
  },
  selectItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectItemSelected: {
    backgroundColor: '#F8FFF9',
  },
  rowGap: {
    gap: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  photoBtnText: {
    color: '#8E8E93',
  },
  photoName: {
    color: '#8E8E93',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  placeholder: {
    width: 24,
  },
});
