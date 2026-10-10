import React, { useState, useEffect, useRef } from 'react';
import { TargetLanguage, UILanguage, AssessmentResult, TestStep, VoiceHistoryItem } from '../types';
import { assessVoiceInput, fetchLevelTestSteps } from '../services/api';
import { VoiceRecorder, playWordOrSentence, stopCurrentAudio, isIOS, isAndroid } from '../utils/audio';
import { AudioVisualizer } from './AudioVisualizer';
import { VoiceHistory } from './VoiceHistory';
import { KuVoiceLogo } from './KuVoiceLogo';
import {
  initializeUserAuth,
  saveAttemptToFirestore,
  loadAttemptsFromFirestore,
  deleteAttemptFromFirestore,
} from '../firebase';
import confetti from 'canvas-confetti';
import {
  Mic,
  MicOff,
  Volume2,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen,
  HelpCircle,
  Play,
  Square,
  Flame,
  FileCheck,
  Languages,
  Upload,
  FileAudio,
  AlertTriangle,
  Smartphone,
  Search,
  Filter,
  Layers,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

interface VoiceAssessmentTabProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  selectedVoice: string;
  voiceSpeed: number;
  onAssessmentCompleted: (result: AssessmentResult) => void;
  onSelectTargetLang?: (lang: TargetLanguage) => void;
}

export const VoiceAssessmentTab: React.FC<VoiceAssessmentTabProps> = ({
  uiLang,
  targetLang,
  selectedVoice,
  voiceSpeed,
  onAssessmentCompleted,
  onSelectTargetLang,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  // Mode: 'full_exam' (100 progressive stages) vs 'quick_test' (1 quick spontaneous prompt)
  const [examMode, setExamMode] = useState<'full_exam' | 'quick_test'>('full_exam');
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState(false);

  // Stage browser & filters
  const [showStagesBrowser, setShowStagesBrowser] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [completedStageIds, setCompletedStageIds] = useState<Set<number>>(new Set());

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualTranscript, setManualTranscript] = useState('');
  const [showManualEdit, setShowManualEdit] = useState(false);

  // Error and notification banner
  const [micErrorNotice, setMicErrorNotice] = useState<{ title: string; desc: string } | null>(null);
  const [evalErrorMessage, setEvalErrorMessage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeMobileRecordInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isPlayingWordSequence, setIsPlayingWordSequence] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedWordTip, setSelectedWordTip] = useState<{ word: string; tip?: string; status?: string; phonetic?: string } | null>(null);

  // Local storage-backed & Firebase Firestore synced voice recording history (last 5 attempts)
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // Initialize Firebase anonymous auth and two-way sync
  useEffect(() => {
    // 1. Initial load from LocalStorage
    try {
      const stored = localStorage.getItem('ku_voice_assessment_history_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setVoiceHistory(parsed.slice(0, 5));
        }
      }
    } catch (err) {
      console.warn('Failed to load voice history from localStorage:', err);
    }

    // 2. Connect to Firebase Auth & fetch cloud backups
    const unsubscribe = initializeUserAuth(async (user) => {
      if (user) {
        setFirebaseUid(user.uid);
        try {
          const cloudAttempts = await loadAttemptsFromFirestore(user.uid, 5);
          if (cloudAttempts && cloudAttempts.length > 0) {
            setVoiceHistory((prev) => {
              const map = new Map<string, VoiceHistoryItem>();
              // Local items
              prev.forEach((item) => map.set(item.id, item));
              // Cloud items
              cloudAttempts.forEach((item) => map.set(item.id, item));
              const merged = Array.from(map.values())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);
              try {
                localStorage.setItem('ku_voice_assessment_history_v1', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        } catch (cloudErr) {
          console.warn('Firebase cloud attempts sync notice:', cloudErr);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const saveVoiceHistory = (items: VoiceHistoryItem[]) => {
    const trimmed = items.slice(0, 5);
    setVoiceHistory(trimmed);
    try {
      localStorage.setItem('ku_voice_assessment_history_v1', JSON.stringify(trimmed));
    } catch (err) {
      console.warn('LocalStorage save error (likely quota), pruning oldest attempts:', err);
      try {
        const pruned = trimmed.slice(0, 3);
        setVoiceHistory(pruned);
        localStorage.setItem('ku_voice_assessment_history_v1', JSON.stringify(pruned));
      } catch (e2) {}
    }
  };

  const handleClearHistory = () => {
    setVoiceHistory([]);
    try {
      localStorage.removeItem('ku_voice_assessment_history_v1');
    } catch (e) {}
  };

  const handleDeleteAttempt = (id: string) => {
    const updated = voiceHistory.filter((item) => item.id !== id);
    saveVoiceHistory(updated);
    // Also delete from Firestore if synced
    deleteAttemptFromFirestore(id).catch(() => {});
  };

  const handleSelectStageFromHistory = (stageId: number) => {
    const targetIdx = testSteps.findIndex((s) => s.id === stageId);
    if (targetIdx !== -1) {
      setCurrentStepIndex(targetIdx);
      setResult(null);
      setRecordedAudioBase64(null);
      setLiveTranscript('');
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Load test steps when targetLang changes
  useEffect(() => {
    async function loadSteps() {
      setLoadingSteps(true);
      try {
        const steps = await fetchLevelTestSteps(targetLang);
        setTestSteps(steps);
        setCurrentStepIndex(0);
        setResult(null);
      } catch (e) {
        console.error('Failed to load steps', e);
      } finally {
        setLoadingSteps(false);
      }
    }
    loadSteps();
  }, [targetLang]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopCurrentAudio();
    };
  }, []);

  const currentStep = testSteps[currentStepIndex] || {
    id: 1,
    level: 'A1',
    title: targetLang === 'en' ? 'Personal Introduction' : targetLang === 'ar' ? 'التعريف الأولي بالنفس' : 'ناساندنی سەرەتایی خۆت',
    titleKu: 'ناساندنی سەرەتایی خۆت',
    titleEn: 'Personal Introduction',
    titleAr: 'التعريف الأولي بالنفس',
    category: 'Daily',
    instructionKurdish: 'ناوت، تەمەنت، و خەڵکی کام شار یان وڵاتیت باس بکە.',
    instructionEnglish: 'State your name, age, and where you are from.',
    instructionArabic: 'اذكر اسمك وعمرك والمدينة أو الدولة التي تنتمي إليها.',
    promptText: targetLang === 'en' ? 'Hello, my name is ... and I am from ...' : targetLang === 'ar' ? 'مرحباً، اسمي ... وأنا من مدينة ...' : 'سڵاو، ناوم ... خەڵکی ...',
    promptKu: 'سڵاو، ناوم ... خەڵکی ...',
    promptEn: 'Hello, my name is ... and I am from ...',
    promptAr: 'مرحباً، اسمي ... وأنا من مدينة ...',
    sampleIdealAnswer: targetLang === 'en' ? 'Hello! My name is Arthur, I am twenty-five years old, and I am from London.' : targetLang === 'ar' ? 'مرحباً! اسمي أحمد، عمري خمسة وعشرون عاماً، وأنا من بغداد.' : 'سڵاو! ناوم ئاسۆیە، تەمەنم بیست و پێنج ساڵە و خەڵکی شاری سلێمانیم.',
    sampleAnswerKu: 'سڵاو! ناوم ئاسۆیە، تەمەنم بیست و پێنج ساڵە و خەڵکی شاری سلێمانیم.',
    sampleAnswerEn: 'Hello! My name is Arthur, I am twenty-five years old, and I am from London.',
    sampleAnswerAr: 'مرحباً! اسمي أحمد، عمري خمسة وعشرون عاماً، وأنا من بغداد.',
    minSpeakingSeconds: 8,
  };

  // Localized displayed titles and instructions
  const stepTitle =
    targetLang === 'ar'
      ? currentStep.titleAr || currentStep.title
      : isAr
      ? currentStep.titleAr || currentStep.title
      : isKu
      ? currentStep.titleKu || currentStep.title
      : currentStep.titleEn || currentStep.title;

  const stepInstruction =
    targetLang === 'ar'
      ? currentStep.instructionArabic || currentStep.instructionEnglish
      : isAr
      ? currentStep.instructionArabic || currentStep.instructionEnglish
      : isKu
      ? currentStep.instructionKurdish || currentStep.instructionEnglish
      : currentStep.instructionEnglish || currentStep.instructionKurdish;

  const stepPromptPhrase =
    targetLang === 'ar'
      ? currentStep.promptAr || currentStep.promptText
      : targetLang === 'ku'
      ? currentStep.promptKu || currentStep.promptText
      : currentStep.promptEn || currentStep.promptText;

  const sampleAnswerText =
    targetLang === 'ar'
      ? currentStep.sampleAnswerAr || currentStep.sampleIdealAnswer
      : targetLang === 'ku'
      ? currentStep.sampleAnswerKu || currentStep.sampleIdealAnswer
      : currentStep.sampleAnswerEn || currentStep.sampleIdealAnswer;

  // Play prompt audio in authentic target language voice
  const handlePlayPrompt = async (customText?: string, speed: number = voiceSpeed) => {
    const textToSpeak =
      customText ||
      (targetLang === 'ar'
        ? currentStep.promptAr || currentStep.instructionArabic || currentStep.titleAr || currentStep.promptText
        : targetLang === 'ku'
        ? currentStep.promptKu || currentStep.instructionKurdish || currentStep.titleKu || currentStep.promptText
        : currentStep.promptEn || currentStep.instructionEnglish || currentStep.titleEn || currentStep.promptText);

    try {
      stopCurrentAudio();
      setIsPlayingAudio(true);
      await playWordOrSentence({
        text: textToSpeak,
        lang: targetLang,
        voiceName: selectedVoice,
        speed: speed || 1.0,
      });
    } catch (e) {
      console.warn('Audio play fallback', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Play an individual word cleanly
  const handlePlayWord = async (word: string, speed: number = 0.8) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim();
    if (!cleanWord) return;

    try {
      stopCurrentAudio();
      setPlayingWord(cleanWord);
      await playWordOrSentence({
        text: cleanWord,
        lang: targetLang,
        voiceName: selectedVoice,
        speed: speed,
      });
    } catch (e) {
      console.warn('Word audio play error', e);
    } finally {
      setPlayingWord((curr) => (curr === cleanWord ? null : curr));
    }
  };

  // Play all words in sequence
  const handlePlayWordSequence = async (words: { word: string }[]) => {
    if (isPlayingWordSequence) {
      stopCurrentAudio();
      setIsPlayingWordSequence(false);
      setPlayingWord(null);
      return;
    }

    try {
      setIsPlayingWordSequence(true);
      for (const w of words) {
        const cleanW = w.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim();
        if (!cleanW) continue;
        setPlayingWord(cleanW);
        await playWordOrSentence({
          text: cleanW,
          lang: targetLang,
          voiceName: selectedVoice,
          speed: 0.85,
        });
        await new Promise((r) => setTimeout(r, 320));
      }
    } catch (e) {
      console.warn('Words sequence error', e);
    } finally {
      setIsPlayingWordSequence(false);
      setPlayingWord(null);
    }
  };

  // Audio file upload fallback
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMicErrorNotice(null);
    setEvalErrorMessage(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.split(',')[1] || '';
      const mime = file.type || 'audio/webm';
      setRecordedAudioBase64(base64);
      setRecordedMimeType(mime);
      submitForEvaluation(base64, mime, '');
    };
    reader.readAsDataURL(file);
  };

  // Start Recording
  const handleStartRecording = async () => {
    setMicErrorNotice(null);
    setEvalErrorMessage(null);
    setResult(null);
    setRecordedAudioBase64(null);
    setLiveTranscript('');
    setManualTranscript('');
    setRecordingSeconds(0);

    try {
      const recorder = new VoiceRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Web Speech Recognition
      const isMobile = isIOS() || isAndroid();
      const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!isMobile && SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang =
            targetLang === 'ar' ? 'ar-SA' : targetLang === 'ku' ? 'ckb-IQ' : 'en-US';
          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              interim += event.results[i][0].transcript;
            }
            if (interim.trim()) {
              setLiveTranscript(interim);
              setManualTranscript(interim);
            }
          };
          recognition.onerror = (e: any) => console.warn('Recognition note:', e?.error || e);
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition note:', e);
        }
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      setMicErrorNotice({
        title: isAr
          ? 'تم رفض إذن الوصول للميكروفون'
          : isKu
          ? 'ڕێگەپێدانی مایکرۆفۆن نەدراوە'
          : 'Microphone Permission Denied',
        desc: isAr
          ? 'قام المتصفح بحجب الميكروفون. انقر على أيقونة القفل 🔒 في شريط عنوان المتصفح للسماح بالوصول، أو استخدم خيار رفع ملف صوتي أو كتابة النص.'
          : isKu
          ? 'وێبگەڕەکەت ڕێگری لە مایکرۆفۆن کردووە. کلیک لەسەر نیشانەی قوفڵ 🔒 لە بەشی سەرەوەی ناونیشانی وێبگەڕەکەت بکە و ڕێگە بە مایکرۆفۆن بدە، یاخود دەتوانیت لە ڕێگەی دوگمەی خوارەوە فایلی تۆماری دەنگ باربکەیت یان دەق بنووسیت.'
          : 'Your browser denied microphone access. Click the lock 🔒 icon in your browser address bar to allow microphone, or use the button below to upload an audio recording or type your text.',
      });
    }
  };

  // Stop Recording
  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const { base64, mimeType } = await recorderRef.current.stop();
      setRecordedAudioBase64(base64);
      setRecordedMimeType(mimeType);
      setIsRecording(false);

      const transcriptToSend = manualTranscript || liveTranscript || undefined;
      submitForEvaluation(base64, mimeType, transcriptToSend || '');
    } catch (e) {
      console.error('Error stopping recorder', e);
      setIsRecording(false);
    }
  };

  // Submit audio to Gemini for comprehensive evaluation
  const submitForEvaluation = async (
    audioBase64: string | null,
    mimeType: string,
    transcriptText: string
  ) => {
    setIsEvaluating(true);
    setResult(null);

    const targetExpectedText =
      targetLang === 'ar'
        ? currentStep.sampleAnswerAr || currentStep.promptAr || currentStep.promptText
        : targetLang === 'ku'
        ? currentStep.sampleAnswerKu || currentStep.promptKu || currentStep.promptText
        : currentStep.sampleAnswerEn || currentStep.promptEn || currentStep.promptText;

    try {
      const evaluation = await assessVoiceInput({
        audioBase64: audioBase64 || undefined,
        mimeType,
        transcript: manualTranscript || transcriptText || undefined,
        targetText: targetExpectedText,
        language: targetLang,
        taskType: 'level_test',
      });

      setResult(evaluation);
      onAssessmentCompleted(evaluation);

      // Save speaking attempt to local storage-backed Voice History
      if (audioBase64) {
        const historyItem: VoiceHistoryItem = {
          id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          stageId: currentStep.id,
          stageLevel: currentStep.level,
          stageTitle: stepTitle,
          language: targetLang,
          timestamp: Date.now(),
          durationSeconds: recordingSeconds || 0,
          audioBase64,
          mimeType: mimeType || 'audio/webm',
          overallScore: evaluation.overallScore,
          cefrLevel: evaluation.cefrLevel,
          scores: evaluation.scores,
          recognizedText: evaluation.recognizedText,
        };
        saveVoiceHistory([historyItem, ...voiceHistory.filter((h) => h.id !== historyItem.id)]);
        // Persist to Firebase Firestore database
        saveAttemptToFirestore(historyItem, firebaseUid || undefined).catch((err) => {
          console.warn('Firebase cloud sync:', err);
        });
      }

      // Track completed stage
      setCompletedStageIds((prev) => new Set(prev).add(currentStep.id));

      // Trigger celebration confetti if score is high
      if (evaluation.overallScore >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
        });
      }
    } catch (err: any) {
      console.error('Assessment failed', err);
      setEvalErrorMessage(
        isAr
          ? 'حدث خطأ أثناء تقييم الصوت. يرجى إعادة المحاولة والتحدث بوضوح.'
          : isKu
          ? 'کێشەیەک ڕوویدا لە کاتی هەڵسەنگاندنی دەنگ. تکایە دووبارە تاقی بکەرەوە.'
          : 'Failed to evaluate voice. Please try recording again.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  // Visual theme based on authentic score (20, 40, 50, 55, 60, 70, 80, 90, 95, 100)
  const getScoreVisuals = (score: number) => {
    if (score >= 95) {
      return {
        circle: 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40',
        labelKu: 'نایاب و بێ هەڵە (Mastery)',
        labelAr: 'إتقان تام وممتاز',
        labelEn: 'Native Mastery',
        barColor: 'bg-gradient-to-r from-cyan-400 to-emerald-400',
      };
    }
    if (score >= 88) {
      return {
        circle: 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-md shadow-emerald-500/25',
        labelKu: 'زۆر پێشکەوتوو (Excellent)',
        labelAr: 'ممتاز وطلاقة عالية',
        labelEn: 'Excellent',
        barColor: 'bg-emerald-400',
      };
    }
    if (score >= 75) {
      return {
        circle: 'border-emerald-500/80 bg-emerald-950/40 text-emerald-400',
        labelKu: 'زۆر باش (Very Good)',
        labelAr: 'جيد جداً',
        labelEn: 'Very Good',
        barColor: 'bg-emerald-500',
      };
    }
    if (score >= 65) {
      return {
        circle: 'border-teal-500/80 bg-teal-950/40 text-teal-300',
        labelKu: 'باش (Good)',
        labelAr: 'جيد',
        labelEn: 'Good',
        barColor: 'bg-teal-500',
      };
    }
    if (score >= 55) {
      return {
        circle: 'border-sky-500/80 bg-sky-950/40 text-sky-300',
        labelKu: 'مامناوەند (Intermediate)',
        labelAr: 'متوسط',
        labelEn: 'Intermediate',
        barColor: 'bg-sky-500',
      };
    }
    if (score >= 45) {
      return {
        circle: 'border-amber-500/80 bg-amber-950/40 text-amber-400 shadow-amber-500/20',
        labelKu: 'سەرەتایی (Developing)',
        labelAr: 'أساسي قيد التطور',
        labelEn: 'Developing',
        barColor: 'bg-amber-500',
      };
    }
    if (score >= 35) {
      return {
        circle: 'border-orange-500/80 bg-orange-950/40 text-orange-400 shadow-orange-500/20',
        labelKu: 'پێویستی بە مەشقە (Needs Work)',
        labelAr: 'يحتاج تدريباً مكثفاً',
        labelEn: 'Needs Practice',
        barColor: 'bg-orange-500',
      };
    }
    return {
      circle: 'border-rose-500/80 bg-rose-950/40 text-rose-400 shadow-rose-500/20',
      labelKu: 'کەمترین دەنگ یان ناتەواو (Incomplete)',
      labelAr: 'استجابة غير مكتملة',
      labelEn: 'Incomplete',
      barColor: 'bg-rose-500',
    };
  };

  // Color helper for CEFR badges
  const getCefrBadgeColor = (level: string) => {
    switch (level) {
      case 'C2':
      case 'C1':
        return 'from-purple-500 to-indigo-500 text-white border-purple-400/50 shadow-purple-500/30';
      case 'B2':
        return 'from-emerald-500 to-teal-500 text-slate-950 border-emerald-400/50 shadow-emerald-500/30';
      case 'B1':
        return 'from-cyan-500 to-blue-500 text-slate-950 border-cyan-400/50 shadow-cyan-500/30';
      case 'A2':
        return 'from-amber-500 to-orange-500 text-slate-950 border-amber-400/50 shadow-amber-500/30';
      default:
        return 'from-slate-600 to-slate-700 text-white border-slate-500 shadow-slate-500/20';
    }
  };

  // Filtered steps for the 100-stage browser
  const filteredSteps = testSteps.filter((step) => {
    const matchesLevel =
      levelFilter === 'all' ||
      step.level === levelFilter ||
      (levelFilter === 'C1/C2' && (step.level === 'C1' || step.level === 'C2'));
    const matchesCategory = categoryFilter === 'all' || step.category === categoryFilter;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      step.id.toString() === term ||
      step.title.toLowerCase().includes(term) ||
      (step.titleKu && step.titleKu.toLowerCase().includes(term)) ||
      (step.titleAr && step.titleAr.includes(term)) ||
      (step.titleEn && step.titleEn.toLowerCase().includes(term));
    return matchesLevel && matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? 'اختبار قياس النطق والطلاقة الشامل بالذكاء الاصطناعي (CEFR 100)'
                  : isKu
                  ? 'تاقیکردنەوەی پێشکەوتووی دەنگی بە پێوەری نێودەوڵەتی CEFR (١٠٠ قۆناغ)'
                  : 'CEFR International Speaking Proficiency Exam (100 Progressive Stages)'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <KuVoiceLogo size="md" glow={true} />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {isAr
                  ? 'اختبار قياس مستوى التحدث الصوتي (100 مرحلة)'
                  : isKu
                  ? 'تاقیکردنەوەی ئاستی قسەکردن بە دەنگ (١٠٠ قۆناغ)'
                  : 'Voice Speaking Level Assessment (100 Stages)'}
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              {isAr
                ? `سجل صوتك باللغة ${
                    targetLang === 'en' ? 'الإنجليزية' : targetLang === 'ar' ? 'العربية الفصحى' : 'الكوردية'
                  }، وسيقوم الذكاء الاصطناعي بالاستماع لمخارج الحروف بدقة وتحليل الطلاقة والقواعد لمنحك التقييم الشامل.`
                : isKu
                ? `دەنگت تۆمار بکە بە ${
                    targetLang === 'en' ? 'ئینگلیزی' : targetLang === 'ar' ? 'عەرەبی' : 'کوردی'
                  }، زیرەکی دەستکرد بە وریایی گوێت لێ دەگرێت و ئاستی بێژەکردن، ڕەوانی، ڕێزمان، و وشەکانت پێ دەڵێت.`
                : `Record your voice in ${
                    targetLang === 'en' ? 'English' : targetLang === 'ar' ? 'Arabic' : 'Kurdish'
                  }. AI will evaluate your phonetics, rhythm, fluency, and CEFR level with comprehensive diagnostics.`}
            </p>
          </div>

          {/* Controls: Target Language Switcher & Exam Mode */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-center">
            {/* Direct Target Speaking Language Selector */}
            {onSelectTargetLang && (
              <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-2xl shadow-inner gap-0.5">
                <button
                  type="button"
                  onClick={() => onSelectTargetLang('en')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    targetLang === 'en'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="Practice in English"
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTargetLang('ku')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    targetLang === 'ku'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="مەشق بە زمانی کوردی"
                >
                  <span>☀️</span>
                  <span>کوردی</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTargetLang('ar')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    targetLang === 'ar'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="التدريب باللغة العربية"
                >
                  <span>🇸🇦</span>
                  <span>العربية</span>
                </button>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="flex bg-slate-950/70 border border-slate-800 p-1 rounded-2xl">
              <button
                onClick={() => {
                  setExamMode('full_exam');
                  setResult(null);
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  examMode === 'full_exam'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr
                  ? 'الامتحان (100 مرحلة)'
                  : isKu
                  ? 'تاقیکردنەوە (١٠٠ قۆناغ)'
                  : 'Comprehensive (100)'}
              </button>
              <button
                onClick={() => {
                  setExamMode('quick_test');
                  setResult(null);
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  examMode === 'quick_test'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'الاختبار السريع' : isKu ? 'تاقیکردنەوەی خێرا' : 'Quick Test'}
              </button>
            </div>
          </div>
        </div>

        {/* 100 Stages Browser Toggle Bar */}
        {examMode === 'full_exam' && testSteps.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? 'المرحلة الحالية:' : isKu ? 'قۆناغی ئێستا:' : 'Active Stage:'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                #{currentStep.id} - {currentStep.level}
              </span>
              <span className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-sm">
                {stepTitle}
              </span>
            </div>

            <button
              onClick={() => setShowStagesBrowser(!showStagesBrowser)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {showStagesBrowser
                  ? isAr
                    ? 'إغلاق دليل المراحل'
                    : isKu
                    ? 'داخستنی ڕێبەری قۆناغەکان'
                    : 'Close Stage Browser'
                  : isAr
                  ? `استعراض كافة المراحل (${testSteps.length})`
                  : isKu
                  ? `پیشاندانی هەموو قۆناغەکان (${testSteps.length})`
                  : `Browse All ${testSteps.length} Stages`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStagesBrowser ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Expandable 100-Stage Grid Browser */}
        {examMode === 'full_exam' && showStagesBrowser && testSteps.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
            {/* Filter Bar: Level tabs + Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Level Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: isAr ? 'الكل (100)' : isKu ? 'هەموو (١٠٠)' : 'All (100)' },
                  { id: 'A1', label: 'A1 (1-15)' },
                  { id: 'A2', label: 'A2 (16-35)' },
                  { id: 'B1', label: 'B1 (36-55)' },
                  { id: 'B2', label: 'B2 (56-75)' },
                  { id: 'C1', label: 'C1 (76-90)' },
                  { id: 'C2', label: 'C2 (91-100)' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setLevelFilter(lvl.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      levelFilter === lvl.id
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              {/* Search stage */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 right-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث برقم أو اسم المرحلة...' : isKu ? 'گەڕان بە ژمارە یان ناوی قۆناغ...' : 'Search stage # or title...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Stages Scrollable Grid */}
            <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 scrollbar-thin">
              {filteredSteps.map((step, idx) => {
                const globalIndex = testSteps.findIndex((s) => s.id === step.id);
                const isCurrent = globalIndex === currentStepIndex;
                const isCompleted = completedStageIds.has(step.id);
                const titleStr =
                  targetLang === 'ar'
                    ? step.titleAr || step.title
                    : isAr
                    ? step.titleAr || step.title
                    : isKu
                    ? step.titleKu || step.title
                    : step.titleEn || step.title;

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setCurrentStepIndex(globalIndex);
                      setResult(null);
                      setRecordedAudioBase64(null);
                      setLiveTranscript('');
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg'
                        : isCompleted
                        ? 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-slate-600'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 text-[10px] font-bold">
                      <span className="flex items-center gap-1">
                        #{step.id}
                        {isCompleted && <Check className="w-3 h-3 text-emerald-400 inline" />}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono">
                        {step.level}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium leading-tight truncate" title={titleStr}>
                      {titleStr}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Testing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Question & Recorder Box (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-sm relative">
            {/* Stage Quick Navigation Bar */}
            {examMode === 'full_exam' && testSteps.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
                <button
                  disabled={currentStepIndex === 0}
                  onClick={() => {
                    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                    setResult(null);
                    setRecordedAudioBase64(null);
                    setLiveTranscript('');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{isAr ? 'المرحلة السابقة' : isKu ? 'قۆناغی پێشوو' : 'Previous'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">
                    {isAr
                      ? `المرحلة ${currentStep.id} من ${testSteps.length}`
                      : isKu
                      ? `قۆناغی ${currentStep.id} لە ${testSteps.length}`
                      : `Stage ${currentStep.id} of ${testSteps.length}`}
                  </span>
                  {/* Jump select dropdown */}
                  <select
                    value={currentStepIndex}
                    onChange={(e) => {
                      setCurrentStepIndex(Number(e.target.value));
                      setResult(null);
                      setRecordedAudioBase64(null);
                      setLiveTranscript('');
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {testSteps.map((s, idx) => (
                      <option key={s.id} value={idx}>
                        #{s.id} ({s.level}) - {targetLang === 'ar' ? (s.titleAr || s.title) : isKu ? (s.titleKu || s.title) : (s.titleEn || s.title)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  disabled={currentStepIndex >= testSteps.length - 1}
                  onClick={() => {
                    setCurrentStepIndex((prev) => Math.min(testSteps.length - 1, prev + 1));
                    setResult(null);
                    setRecordedAudioBase64(null);
                    setLiveTranscript('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{isAr ? 'المرحلة التالية' : isKu ? 'قۆناغی داهاتوو' : 'Next'}</span>
                  <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            )}

            {/* Step badge & Audio prompt listen */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                  {currentStep.level}
                </span>
                {currentStep.category && (
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-[11px] font-medium">
                    {currentStep.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sample Answer Toggle */}
                {sampleAnswerText && (
                  <button
                    onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
                    title={isAr ? 'نموذج الإجابة' : isKu ? 'نموونەی وەڵام' : 'Sample Answer'}
                  >
                    {showSampleAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{isAr ? 'نموذج إجابة' : isKu ? 'نموونەی وەڵام' : 'Model Answer'}</span>
                  </button>
                )}

                {/* Listen button */}
                <button
                  onClick={() => handlePlayPrompt()}
                  disabled={isPlayingAudio}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  title={isAr ? 'استمع إلى نص السؤال' : isKu ? 'گوێگرتن لە پرسیار' : 'Listen to prompt'}
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isPlayingAudio
                      ? isAr
                        ? 'جاري التشغيل...'
                        : isKu
                        ? 'پەخشکردن...'
                        : 'Playing...'
                      : isAr
                      ? 'استمع للطلب'
                      : isKu
                      ? 'گوێبگرە'
                      : 'Listen'}
                  </span>
                </button>
              </div>
            </div>

            {/* Prompt Question Title & Description */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {stepTitle}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {stepInstruction}
            </p>

            {/* Starter phrase hint with audio listen button */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 mb-4 flex items-center justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">
                    {isAr ? 'بداية الجملة المقترحة:' : isKu ? 'دەستپێکی نموونەیی:' : 'Starting phrase:'}
                  </span>{' '}
                  <span className="text-emerald-300 italic">{stepPromptPhrase}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePlayPrompt(stepPromptPhrase)}
                disabled={isPlayingAudio}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                title={isAr ? 'استمع لبداية الجملة' : isKu ? 'خوێندنەوەی دەستپێکی ڕستە' : 'Listen to starter'}
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'استمع' : isKu ? 'گوێبگرە' : 'Listen'}</span>
              </button>
            </div>

            {/* Sample Ideal Answer Dropdown / Panel */}
            {showSampleAnswer && sampleAnswerText && (
              <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAr ? 'نموذج الإجابة الصوتية الفصيحة:' : isKu ? 'نموونەی وەڵامی پاراو:' : 'Sample Ideal Response:'}
                  </span>
                  <button
                    onClick={() => handlePlayPrompt(sampleAnswerText)}
                    disabled={isPlayingAudio}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isAr ? 'استمع للنموذج' : isKu ? 'گوێ لە نموونەکە بگرە' : 'Listen'}</span>
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed italic">
                  "{sampleAnswerText}"
                </p>
              </div>
            )}

            {/* Mic Permission Warning Notice if Denied */}
            {micErrorNotice && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{micErrorNotice.title}</span>
                  </div>
                  <button
                    onClick={() => setMicErrorNotice(null)}
                    className="text-amber-400/80 hover:text-amber-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="leading-relaxed text-slate-300">
                  {micErrorNotice.desc}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحميل ملف صوتي' : isKu ? 'فایلی دەنگی باربکە' : 'Upload Audio File'}</span>
                  </button>
                  <button
                    onClick={() => setShowManualEdit(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    <span>{isAr ? 'أو كتابة النص يدوياً' : isKu ? 'یان دەق بنووسە' : 'Or Type Text'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Evaluation Error Message */}
            {evalErrorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
                <span>{evalErrorMessage}</span>
                <button
                  onClick={() => setEvalErrorMessage(null)}
                  className="text-red-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Live Audio Visualizer */}
            <div className="mb-6">
              <AudioVisualizer
                isRecording={isRecording}
                getFrequencyData={() => recorderRef.current?.getFrequencyData() || null}
              />
            </div>

            {/* Big Mic Button & Controls */}
            <div className="flex flex-col items-center justify-center gap-4 py-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={isEvaluating}
                  className="group relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20 pointer-events-none" />
                  <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="group relative w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <Square className="w-7 h-7 fill-white" />
                </button>
              )}

              <div className="text-center">
                <p className="text-sm font-semibold text-white">
                  {isRecording
                    ? isAr
                      ? `جاري تسجيل صوتك (${recordingSeconds} ثانية)...`
                      : isKu
                      ? `دەنگت تۆمار دەکرێت (${recordingSeconds} چرکە)`
                      : `Recording... (${recordingSeconds}s)`
                    : isAr
                    ? 'اضغط على زر الميكروفون للتحدث'
                    : isKu
                    ? 'داگرە بۆ دەستپێکردنی قسەکردن'
                    : 'Tap to speak your answer'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isRecording
                    ? isAr
                      ? 'اضغط على الزر الأحمر عند الانتهاء لحفظ وتقييم النطق'
                      : isKu
                      ? 'کاتێک قسەکردنت تەواو بوو، دووبارە دایگرە بۆ وەرگرتنی ئەنجام'
                      : 'Tap again when finished to calculate your score'
                    : isAr
                    ? `المدة الموصى بها: تحدث لمدة ${currentStep.minSpeakingSeconds} ثانية على الأقل`
                    : isKu
                    ? `لانیکەم پێشنیار کراوە: ${currentStep.minSpeakingSeconds} چرکە قسە بکەیت`
                    : `Recommended: speak for at least ${currentStep.minSpeakingSeconds} seconds`}
                </p>
              </div>

              {/* Audio file upload & mobile native recording & text test alternatives */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <input
                  ref={nativeMobileRecordInputRef}
                  type="file"
                  accept="audio/*"
                  // @ts-ignore
                  capture="microphone"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => nativeMobileRecordInputRef.current?.click()}
                  disabled={isRecording || isEvaluating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-300 font-semibold transition-colors shadow-sm cursor-pointer"
                  title={isAr ? 'تسجيل عبر مسجل الهاتف المدمج' : isKu ? 'تۆماری دەنگ لە ڕێگەی ئایفۆن یان ئەندرۆید' : 'Native Mobile Voice Recorder'}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسجل الهاتف' : isKu ? 'تۆماری مۆبایل' : 'Mobile Mic'}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording || isEvaluating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isAr ? 'رفع ملف صوتي' : isKu ? 'بارکردنی دەنگ' : 'Upload File'}</span>
                </button>

                <button
                  onClick={() => setShowManualEdit(!showManualEdit)}
                  disabled={isRecording || isEvaluating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  <FileAudio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'تعديل النص' : isKu ? 'دەستکاری دەق' : 'Edit Text'}</span>
                </button>
              </div>
            </div>

            {/* Live Transcript / Manual Edit Box */}
            {(liveTranscript || showManualEdit) && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {isAr ? 'النص الصوتي المُلتقط:' : isKu ? 'دەقی دەنگەکەت:' : 'Transcribed Audio:'}
                  </span>
                  <button
                    onClick={() => setShowManualEdit(!showManualEdit)}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    {showManualEdit
                      ? isAr ? 'إغلاق المحرر' : isKu ? 'داخستن' : 'Close'
                      : isAr ? 'تعديل يدوي' : isKu ? 'دەستکاری' : 'Edit'}
                  </button>
                </div>

                {showManualEdit ? (
                  <div className="space-y-2">
                    <textarea
                      value={manualTranscript}
                      onChange={(e) => setManualTranscript(e.target.value)}
                      placeholder={isAr ? 'اكتب ما قلته هنا للتقييم...' : isKu ? 'ئەوەی وتت لێرە بنووسە بۆ هەڵسەنگاندن...' : 'Type or edit what you said...'}
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => submitForEvaluation(recordedAudioBase64, recordedMimeType, manualTranscript)}
                      disabled={isEvaluating || !manualTranscript.trim()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isAr ? 'تقييم بناءً على هذا النص' : isKu ? 'هەڵسەنگاندن لەگەڵ ئەم دەقە' : 'Evaluate with this text'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-200 italic font-medium">
                    "{liveTranscript || (isAr ? 'تحدث الآن، وسيظهر كلامك هنا...' : isKu ? 'قسە بکە، لێرە دەردەکەوێت...' : 'Start speaking...')}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: In-depth Evaluation Result (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {isEvaluating ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 animate-bounce">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? 'جاري تحليل نطقك الصوتي...' : isKu ? 'شیکردنەوەی دەنگەکەت...' : 'Analyzing Spoken Audio...'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {isAr
                  ? 'يقوم محرك الذكاء الاصطناعي بقياس مخارج الحروف، الترددات، الطلاقة والقواعد بدقة وفق معايير CEFR...'
                  : isKu
                  ? 'زیرەکی دەستکرد پێوانەی بێژەکردن، پیتە دەنگییەکان، ڕەوانی دەربڕین، و ڕێزمان دەکات بە پێوەری نێودەوڵەتی...'
                  : 'Evaluating phonemes, rhythm, intonation, and CEFR speaking proficiency benchmarks...'}
              </p>
            </div>
          ) : result ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 animate-in fade-in duration-300 backdrop-blur-sm">
              {/* CEFR Level Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    {isAr
                      ? 'المستوى المعتمد (CEFR):'
                      : isKu
                      ? 'ئاستی دیاریکراوی CEFR:'
                      : 'Assessed CEFR Level:'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-2xl font-black px-3 py-1 rounded-xl bg-gradient-to-r border shadow-lg ${getCefrBadgeColor(
                        result.cefrLevel
                      )}`}
                    >
                      {result.cefrLevel}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      {result.cefrLevel === 'C1' || result.cefrLevel === 'C2'
                        ? isAr
                          ? 'طلاقة تامة ومستوى متقدم (Fluent / Advanced)'
                          : isKu
                          ? 'زۆر باڵا و ڕەوان (Fluent / Advanced)'
                          : 'Fluent / Advanced'
                        : result.cefrLevel === 'B2'
                        ? isAr
                          ? 'مستقل وفوق المتوسط (Upper Intermediate)'
                          : isKu
                          ? 'باش و سەربەخۆ (Upper Intermediate)'
                          : 'Upper Intermediate'
                        : result.cefrLevel === 'B1'
                        ? isAr
                          ? 'مستوى متوسط (Intermediate)'
                          : isKu
                          ? 'ئاستی ناوەند (Intermediate)'
                          : 'Intermediate'
                        : isAr
                        ? 'مستوى أساسي / مبتدئ (Elementary / Basic)'
                        : isKu
                        ? 'دەستپێکەر بەرەو پێشچوو (Elementary)'
                        : 'Elementary / Basic'}
                    </span>
                  </div>
                </div>

                {/* Overall Score Meter with Dynamic Authentic Visuals */}
                {(() => {
                  const visuals = getScoreVisuals(result.overallScore);
                  return (
                    <div className="text-center flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center shadow-inner transition-all ${visuals.circle}`}>
                        <span className="text-xl font-black">
                          {result.overallScore}
                        </span>
                        <span className="text-[9px] opacity-70">/ 100</span>
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 font-bold block">
                        {isAr ? visuals.labelAr : isKu ? visuals.labelKu : visuals.labelEn}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">
                        {isAr ? 'المعدل العام' : isKu ? 'نمرەی گشتی' : 'Overall Score'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* 4 Metrics Progress Bars */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">
                  {isAr ? 'تفصيل المهارات الصوتية:' : isKu ? 'وردەکاری توانستەکان:' : 'Component Breakdown:'}
                </span>

                {[
                  {
                    nameAr: 'مخارج الحروف والنطق',
                    nameKu: 'بێژەکردن (Pronunciation)',
                    nameEn: 'Pronunciation',
                    val: result.scores.pronunciation,
                    color: 'bg-emerald-500',
                  },
                  {
                    nameAr: 'الطلاقة والانسيابية',
                    nameKu: 'ڕەوانی دەربڕین (Fluency)',
                    nameEn: 'Fluency',
                    val: result.scores.fluency,
                    color: 'bg-teal-500',
                  },
                  {
                    nameAr: 'الثروة اللغوية',
                    nameKu: 'دەوڵەمەندی وشە (Vocabulary)',
                    nameEn: 'Vocabulary',
                    val: result.scores.vocabulary,
                    color: 'bg-cyan-500',
                  },
                  {
                    nameAr: 'سلامة القواعد والتركيب',
                    nameKu: 'ڕێزمانی دروست (Grammar)',
                    nameEn: 'Grammar',
                    val: result.scores.grammar,
                    color: 'bg-blue-500',
                  },
                ].map((item) => (
                  <div key={item.nameEn} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        {isAr ? item.nameAr : isKu ? item.nameKu : item.nameEn}
                      </span>
                      <span className="font-bold text-slate-200">{item.val}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Word-by-word pronunciation highlights with instant audio playback */}
              {result.wordsAnalysis && result.wordsAnalysis.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-300">
                      {isAr ? 'التحليل الصوتي للكلمات:' : isKu ? 'شیکردنەوەی وشە بە وشە:' : 'Word-by-Word Analysis:'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayWordSequence(result.wordsAnalysis || [])}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                          isPlayingWordSequence
                            ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-750'
                        }`}
                        title={isAr ? 'قراءة جميع الكلمات بالتتابع' : isKu ? 'خوێندنەوەی هەموو وشەکان بە نۆرە' : 'Read all words in sequence'}
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>
                          {isPlayingWordSequence
                            ? isAr
                              ? 'إيقاف'
                              : isKu
                              ? 'ڕاگرتن'
                              : 'Stop'
                            : isAr
                            ? 'قراءة بالتتابع'
                            : isKu
                            ? 'خوێندنەوەی هەمووی'
                            : 'Read All Words'}
                        </span>
                      </button>

                      <span className="text-[10px] text-slate-400">
                        {isAr ? '(اضغط على الكلمة للاستماع)' : isKu ? '(کلیک لە وشەکە بکە بۆ گوێگرتن)' : '(Tap word to listen)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.wordsAnalysis.map((w, i) => {
                      const cleanW = w.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim();
                      const isCurrentPlaying = playingWord === cleanW;
                      const isExcellent = w.status === 'excellent';
                      const isGood = w.status === 'good';

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            handlePlayWord(cleanW);
                            setSelectedWordTip(w);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isCurrentPlaying
                              ? 'bg-emerald-500 text-slate-950 font-bold scale-105 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300'
                              : isExcellent
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                              : isGood
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                          }`}
                          title={isAr ? `استمع لنطق "${w.word}"` : isKu ? `گوێگرتن لە خوێندنەوەی "${w.word}"` : `Listen to "${w.word}"`}
                        >
                          <span>{w.word}</span>
                          <Volume2 className="w-3 h-3 opacity-75" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Word popup tip with Listen button */}
                  {selectedWordTip && (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-300 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>
                            {isAr ? 'الكلمة: ' : isKu ? 'وشەی: ' : 'Word: '}
                            <span className="text-emerald-400">"{selectedWordTip.word}"</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              selectedWordTip.status === 'excellent'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : selectedWordTip.status === 'good'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {selectedWordTip.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayWord(selectedWordTip.word, 0.75)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                            title={isAr ? 'استمع لنطق الكلمة' : isKu ? 'خوێندنەوەی وشەکە' : 'Listen to word'}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'استمع' : isKu ? 'گوێبگرە' : 'Listen'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedWordTip(null)}
                            className="text-slate-400 hover:text-white cursor-pointer px-1 py-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {selectedWordTip.phonetic && (
                        <p className="text-emerald-400 font-mono text-[11px]">
                          {selectedWordTip.phonetic}
                        </p>
                      )}

                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {selectedWordTip.tip ||
                          (isAr
                            ? 'نطق سليم ومخارج واضحة.'
                            : isKu
                            ? 'دەربڕینێکی زۆر باش و تەواو سروشتی.'
                            : 'Good pronunciation, keep practicing.')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Constructive Evaluator Feedback */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isAr ? 'تقرير خبير اللغة المحكّم:' : isKu ? 'ڕای پسپۆڕی زمان:' : 'Expert Evaluator Feedback:'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr
                    ? result.feedbackArabic || result.feedbackEnglish
                    : isKu
                    ? result.feedbackKurdish
                    : result.feedbackEnglish}
                </p>
              </div>

              {/* Grammar Corrections if any */}
              {result.corrections && result.corrections.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {isAr ? 'تصحيحات نحوية وتعبيرية:' : isKu ? 'چاکسازی ڕێزمانی و دەربڕین:' : 'Grammar Corrections:'}
                    </span>
                  </span>
                  {result.corrections.map((corr, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1"
                    >
                      <div className="text-red-400 line-through">"{corr.original}"</div>
                      <div className="text-emerald-300 font-semibold">✓ "{corr.improved}"</div>
                      <div className="text-slate-400 text-[11px]">
                        {isAr
                          ? corr.explanationArabic || corr.explanationEnglish
                          : isKu
                          ? corr.explanationKurdish
                          : corr.explanationEnglish}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Retest button */}
              <button
                onClick={() => {
                  setResult(null);
                  setRecordedAudioBase64(null);
                  setLiveTranscript('');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isAr ? 'إعادة تسجيل الصوت والاختبار' : isKu ? 'دووبارە تۆمارکردنەوە و تاقیکردنەوە' : 'Retake this test'}
                </span>
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8 text-center">
              <Award className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-400 mb-1">
                {isAr ? 'بانتظار تسجيل صوتك' : isKu ? 'چاوەڕێی دەنگەکەتین' : 'Awaiting Your Voice'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {isAr
                  ? 'اضغط على زر الميكروفون على اليمين وتحدث بوضوح، وسيقوم الذكاء الاصطناعي بتقييم مخارج الحروف والطلاقة بدقة متناهية.'
                  : isKu
                  ? 'دوگمەی مایکرۆفۆن لە لای چەپ دابگرە، وەڵامی پرسیارەکە بە دەنگ بدەرەوە بۆ دەستکەوتنی ئاستی فەرمیت.'
                  : 'Click the mic button to speak. Your full CEFR diagnostic report will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Voice History - Local Storage-backed Last 5 Recorded Attempts */}
      <VoiceHistory
        history={voiceHistory}
        uiLang={uiLang}
        onClearHistory={handleClearHistory}
        onDeleteAttempt={handleDeleteAttempt}
        onSelectStage={handleSelectStageFromHistory}
      />
    </div>
  );
};
