import { useAuth } from '@/contexts/AuthContext';
import { createCalendarEvent } from '@/services/calendarService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import API_CONFIG from '../config/api';

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventsByDate, setEventsByDate] = useState<Record<string, string[]>>({});
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<{ pending: number; today: number; completed: number; retard: number; canceled: number } | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/actions/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load stats');
        setStats(data);
      } catch {
        // keep UI functional without stats
        setStats({ pending: 0, today: 0, completed: 0, retard: 0, canceled: 0 });
      }
    })();
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <AppHeader user={user || undefined} />

        {/* Quick Stats (framed single row) */}
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
        </View>

        {/* Create Event CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>

          <View style={{ alignItems: 'flex-end' }}>
            <Text onPress={() => setEventModalVisible(true)} style={styles.linkButton} accessibilityRole="button">+ Create Action</Text>
          </View>
        </View>

        {/* Calendar */}
        <CalendarComp
          eventsByDate={eventsByDate}
          onMonthChange={async (startIso, endIso) => {
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
          }}
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

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Task &quot;Review Documents&quot; completed</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="add-circle" size={16} color="#007AFF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New task assigned: &quot;Data Entry&quot;</Text>
                <Text style={styles.activityTime}>4 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="time" size={16} color="#FF9500" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Task &quot;Meeting Preparation&quot; due today</Text>
                <Text style={styles.activityTime}>6 hours ago</Text>
              </View>
            </View> 
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
    paddingBottom: 100, // Add space for tab bar
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  linkButton: {
    color: '#f87b1b',
    fontSize: 14,
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
