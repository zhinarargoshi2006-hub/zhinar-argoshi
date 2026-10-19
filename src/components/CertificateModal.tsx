import React, { useState } from 'react';
import { UILanguage } from '../types';
import { KuVoiceLogo } from './KuVoiceLogo';
import {
  X,
  Award,
  Download,
  Share2,
  Printer,
  CheckCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  currentCefr: string;
  totalAttempts?: number;
  averageScore?: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  currentCefr,
  totalAttempts = 15,
  averageScore = 88,
}) => {
  if (!isOpen) return null;

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const defaultStudentName = isAr ? 'طالب العلم' : isKu ? 'هاوڕێی فێرخواز' : 'Language Learner';
  const savedName = typeof window !== 'undefined' ? localStorage.getItem('kd_voice_display_name') : null;
  const initialName = (savedName && savedName !== 'من (You)' && savedName !== 'You' && savedName !== 'تۆ' && savedName !== 'أنت') ? savedName : defaultStudentName;

  const [studentName, setStudentName] = useState(initialName);
  const [certId] = useState(`KD-VL-${Date.now().toString(36).toUpperCase()}`);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const [isCopied, setIsCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `I earned CEFR ${currentCefr} Speaking Certificate on KD Voice Language Lab! (ID: ${certId})`;
    if (navigator.share) {
      navigator.share({ title: 'KD Voice Certificate', text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Top Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'الشهادة الرسمية لإتقان النطق' : isKu ? 'بڕوانامەی فەرمیی دەنگیی ئاستی CEFR' : 'Official CEFR Speaking Certificate'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isAr ? 'وثيقة رسمية معتمدة لتقييم الكفاءة والطلاقة الشفوية' : isKu ? 'تایبەت بە هەڵسەنگاندنی دەنگ و توانای قسەکردن' : 'Verified Speaking Proficiency Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCopied && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 animate-fadeIn">
                {isKu ? 'کۆپیکرا!' : isAr ? 'تم النسخ!' : 'Copied!'}
              </span>
            )}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Name input */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
          <label className="text-xs text-slate-400 shrink-0">
            {isAr ? 'اسم المشارك على الشهادة:' : isKu ? 'ناوی بەشداربوو لەسەر بڕوانامەکە:' : 'Learner Name on Certificate:'}
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
            placeholder={isAr ? 'اكتب اسمك هنا...' : isKu ? 'ناوەکەت لێرە بنووسە...' : 'Type your name...'}
          />
        </div>

        {/* Certificate Sheet Display (Printable Zone) */}
        <div className="p-6 sm:p-10 bg-slate-950 flex justify-center">
          <div
            id="certificate-print-area"
            className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-4 border-amber-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl overflow-hidden"
          >
            {/* Ornamental Borders */}
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-amber-500/15 rounded-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex flex-col items-center justify-center gap-2 mb-4">
              <KuVoiceLogo size="md" glow={false} />
              <div className="text-[11px] font-mono tracking-widest text-amber-400 uppercase mt-1">
                KD Voice Language Lab • International CEFR Protocol
              </div>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white tracking-wide uppercase mt-2 mb-1">
              Certificate of Spoken Proficiency
            </h1>
            <p className="text-xs text-slate-400 italic">
              {isAr
                ? 'شهادة الكفاءة والطلاقة الشفوية المعتمدة وفق معايير CEFR الدولية'
                : isKu
                ? 'بڕوانامەی شایستەیی و توانای قسەکردنی دەنگیی نێودەوڵەتی'
                : 'International CEFR Verified Spoken Language Proficiency'}
            </p>

            <div className="my-6">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">This is awarded to</div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent underline decoration-amber-500/40 underline-offset-8">
                {studentName}
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
              for demonstrating commendable vocal articulation, spontaneous conversational cadence, and meeting the rigorous communicative standards of CEFR Level
            </p>

            {/* CEFR Level Seal */}
            <div className="inline-flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-950/20 border-2 border-amber-500/40 shadow-lg mb-6">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Verified Proficiency</span>
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{currentCefr}</span>
              <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">Average Score: {averageScore}%</span>
            </div>

            {/* Bottom Signatures & Stamp */}
            <div className="grid grid-cols-3 items-end pt-6 border-t border-slate-800/80 text-xs">
              <div className="text-left text-slate-400">
                <div className="text-[10px] text-slate-500">Date Issued</div>
                <div className="font-semibold text-white">{today}</div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">{certId}</div>
              </div>

              {/* Gold Verification Stamp */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-400/60 bg-amber-500/10 flex items-center justify-center text-amber-300">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[8px] font-mono uppercase text-amber-400 mt-1">AI Verified Seal</span>
              </div>

              <div className="text-right text-slate-400">
                <div className="font-serif italic text-sm text-slate-200">Dr. Zana H.</div>
                <div className="text-[10px] text-slate-500">Chief Linguistic Director</div>
                <div className="text-[9px] text-slate-400">KD Voice Language Lab</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isAr ? 'الشهادة جاهزة للطباعة أو الحفظ المباشر' : isKu ? 'دەتوانیت بڕوانامەکە چاپ بکەیت یان بە شێوەی وێنە پاشەکەوتی بکەیت' : 'Ready to print or save'}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isAr ? 'طباعة الشهادة' : isKu ? 'چاپکردنی بڕوانامە' : 'Print Certificate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
