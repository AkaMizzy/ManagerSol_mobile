import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  // Monday-first calendar: map JS getDay() (Sun=0..Sat=6) to Mon=0..Sun=6
  const startWeekdayMonFirst = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startWeekdayMonFirst);
  const today = new Date();

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const isCurrentMonth = d.getMonth() === month;
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    cells.push({ date: d, isCurrentMonth, isToday });
  }
  return cells;
}

function formatMonthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function CalendarComp(): JSX.Element {
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const { width } = useWindowDimensions();

  // Build a stable 6x7 matrix (Mon → Sun per row) to avoid wrapping issues
  const weeks = useMemo(() => {
    const flat = buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth());
    const rows: DayCell[][] = [];
    for (let i = 0; i < 42; i += 7) {
      rows.push(flat.slice(i, i + 7));
    }
    return rows;
  }, [visibleMonth]);

  // Responsive sizing (subtract wrapper margin + inner padding + gaps)
  const outerMargin = 20; // must match wrapper.marginHorizontal
  const pagePadding = 20; // must match grid/weekday paddingHorizontal
  const gap = 8;
  const totalGaps = gap * 6;
  const availableWidth = Math.max(
    0,
    width - (outerMargin * 2 + pagePadding * 2 + totalGaps)
  );
  const cellSize = Math.floor(availableWidth / 7);

  const goPrev = () => setVisibleMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const goNext = () => setVisibleMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));
  const goToday = () => setVisibleMonth(new Date());

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={goPrev} accessibilityRole="button">
          <Text style={styles.navText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatMonthTitle(visibleMonth)}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={goNext} accessibilityRole="button">
          <Text style={styles.navText}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={goToday} style={styles.todayPill} accessibilityRole="button">
        <Text style={styles.todayPillText}>Today</Text>
      </TouchableOpacity>

      <View style={[styles.weekRow, { paddingHorizontal: pagePadding }]}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(w => (
          <View key={w} style={[styles.weekdayCell, { width: cellSize }]}> 
            <Text style={styles.weekdayText}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: pagePadding }}>
        {weeks.map((week, wIdx) => (
          <View key={`week_${wIdx}`} style={[styles.weekDaysRow, { marginBottom: wIdx < 5 ? gap : 0 }]}>
            {week.map((cell, cIdx) => (
              <View
                key={`${cell.date.toISOString()}_${cIdx}`}
                style={[
                  styles.dayCell,
                  { width: cellSize, height: cellSize, marginRight: cIdx < 6 ? gap : 0 },
                  cell.isToday && styles.todayCell,
                ]}
              >
                <Text style={[styles.dayText, !cell.isCurrentMonth && styles.mutedDay]}>
                  {cell.date.getDate()}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11224e',
    textTransform: 'capitalize',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  navText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  todayPill: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  todayPillText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 6,
  },
  weekdayCell: {
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekDaysRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  dayCell: {
    marginBottom: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dayText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  mutedDay: {
    color: '#C7C7CC',
    fontWeight: '600',
  },
  todayCell: {
    borderColor: '#f87b1b',
    borderWidth: 2,
  },
});


