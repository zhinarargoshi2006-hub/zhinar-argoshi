import React from 'react';
import {
  Home,
  Map,
  Mic,
  MessageSquare,
  User,
  Sparkles,
  Flame,
  Award,
  Layers,
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onMicPress: () => void;
  isRecording?: boolean;
  uiLang?: 'ku' | 'en' | 'ar';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  onMicPress,
  isRecording = false,
  uiLang = 'ku',
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="pointer-events-auto w-full max-w-lg bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 px-3 sm:px-6 py-2 shadow-2xl shadow-black/80 flex items-center justify-between select-none">
        {/* 1. Home / Assessment */}
        <button
          type="button"
          onClick={() => onSelectTab('assessment')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 rounded-2xl cursor-pointer ${
            activeTab === 'assessment'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{isAr ? 'الرئيسية' : isKu ? 'سەرەکی' : 'Home'}</span>
        </button>

        {/* 2. Stages Road Map */}
        <button
          type="button"
          onClick={() => onSelectTab('roadmap')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 rounded-2xl cursor-pointer ${
            activeTab === 'roadmap'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{isAr ? 'الخريطة' : isKu ? 'نەخشە' : 'Map'}</span>
        </button>

        {/* 3. Daily Practice & Challenge */}
        <button
          type="button"
          onClick={() => onSelectTab('daily')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 rounded-2xl cursor-pointer ${
            activeTab === 'daily'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-semibold">{isAr ? 'التحدي' : isKu ? 'تەحەدی' : 'Daily'}</span>
        </button>

        {/* 4. Conversation & Daily Practice */}
        <button
          type="button"
          onClick={() => onSelectTab('conversation')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 rounded-2xl cursor-pointer ${
            activeTab === 'conversation'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{isAr ? 'المحادثة' : isKu ? 'مەشق' : 'Chat'}</span>
        </button>

        {/* 5. Profile & Analytics */}
        <button
          type="button"
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 rounded-2xl cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{isAr ? 'الملف' : isKu ? 'هەژمار' : 'Profile'}</span>
        </button>
      </div>
    </div>
  );
};
