import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Lock } from 'lucide-react-native';

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
    locked?: boolean;
  };
  onPress: () => void;
}

export default function SetCard({ set, onPress }: SetCardProps) {
  const isQuiz = set.type === 'quiz';
  const isCompleted = set.completed;
  const isInProgress = set.inProgress;
  const isLocked = set.locked;

  const accent = '#F2935C';
  const success = '#437F76';

  const getIconSource = () => {
    const t = (set.title || '').toLowerCase();
    if (set.type === 'quiz') return require('../../../assets/wordset_icons/quiz.png');
    
    // IELTS topics
    if (t.includes('academic')) return require('../../../assets/wordset_icons/IELTS_words/academic-life.png');
    if (t.includes('environment') || t.includes('climate')) return require('../../../assets/wordset_icons/IELTS_words/environment-climate.png');
    if (t.includes('technology') && t.includes('innovation')) return require('../../../assets/wordset_icons/IELTS_words/technology-innovation.png');
    if (t.includes('health') && t.includes('medicine')) return require('../../../assets/wordset_icons/IELTS_words/health-medicine.png');
    if (t.includes('business') || t.includes('economics')) return require('../../../assets/wordset_icons/IELTS_words/business-economics.png');
    if (t.includes('government') || t.includes('politics')) return require('../../../assets/wordset_icons/IELTS_words/government-politics.png');
    if (t.includes('media') || t.includes('communication')) return require('../../../assets/wordset_icons/IELTS_words/media-communication.png');
    if (t.includes('social') && t.includes('issue')) return require('../../../assets/wordset_icons/IELTS_words/social-issues.png');
    if (t.includes('food') && t.includes('agriculture')) return require('../../../assets/wordset_icons/IELTS_words/food-agriculture.png');
    if (t.includes('arts') || t.includes('culture')) return require('../../../assets/wordset_icons/IELTS_words/arts-culture.png');
    if (t.includes('science') || t.includes('research')) return require('../../../assets/wordset_icons/IELTS_words/science-research.png');
    if (t.includes('travel') && t.includes('tourism')) return require('../../../assets/wordset_icons/IELTS_words/travel-tourism.png');
    if (t.includes('urban') || t.includes('development')) return require('../../../assets/wordset_icons/IELTS_words/urban-development.png');
    if (t.includes('education') && t.includes('system')) return require('../../../assets/wordset_icons/IELTS_words/education-system.png');
    if (t.includes('crime') || t.includes('law')) return require('../../../assets/wordset_icons/IELTS_words/crime-law.png');
    if (t.includes('psychology') || t.includes('behavior')) return require('../../../assets/wordset_icons/IELTS_words/psychology-behavior.png');
    if (t.includes('global') && t.includes('issue')) return require('../../../assets/wordset_icons/IELTS_words/global-issues.png');
    if (t.includes('sports') || t.includes('fitness')) return require('../../../assets/wordset_icons/IELTS_words/sports-fitness.png');
    if (t.includes('finance') || t.includes('banking')) return require('../../../assets/wordset_icons/IELTS_words/finance-banking.png');
    if (t.includes('employment') || t.includes('career')) return require('../../../assets/wordset_icons/IELTS_words/employment-career.png');
    
    // Beginner topics
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
    if (isLocked) return 'Locked';
    if (isCompleted) return 'Review';
    if (isInProgress) return 'Continue';
    return 'Start';
  };

  const getButtonColor = () => {
    if (isLocked) return 'rgba(100, 100, 100, 0.4)'; // Locked - gray
    if (isCompleted) return 'rgba(230, 138, 74, 0.35)'; // Review - 35% opacity burnt orange
    if (isInProgress) return '#d79a35'; // Continue - amber with depth
    return '#3cb4ac'; // Start (teal, used only for fallback)
  };

  const getButtonTextColor = () => {
    if (isLocked) return '#888'; // Gray text for locked
    // All other states use white text now (Continue/Start/Review)
    return '#fff';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isLocked && styles.lockedContainer]} 
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={isLocked ? 1 : 0.7}
    >
      <View style={styles.headerRow}>
        <Image 
          source={getIconSource()} 
          style={[styles.setIcon, isLocked && styles.lockedIcon]} 
          resizeMode="contain" 
        />
        <View style={styles.headerTextArea}>
          <Text style={[styles.title, isLocked && styles.lockedText]}>{set.title}</Text>
          {!isQuiz && (
            <Text style={[styles.wordsPreviewInline, isLocked && styles.lockedText]} numberOfLines={1}>
              {set.words?.slice(0, 3).map(w => w.word).join(', ')}
              {set.words && set.words.length > 3 && '...'}
            </Text>
          )}
          {isQuiz && !!set.description && (
            <Text style={[styles.quizPreviewInline, isLocked && styles.lockedText]} numberOfLines={1}>
              {set.description}
            </Text>
          )}
        </View>
        {/* Button moved to absolute overlay for vertical centering */}
      </View>

      <View style={styles.content} />

      <View style={styles.footer}>
        {isCompleted && !isLocked && (
          <View style={styles.statusPill}>
            <CheckCircle size={16} color={success} />
            <Text style={styles.statusText}>
              {typeof set.score === 'number' ? `${Math.round(set.score)}` : '✓'}
            </Text>
          </View>
        )}
        {isLocked && (
          <View style={styles.lockedPill}>
            <Lock size={14} color="#888" />
            <Text style={styles.lockedPillText}>Complete previous set first</Text>
          </View>
        )}
      </View>

      {/* Absolute action button overlay (vertically centered on the right) */}
      <View style={styles.actionOverlay}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={isLocked}>
          {(!isCompleted && !isInProgress && !isLocked) ? (
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
              {isLocked && <Lock size={14} color="#888" style={{ marginRight: 4 }} />}
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
  lockedContainer: {
    opacity: 0.85,
    backgroundColor: '#252525',
  },
  lockedIcon: {
    opacity: 0.6,
  },
  lockedText: {
    color: '#A0A0A0',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  lockedPillText: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '500',
  },
});
