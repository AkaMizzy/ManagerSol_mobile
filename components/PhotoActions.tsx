import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ICONS } from '../constants/Icons';
import { QualiPhotoItem } from '../services/qualiphotoService';

type PhotoActionsProps = {
  item: QualiPhotoItem;
  onPlaySound: () => void;
  isPlaying: boolean;
  onMapPress: () => void;
  onAddComment?: () => void;
  onAddComplement?: () => void;
  onCreateDeclaration?: () => void;
  onEdit?: () => void;
};

export const PhotoActions: React.FC<PhotoActionsProps> = ({
  item,
  onPlaySound,
  isPlaying,
  onMapPress,
  onAddComment,
  onAddComplement,
  onCreateDeclaration,
  onEdit,
}) => {
  const showActions =
    item.voice_note ||
    (item.latitude && item.longitude) ||
    item.after === 1 ||
    (item.id_qualiphoto_parent && (onAddComplement || onCreateDeclaration)) ||
    (!item.id_qualiphoto_parent && onEdit);

  if (!showActions) {
    return null;
  }

  return (
    <View style={styles.actionsContainer}>
      {item.voice_note && (
        <TouchableOpacity style={styles.actionButton} onPress={onPlaySound}>
          <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={32} color="#11224e" />
        </TouchableOpacity>
      )}
      {item.latitude && item.longitude && (
        <TouchableOpacity style={styles.actionButton} onPress={onMapPress}>
          <Image source={ICONS.map} style={styles.actionIcon} />
        </TouchableOpacity>
      )}
      {item.after === 1 && onAddComment && (
        <TouchableOpacity style={styles.actionButton} onPress={onAddComment}>
          <Ionicons name="add-circle-outline" size={32} color="#11224e" />
        </TouchableOpacity>
      )}
      {item.id_qualiphoto_parent && onAddComplement && (
        <TouchableOpacity style={styles.actionButton} onPress={onAddComplement}>
          <Ionicons name="add" size={32} color="#11224e" />
        </TouchableOpacity>
      )}
      {item.id_qualiphoto_parent && onCreateDeclaration && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCreateDeclaration}
          accessibilityLabel="Créer une déclaration depuis cette photo"
        >
          <Image source={ICONS.declaration} style={styles.actionIcon} />
        </TouchableOpacity>
      )}
      {!item.id_qualiphoto_parent && onEdit && (
        <TouchableOpacity style={styles.actionButton} onPress={onEdit} accessibilityLabel="Éditer">
          <Image source={ICONS.edit} style={styles.actionIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});
