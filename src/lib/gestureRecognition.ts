// Rule-based gesture recognition using hand landmarks
// MediaPipe provides 21 landmarks per hand

export type GestureResult = {
  gesture: string;
  confidence: number;
};

export const SUPPORTED_GESTURES = [
  'A', 'B', 'C', 'D', 'E',
  '1', '2', '3', '4', '5',
  'Hello', 'Yes', 'No', 'Help'
] as const;

export type SupportedGesture = typeof SUPPORTED_GESTURES[number];

// Landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const THUMB_MCP = 2;
const INDEX_TIP = 8;
const INDEX_DIP = 7;
const INDEX_PIP = 6;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_DIP = 11;
const MIDDLE_PIP = 10;
const MIDDLE_MCP = 9;
const RING_TIP = 16;
const RING_DIP = 15;
const RING_PIP = 14;
const RING_MCP = 13;
const PINKY_TIP = 20;
const PINKY_DIP = 19;
const PINKY_PIP = 18;
const PINKY_MCP = 17;

type Landmark = { x: number; y: number; z: number };

function distance(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function isFingerExtended(landmarks: Landmark[], tip: number, dip: number, pip: number, mcp: number): boolean {
  // Finger is extended if tip is farther from wrist than pip
  const tipDist = distance(landmarks[tip], landmarks[WRIST]);
  const pipDist = distance(landmarks[pip], landmarks[WRIST]);
  const tipToPip = distance(landmarks[tip], landmarks[pip]);
  return tipDist > pipDist && tipToPip > 0.05;
}

function isThumbExtended(landmarks: Landmark[]): boolean {
  const tipDist = distance(landmarks[THUMB_TIP], landmarks[INDEX_MCP]);
  return tipDist > 0.08;
}

function getFingerStates(landmarks: Landmark[]) {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, INDEX_TIP, INDEX_DIP, INDEX_PIP, INDEX_MCP),
    middle: isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_DIP, MIDDLE_PIP, MIDDLE_MCP),
    ring: isFingerExtended(landmarks, RING_TIP, RING_DIP, RING_PIP, RING_MCP),
    pinky: isFingerExtended(landmarks, PINKY_TIP, PINKY_DIP, PINKY_PIP, PINKY_MCP),
  };
}

function countExtendedFingers(fingers: ReturnType<typeof getFingerStates>): number {
  return [fingers.thumb, fingers.index, fingers.middle, fingers.ring, fingers.pinky]
    .filter(Boolean).length;
}

export function recognizeGesture(landmarks: Landmark[]): GestureResult | null {
  if (!landmarks || landmarks.length < 21) return null;

  const fingers = getFingerStates(landmarks);
  const extendedCount = countExtendedFingers(fingers);

  // HELP: Open palm facing camera, all fingers extended and spread
  if (extendedCount === 5) {
    const indexMiddleDist = distance(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]);
    const middleRingDist = distance(landmarks[MIDDLE_TIP], landmarks[RING_TIP]);
    // Spread fingers = Help, closed fingers = Hello/5
    if (indexMiddleDist > 0.06 && middleRingDist > 0.06) {
      return { gesture: 'Help', confidence: 0.8 };
    }
    return { gesture: '5', confidence: 0.85 };
  }

  // Hello: Open palm, fingers together (wave gesture)
  if (extendedCount >= 4 && fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
    const indexMiddleDist = distance(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]);
    if (indexMiddleDist < 0.06) {
      return { gesture: 'Hello', confidence: 0.8 };
    }
  }

  // Numbers 1-4
  if (extendedCount === 1 && fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: '1', confidence: 0.9 };
  }
  if (extendedCount === 2 && fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: '2', confidence: 0.9 };
  }
  if (extendedCount === 3 && fingers.index && fingers.middle && fingers.ring && !fingers.pinky) {
    return { gesture: '3', confidence: 0.85 };
  }
  if (extendedCount === 4 && fingers.index && fingers.middle && fingers.ring && fingers.pinky && !fingers.thumb) {
    return { gesture: '4', confidence: 0.85 };
  }

  // Yes: Fist with thumb up
  if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'Yes', confidence: 0.85 };
  }

  // A: Fist (all fingers curled)
  if (extendedCount === 0) {
    return { gesture: 'A', confidence: 0.8 };
  }

  // B: All fingers extended, thumb tucked
  if (!fingers.thumb && fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
    return { gesture: 'B', confidence: 0.8 };
  }

  // C: Curved hand (partial extension)
  if (extendedCount === 2 && fingers.thumb && fingers.index) {
    const thumbIndexDist = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
    if (thumbIndexDist > 0.05 && thumbIndexDist < 0.12) {
      return { gesture: 'C', confidence: 0.7 };
    }
  }

  // D: Index up, others form circle with thumb
  if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'D', confidence: 0.75 };
  }

  // E: All fingers curled, tips touching thumb
  if (extendedCount <= 1 && !fingers.index && !fingers.middle) {
    return { gesture: 'E', confidence: 0.7 };
  }

  // No: Index and middle extended, waving side to side (simplified: just two fingers)
  if (extendedCount === 2 && fingers.index && fingers.middle) {
    return { gesture: 'No', confidence: 0.7 };
  }

  return null;
}

// Translations
export const translations: Record<string, Record<string, string>> = {
  en: {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E',
    '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    'Hello': 'Hello', 'Yes': 'Yes', 'No': 'No', 'Help': 'Help',
  },
  hi: {
    'A': 'ए', 'B': 'बी', 'C': 'सी', 'D': 'डी', 'E': 'ई',
    '1': 'एक', '2': 'दो', '3': 'तीन', '4': 'चार', '5': 'पाँच',
    'Hello': 'नमस्ते', 'Yes': 'हाँ', 'No': 'नहीं', 'Help': 'मदद',
  },
  te: {
    'A': 'ఏ', 'B': 'బీ', 'C': 'సీ', 'D': 'డీ', 'E': 'ఈ',
    '1': 'ఒకటి', '2': 'రెండు', '3': 'మూడు', '4': 'నాలుగు', '5': 'ఐదు',
    'Hello': 'నమస్కారం', 'Yes': 'అవును', 'No': 'లేదు', 'Help': 'సహాయం',
  },
};

export const languageNames: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  te: 'తెలుగు (Telugu)',
};

export const speechLangCodes: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',
};
