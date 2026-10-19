import React, { useState, useEffect } from 'react';
import { TargetLanguage, UILanguage, SavedBookmark } from '../types';
import { DAILY_MISSIONS, WORD_OF_THE_DAY } from '../data/learningHubData';
import { playWordOrSentence } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Flame,
  Zap,
  Volume2,
  CheckCircle2,
  Clock,
  Award,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
  Bookmark,
  Mic,
  Sliders,
  Check,
} from 'lucide-react';

export interface RecommendedChallengePhrase {
  id: string;
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  tier: 'foundation' | 'intermediate' | 'advanced';
  textEn: string;
  textKu: string;
  textAr: string;
  categoryEn: string;
  categoryKu: string;
  categoryAr: string;
  complexityScore: number;
  focusPointEn: string;
  focusPointKu: string;
  focusPointAr: string;
}

export const RECOMMENDED_CHALLENGE_PHRASES: RecommendedChallengePhrase[] = [
  // Tier 1: Foundation (A1 / A2)
  {
    id: 'rec-a1-1',
    cefr: 'A1',
    tier: 'foundation',
    textEn: 'Please sit down and take three slow, deep breaths.',
    textKu: 'تکایە دابنیشە و سێ هەناسەی هێواش و قووڵ هەڵمژە.',
    textAr: 'من فضلك اجلس وخذ ثلاثة أنفاس بطيئة وعميقة.',
    categoryEn: 'Basic Care',
    categoryKu: 'چاودێری سەرەتایی',
    categoryAr: 'رعاية أساسية',
    complexityScore: 1,
    focusPointEn: 'Vowel elongation & calm pacing',
    focusPointKu: 'ڕاکێشانی بزوێن و هێمنی دەنگ',
    focusPointAr: 'مد الحركات ونبرة هادئة',
  },
  {
    id: 'rec-a1-2',
    cefr: 'A2',
    tier: 'foundation',
    textEn: 'The doctor will check your blood pressure now.',
    textKu: 'پزیشکەکە ئێستا پەستانی خوێنت دەپشکنێت.',
    textAr: 'سيقوم الطبيب بفحص ضغط دمك الآن.',
    categoryEn: 'Triage & Vitals',
    categoryKu: 'پشکنینی نیشانەکان',
    categoryAr: 'فحص العلامات الحيوية',
    complexityScore: 2,
    focusPointEn: 'Plosive consonants /p/ and /d/',
    focusPointKu: 'دەنگی تەقینەوەیی /p/ و /d/',
    focusPointAr: 'الحروف الانفجارية ونطق الضغط',
  },
  {
    id: 'rec-a2-1',
    cefr: 'A2',
    tier: 'foundation',
    textEn: 'Do you feel sharp pain in your chest or head?',
    textKu: 'هیچ ئازارێکی تیژت هەیە لە سنگ یان سەرتدا؟',
    textAr: 'هل تشعر بألم حاد في صدرك أو رأسك؟',
    categoryEn: 'Symptoms',
    categoryKu: 'نیشانەکانی نەخۆشی',
    categoryAr: 'الأعراض والشكوى',
    complexityScore: 2,
    focusPointEn: 'Rising intonation in inquiries',
    focusPointKu: 'بەرزکردنەوەی ئاوازی دەنگ لە پرسیاردا',
    focusPointAr: 'النبرة الاستفهامية الصاعدة',
  },
  {
    id: 'rec-a1-3',
    cefr: 'A1',
    tier: 'foundation',
    textEn: 'Take one tablet before breakfast every morning.',
    textKu: 'بەیانیان یەک دانە حەب پێش نانی بەیانی بخۆ.',
    textAr: 'تناول قرصاً واحداً قبل الإفطار كل صباح.',
    categoryEn: 'Medication',
    categoryKu: 'بەکارهێنانی دەرمان',
    categoryAr: 'تعليمات الدواء',
    complexityScore: 1,
    focusPointEn: 'Rhythm and word linking',
    focusPointKu: 'ڕیتم و لکاندنی وشەکان',
    focusPointAr: 'التناغم ووصل الكلمات بسلاسة',
  },
  {
    id: 'rec-a2-2',
    cefr: 'A2',
    tier: 'foundation',
    textEn: 'Drink plenty of warm water and stay resting until tomorrow.',
    textKu: 'ئاوێکی زۆری شلەتێن بخۆرەوە و تا بەیانی پشوو بدە.',
    textAr: 'اشرب الكثير من الماء الدافئ وابقَ مستريحاً حتى الغد.',
    categoryEn: 'Recovery',
    categoryKu: 'چاکبوونەوە و پشوو',
    categoryAr: 'الراحة والاستشفاء',
    complexityScore: 2,
    focusPointEn: 'Smooth transition between clauses',
    focusPointKu: 'پەیوەستکردنی ڕستەکان بە نەرمی',
    focusPointAr: 'الربط السلس بين العبارات',
  },

  // Tier 2: Intermediate (B1 / B2)
  {
    id: 'rec-b1-1',
    cefr: 'B1',
    tier: 'intermediate',
    textEn: 'I need to check my clinical vitals immediately.',
    textKu: 'پێویستە دەستبەجێ نیشانە سەرەکییەکانم بپشکنم.',
    textAr: 'أحتاج لفحص علاماتي الحيوية السريرية فوراً.',
    categoryEn: 'Clinical Check',
    categoryKu: 'پشکنینی کلینیکی',
    categoryAr: 'فحص سريري',
    complexityScore: 3,
    focusPointEn: 'Multisyllabic clarity on "immediately"',
    focusPointKu: 'دەربڕینی ڕوونی فرەبڕگەی "immediately"',
    focusPointAr: 'وضوح الكلمات متعددة المقاطع',
  },
  {
    id: 'rec-b2-1',
    cefr: 'B2',
    tier: 'intermediate',
    textEn: 'The physician ordered a comprehensive metabolic blood panel.',
    textKu: 'پزیشک داوای پشکنینی گشتی ئەنزیمەکانی کرد.',
    textAr: 'طلب الطبيب إجراء فحص أيضي شامل للدم.',
    categoryEn: 'Diagnostics',
    categoryKu: 'دەستنیشانکردنی تاقیگەیی',
    categoryAr: 'فحوصات مخبرية',
    complexityScore: 4,
    focusPointEn: 'Stress placement on "comprehensive" and "metabolic"',
    focusPointKu: 'تەئکید لەسەر بڕگەکانی metabolic و comprehensive',
    focusPointAr: 'الضغط الصوتي على المقاطع الطبية',
  },
  {
    id: 'rec-b2-2',
    cefr: 'B2',
    tier: 'intermediate',
    textEn: 'Does this medication have any noticeable adverse side effects?',
    textKu: 'ئایا ئەم دەرمانە هیچ کاریگەرییەکی لاوەکی هەیە؟',
    textAr: 'هل يسبب هذا الدواء أي آثار جانبية ملحوظة؟',
    categoryEn: 'Pharmacology',
    categoryKu: 'دەرمانناسی',
    categoryAr: 'علم الأدوية',
    complexityScore: 4,
    focusPointEn: 'Articulation of compound adjective "adverse side effects"',
    focusPointKu: 'بێژەکردنی دروستی "adverse side effects"',
    focusPointAr: 'نطق المصطلحات المركبة بدقة',
  },
  {
    id: 'rec-b1-2',
    cefr: 'B1',
    tier: 'intermediate',
    textEn: 'Elevating the head of the bed helps with breathing at night.',
    textKu: 'بەرزکردنەوەی سەرین یارمەتی هەناسەدانی شەوانە دەدات.',
    textAr: 'رفع مستوى رأس السرير يساعد في تحسين التنفس ليلاً.',
    categoryEn: 'Nursing Care',
    categoryKu: 'پەرستاری و خزمەت',
    categoryAr: 'العناية التمريضية',
    complexityScore: 3,
    focusPointEn: 'Gerund phrase fluency "elevating the head"',
    focusPointKu: 'ڕەوانی لە دەربڕینی دەستەواژەی سەرەتا',
    focusPointAr: 'انسيابية البدايات المصدرية',
  },
  {
    id: 'rec-b2-3',
    cefr: 'B2',
    tier: 'intermediate',
    textEn: 'Our specialized cardiology team will review the scan tomorrow.',
    textKu: 'تیمی پسپۆڕی دڵ بەیانی تیشکەکە دەبینن.',
    textAr: 'سيراجع فريق أمراض القلب التخصصي صور الأشعة غداً.',
    categoryEn: 'Cardiology',
    categoryKu: 'پسپۆڕی دڵ',
    categoryAr: 'أمراض القلب',
    complexityScore: 4,
    focusPointEn: 'Phonetic precision on "specialized cardiology"',
    focusPointKu: 'وردی دەنگی لە "specialized cardiology"',
    focusPointAr: 'دقة المخارج في المصطلحات التخصصية',
  },

  // Tier 3: Advanced (C1 / C2)
  {
    id: 'rec-c1-1',
    cefr: 'C1',
    tier: 'advanced',
    textEn: 'The differential diagnosis necessitates evaluating bilateral pulmonary infiltrates and inflammatory biomarkers.',
    textKu: 'دەستنیشانکردنی جیاواز پێویستی بە هەڵسەنگاندنی هەوکردنی هەردوو سی و نیشاندەرە بایۆلۆجییەکان هەیە.',
    textAr: 'التشخيص التفريقي يستلزم تقييم ارتشاحات الرئة الثنائية والمؤشرات الحيوية الالتهابية.',
    categoryEn: 'Pulmonology',
    categoryKu: 'پسپۆڕی سییەکان',
    categoryAr: 'أمراض الجهاز التنفسي',
    complexityScore: 5,
    focusPointEn: 'Advanced articulation of "bilateral pulmonary infiltrates"',
    focusPointKu: 'دەربڕینی باڵای زاراوە قورسەکانی سییەکان',
    focusPointAr: 'مخارج دقيقة للمفردات التشريحية المتقدمة',
  },
  {
    id: 'rec-c1-2',
    cefr: 'C1',
    tier: 'advanced',
    textEn: 'Continuous hemodynamic monitoring remains paramount following invasive thoracic surgical intervention.',
    textKu: 'چاودێریکردنی بەردەوامی سووڕی خوێن زۆر گرنگە لەدوای نەشتەرگەریی بۆرییەکانی سنگ.',
    textAr: 'المراقبة الدقيقة للديناميكا الدموية تظل أمراً بالغ الأهمية بعد الجراحة الصدرية.',
    categoryEn: 'Thoracic Surgery',
    categoryKu: 'نەشتەرگەری سنگ',
    categoryAr: 'جراحة الصدر',
    complexityScore: 5,
    focusPointEn: 'Sustained rhythm across complex academic syntactic clauses',
    focusPointKu: 'ڕاگرتنی هاوسەنگی و هەناسە لە ڕستەی درێژی ئەکادیمیدا',
    focusPointAr: 'التحكم في التنفس عبر التراكيب المعقدة',
  },
  {
    id: 'rec-c2-1',
    cefr: 'C2',
    tier: 'advanced',
    textEn: 'Histopathological examination revealed no indicators of malignant cellular atypia within the biopsied specimen.',
    textKu: 'پشکنینی شانەزانی هیچ نیشانەیەکی نائاسایی خانەی شێرپەنجەیی لە نموونەکەدا دەرنەخست.',
    textAr: 'الفحص النسيجي المرضي لم يظهر أي دلائل على شذوذ خلوي خبيث في العينة.',
    categoryEn: 'Oncology & Pathology',
    categoryKu: 'شانەزانی و شێرپەنجە',
    categoryAr: 'علم الأمراض والأورام',
    complexityScore: 5,
    focusPointEn: 'High-tier phonetic cadence on "malignant cellular atypia"',
    focusPointKu: 'ئاوازی پیشەیی لە "cellular atypia" و شانەزانی',
    focusPointAr: 'إتقان مصطلحات علم الأمراض والأنسجة',
  },
  {
    id: 'rec-c2-2',
    cefr: 'C2',
    tier: 'advanced',
    textEn: 'The attending cardiologist observed idiosyncratic electrocardiographic anomalies during peak myocardial stress testing.',
    textKu: 'پزیشکی پسپۆڕی دڵ تێبینی نائاساییبوونی هێڵکاری دڵی کرد لە کاتی تاقیکردنەوەی پەستانی ماسوولکەی دڵ.',
    textAr: 'لاحظ استشاري أمراض القلب اضطرابات غير نمطية في تخطيط القلب أثناء اختبار الجهد العضلي.',
    categoryEn: 'Electrophysiology',
    categoryKu: 'کارەبایی دڵ',
    categoryAr: 'كهربائية القلب',
    complexityScore: 5,
    focusPointEn: 'Fluid enunciation of polysyllabic medical terminology',
    focusPointKu: 'ڕەوانی دەربڕینی وشە فرەبڕگە تەکنیکییەکان',
    focusPointAr: 'اللفظ الرشيق للمصطلحات المركبة الطويلة',
  },
  {
    id: 'rec-c2-3',
    cefr: 'C2',
    tier: 'advanced',
    textEn: 'Interdisciplinary pharmacotherapeutic consultation is imperative to mitigate severe contraindications.',
    textKu: 'ڕاوێژی دەرمانسازی نێوان پسپۆڕییەکان زۆر پێویستە بۆ کەمکردنەوەی دژەکارلێکی نێوان دەرمانەکان.',
    textAr: 'الاستشارة الدوائية متعددة التخصصات ضرورية لتفادي التداخلات الدوائية وموانع الاستعمال الخطيرة.',
    categoryEn: 'Therapeutics',
    categoryKu: 'چارەسەری پێشکەوتوو',
    categoryAr: 'العلاجات المتقدمة',
    complexityScore: 5,
    focusPointEn: 'Authoritative professional voice projection and stress',
    focusPointKu: 'تەئکیدی دەنگی پسپۆڕانە و دەسەڵاتدارانە',
    focusPointAr: 'نبرة احترافية رصينة ومخارج قوية',
  },
];

interface DailyChallengeTabProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  voiceSpeed?: number;
  selectedVoice?: string;
  currentCefr?: string;
  autoAdjustDifficulty?: boolean;
  onToggleAutoAdjustDifficulty?: () => void;
  onOpenAssessmentWithPrompt?: (promptText: string) => void;
  onToggleBookmark?: (item: SavedBookmark) => void;
  bookmarks?: SavedBookmark[];
}

export const DailyChallengeTab: React.FC<DailyChallengeTabProps> = ({
  uiLang,
  targetLang,
  voiceSpeed = 1.0,
  selectedVoice = 'Kore',
  currentCefr = 'B1',
  autoAdjustDifficulty = true,
  onToggleAutoAdjustDifficulty,
  onOpenAssessmentWithPrompt,
  onToggleBookmark,
  bookmarks = [],
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [streakDays, setStreakDays] = useState(3);
  const [missions, setMissions] = useState(DAILY_MISSIONS);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(10);
  const [dailyCompletedCount, setDailyCompletedCount] = useState(4);

  // Manual tier selection when autoAdjustDifficulty is turned off
  const [manualTier, setManualTier] = useState<'foundation' | 'intermediate' | 'advanced'>('intermediate');

  // Determine active tier based on autoAdjustDifficulty and user's CEFR level
  const effectiveTier: 'foundation' | 'intermediate' | 'advanced' = autoAdjustDifficulty
    ? ['C1', 'C2'].includes(currentCefr)
      ? 'advanced'
      : ['A1', 'A2'].includes(currentCefr)
      ? 'foundation'
      : 'intermediate'
    : manualTier;

  // Active Recommended Phrases matching effectiveTier
  const activeRecommendedPhrases = RECOMMENDED_CHALLENGE_PHRASES.filter(
    (p) => p.tier === effectiveTier
  );

  // Dynamic sprint phrases based on active tier
  const sprintPhrases = activeRecommendedPhrases.map((p) => ({
    text: p.textEn,
    ku: p.textKu,
    ar: p.textAr,
  }));

  // 60-second speed sprint state
  const [sprintIndex, setSprintIndex] = useState(0);
  const [sprintTimeLeft, setSprintTimeLeft] = useState(60);
  const [isSprintRunning, setIsSprintRunning] = useState(false);
  const [sprintCompleted, setSprintCompleted] = useState(false);

  useEffect(() => {
    // Reset sprint index if phrases change
    setSprintIndex(0);
  }, [effectiveTier]);

  useEffect(() => {
    let timer: any = null;
    if (isSprintRunning && sprintTimeLeft > 0) {
      timer = setInterval(() => {
        setSprintTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSprintRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSprintRunning, sprintTimeLeft]);

  const handleStartSprint = () => {
    setSprintIndex(0);
    setSprintTimeLeft(60);
    setIsSprintRunning(true);
    setSprintCompleted(false);
  };

  const handleNextSprintPhrase = () => {
    if (sprintIndex + 1 < sprintPhrases.length) {
      setSprintIndex((prev) => prev + 1);
    } else {
      setIsSprintRunning(false);
      setSprintCompleted(true);
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  const handleToggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const next = !m.completed;
          if (next) {
            confetti({ particleCount: 50, spread: 50 });
            setDailyCompletedCount((c) => c + 1);
          } else {
            setDailyCompletedCount((c) => Math.max(0, c - 1));
          }
          return { ...m, completed: next };
        }
        return m;
      })
    );
  };

  const getTierLabel = (tier: 'foundation' | 'intermediate' | 'advanced') => {
    if (tier === 'advanced') {
      return {
        en: 'Advanced (C1 / C2)',
        ku: 'ئاستی باڵا و پسپۆڕی (C1 / C2)',
        ar: 'متقدم وتخصصي (C1 / C2)',
        badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      };
    }
    if (tier === 'foundation') {
      return {
        en: 'Foundational (A1 / A2)',
        ku: 'بنەڕەتی و دەستپێکەر (A1 / A2)',
        ar: 'أساسي ومبتدئ (A1 / A2)',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    }
    return {
      en: 'Intermediate (B1 / B2)',
      ku: 'ئاستی ناوەند (B1 / B2)',
      ar: 'متوسط ومستقل (B1 / B2)',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };
  };

  const currentTierInfo = getTierLabel(effectiveTier);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Streak & Mission Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/20 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-500/25">
              <Flame className="w-9 h-9 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">{streakDays}</span>
                <span className="text-sm font-bold text-amber-400">
                  {isAr ? 'أيام متتالية من التدريب!' : isKu ? 'ڕۆژ لەسەریەک بەردەوامی!' : 'Day Speaking Streak!'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'واصل التدريب الصوتي اليومي لتطوير طلاقة النطق والمحافظة على حماستك المشتعلة.'
                  : isKu
                  ? 'بەردەوام بە لەسەر مەشقی ڕۆژانە تا ئاگرەکە خامۆش نەبێتەوە و گەشە بە دەنگت بدەیت.'
                  : 'Keep practicing daily to build vocal confidence and prevent your flame from fading.'}
              </p>
            </div>
          </div>

          {/* 7-Day Visual Progress Dots */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-2">
            {[
              { day: isAr ? 'السبت' : isKu ? 'شەممە' : 'Sat', active: true },
              { day: isAr ? 'الأحد' : isKu ? 'یەکشەم' : 'Sun', active: true },
              { day: isAr ? 'الاثنين' : isKu ? 'دووشەم' : 'Mon', active: true },
              { day: isAr ? 'الثلاثاء' : isKu ? 'سێشەم' : 'Tue', active: false },
              { day: isAr ? 'الأربعاء' : isKu ? 'چوارشەم' : 'Wed', active: false },
              { day: isAr ? 'الخميس' : isKu ? 'پێنجشەم' : 'Thu', active: false },
              { day: isAr ? 'الجمعة' : isKu ? 'هەینی' : 'Fri', active: false },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                    item.active
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {item.active ? '✓' : i + 1}
                </div>
                <span className="text-[9px] text-slate-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Goal Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">
                {isAr ? 'الهدف اليومي: ' : isKu ? 'ئامانجی ڕۆژانە: ' : 'Daily Target: '}
                <span className="text-emerald-400">{dailyCompletedCount} / {dailyGoalTarget}</span>{' '}
                {isAr ? 'محاولات مكتملة' : isKu ? 'هەوڵ تەواوکراوە' : 'attempts done'}
              </div>
              <div className="text-[10px] text-slate-400">
                {Math.round((dailyCompletedCount / dailyGoalTarget) * 100)}% {isAr ? 'مكتمل' : isKu ? 'تەواوکراوە' : 'completed'}
              </div>
            </div>
          </div>
          <div className="w-full sm:w-64 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (dailyCompletedCount / dailyGoalTarget) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Auto-Adjust Difficulty Status Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">
                {isAr ? 'الضبط التلقائي للصعوبة' : isKu ? 'تەعدیلکردنی خۆکارانەی ئاستی دژواری' : 'Auto-Adjust Difficulty'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  autoAdjustDifficulty
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {autoAdjustDifficulty
                  ? isAr
                    ? 'مفعل تلقائياً ✓'
                    : isKu
                    ? 'چالاکە ✓'
                    : 'Active ✓'
                  : isAr
                  ? 'معطل (يدوي)'
                  : isKu
                  ? 'ناچالاکە (دەستی)'
                  : 'Disabled'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentTierInfo.badge}`}>
                {isAr ? currentTierInfo.ar : isKu ? currentTierInfo.ku : currentTierInfo.en}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {autoAdjustDifficulty
                ? isAr
                  ? `تمت معايرة صعوبة العبارات تلقائياً بناءً على تقييمك الأخير (${currentCefr}). تزداد الصعوبة طردياً مع ارتقاء مستواك.`
                  : isKu
                  ? `ئاستی ڕستەکان بە شێوەیەکی خۆکار بەپێی ئاستی CEFRـت (${currentCefr}) دیاریکراوە و لەگەڵ پێشکەوتنت ئاڵۆزتر دەبێت.`
                  : `Phrase complexity automatically scales with your current CEFR level (${currentCefr}) to keep you continually challenged.`
                : isAr
                ? 'الضبط التلقائي متوقف حالياً. يمكنك تفعيله أو التبديل يدوياً بين المستويات أدناه.'
                : isKu
                ? 'تەعدیلکردنی خۆکار ناچالاکە. دەتوانیت لە خوارەوە ئاستەکان بە دەستی هەڵبژێریت.'
                : 'Auto-adjust is off. Phrases remain at the selected tier below.'}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          {!autoAdjustDifficulty && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['foundation', 'intermediate', 'advanced'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setManualTier(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    manualTier === t
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'foundation' ? 'A1/A2' : t === 'intermediate' ? 'B1/B2' : 'C1/C2'}
                </button>
              ))}
            </div>
          )}

          {onToggleAutoAdjustDifficulty && (
            <button
              onClick={onToggleAutoAdjustDifficulty}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                autoAdjustDifficulty
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
              title="Toggle Auto-Adjust Difficulty in Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                {autoAdjustDifficulty
                  ? isAr
                    ? 'إيقاف الضبط'
                    : isKu
                    ? 'ناچالاککردن'
                    : 'Disable Auto'
                  : isAr
                  ? 'تفعيل الضبط التلقائي'
                  : isKu
                  ? 'چالاککردنی خۆکار'
                  : 'Enable Auto'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Recommended Phrases for Current CEFR Level Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {isAr
                    ? 'العبارات الموصى بها للتحدي اليومي'
                    : isKu
                    ? 'ڕستە پێشنیارکراوەکانی بەرەنگاربوونەوە'
                    : 'Recommended Daily Challenge Phrases'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${currentTierInfo.badge}`}>
                  {isAr ? currentTierInfo.ar : isKu ? currentTierInfo.ku : currentTierInfo.en}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'تم اختيار هذه العبارات بعناية لتناسب مستوى طلاقتك وتدفعك نحو المستوى التالي.'
                  : isKu
                  ? 'ئەم ڕستانە بەپێی ئاستی ئێستات هەڵبژێردراون تا ڕەوانی و دەربڕینت زیاتر پەرەپێبدەن.'
                  : 'Tailored sentences specifically calibrated to your proficiency level for targeted practice.'}
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            <span>{activeRecommendedPhrases.length} {isAr ? 'عبارات نشطة' : isKu ? 'ڕستەی چالاک' : 'active phrases'}</span>
          </div>
        </div>

        {/* Phrases List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeRecommendedPhrases.map((phrase) => {
            const isBookmarked = bookmarks.some(
              (b) =>
                b.text.trim().toLowerCase() === phrase.textEn.trim().toLowerCase() ||
                b.id === phrase.id
            );

            const textToSpeak =
              targetLang === 'ku'
                ? phrase.textKu
                : targetLang === 'ar'
                ? phrase.textAr
                : phrase.textEn;

            const translationDisplay =
              targetLang === 'en'
                ? isAr
                  ? phrase.textAr
                  : phrase.textKu
                : targetLang === 'ku'
                ? isAr
                  ? phrase.textAr
                  : phrase.textEn
                : isKu
                ? phrase.textKu
                : phrase.textEn;

            return (
              <div
                key={phrase.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-amber-400">
                        CEFR {phrase.cefr}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-400 text-[10px]">
                        {isAr ? phrase.categoryAr : isKu ? phrase.categoryKu : phrase.categoryEn}
                      </span>
                    </div>

                    {/* Complexity dots */}
                    <div className="flex items-center gap-1" title={`Complexity: ${phrase.complexityScore}/5`}>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-1.5 h-1.5 rounded-full ${
                            lvl <= phrase.complexityScore
                              ? phrase.complexityScore >= 5
                                ? 'bg-purple-400'
                                : phrase.complexityScore >= 3
                                ? 'bg-cyan-400'
                                : 'bg-emerald-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Main Target Sentence with strict LTR isolation */}
                  <h4
                    dir={targetLang === 'en' ? 'ltr' : 'rtl'}
                    style={{ direction: targetLang === 'en' ? 'ltr' : 'rtl', textAlign: targetLang === 'en' ? 'left' : 'right' }}
                    className={`text-sm font-bold text-white leading-relaxed mb-1.5 group-hover:text-emerald-300 transition-colors ${
                      targetLang === 'en' ? 'force-ltr text-left' : 'force-rtl text-right'
                    }`}
                  >
                    "{textToSpeak}"
                  </h4>

                  {/* Translation strictly RTL */}
                  <p
                    dir="rtl"
                    style={{ direction: 'rtl', textAlign: 'right' }}
                    className="text-xs text-slate-400 leading-relaxed force-rtl text-right pt-0.5"
                  >
                    {translationDisplay}
                  </p>

                  {/* Focus Tip */}
                  <div className="mt-3 pt-2 border-t border-slate-900 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-400">
                      {isAr ? 'نقطة التركيز:' : isKu ? 'خاڵی سەرنج:' : 'Focus:'}
                    </span>
                    <span>
                      {isAr
                        ? phrase.focusPointAr
                        : isKu
                        ? phrase.focusPointKu
                        : phrase.focusPointEn}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Audio Listen */}
                    <button
                      onClick={() =>
                        playWordOrSentence(textToSpeak, targetLang, voiceSpeed, selectedVoice)
                      }
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                      title={isAr ? 'استمع للعبارة' : isKu ? 'گوێگرتن لە ڕستەکە' : 'Listen'}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Bookmark Toggle */}
                    {onToggleBookmark && (
                      <button
                        onClick={() =>
                          onToggleBookmark({
                            id: phrase.id,
                            text: textToSpeak,
                            translation: translationDisplay,
                            language: targetLang,
                            category: phrase.categoryEn,
                            timestamp: Date.now(),
                          })
                        }
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                        }`}
                        title={
                          isBookmarked
                            ? isAr
                              ? 'محفوظة في الإشارات'
                              : isKu
                              ? 'لە دڵخوازەکاندایە'
                              : 'Bookmarked'
                            : isAr
                            ? 'حفظ في الإشارات'
                            : isKu
                            ? 'زیادکردن بۆ دڵخوازەکان'
                            : 'Bookmark'
                        }
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Practice with Voice */}
                  {onOpenAssessmentWithPrompt && (
                    <button
                      onClick={() => onOpenAssessmentWithPrompt(textToSpeak)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Mic className="w-3 h-3 text-emerald-400" />
                      <span>
                        {isAr ? 'تدريب صوتي' : isKu ? 'مەشقی دەنگ' : 'Voice Practice'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Word of the Day + 60s Sprint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Word of the Day */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'كلمة اليوم الصوتية' : isKu ? 'وشەی دەنگیی ئەمڕۆ' : 'Vocal Word of the Day'}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-indigo-500/20">
                CEFR {WORD_OF_THE_DAY.cefr}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 my-2">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {WORD_OF_THE_DAY.word}
                </h3>
                <div className="font-mono text-xs sm:text-sm text-indigo-400 mt-1">
                  {WORD_OF_THE_DAY.phonetic}
                </div>
              </div>
              <button
                onClick={() => playWordOrSentence(WORD_OF_THE_DAY.word, 'en', 0.85, selectedVoice)}
                className="w-12 h-12 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                title="Listen to Word"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 mb-0.5">
                  {isAr ? 'المعنى بالعربية:' : isKu ? 'واتا بە کوردی:' : 'Meaning:'}
                </div>
                <div className="font-bold text-slate-100">
                  {isAr ? (WORD_OF_THE_DAY as any).wordAr || WORD_OF_THE_DAY.wordKu : isKu ? WORD_OF_THE_DAY.wordKu : WORD_OF_THE_DAY.definitionEn}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 mb-0.5">
                  {isAr ? 'مثال في جملة:' : isKu ? 'نموونە لە ڕستەدا:' : 'Sample in Sentence:'}
                </div>
                <div className="italic text-slate-200">"{WORD_OF_THE_DAY.exampleEn}"</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {isAr ? 'تقدمت فترة نقاهتها في المركز الطبي الإقليمي بسلاسة دون مضاعفات.' : WORD_OF_THE_DAY.exampleKu}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">{WORD_OF_THE_DAY.partOfSpeech}</span>
            <button
              onClick={() => playWordOrSentence(WORD_OF_THE_DAY.exampleEn, 'en', 0.9, selectedVoice)}
              className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'الاستماع للجملة كاملة' : isKu ? 'گوێگرتن لە تەواوی ڕستەکە' : 'Listen to Full Sentence'}</span>
            </button>
          </div>
        </div>

        {/* 60-Second Speed Speaking Sprint (Adapted to current tier) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحدي السرعة 60 ثانية' : isKu ? 'بەرەنگاربوونەوەی خێرایی ٦٠ چرکە' : '60-Sec Speed Speaking Sprint'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${currentTierInfo.badge}`}>
                  {effectiveTier === 'foundation' ? 'A1/A2' : effectiveTier === 'intermediate' ? 'B1/B2' : 'C1/C2'}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-orange-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{sprintTimeLeft}s</span>
                </div>
              </div>
            </div>

            {!isSprintRunning && !sprintCompleted && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 mx-auto flex items-center justify-center mb-3">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {isAr ? 'انطق 5 عبارات متكيفة خلال 60 ثانية' : isKu ? '٥ ڕستەی خێرای خۆگونجێنەر لە ٦٠ چرکەدا' : 'Speak 5 Adapted Phrases in 60s'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {isAr
                    ? 'اختبر سرعة طلاقتك واستجابتك في التحدث الصوتي تحت عامل الوقت الخفيف وفق مستوى CEFR الخاص بك.'
                    : isKu
                    ? 'توانای خۆت تاقی بکەرەوە لە قسەکردنی خێرا و ڕەوان بەپێی ئاستی دژواری تایبەت بە خۆت.'
                    : 'Test your spontaneous articulatory speed with phrases tailored to your CEFR level.'}
                </p>
                <button
                  onClick={handleStartSprint}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  {isAr ? 'بدء تحدي 60 ثانية' : isKu ? 'دەستپێکردنی بەرەنگاربوونەوە' : 'Start 60s Sprint'}
                </button>
              </div>
            )}

            {isSprintRunning && sprintPhrases.length > 0 && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>
                    {isAr ? 'العبارة ' : isKu ? 'ڕستەی ' : 'Phrase '} {sprintIndex + 1} / {sprintPhrases.length}
                  </span>
                  <span className="text-orange-400 font-bold">{sprintTimeLeft} {isAr ? 'ثانية متبقية' : isKu ? 'چرکە ماوە' : 'seconds left'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[90px] flex flex-col justify-center">
                  <div className="text-base font-bold text-white leading-relaxed">
                    "{targetLang === 'ku' ? sprintPhrases[sprintIndex].ku : targetLang === 'ar' ? sprintPhrases[sprintIndex].ar : sprintPhrases[sprintIndex].text}"
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    {targetLang === 'en'
                      ? (isAr ? sprintPhrases[sprintIndex].ar : sprintPhrases[sprintIndex].ku)
                      : targetLang === 'ku'
                      ? (isAr ? sprintPhrases[sprintIndex].ar : sprintPhrases[sprintIndex].text)
                      : (isKu ? sprintPhrases[sprintIndex].ku : sprintPhrases[sprintIndex].text)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const textToSpeak = targetLang === 'ku' ? sprintPhrases[sprintIndex].ku : targetLang === 'ar' ? sprintPhrases[sprintIndex].ar : sprintPhrases[sprintIndex].text;
                      playWordOrSentence(textToSpeak, targetLang, 1.0, selectedVoice);
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Play Audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextSprintPhrase}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    {sprintIndex + 1 === sprintPhrases.length
                      ? isAr ? 'إنهاء التحدي ✓' : isKu ? 'تەواوکردنی بەرەنگاربوونەوە ✓' : 'Finish Sprint ✓'
                      : isAr ? 'تم النطق، العبارة التالية ➔' : isKu ? 'وترا، ڕستەی دواتر ➔' : 'Spoken, Next Phrase ➔'}
                  </button>
                </div>
              </div>
            )}

            {sprintCompleted && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                  <Award className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-emerald-400">
                  {isKu ? 'پیرۆزە! بە سەرکەوتوویی تەواوت کرد' : 'Sprint Completed Successfully!'}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {isKu ? 'خێرایی و ڕەوانبێژیت لە ئاستێکی زۆر باشدایە.' : 'Outstanding articulatory stamina.'}
                </p>
                <button
                  onClick={handleStartSprint}
                  className="mt-4 px-5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-900 cursor-pointer"
                >
                  {isKu ? 'دووبارەکردنەوە' : 'Try Again'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{isKu ? 'ئەم ڕاهێنانە پەیامی دەمار و ماسوولکەکانی زمان خێرا دەکات' : 'Trains reflex articulation mechanics'}</span>
          </div>
        </div>
      </div>

      {/* Daily Missions Checklist */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'المهام الصوتية اليومية' : isKu ? 'ئەرکە دەنگییەکانی ئەمڕۆ' : "Today's Speaking Missions"}
              </h3>
              <p className="text-xs text-slate-400">
                {isKu ? 'هەر ئەرکێک تەواو بکەیت ئاستی نمرەی گشتیت بەرزتر دەبێتەوە' : 'Complete daily vocal tasks to build proficiency'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {missions.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                m.completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {m.category}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    Target: {m.targetScore}%
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1.5">
                  {isAr ? m.titleAr || m.titleEn : isKu ? m.titleKu : m.titleEn}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr ? m.promptAr || m.promptEn : isKu ? m.promptKu : m.promptEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between">
                <button
                  onClick={() => handleToggleMission(m.id)}
                  className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    m.completed
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{m.completed ? (isAr ? 'مكتمل ✓' : isKu ? 'تەواوکرا ✓' : 'Completed') : (isAr ? 'تحديد كمكتمل' : isKu ? 'تەواوم کرد' : 'Mark Done')}</span>
                </button>

                {onOpenAssessmentWithPrompt && (
                  <button
                    onClick={() => onOpenAssessmentWithPrompt(m.promptEn)}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    {isAr ? 'اختبار صوتي' : isKu ? 'تێست بە دەنگ' : 'Voice Test'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

