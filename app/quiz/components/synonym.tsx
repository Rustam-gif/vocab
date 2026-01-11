import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  AccessibilityInfo,
  StyleProp,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { useAppStore } from '../../../lib/store';
import { getTheme } from '../../../lib/theme';
import { analyticsService } from '../../../services/AnalyticsService';
import AnimatedNextButton from './AnimatedNextButton';
import { Volume2 } from 'lucide-react-native';
import { speak } from '../../../lib/speech';
import { levels } from '../data/levels';
import LottieView from 'lottie-react-native';

interface SynonymProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  hearts: number;
  onHeartLost: () => void;
  wordRange?: { start: number; end: number };
  wordsOverride?: Array<{ word: string; phonetic: string; definition: string; example: string; synonyms?: string[] }>;
  showUfoAnimation?: boolean;
}

interface WordEntry {
  word: string;
  ipa: string;
  correct: string[];
  incorrectPool: string[];
}

const WORDS: WordEntry[] = [
  // Set 1: Daily Routines & Habits
  { word: 'wake up', ipa: '/weɪk ʌp/', correct: ['get up', 'arise', 'awaken'], incorrectPool: ['sleep', 'rest', 'nap', 'slumber', 'doze'] },
  { word: 'eat', ipa: '/iːt/', correct: ['consume', 'have a meal', 'dine'], incorrectPool: ['drink', 'cook', 'buy', 'sip', 'taste'] },
  { word: 'study', ipa: '/ˈstʌdi/', correct: ['learn', 'practice', 'review'], incorrectPool: ['play', 'relax', 'sleep', 'watch', 'forget'] },
  { word: 'exercise', ipa: '/ˈeksərsaɪz/', correct: ['work out', 'train', 'keep fit'], incorrectPool: ['rest', 'eat', 'sleep', 'sit', 'relax'] },
  { word: 'sleep', ipa: '/sliːp/', correct: ['rest', 'slumber', 'doze'], incorrectPool: ['wake', 'play', 'talk', 'run', 'work'] },
  
  // Set 2: Basic Needs & Family
  { word: 'home', ipa: '/hoʊm/', correct: ['house', 'place', 'where you live'], incorrectPool: ['school', 'store', 'park', 'street', 'office'] },
  { word: 'food', ipa: '/fuːd/', correct: ['meal', 'eating', 'lunch'], incorrectPool: ['drink', 'water', 'game', 'book', 'toy'] },
  { word: 'brother', ipa: '/ˈbrʌðər/', correct: ['sibling', 'family', 'boy in family'], incorrectPool: ['friend', 'teacher', 'neighbor', 'classmate', 'cousin'] },
  { word: 'family', ipa: '/ˈfæməli/', correct: ['relatives', 'parents', 'mom and dad'], incorrectPool: ['friends', 'teachers', 'neighbors', 'classmates', 'strangers'] },
  { word: 'friend', ipa: '/frend/', correct: ['buddy', 'pal', 'someone you like'], incorrectPool: ['enemy', 'stranger', 'teacher', 'boss', 'rival'] },
  
  // Set 3: Education & Work
  { word: 'teacher', ipa: '/ˈtiːtʃər/', correct: ['instructor', 'educator', 'tutor'], incorrectPool: ['student', 'learner', 'principal', 'parent', 'friend'] },
  { word: 'book', ipa: '/bʊk/', correct: ['text', 'story', 'novel'], incorrectPool: ['pen', 'paper', 'desk', 'computer', 'notebook'] },
  { word: 'job', ipa: '/dʒɑːb/', correct: ['work', 'employment', 'career'], incorrectPool: ['hobby', 'game', 'rest', 'vacation', 'play'] },
  { word: 'write', ipa: '/raɪt/', correct: ['draw letters', 'put down', 'pen'], incorrectPool: ['read', 'speak', 'listen', 'erase', 'delete'] },
  { word: 'help', ipa: '/help/', correct: ['assist', 'support', 'aid'], incorrectPool: ['hinder', 'block', 'ignore', 'harm', 'stop'] },
  
  // Set 4: Food & Cooking
  { word: 'cook', ipa: '/kʊk/', correct: ['prepare', 'make', 'fix food'], incorrectPool: ['eat', 'buy', 'order', 'throw', 'waste'] },
  { word: 'drink', ipa: '/drɪŋk/', correct: ['sip', 'gulp', 'swallow'], incorrectPool: ['eat', 'cook', 'pour', 'spill', 'waste'] },
  { word: 'taste', ipa: '/teɪst/', correct: ['try', 'sample', 'test'], incorrectPool: ['cook', 'buy', 'throw', 'order', 'waste'] },
  { word: 'hungry', ipa: '/ˈhʌŋɡri/', correct: ['starving', 'wanting food', 'needing food'], incorrectPool: ['full', 'satisfied', 'fed', 'stuffed', 'content'] },
  
  // Set 5: Free Time & Hobbies
  { word: 'play', ipa: '/pleɪ/', correct: ['have fun', 'enjoy', 'do activity'], incorrectPool: ['work', 'study', 'rest', 'sleep', 'labor'] },
  { word: 'music', ipa: '/ˈmjuːzɪk/', correct: ['songs', 'tunes', 'melody'], incorrectPool: ['silence', 'noise', 'speech', 'words', 'quiet'] },
  { word: 'watch', ipa: '/wɑːtʃ/', correct: ['see', 'look at', 'view'], incorrectPool: ['ignore', 'miss', 'avoid', 'hide', 'skip'] },
  { word: 'read', ipa: '/riːd/', correct: ['study', 'look at', 'scan'], incorrectPool: ['write', 'speak', 'listen', 'ignore', 'skip'] },
  { word: 'dance', ipa: '/dæns/', correct: ['move', 'groove', 'sway'], incorrectPool: ['sit', 'stand', 'rest', 'sleep', 'stop'] },
  
  // Set 6: Technology & Internet
  { word: 'computer', ipa: '/kəmˈpjuːtər/', correct: ['PC', 'laptop', 'machine'], incorrectPool: ['phone', 'tablet', 'book', 'pen', 'paper'] },
  { word: 'phone', ipa: '/foʊn/', correct: ['mobile', 'cell', 'device'], incorrectPool: ['computer', 'tablet', 'watch', 'camera', 'radio'] },
  { word: 'internet', ipa: '/ˈɪntərnet/', correct: ['web', 'online', 'network'], incorrectPool: ['book', 'paper', 'TV', 'radio', 'offline'] },
  { word: 'video', ipa: '/ˈvɪdioʊ/', correct: ['film', 'clip', 'recording'], incorrectPool: ['photo', 'picture', 'audio', 'music', 'text'] },
  { word: 'game', ipa: '/ɡeɪm/', correct: ['play', 'activity', 'sport'], incorrectPool: ['work', 'job', 'task', 'study', 'lesson'] },
  
  // Set 7: Shopping & Money
  { word: 'buy', ipa: '/baɪ/', correct: ['purchase', 'get', 'acquire'], incorrectPool: ['sell', 'return', 'give', 'donate', 'throw'] },
  { word: 'money', ipa: '/ˈmʌni/', correct: ['cash', 'coins', 'currency'], incorrectPool: ['debt', 'bill', 'receipt', 'ticket', 'card'] },
  { word: 'shop', ipa: '/ʃɑːp/', correct: ['store', 'market', 'place'], incorrectPool: ['home', 'school', 'park', 'office', 'hospital'] },
  { word: 'price', ipa: '/praɪs/', correct: ['cost', 'amount', 'value'], incorrectPool: ['free', 'gift', 'bonus', 'discount', 'sale'] },
  { word: 'pay', ipa: '/peɪ/', correct: ['give money', 'spend', 'hand over'], incorrectPool: ['receive', 'get', 'earn', 'save', 'keep'] },
  
  // Set 8: Health & Body
  { word: 'doctor', ipa: '/ˈdɑːktər/', correct: ['physician', 'medic', 'healer'], incorrectPool: ['patient', 'nurse', 'teacher', 'student', 'visitor'] },
  { word: 'sick', ipa: '/sɪk/', correct: ['ill', 'unwell', 'not healthy'], incorrectPool: ['healthy', 'well', 'fine', 'strong', 'fit'] },
  { word: 'body', ipa: '/ˈbɑːdi/', correct: ['self', 'physical form', 'figure'], incorrectPool: ['mind', 'soul', 'spirit', 'thought', 'idea'] },
  { word: 'pain', ipa: '/peɪn/', correct: ['hurt', 'ache', 'soreness'], incorrectPool: ['pleasure', 'joy', 'comfort', 'relief', 'ease'] },
  { word: 'healthy', ipa: '/ˈhelθi/', correct: ['well', 'fit', 'strong'], incorrectPool: ['sick', 'ill', 'weak', 'unwell', 'tired'] },
  
  // Set 9: Weather & Nature
  { word: 'sun', ipa: '/sʌn/', correct: ['sunshine', 'daylight', 'star'], incorrectPool: ['moon', 'night', 'darkness', 'shadow', 'cloud'] },
  { word: 'rain', ipa: '/reɪn/', correct: ['rainfall', 'shower', 'water'], incorrectPool: ['sun', 'drought', 'heat', 'dryness', 'fire'] },
  { word: 'tree', ipa: '/triː/', correct: ['plant', 'wood', 'oak'], incorrectPool: ['flower', 'grass', 'bush', 'rock', 'stone'] },
  { word: 'cold', ipa: '/koʊld/', correct: ['chilly', 'cool', 'freezing'], incorrectPool: ['hot', 'warm', 'burning', 'heated', 'fiery'] },
  { word: 'hot', ipa: '/hɑːt/', correct: ['warm', 'burning', 'heated'], incorrectPool: ['cold', 'cool', 'freezing', 'chilly', 'icy'] },
  
  // Set 10: Emotions & Personality
  { word: 'happy', ipa: '/ˈhæpi/', correct: ['joyful', 'glad', 'cheerful'], incorrectPool: ['sad', 'unhappy', 'upset', 'angry', 'miserable'] },
  { word: 'sad', ipa: '/sæd/', correct: ['unhappy', 'upset', 'down'], incorrectPool: ['happy', 'joyful', 'glad', 'cheerful', 'excited'] },
  { word: 'angry', ipa: '/ˈæŋɡri/', correct: ['mad', 'upset', 'furious'], incorrectPool: ['calm', 'peaceful', 'happy', 'content', 'relaxed'] },
  { word: 'kind', ipa: '/kaɪnd/', correct: ['nice', 'gentle', 'caring'], incorrectPool: ['mean', 'cruel', 'harsh', 'rude', 'unkind'] },
  { word: 'smart', ipa: '/smɑːrt/', correct: ['clever', 'intelligent', 'bright'], incorrectPool: ['dumb', 'stupid', 'foolish', 'slow', 'ignorant'] },
  
  // Set 11: Transportation & Travel
  { word: 'car', ipa: '/kɑːr/', correct: ['vehicle', 'auto', 'automobile'], incorrectPool: ['bus', 'train', 'plane', 'bike', 'boat'] },
  { word: 'bus', ipa: '/bʌs/', correct: ['coach', 'transit', 'transport'], incorrectPool: ['car', 'taxi', 'train', 'plane', 'bike'] },
  { word: 'walk', ipa: '/wɔːk/', correct: ['stroll', 'step', 'move'], incorrectPool: ['run', 'jump', 'sit', 'stand', 'rest'] },
  { word: 'travel', ipa: '/ˈtrævəl/', correct: ['journey', 'go', 'trip'], incorrectPool: ['stay', 'remain', 'rest', 'stop', 'settle'] },
  { word: 'ticket', ipa: '/ˈtɪkɪt/', correct: ['pass', 'fare', 'entry'], incorrectPool: ['receipt', 'bill', 'card', 'coupon', 'voucher'] },
  
  // Set 12: Home & Furniture
  { word: 'room', ipa: '/ruːm/', correct: ['chamber', 'space', 'area'], incorrectPool: ['hallway', 'door', 'window', 'wall', 'ceiling'] },
  { word: 'table', ipa: '/ˈteɪbəl/', correct: ['desk', 'surface', 'counter'], incorrectPool: ['chair', 'bed', 'sofa', 'floor', 'wall'] },
  { word: 'chair', ipa: '/tʃer/', correct: ['seat', 'stool', 'bench'], incorrectPool: ['table', 'bed', 'sofa', 'floor', 'wall'] },
  { word: 'bed', ipa: '/bed/', correct: ['mattress', 'bunk', 'cot'], incorrectPool: ['chair', 'table', 'sofa', 'floor', 'desk'] },
  { word: 'door', ipa: '/dɔːr/', correct: ['entrance', 'gate', 'doorway'], incorrectPool: ['window', 'wall', 'floor', 'ceiling', 'roof'] },
  
  // Set 13: Culture & Entertainment
  { word: 'movie', ipa: '/ˈmuːvi/', correct: ['film', 'picture', 'show'], incorrectPool: ['book', 'song', 'game', 'photo', 'painting'] },
  { word: 'song', ipa: '/sɔːŋ/', correct: ['tune', 'melody', 'music'], incorrectPool: ['speech', 'noise', 'silence', 'words', 'talk'] },
  { word: 'party', ipa: '/ˈpɑːrti/', correct: ['celebration', 'gathering', 'event'], incorrectPool: ['meeting', 'work', 'class', 'study', 'lesson'] },
  { word: 'art', ipa: '/ɑːrt/', correct: ['painting', 'drawing', 'artwork'], incorrectPool: ['writing', 'music', 'sport', 'game', 'math'] },
  { word: 'story', ipa: '/ˈstɔːri/', correct: ['tale', 'narrative', 'account'], incorrectPool: ['song', 'poem', 'movie', 'game', 'sport'] },
  
  // IELTS Set 1: Academic Life
  { word: 'lecture', ipa: '/ˈlektʃər/', correct: ['presentation', 'talk', 'speech'], incorrectPool: ['conversation', 'chat', 'discussion', 'debate', 'argument'] },
  { word: 'assignment', ipa: '/əˈsaɪnmənt/', correct: ['task', 'project', 'homework'], incorrectPool: ['lecture', 'exam', 'grade', 'test', 'class'] },
  { word: 'research', ipa: '/rɪˈsɜːrtʃ/', correct: ['investigation', 'study', 'analysis'], incorrectPool: ['guess', 'opinion', 'belief', 'assumption', 'theory'] },
  { word: 'semester', ipa: '/sɪˈmestər/', correct: ['term', 'period', 'session'], incorrectPool: ['year', 'decade', 'century', 'month', 'week'] },
  { word: 'deadline', ipa: '/ˈdedlaɪn/', correct: ['due date', 'time limit', 'cutoff'], incorrectPool: ['start date', 'beginning', 'opening', 'launch', 'initiation'] },
  
  // IELTS Set 2: Environment & Climate
  { word: 'pollution', ipa: '/pəˈluːʃən/', correct: ['contamination', 'toxicity', 'poisoning'], incorrectPool: ['purification', 'cleanliness', 'freshness', 'purity', 'sanitation'] },
  { word: 'sustainable', ipa: '/səˈsteɪnəbəl/', correct: ['eco-friendly', 'green', 'renewable'], incorrectPool: ['wasteful', 'harmful', 'destructive', 'polluting', 'damaging'] },
  { word: 'ecosystem', ipa: '/ˈiːkoʊsɪstəm/', correct: ['habitat', 'environment', 'biome'], incorrectPool: ['building', 'factory', 'city', 'town', 'infrastructure'] },
  { word: 'emissions', ipa: '/ɪˈmɪʃənz/', correct: ['discharge', 'release', 'output'], incorrectPool: ['absorption', 'intake', 'collection', 'gathering', 'storage'] },
  { word: 'renewable', ipa: '/rɪˈnjuːəbəl/', correct: ['sustainable', 'recyclable', 'inexhaustible'], incorrectPool: ['finite', 'limited', 'depleting', 'exhaustible', 'scarce'] },
  
  // IELTS Set 3: Technology & Innovation
  { word: 'artificial', ipa: '/ˌɑːrtɪˈfɪʃəl/', correct: ['synthetic', 'man-made', 'manufactured'], incorrectPool: ['natural', 'organic', 'real', 'genuine', 'authentic'] },
  { word: 'digital', ipa: '/ˈdɪdʒɪtəl/', correct: ['electronic', 'computerized', 'virtual'], incorrectPool: ['analog', 'physical', 'mechanical', 'manual', 'traditional'] },
  { word: 'algorithm', ipa: '/ˈælɡərɪðəm/', correct: ['formula', 'procedure', 'method'], incorrectPool: ['random', 'chaos', 'disorder', 'confusion', 'chance'] },
  { word: 'automation', ipa: '/ˌɔːtəˈmeɪʃən/', correct: ['mechanization', 'robotization', 'computerization'], incorrectPool: ['manual work', 'human labor', 'handcraft', 'artisan', 'traditional'] },
  { word: 'breakthrough', ipa: '/ˈbreɪkθruː/', correct: ['advance', 'discovery', 'innovation'], incorrectPool: ['setback', 'failure', 'decline', 'regression', 'stagnation'] },
  
  // IELTS Set 4: Health & Medicine
  { word: 'diagnosis', ipa: '/ˌdaɪəɡˈnoʊsɪs/', correct: ['identification', 'detection', 'assessment'], incorrectPool: ['treatment', 'cure', 'therapy', 'remedy', 'healing'] },
  { word: 'symptom', ipa: '/ˈsɪmptəm/', correct: ['indication', 'sign', 'manifestation'], incorrectPool: ['cure', 'treatment', 'remedy', 'medicine', 'therapy'] },
  { word: 'treatment', ipa: '/ˈtriːtmənt/', correct: ['therapy', 'remedy', 'care'], incorrectPool: ['disease', 'illness', 'sickness', 'infection', 'ailment'] },
  { word: 'prevention', ipa: '/prɪˈvenʃən/', correct: ['precaution', 'protection', 'deterrence'], incorrectPool: ['causation', 'promotion', 'encouragement', 'facilitation', 'enablement'] },
  { word: 'immunity', ipa: '/ɪˈmjuːnəti/', correct: ['resistance', 'protection', 'defense'], incorrectPool: ['vulnerability', 'susceptibility', 'weakness', 'exposure', 'sensitivity'] },
  
  // IELTS Set 5: Business & Economics
  { word: 'profit', ipa: '/ˈprɑːfɪt/', correct: ['earnings', 'revenue', 'income'], incorrectPool: ['loss', 'debt', 'deficit', 'expense', 'cost'] },
  { word: 'investment', ipa: '/ɪnˈvestmənt/', correct: ['funding', 'capital', 'financing'], incorrectPool: ['withdrawal', 'divestment', 'spending', 'expense', 'consumption'] },
  { word: 'inflation', ipa: '/ɪnˈfleɪʃən/', correct: ['price rise', 'cost increase', 'escalation'], incorrectPool: ['deflation', 'reduction', 'decrease', 'decline', 'fall'] },
  { word: 'entrepreneur', ipa: '/ˌɑːntrəprəˈnɜːr/', correct: ['business owner', 'innovator', 'founder'], incorrectPool: ['employee', 'worker', 'staff', 'subordinate', 'follower'] },
  { word: 'consumer', ipa: '/kənˈsuːmər/', correct: ['buyer', 'customer', 'purchaser'], incorrectPool: ['seller', 'vendor', 'supplier', 'merchant', 'retailer'] },
  
  // IELTS Set 6: Government & Politics
  { word: 'legislation', ipa: '/ˌledʒɪˈsleɪʃən/', correct: ['laws', 'regulations', 'statutes'], incorrectPool: ['lawlessness', 'anarchy', 'chaos', 'disorder', 'violation'] },
  { word: 'democracy', ipa: '/dɪˈmɑːkrəsi/', correct: ['self-government', 'republic', 'freedom'], incorrectPool: ['dictatorship', 'tyranny', 'autocracy', 'totalitarianism', 'oppression'] },
  { word: 'policy', ipa: '/ˈpɑːləsi/', correct: ['strategy', 'plan', 'approach'], incorrectPool: ['chaos', 'disorder', 'randomness', 'improvisation', 'spontaneity'] },
  { word: 'parliament', ipa: '/ˈpɑːrləmənt/', correct: ['legislature', 'congress', 'assembly'], incorrectPool: ['monarchy', 'dictatorship', 'individual', 'autocracy', 'tyranny'] },
  { word: 'campaign', ipa: '/kæmˈpeɪn/', correct: ['drive', 'movement', 'initiative'], incorrectPool: ['inaction', 'passivity', 'stillness', 'rest', 'dormancy'] },
  
  // IELTS Set 7: Media & Communication
  { word: 'broadcast', ipa: '/ˈbrɔːdkæst/', correct: ['transmit', 'air', 'televise'], incorrectPool: ['receive', 'listen', 'watch', 'consume', 'absorb'] },
  { word: 'journalism', ipa: '/ˈdʒɜːrnəlɪzəm/', correct: ['reporting', 'news media', 'press'], incorrectPool: ['fiction', 'entertainment', 'drama', 'comedy', 'fantasy'] },
  { word: 'censorship', ipa: '/ˈsensərʃɪp/', correct: ['suppression', 'restriction', 'control'], incorrectPool: ['freedom', 'liberty', 'openness', 'transparency', 'expression'] },
  { word: 'propaganda', ipa: '/ˌprɑːpəˈɡændə/', correct: ['promotion', 'publicity', 'advertising'], incorrectPool: ['truth', 'fact', 'reality', 'objectivity', 'neutrality'] },
  { word: 'editorial', ipa: '/ˌedɪˈtɔːriəl/', correct: ['opinion piece', 'commentary', 'column'], incorrectPool: ['news report', 'fact', 'data', 'statistic', 'objective'] },
  
  // IELTS Set 8: Social Issues
  { word: 'inequality', ipa: '/ˌɪnɪˈkwɑːləti/', correct: ['disparity', 'imbalance', 'injustice'], incorrectPool: ['equality', 'fairness', 'balance', 'justice', 'equity'] },
  { word: 'poverty', ipa: '/ˈpɑːvərti/', correct: ['destitution', 'hardship', 'deprivation'], incorrectPool: ['wealth', 'prosperity', 'affluence', 'riches', 'abundance'] },
  { word: 'discrimination', ipa: '/dɪˌskrɪmɪˈneɪʃən/', correct: ['prejudice', 'bias', 'intolerance'], incorrectPool: ['fairness', 'equality', 'justice', 'tolerance', 'acceptance'] },
  { word: 'welfare', ipa: '/ˈwelfer/', correct: ['social security', 'benefits', 'aid'], incorrectPool: ['neglect', 'abandonment', 'poverty', 'hardship', 'suffering'] },
  { word: 'diversity', ipa: '/daɪˈvɜːrsəti/', correct: ['variety', 'multiculturalism', 'inclusion'], incorrectPool: ['uniformity', 'sameness', 'homogeneity', 'similarity', 'conformity'] },
  
  // IELTS Set 9: Arts & Culture
  { word: 'aesthetic', ipa: '/esˈθetɪk/', correct: ['artistic', 'beautiful', 'pleasing'], incorrectPool: ['ugly', 'unpleasant', 'hideous', 'repulsive', 'unattractive'] },
  { word: 'exhibition', ipa: '/ˌeksɪˈbɪʃən/', correct: ['show', 'display', 'presentation'], incorrectPool: ['hiding', 'concealment', 'suppression', 'covering', 'obscuring'] },
  { word: 'contemporary', ipa: '/kənˈtempəreri/', correct: ['modern', 'current', 'present-day'], incorrectPool: ['ancient', 'old', 'historical', 'traditional', 'outdated'] },
  { word: 'heritage', ipa: '/ˈherɪtɪdʒ/', correct: ['legacy', 'tradition', 'inheritance'], incorrectPool: ['innovation', 'novelty', 'modernity', 'contemporary', 'new'] },
  { word: 'masterpiece', ipa: '/ˈmæstərpiːs/', correct: ['masterwork', 'classic', 'triumph'], incorrectPool: ['failure', 'disaster', 'flop', 'mess', 'botch'] },
  
  // IELTS Set 10: Science & Research
  { word: 'hypothesis', ipa: '/haɪˈpɑːθəsɪs/', correct: ['theory', 'assumption', 'proposition'], incorrectPool: ['fact', 'proof', 'evidence', 'certainty', 'truth'] },
  { word: 'experiment', ipa: '/ɪkˈsperɪmənt/', correct: ['test', 'trial', 'investigation'], incorrectPool: ['observation', 'watching', 'viewing', 'witnessing', 'seeing'] },
  { word: 'evidence', ipa: '/ˈevɪdəns/', correct: ['proof', 'data', 'confirmation'], incorrectPool: ['speculation', 'guess', 'assumption', 'theory', 'hypothesis'] },
  { word: 'analysis', ipa: '/əˈnæləsɪs/', correct: ['examination', 'evaluation', 'study'], incorrectPool: ['synthesis', 'combination', 'merger', 'union', 'integration'] },
  { word: 'methodology', ipa: '/ˌmeθəˈdɑːlədʒi/', correct: ['approach', 'procedure', 'technique'], incorrectPool: ['randomness', 'chaos', 'disorder', 'spontaneity', 'improvisation'] },
  
  // IELTS Set 11: Travel & Tourism
  { word: 'destination', ipa: '/ˌdestɪˈneɪʃən/', correct: ['location', 'place', 'spot'], incorrectPool: ['origin', 'start', 'beginning', 'source', 'departure'] },
  { word: 'itinerary', ipa: '/aɪˈtɪnəreri/', correct: ['schedule', 'plan', 'route'], incorrectPool: ['spontaneity', 'improvisation', 'randomness', 'chance', 'accident'] },
  { word: 'accommodation', ipa: '/əˌkɑːməˈdeɪʃən/', correct: ['lodging', 'housing', 'quarters'], incorrectPool: ['homelessness', 'outdoors', 'street', 'exposure', 'displacement'] },
  { word: 'hospitality', ipa: '/ˌhɑːspɪˈtæləti/', correct: ['welcome', 'friendliness', 'service'], incorrectPool: ['hostility', 'rudeness', 'coldness', 'unfriendliness', 'rejection'] },
  { word: 'attraction', ipa: '/əˈtrækʃən/', correct: ['site', 'landmark', 'feature'], incorrectPool: ['repulsion', 'deterrent', 'bore', 'eyesore', 'ugliness'] },
  
  // IELTS Set 12: Food & Agriculture
  { word: 'organic', ipa: '/ɔːrˈɡænɪk/', correct: ['natural', 'chemical-free', 'biological'], incorrectPool: ['synthetic', 'artificial', 'chemical', 'processed', 'manufactured'] },
  { word: 'nutrition', ipa: '/nuːˈtrɪʃən/', correct: ['nourishment', 'diet', 'sustenance'], incorrectPool: ['malnutrition', 'starvation', 'hunger', 'famine', 'deprivation'] },
  { word: 'cultivation', ipa: '/ˌkʌltɪˈveɪʃən/', correct: ['farming', 'agriculture', 'growing'], incorrectPool: ['destruction', 'abandonment', 'neglect', 'waste', 'ruin'] },
  { word: 'harvest', ipa: '/ˈhɑːrvɪst/', correct: ['crop', 'yield', 'gathering'], incorrectPool: ['planting', 'seeding', 'sowing', 'failure', 'loss'] },
  { word: 'livestock', ipa: '/ˈlaɪvstɑːk/', correct: ['cattle', 'animals', 'farm animals'], incorrectPool: ['crops', 'plants', 'vegetables', 'grains', 'produce'] },
  
  // IELTS Set 13: Urban Development
  { word: 'infrastructure', ipa: '/ˈɪnfrəstrʌktʃər/', correct: ['facilities', 'systems', 'services'], incorrectPool: ['wilderness', 'nature', 'countryside', 'rural', 'primitive'] },
  { word: 'residential', ipa: '/ˌrezɪˈdenʃəl/', correct: ['housing', 'domestic', 'suburban'], incorrectPool: ['commercial', 'industrial', 'business', 'office', 'retail'] },
  { word: 'metropolitan', ipa: '/ˌmetrəˈpɑːlɪtən/', correct: ['urban', 'city', 'municipal'], incorrectPool: ['rural', 'countryside', 'village', 'provincial', 'pastoral'] },
  { word: 'congestion', ipa: '/kənˈdʒestʃən/', correct: ['crowding', 'jam', 'bottleneck'], incorrectPool: ['flow', 'movement', 'clearness', 'space', 'emptiness'] },
  { word: 'zoning', ipa: '/ˈzoʊnɪŋ/', correct: ['planning', 'designation', 'allocation'], incorrectPool: ['chaos', 'disorder', 'randomness', 'confusion', 'mixture'] },
  
  // IELTS Set 14: Education System
  { word: 'curriculum', ipa: '/kəˈrɪkjələm/', correct: ['syllabus', 'program', 'course'], incorrectPool: ['recreation', 'entertainment', 'leisure', 'hobby', 'pastime'] },
  { word: 'pedagogy', ipa: '/ˈpedəɡɑːdʒi/', correct: ['teaching', 'instruction', 'education'], incorrectPool: ['learning', 'studying', 'ignorance', 'illiteracy', 'uneducated'] },
  { word: 'literacy', ipa: '/ˈlɪtərəsi/', correct: ['reading ability', 'education', 'learning'], incorrectPool: ['illiteracy', 'ignorance', 'uneducated', 'unlearned', 'untaught'] },
  { word: 'vocational', ipa: '/voʊˈkeɪʃənəl/', correct: ['professional', 'occupational', 'career'], incorrectPool: ['academic', 'theoretical', 'abstract', 'recreational', 'hobby'] },
  { word: 'assessment', ipa: '/əˈsesmənt/', correct: ['evaluation', 'testing', 'examination'], incorrectPool: ['ignorance', 'neglect', 'disregard', 'overlooking', 'ignoring'] },
  
  // IELTS Set 15: Crime & Law
  { word: 'defendant', ipa: '/dɪˈfendənt/', correct: ['accused', 'suspect', 'respondent'], incorrectPool: ['plaintiff', 'victim', 'prosecutor', 'judge', 'jury'] },
  { word: 'prosecution', ipa: '/ˌprɑːsɪˈkjuːʃən/', correct: ['legal action', 'charge', 'indictment'], incorrectPool: ['defense', 'protection', 'support', 'assistance', 'help'] },
  { word: 'verdict', ipa: '/ˈvɜːrdɪkt/', correct: ['decision', 'judgment', 'ruling'], incorrectPool: ['accusation', 'charge', 'allegation', 'claim', 'complaint'] },
  { word: 'justice', ipa: '/ˈdʒʌstɪs/', correct: ['fairness', 'equity', 'law'], incorrectPool: ['injustice', 'unfairness', 'bias', 'prejudice', 'discrimination'] },
  { word: 'rehabilitation', ipa: '/ˌriːəˌbɪlɪˈteɪʃən/', correct: ['reform', 'reintegration', 'restoration'], incorrectPool: ['punishment', 'penalty', 'retribution', 'vengeance', 'retaliation'] },
  
  // IELTS Set 16: Psychology & Behavior
  { word: 'cognitive', ipa: '/ˈkɑːɡnətɪv/', correct: ['mental', 'intellectual', 'cerebral'], incorrectPool: ['physical', 'bodily', 'corporeal', 'material', 'tangible'] },
  { word: 'motivation', ipa: '/ˌmoʊtɪˈveɪʃən/', correct: ['drive', 'incentive', 'encouragement'], incorrectPool: ['discouragement', 'demotivation', 'deterrent', 'disincentive', 'obstacle'] },
  { word: 'perception', ipa: '/pərˈsepʃən/', correct: ['understanding', 'interpretation', 'awareness'], incorrectPool: ['ignorance', 'unawareness', 'obliviousness', 'blindness', 'incomprehension'] },
  { word: 'anxiety', ipa: '/æŋˈzaɪəti/', correct: ['worry', 'stress', 'nervousness'], incorrectPool: ['calmness', 'peace', 'serenity', 'tranquility', 'relaxation'] },
  { word: 'resilience', ipa: '/rɪˈzɪliəns/', correct: ['strength', 'toughness', 'adaptability'], incorrectPool: ['weakness', 'fragility', 'vulnerability', 'brittleness', 'delicacy'] },
  
  // IELTS Set 17: Global Issues
  { word: 'humanitarian', ipa: '/hjuːˌmænɪˈteriən/', correct: ['charitable', 'compassionate', 'benevolent'], incorrectPool: ['selfish', 'cruel', 'heartless', 'merciless', 'callous'] },
  { word: 'refugee', ipa: '/ˌrefjuˈdʒiː/', correct: ['displaced person', 'asylum seeker', 'migrant'], incorrectPool: ['resident', 'citizen', 'native', 'local', 'inhabitant'] },
  { word: 'conflict', ipa: '/ˈkɑːnflɪkt/', correct: ['war', 'dispute', 'clash'], incorrectPool: ['peace', 'harmony', 'agreement', 'accord', 'cooperation'] },
  { word: 'famine', ipa: '/ˈfæmɪn/', correct: ['starvation', 'hunger', 'scarcity'], incorrectPool: ['abundance', 'plenty', 'surplus', 'feast', 'prosperity'] },
  { word: 'pandemic', ipa: '/pænˈdemɪk/', correct: ['epidemic', 'outbreak', 'plague'], incorrectPool: ['health', 'wellness', 'cure', 'remedy', 'recovery'] },
  
  // IELTS Set 18: Sports & Fitness
  { word: 'athletic', ipa: '/æθˈletɪk/', correct: ['fit', 'muscular', 'sporty'], incorrectPool: ['weak', 'unfit', 'frail', 'feeble', 'sedentary'] },
  { word: 'endurance', ipa: '/ɪnˈdʊrəns/', correct: ['stamina', 'persistence', 'resilience'], incorrectPool: ['exhaustion', 'fatigue', 'weakness', 'tiredness', 'weariness'] },
  { word: 'competition', ipa: '/ˌkɑːmpəˈtɪʃən/', correct: ['contest', 'tournament', 'championship'], incorrectPool: ['cooperation', 'collaboration', 'teamwork', 'partnership', 'alliance'] },
  { word: 'stamina', ipa: '/ˈstæmɪnə/', correct: ['endurance', 'energy', 'staying power'], incorrectPool: ['exhaustion', 'fatigue', 'weakness', 'tiredness', 'lethargy'] },
  { word: 'performance', ipa: '/pərˈfɔːrməns/', correct: ['achievement', 'execution', 'showing'], incorrectPool: ['failure', 'incompetence', 'inability', 'inadequacy', 'underperformance'] },
  
  // IELTS Set 19: Finance & Banking
  { word: 'mortgage', ipa: '/ˈmɔːrɡɪdʒ/', correct: ['loan', 'debt', 'financing'], incorrectPool: ['savings', 'assets', 'wealth', 'capital', 'investment'] },
  { word: 'credit', ipa: '/ˈkredɪt/', correct: ['trust', 'borrowing', 'lending'], incorrectPool: ['debt', 'owing', 'liability', 'obligation', 'deficit'] },
  { word: 'assets', ipa: '/ˈæsets/', correct: ['possessions', 'property', 'resources'], incorrectPool: ['liabilities', 'debts', 'obligations', 'losses', 'deficits'] },
  { word: 'budget', ipa: '/ˈbʌdʒɪt/', correct: ['financial plan', 'allocation', 'estimate'], incorrectPool: ['overspending', 'waste', 'extravagance', 'splurge', 'excess'] },
  { word: 'transaction', ipa: '/trænˈzækʃən/', correct: ['deal', 'exchange', 'transfer'], incorrectPool: ['holding', 'keeping', 'storing', 'saving', 'hoarding'] },
  
  // IELTS Set 20: Employment & Career
  { word: 'qualification', ipa: '/ˌkwɑːlɪfɪˈkeɪʃən/', correct: ['credential', 'certificate', 'competency'], incorrectPool: ['disqualification', 'incompetence', 'inability', 'inadequacy', 'deficiency'] },
  { word: 'promotion', ipa: '/prəˈmoʊʃən/', correct: ['advancement', 'upgrade', 'elevation'], incorrectPool: ['demotion', 'downgrade', 'reduction', 'degradation', 'relegation'] },
  { word: 'resignation', ipa: '/ˌrezɪɡˈneɪʃən/', correct: ['departure', 'quitting', 'withdrawal'], incorrectPool: ['hiring', 'appointment', 'recruitment', 'employment', 'engagement'] },
  { word: 'productivity', ipa: '/ˌproʊdʌkˈtɪvəti/', correct: ['efficiency', 'output', 'performance'], incorrectPool: ['inefficiency', 'laziness', 'idleness', 'inactivity', 'sluggishness'] },
  { word: 'colleague', ipa: '/ˈkɑːliːɡ/', correct: ['coworker', 'associate', 'teammate'], incorrectPool: ['rival', 'competitor', 'opponent', 'enemy', 'adversary'] },
];

// Exact synonym overrides per level/set/word
// Use to lock options to the content owner's choices
const SYN_OVERRIDES: Record<string, Record<string, Record<string, { correct: string[]; incorrect: string[]; ipa?: string }>>> = {
  // IELTS curated synonym options (exact 3+3) per set/word
  ielts: {
    '1': {
      fluctuate: { correct: ['vary', 'oscillate', 'shift'], incorrect: ['steady', 'drop', 'spike'] },
      stabilize: { correct: ['steady', 'level out', 'firm up'], incorrect: ['vary', 'spike', 'decline'] },
      decline: { correct: ['decrease', 'drop', 'diminish'], incorrect: ['spike', 'level out', 'steady'] },
      surge: { correct: ['spike', 'soar', 'jump'], incorrect: ['drop', 'vary', 'level out'] },
      plateau: { correct: ['level off', 'flatten', 'hold steady'], incorrect: ['spike', 'drop', 'vary'] },
    },
    '2': {
      investigate: { correct: ['examine', 'probe', 'look into'], incorrect: ['evaluate', 'defend', 'execute'] },
      assess: { correct: ['evaluate', 'appraise', 'gauge'], incorrect: ['probe', 'execute', 'defend'] },
      justify: { correct: ['defend', 'substantiate', 'warrant'], incorrect: ['evaluate', 'execute', 'amend'] },
      implement: { correct: ['execute', 'carry out', 'apply'], incorrect: ['defend', 'gauge', 'amend'] },
      revise: { correct: ['amend', 'edit', 'update'], incorrect: ['execute', 'evaluate', 'defend'] },
    },
  },
  intermediate: {
    '1': {
      agenda: {
        correct: ['schedule', 'program', 'docket'],
        incorrect: ['minutes', 'memo', 'deadline'],
      },
      deadline: {
        correct: ['due date', 'cutoff', 'time limit'],
        incorrect: ['milestone', 'schedule', 'estimate'],
      },
      escalate: {
        correct: ['elevate', 'raise', 'refer'],
        incorrect: ['schedule', 'approve', 'finalize'],
      },
      consensus: {
        correct: ['agreement', 'accord', 'unanimity'],
        incorrect: ['approval', 'contract', 'quorum'],
      },
      clarify: {
        correct: ['explain', 'simplify', 'elucidate'],
        incorrect: ['confirm', 'approve', 'escalate'],
      },
    },
    '11': {
      warn: { correct: ['caution', 'alert', 'notify'], incorrect: ['allow', 'ban', 'suggest'] },
      permit: { correct: ['allow', 'authorize', 'let'], incorrect: ['ban', 'suggest', 'ask'] },
      forbid: { correct: ['ban', 'prohibit', 'bar'], incorrect: ['allow', 'suggest', 'notify'] },
      advise: { correct: ['recommend', 'counsel', 'suggest'], incorrect: ['ban', 'notify', 'allow'] },
      request: { correct: ['ask', 'seek', 'solicit'], incorrect: ['allow', 'ban', 'counsel'] },
    },
    '12': {
      charge: { correct: ['bill', 'invoice', 'levy'], incorrect: ['repay', 'send', 'follow'] },
      refund: { correct: ['repay', 'reimburse', 'return'], incorrect: ['bill', 'replace', 'dispatch'] },
      replace: { correct: ['substitute', 'swap', 'change'], incorrect: ['track', 'refund', 'mail'] },
      ship: { correct: ['send', 'dispatch', 'mail'], incorrect: ['bill', 'follow', 'reimburse'] },
      track: { correct: ['follow', 'monitor', 'trace'], incorrect: ['mail', 'substitute', 'invoice'] },
    },
    '13': {
      persuade: { correct: ['convince', 'sway', 'win over'], incorrect: ['dispute', 'respond', 'cut in'] },
      argue: { correct: ['dispute', 'contend', 'disagree'], incorrect: ['convince', 'reply', 'apologize'] },
      reply: { correct: ['answer', 'respond', 'write back'], incorrect: ['dispute', 'say sorry', 'cut in'] },
      interrupt: { correct: ['cut in', 'interject', 'break in'], incorrect: ['apologize', 'respond', 'convince'] },
      apologize: { correct: ['say sorry', 'make amends', 'atone'], incorrect: ['respond', 'cut in', 'convince'] },
    },
    '14': {
      reserve: { correct: ['book', 'secure', 'hold'], incorrect: ['prolong', 'upgrade', 'cancel'] },
      extend: { correct: ['lengthen', 'prolong', 'stretch'], incorrect: ['upgrade', 'cancel', 'hold'] },
      upgrade: { correct: ['improve', 'update', 'advance'], incorrect: ['cancel', 'lengthen', 'hold'] },
      cancel: { correct: ['call off', 'scrap', 'abort'], incorrect: ['upgrade', 'hold', 'prolong'] },
      reschedule: { correct: ['rearrange', 'postpone', 'move'], incorrect: ['cancel', 'lengthen', 'advance'] },
    },
    '15': {
      assemble: { correct: ['build', 'put together', 'construct'], incorrect: ['modify', 'link', 'fasten'] },
      adjust: { correct: ['modify', 'alter', 'tweak'], incorrect: ['build', 'fasten', 'link'] },
      connect: { correct: ['link', 'join', 'attach'], incorrect: ['build', 'fasten', 'tweak'] },
      secure: { correct: ['fasten', 'fix', 'tie'], incorrect: ['link', 'build', 'alter'] },
      polish: { correct: ['shine', 'buff', 'rub'], incorrect: ['link', 'tie', 'construct'] },
    },
    '16': {
      order: { correct: ['request', 'purchase', 'place order'], incorrect: ['give', 'slice', 'mix'] },
      serve: { correct: ['give', 'hand out', 'present'], incorrect: ['request', 'dice', 'whisk'] },
      taste: { correct: ['sample', 'try', 'savor'], incorrect: ['mix', 'cut', 'present'] },
      chop: { correct: ['cut', 'dice', 'slice'], incorrect: ['sample', 'blend', 'present'] },
      stir: { correct: ['mix', 'blend', 'whisk'], incorrect: ['slice', 'request', 'present'] },
    },
    '17': {
      worry: { correct: ['fret', 'be anxious', 'stress'], incorrect: ['applaud', 'pardon', 'uplift'] },
      cheer: { correct: ['encourage', 'hearten', 'brighten'], incorrect: ['fret', 'pardon', 'commend'] },
      forgive: { correct: ['pardon', 'excuse', 'let go'], incorrect: ['applaud', 'brighten', 'fret'] },
      praise: { correct: ['compliment', 'applaud', 'commend'], incorrect: ['encourage', 'let go', 'lament'] },
      regret: { correct: ['be sorry', 'lament', 'rue'], incorrect: ['applaud', 'excuse', 'brighten'] },
    },
    '18': {
      heat: { correct: ['warm', 'heat up', 'warm up'], incorrect: ['chill', 'press', 'bend'] },
      cool: { correct: ['chill', 'cool down', 'lower'], incorrect: ['warm', 'press', 'bend'] },
      dry: { correct: ['dry out', 'air dry', 'dehydrate'], incorrect: ['warm', 'fold', 'press'] },
      fold: { correct: ['bend', 'crease', 'double'], incorrect: ['warm', 'dehydrate', 'chill'] },
      iron: { correct: ['press', 'smooth', 'flatten'], incorrect: ['warm', 'chill', 'double'] },
    },
    '19': {
      paint: { correct: ['color', 'decorate', 'coat'], incorrect: ['sketch', 'trek', 'paddle'] },
      draw: { correct: ['sketch', 'outline', 'illustrate'], incorrect: ['color', 'trek', 'pitch tents'] },
      camp: { correct: ['pitch tents', 'sleep outdoors', 'stay in tents'], incorrect: ['sketch', 'paddle', 'trek'] },
      hike: { correct: ['trek', 'ramble', 'walk far'], incorrect: ['color', 'pitch tents', 'paddle'] },
      swim: { correct: ['paddle', 'do laps', 'bathe'], incorrect: ['sketch', 'trek', 'pitch tents'] },
    },
    '20': {
      'fill in': { correct: ['complete', 'write in', 'enter details'], incorrect: ['turn in', 'produce', 'archive'] },
      submit: { correct: ['send in', 'hand in', 'turn in'], incorrect: ['complete', 'produce', 'archive'] },
      print: { correct: ['produce', 'make copy', 'output'], incorrect: ['hand in', 'archive', 'enter details'] },
      sign: { correct: ['write name', 'autograph', 'sign off'], incorrect: ['output', 'archive', 'turn in'] },
      file: { correct: ['archive', 'store', 'put away'], incorrect: ['turn in', 'write name', 'make copy'] },
    },
  },
  'upper-intermediate': {
    '1': {
      fragile: {
        correct: ['delicate', 'breakable', 'brittle'],
        incorrect: ['charitable', 'loath', 'archaic'],
      },
      generous: {
        correct: ['charitable', 'big-hearted', 'giving'],
        incorrect: ['brittle', 'damp', 'ancient'],
      },
      reluctant: {
        correct: ['hesitant', 'unwilling', 'averse'],
        incorrect: ['generous', 'damp', 'ancient'],
      },
      damp: {
        correct: ['moist', 'clammy', 'dank'],
        incorrect: ['fragile', 'liberal', 'averse'],
      },
      ancient: {
        correct: ['archaic', 'age-old', 'old'],
        incorrect: ['generous', 'damp', 'delicate'],
      },
    },
    '2': {
      predict: {
        correct: ['anticipate', 'foresee', 'expect'],
        incorrect: ['avoid', 'improve', 'complain'],
      },
      avoid: {
        correct: ['evade', 'dodge', 'shun'],
        incorrect: ['predict', 'improve', 'encourage'],
      },
      improve: {
        correct: ['enhance', 'better', 'upgrade'],
        incorrect: ['avoid', 'complain', 'encourage'],
      },
      encourage: {
        correct: ['motivate', 'inspire', 'spur'],
        incorrect: ['avoid', 'improve', 'complain'],
      },
      complain: {
        correct: ['grumble', 'protest', 'object'],
        incorrect: ['encourage', 'avoid', 'predict'],
      },
    },
    '4': {
      borrow: { correct: ['take on loan', 'use temporarily', 'get on loan'], incorrect: ['arrange', 'explain', 'compare'] },
      lend: { correct: ['loan', 'give temporarily', 'advance'], incorrect: ['compare', 'arrange', 'explain'] },
      compare: { correct: ['contrast', 'match up', 'evaluate differences'], incorrect: ['lend', 'explain', 'arrange'] },
      explain: { correct: ['clarify', 'describe', 'make clear'], incorrect: ['borrow', 'arrange', 'compare'] },
      arrange: { correct: ['organize', 'schedule', 'plan'], incorrect: ['lend', 'explain', 'compare'] },
    },
    '5': {
      mitigate: { correct: ['lessen', 'alleviate', 'reduce'], incorrect: ['allocate', 'implement', 'justify'] },
      allocate: { correct: ['assign', 'apportion', 'distribute'], incorrect: ['mitigate', 'justify', 'implement'] },
      justify: { correct: ['defend', 'warrant', 'substantiate'], incorrect: ['allocate', 'mitigate', 'implement'] },
      compromise: { correct: ['negotiate', 'settle', 'conciliate'], incorrect: ['allocate', 'justify', 'implement'] },
      implement: { correct: ['execute', 'carry out', 'apply'], incorrect: ['mitigate', 'allocate', 'justify'] },
    },
    '6': {
      assess: { correct: ['evaluate', 'appraise', 'gauge'], incorrect: ['interpret', 'articulate', 'reconcile'] },
      interpret: { correct: ['explain', 'construe', 'decipher'], incorrect: ['assess', 'infer', 'articulate'] },
      infer: { correct: ['deduce', 'conclude', 'derive'], incorrect: ['assess', 'interpret', 'reconcile'] },
      articulate: { correct: ['express', 'voice', 'put into words'], incorrect: ['assess', 'interpret', 'reconcile'] },
      reconcile: { correct: ['resolve', 'harmonize', 'settle'], incorrect: ['assess', 'infer', 'articulate'] },
    },
    '7': {
      scrutinize: { correct: ['inspect', 'examine', 'analyze'], incorrect: ['advocate', 'synthesize', 'undermine'] },
      advocate: { correct: ['support', 'champion', 'endorse'], incorrect: ['scrutinize', 'synthesize', 'adhere'] },
      synthesize: { correct: ['combine', 'integrate', 'fuse'], incorrect: ['advocate', 'undermine', 'adhere'] },
      undermine: { correct: ['weaken', 'erode', 'undercut'], incorrect: ['advocate', 'adhere', 'synthesize'] },
      adhere: { correct: ['stick', 'comply', 'follow'], incorrect: ['advocate', 'scrutinize', 'synthesize'] },
    },
    '8': {
      assert: { correct: ['maintain', 'claim', 'affirm'], incorrect: ['summarize', 'analyze', 'describe'] },
      concede: { correct: ['admit', 'acknowledge', 'grant'], incorrect: ['defend', 'insist', 'summarize'] },
      imply: { correct: ['suggest', 'hint', 'indicate'], incorrect: ['declare', 'summarize', 'calculate'] },
      refute: { correct: ['disprove', 'rebut', 'invalidate'], incorrect: ['support', 'summarize', 'outline'] },
      outline: { correct: ['summarize', 'sketch', 'delineate'], incorrect: ['argue', 'assert', 'predict'] },
    },
    '9': {
      contrast: { correct: ['differ', 'distinguish', 'juxtapose'], incorrect: ['hypothesize', 'constrain', 'corroborate'] },
      corroborate: { correct: ['confirm', 'substantiate', 'validate'], incorrect: ['contrast', 'hypothesize', 'deviate'] },
      hypothesize: { correct: ['suppose', 'posit', 'theorize'], incorrect: ['corroborate', 'constrain', 'contrast'] },
      constrain: { correct: ['restrict', 'limit', 'curb'], incorrect: ['corroborate', 'hypothesize', 'deviate'] },
      deviate: { correct: ['stray', 'diverge', 'depart'], incorrect: ['corroborate', 'constrain', 'contrast'] },
    },
    '10': {
      correlate: { correct: ['connect', 'relate', 'link'], incorrect: ['estimate', 'calculate', 'record'] },
      validate: { correct: ['confirm', 'verify', 'authenticate'], incorrect: ['estimate', 'analyze', 'compile'] },
      compile: { correct: ['collect', 'gather', 'assemble'], incorrect: ['estimate', 'categorize', 'review'] },
      elucidate: { correct: ['clarify', 'explain', 'illuminate'], incorrect: ['compare', 'categorize', 'calculate'] },
      benchmark: { correct: ['evaluate', 'compare', 'measure'], incorrect: ['estimate', 'analyze', 'record'] },
    },
    '14': {
      contemplate: {
        correct: ['consider', 'ponder', 'deliberate'],
        incorrect: ['strengthen', 'minimize', 'oppose'],
      },
      bolster: {
        correct: ['strengthen', 'support', 'reinforce'],
        incorrect: ['consider', 'understate', 'refute'],
      },
      downplay: {
        correct: ['minimize', 'understate', 'play down'],
        incorrect: ['reinforce', 'ponder', 'refute'],
      },
      counter: {
        correct: ['oppose', 'rebut', 'refute'],
        incorrect: ['support', 'consider', 'minimize'],
      },
      elicit: {
        correct: ['evoke', 'draw out', 'prompt'],
        incorrect: ['reinforce', 'understate', 'ponder'],
      },
    },
    '15': {
      fluctuate: {
        correct: ['vary', 'oscillate', 'swing'],
        incorrect: ['stabilize', 'accelerate', 'plateau'],
      },
      stabilize: {
        correct: ['steady', 'normalize', 'balance'],
        incorrect: ['fluctuate', 'accelerate', 'deteriorate'],
      },
      accelerate: {
        correct: ['speed up', 'quicken', 'hasten'],
        incorrect: ['stabilize', 'plateau', 'fluctuate'],
      },
      deteriorate: {
        correct: ['worsen', 'decline', 'degrade'],
        incorrect: ['stabilize', 'plateau', 'accelerate'],
      },
      plateau: {
        correct: ['level off', 'flatten', 'stabilize'],
        incorrect: ['accelerate', 'fluctuate', 'deteriorate'],
      },
    },
    '16': {
      verify: {
        correct: ['confirm', 'validate', 'authenticate'],
        incorrect: ['question', 'ignore', 'estimate'],
      },
      refine: {
        correct: ['improve', 'polish', 'hone'],
        incorrect: ['delay', 'complicate', 'replace'],
      },
      formulate: {
        correct: ['devise', 'frame', 'articulate'],
        incorrect: ['copy', 'delay', 'simplify'],
      },
      illustrate: {
        correct: ['explain', 'demonstrate', 'exemplify'],
        incorrect: ['obscure', 'confuse', 'generalize'],
      },
      navigate: {
        correct: ['find way', 'steer', 'maneuver'],
        incorrect: ['hesitate', 'drift', 'postpone'],
      },
    },
    '17': {
      alleviate: { correct: ['lessen', 'ease', 'mitigate'], incorrect: ['worsen', 'outline', 'arbitrate'] },
      exacerbate: { correct: ['worsen', 'aggravate', 'intensify'], incorrect: ['lessen', 'outline', 'reconcile'] },
      ascertain: { correct: ['determine', 'find out', 'establish'], incorrect: ['describe', 'worsen', 'arbitrate'] },
      delineate: { correct: ['outline', 'describe', 'define'], incorrect: ['verify', 'worsen', 'arbitrate'] },
      mediate: { correct: ['arbitrate', 'negotiate', 'reconcile'], incorrect: ['outline', 'worsen', 'determine'] },
    },
    '18': {
      emphasize: {
        correct: ['stress', 'highlight', 'underscore'],
        incorrect: ['summarize', 'mention', 'record'],
      },
      acknowledge: {
        correct: ['admit', 'accept', 'recognize'],
        incorrect: ['announce', 'describe', 'draft'],
      },
      adapt: {
        correct: ['adjust', 'modify', 'tailor'],
        incorrect: ['copy', 'translate', 'store'],
      },
      compensate: {
        correct: ['offset', 'make up for', 'recompense'],
        incorrect: ['compare', 'budget', 'collect'],
      },
      question: {
        correct: ['doubt', 'challenge', 'query'],
        incorrect: ['explain', 'confirm', 'summarize'],
      },
    },
    '19': {
      expedite: {
        correct: ['accelerate', 'hasten', 'fast-track'],
        incorrect: ['hamper', 'uphold', 'contend'],
      },
      hamper: {
        correct: ['hinder', 'impede', 'obstruct'],
        incorrect: ['expedite', 'uphold', 'dispel'],
      },
      contend: {
        correct: ['argue', 'claim', 'maintain'],
        incorrect: ['expedite', 'dispel', 'hamper'],
      },
      dispel: {
        correct: ['dissipate', 'banish', 'drive away'],
        incorrect: ['uphold', 'contend', 'expedite'],
      },
      uphold: {
        correct: ['maintain', 'support', 'sustain'],
        incorrect: ['contend', 'dispel', 'hamper'],
      },
    },
    '20': {
      evaluate: {
        correct: ['assess', 'appraise', 'judge'],
        incorrect: ['depict', 'endorse', 'omit'],
      },
      depict: {
        correct: ['portray', 'represent', 'illustrate'],
        incorrect: ['evaluate', 'omit', 'endorse'],
      },
      omit: {
        correct: ['leave out', 'exclude', 'drop'],
        incorrect: ['endorse', 'depict', 'oppose'],
      },
      oppose: {
        correct: ['resist', 'contest', 'object to'],
        incorrect: ['endorse', 'depict', 'evaluate'],
      },
      endorse: {
        correct: ['approve', 'back', 'support'],
        incorrect: ['oppose', 'omit', 'evaluate'],
      },
    },
    '21': {
      allege: {
        correct: ['claim', 'assert', 'contend'],
        incorrect: ['cite', 'deter', 'diversify'],
      },
      cite: {
        correct: ['quote', 'mention', 'refer to'],
        incorrect: ['allege', 'foster', 'deter'],
      },
      foster: {
        correct: ['encourage', 'promote', 'nurture'],
        incorrect: ['deter', 'allege', 'cite'],
      },
      deter: {
        correct: ['discourage', 'dissuade', 'prevent'],
        incorrect: ['foster', 'diversify', 'cite'],
      },
      diversify: {
        correct: ['vary', 'broaden', 'expand'],
        incorrect: ['deter', 'allege', 'foster'],
      },
    },
    '22': {
      investigate: { correct: ['examine', 'look into', 'explore'], incorrect: ['infer', 'theorize', 'canvass'] },
      deduce: { correct: ['infer', 'conclude', 'derive'], incorrect: ['examine', 'theorize', 'canvass'] },
      speculate: { correct: ['theorize', 'suppose', 'hypothesize'], incorrect: ['infer', 'canvass', 'explore'] },
      probe: { correct: ['delve', 'examine', 'explore'], incorrect: ['infer', 'theorize', 'canvass'] },
      survey: { correct: ['poll', 'canvass', 'sample'], incorrect: ['explore', 'infer', 'examine'] },
    },
    '23': {
      streamline: { correct: ['simplify', 'rationalize', 'optimize'], incorrect: ['mechanize', 'merge', 'normalize'] },
      automate: { correct: ['mechanize', 'computerize', 'systematize'], incorrect: ['merge', 'normalize', 'refine'] },
      consolidate: { correct: ['merge', 'unify', 'integrate'], incorrect: ['simplify', 'normalize', 'computerize'] },
      standardize: { correct: ['normalize', 'regularize', 'codify'], incorrect: ['merge', 'mechanize', 'refine'] },
      iterate: { correct: ['repeat', 'refine', 'cycle'], incorrect: ['merge', 'normalize', 'mechanize'] },
    },
    '24': {
      paraphrase: { correct: ['reword', 'restate', 'rephrase'], incorrect: ['outline', 'expand', 'hint'] },
      summarize: { correct: ['outline', 'recap', 'condense'], incorrect: ['rephrase', 'repeat', 'hint'] },
      elaborate: { correct: ['expand', 'develop', 'detail'], incorrect: ['rephrase', 'outline', 'repeat'] },
      allude: { correct: ['hint', 'imply', 'suggest'], incorrect: ['rephrase', 'recap', 'repeat'] },
      reiterate: { correct: ['repeat', 'restate', 'say again'], incorrect: ['hint', 'outline', 'rephrase'] },
    },
    '25': {
      authorize: { correct: ['permit', 'approve', 'sanction'], incorrect: ['forbid', 'require', 'forgo'] },
      prohibit: { correct: ['forbid', 'ban', 'bar'], incorrect: ['permit', 'require', 'forgo'] },
      mandate: { correct: ['require', 'order', 'decree'], incorrect: ['permit', 'ban', 'forgo'] },
      exempt: { correct: ['excuse', 'free', 'absolve'], incorrect: ['permit', 'require', 'ban'] },
      waive: { correct: ['forgo', 'relinquish', 'set aside'], incorrect: ['permit', 'require', 'ban'] },
    },
    '26': {
      invest: { correct: ['fund', 'finance', 'stake'], incorrect: ['sell off', 'obtain', 'repay'] },
      divest: { correct: ['sell off', 'dispose of', 'shed'], incorrect: ['finance', 'offset risk', 'acquire'] },
      procure: { correct: ['obtain', 'acquire', 'secure'], incorrect: ['repay', 'sell off', 'offset risk'] },
      reimburse: { correct: ['repay', 'refund', 'compensate'], incorrect: ['obtain', 'finance', 'offset risk'] },
      hedge: { correct: ['offset risk', 'protect', 'insure'], incorrect: ['fund', 'sell off', 'obtain'] },
    },
    '27': {
      deploy: { correct: ['launch', 'roll out', 'implement'], incorrect: ['configure', 'troubleshoot', 'restore'] },
      configure: { correct: ['set up', 'arrange', 'tune'], incorrect: ['deploy', 'restore', 'synchronize'] },
      troubleshoot: { correct: ['debug', 'diagnose', 'resolve'], incorrect: ['deploy', 'configure', 'restore'] },
      restore: { correct: ['recover', 'reinstate', 'revert'], incorrect: ['configure', 'deploy', 'troubleshoot'] },
      synchronize: { correct: ['sync', 'align', 'coordinate'], incorrect: ['deploy', 'configure', 'troubleshoot'] },
    },
    '28': {
      conserve: { correct: ['save', 'preserve', 'protect'], incorrect: ['regulate', 'restrict', 'subsidize'] },
      regulate: { correct: ['control', 'govern', 'oversee'], incorrect: ['conserve', 'restrict', 'subsidize'] },
      subsidize: { correct: ['fund', 'finance', 'underwrite'], incorrect: ['regulate', 'incentivize', 'restrict'] },
      incentivize: { correct: ['motivate', 'encourage', 'spur'], incorrect: ['restrict', 'subsidize', 'conserve'] },
      restrict: { correct: ['limit', 'curb', 'constrain'], incorrect: ['conserve', 'subsidize', 'incentivize'] },
    },
    '29': {
      reassure: { correct: ['comfort', 'soothe', 'calm'], incorrect: ['confront', 'empathize', 'discourage'] },
      empathize: { correct: ['understand', 'relate', 'sympathize'], incorrect: ['confront', 'discourage', 'reassure'] },
      discourage: { correct: ['deter', 'dishearten', 'put off'], incorrect: ['reassure', 'empathize', 'admire'] },
      confront: { correct: ['face', 'tackle', 'challenge'], incorrect: ['reassure', 'empathize', 'admire'] },
      admire: { correct: ['respect', 'esteem', 'appreciate'], incorrect: ['discourage', 'confront', 'empathize'] },
    },
    '30': {
      curate: { correct: ['select', 'organize', 'assemble'], incorrect: ['moderate', 'annotate', 'broadcast'] },
      moderate: { correct: ['chair', 'manage', 'facilitate'], incorrect: ['curate', 'broadcast', 'caption'] },
      annotate: { correct: ['note', 'comment', 'gloss'], incorrect: ['moderate', 'curate', 'broadcast'] },
      broadcast: { correct: ['air', 'transmit', 'beam'], incorrect: ['curate', 'annotate', 'caption'] },
      caption: { correct: ['label', 'title', 'tag'], incorrect: ['curate', 'broadcast', 'moderate'] },
    },
    '11': {
      prioritize: { correct: ['rank', 'order', 'sequence'], incorrect: ['negotiate', 'revise', 'forecast'] },
      negotiate: { correct: ['bargain', 'discuss terms', 'broker'], incorrect: ['prioritize', 'forecast', 'coordinate'] },
      revise: { correct: ['edit', 'update', 'amend'], incorrect: ['negotiate', 'coordinate', 'forecast'] },
      forecast: { correct: ['predict', 'project', 'estimate'], incorrect: ['revise', 'negotiate', 'coordinate'] },
      coordinate: { correct: ['organize', 'align', 'orchestrate'], incorrect: ['prioritize', 'estimate', 'amend'] },
    },
    '12': {
      enforce: { correct: ['impose', 'apply', 'implement'], incorrect: ['comply', 'amend', 'disclose'] },
      comply: { correct: ['obey', 'conform', 'adhere'], incorrect: ['enforce', 'amend', 'disclose'] },
      violate: { correct: ['breach', 'infringe', 'contravene'], incorrect: ['comply', 'disclose', 'amend'] },
      amend: { correct: ['revise', 'modify', 'alter'], incorrect: ['disclose', 'enforce', 'comply'] },
      disclose: { correct: ['reveal', 'expose', 'divulge'], incorrect: ['comply', 'amend', 'enforce'] },
    },
    '13': {
      curtail: { correct: ['reduce', 'limit', 'restrict'], incorrect: ['amplify', 'commence', 'conclude'] },
      amplify: { correct: ['increase', 'boost', 'intensify'], incorrect: ['curtail', 'conclude', 'rectify'] },
      rectify: { correct: ['correct', 'fix', 'amend'], incorrect: ['commence', 'conclude', 'amplify'] },
      commence: { correct: ['begin', 'start', 'initiate'], incorrect: ['conclude', 'curtail', 'rectify'] },
      conclude: { correct: ['finish', 'end', 'decide'], incorrect: ['commence', 'amplify', 'rectify'] },
    },
  },
};

// Teal for correct, pink for incorrect
const CORRECT_COLOR = '#4ED9CB';
const INCORRECT_COLOR = '#F25E86';
// Light-theme variants
const CORRECT_COLOR_LIGHT = '#4ED9CB';
const INCORRECT_COLOR_LIGHT = '#F25E86';
const ACCENT_COLOR = '#F25E86';

export default function SynonymComponent({ setId, levelId, onPhaseComplete, hearts, onHeartLost, wordRange, wordsOverride, showUfoAnimation }: SynonymProps) {
  const themeName = useAppStore(s => s.theme);
  const recordResult = useAppStore(s => s.recordExerciseResult);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  // Get words from levels data
  const wordsData = useMemo(() => {
    const levelKey = String(levelId || '').toLowerCase();
    const level = levels.find(l => (l.id || '').toLowerCase() === levelKey) || levels.find(l => (l.name || '').toLowerCase() === levelKey);
    const cefrUpper = String(level?.cefr || '').toUpperCase();
    const isAdvancedByParam = /advanced/i.test(String(levelId || ''));
    const isAdvancedByLevel =
      /advanced/i.test(String(level?.name || '')) ||
      cefrUpper.includes('B2-C1') ||
      cefrUpper.includes('C1+') ||
      cefrUpper.includes('C2') ||
      /proficient/i.test(String(level?.name || '')) ||
      String(level?.id || '').toLowerCase() === 'proficient';
    const isAdvancedB2C1 = isAdvancedByParam || isAdvancedByLevel;
    const isBeginnerA1A2 = /(^|\b)beginner(\b|$)/i.test(String(levelId || '')) || /(^|\b)beginner(\b|$)/i.test(String(level?.name || '')) || cefrUpper.includes('A1-A2') || cefrUpper.includes('A1') || cefrUpper.includes('A2');
    const isIntermediateB1 = (String(levelId || '').toLowerCase() === 'intermediate') || (String(level?.id || '').toLowerCase() === 'intermediate') || (String(level?.name || '').toLowerCase() === 'intermediate') || (cefrUpper === 'B1');
    try { console.log('SynonymComponent - params:', { setId, levelId, detectedLevel: level?.name, cefr: level?.cefr, isAdvancedB2C1, isBeginnerA1A2, isIntermediateB1 }); } catch {}

    // Use override when provided (dynamic quiz)
    if (wordsOverride && wordsOverride.length) {
      let words = wordsOverride;
      if (wordRange) words = words.slice(wordRange.start, wordRange.end);

      // Advanced/Beginner/Intermediate enforcement also applies when using overrides
      if (isAdvancedB2C1 || isBeginnerA1A2 || isIntermediateB1) {
        const mode = isAdvancedB2C1 ? 'Advanced' : isBeginnerA1A2 ? 'Beginner' : 'Intermediate';
        try { console.log(`SynonymComponent - Using ${mode} peer-synonym mode (override path)`); } catch {}
        return words.map(w => {
          const override = SYN_OVERRIDES[levelId || '']?.[String(setId)]?.[w.word.toLowerCase()];
          const correct = (override?.correct && override.correct.length)
            ? override.correct
            : (w.synonyms || []).slice(0, 3);
          const correctSet = new Set(correct.map(s => (s || '').toLowerCase().trim()));
          const poolRaw = (words as any[])
            .filter(x => x.word !== w.word)
            .flatMap(x => (x.synonyms || []));
          const seen = new Set<string>();
          let incorrectPool = poolRaw
            .map(s => String(s || '').trim())
            .filter(s => s.length > 0)
            .filter(s => !correctSet.has(s.toLowerCase()))
            .filter(s => s.toLowerCase() !== (w.word || '').toLowerCase())
            .filter(s => {
              const key = s.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          // Ensure at least 3
          if (incorrectPool.length < 3) {
            const more = (words as any[])
              .flatMap(x => (x.synonyms || []))
              .map(s => String(s || '').trim())
              .filter(s => s.length > 0)
              .filter(s => !correctSet.has(s.toLowerCase()))
              .filter(s => s.toLowerCase() !== (w.word || '').toLowerCase());
            for (const m of more) {
              const key = m.toLowerCase();
              if (seen.has(key)) continue;
              incorrectPool.push(m);
              seen.add(key);
              if (incorrectPool.length >= 3) break;
            }
          }
          const result: WordEntry = {
            word: w.word,
            ipa: w.phonetic,
            correct,
            incorrectPool: incorrectPool.length ? incorrectPool : ['other', 'different', 'alternative'],
          };
          try { console.log('Synonym PEER (override) for', w.word, 'correct:', result.correct, 'incorrectPool:', result.incorrectPool.slice(0, 6)); } catch {}
          return result;
        });
      }

      // Non-advanced override path (keep overrides when present; otherwise fallback generic)
      return words.map(w => {
        const override = SYN_OVERRIDES[levelId || '']?.[String(setId)]?.[w.word.toLowerCase()];
        return {
          word: w.word,
          ipa: w.phonetic,
          correct: override?.correct || (w.synonyms || []).slice(0, 3),
          incorrectPool: override?.incorrect || ['other', 'different', 'alternative'],
        } as WordEntry;
      });
    }

    if (!level) return [];
    const set = level.sets.find(s => s.id.toString() === setId);
    if (!set || !set.words) return [];
    
    let words = set.words;
    if (wordRange) {
      words = words.slice(wordRange.start, wordRange.end);
    }

    // Convert to WordEntry format
    return words.map(w => {
      const override = SYN_OVERRIDES[levelId || '']?.[String(set.id)]?.[w.word.toLowerCase()];
      if (override) {
        return {
          word: w.word,
          ipa: w.phonetic,
          correct: override.correct,
          incorrectPool: override.incorrect,
        } as WordEntry;
      }

      // Advanced/Beginner/Intermediate rule: incorrect options should be real synonyms
      // from other words in the same set (no invented distractors).
      if (isAdvancedB2C1 || isBeginnerA1A2 || isIntermediateB1) {
        const mode = isAdvancedB2C1 ? 'Advanced' : isBeginnerA1A2 ? 'Beginner' : 'Intermediate';
        try { console.log(`SynonymComponent - Using ${mode} peer-synonym mode (set path)`); } catch {}
        const correct = (w.synonyms || []).slice(0, 3);
        const correctSet = new Set(correct.map(s => (s || '').toLowerCase().trim()));
        // Aggregate synonyms from peer words in this set/range
        const poolRaw = (words as any[])
          .filter(x => x.word !== w.word)
          .flatMap(x => (x.synonyms || []));
        const seen = new Set<string>();
        let incorrectPool = poolRaw
          .map(s => String(s || '').trim())
          .filter(s => s.length > 0)
          .filter(s => !correctSet.has(s.toLowerCase()))
          .filter(s => s.toLowerCase() !== (w.word || '').toLowerCase())
          .filter(s => {
            const key = s.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        // Ensure we have at least 3 incorrect options from peers when possible
        if (incorrectPool.length < 3) {
          const more = (words as any[])
            .flatMap(x => (x.synonyms || []))
            .map(s => String(s || '').trim())
            .filter(s => s.length > 0)
            .filter(s => !correctSet.has(s.toLowerCase()))
            .filter(s => s.toLowerCase() !== (w.word || '').toLowerCase());
          for (const m of more) {
            const key = m.toLowerCase();
            if (seen.has(key)) continue;
            incorrectPool.push(m);
            seen.add(key);
            if (incorrectPool.length >= 3) break;
          }
        }

        const result: WordEntry = {
          word: w.word,
          ipa: w.phonetic,
          correct,
          incorrectPool: incorrectPool.length ? incorrectPool : ['other', 'different', 'alternative'],
        };
        // Debug visibility in Xcode logs
        try { console.log('Synonym PEER for', w.word, 'correct:', result.correct, 'incorrectPool:', result.incorrectPool.slice(0, 6)); } catch {}
        return result;
      }

      return {
        word: w.word,
        ipa: w.phonetic,
        correct: (w.synonyms || []).slice(0, 3),
        incorrectPool: WORDS.find(entry => entry.word === w.word)?.incorrectPool || ['other', 'different', 'alternative'],
      } as WordEntry;
    });
  }, [setId, levelId, wordRange]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [phaseCorrect, setPhaseCorrect] = useState(0);
  const heartLostAnim = useRef(new Animated.Value(1)).current;
  const itemStartRef = useRef<number>(Date.now());
  const optionAnims = useRef<Animated.Value[]>([]);
  const mountFadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(mountFadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const currentWord = useMemo(() => wordsData[currentIndex], [wordsData, currentIndex]);
  const requiredCount = 3; // Always require 3 correct synonyms

  const options = useMemo(() => {
    const opts = wordsData.map(entry => {
      // If this entry has an exact override, use it as-is
      const exactThree = entry.correct.length === 3 && entry.incorrectPool.length === 3;
      const correctOptions = exactThree ? entry.correct : entry.correct.slice(0, 3);
      const incorrectOptions = exactThree
        ? entry.incorrectPool
        : [...entry.incorrectPool]
            .map(option => ({ option, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .slice(0, 3)
            .map(({ option }) => option);

      const combined = [...correctOptions, ...incorrectOptions];
      return combined
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ option }) => option);
    });
    try { console.log('SynonymComponent - options recomputed for', opts.length, 'items'); } catch {}
    return opts;
  }, [wordsData]);

  useEffect(() => {
    setSelected([]);
    setRevealed(false);
    itemStartRef.current = Date.now();
    // Bubble-in animation for options on each new item
    const opts = options[currentIndex] || [];
    optionAnims.current = opts.map(() => new Animated.Value(0));
    const anims = optionAnims.current.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 360,
        delay: i * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    if (anims.length) Animated.stagger(40, anims).start();
  }, [currentIndex]);

  const triggerHeartLostAnimation = () => {
    heartLostAnim.setValue(1.3);
    Animated.spring(heartLostAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const toggleSelection = (choice: string) => {
    if (revealed) return;
    if (selected.includes(choice)) {
      setSelected(prev => prev.filter(item => item !== choice));
      return;
    }

    if (selected.length === requiredCount) {
      return;
    }

    const newSelected = [...selected, choice];
    setSelected(newSelected);
    
    // Auto-check when 3 synonyms are selected
    if (newSelected.length === requiredCount) {
      setTimeout(() => {
        handleSubmit();
      }, 300);
    }
  };

  const pluralised = requiredCount === 1 ? 'synonym' : 'synonyms';
  const nextDisabled = selected.length !== requiredCount;

  const handleSubmit = async () => {
    if (nextDisabled || revealed) return;

    const incorrectSelections = selected.filter(choice => !currentWord.correct.includes(choice)).length;
    const selectedCorrect = incorrectSelections === 0;

    if (selectedCorrect) {
      setPhaseCorrect(prev => prev + 1);
    } else {
      // Lose a heart on wrong answer
      onHeartLost();
      triggerHeartLostAnimation();
    }
    setRevealed(true);

    AccessibilityInfo.announceForAccessibility(
      selectedCorrect ? 'Correct' : 'Review the correct synonyms'
    );

    // Track analytics for this item
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - itemStartRef.current) / 1000));
      recordResult({
        wordId: currentWord.word,
        exerciseType: 'synonym',
        correct: selectedCorrect,
        timeSpent,
        timestamp: new Date(),
        score: selectedCorrect ? 1 : 0,
      });
    } catch {}
  };

  const handleNext = () => {
    if (!revealed) return;

    if (currentIndex === wordsData.length - 1) {
      onPhaseComplete(phaseCorrect, wordsData.length);
    } else {
      setCurrentIndex(prev => prev + 1);
      itemStartRef.current = Date.now();
    }
  };

  const progress = currentIndex / wordsData.length;

  const isLastWord = currentIndex === wordsData.length - 1;
  const handlePrimary = () => {
    if (!revealed) {
      if (nextDisabled) return;
      handleSubmit();
    } else {
      handleNext();
    }
  };
  const primaryDisabled = !revealed && nextDisabled;
  const primaryLabel = revealed ? (isLastWord ? 'Finish' : 'Next') : 'Next';

  return (
    <Animated.View style={[styles.container, isLight && { backgroundColor: colors.background }, { opacity: mountFadeAnim }]}>
      <View style={styles.topHeaderRow}>
        <View style={[styles.progressBarPill, isLight && { backgroundColor: '#E5E7EB' }]}>
          <Animated.View style={[styles.progressFillPill, { width: `${progress * 100}%` }]} />
        </View>
        <Animated.View style={[styles.heartsContainerSmall, { transform: [{ scale: heartLostAnim }] }]}>
          <View style={{ position: 'relative' }}>
            <LottieView
              source={require('../../../assets/lottie/learn/heart_away.lottie')}
              autoPlay={showUfoAnimation}
              loop={false}
              speed={1}
              style={{ width: 96, height: 96 }}
              key={showUfoAnimation ? 'playing' : 'idle'}
            />
            {showUfoAnimation && (
              <LottieView
                source={require('../../../assets/lottie/learn/Ufo_animation.lottie')}
                autoPlay
                loop={false}
                speed={2}
                style={{
                  width: 100,
                  height: 100,
                  position: 'absolute',
                  top: -30,
                  left: -2,
                }}
              />
            )}
          </View>
          <Text style={[styles.heartCount, { marginLeft: -30 }, isLight && { color: '#EF4444' }]}>{hearts}</Text>
        </Animated.View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.body}>

          <TouchableOpacity
            style={[styles.speakButtonCorner, isLight && styles.speakButtonCornerLight]}
            onPress={() => speak(currentWord.word)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Volume2 size={20} color={isLight ? '#0D3B4A' : '#B6E0E2'} />
          </TouchableOpacity>

          <View style={styles.wordHeader}>
            <Text style={[styles.wordHighlight, isLight && { color: '#111827' }]}>{currentWord.word}</Text>
            <Text style={[styles.promptText, isLight && { color: '#4B5563' }]}>
              Select {requiredCount} {pluralised}
            </Text>
            <Text style={[styles.ipaText, isLight && { color: '#6B7280' }]}>{currentWord.ipa}</Text>
          </View>

          <View style={styles.grid}>
            {options[currentIndex].map((choice, idx) => {
              const isSelected = selected.includes(choice);
              const isCorrect = currentWord.correct.includes(choice);
              const buttonStyles: Array<ViewStyle> = [styles.optionButton];
              // Keep light card color regardless of reveal state
              if (isLight) buttonStyles.push(styles.optionLight);

              if (revealed) {
                if (isSelected && isCorrect) {
                  buttonStyles.push(isLight ? styles.optionCorrectLight : styles.optionCorrect);
                } else if (isSelected && !isCorrect) {
                  buttonStyles.push(isLight ? styles.optionIncorrectLight : styles.optionIncorrect);
                } else if (!isSelected && isCorrect) {
                  buttonStyles.push(isLight ? styles.optionCorrectOutlineLight : styles.optionCorrectOutline);
                }
              } else if (isSelected) {
                buttonStyles.push(styles.optionSelected);
              }

              return (
                <Animated.View
                  key={choice}
                  style={{
                    width: '47%',
                    marginBottom: 12,
                    transform: [
                      { translateY: (optionAnims.current[idx] || new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                      { scale: (optionAnims.current[idx] || new Animated.Value(1)).interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.86, 1.06, 1] }) },
                    ],
                    opacity: (optionAnims.current[idx] || new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                  }}
                >
                  <TouchableWithoutFeedback onPress={() => toggleSelection(choice)}>
                    <View style={buttonStyles}>
                      <Text style={[styles.optionText, isLight && { color: '#111827' }]}>{choice}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerButtons}>
        <AnimatedNextButton
          onPress={handlePrimary}
          disabled={primaryDisabled}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  body: {
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -4,
    marginBottom: 12,
    gap: 12,
    paddingLeft: 56,
    paddingRight: 24,
    height: 24,
  },
  progressBarPill: {
    flex: 1,
    height: 12,
    backgroundColor: '#3A3A3A',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFillPill: {
    height: '100%',
    backgroundColor: '#7AC231',
    borderRadius: 7,
  },
  heartsContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartEmoji: {
    fontSize: 18,
  },
  heartCount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'Feather-Bold',
  },
  topRow: {
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    fontFamily: 'Feather-Bold',
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  heartsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  heartIcon: {
    fontSize: 18,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
    fontFamily: 'Feather-Bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT_COLOR,
  },
  scoreText: {
    color: ACCENT_COLOR,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Feather-Bold',
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  speakButtonCorner: {
    position: 'absolute',
    top: 56,
    right: 12,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(182, 224, 226, 0.15)',
    zIndex: 10,
  },
  speakButtonCornerLight: {
    backgroundColor: 'rgba(13, 59, 74, 0.1)',
  },
  promptText: {
    color: 'rgba(207, 212, 216, 0.7)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Feather-Bold',
  },
  wordHighlight: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
    marginBottom: 12,
    fontFamily: 'Feather-Bold',
  },
  wordTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  ipaText: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontFamily: 'Feather-Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexGrow: 1,
  },
  optionButton: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 10,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    minHeight: 88,
  },
  optionLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  optionSelected: {
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.08)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#F25E86',
    borderRightColor: '#F25E86',
  },
  optionCorrect: {
    backgroundColor: 'rgba(78,217,203,0.04)',
    borderColor: '#4ED9CB',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#4ED9CB',
    borderRightColor: '#4ED9CB',
  },
  optionIncorrect: {
    backgroundColor: 'rgba(242,94,134,0.04)',
    borderColor: '#F25E86',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#F25E86',
    borderRightColor: '#F25E86',
  },
  optionCorrectLight: {
    backgroundColor: 'rgba(78,217,203,0.03)',
    borderColor: '#4ED9CB',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#4ED9CB',
    borderRightColor: '#4ED9CB',
  },
  optionIncorrectLight: {
    backgroundColor: 'rgba(242,94,134,0.03)',
    borderColor: '#F25E86',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#F25E86',
    borderRightColor: '#F25E86',
  },
  optionCorrectOutline: {
    borderColor: '#4ED9CB',
    backgroundColor: 'rgba(78,217,203,0.03)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#4ED9CB',
    borderRightColor: '#4ED9CB',
  },
  optionCorrectOutlineLight: {
    borderColor: '#4ED9CB',
    backgroundColor: 'rgba(78,217,203,0.03)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#4ED9CB',
    borderRightColor: '#4ED9CB',
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  footerButtons: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 70,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    minWidth: 140,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Feather-Bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
