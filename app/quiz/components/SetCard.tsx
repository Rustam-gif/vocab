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
  };
  onPress: () => void;
}

export default function SetCard({ set, onPress }: SetCardProps) {
  const isQuiz = set.type === 'quiz';
  const isCompleted = set.completed;
  const isInProgress = set.inProgress;

  const accent = '#F2935C';

  const getStatusColor = () => {
    if (isCompleted) return accent;
    if (isInProgress) return '#F2AB27';
    return '#666';
  };

  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isInProgress) return 'In Progress';
    return 'Not Started';
  };

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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{set.title}</Text>
          {isCompleted && (
            <CheckCircle size={20} color={accent} style={styles.checkIcon} />
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
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
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  content: {
    marginBottom: 16,
  },
  quizInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  wordsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordsCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  wordsPreview: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playIcon: {
    marginLeft: 4,
  },
});
