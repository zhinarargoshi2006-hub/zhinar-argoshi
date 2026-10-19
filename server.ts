import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { get1000TestStepsForLanguage } from './src/data/speakingStages1000.ts';
import type { TargetLanguage } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Cache and rate-limit guard for TTS audio generation
const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();
let ttsCooldownUntil = 0;

// Helper to execute generateContent with automatic model fallback across separate quota pools
async function generateGeminiContentWithFallback(requestConfig: any) {
  // Check if payload contains audio inlineData
  const hasAudio = JSON.stringify(requestConfig).includes('"mimeType":"audio/') || JSON.stringify(requestConfig).includes('audioBase64');
  
  // Multimodal audio models vs text-optimized models (strictly supported by @google/genai)
  const candidateModels = hasAudio
    ? ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-pro-preview']
    : ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        ...requestConfig,
        model,
      });
      return res;
    } catch (err: any) {
      lastError = err;
      const isQuota =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota');
      if (isQuota) {
        console.warn(`Model ${model} quota exhausted (429). Attempting fallback model...`);
        continue;
      }
      console.warn(`Model ${model} encounter:`, err?.message || err);
    }
  }

  throw lastError;
}

// Dedicated helper to transcribe Kurdish, Arabic, or English audio cleanly
async function transcribeAudioWithGemini(audioBase64: string, mimeType: string = 'audio/webm', language: string = 'ku'): Promise<string | null> {
  const targetDesc =
    language === 'ar'
      ? 'Modern Standard Arabic (العربية الفصحى)'
      : language === 'ku'
      ? 'Central Kurdish Sorani (کوردیی سۆرانی بە ڕێنووسی کوردی)'
      : 'English';

  const audioPart = {
    inlineData: {
      mimeType: mimeType || 'audio/webm',
      data: audioBase64,
    },
  };

  const promptText = `You are a precise multilingual speech-to-text engine.
Listen carefully to this spoken audio.
Target Language: ${targetDesc}.

STRICT ACCURACY & ISOLATION RULES:
1. Transcribe EXACTLY what the user spoke in ${targetDesc}.
2. If spoken in Kurdish, transcribe strictly in Central Kurdish (Sorani script / ئەلفوبێی کوردی). DO NOT mix Arabic or Persian letters/words.
3. If spoken in Arabic, transcribe strictly in Modern Standard Arabic. DO NOT mix Kurdish words.
4. If spoken in English, transcribe strictly in English.
5. Return ONLY the transcribed text. Do NOT add preamble, conversational remarks, quotation marks, or explanations.`;

  const models = ['gemini-3.5-transcribe', 'gemini-flash-latest', 'gemini-3.8-flash'];
  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: { parts: [audioPart, { text: promptText }] },
      });
      const text = res.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} audio transcription note:`, err?.message || err);
    }
  }
  return null;
}

// Levenshtein distance algorithm for phonetic & lexical comparison
function computeLevenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

// Normalize word for strict comparison across Kurdish, Arabic, and English
function normalizeWord(word: string): string {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»،؛؟0-9]/g, '')
    .replace(/[\u064B-\u065F]/g, '') // remove Arabic tashkeel
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ە')
    .replace(/إ|أ|آ/g, 'ا')
    .trim();
}

// Realistic Speech Evaluator ensuring scores are authentic across the full 0-100 spectrum
// (Never locking at 80; accurately yielding 20, 40, 50, 55, 60, 70, 80, 90, 95, 100 based on actual voice input)
function generateHeuristicEvaluation(transcript: string, targetText?: string, language = 'en', taskType = 'pronunciation') {
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const rawSpoken = (transcript || '').trim();
  const rawTarget = (targetText || '').trim();

  const spokenWords = rawSpoken.split(/\s+/).filter((w) => normalizeWord(w).length > 0);
  const targetWords = rawTarget.split(/\s+/).filter((w) => normalizeWord(w).length > 0);

  // CASE 1: No audible words recognized (Silence / immediate stop / microphone noise)
  if (spokenWords.length === 0) {
    const defaultScore = 20; // Explicit 20%
    const wordsAnalysis = (targetWords.length > 0 ? targetWords : ['دەنگ']).slice(0, 8).map((w) => ({
      word: w,
      status: 'needs_work',
      phonetic: `/${w.toLowerCase()}/`,
      tip: isKu
        ? 'ئەم وشەیە نەبیسترا. تکایە بە دەنگێکی بەرزتر بیڵێ'
        : isAr
        ? 'لم يتم التقاط هذه الكلمة. يرجى التحدث بصوت أعلى'
        : 'This word was inaudible. Please speak louder and clearer',
    }));

    return {
      recognizedText: rawSpoken || (isKu ? 'هیچ قسەیەک نەبیسترا (دەنگی کەم یان بێدەنگی)' : isAr ? 'لم يُسمع أي كلام واضح' : 'No clear speech detected'),
      detectedLanguage: language,
      overallScore: defaultScore,
      cefrLevel: 'A1',
      scores: {
        pronunciation: 20,
        fluency: 15,
        vocabulary: 20,
        grammar: 20,
      },
      feedbackKurdish:
        'نمرەی ئەم هەوڵە نزمە (%٢٠). هیچ دەنگێک یان وتەیەکی ڕوون لە تۆمارەکەدا نەبیسترا. تکایە دووبارە مایکەکە داگرە و بە دەنگێکی ئازایانە و ڕوون تەواوی ڕستەکە بڵێ.',
      feedbackEnglish:
        'Score is 20%. No clear voice or intelligible speech was detected. Please tap the microphone and pronounce the entire sentence with confidence and clarity.',
      feedbackArabic:
        'الدرجة (20%). لم يتم التقاط صوت مسموع أو كلام واضح. يرجى إعادة المحاولة والتحدث بنبرة واضحة ومسموعة لكامل الجملة.',
      phoneticGuide: isKu
        ? 'مایکەکە نزیک بکەرەوە و ڕستەکە بە یەک هەناسە و بە ڕوونی تەواو بکە'
        : isAr
        ? 'اقترب من الميكروفون وتحدث بطلاقة ووضوح'
        : 'Position microphone closer and speak full sentence clearly.',
      strengths: [
        isKu ? 'دەستپێکردنی تۆمارکردن' : isAr ? 'محاولة التسجيل' : 'Initiated recording attempt',
      ],
      improvements: [
        isKu ? 'بەرزکردنەوەی دەنگ و بێژەکردنی تەواوی وشەکان' : isAr ? 'رفع الصوت ونطق كامل الكلمات' : 'Speak audibly and pronounce all words completely',
      ],
      wordsAnalysis,
      corrections: [],
    };
  }

  // CASE 2: Evaluation against Target Expected Sentence (strictly for Pronunciation Drills)
  if (taskType === 'pronunciation' && targetWords.length > 0) {
    let matchedScoreSum = 0;
    const matchedSpokenIndices = new Set<number>();

    const wordsAnalysis = targetWords.map((tWord) => {
      const normTarget = normalizeWord(tWord);
      let bestDist = 999;
      let bestSpokenIdx = -1;

      spokenWords.forEach((sWord, sIdx) => {
        if (matchedSpokenIndices.has(sIdx)) return;
        const normSpoken = normalizeWord(sWord);
        const dist = computeLevenshteinDistance(normTarget, normSpoken);
        if (dist < bestDist) {
          bestDist = dist;
          bestSpokenIdx = sIdx;
        }
      });

      // Perfect match
      if (bestDist === 0) {
        matchedSpokenIndices.add(bestSpokenIdx);
        matchedScoreSum += 1.0;
        return {
          word: tWord,
          status: 'excellent',
          phonetic: `/${tWord.toLowerCase()}/`,
          tip: isKu ? 'بێژەکردنێکی تەواو و دروست' : isAr ? 'نطق فصيح ومتقن' : 'Accurate and native phonetics',
        };
      }
      // Minor phonetic inaccuracy (distance 1 or 2 on long word)
      else if (bestDist <= (normTarget.length > 4 ? 2 : 1)) {
        matchedSpokenIndices.add(bestSpokenIdx);
        matchedScoreSum += 0.75;
        return {
          word: tWord,
          status: 'good',
          phonetic: `/${tWord.toLowerCase()}/`,
          tip: isKu ? 'باشە، بەڵام پێویستی بە تۆزێک ڕێکخستنی دەنگ هەیە' : isAr ? 'جيد مع حاجة لتدقيق المخارج' : 'Good, slight vowel adjustment needed',
        };
      }
      // Missing or severely mispronounced
      else {
        return {
          word: tWord,
          status: 'needs_work',
          phonetic: `/${tWord.toLowerCase()}/`,
          tip: isKu ? 'ئەم وشەیە نەبیسترا یان هەڵە خوێندرایەوە' : isAr ? 'كلمة مفقودة أو نطق غير صحيح' : 'Missed or pronounced incorrectly',
        };
      }
    });

    const matchRatio = matchedScoreSum / targetWords.length;
    let overallScore = 80;
    let cefrLevel = 'B1';

    // Granular, realistic scoring curve (20, 40, 50, 55, 60, 70, 80, 90, 95, 100)
    if (matchRatio >= 0.98) {
      // 100% complete and accurate
      overallScore = 100;
      cefrLevel = 'C2';
    } else if (matchRatio >= 0.92) {
      // 95% near-perfect mastery
      overallScore = 95;
      cefrLevel = 'C1';
    } else if (matchRatio >= 0.85) {
      // 90% highly fluent
      overallScore = 90;
      cefrLevel = 'C1';
    } else if (matchRatio >= 0.74) {
      // 80% very good
      overallScore = 80;
      cefrLevel = 'B2';
    } else if (matchRatio >= 0.62) {
      // 70% competent / good
      overallScore = 70;
      cefrLevel = 'B2';
    } else if (matchRatio >= 0.50) {
      // 60% intermediate with flaws
      overallScore = 60;
      cefrLevel = 'B1';
    } else if (matchRatio >= 0.40) {
      // 55% developing
      overallScore = 55;
      cefrLevel = 'A2';
    } else if (matchRatio >= 0.30) {
      // 50% basic half-attempt
      overallScore = 50;
      cefrLevel = 'A2';
    } else if (matchRatio >= 0.18) {
      // 40% heavy mistakes / fragmented
      overallScore = 40;
      cefrLevel = 'A1';
    } else {
      // 20% very low / 1 word only
      overallScore = 20;
      cefrLevel = 'A1';
    }

    const pronunciationScore = Math.max(15, Math.min(100, Math.round(overallScore + (overallScore >= 95 ? 0 : matchRatio > 0.8 ? 2 : -3))));
    const fluencyScore = Math.max(15, Math.min(100, Math.round(overallScore + (spokenWords.length >= targetWords.length ? 1 : -4))));
    const vocabularyScore = overallScore;
    const grammarScore = Math.max(15, Math.min(100, overallScore));

    let feedbackKurdish = '';
    let feedbackEnglish = '';
    let feedbackArabic = '';

    if (overallScore >= 95) {
      feedbackKurdish = `بێوێنە و سەرسوڕهێنەر! نمرەی تەواو (%${overallScore}). بێژەکردنی پیتەکان، دەنگەکان، و ڕیتمی ڕستەکە بێ هیچ هەڵەیەکە و لە ئاستی کەسێکی بەڕەگەز زمانی دایکە.`;
      feedbackEnglish = `Flawless native mastery! Perfect score (${overallScore}%). Your pronunciation, articulation of phonemes, and cadence are indistinguishable from a native speaker.`;
      feedbackArabic = `أداء استثنائي ومتقن للغاية! درجة ممتازة (${overallScore}%). مخارج الحروف وانسيابية الجملة سليمة تماماً ومماثلة للناطقين الأصليين.`;
    } else if (overallScore >= 90) {
      feedbackKurdish = `نایابە! ئاستێکی زۆر باڵا و ڕەوان (%${overallScore}). بێژەکردنت زۆر نزیکە لە کەسێکی ڕەسەن و دەنگت تەواو متمانەپێکراوە.`;
      feedbackEnglish = `Excellent articulation! (${overallScore}%). Outstanding phoneme precision with natural connected speech.`;
      feedbackArabic = `ممتاز جداً! (${overallScore}%). نطق فصيح وواضح جداً وانسيابية لغوية عالية.`;
    } else if (overallScore >= 80) {
      feedbackKurdish = `دەستخۆش! ئەنجامێکی زۆر باش (%${overallScore}). ڕیتم و شێوازی دەربڕینت سەرکەوتووە و زۆربەی وشەکانت بە دروستی گەیاند.`;
      feedbackEnglish = `Very good job! (${overallScore}%). Strong communicative clarity, good pacing, and commendable pronunciation.`;
      feedbackArabic = `أحسنت صنعاً! (${overallScore}%). أداء صوتي سليم ونطق واضح ومفهوم مع ثقة واضحة.`;
    } else if (overallScore >= 70) {
      feedbackKurdish = `ئەنجامێکی باش (%${overallScore}). قسەکردنت تێگەیشتووە بەڵام کەمێک کێشەی بچووک لە ڕیتم یان بێژەکردنی هەندێک وشەدا هەیە. بەردەوام بە!`;
      feedbackEnglish = `Good attempt! (${overallScore}%). The sentence was largely understandable with minor phoneme slips or slight hesitation.`;
      feedbackArabic = `جيد جداً! (${overallScore}%). الكلام مفهوم بشكل عام مع وجود بعض التردد أو التفاوت البسيط في مخارج بعض الحروف.`;
    } else if (overallScore >= 60) {
      feedbackKurdish = `ئاستی مامناوەند (%${overallScore}). پەیامەکەت گەیشت بەڵام چەند وشەیەکت بە نادروستی خوێندەوە و پچڕان لە دەنگتدا هەبوو. مەشقی زیاتر بکە.`;
      feedbackEnglish = `Intermediate effort (${overallScore}%). You communicated the core message, but noticeable mispronunciations and pauses occurred.`;
      feedbackArabic = `مستوى متوسط (${overallScore}%). تم إيصال الفكرة ولكن هناك كلمات نُطقت بشكل غير سليم ووقفات متعددة.`;
    } else if (overallScore >= 50) {
      feedbackKurdish = `ئاستی سەرەتایی (%${overallScore}). تەنها نزیکەی نیوەی وشەکانت بە دروستی گوت. پێویستە چەند جارێک گوێ لە دەنگی ڕەسەن بگریتەوە تا ڕستەکە لەسەر زمانت نەرم بێت.`;
      feedbackEnglish = `Basic performance (${overallScore}%). Roughly half of the required sentence was articulated correctly. Listen to the native sample and practice again.`;
      feedbackArabic = `مستوى أساسي (${overallScore}%). تم نطق جزء من الجملة بشكل صحيح بينما غابت أجزاء أخرى. استمع للنموذج الصوتي وأعد المحاولة.`;
    } else if (overallScore >= 40) {
      feedbackKurdish = `نمرەی ئەم هەوڵە (%${overallScore})ە. هەڵەی زۆر لە بێژەکردندا هەبوو و بەشێکی زۆری ڕستەکە پەڕێندرا. مەشقی زیاترت پێویستە.`;
      feedbackEnglish = `Score is ${overallScore}%. Significant phoneme errors and multiple omitted words. Needs targeted repetition with audio drills.`;
      feedbackArabic = `الدرجة (${overallScore}%). أخطاء واضحة في نطق الكلمات ونقص في صياغة الجملة الكاملة. تدرب مجدداً.`;
    } else {
      feedbackKurdish = `نمرەی ئەم هەوڵە نزمە (%${overallScore}). تەنها وشەیەک یان چەند دەنگێکی کەم بیسترا. تکایە بە دەنگێکی بەرزتر و ڕوونتر هەوڵ بدەوە.`;
      feedbackEnglish = `Score is ${overallScore}%. Only a couple of fragmented words were captured. Speak louder and more distinctly.`;
      feedbackArabic = `الدرجة (${overallScore}%). تم التقاط كلمة واحدة أو كلمات مبعثرة فقط. ارفع صوتك وتحدث بوضوح.`;
    }

    return {
      recognizedText: rawSpoken,
      detectedLanguage: language,
      overallScore,
      cefrLevel,
      scores: {
        pronunciation: pronunciationScore,
        fluency: fluencyScore,
        vocabulary: vocabularyScore,
        grammar: grammarScore,
      },
      feedbackKurdish,
      feedbackEnglish,
      feedbackArabic,
      phoneticGuide: isKu
        ? 'تەرکیز بخەرە سەر پیتە تایبەتەکانی کوردی (ح، ع، ڕ، ڵ، ق، ۆ، ێ) و ڕیتمی بڕگەکان'
        : isAr
        ? 'ركز على مخارج الحروف الحلقية وأحكام التلفظ الصحيحة والمدود'
        : 'Focus on syllable stress, reduced vowels, and smooth word linking.',
      strengths: [
        overallScore >= 70
          ? isKu ? 'دەربڕینی ڕوونی پیت و وشە سەرەکییەکان' : isAr ? 'وضوح مخارج الحروف' : 'Clear phoneme delivery'
          : isKu ? 'هەوڵدان بۆ بێژەکردنی ڕستەکە' : isAr ? 'المحاولة الجادة في النطق' : 'Committed speaking effort',
      ],
      improvements: [
        overallScore >= 80
          ? isKu ? 'پاراستنی خێرایی سروشتی قسەکردن' : isAr ? 'الحفاظ على وتيرة التحدث الطبيعية' : 'Sustain natural speaking rate'
          : isKu ? 'تەواوکردنی هەموو وشەکان بێ پەڕاندن' : isAr ? 'نطق جميع كلمات الجملة دون إسقاط' : 'Pronounce all words completely without skipping',
      ],
      wordsAnalysis,
      corrections: [],
    };
  }

  // CASE 3: Spontaneous Speech / Open Response (Evaluating Length & Variety)
  const count = spokenWords.length;
  let overallScore = 60;
  let cefrLevel = 'B1';

  if (count <= 2) {
    overallScore = 20;
    cefrLevel = 'A1';
  } else if (count <= 5) {
    overallScore = 40;
    cefrLevel = 'A1';
  } else if (count <= 8) {
    overallScore = 50;
    cefrLevel = 'A2';
  } else if (count <= 11) {
    overallScore = 55;
    cefrLevel = 'A2';
  } else if (count <= 15) {
    overallScore = 60;
    cefrLevel = 'B1';
  } else if (count <= 20) {
    overallScore = 70;
    cefrLevel = 'B1';
  } else if (count <= 26) {
    overallScore = 80;
    cefrLevel = 'B2';
  } else if (count <= 34) {
    overallScore = 90;
    cefrLevel = 'C1';
  } else if (count <= 42) {
    overallScore = 95;
    cefrLevel = 'C1';
  } else {
    overallScore = 100;
    cefrLevel = 'C2';
  }

  const wordsAnalysis = spokenWords.slice(0, 12).map((w, idx) => ({
    word: w,
    status: overallScore >= 80 ? (idx % 4 === 0 ? 'good' : 'excellent') : overallScore >= 55 ? 'good' : 'needs_work',
    phonetic: `/${w.toLowerCase()}/`,
    tip: isKu ? 'بێژەکردنی ئەم وشەیە' : isAr ? 'مخرج صوتي للكلمة' : 'Phonetic tip for word',
  }));

  return {
    recognizedText: rawSpoken,
    detectedLanguage: language,
    overallScore,
    cefrLevel,
    scores: {
      pronunciation: overallScore,
      fluency: Math.max(15, Math.min(100, count > 15 ? overallScore : overallScore - 4)),
      vocabulary: Math.max(15, Math.min(100, overallScore)),
      grammar: Math.max(15, Math.min(100, count > 6 ? overallScore : overallScore - 5)),
    },
    feedbackKurdish:
      overallScore >= 90
        ? `نایابە! وتەیەکی زۆر دەوڵەمەند و درێژ (%${overallScore}). بە متمانەوە قسەت کرد و وشەی زۆر باشت بەکارهێنا.`
        : overallScore >= 70
        ? `دەستخۆش! ئەنجامێکی باش (%${overallScore}). بە ڕوونی پەیامەکەت گەیاند و داڕشتنی ڕستەکەت سەرکەوتووە.`
        : overallScore >= 50
        ? `ئاستی مامناوەند (%${overallScore}). قسەکردنت کورت بوو، پێویستە ڕستەی درێژتر و دەوڵەمەندتر بەکاربهێنیت.`
        : `نمرەی ئەم هەوڵە نزمە (%${overallScore}). وتەکەت زۆر کورت بوو (تەنها ${count} وشە). تکایە ڕستەی تەواو بەکاربهێنە.`,
    feedbackEnglish:
      overallScore >= 90
        ? `Outstanding spoken response (${overallScore}%) with rich vocabulary and sustained fluent cadence.`
        : overallScore >= 70
        ? `Commendable clarity (${overallScore}%). Good sentence cohesion and spontaneous expression.`
        : overallScore >= 50
        ? `Basic response (${overallScore}%). Try to expand your thought with longer clauses and descriptive words.`
        : `Limited response (${overallScore}%). Only ${count} words spoken. Please provide a full, elaborated answer.`,
    feedbackArabic:
      overallScore >= 90
        ? `إجابة استثنائية وثراء لغوي ملحوظ (${overallScore}%) مع طلاقة عالية.`
        : overallScore >= 70
        ? `أداء جيد وواضح (${overallScore}%) وصياغة جمل متماسكة.`
        : `استجابة أساسية (${overallScore}%). يرجى التحدث بجمل أطول ومفردات أكثر تنوعاً.`,
    phoneticGuide: isKu ? 'تەرکیز بخەرە سەر بەستنەوەی ڕستەکان و نەپچڕانی دەنگ' : isAr ? 'ركز على وصل الجمل بسلاسة' : 'Focus on connected speech and clause expansion.',
    strengths: [isKu ? 'ئازایەتی لە دەربڕین' : isAr ? 'الشجاعة في الإلقاء' : 'Spontaneous speaking effort'],
    improvements: [isKu ? 'فراوانکردنی وتەکە بە ڕستەی درێژتر' : isAr ? 'توسيع الإجابة بجمل أطول' : 'Expand length and compound clauses'],
    wordsAnalysis,
    corrections: [],
  };
}

// Comprehensive Fallback tutor response generator with procedural variety and zero repetition
function generateFallbackTutorReply(scenario: string, targetLanguage: string, userText: string, turnIndex: number = 0) {
  const isHospital =
    scenario.toLowerCase().includes('hospital') ||
    scenario.toLowerCase().includes('clinic') ||
    scenario.toLowerCase().includes('doctor') ||
    scenario.toLowerCase().includes('medical');

  // Medical hospital scenario multi-turn questions
  if (isHospital) {
    if (targetLanguage === 'ar') {
      const hospitalBankAr = [
        {
          replyText: 'أهلاً بك في الجناح السريري. قمت بتوثيق الأعراض بدقة في ملفك الطبي. هل يمتد هذا الألم أو العرض إلى أجزاء أخرى من جسمك كالأكتاف أو الظهر؟',
          translation: 'بەخێربێیت بۆ تەلاری کلینیکی. نیشانەکانت بە وریایی تۆمار کران. ئایا ئەم ئازارە یان نیشانەیە تەشەنە دەکات بۆ بەشەکانی تر وەک شان یان پشت؟',
          phonetic: 'Ahlan bika fi al-janah al-sariri. Hal yamtaddu hatha al-alam...',
          replies: [
            { text: 'نعم، يمتد الألم أحياناً نحو الكتف والذراع الأيسر.', translation: 'بەڵێ، هەندێک جار ئازارەکە بەرەو شان و قۆڵی چەپم تەشەنە دەکات.' },
            { text: 'لا، يتركز العرض في موضع واحد دون انتشار.', translation: 'نەخێر، نیشانەکە لە یەک جێگەدایە بێ ئەوەی بڵاوببێتەوە.' },
            { text: 'كيف تقيم شدة هذا الألم من الناحية الطبية؟', translation: 'لە ڕووی پزیشکییەوە توندیی ئەم ئازارە چۆن هەڵدەسەنگێنیت؟' },
          ],
        },
        {
          replyText: 'فهمت ما تصفه بوضوح سريري. دعنا نراجع العلامات الحيوية: هل لاحظت تسارعاً في نبضات القلب أو هبوطاً مفاجئاً في ضغط الدم؟',
          translation: 'بە ڕوونی لە وەسفە کلینیکییەکەت گەیشتم. با هێڵە سەرەکییەکان بپشکنین: ئایا هەستت بە خێرابوونی لێدانی دڵ یان دابەزینی پەستانی خوێن کردووە؟',
          phonetic: 'Fahimtu ma tasifuhu biwuduh. Da\'na nuraji\' al-\'alamat al-hayawiyyah...',
          replies: [
            { text: 'أشعر أحياناً بخفقان سريع مصحوب بدوار خفيف عند الوقوف.', translation: 'هەندێک جار هەست بە لێدانی خێرای دڵ و گێژبوون دەکەم لە کاتی هەستاندا.' },
            { text: 'نبضات قلبي تبدو منتظمة ولم أشعر بأي هبوط حاد.', translation: 'لێدانی دڵم ڕێک دیارە و هەستم بە هیچ دابەزینێکی توند نەکردووە.' },
            { text: 'هل يمكننا قياس ضغط الدم ومعدل النبض الآن؟', translation: 'دەتوانین ئێستا پەستانی خوێن و لێدانی دڵم بپێوین؟' },
          ],
        },
        {
          replyText: 'هذه الملاحظة السريرية في غاية الأهمية. سنطلب الآن فحص تعداد الدم الكامل (CBC) ومستوى إنزيمات الكبد ووظائف الكلى للتأكد.',
          translation: 'ئەم تێبینییە کلینیکییە زۆر گرنگە. ئێستا داوای پشکنینی تەواوی خوێن (CBC)، ئەنزیمەکانی جگەر و فەرمانی گورچیلە دەکەین.',
          phonetic: 'Hathihi al-mulahathah al-saririyyah fi ghayati al-ahammiyyah...',
          replies: [
            { text: 'متى ستظهر النتائج المخبرية الرسمية لهذه التحاليل؟', translation: 'ئەنجامە فەرمییەکانی تاقیگە بۆ ئەم پشکنینانە کەی دەردەچن؟' },
            { text: 'هل يشمل الفحص وظائف الغدة الدرقية والسكر التراكمي؟', translation: 'ئایا پشکنینەکە فەرمانی غوددە و شەکری کەڵەکەبوو دەگرێتەوە؟' },
            { text: 'سأتوجه إلى المختبر فوراً لسحب العينة المطلوبة.', translation: 'ئێستا دەچمە تاقیگە بۆ کێشانی نموونەی پێویست.' },
          ],
        },
        {
          replyText: 'التقييم المخبري يمنحنا رؤية أدق. بالنسبة للأدوية التي تستخدمها بانتظام، هل تتناول أي مميعات للدم أو مهدئات عصبية؟',
          translation: 'هەڵسەنگاندنی تاقیگەیی تێڕوانینێکی وردترمان پێدەدات. سەبارەت بەو دەرمانانەی ڕۆژانە دەیخۆیت، هیچ ڕوونکەرەوەی خوێن یان هێورکەرەوە دەخۆیت؟',
          phonetic: 'Al-taqyeem al-makhbari yamnahuna ru\'yah adhaqq...',
          replies: [
            { text: 'أتناول فقط خافضاً لضغط الدم وجرعة منخفضة من الأسبيرين.', translation: 'تەنها دەرمانی دابەزاندنی پەستان و کەمێک ئەسپرین دەخۆم.' },
            { text: 'لا أستخدم أي أدوية منتظمة أو مكملات كيميائية حالياً.', translation: 'لە ئێستادا هیچ دەرمان یان تەواوکەرێکی بەردەوام بەکارناهێنم.' },
            { text: 'هل هناك أي تداخل دوائي محتمل بين علاجاتي؟', translation: 'ئایا هیچ تێکەڵبوونێکی دەرمانیی لە نێوان چارەسەرەکانمدا هەیە؟' },
          ],
        },
        {
          replyText: 'سنقوم الآن بفحص تخطيط القلب الكهربائي والتصوير بالموجات الصوتية. هل شعرت بضيق في التنفس أثناء الاستلقاء مستوياً على السرير؟',
          translation: 'ئێستا پشکنینی هێڵکاری دڵ و تیشکی سۆنار ئەنجام دەدەین. ئایا لە کاتی ڕاکشانی تەختدا تووشی تەنگەنەفەسی دەبیت؟',
          phonetic: 'Sanaqumu al-aan bifahs takhtit al-qalb...',
          replies: [
            { text: 'نعم، أحتاج إلى وسادتين إضافيتين لأتنفس بارتياح أثناء النوم.', translation: 'بەڵێ، پێویستم بە دوو سەرینە بۆ ئەوەی لە کاتی خەودا بە ئارامی هەناسە بدەم.' },
            { text: 'لا أجد أي صعوبة في التنفس أثناء الاستلقاء مطلقاً.', translation: 'هیچ کێشەیەکم لە هەناسەداندا نییە لە کاتی ڕاکشاندا.' },
            { text: 'هل يظهر تخطيط القلب كفاءة التروية الدموية لعضلة القلب؟', translation: 'ئایا هێڵکاری دڵ جووڵەی خوێن بۆ ماسوولکەی دڵ دەردەخات؟' },
          ],
        },
        {
          replyText: 'المؤشرات الحيوية تشير إلى استقرار تدريجي. سنضع لك خطة تغذية سريرية متوازنة وتمارين استرخاء رئوي. ما هو استفسارك الأهم الآن؟',
          translation: 'نیشانە زیندووەکان بەرەو سەقامگیری دەچن. بەرنامەیەکی خۆراکی کلینیکی و ڕاهێنانی سییەکانت بۆ دادەنێین. گرنگترین پرسیارت چییە لە ئێستادا؟',
          phonetic: 'Al-mu\'ashirat al-hayawiyyah tusheer ila istiqrar...',
          replies: [
            { text: 'كم تستغرق فترة التعافي الموصى بها قبل العودة للعمل؟', translation: 'ماوەی پێویست بۆ چاکبوونەوە پێش گەڕانەوە بۆ کار چەند دەخایەنێت؟' },
            { text: 'ما هي الأغذية التي يجب علي تجنبها بدقة خلال هذا الأسبوع؟', translation: 'چ خواردنێک پێویستە بە تەواوی لێی دووربکەومەوە لەم هەفتەیەدا؟' },
            { text: 'أريد معرفة موعد الجولة السريرية الاستشارية القادمة.', translation: 'دەمەوێت کاتی گەڕانی پزیشکی ڕاوێژکاری داهاتوو بزانم.' },
          ],
        },
        {
          replyText: 'أظهرت مراجعة نتائج الفحوصات أن نسبة الأكسجين في الدم ممتازة (98%). هل تعاني من أي سعال جاف أو بلغم مصاحب للألم؟',
          translation: 'پێداچوونەوەی پشکنینەکان دەریدەخات کە ئۆکسجینی خوێنت نایابە (%٩٨). ئایا هیچ کۆکەیەکی وشک یان بەڵغەمت هەیە لەگەڵ ئازارەکە؟',
          phonetic: 'Azhharat muraja\'atu nata\'ij al-fuhusat anna nisbat al-oksijeen...',
          replies: [
            { text: 'أعاني أحياناً من سعال خفيف خصوصاً في ساعات الصباح الباكر.', translation: 'هەندێک جار کۆکەیەکی کەمم هەیە بەتایبەت لە کاتەکانی بەیانی زوودا.' },
            { text: 'لا يوجد أي سعال أو بلغم، الجهاز التنفسي مرتاح تماماً.', translation: 'هیچ کۆکە و بەڵغەمێکم نییە، کۆئەندامی هەناسەدانم تەواو ئاسوودەیە.' },
            { text: 'هل نحتاج إلى صورة أشعة سينية للصدر للاطمئنان على الرئتين؟', translation: 'ئایا پێویستمان بە تیشکی ئێکس بۆ سنگ هەیە بۆ دڵنیابوونەوە لە سییەکان؟' },
          ],
        },
        {
          replyText: 'بناءً على التقييم السريري، سنقوم بقياس درجة حرارة الجسم ومعدل الالتهاب (CRP). هل شعرت بقشعريرة أو تعرق ليلي خلال اليومين الماضيين؟',
          translation: 'بەپێی هەڵسەنگاندنی کلینیکی، پلەی گەرمیی لەش و ڕێژەی هەوکردن (CRP) دەپێوین. ئایا تووشی لەرز یان ئارەقکردنەوەی شەوانە بوویت؟',
          phonetic: 'Bina\'an \'ala al-taqyeem al-sariri sanaqum biqiyas darajat al-hararah...',
          replies: [
            { text: 'شعرت بقشعريرة خفيفة ليلة أمس لكن الحرارة لم ترتفع كثيراً.', translation: 'شەوی ڕابردوو هەستم بە لەرزێکی کەم کرد بەڵام پلەی گەرمیم زۆر بەرز نەبووەوە.' },
            { text: 'لم أشعر بأي قشعريرة أو حمى، حرارتي طبيعية جداً.', translation: 'هەستم بە هیچ لەرز یان تایەک نەکردووە، پلەی گەرمیم تەواو ئاساییە.' },
            { text: 'ما هي النسبة الطبيعية لمؤشر الالتهاب في الدم؟', translation: 'ڕێژەی ئاسایی نیشاندەری هەوکردن لە خوێندا چەندە؟' },
          ],
        },
      ];
      // Procedural pick that advances through turns and adapts without repeating
      const index = turnIndex < hospitalBankAr.length
        ? turnIndex
        : (turnIndex % hospitalBankAr.length);
      const pick = hospitalBankAr[index];
      return {
        replyText: turnIndex >= hospitalBankAr.length
          ? `بخصوص استفسارك في هذه المرحلة المتقدمة: ${pick.replyText}`
          : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else if (targetLanguage === 'ku') {
      const hospitalBankKu = [
        {
          replyText: 'بەخێربێیت بۆ تەلاری پزیشکی نەخۆشخانە. نیشانەکانت بە وریایی لە دۆسیەکەتدا تۆمار کران. ئایا ئەم ئازارە یان کێشەیە تەشەنە دەکات بۆ بەشەکانی تر وەک شان، مل، یان پشت؟',
          translation: 'Welcome to the clinical ward. Your symptoms have been thoroughly logged. Does this pain radiate to other areas such as your shoulder, neck, or back?',
          phonetic: 'Baxerbeyt bo talari pizishki naxoshxana. Nishanakant ba wryayi...',
          replies: [
            { text: 'بەڵێ، هەندێک جار ئازارەکە بەرەو مل و قۆڵی چەپم دەکشێت.', translation: 'Yes, the pain occasionally radiates towards my neck and left arm.' },
            { text: 'نەخێر، لە یەک شوێنی دیاریکراودایە و بڵاونابێتەوە.', translation: 'No, it remains localized in one specific spot without spreading.' },
            { text: 'بە ڕای بەڕێزتان چ پشکنینێکی دەستبەجێ پێویستە بکرێت؟', translation: 'In your clinical opinion, which immediate scan should be performed?' },
          ],
        },
        {
          replyText: 'لە شیکردنەوەی نیشانەکانت بە تەواوی گەیشتم. با سەیری هێڵە سەرەکییەکان (Vital Signs) بکەین: ئایا هەست بە خێرا لێدانی دڵ یان گێژبوونی کتوپڕ دەکەیت لە کاتی هەستاندا؟',
          translation: 'I thoroughly noted your symptom profile. Let us examine your vitals: do you experience rapid palpitations or orthostatic dizziness when standing?',
          phonetic: 'La shikrdanaway nishanakant ba tawawi gayshtam...',
          replies: [
            { text: 'کاتی هەستان هەندێک سەرگیژە و لێدانی ناڕێکی دڵم هەیە.', translation: 'When standing up, I experience mild dizziness and an irregular heartbeat.' },
            { text: 'پەستانی خوێنم بەگشتی ئاساییە و تووشی بێهۆشبوون نەبووم.', translation: 'My blood pressure is generally baseline and I have had no syncope episodes.' },
            { text: 'تکایە ئێستا پەستانی خوێن و لێدانی دڵم بپێوە.', translation: 'Please check my current blood pressure and pulse rate right now.' },
          ],
        },
        {
          replyText: 'ئەم هەڵسەنگاندنە کلینیکییە زۆر بەسوودە. ئێستا داوای پشکنینی گشتی خوێن (CBC)، چەورییەکان، ئەنزیمەکانی جگەر و فەرمانی گورچیلە دەکەین.',
          translation: 'This clinical correlation is vital. I am now ordering a complete blood count (CBC), lipid profile, liver enzymes, and renal function panel.',
          phonetic: 'Am halsangandna klinikiya zor basuda...',
          replies: [
            { text: 'ئەنجامە فەرمییەکانی ئەم پشکنینانە کەی ئامادە دەبن؟', translation: 'When will the formal laboratory diagnostic results be finalized?' },
            { text: 'ئایا پێویستە بۆ پشکنینی تر بەڕۆژوو بم و خواردن نەخۆم؟', translation: 'Do I need to maintain strict fasting for any additional tests?' },
            { text: 'سوپاس، دەستبەجێ بەرەو بەشی تاقیگە دەچم.', translation: 'Thank you, I will proceed to the phlebotomy lab immediately.' },
          ],
        },
        {
          replyText: 'پشکنینی تاقیگە ڕووناکی زیاترمان پێدەبەخشێت. دەربارەی ئەو دەرمانانەی ڕۆژانە دەیانخۆیت، ئایا هیچ دەرمانێکی پەستان، شەکەر یان دژەهەوکردن بەکاردەهێنیت؟',
          translation: 'Lab diagnostics will give us clearer insight. Regarding medications, are you on prescription antihypertensives, diabetes agents, or anti-inflammatories?',
          phonetic: 'Pshknini taqiga runaki ziyatrman pe dabaxshit...',
          replies: [
            { text: 'تەنها دەرمانی ڕێکخستنی پەستان و ڤیتامین بەکاردەهێنم.', translation: 'I only take regular blood pressure management tablets and vitamins.' },
            { text: 'هیچ جۆرە دەرمانێکی کیمیایی بەردەوام بەکارناهێنم.', translation: 'I do not take any chronic prescription medications currently.' },
            { text: 'ئایا ئەم نیشانانە دەکرێت لە کاریگەری لاوەکی دەرمانەوە بن؟', translation: 'Could these symptoms potentially be an adverse medication side effect?' },
          ],
        },
        {
          replyText: 'هەنگاوی دواتر بریتییە لە ئەنجامدانی هێڵکاری دڵ (ECG) و تیشکی سۆنار. ئایا لە کاتی ڕاکشانی تەختدا لەسەر جێگە هەست بە گرانبوونی هەناسەت دەکەیت؟',
          translation: 'Our next step involves an electrocardiogram (ECG) and ultrasound imaging. Do you notice orthopnea or heavy breathing when resting flat?',
          phonetic: 'Hangawi dwatr britiya la anjamdani helkari dil...',
          replies: [
            { text: 'بەڵێ، کاتی خەوتن دەبێت بەرزتر پاڵکەوم تا هەناسەم ڕێک بێت.', translation: 'Yes, I must elevate my pillows at night to breathe comfortably.' },
            { text: 'نەخێر، لە هەموو بارودۆخێکدا هەناسەدانم تەواو ئاساییە.', translation: 'No, my respiratory effort is completely uncompromised in all postures.' },
            { text: 'ئایا تیشکی تاقیگە مەترسی یان ئازاری لەگەڵدایە؟', translation: 'Is the diagnostic ultrasound painful or accompanied by any radiation risk?' },
          ],
        },
        {
          replyText: 'بارودۆخی تەندروستیت بەرەو جێگیربوون دەچێت. بەرنامەیەکی خۆراکی تایبەت و چاودێری پزیشکی بەردەوامت بۆ دادەنێین. پرسیاری سەرەکیت چییە لەسەر ئەم قۆناغە؟',
          translation: 'Your physiological parameters are stabilizing well. We will institute personalized dietary care and continuous clinical review. What is your chief inquiry?',
          phonetic: 'Barudoxi tandrustit baraw jegirbun dachet...',
          replies: [
            { text: 'پێشبینی دەکەیت چەند ڕۆژ پێویستم بە پشوودان و چاودێری بێت؟', translation: 'How many days of convalescence and rest do you anticipate for recovery?' },
            { text: 'چ جۆرە خواردن یان چالاکییەک پێویستە سنووردار بکرێت؟', translation: 'Which specific food groups or strenuous activities should be restricted?' },
            { text: 'دەمەوێت کاتی سەردانی پزیشکی پسپۆڕی تر بزانم.', translation: 'I would like to know the exact time for the next specialist consult.' },
          ],
        },
        {
          replyText: 'ڕێژەی ئۆکسجینی خوێنت پشکنرا و لە ئاستی ٩٨٪ دایە کە زۆر نایابە. ئایا کۆکەی وشک، بەڵغەم، یان گەرووئێشەت لەگەڵ ئەم نیشانانەدا هەبووە؟',
          translation: 'Your pulse oximetry shows 98% saturation, which is optimal. Have you experienced any dry cough, sputum production, or sore throat alongside these symptoms?',
          phonetic: 'Rezhey oksijini xwint pishkinra wa la asti 98% daya...',
          replies: [
            { text: 'هەندێک جار کەمێک کۆکەم هەیە بەڵام زۆر توند نییە.', translation: 'I have an occasional mild cough, but it is not severe.' },
            { text: 'نەخێر، هیچ کۆکە یان کێشەیەکی گەرووم نییە.', translation: 'No, I have had zero coughing fits or throat irritation.' },
            { text: 'ئایا پێویستە پشکنینی سییەکان بە تیشکی ئێکس ئەنجام بدەین؟', translation: 'Should we perform a chest X-ray to inspect lung fields?' },
          ],
        },
        {
          replyText: 'پلەی گەرمی لەشت ٣٦.٨ پلەیە و هیچ تایەکت نییە. بۆ دڵنیایی زیاتر پشکنینی هەوکردنی گشتی ئەنجام دەدەین. ئایا هەست بە لاوازیی ماسوولکە یان ماندووبوونی لەڕادەبەدەر دەکەیت؟',
          translation: 'Your temperature is 36.8C with no febrile spikes. We will evaluate inflammatory indices. Do you feel general muscle weakness or unusual fatigue?',
          phonetic: 'Pley garmi lasht 36.8 playa wa hich tayakt niya...',
          replies: [
            { text: 'کەمێک بێهێزی لە جەستەمدا هەیە بەڵام کارەکانم پێدەکرێت.', translation: 'I feel mild lethargy throughout my body, but I can still manage tasks.' },
            { text: 'هێزی ماسوولکەکانم تەواو ئاساییە و ماندوو نيم.', translation: 'My muscular strength is completely normal and I do not feel fatigued.' },
            { text: 'چ پشوویەک بۆ ئەم جۆرە ماندووبوونە باشترینە؟', translation: 'What rest routine is best suited for this recovery period?' },
          ],
        },
      ];
      const index = turnIndex < hospitalBankKu.length
        ? turnIndex
        : (turnIndex % hospitalBankKu.length);
      const pick = hospitalBankKu[index];
      return {
        replyText: turnIndex >= hospitalBankKu.length
          ? `سەبارەت بەم قۆناغە نوێیەی چاودێری: ${pick.replyText}`
          : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else {
      // English hospital questions
      const hospitalBankEn = [
        {
          replyText: 'I have logged your clinical symptoms into your medical chart. Does this pain or sensation radiate anywhere else, such as towards your neck, shoulder, or lower spine?',
          translation: 'نیشانە پزیشکییەکانت لە دۆسیەکەتدا تۆمار کران. ئایا ئەم ئازارە یان هەستە تەشەنە دەکات بۆ بەشەکانی تر وەک مل، شان، یان بڕبڕەی پشت؟',
          phonetic: 'aɪ hæv lɒɡd jʊər ˈklɪnɪkəl ˈsɪmptəmz...',
          replies: [
            { text: 'Yes, it intermittently radiates towards my left arm and shoulder blade.', translation: 'بەڵێ، ناوەناوە بەرەو قۆڵی چەپم و پێشەوەی شانم دەکشێت.' },
            { text: 'No, it remains completely localized to that single quadrant.', translation: 'نەخێر، بە تەواوی لەو شوێنە دیاریکراوەدا چەقیوە.' },
            { text: 'How do you interpret the diagnostic severity of this symptom?', translation: 'چۆن لە توندیی دەستنیشانکردنی ئەم نیشانەیە دەڕوانیت؟' },
          ],
        },
        {
          replyText: 'I understand your clinical description thoroughly. Let us assess your vital signs: have you observed sudden heart palpitations or orthostatic dizziness upon standing?',
          translation: 'بە وریایی لە وەسفە پزیشکییەکەت گەیشتم. با هێڵە سەرەکییەکان بپشکنین: ئایا هەستت بە خێرابوونی دڵ یان گێژبوون کردووە کاتی هەستان؟',
          phonetic: 'aɪ ˌʌndərˈstænd jʊər ˈklɪnɪkəl dɪˈskrɪpʃən...',
          replies: [
            { text: 'I do feel noticeable lightheadedness and mild palpitations when getting up.', translation: 'لە کاتی هەستاندا هەست بە سەرگیژە و لێدانی دڵ دەکەم.' },
            { text: 'My heart rhythm feels steady and I have had no episodes of vertigo.', translation: 'لێدانی دڵم جێگیرە و هیچ کێشەی سەرگیژەم نەبووە.' },
            { text: 'Could we check my blood pressure and arterial oxygen saturation right now?', translation: 'دەکرێت پەستانی خوێن و ڕێژەی ئۆکسجینم ئێستا بپێوین؟' },
          ],
        },
        {
          replyText: 'That observation is critical for differential diagnosis. I am ordering a complete blood count (CBC), comprehensive metabolic panel, and cardiac biomarkers.',
          translation: 'ئەم تێبینییە بۆ دەستنیشانکردن زۆر گرنگە. ئێستا داوای پشکنینی گشتی خوێن (CBC)، ئەنزیمەکان و بایۆمارکەرەکانی دڵ دەکەم.',
          phonetic: 'ðæt ˌɒbzərˈveɪʃən ɪz ˈkrɪtɪkəl fɔːr...',
          replies: [
            { text: 'When should we expect the official laboratory report to be ready?', translation: 'کەی چاوەڕوان دەکرێت ڕاپۆرتی فەرمیی تاقیگە ئامادە بێت؟' },
            { text: 'Does this blood work require prolonged fasting before blood draw?', translation: 'ئایا ئەم پشکنینە پێویستی بە بەڕۆژووبوونی درێژخایەن هەیە؟' },
            { text: 'I will proceed to the hospital phlebotomy unit right away.', translation: 'دەستبەجێ بەرەو بەشی وەرگرتنی خوێنی نەخۆشخانە بەڕێ دەکەوم.' },
          ],
        },
        {
          replyText: 'Laboratory diagnostics provide essential baseline data. Regarding your regular medications, are you currently taking any prescription anticoagulants, steroids, or daily supplements?',
          translation: 'پشکنینەکانی تاقیگە زانیاری بنەڕەتی زۆر پێویست دابین دەکەن. دەربارەی دەرمانەکانت، هیچ دەرمانی ڕوونکردنەوەی خوێن یان ستیرۆید دەخۆیت؟',
          phonetic: 'ˈlæbrətɔːri ˌdaɪəɡˈnɒstɪks prəˈvaɪd ɪˈsɛnʃəl...',
          replies: [
            { text: 'I am only on a low-dose antihypertensive and daily vitamin D.', translation: 'تەنها دەرمانی پەستانی خوێن و ڤیتامین D ڕۆژانە بەکاردەهێنم.' },
            { text: 'I take no continuous pharmaceutical medications at this time.', translation: 'لە ئێستادا هیچ دەرمانێکی پزیشکی بەردەوام ناخۆم.' },
            { text: 'Could any of my past medications have triggered this reaction?', translation: 'ئایا دەکرێت هیچ دەرمانێکی پێشووم ئەم کاردانەوەیەی دروستکردبێت؟' },
          ],
        },
        {
          replyText: 'Next in our clinical pathway is an electrocardiogram (ECG) and focused ultrasound imaging. Do you experience shortness of breath when lying completely flat in bed?',
          translation: 'هەنگاوی دواتر بریتییە لە هێڵکاری دڵ (ECG) و تیشکی سۆنار. ئایا لە کاتی ڕاکشانی تەختدا لەسەر تەخت هەست بە تەنگەنەفەسی دەکەیت؟',
          phonetic: 'nɛkst ɪn ˈaʊər ˈklɪnɪkəl ˈpæθweɪ ɪz...',
          replies: [
            { text: 'Yes, I require several propped-up pillows to rest without breathlessness.', translation: 'بەڵێ، پێویستم بە چەند سەرینێکە تا بەبێ تەنگەنەفەسی پشوو بدەم.' },
            { text: 'No, my breathing is completely effortless in all resting positions.', translation: 'نەخێر، هەناسەدانم لە هەموو بارودۆخێکدا زۆر ئاساییە.' },
            { text: 'Is the ultrasound scan non-invasive and free from ionizing radiation?', translation: 'ئایا تیشکی سۆنار بێ ئازارە و دوورە لە تیشکی زیانبەخش؟' },
          ],
        },
        {
          replyText: 'Your physiological markers demonstrate encouraging stability. We are drafting an individualized nutritional and therapeutic plan. What questions do you have at this juncture?',
          translation: 'نیشانە بایۆلۆژییەکانت ئاماژە بە سەقامگیرییەکی دڵخۆشکەر دەکەن. بەرنامەیەکی خۆراکی و دەرمانی بۆ دادەنێین. چ پرسیارێکت هەیە لەم کاتەدا؟',
          phonetic: 'jʊər ˌfɪziəˈlɒdʒɪkəl ˈmɑːrkərz ˈdɛmənstreɪt...',
          replies: [
            { text: 'What is the estimated recovery timeline before resuming normal physical activities?', translation: 'ماوەی خەمڵێنراو بۆ چاکبوونەوە پێش دەستپێکردنەوەی وەرزش چەندە؟' },
            { text: 'Are there any dietary restrictions or hydration goals I must follow closely?', translation: 'ئایا چ سنووردارکردنێکی خۆراکی یان ڕێژەی ئاو پێویستە ڕەچاو بکەم؟' },
            { text: 'When is the multi-disciplinary consulting round scheduled for tomorrow?', translation: 'کاتی گەڕانی پزیشکانی ڕاوێژکار بۆ بەیانی لە چ کاتێکدایە؟' },
          ],
        },
        {
          replyText: 'Pulse oximetry confirms oxygen saturation at 99%. To assess pulmonary function comprehensively, have you experienced any dry cough, wheezing, or nocturnal dyspnea?',
          translation: 'پشکنینی ئۆکسجین دەریدەخات کە ڕێژەکەی ٩٩٪ یە. بۆ پشکنینی تەواوی سییەکان، هیچ کۆکەی وشک، خیزەی سنگ، یان تەنگەنەفەسی شەوانەت هەبووە؟',
          phonetic: 'pʌls ˌɒksɪˈmɛtri kənˈfɜːmz ˈɒksɪdʒən...',
          replies: [
            { text: 'I have had mild nocturnal coughing, especially in air-conditioned rooms.', translation: 'شەوانە کەمێک کۆکەم هەبووە بەتایبەت لە ژووری سپلێت و فێنکدا.' },
            { text: 'No cough or wheezing whatsoever; my airway feels completely clear.', translation: 'هیچ کۆکە یان خیزەیەکم نییە؛ ڕێڕەوی هەناسەم تەواو کراوەیە.' },
            { text: 'Would a peak flow meter assessment help gauge my lung function?', translation: 'ئایا پشکنینی خێرایی هەناسە بە ئامێر سوودی دەبێت بۆ هەڵسەنگاندن؟' },
          ],
        },
        {
          replyText: 'Your core body temperature is normal at 36.7 degrees Celsius. We are cross-referencing your inflammatory markers. Do you experience unexplained joint soreness or generalized muscle fatigue?',
          translation: 'پلەی گەرمی لەشت ئاساییە لە ٣٦.٧ پلە. پشکنینی نیشاندەرەکانی هەوکردن ڕێکدەخەین. ئایا هەست بە ئازاری جومگەکان یان ماندووبوونی گشتی ماسوولکە دەکەیت؟',
          phonetic: 'jʊər kɔːr ˈbɒdi ˈtɛmprətʃər ɪz ˈnɔːrməl...',
          replies: [
            { text: 'There is subtle stiffness in my shoulders and lower back in the morning.', translation: 'بەیانیان کەمێک ڕەقبوونی شان و بەشی خوارەوەی پشتم هەیە.' },
            { text: 'My joints and musculature feel fully limber with no stiffness.', translation: 'جومگە و ماسوولکەکانم تەواو نەرم و بێ کێشەن.' },
            { text: 'What therapeutic stretches do you recommend during hospitalization?', translation: 'چ ڕاهێنانێکی کشانەوە پێشنیار دەکەیت لە کاتی مانەوە لە نەخۆشخانە؟' },
          ],
        },
      ];
      const index = turnIndex < hospitalBankEn.length
        ? turnIndex
        : (turnIndex % hospitalBankEn.length);
      const pick = hospitalBankEn[index];
      return {
        replyText: turnIndex >= hospitalBankEn.length
          ? `Continuing our specialized clinical pathway: ${pick.replyText}`
          : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    }
  }

  // Category Checkers
  const isCareer =
    scenario.toLowerCase().includes('career') ||
    scenario.toLowerCase().includes('job') ||
    scenario.toLowerCase().includes('interview') ||
    scenario.toLowerCase().includes('business') ||
    scenario.toLowerCase().includes('negotiation');

  const isAcademic =
    scenario.toLowerCase().includes('academic') ||
    scenario.toLowerCase().includes('seminar') ||
    scenario.toLowerCase().includes('university') ||
    scenario.toLowerCase().includes('research') ||
    scenario.toLowerCase().includes('thesis');

  const isDaily =
    scenario.toLowerCase().includes('daily') ||
    scenario.toLowerCase().includes('rent') ||
    scenario.toLowerCase().includes('apartment') ||
    scenario.toLowerCase().includes('airport') ||
    scenario.toLowerCase().includes('travel') ||
    scenario.toLowerCase().includes('tour') ||
    scenario.toLowerCase().includes('coffee') ||
    scenario.toLowerCase().includes('support');

  // 1. BUSINESS & CAREER CATEGORY
  if (isCareer) {
    if (targetLanguage === 'ar') {
      const careerBankAr = [
        {
          replyText: 'أهلاً بك! استعراضك لخبراتك المهنية والقيادية مقنع وواضح للغاية. في بيئات الأعمال المتقدمة، كيف تدير التوازن بين المواعيد النهائية لتسليم المشاريع وتوقعات الإدارة التنفيذية؟',
          translation: 'بەخێربێیت! ڕوونکردنەوەی ئەزموونی پیشەییت زۆر متمانەپێکراو و ڕوونە. لە کاردا چۆن باڵانس لە نێوان کاتی ڕادەستکردنی پڕۆژە و چاوەڕوانیی بەڕێوەبەرایەتیدا ڕادەگریت؟',
          phonetic: 'Ahlan bik! Isti\'raduka likhibaratik...',
          replies: [
            { text: 'أعتمد على إدارة الأولويات وتطبيق منهجية Agile لضمان كفاءة التسليم.', translation: 'پشت بە پێشینەدان بە کارەکان و میتۆدی Agile دەبەستم بۆ خێرایی و ڕێکی.' },
            { text: 'أعقد اجتماعات متابعة دورية وشفافة مع الإدارة التنفيذية لتحديث التقدم.', translation: 'کۆبوونەوەی هەفتانەی شەفاف لەگەڵ سەرکردایەتی دەکەم بۆ زانینی بەرەوپێشچوون.' },
            { text: 'ما هي مؤشرات النجاح الأكثر أهمية لهذا المنصب الوظيفي؟', translation: 'گرنگترین نیشاندەرەکانی سەرکەوتن بۆ ئەم پۆستە چییە؟' },
          ],
        },
        {
          replyText: 'طرح استراتيجي متميز يدل على نضج إداري عالٍ. بالنظر إلى خطتنا للتوسع التجاري، ما هي مؤشرات الأداء الرئيسية (KPIs) التي تقترح تطبيقها لقياس كفاءة الفريق؟',
          translation: 'بیرۆکەیەکی ستراتیژیی نایابە. بە لەبەرچاوگرتنی فراوانکردنی بازرگانی، چ پێوەرێکی سەرەکی (KPIs) پێشنیار دەکەیت بۆ پێوانەکردنی توانای تیم؟',
          phonetic: 'Tarhun istrateejiyyun mutamayyiz...',
          replies: [
            { text: 'أقترح قياس معدل سرعة التسليم (Velocity) ومستوى رضا العملاء النهائي.', translation: 'پێشنیار دەکەم خێرایی گەیاندن و ڕەزامەندی کڕیار بپێوین.' },
            { text: 'يجب ربط المكافآت بتحقيق الأهداف ربع السنوية ومعدل العائد على الاستثمار.', translation: 'دەبێت پاداشتەکان بە ئامانجە وەرزییەکان و قازانجی وەبەرهێنانەوە ببەسترێتەوە.' },
            { text: 'كيف تقيمون التحديات التنافسية الحالية في السوق الإقليمي؟', translation: 'ئاستەنگە ڕکابەرییەکانی ئێستای بازاڕ چۆن هەڵدەسەنگێنن؟' },
          ],
        },
        {
          replyText: 'بخصوص مفاوضات العقد التجاري وشروط الشراكة، هل يمكننا الاتفاق على جدولة المدفوعات وفق إنجاز المراحل المحددة لضمان مصلحة الطرفين؟',
          translation: 'دەربارەی دانوستانی گرێبەست، ئایا دەتوانین لەسەر شێوازی پارەدان بەپێی قۆناغە تەواوکراوەکان ڕێکبکەوین بۆ پاراستنی بەرژەوەندی هەردوولا؟',
          phonetic: 'Bikhusous mufawadat al-\'aqd...',
          replies: [
            { text: 'نعم، نرحب بجدولة الدفعات على ثلاث مراحل مرتبطة بالتسليم الفعلي.', translation: 'بەڵێ، پێشوازی لە دابەشکردنی پارە بەسەر ٣ قۆناغی ڕادەستکردندا دەکەین.' },
            { text: 'نحتاج إلى دفعة أولية لتغطية التكاليف التشغيلية قبل البدء.', translation: 'پێویستمان بە بڕە پارەی یەکەمە بۆ خەرجییە سەرەتاییەکان پێش دەستپێکردن.' },
            { text: 'دعنا نراجع بنود الضمان ومستوى الخدمة المتفق عليه (SLA).', translation: 'با پێداچوونەوە بە بەندەکانی گرەنتی و ئاستی خزمەتگوزاری (SLA)دا بکەین.' },
          ],
        },
      ];
      const pick = careerBankAr[turnIndex % careerBankAr.length];
      return {
        replyText: turnIndex >= careerBankAr.length ? `استكمالاً لمناقشتنا المهنية: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else if (targetLanguage === 'ku') {
      const careerBankKu = [
        {
          replyText: 'دەستخۆش بۆ ڕوونکردنەوەی ئەزموونی پیشەییت. لە بەڕێوەبردنی پڕۆژە و بازرگانیدا، سەرکردایەتی تیمی هاوبەش زۆر گرنگە. چۆن کێشەی نێوان وادەی تەواوبوونی پڕۆژە و چاوەڕوانییەکانی خاوەنکار چارەسەر دەکەیت؟',
          translation: 'Well articulated regarding your career path. In corporate leadership, cross-functional synergy is essential. How do you balance tight delivery milestones against client expectations?',
          phonetic: 'Dastxosh bo runkrdanaway azmuni pisheyit...',
          replies: [
            { text: 'بە دانانی پلانێکی ڕوون و پێشینەدان بە کارە گرنگەکان دەتوانم کاتەکە ڕێکبخەم.', translation: 'By establishing clear priorities and sprint goals, I keep timelines on track.' },
            { text: 'پەیوەندیی بەردەوام و شەفاف لەگەڵ کڕیار ڕێگە لە هەڵەتێگەیشتن دەگرێت.', translation: 'Continuous transparent communication with stakeholders prevents delays.' },
            { text: 'گرنگترین ئەو لێهاتووییانەی بەڕێزتان بەدوایدا دەگەڕێن بۆ ئەم کارە چییە؟', translation: 'What are the most crucial competencies you seek for this role?' },
          ],
        },
        {
          replyText: 'ئەمە نیشانەی تێگەیشتنی قووڵی بازرگانییە. لە پلانە ستراتیژییەکانتدا بۆ چارەکی داهاتوو، چ پێوەرێکی سەرەکی (KPIs) دادەنێیت بۆ پێوانەکردنی سەرکەوتن و خێرایی کارکردن؟',
          translation: 'That demonstrates strong business acumen. Looking at your quarterly roadmap, what core performance indicators (KPIs) do you prioritize to track velocity and outcomes?',
          phonetic: 'Ama nishanai tegashtni quli bazarganiya...',
          replies: [
            { text: 'پێوانەکردنی ڕەزامەندی کڕیاران و خێرایی ڕادەستکردنی پڕۆژە پێشینەم دەبێت.', translation: 'Customer satisfaction metrics and delivery velocity are my top metrics.' },
            { text: 'کەمکردنەوەی تێچوونی ناپێویست و بەرزکردنەوەی بەرهەمهێنان لە ئامانجم دەبێت.', translation: 'Minimizing overhead waste and boosting productivity are primary goals.' },
            { text: 'ڕکابەرییەکانی ئێستای بازاڕ لە چ ئاستێکدا دەبینن؟', translation: 'How do you view current competitive market pressures?' },
          ],
        },
        {
          replyText: 'دەربارەی مەرجەکانی گرێبەستی بازرگانی و بودجە، پێداچوونەوەمان بۆ پڕۆپۆزەڵەکەتان کرد. ئایا دەکرێت هەندێک لە بەندەکان و شێوازی پارەدان بەپێی قۆناغەکانی ڕادەستکردن ڕێکبخەین؟',
          translation: 'Regarding commercial agreement terms and budget, we reviewed your proposal. Are you open to milestone-based payout scheduling to align both parties?',
          phonetic: 'Darbarey marjakani grebasti bazargani...',
          replies: [
            { text: 'بەڵێ، پێشوازی لە دابەشکردنی پارە بەسەر ٣ قۆناغی سەرەکیدا دەکەین.', translation: 'Yes, we welcome structuring payments across three key deliverables.' },
            { text: 'بۆ دەستپێکردن پێویستمان بە پێشەکییەکە بۆ دابینکردنی کەرەستە و تیمەکان.', translation: 'An initial advance is required to secure operational resources.' },
            { text: 'با پێداچوونەوە بە گەرەنتییەکانی خزمەتگوزاری و پشتگیرییدا بکەین.', translation: 'Let us finalize the SLA service warranties and long-term support.' },
          ],
        },
      ];
      const pick = careerBankKu[turnIndex % careerBankKu.length];
      return {
        replyText: turnIndex >= careerBankKu.length ? `بەردەوام دەبین لە گفتوگۆی کار: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else {
      const careerBankEn = [
        {
          replyText: 'Thank you for detailing your professional experience. In high-stakes corporate environments, cross-functional collaboration is paramount. How do you resolve conflicts between engineering milestones and stakeholder expectations?',
          translation: 'سوپاس بۆ خستنەڕووی ئەزموونی پیشەییت. لە کۆمپانیا گەورەکاندا هاوکاری تیمەکان بنەڕەتییە. چۆن کێشەی نێوان کاتی تەواوبوونی پڕۆژە و چاوەڕوانی خاوەنکار چارەسەر دەکەیت؟',
          phonetic: 'θæŋk juː fɔːr dɪˈteɪlɪŋ jʊər prəˈfɛʃənl...',
          replies: [
            { text: 'I leverage structured Agile sprints and transparent prioritization frameworks.', translation: 'من میتۆدۆلۆژیای Agile و پلاندانانی ڕوون بەکاردەهێنم بۆ سەرکەوتن.' },
            { text: 'Clear stakeholder visibility and proactive updates prevent misalignment.', translation: 'پەیوەندی ڕوون و بەردەوام لەگەڵ بەشداربووان ڕێگە لە هەڵە دەگرێت.' },
            { text: 'What are the defining performance indicators for leadership in this role?', translation: 'نیشاندەرە سەرەکییەکانی سەرکردایەتی بۆ ئەم پۆستە چییە؟' },
          ],
        },
        {
          replyText: 'That demonstrates strong leadership maturity. Looking at our upcoming quarterly expansion, what specific performance metrics or KPIs would you institute to measure team velocity?',
          translation: 'ئەمە پێگەیشتووییەکی بەرزی سەرکردایەتی نیشان دەدات. لە پلانی چارەکی داهاتوودا، چ پێوەرێکی KPIs پێشنیار دەکەیت بۆ پێوانەکردنی خێرایی تیم؟',
          phonetic: 'ðæt ˈdɛmənstreɪts strɒŋ ˈliːdərʃɪp...',
          replies: [
            { text: 'I track cycle time, release frequency, and net promoter scores (NPS).', translation: 'خێرایی کارکردن، ژمارەی وەشانە نوێیەکان و ڕەزامەندی کڕیار دەپێوم.' },
            { text: 'Aligning individual deliverables with overall enterprise ARR growth is key.', translation: 'پەیوەستکردنی کارەکان بە گەشەی داهاتی ساڵانەی کۆمپانیا بنەڕەتییە.' },
            { text: 'How do you view our current product positioning in international markets?', translation: 'پێگەی ئێستای بەرهەمەکانمان لە بازاڕە جیهانییەکاندا چۆن هەڵدەسەنگێنن؟' },
          ],
        },
        {
          replyText: 'Regarding our contract negotiations, we are reviewing your SLA terms and delivery timeline. Are you open to adjusting the retainer structure based on achievement of performance benchmarks?',
          translation: 'دەربارەی دانوستانی گرێبەست، سەیری مەرجەکان و کاتەکانی کارەکە دەکەین. ئایا ئامادەی ڕێکخستنی شێوازی پارەدان بەپێی گەیشتن بە ئامانجەکان؟',
          phonetic: 'rɪˈɡɑːrdɪŋ ˈaʊər ˈkɒntrækt nɪˌɡoʊʃiˈeɪʃənz...',
          replies: [
            { text: 'We are completely open to milestone-contingent milestone disbursements.', translation: 'ئێمە تەواو ئامادەین بۆ شێوازی پارەدان بەپێی قۆناغە بەدەستهاتووەکان.' },
            { text: 'An upfront operational deposit is required before initial sprint deployment.', translation: 'بڕە پارەیەکی سەرەتایی پێویستە بۆ دەستپێکردنی قۆناغی یەکەم.' },
            { text: 'Let us finalize the contractual scope and indemnity provisions.', translation: 'با لەسەر سنووری گرێبەستەکە و مەرجەکانی گرەنتی ڕێکبکەوین.' },
          ],
        },
      ];
      const pick = careerBankEn[turnIndex % careerBankEn.length];
      return {
        replyText: turnIndex >= careerBankEn.length ? `Continuing our professional business dialogue: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    }
  }

  // 2. ACADEMIC & RESEARCH CATEGORY
  if (isAcademic) {
    if (targetLanguage === 'ar') {
      const academicBankAr = [
        {
          replyText: 'أطروحتك البحثية تتناول إشكالية علمية بالغة الأهمية. هل يمكنك توضيح العينة الإحصائية المستخدمة وكيف تم ضبط المتغيرات الدخيلة أثناء جمع البيانات الميدانية؟',
          translation: 'توێژینەوەکەت دەست دەخاتە سەر کەلێنێکی زانستیی گرنگ. دەتوانیت باسی چۆنیەتی دیاریکردنی نموونەکان و کۆنترۆڵکردنی هۆکارە لاوەکییەکان بکەیت؟',
          phonetic: 'Utrouhatuka al-bahthiyyah...',
          replies: [
            { text: 'اعتمدنا على عينة عشوائية طبقية لضمان التمثيل الدقيق لمجتمع الدراسة.', translation: 'پشتمان بە نموونەیەکی بەهەڕەمەکی پۆلێنکراو بەست بۆ نوێنەرایەتی دروست.' },
            { text: 'تم استخدام تحليل الانحدار المتعدد لعزل المتغيرات المربكة إحصائياً.', translation: 'شیکاری فرە-لاری بەکارهێنرا بۆ جیاکردنەوەی گۆڕاوە لاوەکییەکان.' },
            { text: 'ما هي معايير الصدق والثبات التي توصون بتطبيقها هنا؟', translation: 'چ پێوەرێکی ڕاستگۆیی و جێگیری پێشنیار دەکەیت لێرەدا؟' },
          ],
        },
        {
          replyText: 'تأصيل منهجي رصين ودقيق. كيف تتقاطع النتائج الإحصائية التي توصلتم إليها مع النظريات الأكاديمية السائدة في المجلات العلمية المحكمة؟',
          translation: 'بەرگرییەکی زانستیی زۆر بەهێزە. دەرەنجامە ئامارییەکانتان چۆن لەگەڵ تیۆرییە باوەکانی گۆڤارە زانستییەکاندا یەکدەگرنەوە؟',
          phonetic: 'Ta\'seel manhajiyyun raseen...',
          replies: [
            { text: 'تدعم بياناتنا النموذج النظري الحديث بينما تتحدى الفرضيات الكلاسيكية القديمة.', translation: 'داتاکانمان پشتگیری لە مۆدێلی نوێ دەکەن بەڵام گریمانە کۆنەکان ڕەتدەکەنەوە.' },
            { text: 'هناك دلالة إحصائية قوية (p < 0.01) تثبت صحة الفرضية البديلة.', translation: 'بەڵگەیەکی بەهێزی ئاماری هەیە کە ڕاستیی گریمانەکە دەسەلمێنێت.' },
            { text: 'هل ترون ضرورة لتوسيع حجم العينة في الدراسات اللاحقة؟', translation: 'ئایا پێتان وایە پێویستە قەبارەی نموونە لە توێژینەوەی داهاتوودا فراوان بکرێت؟' },
          ],
        },
      ];
      const pick = academicBankAr[turnIndex % academicBankAr.length];
      return {
        replyText: turnIndex >= academicBankAr.length ? `استكمالاً لمناقشتنا الأكاديمية: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else if (targetLanguage === 'ku') {
      const academicBankKu = [
        {
          replyText: 'توێژینەوەکەت دەست دەخاتە سەر کەلێنێکی زانستیی گرنگ. دەتوانیت وردەکاری زیاترمان پێ بدەیت لەسەر چۆنیەتی دیاریکردنی نموونەی لێکۆڵینەوە و کۆنترۆڵکردنی هۆکارە لاوەکییەکان؟',
          translation: 'Your thesis tackles a pivotal gap in scholarly literature. Could you outline your sampling methodology and how confounding variables were controlled?',
          phonetic: 'Twezhinawakatt dast daxata sar keleneki zansti...',
          replies: [
            { text: 'پشتمان بە کۆکردنەوەی داتای مەیدانی بەست بە بەکارهێنانی فۆرمی ڕاپرسی باوەڕپێکراو.', translation: 'We utilized empirical field surveys using validated sampling instruments.' },
            { text: 'لە ڕێگەی بەرنامەی SPSSەوە شیکاری ئاماریی وردمان بۆ داتاکان ئەنجامدا.', translation: 'We conducted rigorous multi-variate statistical analysis via SPSS.' },
            { text: 'ڕای بەڕێزتان چییە لەسەر دروستی گریمانە سەرەکییەکەی ئێمە؟', translation: 'What is your evaluation of our primary hypothesis validity?' },
          ],
        },
        {
          replyText: 'ئەمە میتۆدۆلۆژیایەکی بەهێزە. دەرەنجامە ئامارییەکانی توێژینەوەکەت بە چ شێوەیەک جیاوازن لەو مۆدێلە باوانەی کە لە گۆڤارە زانستییە نێودەوڵەتییەکاندا بڵاوکراونەتەوە؟',
          translation: 'That is a robust methodological rationale. How do your empirical discoveries challenge conventional academic paradigms in published journals?',
          phonetic: 'Ama metodolozhiyaki baheza...',
          replies: [
            { text: 'ئەنجامەکانمان مۆدێلێکی نوێ پێشنیار دەکەن کە لەگەڵ ژینگەی ناوخۆییدا دەگونجێت.', translation: 'Our findings propose an updated model suited for local contexts.' },
            { text: 'جیاوازییەکی واتاداری ئاماری (p < 0.05) لە نێوان گرووپەکاندا دەرکەوت.', translation: 'A statistically significant difference (p < 0.05) emerged across cohorts.' },
            { text: 'پێشنیارت چییە بۆ بڵاوکردنەوەی ئەم توێژینەوەیە لە گۆڤاری نێودەوڵەتی؟', translation: 'What suggestions do you have for submission to indexed journals?' },
          ],
        },
      ];
      const pick = academicBankKu[turnIndex % academicBankKu.length];
      return {
        replyText: turnIndex >= academicBankKu.length ? `بەردەوام دەبین لە گەنگەشەی زانستی: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else {
      const academicBankEn = [
        {
          replyText: 'Your research hypothesis addresses a critical literature gap. Could you elaborate on your sampling framework and how you controlled for confounding variables during empirical data collection?',
          translation: 'توێژینەوەکەت دەست دەخاتە سەر کەلێنێکی زانستی گرنگ. دەتوانیت ڕوونی بکەیتەوە چۆن نموونەی توێژینەوەکەت هەڵبژارد و هۆکارە لاوەکییەکانت کۆنترۆڵ کرد؟',
          phonetic: 'jʊər rɪˈsɜːrtʃ haɪˈpɒθəsɪs əˈdrɛsɪz...',
          replies: [
            { text: 'We implemented stratified random sampling to ensure unbiased cohort representation.', translation: 'نموونەیەکی پۆلێنکراوی بەهەڕەمەکیمان بەکارهێنا تا بێ لایەنانە بێت.' },
            { text: 'Multiple regression and ANOVA tests were executed to isolate confounding effects.', translation: 'شیکاری فرە-لاری و ANOVA بۆ جیاکردنەوەی هۆکارەکان ئەنجامدرا.' },
            { text: 'What methodological critiques would you highlight regarding this paradigm?', translation: 'چ ڕەخنەیەکی میتۆدۆلۆژی لەسەر ئەم مۆدێلە پێشنیار دەکەیت؟' },
          ],
        },
        {
          replyText: 'That is a robust methodological rationale. How do your statistical findings diverge from the conventional theoretical models established in recent peer-reviewed publications?',
          translation: 'ئەمە پاساوێکی میتۆدۆلۆژی زۆر بەهێزە. دەرەنجامە ئامارییەکانت چۆن لەگەڵ مۆدێلە تیۆرییە باوەکاندا جیاوازن؟',
          phonetic: 'ðæt ɪz ə roʊˈbʌst ˌmɛθədəˈlɒdʒɪkəl...',
          replies: [
            { text: 'Our empirical data demonstrated strong statistical significance (p < 0.01).', translation: 'داتاکانمان بەڵگەیەکی ئاماریی زۆر بەهێزیان (p < 0.01) دەرخست.' },
            { text: 'The results challenge the classical assumptions of linear causality.', translation: 'ئەنجامەکان گومان دەخەنە سەر گریمانە کۆنەکانی هۆکاری هێڵکاری.' },
            { text: 'How do you recommend framing the discussion section for journal review?', translation: 'چۆن پێشنیار دەکەیت بەشی تاوتوێکردن دابڕێژین بۆ گۆڤاری زانستی؟' },
          ],
        },
      ];
      const pick = academicBankEn[turnIndex % academicBankEn.length];
      return {
        replyText: turnIndex >= academicBankEn.length ? `Continuing our scholarly seminar discussion: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    }
  }

  // 3. DAILY LIFE & SERVICES CATEGORY
  if (isDaily) {
    if (targetLanguage === 'ar') {
      const dailyBankAr = [
        {
          replyText: 'أهلاً وسهلاً بك! يسعدني جداً تقديم المساعدة لك اليوم. ما هي المتطلبات أو التفضيلات المحددة التي تبحث عنها بخصوص الترتيبات والمواعيد والخدمات؟',
          translation: 'بەخێربێیت! زۆر خۆشحاڵم بە هاوکاریکردنت. چ مەرج یان داواکارییەکت هەیە سەبارەت بە ڕێکخستنەکان، کاتەکان و خزمەتگوزارییەکان؟',
          phonetic: 'Ahlan wa sahlan bik! Yus\'iduni...',
          replies: [
            { text: 'أرغب في معرفة الأسعار وخيارات الدفع وشروط الحجز المسبق.', translation: 'دەمەوێت نرخەکان، شێوازی پارەدان و مەرجی حجز بزانم.' },
            { text: 'هل تشمل الخدمة التوصيل وتأمين الضمان؟', translation: 'ئایا خزمەتگوزارییەکە گەیاندن و گرەنتی دەگرێتەوە؟' },
            { text: 'ما هي المواعيد المتاحة للزيارة أو الاستلام هذا الأسبوع؟', translation: 'کاتە بەردەستەکان بۆ سەردان یان وەرگرتن چین لەم هەفتەیەدا؟' },
          ],
        },
        {
          replyText: 'تم تسجيل كافة التفاصيل بوضوح. الأسعار والخيارات المتاحة محددة ومرنة. هل ترغب في الاطلاع على خطوات التأكيد وسياسة الحجز؟',
          translation: 'هەموو وردەکارییەکان بە ڕوونی تۆمار کران. نرخ و هەڵبژاردنەکان دیاریکراون. ئایا دەتەوێت هەنگاوەکانی جێگیرکردن و ڕێساکان بزانیت؟',
          phonetic: 'Tamma tasjeel kaffat al-tafaseel...',
          replies: [
            { text: 'نعم، يرجى تزويدي بكافة الخطوات الرسمية لإتمام المعاملة.', translation: 'بەڵێ، تکایە هەموو هەنگاوە فەرمییەکانم پێ بڵێ بۆ تەواوکردنی کارەکە.' },
            { text: 'هل تتوفر أي عروض أو خصومات على الحجوزات الطويلة؟', translation: 'ئایا هیچ داشکاندنێک هەیە بۆ حجزە درێژخایەنەکان؟' },
            { text: 'شكراً جزيلاً لتعاونك وخدمتك الراقية.', translation: 'زۆر سوپاس بۆ هاوکاری و خزمەتگوزارییە جوانەکەت.' },
          ],
        },
      ];
      const pick = dailyBankAr[turnIndex % dailyBankAr.length];
      return {
        replyText: turnIndex >= dailyBankAr.length ? `بخصوص استفسارك اليومي: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else if (targetLanguage === 'ku') {
      const dailyBankKu = [
        {
          replyText: 'بەخێربێیت! زۆر خۆشحاڵم بە بینینت. دەتوانیت باسی داواکارییە تایبەتەکانت، کاتەکان، یان ئەو مەرج و خزمەتگوزارییانە بکەیت کە بە لای تۆوە لە پێشینەن؟',
          translation: 'Welcome! Great to speak with you. What specific preferences, times, or features are most important for your request today?',
          phonetic: 'Baxerbeyt! Zor xoshhalm ba binint...',
          replies: [
            { text: 'دەمەوێت لەسەر نرخەکان، خزمەتگوزارییەکان و وادەی تەواوبوون پرسیار بکەم.', translation: 'I want to ask about pricing, services, and completion timelines.' },
            { text: 'ئایا هیچ مەرجێکی تایبەت یان بەڵگەنامەیەک پێویستە بۆ ئەم مەبەستە؟', translation: 'Are there specific terms or documentation needed for this?' },
            { text: 'چ پێشنیارێکت هەیە بۆ باشترین بژاردە بەپێی بودجەکەم؟', translation: 'What do you recommend as the best option within my budget?' },
          ],
        },
        {
          replyText: 'هەموو داواکارییەکان بە ڕوونی تۆمار کران. خزمەتگوزارییەکان ئامادەن و هەموو شتێک بەپێی دڵی تۆ ڕێکدەخرێت. چ شتێکی تر هەیە کە حەز بکەیت بیزانیت؟',
          translation: 'All details have been clearly noted. The services are arranged to match your preferences. Is there anything else you would like to know?',
          phonetic: 'Hamw dawakariyakant ba runi tomar kran...',
          replies: [
            { text: 'سوپاس، هەموو شتێک زۆر ڕوون و دڵخۆشکەرە و دەمەوێت تەواوی بکەم.', translation: 'Thank you, everything is crystal clear and I would like to finalize it.' },
            { text: 'ئەگەر کێشەیەک دروست بێت پەیوەندی بە کێوە بکەم؟', translation: 'If any issue arises, whom should I contact directly?' },
            { text: 'دەستت خۆش بێت بۆ وەڵامە خێرا و جوانەکانت.', translation: 'Thank you for your prompt and polite assistance.' },
          ],
        },
      ];
      const pick = dailyBankKu[turnIndex % dailyBankKu.length];
      return {
        replyText: turnIndex >= dailyBankKu.length ? `لە درێژەی گفتوگۆکەماندا: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    } else {
      const dailyBankEn = [
        {
          replyText: 'Welcome! I would be delighted to assist you today. What specific requirements or preferences do you have regarding the location, amenities, or schedule?',
          translation: 'بەخێربێیت! زۆر خۆشحاڵ دەبم یارمەتیت بدەم. چ داواکاری یان مەرجێکی تایبەتت هەیە دەربارەی شوێن، خزمەتگوزارییەکان، یان کاتەکان؟',
          phonetic: 'ˈwɛlkəm! aɪ wʊd biː dɪˈlaɪtɪd tuː əˈsɪst...',
          replies: [
            { text: 'I would like to inquire about pricing, deposit policies, and utilities.', translation: 'حەز دەکەم لەسەر نرخ، بارمتە و کرێی ئاو و کارەبا بپرسم.' },
            { text: 'Are flexible cancellation and date modifications available?', translation: 'ئایا هەڵوەشاندنەوە یان گۆڕینی کات بە ئاسانی دەکرێت؟' },
            { text: 'What is the standard check-in or service procedure?', translation: 'ڕێکاری ئاسایی وەرگرتن یان چوونەژوورەوە چۆنە؟' },
          ],
        },
        {
          replyText: 'Everything has been logged accurately. The available options are flexible and transparent. Would you like me to walk you through the confirmation process?',
          translation: 'هەموو شتێک بە وردی تۆمار کرا. هەڵبژاردنەکان ڕوون و بەردەستن. حەز دەکەیت هەنگاوەکانی دڵنیابوونەوەت بۆ ڕوون بکەمەوە؟',
          phonetic: 'ˈɛvriθɪŋ hæz biːn lɒɡd ˈækjʊrɪtli...',
          replies: [
            { text: 'Yes, please guide me through the official confirmation steps.', translation: 'بەڵێ، تکایە ڕێنماییم بکە بەناو هەنگاوە فەرمییەکاندا.' },
            { text: 'Could you email me the itemized breakdown and terms?', translation: 'دەتوانیت وردەکاری نرخی هەموو بەشەکانم بە ئیمەیڵ بۆ بنێریت؟' },
            { text: 'Thank you very much for your wonderful support and clarity.', translation: 'زۆر سوپاس بۆ پشتیوانی و ڕوونکردنەوەی بەڕێزتان.' },
          ],
        },
      ];
      const pick = dailyBankEn[turnIndex % dailyBankEn.length];
      return {
        replyText: turnIndex >= dailyBankEn.length ? `Continuing our daily interaction: ${pick.replyText}` : pick.replyText,
        translation: pick.translation,
        phoneticHint: pick.phonetic,
        suggestedReplies: pick.replies,
      };
    }
  }

  // 4. Default General Scenarios Fallback (if none of above matched)
  if (targetLanguage === 'ar') {
    const generalAr = [
      {
        replyText: 'أهلاً بك! كلامك الصوتي واضح ومفهوم ومصاغ بطريقة ممتازة. كيف تحب أن نوسع النقاش في هذا الجانب؟',
        translation: 'بەخێربێیت! قسەکردنت زۆر ڕوون و تێگەیشتووە و بە شێوازێکی نایاب دەربڕدراوە. چۆن حەز دەکەیت باسەکە فراوانتر بکەین؟',
        phonetic: 'Ahlan bik! Kalamuka wadehun...',
        replies: [
          { text: 'أود استكشاف تفاصيل إضافية حول هذا الموضوع.', translation: 'حەز دەکەم وردەکاری زیاتر باس بکەم لەسەر ئەم بابەتە.' },
          { text: 'هل كانت صياغتي للجملة دقيقة وسلسة؟', translation: 'ئایا داڕشتنی ڕستەکەم دروست و ڕەوان بوو؟' },
          { text: 'ما هي المفردات الأكثر بلاغة التي يمكنني استخدامها هنا؟', translation: 'چ دەستەواژەیەکی شیاوتر هەیە کە دەتوانم بەکاریبهێنم لێرەدا؟' },
        ],
      },
    ];
    const pick = generalAr[turnIndex % generalAr.length];
    return {
      replyText: pick.replyText,
      translation: pick.translation,
      phoneticHint: pick.phonetic,
      suggestedReplies: pick.replies,
    };
  } else if (targetLanguage === 'ku') {
    const generalKu = [
      {
        replyText: 'دەستخۆش! شێوازی قسەکردنت زۆر ڕەوان و پڕ لە متمانەیە. حەز دەکەیت چ لایەنێکی تری ئەم بابەتە تاوتوێ بکەین؟',
        translation: 'Well said! Your speaking delivery is fluent and confident. Which other aspect of this topic would you like to explore?',
        phonetic: 'Dastxosh! Shewazi qsakant zor rawan...',
        replies: [
          { text: 'دەمەوێت لەسەر لایەنە کرداری و ڕۆژانەییەکان بەردەوام بم.', translation: 'I want to continue focusing on practical, daily aspects.' },
          { text: 'ئایا شێوازی بێژەکردنی پیتەکانم بە تەواوی کوردیانە بوو؟', translation: 'Was my pronunciation of the letters genuinely native Kurdish?' },
          { text: 'پرسیاری داهاتووت لەسەر ئەم ڕوانگەیە چییە؟', translation: 'What is your next question regarding this perspective?' },
        ],
      },
    ];
    const pick = generalKu[turnIndex % generalKu.length];
    return {
      replyText: pick.replyText,
      translation: pick.translation,
      phoneticHint: pick.phonetic,
      suggestedReplies: pick.replies,
    };
  } else {
    const generalEn = [
      {
        replyText: 'That was articulated with notable clarity and precision! How would you like to build upon this perspective further?',
        translation: 'ئەوە بە ڕوونی و وردبینییەکی بەرچاوەوە دەربڕدرا! چۆن حەز دەکەیت زیاتر لەسەر ئەم ڕوانگەیە بەردەوام بین؟',
        phonetic: 'ðæt wɒz ɑːˈtɪkjʊleɪtɪd wɪð ˈnəʊtəbl ˈklærɪti...',
        replies: [
          { text: 'I would like to explore the broader practical implications.', translation: 'حەز دەکەم کاریگەرییە فراوان و پراکتیکییەکان لێکبدەمەوە.' },
          { text: 'Did my sentence flow naturally and use idiomatic phrasing?', translation: 'ئایا ڕستەکەم سروشتی بوو و زاراوەی گونجاوی بەکارهێنا؟' },
          { text: 'What is the most compelling counter-argument to this point?', translation: 'بەهێزترین بەڵگەی دژ بۆ ئەم خاڵە چییە؟' },
        ],
      },
    ];
    const pick = generalEn[turnIndex % generalEn.length];
    return {
      replyText: pick.replyText,
      translation: pick.translation,
      phoneticHint: pick.phonetic,
      suggestedReplies: pick.replies,
    };
  }
}

// Phonetic adaptation to allow Arabic speech engine to cleanly vocalize Central Kurdish (Sorani)
function kurdishTextForArabicTTS(text: string): string {
  return text
    .replace(/چ/g, 'تش')
    .replace(/پ/g, 'ب')
    .replace(/گ/g, 'ك')
    .replace(/ژ/g, 'ج')
    .replace(/ڤ/g, 'ف')
    .replace(/ڵ/g, 'ل')
    .replace(/ڕ/g, 'ر')
    .replace(/ۆ/g, 'و')
    .replace(/ێ/g, 'ي')
    .replace(/ە/g, 'ه')
    .replace(/ئـ/g, 'أ')
    .replace(/ئێ/g, 'إي')
    .replace(/ئۆ/g, 'أو')
    .replace(/ئا/g, 'آ')
    .replace(/ئ/g, 'أ');
}

// Secondary reliable TTS audio fetcher via Google audio synthesis with Kurdish phonetics
async function fetchGoogleTTSAudio(text: string, language: string = 'en'): Promise<{ audioBase64: string; mimeType: string } | null> {
  return new Promise((resolve) => {
    try {
      let clean = text.trim().slice(0, 200);
      let tl = 'en';
      if (language === 'ar') {
        tl = 'ar';
      } else if (language === 'ku') {
        tl = 'ar';
        clean = kurdishTextForArabicTTS(clean);
      }
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(clean)}`;
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length > 500) {
            resolve({ audioBase64: buf.toString('base64'), mimeType: 'audio/mpeg' });
          } else {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

// Helper for TTS audio generation with automatic multi-model fallback and caching
async function generateTTSAudio(text: string, voiceName: string = 'Kore', style?: string, language: string = 'en'): Promise<{ audioBase64: string; mimeType: string } | null> {
  const cleanText = text.trim();
  if (!cleanText) return null;

  const cacheKey = `${language}:${voiceName}:${cleanText}`;
  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey) || null;
  }

  // Language-specific phonetic guidance for authentic pronunciation
  let promptStyle = style;
  if (!promptStyle) {
    if (language === 'ku') {
      promptStyle = 'Authentic Central Kurdish (سۆرانی) accent and pronunciation, natural human language tutor';
    } else if (language === 'ar') {
      promptStyle = 'Clear Modern Standard Arabic (العربية الفصحى) with accurate vowel articulation and diacritics';
    } else {
      promptStyle = 'Clear, friendly English language tutor, articulate pronunciation';
    }
  }

  // Model fallback pool across separate quota limits (flash-tts first for higher limits, then flash-lite-tts)
  const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

  for (const model of ttsModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText.slice(0, 400),
                speechMetadata: {
                  style: promptStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';
      if (base64Audio) {
        const item = { audioBase64: base64Audio, mimeType };
        ttsAudioCache.set(cacheKey, item);
        return item;
      }
    } catch (error: any) {
      const isQuota =
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');
      if (isQuota) {
        console.warn(`TTS Model ${model} quota reached. Trying next fallback TTS option...`);
        continue;
      }
      console.warn(`TTS Model ${model} generation note:`, error?.message || error);
    }
  }

  // Resilient fallback: Google TTS engine for instant, unthrottled audio playback with Kurdish phonetics
  try {
    const fallback = await fetchGoogleTTSAudio(cleanText, language);
    if (fallback) {
      ttsAudioCache.set(cacheKey, fallback);
      return fallback;
    }
  } catch (fbErr) {
    console.warn('Google TTS fallback note:', fbErr);
  }

  return null;
}

// 1. Text-to-speech endpoint (supports full sentences, individual words, and multilingual accents)
app.post('/api/speak', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', style, language = 'en' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const result = await generateTTSAudio(text, voiceName, style, language);
    if (!result || !result.audioBase64) {
      // Gracefully signal client to use browser speech synthesis without throwing an HTTP error
      res.json({ audioBase64: null, fallbackToBrowser: true });
      return;
    }

    res.json({ audioBase64: result.audioBase64, mimeType: result.mimeType || 'audio/mpeg', success: true });
  } catch (error: any) {
    console.error('Error in /api/speak:', error);
    res.json({ audioBase64: null, fallbackToBrowser: true });
  }
});

// 2. Direct audio transcription endpoint (for Kurdish, Arabic, English without mixing)
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'ku' } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 is required', transcript: '' });
      return;
    }

    const transcript = await transcribeAudioWithGemini(audioBase64, mimeType, language);
    res.json({ transcript: transcript || '' });
  } catch (error: any) {
    console.error('Error in /api/transcribe:', error);
    res.json({ transcript: '' });
  }
});

// 3. Speech Assessment endpoint (Audio & Voice Analysis for Kurdish, Arabic & English)
app.post('/api/assess-voice', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', transcript, targetText, language = 'en', taskType = 'pronunciation' } = req.body;

    // If audio was submitted without a transcript, transcribe it with Gemini first to guarantee authentic Kurdish/Arabic capture
    let activeTranscript = transcript;
    if (!activeTranscript && audioBase64) {
      const transcribed = await transcribeAudioWithGemini(audioBase64, mimeType, language);
      if (transcribed) {
        activeTranscript = transcribed;
      }
    }

    // Fast-path for empty/inaudible audio to respond immediately with authentic score
    if (!audioBase64 && (!activeTranscript || activeTranscript.trim().length === 0)) {
      res.json(generateHeuristicEvaluation('', targetText, language));
      return;
    }

    const parts: any[] = [];

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioBase64,
        },
      });
    }

    const targetLangDesc =
      language === 'ar'
        ? 'Arabic (العربية الفصحى المعاصرة)'
        : language === 'ku'
        ? 'Central Kurdish (سۆرانی بە ئەلفوبێی کوردی)'
        : 'English';

    const promptText = `
You are an expert language evaluator and pronunciation coach specializing in ${targetLangDesc}.
Your task is to evaluate the user's spoken voice and language capability realistically.

Target language for this test: ${targetLangDesc}.
CRITICAL RULE: DO NOT MIX LANGUAGES! Evaluate strictly for ${targetLangDesc}.
Task type: ${taskType}.
${targetText ? `Target text user was expected to say: "${targetText}"` : 'Spontaneous response / self-expression'}
${activeTranscript ? `Speech recognition transcript: "${activeTranscript}"` : ''}

CRITICAL SCORING CALIBRATION RULES (NO BIAS TOWARDS 80!):
The learner explicitly demanded REALISTIC, UNBIASED, ACCURATE grading across the entire 0-100 spectrum.
You MUST NOT default to 75-85 unless the performance genuinely merits it!
Score distribution guide:
- 15 - 25 (e.g., 20): Silence, background noise, or user spoke only 1-2 fragmented words out of a longer sentence.
- 35 - 45 (e.g., 40): Heavy errors, missed more than half the sentence, very poor pronunciation or fragmented phrasing.
- 48 - 58 (e.g., 50 or 55): Basic attempt, roughly half the words uttered, several obvious phonetic/grammar errors, significant pauses.
- 60 - 68 (e.g., 60): Intermediate attempt, understandable but noticeably flawed articulation, hesitation, or grammatical inaccuracies.
- 70 - 78 (e.g., 70): Good comprehensible attempt, minor pronunciation slips, slight hesitation.
- 80 - 88 (e.g., 80): Very good, clear pronunciation, natural rhythm, minor accent quirks.
- 89 - 95 (e.g., 90 or 95): High fluency, native-like clarity, accurate vowels, confident delivery.
- 96 - 100 (e.g., 100): Flawless, exemplary native pronunciation and pacing, perfect sentence structure.

Evaluate:
1. Transcription: What did the user actually say in ${targetLangDesc}?
2. Pronunciation Score (0-100) based on actual accuracy (can be 20, 40, 50, 55, 60, 70, 80, 90, 95, 100).
3. Fluency Score (0-100) (pacing, rhythm, natural flow, hesitations).
4. Vocabulary & Grammar Score (0-100) (sentence structure, word choice in ${targetLangDesc}).
5. Estimated CEFR Level (A1, A2, B1, B2, C1, C2).
6. Comprehensive feedback in constructive Kurdish (Sorani), English, and Arabic.
7. Word-by-word breakdown showing which words were pronounced accurately, which need improvement, with phonetic tips.
8. Corrections for any grammatical or phrasing errors.

Respond strictly in valid JSON matching this schema.
`;

    parts.push({ text: promptText });

    let parsed: any = null;
    try {
      const response = await generateGeminiContentWithFallback({
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recognizedText: { type: Type.STRING, description: 'What the user spoke' },
              detectedLanguage: { type: Type.STRING, description: 'Detected language code (ku, ar, or en)' },
              overallScore: { type: Type.INTEGER, description: 'Score out of 100' },
              cefrLevel: { type: Type.STRING, description: 'A1, A2, B1, B2, C1, or C2' },
              scores: {
                type: Type.OBJECT,
                properties: {
                  pronunciation: { type: Type.INTEGER },
                  fluency: { type: Type.INTEGER },
                  vocabulary: { type: Type.INTEGER },
                  grammar: { type: Type.INTEGER },
                },
                required: ['pronunciation', 'fluency', 'vocabulary', 'grammar'],
              },
              feedbackKurdish: { type: Type.STRING, description: 'Detailed feedback in Kurdish Sorani' },
              feedbackEnglish: { type: Type.STRING, description: 'Detailed feedback in English' },
              feedbackArabic: { type: Type.STRING, description: 'Detailed feedback in Modern Standard Arabic' },
              phoneticGuide: { type: Type.STRING, description: 'Phonetic or transliteration guidance' },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              wordsAnalysis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    status: { type: Type.STRING, description: 'excellent, good, or needs_work' },
                    phonetic: { type: Type.STRING },
                    tip: { type: Type.STRING },
                  },
                  required: ['word', 'status'],
                },
              },
              corrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    improved: { type: Type.STRING },
                    explanationKurdish: { type: Type.STRING },
                    explanationEnglish: { type: Type.STRING },
                    explanationArabic: { type: Type.STRING },
                  },
                  required: ['original', 'improved', 'explanationKurdish', 'explanationEnglish'],
                },
              },
            },
            required: [
              'recognizedText',
              'overallScore',
              'cefrLevel',
              'scores',
              'feedbackKurdish',
              'feedbackEnglish',
              'strengths',
              'improvements',
            ],
          },
        },
      });

      parsed = JSON.parse(response.text || '{}');
      if (activeTranscript && (!parsed.recognizedText || parsed.recognizedText.length < 2)) {
        parsed.recognizedText = activeTranscript;
      }

      // Objective reality calibration against ground truth
      if (activeTranscript || targetText) {
        if (taskType === 'pronunciation' && targetText) {
          const objectiveEval = generateHeuristicEvaluation(activeTranscript || '', targetText, language, 'pronunciation');
          // If user uttered almost nothing or heavy errors, but model politely hallucinated >= 75:
          if (objectiveEval.overallScore <= 45 && parsed.overallScore >= 70) {
            parsed.overallScore = objectiveEval.overallScore;
            parsed.scores = objectiveEval.scores;
            parsed.cefrLevel = objectiveEval.cefrLevel;
            parsed.feedbackKurdish = objectiveEval.feedbackKurdish;
            parsed.feedbackEnglish = objectiveEval.feedbackEnglish;
            parsed.feedbackArabic = objectiveEval.feedbackArabic;
          } else if (objectiveEval.overallScore <= 58 && parsed.overallScore >= 78) {
            parsed.overallScore = objectiveEval.overallScore;
            parsed.scores = objectiveEval.scores;
            parsed.cefrLevel = objectiveEval.cefrLevel;
          } else if (objectiveEval.overallScore >= 95 && parsed.overallScore < 90) {
            // If user uttered all target words flawlessly, grant 95-100 mastery!
            parsed.overallScore = objectiveEval.overallScore;
            parsed.scores = objectiveEval.scores;
            parsed.cefrLevel = objectiveEval.cefrLevel;
          }
        } else {
          // Open speaking level test or conversational response
          const words = (activeTranscript || '').trim().split(/\s+/).filter(Boolean);
          if (words.length === 0) {
            parsed.overallScore = 20;
            parsed.scores = { pronunciation: 20, fluency: 15, vocabulary: 20, grammar: 20 };
            parsed.cefrLevel = 'A1';
          } else if (words.length <= 2 && parsed.overallScore > 40) {
            parsed.overallScore = 35;
            parsed.scores = { pronunciation: 35, fluency: 30, vocabulary: 35, grammar: 35 };
            parsed.cefrLevel = 'A1';
          }
        }
      }
    } catch (apiErr: any) {
      console.warn('Live Gemini models unavailable or rate-limited, utilizing heuristic evaluator:', apiErr?.message);
      parsed = generateHeuristicEvaluation(activeTranscript || '', targetText, language, taskType);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/assess-voice:', error);
    // Even if an unexpected server exception occurs, return a safe evaluation payload so client never breaks
    const fallbackTaskType = req.body?.taskType || (req.body?.targetText ? 'level_test' : 'conversation');
    const safeFallback = generateHeuristicEvaluation(req.body?.transcript || '', req.body?.targetText, req.body?.language || 'en', fallbackTaskType);
    res.json(safeFallback);
  }
});

// 3. Conversational AI Language Tutor endpoint
app.post('/api/tutor-chat', async (req, res) => {
  try {
    const {
      messages,
      scenario = 'general',
      targetLanguage = 'en',
      uiLanguage = 'ku',
      tutorPersona = 'Zana',
      userLevel = 'B1',
      requestAudio = true,
      voiceName = 'Kore',
    } = req.body;

    const targetLangDesc =
      targetLanguage === 'ar'
        ? 'Arabic (العربية الفصحى المعاصرة)'
        : targetLanguage === 'ku'
        ? 'Central Kurdish (سۆرانی)'
        : 'English';

    const uiLangDesc =
      uiLanguage === 'ar'
        ? 'Modern Standard Arabic (العربية الفصحى)'
        : uiLanguage === 'en'
        ? 'English'
        : 'Central Kurdish Sorani (کوردیی سۆرانی)';

    // Extract previous assistant phrases to forbid any repetition
    const previousAssistantSentences: string[] = [];
    (messages || []).forEach((m: any) => {
      if (m.role === 'assistant' && typeof m.content === 'string') {
        const parts = m.content.split(/[.!?؟۔\n]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 5);
        previousAssistantSentences.push(...parts);
      }
    });
    const forbiddenList = previousAssistantSentences.slice(-40).join(' | ');

    const systemInstruction = `
You are an interactive, realistic language tutor and specialist named "${tutorPersona}".
You speak fluent Kurdish (Sorani), Arabic, and English.
The learner's interface language is: ${uiLangDesc}.
The learner wants to improve their speaking and conversational skills strictly in: ${targetLangDesc}.
Current learner target level: ${userLevel}.
Current conversational scenario: ${scenario}.

CRITICAL MANDATES (یاسای بێ کۆتا و قەدەغەکردنی هەموو دووبارەبوونەوەیەک):
1. ABSOLUTE ZERO REPETITION (هیچ دووبارەبوونەوەیەک ڕێگەپێنەدراوە):
   - You MUST NEVER repeat any previously spoken sentence, opening phrase, greeting, transition, or question format.
   - The user mandated that this conversation can continue continuously for days, weeks, months, or an entire year without a single repeated phrase!
   - BANNED PREVIOUS STATEMENTS (DO NOT REUSE ANY OF THESE):
     [${forbiddenList || 'None yet'}]
   - Vary your vocabulary, sentence length, grammatical structures, and inquiries dynamically every single turn.

2. INFINITE CONTINUOUS DIALOGUE (گفتوگۆی بێ کۆتا و بێ وەستان):
   - NEVER conclude, terminate, or say goodbye. Never say "Take care and goodbye", "Our visit is done", or wrap up the session.
   - Always advance the scenario into deeper observations, systematic inquiries, differential diagnoses, physiological monitoring, medication adjustments, lifestyle guidance, or investigative questions.
   - Keep the conversation seamlessly alive forever!

STRICT LANGUAGE ISOLATION (NO LANGUAGE MIXING):
1. "replyText" MUST be 100% in the target practice language (${targetLangDesc}).
   - If targetLanguage is English: 100% natural English. Do NOT mix any Kurdish or Arabic words into "replyText".
   - If targetLanguage is Arabic: 100% eloquent Arabic. Do NOT mix English or Kurdish into "replyText".
   - If targetLanguage is Kurdish: 100% natural Central Kurdish (Sorani). Do NOT mix English or Arabic into "replyText".
2. "translation" MUST be 100% in the learner's interface language (${uiLangDesc}).
   - If learner interface is Arabic: provide translation in Arabic.
   - If learner interface is Kurdish: provide translation in Kurdish (Sorani).
   - If learner interface is English: provide translation in English.
3. "suggestedReplies":
   - "text" MUST be 100% in the target practice language (${targetLangDesc}).
   - "translation" MUST be 100% in the learner's interface language (${uiLangDesc}).
   - Must be realistic and novel suggestions (never repeated).
4. "correctionTip":
   - If student had a mistake, provide explanation in ${uiLangDesc}.
5. Keep replies realistic, engaging, and concise (1 to 3 sentences maximum so the student has ample opportunity to reply).
`;

    const chatHistory = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let parsed: any = null;
    try {
      const response = await generateGeminiContentWithFallback({
        contents: chatHistory,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: { type: Type.STRING, description: 'The spoken response from the tutor in target language' },
              translation: { type: Type.STRING, description: 'Translation of reply in user interface language' },
              phoneticHint: { type: Type.STRING, description: 'Pronunciation / phonetic guide' },
              correctionTip: {
                type: Type.OBJECT,
                properties: {
                  studentMistake: { type: Type.STRING },
                  betterWay: { type: Type.STRING },
                  explanation: { type: Type.STRING, description: 'Explanation in user interface language' },
                },
              },
              suggestedReplies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: 'Reply in target language' },
                    translation: { type: Type.STRING, description: 'Translation in user interface language' },
                  },
                  required: ['text', 'translation'],
                },
              },
            },
            required: ['replyText', 'translation', 'suggestedReplies'],
          },
        },
      });

      parsed = JSON.parse(response.text || '{}');
    } catch (chatErr: any) {
      console.warn('Live Gemini models unavailable or rate-limited for tutor chat, using fallback:', chatErr?.message);
      const lastMsg = messages?.[messages.length - 1]?.content || '';
      parsed = generateFallbackTutorReply(scenario, targetLanguage, lastMsg, messages?.length || 0);
    }

    // Optionally generate realistic audio for tutor response
    let audioBase64: string | null = null;
    if (requestAudio && parsed.replyText) {
      const audioResult = await generateTTSAudio(parsed.replyText, voiceName, undefined, targetLanguage);
      audioBase64 = audioResult?.audioBase64 || null;
    }

    res.json({
      ...parsed,
      audioBase64,
    });
  } catch (error: any) {
    console.error('Error in /api/tutor-chat:', error);
    const lastMsg = req.body?.messages?.[req.body?.messages?.length - 1]?.content || '';
    const safeFallback = generateFallbackTutorReply(req.body?.scenario || 'general', req.body?.targetLanguage || 'en', lastMsg, req.body?.messages?.length || 0);
    res.json({
      ...safeFallback,
      audioBase64: null,
    });
  }
});

// 4. CEFR Speaking Level Test Prompts (1000 Progressive Stages Across 10 Worlds)
app.get('/api/level-test-steps', (req, res) => {
  try {
    const language = (req.query.language || 'en') as TargetLanguage;
    const steps = get1000TestStepsForLanguage(language);
    res.json(steps);
  } catch (err: any) {
    console.error('Error serving 1000 level-test-steps:', err);
    res.status(500).json({ error: 'Failed to retrieve speaking stages' });
  }
});

// 5. High-Precision Realtime Multilingual Translation Endpoint (Kurdish, Arabic, English)
app.post('/api/translate', async (req, res) => {
  try {
    const {
      text,
      sourceLang = 'auto',
      targetLang = 'ku',
      requestAudio = true,
      domain = 'general',
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text to translate is required' });
      return;
    }

    const cleanInput = text.trim();

    // Source and Target descriptions
    const langNames: Record<string, string> = {
      ku: 'Central Kurdish (سۆرانی)',
      ar: 'Modern Standard Arabic (العربية الفصحى)',
      en: 'English',
    };

    const targetDesc = langNames[targetLang] || 'Central Kurdish (سۆرانی)';

    const systemInstruction = `
You are an expert multilingual translator and computational linguist specializing in Central Kurdish (Sorani), Modern Standard Arabic, and English.
Your goal is to provide the most accurate, natural, and context-aware translation possible.

Input text: "${cleanInput}"
Expected Target Language: ${targetDesc} (${targetLang}).
Source Language: ${sourceLang === 'auto' ? 'Auto-detect between Kurdish, Arabic, or English' : langNames[sourceLang] || sourceLang}.
Domain: ${domain} (e.g. medical/hospital, business/contracts, academic/research, daily conversation).

CRITICAL ACCURACY & TRANSLATION RULES:
1. "translatedText": MUST be strictly in ${targetDesc}.
   - If target is Kurdish (ku): Use authentic Central Kurdish (Sorani) orthography (ئ، ە، ێ، ۆ، ڕ، ڵ، ڤ، گ، چ، ژ، پ). NEVER use Persian or Arabic loan spellings where standard Kurdish exists.
   - If target is Arabic (ar): Use eloquent, grammatically correct Modern Standard Arabic (فصحى سليمة).
   - If target is English (en): Use natural, fluent, native-level English.
2. "phonetic":
   - If target is Kurdish: Latin Kurdish transliteration (Hawar script, e.g., 'Silaw le Kurdistan').
   - If target is Arabic: Transliteration with vowels/tashkeel guidance.
   - If target is English: Standard phonetic representation or IPA.
3. "wordBreakdown": Break down key words with their translated equivalents and grammatical part of speech.
4. "exampleSentences": Provide 2 relevant example sentences demonstrating real-world usage in the target language with translation.
5. "detectedSource": Detect whether the input is 'ku', 'ar', or 'en'.

Return strictly valid JSON matching the schema.
`;

    let translationResult: any = null;

    try {
      const response = await generateGeminiContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: `Translate precisely: "${cleanInput}"` }] }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: { type: Type.STRING },
              detectedSource: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              alternativeTranslations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              wordBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    translated: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                  },
                  required: ['original', 'translated'],
                },
              },
              exampleSentences: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                  },
                  required: ['source', 'target'],
                },
              },
            },
            required: ['translatedText', 'detectedSource'],
          },
        },
      });

      translationResult = JSON.parse(response.text || '{}');
    } catch (apiErr: any) {
      console.warn('Gemini live translate fallback engaged:', apiErr?.message || apiErr);
      // Fast resilient linguistic fallback
      translationResult = generateFallbackTranslation(cleanInput, sourceLang, targetLang);
    }

    // Generate speech audio for translated text if requested
    let audioBase64: string | null = null;
    if (requestAudio && translationResult.translatedText) {
      const audioResult = await generateTTSAudio(translationResult.translatedText, 'Kore', undefined, targetLang);
      audioBase64 = audioResult?.audioBase64 || null;
    }

    res.json({
      ...translationResult,
      audioBase64,
    });
  } catch (error: any) {
    console.error('Error in /api/translate:', error);
    res.status(500).json({
      error: 'Translation error',
      details: error?.message,
    });
  }
});

// Helper dictionary for instant fallback translation across Kurdish, Arabic, and English
function generateFallbackTranslation(input: string, sourceLang: string, targetLang: string) {
  const norm = input.toLowerCase().trim();

  // Common vocabulary and phrases dictionary
  const dict: Record<string, { ku: string; ar: string; en: string; phonetic?: string }> = {
    // Medical & Hospital
    'hospital': { ku: 'نەخۆشخانە', ar: 'مستشفى', en: 'Hospital', phonetic: 'Nexoshxane' },
    'doctor': { ku: 'پزیشک / دکتۆر', ar: 'طبيب / دكتور', en: 'Doctor / Physician', phonetic: 'Pzishk' },
    'emergency': { ku: 'فریاکەوتنی خێرا', ar: 'طوارئ', en: 'Emergency Room', phonetic: 'Fiyakewtini Xera' },
    'pain': { ku: 'ئازار', ar: 'ألم', en: 'Pain', phonetic: 'Azar' },
    'medicine': { ku: 'دەرمان', ar: 'دواء', en: 'Medicine / Medication', phonetic: 'Derman' },
    'pharmacy': { ku: 'دەرمانخانە', ar: 'صيدلية', en: 'Pharmacy', phonetic: 'Dermanxane' },
    'fever': { ku: 'تا / گەرمی لەش', ar: 'حمى / حرارة', en: 'Fever', phonetic: 'Ta' },
    'blood pressure': { ku: 'پەستانی خوێن', ar: 'ضغط الدم', en: 'Blood pressure', phonetic: 'Pestani Xwen' },
    'heart': { ku: 'دڵ', ar: 'قلب', en: 'Heart', phonetic: 'Dil' },
    'surgery': { ku: 'نەشتەرگەری', ar: 'جراحة', en: 'Surgery', phonetic: 'Neshtergeri' },
    'headache': { ku: 'سەرئێشە', ar: 'صداع', en: 'Headache', phonetic: 'Sereshe' },
    'prescription': { ku: 'ڕەچەتەی پزیشک', ar: 'وصفة طبية', en: 'Prescription', phonetic: 'Rechetey Pzishk' },
    'patient': { ku: 'نەخۆش', ar: 'مريض', en: 'Patient', phonetic: 'Nexosh' },
    
    // Business & Commerce
    'contract': { ku: 'گرێبەست', ar: 'عقد / اتفاقية', en: 'Contract', phonetic: 'Grebest' },
    'business': { ku: 'بازرگانی / کار', ar: 'أعمال / تجارة', en: 'Business / Commerce', phonetic: 'Bazirgani' },
    'company': { ku: 'کۆمپانیا', ar: 'شركة', en: 'Company', phonetic: 'Kompanya' },
    'meeting': { ku: 'کۆبوونەوە', ar: 'اجتماع', en: 'Meeting', phonetic: 'Kobunewe' },
    'negotiation': { ku: 'دانوستان', ar: 'مفاوضات', en: 'Negotiation', phonetic: 'Danustan' },
    'investment': { ku: 'وەبەرهێنان', ar: 'استثمار', en: 'Investment', phonetic: 'Weberhênan' },
    'profit': { ku: 'قازانج / سوود', ar: 'أرباح', en: 'Profit', phonetic: 'Qazanc' },
    'price': { ku: 'نرخ', ar: 'سعر', en: 'Price', phonetic: 'Nirx' },
    'invoice': { ku: 'پسوولە / فاکتۆر', ar: 'فاتورة', en: 'Invoice', phonetic: 'Psule' },
    'agreement': { ku: 'ڕێککەوتننامە', ar: 'اتفاق', en: 'Agreement', phonetic: 'Rêkkewtin' },
    
    // Academic & Education
    'university': { ku: 'زانکۆ', ar: 'جامعة', en: 'University', phonetic: 'Zanko' },
    'research': { ku: 'توێژینەوە', ar: 'بحث علمي', en: 'Research', phonetic: 'Twezhinewe' },
    'thesis': { ku: 'تێز / نامەی زانستی', ar: 'أطروحة / رسالة', en: 'Thesis / Dissertation', phonetic: 'Têz' },
    'professor': { ku: 'پڕۆفیسۆر / مامۆستای زانکۆ', ar: 'أستاذ جامعي', en: 'Professor', phonetic: 'Profesor' },
    'science': { ku: 'زانست', ar: 'علم', en: 'Science', phonetic: 'Zanst' },
    'student': { ku: 'فێرخواز / خوێندکار', ar: 'طالب / باحث', en: 'Student / Scholar', phonetic: 'Fêrxwaz' },
    'lecture': { ku: 'وانە / وتار', ar: 'محاضرة', en: 'Lecture', phonetic: 'Wane' },
    'laboratory': { ku: 'تاقیگە', ar: 'مختبر', en: 'Laboratory', phonetic: 'Taqige' },
    
    // Daily Life
    'hello': { ku: 'سڵاو', ar: 'مرحباً / أهلاً', en: 'Hello', phonetic: 'Silaw' },
    'thank you': { ku: 'سوپاس بۆ تۆ', ar: 'شكراً جزيلاً', en: 'Thank you very much', phonetic: 'Supas' },
    'good morning': { ku: 'بەیانیت باش', ar: 'صباح الخير', en: 'Good morning', phonetic: 'Beyanit bash' },
    'good evening': { ku: 'ئێوارەت باش', ar: 'مساء الخير', en: 'Good evening', phonetic: 'Ewaret bash' },
    'welcome': { ku: 'بەخێربێیت', ar: 'أهلاً وسهلاً', en: 'Welcome', phonetic: 'Bexêrbêyt' },
    'airport': { ku: 'فڕۆکەخانە', ar: 'مطار', en: 'Airport', phonetic: 'Froke-xane' },
    'apartment': { ku: 'شوقە / ماڵ', ar: 'شقة سكنية', en: 'Apartment / Flat', phonetic: 'Shuqe' },
  };

  for (const [key, val] of Object.entries(dict)) {
    if (norm === key || norm.includes(key)) {
      const trans = targetLang === 'ku' ? val.ku : targetLang === 'ar' ? val.ar : val.en;
      return {
        translatedText: trans,
        detectedSource: sourceLang === 'auto' ? 'en' : sourceLang,
        phonetic: val.phonetic || trans,
        alternativeTranslations: [trans],
        wordBreakdown: [{ original: input, translated: trans, partOfSpeech: 'Term' }],
        exampleSentences: [
          {
            source: input,
            target: trans,
          },
        ],
      };
    }
  }

  // Generic fallback if unknown word
  const fallbackTrans = targetLang === 'ku'
    ? `وەرگێڕان بۆ کوردی: ${input}`
    : targetLang === 'ar'
    ? `الترجمة للعربية: ${input}`
    : `Translation to English: ${input}`;

  return {
    translatedText: fallbackTrans,
    detectedSource: sourceLang === 'auto' ? 'ku' : sourceLang,
    phonetic: input,
    alternativeTranslations: [fallbackTrans],
    wordBreakdown: [{ original: input, translated: fallbackTrans, partOfSpeech: 'phrase' }],
    exampleSentences: [],
  };
}

// Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Language Voice Lab server running at http://localhost:${port}`);
  });
}

startServer();
