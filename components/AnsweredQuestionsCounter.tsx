import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AnsweredQuestionsCounterProps {
  answeredCount: number;
  totalCount: number;
}

export default function AnsweredQuestionsCounter({ 
  answeredCount, 
  totalCount 
}: AnsweredQuestionsCounterProps) {
  // Calculate progress percentage
  const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  
  // Determine color based on completion percentage
  const getCounterColor = () => {
    if (progressPercentage >= 70) {
      return '#34C759'; // Green for 70%+ completion
    } else if (progressPercentage >= 50) {
      return '#FF9500'; // Orange for 50-69% completion
    } else {
      return '#FF3B30'; // Red for 0-49% completion
    }
  };

  const counterColor = getCounterColor();

  return (
    <View style={styles.container}>
      <Text style={[styles.counterText, { color: counterColor }]}>
        Answered: {answeredCount} / {totalCount}
      </Text>
      {answeredCount === totalCount && totalCount > 0 && (
        <Text style={[styles.completionText, { color: counterColor }]}>
          ✓ Complete
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  completionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});
