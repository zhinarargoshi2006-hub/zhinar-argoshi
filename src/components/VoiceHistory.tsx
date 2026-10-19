import React, { useState } from 'react';
import { VoiceHistoryItem, UILanguage } from '../types';
import { playBase64Audio, stopCurrentAudio } from '../utils/audio';
import {
  Volume2,
  Square,
  History,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  Mic,
  RotateCcw,
  Cloud,
} from 'lucide-react';

interface VoiceHistoryProps {
  history: VoiceHistoryItem[];
  uiLang: UILanguage;
  onClearHistory: () => void;
  onDeleteAttempt: (id: string) => void;
  onSelectStage?: (stageId: number) => void;
  onCleanDuplicates?: () => void;
}

export const VoiceHistory: React.FC<VoiceHistoryProps> = ({
  history,
  uiLang,
  onClearHistory,
  onDeleteAttempt,
  onSelectStage,
  onCleanDuplicates,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [playingAttemptId, setPlayingAttemptId] = useState<string | null>(null);

  // Re-listen to the user's recorded audio
  const handlePlayVoice = async (item: VoiceHistoryItem) => {
    if (playingAttemptId === item.id) {
      stopCurrentAudio();
      setPlayingAttemptId(null);
      return;
    }

    try {
      stopCurrentAudio();
      setPlayingAttemptId(item.id);
      await playBase64Audio(item.audioBase64, item.mimeType || 'audio/webm');
    } catch (err) {
      console.warn('Error re-playing recorded audio:', err);
    } finally {
      setPlayingAttemptId((current) => (current === item.id ? null : current));
    }
  };

  // Helper for human-readable relative time
  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) {
      return isAr ? 'الآن' : isKu ? 'کەمێک لەمەوبەر' : 'Just now';
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return isAr ? `منذ ${diffMin} دقيقة` : isKu ? `${diffMin} خولەک پێش ئێستا` : `${diffMin}m ago`;
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return isAr ? `منذ ${diffHours} ساعة` : isKu ? `${diffHours} کاتژمێر پێش ئێستا` : `${diffHours}h ago`;
    }
    return new Date(timestamp).toLocaleDateString();
  };

  // Helper to color-code CEFR levels
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'C2':
      case 'C1':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'B2':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'B1':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'A2':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 backdrop-blur-sm shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isAr
                  ? 'سجل التسجيلات الصوتية السابقة'
                  : isKu
                  ? 'مێژووی دەنگە تۆمارکراوەکان'
                  : 'Voice History'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {history.length}/5
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-950 border border-emerald-500/25 text-emerald-400">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>{isAr ? 'متزامن مع Firebase' : isKu ? 'هاوکات لەگەڵ فایەربەیس' : 'Firebase Cloud Sync'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'آخر 5 محاولات صوتية تم تسجيلها وتقييمها (محفوظة محلياً)'
                : isKu
                ? 'دوایین ٥ هەوڵی دەنگیی تۆمارکراو بە هەڵسەنگاندنەوە'
                : 'Last 5 recorded speaking attempts with full audio playback'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCleanDuplicates && history.length > 0 && (
            <button
              type="button"
              onClick={onCleanDuplicates}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
              title={isAr ? 'إزالة أي تسجيلات مكررة' : isKu ? 'سڕینەوەی تۆمارە دووبارەکان' : 'Remove duplicate records'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'إزالة التكرار' : isKu ? 'سڕینەوەی دووبارەکان' : 'Clean Duplicates'}</span>
            </button>
          )}
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
              title={isAr ? 'مسح سجل التسجيلات' : isKu ? 'سڕینەوەی تەواوی مێژوو' : 'Clear all voice history'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح السجل' : isKu ? 'سڕینەوەی هەمووی' : 'Clear History'}</span>
            </button>
          )}
        </div>
      </div>

      {/* History List or Empty State */}
      {history.length === 0 ? (
        <div className="py-8 px-4 flex flex-col items-center justify-center text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <Mic className="w-6 h-6" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-300 mb-1">
            {isAr
              ? 'لا توجد تسجيلات صوتية سابقة بعد'
              : isKu
              ? 'هێشتا هیچ تۆمارێکی دەنگ لە مێژوودا نییە'
              : 'No Voice Recordings Saved Yet'}
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
            {isAr
              ? 'عندما تنتهي من تسجيل صوتك في أي مرحلة وتطلب تقييمها، سيتم حفظ آخر 5 تسجيلات صوتية هنا لتتمكن من إعادة الاستماع إليها ومقارنة تطورك.'
              : isKu
              ? 'کە دەنگت تۆمار کرد لە هەر قۆناغێکدا، دوایین ٥ هەوڵ لێرەدا دەمێننەوە بۆ ئەوەی هەر کاتێک بتەوێت گوێ لە دەنگی خۆت بگریتەوە.'
              : 'Complete a speaking stage to save your recording here. You can re-listen to your voice anytime.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, index) => {
            const isCurrentPlaying = playingAttemptId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrentPlaying
                    ? 'bg-slate-950 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-750'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Stage Info & Time */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                        {isAr ? `المرحلة ${item.stageId}` : isKu ? `قۆناغی ${item.stageId}` : `Stage #${item.stageId}`}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${getBadgeStyle(
                          item.cefrLevel
                        )}`}
                      >
                        {item.cefrLevel}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 inline" />
                        {formatRelativeTime(item.timestamp)}
                        {item.durationSeconds > 0 && ` • ${item.durationSeconds}s`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 truncate">
                      {item.stageTitle}
                    </h4>

                    {/* What user said transcript */}
                    {/* What user said transcript */}
                    {item.recognizedText && (
                      <p
                        dir={item.language === 'en' ? 'ltr' : 'rtl'}
                        style={{ direction: item.language === 'en' ? 'ltr' : 'rtl', textAlign: item.language === 'en' ? 'left' : 'right' }}
                        className={`text-[11px] text-slate-300 italic line-clamp-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/60 ${
                          item.language === 'en' ? 'force-ltr text-left' : 'force-rtl text-right'
                        }`}
                      >
                        🗣️ "{item.recognizedText}"
                      </p>
                    )}
                  </div>

                  {/* Right: Scores & Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Overall Score */}
                    <div className="text-right sm:text-center">
                      <div className={`text-sm font-black ${
                        item.overallScore >= 95
                          ? 'text-cyan-400 font-extrabold'
                          : item.overallScore >= 85
                          ? 'text-emerald-400'
                          : item.overallScore >= 70
                          ? 'text-teal-400'
                          : item.overallScore >= 55
                          ? 'text-sky-400'
                          : item.overallScore >= 45
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {item.overallScore}%
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium">
                        {isAr ? 'الدرجة' : isKu ? 'نمرە' : 'Score'}
                      </div>
                    </div>

                    {/* Re-listen Button */}
                    <button
                      type="button"
                      onClick={() => handlePlayVoice(item)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                        isCurrentPlaying
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                      title={isAr ? 'استمع لتسجيل صوتك' : isKu ? 'گوێگرتنەوە لە دەنگی خۆت' : 'Re-listen to your recording'}
                    >
                      {isCurrentPlaying ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>{isAr ? 'إيقاف' : isKu ? 'ڕاگرتن' : 'Stop'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'استمع لصوتك' : isKu ? 'گوێ لە دەنگت بگرەوە' : 'Re-listen'}</span>
                        </>
                      )}
                    </button>

                    {/* Jump to stage button if handler available */}
                    {onSelectStage && (
                      <button
                        type="button"
                        onClick={() => onSelectStage(item.stageId)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                        title={isAr ? 'الانتقال لهذه المرحلة' : isKu ? 'چوون بۆ ئەم قۆناغە' : 'Jump to this stage'}
                      >
                        {isKu || isAr ? (
                          <ArrowLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Delete single attempt */}
                    <button
                      type="button"
                      onClick={() => onDeleteAttempt(item.id)}
                      className="p-2 rounded-xl bg-slate-900/60 hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-slate-800/80 transition-colors cursor-pointer"
                      title={isAr ? 'حذف هذه المحاولة' : isKu ? 'سڕینەوەی ئەم دەنگە' : 'Delete attempt'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mini audio wave bar animation when playing */}
                {isCurrentPlaying && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-emerald-400 animate-in fade-in">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      {isAr ? 'جاري تشغيل صوتك المسجل...' : isKu ? 'دەنگە تۆمارکراوەکەت لێدەدرێتەوە...' : 'Playing your voice recording...'}
                    </span>
                    <span className="font-mono text-slate-400">
                      {item.durationSeconds > 0 ? `${item.durationSeconds}s` : 'Playing'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
