import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Calendar from '../../components/Calendar';
import CreateEventModal from '../../components/CreateEventModal';
import calendarService, { CalendarEvent, CreateEventData } from '../../services/calendarService';

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load events from backend
  const loadEvents = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const eventsData = await calendarService.getEvents(token);
      setEvents(eventsData);
      console.log('Events loaded:', eventsData.length);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [token]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    console.log('Selected date:', date.toDateString());
    // TODO: Could load events for specific date here if needed
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleEventSubmit = async (eventData: CreateEventData) => {
    try {
      // Reload events to get the newly created event from backend
      await loadEvents();
      
      console.log('Event created and events reloaded');
      
      // Optional: Show success message (already shown in modal)
      // Alert.alert('Success', 'Event created successfully!');
      
    } catch (error: any) {
      console.error('Failed to reload events after creation:', error);
      // Don't show error to user as the event was created successfully
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>
            {user ? `${user.firstname} ${user.lastname}` : 'Loading...'}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
            </View>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Completed Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time-outline" size={24} color="#FF9500" />
            </View>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
        </View>

        {/* Calendar Section */}
        <View style={styles.section}>
          
          <Calendar 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            events={events}
            onCreateEvent={handleCreateEvent}
          />
        </View>

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

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleEventSubmit}
        selectedDate={selectedDate}
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
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
