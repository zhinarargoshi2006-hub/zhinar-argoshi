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
import { OnboardingTutorialModal } from './components/OnboardingTutorialModal';
import { InAppStoreModal } from './components/InAppStoreModal';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { KurdistanFlag } from './components/KurdistanFlag';
import { MobileBottomDock } from './components/MobileBottomDock';
import { ProfilePersonalizationModal } from './components/ProfilePersonalizationModal';
import { RealtimeTranslatorModal } from './components/RealtimeTranslatorModal';
import { auth, logoutAppUser, initializeUserAuth, updateUserProfileData } from './firebase';
import { cleanAllDuplicatesFromApp, refreshAndCleanApp, normalizeSentence } from './utils/cleanupDuplicates';
import { playCoinChime, playPurchaseSuccessSound } from './utils/audio';
import confetti from 'canvas-confetti';
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
  Languages,
  Map as MapIcon,
} from 'lucide-react';

export default function App() {
  const [uiLang, setUiLang] = useState<UILanguage>('ku');
  const [targetLang, setTargetLang] = useState<TargetLanguage>('en'); // Default: Kurdish learner practicing English
  const [activeTab, setActiveTab] = useState<'assessment' | 'roadmap' | 'conversation' | 'pronunciation' | 'library' | 'audiotools' | 'daily' | 'analytics'>('assessment');
  const [currentCefr, setCurrentCefr] = useState<string>('B1');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [streakDays, setStreakDays] = useState<number>(3);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [autoAdjustDifficulty, setAutoAdjustDifficulty] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kd_voice_auto_adjust_difficulty');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const handleToggleAutoAdjustDifficulty = () => {
    setAutoAdjustDifficulty((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kd_voice_auto_adjust_difficulty', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Modals state
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Functional Gamification & Gold Coins Economy
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kd_voice_coins_v1');
      return saved !== null ? Math.max(0, parseInt(saved, 10)) : 1000;
    } catch (e) {
      return 1000;
    }
  });

  const [streakFreezes, setStreakFreezes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kd_voice_streak_freezes_v1');
      return saved !== null ? Math.max(0, parseInt(saved, 10)) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [hintsCount, setHintsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kd_voice_hints_v1');
      return saved !== null ? Math.max(0, parseInt(saved, 10)) : 3;
    } catch (e) {
      return 3;
    }
  });

  const [slowAudioUnlocked, setSlowAudioUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kd_voice_slow_audio_unlocked') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [unlockedScenarios, setUnlockedScenarios] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kd_voice_unlocked_scenarios_v1');
      const defaults = ['hospital', 'business', 'academic', 'daily', 'travel'];
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.from(new Set([...defaults, ...(Array.isArray(parsed) ? parsed : [])]));
      }
      return defaults;
    } catch (e) {
      return ['hospital', 'business', 'academic', 'daily', 'travel'];
    }
  });

  const handleAddCoins = (amount: number, reason?: string) => {
    setCoins((prev) => {
      const next = prev + amount;
      try {
        localStorage.setItem('kd_voice_coins_v1', next.toString());
      } catch (e) {}
      return next;
    });
    playCoinChime();
  };

  const handleBuyStoreItem = (itemId: string, cost: number, itemType: string): boolean => {
    if (coins < cost) return false;

    setCoins((prev) => {
      const next = prev - cost;
      try {
        localStorage.setItem('kd_voice_coins_v1', next.toString());
      } catch (e) {}
      return next;
    });

    if (itemType === 'freeze') {
      setStreakFreezes((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem('kd_voice_streak_freezes_v1', next.toString());
        } catch (e) {}
        return next;
      });
    } else if (itemType === 'hints') {
      setHintsCount((prev) => {
        const next = prev + 5;
        try {
          localStorage.setItem('kd_voice_hints_v1', next.toString());
        } catch (e) {}
        return next;
      });
    } else if (itemType === 'slow_audio') {
      setSlowAudioUnlocked(true);
      try {
        localStorage.setItem('kd_voice_slow_audio_unlocked', 'true');
      } catch (e) {}
    } else if (itemType.startsWith('scenario_')) {
      const scenarioKey = itemType.replace('scenario_', '');
      setUnlockedScenarios((prev) => {
        const next = Array.from(new Set([...prev, scenarioKey]));
        try {
          localStorage.setItem('kd_voice_unlocked_scenarios_v1', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    playPurchaseSuccessSound();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD100', '#F59E0B', '#10B981'],
    });

    return true;
  };

  const handleUseHint = (): boolean => {
    if (hintsCount <= 0) return false;
    setHintsCount((prev) => {
      const next = Math.max(0, prev - 1);
      try {
        localStorage.setItem('kd_voice_hints_v1', next.toString());
      } catch (e) {}
      return next;
    });
    return true;
  };

  const handleUnlockScenario = (trackKey: string, cost: number): boolean => {
    return handleBuyStoreItem(`track_${trackKey}`, cost, `scenario_${trackKey}`);
  };

  // Initialize and listen to user auth
  useEffect(() => {
    const unsub = initializeUserAuth((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Load saved CEFR, bookmarks and settings from localStorage
  useEffect(() => {
    try {
      // Proactively clean all duplicates from localStorage on startup
      cleanAllDuplicatesFromApp();

      const savedCefr = localStorage.getItem('kd_voice_cefr') || localStorage.getItem('argosh_voice_cefr') || localStorage.getItem('aso_voice_cefr');
      if (savedCefr) setCurrentCefr(savedCefr);

      const savedTarget = (localStorage.getItem('kd_voice_target_lang') || localStorage.getItem('argosh_target_lang') || localStorage.getItem('aso_target_lang')) as TargetLanguage;
      if (savedTarget) setTargetLang(savedTarget);

      const savedUi = (localStorage.getItem('kd_voice_ui_lang') || localStorage.getItem('argosh_ui_lang') || localStorage.getItem('aso_ui_lang')) as UILanguage;
      if (savedUi) {
        setUiLang(savedUi);
        document.documentElement.dir = savedUi === 'en' ? 'ltr' : 'rtl';
        document.documentElement.lang = savedUi;
      } else {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ku';
      }

      const rawHistory =
        localStorage.getItem('kd_voice_assessment_history_v1') ||
        localStorage.getItem('ku_voice_assessment_history_v1') ||
        localStorage.getItem('argosh_voice_history');
      if (rawHistory) {
        try {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) {
            const map = new Map<string, VoiceHistoryItem>();
            for (const item of parsed) {
              if (!item) continue;
              const key = item.stageId ? `stage-${item.stageId}` : item.id;
              if (!map.has(key) || (item.timestamp && item.timestamp > (map.get(key)!.timestamp || 0))) {
                map.set(key, item);
              }
            }
            const deduped = Array.from(map.values())
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, 5);
            setVoiceHistory(deduped);
            localStorage.setItem('kd_voice_assessment_history_v1', JSON.stringify(deduped));
            try {
              localStorage.removeItem('ku_voice_assessment_history_v1');
              localStorage.removeItem('argosh_voice_history');
            } catch (e) {}
          }
        } catch (e) {}
      }

      const savedBms = localStorage.getItem('kd_voice_bookmarks');
      if (savedBms) {
        try {
          const parsed = JSON.parse(savedBms);
          if (Array.isArray(parsed)) {
            const seen = new Set<string>();
            const deduped: SavedBookmark[] = [];
            for (const b of parsed) {
              const key = (b.text || '').trim().toLowerCase();
              if (key && !seen.has(key)) {
                seen.add(key);
                deduped.push(b);
              }
            }
            setBookmarks(deduped);
            localStorage.setItem('kd_voice_bookmarks', JSON.stringify(deduped));
          }
        } catch (e) {}
      } else {
        // Initial sample bookmarks (only set once, not duplicated)
        const initialBms: SavedBookmark[] = [
          {
            id: 'bm_1',
            text: 'The continuous medical chart tracks vitals and arterial blood gases accurately.',
            translation: 'دۆسیەی بەردەوامی پزیشکی نیشانە سەرەکییەکان و گازی خوێن بە وردی تۆمار دەکات.',
            phonetic: '/ðə kənˈtɪn.ju.əs ˈmed.ɪ.kəl tʃɑːrt...',
            language: 'en',
            category: 'Hospital',
            timestamp: Date.now() - 3600000,
          },
          {
            id: 'bm_2',
            text: 'Could you please explain the potential contraindications of this antibiotic course?',
            translation: 'دەتوانیت تکایە کاریگەرییە پێچەوانە و ڕێگرییەکانی ئەم دەرمانە ڕوون بکەیتەوە؟',
            phonetic: '/kʊd juː pliːz ɪkˈspleɪn...',
            language: 'en',
            category: 'Hospital',
            timestamp: Date.now() - 7200000,
          },
        ];
        setBookmarks(initialBms);
        localStorage.setItem('kd_voice_bookmarks', JSON.stringify(initialBms));
      }

      // Check if user has previously completed the onboarding tutorial
      const hasCompletedTutorial = localStorage.getItem('kd_voice_onboarding_completed_v1');
      if (!hasCompletedTutorial) {
        setIsOnboardingOpen(true);
      }
    } catch (e) {}
  }, []);

  const handleAssessmentCompleted = (result: AssessmentResult) => {
    if (result.cefrLevel) {
      setCurrentCefr(result.cefrLevel);
      try {
        localStorage.setItem('kd_voice_cefr', result.cefrLevel);
      } catch (e) {}
    }
  };

  const handleSelectTargetLang = (lang: TargetLanguage) => {
    setTargetLang(lang);
    try {
      localStorage.setItem('kd_voice_target_lang', lang);
    } catch (e) {}
  };

  const handleToggleUiLang = (lang: UILanguage) => {
    setUiLang(lang);
    try {
      localStorage.setItem('kd_voice_ui_lang', lang);
    } catch (e) {}
    // Update html dir
    document.documentElement.dir = lang === 'ku' || lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const handleToggleBookmark = (item: SavedBookmark) => {
    setBookmarks((prev) => {
      const cleanText = item.text.trim().toLowerCase();
      const existingIdx = prev.findIndex(
        (b) => b.id === item.id || b.text.trim().toLowerCase() === cleanText
      );
      let next: SavedBookmark[];
      if (existingIdx >= 0) {
        // Item already in bookmarks: remove it to prevent duplicates
        next = prev.filter((_, idx) => idx !== existingIdx);
      } else {
        // Add new bookmark at beginning
        next = [item, ...prev];
      }
      try {
        localStorage.setItem('kd_voice_bookmarks', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => {
      const targetItem = prev.find((b) => b.id === id);
      const cleanTargetText = targetItem ? targetItem.text.trim().toLowerCase() : '';
      const next = prev.filter(
        (b) => b.id !== id && (!cleanTargetText || b.text.trim().toLowerCase() !== cleanTargetText)
      );
      try {
        localStorage.setItem('kd_voice_bookmarks', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleClearAllBookmarks = () => {
    setBookmarks([]);
    try {
      localStorage.removeItem('kd_voice_bookmarks');
    } catch (e) {}
  };

  const handleCleanDuplicateBookmarks = () => {
    cleanAllDuplicatesFromApp();
    setBookmarks((prev) => {
      const seen = new Set<string>();
      const deduped: SavedBookmark[] = [];
      for (const b of prev) {
        const key = normalizeSentence(b.text);
        if (key && !seen.has(key)) {
          seen.add(key);
          deduped.push(b);
        }
      }
      try {
        localStorage.setItem('kd_voice_bookmarks', JSON.stringify(deduped));
      } catch (e) {}
      return deduped;
    });
  };

  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kd_voice_guest_session') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleUserAuthenticated = (user: any, isNewRegistration?: boolean) => {
    setCurrentUser(user);
    setIsGuestMode(false);
    try {
      localStorage.removeItem('kd_voice_guest_session');
    } catch (e) {}
    if (isNewRegistration) {
      setIsPersonalizationOpen(true);
    }
  };

  const handleSignOut = async () => {
    await logoutAppUser();
    setCurrentUser(null);
    setIsGuestMode(false);
    try {
      localStorage.removeItem('kd_voice_guest_session');
    } catch (e) {}
  };

  const handleSaveProfile = async (data: {
    displayName: string;
    cefrLevel: string;
    targetLang: TargetLanguage;
  }) => {
    // 1. Update CEFR state & localStorage
    setCurrentCefr(data.cefrLevel);
    try {
      localStorage.setItem('kd_voice_cefr', data.cefrLevel);
    } catch (e) {}

    // 2. Update target language if changed
    if (data.targetLang && data.targetLang !== targetLang) {
      handleSelectTargetLang(data.targetLang);
    }

    // 3. Update currentUser state with new display name
    setCurrentUser((prev: any) =>
      prev
        ? { ...prev, displayName: data.displayName }
        : { uid: auth.currentUser?.uid || 'user', displayName: data.displayName, email: auth.currentUser?.email }
    );

    // 4. Persist to Firestore and Firebase Auth
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      await updateUserProfileData(uid, {
        displayName: data.displayName,
        highestCefrLevel: data.cefrLevel,
        targetLanguage: data.targetLang,
        uiLanguage: uiLang,
      });
    }
  };

  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const isUserLoggedIn = !!(currentUser && !currentUser.isAnonymous && (currentUser.email || currentUser.displayName));

  // Gated Authentication: User must enter their Gmail/Email and Password first before accessing the app
  if (!isUserLoggedIn && !isGuestMode) {
    return (
      <LoginScreen
        uiLang={uiLang}
        targetLang={targetLang}
        onUserAuthenticated={handleUserAuthenticated}
        onGuestContinue={() => {
          setIsGuestMode(true);
          try {
            localStorage.setItem('kd_voice_guest_session', 'true');
          } catch (e) {}
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 ${
      fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm'
    }`}>
      {/* Unified Sticky Header: Glued to the top, completely responsive, no horizontal shift */}
      <header className="sticky top-0 z-50 w-full max-w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-md shadow-black/25 overflow-x-hidden">
        {/* Navbar */}
        <Navbar
          uiLang={uiLang}
          targetLang={targetLang}
          currentCefr={currentCefr}
          voiceSpeed={voiceSpeed}
          selectedVoice={selectedVoice}
          streakDays={streakDays}
          coins={coins}
          streakFreezes={streakFreezes}
          onOpenStore={() => setIsStoreOpen(true)}
          onToggleUiLang={handleToggleUiLang}
          onSelectTargetLang={handleSelectTargetLang}
          onSetVoiceSpeed={setVoiceSpeed}
          onSelectVoice={setSelectedVoice}
          onOpenCertificate={() => setIsCertificateOpen(true)}
          onOpenBookmarks={() => setIsBookmarksOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsOnboardingOpen(true)}
          onOpenDailyChallenge={() => setActiveTab('daily')}
          onRefreshApp={refreshAndCleanApp}
          onOpenTranslator={() => setIsTranslatorOpen(true)}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Responsive Horizontal Tab Bar (isolated touch scroll without shifting screen) */}
        <div className="w-full border-t border-slate-900/90 bg-slate-950/80 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 scrollbar-none touch-pan-x" style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}>
              <button
                onClick={() => setActiveTab('assessment')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'assessment'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isAr ? 'اختبار النطق (CEFR)' : isKu ? 'تاقیکردنەوەی دەنگ (CEFR)' : 'Speaking Assessment'}</span>
              </button>

              {/* Stages Winding Map Direct Tab Button */}
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'roadmap'
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                    : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 border border-cyan-500/30'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
                <span>{isAr ? 'خريطة المراحل (١,٠٠٠)' : isKu ? 'نەخشەی قۆناغەکان (١,٠٠٠)' : 'Stages Map (1,000)'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black">
                  +104
                </span>
              </button>

              <button
                onClick={() => setActiveTab('conversation')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'conversation'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isAr ? 'المحادثة الصوتية' : isKu ? 'هاوڕێی دەنگیی زیرەک' : 'AI Voice Conversation'}</span>
              </button>

              {/* Instant Multilingual Translator Direct Tab Button */}
              <button
                onClick={() => setIsTranslatorOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
              >
                <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span>{isAr ? 'المترجم الصوتي فائق الدقة' : isKu ? 'وەرگێڕی خێرا و زیرەک' : 'Voice Translator'}</span>
              </button>

              <button
                onClick={() => setActiveTab('daily')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'daily'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>{isAr ? 'تحدي اليوم والأهداف' : isKu ? 'مەشق و ئاگری ڕۆژانە' : 'Daily Challenge'}</span>
              </button>

              <button
                onClick={() => setActiveTab('audiotools')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'audiotools'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span>{isAr ? 'استوديو الصوت والمخارج' : isKu ? 'تاقیگەی دەنگ و ئامرازەکان' : 'Voice Lab Studio'}</span>
              </button>

              <button
                onClick={() => setActiveTab('pronunciation')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'pronunciation'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isAr ? 'مخارج الحروف والتدريب' : isKu ? 'ڕاهێنەری بێژەکردن' : 'Phonetics & Drills'}</span>
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'library'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isAr ? 'بنك العبارات' : isKu ? 'بانکی دەنگی' : 'Phrasebook'}</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span>{isAr ? 'الإحصائيات والأوسمة' : isKu ? 'ئامار و میدالیاکان' : 'Analytics & Badges'}</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 pb-36 sm:pb-32 pt-4 max-w-6xl mx-auto w-full px-4 overflow-x-hidden">
        {(activeTab === 'assessment' || activeTab === 'roadmap') && (
          <VoiceAssessmentTab
            key="voice-assessment-main"
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
            coins={coins}
            onAddCoins={handleAddCoins}
            hintsCount={hintsCount}
            onUseHint={handleUseHint}
            slowAudioUnlocked={slowAudioUnlocked}
            onOpenStore={() => setIsStoreOpen(true)}
            onAssessmentCompleted={handleAssessmentCompleted}
            onSelectTargetLang={handleSelectTargetLang}
            onVoiceHistoryUpdated={(updatedHistory) => {
              setTimeout(() => {
                setVoiceHistory(updatedHistory);
              }, 0);
            }}
            initialViewMode={activeTab === 'roadmap' ? 'roadmap' : 'studio'}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'conversation' && (
          <ConversationTab
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
            coins={coins}
            unlockedScenarios={unlockedScenarios}
            onUnlockScenario={handleUnlockScenario}
            onOpenStore={() => setIsStoreOpen(true)}
          />
        )}

        {activeTab === 'daily' && (
          <DailyChallengeTab
            uiLang={uiLang}
            targetLang={targetLang}
            selectedVoice={selectedVoice}
            voiceSpeed={voiceSpeed}
            currentCefr={currentCefr}
            autoAdjustDifficulty={autoAdjustDifficulty}
            onToggleAutoAdjustDifficulty={handleToggleAutoAdjustDifficulty}
            onOpenAssessmentWithPrompt={() => setActiveTab('assessment')}
            onToggleBookmark={handleToggleBookmark}
            bookmarks={bookmarks}
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
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            uiLang={uiLang}
            targetLang={targetLang}
            voiceHistory={voiceHistory}
            currentCefr={currentCefr}
            onClearHistory={() => setVoiceHistory([])}
          />
        )}
      </main>

      {/* Bottom Info Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mb-20 sm:mb-0 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <KuVoiceLogo size="sm" glow={false} />
            <span className="font-semibold text-slate-300">kd voice language lab</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">Firebase Cloud</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">CEFR Certified</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-medium">
            <span>{isKu ? 'کوردیی سۆرانی' : isAr ? 'الكوردية السورانية' : 'Central Kurdish'}</span>
            <span>•</span>
            <span>{isKu ? 'ئینگلیزی' : isAr ? 'الإنجليزية' : 'English'}</span>
            <span>•</span>
            <span>{isKu ? 'عەرەبی' : isAr ? 'العربية' : 'Arabic'}</span>
          </div>
        </div>
      </footer>

      {/* Floating Responsive Mobile Dock matching Screenshot 1, 2, 3, 4 */}
      <MobileBottomDock
        activeTab={activeTab === 'assessment' ? 'overview' : activeTab}
        onSelectTab={(tab) => {
          if (tab === 'overview') {
            setActiveTab('assessment');
          } else {
            setActiveTab(tab as any);
          }
        }}
        uiLang={uiLang}
        onInstantMicClick={() => {
          setActiveTab('assessment');
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
      />

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
        onClearAllBookmarks={handleClearAllBookmarks}
        onCleanDuplicates={handleCleanDuplicateBookmarks}
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
        autoAdjustDifficulty={autoAdjustDifficulty}
        onToggleAutoAdjustDifficulty={handleToggleAutoAdjustDifficulty}
        currentCefr={currentCefr}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPersonalization={() => setIsPersonalizationOpen(true)}
        onSignOut={handleSignOut}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        uiLang={uiLang}
        targetLang={targetLang}
        onUserAuthenticated={(u, isNewRegistration) => {
          setCurrentUser(u);
          if (isNewRegistration) {
            setTimeout(() => {
              setIsPersonalizationOpen(true);
            }, 350);
          }
        }}
      />

      <ProfilePersonalizationModal
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        uiLang={uiLang}
        targetLang={targetLang}
        currentCefr={currentCefr}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />

      <HelpTipsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        uiLang={uiLang}
      />

      <OnboardingTutorialModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        uiLang={uiLang}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
        }}
        onOpenDetailedTips={() => {
          setIsOnboardingOpen(false);
          setIsHelpOpen(true);
        }}
      />

      <InAppStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        uiLang={uiLang}
        coins={coins}
        streakFreezes={streakFreezes}
        hintsCount={hintsCount}
        slowAudioUnlocked={slowAudioUnlocked}
        unlockedScenarios={unlockedScenarios}
        onBuyItem={handleBuyStoreItem}
        onOpenConversationTab={() => setActiveTab('conversation')}
      />

      <RealtimeTranslatorModal
        isOpen={isTranslatorOpen}
        onClose={() => setIsTranslatorOpen(false)}
        uiLang={uiLang}
        defaultTargetLang={targetLang}
      />
    </div>
  );
}
