import React from 'react';
import { UILanguage } from '../types';
import {
  X,
  HelpCircle,
  Mic,
  Volume2,
  Sparkles,
  Command,
  CheckCircle2,
} from 'lucide-react';

interface HelpTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
}

export const HelpTipsModal: React.FC<HelpTipsModalProps> = ({
  isOpen,
  onClose,
  uiLang,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'دليل إتقان الصوت والنطق' : isKu ? 'ڕێنمایی گەیشتن بە نمرەی ٩٥٪+' : 'How to Achieve 95%+ Speaking Score'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isKu ? 'تەکنیکەکانی مایکڕۆفۆن و ڕێکخستنی دەنگ' : 'Microphone & cadence guidelines'}
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

        {/* Tips list */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">
                {isKu ? 'دووری گونجاوی مایکڕۆفۆن (١٠ بۆ ١٥ سانتیمەتر)' : 'Optimal Mic Distance (10-15cm)'}
              </h4>
              <p className="text-slate-400 leading-relaxed">
                {isKu
                  ? 'مایکەکە زۆر لە لێوەکانت نزیک مەکەرەوە تا دەنگی هەوا و پشکنین نەبێتە هۆی شێواندن. شوێنێکی بێ ژاوەژاو هەڵبژێرە.'
                  : 'Keep microphone 10-15cm away to prevent popping plosives (p, t, k) from distorting acoustic clarity.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">
                {isKu ? 'بەردەوامی و نەپچڕانی ڕستە (Connected Speech)' : 'Continuous Flow & Clause Cadence'}
              </h4>
              <p className="text-slate-400 leading-relaxed">
                {isKu
                  ? 'سیستەمی زیرەک نمرەی بەرز دەدات بەو کەسانەی وشەکان دەبەستنەوە بەیەکەوە لە جیاتی وتنەوەی وشە بە وشە بە پچڕاوی.'
                  : 'Speak in full rhythmic clauses rather than isolated word-by-word stutters. Connect prepositions smoothly.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">
                {isKu ? 'پیتە قورسەکانی کوردی و ئینگلیزی' : 'Mastering Tricky Consonants'}
              </h4>
              <p className="text-slate-400 leading-relaxed">
                {isKu
                  ? 'لە کوردی جیاوازی بکە لە نێوان "ڕ"ی قورس و "ر"ی سووک، هەروەها لە ئینگلیزی پیتەکانی "th" و "r" بە تەواوی دەرببڕە.'
                  : 'Distinguish dental fricatives [θ/ð] and avoid dropping final consonant clusters.'}
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold mb-3">
              <Command className="w-4 h-4 text-purple-400" />
              <span>{isKu ? 'دوگمە خێراکانی کیبۆرد (Shortcuts):' : 'Keyboard Shortcuts:'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{isKu ? 'تۆمارکردن / ڕاگرتن' : 'Record / Stop'}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{isKu ? 'گوێگرتن لە دەنگ' : 'Replay Audio'}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">R</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{isKu ? 'دەرخستنی وەرگێڕان' : 'Toggle Translation'}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[10px]">T</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{isKu ? 'داخستنی مۆداڵ' : 'Close Modal'}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all"
          >
            {isKu ? 'تێگەیشتم، زۆر سوپاس' : 'Got it, thanks!'}
          </button>
        </div>
      </div>
    </div>
  );
};
