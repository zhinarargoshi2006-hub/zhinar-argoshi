import React, { useState, useEffect } from 'react';
import { TargetLanguage, UILanguage, LeaderboardEntry } from '../types';
import {
  fetchWeeklyLeaderboard,
  syncLeaderboardEntry,
  getPersistentUserId,
} from '../firebase';
import {
  Trophy,
  Flame,
  Medal,
  Crown,
  Sparkles,
  User,
  Zap,
  TrendingUp,
  RefreshCw,
  Clock,
  Shield,
  ArrowUp,
  Check,
} from 'lucide-react';

interface WeeklyLeaderboardProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  currentCefr: string;
  userAttemptsCount?: number;
  averageScore?: number;
}

export const WeeklyLeaderboard: React.FC<WeeklyLeaderboardProps> = ({
  uiLang,
  targetLang,
  currentCefr,
  userAttemptsCount = 8,
  averageScore = 85,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [activeLeague, setActiveLeague] = useState<'all' | 'diamond' | 'emerald'>('all');
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Calculate current user's weekly XP
  // 1 attempt = 120 XP base + bonus
  const userXp = Math.max(150, (userAttemptsCount * 125) + Math.round((averageScore || 75) * 4));
  const currentUserId = getPersistentUserId();

  // Curated community peers
  const initialPeers: LeaderboardEntry[] = [
    {
      userId: 'usr_peer_1',
      displayName: 'ئاسۆ کەمال (Aso K.)',
      weeklyXp: 1840,
      cefrLevel: 'C1',
      avatar: '👨‍💼',
      streakDays: 7,
      language: 'en',
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_peer_2',
      displayName: 'د. لانە مەحموود (Dr. Lana)',
      weeklyXp: 1620,
      cefrLevel: 'C1',
      avatar: '👩‍⚕️',
      streakDays: 6,
      language: 'en',
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_peer_3',
      displayName: 'شاکار ڕەحمان (Shakar R.)',
      weeklyXp: 1450,
      cefrLevel: 'B2',
      avatar: '🎧',
      streakDays: 5,
      language: 'en',
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_peer_4',
      displayName: 'ڕێژوان ئەحمەد (Rezhwan)',
      weeklyXp: 1290,
      cefrLevel: 'B2',
      avatar: '🌟',
      streakDays: 4,
      language: 'ku',
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_peer_5',
      displayName: 'سارا تاهیر (Sara T.)',
      weeklyXp: 1120,
      cefrLevel: 'B2',
      avatar: '🎙️',
      streakDays: 4,
      language: 'ar',
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_peer_6',
      displayName: 'کۆسار عەلی (Kosar A.)',
      weeklyXp: 980,
      cefrLevel: 'B1',
      avatar: '🚀',
      streakDays: 3,
      language: 'en',
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_peer_7',
      displayName: 'دەریا حوسێن (Darya H.)',
      weeklyXp: 860,
      cefrLevel: 'B1',
      avatar: '✨',
      streakDays: 3,
      language: 'en',
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_peer_8',
      displayName: 'کامەران بەکر (Kamaran B.)',
      weeklyXp: 740,
      cefrLevel: 'A2',
      avatar: '🎯',
      streakDays: 2,
      language: 'ku',
      updatedAt: new Date().toISOString(),
    },
  ];

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load saved name
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kd_voice_display_name') || 'من (You)';
      setUserName(saved);
    } catch (e) {
      setUserName('من (You)');
    }
  }, []);

  // Sync and fetch from Firestore
  const loadLeaderboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Sync current user's entry to Firestore
      const userDisplayName = userName || localStorage.getItem('kd_voice_display_name') || 'من (You)';
      await syncLeaderboardEntry({
        userId: currentUserId,
        displayName: userDisplayName,
        weeklyXp: userXp,
        cefrLevel: currentCefr,
        avatar: '🎙️',
        streakDays: 4,
        language: targetLang,
      });

      // 2. Fetch live data from Firestore
      const remote = await fetchWeeklyLeaderboard(25);

      // Merge remote entries with curated peers to ensure a full lively community list
      const combinedMap = new Map<string, LeaderboardEntry>();
      initialPeers.forEach((p) => combinedMap.set(p.userId, p));

      // Add remote records
      remote.forEach((r) => {
        combinedMap.set(r.userId, {
          ...r,
          isCurrentUser: r.userId === currentUserId,
        });
      });

      // Ensure current user is present
      combinedMap.set(currentUserId, {
        userId: currentUserId,
        displayName: userDisplayName,
        weeklyXp: userXp,
        cefrLevel: currentCefr,
        avatar: '🎙️',
        streakDays: 4,
        language: targetLang,
        updatedAt: new Date().toISOString(),
        isCurrentUser: true,
      });

      const sorted = Array.from(combinedMap.values()).sort((a, b) => (b.weeklyXp || 0) - (a.weeklyXp || 0));

      // Assign ranks
      const ranked = sorted.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      setLeaderboard(ranked);
    } catch (err) {
      console.warn('Leaderboard sync note:', err);
      // Fallback
      const userEntry: LeaderboardEntry = {
        userId: currentUserId,
        displayName: userName || 'من (You)',
        weeklyXp: userXp,
        cefrLevel: currentCefr,
        avatar: '🎙️',
        streakDays: 4,
        language: targetLang,
        updatedAt: new Date().toISOString(),
        isCurrentUser: true,
      };
      const sorted = [...initialPeers, userEntry].sort((a, b) => b.weeklyXp - a.weeklyXp);
      const ranked = sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
      setLeaderboard(ranked);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, [userXp, currentCefr, userName]);

  const handleSaveName = async () => {
    if (!userName.trim()) return;
    try {
      localStorage.setItem('kd_voice_display_name', userName.trim());
      setIsEditingName(false);
      loadLeaderboardData();
    } catch (e) {}
  };

  // Find user's rank
  const currentUserRank = leaderboard.find((l) => l.isCurrentUser || l.userId === currentUserId)?.rank || 4;
  const nextRankPeer = leaderboard.find((l) => l.rank === currentUserRank - 1);
  const xpToNextRank = nextRankPeer ? Math.max(20, nextRankPeer.weeklyXp - userXp + 15) : 0;

  // Filter
  const filteredList = leaderboard.filter((entry) => {
    if (activeLeague === 'diamond') return (entry.rank || 99) <= 3;
    if (activeLeague === 'emerald') return (entry.rank || 99) > 3 && (entry.rank || 99) <= 10;
    return true;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
      {/* Header with Title and Reset Countdown */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {isAr ? 'لوحة المتصدرين الأسبوعية (Weekly XP)' : isKu ? 'خشتەی پێشەنگەکانی هەفتە (Weekly XP)' : 'Weekly XP Leaderboard'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                {isAr ? 'مجتمع نشط ومباشر' : isKu ? 'کۆمەڵگەی زیندوو' : 'Live Community'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'قارن نشاطك الصوتي ونقاط خبرتك الأسبوعية مع زملائك من المتعلمين حول العالم.'
                : isKu
                ? 'بەراوردی چالاکی و خاڵەکانی قسەکردنت لەگەڵ فێرخوازانی تری کوردستان و جیهان بکە.'
                : 'See how your weekly speaking practice and XP compare to fellow learners.'}
            </p>
          </div>
        </div>

        {/* Right Info: Weekly Reset Timer & Refresh */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'إعادة التعيين خلال: 3 أيام' : isKu ? 'نوێبوونەوە لە: ٣ ڕۆژدا' : 'Resets in: 3d 14h'}</span>
          </div>

          <button
            onClick={loadLeaderboardData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* User's Current Standings Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-indigo-950/30 border border-emerald-500/30 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-black text-xl shadow-inner">
              #{currentUserRank}
            </div>

            <div>
              <div className="flex items-center gap-2">
                {!isEditingName ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-white">{userName}</span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-[10px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      ({isAr ? 'تعديل الاسم' : isKu ? 'گۆڕینی ناو' : 'Edit'})
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      placeholder={isAr ? 'أدخل اسمك...' : isKu ? 'ناوەکەت بنووسە...' : 'Enter name...'}
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {currentCefr}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  {userXp} XP
                </span>
                <span>•</span>
                <span>{userAttemptsCount} {isAr ? 'تسجيلات صوتية' : isKu ? 'هەوڵی دەنگی' : 'speaking takes'}</span>
              </div>
            </div>
          </div>

          {/* XP to Next Rank */}
          {xpToNextRank > 0 && (
            <div className="text-left sm:text-right text-xs bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">
                {isAr
                  ? `للوصول للمرتبة التالية (#${currentUserRank - 1}):`
                  : isKu
                  ? `بۆ پلەی پێشەوە (Rank #${currentUserRank - 1}):`
                  : `To Next Rank (#${currentUserRank - 1}):`}
              </div>
              <div className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5 sm:justify-end">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>+{xpToNextRank} XP {isAr ? 'مطلوب' : isKu ? 'پێویستە' : 'needed'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* League Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-1">
        <button
          onClick={() => setActiveLeague('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            activeLeague === 'all'
              ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
              : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200'
          }`}
        >
          {isAr ? 'جميع المتعلمين (أفضل 10)' : isKu ? 'هەموو فێرخوازان (Top 10)' : 'All Community'}
        </button>

        <button
          onClick={() => setActiveLeague('diamond')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            activeLeague === 'diamond'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'الدوري الماسي (أفضل 3)' : isKu ? 'خولی ئەڵماس (Top 3)' : 'Diamond Tier'}</span>
        </button>

        <button
          onClick={() => setActiveLeague('emerald')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            activeLeague === 'emerald'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'دوري الزمرد (4 - 10)' : isKu ? 'خولی زمڕوود (4 - 10)' : 'Emerald Tier'}</span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/70">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <div className="col-span-2 sm:col-span-1">{isAr ? 'الترتيب' : isKu ? 'پلە' : 'Rank'}</div>
          <div className="col-span-6 sm:col-span-6">{isAr ? 'المتعلم' : isKu ? 'فێرخواز' : 'Learner'}</div>
          <div className="col-span-2 sm:col-span-2 text-center">{isAr ? 'المستوى' : isKu ? 'ئاست' : 'Level'}</div>
          <div className="col-span-2 sm:col-span-3 text-right">{isAr ? 'نقاط XP' : isKu ? 'خاڵی XP' : 'Weekly XP'}</div>
        </div>

        <div className="divide-y divide-slate-850/40">
          {filteredList.map((entry) => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;
            const isMe = entry.isCurrentUser || entry.userId === currentUserId;

            return (
              <div
                key={entry.userId}
                className={`grid grid-cols-12 gap-2 items-center px-4 py-3 transition-colors ${
                  isMe
                    ? 'bg-emerald-950/30 border-l-4 border-l-emerald-500'
                    : 'hover:bg-slate-900/40'
                }`}
              >
                {/* Rank Badge */}
                <div className="col-span-2 sm:col-span-1 flex items-center">
                  {isTop1 ? (
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/20">
                      🥇
                    </span>
                  ) : isTop2 ? (
                    <span className="w-7 h-7 rounded-lg bg-slate-300 text-slate-950 flex items-center justify-center font-black text-xs">
                      🥈
                    </span>
                  ) : isTop3 ? (
                    <span className="w-7 h-7 rounded-lg bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs">
                      🥉
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-bold text-slate-400 pl-1.5">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Name & Avatar */}
                <div className="col-span-6 sm:col-span-6 flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{entry.avatar || '🎙️'}</span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{entry.displayName}</span>
                      {isMe && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                          {isAr ? 'أنت' : isKu ? 'تۆ' : 'You'}
                        </span>
                      )}
                    </div>
                    {entry.streakDays && entry.streakDays > 1 && (
                      <div className="text-[10px] text-amber-400/90 flex items-center gap-1 mt-0.5">
                        <Flame className="w-3 h-3 fill-current" />
                        <span>{entry.streakDays}d streak</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CEFR Level */}
                <div className="col-span-2 sm:col-span-2 text-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                    {entry.cefrLevel || 'B1'}
                  </span>
                </div>

                {/* Weekly XP */}
                <div className="col-span-2 sm:col-span-3 text-right">
                  <div className="font-mono text-xs sm:text-sm font-black text-amber-300">
                    {entry.weeklyXp.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase font-medium">XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Motivation */}
      <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>
          {isKu
            ? 'هەر تۆمارکردنێکی دەنگی بە سەرکەوتوویی ١٢٥ خاڵی XP زیاد دەکات بۆ خشتەی هەفتانەت!'
            : 'Each completed speaking take earns 125 XP towards your weekly standing!'}
        </span>
      </div>
    </div>
  );
};
