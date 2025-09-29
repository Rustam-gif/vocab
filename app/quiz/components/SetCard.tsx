import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Play, BookOpen } from 'lucide-react-native';

interface SetCardProps {
  set: {
    id: number | string;
    title: string;
    words?: Array<{ word: string }>;
    type?: 'quiz';
    description?: string;
    completed: boolean;
    inProgress?: boolean;
    score?: number;
  };
  onPress: () => void;
}

export default function SetCard({ set, onPress }: SetCardProps) {
  const isQuiz = set.type === 'quiz';
  const isCompleted = set.completed;
  const isInProgress = set.inProgress;

  const accent = '#F2935C';
  const success = '#437F76';

  const getButtonText = () => {
    if (isCompleted) return 'Review';
    if (isInProgress) return 'Continue';
    return 'Start';
  };

  const getButtonColor = () => {
    if (isCompleted) return accent;
    if (isInProgress) return '#F2AB27';
    return '#F2AB27';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{set.title}</Text>
          {isCompleted && (
            <View style={styles.statusPill}>
              <CheckCircle size={16} color={success} />
              <Text style={styles.statusText}>
                {typeof set.score === 'number' ? `Score ${Math.round(set.score)}` : 'Completed'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {isQuiz ? (
          <View style={styles.quizInfo}>
            <BookOpen size={16} color="#9CA3AF" />
            <Text style={styles.quizDescription}>{set.description}</Text>
          </View>
        ) : (
          <View style={styles.wordsInfo}>
            <Text style={styles.wordsCount}>
              {set.words?.length || 0} words
            </Text>
            <Text style={styles.wordsPreview}>
              {set.words?.slice(0, 3).map(w => w.word).join(', ')}
              {set.words && set.words.length > 3 && '...'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: getButtonColor() }]}
          onPress={onPress}
        >
          <Text style={styles.actionButtonText}>{getButtonText()}</Text>
          <Play size={16} color="#fff" style={styles.playIcon} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 22,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(67, 127, 118, 0.12)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#437F76',
    letterSpacing: 0.2,
  },
  scorePill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 127, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(67, 127, 118, 0.3)',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#437F76',
  },
  content: {
    marginBottom: 8,
    minHeight: 16,
  },
  quizInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: '#B3B3B3',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  wordsInfo: {
    flexDirection: 'column',
    gap: 8,
  },
  wordsCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  wordsPreview: {
    fontSize: 12,
    color: '#B3B3B3',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  playIcon: {
    marginLeft: 4,
  },
});
