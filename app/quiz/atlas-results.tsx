import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

const ACCENT = '#F2935C';

export default function AtlasResults() {
  const router = useRouter();
  const { score, totalQuestions, setId, levelId, points } = useLocalSearchParams<{
    score?: string;
    totalQuestions?: string;
    setId?: string;
    levelId?: string;
    points?: string;
  }>();

  const numericPoints = useMemo(() => {
    const parsedPoints = parseInt(points || '', 10);
    if (!Number.isNaN(parsedPoints)) return Math.max(0, parsedPoints);
    const correct = parseInt(score || '0', 10);
    const total = parseInt(totalQuestions || '0', 10);
    if (Number.isNaN(correct) || Number.isNaN(total) || total === 0) return Math.max(0, correct * 20);
    return Math.max(0, Math.round((correct / total) * 100));
  }, [points, score, totalQuestions]);

  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    setDisplayPoints(0);
    const step = numericPoints > 0 ? Math.max(1, Math.ceil(numericPoints / 40)) : 1;
    const interval = setInterval(() => {
      setDisplayPoints(prev => {
        const next = Math.min(prev + step, numericPoints);
        if (next >= numericPoints) {
          clearInterval(interval);
        }
        return next;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [numericPoints]);

  const handleDone = () => {
    if (levelId) {
      router.replace(`/quiz/learn?level=${levelId}`);
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Results</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.animationWrapper}>
          <LottieView
            source={require('../../assets/lottie/completed.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
        </View>
        <Text style={styles.label}>Score Achieved</Text>
        <Text style={styles.pointsText}>{displayPoints}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 32,
  },
  animationWrapper: {
    width: 180,
    height: 180,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsText: {
    fontSize: 44,
    fontWeight: '700',
    color: ACCENT,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
