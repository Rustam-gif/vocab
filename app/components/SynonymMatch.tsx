/**
 * SynonymMatch Component
 *
 * A matching exercise where users tap cards to match words with their synonyms.
 * Cards animate when matched correctly.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Check } from 'lucide-react-native';

interface WordPair {
  word: string;
  synonym: string;
}

interface SynonymMatchProps {
  words: WordPair[];
  isDarkMode: boolean;
  onComplete: (score: number, total: number) => void;
}

interface Card {
  id: string;
  text: string;
  pairId: number;
  type: 'word' | 'synonym';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP * 3) / 4;
const CARD_HEIGHT = CARD_WIDTH * 1.1;

export default function SynonymMatch({ words, isDarkMode, onComplete }: SynonymMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [incorrectPair, setIncorrectPair] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  // Animation refs for each card
  const cardAnims = useRef<{ [key: string]: Animated.Value }>({});
  const shakeAnims = useRef<{ [key: string]: Animated.Value }>({});
  const matchScaleAnims = useRef<{ [key: string]: Animated.Value }>({});
  const initializedRef = useRef(false);

  // Filter out invalid pairs and limit to 4
  const validWords = useMemo(() => {
    return words
      .filter(p => p.word && p.synonym && p.word.toLowerCase() !== p.synonym.toLowerCase())
      .slice(0, 4);
  }, [words]);

  // Initialize cards from word pairs - only once
  useEffect(() => {
    // Prevent re-initialization
    if (initializedRef.current) return;

    if (validWords.length === 0) {
      // No valid pairs, auto-complete
      onComplete(0, 0);
      return;
    }

    initializedRef.current = true;

    const shuffledCards: Card[] = [];

    validWords.forEach((pair, index) => {
      // Word card
      shuffledCards.push({
        id: `word-${index}`,
        text: pair.word,
        pairId: index,
        type: 'word',
      });

      // Synonym card
      shuffledCards.push({
        id: `syn-${index}`,
        text: pair.synonym,
        pairId: index,
        type: 'synonym',
      });
    });

    // Shuffle cards
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }

    // Initialize animation values
    shuffledCards.forEach(card => {
      cardAnims.current[card.id] = new Animated.Value(1);
      shakeAnims.current[card.id] = new Animated.Value(0);
      matchScaleAnims.current[card.id] = new Animated.Value(1);
    });

    setCards(shuffledCards);
  }, [validWords]);

  const handleCardPress = (cardId: string) => {
    if (completed) return;

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Don't select already matched cards
    if (matchedPairs.has(card.pairId)) return;

    // Don't select the same card twice
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
      return;
    }

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    // Animate selection
    Animated.spring(cardAnims.current[cardId], {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();

    // Check for match when two cards are selected
    if (newSelected.length === 2) {
      const card1 = cards.find(c => c.id === newSelected[0]);
      const card2 = cards.find(c => c.id === newSelected[1]);

      if (card1 && card2) {
        if (card1.pairId === card2.pairId && card1.type !== card2.type) {
          // Correct match!
          const newMatched = new Set(matchedPairs);
          newMatched.add(card1.pairId);
          setMatchedPairs(newMatched);

          // Animate match
          Animated.parallel([
            Animated.spring(matchScaleAnims.current[card1.id], {
              toValue: 1.1,
              useNativeDriver: true,
              friction: 6,
            }),
            Animated.spring(matchScaleAnims.current[card2.id], {
              toValue: 1.1,
              useNativeDriver: true,
              friction: 6,
            }),
          ]).start(() => {
            Animated.parallel([
              Animated.spring(matchScaleAnims.current[card1.id], {
                toValue: 1,
                useNativeDriver: true,
              }),
              Animated.spring(matchScaleAnims.current[card2.id], {
                toValue: 1,
                useNativeDriver: true,
              }),
            ]).start();
          });

          // Reset selection
          setTimeout(() => {
            setSelectedCards([]);
            Animated.spring(cardAnims.current[newSelected[0]], {
              toValue: 1,
              useNativeDriver: true,
            }).start();
            Animated.spring(cardAnims.current[newSelected[1]], {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          }, 300);

          // Check if all matched
          if (newMatched.size === validWords.length) {
            setCompleted(true);
            const totalPairs = validWords.length;
            const score = Math.max(0, totalPairs - mistakes);
            setTimeout(() => onComplete(score, totalPairs), 500);
          }
        } else {
          // Wrong match - shake animation
          setMistakes(m => m + 1);
          setIncorrectPair(newSelected);

          // Shake animation
          const shakeSequence = (cardId: string) => {
            return Animated.sequence([
              Animated.timing(shakeAnims.current[cardId], { toValue: 10, duration: 50, useNativeDriver: true }),
              Animated.timing(shakeAnims.current[cardId], { toValue: -10, duration: 50, useNativeDriver: true }),
              Animated.timing(shakeAnims.current[cardId], { toValue: 10, duration: 50, useNativeDriver: true }),
              Animated.timing(shakeAnims.current[cardId], { toValue: -10, duration: 50, useNativeDriver: true }),
              Animated.timing(shakeAnims.current[cardId], { toValue: 0, duration: 50, useNativeDriver: true }),
            ]);
          };

          Animated.parallel([
            shakeSequence(newSelected[0]),
            shakeSequence(newSelected[1]),
          ]).start();

          // Reset selection after delay
          setTimeout(() => {
            setSelectedCards([]);
            setIncorrectPair([]);
            Animated.spring(cardAnims.current[newSelected[0]], {
              toValue: 1,
              useNativeDriver: true,
            }).start();
            Animated.spring(cardAnims.current[newSelected[1]], {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          }, 600);
        }
      }
    }
  };

  // Uniform color for all unmatched cards
  const CARD_COLOR = isDarkMode
    ? { bg: '#2A2D2E', text: '#FFFFFF', border: '#1A1A1A' }
    : { bg: '#FFFFFF', text: '#374151', border: '#E5E7EB' };
  const MATCHED_COLOR = isDarkMode
    ? { bg: 'rgba(78,217,203,0.2)', text: '#4ED9CB', border: '#4ED9CB' }
    : { bg: 'rgba(13,148,136,0.18)', text: '#0D9488', border: '#0D9488' };

  const renderCard = (card: Card, index: number) => {
    const isSelected = selectedCards.includes(card.id);
    const isMatched = matchedPairs.has(card.pairId);
    const isIncorrect = incorrectPair.includes(card.id);

    // Use uniform color for unmatched, teal highlight when matched
    const color = isMatched ? MATCHED_COLOR : CARD_COLOR;

    const cardScale = cardAnims.current[card.id] || new Animated.Value(1);
    const shakeX = shakeAnims.current[card.id] || new Animated.Value(0);
    const matchScale = matchScaleAnims.current[card.id] || new Animated.Value(1);

    return (
      <Animated.View
        key={card.id}
        style={[
          styles.cardWrapper,
          {
            transform: [
              { scale: Animated.multiply(cardScale, matchScale) },
              { translateX: shakeX },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: color.bg,
              borderColor: color.border,
            },
            isSelected && !isMatched && styles.cardSelected,
            isIncorrect && styles.cardIncorrect,
          ]}
          onPress={() => handleCardPress(card.id)}
          disabled={completed || isMatched}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.cardText,
              { color: color.text },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {card.text}
          </Text>

          {/* Show checkmark on matched cards */}
          {isMatched && (
            <View style={styles.checkBadge}>
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Split cards into rows
  const topRow = cards.slice(0, 4);
  const bottomRow = cards.slice(4, 8);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.row}>
          {topRow.map((card, idx) => renderCard(card, idx))}
        </View>
        <View style={styles.row}>
          {bottomRow.map((card, idx) => renderCard(card, idx + 4))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container is now provided by parent
  },
  grid: {
    gap: CARD_GAP,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.12)',
  },
  cardIncorrect: {
    borderWidth: 3,
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.18)',
  },
  cardText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1999D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
