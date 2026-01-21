import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  delay: number;
  duration: number;
}

interface StarFieldProps {
  starCount?: number;
  height?: number;
  isLight?: boolean;
}

const StarField: React.FC<StarFieldProps> = ({
  starCount = 30, // Reduced for memory optimization
  height = SCREEN_HEIGHT * 2,
  isLight = false
}) => {
  // Generate stars only once
  const stars = useMemo(() => {
    const generated: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      generated.push({
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1, // 1-3.5px
        opacity: new Animated.Value(Math.random() * 0.5 + 0.3),
        delay: Math.random() * 3000,
        duration: Math.random() * 2000 + 2000, // 2-4s
      });
    }
    return generated;
  }, [starCount, height]);

  // Animate twinkling
  useEffect(() => {
    const animations = stars.map(star => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 0.2,
            duration: star.duration,
            delay: star.delay,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: 0.9,
            duration: star.duration,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [stars]);

  // Light mode: use subtle light-colored dots
  const starColor = isLight ? 'rgba(100, 116, 139, 0.4)' : '#FFFFFF';

  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      {stars.map((star, index) => (
        <Animated.View
          key={index}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: starColor,
              opacity: star.opacity,
              // Add glow for larger stars in dark mode
              ...(star.size > 2.5 && !isLight ? {
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 3,
              } : {}),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  star: {
    position: 'absolute',
  },
});

export default StarField;
