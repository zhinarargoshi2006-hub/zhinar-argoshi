import React, { useState, useEffect, useRef } from 'react';
import { UILanguage, TargetLanguage } from '../types';
import { translateText, TranslationResponse } from '../services/api';
import { playWordOrSentence, playBase64Audio, stopCurrentAudio, VoiceRecorder } from '../utils/audio';
import { KurdistanFlag } from './KurdistanFlag';
import {
  Languages,
  X,
  Volume2,
  Copy,
  Check,
  ArrowRightLeft,
  Mic,
  Square,
  Sparkles,
  RotateCcw,
  BookOpen,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Compass,
  Zap,
} from 'lucide-react';

interface RealtimeTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  defaultTargetLang?: TargetLanguage;
}

type TransLang = 'ku' | 'ar' | 'en';

export const RealtimeTranslatorModal: React.FC<RealtimeTranslatorModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  defaultTargetLang = 'en',
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [sourceLang, setSourceLang] = useState<TransLang | 'auto'>('auto');
  const [targetLang, setTargetLang] = useState<TransLang>(
    defaultTargetLang === 'ku' ? 'en' : defaultTargetLang
  );
  const [inputText, setInputText] = useState('');
  const [domain, setDomain] = useState<string>('medical');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-detect input direction
  const isInputRTL = () => {
    if (sourceLang === 'ku' || sourceLang === 'ar') return true;
    if (sourceLang === 'en') return false;
    // Basic Arabic/Kurdish character regex detection
    const arabicCharRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicCharRegex.test(inputText);
  };

  const isTargetRTL = targetLang === 'ku' || targetLang === 'ar';

  // Sample phrases by domain
  const domainPresets = [
    {
      id: 'medical',
      labelKu: 'پزیشکی و نەخۆشخانە',
      labelAr: 'المستشفى والطب',
      labelEn: 'Medical & Hospital',
      icon: Stethoscope,
      samples: [
        {
          text: 'The patient requires urgent diagnostic blood tests and continuous vitals monitoring.',
          lang: 'en' as TransLang,
        },
        {
          text: 'نەخۆشەکە بەهۆی تەنگەنەفەسییەوە پێویستی بە تیشکی سنگ و ئۆکسجینی خێرا هەیە.',
          lang: 'ku' as TransLang,
        },
        {
          text: 'يعاني المريض من ارتفاع حاد في ضغط الدم ويحتاج لمتابعة سريرية فورية.',
          lang: 'ar' as TransLang,
        },
      ],
    },
    {
      id: 'business',
      labelKu: 'بازرگانی و دارایی',
      labelAr: 'الأعمال والمالية',
      labelEn: 'Business & Finance',
      icon: Briefcase,
      samples: [
        {
          text: 'We are pleased to negotiate the payment milestones and the final contract terms.',
          lang: 'en' as TransLang,
        },
        {
          text: 'پێویستە پێداچوونەوە بە بودجەی تەرخانکراو و وادەی ڕادەستکردنی پڕۆژەکەدا بکەین.',
          lang: 'ku' as TransLang,
        },
        {
          text: 'تمت مراجعة دراسة الجدوى الاستثمارية والموافقة على خطة التوسع التجاري.',
          lang: 'ar' as TransLang,
        },
      ],
    },
    {
      id: 'academic',
      labelKu: 'ئەکادیمی و زانستی',
      labelAr: 'الأكاديميا والعلوم',
      labelEn: 'Academic & Science',
      icon: GraduationCap,
      samples: [
        {
          text: 'The empirical methodology validates our primary hypothesis with high statistical significance.',
          lang: 'en' as TransLang,
        },
        {
          text: 'توێژینەوەی زانستی و شیاریی تاقیگەیی دەتوانن وەڵامی پرسیارە ئاڵۆزەکان بدەنەوە.',
          lang: 'ku' as TransLang,
        },
        {
          text: 'تستند الأطروحة الجامعية إلى منهجية تحليلية دقيقة لمقارنة النتائج المعملية.',
          lang: 'ar' as TransLang,
        },
      ],
    },
    {
      id: 'daily',
      labelKu: 'گفتوگۆی ڕۆژانە',
      labelAr: 'المحادثة اليومية',
      labelEn: 'Daily Conversation',
      icon: Compass,
      samples: [
        {
          text: 'Could you please direct me to the departure gate for the international flight?',
          lang: 'en' as TransLang,
        },
        {
          text: 'سوپاس بۆ هاوکارییەکانت، زۆر خۆشحاڵ بووم بە بینینت لەم کۆبوونەوەیەدا.',
          lang: 'ku' as TransLang,
        },
        {
          text: 'أين يمكنني العثور على محطة القطار المركزية الأقرب إلى الفندق؟',
          lang: 'ar' as TransLang,
        },
      ],
    },
  ];

  // Quick swap source and target
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      const detected = (result?.detectedSource as TransLang) || (targetLang === 'en' ? 'ku' : 'en');
      setSourceLang(targetLang);
      setTargetLang(detected);
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }

    if (result && result.translatedText) {
      setInputText(result.translatedText);
      setResult(null);
    }
  };

  const handleTranslate = async (textToTranslate?: string) => {
    const textVal = (textToTranslate !== undefined ? textToTranslate : inputText).trim();
    if (!textVal) return;

    setIsLoading(true);
    stopCurrentAudio();

    try {
      const data = await translateText({
        text: textVal,
        sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
        targetLang,
        domain,
        requestAudio: true,
      });
      setResult(data);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio of translation
  const handlePlayAudio = async () => {
    if (!result?.translatedText) return;

    try {
      stopCurrentAudio();
      setIsPlayingAudio(true);

      if (result.audioBase64) {
        await playBase64Audio(result.audioBase64);
      } else {
        await playWordOrSentence({
          text: result.translatedText,
          lang: targetLang as TargetLanguage,
          voiceName: 'Kore',
          speed: 1.0,
        });
      }
    } catch (e) {
      console.warn('Playback error:', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!result?.translatedText) return;
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Speech recording input
  const startRecording = async () => {
    try {
      stopCurrentAudio();
      setIsRecording(true);

      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.start();

      // Web Speech recognition for real-time transcription if supported
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang =
          sourceLang === 'ar' ? 'ar-SA' : sourceLang === 'ku' ? 'ku' : 'en-US';

        recognition.onresult = (event: any) => {
          let str = '';
          for (let i = 0; i < event.results.length; i++) {
            str += event.results[i][0].transcript + ' ';
          }
          if (str.trim()) {
            setInputText(str.trim());
          }
        };

        try {
          recognition.start();
        } catch (e) {}
      }
    } catch (e) {
      console.error('Microphone recording error:', e);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (recorderRef.current) {
      try {
        await recorderRef.current.stop();
      } catch (e) {}
    }

    // Auto-translate if text was captured
    setTimeout(() => {
      handleTranslate();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{isKu ? 'وەرگێڕی ڕاستەوخۆ و وردی دەنگی' : isAr ? 'المترجم الصوتي فائق الدقة' : 'High-Precision Voice Translator'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  AI + TTS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isKu
                  ? 'وەرگێڕانی دەستبەجێ لە نێوان کوردی، ئینگلیزی و عەرەبی بە جیاکردنەوەی تەواوی LTR و RTL'
                  : isAr
                  ? 'ترجمة فورية فائقة الدقة بين الكوردية والعربية والإنجليزية مع فصل اتجاهات الكتابة'
                  : 'Instant translation between Kurdish, Arabic & English with strict RTL/LTR isolation'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isKu ? 'داخستن' : isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Translation Controls Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Language Selector Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Source Language */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-semibold">{isKu ? 'لە:' : isAr ? 'من:' : 'From:'}</span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value as any)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="auto" className="bg-slate-900">{isKu ? 'خۆکار (Auto)' : isAr ? 'تلقائي' : 'Auto Detect'}</option>
                <option value="ku" className="bg-slate-900">☀️ کوردی (Sorani)</option>
                <option value="en" className="bg-slate-900">🇬🇧 English</option>
                <option value="ar" className="bg-slate-900">🇸🇦 العربية</option>
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapLanguages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
              title={isKu ? 'گۆڕینەوەی زمانەکان' : isAr ? 'تبديل اللغات' : 'Swap Languages'}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            {/* Target Language */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-semibold">{isKu ? 'بۆ:' : isAr ? 'إلى:' : 'To:'}</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as TransLang)}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ku" className="bg-slate-900">☀️ کوردی (Sorani)</option>
                <option value="en" className="bg-slate-900">🇬🇧 English</option>
                <option value="ar" className="bg-slate-900">🇸🇦 العربية</option>
              </select>
            </div>
          </div>

          {/* Domain Category Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-slate-400 font-semibold">{isKu ? 'بوار:' : isAr ? 'المجال:' : 'Domain:'}</span>
            {domainPresets.map((dp) => {
              const Icon = dp.icon;
              const isActive = domain === dp.id;
              return (
                <button
                  key={dp.id}
                  onClick={() => setDomain(dp.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{isKu ? dp.labelKu : isAr ? dp.labelAr : dp.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Translator Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Two-Pane Input & Result Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Box Pane */}
            <div className="flex flex-col bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>{isKu ? 'دەقی سەرچاوە بۆ وەرگێڕان:' : isAr ? 'النص الأصلي:' : 'Original Text:'}</span>
                <span className="text-[11px] text-slate-500 font-mono">{inputText.length} chars</span>
              </div>

              {/* Textarea with strict LTR / RTL direction based on language */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleTranslate();
                  }
                }}
                dir={isInputRTL() ? 'rtl' : 'ltr'}
                style={{ direction: isInputRTL() ? 'rtl' : 'ltr', textAlign: isInputRTL() ? 'right' : 'left' }}
                placeholder={
                  isKu
                    ? 'هەر وشە، ڕستە، یان تێکستێک لێرە بنووسە یان مایکەکە داگرە بۆ قسەکردن...'
                    : isAr
                    ? 'اكتب أي كلمة أو جملة أو نص هنا أو اضغط الميكروفون للتحدث...'
                    : 'Type any word, sentence, or phrase here or click mic to speak...'
                }
                rows={5}
                className={`w-full p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none ${
                  isInputRTL() ? 'force-rtl font-sans' : 'force-ltr'
                }`}
              />

              {/* Input Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                    title={isRecording ? 'Stop Recording' : 'Speak via Microphone'}
                  >
                    {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isRecording ? (isKu ? 'تۆمارکردن...' : isAr ? 'جاري التسجيل...' : 'Recording...') : (isKu ? 'دەنگ' : isAr ? 'تحدث' : 'Speak')}</span>
                  </button>

                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                      title={isKu ? 'سڕینەوە' : isAr ? 'مسح' : 'Clear'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleTranslate()}
                  disabled={isLoading || !inputText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoading ? (isKu ? 'وەرگێڕان...' : isAr ? 'جاري الترجمة...' : 'Translating...') : (isKu ? 'وەرگێڕان' : isAr ? 'ترجم الآن' : 'Translate')}</span>
                </button>
              </div>
            </div>

            {/* Result Box Pane */}
            <div className="flex flex-col bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>{isKu ? 'دەقی وەرگێڕاو:' : isAr ? 'الترجمة المعتمدة:' : 'Translation Result:'}</span>
                </span>
                {result?.detectedSource && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                    {result.detectedSource.toUpperCase()} → {targetLang.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Translation Display with strict LTR or RTL */}
              <div className="flex-1 min-h-[120px] p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col justify-between">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full py-8 text-emerald-400 gap-2">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-semibold">{isKu ? 'خەریکی وەرگێڕانی وردین...' : isAr ? 'جاري التحليل والترجمة...' : 'Translating with AI accuracy...'}</span>
                  </div>
                ) : result?.translatedText ? (
                  <div className="space-y-3">
                    {/* The Translated Text with strict isolated direction */}
                    <div
                      dir={isTargetRTL ? 'rtl' : 'ltr'}
                      style={{ direction: isTargetRTL ? 'rtl' : 'ltr', textAlign: isTargetRTL ? 'right' : 'left' }}
                      className={`text-base sm:text-lg font-bold text-white leading-relaxed ${
                        isTargetRTL ? 'force-rtl font-sans' : 'force-ltr'
                      }`}
                    >
                      {result.translatedText}
                    </div>

                    {/* Phonetic Pronunciation Guide */}
                    {result.phonetic && (
                      <div
                        dir="ltr"
                        style={{ direction: 'ltr', textAlign: 'left' }}
                        className="text-xs font-mono text-emerald-400/90 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg force-ltr"
                      >
                        /{result.phonetic}/
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full py-8 text-slate-500 text-xs">
                    {isKu ? 'دەقەکەت بنووسە و دوگمەی وەرگێڕان دابگرە' : isAr ? 'أدخل النص واضغط على زر الترجمة' : 'Enter text above to translate'}
                  </div>
                )}

                {/* Result Toolbar */}
                {result?.translatedText && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                    <button
                      onClick={handlePlayAudio}
                      disabled={isPlayingAudio}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      title={isKu ? 'گوێگرتن لە دەنگ' : isAr ? 'استماع للنطق' : 'Listen'}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isPlayingAudio ? (isKu ? 'پەخشکردن...' : isAr ? 'تشغيل...' : 'Playing...') : (isKu ? 'گوێگرتن' : isAr ? 'استمع' : 'Listen')}</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      title={isKu ? 'لەبەرگرتنەوە' : isAr ? 'نسخ' : 'Copy'}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? (isKu ? 'لەبەرگیرایەوە' : isAr ? 'تم النسخ' : 'Copied') : (isKu ? 'کۆپیکردن' : isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Word-by-Word Breakdown & Example Sentences */}
          {result && (result.wordBreakdown || result.exampleSentences) && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              {/* Word breakdown */}
              {result.wordBreakdown && result.wordBreakdown.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isKu ? 'شیکاریی وشەکان و واتا:' : isAr ? 'التحليل المعجمي للمفردات:' : 'Lexical & Word Breakdown:'}</span>
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {result.wordBreakdown.map((wb, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs"
                      >
                        <span className="font-bold text-slate-200">{wb.original}</span>
                        <span className="text-slate-500">→</span>
                        <span className="font-bold text-emerald-400">{wb.translated}</span>
                        {wb.partOfSpeech && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {wb.partOfSpeech}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example sentences */}
              {result.exampleSentences && result.exampleSentences.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKu ? 'نموونەی ڕاستەقینە لە ڕستەدا:' : isAr ? 'أمثلة عملية في سياق الجمل:' : 'Real-world Context Examples:'}</span>
                  </span>

                  <div className="space-y-2">
                    {result.exampleSentences.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs"
                      >
                        <div
                          dir="ltr"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                          className="text-slate-200 font-semibold force-ltr"
                        >
                          "{ex.source}"
                        </div>
                        <div
                          dir="rtl"
                          style={{ direction: 'rtl', textAlign: 'right' }}
                          className="text-emerald-300 force-rtl"
                        >
                          "{ex.target}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preset Sample Phrases for Quick Exploration */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 block">
              {isKu ? 'ڕستەی ئامادەکراو بۆ تاقیکردنەوەی خێرا (کلیک بکە بۆ وەرگێڕان):' : isAr ? 'جمل نموذجية للاختبار الفوري:' : 'Quick Domain Phrases to Test:'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {domainPresets
                .find((d) => d.id === domain)
                ?.samples.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(sample.text);
                      setSourceLang(sample.lang);
                      setTargetLang(sample.lang === 'ku' ? 'en' : 'ku');
                      handleTranslate(sample.text);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-start text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span
                      dir={sample.lang === 'ku' || sample.lang === 'ar' ? 'rtl' : 'ltr'}
                      className={`truncate ${sample.lang === 'ku' || sample.lang === 'ar' ? 'force-rtl' : 'force-ltr'}`}
                    >
                      "{sample.text}"
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 uppercase shrink-0 font-mono">
                      {sample.lang}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
