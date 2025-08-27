import { useAuth } from '@/contexts/AuthContext';
import { createCalendarEvent } from '@/services/calendarService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarComp from '../../components/CalendarComp';
import CreateCalendarEventModal from '../../components/CreateCalendarEventModal';
import DayEventsModal from '../../components/DayEventsModal';
import API_CONFIG from '../config/api';

export default function DashboardScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventsByDate, setEventsByDate] = useState<Record<string, string[]>>({});
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<{ pending: number; today: number; completed: number; retard: number } | null>(null);

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
        setStats({ pending: 0, today: 0, completed: 0, retard: 0 });
      }
    })();
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.brandRow}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>TrackSol</Text>
              </View>
            </View>
            {/* Center username removed to prioritize brand space */}
            <View style={styles.headerRight}>
              <Text
                accessibilityRole="button"
                style={styles.iconButton}
                onPress={() => {}}
              >
                <Ionicons name="notifications-outline" size={22} color="#1C1C1E" />
              </Text>
              <Text
                accessibilityRole="button"
                style={styles.iconButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="person-circle-outline" size={24} color="#1C1C1E" />
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats (framed single row) */}
        <View style={styles.statsFrame}>
          <View style={styles.statRowSingle}>
            <View style={styles.statCell}>
              <View style={styles.statIcon}><Ionicons name="time-outline" size={24} color="#FF9500" /></View>
              <Text style={styles.statNumber}>{stats?.pending ?? '—'}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCell}>
              <View style={styles.statIcon}><Ionicons name="calendar-outline" size={24} color="#007AFF" /></View>
              <Text style={styles.statNumber}>{stats?.today ?? '—'}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCell}>
              <View style={styles.statIcon}><Ionicons name="checkmark-circle-outline" size={24} color="#34C759" /></View>
              <Text style={styles.statNumber}>{stats?.completed ?? '—'}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCell}>
              <View style={styles.statIcon}><Ionicons name="alert-circle-outline" size={24} color="#FF3B30" /></View>
              <Text style={styles.statNumber}>{stats?.retard ?? '—'}</Text>
              <Text style={styles.statLabel}>Retard</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  appName: { fontSize: 24, fontWeight: '800', color: '#11224e' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 36, height: 36 },
  userChip: { fontSize: 13, color: '#8E8E93', fontWeight: '600', maxWidth: '90%' },
  iconButton: { paddingHorizontal: 8, paddingVertical: 4 },
  greeting: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
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
});
