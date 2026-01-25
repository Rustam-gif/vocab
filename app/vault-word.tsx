import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import AudioPlayer, { AudioPlayerRef } from '../components/AudioPlayer';
import { TranslationService } from '../services/TranslationService';

export default function VaultWordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { words, loadWords } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const lang = useAppStore(s => s.languagePreferences?.[0] || '');
  const [loading, setLoading] = useState(false);
  const [trLoading, setTrLoading] = useState(false);
  const [translation, setTranslation] = useState<any | null>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [playingAudio, setPlayingAudio] = useState(false);

  useEffect(() => {
    (async () => {
      if (!words || words.length === 0) {
        setLoading(true);
        try { await loadWords(); } finally { setLoading(false); }
      }
    })();
  }, [words, loadWords]);

  const item = useMemo(() => words.find(w => String(w.id) === String(id)), [words, id]);

  useEffect(() => {
    if (!item || !lang) { setTranslation(null); return; }
    let alive = true;
    setTrLoading(true);
    TranslationService.translate(item.word, lang)
      .then(res => { if (alive) setTranslation(res); })
      .finally(() => { if (alive) setTrLoading(false); });
    return () => { alive = false; };
  }, [item?.word, lang]);

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
        <View style={[styles.header, isLight && styles.headerLight]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={isLight ? '#0F766E' : '#4ED9CB'} />
          </TouchableOpacity>
          <Text style={[styles.title, isLight && styles.titleLight]}>Word</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[{ color: '#9CA3AF' }, isLight && { color: '#6B7280' }]}>Word not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={isLight ? '#0F766E' : '#4ED9CB'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && styles.titleLight]} numberOfLines={1} ellipsizeMode="tail">{item.word}</Text>
        <TouchableOpacity
          style={[styles.speakBtn, isLight && styles.speakBtnLight, playingAudio && styles.speakBtnActive]}
          onPress={async () => {
            if (playingAudio) {
              audioPlayerRef.current?.stop();
              setPlayingAudio(false);
              return;
            }

            setPlayingAudio(true);
            try {
              const { SUPABASE_ANON_KEY } = require('../lib/supabase');
              const response = await fetch('https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/tts-cached', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                  text: item.word,
                  voice: 'alloy',
                  rate: 0.85
                })
              });

              const data = await response.json();

              if (data.url) {
                audioPlayerRef.current?.play(data.url, () => {
                  console.log('[vault-word] Audio playback completed');
                  setPlayingAudio(false);
                });
                console.log('[vault-word] Playing TTS (cached:', data.cached + ')');
              }
            } catch (err) {
              console.error('[vault-word] TTS error:', err);
              setPlayingAudio(false);
            }
          }}
        >
          <Volume2 size={18} color={playingAudio ? '#fff' : (isLight ? '#0F766E' : '#4ED9CB')} />
        </TouchableOpacity>
      </View>

      <AudioPlayer ref={audioPlayerRef} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, isLight && styles.cardLight]}>
          <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Definition</Text>
          <Text style={[styles.definition, isLight && { color: '#1F2937' }]}>{item.definition}</Text>
          {!!item.example && (
            <>
              <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Example</Text>
              <Text style={[styles.example, isLight && { color: '#2D4A66' }]}>{item.example}</Text>
            </>
          )}
          {!!lang && (
            <View style={[styles.translationBox, isLight && styles.translationBoxLight]}>
              <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Translation</Text>
              {trLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#F25E86" />
                  <Text style={[{ color: '#9CA3AF' }, isLight && { color: '#6B7280' }]}>Translating…</Text>
                </View>
              ) : translation ? (
                <>
                  <Text style={[styles.translationText, isLight && { color: '#1F2937' }]}>• {translation.translation}</Text>
                  {translation.synonyms?.length ? (
                    <Text style={[styles.translationText, isLight && { color: '#1F2937' }]}>• Synonyms: {translation.synonyms.join(', ')}</Text>
                  ) : null}
                  {translation.example ? (
                    <Text style={[styles.translationExample, isLight && { color: '#2D4A66' }]}>“{translation.example}”</Text>
                  ) : null}
                </>
              ) : (
                <Text style={[{ color: '#9CA3AF' }, isLight && { color: '#6B7280' }]}>No translation</Text>
              )}
            </View>
          )}
          {!!(item as any).synonyms?.length && (
            <>
              <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Synonyms</Text>
              <Text style={[styles.definition, isLight && { color: '#1F2937' }]}>{(item as any).synonyms.join(', ')}</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B263B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerLight: {},
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center', fontFamily: 'Feather-Bold' },
  titleLight: { color: '#111827' },
  speakBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(78,217,203,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.25)',
  },
  speakBtnLight: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(78,217,203,0.3)' },
  speakBtnActive: { backgroundColor: '#4ED9CB', borderColor: '#4ED9CB' },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionTitle: { color: '#F25E86', fontWeight: '800', marginTop: 6, marginBottom: 6, fontFamily: 'Feather-Bold' },
  definition: { color: '#E5E7EB', fontSize: 16, lineHeight: 22, fontFamily: 'Feather-Bold' },
  example: { color: '#9CA3AF', fontSize: 14, fontStyle: 'italic', fontFamily: 'Feather-Bold' },
  translationBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1B263B',
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.15)',
  },
  translationBoxLight: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(78,217,203,0.3)' },
  translationText: { color: '#E5E7EB', fontSize: 14, lineHeight: 20, fontFamily: 'Feather-Bold' },
  translationExample: { color: '#9CA3AF', fontStyle: 'italic', marginTop: 6, fontFamily: 'Feather-Bold' },
});
