import { useAuth } from '@/contexts/AuthContext';
import { createCalendarEvent } from '@/services/calendarService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import CalendarComp from '../../components/CalendarComp';
import CreateCalendarEventModal from '../../components/CreateCalendarEventModal';
import DayEventsModal from '../../components/DayEventsModal';
import RecentQualiphotos from '../../components/RecentQualiphotos';
import API_CONFIG from '../config/api';

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventsByDate, setEventsByDate] = useState<Record<string, string[]>>({});
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const [, setStats] = useState<{ pending: number; today: number; completed: number; retard: number; canceled: number } | null>(null);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);
  const [overdueActivities, setOverdueActivities] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);

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
      case 0: return { icon: 'time', color: '#FF9500', text: 'Pending' };
      case 1: return { icon: 'checkmark-circle', color: '#34C759', text: 'Completed' };
      case 2: return { icon: 'close-circle', color: '#FF3B30', text: 'Canceled' };
      default: return { icon: 'help-circle', color: '#8E8E93', text: 'Unknown' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <AppHeader user={user || undefined} />

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

        {/* Create Event CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={[styles.quickActionsFrame, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Pressable
              onPress={() => router.push('/(tabs)/qualiphoto')}
              style={styles.quickAction}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir QualiPhoto"
            >
              <Ionicons name="camera" size={20} color="#f87b1b" />
              <Text style={styles.linkButton}>QualiPhotos</Text>
            </Pressable>

            <Pressable
              onPress={() => setEventModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Ajouter activité"
            >
              <Text style={styles.linkButton}>Ajouter activité</Text>
            </Pressable>
          </View>
        </View>

        {/* Calendar */}
        <CalendarComp
          eventsByDate={eventsByDate}
          onMonthChange={useCallback(async (startIso: string, endIso: string) => {
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
          }, [token])}
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
        />

        {/* Recent Qualiphotos */}
        <RecentQualiphotos />

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Image
                source={require('../../assets/icons/action_corrective.png')}
                style={styles.sectionTitleIcon}
                resizeMode="contain"
              />
              <Pressable
                style={styles.tasksButton}
                onPress={() => router.push('/(tabs)/tasks')}
                accessibilityRole="button"
                accessibilityLabel="Navigate to tasks"
              >
                <Text style={styles.tasksButtonText}>Activités</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.sectionTitle1}>Activités de la journée en retard ({overdueActivities.length})</Text>
          <View style={styles.activityContainer1}>
            {overdueActivities.length > 0 ? (
              overdueActivities.map((activity, index) => {
                const statusInfo = getStatusInfo(activity.status, 'overdue');
                return (
                  <View key={activity.id || index} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {activity.title || 'Untitled Activity'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatTime(activity.date_planification)} • {statusInfo.text}
                        {activity.declaration_title && ` • ${activity.declaration_title}`}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>Aucune activité planifiée pour aujourd&apos;hui</Text>
                  <Text style={styles.activityTime}>Vérifiez vos tâches ou créez de nouvelles activités</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Duplicate Activities Section */}
        <View style={styles.section}>
          
          <Text style={styles.sectionTitle}>Activités de la journée ({todayActivities.length})</Text>
          <View style={styles.activityContainer}>
            {todayActivities.length > 0 ? (
              todayActivities.map((activity, index) => {
                const statusInfo = getStatusInfo(activity.status, 'today');
                return (
                  <View key={`duplicate-${activity.id || index}`} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {activity.title || 'Untitled Activity'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatTime(activity.date_planification)} • {statusInfo.text}
                        {activity.declaration_title && ` • ${activity.declaration_title}`}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>Aucune activité planifiée pour aujourd&apos;hui</Text>
                  <Text style={styles.activityTime}>Vérifiez vos tâches ou créez de nouvelles activités</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <View style={styles.section}>
          
          <Text style={styles.sectionTitle2}>Activités de la journée à venir ({upcomingActivities.length})</Text>
          <View style={styles.activityContainer2}>
            {upcomingActivities.length > 0 ? (
              upcomingActivities.map((activity, index) => {
                const statusInfo = getStatusInfo(activity.status, 'upcoming');
                return (
                  <View key={`duplicate-${activity.id || index}`} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {activity.title || 'Untitled Activity'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatTime(activity.date_planification)} • {statusInfo.text}
                        {activity.declaration_title && ` • ${activity.declaration_title}`}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>Aucune activité planifiée pour aujourd&apos;hui</Text>
                  <Text style={styles.activityTime}>Vérifiez vos tâches ou créez de nouvelles activités</Text>
                </View>
              </View>
            )}
          </View>
        </View>
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
          Alert.alert('Success', 'Event created successfully');
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
    paddingBottom: 150, // Increased space for tab bar to accommodate duplicate section
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderWidth: 2,
    borderColor: '#f87b1b',
    overflow: 'hidden',
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
