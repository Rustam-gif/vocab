import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CheckCircle, Play } from 'lucide-react-native';

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

  const getIconSource = () => {
    const t = (set.title || '').toLowerCase();
    if (set.type === 'quiz') return require('../../../assets/wordset_icons/quiz.png');
    if (t.includes('daily') || t.includes('habit')) return require('../../../assets/wordset_icons/daily-routines-habits.png');
    if (t.includes('basic') || t.includes('family') || t.includes('need')) return require('../../../assets/wordset_icons/basic-needs.png');
    if (t.includes('education') || t.includes('work')) return require('../../../assets/wordset_icons/education-work.png');
    if (t.includes('fitness') || t.includes('health')) return require('../../../assets/wordset_icons/fitness-health.png');
    if (t.includes('travel')) return require('../../../assets/wordset_icons/travel.png');
    return require('../../../assets/wordset_icons/basic-needs.png');
  };

  const getButtonText = () => {
    if (isCompleted) return 'Review';
    if (isInProgress) return 'Continue';
    return 'Start';
  };

  const getButtonColor = () => {
    if (isCompleted) return accent; // Review
    if (isInProgress) return '#FFDE69'; // Continue
    return '#187486'; // Start
  };

  const getButtonTextColor = () => {
    if (isInProgress) return '#3A3A3A'; // Dark grey for Continue
    return '#fff';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.headerRow}>
        <Image source={getIconSource()} style={styles.setIcon} resizeMode="contain" />
        <View style={styles.headerTextArea}>
          <Text style={styles.title}>{set.title}</Text>
          {!isQuiz && (
            <Text style={styles.wordsPreviewInline} numberOfLines={1}>
              {set.words?.slice(0, 3).map(w => w.word).join(', ')}
              {set.words && set.words.length > 3 && '...'}
            </Text>
          )}
          {isQuiz && !!set.description && (
            <Text style={styles.quizPreviewInline} numberOfLines={1}>
              {set.description}
            </Text>
          )}
        </View>
        {isCompleted && (
          <View style={styles.statusPill}>
            <CheckCircle size={16} color={success} />
            <Text style={styles.statusText}>
              {typeof set.score === 'number' ? `Score ${Math.round(set.score)}` : 'Completed'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content} />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: getButtonColor() }]}
          onPress={onPress}
        >
          <Text style={[styles.actionButtonText, { color: getButtonTextColor() }]}>{getButtonText()}</Text>
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
    padding: 5,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 2,
  },
  setIcon: {
    width: 72,
    height: 72,
    marginRight: 6,
  },
  headerTextArea: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
  },
  wordsMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
    marginBottom: 2,
    minHeight: 6,
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
  quizPreviewInline: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  wordsPreviewInline: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 84,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
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
