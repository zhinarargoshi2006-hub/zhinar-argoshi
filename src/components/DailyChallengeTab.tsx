import React, { useState, useEffect } from 'react';
import { TargetLanguage, UILanguage } from '../types';
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
} from 'lucide-react';

interface DailyChallengeTabProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  voiceSpeed?: number;
  selectedVoice?: string;
  onOpenAssessmentWithPrompt?: (promptText: string) => void;
}

export const DailyChallengeTab: React.FC<DailyChallengeTabProps> = ({
  uiLang,
  targetLang,
  voiceSpeed = 1.0,
  selectedVoice = 'Kore',
  onOpenAssessmentWithPrompt,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [streakDays, setStreakDays] = useState(3);
  const [missions, setMissions] = useState(DAILY_MISSIONS);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(10);
  const [dailyCompletedCount, setDailyCompletedCount] = useState(4);

  // 60-second speed sprint state
  const [sprintIndex, setSprintIndex] = useState(0);
  const [sprintTimeLeft, setSprintTimeLeft] = useState(60);
  const [isSprintRunning, setIsSprintRunning] = useState(false);
  const [sprintCompleted, setSprintCompleted] = useState(false);

  const sprintPhrases = [
    { text: 'I need to check my clinical vitals immediately.', ku: 'پێویستە دەستبەجێ نیشانە سەرەکییەکانم بپشکنم.', ar: 'أحتاج لفحص علاماتي الحيوية السريرية فوراً.' },
    { text: 'The physician ordered a comprehensive metabolic blood panel.', ku: 'پزیشک داوای پشکنینی گشتی ئەنزیمەکانی کرد.', ar: 'طلب الطبيب إجراء فحص أيضي شامل للدم.' },
    { text: 'Does this medication have any noticeable adverse side effects?', ku: 'ئایا ئەم دەرمانە هیچ کاریگەرییەکی لاوەکی هەیە؟', ar: 'هل يسبب هذا الدواء أي آثار جانبية ملحوظة؟' },
    { text: 'Elevating the head of the bed helps with breathing at night.', ku: 'بەرزکردنەوەی سەرین یارمەتی هەناسەدانی شەوانە دەدات.', ar: 'رفع مستوى رأس السرير يساعد في تحسين التنفس ليلاً.' },
    { text: 'Our specialized cardiology team will review the scan tomorrow.', ku: 'تیمی پسپۆڕی دڵ بەیانی تیشکەکە دەبینن.', ar: 'سيراجع فريق أمراض القلب التخصصي صور الأشعة غداً.' },
  ];

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
          }
          return { ...m, completed: next };
        }
        return m;
      })
    );
  };

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
                  {isKu ? 'ڕۆژ لەسەریەک (Streak)!' : 'Day Speaking Streak!'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isKu
                  ? 'بەردەوام بە لەسەر مەشقی ڕۆژانە تا ئاگرەکە خامۆش نەبێتەوە و گەشە بە دەنگت بدەیت.'
                  : 'Keep practicing daily to build vocal confidence and prevent your flame from fading.'}
              </p>
            </div>
          </div>

          {/* 7-Day Visual Progress Dots */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-2">
            {[
              { day: isKu ? 'شەممە' : 'Sat', active: true },
              { day: isKu ? 'یەکشەم' : 'Sun', active: true },
              { day: isKu ? 'دووشەم' : 'Mon', active: true },
              { day: isKu ? 'سێشەم' : 'Tue', active: false },
              { day: isKu ? 'چوارشەم' : 'Wed', active: false },
              { day: isKu ? 'پێنجشەم' : 'Thu', active: false },
              { day: isKu ? 'هەینی' : 'Fri', active: false },
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
                {isKu ? 'ئامانجی ڕۆژانە: ' : 'Daily Target: '}
                <span className="text-emerald-400">{dailyCompletedCount} / {dailyGoalTarget}</span>{' '}
                {isKu ? 'هەوڵ تەواوکراوە' : 'attempts done'}
              </div>
              <div className="text-[10px] text-slate-400">
                {Math.round((dailyCompletedCount / dailyGoalTarget) * 100)}% {isKu ? 'تەواوکراوە' : 'completed'}
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

        {/* 60-Second Speed Speaking Sprint */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحدي السرعة 60 ثانية' : isKu ? 'بەرەنگاربوونەوەی خێرایی ٦٠ چرکە' : '60-Sec Speed Speaking Sprint'}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-orange-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5" />
                <span>{sprintTimeLeft}s</span>
              </div>
            </div>

            {!isSprintRunning && !sprintCompleted && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 mx-auto flex items-center justify-center mb-3">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {isKu ? '٥ ڕستەی خێرا لە کەمتر لە یەک خولەکدا' : 'Speak 5 Clinical Phrases in 60s'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {isAr
                    ? 'اختبر سرعة طلاقتك واستجابتك في التحدث الصوتي تحت عامل الوقت الخفيف.'
                    : isKu
                    ? 'توانای خۆت تاقی بکەرەوە لە قسەکردنی خێرا و ڕەوان بەبێ وەستان و لێکدابڕان.'
                    : 'Test your spontaneous articulatory speed under a gentle time constraint.'}
                </p>
                <button
                  onClick={handleStartSprint}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  {isAr ? 'بدء تحدي 60 ثانية' : isKu ? 'دەستپێکردنی بەرەنگاربوونەوە' : 'Start 60s Sprint'}
                </button>
              </div>
            )}

            {isSprintRunning && (
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
                    {targetLang === 'en' ? (isAr ? sprintPhrases[sprintIndex].ar : sprintPhrases[sprintIndex].ku) : sprintPhrases[sprintIndex].text}
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
                  className="mt-4 px-5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-900"
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
                  {isKu ? m.titleKu : m.titleEn}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isKu ? m.promptKu : m.promptEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between">
                <button
                  onClick={() => handleToggleMission(m.id)}
                  className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    m.completed
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{m.completed ? (isKu ? 'تەواوکرا ✓' : 'Completed') : (isKu ? 'تەواوم کرد' : 'Mark Done')}</span>
                </button>

                {onOpenAssessmentWithPrompt && (
                  <button
                    onClick={() => onOpenAssessmentWithPrompt(m.promptEn)}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold"
                  >
                    {isKu ? 'تێست بە دەنگ' : 'Voice Test'}
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
