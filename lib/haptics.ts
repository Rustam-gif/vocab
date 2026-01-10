// Haptic feedback proxy - no-op implementation for when native module is not available

export type HapticFeedbackType =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

export interface HapticOptions {
  enableVibrateFallback?: boolean;
  ignoreAndroidSystemSettings?: boolean;
}

// Main trigger function matching react-native-haptic-feedback API
export function trigger(_type: HapticFeedbackType, _options?: HapticOptions): void {
  // no-op - native module not available
}

// Expo-style API (for compatibility)
export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export async function impactAsync(_style?: ImpactFeedbackStyle) {
  // no-op placeholder for Expo Haptics
}

export async function notificationAsync(_type?: NotificationFeedbackType) {
  // no-op placeholder for Expo Haptics
}

// Default export matching react-native-haptic-feedback API
export default {
  trigger,
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
};
