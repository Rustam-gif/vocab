import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';

// Mounts hidden Lottie instances once to force native parsing/caching.
// We keep them mounted for the whole session with zero size so they don't draw.
export default function LottiePreloader() {
  const pool: any[] = (globalThis as any).__LOTTIE_JSON_POOL__ || [];
  if (!pool || pool.length === 0) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>
      {pool.map((src, i) => (
        <LottieView key={`pre-${i}`} source={src} autoPlay={false} loop={false} progress={1} style={{ width: 0, height: 0 }} />
      ))}
    </View>
  );
}

