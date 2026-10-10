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
  onPracticeSentence,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const defaultSamples: SavedBookmark[] = [
    {
      id: 'bm_1',
      text: 'The continuous medical chart tracks vitals and arterial blood gases accurately.',
      translation: 'دۆسیەی بەردەوامی پزیشکی نیشانە سەرەکییەکان و گازی خوێن بە وردی تۆمار دەکات.',
      phonetic: '/ðə kənˈtɪn.ju.əs ˈmed.ɪ.kəl tʃɑːrt...',
      language: 'en',
      category: 'medical',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'bm_2',
      text: 'Could you please explain the potential contraindications of this antibiotic course?',
      translation: 'دەتوانیت تکایە کاریگەرییە پێچەوانە و ڕێگرییەکانی ئەم دەرمانە ڕوون بکەیتەوە؟',
      phonetic: '/kʊd juː pliːz ɪkˈspleɪn...',
      language: 'en',
      category: 'pharmacy',
      timestamp: Date.now() - 7200000,
    },
  ];

  const displayBookmarks = bookmarks.length > 0 ? bookmarks : defaultSamples;

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
                {displayBookmarks.length} {isKu ? 'دەستەواژەی پاشەکەوتکراو' : 'saved items'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 divide-y divide-slate-800/40">
          {displayBookmarks.map((bm) => (
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
                  <div className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                    "{bm.text}"
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{bm.translation}</div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => playWordOrSentence(bm.text, bm.language, voiceSpeed, selectedVoice)}
                    className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center transition-all"
                    title="Listen"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bm.id)}
                    className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center transition-all"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {onPracticeSentence && (
                <div className="text-right">
                  <button
                    onClick={() => {
                      onPracticeSentence(bm.text);
                      onClose();
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>{isKu ? 'مەشقکردن بەم ڕستەیە' : 'Practice speaking this'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
          {isKu ? 'کرتە لە ئەستێرە بکە لە هەر بەشێک بۆ زیادکردنی دەستەواژەی نوێ' : 'Star any phrase in the app to save it here'}
        </div>
      </div>
    </div>
  );
};
