import React, { useState, useEffect } from 'react';
import { UILanguage, TargetLanguage } from '../types';
import {
  Sparkles,
  User,
  GraduationCap,
  Globe2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { KurdistanFlag } from './KurdistanFlag';

interface ProfilePersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  currentCefr: string;
  currentUser?: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  } | null;
  onSaveProfile: (data: {
    displayName: string;
    cefrLevel: string;
    targetLang: TargetLanguage;
  }) => Promise<void> | void;
}

interface CefrTierOption {
  code: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  titleKu: string;
  titleAr: string;
  titleEn: string;
  descKu: string;
  descAr: string;
  descEn: string;
  badgeColor: string;
  borderColor: string;
  isRecommended?: boolean;
}

const CEFR_TIERS: CefrTierOption[] = [
  {
    code: 'A1',
    titleKu: 'A1 - سەرەتایی (دەستپێک)',
    titleAr: 'A1 - مبتدئ (الأساسيات)',
    titleEn: 'A1 - Beginner (Foundation)',
    descKu: 'وشە و ڕستەی سادەی ڕۆژانە و سڵاوکردن',
    descAr: 'المفردات الأساسية والتحيات اليومية البسيطة',
    descEn: 'Basic greetings, numbers, and common simple words',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    borderColor: 'hover:border-emerald-500/60 peer-checked:border-emerald-500',
  },
  {
    code: 'A2',
    titleKu: 'A2 - سەرەتایی باڵا',
    titleAr: 'A2 - أساسي متقدم',
    titleEn: 'A2 - Elementary',
    descKu: 'دیالۆگی کورتی ئاسایی و پرسیاری ڕۆتینی',
    descAr: 'حوارات روتينية قصيرة وأسئلة شائعة',
    descEn: 'Routine daily interactions and short practical sentences',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    borderColor: 'hover:border-teal-500/60 peer-checked:border-teal-500',
  },
  {
    code: 'B1',
    titleKu: 'B1 - مامناوەند (پێشنیارکراو ⭐)',
    titleAr: 'B1 - متوسط (موصى به ⭐)',
    titleEn: 'B1 - Intermediate (Recommended ⭐)',
    descKu: 'گفتوگۆی نۆرینگە، نیشانەکان و دەرمانخانە',
    descAr: 'محادثات متدفقة، زيارات العيادة ووصف الحالات',
    descEn: 'Conversational flow, clinic visits, and common symptoms',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    borderColor: 'hover:border-cyan-500/60 peer-checked:border-cyan-500',
    isRecommended: true,
  },
  {
    code: 'B2',
    titleKu: 'B2 - مامناوەندی بەرز',
    titleAr: 'B2 - فوق المتوسط',
    titleEn: 'B2 - Upper Intermediate',
    descKu: 'ڕستەی ئاڵۆز، دەربڕینی خێرا و شیکاری تەندروستی',
    descAr: 'تراكيب لغوية متقدمة وتفاصيل استشارية عميقة',
    descEn: 'Complex expressions, healthcare discussions, and fluent dialogue',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    borderColor: 'hover:border-sky-500/60 peer-checked:border-sky-500',
  },
  {
    code: 'C1',
    titleKu: 'C1 - پێشکەوتوو',
    titleAr: 'C1 - متقدم',
    titleEn: 'C1 - Advanced',
    descKu: 'زاراوەی پزیشکی و زانستی بە خێرایی بەرز',
    descAr: 'مصطلحات طبية وسريرية تخصصية بطلاقة عالية',
    descEn: 'Specialized clinical vocabulary, rapid pacing, and nuanced tone',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    borderColor: 'hover:border-indigo-500/60 peer-checked:border-indigo-500',
  },
  {
    code: 'C2',
    titleKu: 'C2 - شارەزا و باڵا',
    titleAr: 'C2 - إتقان وطلاقة تامة',
    titleEn: 'C2 - Mastery / Native Precision',
    descKu: 'ڕەوانبێژی و بێ کەموکوڕی وەک ئاخێوەری ڕەسەن',
    descAr: 'طلاقة استثنائية ونطق احترافي بمستوى متحدث أصلي',
    descEn: 'Native-like phonetic precision, complex consultations, and idioms',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    borderColor: 'hover:border-purple-500/60 peer-checked:border-purple-500',
  },
];

export const ProfilePersonalizationModal: React.FC<ProfilePersonalizationModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  targetLang: initialTargetLang,
  currentCefr: initialCefr,
  currentUser,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const defaultName =
    currentUser?.displayName ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    '';

  const [name, setName] = useState(defaultName);
  const [selectedCefr, setSelectedCefr] = useState<string>(initialCefr || 'B1');
  const [selectedTargetLang, setSelectedTargetLang] = useState<TargetLanguage>(
    initialTargetLang || 'en'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
    } else if (currentUser?.email && !name) {
      setName(currentUser.email.split('@')[0]);
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Fire festive celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
        });
      } catch (err) {}

      await onSaveProfile({
        displayName: name.trim() || defaultName || 'Learner',
        cefrLevel: selectedCefr,
        targetLang: selectedTargetLang,
      });

      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error saving personalized profile:', err);
      setSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold mb-1">
                <ShieldCheck className="w-3 h-3" />
                <span>
                  {isAr
                    ? 'اكتمل التسجيل بنجاح'
                    : isKu
                    ? 'تۆماربوون بە سەرکەوتوویی ئەنجامدرا'
                    : 'Registration Completed'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {isAr
                  ? 'تخصيص ملفك الشخصي ومستوى التعلم'
                  : isKu
                  ? 'ڕێکخستنی پرۆفایل و ئاستی زمانیت'
                  : 'Personalize Your Profile & Level'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isAr
                  ? 'حدد اسمك ومستواك اللغوي المفضل لتخصيص التمارين اليومية والتقييم الصوتي بدقة.'
                  : isKu
                  ? 'ناو و ئاستی پەسەندکراوی زمانت دیاریبکە تا ڕاهێنانە دەنگییەکان و وشەکان بەپێی تۆ ڕێکبخرێن.'
                  : 'Set your name and preferred CEFR level so speech missions and phrase complexity match your goals.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              {isAr ? 'اسمك أو اللقب المعروض:' : isKu ? 'ناوی تۆ یان نازناو:' : 'Your Display Name or Nickname:'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3.5 rtl:pl-0 rtl:pr-3.5 pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'مثال: أحمد عبد الله' : isKu ? 'نموونە: هێمن کاروان' : 'e.g. Alex Barzan'}
                className="w-full py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr
                ? '💡 سيظهر اسمك في تقارير التقييم الصوتي وبطاقة الشهادة ولوحة الصدارة.'
                : isKu
                ? '💡 ناوی تۆ لە سەرنجەکانی هەڵسەنگاندنی دەنگ، بڕوانامە و ڕیزبەندی بەکارهێنەران پیشان دەدرێت.'
                : '💡 Your name will appear on voice assessments, certificate cards, and leaderboard.'}
            </p>
          </div>

          {/* 2. Target Practice Language Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              {isAr
                ? 'اللغة المستهدفة للتدريب الصوتي:'
                : isKu
                ? 'زمانی مەبەست بۆ مەشقی دەنگی:'
                : 'Target Language for Voice Practice:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en' as TargetLanguage, labelEn: 'English', labelKu: 'ئینگلیزی', labelAr: 'الإنجليزية', flagNode: <span>🇬🇧</span> },
                { code: 'ku' as TargetLanguage, labelEn: 'Kurdish', labelKu: 'کوردی', labelAr: 'الكردية', flagNode: <KurdistanFlag size="xs" glow={false} rounded={false} /> },
                { code: 'ar' as TargetLanguage, labelEn: 'Arabic', labelKu: 'عەرەبی', labelAr: 'العربية', flagNode: <span>🇮🇶</span> },
              ].map((lang) => {
                const isSelected = selectedTargetLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedTargetLang(lang.code)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {lang.flagNode}
                    <span>{isAr ? lang.labelAr : isKu ? lang.labelKu : lang.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Preferred CEFR Level Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200">
                {isAr
                  ? 'مستواك اللغوي المفضل (CEFR):'
                  : isKu
                  ? 'ئاستی زمانی پەسەندکراوت (CEFR):'
                  : 'Preferred Language Level (CEFR):'}
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>{isAr ? 'يتكيف تلقائياً' : isKu ? 'خۆکارانە دەگونجێت' : 'Auto-adapts'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CEFR_TIERS.map((tier) => {
                const isSelected = selectedCefr === tier.code;
                return (
                  <div
                    key={tier.code}
                    onClick={() => setSelectedCefr(tier.code)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-black border ${tier.badgeColor}`}
                        >
                          {tier.code}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {isAr ? tier.titleAr : isKu ? tier.titleKu : tier.titleEn}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {isAr ? tier.descAr : isKu ? tier.descKu : tier.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isAr ? 'جاري الحفظ والتخصيص...' : isKu ? 'پاشەکەوت دەکرێت...' : 'Saving profile...'}
                  </span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'حفظ المستوى والبدء بالتعلم'
                      : isKu
                      ? 'پاشەکەوتکردن و دەستپێکردنی فێربوون'
                      : 'Save Level & Start Learning'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              {isAr ? 'تخطي الآن' : isKu ? 'بۆ ئێستا تێپەڕێنە' : 'Skip for now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
