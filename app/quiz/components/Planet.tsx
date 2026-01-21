import React, { useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { Crown, Lock, Star } from 'lucide-react-native';

const NODE_SIZE = 72;

// Planet color schemes based on index for variety
const PLANET_COLORS = [
  { base: '#FF6B6B', ring: '#FF8E8E', glow: '#FF6B6B' }, // Red/Mars
  { base: '#4ECDC4', ring: '#7EDDD6', glow: '#4ECDC4' }, // Teal/Neptune
  { base: '#FFE66D', ring: '#FFF0A0', glow: '#FFE66D' }, // Yellow/Saturn
  { base: '#A855F7', ring: '#C084FC', glow: '#A855F7' }, // Purple/Nebula
  { base: '#F97316', ring: '#FB923C', glow: '#F97316' }, // Orange/Jupiter
  { base: '#06B6D4', ring: '#22D3EE', glow: '#06B6D4' }, // Cyan/Uranus
  { base: '#EC4899', ring: '#F472B6', glow: '#EC4899' }, // Pink/Venus
  { base: '#84CC16', ring: '#A3E635', glow: '#84CC16' }, // Green/Earth
];

interface PlanetProps {
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  isPremiumLocked: boolean;
  isQuiz: boolean;
  quizCanSkipAhead: boolean;
  iconSource: any;
  onPress: () => void;
  breathingScale: Animated.Value;
  breathingOpacity: Animated.Value;
  isLight?: boolean;
}

const Planet: React.FC<PlanetProps> = ({
  index,
  isCompleted,
  isCurrent,
  isLocked,
  isPremiumLocked,
  isQuiz,
  quizCanSkipAhead,
  iconSource,
  onPress,
  breathingScale,
  breathingOpacity,
  isLight = false,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Subtle floating animation for unlocked planets
  useEffect(() => {
    if (!isLocked || quizCanSkipAhead) {
      const floating = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000 + (index % 3) * 500, // Stagger timing
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000 + (index % 3) * 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      floating.start();
      return () => floating.stop();
    }
  }, [isLocked, quizCanSkipAhead, index, floatAnim]);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  // Get planet colors based on index
  const colors = PLANET_COLORS[index % PLANET_COLORS.length];
  const isQuizDisabled = isQuiz && isLocked && !quizCanSkipAhead;

  // Determine planet appearance
  let planetColor = colors.base;
  let glowColor = colors.glow;
  let ringColor = colors.ring;

  if (isPremiumLocked) {
    planetColor = '#6B8AF6';
    glowColor = '#6B8AF6';
    ringColor = '#8BA3F9';
  } else if (isCompleted) {
    planetColor = '#4ED9CB';
    glowColor = '#4ED9CB';
    ringColor = '#7EDDD6';
  } else if (isLocked && !quizCanSkipAhead) {
    planetColor = isLight ? '#D4D4D4' : '#4A4A4A';
    glowColor = 'transparent';
    ringColor = isLight ? '#E5E7EB' : '#2D4A66';
  } else if (isQuiz && !isCompleted) {
    planetColor = '#A855F7';
    glowColor = '#A855F7';
    ringColor = '#C084FC';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: floatTranslate }],
        },
      ]}
    >
      {/* Orbital ring glow for current planet */}
      {isCurrent && (
        <Animated.View
          style={[
            styles.orbitalGlow,
            {
              backgroundColor: glowColor,
              opacity: breathingOpacity,
              transform: [{ scale: breathingScale }],
            },
          ]}
        />
      )}

      {/* Skip ahead glow for quiz nodes */}
      {quizCanSkipAhead && !isCurrent && (
        <Animated.View
          style={[
            styles.orbitalGlow,
            {
              backgroundColor: '#9333EA',
              opacity: breathingOpacity,
              transform: [{ scale: breathingScale }],
            },
          ]}
        />
      )}

      {/* Planet shadow (3D effect) */}
      <View
        style={[
          styles.planetShadow,
          {
            backgroundColor: isLocked && !quizCanSkipAhead
              ? (isLight ? '#B8B8B8' : '#1B263B')
              : adjustBrightness(planetColor, -30),
          },
        ]}
      />

      {/* Main planet body */}
      <TouchableOpacity
        onPress={onPress}
        disabled={!isPremiumLocked && isLocked && (!isQuiz || !quizCanSkipAhead)}
        activeOpacity={0.9}
        style={[
          styles.planet,
          {
            backgroundColor: planetColor,
            borderColor: isLocked && !quizCanSkipAhead
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.3)',
          },
        ]}
      >
        {/* Planet highlight (top reflection) */}
        <View style={styles.highlight} pointerEvents="none" />

        {/* Planet crater/detail spots */}
        {!isLocked && !isPremiumLocked && (
          <>
            <View style={[styles.crater, styles.crater1, { backgroundColor: adjustBrightness(planetColor, -15) }]} />
            <View style={[styles.crater, styles.crater2, { backgroundColor: adjustBrightness(planetColor, 15) }]} />
          </>
        )}

        {/* Icon or lock */}
        {isPremiumLocked ? (
          <Crown size={28} color="#FFFFFF" strokeWidth={2.5} />
        ) : isLocked && !quizCanSkipAhead ? (
          <Lock size={24} color={isLight ? '#9CA3AF' : '#666'} />
        ) : (
          <Image
            source={iconSource}
            style={[
              styles.icon,
              (isLocked || isQuizDisabled) && styles.iconLocked,
            ]}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>

      {/* Orbital ring (decorative) */}
      {!isLocked && !isPremiumLocked && (
        <View
          style={[
            styles.orbitalRing,
            {
              borderColor: ringColor,
              opacity: 0.4,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Premium badge */}
      {isPremiumLocked && (
        <View style={styles.premiumBadge}>
          <View style={styles.premiumBadgeInner}>
            <Crown size={10} color="#5D4E0A" fill="#5D4E0A" />
          </View>
        </View>
      )}

      {/* Completion star */}
      {isCompleted && (
        <View style={styles.completionStar}>
          <View style={styles.starInner}>
            <Star size={14} color="#FFF" fill="#FFF" />
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// Helper to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

const styles = StyleSheet.create({
  container: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalGlow: {
    position: 'absolute',
    width: NODE_SIZE + 24,
    height: NODE_SIZE + 24,
    borderRadius: (NODE_SIZE + 24) / 2,
  },
  planetShadow: {
    position: 'absolute',
    top: 6,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
  },
  planet: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderTopLeftRadius: NODE_SIZE / 2,
    borderTopRightRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  crater: {
    position: 'absolute',
    borderRadius: 100,
  },
  crater1: {
    width: 12,
    height: 12,
    top: 16,
    right: 12,
    opacity: 0.5,
  },
  crater2: {
    width: 8,
    height: 8,
    bottom: 18,
    left: 14,
    opacity: 0.3,
  },
  icon: {
    width: 36,
    height: 36,
    zIndex: 1,
  },
  iconLocked: {
    opacity: 0.5,
  },
  orbitalRing: {
    position: 'absolute',
    width: NODE_SIZE + 16,
    height: 12,
    borderRadius: (NODE_SIZE + 16) / 2,
    borderWidth: 2,
    transform: [{ rotateX: '70deg' }],
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8860B',
  },
  premiumBadgeInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionStar: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  starInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Planet;
