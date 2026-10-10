import React, { useState, useEffect, useRef } from 'react';
import { TargetLanguage, UILanguage, ChatMessage, Scenario } from '../types';
import { SCENARIOS } from '../data/practiceData';
import { chatWithTutor, assessVoiceInput, transcribeAudio } from '../services/api';
import { VoiceRecorder, playBase64Audio, playWordOrSentence, stopCurrentAudio, isIOS, isAndroid } from '../utils/audio';
import { AudioVisualizer } from './AudioVisualizer';
import {
  Mic,
  Square,
  Volume2,
  Sparkles,
  Send,
  RotateCcw,
  Languages,
  Infinity,
  Coffee,
  Briefcase,
  Plane,
  Compass,
  Stethoscope,
  HeartPulse,
  Pill,
  Activity,
  Syringe,
  Brain,
  Baby,
  Dumbbell,
  GraduationCap,
  Scale,
  Home,
  Monitor,
  MessageCircle,
  HelpCircle,
  Check,
  AlertTriangle,
  Flame,
  Smartphone,
  Upload,
} from 'lucide-react';

interface ConversationTabProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  selectedVoice: string;
  voiceSpeed: number;
}

export const ConversationTab: React.FC<ConversationTabProps> = ({
  uiLang,
  targetLang,
  selectedVoice,
  voiceSpeed,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [scenarioFilter, setScenarioFilter] = useState<'all' | 'hospital' | 'b1_b2' | 'career' | 'daily'>('hospital');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const mobileAudioInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize conversation when scenario or targetLang changes
  useEffect(() => {
    startScenario(activeScenario);
  }, [activeScenario.id, targetLang]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getStorageKey = (scId: string, lang: string) => `ku_voice_conv_${scId}_${lang}`;

  const saveMessagesToStorage = (scId: string, lang: string, msgs: ChatMessage[]) => {
    try {
      localStorage.setItem(getStorageKey(scId, lang), JSON.stringify(msgs));
    } catch (e) {}
  };

  const startScenario = async (sc: Scenario, forceReset: boolean = false) => {
    stopCurrentAudio();
    const storageKey = getStorageKey(sc.id, targetLang);

    if (!forceReset) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch (e) {}
    }

    const initialText =
      targetLang === 'en'
        ? sc.initialPromptEn
        : targetLang === 'ar'
        ? sc.initialPromptAr || sc.initialPromptEn
        : sc.initialPromptKu;

    const initialTranslation =
      targetLang === 'en'
        ? sc.initialPromptKu
        : targetLang === 'ar'
        ? sc.initialPromptKu
        : sc.initialPromptEn;

    let dynamicReplies: { text: string; translation: string }[] = [];

    if (targetLang === 'ar') {
      if (sc.category === 'hospital') {
        dynamicReplies = [
          {
            text: 'أعاني من ألم حاد ومستمر في منطقة الصدر منذ صباح أمس.',
            translation: 'لە بەیانی دوێنێوە ئازارێکی توند و کونکەری بەردەوامم لە سنگمدایە.',
          },
          {
            text: 'هل يمكنك توضيح الفحوصات والتحاليل المخبرية المطلوبة؟',
            translation: 'دەتوانیت تکایە ڕوونی بکەیتەوە چ پشکنین و تاقیگەیەک پێویستە؟',
          },
          {
            text: 'لدي حساسية معروفة تجاه البنسلين وأتناول علاجاً لضغط الدم.',
            translation: 'هەستیاریم بە پێنسیلین هەیە و پێشتر دەرمانی پەستانی خوێنم بەکارهێناوە.',
          },
        ];
      } else if (sc.category === 'career' || sc.category === 'academic') {
        dynamicReplies = [
          {
            text: 'في وظيفتي السابقة، قمت بقيادة فرق عمل متعددة لإنجاز مشاريع معقدة بنجاح.',
            translation: 'لە کاری پێشوومدا سەرپەرشتی چەندین تیمی هاوبەشم کرد بۆ چارەسەری ئاستەنگەکان.',
          },
          {
            text: 'هل يمكننا مراجعة بنود العقد والجدول الزمني لتسليم المشروع؟',
            translation: 'ئایا دەتوانین پێداچوونەوە بە بەندەکانی گرێبەستەکەدا بکەین؟',
          },
          {
            text: 'استندت منهجية بحثنا إلى جمع البيانات الميدانية والتحليل الأكاديمي الدقيق.',
            translation: 'میتۆدۆلۆژیای توێژینەوەکەمان لەسەر بنەمای زانیاریی مەیدانی و شیکاری ئەکادیمی بوو.',
          },
        ];
      } else {
        dynamicReplies = [
          {
            text: 'هل يمكنك تزويدي بمزيد من التفاصيل حول الشروط والتكاليف؟',
            translation: 'دەتوانیت تکایە وردەکاری زیاترم پێ بدەیت لەسەر مەرج و تێچوونەکان؟',
          },
          {
            text: 'أرغب في استكشاف المعالم التاريخية والثقافية في المدينة.',
            translation: 'حەزم لێیە شوێنەوارە کولتوورییەکان و نەریتە ناوخۆییەکان بگەڕێم.',
          },
          {
            text: 'مرحباً، أتمنى أن يكون يومك ممتعاً ومثمراً للغاية.',
            translation: 'سڵاو، هیوادارم ڕۆژێکی زۆر خۆش و بەرهەمدارت هەبێت.',
          },
        ];
      }
    } else if (sc.category === 'hospital') {
      dynamicReplies =
        targetLang === 'en'
          ? [
              {
                text: 'I have been experiencing sharp, persistent pain since yesterday morning.',
                translation: 'لە بەیانی دوێنێوە ئازارێکی توند و کونکەری بەردەوامم هەیە.',
              },
              {
                text: 'Could you please explain what diagnostic tests or scans are required?',
                translation: 'دەتوانیت تکایە ڕوونی بکەیتەوە چ پشکنینی تاقیگە یان تیشکێک پێویستە؟',
              },
              {
                text: 'I have a known allergy to penicillin and take asthma medication.',
                translation: 'هەستیاریم بە پێنسیلین هەیە و پێشتر دەرمانی تەنگەنەفەسیم بەکارهێناوە.',
              },
            ]
          : [
              {
                text: 'نزیکەی دوو بۆ سێ ڕۆژە ئەم نیشانە توندەم هەیە و لەگەڵیدا هەست بە گێژبوون دەکەم.',
                translation: 'I have had this severe symptom for two or three days and feel dizzy.',
              },
              {
                text: 'ئایا پشکنینی خوێن یان تیشکی CT/MRI پێویستە بۆ دەستنیشانکردنی کێشەکە؟',
                translation: 'Are blood tests or CT/MRI imaging scans necessary to diagnose the issue?',
              },
              {
                text: 'ئەم دەرمانە چۆن دەبێت بەکاربهێندرێت و ئایا کاریگەری لاوەکی هەیە؟',
                translation: 'How should this medication be taken and does it cause any side effects?',
              },
            ];
    } else if (sc.category === 'career' || sc.category === 'academic') {
      dynamicReplies =
        targetLang === 'en'
          ? [
              {
                text: 'In my previous position, I spearheaded cross-functional teams to resolve complex challenges.',
                translation: 'لە کاری پێشوومدا سەرپەرشتی چەندین تیمی هاوبەشم کرد بۆ چارەسەری ئاستەنگە ئاڵۆزەکان.',
              },
              {
                text: 'Could you walk me through the key deliverables and expectations for this milestone?',
                translation: 'دەتوانیت باسی ئامانج و چاوەڕوانییە سەرەکییەکان بکەیت بۆ ئەم قۆناغە؟',
              },
              {
                text: 'Based on our empirical analysis, the data strongly supports our primary hypothesis.',
                translation: 'بەپێی شیکارییەکانمان، زانیارییەکان بەهێزی پشتگیری لە گریمانە سەرەکییەکە دەکەن.',
              },
            ]
          : [
              {
                text: 'لە کاری پێشوومدا ئەزموونێکی بەرچاوم لە بەڕێوەبردنی پڕۆژە و سەرکردایەتی بەدەستهێنا.',
                translation: 'In my previous role, I gained substantial experience in project management and leadership.',
              },
              {
                text: 'ئایا دەتوانین پێداچوونەوە بە بەندەکانی گرێبەستەکەدا بکەین بۆ گەیشتن بە ڕێککەوتن؟',
                translation: 'Can we review the terms of the agreement to reach a mutually beneficial contract?',
              },
              {
                text: 'میتۆدۆلۆژیای توێژینەوەکەمان لەسەر بنەمای کۆکردنەوەی زانیاریی مەیدانی و ئەکادیمی بوو.',
                translation: 'Our research methodology was grounded in rigorous fieldwork and academic data.',
              },
            ];
    } else {
      dynamicReplies =
        targetLang === 'en'
          ? [
              {
                text: 'Could you please provide more details regarding the terms and schedule?',
                translation: 'دەتوانیت تکایە وردەکاری زیاترم پێ بدەیت لەسەر مەرجەکان و کاتەکان؟',
              },
              {
                text: 'I would like to explore the cultural landmarks and local traditions.',
                translation: 'حەزم لێیە شوێنەوارە کولتوورییەکان و نەریتە ناوخۆییەکان بگەڕێم.',
              },
              {
                text: 'I am encountering a persistent system error and need troubleshooting steps.',
                translation: 'ڕووبەڕووی هەڵەیەکی بەردەوامی سیستەم بوومەتەوە و پێویستم بە هەنگاوی چارەسەرە.',
              },
            ]
          : [
              {
                text: 'تکایە دەتوانیت زانیاری زیاترم لەسەر مەرجەکان و خزمەتگوزارییەکان پێ بدەیت؟',
                translation: 'Could you please give me more details regarding the terms and services?',
              },
              {
                text: 'زۆر حەز دەکەم شوێنە مێژووییەکان و چێشتخانە نەریتییەکان بەسەربکەمەوە.',
                translation: 'I would really like to visit the historic sights and traditional restaurants.',
              },
              {
                text: 'سڵاو، هیوادارم هەموو شتێک بەباشی و تەندروستی بەڕێوەبچێت.',
                translation: 'Hello, I hope everything is proceeding smoothly and in good health.',
              },
            ];
    }

    const initialMessage: ChatMessage = {
      id: `init-${sc.id}-${Date.now()}`,
      role: 'assistant',
      content: initialText,
      translation: initialTranslation,
      suggestedReplies: dynamicReplies,
      timestamp: Date.now(),
    };

    setMessages([initialMessage]);
    saveMessagesToStorage(sc.id, targetLang, [initialMessage]);
  };

  // Play audio for a specific message
  const playTutorAudio = async (msgId: string, text: string, audioBase64?: string) => {
    try {
      stopCurrentAudio();
      setIsPlayingAudioId(msgId);
      if (audioBase64) {
        await playBase64Audio(audioBase64);
        return;
      }

      await playWordOrSentence({
        text,
        lang: targetLang,
        voiceName: selectedVoice,
        speed: voiceSpeed || 1.0,
      });
    } catch (e) {
      console.warn('Tutor audio playback error:', e);
    } finally {
      setIsPlayingAudioId(null);
    }
  };

  // Send user message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveMessagesToStorage(activeScenario.id, targetLang, updated);
    setInputText('');
    setIsLoading(true);

    try {
      const tutorRole =
        targetLang === 'en'
          ? activeScenario.tutorRoleEn || 'Dr. Arthur'
          : targetLang === 'ar'
          ? activeScenario.tutorRoleAr || 'د. أحمد (طبيب)'
          : activeScenario.tutorRoleKu || 'د. ئاراس';

      const scenarioTitle =
        targetLang === 'ar'
          ? activeScenario.titleAr || activeScenario.titleEn
          : targetLang === 'en'
          ? activeScenario.titleEn
          : activeScenario.titleKu;

      const response = await chatWithTutor({
        messages: updated.map((m) => ({ role: m.role, content: m.content })),
        scenario: `${activeScenario.id}: ${scenarioTitle} - Role: ${tutorRole} (${activeScenario.descriptionEn})`,
        targetLanguage: targetLang,
        tutorPersona: tutorRole,
        userLevel: activeScenario.difficulty || 'B1-B2',
        requestAudio: false,
        voiceName: selectedVoice,
      });

      const tutorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.replyText,
        translation: response.translation,
        phoneticHint: response.phoneticHint,
        audioBase64: response.audioBase64 || undefined,
        correctionTip: response.correctionTip,
        suggestedReplies: response.suggestedReplies,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, tutorMsg];
        saveMessagesToStorage(activeScenario.id, targetLang, next);
        return next;
      });

      // Play audio automatically for realistic voice conversation feel
      if (response.replyText) {
        playTutorAudio(tutorMsg.id, response.replyText, response.audioBase64 || undefined);
      }
    } catch (err) {
      console.error('Chat error', err);
      // Resilient continuous assistant response so conversation never stalls
      const fallbackReply =
        targetLang === 'en'
          ? "I understand your clinical response. Let us continue to monitor your condition closely; can you elaborate on any additional symptoms you felt?"
          : targetLang === 'ar'
          ? "أفهم ملاحظتك السريرية بدقة. دعنا نواصل متابعة حالتك بعناية؛ هل يمكنك توضيح أي أعراض إضافية شعرت بها؟"
          : "بە تەواوی لە وەسفەکەت تێگەیشتم. با بە وریاییەوە چاودێری دۆخەکەت بکەین؛ دەتوانیت باسی هەر نیشانەیەکی تریش بکەیت کە هەستت پێکردووە؟";

      const fallbackTranslation =
        targetLang === 'en'
          ? "لە وەسفەکەت گەیشتم. با بەردەوام چاودێری بکەین؛ هیچ نیشانەیەکی ترت هەبووە؟"
          : "أفهم إجابتك بدقة؛ سنواصل المتابعة والتقييم السريري.";

      const fallbackReplies =
        targetLang === 'en'
          ? [
              { text: 'I noticed mild fatigue and slight dizziness this morning.', translation: 'بەیانی ئەمڕۆ هەستم بە کەمێک ماندوێتی و سەرگیژە کرد.' },
              { text: 'My vital signs feel relatively stable right now.', translation: 'نیشانە سەرەکییەکانم لە ئێستادا تا ڕادەیەک جێگیرن.' },
              { text: 'Could you explain the recommended diagnostic steps?', translation: 'دەتوانیت تکایە هەنگاوەکانی پشکنین ڕوون بکەیتەوە؟' },
            ]
          : targetLang === 'ar'
          ? [
              { text: 'شعرت ببعض الإرهاق والدوار الخفيف صباح اليوم.', translation: 'بەیانی هەستم بە کەمێک ماندووبوون و سەرگێژخواردن کرد.' },
              { text: 'المؤشرات الحيوية تبدو مستقرة نسبياً في الوقت الحالي.', translation: 'نیشانە سەرەکییەکان لە ئێستادا تا ڕادەیەک جێگیرن.' },
              { text: 'هل يمكنك توضيح الخطوات التشخيصية القادمة؟', translation: 'دەتوانیت هەنگاوەکانی داهاتووی پشکنین ڕوون بکەیتەوە؟' },
            ]
          : [
              { text: 'بەیانی ئەمڕۆ هەستم بە کەمێک ماندووبوون و گێژبوون کرد.', translation: 'I felt mild fatigue and lightheadedness this morning.' },
              { text: 'نیشانە سەرەکییەکانم لە ئێستادا تا ڕادەیەک جێگیر دیارن.', translation: 'My vital signs appear relatively stable right now.' },
              { text: 'پێشنیاری بەڕێزتان چییە بۆ قۆناغی داهاتووی چارەسەر؟', translation: 'What is your clinical recommendation for the next step?' },
            ];

      const fallbackMsg: ChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        translation: fallbackTranslation,
        suggestedReplies: fallbackReplies,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, fallbackMsg];
        saveMessagesToStorage(activeScenario.id, targetLang, next);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording for conversational reply
  const handleStartVoice = async () => {
    try {
      setMicNotice(null);
      stopCurrentAudio();
      setInputText('');
      setRecordingSeconds(0);

      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Avoid hardware microphone contention on mobile devices
      const isMobile = isIOS() || isAndroid();
      const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      // Run client SpeechRec with dedicated language codes:
      // Arabic: 'ar-SA'
      // Kurdish: 'ckb-IQ' (Central Kurdish / Sorani supported natively by Google Chrome / Chromium)
      // English: 'en-US'
      if (!isMobile && SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang =
            targetLang === 'ar' ? 'ar-SA' : targetLang === 'ku' ? 'ckb-IQ' : 'en-US';

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              interim += event.results[i][0].transcript;
            }
            if (interim.trim()) {
              setInputText(interim);
            }
          };
          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition note:', e?.error || e);
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition failed to start:', e);
        }
      }
    } catch (e: any) {
      console.error('Voice start failed', e);
      setIsRecording(false);
      setMicNotice(
        isKu
          ? 'ڕێگەپێدانی مایکرۆفۆن نەدراوە. تکایە لە قوفڵی وێبگەڕەکەت 🔒 ڕێگە بە مایکرۆفۆن بدە، یاخود دوگمەی مایکی مۆبایل 📱 بەکاربهێنە.'
          : 'Microphone permission denied. Please allow microphone access in your browser lock 🔒 settings, or tap the Mobile Mic 📱 button.'
      );
    }
  };

  const handleStopVoice = async () => {
    if (!recorderRef.current || !isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const { base64, mimeType } = await recorderRef.current.stop();
      setIsRecording(false);

      let textToSend = inputText.trim();

      // If speech recognition didn't yield text, transcribe pristine recorded audio via backend
      if (!textToSend && base64) {
        setIsLoading(true);
        try {
          const transcribed = await transcribeAudio({
            audioBase64: base64,
            mimeType,
            language: targetLang,
          });
          if (transcribed && transcribed.trim()) {
            textToSend = transcribed.trim();
            setInputText(textToSend);
          }
        } catch (err) {
          console.error('Transcription error:', err);
        } finally {
          setIsLoading(false);
        }
      }

      if (textToSend) {
        handleSendMessage(textToSend);
      } else {
        setMicNotice(
          targetLang === 'ku'
            ? 'دەنگەکەت تۆمارکرا بەڵام وشەکان نەبیستران. دەتوانیت دەقەکەت بنووسیت یان لە یەکێک لە وەڵامە پێشنیارکراوەکان هەڵبژێریت.'
            : targetLang === 'ar'
            ? 'تم تسجيل الصوت بنجاح. يمكنك كتابة رسالتك أو اختيار أحد الردود المقترحة أدناه.'
            : 'Audio recorded. You can type your response or pick one of the suggestions below.'
        );
      }
    } catch (e) {
      console.error('Stop voice error', e);
      setIsRecording(false);
    }
  };

  // Direct Mobile Native Audio recording handler (iPhone / Android)
  const handleMobileAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.split(',')[1] || '';
      const mime = file.type || 'audio/webm';
      setIsLoading(true);
      try {
        const transcribed = await transcribeAudio({
          audioBase64: base64,
          mimeType: mime,
          language: targetLang,
        });
        if (transcribed && transcribed.trim()) {
          handleSendMessage(transcribed.trim());
        } else {
          setMicNotice(
            targetLang === 'ku'
              ? 'دەنگەکەت گەیشت، بەڵام وشەکان نەدۆزرانەوە. تکایە یەکێک لە وەڵامە ئامادەکراوەکان هەڵبژێرە.'
              : targetLang === 'ar'
              ? 'تم استلام التسجيل، يرجى اختيار أحد الردود المقترحة.'
              : 'Recording received, please select a reply below.'
          );
        }
      } catch (err) {
        console.error('Mobile upload error', err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Icon selector helper
  const renderScenarioIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4 text-red-400" />;
      case 'Stethoscope':
        return <Stethoscope className="w-4 h-4 text-emerald-400" />;
      case 'Pill':
        return <Pill className="w-4 h-4 text-teal-400" />;
      case 'Activity':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'Syringe':
        return <Syringe className="w-4 h-4 text-sky-400" />;
      case 'Brain':
        return <Brain className="w-4 h-4 text-pink-400" />;
      case 'Baby':
        return <Baby className="w-4 h-4 text-amber-400" />;
      case 'Dumbbell':
        return <Dumbbell className="w-4 h-4 text-violet-400" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      case 'Scale':
        return <Scale className="w-4 h-4 text-yellow-400" />;
      case 'Home':
        return <Home className="w-4 h-4 text-emerald-300" />;
      case 'Monitor':
        return <Monitor className="w-4 h-4 text-cyan-300" />;
      case 'Plane':
        return <Plane className="w-4 h-4 text-cyan-400" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  const userTurnsCount = messages.filter((m) => m.role === 'user').length;
  const isHospitalScenario =
    activeScenario.category === 'hospital' || activeScenario.id.startsWith('hospital');

  const getClinicalPhase = (turns: number) => {
    if (turns <= 2) {
      return {
        phase: 1,
        titleKu: 'قۆناغی ١: فریاکەوتن و پێناسەی نیشانە سەرەکییەکان (Triage & Chief Complaint)',
        titleEn: 'Phase 1: ER Triage & Acute Complaint Assessment',
        titleAr: 'المرحلة 1: فرز الحالات والشكوى السريرية الأساسية',
        color: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
      };
    }
    if (turns <= 6) {
      return {
        phase: 2,
        titleKu: 'قۆناغی ٢: پشکنینی جەستەیی و پێوانی هێڵە سەرەکییەکان (Systematic Vitals)',
        titleEn: 'Phase 2: Systematic Vitals & Physical Examination',
        titleAr: 'المرحلة 2: العلامات الحيوية والفحص السريري الدقيق',
        color: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
      };
    }
    if (turns <= 12) {
      return {
        phase: 3,
        titleKu: 'قۆناغی ٣: پشکنینی تاقیگە، بایۆمارکەر و تیشکی CT/MRI (Diagnostics & Imaging)',
        titleEn: 'Phase 3: Lab Biomarkers & Diagnostic Imaging',
        titleAr: 'المرحلة 3: التحاليل المخبرية والتصوير الشعاعي والرنين',
        color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
      };
    }
    if (turns <= 20) {
      return {
        phase: 4,
        titleKu: 'قۆناغی ٤: دەستنیشانکردنی نەخۆشی و پزیشکی پسپۆڕ (Differential Diagnosis)',
        titleEn: 'Phase 4: Differential Diagnosis & Specialist Consult',
        titleAr: 'المرحلة 4: التشخيص التفريقي والاستشارة التخصصية',
        color: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
      };
    }
    if (turns <= 35) {
      return {
        phase: 5,
        titleKu: 'قۆناغی ٥: چارەسەری دەماری و چاودێری ناوخۆیی (Inpatient Pharmacotherapy)',
        titleEn: 'Phase 5: Inpatient Care & Targeted Pharmacotherapy',
        titleAr: 'المرحلة 5: الرعاية السريرية والعلاج الدوائي المتقدم',
        color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
      };
    }
    if (turns <= 60) {
      return {
        phase: 6,
        titleKu: 'قۆناغی ٦: نەشتەرگەری و چاودێری توند (Interventional Rounds & Monitoring)',
        titleEn: 'Phase 6: Procedural Care & Intensive Clinical Rounds',
        titleAr: 'المرحلة 6: الإجراءات العلاجية ومتابعة العناية المركزة',
        color: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
      };
    }
    return {
      phase: 7,
      titleKu: `قۆناغی بەردەوام: چاودێری پزیشکیی درێژخایەن و بێ کۆتا (Infinite Clinical Care - خولی #${turns})`,
      titleEn: `Continuous Long-Term Care & Medical Follow-up (Infinite Phase - Turn #${turns})`,
      titleAr: `المتابعة الطبية السريرية المستمرة بلا نهاية (جولة #${turns})`,
      color: 'text-teal-300 border-teal-500/50 bg-teal-500/20',
    };
  };

  const currentClinicalPhase = getClinicalPhase(userTurnsCount);

  const filteredScenarios = SCENARIOS.filter((sc) => {
    if (scenarioFilter === 'hospital') return sc.category === 'hospital';
    if (scenarioFilter === 'b1_b2') return sc.difficulty === 'B1-B2' || sc.difficulty === 'C1-C2';
    if (scenarioFilter === 'career') return sc.category === 'career' || sc.category === 'academic';
    if (scenarioFilter === 'daily') return sc.category === 'daily' || sc.category === 'travel';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Scenarios Section with Filter Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-200">
              {isKu ? 'شوێن و بارودۆخی گفتوگۆ هەڵبژێرە:' : 'Select Conversation Scenario:'}
            </span>
            <p className="text-[11px] text-slate-400">
              {isKu
                ? 'گفتوگۆی قووڵی نەخۆشخانە و پزیشکی (ئاستی B1 - B2)، چاوپێکەوتن، و ژیانی ڕۆژانە'
                : 'Deep clinical hospital cases (B1-B2), corporate interviews, and daily dialogues'}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 self-start sm:self-auto">
            {isKu ? 'هاوڕێی دەنگی: ' : 'Voice Partner: '}
            <span className="text-emerald-400 font-bold">
              {targetLang === 'en'
                ? activeScenario.tutorRoleEn || 'Dr. Arthur'
                : targetLang === 'ar'
                ? activeScenario.tutorRoleAr || 'د. أحمد (طبيب)'
                : activeScenario.tutorRoleKu || 'د. ئاراس'}
            </span>
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setScenarioFilter('hospital')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'hospital'
                ? 'bg-red-500/20 text-red-300 border border-red-500/60 shadow-sm shadow-red-950/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-red-400" />
            <span>{isKu ? 'نەخۆشخانە و پزیشکی (٨ بارودۆخ)' : 'Hospital & Medicine (8)'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-200 font-bold">B1-B2</span>
          </button>

          <button
            onClick={() => setScenarioFilter('b1_b2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'b1_b2'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-sm shadow-emerald-950/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isKu ? 'گشت ئاستی B1 - B2 (١٣ بارودۆخ)' : 'All B1-B2 (13)'}</span>
          </button>

          <button
            onClick={() => setScenarioFilter('career')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'career'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/60 shadow-sm shadow-blue-950/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>{isKu ? 'کار و زانکۆ (٣)' : 'Career & Academic (3)'}</span>
          </button>

          <button
            onClick={() => setScenarioFilter('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'daily'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isKu ? 'گەشت و ڕۆژانە (٦)' : 'Travel & Daily (6)'}</span>
          </button>

          <button
            onClick={() => setScenarioFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-600'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{isKu ? 'هەموو (١٧)' : 'All (17)'}</span>
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {filteredScenarios.map((sc) => {
            const isSelected = sc.id === activeScenario.id;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveScenario(sc)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    {renderScenarioIcon(sc.icon)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      sc.difficulty === 'B1-B2'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {sc.difficulty}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {targetLang === 'ar' ? sc.titleAr || sc.titleEn : isKu ? sc.titleKu : sc.titleEn}
                  </div>
                  {(sc.tutorRoleKu || sc.tutorRoleAr) && (
                    <div className="text-[10px] text-teal-400/90 truncate mt-0.5">
                      {targetLang === 'ar' ? sc.tutorRoleAr || sc.tutorRoleEn : isKu ? sc.tutorRoleKu : sc.tutorRoleEn}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat & Voice Interaction Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md flex flex-col h-[640px] shadow-2xl">
        {/* Scenario Header with Persona and Details */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              {renderScenarioIcon(activeScenario.icon)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate">
                  {targetLang === 'ar'
                    ? activeScenario.titleAr || activeScenario.titleEn
                    : isKu
                    ? activeScenario.titleKu
                    : activeScenario.titleEn}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                  {activeScenario.difficulty}
                </span>
                {(activeScenario.tutorRoleKu || activeScenario.tutorRoleAr) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 shrink-0">
                    {targetLang === 'ar'
                      ? activeScenario.tutorRoleAr || activeScenario.tutorRoleEn
                      : isKu
                      ? activeScenario.tutorRoleKu
                      : activeScenario.tutorRoleEn}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {targetLang === 'ar'
                  ? activeScenario.descriptionAr || activeScenario.descriptionEn
                  : isKu
                  ? activeScenario.descriptionKu
                  : activeScenario.descriptionEn}
              </p>
            </div>
          </div>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors shrink-0 ml-2 cursor-pointer"
              title={isKu ? 'دەستپێکردنەوە لە سەرەتاوە' : isAr ? 'إعادة البدء' : 'Reset and Restart Conversation'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{isKu ? 'دەستپێکردنەوە' : isAr ? 'إعادة البدء' : 'Reset'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0 ml-2 animate-in fade-in">
              <button
                onClick={() => {
                  startScenario(activeScenario, true);
                  setConfirmReset(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-[11px] font-bold text-red-300 transition-colors cursor-pointer"
              >
                {isKu ? 'بەڵێ، سەرلەنوێ' : isAr ? 'نعم، إعادة' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
              >
                {isKu ? 'نەخێر' : isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
        </div>

        {/* Infinite Medical Progress & Zero-Repetition Clinical Banner */}
        {isHospitalScenario && (
          <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-teal-950/40 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0 shadow-inner">
                <Infinity className="w-4 h-4 text-teal-300 animate-pulse" />
              </span>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-xs font-bold text-teal-300">
                  {isKu ? 'گفتوگۆی پزیشکیی بێ کۆتا (تەنانەت بۆ ساڵێک بەبێ وەستان)' : isAr ? 'محادثة المستشفى السريرية بلا نهاية' : 'Infinite Hospital Ward'}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-teal-500/30 text-teal-200 font-bold">
                  {isKu ? `خولی پزیشکی: #${userTurnsCount + 1}` : isAr ? `الجولة السريرية: #${userTurnsCount + 1}` : `Clinical Turn #${userTurnsCount + 1}`}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${currentClinicalPhase.color}`}>
                  {isKu ? currentClinicalPhase.titleKu : isAr ? currentClinicalPhase.titleAr : currentClinicalPhase.titleEn}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{isKu ? 'یاسای سفری دووبارەبوونەوە کارایە' : isAr ? 'قاعدة عدم التكرار مفعلة' : 'Zero Repetition Active'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isTutor = msg.role === 'assistant';
            const isPlaying = isPlayingAudioId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'} space-y-1.5`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 transition-all shadow-md ${
                    isTutor
                      ? 'bg-slate-950 border border-slate-800/90 text-slate-100 rounded-tr-3xl rounded-tl-sm'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tl-3xl rounded-tr-sm shadow-emerald-950/40'
                  }`}
                >
                  {/* Tutor header with speaker button */}
                  {isTutor && (
                    <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-emerald-400">
                          {targetLang === 'en'
                            ? activeScenario.tutorRoleEn || 'Dr. Arthur'
                            : targetLang === 'ar'
                            ? activeScenario.tutorRoleAr || 'د. أحمد (طبيب)'
                            : activeScenario.tutorRoleKu || 'د. ئاراس'}
                        </span>
                      </div>
                      <button
                        onClick={() => playTutorAudio(msg.id, msg.content, msg.audioBase64)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          isPlaying
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isPlaying ? 'پەخشکردن...' : isKu ? 'دەنگ' : 'Listen'}</span>
                      </button>
                    </div>
                  )}

                  {/* Message main content */}
                  <p className="text-sm sm:text-base leading-relaxed font-medium">
                    {msg.content}
                  </p>

                  {/* Translation & Phonetic helper */}
                  {isTutor && msg.translation && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{msg.translation}</span>
                      </div>
                      {msg.phoneticHint && (
                        <div className="text-[11px] text-emerald-400/80 font-mono">
                          {msg.phoneticHint}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Instant gentle grammar tip if user made a slip */}
                {msg.correctionTip && msg.correctionTip.betterWay && (
                  <div className="max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-slate-300 space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isKu ? 'ڕێنمایی بۆ دەربڕینی سروشتیتر:' : 'Natural phrasing tip:'}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {isKu ? 'باشترە بڵێیت:' : 'Better way:'}{' '}
                      <span className="text-emerald-300 font-bold">
                        "{msg.correctionTip.betterWay}"
                      </span>
                    </div>
                    {msg.correctionTip.explanationKurdish && (
                      <div className="text-[11px] text-slate-400">
                        {msg.correctionTip.explanationKurdish}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested response pills under latest assistant message */}
                {isTutor &&
                  msg.suggestedReplies &&
                  msg.suggestedReplies.length > 0 &&
                  msg.id === messages[messages.length - 1]?.id && (
                    <div className="w-full pt-2 space-y-1.5">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {isKu ? 'دەتوانیت یەکێک لەم وەڵامانە بڵێیتەوە:' : 'Suggested responses to practice speaking:'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedReplies.map((reply, i) => (
                          <div
                            key={i}
                            className="flex items-stretch rounded-xl bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 transition-all group overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => handleSendMessage(reply.text)}
                              className="px-3 py-1.5 text-left text-xs text-slate-300 hover:text-emerald-300 flex-1 flex flex-col cursor-pointer"
                            >
                              <span className="font-semibold group-hover:text-emerald-300">
                                🗣️ "{reply.text}"
                              </span>
                              <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                                {reply.translation}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playTutorAudio(`suggestion-${i}`, reply.text);
                              }}
                              className="px-2.5 flex items-center justify-center bg-slate-900/60 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border-l border-slate-800 cursor-pointer"
                              title={isKu ? 'گوێگرتن لە دەنگ' : 'Listen'}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-400">
                {isKu ? 'مامۆستا بیردەکاتەوە و وەڵام دەداتەوە...' : 'Tutor is speaking...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Audio Visualizer bar when recording */}
        {isRecording && (
          <div className="px-6 py-2 bg-slate-950/90 border-t border-slate-800">
            <AudioVisualizer
              isRecording={isRecording}
              getFrequencyData={() => recorderRef.current?.getFrequencyData() || null}
            />
          </div>
        )}

        {/* Mic Permission Warning Notice if Denied */}
        {micNotice && (
          <div className="px-4 py-2.5 bg-amber-950/40 border-t border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <span className="leading-relaxed">{micNotice}</span>
            <button
              onClick={() => setMicNotice(null)}
              className="text-amber-400 hover:text-white text-sm px-2 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2">
          {/* Native Mobile Voice Recorder for iPhone & Android */}
          <input
            ref={mobileAudioInputRef}
            type="file"
            accept="audio/*"
            // @ts-ignore
            capture="microphone"
            onChange={handleMobileAudioUpload}
            className="hidden"
          />

          {/* Big Voice Mic Button (Live In-Browser) */}
          {!isRecording ? (
            <button
              onClick={handleStartVoice}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-40"
              title={isKu ? 'قسە بکە بە دەنگ (مایکی ڕاستەوخۆ)' : 'Speak with live mic'}
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleStopVoice}
              className="p-3 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all shrink-0 animate-pulse cursor-pointer"
              title={isKu ? 'ڕاگرتن و ناردنی دەنگ' : 'Stop & Send speech'}
            >
              <Square className="w-5 h-5 fill-white" />
            </button>
          )}

          {/* Mobile Native Mic Shortcut */}
          <button
            onClick={() => mobileAudioInputRef.current?.click()}
            disabled={isLoading || isRecording}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
            title={isKu ? 'مایکی مۆبایل (ئایفۆن و ئەندرۆید)' : 'Mobile Native Mic'}
          >
            <Smartphone className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputText);
            }}
            placeholder={
              isRecording
                ? isKu
                  ? `گوێت لێ دەگیرێت (${recordingSeconds} چرکە)...`
                  : `Listening (${recordingSeconds}s)...`
                : isKu
                ? 'بە دەنگ قسە بکە یان لێرە بنووسە...'
                : 'Speak with mic or type your response...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-emerald-400 transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
