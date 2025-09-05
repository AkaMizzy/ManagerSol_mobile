import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import ComingSoonScreen from '../../components/ComingSoonScreen';
import { useAuth } from '../../contexts/AuthContext';

export default function AuditScreen() {
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader user={user || undefined} />
      <ComingSoonScreen pageName="Audit" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
});


