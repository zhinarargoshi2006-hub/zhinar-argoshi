import React, { useState } from 'react';
import { TargetLanguage, UILanguage } from '../types';
import {
  X,
  Settings,
  Volume2,
  Sliders,
  Type,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Repeat,
  Vibrate,
  ShieldAlert,
  Globe2,
} from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  targetLang?: TargetLanguage;
  voiceSpeed: number;
  onSetVoiceSpeed: (speed: number) => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  onSelectUiLang?: (lang: UILanguage) => void;
  onSelectTargetLang?: (lang: TargetLanguage) => void;
  // Extra settings
  loopCount?: number;
  onSetLoopCount?: (count: number) => void;
  sfxEnabled?: boolean;
  onToggleSfx?: () => void;
  fontSize?: 'normal' | 'large' | 'xlarge';
  onSetFontSize?: (size: 'normal' | 'large' | 'xlarge') => void;
  accentColor?: string;
  onSelectAccentColor?: (color: string) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  targetLang = 'en',
  voiceSpeed,
  onSetVoiceSpeed,
  selectedVoice,
  onSelectVoice,
  onSelectUiLang,
  onSelectTargetLang,
  loopCount = 1,
  onSetLoopCount,
  sfxEnabled = true,
  onToggleSfx,
  fontSize = 'normal',
  onSetFontSize,
  accentColor = 'emerald',
  onSelectAccentColor,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [currentLoop, setCurrentLoop] = useState(loopCount);
  const [currentSfx, setCurrentSfx] = useState(sfxEnabled);
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);

  const voices = [
    { id: 'Kore', label: 'Kore (کۆرێ - سروشتی و لەسەرخۆ)' },
    { id: 'Puck', label: 'Puck (پوک - گەرم و ڕوون)' },
    { id: 'Fenrir', label: 'Fenrir (فێنریر - قووڵ و پزیشکی)' },
    { id: 'Aoede', label: 'Aoede (ئۆیدی - هێمن و ئەکادیمی)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'إعدادات الصوت والمظهر المتقدمة' : isKu ? 'ڕێکخستنە پێشکەوتووەکانی دەنگ و تاقیگە' : 'Advanced Vocal & Lab Settings'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isKu ? 'خێرایی دەنگ، دووبارەکردنەوە، شێوازی فۆنت و دەنگەکان' : 'Fine-tune playback, font size & audio looper'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* 0. Language Settings (زمانی ڕووکار و زمانی مەشق) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Globe2 className="w-4 h-4" />
              <span>{isKu ? 'ڕێکخستنی زمانەکان (Language Preferences)' : isAr ? 'إعدادات اللغات' : 'Language Preferences'}</span>
            </div>

            {/* UI Language */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                {isKu ? 'زمانی ڕووکاری ئەپ:' : isAr ? 'لغة واجهة التطبيق:' : 'App Interface Language:'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ku', label: '☀️ کوردی', flag: 'Kurdish' },
                  { id: 'en', label: '🇬🇧 English', flag: 'English' },
                  { id: 'ar', label: '🇸🇦 العربية', flag: 'Arabic' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onSelectUiLang && onSelectUiLang(l.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      uiLang === l.id
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Practice Language */}
            {onSelectTargetLang && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  {isKu ? 'زمانی مەشق و قسەکردن:' : isAr ? 'لغة التدريب والتحدث:' : 'Speaking / Practice Language:'}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'en', label: isAr ? '🇬🇧 الإنجليزية' : isKu ? '🇬🇧 ئینگلیزی' : '🇬🇧 English' },
                    { id: 'ku', label: isAr ? '☀️ الكردية' : isKu ? '☀️ کوردی' : '☀️ Kurdish' },
                    { id: 'ar', label: isAr ? '🇸🇦 العربية' : isKu ? '🇸🇦 عەرەبی' : '🇸🇦 Arabic' },
                  ].map((tl) => (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => onSelectTargetLang(tl.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        targetLang === tl.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{tl.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 1. Playback Speed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                {isKu ? 'خێرایی خوێندنەوەی دەنگ (Playback Speed):' : 'Playback Speed:'}
              </label>
              <span className="font-mono text-xs text-cyan-400 font-bold">{voiceSpeed}x</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onSetVoiceSpeed(speed)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    voiceSpeed === speed
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* 2. Voice Persona Picker */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-2">
              {isKu ? 'دەنگی مامۆستای زمانی دەستکرد (AI Voice Model):' : 'AI Voice Model:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={`p-3 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                    selectedVoice === v.id
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{v.label}</span>
                  {selectedVoice === v.id && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 3. A-B Looper Repetition */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKu ? 'دووبارەبوونەوەی خۆکارانە بۆ مەشق (A-B Looper):' : 'Auto Replay Looper:'}</span>
              </label>
              <span className="text-xs text-amber-400 font-bold">{currentLoop}x</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    setCurrentLoop(count);
                    if (onSetLoopCount) onSetLoopCount(count);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    currentLoop === count
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {count === 1 ? (isKu ? 'یەک جار (ئاسایی)' : '1x Normal') : `${count}x Loop`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Kurdish Font Size */}
          <div>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>{isKu ? 'قەبارەی فۆنتی کوردی (Vazirmatn):' : 'Kurdish Font Size:'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: isKu ? 'ئاسایی' : 'Normal' },
                { id: 'large', label: isKu ? 'گەورە' : 'Large' },
                { id: 'xlarge', label: isKu ? 'زۆر گەورە' : 'Extra Large' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setCurrentFontSize(f.id as any);
                    if (onSetFontSize) onSetFontSize(f.id as any);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    currentFontSize === f.id
                      ? 'bg-purple-500 text-white border-purple-400 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Sound Effects (SFX) & Haptics Toggle */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">
                  {isKu ? 'دەنگی سەرکەوتن و نمرەی بەرز (SFX Chimes)' : 'Sound Effects (SFX)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isKu ? 'لێدانی زەنگۆڵەی دەنگی لە کاتی بەدەستهێنانی نمرەی ٩٠+' : 'Subtle chime on high scoring attempts'}
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentSfx(!currentSfx);
                  if (onToggleSfx) onToggleSfx();
                }}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  currentSfx ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    currentSfx ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition-all"
          >
            {isKu ? 'داخستن' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
