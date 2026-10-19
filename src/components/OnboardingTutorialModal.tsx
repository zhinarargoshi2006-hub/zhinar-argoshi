import React, { useState, useEffect } from 'react';
import { UILanguage } from '../types';
import {
  X,
  Mic,
  Volume2,
  Map as MapIcon,
  MessageSquare,
  Languages,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Compass,
  ArrowRight,
  Star,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  onNavigateToTab?: (tab: string) => void;
  onOpenDetailedTips?: () => void;
}

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  onNavigateToTab,
  onOpenDetailedTips,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [currentStep, setCurrentStep] = useState(0);

  // Reset to first step whenever opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    // Step 1: Welcome & CEFR Overview
    {
      id: 'welcome',
      icon: Sparkles,
      iconColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      titleKu: 'بەخێربێیت بۆ ئەکادیمیای دەنگ (KD Voice)',
      titleAr: 'مرحباً بك في أكاديمية الصوت والنطق',
      titleEn: 'Welcome to KD Voice Language Lab',
      subtitleKu: 'سیستەمی پێشکەوتووی پشکنین و فێربوونی قسەکردن بە پێوەری نێودەوڵەتی CEFR',
      subtitleAr: 'المنصة الذكية لاختبار مستوى التحدث وإتقان الطلاقة وفق المعايير الدولية',
      subtitleEn: 'Advanced AI voice assessment & speaking mastery guided by international CEFR standards',
      contentKu:
        'ئەم پڕۆژەیە تایبەتە بە پشکنینی بێژەکردن، ڕەوانی دەنگ، و گەیشتن بە لوتکەی قسەکردن لە ١,٠٠٠ قۆناغی هەنگاو بە هەنگاودا. دەتوانیت دەنگت تۆمار بکەیت و هەڵسەنگاندنی ڕاستەوخۆ بە ژیریی دەستکرد وەربگریت.',
      contentAr:
        'تم تصميم هذا التطبيق لتقييم مخارج الحروف، طلاقة النطق، والارتقاء بمهارات التحدث عبر 1,000 مرحلة تدريجية. سجل صوتك واحصل على تقييم فوري مدعوم بالذكاء الاصطناعي.',
      contentEn:
        'Engineered for comprehensive pronunciation evaluation, cadence scoring, and spoken fluency across 1,000 progressive stages. Record your voice for instant AI CEFR feedback.',
      actionTab: 'assessment',
      actionLabelKu: 'تاقیکردنەوەی دەستبەجێ',
      actionLabelAr: 'جرب الآن',
      actionLabelEn: 'Try Speaking Test',
      previewType: 'welcome',
    },

    // Step 2: How to Use Microphone & Get Evaluated
    {
      id: 'mic_evaluation',
      icon: Mic,
      iconColor: 'text-cyan-400',
      badgeColor: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      titleKu: 'چۆنیەتی تۆمارکردنی دەنگ و وەرگرتنی نمرە',
      titleAr: 'كيفية تسجيل صوتك والحصول على التقييم',
      titleEn: 'How to Record Voice & Receive Evaluation',
      subtitleKu: 'بە کەمتر لە چەند چرکەیەک نمرەی دروستی بێژەکردن و ڕێزمانیت پێدەدرێت',
      subtitleAr: 'في ثوانٍ معدودة، ستحصل على تحليل مفصل لمخارج الكلمات والقواعد',
      subtitleEn: 'In seconds, receive an acoustic breakdown of accuracy, rhythm, and grammar',
      contentKu:
        '١. دوگمەی سەوز یان مایکرۆفۆنەکە دابگرە تا شین یان سوور دەبێتەوە.\n٢. بە شێوازێکی سروشتی و ڕوون ڕستەکە یان پرسیارەکە بە دەنگ بخوێنەوە.\n٣. سیستەمەکە وشە بە وشە ڕەنگ دەکات (سەوز: بێ کێشە، زەرد: شیاوی باشترکردن، سوور: نادروست) لەگەڵ ئەگەری دووبارە گوێگرتنەوە لە دەنگی خۆت (Play My Voice).',
      contentAr:
        '1. اضغط على زر الميكروفون المضيء للبدء بالتسجيل.\n2. انطق الجملة المطلوبة بنبرة طبيعية وواضحة.\n3. سيقوم الذكاء الاصطناعي بتمييز الكلمات بالألوان (أخضر: سليم، أصفر: مقبول، أحمر: بحاجة لتحسين)، مع إمكانية الاستماع لصوتك المسجل.',
      contentEn:
        '1. Tap the glowing microphone button to start recording.\n2. Speak the prompt aloud with natural tempo and clear pronunciation.\n3. The AI generates color-coded phonetics (Green: native accuracy, Yellow: acceptable, Red: needs drill), plus a "Play My Voice" button to replay your own speech.',
      actionTab: 'assessment',
      actionLabelKu: 'بڕۆ بۆ ستۆدیۆی دەنگ',
      actionLabelAr: 'الانتقال لاختبار النطق',
      actionLabelEn: 'Go to Voice Studio',
      previewType: 'mic',
    },

    // Step 3: Navigating Levels & Stages Map
    {
      id: 'stages_map',
      icon: MapIcon,
      iconColor: 'text-amber-400',
      badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      titleKu: 'نەخشەی ڕێڕەوی ١,٠٠٠ قۆناغ و جیهانەکان',
      titleAr: 'خريطة المراحل الـ 1,000 والعوالم التفاعلية',
      titleEn: '1,000 Progressive Stages & Interactive Map',
      subtitleKu: 'دەربازبوون بەناو ١٠ جیهانی سەرەکی لە A1 تا C2',
      subtitleAr: 'رحلة تفاعلية عبر 10 عوالم متدرجة من A1 حتى إتقان C2',
      subtitleEn: 'Journey across 10 progressive worlds from foundational A1 to mastery C2',
      contentKu:
        'بە کلیک لەسەر تابی "نەخشەی قۆناغەکان"، ڕێگایەکی پێچاوپێچی مۆدێرن بە شێوازی مۆبایل دەبینیت. هەر قۆناغێک تەواو بکەیت بە نمرەی سەروو ٦٠٪، قۆناغی داهاتوو قوفڵەکەی دەکرێتەوە و دراوی زێڕین (🪙) و ئەستێرەی نمرە بەدەست دەهێنیت. دەتوانیت لە نێوان جیهانەکاندا هاتوچۆ بکەیت.',
      contentAr:
        'عند اختيار "خريطة المراحل"، ستشاهد مساراً متعرجاً يشبه أحدث تطبيقات الهواتف. عند اجتياز أي مرحلة بدرجة 60% فما فوق، تفتح المرحلة التالية وتكسب عملات ذهبية (🪙) ونجوماً. يمكنك التنقل بحرية بين العوالم العشرة.',
      contentEn:
        'Tap the "Stages Map" tab to experience a mobile-first winding pathway. Achieving 60%+ unlocks the next consecutive stage, rewarding gold coins (🪙) and achievement stars. Navigate freely across all 10 specialized worlds.',
      actionTab: 'roadmap',
      actionLabelKu: 'بینینی نەخشەی قۆناغەکان',
      actionLabelAr: 'فتح خريطة المراحل',
      actionLabelEn: 'Open Stages Map',
      previewType: 'map',
    },

    // Step 4: AI Voice Coach & Conversation
    {
      id: 'ai_conversation',
      icon: MessageSquare,
      iconColor: 'text-teal-400',
      badgeColor: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
      titleKu: 'هاوڕێی دەنگیی زیرەک (AI Conversation)',
      titleAr: 'المحادثة الصوتية التفاعلية مع المدرب الذكي',
      titleEn: 'AI Voice Coach & Real Spoken Dialogue',
      subtitleKu: 'مەشقی گفتوگۆی ڕاستەوخۆ لە دەیان سیناریۆی ڕۆژانە و پیشەییدا',
      subtitleAr: 'حوار صوتي واقعي في مختلف السيناريوهات الحياتية والمهنية',
      subtitleEn: 'Practice open-ended spoken dialogues across real-world professional scenarios',
      contentKu:
        'لە بەشی "هاوڕێی دەنگی"، دەتوانیت وەک کەسێکی ڕاستەقینە قسە لەگەڵ ژیریی دەستکرد بکەیت. ئەو بە دەنگ وەڵامت دەداتەوە بە دەنگی ڕەسەن، هەڵەکانت ڕاست دەکاتەوە، و پێشنیاری ڕستەی باشترت بۆ دەکات. دەتوانیت خێرایی و جۆری دەنگەکەش بگۆڕیت.',
      contentAr:
        'في قسم "المحادثة"، يمكنك خوض حوارات صوتية حية مع مدرب الذكاء الاصطناعي. يجيبك بنبرة صوت طبيعية، يصحح صياغتك اللغوية، ويقترح عليك ردوداً بديلة ذكية مع إمكانية ضبط سرعة الكلام.',
      contentEn:
        'In the "AI Voice Conversation" tab, engage in real-time vocal dialogue. The tutor speaks back with expressive native voices (Kore, Aoede, Fenrir), corrects slips politely, and offers smart replies.',
      actionTab: 'conversation',
      actionLabelKu: 'دەستپێکردنی گفتوگۆ',
      actionLabelAr: 'بدء المحادثة',
      actionLabelEn: 'Start Voice Chat',
      previewType: 'conversation',
    },

    // Step 5: High-Precision Multilingual Translator
    {
      id: 'translator',
      icon: Languages,
      iconColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      titleKu: 'وەرگێڕی خێرا و فەرهەنگی دەنگی',
      titleAr: 'المترجم الصوتي فائق الدقة والقواميس',
      titleEn: 'High-Precision Multilingual Voice Translator',
      subtitleKu: 'وەرگێڕانی بێ هەڵە لە نێوان کوردی، ئینگلیزی، و عەرەبی',
      subtitleAr: 'ترجمة فورية ونطق سليم بين الكوردية، الإنجليزية، والعربية',
      subtitleEn: 'Instant two-way acoustic translation between Central Kurdish, Arabic & English',
      contentKu:
        'دوگمەی "وەرگێڕ" لە بەشی سەرەوە هەمیشە لە بەردەستتە. دەتوانیت هەر ڕستەیەک یان دەنگێک بدەیتێ، بە وردیی تەواو وەریدەگێڕێت، شیکاری پیت و دەنگەکانی دەکات، و بە شێوازی دەنگی ڕەسەن بۆت دەخوێنێتەوە.',
      contentAr:
        'زر "المترجم" متاح دائماً في أعلى الشاشة. يمكنك إدخال أي عبارة نصاً أو صوتاً للحصول على ترجمة فورية دقيقة مع تفكيك الكلمات والاستماع للنطق البشري الصحيح.',
      contentEn:
        'The "Translator" button is always accessible. Translate phrases via voice or text with lexical breakdown, phonetic transcription, and instant natural speech pronunciation.',
      actionTab: 'library',
      actionLabelKu: 'تاقیکردنەوەی وەرگێڕ',
      actionLabelAr: 'فتح المترجم',
      actionLabelEn: 'Try Translator',
      previewType: 'translator',
    },

    // Step 6: Daily Streak, Phrases Bank & CEFR Certificate
    {
      id: 'streak_certificate',
      icon: Flame,
      iconColor: 'text-amber-400',
      badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      titleKu: 'ئاگری ڕۆژانە، بانکی دەنگ، و بڕوانامەی CEFR',
      titleAr: 'سلسلة التدريب اليومي، بنك العبارات والشهادة',
      titleEn: 'Daily Streak, Phrasebook & Official Certificate',
      subtitleKu: 'هاندان و پێشکەوتنی بەردەوام تا بەدەستهێنانی بڕوانامە',
      subtitleAr: 'حماس مستمر وشهادة كفاءة معتمدة فور إتمامك للمستويات',
      subtitleEn: 'Keep your streak alive, save audio bookmarks, and earn certified diploma credentials',
      contentKu:
        '• ئاگری ڕۆژانە (🔥): هەموو ڕۆژێک دەنگت تۆمار بکە بۆ هێشتنەوەی زنجیرەی فێربوونەکەت.\n• بانکی دەنگی (Bookmarks): دەتوانیت ڕستە قورسەکان خەزن بکەیت بۆ دووبارە گوێگرتن.\n• بڕوانامەی فەرمی (Certificate): دوای ئەنجامدانی تاقیکردنەوەکان، بڕوانامەی شایستەیی بە شێوازی فەرمی لەگەڵ نمرەی باڵا وەربگرە!',
      contentAr:
        '• سلسلة التدريب (🔥): تدرب يومياً للحفاظ على شعلة الإنجاز النشطة.\n• بنك العبارات (Bookmarks): احفظ أي جملة صعبة للاستماع إليها لاحقاً.\n• شهادة CEFR: احصل على شهادة كفاءة دولية موثقة بدرجتك ومستواك الصوتي فور تقدمك!',
      contentEn:
        '• Daily Streak (🔥): Practice daily to build continuous spoken fluency habits.\n• Phrasebook Library: Bookmark challenging sentences for one-tap audio drills.\n• CEFR Certificate: Receive an official personalized credential showcasing your verified proficiency score!',
      actionTab: 'daily',
      actionLabelKu: 'تەواوکردن و دەستپێکردن',
      actionLabelAr: 'إتمام وبدء التعلم',
      actionLabelEn: 'Complete & Start Learning',
      previewType: 'streak',
    },
  ];

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('kd_voice_onboarding_completed_v1', 'true');
    } catch (e) {}
    onClose();
  };

  const handleGoToFeature = (tabKey: string) => {
    handleComplete();
    if (onNavigateToTab) {
      onNavigateToTab(tabKey);
    }
  };

  const StepIcon = step.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none"
      style={{ direction: isKu || isAr ? 'rtl' : 'ltr' }}
    >
      {/* Background Ambience Spotlights */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Guide Modal Container */}
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shadow-inner ${step.badgeColor}`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 block">
                {isKu
                  ? `ڕێبەری بەکارهێنان • قۆناغی ${currentStep + 1} لە ${steps.length}`
                  : isAr
                  ? `دليل الاستخدام • خطوة ${currentStep + 1} من ${steps.length}`
                  : `User Guide • Step ${currentStep + 1} of ${steps.length}`}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                {isKu ? step.titleKu : isAr ? step.titleAr : step.titleEn}
              </h3>
            </div>
          </div>

          {/* Top Skip / Close Button */}
          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={handleComplete}
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer font-medium"
              >
                {isKu ? 'تێپەڕاندن (Skip)' : isAr ? 'تخطي (Skip)' : 'Skip'}
              </button>
            )}
            <button
              type="button"
              onClick={handleComplete}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer shrink-0"
              title={isKu ? 'داخستن' : isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Step Bar */}
        <div className="w-full h-1.5 bg-slate-950 border-b border-slate-800/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Interactive Step Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-300 text-xs sm:text-sm">
          {/* Subtitle Highlight */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-inner flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-emerald-300 leading-relaxed">
              {isKu ? step.subtitleKu : isAr ? step.subtitleAr : step.subtitleEn}
            </p>
          </div>

          {/* Interactive Feature Visual Preview Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 shadow-xl overflow-hidden">
            {step.previewType === 'welcome' && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    A1
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    B2
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    C2 Mastery
                  </span>
                </div>
                <div className="flex items-center gap-1.5 h-8">
                  {[10, 22, 34, 18, 30, 15, 28, 36, 20, 12].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-cyan-400 to-emerald-400 rounded-full animate-pulse"
                      style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {isKu ? '١,٠٠٠ قۆناغ لە ١٠ جیهانی سەرەکیدا' : isAr ? '1,000 مرحلة موزعة على 10 عوالم' : '1,000 progressive stages across 10 worlds'}
                </span>
              </div>
            )}

            {step.previewType === 'mic' && (
              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-pulse">
                    <Mic className="w-7 h-7" />
                  </div>
                  <div className="text-start space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isKu ? 'هەڵسەنگاندنی دەستبەجێ (CEFR 94%)' : isAr ? 'تقييم فوري بنتيجة 94%' : 'Instant Evaluation (94% Score)'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">Good</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">Morning</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">Everyone</span>
                    </div>
                  </div>
                </div>
                <div className="w-full flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>🗣️ {isKu ? 'شیکاری وشە بە وشە' : isAr ? 'تحليل كلمة بكلمة' : 'Word-by-word analysis'}</span>
                  <span>🔊 {isKu ? 'دووبارە گوێگرتنەوە' : isAr ? 'إعادة الاستماع لصوتك' : 'Play My Voice'}</span>
                </div>
              </div>
            )}

            {step.previewType === 'map' && (
              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <div className="flex items-center justify-center gap-4">
                  {/* Stage node 1 */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                      ✓
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1">#1</span>
                  </div>
                  <div className="w-6 h-0.5 bg-emerald-400/50 dashed" />
                  {/* Stage node 2 (active) */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-110 animate-pulse">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[10px] text-cyan-300 font-extrabold mt-1">{isKu ? 'قۆناغی ئێستا' : 'Active'}</span>
                  </div>
                  <div className="w-6 h-0.5 bg-slate-700 dashed" />
                  {/* Stage node 3 (locked) */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-xs flex items-center justify-center">
                      🔒
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold mt-1">#3</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-300 font-bold">
                  <span>🪙 1,000 +104</span>
                  <span>•</span>
                  <span>★ +250 XP</span>
                </div>
              </div>
            )}

            {step.previewType === 'conversation' && (
              <div className="space-y-2 py-1">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-start gap-2">
                  <span className="text-base">🤖</span>
                  <div>
                    <span className="font-bold text-cyan-300 block text-[11px]">AI Tutor:</span>
                    <span className="text-slate-200">"Welcome! What are your main goals for practicing speaking today?"</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs flex items-start gap-2 justify-end text-end">
                  <div>
                    <span className="font-bold text-emerald-400 block text-[11px]">{isKu ? 'تۆ (دەنگ):' : isAr ? 'أنت (صوتياً):' : 'You (Voice):'}</span>
                    <span className="text-slate-200">"I want to improve my clinical and daily business conversation."</span>
                  </div>
                  <span className="text-base">🎙️</span>
                </div>
              </div>
            )}

            {step.previewType === 'translator' && (
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400 font-bold">English ➔ Central Kurdish (سۆرانی)</span>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">TTS Audio ✓</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 text-left">
                  <p className="font-bold text-white">"Could you please explain the diagnostic procedure?"</p>
                  <p className="text-emerald-300 font-medium text-right" style={{ direction: 'rtl' }}>
                    "دەتوانیت تکایە شێوازی پشکنین و دەستنیشانکردنی نەخۆشییەکە ڕوون بکەیتەوە؟"
                  </p>
                </div>
              </div>
            )}

            {step.previewType === 'streak' && (
              <div className="flex items-center justify-between py-2 px-2 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl">🔥</span>
                  <span className="font-extrabold text-amber-300 text-xs mt-1">3 Days</span>
                  <span className="text-[10px] text-slate-500">{isKu ? 'ئاگری ڕۆژانە' : 'Streak'}</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl">🔖</span>
                  <span className="font-extrabold text-cyan-300 text-xs mt-1">Phrasebook</span>
                  <span className="text-[10px] text-slate-500">{isKu ? 'بانکی دەستەواژە' : 'Bookmarks'}</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl">🎓</span>
                  <span className="font-extrabold text-emerald-300 text-xs mt-1">CEFR Diploma</span>
                  <span className="text-[10px] text-slate-500">{isKu ? 'بڕوانامەی فەرمی' : 'Certified'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description Text */}
          <div className="leading-relaxed whitespace-pre-line text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            {isKu ? step.contentKu : isAr ? step.contentAr : step.contentEn}
          </div>

          {/* Feature Direct Action Link */}
          {step.actionTab && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleGoToFeature(step.actionTab)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>{isKu ? step.actionLabelKu : isAr ? step.actionLabelAr : step.actionLabelEn}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
              </button>

              <span className="text-[11px] text-slate-500">
                {isKu ? 'دەتوانیت ڕاستەوخۆ دەست پێبکەیت' : isAr ? 'يمكنك البدء فوراً' : 'Jump directly into feature'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/95 border-t border-slate-800/80 flex items-center justify-between gap-3">
          {/* Step Dots Indicators */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? 'w-6 bg-emerald-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next / Back / Skip / Complete Buttons */}
          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={handleComplete}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isKu ? 'تێپەڕاندن' : isAr ? 'تخطي' : 'Skip'}
              </button>
            )}

            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{isKu ? 'پێشوو' : isAr ? 'السابق' : 'Back'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                isLast
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-500/30 hover:scale-105 active:scale-95'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
              }`}
            >
              <span>{isLast ? (isKu ? 'دەستپێکردن ئێستا' : isAr ? 'ابدأ الآن' : 'Start Now') : isKu ? 'داهاتوو' : isAr ? 'التالي' : 'Next'}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
