// Haptic feedback wrapper using react-native-haptic-feedback
import { Platform } from 'react-native';
import RNHapticFeedback from 'react-native-haptic-feedback';

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
export function trigger(type: HapticFeedbackType, options?: HapticOptions): void {
  if (Platform.OS !== 'ios') return;

  try {
    RNHapticFeedback.trigger(type, options || {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    });
  } catch (e) {
    console.log('[Haptics] Error:', e);
  }
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

export async function impactAsync(style?: ImpactFeedbackStyle) {
  const typeMap: Record<string, HapticFeedbackType> = {
    light: 'impactLight',
    medium: 'impactMedium',
    heavy: 'impactHeavy',
  };
  trigger(typeMap[style || 'medium'] || 'impactMedium');
}

export async function notificationAsync(type?: NotificationFeedbackType) {
  const typeMap: Record<string, HapticFeedbackType> = {
    success: 'notificationSuccess',
    warning: 'notificationWarning',
    error: 'notificationError',
  };
  trigger(typeMap[type || 'success'] || 'notificationSuccess');
}

// Default export matching react-native-haptic-feedback API
export default {
  trigger,
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
};
