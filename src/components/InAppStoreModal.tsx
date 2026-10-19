import React, { useState } from 'react';
import { UILanguage } from '../types';
import {
  X,
  Coins,
  Shield,
  Sparkles,
  Lightbulb,
  Gauge,
  Stethoscope,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Flame,
  Snowflake,
  Volume2,
  Zap,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';

export interface InAppStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  coins: number;
  streakFreezes: number;
  hintsCount: number;
  slowAudioUnlocked: boolean;
  unlockedScenarios: string[];
  onBuyItem: (itemId: string, cost: number, itemType: string) => boolean;
  onOpenConversationTab?: () => void;
}

export const InAppStoreModal: React.FC<InAppStoreModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  coins,
  streakFreezes,
  hintsCount,
  slowAudioUnlocked,
  unlockedScenarios,
  onBuyItem,
  onOpenConversationTab,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [activeTab, setActiveTab] = useState<'all' | 'boosts' | 'tracks' | 'earn'>('all');
  const [purchaseMessage, setPurchaseMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleBuy = (itemId: string, cost: number, itemType: string) => {
    if (coins < cost) {
      setPurchaseMessage({
        text: isKu
          ? `دراوی پێویستت نییە! پێویستت بە ${cost} دراوە (ئێستا: ${coins})`
          : isAr
          ? `رصيد العملات غير كافٍ! تحتاج إلى ${cost} عملة (لديك: ${coins})`
          : `Insufficient coins! You need ${cost} coins (you have ${coins})`,
        isError: true,
      });
      setTimeout(() => setPurchaseMessage(null), 3500);
      return;
    }

    const success = onBuyItem(itemId, cost, itemType);
    if (success) {
      setPurchaseMessage({
        text: isKu
          ? 'بەسەرکەوتوویی کڕدرا و زیادکرا بۆ هەژمارەکەت! پیرۆزە 🎉'
          : isAr
          ? 'تم الشراء بنجاح وإضافته إلى حسابك! مبروك 🎉'
          : 'Purchased successfully and added to your inventory! 🎉',
        isError: false,
      });
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
  };

  const isScenarioUnlocked = (id: string) => unlockedScenarios.includes(id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none"
      style={{ direction: isKu || isAr ? 'rtl' : 'ltr' }}
    >
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isKu ? 'فرۆشگای دراوە زێڕینەکان' : isAr ? 'متجر العملات الذهبية' : 'Gold Coins Marketplace'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  KD Shop
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isKu
                  ? 'دراوەکانت بۆ خزمەتگوزاری و بەشە تایبەتەکان بەکاربهێنە'
                  : isAr
                  ? 'استخدم عملاتك الذهبية لشراء المساعدات وفتح الأقسام التخصصية'
                  : 'Spend your earned gold coins on power-ups, hints & special tracks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Current Balance Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-inner">
              <span className="text-sm">🪙</span>
              <span className="tracking-wide">{coins.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title={isKu ? 'داخستن' : isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner if purchase triggered */}
        {purchaseMessage && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b transition-all ${
              purchaseMessage.isError
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <span>{purchaseMessage.text}</span>
            <button
              onClick={() => setPurchaseMessage(null)}
              className="text-xs hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isKu ? 'هەموو کەلوپەلەکان' : isAr ? 'كافة المنتجات' : 'All Items'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('boosts')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'boosts'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isKu ? 'یارمەتیدەرەکان (Hints & Shield)' : isAr ? 'المساعدات والدرع' : 'Power-ups & Hints'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracks')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tracks'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{isKu ? 'بەشە تایبەتەکان (پزیشکی، بازرگانی)' : isAr ? 'الأقسام التخصصية' : 'Specialized Tracks'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earn')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'earn'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{isKu ? 'چۆنیەتی دراو کۆکردنەوە' : isAr ? 'طرق كسب العملات' : 'How to Earn'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* SECTION 1: BOOSTS & POWER-UPS */}
          {(activeTab === 'all' || activeTab === 'boosts') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>{isKu ? 'کەلوپەلی یارمەتیدەر و پارێزەر' : isAr ? 'أدوات المساعدة والحماية' : 'Assistance & Continuity'}</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  {isKu ? `پارێزەری ئاگر: ${streakFreezes} | یارمەتی بێژەکردن: ${hintsCount}` : `Freezes: ${streakFreezes} | Hints: ${hintsCount}`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. STREAK FREEZE */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0 shadow-inner">
                      <Snowflake className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white">
                          {isKu ? 'پارێزەری ئاگری ڕۆژانە (Streak Freeze)' : isAr ? 'درع الحماية اليومي (Streak Freeze)' : 'Daily Streak Freeze Shield'}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isKu
                          ? 'ڕۆژە بەردەوامەکانت دەپارێزێت تا نمرە و زنجیرەی ئاگرەکەت نەفەوتێت ئەگەر ڕۆژێک نەتوانیت بەشداری بکەیت.'
                          : isAr
                          ? 'يحمي سلسلتك اليومية من الضياع إذا تعذر عليك الدخول للتطبيق في أحد الأيام.'
                          : 'Protects your active daily streak from resetting if you miss a single day of practice.'}
                      </p>
                      <div className="text-[11px] font-bold text-cyan-400 pt-0.5">
                        {isKu ? `لە هەژمارتدایە: ${streakFreezes} پارێزەر` : isAr ? `المتوفر لديك: ${streakFreezes}` : `Owned: ${streakFreezes} active shields`}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                      <span>🪙 200</span>
                      <span className="text-[10px] text-slate-400 font-normal">/ {isKu ? 'دانە' : 'unit'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuy('streak_freeze', 200, 'freeze')}
                      disabled={coins < 200}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        coins >= 200
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>{isKu ? 'کڕینی پارێزەر' : isAr ? 'شراء الدرع' : 'Buy Shield'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. PHONETIC HINTS PACK */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white">
                          {isKu ? 'پاکێجی ٥ یارمەتیدەری بێژەکردن (Hints)' : isAr ? 'باقة 5 تلميحات صوتية (Hints)' : '5 Phonetic Clues & Hints Pack'}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isKu
                          ? 'شیکاری پیتە قورسەکان و شوێنی لێو و زمان دەردەخات لە تاقیکردنەوە قورسەکاندا بۆ بەدەستهێنانی نمرەی ٩٠٪+.'
                          : isAr
                          ? 'يوضح لك موضع الشفاه ومخارج الحروف والتشديد الصوتي للجمل الصعبة لتحقيق درجات عالية.'
                          : 'Unlocks acoustic guidance, mouth positioning tips, and stress guides during tricky test stages.'}
                      </p>
                      <div className="text-[11px] font-bold text-amber-400 pt-0.5">
                        {isKu ? `لە هەژمارتدایە: ${hintsCount} یارمەتی` : isAr ? `المتوفر لديك: ${hintsCount}` : `Owned: ${hintsCount} hints`}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                      <span>🪙 150</span>
                      <span className="text-[10px] text-slate-400 font-normal">/ 5 {isKu ? 'یارمەتی' : 'hints'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuy('hints_pack_5', 150, 'hints')}
                      disabled={coins < 150}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        coins >= 150
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>{isKu ? 'کڕینی پاکێج (+٥)' : isAr ? 'شراء الباقة (+5)' : 'Buy +5 Hints'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. SLOW-MOTION PHONETICS AUDIO */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                      <Gauge className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white">
                          {isKu ? 'خاوکردنەوەی پێشکەوتووی دەنگ (0.75x & 0.5x Ultra-Slow)' : isAr ? 'خاصية تبطيء النطق الفائق (0.75x و 0.5x)' : 'Ultra-Slow Phonetic Player (0.75x & 0.5x)'}
                        </h5>
                        {slowAudioUnlocked && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {isKu ? 'کراوەتەوە ✓' : isAr ? 'مفعل ✓' : 'Unlocked ✓'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isKu
                          ? 'ڕێگەت پێدەدات دەنگی خوێندنەوەی نموونەیی خاو بکەیتەوە بۆ نیوەی خێرایی ئاسایی، تا هەموو پیت و کێشی دەنگەکان بە وردی ببیسیت پێش ئەوەی دەنگت تۆمار بکەیت.'
                          : isAr
                          ? 'يتيح لك الاستماع للنطق الأصلي بسرعة بطيئة جداً لسماع مخارج كافة الحروف والكلمات بوضوح تام قبل التسجيل.'
                          : 'Slows down target audio playback to 0.75x and 0.5x to hear intricate consonant clusters before recording.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                      <span>🪙 250</span>
                      <span className="text-[10px] text-slate-400 font-normal">({isKu ? 'کردنەوەی هەمیشەیی' : isAr ? 'تفعيل دائم' : 'Permanent'})</span>
                    </div>

                    {slowAudioUnlocked ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isKu ? 'چالاککراوە لە تەواوی بەرنامە' : isAr ? 'مفعل وجاهز للاستخدام' : 'Active & Ready'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuy('slow_audio_unlock', 250, 'slow_audio')}
                        disabled={coins < 250}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          coins >= 250
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>{isKu ? 'کردنەوەی هەمیشەیی' : isAr ? 'فتح الميزة الآن' : 'Unlock Feature'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SPECIALIZED TOPICS & TRACKS */}
          {(activeTab === 'all' || activeTab === 'tracks') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  <span>{isKu ? 'کردنەوەی بەشە پێشکەوتووەکان' : isAr ? 'فتح الأقسام التخصصية المتقدمة' : 'Specialized Career & Academic Tracks'}</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  {isKu ? 'بە دراو قوفڵیان بکەرەوە' : isAr ? 'افتحها باستخدام عملاتك' : 'Unlock permanently'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. MEDICAL & HOSPITAL WARD TRACK */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white">
                          {isKu ? 'بەشی گفتوگۆی پزیشکی و نەخۆشخانە' : isAr ? 'قسم المحادثات الطبية والمستشفى' : 'Medical & Hospital Clinical Track'}
                        </h5>
                        {isScenarioUnlocked('hospital') && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {isKu ? 'کراوەتەوە ✓' : isAr ? 'مفتوح ✓' : 'Unlocked ✓'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isKu
                          ? 'دەربازبوون بەناو دەستەواژەکانی پشکنینی نەخۆش، تاقیگە، فریاکەوتن، تیشک و دەرمان لەگەڵ پزیشکی دەنگیی زیرەک.'
                          : isAr
                          ? 'حوارات تخصصية معمقة في الطوارئ، غرف العمليات، الصيدلية وقراءة التحاليل السريرية.'
                          : 'Deep spoken clinical dialogues covering emergency triage, pharmacy consultation, surgery, and diagnostics.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                      <span>🪙 400</span>
                      <span className="text-[10px] text-slate-400 font-normal">({isKu ? 'هەمیشەیی' : 'Permanent'})</span>
                    </div>

                    {isScenarioUnlocked('hospital') ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenConversationTab) onOpenConversationTab();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{isKu ? 'چوونە ژوورەوە' : isAr ? 'دخول القسم' : 'Enter Track'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuy('track_hospital', 400, 'scenario_hospital')}
                        disabled={coins < 400}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          coins >= 400
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isKu ? 'کردنەوە (٤٠٠ 🪙)' : isAr ? 'فتح القسم (400 🪙)' : 'Unlock (400 🪙)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. BUSINESS & NEGOTIATION TRACK */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-inner">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white">
                          {isKu ? 'بەشی گفتوگۆی بازرگانی و گرێبەستەکان' : isAr ? 'قسم المفاوضات التجارية واجتماعات العمل' : 'Executive Business & Negotiation Track'}
                        </h5>
                        {isScenarioUnlocked('business') && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {isKu ? 'کراوەتەوە ✓' : isAr ? 'مفتوح ✓' : 'Unlocked ✓'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isKu
                          ? 'مەشقی چاوپێکەوتنی کار، گرێبەستە نێودەوڵەتییەکان، و وتووێژی پێشکەوتووی ئابووری لەگەڵ پسپۆڕی دەنگ.'
                          : isAr
                          ? 'حوارات المقابلات الوظيفية، صفقات الاستثمار، والتفاوض المهني باللغات العالمية.'
                          : 'High-stakes boardroom talks, salary negotiations, multinational client pitches, and executive interviews.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                      <span>🪙 350</span>
                      <span className="text-[10px] text-slate-400 font-normal">({isKu ? 'هەمیشەیی' : 'Permanent'})</span>
                    </div>

                    {isScenarioUnlocked('business') ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenConversationTab) onOpenConversationTab();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{isKu ? 'چوونە ژوورەوە' : isAr ? 'دخول القسم' : 'Enter Track'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuy('track_business', 350, 'scenario_business')}
                        disabled={coins < 350}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          coins >= 350
                            ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md shadow-purple-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isKu ? 'کردنەوە (٣٥٠ 🪙)' : isAr ? 'فتح القسم (350 🪙)' : 'Unlock (350 🪙)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. ACADEMIC & RESEARCH TRACK */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white">
                          {isKu ? 'بەشی زانکۆ، توێژینەوە و سیمیناری زانستی' : isAr ? 'قسم الأبحاث الأكاديمية والندوات الجامعية' : 'Academic Research, Thesis & University Seminars'}
                        </h5>
                        {isScenarioUnlocked('academic') && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {isKu ? 'کراوەتەوە ✓' : isAr ? 'مفتوح ✓' : 'Unlocked ✓'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isKu
                          ? 'پێشکەشکردنی داکۆکیکردن لە نامەی ماستەر و دکتۆرا، سیمینار و وتووێژی ئەکادیمی بە زمانی ئینگلیزی بەپێی ستانداردەکانی زانکۆکانی جیهان.'
                          : isAr
                          ? 'تدريب صوتي لمناقشة أطروحات الماجستير والدكتوراه، المؤتمرات العلمية والمصطلحات الأكاديمية.'
                          : 'Doctoral thesis defenses, academic paper presentations, research peer review dialogues, and university lectures.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                      <span>🪙 300</span>
                      <span className="text-[10px] text-slate-400 font-normal">({isKu ? 'هەمیشەیی' : 'Permanent'})</span>
                    </div>

                    {isScenarioUnlocked('academic') ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenConversationTab) onOpenConversationTab();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{isKu ? 'چوونە ژوورەوە' : isAr ? 'دخول القسم' : 'Enter Track'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuy('track_academic', 300, 'scenario_academic')}
                        disabled={coins < 300}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          coins >= 300
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isKu ? 'کردنەوە (٣٠٠ 🪙)' : isAr ? 'فتح القسم (300 🪙)' : 'Unlock (300 🪙)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: HOW TO EARN COINS GUIDE */}
          {(activeTab === 'all' || activeTab === 'earn') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-900 border border-amber-500/30 space-y-3.5">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  {isKu ? 'چۆن دراوی زێڕین بەدەستبهێنم؟' : isAr ? 'كيف تكسب المزيد من العملات الذهبية؟' : 'How to Earn More Gold Coins'}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-2.5">
                  <span className="text-lg">🎯</span>
                  <div>
                    <span className="font-bold text-emerald-300 block">
                      {isKu ? 'نمرەی بێ هەڵە (٩٥٪+): +١٢٠ 🪙' : isAr ? 'درجة نطق ممتازة (95%+): +120 🪙' : 'Native Mastery (95%+): +120 🪙'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isKu ? 'تەواوکردنی هەر قۆناغێک بە ڕەوانی باڵا' : isAr ? 'إتقان نطق الجملة بدقة وسلاسة عالية' : 'Speak with natural tempo & clear phonetics'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-2.5">
                  <span className="text-lg">✅</span>
                  <div>
                    <span className="font-bold text-cyan-300 block">
                      {isKu ? 'تەواوکردنی قۆناغ (٦٠٪ - ٩٤٪): +٥٠ بۆ +٨٠ 🪙' : isAr ? 'اجتياز أي مرحلة: +50 إلى +80 🪙' : 'Passing Any Stage: +50 to +80 🪙'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isKu ? 'هەر تاقیکردنەوەیەکی سەركەوتوو لە نەخشەی ١,٠٠٠ قۆناغ' : isAr ? 'أي فحص ناجح في خريطة الـ 1,000 مرحلة' : 'Every passed stage on the winding road map'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-2.5">
                  <span className="text-lg">🔥</span>
                  <div>
                    <span className="font-bold text-amber-300 block">
                      {isKu ? 'ئاگری ڕۆژانە (Daily Streak): +١٥٠ 🪙' : isAr ? 'التدريب اليومي المتواصل: +150 🪙' : 'Daily Streak Mission: +150 🪙'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isKu ? 'دەنگت تۆمار بکە هەموو ڕۆژێک لە بەشی ئاگری ڕۆژانە' : isAr ? 'أكمل تحدي اليوم الصوتي يومياً' : 'Complete today\'s challenge to keep streak burning'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-2.5">
                  <span className="text-lg">🏆</span>
                  <div>
                    <span className="font-bold text-purple-300 block">
                      {isKu ? 'کردنەوەی جیهانی نوێ: +٣٠٠ 🪙' : isAr ? 'فتح عالم جديد في الخريطة: +300 🪙' : 'New World Unlock Milestone: +300 🪙'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isKu ? 'دەربازبوون لە نێوان ١٠ جیهانی سەرەکی' : isAr ? 'الوصول للعوالم التخصصية A1 إلى C2' : 'Progress through CEFR milestones on the map'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">🪙 {coins.toLocaleString()}</span>
            <span>{isKu ? 'دراوی بەردەست لە هەژمارەکەتدا' : isAr ? 'عملة متاحة في رصيدك' : 'coins currently in balance'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            {isKu ? 'داخستنی فرۆشگا' : isAr ? 'إغلاق المتجر' : 'Close Shop'}
          </button>
        </div>

      </div>
    </div>
  );
};
