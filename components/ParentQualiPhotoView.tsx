import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { ICONS } from '../constants/Icons';
import { Comment, QualiPhotoItem } from '../services/qualiphotoService';
import { PhotoActions } from './PhotoActions';
import { PhotoCard } from './PhotoCard';

const cameraIcon = require('@/assets/icons/camera.gif');

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

function MetaRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, multiline && styles.metaMultiline]}>{value}</Text>
    </View>
  );
}

type ParentQualiPhotoViewProps = {
    item: QualiPhotoItem;
    initialItem: QualiPhotoItem | null;
    onClose: () => void;
    subtitle: string;
    handleGeneratePdf: () => void;
    isGeneratingPdf: boolean;
    setSignatureModalVisible: (visible: boolean) => void;
    setImagePreviewVisible: (visible: boolean) => void;
    childPhotos: QualiPhotoItem[];
    hasActionsOrDescription: boolean;
    isActionsVisible: boolean;
    setActionsVisible: React.Dispatch<React.SetStateAction<boolean>>;
    playSound: () => void;
    isPlaying: boolean;
    handleMapPress: () => void;
    setCommentModalVisible: (visible: boolean) => void;
    setComplementModalVisible: (visible: boolean) => void;
    complement: QualiPhotoItem | null;
    isLoadingComplement: boolean;
    comments: Comment[];
    isLoadingComments: boolean;
    layoutMode: 'grid' | 'list';
    setLayoutMode: (mode: 'grid' | 'list') => void;
    setChildModalVisible: (visible: boolean) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
    isLoadingChildren: boolean;
    childIdToHasComplement: Record<string, boolean>;
    setItem: (item: QualiPhotoItem) => void;
  };
  

  export const ParentQualiPhotoView: React.FC<ParentQualiPhotoViewProps> = ({
    item,
    initialItem,
    onClose,
    subtitle,
    handleGeneratePdf,
    isGeneratingPdf,
    setSignatureModalVisible,
    setImagePreviewVisible,
    childPhotos,
    hasActionsOrDescription,
    isActionsVisible,
    setActionsVisible,
    playSound,
    isPlaying,
    handleMapPress,
    setCommentModalVisible,
    setComplementModalVisible,
    complement,
    isLoadingComplement,
    comments,
    isLoadingComments,
    layoutMode,
    setLayoutMode,
    setChildModalVisible,
    sortOrder,
    setSortOrder,
    isLoadingChildren,
    childIdToHasComplement,
    setItem,
  }) => {
    const header = (
        <View style={styles.header}>
          {item?.id_qualiphoto_parent ? (
            <Pressable onPress={() => setItem(initialItem!)} style={styles.closeBtn}>
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
          {!!item?.title && <Text style={styles.title}>{item.title}</Text>}
          {!!item && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}
          {!!item?.date_taken && <Text style={styles.subtitle}>{formatDate(item.date_taken)}</Text>}
          </View>
          <View style={styles.headerActionsContainer}>
            {item && !item.id_qualiphoto_parent && (
                <TouchableOpacity style={styles.headerAction} onPress={handleGeneratePdf} disabled={isGeneratingPdf} accessibilityLabel="Générer le PDF">
                    {isGeneratingPdf ? (
                        <ActivityIndicator color="#f87b1b" />
                    ) : (
                        <Image source={ICONS.pdf} style={styles.headerActionIcon} />
                    )}
                </TouchableOpacity>
            )}
            {item && !item.id_qualiphoto_parent && (
              <TouchableOpacity style={styles.headerAction} onPress={() => setSignatureModalVisible(true)} accessibilityLabel="Signatures">
                <Image source={ICONS.signature} style={styles.headerActionIcon} />
              </TouchableOpacity>
            )}
  
            {item?.id_qualiphoto_parent && (
              <TouchableOpacity style={styles.headerAction} onPress={() => {}} accessibilityLabel="Éditer le plan de zone">
                  <Image 
                    source={item.photo_plan ? { uri: item.photo_plan } : require('@/assets/icons/plan.png')} 
                    style={[styles.headerPlanIcon]} 
                  />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    return (
        <>
        {header}
        <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 }}>
          {item.photo ? (
            <PhotoCard
              uri={item.photo}
              title={item.title}
              userName={item.user_name}
              userLastName={item.user_lastname}
              date={item.date_taken}
              onPress={() => setImagePreviewVisible(true)}
              onToggleActions={() => setActionsVisible(v => !v)}
              isActionsVisible={isActionsVisible}
            />
          ) : (
            hasActionsOrDescription ? (
              <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                <TouchableOpacity
                  style={styles.inlineActionsButton}
                  onPress={() => setActionsVisible(v => !v)}
                  accessibilityLabel={isActionsVisible ? 'Masquer les actions' : 'Afficher les actions'}
                >
                  <Ionicons name={isActionsVisible ? 'close' : 'ellipsis-horizontal'} size={20} color="#11224e" />
                </TouchableOpacity>
              </View>
            ) : null
          )}
        </View>
        <ScrollView bounces>
          <View style={[styles.content, { paddingTop: 0 }]}>
            {isActionsVisible && (
              <>
                <PhotoActions
                  item={item}
                  isPlaying={isPlaying}
                  onPlaySound={playSound}
                  onMapPress={handleMapPress}
                  onAddComment={() => setCommentModalVisible(true)}
                  onAddComplement={() => setComplementModalVisible(true)}
                />
                {(typeof item.commentaire === 'string' && item.commentaire.trim().length > 0) ? (
                  <View style={styles.metaCard}>
                    {typeof item.commentaire === 'string' && item.commentaire.trim().length > 0 ? (
                      <View style={[styles.metaRow, { borderTopWidth: 0, paddingTop: 0 }]}>
                        <Text style={styles.metaLabel}>Description</Text>
                        <Text style={[styles.metaValue, styles.metaMultiline]}>{item.commentaire}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                {item.id_qualiphoto_parent && (
                  <View style={styles.metaCard}>
                    <Text style={styles.sectionTitle}>Photo après</Text>
                    {isLoadingComplement ? (
                      <ActivityIndicator style={{ marginVertical: 12 }} />
                    ) : complement ? (
                      <View>
                        {(complement.photo_comp || complement.photo) ? (
                          (() => {
                            const compUri = complement.photo_comp || complement.photo;
                            if (!compUri) return null;
                            return (
                              <TouchableOpacity onPress={() => setImagePreviewVisible(true)} activeOpacity={0.9}>
                                <View style={styles.imageWrap}>
                                  <Image source={{ uri: compUri }} style={styles.image} />
                                </View>
                              </TouchableOpacity>
                            );
                          })()
                        ) : null}
                      </View>
                    ) : (
                      <Text style={styles.noChildrenText}>Aucune photo après.</Text>
                    )}
                  </View>
                )}
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
              <>
                <View style={styles.sectionSeparator} />
                <View style={styles.childPicturesContainer}>
                <View style={[styles.childListHeader, childPhotos.length === 0 && { justifyContent: 'center' }]}>
                  {childPhotos.length > 0 && (
                    <View style={styles.layoutToggleContainer}>
                      <TouchableOpacity
                          style={[styles.layoutToggleButton, layoutMode === 'list' && styles.layoutToggleButtonActive]}
                          onPress={() => setLayoutMode('list')}
                      >
                          <Ionicons name="list" size={20} color={layoutMode === 'list' ? '#FFFFFF' : '#11224e'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                          style={[styles.layoutToggleButton, layoutMode === 'grid' && styles.layoutToggleButtonActive]}
                          onPress={() => setLayoutMode('grid')}
                      >
                          <Ionicons name="grid" size={20} color={layoutMode === 'grid' ? '#FFFFFF' : '#11224e'} />
                      </TouchableOpacity>
                   </View>
                 )}
                 <TouchableOpacity
                   onPress={() => setChildModalVisible(true)}
                   accessibilityLabel="Ajouter une photo avant"
                   style={styles.cameraCTA}
                 >
                   <Image source={cameraIcon} style={styles.cameraCTAIcon} />
                   <Text style={styles.cameraCTALabel}>Prendre la situation avant</Text>
                 </TouchableOpacity>
                 {childPhotos.length > 0 && (
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
                {!isLoadingChildren && childPhotos.length === 0 && item.before === 1 && (
                  <Text style={styles.noChildrenText}>Aucune photo suivie n&apos;a encore été ajoutée.</Text>
                )}
                <View style={layoutMode === 'grid' ? styles.childGridContainer : styles.childListContainer}>
                  {childPhotos.map((child) => (
                    <View style={layoutMode === 'grid' ? styles.childGridItem : styles.childListItem}>
                        <PhotoCard
                            key={child.id}
                            uri={child.photo}
                            title={child.title}
                            userName={child.user_name}
                            userLastName={child.user_lastname}
                            date={child.date_taken}
                            onPress={() => setItem(child)}
                        />
                    </View>
                  ))}
                </View>
              </View>
              </>
            )}
          </View>
        </ScrollView>
        
      </>
    )
  }

const styles = StyleSheet.create({
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
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f87b1b',
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
      headerActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
      },
      headerActionIcon: {
        width: 40,
        height: 40,
      },
      headerPlanIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#f87b1b',
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
      content: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 24,
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
        top: 12,
        right: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
      },
      inlineActionsButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#f87b1b',
        justifyContent: 'center',
        alignItems: 'center',
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
      sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f87b1b',
        marginBottom: 8,
      },
      childThumbnail: {
        width: '100%',
        aspectRatio: 16/9,
        backgroundColor: '#f3f4f6',
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
      childListItem: {
        width: '100%',
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
      childListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
      },
      cameraCTALabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#11224e',
        marginLeft: 8,
      },
      cameraCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        marginHorizontal: 12,
      },
      cameraCTAIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
      },
      sortButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      layoutToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f87b1b',
        overflow: 'hidden',
        width: 80,
        height: 40,
      },
      layoutToggleButton: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      layoutToggleButtonActive: {
        backgroundColor: '#f87b1b',
      },
      childGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8,
      },
      childListContainer: {
        marginTop: 8,
      },
      childPicturesContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: 8,
        paddingBottom: 8,
      },
      sectionSeparator: {
        height: 1,
        backgroundColor: '#f87b1b',
        marginVertical: 16,
        marginHorizontal: 12,
      },
});
