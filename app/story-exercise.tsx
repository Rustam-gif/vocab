import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit, Sparkles, Layers, ChevronRight } from 'lucide-react-native';
import { generateStory, StoryLevel } from '../services/StoryGenerator';

const COLORS = {
  background: '#1E1E1E',
  surface: '#262626',
  surfaceAlt: '#2F2F2F',
  accent: '#F2935C',
  muted: '#9CA3AF',
  text: '#FFFFFF',
};

const DEFAULT_WORDS = ['wake up', 'water', 'family', 'market', 'celebrate'];
const LEVELS: StoryLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const GENRES = ['Slice-of-Life', 'Fantasy', 'Mystery', 'Sci-Fi', 'Historical'];
const TONES = ['Playful', 'Adventurous', 'Dramatic', 'Humorous', 'Serious'];

export default function StoryExerciseScreen() {
  const router = useRouter();
  const [words, setWords] = useState<string[]>(DEFAULT_WORDS);
  const [level, setLevel] = useState<StoryLevel>('Beginner');
  const [genre, setGenre] = useState<string>('Slice-of-Life');
  const [tone, setTone] = useState<string>('Playful');
  const [loading, setLoading] = useState(false);
  const [rawStory, setRawStory] = useState<string | null>(null);
  const [storyWithBlanks, setStoryWithBlanks] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fillMode, setFillMode] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeStory = useMemo(() => {
    if (!rawStory || !storyWithBlanks) return null;
    return fillMode ? storyWithBlanks : rawStory;
  }, [rawStory, storyWithBlanks, fillMode]);

  const handleGenerate = async () => {
    const sanitized = words.map(w => w.trim()).filter(Boolean);
    if (sanitized.length !== 5) {
      setError('Please provide exactly five words.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await generateStory({ words: sanitized, level, genre, tone });
      setRawStory(result.rawStory);
    setStoryWithBlanks(result.storyWithBlanks);
    setIsModalOpen(false);
  } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateWord = (value: string, idx: number) => {
    setWords(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Story Builder</Text>
        <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.iconButton}>
          <Edit size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.storyCard}>
          <View style={styles.storyCardHeader}>
            <View>
              <Text style={styles.storyTitle}>Your Story</Text>
              <Text style={styles.storySubtitle}>
                {rawStory ? `${genre} · ${tone} · ${level}` : 'Tap customize to craft a story.'}
              </Text>
            </View>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeChip, !fillMode && styles.modeChipActive]}
                onPress={() => setFillMode(false)}
              >
                <Layers size={16} color={!fillMode ? COLORS.background : COLORS.muted} />
                <Text style={[styles.modeChipText, !fillMode && styles.modeChipTextActive]}>Context</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeChip, fillMode && styles.modeChipActive]}
                onPress={() => setFillMode(true)}
              >
                <Sparkles size={16} color={fillMode ? COLORS.background : COLORS.muted} />
                <Text style={[styles.modeChipText, fillMode && styles.modeChipTextActive]}>Fill-in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.storyBody}>
            {loading && (
              <View style={styles.placeholder}>
                <ActivityIndicator color={COLORS.accent} />
                <Text style={styles.placeholderText}>Spinning a new story…</Text>
              </View>
            )}

            {!loading && activeStory && (
              <Text style={styles.storyText}>{activeStory}</Text>
            )}

            {!loading && !activeStory && (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>No story yet. Customize one to begin.</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/vault')}>
          <Text style={styles.secondaryButtonText}>Add Words from Vault</Text>
          <ChevronRight size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.primaryButtonText}>Customize Story</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.modalIconButton}>
              <ArrowLeft size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Customize Story</Text>
            <View style={{ width: 36 }} />
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.settingsGroup}>
                <Text style={styles.sectionLabel}>Vocabulary Words</Text>
                <View style={styles.wordsGrid}>
                  {words.map((word, idx) => (
                    <View key={idx} style={styles.wordCell}>
                      <Text style={styles.inputLabel}>Word {idx + 1}</Text>
                      <TextInput
                        value={word}
                        onChangeText={value => updateWord(value, idx)}
                        placeholder={`Word ${idx + 1}`}
                        placeholderTextColor={COLORS.muted}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.inlineLink}
                  onPress={() => {
                    setIsModalOpen(false);
                    router.push('/vault');
                  }}
                >
                  <Text style={styles.inlineLinkText}>Browse words in Vault</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingsGroup}>
                <Text style={styles.sectionLabel}>Level</Text>
                <View style={styles.pillRow}>
                  {LEVELS.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pill, level === option && styles.pillActive]}
                      onPress={() => setLevel(option)}
                    >
                      <Text style={[styles.pillText, level === option && styles.pillTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingsGroup}>
                <Text style={styles.sectionLabel}>Genre</Text>
                <View style={styles.pillRow}>
                  {GENRES.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pill, genre === option && styles.pillActive]}
                      onPress={() => setGenre(option)}
                    >
                      <Text style={[styles.pillText, genre === option && styles.pillTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingsGroup}>
                <Text style={styles.sectionLabel}>Tone</Text>
                <View style={styles.pillRow}>
                  {TONES.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pill, tone === option && styles.pillActive]}
                      onPress={() => setTone(option)}
                    >
                      <Text style={[styles.pillText, tone === option && styles.pillTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalSecondary} onPress={() => setIsModalOpen(false)}>
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimary} onPress={handleGenerate} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <Text style={styles.modalPrimaryText}>Generate Story</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#242424',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  storyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  storyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  storyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  storySubtitle: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 13,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#2D2D2D',
  },
  modeChipActive: {
    backgroundColor: COLORS.accent,
  },
  modeChipText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: COLORS.background,
  },
  storyBody: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    minHeight: 220,
  },
  storyText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  placeholderText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  errorBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#442727',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.background,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#323232',
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalIconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#242424',
  },
  modalHeaderTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  settingsGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wordCell: {
    width: '48%',
    gap: 6,
  },
  sectionLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inlineLink: {
    alignSelf: 'flex-start',
  },
  inlineLinkText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  pillActive: {
    backgroundColor: 'rgba(242, 147, 92, 0.12)',
    borderColor: COLORS.accent,
  },
  pillText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  pillTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSecondary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    alignItems: 'center',
  },
  modalSecondaryText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  modalPrimary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
