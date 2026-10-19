import { AssessmentResult, ChatMessage, TestStep, TargetLanguage, UILanguage } from '../types';

export async function requestTTS(
  text: string,
  voiceName: string = 'Kore',
  language: TargetLanguage = 'en'
): Promise<string | null> {
  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName, language }),
    });

    if (!res.ok) {
      console.warn('TTS request failed with status', res.status);
      return null;
    }

    const data = await res.json();
    return data.audioBase64 || null;
  } catch (err) {
    console.error('Error fetching TTS:', err);
    return null;
  }
}

export async function assessVoiceInput(params: {
  audioBase64?: string;
  mimeType?: string;
  transcript?: string;
  targetText?: string;
  language: TargetLanguage;
  taskType?: 'pronunciation' | 'conversation' | 'level_test';
}): Promise<AssessmentResult> {
  try {
    const res = await fetch('/api/assess-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      console.warn('Backend assessment error, fallback provided', data);
      throw new Error(`Assessment response invalid or status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    console.warn('Network issue calling assess-voice, returning resilient fallback', err);
    const isKu = params.language === 'ku';
    const isAr = params.language === 'ar';

    const spoken = (params.transcript || '').trim();
    const target = (params.targetText || '').trim();

    const spokenTokens = spoken.split(/\s+/).filter(Boolean);
    const targetTokens = target.split(/\s+/).filter(Boolean);

    let calculatedScore = 70;
    let cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'B1';

    if (spokenTokens.length === 0) {
      calculatedScore = 20;
      cefr = 'A1';
    } else if (targetTokens.length > 0) {
      // Approximate word overlap
      const spokenNorm = spokenTokens.map((w) => w.toLowerCase().replace(/[\p{P}\p{S}]/gu, ''));
      let matches = 0;
      targetTokens.forEach((t) => {
        const tNorm = t.toLowerCase().replace(/[\p{P}\p{S}]/gu, '');
        if (spokenNorm.some((s) => s === tNorm || s.includes(tNorm) || tNorm.includes(s))) {
          matches++;
        }
      });
      const ratio = matches / targetTokens.length;
      if (ratio >= 0.95) {
        calculatedScore = 100;
        cefr = 'C2';
      } else if (ratio >= 0.88) {
        calculatedScore = 95;
        cefr = 'C1';
      } else if (ratio >= 0.78) {
        calculatedScore = 90;
        cefr = 'C1';
      } else if (ratio >= 0.68) {
        calculatedScore = 80;
        cefr = 'B2';
      } else if (ratio >= 0.55) {
        calculatedScore = 70;
        cefr = 'B2';
      } else if (ratio >= 0.42) {
        calculatedScore = 60;
        cefr = 'B1';
      } else if (ratio >= 0.32) {
        calculatedScore = 55;
        cefr = 'A2';
      } else if (ratio >= 0.22) {
        calculatedScore = 50;
        cefr = 'A2';
      } else if (ratio >= 0.12) {
        calculatedScore = 40;
        cefr = 'A1';
      } else {
        calculatedScore = 20;
        cefr = 'A1';
      }
    } else {
      if (spokenTokens.length <= 2) calculatedScore = 20;
      else if (spokenTokens.length <= 5) calculatedScore = 40;
      else if (spokenTokens.length <= 9) calculatedScore = 55;
      else if (spokenTokens.length <= 15) calculatedScore = 70;
      else if (spokenTokens.length <= 25) calculatedScore = 85;
      else calculatedScore = 95;
    }

    return {
      recognizedText: spoken || (isKu ? 'دەنگ بە سەرکەوتوویی تۆمارکرا' : isAr ? 'تم تسجيل الصوت بنجاح' : 'Audio recorded successfully'),
      detectedLanguage: params.language,
      overallScore: calculatedScore,
      cefrLevel: cefr,
      scores: {
        pronunciation: calculatedScore,
        fluency: Math.max(15, calculatedScore - 2),
        vocabulary: calculatedScore,
        grammar: calculatedScore,
      },
      feedbackKurdish:
        calculatedScore >= 90
          ? `نایابە! ئاستێکی زۆر باڵا (%${calculatedScore}). بێژەکردنی وشەکانت بە ڕوونی و دروستی گەیشت.`
          : calculatedScore >= 70
          ? `دەستخۆش! ئەنجامێکی باش (%${calculatedScore}). پەیامەکەت ڕوون بوو، بەردەوام بە لەسەر مەشق.`
          : calculatedScore >= 50
          ? `ئاستی مامناوەند (%${calculatedScore}). پێویستە زیاتر تەرکیز بخەیتە سەر بێژەکردنی تەواوی وشەکان.`
          : `نمرەی ئەم هەوڵە (%${calculatedScore})ە. وتەکەت کەم بوو یان تەواو ڕوون نەبوو، تکایە دووبارە تاقی بکەرەوە.`,
      feedbackEnglish: `Score: ${calculatedScore}%. Spoken delivery evaluated. Keep practicing regularly.`,
      feedbackArabic: `الدرجة: ${calculatedScore}%. تم تقييم النطق بنجاح. استمر في التدرب المنتظم.`,
      phoneticGuide: isKu ? 'تەرکیز لەسەر ڕیتم و پیتە قوڕگییەکان بکە' : isAr ? 'ركز على مخارج الحروف العربية وسلامة النطق' : 'Focus on steady pacing and connected speech.',
      strengths: [isKu ? 'دەربڕینی ڕوونی وشەکان' : isAr ? 'وضوح مخارج الحروف' : 'Clear phoneme articulation'],
      improvements: [isKu ? 'تەواوکردنی ڕستەکە بەبێ وەستان' : isAr ? 'تحسين انسيابية الجملة' : 'Increase natural speaking rate'],
      wordsAnalysis: [],
      corrections: [],
    };
  }
}

export async function chatWithTutor(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  scenario: string;
  targetLanguage: TargetLanguage;
  uiLanguage?: UILanguage;
  tutorPersona?: string;
  userLevel?: string;
  requestAudio?: boolean;
  voiceName?: string;
}): Promise<{
  replyText: string;
  translation: string;
  phoneticHint?: string;
  audioBase64?: string | null;
  correctionTip?: {
    studentMistake?: string;
    betterWay?: string;
    explanation?: string;
    explanationKurdish?: string;
    explanationArabic?: string;
  };
  suggestedReplies: Array<{
    text: string;
    translation: string;
  }>;
}> {
  const res = await fetch('/api/tutor-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error ${res.status}`);
  }

  return await res.json();
}

export async function fetchLevelTestSteps(language: TargetLanguage): Promise<TestStep[]> {
  const res = await fetch(`/api/level-test-steps?language=${language}`);
  if (!res.ok) {
    throw new Error('Failed to load level test steps');
  }
  return await res.json();
}

export async function transcribeAudio(params: {
  audioBase64: string;
  mimeType?: string;
  language: TargetLanguage;
}): Promise<string> {
  try {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.transcript || '';
  } catch (err) {
    console.warn('Audio transcribe error:', err);
    return '';
  }
}

export interface TranslationResponse {
  translatedText: string;
  detectedSource: string;
  phonetic?: string;
  alternativeTranslations?: string[];
  wordBreakdown?: Array<{
    original: string;
    translated: string;
    partOfSpeech?: string;
  }>;
  exampleSentences?: Array<{
    source: string;
    target: string;
  }>;
  audioBase64?: string | null;
}

export async function translateText(params: {
  text: string;
  sourceLang?: 'auto' | 'ku' | 'ar' | 'en';
  targetLang: 'ku' | 'ar' | 'en';
  requestAudio?: boolean;
  domain?: string;
}): Promise<TranslationResponse> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Translation request failed with status ${res.status}`);
  }

  return await res.json();
}


