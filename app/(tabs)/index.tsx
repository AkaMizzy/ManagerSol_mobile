import { useAuth } from '@/contexts/AuthContext';
import { createCalendarEvent } from '@/services/calendarService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import CalendarComp from '../../components/CalendarComp';
import CreateCalendarEventModal from '../../components/CreateCalendarEventModal';
import DayEventsModal from '../../components/DayEventsModal';
import API_CONFIG from '../config/api';

const GRID_ITEMS: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: any;
}[] = [
  { title: 'Réception', image: require('../../assets/icons/folder.png') },
  { title: 'Planning', image: require('../../assets/icons/planning.png') },
  { title: 'Calendrier', image: require('../../assets/icons/calendar.png') },
  { title: 'Manifold', image: require('../../assets/icons/manifolder.png') },
  { title: 'Déclarations', image: require('../../assets/icons/declaration_anomalie.png') },
  { title: 'Audit', image: require('../../assets/icons/audit_zone.png') },
  { title: 'Echantillon', image: require('../../assets/icons/prelevement_echantillon.png') },
  { title: 'Inventaires', image: require('../../assets/icons/inventaire_article.png') },
  { title: 'tesst', image: require('../../assets/icons/reception.png') },
  { title: 'Projets', image: require('../../assets/icons/project.png') },
  { title: 'Utilisateurs', image: require('../../assets/icons/users.png') },
  { title: 'Organisme',  image: require('../../assets/icons/company.png') },
];

// const GRID_ITEMS: { title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
//   { title: 'Manifold', icon: 'people-circle-outline' },
//   { title: 'Déclarations', icon: 'briefcase-outline' },
//   { title: 'Projets', icon: 'construct-outline' },
//   { title: 'Rapports', icon: 'document-text-outline' },
//   { title: 'Inventaires', icon: 'file-tray-full-outline' },
//   { title: 'Contrôles', icon: 'shield-checkmark-outline' },
//   { title: 'Fournisseurs', icon: 'business-outline' },
//   { title: 'Employés', icon: 'people-outline' },
//   { title: 'Paramètres', icon: 'settings-outline' },
// ];

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [eventsByDate, setEventsByDate] = useState<Record<string, string[]>>({});
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const [, setStats] = useState<{ pending: number; today: number; completed: number; retard: number; canceled: number } | null>(null);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);
  const [overdueActivities, setOverdueActivities] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('overdue');

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        // Fetch stats
        const statsRes = await fetch(`${API_CONFIG.BASE_URL}/actions/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (!statsRes.ok) throw new Error(statsData.error || 'Failed to load stats');
        setStats(statsData);

        // Fetch today's activities
        const activitiesRes = await fetch(`${API_CONFIG.BASE_URL}/today-activities`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const activitiesData = await activitiesRes.json();
        if (activitiesRes.ok) {
          setTodayActivities(activitiesData);
        }

        // Fetch overdue activities
        const overdueRes = await fetch(`${API_CONFIG.BASE_URL}/overdue-activities`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const overdueData = await overdueRes.json();
        if (overdueRes.ok) {
          setOverdueActivities(overdueData);
        }

        // Fetch upcoming activities
        const upcomingRes = await fetch(`${API_CONFIG.BASE_URL}/upcoming-activities`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const upcomingData = await upcomingRes.json();
        if (upcomingRes.ok) {
          setUpcomingActivities(upcomingData);
        }
      } catch {
        // keep UI functional without stats
        setStats({ pending: 0, today: 0, completed: 0, retard: 0, canceled: 0 });
        setTodayActivities([]);
        setOverdueActivities([]);
        setUpcomingActivities([]);
      }
    })();
  }, [token]);

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to get status icon and text with activity type
  const getStatusInfo = (status: number, activityType?: 'overdue' | 'today' | 'upcoming') => {
    // For overdue activities, always show warning icon
    if (activityType === 'overdue') {
      return { icon: 'warning', color: '#FF3B30', text: 'En retard' };
    }
    
    // For upcoming activities, show calendar icon
    if (activityType === 'upcoming') {
      return { icon: 'calendar', color: '#007AFF', text: 'À venir' };
    }
    
    // For today's activities, show pending icon
    if (activityType === 'today') {
      return { icon: 'time', color: '#FF9500', text: 'Aujourd\'hui' };
    }

    // Default status-based logic for other cases
    switch (status) {
      case 0: return { icon: 'time', color: '#FF9500', text: 'En attente' };
      case 1: return { icon: 'checkmark-circle', color: '#34C759', text: 'Terminé' };
      case 2: return { icon: 'close-circle', color: '#FF3B30', text: 'Annulé' };
      default: return { icon: 'help-circle', color: '#8E8E93', text: 'Inconnu' };
    }
  };

  const onMonthChange = useCallback(async (startIso: string, endIso: string) => {
    try {
      if (!token) return;
      const res = await fetch(`${API_CONFIG.BASE_URL}/calendar?start_date=${startIso}&end_date=${endIso}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) return;
      const map: Record<string, string[]> = {};
      (data || []).forEach((ev: any) => {
        const key = ev.date?.slice(0,10);
        if (!key) return;
        if (!map[key]) map[key] = [];
        map[key].push(ev.context);
      });
      setEventsByDate(map);
    } catch {}
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader user={user || undefined} />
      <ScrollView style={styles.scrollView}>
        {/* Quick Stats (framed single row)
        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="time-outline" size={20} color="#FF9500" />
              </View>
              <Text style={styles.kpiNumber}>{stats?.pending ?? '—'}</Text>
              <Text style={styles.kpiLabel}>Pending</Text>
            </View>
            
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </View>
              <Text style={styles.kpiNumber}>{stats?.today ?? '—'}</Text>
              <Text style={styles.kpiLabel}>Today</Text>
            </View>
            
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              </View>
              <Text style={styles.kpiNumber}>{stats?.completed ?? '—'}</Text>
              <Text style={styles.kpiLabel}>Completed</Text>
            </View>
            
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
              </View>
              <Text style={styles.kpiNumber}>{stats?.retard ?? '—'}</Text>
              <Text style={styles.kpiLabel}>Overdue</Text>
            </View>
            
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="close-circle-outline" size={20} color="#8E8E93" />
              </View>
              <Text style={styles.kpiNumber}>{stats?.canceled ?? '—'}</Text>
              <Text style={styles.kpiLabel}>Canceled</Text>
            </View>
          </View>
        </View> */}

        {/* Feature Grid */}
        <View style={styles.gridContainer}>
          {GRID_ITEMS.map((item) => (
            <Pressable
              key={item.title}
              style={styles.gridButton}
              onPress={() => {
                if (item.title === 'Réception') {
                  router.push('/(tabs)/qualiphoto');
                } else if (item.title === 'Planning') {
                  router.push('/planning');
                } else if (item.title === 'Calendrier') {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsCalendarVisible(prevState => !prevState);
                } else if (item.title === 'Manifold') {
                  router.push('/manifolder');
                } else if (item.title === 'Déclarations') {
                  router.push('/declaration');
                } else if (item.title === 'Audit') {
                  router.push('/audit');
                } else if (item.title === 'Echantillon') {
                  router.push('/echantillon');
                } else if (item.title === 'Inventaires') {
                  router.push('/inventaire');
                } else if (item.title === 'Projets') {
                  router.push('/projects');
                } else if (item.title === 'Paramètres') {
                  router.push('/parametre');
                } else if (item.title === 'Utilisateurs') {
                  router.push('/users');
                } else if (item.title === 'Organisme') {
                  router.push('/company');
                } else {
                  Alert.alert('Bientôt disponible', `La fonctionnalité ${item.title} est en cours de développement.`);
                }
              }}
            >
              {item.image ? (
                <Image source={item.image} style={styles.gridImage} />
              ) : (
                <Ionicons name={item.icon!} size={32} color="#f87b1b" />
              )}
              <Text style={styles.gridButtonText}>{item.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* Calendar */}
        {isCalendarVisible && (
          <View style={{ marginTop: -50 }}>
            <CalendarComp
              eventsByDate={eventsByDate}
              onMonthChange={onMonthChange}
              onDayPress={async (dateIso) => {
                setSelectedDate(dateIso);
                if (!token) { setDayEvents([]); setDayModalVisible(true); return; }
                try {
                  const res = await fetch(`${API_CONFIG.BASE_URL}/calendar?start_date=${dateIso}&end_date=${dateIso}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error('Failed');
                  setDayEvents(Array.isArray(data) ? data : []);
                } catch {
                  setDayEvents([]);
                } finally {
                  setDayModalVisible(true);
                }
              }}
              onAddEvent={() => setEventModalVisible(true)}
            />
          </View>
        )}

        {/* Recent Activity */}
        <View style={[styles.section, !isCalendarVisible && { ...styles.sectionNoCalendar, marginTop: -(height * 0.08) }]}>
          {/* Activity Tabs */}
          <View style={styles.activityTabsContainer}>
            <Pressable
              onPress={() => toggleSection('overdue')}
              style={[styles.activityTab, expandedSection === 'overdue' && styles.activeTab]}
            >
              <Text style={[styles.activityTabText, { color: '#FF3B30' }]}>
                En Retard ({overdueActivities.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleSection('today')}
              style={[styles.activityTab, expandedSection === 'today' && styles.activeTab]}
            >
              <Text style={[styles.activityTabText, { color: '#f87b1b' }]}>
                Aujourd&apos;hui ({todayActivities.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleSection('upcoming')}
              style={[styles.activityTab, expandedSection === 'upcoming' && styles.activeTab]}
            >
              <Text style={[styles.activityTabText, { color: '#007AFF' }]}>
                À Venir ({upcomingActivities.length})
              </Text>
            </Pressable>
          </View>

          {/* Expanded Content */}
          <View style={styles.activityContentPlaceholder}>
            {expandedSection === 'overdue' && (
              <View style={styles.activityContainer}>
                {overdueActivities.length > 0 ? (
                  overdueActivities.map((activity) => (
                    <Pressable
                      key={activity.id}
                      style={styles.activityItem}
                      onPress={() => router.push('/(tabs)/tasks')}
                    >
                      <View style={styles.activityIcon}>
                        <Ionicons name="warning" size={16} color="#FF3B30" />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityText, { color: '#FF3B30' }]}>{activity.title || 'Activité sans titre'}</Text>
                        <Text style={[styles.activityTime, { color: '#FF3B30' }]}>
                          {formatTime(activity.date_planification)} • En retard
                          {activity.declaration_title && ` • ${activity.declaration_title}`}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.activityItem}>
                    <Text style={[styles.activityText, { color: '#FF3B30' }]}>Aucune activité en retard</Text>
                  </View>
                )}
              </View>
            )}
            {expandedSection === 'today' && (
              <View style={styles.activityContainer}>
                {todayActivities.length > 0 ? (
                  todayActivities.map((activity) => (
                    <Pressable
                      key={activity.id}
                      style={styles.activityItem}
                      onPress={() => router.push('/(tabs)/tasks')}
                    >
                      <View style={styles.activityIcon}>
                        <Ionicons name="time" size={16} color="#f87b1b" />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityText, { color: '#f87b1b' }]}>{activity.title || 'Activité sans titre'}</Text>
                        <Text style={[styles.activityTime, { color: '#f87b1b' }]}>
                          {formatTime(activity.date_planification)} • Aujourd&apos;hui
                          {activity.declaration_title && ` • ${activity.declaration_title}`}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.activityItem}>
                    <Text style={[styles.activityText, { color: '#f87b1b' }]}>Aucune activité prévue aujourd&apos;hui</Text>
                  </View>
                )}
              </View>
            )}
            {expandedSection === 'upcoming' && (
              <View style={styles.activityContainer}>
                {upcomingActivities.length > 0 ? (
                  upcomingActivities.map((activity) => (
                    <Pressable
                      key={activity.id}
                      style={styles.activityItem}
                      onPress={() => router.push('/(tabs)/tasks')}
                    >
                      <View style={styles.activityIcon}>
                        <Ionicons name="calendar" size={16} color="#007AFF" />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityText, { color: '#007AFF' }]}>{activity.title || 'Activité sans titre'}</Text>
                        <Text style={[styles.activityTime, { color: '#007AFF' }]}>
                          {formatTime(activity.date_planification)} • À venir
                          {activity.declaration_title && ` • ${activity.declaration_title}`}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.activityItem}>
                    <Text style={[styles.activityText, { color: '#007AFF' }]}>Aucune activité à venir</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Spacer for custom tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
      <CreateCalendarEventModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onSubmit={async (vals) => {
          if (!token) return;
          await createCalendarEvent(
            {
              context: vals.context,
              title: vals.title,
              description: vals.description,
              date: vals.date,
              heur_debut: vals.heur_debut,
              heur_fin: vals.heur_fin,
            },
            token
          );
          Alert.alert('Succès', 'Événement créé avec succès');
          // Optimistically update indicators on the calendar
          try {
            const key = vals.date; // use the submitted local ISO (YYYY-MM-DD) to avoid TZ shifts
            setEventsByDate(prev => {
              const next = { ...prev };
              const list = next[key] ? [...next[key]] : [];
              list.push(vals.context);
              next[key] = list;
              return next;
            });
          } catch {}
        }}
      />
      <DayEventsModal
        visible={dayModalVisible}
        date={selectedDate}
        events={dayEvents}
        onClose={() => setDayModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  gridButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  gridImage: {
    width: 32,
    height: 32,
  },
  gridButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#11224e',
    textAlign: 'center',
  },

  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statsFrame: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  statRowSingle: {
    flexDirection: 'row',
  },
  statGridRow: {
    flexDirection: 'row',
  },
  rowTopDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
  },
  cellRightDivider: {
    borderRightWidth: 1,
    borderRightColor: '#F2F2F7',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionNoCalendar: {
    paddingTop: 0,
    paddingBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: 12,
  },
  sectionTitleIcon: {
    width: 30,
    height: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f87b1b',
    marginBottom: 16,
  },
  sectionTitle1: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 16,
  },
  sectionTitle2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
  },
  tasksButton: {
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
  tasksButtonIcon: {
    width: 25,
    height: 25,
  },
  tasksButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87b1b',
    marginLeft: 6,
  },
  linkButton: {
    color: '#f87b1b',
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionsFrame: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: 8,
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  activityContainer1: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF3B30',
    overflow: 'hidden',
  },
  activityContainer2: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  activityIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  activityTable: {
    marginTop: 16,
  },
  activityRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  activityTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginTop: 16,
  },
  activityTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#f87b1b',
  },
  activityTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityContentPlaceholder: {
    minHeight: 10, // Ensures LayoutAnimation has a container to animate
  },
  kpiContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f87b1b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  kpiCard: {
    alignItems: 'center',
    flex: 1,
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
});
