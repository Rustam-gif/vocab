import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore } from './store';
import { getTheme } from './theme';
import { Users, Crown } from 'lucide-react-native';

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

        {/* Social Proof */}
        <View style={[styles.socialProof, isLight && styles.socialProofLight]}>
          <Users size={16} color={isLight ? '#6B7280' : '#9CA3AF'} />
          <Text style={[styles.socialProofText, isLight && styles.socialProofTextLight]}>
            12,453 learners upgraded this month
          </Text>
        </View>

        {/* Before/After Comparison */}
        <View style={styles.comparison}>
          <View style={[styles.comparisonCard, styles.freeCard, isLight && styles.freeCardLight]}>
            <Text style={[styles.comparisonLabel, isLight && styles.comparisonLabelLight]}>Free</Text>
            <Text style={[styles.comparisonValue, isLight && styles.comparisonValueLight]}>40 words</Text>
          </View>
          <View style={[styles.comparisonCard, styles.premiumCard]}>
            <View style={styles.premiumHeader}>
              <Crown size={16} color="#FCD34D" />
              <Text style={styles.premiumLabel}>Premium</Text>
            </View>
            <Text style={styles.premiumValue}>1,500+ words</Text>
          </View>
        </View>

        <View style={styles.row}>
          {secondaryText ? (
            <TouchableOpacity onPress={onClose} style={[styles.btn, isLight && styles.btnLight]}>
              <Text style={[styles.btnText, isLight && styles.btnTextLight]}>{secondaryText}</Text>
            </TouchableOpacity>
          ) : null}
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
    fontSize: 20,
    fontWeight: '800',
    color: '#E5E7EB',
    marginBottom: 8,
    fontFamily: 'Feather-Bold',
  },
  titleLight: {
    color: '#111827',
  },
  message: {
    fontSize: 15,
    color: '#C7D2FE',
    fontFamily: 'Feather-Bold',
    lineHeight: 22,
  },
  messageLight: {
    color: '#2D4A66',
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(78, 217, 203, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 217, 203, 0.15)',
  },
  socialProofLight: {
    backgroundColor: 'rgba(78, 217, 203, 0.05)',
    borderColor: 'rgba(78, 217, 203, 0.2)',
  },
  socialProofText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
    fontWeight: '600',
  },
  socialProofTextLight: {
    color: '#6B7280',
  },
  comparison: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  comparisonCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  freeCard: {
    backgroundColor: '#1B263B',
    borderColor: '#2D4A66',
  },
  freeCardLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonLabelLight: {
    color: '#6B7280',
  },
  comparisonValue: {
    fontSize: 16,
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
    fontWeight: '700',
  },
  comparisonValueLight: {
    color: '#111827',
  },
  premiumCard: {
    backgroundColor: 'rgba(252, 211, 77, 0.12)',
    borderColor: 'rgba(252, 211, 77, 0.3)',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  premiumLabel: {
    fontSize: 12,
    color: '#FCD34D',
    fontFamily: 'Feather-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumValue: {
    fontSize: 16,
    color: '#FCD34D',
    fontFamily: 'Feather-Bold',
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: '#2D4A66',
  },
  btnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DED3',
  },
  btnText: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Feather-Bold',
  },
  btnTextLight: {
    color: '#111827',
  },
  cta: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8B070',
  },
  ctaText: {
    color: '#0D1B2A',
    fontWeight: '800',
    fontSize: 15,
    fontFamily: 'Feather-Bold',
  },
});
