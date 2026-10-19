import React from 'react';
import { UILanguage } from '../types';
import {
  Home,
  Map,
  Mic,
  MessageSquare,
  BookOpen,
  Languages,
  Activity,
  Flame,
} from 'lucide-react';

interface MobileBottomDockProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  uiLang: UILanguage;
  onInstantMicClick?: () => void;
  isRecording?: boolean;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  onSelectTab,
  uiLang,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 pb-2 pt-1 pointer-events-none">
      <div className="max-w-md sm:max-w-lg mx-auto bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 pointer-events-auto px-2 sm:px-3 py-1.5 flex items-center justify-around select-none">
        {/* 1. Home / Overview */}
        <button
          type="button"
          onClick={() => onSelectTab('assessment')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'assessment'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={isAr ? 'الرئيسية والممارسة' : isKu ? 'سەرەکی و مەشق' : 'Home'}
        >
          <Home className={`w-5 h-5 ${activeTab === 'assessment' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5">
            {isAr ? 'الرئيسية' : isKu ? 'سەرەکی' : 'Home'}
          </span>
        </button>

        {/* 2. Stages Map (1,000 Levels) */}
        <button
          type="button"
          onClick={() => onSelectTab('roadmap')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'roadmap'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={isAr ? 'خريطة المراحل' : isKu ? 'نەخشەی قۆناغەکان' : 'Stages Map'}
        >
          <Map className={`w-5 h-5 ${activeTab === 'roadmap' ? 'text-cyan-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5">
            {isAr ? 'الخريطة' : isKu ? 'نەخشە' : 'Map'}
          </span>
        </button>

        {/* 3. AI Voice Conversation */}
        <button
          type="button"
          onClick={() => onSelectTab('conversation')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'conversation'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={isAr ? 'المحادثة الصوتية' : isKu ? 'هاوڕێی دەنگی' : 'AI Conversation'}
        >
          <MessageSquare className={`w-5 h-5 ${activeTab === 'conversation' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5">
            {isAr ? 'المحادثة' : isKu ? 'گفتوگۆ' : 'Chat'}
          </span>
        </button>

        {/* 4. Daily Challenge */}
        <button
          type="button"
          onClick={() => onSelectTab('daily')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'daily'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={isAr ? 'تحدي اليوم' : isKu ? 'ئاگری ڕۆژانە' : 'Daily Streak'}
        >
          <Flame className={`w-5 h-5 ${activeTab === 'daily' ? 'text-amber-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5">
            {isAr ? 'التحدي' : isKu ? 'مەشق' : 'Streak'}
          </span>
        </button>

        {/* 5. Library & Tools */}
        <button
          type="button"
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'library' || activeTab === 'audiotools'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={isAr ? 'المكتبة والترجمة' : isKu ? 'بانک و ئامراز' : 'Library'}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === 'library' || activeTab === 'audiotools' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5">
            {isAr ? 'المكتبة' : isKu ? 'بانک' : 'Library'}
          </span>
        </button>
      </div>
    </div>
  );
};
