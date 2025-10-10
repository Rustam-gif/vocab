import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View, Text } from 'react-native';
import LottieView from 'lottie-react-native';

interface AnimatedNextButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  label?: string;
}

/**
 * Animated Next button using Lottie animation
 * Replaces the standard Next/Finish button across all exercises
 */
export default function AnimatedNextButton({ onPress, disabled = false, style, label = 'NEXT' }: AnimatedNextButtonProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (!disabled) {
      // Play animation when button becomes enabled
      animationRef.current?.play();
    } else {
      // Stop animation when button is disabled
      animationRef.current?.reset();
    }
  }, [disabled]);

  const handlePress = () => {
    if (disabled) return;
    // Trigger animation on press
    animationRef.current?.play();
    // Small delay to show animation before executing action
    setTimeout(() => {
      onPress();
    }, 100);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LottieView
          ref={animationRef}
          source={require('../../../assets/lottie/next_button.json')}
          style={styles.animation}
          loop={false}
          autoPlay={!disabled}
          resizeMode="cover"
        />
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  button: {
    width: 160,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  animation: {
    width: 160,
    height: 70,
    position: 'absolute',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    zIndex: 1,
  },
});

