import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, RotateCcw, Home, Trophy, Target } from 'lucide-react-native';
import SuccessCelebration from './components/SuccessCelebration';

export default function AtlasResults() {
  const router = useRouter();
  const { score, totalQuestions, setId, levelId } = useLocalSearchParams<{
    score: string;
    totalQuestions: string;
    setId: string;
    levelId: string;
  }>();

  const [animatedScore, setAnimatedScore] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [forceCelebration, setForceCelebration] = useState(false);

  const scoreNum = parseInt(score || '0');
  const totalNum = parseInt(totalQuestions || '0');
  const incorrectNum = Math.max(totalNum - scoreNum, 0);
  const percentage = totalNum > 0 ? Math.round((scoreNum / totalNum) * 100) : 0;

  useEffect(() => {
    setAnimatedScore(0);
    const increment = scoreNum > 0 ? Math.max(1, Math.ceil(scoreNum / 20)) : 1;
    const scoreInterval = setInterval(() => {
      setAnimatedScore(prev => {
        const next = Math.min(prev + increment, scoreNum);
        if (next >= scoreNum) {
          clearInterval(scoreInterval);
        }
        return next;
      });
    }, 50);

    return () => clearInterval(scoreInterval);
  }, [scoreNum]);

  useEffect(() => {
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);

    const entranceAnimation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();

    return () => entranceAnimation.stop();
  }, [fadeAnim, scaleAnim, scoreNum]);

  useEffect(() => {
    if (percentage < 90) {
      setShowCelebration(false);
      setHasCelebrated(false);
      return;
    }

    if (hasCelebrated) {
      return;
    }

    const celebrationTimer = setTimeout(() => {
      setShowCelebration(true);
      setHasCelebrated(true);
    }, 1500);

    return () => clearTimeout(celebrationTimer);
  }, [percentage, hasCelebrated]);

  const getPerformanceMessage = () => {
    if (percentage >= 80) {
      return {
        message: "Excellent! You own these words 🎉",
        color: "#4CAF50",
        icon: Trophy
      };
    } else if (percentage >= 60) {
      return {
        message: "Good work! Keep practicing 🌟",
        color: "#F2AB27",
        icon: Target
      };
    } else {
      return {
        message: "Try again to master these words 💪",
        color: "#F44336",
        icon: RotateCcw
      };
    }
  };

  const performance = getPerformanceMessage();
  const PerformanceIcon = performance.icon;

  const handleRetry = () => {
    router.push(`/quiz/atlas-practice-integrated?setId=${setId}&levelId=${levelId}`);
  };

  const handleBackToSets = () => {
    router.push(`/quiz/learn?level=${levelId}`);
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setForceCelebration(false);
  };

  const handleTestCelebrate = () => {
    setForceCelebration(true);
    setShowCelebration(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Results</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Score Highlight */}
        <Animated.View 
          style={[
            styles.scoreContainer,
            { 
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim 
            }
          ]}
        >
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{animatedScore}</Text>
            <Text style={styles.totalText}>/ {totalNum}</Text>
          </View>
          <View style={styles.scoreSummary}>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.scoreBreakdown}>
              {totalNum > 0 ? `${animatedScore} / ${totalNum}` : `${animatedScore}`}
            </Text>
          </View>
        </Animated.View>

        {/* Performance Message */}
        <View style={styles.messageContainer}>
          <PerformanceIcon size={32} color={performance.color} />
          <Text style={[styles.messageText, { color: performance.color }]}>
            {performance.message}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{scoreNum}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{incorrectNum}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalNum}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retryButton]}
            onPress={handleRetry}
          >
            <RotateCcw size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.setsButton]}
            onPress={handleBackToSets}
          >
            <Target size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Back to Sets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.homeButton]}
            onPress={handleHome}
          >
            <Home size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.testButton]}
            onPress={handleTestCelebrate}
          >
            <Text style={styles.actionButtonText}>Test Celebration</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Success Celebration Modal */}
      <SuccessCelebration
        visible={showCelebration}
        score={percentage}
        onClose={handleCelebrationClose}
        threshold={forceCelebration ? 0 : 90}
        title="Fantastic!"
        subtitle={`You scored ${percentage}% - Outstanding work!`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4CAF50',
  },
  scoreSummary: {
    alignItems: 'center',
  },
  scoreBreakdown: {
    marginTop: 6,
    fontSize: 16,
    color: '#9CA3AF',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#F2AB27',
  },
  setsButton: {
    backgroundColor: '#4CAF50',
  },
  homeButton: {
    backgroundColor: '#666',
  },
  testButton: {
    backgroundColor: '#1E3A8A',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
