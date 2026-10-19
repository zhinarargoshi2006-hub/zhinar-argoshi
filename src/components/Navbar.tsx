import React, { useState, useEffect } from 'react';
import { TargetLanguage, UILanguage } from '../types';
import { 
  Sparkles,
  RotateCcw,
  Award,
  Settings,
  LogIn,
  LogOut,
  Bookmark,
  HelpCircle,
  MoreVertical,
  Languages,
} from 'lucide-react';

interface NavbarProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  currentCefr: string;
  voiceSpeed: number;
  selectedVoice: string;
  isFirebaseConnected?: boolean;
  streakDays?: number;
  coins?: number;
  streakFreezes?: number;
  onOpenStore?: () => void;
  onToggleUiLang: (lang: UILanguage) => void;
  onSelectTargetLang: (lang: TargetLanguage) => void;
  onSetVoiceSpeed: (speed: number) => void;
  onSelectVoice: (voice: string) => void;
  onOpenCertificate?: () => void;
  onOpenBookmarks?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onOpenDailyChallenge?: () => void;
  onRefreshApp?: () => void;
  onOpenTranslator?: () => void;
  currentUser?: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null; isAnonymous?: boolean } | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  uiLang,
  targetLang,
  currentCefr,
  voiceSpeed,
  selectedVoice,
  isFirebaseConnected = true,
  streakDays = 3,
  coins = 1000,
  streakFreezes = 1,
  onOpenStore,
  onToggleUiLang,
  onSelectTargetLang,
  onSetVoiceSpeed,
  onSelectVoice,
  onOpenCertificate,
  onOpenBookmarks,
  onOpenSettings,
  onOpenHelp,
  onOpenDailyChallenge,
  onRefreshApp,
  onOpenTranslator,
  currentUser,
  onOpenAuthModal,
  onSignOut,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleOutside = () => {
      setIsMoreMenuOpen(false);
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [isMoreMenuOpen]);

  return (
    <div
      className="w-full max-w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 overflow-x-auto overflow-y-hidden scrollbar-none touch-pan-x select-none"
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
      }}
    >
      {/* Clean, Balanced & Responsive Top Header with Touch Horizontal Scroll */}
      <div className="min-w-max w-full max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-5 whitespace-nowrap">
        
        {/* Left Section: Gold Coins, Streak Flame & Realtime Voice Translator */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
          {/* Functional Gold Coins Economy Button (Opens Store) */}
          <button
            type="button"
            onClick={onOpenStore}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 border border-amber-500/35 text-amber-300 text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 group"
            title={isKu ? 'فرۆشگای دراوە زێڕینەکان (کرتە بکە بۆ کردنەوە)' : isAr ? 'متجر العملات الذهبية (اضغط للفتح)' : 'Gold Coins Shop (Click to Open)'}
          >
            <span className="text-sm group-hover:scale-125 transition-transform">🪙</span>
            <span>{coins.toLocaleString()}</span>
            <span className="text-[10px] text-amber-400/90 bg-amber-500/20 px-1.5 py-0.5 rounded-md font-bold">
              {isKu ? 'فرۆشگا' : isAr ? 'المتجر' : 'Shop'}
            </span>
          </button>

          {/* Daily Streak Flame Counter with Freeze Indicator */}
          <button
            type="button"
            onClick={onOpenDailyChallenge}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
            title={isKu ? 'ئاگر و مەشقی ڕۆژانە' : isAr ? 'سلسلة التدريب اليومي' : 'Daily Speaking Streak'}
          >
            <span className="text-sm sm:text-base leading-none">🔥</span>
            <span className="font-extrabold">{streakDays}</span>
            <span className="text-amber-400/80 text-[11px] font-medium">
              {isKu ? 'ڕۆژ' : isAr ? 'أيام' : 'days'}
            </span>
            {streakFreezes > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1 py-0.5 rounded"
                title={isKu ? `پارێزەری ئاگر چالاکە (${streakFreezes})` : isAr ? `درع الحماية مفعل (${streakFreezes})` : `Streak Freeze active (${streakFreezes})`}
              >
                🧊 {streakFreezes}
              </span>
            )}
          </button>

          {/* Realtime Smart Voice Translator Quick-Access Button */}
          {onOpenTranslator && (
            <button
              type="button"
              onClick={onOpenTranslator}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title={isKu ? 'سیستەمی وەرگێڕانی خێرا و ورد' : isAr ? 'المترجم الصوتي فائق الدقة' : 'High-Precision Voice Translator'}
            >
              <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span>{isKu ? 'وەرگێڕ' : isAr ? 'المترجم' : 'Translator'}</span>
            </button>
          )}

          {/* Direct Shortcuts: Certificate & Bookmarks */}
          {onOpenCertificate && (
            <button
              type="button"
              onClick={onOpenCertificate}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 hover:from-amber-500/25 hover:to-yellow-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
              title={isKu ? 'بڕوانامەی فەرمیی CEFR' : isAr ? 'شهادة CEFR' : 'CEFR Certificate'}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'الشهادة' : isKu ? 'بڕوانامە' : 'Certificate'}</span>
            </button>
          )}

          {onOpenBookmarks && (
            <button
              type="button"
              onClick={onOpenBookmarks}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-colors cursor-pointer shrink-0 active:scale-95"
              title={isKu ? 'دەستەواژە دڵخوازەکان' : isAr ? 'المفضلة' : 'Bookmarks'}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKu ? 'دڵخوازەکان' : isAr ? 'المفضلة' : 'Bookmarks'}</span>
            </button>
          )}
        </div>

        {/* Right Section: User Profile ("Zhinar Argoshi"), Quick Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
          {onRefreshApp && (
            <button
              type="button"
              onClick={onRefreshApp}
              className="flex p-2 rounded-xl border border-slate-800 hover:border-emerald-500/50 bg-slate-900/80 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer shrink-0 active:scale-95"
              title={isAr ? 'تجديد وتنظيف أي بيانات مكررة' : isKu ? 'نوێکردنەوە و سڕینەوەی دووبارەکان' : 'Refresh Page & Clean Duplicates'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Interactive Help / How to Use Guide Button */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="flex items-center gap-1.5 p-2 px-2.5 sm:px-3 rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title={isKu ? 'ڕێبەری بەکارهێنان و فێرکاری' : isAr ? 'دليل الاستخدام والتعليمات' : 'How to Use & Guide'}
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>{isKu ? 'ڕێبەر' : isAr ? 'دليل' : 'Guide'}</span>
            </button>
          )}

          {/* Desktop & Mobile Direct Settings Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 active:scale-95"
              title={isKu ? 'ڕێکخستن' : isAr ? 'الإعدادات' : 'Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* User Account / Profile Section: Beautifully formatted for "Zhinar Argoshi" */}
          {currentUser && !currentUser.isAnonymous && (currentUser.email || currentUser.displayName) ? (
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 pl-2.5 sm:pl-3 pr-2 sm:pr-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-xs shrink-0 shadow-sm whitespace-nowrap">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-emerald-400/50 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
              <span className="font-bold text-emerald-200 text-xs sm:text-sm whitespace-nowrap">
                {currentUser.displayName || currentUser.email?.split('@')[0] || 'Learner'}
              </span>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-200 transition-colors cursor-pointer shrink-0 ml-0.5"
                  title={isAr ? 'تسجيل الخروج' : isKu ? 'دەرچوون لە ئەکاونت' : 'Sign Out'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : onOpenAuthModal ? (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title={isAr ? 'تسجيل الدخول' : isKu ? 'چوونە ژوورەوە' : 'Sign In'}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isAr ? 'دخول' : isKu ? 'چوونە ژوورەوە' : 'Sign In'}</span>
            </button>
          ) : null}

          {/* Quick Tools Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreMenuOpen(!isMoreMenuOpen);
              }}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/90 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title={isKu ? 'ئامرازەکان و ڕێکخستن' : isAr ? 'الأدوات والإعدادات' : 'Tools & Settings'}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreMenuOpen && (
              <div
                className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-slate-950/60 backdrop-blur-xs"
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <div
                  className="w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 animate-fadeIn space-y-1.5"
                  style={{ direction: isKu || isAr ? 'rtl' : 'ltr' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSettings();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{isKu ? 'ڕێکخستنەکانی دەنگ و زمان' : isAr ? 'إعدادات الصوت والنظام' : 'Audio & App Settings'}</span>
                    </button>
                  )}

                  {onOpenCertificate && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCertificate();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>{isKu ? 'بڕوانامەی نێودەوڵەتی CEFR' : isAr ? 'شهادة CEFR الدولية' : 'CEFR Certificate'}</span>
                    </button>
                  )}

                  {onOpenBookmarks && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBookmarks();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      <span>{isKu ? 'دەستەواژە دڵخوازەکان' : isAr ? 'العبارات المحفوظة' : 'Saved Bookmarks'}</span>
                    </button>
                  )}

                  {onRefreshApp && (
                    <button
                      type="button"
                      onClick={() => {
                        onRefreshApp();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isKu ? 'نوێکردنەوە و پاککردنەوە' : isAr ? 'تحديث وتنظيف البيانات' : 'Refresh & Clean Duplicates'}</span>
                    </button>
                  )}

                  {onOpenHelp && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenHelp();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-cyan-400 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{isKu ? 'ڕێنمایی و تێبینییەکان' : isAr ? 'دليل الاستخدام' : 'User Guide & Tips'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

