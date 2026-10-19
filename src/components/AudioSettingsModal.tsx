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
  TrendingUp,
  CheckCircle2,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { KurdistanFlag } from './KurdistanFlag';

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
  // CEFR Auto-Adjust Difficulty
  autoAdjustDifficulty?: boolean;
  onToggleAutoAdjustDifficulty?: () => void;
  currentCefr?: string;
  // Auth & Account
  currentUser?: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null; isAnonymous?: boolean } | null;
  onOpenAuthModal?: () => void;
  onOpenPersonalization?: () => void;
  onSignOut?: () => void;
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
  autoAdjustDifficulty = true,
  onToggleAutoAdjustDifficulty,
  currentCefr = 'B1',
  currentUser,
  onOpenAuthModal,
  onOpenPersonalization,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [currentLoop, setCurrentLoop] = useState(loopCount);
  const [currentSfx, setCurrentSfx] = useState(sfxEnabled);
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);

  const voices = [
    { id: 'Kore', label: isAr ? 'Kore (كوري - طبيعي ومتزن)' : isKu ? 'Kore (کۆرێ - سروشتی و لەسەرخۆ)' : 'Kore (Natural & Balanced)' },
    { id: 'Puck', label: isAr ? 'Puck (باك - دافئ وواضح)' : isKu ? 'Puck (پوک - گەرم و ڕوون)' : 'Puck (Warm & Clear)' },
    { id: 'Fenrir', label: isAr ? 'Fenrir (فينرير - عميق ومتقن)' : isKu ? 'Fenrir (فێنریر - قووڵ و پزیشکی)' : 'Fenrir (Deep & Resonant)' },
    { id: 'Aoede', label: isAr ? 'Aoede (أويدي - هادئ وأكاديمي)' : isKu ? 'Aoede (ئۆیدی - هێمن و ئەکادیمی)' : 'Aoede (Calm & Academic)' },
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
                {isAr ? 'سرعة الصوت، التكرار التلقائي، حجم الخط والمؤثرات' : isKu ? 'خێرایی دەنگ، دووبارەکردنەوە، شێوازی فۆنت و دەنگەکان' : 'Fine-tune playback, font size & audio looper'}
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
          {/* 0. Language Settings */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Globe2 className="w-4 h-4" />
              <span>{isAr ? 'إعدادات اللغات' : isKu ? 'ڕێکخستنی زمانەکان' : 'Language Preferences'}</span>
            </div>

            {/* UI Language */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                {isKu ? 'زمانی ڕووکاری ئەپ:' : isAr ? 'لغة واجهة التطبيق:' : 'App Interface Language:'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ku', label: 'کوردی', flagNode: <KurdistanFlag size="xs" glow={false} rounded={false} /> },
                  { id: 'en', label: 'English', flagNode: <span>🇬🇧</span> },
                  { id: 'ar', label: 'العربية', flagNode: <span>🇸🇦</span> },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onSelectUiLang && onSelectUiLang(l.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      uiLang === l.id
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {l.flagNode}
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
                    { id: 'en', label: isAr ? 'الإنجليزية' : isKu ? 'ئینگلیزی' : 'English', flagNode: <span>🇬🇧</span> },
                    { id: 'ku', label: isAr ? 'الكردية' : isKu ? 'کوردی' : 'Kurdish', flagNode: <KurdistanFlag size="xs" glow={false} rounded={false} /> },
                    { id: 'ar', label: isAr ? 'العربية' : isKu ? 'عەرەبی' : 'Arabic', flagNode: <span>🇸🇦</span> },
                  ].map((tl) => (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => onSelectTargetLang(tl.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        targetLang === tl.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {tl.flagNode}
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
                {isAr ? 'سرعة تشغيل الصوت:' : isKu ? 'خێرایی خوێندنەوەی دەنگ:' : 'Playback Speed:'}
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
              {isAr ? 'نموذج الصوت الذكي:' : isKu ? 'دەنگی مامۆستای زمانی دەستکرد:' : 'AI Voice Model:'}
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
                <span>{isAr ? 'تكرار التشغيل التلقائي:' : isKu ? 'دووبارەبوونەوەی خۆکارانە بۆ مەشق:' : 'Auto Replay Looper:'}</span>
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
                  {count === 1 ? (isAr ? 'مرة واحدة (عادي)' : isKu ? 'یەک جار (ئاسایی)' : '1x Normal') : `${count}x Loop`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Font Size */}
          <div>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAr ? 'حجم الخط:' : isKu ? 'قەبارەی فۆنت:' : 'Font Size:'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: isAr ? 'عادي' : isKu ? 'ئاسایی' : 'Normal' },
                { id: 'large', label: isAr ? 'كبير' : isKu ? 'گەورە' : 'Large' },
                { id: 'xlarge', label: isAr ? 'كبير جداً' : isKu ? 'زۆر گەورە' : 'Extra Large' },
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
                  {isAr ? 'المؤثرات الصوتية للأداء العالي' : isKu ? 'دەنگی سەرکەوتن و نمرەی بەرز' : 'Sound Effects (SFX)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'رنين صوتي خفيف عند تحقيق درجات 90% فأعلى' : isKu ? 'لێدانی زەنگۆڵەی دەنگی لە کاتی بەدەستهێنانی نمرەی ٩٠+' : 'Subtle chime on high scoring attempts'}
                </div>
              </div>
              <button
                type="button"
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

          {/* 6. Auto-Adjust Difficulty based on CEFR Level */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    {isAr ? 'الضبط التلقائي لمستوى الصعوبة' : isKu ? 'تەعدیلکردنی خۆکارانەی ئاستی دژواری' : 'Auto-Adjust Difficulty'}
                  </span>
                  {currentCefr && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      CEFR {currentCefr}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? 'يزيد من تعقيد العبارات الموصى بها في التحدي اليومي تلقائياً بناءً على مستواك الحالي في مقياس CEFR.'
                    : isKu
                    ? 'بە شێوەیەکی خۆکار ئاستی ئاڵۆزی ڕستە پێشنیارکراوەکانی ناو بەرەنگاربوونەوەی ڕۆژانە بەرز دەکاتەوە بەپێی ئاستی ئێستای CEFRـت.'
                    : 'Increases the complexity and vocabulary of recommended phrases in the daily challenge based on your current CEFR level.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onToggleAutoAdjustDifficulty && onToggleAutoAdjustDifficulty()}
                className={`w-12 h-6 rounded-full transition-all relative shrink-0 cursor-pointer ${
                  autoAdjustDifficulty ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-slate-800'
                }`}
                aria-label="Toggle Auto-Adjust Difficulty"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    autoAdjustDifficulty ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Visual Tier Progression */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">
                {isAr ? 'مراحل التكيف الصوتي:' : isKu ? 'ئاستە خۆگونجێنەرەکان:' : 'Adaptive Tiers:'}
              </span>
              <div className="flex items-center gap-1.5 font-bold">
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    ['A1', 'A2'].includes(currentCefr || '')
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-500'
                  }`}
                >
                  A1/A2
                </span>
                <span className="text-slate-600">→</span>
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    ['B1', 'B2'].includes(currentCefr || 'B1')
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-500'
                  }`}
                >
                  B1/B2
                </span>
                <span className="text-slate-600">→</span>
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    ['C1', 'C2'].includes(currentCefr || '')
                      ? 'bg-purple-500 text-white font-black'
                      : 'text-slate-500'
                  }`}
                >
                  C1/C2
                </span>
              </div>
            </div>
          </div>

          {/* 7. Firebase Account & Cloud Profile */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {isAr ? 'حساب المستخدم والمزامنة السحابية' : isKu ? 'ئەکاونتی بەکارهێنەر و هەڵگرتنی سحابی' : 'Account & Cloud Sync'}
                </span>
              </div>
              {currentUser && !currentUser.isAnonymous && currentUser.email ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                  {isAr ? 'حساب موثق ✓' : isKu ? 'ئەکاونتی پارێزراو ✓' : 'Authenticated ✓'}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {isAr ? 'حساب ضيف' : isKu ? 'میوان' : 'Guest Mode'}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                {currentUser && !currentUser.isAnonymous && (currentUser.email || currentUser.displayName) ? (
                  <>
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'User'}
                        className="w-9 h-9 rounded-xl object-cover border border-emerald-400/40 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {currentUser.email || 'Google Account'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {isAr ? 'سجل دخولك لحفظ بياناتك' : isKu ? 'بچۆ ژوورەوە بۆ پاراستنی داتاکانت' : 'Sign in to save your voice data'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'مزامنة سجل النطق والمفضلة بأمان في السحابة' : isKu ? 'هەڵگرتنی مێژووی مەشق و دڵخوازەکان لە فایەربەیس' : 'Sync attempts and bookmarks to Firebase cloud'}
                    </div>
                  </div>
                )}
              </div>

              {currentUser && !currentUser.isAnonymous ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenPersonalization && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPersonalization();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                      title={isAr ? 'تعديل الملف الشخصي والمستوى' : isKu ? 'دەستکاریکردنی ئاست و ناو' : 'Personalize Profile & Level'}
                    >
                      {isAr ? 'تخصيص' : isKu ? 'ئاست و ناو' : 'Level & Name'}
                    </button>
                  )}
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        onSignOut();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      {isAr ? 'خروج' : isKu ? 'دەرچوون' : 'Sign Out'}
                    </button>
                  )}
                </div>
              ) : (
                onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  >
                    {isAr ? 'تسجيل الدخول' : isKu ? 'چوونە ژوورەوە' : 'Sign In'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            {isAr ? 'إغلاق' : isKu ? 'داخستن' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
