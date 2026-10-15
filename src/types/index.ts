export interface ProperNounItem {
  name: string;
  category: 'person' | 'place' | 'technology' | 'brand' | 'foreign' | 'other';
  ancientAdaptation: string;
  phoneticGuide: string;
  ancientPronunciation?: string;
  usageNote?: string;
}

export interface VocabularyItem {
  ancientWord: string;
  modernWord: string;
  ancientPhonetic?: string;
  modernPhonetic?: string;
  detail: string;
}

export interface QuotaInfo {
  cloudLimit: number;
  cloudUsed: number;
  cloudRemaining: number;
  ttsLimit: number;
  ttsUsed: number;
  ttsRemaining: number;
  isExhausted: boolean;
  resetTimestamp: number;
  resetTimeFormatted: string;
  sourceUsed: 'cloud' | 'siamese_engine';
}

export interface TranslationRecord {
  id: string;
  timestamp: number;
  modernText: string;
  ancientText: string;
  styleTitle: string;
  styleKey: string;
  toneDescription?: string;
  pronunciationTips?: string;
  vocabularyList: VocabularyItem[];
  properNouns?: ProperNounItem[];
  historicalNote?: string;
  voiceName: string;
  audioBase64?: string | null;
  modernAudioBase64?: string | null;
  quotaInfo?: QuotaInfo;
}

export type AncientStyleKey = 
  | 'ayutthaya_colloquial'
  | 'ayutthaya_court'
  | 'sukhothai'
  | 'poetic'
  | 'royal';

export interface AncientStyleOption {
  key: AncientStyleKey;
  title: string;
  subtitle: string;
  era: string;
  icon: string;
  description: string;
  examples: string[];
}

export interface VoiceOption {
  name: string;
  displayName: string;
  characterTitle: string;
  gender: 'female' | 'male';
  tone: string;
  description: string;
}
