import React from 'react';
import { UILanguage, TargetLanguage } from '../types';
import { KurdistanFlag } from './KurdistanFlag';
import {
  Mic,
  Award,
  BookOpen,
  Map,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  Activity,
  ArrowRight,
  CheckCircle2,
  Trophy,
} from 'lucide-react';

interface MobileHeroOverviewProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  currentCefr: string;
  unlockedStage: number;
  completedStagesCount: number;
  streakDays: number;
  onOpenMap: () => void;
  onOpenStudio: () => void;
  onOpenConversation: () => void;
  onOpenLibrary: () => void;
  onOpenCertificate: () => void;
}

export const MobileHeroOverview: React.FC<MobileHeroOverviewProps> = ({
  uiLang,
  targetLang,
  currentCefr,
  unlockedStage,
  completedStagesCount,
  streakDays,
  onOpenMap,
  onOpenStudio,
  onOpenConversation,
  onOpenLibrary,
  onOpenCertificate,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  return (
    <div className="w-full space-y-5 animate-fadeIn pb-20">
      {/* 1. Main Hero Carousel Card matching Screenshot 1 & 4 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 sm:p-7 shadow-2xl">
        {/* Subtle glowing background radiant spot */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-5">
          {/* Top Pill Badge matching Screenshot 1/4 */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isAr
                  ? 'بنك العبارات والمحادثات المعتمدة (١,٠٠٠ قۆناغ)'
                  : isKu
                  ? 'بانکی بەکارهێنەرانی قسەکردن (١,٠٠٠ قۆناغ)'
                  : 'Speaking Assessment Track (1,000 Stages)'}
              </span>
            </span>

            {/* Streak flame badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>{streakDays} {isAr ? 'أيام' : isKu ? 'ڕۆژ' : 'days'}</span>
            </div>
          </div>

          {/* Hero Headline & Waveform Graphic with Kurdistan Flag matching Screenshot 1 & 4 */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                {isAr
                  ? 'اختبار مستوى التحدث بالصوت (١,٠٠٠ مرحلة)'
                  : isKu
                  ? 'تاقیکردنەوەی ئاستی قسەکردن بە دەنگ (١,٠٠٠ قۆناغ)'
                  : 'Voice Speaking Level Test (1,000 Stages)'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? 'سجل صوتك للحصول على تقييم نطق حقيقي بنظام CEFR واستكشف مسار الخريطة التفاعلي.'
                  : isKu
                  ? 'دەنگت تۆماربکە بۆ ڕێگای تایبەتی و خێرای فێربوون، پشکنینی ڕەوانی بێژەکردن و بەدەستهێنانی نمرەی باڵا.'
                  : 'Record your spoken voice for real CEFR pronunciation scoring and journey across interactive map worlds.'}
              </p>
            </div>

            {/* Waveform graphic with circular Kurdistan flag badge matching Screenshot 1 & 4 */}
            <div className="flex items-center gap-2 self-center shrink-0 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
              {/* Left animated audio bars */}
              <div className="flex items-center gap-1 h-10">
                {[12, 24, 36, 20, 30].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-cyan-400 to-teal-300 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>

              {/* Kurdistan Circular Flag Badge */}
              <div className="relative p-1 rounded-full ring-2 ring-amber-400/80 shadow-md shadow-amber-400/20 bg-slate-900">
                <KurdistanFlag size="sm" rounded bordered glow />
              </div>

              {/* Right animated audio bars */}
              <div className="flex items-center gap-1 h-10">
                {[30, 20, 36, 24, 12].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-teal-300 to-emerald-400 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 140}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Button & Carousel Dots matching Screenshot 1/4 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            {/* Carousel Dots */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-1.5 rounded-full bg-emerald-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>

            <div className="flex items-center gap-2">
              {/* Open Map Button matching Screenshot 2 */}
              <button
                type="button"
                onClick={onOpenMap}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
              >
                <Map className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'عرض خريطة المراحل' : isKu ? 'نەخشەی قۆناغەکان' : 'View Stages Map'}</span>
              </button>

              {/* Start Speaking Test Button matching Screenshot 3 */}
              <button
                type="button"
                onClick={onOpenStudio}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95"
              >
                <Mic className="w-4 h-4" />
                <span>
                  {isAr ? `ابدأ المرحلة #${unlockedStage}` : isKu ? `دەستپێکردنی قۆناغی #${unlockedStage}` : `Start Stage #${unlockedStage}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Secondary Two Quick Cards matching Screenshot 1 & 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: CEFR Level & Certificate */}
        <div
          onClick={onOpenCertificate}
          className="p-5 rounded-3xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-3 group shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CEFR
            </span>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 group-hover:text-purple-300 transition-colors">
              <span>{isAr ? 'عرض الشهادة' : isKu ? 'پیشاندانی بڕوانامە' : 'Certificate'}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">
              {isAr ? 'چوونە ژوور / CEFR' : isKu ? 'چوونە ژوور / ئاستی CEFR' : 'CEFR Assessment'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr
                ? `مستواك الحالي المعتمد هو ${currentCefr}. أكملت ${completedStagesCount} مرحلة بنجاح.`
                : isKu
                ? `ئاستی ئێستات بریتییە لە ${currentCefr}. تا ئێستا ${completedStagesCount} قۆناغت بە سەرکەوتوویی تێپەڕاندووە.`
                : `Current verified level: ${currentCefr}. ${completedStagesCount} stages completed.`}
            </p>
          </div>
        </div>

        {/* Card 2: AI Voice Conversation / Practice */}
        <div
          onClick={onOpenConversation}
          className="p-5 rounded-3xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-3 group shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {isAr ? 'محادثة ذكية' : isKu ? 'هاوڕێی دەنگ' : 'AI Voice'}
            </span>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 group-hover:text-teal-300 transition-colors">
              <span>{isAr ? 'بدء المحادثة' : isKu ? 'گفتوگۆ بکە' : 'Start Chat'}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">
              {isAr ? 'پۆلی زمان و هاوڕێی زیرەک' : isKu ? 'پۆلی زمان و هاوڕێی دەنگ' : 'AI Interactive Tutor'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'محادثات واقعية في مجالات الطب، التجارة، والجامعات مع تصحيح فوري للنطق.'
                : isKu
                ? 'گفتوگۆی ڕاستەقینە لە بواری پزیشکی، بازرگانی و ئەکادیمی لەگەڵ ڕاستکردنەوەی خێرا.'
                : 'Real dialogues in Medicine, Business, and Academia with live corrections.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Section Title matching Screenshot 1 & 4 ("تاقیکردنەوەی دەنگ") */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'تاقیکردنەوەی دەنگ' : isKu ? 'تاقیکردنەوەی دەنگ و قۆناغەکان' : 'Voice Speaking Assessment'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'انتقل مباشرة إلى شاشات التقييم الموضحة في التطبيق'
                : isKu
                ? 'ڕۆشتن بۆ شاشەی تۆمارکردنی دەنگ یان نەخشەی قۆناغەکان'
                : 'Switch between Speaking Studio and Stages Map'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'الخريطة' : isKu ? 'نەخشەی ئاستەکان' : 'Level Map'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
