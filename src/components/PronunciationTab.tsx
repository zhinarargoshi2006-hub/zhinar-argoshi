import React, { useState, useRef } from 'react';
import { TargetLanguage, UILanguage, PronunciationDrill, AssessmentResult } from '../types';
import { PRONUNCIATION_DRILLS } from '../data/practiceData';
import { assessVoiceInput } from '../services/api';
import { VoiceRecorder, playWordOrSentence, stopCurrentAudio } from '../utils/audio';
import { AudioVisualizer } from './AudioVisualizer';
import {
  Volume2,
  Mic,
  Square,
  CheckCircle2,
  Sparkles,
  Flame,
  Award,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  Upload,
  AlertTriangle,
  Smartphone,
  Play,
  RotateCw,
} from 'lucide-react';

interface PronunciationTabProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  selectedVoice: string;
  voiceSpeed: number;
}

export const PronunciationTab: React.FC<PronunciationTabProps> = ({
  uiLang,
  targetLang,
  selectedVoice,
  voiceSpeed,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [selectedDrill, setSelectedDrill] = useState<PronunciationDrill>(PRONUNCIATION_DRILLS[0]);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [selectedWordDetail, setSelectedWordDetail] = useState<{ word: string; status?: string; tip?: string; phonetic?: string } | null>(null);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeMobileAudioRef = useRef<HTMLInputElement | null>(null);

  const targetPhrase =
    targetLang === 'en'
      ? selectedDrill.textEn
      : targetLang === 'ar'
      ? selectedDrill.textAr || selectedDrill.textEn
      : selectedDrill.textKu;

  const translationPhrase =
    isAr
      ? (targetLang === 'ar' ? (selectedDrill.textKu || selectedDrill.textEn) : selectedDrill.textAr || selectedDrill.textEn)
      : isKu
      ? (targetLang === 'ku' ? selectedDrill.textEn : selectedDrill.textKu)
      : (targetLang === 'en' ? (selectedDrill.textKu || selectedDrill.textAr) : selectedDrill.textEn);

  // Listen to native model audio (full sentence)
  const handlePlaySentence = async (speed: number = voiceSpeed) => {
    try {
      stopCurrentAudio();
      setIsPlayingNative(true);
      await playWordOrSentence({
        text: targetPhrase,
        lang: targetLang,
        voiceName: selectedVoice,
        speed: speed || 1.0,
      });
    } catch (e) {
      console.warn('Sentence audio playback error:', e);
    } finally {
      setIsPlayingNative(false);
    }
  };

  // Play an individual word cleanly
  const handlePlayWord = async (word: string, speed: number = 0.85) => {
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
      console.warn('Word audio playback error:', e);
    } finally {
      setPlayingWord((curr) => (curr === cleanWord ? null : curr));
    }
  };

  // Play each word in sequence with highlights and brief pauses
  const handlePlayWordSequence = async () => {
    if (isPlayingSequence) {
      stopCurrentAudio();
      setIsPlayingSequence(false);
      setPlayingWord(null);
      return;
    }

    const words = targetPhrase
      .split(/\s+/)
      .map((w) => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim())
      .filter(Boolean);

    if (words.length === 0) return;

    try {
      setIsPlayingSequence(true);
      for (const word of words) {
        setPlayingWord(word);
        await playWordOrSentence({
          text: word,
          lang: targetLang,
          voiceName: selectedVoice,
          speed: 0.9,
        });
        // Brief pause between words for learner comprehension
        await new Promise((r) => setTimeout(r, 350));
      }
    } catch (e) {
      console.warn('Word sequence error:', e);
    } finally {
      setIsPlayingSequence(false);
      setPlayingWord(null);
    }
  };

  // Audio upload fallback
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMicErrorNotice(null);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.split(',')[1] || '';
      const mime = file.type || 'audio/webm';
      setIsEvaluating(true);
      try {
        const evaluation = await assessVoiceInput({
          audioBase64: base64,
          mimeType: mime,
          targetText: targetPhrase,
          language: targetLang,
          taskType: 'pronunciation',
        });
        setResult(evaluation);
      } catch (err) {
        console.error('Pronunciation eval error', err);
      } finally {
        setIsEvaluating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start recording user's attempt
  const handleStartRecording = async () => {
    try {
      setMicErrorNotice(null);
      stopCurrentAudio();
      setResult(null);
      setRecordingSeconds(0);

      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic error:', err);
      setIsRecording(false);
      setMicErrorNotice(
        isKu
          ? 'ڕێگەپێدانی مایکرۆفۆن نەدراوە. تکایە لە نیشانەی قوفڵ 🔒 لەسەرەوەی وێبگەڕەکەت ڕێگە بە مایکرۆفۆن بدە، یاخود فایلی دەنگیت باربکە.'
          : 'Microphone permission denied. Please click the lock 🔒 icon in your browser address bar to allow microphone, or upload an audio file.'
      );
    }
  };

  // Stop recording & evaluate
  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const { base64, mimeType } = await recorderRef.current.stop();
      setIsRecording(false);
      setIsEvaluating(true);

      const evaluation = await assessVoiceInput({
        audioBase64: base64,
        mimeType,
        targetText: targetPhrase,
        language: targetLang,
        taskType: 'pronunciation',
      });

      setResult(evaluation);
    } catch (e) {
      console.error('Evaluation failed', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'استوديو تدريب النطق الصوتي' : isKu ? 'ڕاهێنەری وردی بێژەکردن' : 'Phonetic Pronunciation Studio'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isAr ? 'تمارين النطق جملة بجملة' : isKu ? 'ڕاهێنانی دەنگ لەسەر ڕستە و دەنگە سەختەکان' : 'Sentence-by-Sentence Voice Drills'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAr
              ? 'استمع أولاً إلى النطق النموذجي من المدرس الآلي، ثم انطق العبارة بنفسك للحصول على تقييم فوري لمخارج الحروف.'
              : isKu
              ? 'سەرەتا گوێ لە دەنگی ڕاستەقینەی مامۆستا بگرە، پاشان خۆت بێژەی بکە تاوەکو نمرەی بێژەکردنت وەربگریت.'
              : 'Listen to the native tutor voice first, then speak to receive instant phonetic matching & feedback.'}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drill list (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold text-slate-300 block mb-1">
            {isAr ? 'جمل التدريب:' : isKu ? 'ڕستەکانی مەشق:' : 'Practice Phrases:'}
          </span>
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {PRONUNCIATION_DRILLS.map((drill) => {
              const isSelected = drill.id === selectedDrill.id;
              const text =
                targetLang === 'en'
                  ? drill.textEn
                  : targetLang === 'ar'
                  ? drill.textAr || drill.textEn
                  : drill.textKu;
              return (
                <button
                  key={drill.id}
                  onClick={() => {
                    setSelectedDrill(drill);
                    setResult(null);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/60 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        drill.difficulty === 'hard'
                          ? 'bg-red-500/20 text-red-300'
                          : drill.difficulty === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {drill.difficulty}
                    </span>
                    <span className="text-slate-500 uppercase">{drill.category}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-100 line-clamp-2">{text}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Drill & Voice Studio (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
            {/* Header with difficulty and playback options */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold uppercase">
                {selectedDrill.category} • {selectedDrill.difficulty}
              </span>

              {/* Audio Controls for Sentence and Words */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handlePlaySentence(voiceSpeed)}
                  disabled={isPlayingNative || isPlayingSequence}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  title={isAr ? 'استمع للجملة كاملة' : isKu ? 'خوێندنەوەی هەموو ڕستەکە بە دەنگی سروشتی' : 'Listen to full sentence'}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>
                    {isPlayingNative
                      ? isAr
                        ? 'جاري القراءة...'
                        : isKu
                        ? 'دەخوێنێتەوە...'
                        : 'Speaking...'
                      : isAr
                      ? 'قراءة الجملة'
                      : isKu
                      ? 'خوێندنەوەی ڕستەکە'
                      : 'Read Sentence'}
                  </span>
                </button>

                <button
                  onClick={() => handlePlaySentence(0.75)}
                  disabled={isPlayingNative || isPlayingSequence}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title={isAr ? 'قراءة بطيئة لتوضيح مخارج الحروف' : isKu ? 'خوێندنەوەی هێواش بۆ فێربوونی وردی دەنگەکان' : 'Read slowly for clarity'}
                >
                  <span>🐢</span>
                  <span>{isAr ? 'بطيء 0.75x' : isKu ? 'هێواش 0.75x' : 'Slow'}</span>
                </button>

                <button
                  onClick={handlePlayWordSequence}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isPlayingSequence
                      ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title={isAr ? 'قراءة الكلمات كلمة بكلمة بالتتابع' : isKu ? 'خوێندنەوەی وشە بە وشە بە نۆرە' : 'Read word by word in sequence'}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isPlayingSequence
                      ? isAr
                        ? 'إيقاف التتابع'
                        : isKu
                        ? 'ڕاگرتن'
                        : 'Stop Sequence'
                      : isAr
                      ? 'كلمة بكلمة'
                      : isKu
                      ? 'وشە بە وشە'
                      : 'Word-by-Word'}
                  </span>
                </button>
              </div>
            </div>

            {/* Target phrase display with interactive clickable words */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-400">
                  {isAr ? 'الجملة المطلوب نطقها:' : isKu ? 'ڕستەی مەبەست بۆ بێژەکردن:' : 'Target Phrase to Speak:'}
                </span>
                <span className="text-slate-400 font-normal">
                  {isAr ? '💡 انقر على أي كلمة لسماع نطقها' : isKu ? '💡 کلیک لە هەر وشەیەک بکە بۆ بیستنی' : '💡 Click any word to hear it'}
                </span>
              </div>

              {/* Word by word interactive sentence display with strict LTR isolation */}
              <div
                dir={targetLang === 'en' ? 'ltr' : 'rtl'}
                style={{ direction: targetLang === 'en' ? 'ltr' : 'rtl' }}
                className={`flex flex-wrap items-center gap-1.5 py-1 ${
                  targetLang === 'en' ? 'force-ltr justify-start' : 'force-rtl justify-start'
                }`}
              >
                {targetPhrase.split(/\s+/).map((rawWord, idx) => {
                  const cleanW = rawWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim();
                  const isCurrentPlaying = playingWord === cleanW;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayWord(cleanW)}
                      className={`px-2 py-1 rounded-xl text-base sm:text-lg font-bold transition-all cursor-pointer relative group ${
                        isCurrentPlaying
                          ? 'bg-emerald-500 text-slate-950 scale-105 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300'
                          : 'bg-slate-900/90 text-white hover:bg-emerald-500/20 hover:text-emerald-300 border border-slate-800'
                      }`}
                      title={isAr ? `نطق كلمة "${cleanW}"` : isKu ? `خوێندنەوەی وشەی "${cleanW}"` : `Pronounce "${cleanW}"`}
                    >
                      <span dir={targetLang === 'en' ? 'ltr' : 'rtl'} className={targetLang === 'en' ? 'force-ltr' : 'force-rtl'}>
                        {rawWord}
                      </span>
                      <Volume2 className={`w-3 h-3 inline-block ml-1 opacity-60 group-hover:opacity-100 ${isCurrentPlaying ? 'text-slate-950' : 'text-emerald-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Translation phrase strictly RTL */}
              <div
                dir="rtl"
                style={{ direction: 'rtl', textAlign: 'right' }}
                className="text-xs text-slate-400 pt-2 border-t border-slate-900 force-rtl text-right"
              >
                {translationPhrase}
              </div>

              {selectedDrill.phonetic && (
                <div
                  dir="ltr"
                  style={{ direction: 'ltr', textAlign: 'left' }}
                  className="pt-1.5 border-t border-slate-900 text-xs font-mono text-emerald-300/80 force-ltr text-left"
                >
                  {selectedDrill.phonetic}
                </div>
              )}
            </div>

            {/* Pronunciation specific tips */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {isAr ? 'توجيه النطق الصوتي:' : isKu ? 'ڕێنمایی دەنگی تایبەت:' : 'Pronunciation Tip:'}
                </span>{' '}
                {isAr && selectedDrill.audioTipsAr
                  ? selectedDrill.audioTipsAr
                  : isKu
                  ? selectedDrill.audioTipsKu
                  : selectedDrill.audioTipsEn}
              </div>
            </div>

            {/* Mic Permission Warning Notice if Denied */}
            {micErrorNotice && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{micErrorNotice}</span>
                </div>
                <button
                  onClick={() => setMicErrorNotice(null)}
                  className="text-amber-400 hover:text-white font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Live Audio Visualizer */}
            <AudioVisualizer
              isRecording={isRecording}
              getFrequencyData={() => recorderRef.current?.getFrequencyData() || null}
            />

            {/* Big Record Button */}
            <div className="flex flex-col items-center justify-center gap-3 pt-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={isEvaluating}
                  className="w-18 h-18 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Mic className="w-8 h-8" />
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="w-18 h-18 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <Square className="w-7 h-7 fill-white" />
                </button>
              )}

              <div className="text-center">
                <span className="text-sm font-bold text-white block">
                  {isRecording
                    ? isAr
                      ? `جاري تسجيل الصوت (${recordingSeconds} ثانية)`
                      : isKu
                      ? `دەنگت تۆمار دەکرێت (${recordingSeconds} چرکە)`
                      : `Recording... (${recordingSeconds}s)`
                    : isAr
                    ? 'اضغط على الميكروفون وانطق هذه الجملة'
                    : isKu
                    ? 'داگرە و ئەم ڕستەیە بێژە بکە'
                    : 'Tap mic & repeat the sentence'}
                </span>
                <span className="text-xs text-slate-400">
                  {isRecording
                    ? isAr
                      ? 'اضغط مجدداً لإيقاف التسجيل واستلام التقييم'
                      : isKu
                      ? 'دووبارە دایگرە بۆ وەرگرتنی نمرە'
                      : 'Tap to stop & see your accuracy'
                    : isAr
                    ? 'ستحصل على تحليل فوري لمخارج الحروف والكلمات'
                    : isKu
                    ? 'پێوەری هەڵسەنگاندن و شیکردنەوەی وشەکانت پێ دەدرێت'
                    : 'Get your instant phonetic match breakdown'}
                </span>
              </div>

              {/* Upload & Mobile Mic buttons */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                <input
                  ref={nativeMobileAudioRef}
                  type="file"
                  accept="audio/*"
                  // @ts-ignore
                  capture="microphone"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => nativeMobileAudioRef.current?.click()}
                  disabled={isRecording || isEvaluating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 text-xs text-emerald-300 font-semibold transition-colors"
                  title={isAr ? 'تسجيل عبر الهاتف الذكي' : isKu ? 'تۆماری دەنگ بە مۆبایل' : 'Mobile Native Voice Memo'}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'ميكروفون الهاتف' : isKu ? 'مایکی مۆبایل' : 'Mobile Mic'}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording || isEvaluating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/70 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAr ? 'ملف صوتي' : isKu ? 'فایلی دەنگ' : 'Audio File'}</span>
                </button>
              </div>
            </div>

            {/* Evaluation Result */}
            {isEvaluating ? (
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center animate-pulse">
                <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-2 animate-spin" />
                <span className="text-xs font-bold text-slate-300">
                  {isAr ? 'جاري تحليل نطق الكلمات والدرجة الصوتية...' : isKu ? 'شیکردنەوەی بێژەکردنی وشەکانت...' : 'Calculating phonetic match score...'}
                </span>
              </div>
            ) : result ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const pScore = result.scores.pronunciation;
                      const badgeClass =
                        pScore >= 95
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20'
                          : pScore >= 88
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : pScore >= 75
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : pScore >= 60
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                          : pScore >= 45
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-400';
                      return (
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-xl transition-all ${badgeClass}`}>
                          {pScore}%
                        </div>
                      );
                    })()}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isAr ? 'دقة مخارج الحروف والنطق' : isKu ? 'ڕێژەی دروستی بێژەکردن' : 'Pronunciation Accuracy'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {result.scores.pronunciation >= 95
                          ? isAr
                            ? 'نطق ممتاز ومطابق لمتحدثي اللغة الأصليين!'
                            : isKu
                            ? 'نایاب و بێ هەڵە! وەک زمانی دایک'
                            : 'Flawless! Native-like mastery'
                          : result.scores.pronunciation >= 85
                          ? isAr
                            ? 'جيد جداً! نطق سلس ومخارج واضحة'
                            : isKu
                            ? 'زۆر باشە! دەربڕینێکی ڕەوان و ڕوون'
                            : 'Excellent! Very natural'
                          : result.scores.pronunciation >= 70
                          ? isAr
                            ? 'جيد، أغلب الكلمات واضحة ومفهومة'
                            : isKu
                            ? 'باشە، بەشێکی زۆری وشەکان دروستن'
                            : 'Good, largely clear articulation'
                          : result.scores.pronunciation >= 50
                          ? isAr
                            ? 'متوسط، يحتاج لبعض التدريب على مخارج الحروف'
                            : isKu
                            ? 'مامناوەند، پێویستی بە تۆزێک ڕێکخستنی دەنگ هەیە'
                            : 'Fair, needs sound adjustments'
                          : isAr
                          ? 'يحتاج لمزيد من التدريب ومخارج أوضح'
                          : isKu
                          ? 'نزمە، پێویستی بە مەشقی زۆرترە'
                          : 'Needs more practice and audible volume'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                    CEFR: {result.cefrLevel}
                  </span>
                </div>

                {/* Word by word color highlights with instant pronunciation audio */}
                {result.wordsAnalysis && result.wordsAnalysis.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold block">
                        {isAr ? 'تقييم الكلمات كلمة بكلمة:' : isKu ? 'هەڵسەنگاندنی وشە بە وشە:' : 'Word Breakdown:'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isAr ? '💡 انقر على الكلمة للاستماع إليها' : isKu ? '💡 کلیک لە وشەکە بکە بۆ گوێگرتن' : '💡 Tap word to listen'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {result.wordsAnalysis.map((w, i) => {
                        const cleanW = w.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim();
                        const isCurrentPlaying = playingWord === cleanW;

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              handlePlayWord(cleanW);
                              setSelectedWordDetail(w);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isCurrentPlaying
                                ? 'ring-2 ring-emerald-400 scale-105 bg-emerald-500 text-slate-950 font-bold'
                                : w.status === 'excellent'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : w.status === 'good'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                            }`}
                            title={isAr ? `استمع لنطق "${w.word}"` : isKu ? `گوێگرتن لە خوێندنەوەی "${w.word}"` : `Listen to "${w.word}"`}
                          >
                            <span>{w.word}</span>
                            <Volume2 className="w-3.5 h-3.5 opacity-80" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Word detail popup with pronunciation player */}
                    {selectedWordDetail && (
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {isAr ? 'الكلمة:' : isKu ? 'وشەی:' : 'Word:'} "{selectedWordDetail.word}"
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                selectedWordDetail.status === 'excellent'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : selectedWordDetail.status === 'good'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {selectedWordDetail.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePlayWord(selectedWordDetail.word, 0.75)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'استمع للكلمة' : isKu ? 'گوێگرتن لە وشەکە' : 'Listen'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedWordDetail(null)}
                              className="text-slate-400 hover:text-white text-xs px-1.5 py-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {selectedWordDetail.phonetic && (
                          <div className="text-xs font-mono text-emerald-400">
                            {selectedWordDetail.phonetic}
                          </div>
                        )}

                        {selectedWordDetail.tip && (
                          <p className="text-xs text-slate-300">
                            {selectedWordDetail.tip}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback */}
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {isKu ? result.feedbackKurdish : isAr ? (result.feedbackArabic || result.feedbackEnglish) : result.feedbackEnglish}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
