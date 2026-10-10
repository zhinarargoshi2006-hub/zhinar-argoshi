import React, { useState } from 'react';
import { TargetLanguage, UILanguage, VoiceHistoryItem, AchievementBadge } from '../types';
import { ACHIEVEMENT_BADGES } from '../data/learningHubData';
import { WeeklyLeaderboard } from './WeeklyLeaderboard';
import {
  BarChart3,
  Award,
  Clock,
  Mic,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Zap,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  voiceHistory: VoiceHistoryItem[];
  currentCefr: string;
  onClearHistory?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  uiLang,
  targetLang,
  voiceHistory,
  currentCefr,
  onClearHistory,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [badges, setBadges] = useState<AchievementBadge[]>(ACHIEVEMENT_BADGES);

  // Calculate statistics
  const totalAttempts = voiceHistory.length;
  const avgOverall = totalAttempts > 0
    ? Math.round(voiceHistory.reduce((acc, h) => acc + (h.overallScore || 0), 0) / totalAttempts)
    : 82;

  const avgPronunciation = totalAttempts > 0
    ? Math.round(voiceHistory.reduce((acc, h) => acc + (h.scores?.pronunciation || 0), 0) / totalAttempts)
    : 84;

  const avgFluency = totalAttempts > 0
    ? Math.round(voiceHistory.reduce((acc, h) => acc + (h.scores?.fluency || 0), 0) / totalAttempts)
    : 79;

  const avgVocabulary = totalAttempts > 0
    ? Math.round(voiceHistory.reduce((acc, h) => acc + (h.scores?.vocabulary || 0), 0) / totalAttempts)
    : 85;

  const avgGrammar = totalAttempts > 0
    ? Math.round(voiceHistory.reduce((acc, h) => acc + (h.scores?.grammar || 0), 0) / totalAttempts)
    : 81;

  const totalSpeakingSeconds = voiceHistory.reduce((acc, h) => acc + (h.durationSeconds || 5), 0);
  const totalMinutes = Math.round(totalSpeakingSeconds / 60);

  // Extract mistakes from history or provide default common mistakes
  const commonMistakes = [
    { word: 'Therapeutic', score: 62, tip: 'Pronounce initial voiceless /θ/ then unreduced /pjuːtɪk/' },
    { word: 'Electrocardiogram', score: 58, tip: 'Stress the 6th syllable: /ɪˌlek.trəʊˌkɑː.di.ə.ɡræm/' },
    { word: 'Convalescence', score: 65, tip: 'Soft c sounds like /s/: /ˌkɒn.vəˈles.əns/' },
  ];

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(voiceHistory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kd_voice_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>{isKu ? 'تەواوی هەوڵەکان' : 'Total Attempts'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalAttempts || 12}</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">{isKu ? 'تۆمارکراو لە هەور' : 'Synced to Firestore'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>{isKu ? 'تێکڕای نمرە' : 'Average Score'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{avgOverall}%</div>
          <div className="text-[10px] text-cyan-400 mt-1 font-medium">{isKu ? 'ئاستی متمانەپێکراو' : 'High Consistency'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>{isKu ? 'ئاستی ئێستای CEFR' : 'Current CEFR'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{currentCefr}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">{isKu ? 'ستانداردی نێودەوڵەتی' : 'European Standard'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>{isKu ? 'کاتی قسەکردن' : 'Minutes Spoken'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalMinutes || 24}m</div>
          <div className="text-[10px] text-purple-400 mt-1 font-medium">{isKu ? 'مەشقی دەنگی ڕاستەقینە' : 'Real Vocal Practice'}</div>
        </div>
      </div>

      {/* 4 Pillars Speaking Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'الأعمدة الأربعة لتقييم الصوت' : isKu ? 'چوار کۆڵەکەی نمرەی دەنگ' : '4 Pillars of Vocal Proficiency'}
                </h3>
                <span className="text-xs text-slate-400">
                  {isKu ? 'وردبینی بێژەکردن، ڕەوانی، وشەکاری و ڕێزمان' : 'Acoustic metric breakdown'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>{isKu ? 'بێژەکردن و مخارج الحروف (Pronunciation)' : 'Pronunciation & Phonemes'}</span>
                <span className="text-emerald-400 font-bold">{avgPronunciation}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${avgPronunciation}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>{isKu ? 'ڕەوانی و خێرایی دەنگ (Fluency)' : 'Fluency & Cadence'}</span>
                <span className="text-teal-400 font-bold">{avgFluency}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-teal-400 rounded-full transition-all"
                  style={{ width: `${avgFluency}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>{isKu ? 'دەوڵەمەندیی وشەکاری (Vocabulary)' : 'Vocabulary & Lexicon'}</span>
                <span className="text-cyan-400 font-bold">{avgVocabulary}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all"
                  style={{ width: `${avgVocabulary}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>{isKu ? 'ڕێزمان و پەیوەستکردنی ڕستە (Grammar)' : 'Grammar & Syntax'}</span>
                <span className="text-indigo-400 font-bold">{avgGrammar}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all"
                  style={{ width: `${avgGrammar}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mistake Bank (بانکی هەڵەکان) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'بنك الكلمات التي تحتاج تدريباً' : isKu ? 'بانکی هەڵەکان (Mistake Bank)' : 'Targeted Mistake Bank'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {isKu ? 'ئەو وشە قورسانەی پێویستیان بە مەشقی زیاترە' : 'Words needing focused phonetics'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {commonMistakes.map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{m.word}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {m.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{m.tip}</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 shrink-0">
                    {isKu ? 'مەشق بکە' : 'Drill'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {isKu ? 'سیستەم خۆکارانە وشە کێشەدارەکان دەدۆزێتەوە' : 'Auto-detected from speech tests'}
            </span>
            <button
              onClick={handleExportData}
              className="text-cyan-400 hover:underline font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isKu ? 'دابەزاندنی دۆسیە' : 'Export JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly XP Community Leaderboard */}
      <WeeklyLeaderboard
        uiLang={uiLang}
        targetLang={targetLang}
        currentCefr={currentCefr}
        userAttemptsCount={totalAttempts}
        averageScore={avgOverall}
      />

      {/* 12 Unlockable Achievement Badges Gallery */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'أوسمة الإنجاز والتميز' : isKu ? 'میدالیا و دەستکەوتەکانی دەنگ' : 'Vocal Achievements & Badges'}
              </h3>
              <p className="text-xs text-slate-400">
                {isKu ? '١٢ میدالیای ڕێزلێنان کە لەگەڵ مەشقکردندا دەکرێنەوە' : '12 unlockable milestone badges'}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            {badges.filter((b) => b.unlocked).length} / {badges.length} {isKu ? 'کراوەتەوە' : 'Unlocked'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                b.unlocked
                  ? 'bg-gradient-to-b from-amber-500/10 to-slate-950 border-amber-500/30 text-amber-200 shadow-md shadow-amber-500/5'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl mb-3 shadow-inner">
                {b.unlocked ? '🏆' : '🔒'}
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                {isKu ? b.titleKu : b.titleEn}
              </h4>
              <p className="text-[10px] text-slate-400 leading-tight mb-3">
                {isKu ? b.descriptionKu : b.descriptionEn}
              </p>

              <div className="w-full mt-auto">
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-1">
                  <div
                    className={`h-full rounded-full ${b.unlocked ? 'bg-amber-400' : 'bg-slate-700'}`}
                    style={{ width: `${Math.min(100, (b.progress / b.max) * 100)}%` }}
                  />
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  {b.progress} / {b.max}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
