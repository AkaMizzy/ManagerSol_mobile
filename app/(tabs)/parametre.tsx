import CompanyManagement from '@/components/CompanyManagement';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import UserManagement from '@/components/UserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserProjects, Project } from '@/services/projectService';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';

type TabType = 'projects' | 'users' | 'company';

export default function ParametreScreen() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { width } = useWindowDimensions();
  const [createVisible, setCreateVisible] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setIsLoading(true);
    fetchUserProjects(token)
      .then((data) => { if (!cancelled) setProjects(data); })
      .catch((e) => { if (!cancelled) Alert.alert('Erreur', e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function refreshProjects() {
    if (!token) return;
    setIsLoading(true);
    try {
      const refreshed = await fetchUserProjects(token);
      setProjects(refreshed);
    } finally {
      setIsLoading(false);
    }
  }

  // Responsive grid columns (2 on phones, 3 on large screens)
  const columnCount = width >= 900 ? 3 : 2;
  const horizontalPadding = 16;
  const gap = 12;
  const cardWidth = (width - horizontalPadding * 2 - gap * (columnCount - 1)) / columnCount;

  function getStatusStyle(s?: unknown) {
    const isActive = s === 1 || s === '1' || s === true;
    return isActive
      ? { bg: '#e9f7ef', color: '#2ecc71', border: '#c6f0d9', label: 'Actif' }
      : { bg: '#f4f5f7', color: '#6b7280', border: '#e5e7eb', label: 'Inactif' };
  }

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? '#f87b1b' : '#6b7280'} 
      />
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.tabButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProjectsContent = () => (
    <>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#11224e' }}>Projets</Text>
            <Text style={{ marginTop: 4, color: '#6b7280' }}>Gérez et consultez vos projets en cours</Text>
          </View>
          <TouchableOpacity onPress={() => setCreateVisible(true)} style={[styles.button]}>
            <Ionicons name="add-circle" size={20} color="#f87b1b" />
            <Text style={styles.ButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: horizontalPadding }}>
        {isLoading && projects.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#11224e" />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingBottom: 100 }}
            data={projects}
            numColumns={columnCount}
            columnWrapperStyle={{ gap }}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => <View style={{ height: gap }} />}
            renderItem={({ item }) => {
              const badge = getStatusStyle(item.status);
              return (
                <TouchableOpacity activeOpacity={0.8} onPress={() => { setSelectedProject(item); setDetailVisible(true); }} style={[styles.card, { width: cardWidth, borderColor: '#e5e7eb', shadowColor: '#000' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={{ backgroundColor: badge.bg, borderColor: badge.border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 }}>
                      <Text style={{ color: badge.color, fontSize: 11, fontWeight: '600' }}>{badge.label}</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    {item.code ? <Text style={styles.cardMeta}>Code · {item.code}</Text> : <Text style={styles.cardMeta}>Code · —</Text>}
                    <Text style={styles.cardSub}>Du {item.dd} au {item.df}</Text>
                    {item.project_type_title ? <Text style={styles.cardMeta}>Type · {item.project_type_title}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </>
  );

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <AppHeader user={user || undefined} />
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton('projects', 'Projets', 'folder-outline')}
          {renderTabButton('users', 'Utilisateurs', 'people-outline')}
          {renderTabButton('company', 'Organisme', 'business-outline')}
        </View>

        {/* Tab Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'projects' && renderProjectsContent()}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'company' && <CompanyManagement />}
        </View>
      </SafeAreaView>
      
      {/* Modals */}
      <CreateProjectModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={refreshProjects}
      />
      <ProjectDetailModal
        visible={detailVisible}
        onClose={() => { setDetailVisible(false); setSelectedProject(null); }}
        project={selectedProject}
        onUpdated={refreshProjects}
      />
    </>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  ButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87b1b',
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'white',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11224e',
  },
  cardSub: {
    marginTop: 4,
    color: '#374151',
  },
  cardMeta: {
    marginTop: 4,
    color: '#6b7280',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#f87b1b',
  },
} as const;


