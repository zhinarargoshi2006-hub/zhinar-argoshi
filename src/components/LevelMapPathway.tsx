import React, { useState, useMemo } from 'react';
import { TestStep, UILanguage, TargetLanguage } from '../types';
import { playWordOrSentence } from '../utils/audio';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
  Trophy,
  Star,
  Sparkles,
  Volume2,
  Mic,
  Compass,
  Award,
  Zap,
  Play,
  Share2,
  X,
  Layers,
  MapPin,
  Flame,
} from 'lucide-react';

interface LevelMapPathwayProps {
  testSteps: TestStep[];
  currentStepIndex: number;
  unlockedStage: number;
  completedScores: { [stageId: number]: number };
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  selectedVoice?: string;
  onSelectStage: (stageId: number) => void;
  onBackToStudio: () => void;
  coins?: number;
}

// 10 Progressive Worlds across the 1,000 stages
const WORLDS = [
  { id: 1, nameKu: 'جیهانی ١: بنەماکانی قسەکردن', nameAr: 'العالم ١: أساسيات النطق', nameEn: 'World 1: Phonetic Foundations', range: [1, 100], level: 'A1' },
  { id: 2, nameKu: 'جیهانی ٢: ژیانی ڕۆژانە و پەیوەندی', nameAr: 'العالم ٢: المحادثات اليومية', nameEn: 'World 2: Daily Life & Travel', range: [101, 200], level: 'A2' },
  { id: 3, nameKu: 'جیهانی ٣: کلینیک و نەخۆشخانە', nameAr: 'العالم ٣: الطوارئ والعيادات', nameEn: 'World 3: Clinical & Healthcare', range: [201, 300], level: 'B1' },
  { id: 4, nameKu: 'جیهانی ٤: بازرگانی و گرێبەستەکان', nameAr: 'العالم ٤: المفاوضات والشركات', nameEn: 'World 4: Business & Corporate', range: [301, 400], level: 'B1-B2' },
  { id: 5, nameKu: 'جیهانی ٥: توێژینەوە و سیمینار', nameAr: 'العالم ٥: الندوات الأكاديمية', nameEn: 'World 5: Academic & Research', range: [401, 500], level: 'B2' },
  { id: 6, nameKu: 'جیهانی ٦: هەناردە و دارایی نێودەوڵەتی', nameAr: 'العالم ٦: التجارة الدولية والتمويل', nameEn: 'World 6: Global Commerce & Finance', range: [501, 600], level: 'B2-C1' },
  { id: 7, nameKu: 'جیهانی ٧: نەشتەرگەری و دەستنیشانکردنی باڵا', nameAr: 'العالم ٧: الجراحة المتقدمة والأورام', nameEn: 'World 7: Advanced Surgical & Oncology', range: [601, 700], level: 'C1' },
  { id: 8, nameKu: 'جیهانی ٨: تێزی دکتۆرا و گەنگەشەی زانستی', nameAr: 'العالم ٨: أطروحات الدكتوراه', nameEn: 'World 8: Doctoral Defense & Science', range: [701, 800], level: 'C1' },
  { id: 9, nameKu: 'جیهانی ٩: دیپلۆماسی و سەرکردایەتی', nameAr: 'العالم ٩: الدبلوماسية والقيادة', nameEn: 'World 9: Strategic Diplomacy', range: [801, 900], level: 'C2' },
  { id: 10, nameKu: 'جیهانی ١٠: لوتکەی زمانی ڕەسەن (Mastery)', nameAr: 'العالم ١٠: الإتقان اللغوي التام', nameEn: 'World 10: Native Mastery Peak', range: [901, 1000], level: 'C2' },
];

export const LevelMapPathway: React.FC<LevelMapPathwayProps> = ({
  testSteps,
  currentStepIndex,
  unlockedStage,
  completedScores,
  uiLang,
  targetLang,
  selectedVoice = 'Kore',
  onSelectStage,
  onBackToStudio,
  coins = 1000,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  // Active selected world (1 to 10)
  const [activeWorldId, setActiveWorldId] = useState<number>(() => {
    const currentStageNumber = testSteps[currentStepIndex]?.id || unlockedStage || 1;
    const found = WORLDS.find((w) => currentStageNumber >= w.range[0] && currentStageNumber <= w.range[1]);
    return found ? found.id : 1;
  });

  const [selectedPreviewStep, setSelectedPreviewStep] = useState<TestStep | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showWorldMenu, setShowWorldMenu] = useState(false);

  const activeWorld = useMemo(() => {
    return WORLDS.find((w) => w.id === activeWorldId) || WORLDS[0];
  }, [activeWorldId]);

  // Steps belonging to this world
  const worldSteps = useMemo(() => {
    return testSteps.filter(
      (s) => s.id >= activeWorld.range[0] && s.id <= activeWorld.range[1]
    );
  }, [testSteps, activeWorld]);

  // If steps aren't populated yet, generate placeholder nodes for the map
  const displaySteps = useMemo(() => {
    if (worldSteps.length > 0) return worldSteps;
    const items: TestStep[] = [];
    for (let id = activeWorld.range[0]; id <= Math.min(activeWorld.range[1], activeWorld.range[0] + 24); id++) {
      items.push({
        id,
        level: activeWorld.level,
        title: `Stage #${id}`,
        titleKu: `قۆناغی #${id}`,
        titleAr: `المرحلة #${id}`,
        titleEn: `Stage #${id}`,
        instructionKurdish: 'دەنگت تۆمار بکە بۆ بێژەکردنی دروستی ئەم ڕستەیە',
        instructionEnglish: 'Record your voice pronouncing this phrase accurately',
        instructionArabic: 'سجل صوتك لنطق هذه الجملة بدقة',
        promptText: 'Practice standard pronunciation with native cadence.',
        promptKu: 'مەشقی بێژەکردنی ستاندارد بکە بە شێوازی ڕەسەن.',
        promptAr: 'تدرب على النطق القياسي السليم بنبرة طبيعية.',
        promptEn: 'Practice standard pronunciation with native cadence.',
        sampleIdealAnswer: 'Practice standard pronunciation with native cadence.',
        minSpeakingSeconds: 3,
      });
    }
    return items;
  }, [worldSteps, activeWorld]);

  // Total completed stages count
  const completedCount = useMemo(() => {
    return Object.keys(completedScores).length;
  }, [completedScores]);

  // Play audio for a stage prompt
  const handlePlayPreviewAudio = async (text: string) => {
    if (isPlayingAudio) return;
    try {
      setIsPlayingAudio(true);
      await playWordOrSentence({
        text,
        lang: targetLang,
        voiceName: selectedVoice,
        speed: 0.9,
      });
    } catch (e) {
      console.warn('Map audio preview error', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Generate smooth S-curve horizontal offsets for each stage node along the road
  // 50% center, drifting left (25%) and right (75%)
  const getNodePosition = (index: number) => {
    const pattern = [50, 68, 80, 72, 50, 28, 20, 32];
    const leftPercent = pattern[index % pattern.length];
    return leftPercent;
  };

  return (
    <div className="relative w-full min-h-[85vh] bg-[#0c141c] text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Map Header matching Screenshot 2 */}
      <div className="relative z-20 px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToStudio}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title={isAr ? 'العودة للاستوديو' : isKu ? 'گەڕانەوە بۆ شاشەی دەنگ' : 'Back to Studio'}
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          {/* World Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWorldMenu(!showWorldMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-all cursor-pointer shadow-sm"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? activeWorld.nameAr : isKu ? activeWorld.nameKu : activeWorld.nameEn}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeWorld.level}
              </span>
            </button>

            {/* World Dropdown Drawer */}
            {showWorldMenu && (
              <div
                className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-80 overflow-y-auto animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-800">
                  {isAr ? 'اختر العالم والمسار (١,٠٠٠ قۆناغ):' : isKu ? 'هەڵبژاردنی جیهان و ڕێڕەوی ئاستەکان:' : 'Select World & Level Track:'}
                </div>
                {WORLDS.map((w) => {
                  const isCurrentWorld = w.id === activeWorldId;
                  const isWorldUnlocked = unlockedStage >= w.range[0];

                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setActiveWorldId(w.id);
                        setShowWorldMenu(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors text-left rtl:text-right cursor-pointer ${
                        isCurrentWorld
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : isWorldUnlocked
                          ? 'text-slate-200 hover:bg-slate-800'
                          : 'text-slate-500 hover:bg-slate-850 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isWorldUnlocked ? (
                          <Star className={`w-3.5 h-3.5 ${isCurrentWorld ? 'text-slate-950 fill-current' : 'text-amber-400'}`} />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span className="truncate">{isAr ? w.nameAr : isKu ? w.nameKu : w.nameEn}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80 shrink-0 ml-1">
                        {w.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coins & Points Badge matching Screenshot 2 (e.g. 1000 🪙 & +104) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-sm">
            <span className="text-base">🪙</span>
            <span>{coins + completedCount * 10}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{completedCount} / 1000</span>
          </div>
        </div>
      </div>

      {/* Styled Interactive Aerial Map Canvas (Stylized Road & Landmark City Elements) */}
      <div className="relative flex-1 overflow-y-auto px-4 py-8 scrollbar-thin scrollbar-thumb-slate-800 touch-pan-y">
        {/* Background Stylized City Map Grids & River Accent */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cityGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2dd4bf" strokeWidth="0.5" strokeOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cityGrid)" />
            {/* Soft decorative city blocks */}
            <rect x="15%" y="10%" width="80" height="60" rx="8" fill="#1e293b" />
            <rect x="70%" y="25%" width="90" height="70" rx="12" fill="#1e293b" />
            <rect x="10%" y="50%" width="100" height="80" rx="12" fill="#1e293b" />
            <rect x="65%" y="70%" width="90" height="65" rx="8" fill="#1e293b" />
          </svg>
        </div>

        {/* Floating Quick Action Buttons on Map matching Screenshot 2 */}
        <div className="fixed top-24 left-6 z-30 flex flex-col gap-3 pointer-events-auto">
          {/* Audio broadcast speaker button */}
          <button
            type="button"
            onClick={() => handlePlayPreviewAudio(displaySteps[0]?.promptText || 'Welcome to KD Voice stage track')}
            className="w-11 h-11 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/40 flex items-center justify-center transition-transform active:scale-90 cursor-pointer border border-cyan-400/40 group"
            title={isAr ? 'بث صوتي للمرحلة' : isKu ? 'خوێندنەوەی دەنگی قۆناغەکە' : 'Voice Broadcast'}
          >
            <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Boost / Rocket button */}
          <button
            type="button"
            onClick={() => {
              const nextStage = Math.min(1000, unlockedStage);
              onSelectStage(nextStage);
            }}
            className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 flex items-center justify-center transition-transform active:scale-90 cursor-pointer border border-emerald-400/40 group"
            title={isAr ? 'الانتقال المباشر للمرحلة النشطة' : isKu ? 'ڕۆشتنە سەر قۆناغی ئێستا' : 'Jump to Active Stage'}
          >
            <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Winding Road / Highway Nodes System */}
        <div className="relative max-w-md mx-auto min-h-[1400px]">
          {/* Curving SVG Path Line connecting nodes */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 1400"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            {/* Outer road ribbon */}
            <path
              d={displaySteps.reduce((acc, step, i) => {
                const x = getNodePosition(i);
                const y = 50 + i * 55;
                return i === 0 ? `M ${x} ${y}` : `${acc} Q ${x + (i % 2 === 0 ? 10 : -10)} ${y - 25}, ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#1e293b"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Inner dashed road marking */}
            <path
              d={displaySteps.reduce((acc, step, i) => {
                const x = getNodePosition(i);
                const y = 50 + i * 55;
                return i === 0 ? `M ${x} ${y}` : `${acc} Q ${x + (i % 2 === 0 ? 10 : -10)} ${y - 25}, ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
          </svg>

          {/* Level Nodes along the Winding Highway */}
          <div className="relative z-10 space-y-12 pt-6 pb-24">
            {displaySteps.map((step, index) => {
              const isUnlocked = step.id <= unlockedStage;
              const isCurrent = step.id === unlockedStage;
              const isCompleted = step.id in completedScores || step.id < unlockedStage;
              const score = completedScores[step.id];
              const leftPercent = getNodePosition(index);

              // Landmark / Special bonus boss stages every 5 stages (matching Screenshot 2 e.g. +1500, +100, Trophy)
              const isBossStage = step.id % 5 === 0;
              const isMegaStage = step.id % 10 === 0;

              return (
                <div
                  key={step.id}
                  className="relative flex items-center justify-center transition-all duration-300"
                  style={{
                    left: `${leftPercent - 50}%`,
                  }}
                >
                  {/* Stage Node Container */}
                  <div className="relative group">
                    {/* Pulsing halo ring for current active stage */}
                    {isCurrent && (
                      <span className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
                    )}

                    {/* Landmark Badge Header e.g. +100, +1500, 1000 matching Screenshot 2 */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-md flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : isCurrent
                            ? 'bg-amber-400 text-slate-950 border-amber-300 animate-bounce'
                            : isBossStage
                            ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isCompleted && score ? (
                          <>
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{score}%</span>
                          </>
                        ) : isCurrent ? (
                          <>
                            <span>{isAr ? 'المرحلة الحالية' : isKu ? 'قۆناغی ئێستا' : 'Current'}</span>
                          </>
                        ) : isBossStage ? (
                          <>
                            <span>+{step.id * 15} 🪙</span>
                          </>
                        ) : (
                          <span>+{step.id * 10}</span>
                        )}
                      </span>
                    </div>

                    {/* Circular Interactive Stage Node Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewStep(step)}
                      disabled={!isUnlocked}
                      className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-xl ${
                        isCurrent
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 ring-4 ring-emerald-300/80 shadow-emerald-500/50 scale-110 hover:scale-115'
                          : isCompleted
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400/50 hover:scale-105'
                          : isBossStage
                          ? 'bg-gradient-to-tr from-purple-800 to-indigo-900 text-purple-200 ring-2 ring-purple-500/40 opacity-75'
                          : 'bg-slate-800 text-slate-400 ring-2 ring-slate-700 opacity-60 cursor-not-allowed'
                      }`}
                      title={
                        isUnlocked
                          ? isAr
                            ? `المرحلة ${step.id}: اضغط لبدء التقييم الصوتي`
                            : isKu
                            ? `قۆناغی ${step.id}: کلیک بکە بۆ دەستپێکردنی پشکنینی دەنگ`
                            : `Stage #${step.id}: Tap to practice speaking`
                          : isAr
                          ? `المرحلة ${step.id} مقفلة؛ أكمل المرحلة ${step.id - 1} أولاً`
                          : isKu
                          ? `قۆناغی ${step.id} داخراوە؛ سەرەتا قۆناغی ${step.id - 1} تەواو بکە`
                          : `Stage #${step.id} locked`
                      }
                    >
                      {/* Node Icon */}
                      {isCompleted ? (
                        <Check className="w-7 h-7 stroke-[2.5]" />
                      ) : isCurrent ? (
                        <Mic className="w-7 h-7 animate-pulse" />
                      ) : isMegaStage ? (
                        <Trophy className="w-6 h-6 text-amber-400" />
                      ) : isBossStage ? (
                        <Star className="w-6 h-6 text-purple-300" />
                      ) : isUnlocked ? (
                        <Play className="w-6 h-6 fill-current" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-500" />
                      )}

                      {/* Stage number */}
                      <span className="text-[11px] font-black tracking-tight mt-0.5">
                        #{step.id}
                      </span>
                    </button>

                    {/* Star ratings under node if completed */}
                    {isCompleted && (
                      <div className="flex items-center justify-center gap-0.5 mt-1.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <Star
                          className={`w-3 h-3 ${
                            (score || 80) >= 75
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                        <Star
                          className={`w-3 h-3 ${
                            (score || 80) >= 90
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Preview & Launch Modal matching Screenshot 3 bottom trigger */}
      {selectedPreviewStep && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setSelectedPreviewStep(null)}
        >
          <div
            className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
            style={{ direction: isKu || isAr ? 'rtl' : 'ltr' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isAr ? `المرحلة ${selectedPreviewStep.id}` : isKu ? `قۆناغی #${selectedPreviewStep.id}` : `Stage #${selectedPreviewStep.id}`}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  CEFR {selectedPreviewStep.level}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewStep(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stage Title and Instruction */}
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {isAr
                  ? selectedPreviewStep.titleAr || selectedPreviewStep.title
                  : isKu
                  ? selectedPreviewStep.titleKu || selectedPreviewStep.title
                  : selectedPreviewStep.titleEn || selectedPreviewStep.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? selectedPreviewStep.instructionArabic || selectedPreviewStep.instructionEnglish
                  : isKu
                  ? selectedPreviewStep.instructionKurdish
                  : selectedPreviewStep.instructionEnglish}
              </p>
            </div>

            {/* Target Sentence Box with strict LTR isolation */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">
                  {isAr ? 'العبارة الصوتية المستهدفة:' : isKu ? 'ڕستەی دەنگیی مەبەست:' : 'Target Speaking Phrase:'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handlePlayPreviewAudio(
                      targetLang === 'ar'
                        ? selectedPreviewStep.promptAr || selectedPreviewStep.promptText
                        : targetLang === 'ku'
                        ? selectedPreviewStep.promptKu || selectedPreviewStep.promptText
                        : selectedPreviewStep.promptEn || selectedPreviewStep.promptText
                    )
                  }
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استماع' : isKu ? 'گوێبگرە' : 'Listen'}</span>
                </button>
              </div>

              <div
                dir={targetLang === 'en' ? 'ltr' : 'rtl'}
                style={{ direction: targetLang === 'en' ? 'ltr' : 'rtl', textAlign: targetLang === 'en' ? 'left' : 'right' }}
                className={`text-sm font-bold text-emerald-300 p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${
                  targetLang === 'en' ? 'force-ltr text-left' : 'force-rtl text-right'
                }`}
              >
                "{targetLang === 'ar'
                  ? selectedPreviewStep.promptAr || selectedPreviewStep.promptText
                  : targetLang === 'ku'
                  ? selectedPreviewStep.promptKu || selectedPreviewStep.promptText
                  : selectedPreviewStep.promptEn || selectedPreviewStep.promptText}"
              </div>

              {selectedPreviewStep.sampleAnswerKu && targetLang === 'en' && (
                <div dir="rtl" className="text-xs text-slate-400 force-rtl text-right pt-1">
                  {selectedPreviewStep.sampleAnswerKu}
                </div>
              )}
            </div>

            {/* Previous Score if any */}
            {selectedPreviewStep.id in completedScores && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="text-slate-300">
                  {isAr ? 'أعلى نتيجة سابقة:' : isKu ? 'بەرزترین نمرەی تۆمارکراو:' : 'Best Recorded Score:'}
                </span>
                <span className="font-black text-emerald-400 text-sm">
                  {completedScores[selectedPreviewStep.id]}% ⭐
                </span>
              </div>
            )}

            {/* Action Launch Button */}
            <button
              type="button"
              onClick={() => {
                onSelectStage(selectedPreviewStep.id);
                setSelectedPreviewStep(null);
                onBackToStudio();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>
                {isAr ? 'ابدأ التقييم الصوتي لهذه المرحلة' : isKu ? 'دەستپێکردنی پشکنینی ئەم قۆناغە بە دەنگ' : 'Start Voice Speaking Test'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
