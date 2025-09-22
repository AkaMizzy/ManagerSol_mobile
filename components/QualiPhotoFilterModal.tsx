import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const STATIC_DATA = {
  lots: ['Lot A', 'Lot B', 'Lot C'],
  phases: ['Phase 1', 'Phase 2', 'Phase 3'],
  etapes: ['Étape 1', 'Étape 2', 'Étape 3'],
  taches: ['Tâche 1', 'Tâche 2', 'Tâche 3'],
};

function FilterDropdown({ label, options }: { label: string; options: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <Pressable style={styles.dropdownHeader} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.dropdownHeaderText}>{selectedValue || `Sélectionner ${label}`}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
      </Pressable>
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView>
            {options.map((option) => (
              <Pressable
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedValue(option);
                  setIsOpen(false);
                }}
              >
                <Text>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function QualiPhotoFilterModal({ visible, onClose }: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtrer par</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#9ca3af" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <FilterDropdown label="Lot" options={STATIC_DATA.lots} />
            <FilterDropdown label="Phase" options={STATIC_DATA.phases} />
            <FilterDropdown label="Étape" options={STATIC_DATA.etapes} />
            <FilterDropdown label="Tâche" options={STATIC_DATA.taches} />
          </ScrollView>
          <View style={styles.footer}>
            <Pressable style={[styles.button, styles.resetButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.resetButtonText]}>Reset</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.doneButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.doneButtonText]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  doneButton: {
    backgroundColor: '#11224e',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#1f2937',
  },
  doneButtonText: {
    color: 'white',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  dropdownHeaderText: {
    fontSize: 16,
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
});
