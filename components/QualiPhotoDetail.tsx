import qualiphotoService, { Comment, QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, LayoutAnimation, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateChildQualiPhotoForm } from './CreateChildQualiPhotoModal';

import { useAuth } from '@/contexts/AuthContext';
import AppHeader from './AppHeader';

const cameraIcon = require('@/assets/icons/camera.gif');
const mapIcon = require('@/assets/icons/map.png');


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ChildPhotoCardProps = {
  child: QualiPhotoItem;
  onPress: () => void;
  mode: 'grid' | 'list';
};

const ChildPhotoCard: React.FC<ChildPhotoCardProps> = ({ child, onPress, mode }) => {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsVisible(!isVisible);
  };

  return (
    <View style={[styles.childGridItem, mode === 'list' && { width: '100%' }]}>
      <TouchableOpacity onPress={isVisible ? onPress : toggleVisibility}>
        {isVisible ? (
          <>
            <Image source={{ uri: child.photo }} style={styles.childThumbnail} />
            <View style={styles.childGridOverlay}>
              {child.title && <Text style={styles.childGridTitle} numberOfLines={1}>{child.title}</Text>}
              {child.date_taken && <Text style={styles.childGridDate}>{formatDate(child.date_taken)}</Text>}
            </View>
          </>
        ) : (
          <View style={styles.hiddenImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#9ca3af" />
            <Text style={styles.hiddenImageText}>Image cachée</Text>
            <Text style={styles.hiddenImageSubText}>Appuyez pour réafficher</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleVisibility} style={styles.eyeIcon}>
        <Ionicons name={isVisible ? 'eye-outline' : 'eye-off-outline'} size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

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
  const [item, setItem] = useState<QualiPhotoItem | null>(initialItem || null);
  const [isImagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isActionsVisible, setActionsVisible] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setItem(initialItem || null);
    setSortOrder('desc'); // Reset sort order when item changes
    setActionsVisible(false);
    setLayoutMode('grid');
  }, [initialItem]);

  useEffect(() => {
    if (item && item.id && token) {
      if (item.after === 1) {
        setIsLoadingComments(true);
        qualiphotoService.getComments(item.id, token)
          .then(setComments)
          .catch(() => setComments([]))
          .finally(() => setIsLoadingComments(false));
      } else {
        setComments([]);
      }

      if (item.before === 1) {
        setIsLoadingChildren(true);
        qualiphotoService.getChildren(item.id, token, sortOrder)
          .then(setChildren)
          .catch(() => setChildren([]))
          .finally(() => setIsLoadingChildren(false));
      } else {
        setChildren([]);
      }
    } else {
      setChildren([]);
      setComments([]);
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
      setActionsVisible(false);
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

  const hasActionsOrDescription = useMemo(() => {
    if (!item) return false;
    const hasActions = item.voice_note || 
                       (item.latitude && item.longitude) || 
                       (item.before === 1 && children.length > 0) || 
                       item.after === 1;
    const hasDescription = typeof item.commentaire === 'string' && item.commentaire.trim().length > 0;
    return hasActions || hasDescription;
  }, [item, children]);

  const handleMapPress = () => {
    if (!item?.latitude || !item.longitude) return;

    const url = Platform.select({
      ios: `maps:${item.latitude},${item.longitude}?q=${item.latitude},${item.longitude}`,
      android: `geo:${item.latitude},${item.longitude}?q=${item.latitude},${item.longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert("Erreur", "Impossible d'ouvrir l'application de cartographie.");
      });
    }
  };

  const renderChildItem = ({ item: child }: { item: QualiPhotoItem }) => (
    <TouchableOpacity style={styles.childGridItem} onPress={() => setItem(child)}>
      <Image source={{ uri: child.photo }} style={styles.childThumbnail} />
      <View style={styles.childGridOverlay}>
        {child.title && <Text style={styles.childGridTitle} numberOfLines={1}>{child.title}</Text>}
        {child.date_taken && (
          <Text style={styles.childGridDate}>{formatDate(child.date_taken)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

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

   const renderDetailView = () => {
    if (!item) return null;

    const header = (
      <View style={styles.header}>
        {item?.id_qualiphoto_parent ? (
          <Pressable onPress={() => setItem(initialItem || null)} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={28} color="#f87b1b" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer les détails"
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Ionicons name="arrow-back" size={28} color="#f87b1b" />
          </Pressable>
        )}
        <View style={styles.headerTitles}>
        {!!item && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}
        {!!item?.title && <Text style={styles.title}>{item.title}</Text>}
          
        </View>
        {item?.before === 1 ? (
          <TouchableOpacity style={styles.headerAction} onPress={() => setChildModalVisible(true)}>
            <Image source={cameraIcon} style={styles.headerActionIcon} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
    );

    if (item?.id === initialItem?.id) {
      // Original Item View: Fixed top, scrollable bottom
      return (
        <>
          {header}
          <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 }}>
            <TouchableOpacity onPress={() => setImagePreviewVisible(true)} activeOpacity={0.9}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.photo }} style={styles.image} />
              </View>
            </TouchableOpacity>
            {hasActionsOrDescription && (
              <TouchableOpacity
                style={styles.toggleActionsButton}
                onPress={() => setActionsVisible(v => !v)}
                accessibilityLabel={isActionsVisible ? 'Masquer les actions' : 'Afficher les actions'}
              >
                <Ionicons name={isActionsVisible ? 'close' : 'ellipsis-horizontal'} size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView bounces>
            <View style={[styles.content, { paddingTop: 0 }]}>
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
              </View>
              {isActionsVisible && (
                <>
                  {(item.voice_note || (item.latitude && item.longitude) || item.after === 1) && (
                    <View style={styles.actionsContainer}>
                      {item.voice_note && (
                        <TouchableOpacity style={styles.actionButton} onPress={playSound}>
                          <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={32} color="#11224e" />
                        </TouchableOpacity>
                      )}
                      {item.latitude && item.longitude && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleMapPress}>
                          <Image source={mapIcon} style={styles.actionIcon} />
                        </TouchableOpacity>
                      )}
                      {item.after === 1 && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => setCommentModalVisible(true)}>
                          <Ionicons name="add-circle-outline" size={32} color="#11224e" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {typeof item.commentaire === 'string' && item.commentaire.trim().length > 0 ? (
                    <View style={styles.metaCard}>
                      <MetaRow label="Description" value={item.commentaire} multiline />
                    </View>
                  ) : null}
                </>
              )}
              {item.after === 1 && (comments.length > 0 || isLoadingComments) && (
                <View style={styles.metaCard}>
                  <Text style={styles.sectionTitle}>Commentaires</Text>
                  {isLoadingComments && <ActivityIndicator style={{ marginVertical: 16 }} />}
                  {comments.map((comment) => (
                    <MetaRow
                      key={comment.id}
                      label={`De ${comment.user_name || 'Utilisateur'} le ${formatDate(comment.created_at)}`}
                      value={comment.commentaire_text}
                      multiline
                    />
                  ))}
                </View>
              )}
              {item.before === 1 && (
                <View style={styles.metaCard}>
                  <View style={styles.childListHeader}>
                    {children.length > 0 ? (
                      <TouchableOpacity 
                        style={styles.pageButton} 
                        onPress={() => setLayoutMode(prev => prev === 'grid' ? 'list' : 'grid')}
                      >
                        <Text style={styles.pageButtonText}>{layoutMode === 'grid' ? '2' : '1'}</Text>
                      </TouchableOpacity>
                    ) : null}
                    <Text style={styles.sectionTitle}>Évolution Travaux Prévus</Text>
                    {children.length > 0 && (
                      <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => setSortOrder(current => current === 'asc' ? 'desc' : 'asc')}
                        accessibilityLabel={sortOrder === 'desc' ? 'Trier par ordre croissant' : 'Trier par ordre décroissant'}
                      >
                        <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={24} color="#f87b1b" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {isLoadingChildren && <Text>Chargement...</Text>}
                  {!isLoadingChildren && children.length === 0 && item.before === 1 && (
                    <Text style={styles.noChildrenText}>Aucune photo suivie n&apos;a encore été ajoutée.</Text>
                  )}
                  <View style={styles.childGridContainer}>
                    {children.map((child) => (
                      <ChildPhotoCard
                        key={child.id}
                        child={child}
                        onPress={() => setItem(child)}
                        mode={layoutMode}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      );
    } else {
      // Child Item View: Fully scrollable
      return (
        <>
          {header}
          <ScrollView bounces>
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
              </View>

              <View>
                <TouchableOpacity onPress={() => setImagePreviewVisible(true)} activeOpacity={0.9}>
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: item.photo }} style={styles.image} />
                  </View>
                </TouchableOpacity>
                {hasActionsOrDescription && (
                  <TouchableOpacity
                    style={styles.toggleActionsButton}
                    onPress={() => setActionsVisible(v => !v)}
                    accessibilityLabel={isActionsVisible ? 'Masquer les actions' : 'Afficher les actions'}
                  >
                    <Ionicons name={isActionsVisible ? 'close' : 'ellipsis-horizontal'} size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              {isActionsVisible && (
                <>
                  {(item.voice_note || (item.latitude && item.longitude) || item.after === 1) && (
                    <View style={styles.actionsContainer}>
                      {item.voice_note && (
                        <TouchableOpacity style={styles.actionButton} onPress={playSound}>
                          <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={32} color="#11224e" />
                        </TouchableOpacity>
                      )}
                      {item.latitude && item.longitude && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleMapPress}>
                          <Image source={mapIcon} style={styles.actionIcon} />
                        </TouchableOpacity>
                      )}
                      {item.after === 1 && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => setCommentModalVisible(true)}>
                          <Ionicons name="add-circle-outline" size={32} color="#11224e" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {typeof item.commentaire === 'string' && item.commentaire.trim().length > 0 ? (
                    <View style={styles.metaCard}>
                      <MetaRow label="Description" value={item.commentaire} multiline />
                    </View>
                  ) : null}
                </>
              )}

              {item.after === 1 && (comments.length > 0 || isLoadingComments) && (
                <View style={styles.metaCard}>
                  <Text style={styles.sectionTitle}>Commentaires</Text>
                  {isLoadingComments && <ActivityIndicator style={{ marginVertical: 16 }} />}
                  {comments.map((comment) => (
                    <MetaRow
                      key={comment.id}
                      label={`De ${comment.user_name || 'Utilisateur'} le ${formatDate(comment.created_at)}`}
                      value={comment.commentaire_text}
                      multiline
                    />
                  ))}
                </View>
              )}

              {item.id_qualiphoto_parent && (
                <TouchableOpacity style={styles.backToParentButton} onPress={() => setItem(initialItem || null)}>
                  <Ionicons name="arrow-back" size={16} color="#f87b1b" />
                  <Text style={styles.backToParentButtonText}>Retour à la photo originale</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </>
      );
    }
   };

   const handleAddComment = async () => {
    if (!item || !token || !newComment.trim()) {
      Alert.alert('Erreur', 'Le commentaire ne peut pas être vide.');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await qualiphotoService.addComment(item.id, newComment, token);
      
      // Refetch comments
      const updatedComments = await qualiphotoService.getComments(item.id, token);
      setComments(updatedComments);

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
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    width: 50,
    height: 50,
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
  scrollContent: {},
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  staticContent: {
    gap: 12,
  },
  imageWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f87b1b',
    overflow: 'hidden',
  },
  toggleActionsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    borderColor: '#f87b1b',
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
    borderColor: '#f87b1b',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f87b1b',
    marginBottom: 8,

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
  childGridItem: {
    width: '49%',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  childGridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    gap: 2,
  },
  childGridTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  childGridDate: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  eyeIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 4,
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
    borderWidth: 1,
    borderColor: '#f87b1b',
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
      color: '#f87b1b',
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
    borderWidth: 2,
    borderColor: '#f87b1b',
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
    borderColor: '#f87b1b',
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
    backgroundColor: '#f87b1b',
  },
  commentModalButtonText: {
    fontSize: 16,
  },
  hiddenImagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f87b1b',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  hiddenImageText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  hiddenImageSubText: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 12,
  },
  childListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sortButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f87b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  childList: {
    marginTop: 8,
  },
  childListColumnWrapper: {
    justifyContent: 'space-between',
  },
  childGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});


