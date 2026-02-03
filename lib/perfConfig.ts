/**
 * Performance configuration for Debug vs Release builds
 * Keep animations enabled but optimize for New Architecture
 */

export const PERF_CONFIG = {
  // Keep animations enabled in both Debug and Release
  ENABLE_SPACECRAFT_ANIMATION: true,
  ENABLE_PLANET_ANIMATIONS: true,
  ENABLE_LOTTIE_ANIMATIONS: false, // Lottie still disabled (stub)

  // Faster animations in Debug for better perceived performance
  ANIMATION_DURATION_MULTIPLIER: __DEV__ ? 0.7 : 1.0,

  // Keep interpolations enabled but simplified
  ENABLE_ARC_INTERPOLATION: true,
  ENABLE_ROTATION_INTERPOLATION: false, // Rotation not needed

  // Tab switching optimizations
  DEFER_HEAVY_RENDERS: false,

  // Logging
  ENABLE_ANIMATION_LOGS: __DEV__,
};

export const getAnimationDuration = (baseMs: number): number => {
  return Math.round(baseMs * PERF_CONFIG.ANIMATION_DURATION_MULTIPLIER);
};
