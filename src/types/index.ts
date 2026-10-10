export type TargetLanguage = 'en' | 'ku' | 'ar';
export type UILanguage = 'ku' | 'en' | 'ar';

export interface ScoreBreakdown {
  pronunciation: number;
  fluency: number;
  vocabulary: number;
  grammar: number;
}

export interface WordAnalysis {
  word: string;
  status: 'excellent' | 'good' | 'needs_work';
  phonetic?: string;
  tip?: string;
}

export interface GrammarCorrection {
  original: string;
  improved: string;
  explanationKurdish: string;
  explanationEnglish: string;
  explanationArabic?: string;
}

export interface AssessmentResult {
  recognizedText: string;
  detectedLanguage?: string;
  overallScore: number;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  scores: ScoreBreakdown;
  feedbackKurdish: string;
  feedbackEnglish: string;
  feedbackArabic?: string;
  phoneticGuide?: string;
  strengths: string[];
  improvements: string[];
  wordsAnalysis?: WordAnalysis[];
  corrections?: GrammarCorrection[];
  timestamp?: number;
}

export interface TestStep {
  id: number;
  level: string;
  title: string;
  titleKu?: string;
  titleEn?: string;
  titleAr?: string;
  category?: string;
  instructionKurdish: string;
  instructionEnglish: string;
  instructionArabic?: string;
  promptText: string;
  promptKu?: string;
  promptEn?: string;
  promptAr?: string;
  sampleIdealAnswer: string;
  sampleAnswerKu?: string;
  sampleAnswerEn?: string;
  sampleAnswerAr?: string;
  translationKu?: string;
  minSpeakingSeconds: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  phoneticHint?: string;
  audioBase64?: string;
  correctionTip?: {
    studentMistake?: string;
    betterWay?: string;
    explanationKurdish?: string;
    explanationArabic?: string;
  };
  suggestedReplies?: Array<{
    text: string;
    translation: string;
  }>;
  timestamp: number;
}

export interface Scenario {
  id: string;
  titleKu: string;
  titleEn: string;
  titleAr?: string;
  descriptionKu: string;
  descriptionEn: string;
  descriptionAr?: string;
  icon: string;
  initialPromptKu: string;
  initialPromptEn: string;
  initialPromptAr?: string;
  difficulty: 'A1-A2' | 'A2-B1' | 'B1-B2' | 'C1-C2';
  category?: 'hospital' | 'career' | 'academic' | 'travel' | 'daily';
  tutorRoleKu?: string;
  tutorRoleEn?: string;
  tutorRoleAr?: string;
}

export interface PronunciationDrill {
  id: string;
  textEn: string;
  textKu: string;
  textAr?: string;
  phonetic: string;
  category: 'daily' | 'business' | 'travel' | 'idiom' | 'challenge' | 'medical';
  difficulty: 'easy' | 'medium' | 'hard';
  audioTipsKu: string;
  audioTipsEn: string;
  audioTipsAr?: string;
}

export interface VoiceHistoryItem {
  id: string;
  stageId: number;
  stageLevel: string;
  stageTitle: string;
  language: TargetLanguage;
  timestamp: number;
  durationSeconds: number;
  audioBase64: string;
  mimeType: string;
  overallScore: number;
  cefrLevel: string;
  scores: ScoreBreakdown;
  recognizedText?: string;
}

export interface AchievementBadge {
  id: string;
  titleKu: string;
  titleEn: string;
  titleAr: string;
  descriptionKu: string;
  descriptionEn: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  max: number;
}

export interface DailyMission {
  id: string;
  titleKu: string;
  titleEn: string;
  titleAr: string;
  promptKu: string;
  promptEn: string;
  promptAr: string;
  targetScore: number;
  category: string;
  completed: boolean;
}

export interface SavedBookmark {
  id: string;
  text: string;
  translation: string;
  phonetic?: string;
  language: TargetLanguage;
  category: string;
  timestamp: number;
}

export interface MistakeItem {
  word: string;
  failedCount: number;
  lastScore: number;
  tipKu: string;
  tipEn: string;
  sampleSentence: string;
  timestamp: number;
}

export interface MinimalPairItem {
  id: string;
  wordA: string;
  wordB: string;
  phoneticA: string;
  phoneticB: string;
  meaningKuA: string;
  meaningKuB: string;
  meaningEnA: string;
  meaningEnB: string;
  soundDifference: string;
}

export interface TutorPersona {
  id: string;
  name: string;
  roleKu: string;
  roleEn: string;
  avatar: string;
  voiceName: string;
  tone: 'clinical' | 'friendly' | 'academic' | 'coach';
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  weeklyXp: number;
  cefrLevel: string;
  avatar?: string;
  rank?: number;
  streakDays?: number;
  language?: string;
  updatedAt: string;
  isCurrentUser?: boolean;
}
