import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  InteractionManager,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

const SUCCESS_ANIMATION = require('../../../assets/lottie/Success.json');

interface SuccessCelebrationProps {
  visible: boolean;
  score: number;
  onClose: () => void;
  threshold?: number;
  title?: string;
  subtitle?: string;
}

export default function SuccessCelebration({
  visible,
  score,
  onClose,
  threshold = 90,
  title = 'Fantastic!',
  subtitle,
}: SuccessCelebrationProps) {
  const lottieRef = useRef<LottieView>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const resolvedThreshold = threshold ?? 90;
  const shouldDisplay = visible && score >= resolvedThreshold;

  const subtitleText = useMemo(
    () => subtitle ?? `You scored ${score}% - Outstanding work!`,
    [score, subtitle]
  );

  useEffect(() => {
    if (!shouldDisplay) {
      return;
    }

    setAnimationKey(prev => prev + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    if (typeof AccessibilityInfo.announceForAccessibility === 'function') {
      AccessibilityInfo.announceForAccessibility(`${title}. ${subtitleText}`);
    }
  }, [shouldDisplay, title, subtitleText]);

  useEffect(() => {
    if (!shouldDisplay) {
      return;
    }

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        try {
          lottieRef.current?.reset?.();
          lottieRef.current?.play?.(0, 90);
        } catch (error) {
          console.warn('SuccessCelebration: failed to play animation', error);
        }
      });
    });

    return () => interactionHandle?.cancel?.();
  }, [animationKey, shouldDisplay]);

  if (!shouldDisplay) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback>
        <View style={styles.backdrop}>
          <View style={styles.card} accessibilityRole="dialog" accessibilityLabel={title}>
            <View style={styles.animationContainer}>
              <LottieView
                key={animationKey}
                ref={lottieRef}
                source={SUCCESS_ANIMATION}
                loop={false}
                autoPlay={false}
                resizeMode="contain"
                enableMergePathsAndroidForKitKatAndAbove
                style={styles.animation}
                onAnimationFailure={error => {
                  console.warn('SuccessCelebration animation failed', error);
                }}
              />
            </View>

            <Text
              style={styles.title}
              accessibilityRole="header"
              accessibilityLabel={`Success: ${title}`}
            >
              {title}
            </Text>

            <Text
              style={styles.subtitle}
              accessibilityLabel={`Score: ${subtitleText}`}
            >
              {subtitleText}
            </Text>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              accessibilityHint="Closes the celebration"
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: '#1F2933',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#F2935C',
    borderRadius: 16,
    minWidth: 180,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
