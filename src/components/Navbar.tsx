import React, { useState, useEffect } from 'react';
import { TargetLanguage, UILanguage } from '../types';
import { KuVoiceLogo } from './KuVoiceLogo';
import { 
  Languages, 
  Volume2, 
  Settings, 
  Award,
  Globe2,
  Check,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  currentCefr: string;
  voiceSpeed: number;
  selectedVoice: string;
  isFirebaseConnected?: boolean;
  streakDays?: number;
  onToggleUiLang: (lang: UILanguage) => void;
  onSelectTargetLang: (lang: TargetLanguage) => void;
  onSetVoiceSpeed: (speed: number) => void;
  onSelectVoice: (voice: string) => void;
  onOpenCertificate?: () => void;
  onOpenBookmarks?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onOpenDailyChallenge?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  uiLang,
  targetLang,
  currentCefr,
  voiceSpeed,
  selectedVoice,
  isFirebaseConnected = true,
  streakDays = 3,
  onToggleUiLang,
  onSelectTargetLang,
  onSetVoiceSpeed,
  onSelectVoice,
  onOpenCertificate,
  onOpenBookmarks,
  onOpenSettings,
  onOpenHelp,
  onOpenDailyChallenge,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';
  const [isPracticeMenuOpen, setIsPracticeMenuOpen] = useState(false);

  // Close practice dropdown when clicking outside
  useEffect(() => {
    if (!isPracticeMenuOpen) return;
    const handleOutside = () => setIsPracticeMenuOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [isPracticeMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand with KuVoiceLogo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <KuVoiceLogo size="md" glow={true} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent truncate">
                kd voice language lab
              </span>
              {/* Firebase Cloud indicator */}
              <span
                className="hidden lg:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 shadow-sm"
                title={isKu ? 'فایەربەیس پەیوەستە - دەنگەکان لە هەور خەزن دەبن' : isAr ? 'متصل بقاعدة البيانات السحابية' : 'Firebase Connected - Voice data synced'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Cloud</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {isKu
                ? 'تاقیکردنەوەی ئاستی قسەکردن و تاقیگەی دەنگیی زمان'
                : isAr
                ? 'مختبر كيدي لتعليم اللغات وتقييم التحدث الصوتي (CEFR)'
                : 'KD Voice Language Lab - CEFR Speaking Proficiency'}
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Main 3-Language UI Switcher (Kurdish, English, Arabic) */}
          <div className="bg-slate-900/90 border border-slate-800 p-0.5 sm:p-1 rounded-xl flex items-center gap-0.5 sm:gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => onToggleUiLang('ku')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                uiLang === 'ku'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="زمانی کوردی (Kurdish)"
            >
              <span>☀️</span>
              <span className="hidden sm:inline">کوردی</span>
              <span className="sm:hidden">Ku</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleUiLang('en')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                uiLang === 'en'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              <span>🇬🇧</span>
              <span className="hidden sm:inline">English</span>
              <span className="sm:hidden">En</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleUiLang('ar')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                uiLang === 'ar'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="العربية (Arabic)"
            >
              <span>🇸🇦</span>
              <span className="hidden sm:inline">العربية</span>
              <span className="sm:hidden">Ar</span>
            </button>
          </div>

          {/* Speaking / Practice Language Pill with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPracticeMenuOpen(!isPracticeMenuOpen)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-950/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={isKu ? 'گۆڕینی زمانی مەشق و قسەکردن' : isAr ? 'تغيير لغة التدريب والتحدث' : 'Switch Practice Language'}
            >
              <span className="text-[10px] text-emerald-400/80 hidden lg:inline">
                {isKu ? 'مەشق:' : isAr ? 'ممارسة:' : 'Practice:'}
              </span>
              <span>
                {targetLang === 'en' ? '🇬🇧 English' : targetLang === 'ku' ? '☀️ کوردی' : '🇸🇦 العربية'}
              </span>
              <ChevronDown className="w-3 h-3 text-emerald-400" />
            </button>

            {isPracticeMenuOpen && (
              <div
                className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 mb-1 border-b border-slate-800">
                  {isKu ? 'زمانی مەشق و تاقیکردنەوە:' : isAr ? 'لغة التدريب الصوتي:' : 'Speaking Practice Language:'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTargetLang('en');
                    setIsPracticeMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    targetLang === 'en'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>🇬🇧 English</span>
                  {targetLang === 'en' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTargetLang('ku');
                    setIsPracticeMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    targetLang === 'ku'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>☀️ کوردی</span>
                  {targetLang === 'ku' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTargetLang('ar');
                    setIsPracticeMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    targetLang === 'ar'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>🇸🇦 العربية</span>
                  {targetLang === 'ar' && <span>✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Daily Streak Flame Counter */}
          <button
            onClick={onOpenDailyChallenge}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title={isKu ? 'ئاگر و مەشقی ڕۆژانە' : isAr ? 'سلسلة التدريب اليومي' : 'Daily Speaking Streak'}
          >
            <span>🔥 {streakDays}d</span>
          </button>

          {/* Certificate Button */}
          {onOpenCertificate && (
            <button
              onClick={onOpenCertificate}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 hover:from-amber-500/25 hover:to-yellow-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              title={isKu ? 'بڕوانامەی فەرمیی CEFR' : isAr ? 'شهادة CEFR' : 'CEFR Certificate'}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'الشهادة' : isKu ? 'بڕوانامە' : 'Certificate'}</span>
            </button>
          )}

          {/* Bookmarks Button */}
          {onOpenBookmarks && (
            <button
              onClick={onOpenBookmarks}
              className="hidden sm:flex p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              title={isKu ? 'دەستەواژە دڵخوازەکان' : isAr ? 'المفضلة' : 'Bookmarks'}
            >
              <span>★</span>
            </button>
          )}

          {/* Settings Modal Toggle */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isKu ? 'ڕێکخستن' : isAr ? 'الإعدادات' : 'Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Help Tips Modal Toggle */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title={isKu ? 'ڕێنمایی' : isAr ? 'المساعدة' : 'Help & Voice Guide'}
            >
              <span className="text-xs font-bold">?</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

