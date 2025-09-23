import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateChildQualiPhotoForm } from './CreateChildQualiPhotoModal';

import { useAuth } from '@/contexts/AuthContext';
import AppHeader from './AppHeader';

const cameraIcon = require('@/assets/icons/camera.png');
const mapIcon = require('@/assets/icons/map.png');

type Props = {
  visible: boolean;
  onClose: () => void;
  item?: QualiPhotoItem | null;
};

type QualiPhotoItemWithComment2 = QualiPhotoItem & {
  commentaire2?: string | null;
};

 export default function QualiPhotoDetail({ visible, onClose, item: initialItem }: Props) {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMapDetailVisible, setMapDetailVisible] = useState(false);
  const [isChildModalVisible, setChildModalVisible] = useState(false);
  const [children, setChildren] = useState<QualiPhotoItem[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [item, setItem] = useState<QualiPhotoItemWithComment2 | null>(initialItem || null);
  const [isImagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    setItem(initialItem || null);
    setSortOrder('desc'); // Reset sort order when item changes
  }, [initialItem]);

  useEffect(() => {
    if (item && item.before === 1 && token) {
      setIsLoadingChildren(true);
      qualiphotoService.getChildren(item.id, token, sortOrder)
        .then(setChildren)
        .catch(() => setChildren([]))
        .finally(() => setIsLoadingChildren(false));
    } else {
      setChildren([]);
    }
  }, [item, token, sortOrder]);

  const subtitle = useMemo(() => {
    if (!item) return '';
    const project = item.project_title || '—';
    const zone = item.zone_title || '—';
    return `${project} • ${zone}`;
  }, [item]);

  async function playSound() {
    if (!item?.voice_note) return;

    if (isPlaying && sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (sound) {
      await sound.replayAsync();
      setIsPlaying(true);
      return;
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.voice_note });
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          newSound.setPositionAsync(0);
        }
      });

      await newSound.playAsync();
    } catch (e) {
      console.error("Failed to play sound", e);
    }
  }

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    if (!visible) {
      sound?.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setImagePreviewVisible(false);
    }
  }, [visible, sound]);

  const handleChildSuccess = (createdItem: Partial<QualiPhotoItem>) => {
    setChildModalVisible(false);
    if (item && token) {
        setIsLoadingChildren(true);
        qualiphotoService.getChildren(item.id, token)
            .then((newChildren) => {
                setChildren(newChildren);
                if (createdItem.id) {
                  const newChildInList = newChildren.find((c) => c.id === createdItem.id);
                  if (newChildInList) {
                      setItem(newChildInList);
                  }
                }
            })
            .catch(() => setChildren([]))
            .finally(() => setIsLoadingChildren(false));
    }
  };

   const renderMapView = () => (
    <>
        <View style={styles.header}>
            <Pressable onPress={() => setMapDetailVisible(false)} style={styles.closeBtn}>
                <Ionicons name="arrow-back" size={24} color="#11224e" />
            </Pressable>
            <View style={styles.headerTitles}>
                <Text style={styles.title}>Localisation de la Photo</Text>
            </View>
            <View style={{ width: 40 }} />
        </View>
        <MapView
            style={{ flex: 1 }}
            initialRegion={{
                latitude: item!.latitude!,
                longitude: item!.longitude!,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
        >
            <Marker coordinate={{ latitude: item!.latitude!, longitude: item!.longitude! }} />
        </MapView>
    </>
   );

   const renderDetailView = () => (
    <>
        <View style={styles.header}>
          {item?.id_qualiphoto_parent ? (
            <Pressable onPress={() => setItem(initialItem || null)} style={styles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color="#11224e" />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer les détails"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#11224e" />
            </Pressable>
          )}
          <View style={styles.headerTitles}>
           
            {!!item && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={{ width: 40 }} />
        </View>

         <ScrollView contentContainerStyle={styles.scrollContent} bounces>
          {!!item && (
            <View style={styles.content}>
              <View style={styles.metaCard}>
                
                {(item.user_name || item.date_taken) && (
                  <View style={styles.inlineMetaRow}>
                    <View style={styles.inlineMetaItem}>
                      {item.user_name && (
                        <>
                          <Text style={styles.metaLabel}>Prise par</Text>
                          <Text style={styles.metaValue} numberOfLines={1}>{`${item.user_name} ${item.user_lastname || ''}`.trim()}</Text>
                        </>
                      )}
                    </View>
                    <View style={styles.inlineMetaItem}>
                      {item.date_taken && (
                        <>
                          <Text style={styles.metaLabel}>Date de prise</Text>
                          <Text style={styles.metaValue} numberOfLines={1}>{formatDate(item.date_taken)}</Text>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {typeof item.commentaire === 'string' && item.commentaire.trim().length > 0 ? (
                  <MetaRow label="Commentaire" value={item.commentaire} multiline />
                ) : null}
                {item.commentaire2 && <MetaRow label="Commentaire 2" value={item.commentaire2} multiline />}
              </View>
              <TouchableOpacity onPress={() => setImagePreviewVisible(true)} activeOpacity={0.9}>
                <View style={styles.imageWrap}>
                  <Image source={{ uri: item.photo }} style={styles.image} />
                </View>
              </TouchableOpacity>

              {(item.voice_note || item.before === 1 || (item.latitude && item.longitude)) && (
                <View style={styles.actionsContainer}>
                  {item.voice_note && (
                    <TouchableOpacity style={styles.actionButton} onPress={playSound}>
                      <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={32} color="#11224e" />
                    </TouchableOpacity>
                  )}
                  {item.before === 1 && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => setChildModalVisible(true)}>
                      <Image source={cameraIcon} style={styles.actionIcon} />
                    </TouchableOpacity>
                  )}
                  {item.latitude && item.longitude && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => setMapDetailVisible(true)}>
                      <Image source={mapIcon} style={styles.actionIcon} />
                    </TouchableOpacity>
                  )}
                  {item.before === 1 && children.length > 0 && (
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => setSortOrder(current => current === 'asc' ? 'desc' : 'asc')}
                      accessibilityLabel={sortOrder === 'desc' ? 'Trier par ordre croissant' : 'Trier par ordre décroissant'}
                    >
                      <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={32} color="#11224e" />
                    </TouchableOpacity>
                  )}
                  {item.after === 1 && !item.commentaire2 && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => setCommentModalVisible(true)}>
                      <Ionicons name="pencil" size={32} color="#11224e" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              
              {item.before === 1 && (
                <View style={styles.metaCard}>
                  {isLoadingChildren && <Text>Chargement...</Text>}
                  {!isLoadingChildren && children.length === 0 && item.before === 1 && (
                      <Text style={styles.noChildrenText}>Aucune photo suivie n&apos;a encore été ajoutée.</Text>
                  )}
                  <View style={styles.childListContainer}>
                    {children.map((child) => (
                      <TouchableOpacity key={child.id} style={styles.childItem} onPress={() => setItem(child)}>
                        <View style={styles.childItemContent}>
                          {child.date_taken && (
                            <Text style={styles.childDate}>{formatDate(child.date_taken)}</Text>
                          )}
                          <Text style={styles.childComment} numberOfLines={1}>{child.commentaire || 'Aucun commentaire'}</Text>
                        </View>
                        <Image source={{ uri: child.photo }} style={styles.childThumbnail} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {item.id_qualiphoto_parent && (
                  <TouchableOpacity style={styles.backToParentButton} onPress={() => setItem(initialItem || null)}>
                      <Ionicons name="arrow-back" size={16} color="#11224e" />
                      <Text style={styles.backToParentButtonText}>Retour à la photo originale</Text>
                  </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
    </>
   );

   const handleAddComment = async () => {
    if (!item || !token || !newComment.trim()) {
      Alert.alert('Erreur', 'Le commentaire ne peut pas être vide.');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await qualiphotoService.updateCommentaire2(item.id, newComment, token);
      // Optimistically update the item
      setItem(prev => prev ? { ...prev, commentaire2: newComment } : null);
      setCommentModalVisible(false);
      setNewComment('');
      Alert.alert('Succès', 'Commentaire ajouté avec succès.');
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Erreur', 'Échec de l\'ajout du commentaire.');
    } finally {
      setIsSubmittingComment(false);
    }
   };

   const renderCommentModal = () => (
    <Modal
      visible={isCommentModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCommentModalVisible(false)}
    >
      <View style={styles.commentModalContainer}>
        <View style={styles.commentModalContent}>
          <Text style={styles.commentModalTitle}>Ajouter un Commentaire</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Saisissez votre commentaire..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <View style={styles.commentModalActions}>
            <TouchableOpacity
              style={styles.commentModalButton}
              onPress={() => setCommentModalVisible(false)}
            >
              <Text style={styles.commentModalButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.commentModalButton, styles.commentModalSaveButton]}
              onPress={handleAddComment}
              disabled={isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.commentModalButtonText, { color: '#fff' }]}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

   const renderImagePreview = () => (
    <View style={styles.previewContainer}>
      <Image source={{ uri: item!.photo }} style={styles.previewImage} resizeMode="contain" />
      <TouchableOpacity
        style={[styles.previewCloseButton, { top: insets.top + 10 }]}
        onPress={() => setImagePreviewVisible(false)}
      >
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );

   return (
     <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <AppHeader user={user || undefined} onNavigate={onClose} />
        {isImagePreviewVisible ? (
          renderImagePreview()
        ) : item && isChildModalVisible ? (
          <CreateChildQualiPhotoForm
            parentItem={item}
            onSuccess={handleChildSuccess}
            onClose={() => setChildModalVisible(false)}
          />
        ) : isMapDetailVisible ? (
          renderMapView()
        ) : (
          renderDetailView()
        )}
        {renderCommentModal()}
      </View>
    </Modal>
  );
}

function MetaRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, multiline && styles.metaMultiline]}>{value}</Text>
    </View>
  );
}

function formatDate(dateStr: string) {
  const replaced = dateStr.replace(' ', 'T');
  const date = new Date(replaced);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11224e',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8E8E93',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  imageWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#f3f4f6'
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  metaRow: {
    marginBottom: 10,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 10,
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
  },
  metaValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  metaMultiline: {
    lineHeight: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  playButton: {
    // styles for the play button
  },
  playerMeta: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  playerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  mapPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#11224e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addChildButtonTextView: {
    flex: 1,
  },
  addChildButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  childListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  childListContainer: {
    marginTop: 8,
    gap: 12,
  },
  childItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  childThumbnail: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#f3f4f6',
  },
  childItemContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  childComment: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'right',
  },
  childDate: {
    fontSize: 11,
    color: '#6b7280',
    marginRight: 8,
  },
  noChildrenText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 16,
    fontSize: 13,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    width: 32,
    height: 32,
  },
  backToParentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      marginTop: 8,
  },
  backToParentButtonText: {
      color: '#11224e',
      fontWeight: '600',
  },
  inlineMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  inlineMetaItem: {
    flex: 1,
  },
  borderedMetaRow: {
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 10,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewCloseButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
  },
  commentModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  commentModalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  commentInput: {
    width: '100%',
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: 'top',
  },
  commentModalActions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: '100%',
  },
  commentModalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  commentModalSaveButton: {
    backgroundColor: '#11224e',
  },
  commentModalButtonText: {
    fontSize: 16,
  },
});


