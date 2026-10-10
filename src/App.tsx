import React, { useState, useEffect } from 'react';
import { TargetLanguage, UILanguage, AssessmentResult, VoiceHistoryItem, SavedBookmark } from './types';
import { Navbar } from './components/Navbar';
import { KuVoiceLogo } from './components/KuVoiceLogo';
import { VoiceAssessmentTab } from './components/VoiceAssessmentTab';
import { ConversationTab } from './components/ConversationTab';
import { PronunciationTab } from './components/PronunciationTab';
import { PhrasesLibraryTab } from './components/PhrasesLibraryTab';
import { AudioToolsStudio } from './components/AudioToolsStudio';
import { DailyChallengeTab } from './components/DailyChallengeTab';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CertificateModal } from './components/CertificateModal';
import { BookmarksModal } from './components/BookmarksModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { HelpTipsModal } from './components/HelpTipsModal';
import {
  Mic,
  MessageSquare,
  Flame,
  BookOpen,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Activity,
  Calendar,
  BarChart2,
} from 'lucide-react';

export default function App() {
  const [uiLang, setUiLang] = useState<UILanguage>('ku');
  const [targetLang, setTargetLang] = useState<TargetLanguage>('en'); // Default: Kurdish learner practicing English
  const [activeTab, setActiveTab] = useState<'assessment' | 'conversation' | 'pronunciation' | 'library' | 'audiotools' | 'daily' | 'analytics'>('assessment');
  const [currentCefr, setCurrentCefr] = useState<string>('B1');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [streakDays, setStreakDays] = useState<number>(3);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Modals state
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Load saved CEFR, bookmarks and settings from localStorage
  useEffect(() => {
    try {
      const savedCefr = localStorage.getItem('argosh_voice_cefr') || localStorage.getItem('aso_voice_cefr');
      if (savedCefr) setCurrentCefr(savedCefr);

      const savedTarget = (localStorage.getItem('argosh_target_lang') || localStorage.getItem('aso_target_lang')) as TargetLanguage;
      if (savedTarget) setTargetLang(savedTarget);

      const savedUi = (localStorage.getItem('argosh_ui_lang') || localStorage.getItem('aso_ui_lang')) as UILanguage;
      if (savedUi) {
        setUiLang(savedUi);
        document.documentElement.dir = savedUi === 'en' ? 'ltr' : 'rtl';
        document.documentElement.lang = savedUi;
      } else {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ku';
      }

      const savedHistory = localStorage.getItem('argosh_voice_history');
      if (savedHistory) setVoiceHistory(JSON.parse(savedHistory));

      const savedBms = localStorage.getItem('kd_voice_bookmarks');
      if (savedBms) setBookmarks(JSON.parse(savedBms));
    } catch (e) {}
  }, []);

  const handleAssessmentCompleted = (result: AssessmentResult) => {
    if (result.cefrLevel) {
      setCurrentCefr(result.cefrLevel);
      try {
        localStorage.setItem('argosh_voice_cefr', result.cefrLevel);
      } catch (e) {}
    }
  };

  const handleSelectTargetLang = (lang: TargetLanguage) => {
    setTargetLang(lang);
    try {
      localStorage.setItem('argosh_target_lang', lang);
    } catch (e) {}
  };

  const handleToggleUiLang = (lang: UILanguage) => {
    setUiLang(lang);
    try {
      localStorage.setItem('argosh_ui_lang', lang);
    } catch (e) {}
    // Update html dir
    document.documentElement.dir = lang === 'ku' || lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('kd_voice_bookmarks', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 ${
      fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm'
    }`}>
      {/* Navbar */}
      <Navbar
        uiLang={uiLang}
        targetLang={targetLang}
        currentCefr={currentCefr}
        voiceSpeed={voiceSpeed}
        selectedVoice={selectedVoice}
        streakDays={streakDays}
        onToggleUiLang={handleToggleUiLang}
        onSelectTargetLang={handleSelectTargetLang}
        onSetVoiceSpeed={setVoiceSpeed}
        onSelectVoice={setSelectedVoice}
        onOpenCertificate={() => setIsCertificateOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenDailyChallenge={() => setActiveTab('daily')}
      />

      {/* Main Tab Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 sticky top-16 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'assessment'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{isAr ? 'اختبار النطق (CEFR)' : isKu ? 'تاقیکردنەوەی دەنگ (CEFR)' : 'Speaking Assessment'}</span>
            </button>

            <button
              onClick={() => setActiveTab('conversation')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'conversation'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? 'المحادثة الصوتية' : isKu ? 'هاوڕێی دەنگیی زیرەک' : 'AI Voice Conversation'}</span>
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تحدي اليوم والأهداف' : isKu ? 'مەشق و ئاگری ڕۆژانە' : 'Daily Challenge'}</span>
            </button>

            <button
              onClick={() => setActiveTab('audiotools')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'audiotools'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'استوديو الصوت والمخارج' : isKu ? 'تاقیگەی دەنگ و ئامرازەکان' : 'Voice Lab Studio'}</span>
            </button>

            <button
              onClick={() => setActiveTab('pronunciation')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'pronunciation'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'مخارج الحروف والتدريب' : isKu ? 'ڕاهێنەری بێژەکردن' : 'Phonetics & Drills'}</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{isAr ? 'بنك العبارات' : isKu ? 'بانکی دەنگی' : 'Phrasebook'}</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span>{isAr ? 'الإحصائيات والأوسمة' : isKu ? 'ئامار و میدالیاکان' : 'Analytics & Badges'}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 pb-16 pt-4 max-w-6xl mx-auto w-full px-4">
        {activeTab === 'assessment' && (
          <VoiceAssessmentTab
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
            onAssessmentCompleted={handleAssessmentCompleted}
            onSelectTargetLang={handleSelectTargetLang}
          />
        )}

        {activeTab === 'conversation' && (
          <ConversationTab
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
          />
        )}

        {activeTab === 'daily' && (
          <DailyChallengeTab
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
            onOpenAssessmentWithPrompt={() => setActiveTab('assessment')}
          />
        )}

        {activeTab === 'audiotools' && (
          <AudioToolsStudio
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
          />
        )}

        {activeTab === 'pronunciation' && (
          <PronunciationTab
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
          />
        )}

        {activeTab === 'library' && (
          <PhrasesLibraryTab
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            uiLang={uiLang}
            targetLang={targetLang}
            voiceHistory={voiceHistory}
            currentCefr={currentCefr}
          />
        )}
      </main>

      {/* Bottom Info Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <KuVoiceLogo size="sm" glow={false} />
            <span className="font-semibold text-slate-300">kd voice language lab</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">Firebase Cloud</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">CEFR Certified</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>کوردیی سۆرانی (Kurdish)</span>
            <span>•</span>
            <span>English (ئینگلیزی)</span>
            <span>•</span>
            <span>العربية (Arabic)</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        uiLang={uiLang}
        currentCefr={currentCefr}
        totalAttempts={voiceHistory.length || 15}
        averageScore={88}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        uiLang={uiLang}
        targetLang={targetLang}
        voiceSpeed={voiceSpeed}
        selectedVoice={selectedVoice}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onPracticeSentence={() => setActiveTab('assessment')}
      />

      <AudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        uiLang={uiLang}
        targetLang={targetLang}
        voiceSpeed={voiceSpeed}
        onSetVoiceSpeed={setVoiceSpeed}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        onSelectUiLang={handleToggleUiLang}
        onSelectTargetLang={handleSelectTargetLang}
        fontSize={fontSize}
        onSetFontSize={setFontSize}
      />

      <HelpTipsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        uiLang={uiLang}
      />
    </div>
  );
}
