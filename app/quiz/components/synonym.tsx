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
} from 'react-native';
import { Vibration } from 'react-native';
import { analyticsService } from '../../../services/AnalyticsService';
import { levels } from '../data/levels';

interface SynonymProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (newScore: number) => void;
  wordRange?: { start: number; end: number };
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

const CORRECT_COLOR = '#437F76';
const INCORRECT_COLOR = '#924646';
const ACCENT_COLOR = '#F2935C';

export default function SynonymComponent({ setId, levelId, onPhaseComplete, sharedScore, onScoreShare, wordRange }: SynonymProps) {
  // Get words from levels data
  const wordsData = useMemo(() => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return [];
    const set = level.sets.find(s => s.id.toString() === setId);
    if (!set || !set.words) return [];
    
    let words = set.words;
    if (wordRange) {
      words = words.slice(wordRange.start, wordRange.end);
    }
    
    // Convert to WordEntry format
    return words.map(w => ({
      word: w.word,
      ipa: w.phonetic,
      correct: w.synonyms || [],
      incorrectPool: WORDS.find(entry => entry.word === w.word)?.incorrectPool || ['other', 'different', 'alternative']
    }));
  }, [setId, levelId, wordRange]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const [phaseCorrect, setPhaseCorrect] = useState(0);
  const pendingScoreRef = useRef<number | null>(null);
  const deductionAnim = useRef(new Animated.Value(0)).current;
  const itemStartRef = useRef<number>(Date.now());
  const optionAnims = useRef<Animated.Value[]>([]);

  const currentWord = useMemo(() => wordsData[currentIndex], [wordsData, currentIndex]);
  const requiredCount = 3; // Always require 3 correct synonyms

  const [options] = useState(() =>
    wordsData.map(entry => {
      // Always use 3 correct and 3 incorrect options
      const correctOptions = entry.correct.slice(0, 3);
      const shuffledIncorrect = [...entry.incorrectPool]
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .slice(0, 3)
        .map(({ option }) => option);

      const combined = [...correctOptions, ...shuffledIncorrect];

      return combined
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ option }) => option);
    })
  );

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

  useEffect(() => {
    setDisplayScore(sharedScore);
  }, [sharedScore]);

  useEffect(() => {
    if (pendingScoreRef.current !== null && pendingScoreRef.current !== sharedScore) {
      const next = pendingScoreRef.current;
      pendingScoreRef.current = null;
      onScoreShare(next);
    }
  }, [displayScore, onScoreShare, sharedScore]);

  const toggleSelection = (choice: string) => {
    if (revealed) return;
    if (selected.includes(choice)) {
      setSelected(prev => prev.filter(item => item !== choice));
      return;
    }

    if (selected.length === requiredCount) {
      return;
    }

    setSelected(prev => [...prev, choice]);
  };

  const pluralised = requiredCount === 1 ? 'synonym' : 'synonyms';
  const nextDisabled = selected.length !== requiredCount;

  const handleSubmit = async () => {
    if (nextDisabled || revealed) return;

    Vibration.vibrate(10);

    const incorrectSelections = selected.filter(choice => !currentWord.correct.includes(choice)).length;
    const selectedCorrect = incorrectSelections === 0;

    if (selectedCorrect) {
      setPhaseCorrect(prev => prev + 1);
    } else {
      setDisplayScore(prev => {
        const next = Math.max(0, prev - 5);
        pendingScoreRef.current = next;
        return next;
      });
      triggerDeductionAnimation();
    }
    setRevealed(true);

    AccessibilityInfo.announceForAccessibility(
      selectedCorrect ? 'Correct' : 'Review the correct synonyms'
    );

    // Track analytics for this item
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - itemStartRef.current) / 1000));
      analyticsService.recordResult({
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

  const triggerDeductionAnimation = () => {
    deductionAnim.stopAnimation();
    deductionAnim.setValue(0);
    Animated.timing(deductionAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const progress = currentIndex / wordsData.length;
  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

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
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.topRow}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Word {currentIndex + 1} of {wordsData.length}
          </Text>
          <View style={styles.scoreWrapper}>
            <Animated.Text
              style={[
                styles.deductionText,
                {
                  opacity: deductionOpacity,
                  transform: [{ translateY: deductionTranslateY }],
                },
              ]}
            >
              -5
            </Animated.Text>
            <Text style={styles.scoreText}>{displayScore}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

        <View style={styles.wordHeader}>
          <Text style={styles.wordHighlight}>{currentWord.word}</Text>
          <Text style={styles.promptText}>
            Select {requiredCount} {pluralised}
          </Text>
          <Text style={styles.ipaText}>{currentWord.ipa}</Text>
        </View>

        <View style={styles.grid}>
          {options[currentIndex].map((choice, idx) => {
            const isSelected = selected.includes(choice);
            const isCorrect = currentWord.correct.includes(choice);
            const buttonStyles: Array<ViewStyle> = [styles.optionButton];

            if (revealed) {
              if (isSelected && isCorrect) {
                buttonStyles.push(styles.optionCorrect);
              } else if (isSelected && !isCorrect) {
                buttonStyles.push(styles.optionIncorrect);
              } else if (!isSelected && isCorrect) {
                buttonStyles.push(styles.optionCorrectOutline);
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
                    <Text style={styles.optionText}>{choice}</Text>
                  </View>
                </TouchableWithoutFeedback>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.footerButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, primaryDisabled && styles.buttonDisabled]}
          disabled={primaryDisabled}
          onPress={handlePrimary}
        >
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  body: {
    flex: 1,
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
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
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
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  promptText: {
    color: 'rgba(207, 212, 216, 0.7)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  wordHighlight: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
    marginBottom: 12,
  },
  wordTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  ipaText: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
    backgroundColor: '#3A3A3A',
    borderRadius: 10,
    paddingVertical: 24,
    paddingHorizontal: 10,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 88,
  },
  optionSelected: {
    borderColor: ACCENT_COLOR,
  },
  optionCorrect: {
    backgroundColor: CORRECT_COLOR,
    borderColor: 'transparent',
  },
  optionIncorrect: {
    backgroundColor: INCORRECT_COLOR,
    borderColor: 'transparent',
  },
  optionCorrectOutline: {
    borderColor: CORRECT_COLOR,
    backgroundColor: 'rgba(67, 127, 118, 0.1)',
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  footerButtons: {
    alignItems: 'center',
    paddingTop: 12,
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
