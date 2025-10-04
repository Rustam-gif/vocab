import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle } from 'lucide-react-native';

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
    if (t.includes('daily') || t.includes('habit') || t.includes('routine')) return require('../../../assets/wordset_icons/daily-routines-habits.png');
    if (t.includes('basic') || t.includes('family') || t.includes('need')) return require('../../../assets/wordset_icons/basic-needs.png');
    if (t.includes('education') || t.includes('work')) return require('../../../assets/wordset_icons/education-work.png');
    if (t.includes('food') || t.includes('cook')) return require('../../../assets/wordset_icons/food-cooking.png');
    if (t.includes('free time') || t.includes('hobbi')) return require('../../../assets/wordset_icons/free-time-hobbies.png');
    if (t.includes('technology') || t.includes('internet')) return require('../../../assets/wordset_icons/technology-internet.png');
    if (t.includes('shopping') || t.includes('money')) return require('../../../assets/wordset_icons/shopping-money.png');
    if (t.includes('health') || t.includes('body')) return require('../../../assets/wordset_icons/health-body.png');
    if (t.includes('weather') || t.includes('nature')) return require('../../../assets/wordset_icons/weather-nature.png');
    if (t.includes('emotion') || t.includes('personality')) return require('../../../assets/wordset_icons/emotions-personality.png');
    if (t.includes('transportation') || t.includes('travel')) return require('../../../assets/wordset_icons/transportation-travel.png');
    if (t.includes('home') || t.includes('furniture')) return require('../../../assets/wordset_icons/home-furniture.png');
    if (t.includes('culture') || t.includes('entertainment')) return require('../../../assets/wordset_icons/culture-entertainment.png');
    return require('../../../assets/wordset_icons/basic-needs.png');
  };

  const getButtonText = () => {
    if (isCompleted) return 'Review';
    if (isInProgress) return 'Continue';
    return 'Start';
  };

  const getButtonColor = () => {
    if (isCompleted) return 'rgba(230, 138, 74, 0.35)'; // Review - 35% opacity burnt orange
    if (isInProgress) return '#d79a35'; // Continue - amber with depth
    return '#3cb4ac'; // Start (teal, used only for fallback)
  };

  const getButtonTextColor = () => {
    // All states use white text now (Continue/Start/Review)
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
        {/* Button moved to absolute overlay for vertical centering */}
      </View>

      <View style={styles.content} />

      <View style={styles.footer}>
        {isCompleted && (
          <View style={styles.statusPill}>
            <CheckCircle size={16} color={success} />
            <Text style={styles.statusText}>
              {typeof set.score === 'number' ? `${Math.round(set.score)}` : '✓'}
            </Text>
          </View>
        )}
      </View>

      {/* Absolute action button overlay (vertically centered on the right) */}
      <View style={styles.actionOverlay}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          {(!isCompleted && !isInProgress) ? (
            <LinearGradient
              colors={['#1a8d87', '#3cb4ac']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionButton, styles.startButton]}
            >
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>{getButtonText()}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.actionButton, { backgroundColor: getButtonColor() }]}>
              <Text style={[styles.actionButtonText, { color: getButtonTextColor() }]}>{getButtonText()}</Text>
            </View>
          )}
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
    position: 'relative',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 18,
    fontFamily: 'Ubuntu_700Bold',
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
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  statusText: {
    fontSize: 14,
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
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 17,
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
    fontSize: 17,
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
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  wordsPreview: {
    fontSize: 14,
    color: '#B3B3B3',
    lineHeight: 16,
  },
  wordsPreviewInline: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
    fontFamily: 'Ubuntu_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  startButton: {
    shadowColor: '#1a8d87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  headerButton: {
    alignSelf: 'flex-start',
  },
  actionOverlay: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  playIcon: {
    marginLeft: 4,
  },
});
