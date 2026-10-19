import React, { useState, useEffect, useRef } from 'react';
import { WORLDS_CONFIG } from '../data/speakingStages1000';
import { KurdistanFlag } from './KurdistanFlag';
import {
  Lock,
  Unlock,
  Star,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Landmark,
  Compass,
  ArrowRight,
  Flame,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';

interface StagesMapRoadProps {
  unlockedStage: number;
  completedScores: { [stageId: number]: number };
  coins: number;
  onSelectStage: (stageId: number) => void;
  onClose?: () => void;
  uiLang?: 'ku' | 'en' | 'ar';
  onOpenStore?: () => void;
}

export const StagesMapRoad: React.FC<StagesMapRoadProps> = ({
  unlockedStage,
  completedScores,
  coins,
  onSelectStage,
  onClose,
  uiLang = 'ku',
  onOpenStore,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  // Current World (1 to 10) based on unlocked stage
  const initialWorldId = Math.min(10, Math.max(1, Math.floor((unlockedStage - 1) / 100) + 1));
  const [selectedWorldId, setSelectedWorldId] = useState<number>(initialWorldId);

  const selectedWorld = WORLDS_CONFIG.find((w) => w.id === selectedWorldId) || WORLDS_CONFIG[0];
  const [startStage, endStage] = selectedWorld.range;

  // Generate 100 stages for the current world
  const stages = Array.from({ length: endStage - startStage + 1 }, (_, i) => startStage + i);

  // Auto-scroll to active stage on mount
  const activeNodeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (activeNodeRef.current) {
      activeNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedWorldId]);

  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (lockedNotice) {
      const timer = setTimeout(() => setLockedNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [lockedNotice]);

  // Winding Road X-offset positions (weaves left, center, right, center, left)
  const getXPositionClass = (index: number) => {
    const cycle = index % 8;
    switch (cycle) {
      case 0:
        return 'translate-x-0'; // Center
      case 1:
        return 'translate-x-8 sm:translate-x-16 md:translate-x-24'; // Right
      case 2:
        return 'translate-x-14 sm:translate-x-28 md:translate-x-36'; // Far Right
      case 3:
        return 'translate-x-8 sm:translate-x-16 md:translate-x-24'; // Right
      case 4:
        return 'translate-x-0'; // Center
      case 5:
        return '-translate-x-8 sm:-translate-x-16 md:-translate-x-24'; // Left
      case 6:
        return '-translate-x-14 sm:-translate-x-28 md:-translate-x-36'; // Far Left
      case 7:
        return '-translate-x-8 sm:-translate-x-16 md:-translate-x-24'; // Left
      default:
        return 'translate-x-0';
    }
  };

  // Dynamic theme gradients based on selected world
  const getWorldThemeClasses = (wId: number) => {
    switch (wId) {
      case 1:
        return 'from-[#03151e] via-[#052e2b] via-[#0b1b3a] to-[#041d1a]'; // Lush Emerald & Teal
      case 2:
        return 'from-[#1c1204] via-[#2a1b0a] via-[#1a0f2e] to-[#0c1824]'; // Golden Amber & Sunset
      case 3:
        return 'from-[#041926] via-[#07243b] via-[#0d1d36] to-[#03111e]'; // Alpine Azure & Cyan
      case 4:
        return 'from-[#08152e] via-[#102046] via-[#1a1236] to-[#060e20]'; // High Altitude Sky & Indigo
      case 5:
        return 'from-[#140624] via-[#260e42] via-[#0f1f3d] to-[#08081a]'; // Cyberpunk Violet & Neon
      default:
        return 'from-[#060b18] via-[#0b1b3a] via-[#082226] to-[#041d1a]';
    }
  };

  return (
    <div className={`relative w-full min-h-[700px] flex flex-col bg-gradient-to-b ${getWorldThemeClasses(selectedWorldId)} text-slate-100 overflow-hidden select-none pb-36 transition-colors duration-700`}>
      {/* Rich Themed Ambient Background: Glowing Nebulas, Neon Trails, Starfield & Cosmic Dust */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-cyan-500/25 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/4 -right-32 w-[450px] h-[450px] bg-amber-500/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-[450px] h-[450px] bg-purple-600/25 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-3/4 -right-32 w-[450px] h-[450px] bg-emerald-500/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[450px] h-[450px] bg-sky-500/25 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Stardust, Constellations & Magical Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] left-[20%] w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_16px_#f59e0b] animate-ping opacity-80" />
        <div className="absolute top-[18%] right-[15%] w-3 h-3 rounded-full bg-yellow-200 shadow-[0_0_20px_#eab308] animate-pulse opacity-90" />
        <div className="absolute top-[32%] left-[12%] w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_#06b6d4] animate-ping opacity-75" />
        <div className="absolute top-[48%] right-[22%] w-3 h-3 rounded-full bg-emerald-300 shadow-[0_0_20px_#10b981] animate-pulse opacity-85" />
        <div className="absolute top-[65%] left-[28%] w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_16px_#fbbf24] animate-ping opacity-75" />
        <div className="absolute top-[82%] right-[18%] w-3.5 h-3.5 rounded-full bg-teal-300 shadow-[0_0_22px_#14b8a6] animate-pulse opacity-80" />
      </div>

      {/* Top Header Bar matching Screenshot 2 */}
      <div className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-3 shadow-lg shadow-black/40">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isKu ? 'گەڕانەوە' : isAr ? 'رجوع' : 'Back'}
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
          )}
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{selectedWorld.icon}</span>
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                {isKu ? selectedWorld.titleKu : selectedWorld.titleEn}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {isKu
                ? `قۆناغەکانی ${startStage} تا ${endStage} • ئاستی ${selectedWorld.level}`
                : `Stages ${startStage} - ${endStage} • Level ${selectedWorld.level}`}
            </p>
          </div>
        </div>

        {/* Gold Coins / XP Counter Badge matching Screenshot 2 (Click to open Store) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenStore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10 cursor-pointer transition-all active:scale-95 group"
            title={isKu ? 'فرۆشگای دراوەکان (کرتە بکە)' : isAr ? 'متجر العملات (اضغط للفتح)' : 'Gold Coins Shop (Click to Open)'}
          >
            <span className="text-sm group-hover:scale-125 transition-transform">🪙</span>
            <span className="text-xs sm:text-sm font-extrabold tracking-wide">{coins.toLocaleString()}</span>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-400/20 px-1 rounded-md ml-0.5">
              {isKu ? 'فرۆشگا' : isAr ? 'متجر' : 'Shop'}
            </span>
          </button>
        </div>
      </div>

      {/* World Selection Carousel Bar (1 to 10 Worlds) */}
      <div className="sticky top-[57px] z-20 w-full bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/60 px-2 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {WORLDS_CONFIG.map((world) => {
          const isCurrentWorld = selectedWorldId === world.id;
          const isWorldUnlocked = unlockedStage >= world.range[0];

          return (
            <button
              key={world.id}
              onClick={() => setSelectedWorldId(world.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isCurrentWorld
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 scale-105'
                  : isWorldUnlocked
                  ? 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-950/60 border border-slate-900 text-slate-600'
              }`}
            >
              <span>{world.icon}</span>
              <span>{isKu ? `جیهانی ${world.id}` : `World ${world.id}`}</span>
              {!isWorldUnlocked && <Lock className="w-3 h-3 text-slate-600 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Floating Locked Notice Toast */}
      {lockedNotice && (
        <div className="sticky top-[110px] z-30 mx-4 my-2 p-3 rounded-2xl bg-amber-950/95 border border-amber-500/50 text-amber-200 text-xs shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">{lockedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLockedNotice(null)}
            className="text-amber-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Winding Road Progression Canvas */}
      <div className="relative flex-1 w-full max-w-2xl mx-auto py-12 px-4 flex flex-col items-center">
        {/* Continuous S-Curve Road Background Line (SVG with Multi-glow gradients) */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <svg className="w-full h-full max-w-md opacity-60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="roadGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="75%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
              <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Outer Glowing Neon Path */}
            <path
              d="M 200 0 Q 340 200 200 400 T 200 800 T 200 1200 T 200 1600 T 200 2000 T 200 2400 T 200 2800 T 200 3200"
              fill="none"
              stroke="url(#roadGlow)"
              strokeWidth="42"
              strokeLinecap="round"
              filter="url(#neonBlur)"
              opacity="0.3"
            />
            {/* Core Winding Road Path with Dashed Trail */}
            <path
              d="M 200 0 Q 340 200 200 400 T 200 800 T 200 1200 T 200 1600 T 200 2000 T 200 2400 T 200 2800 T 200 3200"
              fill="none"
              stroke="url(#roadGlow)"
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray="16 12"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Road Stage Nodes List */}
        <div className="relative z-10 w-full flex flex-col items-center space-y-12">
          {stages.map((stageId, idx) => {
            const isCompleted = stageId < unlockedStage || (completedScores[stageId] && completedScores[stageId] >= 60);
            const isCurrent = stageId === unlockedStage;
            const isLocked = stageId > unlockedStage;
            const score = completedScores[stageId] || (stageId < unlockedStage ? (stageId % 3 === 0 ? 65 : stageId % 3 === 2 ? 78 : 92) : 0);

            // Dynamic Star Tier:
            // 3 Stars = Glowing Gold (score >= 85)
            // 2 Stars = Vibrant Emerald Green/Teal (70 <= score < 85)
            // 1 Star  = Crimson Red (score < 70)
            let starsCount = 3;
            let starTier: 'gold' | 'emerald' | 'crimson' = 'gold';

            if (score >= 85) {
              starsCount = 3;
              starTier = 'gold';
            } else if (score >= 70) {
              starsCount = 2;
              starTier = 'emerald';
            } else {
              starsCount = 1;
              starTier = 'crimson';
            }

            // Milestone Checks
            const isTrophy = stageId % 15 === 0 || stageId === endStage;
            const isCastleCheckpoint = stageId % 25 === 0;

            const badgeValue = stageId * 25 + 100;
            const xOffsetClass = getXPositionClass(idx);

            return (
              <div
                key={stageId}
                ref={isCurrent ? activeNodeRef : null}
                className={`relative flex flex-col items-center transition-all transform duration-300 ${xOffsetClass}`}
              >
                {/* Score badge above node color-coded by performance */}
                {(isCompleted || isCurrent) && (
                  <div className="mb-2 animate-bounce">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border shadow-lg ${
                        isCurrent
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-cyan-500/30'
                          : starTier === 'gold'
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-amber-500/40'
                          : starTier === 'emerald'
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-emerald-500/40'
                          : 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-rose-500/40'
                      }`}
                    >
                      <span>{isCompleted ? '★'.repeat(starsCount) : '★'}</span>
                      <span>+{badgeValue}</span>
                    </span>
                  </div>
                )}

                {/* Node Button dynamically colored */}
                <button
                  type="button"
                  onClick={() => {
                    if (isLocked) {
                      setLockedNotice(
                        isKu
                          ? `🔒 قۆناغی #${stageId} هێشتا قوفڵە! تکایە سەرەتا قۆناغی #${stageId - 1} بە سەرکەوتوویی تەواو بکە.`
                          : isAr
                          ? `🔒 المرحلة #${stageId} مقفلة حالياً! يرجى إتمام المرحلة #${stageId - 1} أولاً لفتحها.`
                          : `🔒 Stage #${stageId} is locked! Complete stage #${stageId - 1} first.`
                      );
                      return;
                    }
                    onSelectStage(stageId);
                  }}
                  className={`group relative flex items-center justify-center transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-emerald-400 text-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.8)] ring-4 ring-cyan-300/80 scale-110 active:scale-95'
                      : isCompleted && starTier === 'gold'
                      ? 'w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_28px_rgba(251,191,36,0.7)] ring-4 ring-amber-300/80 border-2 border-yellow-100 hover:scale-108 active:scale-95'
                      : isCompleted && starTier === 'emerald'
                      ? 'w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 shadow-[0_0_28px_rgba(16,185,129,0.7)] ring-4 ring-emerald-300/80 border-2 border-emerald-100 hover:scale-108 active:scale-95'
                      : isCompleted && starTier === 'crimson'
                      ? 'w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 text-white shadow-[0_0_28px_rgba(244,63,94,0.7)] ring-4 ring-rose-400/80 border-2 border-rose-200 hover:scale-108 active:scale-95'
                      : 'w-14 h-14 rounded-full bg-slate-900/90 border-2 border-slate-800 text-slate-500 hover:border-slate-700 active:scale-95'
                  }`}
                  title={
                    isCompleted
                      ? `${starTier.toUpperCase()}: ${starsCount} Stars (${score}%) - Click to Practice Stage #${stageId}`
                      : isCurrent
                      ? `Active Stage #${stageId} - Click to Practice`
                      : `Stage #${stageId} (Locked)`
                  }
                >
                  {/* Outer Pulsing Aura for Current Active Stage */}
                  {isCurrent && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-300/40 animate-ping pointer-events-none" />
                      <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/50 animate-pulse pointer-events-none" />
                    </>
                  )}

                  {/* Gold Sparkle Aura for 3-Star Nodes */}
                  {isCompleted && starTier === 'gold' && (
                    <div className="absolute -inset-1 rounded-full border border-amber-300/40 animate-pulse pointer-events-none" />
                  )}

                  {/* Node Content */}
                  {isCastleCheckpoint ? (
                    <div className="flex flex-col items-center">
                      <Landmark className={`w-7 h-7 ${isCurrent ? 'text-slate-950' : isCompleted ? (starTier === 'crimson' ? 'text-white' : 'text-slate-950') : 'text-amber-300'}`} />
                      <span className="text-[10px] font-extrabold leading-none mt-0.5">{stageId}</span>
                    </div>
                  ) : isTrophy ? (
                    <div className="flex flex-col items-center">
                      <Trophy className={`w-7 h-7 ${isCurrent ? 'text-slate-950' : isCompleted ? (starTier === 'crimson' ? 'text-white' : 'text-slate-950') : 'text-yellow-300'}`} />
                      <span className="text-[10px] font-extrabold leading-none mt-0.5">{stageId}</span>
                    </div>
                  ) : isCompleted ? (
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black leading-none drop-shadow-sm">{stageId}</span>
                      <div className="flex items-center gap-0.5 mt-1">
                        <Star className={`w-2.5 h-2.5 ${starsCount >= 1 ? (starTier === 'crimson' ? 'fill-yellow-300 text-yellow-300' : 'fill-slate-950 text-slate-950') : 'fill-transparent text-slate-950/30'}`} />
                        <Star className={`w-2.5 h-2.5 ${starsCount >= 2 ? (starTier === 'crimson' ? 'fill-yellow-300 text-yellow-300' : 'fill-slate-950 text-slate-950') : 'fill-transparent text-slate-950/30'}`} />
                        <Star className={`w-2.5 h-2.5 ${starsCount >= 3 ? (starTier === 'crimson' ? 'fill-yellow-300 text-yellow-300' : 'fill-slate-950 text-slate-950') : 'fill-transparent text-slate-950/30'}`} />
                      </div>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex flex-col items-center">
                      <Play className="w-6 h-6 fill-slate-950 text-slate-950 ml-0.5" />
                      <span className="text-[11px] font-black leading-none mt-0.5">{stageId}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Lock className="w-5 h-5 text-slate-500" />
                      <span className="text-[9px] font-mono text-slate-600 mt-0.5">{stageId}</span>
                    </div>
                  )}
                </button>

                {/* Node Bottom Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : isCompleted && starTier === 'gold'
                        ? 'text-amber-300 font-extrabold'
                        : isCompleted && starTier === 'emerald'
                        ? 'text-emerald-300 font-extrabold'
                        : isCompleted && starTier === 'crimson'
                        ? 'text-rose-300 font-extrabold'
                        : 'text-slate-600'
                    }`}
                  >
                    {isCurrent
                      ? (isKu ? 'قۆناغی ئێستا' : isAr ? 'المرحلة الحالية' : 'Active')
                      : `${isKu ? 'قۆناغ' : isAr ? 'مرحلة' : 'Stage'} ${stageId}`}
                  </span>
                </div>

                {/* Connecting Stepping Beam / Dots Downwards to Next Node */}
                {idx < stages.length - 1 && (
                  <div className="w-2 h-8 my-1 flex flex-col items-center justify-between pointer-events-none opacity-70">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
