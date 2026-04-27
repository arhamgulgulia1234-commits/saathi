const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all',
  "don't want to live", 'want to die', 'self harm', 'self-harm', 'hurt myself',
  'cutting myself', 'overdose', 'no reason to live', "can't go on",
  'better off dead', 'nobody would miss me', 'disappear forever',
  'not worth living', 'give up on life', 'ending it', 'goodbye forever',
  'जीना नहीं चाहता', 'मर जाना चाहता', 'खुद को नुकसान'
];

const HIGH_ANXIETY_PATTERNS = [
  'panic attack', "can't breathe", 'cant breathe', 'heart racing',
  'chest tight', 'so anxious', 'freaking out', 'anxiety attack',
  'hyperventilating', 'shaking uncontrollably', 'overwhelming anxiety',
  "can't calm down", 'cant calm down', 'spiraling'
];

export function detectCrisis(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(k => lower.includes(k));
}

export function detectHighAnxiety(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return HIGH_ANXIETY_PATTERNS.some(p => lower.includes(p));
}
