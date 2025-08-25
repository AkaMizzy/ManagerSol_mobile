import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import API_CONFIG from '../app/config/api';
import { useAuth } from '../contexts/AuthContext';
import { CompanyUser, CreateActionData, DeclarationAction, Zone } from '../types/declaration';

interface ActionsModalProps {
  visible: boolean;
  actions: DeclarationAction[] | null;
  onClose: () => void;
  onCreateAction?: (data: CreateActionData) => Promise<void>;
  onUpdateAction?: (actionId: string, data: CreateActionData) => Promise<void>;
  parentZone?: Zone | null; // declaration's zone
  childZones?: Zone[]; // optional: pass preloaded child zones
}

export default function ActionsModal({ visible, actions, onClose, onCreateAction, onUpdateAction, parentZone, childZones }: ActionsModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<CreateActionData>({ id_zone: parentZone?.id });
  const [showForm, setShowForm] = useState(false);
  const [photo, setPhoto] = useState<CreateActionData['photo']>();
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showExecPicker, setShowExecPicker] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DeclarationAction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState<CreateActionData>({});
  const [editPhoto, setEditPhoto] = useState<CreateActionData['photo']>();
  const [showEditPlanPicker, setShowEditPlanPicker] = useState(false);
  const [showEditExecPicker, setShowEditExecPicker] = useState(false);
  const [showEditZoneDropdown, setShowEditZoneDropdown] = useState(false);
  const [showEditUserDropdown, setShowEditUserDropdown] = useState(false);

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets[0]) {
      setPhoto({ uri: result.assets[0].uri, type: 'image/jpeg', name: `action_${Date.now()}.jpg` });
    }
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

  const resetForm = () => {
    setForm({ id_zone: parentZone?.id });
    setPhoto(undefined);
  };

  const handleCreate = async () => {
    if (!onCreateAction) return;
    try {
      await onCreateAction({ ...form, photo });
      resetForm();
      setShowForm(false);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to create action');
    }
  };

  const handleActionPress = (action: DeclarationAction) => {
    setSelectedAction(action);
    setShowDetailsModal(true);
  };

  const handleUpdate = () => {
    if (!selectedAction) return;
    
    // Initialize edit form with current action data
    setEditForm({
      title: selectedAction.title || '',
      description: selectedAction.description || '',
      status: selectedAction.status as number,
      date_planification: selectedAction.date_planification || '',
      date_execution: selectedAction.date_execution || '',
      assigned_to: selectedAction.assigned_to || '',
      id_zone: parentZone?.id,
    });
    setEditPhoto(undefined);
    setShowEditForm(true);
    setShowDetailsModal(false);
  };

  const handleEditSubmit = async () => {
    if (!onUpdateAction || !selectedAction) return;
    try {
      await onUpdateAction(selectedAction.id, { ...editForm, photo: editPhoto });
      setShowEditForm(false);
      setSelectedAction(null);
      setEditForm({});
      setEditPhoto(undefined);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to update action');
    }
  };

  const resetEditForm = () => {
    setEditForm({});
    setEditPhoto(undefined);
    setShowEditForm(false);
  };

  React.useEffect(() => {
    // Build zones list: parent + its children
    const list: Zone[] = [];
    if (parentZone) list.push(parentZone);
    if (childZones && childZones.length) {
      childZones.forEach((z) => list.push(z));
    }
    setZones(list);
    // default selection to parent
    setForm((p) => ({ ...p, id_zone: parentZone?.id }));
  }, [parentZone?.id, childZones?.length]);

  // Fetch company users when form is shown
  useEffect(() => {
    if ((showForm || showEditForm) && companyUsers.length === 0) {
      fetchCompanyUsers();
    }
  }, [showForm, showEditForm, token]);

  const renderZoneOption = (zone: Zone) => {
    const uri = zone.logo ? `${API_CONFIG.BASE_URL}${zone.logo}` : undefined;
    const isChild = parentZone && zone.id !== parentZone.id;
    return (
      <View style={styles.zoneRow}>
        {uri ? <Image source={{ uri }} style={styles.zoneLogo} /> : null}
        <Text style={[styles.zoneText, isChild && styles.zoneChildText]}>{isChild ? `— ${zone.title}` : zone.title}</Text>
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

  const getSelectedUserName = () => {
    if (!form.assigned_to) return 'Select user';
    const user = companyUsers.find(u => u.id === form.assigned_to);
    return user ? `${user.firstname} ${user.lastname}` : 'Select user';
  };
  const renderPhoto = (photo?: string | null) => {
    if (!photo) return null;
    const uri = `${API_CONFIG.BASE_URL}${photo}`;
    return (
      <Image source={{ uri }} style={styles.actionImage} contentFit="cover" />
    );
  };

  const filteredActions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !actions) return actions || [];
    return actions.filter(a => (a.title || '').toLowerCase().includes(q));
  }, [actions, searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Declaration Actions</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Create bar */}
          <View style={styles.createBar}>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowForm((s) => !s)}>
              <Ionicons name={showForm ? 'remove' : 'add'} size={20} color="#007AFF" />
              <Text style={styles.createButtonText}>{showForm ? 'Close' : 'Add Action'}</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              placeholder="Search actions by title"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color="#C7C7CC" />
              </TouchableOpacity>
            ) : null}
          </View>

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Action</Text>
              {/* Zone select */}
              {parentZone ? (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.label}>Zone</Text>
                  {/* Select header */}
                  <TouchableOpacity
                    style={styles.selectHeader}
                    onPress={() => setShowZoneDropdown((s) => !s)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.selectedPreview}>
                      {renderZoneOption(zones.find(zz => zz.id === form.id_zone) || parentZone)}
                    </View>
                    <Ionicons name={showZoneDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
                  </TouchableOpacity>

                  {showZoneDropdown ? (
                    <View style={styles.selectBox}>
                      <ScrollView style={{ maxHeight: 220 }}>
                        {zones.map((z) => (
                          <TouchableOpacity
                            key={z.id}
                            style={styles.selectItem}
                            onPress={() => {
                              setForm((p) => ({ ...p, id_zone: z.id }));
                              setShowZoneDropdown(false);
                            }}
                          >
                            <View style={[styles.selectItemInner, form.id_zone === z.id && styles.selectItemSelected]}>
                              {renderZoneOption(z)}
                              {form.id_zone === z.id ? <Ionicons name="checkmark" size={18} color="#34C759" /> : null}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <TextInput
                style={styles.input}
                placeholder="Title "
                placeholderTextColor="#8E8E93"
                value={form.title}
                onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description "
                placeholderTextColor="#8E8E93"
                value={form.description}
                onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
                multiline
              />
              
              {/* User Assignment */}
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Assign To</Text>
                <TouchableOpacity
                  style={styles.selectHeader}
                  onPress={() => setShowUserDropdown((s) => !s)}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectedPreview}>
                    <Text style={[styles.dateText, !form.assigned_to && styles.placeholderText]}>
                      {getSelectedUserName()}
                    </Text>
                  </View>
                  <Ionicons name={showUserDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
                </TouchableOpacity>

                {showUserDropdown ? (
                  <View style={styles.selectBox}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {loadingUsers ? (
                        <View style={styles.loadingItem}>
                          <Text style={styles.loadingText}>Loading users...</Text>
                        </View>
                      ) : companyUsers.length === 0 ? (
                        <View style={styles.loadingItem}>
                          <Text style={styles.loadingText}>No users available</Text>
                        </View>
                      ) : (
                        companyUsers.map((user) => (
                          <TouchableOpacity
                            key={user.id}
                            style={styles.selectItem}
                            onPress={() => {
                              setForm((p) => ({ ...p, assigned_to: user.id }));
                              setShowUserDropdown(false);
                            }}
                          >
                            <View style={[styles.selectItemInner, form.assigned_to === user.id && styles.selectItemSelected]}>
                              {renderUserOption(user)}
                              {form.assigned_to === user.id ? <Ionicons name="checkmark" size={18} color="#34C759" /> : null}
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
              <View style={styles.rowGap}>
                {/* Planned date picker */}
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowPlanPicker(true)} activeOpacity={0.7}>
                  <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                  <Text style={[styles.dateText, !form.date_planification && styles.placeholderText]}>
                    {form.date_planification ? formatDisplayDate(form.date_planification) : 'Planned date'}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showPlanPicker}
                  mode="date"
                  date={form.date_planification ? new Date(form.date_planification) : new Date()}
                  onConfirm={(selectedDate) => {
                    setShowPlanPicker(false);
                    if (selectedDate) setForm((p) => ({ ...p, date_planification: toISODate(selectedDate) }));
                  }}
                  onCancel={() => setShowPlanPicker(false)}
                />

                {/* Execution date picker */}
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowExecPicker(true)} activeOpacity={0.7}>
                  <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                  <Text style={[styles.dateText, !form.date_execution && styles.placeholderText]}>
                    {form.date_execution ? formatDisplayDate(form.date_execution) : 'Execution date'}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showExecPicker}
                  mode="date"
                  date={form.date_execution ? new Date(form.date_execution) : new Date()}
                  onConfirm={(selectedDate) => {
                    setShowExecPicker(false);
                    if (selectedDate) setForm((p) => ({ ...p, date_execution: toISODate(selectedDate) }));
                  }}
                  onCancel={() => setShowExecPicker(false)}
                />
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={18} color="#8E8E93" />
                  <Text style={styles.photoBtnText}>{photo ? 'Change Photo' : 'Add Photo'}</Text>
                </TouchableOpacity>
                {photo ? <Text style={styles.photoName}>1 photo selected</Text> : null}
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitBtnText}>Create Action</Text>
              </TouchableOpacity>
            </View>
          )}

          {!filteredActions || filteredActions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>{searchQuery ? 'No matches found' : 'No actions have been added for this declaration yet.'}</Text>
            </View>
          ) : (
                         filteredActions.map((action) => (
               <TouchableOpacity key={action.id} style={styles.card} onPress={() => handleActionPress(action)} activeOpacity={0.7}>
                 <View style={styles.cardHeader}>
                   <Text style={styles.cardTitle}>{action.title || 'Untitled action'}</Text>
                   <View style={styles.statusPill}>
                     <Text style={styles.statusText}>{String(action.status ?? 'pending')}</Text>
                   </View>
                 </View>
                 
                 {action.description ? (
                   <Text style={styles.cardDesc}>{action.description}</Text>
                 ) : null}
                 
                 {renderPhoto(action.photo)}
                 
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
                   
                   {/* Date Information */}
                   {(action.date_execution || action.date_planification) && (
                     <View style={styles.dateInfoRow}>
                       {action.date_execution ? (
                         <View style={styles.dateInfoItem}>
                           <Text style={styles.dateInfoLabel}>Execute date</Text>
                           <Text style={styles.dateInfoValue}>
                             {new Date(action.date_execution).toLocaleDateString()}
                           </Text>
                         </View>
                       ) : action.date_planification ? (
                         <View style={styles.dateInfoItem}>
                           <Text style={styles.dateInfoLabel}>Planned date</Text>
                           <Text style={styles.dateInfoValue}>
                             {new Date(action.date_planification).toLocaleDateString()}
                           </Text>
                         </View>
                       ) : null}
                     </View>
                   )}
                                   </View>
                </TouchableOpacity>
              ))
          )}
                 </ScrollView>
       </View>

       {/* Action Details Modal */}
       <Modal
         visible={showDetailsModal}
         animationType="slide"
         presentationStyle="pageSheet"
         onRequestClose={() => setShowDetailsModal(false)}
       >
         <View style={styles.container}>
           <View style={styles.header}>
             <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={styles.closeButton}>
               <Ionicons name="close" size={24} color="#1C1C1E" />
             </TouchableOpacity>
             <Text style={styles.headerTitle}>Action Details</Text>
             <View style={styles.placeholder} />
           </View>

           <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
             {selectedAction && (
              <View>
                <Text style={styles.detailsTitle}>{selectedAction.title || 'Untitled action'}</Text>
                {selectedAction.description ? (
                  <Text style={styles.detailsDesc}>{selectedAction.description}</Text>
                ) : null}

                {renderPhoto(selectedAction.photo)}

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
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Planned date</Text>
                    <Text style={styles.detailValue}>
                      {selectedAction.date_planification ? new Date(selectedAction.date_planification).toLocaleDateString() : '—'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Execution date</Text>
                    <Text style={styles.detailValue}>
                      {selectedAction.date_execution ? new Date(selectedAction.date_execution).toLocaleDateString() : '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionHeader}>Context</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Zone</Text>
                    <Text style={styles.detailValue}>{getZoneTitleById(selectedAction.id_zone)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={styles.detailValue}>{selectedAction.company_title || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>{String(selectedAction.status ?? 'pending')}</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                    <Ionicons name="create-outline" size={18} color="#f87b1b" />
                    <Text style={styles.updateButtonText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addMiniButton} onPress={() => {
                    Alert.alert('Coming Soon', 'Add mini action functionality will be implemented soon.');
                  }}>
                    <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
                    <Text style={styles.addMiniButtonText}>Add Mini Action</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
         </View>
       </Modal>

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
                {parentZone ? (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={styles.label}>Zone</Text>
                    {/* Select header */}
                    <TouchableOpacity
                      style={styles.selectHeader}
                      onPress={() => setShowEditZoneDropdown((s) => !s)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.selectedPreview}>
                        {renderZoneOption(zones.find(zz => zz.id === editForm.id_zone) || parentZone)}
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
                ) : null}

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
     </Modal>
   );
 }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 24 },
  content: { padding: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1C1E' },
  createBar: { marginBottom: 12 },
  createButton: { flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6, },
  createButtonText: { color: '#007AFF', fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { marginTop: 12, fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  statusPill: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  cardDesc: { fontSize: 14, color: '#1C1C1E', marginBottom: 8 },
  actionImage: { width: '100%', height: 160, borderRadius: 8, marginTop: 4 },
  metaSection: { marginTop: 16 },
  userInfoRow: { marginBottom: 12 },
  userInfoItem: { marginBottom: 8 },
  userInfoLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  userInfoValue: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  dateInfoRow: { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 12 },
  dateInfoItem: { marginBottom: 4 },
  dateInfoLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateInfoValue: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  formTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1C1C1E' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#1C1C1E', marginBottom: 10 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  rowGap: { gap: 10, marginBottom: 10 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F2F2F7', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  photoBtnText: { color: '#8E8E93' },
  photoName: { color: '#8E8E93', fontSize: 12 },
  submitBtn: { backgroundColor: '#34C759', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700' },
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
  dateText: { color: '#1C1C1E', fontSize: 14 },
  placeholderText: { color: '#8E8E93' },
  label: { fontSize: 14, color: '#1C1C1E', marginBottom: 6, fontWeight: '600' },
  selectHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  selectBox: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10 },
  selectItem: { paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  selectItemInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectItemSelected: { backgroundColor: '#F8FFF9' },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoneLogo: { width: 22, height: 22, borderRadius: 4 },
  zoneText: { color: '#1C1C1E' },
  zoneChildText: { color: '#1C1C1E' },
  selectedPreview: { marginTop: 8, paddingHorizontal: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  userText: { color: '#1C1C1E', fontSize: 14, fontWeight: '500' },
  userRole: { color: '#8E8E93', fontSize: 12 },
  loadingItem: { paddingHorizontal: 10, paddingVertical: 15, alignItems: 'center' },
  loadingText: { color: '#8E8E93', fontSize: 14 },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f87b1b',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  updateButtonText: {
    color: '#f87b1b',
    fontWeight: '600',
  },
  addMiniButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  addMiniButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  detailsTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  detailsDesc: { fontSize: 14, color: '#1C1C1E', marginBottom: 12, lineHeight: 20 },
  detailsSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 12 },
  sectionHeader: { fontSize: 12, color: '#8E8E93', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: '#8E8E93', marginRight: 12, flex: 0.9 },
  detailValue: { fontSize: 14, color: '#1C1C1E', fontWeight: '500', flex: 1, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },

});


