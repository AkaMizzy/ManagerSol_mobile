import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';

export default function InventaireScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <Text style={styles.text}>Inventaire Page</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F7' },
  text: { fontSize: 18, color: '#1C1C1E', fontWeight: '600' },
});


