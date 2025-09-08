import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CalendarStrip({ selectedDate, onDateSelect }: CalendarStripProps) {
  const getDaysInWeek = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate().toString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInWeek();

  return (
    <View style={styles.container}>
      {/* Month/Year Selector */}
      <View style={styles.monthSelector}>
        <Text style={styles.monthText}>Nov 2024</Text>
        <TouchableOpacity style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Day Strip */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayStrip}
      >
        {days.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dayContainer}
            onPress={() => onDateSelect(date)}
          >
            <Text style={styles.dayName}>{formatDayName(date)}</Text>
            <View style={[
              styles.dayNumberContainer,
              isToday(date) && styles.todayContainer,
              isSelected(date) && styles.selectedContainer
            ]}>
              <Text style={[
                styles.dayNumber,
                isToday(date) && styles.todayText,
                isSelected(date) && styles.selectedText
              ]}>
                {formatDayNumber(date)}
              </Text>
            </View>
            {isSelected(date) && <View style={styles.selectedIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  arrowButton: {
    padding: 4,
  },
  dayStrip: {
    paddingHorizontal: 4,
  },
  dayContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 32,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  todayContainer: {
    backgroundColor: '#FF3B30',
  },
  selectedContainer: {
    backgroundColor: '#FF3B30',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  todayText: {
    color: '#FFFFFF',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF3B30',
  },
});
