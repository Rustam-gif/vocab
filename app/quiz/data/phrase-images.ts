/**
 * Mapping of phrasal verbs/expressions to pre-made image filenames
 * Images stored in Supabase Storage bucket: "For pictures"
 */

const SUPABASE_STORAGE_URL = 'https://auirkjgyattnvqaygmfo.supabase.co/storage/v1/object/public/For%20pictures';

export const PHRASE_IMAGES: Record<string, string> = {
  'miss the bus': 'person-putting-on-shoes-near-the-door--clock-on-th.png',
  'pick up': 'one-person-handing-a-small-object--other-person-no.png',
  'hand in': 'office-or-classroom--person-handing-papers-to-anot.png',
  'work on': 'person-sitting-at-desk--laptop-open--person-focuse.png',
  'figure out': 'person-looking-at-options-on-paper--hand-on-chin--.png',
  'make progress': 'person-checking-items-off-a-list--desk-environment.png',
  'finish up': 'finished-paper-on-desk--person-standing--.png',
  'agree with': 'two-people-facing-each-other--both-nodding-slightl.png',
  'disagree with': 'two-people-talking--one-gently-shaking-head--calm-.png',
  'apologize': 'one-person-speaking-softly--other-person-listening.png',
  'thank someone': 'two-people-facing-each-other--both-nodding-slightl.png',
  'ask for help': 'one-person-pointing-at-a-problem-on-paper--another.png',
  'come back': 'person-walking-toward-a-door-they-left-earlier--si.png',
  'leave early': 'person-putting-on-a-jacket--office-behind-them--ne.png',
  'show up': 'person-entering-a-room--others-already-inside--pla.png',
  'stay in': 'person-sitting-at-home-on-a-chair--no-outside-acti.png',
  'head out': 'person-opening-front-door--bag-in-hand--neutral-ex.png',
  'break down': 'car-stopped-at-roadside--warning-light-visible--on.png',
  'fix': 'person-using-simple-tool-on-object--table-surface-.png',
  'deal with': 'two-people-talking-calmly--one-explaining--one-lis.png',
  'avoid': 'person-holding-hand-up--object-placed-slightly-awa.png',
  'prevent': 'person-holding-hand-up--object-placed-slightly-awa.png',
  'decide': 'person-looking-at-two-papers--choosing-one--desk-s.png',
  'plan ahead': 'person-writing-in-a-planner--calendar-visible--neu.png',
  'change mind': 'person-putting-one-paper-aside--taking-another-.png',
  'stick to': 'person-following-a-written-list--focused-posture-.png',
  'give up': 'person-sitting-on-chair--no-work-visible--.png',
  'pay for': 'scene--hotel-reception-desk--one-guest-handing-a-k.png',
  'run out of': 'scene--kitchen-counter--an-empty-milk-carton-stand.png',
  'save money': 'person-checking-items-off-a-list--desk-environment.png',
  'spend money': 'scene--hotel-reception-desk--one-guest-handing-a-k.png',
  'afford': 'person-looking-at-options-on-paper--hand-on-chin--.png',
  'feel confident': 'person-standing-upright--hands-relaxed--neutral-fa.png',
  'feel unsure': 'person-looking-at-options-on-paper--hand-on-chin-- (1).png',
  'stay calm': 'person-sitting-still--hands-resting--quiet-room-.png',
  'get stressed': 'person-with-many-papers-on-desk--neutral-but-tense.png',
  'relax': 'person-sitting-still--hands-resting--quiet-room-.png',
  'at first': 'person-starting-a-task--blank-paper--.png',
  'in the end': 'finished-paper-on-desk--person-standing--.png',
  'right away': 'person-responding-immediately--phone-in-hand--.png',
  'for a while': 'person-waiting-on-chair--clock-nearby--.png',
  'on time': 'person-arriving-as-clock-shows-exact-time--.png',
  'take over': 'one-person-leaving-desk--another-sitting-down--.png',
  'be in charge': 'person-standing-upright--hands-relaxed--neutral-fa.png',
};

/**
 * Get the full URL for a phrase's image
 * @param phrase - The phrase to look up (case-insensitive)
 * @returns Full Supabase Storage URL or null if not found
 */
export function getPhraseImageUrl(phrase: string): string | null {
  const normalized = phrase.toLowerCase().trim();
  const filename = PHRASE_IMAGES[normalized];
  if (!filename) return null;
  return `${SUPABASE_STORAGE_URL}/${encodeURIComponent(filename)}`;
}

/**
 * Check if a phrase has a mapped image
 */
export function hasPhraseImage(phrase: string): boolean {
  return phrase.toLowerCase().trim() in PHRASE_IMAGES;
}

/**
 * Get all available phrases
 */
export function getAvailablePhrases(): string[] {
  return Object.keys(PHRASE_IMAGES);
}
