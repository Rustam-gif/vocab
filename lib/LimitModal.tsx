import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore } from './store';
import { getTheme } from './theme';

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onSubscribe: () => void;
  primaryText?: string;
  secondaryText?: string;
};

/**
 * LimitModal - Simple overlay modal that doesn't use React Native's Modal component
 *
 * CRITICAL: We avoid the native Modal component because it can cause iOS UI thread
 * deadlocks when combined with keyboard sessions or gesture handlers.
 * This uses a simple absolute-positioned View overlay instead.
 */
export default function LimitModal({
  visible,
  title = 'Limit reached',
  message,
  onClose,
  onSubscribe,
  primaryText = 'Subscribe',
  secondaryText = 'Not now',
}: Props) {
  // Render nothing when not visible - no hidden overlays
  if (!visible) return null;

  const theme = useAppStore(s => s.theme);
  const isLight = theme === 'light';

  return (
    <View style={styles.overlay}>
      {/* Backdrop - tapping dismisses */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Card - must be positioned above backdrop */}
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.title, isLight && styles.titleLight]}>{title}</Text>
        <Text style={[styles.message, isLight && styles.messageLight]}>{message}</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={onClose} style={[styles.btn, isLight && styles.btnLight]}>
            <Text style={[styles.btnText, isLight && styles.btnTextLight]}>{secondaryText}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubscribe} style={styles.cta}>
            <Text style={styles.ctaText}>{primaryText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    width: '86%',
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1B263B',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DED3',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  titleLight: {
    color: '#111827',
  },
  message: {
    fontSize: 14,
    color: '#C7D2FE',
  },
  messageLight: {
    color: '#2D4A66',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1B263B',
    borderWidth: 1,
    borderColor: '#2D4A66',
  },
  btnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DED3',
  },
  btnText: {
    color: '#E5E7EB',
    fontWeight: '700',
  },
  btnTextLight: {
    color: '#111827',
  },
  cta: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8B070',
  },
  ctaText: {
    color: '#111827',
    fontWeight: '800',
  },
});
