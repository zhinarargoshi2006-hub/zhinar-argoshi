import React, { useState, useEffect, useRef } from 'react';
import { UILanguage, TargetLanguage, TestStep } from '../types';
import {
  Mic,
  Square,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Volume2,
  Lock,
  ChevronLeft,
  ChevronRight,
  LogIn,
  AlertTriangle,
} from 'lucide-react';

interface AudioWaveStudioPlayerProps {
  currentStep: TestStep;
  currentStepIndex: number;
  totalSteps: number;
  isRecording: boolean;
  recordingSeconds: number;
  isEvaluating: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  canGoNext: boolean;
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  onPlaySampleAudio: () => void;
  isPlayingSample: boolean;
  onOpenAuthModal?: () => void;
  currentUser?: any;
  coins?: number;
}

export const AudioWaveStudioPlayer: React.FC<AudioWaveStudioPlayerProps> = ({
  currentStep,
  currentStepIndex,
  totalSteps,
  isRecording,
  recordingSeconds,
  isEvaluating,
  onStartRecording,
  onStopRecording,
  onPreviousStep,
  onNextStep,
  canGoNext,
  uiLang,
  targetLang,
  onPlaySampleAudio,
  isPlayingSample,
  onOpenAuthModal,
  currentUser,
  coins = 104,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  // Scrub bar simulated duration / progress
  const [sliderVal, setSliderVal] = useState<number>(0);
  const maxDuration = 45; // 45 seconds total window matching Screenshot 3 ("-0:45")

  useEffect(() => {
    if (isRecording) {
      setSliderVal(Math.min(maxDuration, recordingSeconds));
    }
  }, [isRecording, recordingSeconds]);

  // Format time mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate responsive digital audio waveform bars matching Screenshot 3
  const waveformBars = [
    18, 28, 45, 60, 35, 75, 90, 65, 80, 50, 95, 70, 85, 60, 40, 25,
  ];

  return (
    <div className="relative w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6 overflow-hidden">
      {/* Decorative ambient background radiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Quick Sign-In Banner matching Screenshot 3 if user is a guest */}
      {!currentUser && onOpenAuthModal && (
        <div className="relative z-10 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-black">
              G
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {isAr ? 'چوونە ژوورەوەی باری قۆناغەکان' : isKu ? 'چوونە ژوورەوەی باری قۆناغەکان' : 'Sign in to save progression'}
              </h4>
              <p className="text-[10px] text-slate-400">
                {isAr ? 'حفظ درجاتك ونقاطك تلقائياً في السحابة' : isKu ? 'خەزنکردنی نمرە و خاڵەکانت لە هەوردا' : 'Sync XP & CEFR certificate to cloud'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الدخول' : isKu ? 'چوونە ژوورەوە بە گووگڵ' : 'Sign In'}</span>
          </button>
        </div>
      )}

      {/* Stage Number & Coins Indicator matching Screenshot 3 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            {isAr ? `المرحلة #${currentStep.id}` : isKu ? `قۆناغی #${currentStep.id}` : `Stage #${currentStep.id}`}
          </span>
          <span className="text-xs font-bold text-slate-400">
            CEFR {currentStep.level}
          </span>
        </div>

        {/* Floating coins +104 matching Screenshot 3 */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs shadow-sm">
          <span>+{coins}</span>
          <span className="text-base">🪙</span>
        </div>
      </div>

      {/* Target Sentence Box */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold">
            {isAr ? 'العبارة المطلوب نطقها:' : isKu ? 'ڕستەی مەبەست بۆ بێژەکردن:' : 'Target Speaking Phrase:'}
          </span>
          <button
            type="button"
            onClick={onPlaySampleAudio}
            disabled={isPlayingSample}
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isPlayingSample ? (isAr ? 'تشغيل...' : isKu ? 'خوێندنەوە...' : 'Playing...') : isAr ? 'استمع' : isKu ? 'گوێبگرە' : 'Listen'}</span>
          </button>
        </div>

        <div
          dir={targetLang === 'en' ? 'ltr' : 'rtl'}
          style={{ direction: targetLang === 'en' ? 'ltr' : 'rtl', textAlign: targetLang === 'en' ? 'left' : 'right' }}
          className={`p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-base sm:text-lg font-bold text-white leading-relaxed ${
            targetLang === 'en' ? 'force-ltr text-left' : 'force-rtl text-right'
          }`}
        >
          "{targetLang === 'ar'
            ? currentStep.promptAr || currentStep.promptText
            : targetLang === 'ku'
            ? currentStep.promptKu || currentStep.promptText
            : currentStep.promptEn || currentStep.promptText}"
        </div>

        {currentStep.sampleAnswerKu && targetLang === 'en' && (
          <div dir="rtl" className="text-xs text-slate-400 force-rtl text-right pt-0.5">
            {currentStep.sampleAnswerKu}
          </div>
        )}
      </div>

      {/* Iconic Central Visualizer: Microphone inside Concentric Radial Pulsing Waves (Matching Screenshot 3) */}
      <div className="relative z-10 py-6 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Concentric Dotted Radar Rings matching Screenshot 3 */}
          <div className={`absolute w-44 h-44 rounded-full border-2 border-dashed border-emerald-500/30 transition-all ${isRecording ? 'animate-spin opacity-80' : 'opacity-40'}`} style={{ animationDuration: '12s' }} />
          <div className={`absolute w-36 h-36 rounded-full border border-teal-500/40 ${isRecording ? 'animate-ping opacity-60' : 'opacity-30'}`} />

          {/* Left Audio Equalizer Waveform Bars matching Screenshot 3 */}
          <div className="absolute right-[calc(50%+4rem)] flex items-center gap-1 sm:gap-1.5 h-16 pointer-events-none">
            {waveformBars.slice(0, 10).reverse().map((h, i) => (
              <div
                key={`left-wave-${i}`}
                className="w-1 sm:w-1.5 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-full transition-all duration-150"
                style={{
                  height: isRecording
                    ? `${Math.max(8, (h * (recordingSeconds % 3 + 1)) % 55)}px`
                    : `${h * 0.35}px`,
                  opacity: 0.4 + (i / 10) * 0.6,
                }}
              />
            ))}
          </div>

          {/* Central Microphone Pulse Hub */}
          <div className="relative z-20">
            <button
              type="button"
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isEvaluating}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl relative group ${
                isRecording
                  ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white ring-8 ring-rose-500/30 scale-105'
                  : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 ring-8 ring-emerald-500/25 hover:scale-105 active:scale-95'
              }`}
            >
              {isEvaluating ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-3 border-slate-950 border-t-transparent animate-spin mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{isAr ? 'تقييم...' : isKu ? 'هەڵسەنگاندن...' : 'Scoring...'}</span>
                </div>
              ) : isRecording ? (
                <div className="flex flex-col items-center">
                  <Square className="w-8 h-8 fill-current mb-1" />
                  <span className="text-xs font-black">{formatTime(recordingSeconds)}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Mic className="w-9 h-9 sm:w-10 sm:h-10 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {isAr ? 'سجل' : isKu ? 'تۆمار' : 'Speak'}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Right Audio Equalizer Waveform Bars matching Screenshot 3 */}
          <div className="absolute left-[calc(50%+4rem)] flex items-center gap-1 sm:gap-1.5 h-16 pointer-events-none">
            {waveformBars.slice(0, 10).map((h, i) => (
              <div
                key={`right-wave-${i}`}
                className="w-1 sm:w-1.5 bg-gradient-to-t from-emerald-400 to-teal-500 rounded-full transition-all duration-150"
                style={{
                  height: isRecording
                    ? `${Math.max(8, (h * ((recordingSeconds + 1) % 3 + 1)) % 55)}px`
                    : `${h * 0.35}px`,
                  opacity: 1 - (i / 10) * 0.6,
                }}
              />
            ))}
          </div>
        </div>

        {/* Recording instruction caption */}
        <p className="text-xs text-slate-400 font-medium text-center mt-4">
          {isRecording
            ? (isAr ? 'جارِ التسجيل... انقر على المربع الأحمر للإرسال والتقييم' : isKu ? 'دەنگت تۆمار دەکرێت... کلیک لە چوارگۆشەکە بکە بۆ هەڵسەنگاندن' : 'Recording... Tap red square to submit')
            : (isAr ? 'انقر على الميكروفون للتحدث وقراءة العبارة بصوت واضح' : isKu ? 'کرتە لە مایکرۆفۆنەکە بکە و بە دەنگێکی بیستراو بخوێنەوە' : 'Tap microphone and read phrase aloud')}
        </p>
      </div>

      {/* Audio Timeline Scrubber Trackbar matching Screenshot 3 (0:08 ───⚪─── -0:45) */}
      <div className="relative z-10 space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="text-emerald-400 font-bold">{formatTime(sliderVal)}</span>
          <span className="text-slate-500">-{formatTime(Math.max(0, maxDuration - sliderVal))}</span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={maxDuration}
            value={sliderVal}
            onChange={(e) => setSliderVal(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Audio Controls Row: Previous Step | Center Big Control | Next Step (Matching Screenshot 3) */}
      <div className="relative z-10 flex items-center justify-center gap-6 pt-1">
        {/* Previous Stage */}
        <button
          type="button"
          onClick={onPreviousStep}
          disabled={currentStepIndex === 0 || isRecording || isEvaluating}
          className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-750 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 shadow-sm"
          title={isAr ? 'المرحلة السابقة' : isKu ? 'قۆناغی پێشوو' : 'Previous Stage'}
        >
          <SkipBack className="w-5 h-5 rtl:rotate-180" />
        </button>

        {/* Play/Listen Model Answer Button */}
        <button
          type="button"
          onClick={onPlaySampleAudio}
          disabled={isPlayingSample || isRecording}
          className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>{isPlayingSample ? (isAr ? 'جارِ الاستماع...' : isKu ? 'پەخشکردن...' : 'Playing...') : isAr ? 'استماع للنموذج' : isKu ? 'نموونەی دەنگی' : 'Listen Sample'}</span>
        </button>

        {/* Next Stage */}
        <button
          type="button"
          onClick={onNextStep}
          disabled={!canGoNext || isRecording || isEvaluating}
          className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-750 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 shadow-sm"
          title={isAr ? 'المرحلة التالية' : isKu ? 'قۆناغی داهاتوو' : 'Next Stage'}
        >
          <SkipForward className="w-5 h-5 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
