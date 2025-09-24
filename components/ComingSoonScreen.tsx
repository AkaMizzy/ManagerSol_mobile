import { Image } from 'expo-image';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface ComingSoonScreenProps {
  pageName?: string;
}

export default function ComingSoonScreen({ pageName = "Cette page" }: ComingSoonScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageNameText}>{pageName}</Text>
        {/* Construction GIF */}
        <View style={styles.gifContainer}>
          <Image
            source={require('../assets/icons/construction.gif')}
            style={styles.constructionGif}
            contentFit="contain"
          />
        </View>

        {/* Coming Soon Text */}
        <Text style={styles.comingSoonText}>Bientôt disponible</Text>
        <Text style={styles.subText}>
          Cette page est actuellement en construction
        </Text>
        <Text style={styles.descriptionText}>
          Nous travaillons d&apos;arrache-pied pour vous offrir cette fonctionnalité. Restez à l&apos;écoute !
        </Text>

        {/* Construction Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.constructionIcon}>
            <Text style={styles.iconText}>🚧</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  pageNameText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f87b1b',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  gifContainer: {
    width: 200,
    height: 200,
    marginBottom: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  constructionGif: {
    width: '90%',
    height: '90%',
  },
  comingSoonText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginTop: 20,
  },
  constructionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconText: {
    fontSize: 40,
  },
});
