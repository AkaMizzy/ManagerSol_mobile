import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarStrip from '../../components/CalendarStrip';
import TaskCard from '../../components/TaskCard';

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Submit Project Proposal',
    description: 'Complete and submit the final project proposal for the new client project',
    priority: 'high' as const,
    category: 'work',
    tags: ['work'],
    timeRange: { start: '7:00 PM', end: '8:30 PM' },
    reminders: 3,
    comments: 2,
    location: 'Inbox',
    completed: false,
    subtasks: { completed: 1, total: 1 },
    date: new Date(2024, 10, 6), // Nov 6
  },
  {
    id: '2',
    title: 'Yoga Class',
    description: 'Attend the evening yoga session at the wellness center',
    priority: 'medium' as const,
    category: 'personal',
    tags: ['personal'],
    reminders: 0,
    comments: 0,
    location: 'Inbox',
    completed: false,
    date: new Date(2024, 10, 6), // Nov 6
  },
  {
    id: '3',
    title: 'Grocery shopping',
    description: 'Buy groceries for upcoming weeks',
    priority: 'low' as const,
    category: 'personal',
    tags: ['personal', 'My work'],
    reminders: 0,
    comments: 0,
    location: 'Routines',
    completed: false,
    date: new Date(2024, 10, 6), // Nov 6
  },
];

const upcomingDates = [
  { date: new Date(2024, 10, 7), label: 'Nov 7 • Tomorrow • Thursday' },
  { date: new Date(2024, 10, 8), label: 'Nov 8 • Friday' },
  { date: new Date(2024, 10, 9), label: 'Nov 9 • Saturday' },
  { date: new Date(2024, 10, 10), label: 'Nov 10 • Sunday' },
];

export default function TaskScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 10, 6)); // Nov 6
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState(mockTasks);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.date.toDateString() === date.toDateString()
    );
  };

  const formatDateHeader = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Nov 6 • Today • Wednesday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Nov 7 • Tomorrow • Thursday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }) + ' • ' + date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Upcoming</Text>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuDots}>
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Strip */}
      <CalendarStrip 
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* Task List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF3B30"
            colors={['#FF3B30']}
          />
        }
      >
        {/* Today's Tasks */}
        <View style={styles.dateSection}>
          <Text style={styles.dateHeader}>Nov 6 • Today • Wednesday</Text>
          {getTasksForDate(selectedDate).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </View>

        {/* Upcoming Days */}
        {upcomingDates.map((dateInfo) => (
          <View key={dateInfo.date.toISOString()} style={styles.dateSection}>
            <Text style={styles.dateHeader}>{dateInfo.label}</Text>
            {/* Empty state for upcoming days */}
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>No tasks scheduled</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  menuButton: {
    padding: 8,
  },
  menuDots: {
    flexDirection: 'row',
    gap: 4,
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF3B30',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },
  dateSection: {
    marginBottom: 8,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  emptyDay: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
});
