import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarEvent {
  id: string;
  context: string;
  title: string;
  date: string;
  heur_debut?: string;
  heur_fin?: string;
}

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  events?: CalendarEvent[];
  onCreateEvent?: () => void;
}

export default function Calendar({ onDateSelect, selectedDate, events = [], onCreateEvent }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get current month's first day and last day
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayWeekday = firstDayOfMonth.getDay();
  
  // Get total days in the month
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get today's date for highlighting
  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth.getMonth() && 
           today.getFullYear() === currentMonth.getFullYear();
  };

  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get events for a specific day
  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateString);
  };

  // Get context icon name for Ionicons
  const getContextIconName = (context: string) => {
    const iconMap: { [key: string]: string } = {
      'declaration_anomalie': 'warning-outline',
      'action_corrective': 'construct-outline',
      'audit_zone': 'search-outline',
      'prelevement_echantillon': 'flask-outline',
      'inventaire_article': 'list-outline',
    };
    return iconMap[context] || 'help-outline';
  };

  // Generate calendar days array with proper 7-day grid
  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    // Ensure we have complete weeks (multiple of 7)
    // This ensures Saturday is always visible
    const totalCells = days.length;
    const weeksNeeded = Math.ceil(totalCells / 7);
    const totalCellsNeeded = weeksNeeded * 7;
    const remainingCells = totalCellsNeeded - totalCells;
    
    // Add empty cells to complete the last week
    for (let i = 0; i < remainingCells; i++) {
      days.push(null);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Week day headers - ensure all 7 days are shown
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Calendar Header with Create Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.monthText}>{getMonthName(currentMonth)}</Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Create Event Button - Reduced margin */}
      <TouchableOpacity style={styles.createButton} onPress={onCreateEvent}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Event</Text>
      </TouchableOpacity>

      {/* Week Day Headers */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayHeader}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              const globalIndex = weekIndex * 7 + dayIndex;
              
              return (
                <TouchableOpacity
                  key={globalIndex}
                  style={[
                    styles.dayCell,
                    ...(day === null ? [styles.emptyDay] : []),
                    ...(day && isToday(day) ? [styles.todayCell] : []),
                    ...(selectedDate && day && 
                      selectedDate.getDate() === day && 
                      selectedDate.getMonth() === currentMonth.getMonth() && 
                      selectedDate.getFullYear() === currentMonth.getFullYear() ? [styles.selectedCell] : [])
                  ]}
                  onPress={() => day && onDateSelect?.(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                  disabled={day === null}
                >
                  {day && (
                    <>
                      <Text style={[
                        styles.dayText,
                        isToday(day) && styles.todayText,
                        selectedDate && 
                        selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth.getMonth() && 
                        selectedDate.getFullYear() === currentMonth.getFullYear() && 
                        styles.selectedText
                      ]}>
                        {day}
                      </Text>
                      
                      {/* Event Indicators */}
                      {dayEvents.length > 0 && (
                        <View style={styles.eventIndicators}>
                          {dayEvents.slice(0, 3).map((event, eventIndex) => (
                            <View key={event.id} style={styles.eventIndicator}>
                              <View style={styles.eventIconPlaceholder}>
                                <Ionicons 
                                  name={getContextIconName(event.context) as any} 
                                  size={8} 
                                  color="#8E8E93" 
                                />
                              </View>
                            </View>
                          ))}
                          {dayEvents.length > 3 && (
                            <View style={styles.moreEventsIndicator}>
                              <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  )}
                  
                  {/* Debug info for empty cells */}
                  {day === null && (
                    <View style={styles.emptyDayIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8, // Reduced from 16 to minimize white space
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 6, // Reduced from 8
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6, // Reduced from 8
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'column',
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 8,
    margin: 0.5, // Reduced from 1 for tighter grid
    paddingTop: 4,
    position: 'relative',
    minWidth: 0, // Ensure cells can shrink properly
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  todayCell: {
    backgroundColor: '#007AFF',
  },
  selectedCell: {
    backgroundColor: '#F87B1B',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  eventIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventIconPlaceholder: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreEventsIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreEventsText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyDayIndicator: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
