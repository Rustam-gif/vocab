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

export default {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
};

