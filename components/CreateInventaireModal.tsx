import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateInventaireData, InventaireDeclaration, UserZone } from '../services/inventaireService';

interface CreateInventaireModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventaireData) => Promise<void>;
  zones: UserZone[];
  declarations: InventaireDeclaration[];
  loading?: boolean;
}

export default function CreateInventaireModal({
  visible,
  onClose,
  onSubmit,
  zones,
  declarations,
  loading = false,
}: CreateInventaireModalProps) {
  const [selectedZone, setSelectedZone] = useState<UserZone | null>(null);
  const [selectedDeclaration, setSelectedDeclaration] = useState<InventaireDeclaration | null>(null);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showDeclarationDropdown, setShowDeclarationDropdown] = useState(false);

  const handleSubmit = async () => {
    if (!selectedZone) {
      Alert.alert('Error', 'Please select a zone');
      return;
    }

    if (!selectedDeclaration) {
      Alert.alert('Error', 'Please select an inventaire declaration');
      return;
    }

    const data: CreateInventaireData = {
      id_inventaire: selectedDeclaration.id,
      ...(selectedZone.id_zone && { id_zone: selectedZone.id_zone }),
      ...(selectedZone.id_bloc && { id_bloc: selectedZone.id_bloc }),
    };

    try {
      await onSubmit(data);
      // Reset form
      setSelectedZone(null);
      setSelectedDeclaration(null);
      onClose();
    } catch {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    setSelectedZone(null);
    setSelectedDeclaration(null);
    setShowZoneDropdown(false);
    setShowDeclarationDropdown(false);
    onClose();
  };

  const renderDropdownItem = (item: UserZone | InventaireDeclaration, onSelect: () => void) => {
    const title = 'zone_title' in item ? (item.zone_title || item.bloc_title) : item.title;
    const subtitle = 'zone_title' in item 
      ? (item.bloc_title ? `Bloc: ${item.bloc_title}` : 'Zone')
      : item.declaration_type_title;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.dropdownItem}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownItemContent}>
          <Text style={styles.dropdownItemTitle}>{title}</Text>
          <Text style={styles.dropdownItemSubtitle}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Inventaire</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Zone Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Zone *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowZoneDropdown(!showZoneDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                <Text style={[
                  styles.dropdownButtonText,
                  !selectedZone && styles.placeholderText
                ]}>
                  {selectedZone 
                    ? (selectedZone.zone_title || selectedZone.bloc_title)
                    : 'Choose a zone'
                  }
                </Text>
                <Ionicons 
                  name={showZoneDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {showZoneDropdown && (
              <View style={styles.dropdown}>
                {zones.map((zone) => 
                  renderDropdownItem(zone, () => {
                    setSelectedZone(zone);
                    setShowZoneDropdown(false);
                  })
                )}
              </View>
            )}
          </View>

          {/* Declaration Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Inventaire Declaration *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDeclarationDropdown(!showDeclarationDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                <Text style={[
                  styles.dropdownButtonText,
                  !selectedDeclaration && styles.placeholderText
                ]}>
                  {selectedDeclaration ? selectedDeclaration.title : 'Choose an inventaire'}
                </Text>
                <Ionicons 
                  name={showDeclarationDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {showDeclarationDropdown && (
              <View style={styles.dropdown}>
                {declarations.map((declaration) => 
                  renderDropdownItem(declaration, () => {
                    setSelectedDeclaration(declaration);
                    setShowDeclarationDropdown(false);
                  })
                )}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedZone || !selectedDeclaration || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedZone || !selectedDeclaration || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Inventaire'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11224e',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11224e',
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#11224e',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#11224e',
    marginBottom: 2,
  },
  dropdownItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#f87b1b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
