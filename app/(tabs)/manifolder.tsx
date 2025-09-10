import API_CONFIG from '@/app/config/api';
import AppHeader from '@/components/AppHeader';
import ManifoldDetails from '@/components/ManifoldDetails';
import ManifolderQuestions from '@/components/ManifolderQuestions';
import SignatureField from '@/components/SignatureField';
import { useAuth } from '@/contexts/AuthContext';
import manifolderService from '@/services/manifolderService';
import { Project, Zone } from '@/types/declaration';
import { ManifolderListItem, ManifolderType } from '@/types/manifolder';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
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

  // Signature states
  const [signatures, setSignatures] = useState<{
    technicien: { signature: string; email: string } | null;
    control: { signature: string; email: string } | null;
    admin: { signature: string; email: string } | null;
  }>({
    technicien: null,
    control: null,
    admin: null,
  });

  const getZoneLogo = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone?.logo) {
      return `${API_CONFIG.BASE_URL}${zone.logo}`;
    }
    return null;
  };

  const handleSignatureComplete = (role: string, signature: string, email: string) => {
    setSignatures(prev => ({
      ...prev,
      [role]: { signature, email }
    }));
  };

  const isAllSignaturesComplete = () => {
    return signatures.technicien && signatures.control && signatures.admin;
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

  async function handleSubmit() {
    if (!projectId || !zoneId || !typeId || !title.trim()) {
      Alert.alert('Validation', 'Please select Project, Zone, Type and enter a Title');
      return;
    }

    if (!isAllSignaturesComplete()) {
      Alert.alert('Validation', 'All three signatures (Technicien, Contrôle, Admin) are required');
      return;
    }
    try {
      setSubmitting(true);
      const result = await manifolderService.createManifolder({
        id_project: projectId,
        id_zone: zoneId,
        id_type: typeId,
        date: formatDate(date),
        heur_d: heurD ? formatTime(heurD) : undefined,
        heur_f: heurF ? formatTime(heurF) : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
      }, token!);

      // Save signatures after manifolder creation
      if (result.manifolderId) {
        const signaturePromises = [
          manifolderService.saveSignature({
            id_manifolder: result.manifolderId,
            signature_role: 'technicien',
            signature: signatures.technicien!.signature,
            signer_email: signatures.technicien!.email,
          }, token!),
          manifolderService.saveSignature({
            id_manifolder: result.manifolderId,
            signature_role: 'control',
            signature: signatures.control!.signature,
            signer_email: signatures.control!.email,
          }, token!),
          manifolderService.saveSignature({
            id_manifolder: result.manifolderId,
            signature_role: 'admin',
            signature: signatures.admin!.signature,
            signer_email: signatures.admin!.email,
          }, token!),
        ];

        await Promise.all(signaturePromises);
      }
      
      // Close modal and reset form
      setIsModalVisible(false);
      setZoneId('');
      setTypeId('');
      setHeurD(null);
      setHeurF(null);
      setTitle('');
      setDescription('');
      // Reset signatures
      setSignatures({
        technicien: null,
        control: null,
        admin: null,
      });
      
      // Reload manifolders list
      try {
        const updatedManifolders = await manifolderService.getManifolders({}, token!);
        setManifolders(updatedManifolders);
      } catch {
        console.log('Failed to reload manifolders');
      }
      
      // Automatically navigate to questions view for the newly created manifolder
      if (result.manifolderId) {
        setSelectedManifolder(result.manifolderId);
        setCurrentView('questions');
        
        // Show success message with option to go back to list
        Alert.alert(
          'Manifolder Created Successfully!',
          `Manifolder ${result.code_formatted} has been created with all required signatures. You can now answer the questions.`,
          [
            { text: 'Back to List', onPress: handleBackToList },
            { text: 'Continue', style: 'default' }
          ]
        );
      } else {
        Alert.alert('Success', 'Manifolder created successfully');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create manifolder');
    } finally {
      setSubmitting(false);
    }
  }

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
      {manifolders.length > 0 && (
        <View style={styles.manifoldersSection}>
          <View style={styles.sectionHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icons/manifolder.png')}
              style={styles.manifolderLogo}
              resizeMode="contain"
            />
          </View>
          <Pressable onPress={() => setIsModalVisible(true)} style={styles.createButton}>
          <Ionicons name="add-circle" size={20} color="#f87b1b" />
              <Text style={styles.createButtonText}>Ajouter</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.manifoldersList} showsVerticalScrollIndicator={false}>
            {manifolders.slice(0, 10).map((manifolder) => (
              <Pressable
                key={manifolder.id}
                style={styles.manifolderCard}
                onPress={() => handleManifolderSelect(manifolder.id, manifolder)}
              >
                <View style={styles.manifolderCardContent}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.manifolderTitle}>{manifolder.title}</Text>
                    <View style={styles.statusTag}>
                      <Text style={styles.statusTagText}>{manifolder.code_formatted}</Text>
                    </View>
                  </View>
                  
                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <View style={styles.manifolderDetails}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>🏢</Text>
                        <Text style={styles.detailText} numberOfLines={1}>{manifolder.project_title}</Text>
                      </View>
                      <View style={styles.detailSeparator} />
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <Text style={styles.detailText} numberOfLines={1}>{manifolder.zone_title}</Text>
                      </View>
                      <View style={styles.detailSeparator} />
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>📋</Text>
                        <Text style={styles.detailText} numberOfLines={1}>{manifolder.type_title}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateIcon}>📅</Text>
                      <Text style={styles.manifolderDate}>{manifolder.date}</Text>
                    </View>
                    <View style={styles.actionIndicator}>
                      <Text style={styles.actionText}>View Details</Text>
                      <Text style={styles.chevron}>▶</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
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

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsModalVisible(false)}>
          <View />
        </Pressable>
        <View style={styles.modalCenter} pointerEvents="box-none">
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Manifolder</Text>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Photo Upload Section */}
              <View style={styles.photoUploadSection}>
                <Text style={styles.label}>Photos (Coming Soon)</Text>
                <View style={styles.photoGrid}>
                  <Pressable style={styles.photoPlaceholder} onPress={() => Alert.alert('Coming Soon', 'Photo upload feature will be available soon!')}>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={styles.photoLabel}>Photo 1</Text>
                  </Pressable>
                  <Pressable style={styles.photoPlaceholder} onPress={() => Alert.alert('Coming Soon', 'Photo upload feature will be available soon!')}>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={styles.photoLabel}>Photo 2</Text>
                  </Pressable>
                  <Pressable style={styles.photoPlaceholder} onPress={() => Alert.alert('Coming Soon', 'Photo upload feature will be available soon!')}>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={styles.photoLabel}>Photo 3</Text>
                  </Pressable>
                  <Pressable style={styles.photoPlaceholder} onPress={() => Alert.alert('Coming Soon', 'Photo upload feature will be available soon!')}>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={styles.photoLabel}>Photo 4</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter manifolder title..."
                maxLength={100}
              />
              <Text style={styles.label}>Project</Text>
              <View style={styles.dropdownContainer}>
                <Pressable style={styles.selectHeader} onPress={() => setShowProjectDropdown((s) => !s)}>
                  <Text style={styles.inputText}>
                    {projectId ? (projects.find(p => p.id === projectId)?.title || projectId) : 'Select project'}
                  </Text>
                </Pressable>
                {showProjectDropdown ? (
                  <View style={styles.selectBox}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {projects.map((p) => (
                        <Pressable
                          key={p.id}
                          style={styles.selectItem}
                          onPress={() => {
                            setProjectId(p.id);
                            setZoneId('');
                            setShowProjectDropdown(false);
                          }}
                        >
                          <View style={styles.selectItemInner}>
                            <Text style={styles.optionText}>{p.title}</Text>
                            {projectId === p.id ? <Text style={styles.checkMark}>✓</Text> : null}
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              <Text style={styles.label}>Zone</Text>
              <View style={styles.dropdownContainer}>
                <Pressable style={styles.selectHeader} onPress={() => setShowZoneDropdown((s) => !s)}>
                  {zoneId ? (
                    <View style={styles.zoneSelectedRow}>
                      {getZoneLogo(zoneId) && <Image source={{ uri: getZoneLogo(zoneId)! }} style={styles.zoneLogo} />}
                      <Text style={styles.inputText}>
                        {zones.find(z => z.id === zoneId)?.title || zoneId}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.inputText}>Select zone</Text>
                  )}
                </Pressable>
                {showZoneDropdown ? (
                  <View style={styles.selectBox}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {filteredZones.map((z) => (
                        <Pressable
                          key={z.id}
                          style={styles.selectItem}
                          onPress={() => {
                            setZoneId(z.id);
                            setShowZoneDropdown(false);
                          }}
                        >
                          <View style={styles.selectItemInner}>
                            <View style={styles.zoneItemRow}>
                              {z.logo && <Image source={{ uri: `${API_CONFIG.BASE_URL}${z.logo}` }} style={styles.zoneLogo} />}
                              <Text style={styles.optionText}>{z.title}</Text>
                            </View>
                            {zoneId === z.id ? <Text style={styles.checkMark}>✓</Text> : null}
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              <Text style={styles.label}>Type</Text>
              <View style={styles.dropdownContainer}>
                <Pressable style={styles.selectHeader} onPress={() => setShowTypeDropdown((s) => !s)}>
                  <Text style={styles.inputText}>
                    {typeId ? (types.find(t => t.id === typeId)?.title || typeId) : 'Select type'}
                  </Text>
                </Pressable>
                {showTypeDropdown ? (
                  <View style={styles.selectBox}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {types.map((t) => (
                        <Pressable
                          key={t.id}
                          style={styles.selectItem}
                          onPress={() => {
                            setTypeId(t.id);
                            setShowTypeDropdown(false);
                          }}
                        >
                          <View style={styles.selectItemInner}>
                            <Text style={styles.optionText}>{t.title}</Text>
                            {typeId === t.id ? <Text style={styles.checkMark}>✓</Text> : null}
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              

              

              <Text style={styles.label}>Date</Text>
              <Pressable onPress={() => setShowDatePicker(true)} style={styles.inputBox}>
                <Text style={styles.inputText}>{formatDate(date)}</Text>
              </Pressable>
              <DateTimePickerModal
                  isVisible={showDatePicker}
                  mode="date"
                  date={date}
                  onConfirm={(selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                  onCancel={() => setShowDatePicker(false)}
                />

              <Text style={styles.label}>Heure Début</Text>
              <Pressable onPress={() => setShowTimeD(true)} style={styles.inputBox}>
                <Text style={styles.inputText}>{heurD ? formatTime(heurD) : 'Select time'}</Text>
              </Pressable>
              <DateTimePickerModal
                  isVisible={showTimeD}
                  mode="time"
                  date={heurD || new Date()}
                  is24Hour
                  onConfirm={(selected) => {
                    setShowTimeD(false);
                    if (selected) setHeurD(selected);
                  }}
                  onCancel={() => setShowTimeD(false)}
                />

              <Text style={styles.label}>Heure Fin</Text>
              <Pressable onPress={() => setShowTimeF(true)} style={styles.inputBox}>
                <Text style={styles.inputText}>{heurF ? formatTime(heurF) : 'Select time'}</Text>
              </Pressable>
              <DateTimePickerModal
                  isVisible={showTimeF}
                  mode="time"
                  date={heurF || new Date()}
                  is24Hour
                  onConfirm={(selected) => {
                    setShowTimeF(false);
                    if (selected) setHeurF(selected);
                  }}
                  onCancel={() => setShowTimeF(false)}
                />
                <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description (optional)..."
                maxLength={255}
                multiline
                numberOfLines={3}
              />

              {/* Signature Fields */}
              <View style={styles.signatureSection}>
                <Text style={styles.signatureSectionTitle}>Required Signatures</Text>
                <SignatureField
                  role="technicien"
                  roleLabel="Technicien"
                  onSignatureComplete={handleSignatureComplete}
                  isCompleted={!!signatures.technicien}
                />
                <SignatureField
                  role="control"
                  roleLabel="Contrôle"
                  onSignatureComplete={handleSignatureComplete}
                  isCompleted={!!signatures.control}
                />
                <SignatureField
                  role="admin"
                  roleLabel="Admin"
                  onSignatureComplete={handleSignatureComplete}
                  isCompleted={!!signatures.admin}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryBtn} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.secondaryText}>Cancel</Text>
                </Pressable>
                <Pressable disabled={submitting} onPress={handleSubmit} style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
                  <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Create'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
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
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87b1b',
    marginLeft: 6,
  },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
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
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f87b1b',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  manifoldersList: {
    flex: 1,
  },
  manifolderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f87b1b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  manifolderCardContent: {
    padding: 20,
  },
  // Card Header Styles
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  manifolderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
  },
  statusTag: {
    backgroundColor: '#11224e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#11224e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Card Body Styles
  cardBody: {
    marginBottom: 16,
  },
  manifolderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  detailSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  
  // Card Footer Styles
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIcon: {
    fontSize: 14,
    color: '#f87b1b',
  },
  manifolderDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#f87b1b',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 16,
    color: '#f87b1b',
    fontWeight: '700',
  },
  // Photo upload styles
  photoUploadSection: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  photoPlaceholder: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  photoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Signature section styles
  signatureSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  signatureSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11224e',
    marginBottom: 16,
    textAlign: 'center',
  },
});


