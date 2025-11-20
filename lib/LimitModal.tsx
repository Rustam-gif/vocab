import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
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

export default function LimitModal({ visible, title = 'Limit reached', message, onClose, onSubscribe, primaryText = 'Subscribe', secondaryText = 'Not now' }: Props) {
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const isLight = theme === 'light';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '86%', backgroundColor: '#1F2629', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A3033' },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5DED3' },
  title: { fontSize: 18, fontWeight: '800', color: '#E5E7EB', marginBottom: 8 },
  titleLight: { color: '#111827' },
  message: { fontSize: 14, color: '#C7D2FE' },
  messageLight: { color: '#374151' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147' },
  btnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5DED3' },
  btnText: { color: '#E5E7EB', fontWeight: '700' },
  btnTextLight: { color: '#111827' },
  cta: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8B070' },
  ctaText: { color: '#111827', fontWeight: '800' },
});

