import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  

  const handleSubmit = async () => {
    if (!selectedZone) {
      setErrorMessage('Please select a zone to continue.');
      return;
    }

    if (!selectedDeclaration) {
      setErrorMessage('Please select an inventaire declaration.');
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
      setErrorMessage(null);
      onClose();
    } catch {
      setErrorMessage('Failed to create inventaire. Please try again.');
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
    const isZone = 'zone_title' in item;
    const title = isZone
      ? (item.zone_title || item.bloc_title || 'Unknown Zone')
      : (item.title || 'Unknown Declaration');
    const subtitle = isZone ? null : (item.declaration_type_title || 'Declaration');

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.dropdownItem}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownIconWrap}>
            <Ionicons name={isZone ? 'location' : 'documents'} size={18} color="#11224e" />
          </View>
          <View style={styles.dropdownItemContent}>
            <Text style={styles.dropdownItemTitle} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.dropdownItemSubtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Create New Inventaire</Text>
            <Text style={styles.headerSubtitle}>Link an inventaire to a specific zone or bloc</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {!!errorMessage && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={16} color="#b45309" />
            <Text style={styles.alertBannerText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage(null)}>
              <Ionicons name="close" size={16} color="#b45309" />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Zone Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="location" size={18} color="#11224e" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Zone</Text>
                <Text style={styles.cardHint}>Choose the zone you want to inventory</Text>
              </View>
              {selectedZone && (
                <View style={styles.pill}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                  <Text style={styles.pillText}>Selected</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowZoneDropdown(!showZoneDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                <Text style={[styles.dropdownButtonText, !selectedZone && styles.placeholderText]}>
                  {selectedZone ? (selectedZone.zone_title || selectedZone.bloc_title) : 'Choose a zone'}
                </Text>
                <Ionicons name={showZoneDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            {showZoneDropdown && (
              <View style={styles.dropdown}>
                {zones.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemTitle}>No zones available</Text>
                  </View>
                ) : (
                  zones.map((zone) =>
                    renderDropdownItem(zone, () => {
                      setSelectedZone(zone);
                      setShowZoneDropdown(false);
                      setErrorMessage(null);
                    })
                  )
                )}
              </View>
            )}
          </View>

          {/* Declaration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="document-text" size={18} color="#11224e" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Inventaire</Text>
                <Text style={styles.cardHint}>Select an existing inventaire declaration</Text>
              </View>
              {selectedDeclaration && (
                <View style={styles.pill}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                  <Text style={styles.pillText}>Selected</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDeclarationDropdown(!showDeclarationDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                <Text style={[styles.dropdownButtonText, !selectedDeclaration && styles.placeholderText]}>
                  {selectedDeclaration ? selectedDeclaration.title : 'Choose an inventaire'}
                </Text>
                <Ionicons name={showDeclarationDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            {showDeclarationDropdown && (
              <View style={styles.dropdown}>
                {declarations.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemTitle}>No declarations available</Text>
                  </View>
                ) : (
                  declarations.map((declaration) =>
                    renderDropdownItem(declaration, () => {
                      setSelectedDeclaration(declaration);
                      setShowDeclarationDropdown(false);
                      setErrorMessage(null);
                    })
                  )
                )}
              </View>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, (!selectedZone || !selectedDeclaration || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedZone || !selectedDeclaration || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <Ionicons name="hourglass" size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Creating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="save" size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Create Inventaire</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 60,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  dropdownItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#11224e',
    lineHeight: 22,
  },
  dropdownItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#f87b1b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    height: 48,
    alignSelf: 'center',
    width: '92%',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  alertBannerText: {
    color: '#b45309',
    flex: 1,
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11224e',
  },
  cardHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
});
