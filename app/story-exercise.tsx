import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Brain, Save, Plus } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { aiService } from '../services/AIService';
import { vaultService } from '../services/VaultService';
import { analyticsService } from '../services/AnalyticsService';
import { Story, StoryBlank } from '../types';

export default function StoryExerciseScreen() {
  const router = useRouter();
  const { words, currentStory, setCurrentStory, saveStory } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [blanks, setBlanks] = useState<StoryBlank[]>([]);
  const [selectedBlank, setSelectedBlank] = useState<StoryBlank | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [score, setScore] = useState(0);
  const [completedBlanks, setCompletedBlanks] = useState<Set<string>>(new Set());
  const [floatingAnimations, setFloatingAnimations] = useState<Array<{ id: string; animatedValue: Animated.Value }>>([]);

  useEffect(() => {
    generateStory();
  }, []);

  const generateStory = async () => {
    if (words.length === 0) {
      Alert.alert('No Words', 'Add some words to your vault first!');
      router.back();
      return;
    }

    setLoading(true);
    try {
      const weakestWords = vaultService.getWeakestWords(5);
      const generatedStory = await aiService.generateStory(weakestWords);
      
      if (generatedStory) {
        setStory(generatedStory);
        setCurrentStory(generatedStory);
        
        // Create blanks from the story
        const storyBlanks = createBlanksFromStory(generatedStory, weakestWords);
        setBlanks(storyBlanks);
        setCompletedBlanks(new Set());
        setScore(0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate story');
    } finally {
      setLoading(false);
    }
  };

  const createBlanksFromStory = (story: Story, words: any[]): StoryBlank[] => {
    const blanks: StoryBlank[] = [];
    let position = 0;
    
    words.forEach((word, index) => {
      const blankPosition = story.content.indexOf('●●●●', position);
      if (blankPosition !== -1) {
        blanks.push({
          id: `blank_${index}`,
          word: word.word,
          position: blankPosition,
          candidates: aiService['generateCandidates'](word, words),
        });
        position = blankPosition + 4; // Move past the blank
      }
    });
    
    return blanks;
  };

  const handleBlankPress = (blank: StoryBlank) => {
    setSelectedBlank(blank);
    setShowWordModal(true);
  };

  const handleWordSelect = async (selectedWord: string) => {
    if (!selectedBlank) return;

    const isCorrect = selectedWord === selectedBlank.word;
    const scoreChange = isCorrect ? 1 : 0;
    
    if (isCorrect) {
      setScore(prev => prev + scoreChange);
      setCompletedBlanks(prev => new Set([...prev, selectedBlank.id]));
      
      // Create floating animation
      const animatedValue = new Animated.Value(0);
      const animationId = `anim_${Date.now()}`;
      
      setFloatingAnimations(prev => [...prev, { id: animationId, animatedValue }]);
      
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFloatingAnimations(prev => prev.filter(anim => anim.id !== animationId));
      });

      // Update word stats in vault
      await vaultService.recordPracticeResult(selectedBlank.word, {
        scoreChange: 1,
        correct: true,
        exerciseType: 'story',
      });

      // Record result
      await analyticsService.recordResult({
        wordId: selectedBlank.word,
        exerciseType: 'story',
        correct: true,
        score: 1,
        timestamp: new Date(),
      });
    } else {
      // Animate word flying to correct blank
      // This would be implemented with more complex animations
      Alert.alert('Incorrect', `The correct word is: ${selectedBlank.word}`);
    }

    setShowWordModal(false);
    setSelectedBlank(null);
  };

  const handleSaveStory = async () => {
    if (!story) return;
    
    const completedStory = {
      ...story,
      completedAt: new Date(),
    };
    
    await saveStory(completedStory);
    Alert.alert('Success', 'Story saved to your journal!');
  };

  const renderStoryWithBlanks = () => {
    if (!story) return null;

    let content = story.content;
    const parts = [];
    let lastIndex = 0;

    // Split content by blanks and create clickable elements
    blanks.forEach((blank, index) => {
      const blankStart = content.indexOf('●●●●', lastIndex);
      if (blankStart !== -1) {
        // Add text before blank
        if (blankStart > lastIndex) {
          parts.push(
            <Text key={`text_${index}`} style={styles.storyText}>
              {content.substring(lastIndex, blankStart)}
            </Text>
          );
        }

        // Add clickable blank
        const isCompleted = completedBlanks.has(blank.id);
        parts.push(
          <TouchableOpacity
            key={`blank_${index}`}
            style={[
              styles.blankButton,
              isCompleted && styles.completedBlank,
            ]}
            onPress={() => !isCompleted && handleBlankPress(blank)}
            disabled={isCompleted}
          >
            <Text style={[
              styles.blankText,
              isCompleted && styles.completedBlankText,
            ]}>
              {isCompleted ? blank.word : '●●●●'}
            </Text>
          </TouchableOpacity>
        );

        lastIndex = blankStart + 4;
      }
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <Text key="text_end" style={styles.storyText}>
          {content.substring(lastIndex)}
        </Text>
      );
    }

    return <View style={styles.storyContent}>{parts}</View>;
  };

  const renderFloatingAnimations = () => {
    return floatingAnimations.map(({ id, animatedValue }) => (
      <Animated.View
        key={id}
        style={[
          styles.floatingText,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -50],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.floatingTextContent}>+1</Text>
      </Animated.View>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e28743" />
          <Text style={styles.loadingText}>Generating your story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No story available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Story Exercise</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.storyContainer}>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <View style={styles.storyContent}>
            {renderStoryWithBlanks()}
          </View>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap the yellow dots to fill in the missing words
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={generateStory}
        >
          <Brain size={20} color="#fff" />
          <Text style={styles.actionButtonText}>New Story</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSaveStory}
        >
          <Save size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Save Story</Text>
        </TouchableOpacity>
      </View>

      {/* Word Selection Modal */}
      <Modal
        visible={showWordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose the correct word</Text>
            <View style={styles.wordOptionsContainer}>
              {selectedBlank?.candidates.map((word, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.wordOption}
                  onPress={() => handleWordSelect(word)}
                >
                  <Text style={styles.wordOptionText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWordModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Animations */}
      {renderFloatingAnimations()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a0a0a0',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2f2f',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreContainer: {
    padding: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e28743',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  storyContainer: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  storyContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  storyText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#e0e0e0',
  },
  blankButton: {
    backgroundColor: '#F2AB27',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  completedBlank: {
    backgroundColor: '#4CAF50',
  },
  blankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  completedBlankText: {
    color: '#fff',
  },
  instructionsContainer: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2c2f2f',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#e28743',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c2f2f',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  wordOptionsContainer: {
    gap: 12,
  },
  wordOption: {
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  wordOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1000,
  },
  floatingTextContent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
