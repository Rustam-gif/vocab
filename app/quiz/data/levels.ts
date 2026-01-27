// Import new sets organized by category
import {
  beginnerGeneralSets,
  beginnerTravelSets,
  beginnerBusinessSets,
  beginnerIeltsSets,
} from './new-sets-beginner';
import {
  intermediateGeneralSets,
  intermediateTravelSets,
  intermediateBusinessSets,
  intermediateIeltsSets,
} from './new-sets-intermediate';
import {
  upperIntermediateGeneralSets,
  upperIntermediateTravelSets,
  upperIntermediateBusinessSets,
  upperIntermediateIeltsSets,
} from './new-sets-upper-intermediate';
import {
  advancedGeneralSets,
  advancedTravelSets,
  advancedBusinessSets,
  advancedIeltsSets,
} from './new-sets-advanced';

export interface Word {
  word: string;
  definition: string;
  example: string;
  phonetic: string;
  synonyms: string[];
}

export interface Set {
  id: number | string;
  title: string;
  words?: Word[];
  type?: 'quiz';
  description?: string;
  completed: boolean;
  inProgress?: boolean;
  score?: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  cefr: string;
  icon: string;
  sets: Set[];
}

// Category type for filtering sets based on user preference
export type SetCategory = 'general' | 'travel' | 'business' | 'exams';

// Helper function to map imported sets with sequential numeric IDs and category
const mapSetsWithCategory = (sets: any[], category: SetCategory): any[] => {
  return sets.map((set) => ({
    ...set,
    category,
    completed: false,
  }));
};

// Sets organized by category for each level (before ID assignment)
const beginnerSetsByCategory = {
  general: mapSetsWithCategory(beginnerGeneralSets, 'general'),
  travel: mapSetsWithCategory(beginnerTravelSets, 'travel'),
  business: mapSetsWithCategory(beginnerBusinessSets, 'business'),
  exams: mapSetsWithCategory(beginnerIeltsSets, 'exams'),
};

const intermediateSetsByCategory = {
  general: mapSetsWithCategory(intermediateGeneralSets, 'general'),
  travel: mapSetsWithCategory(intermediateTravelSets, 'travel'),
  business: mapSetsWithCategory(intermediateBusinessSets, 'business'),
  exams: mapSetsWithCategory(intermediateIeltsSets, 'exams'),
};

const upperIntermediateSetsByCategory = {
  general: mapSetsWithCategory(upperIntermediateGeneralSets, 'general'),
  travel: mapSetsWithCategory(upperIntermediateTravelSets, 'travel'),
  business: mapSetsWithCategory(upperIntermediateBusinessSets, 'business'),
  exams: mapSetsWithCategory(upperIntermediateIeltsSets, 'exams'),
};

const advancedSetsByCategory = {
  general: mapSetsWithCategory(advancedGeneralSets, 'general'),
  travel: mapSetsWithCategory(advancedTravelSets, 'travel'),
  business: mapSetsWithCategory(advancedBusinessSets, 'business'),
  exams: mapSetsWithCategory(advancedIeltsSets, 'exams'),
};

// Map of level ID to sets by category
export const levelSetsByCategory: Record<string, Record<SetCategory, any[]>> = {
  'beginner': beginnerSetsByCategory,
  'intermediate': intermediateSetsByCategory,
  'upper-intermediate': upperIntermediateSetsByCategory,
  'advanced': advancedSetsByCategory,
};

// Function to get ordered sets based on user's focus preference
// Priority order: user's focus first, then others
export const getOrderedSetsForLevel = (levelId: string, userFocus: SetCategory | null): Set[] => {
  const setsByCategory = levelSetsByCategory[levelId];
  if (!setsByCategory) return [];

  // Default category order
  const categoryOrder: SetCategory[] = ['general', 'travel', 'business', 'exams'];

  // Reorder to put user's focus first
  if (userFocus && categoryOrder.includes(userFocus)) {
    const reordered = [userFocus, ...categoryOrder.filter(c => c !== userFocus)];
    const orderedSets = reordered.flatMap(cat => setsByCategory[cat] || []);
    // Keep original unique IDs (e.g., 'bg1', 'bt1', 'bb1', 'bi1')
    return orderedSets;
  }

  // Default order if no preference
  const orderedSets = categoryOrder.flatMap(cat => setsByCategory[cat] || []);
  // Keep original unique IDs (e.g., 'bg1', 'bt1', 'bb1', 'bi1')
  return orderedSets;
};

// Default sets (general first) for backwards compatibility
const beginnerSets = getOrderedSetsForLevel('beginner', null);
const intermediateSets = getOrderedSetsForLevel('intermediate', null);
const upperIntermediateSets = getOrderedSetsForLevel('upper-intermediate', null);
const advancedSetsNew = getOrderedSetsForLevel('advanced', null);

export const levels: Level[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: '40 Sets, 200 words at CEFR A1-A2 Level',
    cefr: 'A1-A2',
    icon: '🌱',
    sets: beginnerSets,
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: '40 Sets, 200 words at CEFR B1-B2 Level',
    cefr: 'B1-B2',
    icon: '🌿',
    sets: intermediateSets,
  },
  {
    id: 'upper-intermediate',
    name: 'Upper-Intermediate',
    description: '40 Sets, 200 words at CEFR B2-C1 Level',
    cefr: 'B2-C1',
    icon: '🌳',
    sets: upperIntermediateSets,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: '40 Sets, 200 words at CEFR C1-C2 Level',
    cefr: 'C1-C2',
    icon: '🏔️',
    sets: advancedSetsNew,
  },
  // TEMPORARILY HIDDEN: Advanced Plus - needs more content (only 1 set defined)
  // {
  //   id: 'advanced-plus',
  //   name: 'Advanced Plus',
  //   description: '150 Sets, 750 words at CEFR C1+ Level',
  //   cefr: 'C1+',
  //   icon: '⛰️',
  //   sets: [
  //     {
  //       id: 1,
  //       title: 'Academic Adjectives',
  //       words: [
  //         { word: 'paradigm', definition: 'A typical example or pattern', example: 'This represents a new paradigm', phonetic: '/ˈpærədaɪm/', synonyms: ['model', 'framework'] },
  //         { word: 'ephemeral', definition: 'Lasting for a very short time', example: 'Beauty is often ephemeral', phonetic: '/ɪˈfemərəl/', synonyms: ['temporary', 'transient'] },
  //         { word: 'ubiquitous', definition: 'Present everywhere', example: 'Technology is ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', synonyms: ['omnipresent', 'universal'] },
  //         { word: 'meticulous', definition: 'Very careful and precise', example: 'She is meticulous in her work', phonetic: '/məˈtɪkjələs/', synonyms: ['thorough', 'precise'] },
  //         { word: 'resilient', definition: 'Able to recover quickly', example: 'The economy is resilient', phonetic: '/rɪˈzɪliənt/', synonyms: ['tough', 'flexible'] }
  //       ],
  //       completed: false
  //     }
  //   ]
  // },
  {
    id: 'proficient',
    name: 'Proficient',
    description: '200 Sets, 1000 words at CEFR C2 Level',
    cefr: 'C2',
    icon: '🏔️',
    sets: [
      {
        id: 1,
        title: 'Elite Adjectives',
        words: [
          { word: 'serendipitous', definition: 'Occurring by happy chance', example: 'It was a serendipitous meeting', phonetic: '/ˌserənˈdɪpɪtəs/', synonyms: ['fortuitous', 'lucky'] },
          { word: 'perspicacious', definition: 'Having keen insight', example: 'He is a perspicacious observer', phonetic: '/ˌpɜːrspɪˈkeɪʃəs/', synonyms: ['perceptive', 'astute'] },
          { word: 'magnanimous', definition: 'Very generous and forgiving', example: 'She was magnanimous in victory', phonetic: '/mæɡˈnænɪməs/', synonyms: ['generous', 'noble'] },
          { word: 'ubiquitous', definition: 'Present everywhere', example: 'The concept is ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', synonyms: ['omnipresent', 'universal'] },
          { word: 'ephemeral', definition: 'Lasting for a very short time', example: 'Fame can be ephemeral', phonetic: '/ɪˈfemərəl/', synonyms: ['temporary', 'transient'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Proficient — Precision Verbs I',
        words: [
          { word: 'elucidate', phonetic: '/ɪˈluːsɪdeɪt/', definition: 'To make something clear by thorough explanation', example: 'The expert elucidated the mechanism with elegant diagrams and analogies.', synonyms: ['clarify', 'explain', 'illuminate'] },
          { word: 'delineate', phonetic: '/dɪˈlɪnieɪt/', definition: 'To describe something precisely and in detail', example: 'The protocol delineates roles, timelines, and escalation thresholds clearly.', synonyms: ['describe', 'outline', 'depict'] },
          { word: 'circumvent', phonetic: '/ˌsɜːkəmˈvɛnt/', definition: 'To find a way around a problem', example: 'They circumvented bottlenecks by decentralizing approvals temporarily.', synonyms: ['evade', 'bypass', 'sidestep'] },
          { word: 'extrapolate', phonetic: '/ɪkˈstræpəleɪt/', definition: 'To infer unknown values from known trends', example: 'Analysts extrapolated demand from three years of regional data.', synonyms: ['infer', 'project', 'extend'] },
          { word: 'substantiate', phonetic: '/səbˈstænʃieɪt/', definition: 'To provide evidence to support a claim', example: 'The team substantiated the hypothesis using blinded trials.', synonyms: ['verify', 'corroborate', 'validate'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Proficient — Precision Verbs II',
        words: [
          { word: 'exacerbate', phonetic: '/ɪɡˈzæsəbeɪt/', definition: 'To make a problem worse or more severe', example: 'Cutting support would exacerbate inequality in remote districts.', synonyms: ['worsen', 'aggravate', 'intensify'] },
          { word: 'ameliorate', phonetic: '/əˈmiːliəreɪt/', definition: 'To make something better or more tolerable', example: 'Targeted tutoring ameliorated achievement gaps noticeably.', synonyms: ['improve', 'mitigate', 'relieve'] },
          { word: 'obviate', phonetic: '/ˈɒbvɪeɪt/', definition: 'To remove a need by effective action', example: 'Automation obviated manual checks in routine cases.', synonyms: ['remove', 'forestall', 'eliminate'] },
          { word: 'preclude', phonetic: '/prɪˈkluːd/', definition: 'To prevent something from happening at all', example: 'Conflicts of interest preclude reviewers from participating.', synonyms: ['prevent', 'rule out', 'bar'] },
          { word: 'expedite', phonetic: '/ˈɛkspɪdaɪt/', definition: 'To speed up a process or action', example: 'Additional staff expedited the backlog before holidays.', synonyms: ['hasten', 'accelerate', 'quicken'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Proficient — Evaluative Adjectives',
        words: [
          { word: 'intractable', phonetic: '/ɪnˈtræktəbəl/', definition: 'Hard to control or solve effectively', example: 'The region faces intractable disputes over water rights.', synonyms: ['unmanageable', 'stubborn', 'unruly'] },
          { word: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', definition: 'Present everywhere, common in many places', example: 'Smartphones are ubiquitous even in rural districts now.', synonyms: ['omnipresent', 'pervasive', 'widespread'] },
          { word: 'tenuous', phonetic: '/ˈtɛnjʊəs/', definition: 'Very weak, slight, or lacking real substance', example: 'The link between metrics and outcomes was tenuous.', synonyms: ['fragile', 'flimsy', 'insubstantial'] },
          { word: 'superfluous', phonetic: '/suːˈpɜːfluəs/', definition: 'Unnecessary because more than what’s needed', example: 'Cut superfluous steps to streamline compliance checks.', synonyms: ['unnecessary', 'redundant', 'excessive'] },
          { word: 'seminal', phonetic: '/ˈsɛmɪnəl/', definition: 'Strongly influential and shaping later developments', example: 'Her seminal paper reframed the entire discipline.', synonyms: ['influential', 'foundational', 'groundbreaking'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Proficient — Abstract Nouns I',
        words: [
          { word: 'equivocation', phonetic: '/ɪˌkwɪvəˈkeɪʃən/', definition: 'Deliberate vagueness to avoid giving truth', example: 'The spokesperson’s equivocation eroded public confidence quickly.', synonyms: ['evasiveness', 'ambiguity', 'hedging'] },
          { word: 'prerogative', phonetic: '/prɪˈrɒɡətɪv/', definition: 'Exclusive right or privilege of a person', example: 'Staffing decisions are the director’s prerogative under bylaws.', synonyms: ['privilege', 'entitlement', 'right'] },
          { word: 'verisimilitude', phonetic: '/ˌvɛrɪsɪˈmɪlɪtjuːd/', definition: 'Appearance of being true or real', example: 'The novel’s detail gives scenes striking verisimilitude.', synonyms: ['realism', 'authenticity', 'plausibility'] },
          { word: 'alacrity', phonetic: '/əˈlækrɪti/', definition: 'Cheerful readiness and brisk prompt willingness', example: 'She accepted the invitation with unusual alacrity.', synonyms: ['eagerness', 'readiness', 'willingness'] },
          { word: 'recourse', phonetic: '/rɪˈkɔːs/', definition: 'Help or protection turned to in difficulty', example: 'When negotiations failed, courts were our recourse.', synonyms: ['resort', 'refuge', 'aid'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Proficient — Argumentation Verbs',
        words: [
          { word: 'refute', phonetic: '/rɪˈfjuːt/', definition: 'To prove a statement is completely wrong', example: 'The replication refuted claims of extraordinary accuracy.', synonyms: ['disprove', 'rebut', 'invalidate'] },
          { word: 'concede', phonetic: '/kənˈsiːd/', definition: 'To admit something is true after resistance', example: 'The minister conceded delays were partly avoidable.', synonyms: ['admit', 'yield', 'acknowledge'] },
          { word: 'corroborate', phonetic: '/kəˈrɒbəreɪt/', definition: 'To confirm with additional independent supporting evidence', example: 'Multiple labs corroborated the surprising findings independently.', synonyms: ['confirm', 'validate', 'substantiate'] },
          { word: 'contend', phonetic: '/kənˈtɛnd/', definition: 'To argue firmly that something is true', example: 'Scholars contend that context alters perceived fairness.', synonyms: ['argue', 'maintain', 'assert'] },
          { word: 'postulate', phonetic: '/ˈpɒstjʊleɪt/', definition: 'To suggest a theory as a basic premise', example: 'The authors postulate a hidden variable driving variance.', synonyms: ['propose', 'posit', 'hypothesize'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Proficient — Nuanced Adjectives II',
        words: [
          { word: 'fastidious', phonetic: '/fæˈstɪdiəs/', definition: 'Very attentive to detail and cleanliness', example: 'A fastidious editor catches tone shifts and ambiguities.', synonyms: ['meticulous', 'scrupulous', 'punctilious'] },
          { word: 'obsequious', phonetic: '/əbˈsiːkwɪəs/', definition: 'Excessively eager to please more powerful people', example: 'Obsequious praise undermined honest feedback in meetings.', synonyms: ['servile', 'sycophantic', 'fawning'] },
          { word: 'magnanimous', phonetic: '/mæɡˈnænɪməs/', definition: 'Generous toward a rival or offender', example: 'In victory, she was magnanimous toward critics.', synonyms: ['generous', 'forgiving', 'big-hearted'] },
          { word: 'parsimonious', phonetic: '/ˌpɑːsɪˈməʊniəs/', definition: 'Extremely unwilling to spend money; very frugal', example: 'A parsimonious budget risks underfunding maintenance.', synonyms: ['stingy', 'miserly', 'tight-fisted'] },
          { word: 'obdurate', phonetic: '/ˈɒbdjʊrət/', definition: 'Stubbornly refusing to change one’s opinion', example: 'Negotiators met an obdurate stance on key clauses.', synonyms: ['stubborn', 'unyielding', 'inflexible'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Proficient — Abstract Nouns II',
        words: [
          { word: 'perspicacity', phonetic: '/ˌpɜːspɪˈkæsɪti/', definition: 'Keen insight and quick understanding of situations', example: 'Her perspicacity revealed hidden assumptions immediately.', synonyms: ['insight', 'acuity', 'shrewdness'] },
          { word: 'temerity', phonetic: '/tɪˈmɛrɪti/', definition: 'Excessive confidence or boldness showing rashness', example: 'He had the temerity to dismiss peer review.', synonyms: ['audacity', 'recklessness', 'boldness'] },
          { word: 'probity', phonetic: '/ˈprəʊbɪti/', definition: 'Strong moral principles; honesty and integrity', example: 'Public probity depends on transparent procurement.', synonyms: ['integrity', 'honesty', 'uprightness'] },
          { word: 'effrontery', phonetic: '/ɪˈfrʌntəri/', definition: 'Shameless boldness shown in insulting behavior', example: 'He spoke with effrontery about ignoring regulations.', synonyms: ['impudence', 'brazenness', 'cheek'] },
          { word: 'equanimity', phonetic: '/ˌiːkwəˈnɪmɪti/', definition: 'Calmness and composure under stressful pressure', example: 'She handled the crisis with admirable equanimity.', synonyms: ['calm', 'composure', 'serenity'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Proficient — Science/Logic Adjectives',
        words: [
          { word: 'spurious', phonetic: '/ˈspjʊərɪəs/', definition: 'Not genuine; false or lacking authentic origin', example: 'Controls exposed spurious correlations in the dataset.', synonyms: ['false', 'bogus', 'counterfeit'] },
          { word: 'ineluctable', phonetic: '/ˌɪnɪˈlʌktəbl/', definition: 'Impossible to avoid or escape entirely', example: 'Ageing is an ineluctable aspect of biology.', synonyms: ['inevitable', 'unavoidable', 'inescapable'] },
          { word: 'inchoate', phonetic: '/ɪnˈkəʊeɪt/', definition: 'Just begun and not yet fully formed', example: 'Their inchoate plan lacked milestones and owners.', synonyms: ['rudimentary', 'nascent', 'embryonic'] },
          { word: 'axiomatic', phonetic: '/ˌæksɪəˈmætɪk/', definition: 'Self-evident and accepted without requiring proof', example: 'It’s axiomatic that incentives shape behavior.', synonyms: ['self-evident', 'unquestionable', 'obvious'] },
          { word: 'orthogonal', phonetic: '/ɔːˈθɒɡənl/', definition: 'Statistically independent or unrelated in effect', example: 'The variables were orthogonal across all cohorts.', synonyms: ['independent', 'uncorrelated', 'perpendicular'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Proficient — Economics & Philosophy Nouns',
        words: [
          { word: 'externality', phonetic: '/ˌɛkstɜːˈnælɪti/', definition: 'Indirect cost or benefit affecting others', example: 'Congestion pricing internalizes transport externalities efficiently.', synonyms: ['side effect', 'spillover', 'indirect effect'] },
          { word: 'tautology', phonetic: '/tɔːˈtɒlədʒi/', definition: 'Needless repetition; statement true by definition', example: '“Free gift” is a common tautology in ads.', synonyms: ['redundancy', 'repetition', 'circular definition'] },
          { word: 'hegemony', phonetic: '/hɪˈdʒɛməni/', definition: 'Dominant leadership or influence over others', example: 'Cultural hegemony shapes taste and aspiration.', synonyms: ['dominance', 'supremacy', 'ascendancy'] },
          { word: 'anomie', phonetic: '/ˈænəmi/', definition: 'Social instability from breakdown of norms', example: 'Rapid change can trigger anomie across communities.', synonyms: ['normlessness', 'social breakdown', 'alienation'] },
          { word: 'teleology', phonetic: '/ˌtɛlɪˈɒlədʒi/', definition: 'Explanation by purposes rather than causes', example: 'The essay critiques teleology in evolutionary narratives.', synonyms: ['final cause', 'purpose-based account', 'ends-based view'] }
        ],
        completed: false
      }
    ]
  }
];
