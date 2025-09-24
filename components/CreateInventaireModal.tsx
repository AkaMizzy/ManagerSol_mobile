import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateInventaireData, InventaireDeclaration, UserZone, ZoneBloc } from '../services/inventaireService';

interface CreateInventaireModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventaireData) => Promise<void>;
  zones: UserZone[];
  declarations: InventaireDeclaration[];
  loading?: boolean;
  onFetchBlocs?: (zoneId: string) => Promise<ZoneBloc[]>;
}

export default function CreateInventaireModal({
  visible,
  onClose,
  onSubmit,
  zones,
  declarations,
  loading = false,
  onFetchBlocs,
}: CreateInventaireModalProps) {
  const [selectedZone, setSelectedZone] = useState<UserZone | null>(null);
  const [selectedBloc, setSelectedBloc] = useState<ZoneBloc | null>(null);
  const [selectedDeclaration, setSelectedDeclaration] = useState<InventaireDeclaration | null>(null);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showBlocDropdown, setShowBlocDropdown] = useState(false);
  const [showDeclarationDropdown, setShowDeclarationDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableBlocs, setAvailableBlocs] = useState<ZoneBloc[]>([]);
  const [loadingBlocs, setLoadingBlocs] = useState(false);

  const handleZoneSelect = async (zone: UserZone) => {
    setSelectedZone(zone);
    setSelectedBloc(null); // Reset bloc selection when zone changes
    setShowZoneDropdown(false);
    setErrorMessage(null);
    
    // Fetch blocs for the selected zone
    if (onFetchBlocs && zone.id_zone) {
      setLoadingBlocs(true);
      try {
        const blocs = await onFetchBlocs(zone.id_zone);
        setAvailableBlocs(blocs);
      } catch (error) {
        setErrorMessage('Échec du chargement des blocs pour cette zone');
        setAvailableBlocs([]);
      } finally {
        setLoadingBlocs(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedZone) {
      setErrorMessage('Veuillez sélectionner une zone pour continuer.');
      return;
    }

    if (!selectedDeclaration) {
      setErrorMessage('Veuillez sélectionner une déclaration d\'inventaire.');
      return;
    }

    const data: CreateInventaireData = {
      id_inventaire: selectedDeclaration.id,
      ...(selectedZone.id_zone && { id_zone: selectedZone.id_zone }),
      ...(selectedBloc && { id_bloc: selectedBloc.id }),
    };

    try {
      await onSubmit(data);
      // Reset form
      setSelectedZone(null);
      setSelectedBloc(null);
      setSelectedDeclaration(null);
      setAvailableBlocs([]);
      setErrorMessage(null);
      onClose();
    } catch {
      setErrorMessage('Échec de la création de l\'inventaire. Veuillez réessayer.');
    }
  };

  const handleClose = () => {
    setSelectedZone(null);
    setSelectedBloc(null);
    setSelectedDeclaration(null);
    setShowZoneDropdown(false);
    setShowBlocDropdown(false);
    setShowDeclarationDropdown(false);
    setAvailableBlocs([]);
    setErrorMessage(null);
    onClose();
  };

  const renderDropdownItem = (item: UserZone | InventaireDeclaration | ZoneBloc, onSelect: () => void) => {
    const isZone = 'zone_title' in item;
    const isBloc = 'intitule' in item;
    const title = isZone
      ? (item.zone_title || item.bloc_title || 'Zone inconnue')
      : isBloc
      ? (item.intitule || 'Bloc inconnu')
      : (item.title || 'Déclaration inconnue');
    const subtitle = isZone ? null : isBloc ? 'Bloc' : (item.declaration_type_title || 'Déclaration');
    const iconName = isZone ? 'location' : isBloc ? 'cube' : 'documents';
    const zoneLogo = isZone ? (item as UserZone).zone_logo : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.dropdownItem}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownIconWrap}>
            {isZone && zoneLogo ? (
              <Image 
                source={{ uri: zoneLogo }} 
                style={styles.dropdownLogo}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name={iconName} size={18} color="#11224e" />
            )}
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
            <Text style={styles.headerTitle}>Créer un nouvel inventaire</Text>
            <Text style={styles.headerSubtitle}>Lier un inventaire à une zone ou un bloc spécifique</Text>
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
                <Text style={styles.cardHint}>Choisissez la zone que vous souhaitez inventorier</Text>
              </View>
              {selectedZone && (
                <View style={styles.pill}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                  <Text style={styles.pillText}>Sélectionné</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowZoneDropdown(!showZoneDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                <View style={styles.dropdownButtonLeft}>
                  {selectedZone?.zone_logo ? (
                    <Image 
                      source={{ uri: selectedZone.zone_logo }} 
                      style={styles.dropdownButtonLogo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.dropdownButtonIconWrap}>
                      <Ionicons name="location" size={16} color="#11224e" />
                    </View>
                  )}
                  <Text style={[styles.dropdownButtonText, !selectedZone && styles.placeholderText]}>
                    {selectedZone ? (selectedZone.zone_title || selectedZone.bloc_title) : 'Choisissez une zone'}
                  </Text>
                </View>
                <Ionicons name={showZoneDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            {showZoneDropdown && (
              <View style={styles.dropdown}>
                {zones.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemTitle}>Aucune zone disponible</Text>
                  </View>
                ) : (
                  zones.map((zone) =>
                    renderDropdownItem(zone, () => handleZoneSelect(zone))
                  )
                )}
              </View>
            )}
          </View>

          {/* Bloc Card */}
          <View style={[styles.card, !selectedZone && styles.cardDisabled]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="cube" size={18} color="#11224e" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Bloc (Optionnel)</Text>
                <Text style={styles.cardHint}>Choisissez un bloc spécifique dans la zone sélectionnée</Text>
              </View>
              {selectedBloc && (
                <View style={styles.pill}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                  <Text style={styles.pillText}>Sélectionné</Text>
                </View>
              )}
            </View>
            {!selectedZone && (
              <View style={styles.disabledBanner}>
                <Ionicons name="lock-closed" size={14} color="#6b7280" />
                <Text style={styles.disabledBannerText}>Sélectionnez d&apos;abord une zone pour choisir un bloc</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.dropdownButton,
                (!selectedZone || loadingBlocs) && styles.dropdownButtonDisabled
              ]}
              onPress={() => selectedZone && !loadingBlocs && setShowBlocDropdown(!showBlocDropdown)}
              activeOpacity={0.7}
              disabled={!selectedZone || loadingBlocs}
            >
              <View style={styles.dropdownButtonContent}>
                <Text style={[
                  styles.dropdownButtonText, 
                  (!selectedBloc && !loadingBlocs) && styles.placeholderText
                ]}>
                  {loadingBlocs 
                    ? 'Chargement des blocs...' 
                    : selectedBloc 
                    ? selectedBloc.intitule 
                    : !selectedZone 
                    ? 'Sélectionnez d\'abord une zone' 
                    : 'Choisissez un bloc (optionnel)'
                  }
                </Text>
                <Ionicons 
                  name={showBlocDropdown ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={(!selectedZone || loadingBlocs) ? "#d1d5db" : "#6b7280"} 
                />
              </View>
            </TouchableOpacity>

            {showBlocDropdown && selectedZone && !loadingBlocs && (
              <View style={styles.dropdown}>
                {availableBlocs.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemTitle}>Aucun bloc disponible pour cette zone</Text>
                  </View>
                ) : (
                  availableBlocs.map((bloc) =>
                    renderDropdownItem(bloc, () => {
                      setSelectedBloc(bloc);
                      setShowBlocDropdown(false);
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
                <Text style={styles.cardHint}>Sélectionnez une déclaration d&apos;inventaire existante</Text>
              </View>
              {selectedDeclaration && (
                <View style={styles.pill}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                  <Text style={styles.pillText}>Sélectionné</Text>
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
                  {selectedDeclaration ? selectedDeclaration.title : 'Choisissez un inventaire'}
                </Text>
                <Ionicons name={showDeclarationDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            {showDeclarationDropdown && (
              <View style={styles.dropdown}>
                {declarations.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemTitle}>Aucune déclaration disponible</Text>
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
                <Text style={styles.submitButtonText}>Création en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="save" size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Créer l&apos;inventaire</Text>
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
  dropdownButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dropdownButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dropdownButtonIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButtonLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  dropdownLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  cardDisabled: {
    opacity: 0.6,
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
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  disabledBannerText: {
    color: '#6b7280',
    fontSize: 12,
    flex: 1,
  },
});
