import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from '../../../lib/LinearGradient';
import { CheckCircle, Lock } from 'lucide-react-native';
import { useAppStore } from '../../../lib/store';

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
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
  const isQuiz = set.type === 'quiz';
  const isCompleted = set.completed;
  const isInProgress = set.inProgress;
  const isLocked = set.locked;

  const accent = '#F8B070';
  const success = '#437F76';

  const cleanTitle = (title: string) => {
    const raw = String(title || '').trim();
    const mCefr = raw.match(/^(A[12]|B[12]|C[12])\s*(?:—|-)\s*(.+)$/i);
    if (mCefr && mCefr[2]) return mCefr[2].trim();
    const mSetTopic = raw.match(/^Set\s*\d+\s*(?:—|-|:)\s*(.+)$/i);
    if (mSetTopic && mSetTopic[1]) return mSetTopic[1].trim();
    return raw;
  };

  const getIconSource = () => {
    const t = cleanTitle(set.title || '').toLowerCase();
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
    if (t.includes('analysis') || t.includes('evidence')) return require('../../../assets/wordset_icons/IELTS_words/science-research.png');
    if (t.includes('governance') || t.includes('law')) return require('../../../assets/wordset_icons/IELTS_words/government-politics.png');
    if (t.includes('writing')) return require('../../../assets/wordset_icons/IELTS_words/academic-life.png');
    if (t.includes('strategy') || t.includes('change')) return require('../../../assets/wordset_icons/OFFICE_communications/business-strategy.png');

    // Office Communication topics
    if (t.includes('meeting') || t.includes('discussion')) return require('../../../assets/wordset_icons/OFFICE_communications/meetings-discussions.png');
    if (t.includes('email') || t.includes('correspondence')) return require('../../../assets/wordset_icons/OFFICE_communications/email-correspondence.png');
    if (t.includes('project') && t.includes('management')) return require('../../../assets/wordset_icons/OFFICE_communications/project-management.png');
    if (t.includes('report') || t.includes('documentation')) return require('../../../assets/wordset_icons/OFFICE_communications/reports-documentation.png');
    if (t.includes('presentation') || t.includes('speaking')) return require('../../../assets/wordset_icons/OFFICE_communications/presentations-speaking.png');
    if (t.includes('team') && t.includes('collaboration')) return require('../../../assets/wordset_icons/OFFICE_communications/team-collaboration.png');
    if (t.includes('time') && t.includes('management')) return require('../../../assets/wordset_icons/OFFICE_communications/time-management.png');
    if (t.includes('client') && t.includes('relation')) return require('../../../assets/wordset_icons/OFFICE_communications/client-relations.png');
    if (t.includes('performance') || t.includes('feedback')) return require('../../../assets/wordset_icons/OFFICE_communications/performance-feedback.png');
    if (t.includes('office') && t.includes('technology')) return require('../../../assets/wordset_icons/OFFICE_communications/office-technology.png');
    if (t.includes('business') && t.includes('strategy')) return require('../../../assets/wordset_icons/OFFICE_communications/business-strategy.png');
    if (t.includes('workplace') && t.includes('polic')) return require('../../../assets/wordset_icons/OFFICE_communications/workplace-policies.png');
    if (t.includes('professional') && t.includes('development')) return require('../../../assets/wordset_icons/OFFICE_communications/professional-development.png');
    if (t.includes('financial') && t.includes('term')) return require('../../../assets/wordset_icons/OFFICE_communications/financial-terms.png');
    if (t.includes('human') && t.includes('resource')) return require('../../../assets/wordset_icons/OFFICE_communications/human-resources.png');
    if (t.includes('marketing') || t.includes('sales')) return require('../../../assets/wordset_icons/OFFICE_communications/marketing-sales.png');
    if (t.includes('customer') && t.includes('service')) return require('../../../assets/wordset_icons/OFFICE_communications/customer-service.png');
    if (t.includes('quality') || t.includes('standard')) return require('../../../assets/wordset_icons/OFFICE_communications/quality-standards.png');
    if (t.includes('remote') && t.includes('work')) return require('../../../assets/wordset_icons/OFFICE_communications/remote-work.png');
    if (t.includes('leadership') || t.includes('management')) return require('../../../assets/wordset_icons/OFFICE_communications/leadership-management.png');

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

  // Press bounce animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, friction: 8, tension: 300 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 200 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          isLight && styles.containerLight,
          isLocked && styles.lockedContainer,
          isLocked && isLight && styles.lockedContainerLight,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLocked}
        activeOpacity={0.9}
      >
        {/* Left colored border indicator */}
        {!isLocked && (
          <View style={[
            styles.leftBorder,
            isCompleted && { backgroundColor: success },
            isInProgress && { backgroundColor: accent },
            !isCompleted && !isInProgress && { backgroundColor: '#437F76' },
          ]} />
        )}

        {/* Main content row */}
        <View style={styles.mainRow}>
          {/* Icon */}
          <View style={[styles.iconContainer, isLocked && styles.iconContainerLocked]}>
            <Image
              source={getIconSource()}
              style={[styles.setIcon, isLocked && styles.lockedIcon]}
              resizeMode="contain"
            />
          </View>

          {/* Text content */}
          <View style={styles.textContent}>
            <Text
              style={[
                styles.title,
                isLight && styles.titleLight,
                isLocked && styles.lockedText,
              ]}
              numberOfLines={2}
            >
              {cleanTitle(set.title)}
            </Text>
            {!isQuiz && set.words && set.words.length > 0 && (
              <Text
                style={[
                  styles.preview,
                  isLight && styles.previewLight,
                  isLocked && styles.lockedPreview,
                ]}
                numberOfLines={1}
              >
                {set.words.slice(0, 3).map(w => w.word).join(', ')}
                {set.words.length > 3 && '...'}
              </Text>
            )}
            {isQuiz && set.description && (
              <Text
                style={[
                  styles.preview,
                  isLight && styles.previewLight,
                  isLocked && styles.lockedPreview,
                ]}
                numberOfLines={1}
              >
                {set.description}
              </Text>
            )}
          </View>

          {/* Action button */}
          <View style={styles.buttonContainer}>
            {isLocked ? (
              <View style={[styles.lockedButton, isLight && styles.lockedButtonLight]}>
                <Lock size={14} color={isLight ? '#9CA3AF' : '#666'} />
                <Text style={[styles.lockedButtonText, isLight && styles.lockedButtonTextLight]}>Locked</Text>
              </View>
            ) : isCompleted ? (
              <View style={[styles.reviewButton, isLight && styles.reviewButtonLight]}>
                <Text style={styles.reviewButtonText}>Review</Text>
              </View>
            ) : isInProgress ? (
              <View style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#437F76', '#4A9A8F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Start</Text>
              </LinearGradient>
            )}
          </View>
        </View>

        {/* Completed badge */}
        {isCompleted && !isLocked && (
          <View style={styles.completedBadge}>
            <CheckCircle size={14} color={success} />
            <Text style={styles.completedText}>
              {typeof set.score === 'number' ? `Score: ${Math.round(set.score)}` : 'Completed'}
            </Text>
          </View>
        )}

        {/* Locked message */}
        {isLocked && (
          <View style={styles.lockedMessage}>
            <Lock size={12} color={isLight ? '#9CA3AF' : '#666'} />
            <Text style={[styles.lockedMessageText, isLight && styles.lockedMessageTextLight]}>
              Complete previous set first
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2D2D',
    borderRadius: 16,
    padding: 14,
    paddingLeft: 18,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lockedContainer: {
    backgroundColor: '#252525',
    borderColor: 'rgba(255,255,255,0.03)',
  },
  lockedContainerLight: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerLocked: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  setIcon: {
    width: 48,
    height: 48,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  textContent: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 4,
  },
  titleLight: {
    color: '#111827',
  },
  lockedText: {
    color: '#888',
  },
  preview: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontFamily: 'Ubuntu-Regular',
  },
  previewLight: {
    color: '#6B7280',
  },
  lockedPreview: {
    color: '#666',
  },
  buttonContainer: {
    marginLeft: 8,
  },
  startButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  continueButton: {
    backgroundColor: '#437F76',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  reviewButton: {
    backgroundColor: 'rgba(67, 127, 118, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(67, 127, 118, 0.3)',
  },
  reviewButtonLight: {
    backgroundColor: 'rgba(67, 127, 118, 0.1)',
    borderColor: 'rgba(67, 127, 118, 0.2)',
  },
  reviewButtonText: {
    color: '#437F76',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  lockedButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  lockedButtonLight: {
    backgroundColor: '#E5E7EB',
  },
  lockedButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  lockedButtonTextLight: {
    color: '#9CA3AF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingLeft: 78,
  },
  completedText: {
    fontSize: 12,
    color: '#437F76',
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  lockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingLeft: 78,
  },
  lockedMessageText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'Ubuntu-Regular',
  },
  lockedMessageTextLight: {
    color: '#9CA3AF',
  },
});
