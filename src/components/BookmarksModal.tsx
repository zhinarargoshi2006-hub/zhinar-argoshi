import React, { useState } from 'react';
import { SavedBookmark, UILanguage, TargetLanguage } from '../types';
import { playWordOrSentence } from '../utils/audio';
import {
  X,
  Bookmark,
  Volume2,
  Trash2,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  voiceSpeed?: number;
  selectedVoice?: string;
  bookmarks: SavedBookmark[];
  onRemoveBookmark: (id: string) => void;
  onClearAllBookmarks?: () => void;
  onCleanDuplicates?: () => void;
  onPracticeSentence?: (text: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  targetLang,
  voiceSpeed = 1.0,
  selectedVoice = 'Kore',
  bookmarks,
  onRemoveBookmark,
  onClearAllBookmarks,
  onCleanDuplicates,
  onPracticeSentence,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const displayBookmarks = React.useMemo(() => {
    const seen = new Set<string>();
    return bookmarks.filter((bm) => {
      const key = (bm.text || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [bookmarks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'العبارات المفضلة المحفوظة' : isKu ? 'دەستەواژە دڵخوازە پاشەکەوتکراوەکان' : 'Saved Bookmarks & Phrases'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {displayBookmarks.length} {isAr ? 'عبارة محفوظة' : isKu ? 'دەستەواژەی پاشەکەوتکراو' : 'saved items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCleanDuplicates && displayBookmarks.length > 0 && (
              <button
                type="button"
                onClick={onCleanDuplicates}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                title={isAr ? 'حذف أي عبارات مكررة' : isKu ? 'سڕینەوەی شتە دووبارەکان بەبێ کێشە' : 'Remove duplicate bookmarks'}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'إزالة التكرار' : isKu ? 'سڕینەوەی دووبارەکان' : 'Remove duplicates'}</span>
              </button>
            )}
            {onClearAllBookmarks && displayBookmarks.length > 0 && (
              <button
                type="button"
                onClick={onClearAllBookmarks}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1"
                title={isAr ? 'مسح كل المفضلة' : isKu ? 'سڕینەوەی هەمووی' : 'Clear all'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'مسح الكل' : isKu ? 'سڕینەوەی هەمووی' : 'Clear all'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 divide-y divide-slate-800/40">
          {displayBookmarks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                {isAr ? 'لا توجد عبارات محفوظة بعد' : isKu ? 'هیچ دەستەواژەیەک پاشەکەوت نەکراوە' : 'No saved phrases yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'انقر على رمز الإشارة المرجعية بجانب أي عبارة في بنك العبارات لحفظها هنا والتدرب عليها.'
                  : isKu
                  ? 'کرتە لە دوگمەی پاشەکەوت بکە لە بانکی دەنگی بۆ خەزنکردنی دەستەواژەکان لێرە.'
                  : 'Click the bookmark icon on any phrase in the library to save it here for quick practice.'}
              </p>
            </div>
          ) : (
            displayBookmarks.map((bm) => (
              <div key={bm.id} className="pt-3 first:pt-0 flex flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400">
                        {bm.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {bm.language.toUpperCase()}
                      </span>
                    </div>
                    <div
                      dir={bm.language === 'en' ? 'ltr' : 'rtl'}
                      style={{ direction: bm.language === 'en' ? 'ltr' : 'rtl', textAlign: bm.language === 'en' ? 'left' : 'right' }}
                      className={`text-xs sm:text-sm font-bold text-white leading-relaxed ${
                        bm.language === 'en' ? 'force-ltr text-left' : 'force-rtl text-right'
                      }`}
                    >
                      "{bm.text}"
                    </div>
                    {bm.translation && (
                      <div
                        dir="rtl"
                        style={{ direction: 'rtl', textAlign: 'right' }}
                        className="text-xs text-slate-400 mt-1 force-rtl text-right"
                      >
                        {bm.translation}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => playWordOrSentence({ text: bm.text, lang: bm.language, voiceName: selectedVoice, speed: voiceSpeed })}
                      className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center transition-all cursor-pointer"
                      title={isAr ? 'استمع' : isKu ? 'گوێگرتن' : 'Listen'}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveBookmark(bm.id)}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center transition-all cursor-pointer"
                      title={isAr ? 'حذف' : isKu ? 'سڕینەوە' : 'Remove'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {onPracticeSentence && (
                  <div className="rtl:text-left ltr:text-right">
                    <button
                      onClick={() => {
                        onPracticeSentence(bm.text);
                        onClose();
                      }}
                      className="text-[11px] text-amber-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? 'التدرب على نطق هذه العبارة' : isKu ? 'مەشقکردن بەم ڕستەیە' : 'Practice speaking this'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
          {isAr
            ? 'انقر على أيقونة الإشارة المرجعية في بنك العبارات لحفظ عبارات جديدة بدون تكرار'
            : isKu
            ? 'کرتە لە نیشانەی پاشەکەوت بکە لە بانکی دەنگ بۆ زیادکردنی دەستەواژەی نوێ بەبێ دووبارەبوونەوە'
            : 'Bookmark phrases from the library to save them without duplicates'}
        </div>
      </div>
    </div>
  );
};
