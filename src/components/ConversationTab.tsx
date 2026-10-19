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
  Lock,
  ShoppingBag,
  Coins,
} from 'lucide-react';

interface ConversationTabProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  selectedVoice: string;
  voiceSpeed: number;
  coins?: number;
  unlockedScenarios?: string[];
  onUnlockScenario?: (trackKey: string, cost: number) => boolean;
  onOpenStore?: () => void;
}

export const ConversationTab: React.FC<ConversationTabProps> = ({
  uiLang,
  targetLang,
  selectedVoice,
  voiceSpeed,
  coins = 1000,
  unlockedScenarios = [],
  onUnlockScenario,
  onOpenStore,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [scenarioFilter, setScenarioFilter] = useState<'all' | 'hospital' | 'career' | 'academic' | 'daily'>('hospital');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [lockPromptScenario, setLockPromptScenario] = useState<Scenario | null>(null);
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
      targetLang === 'ar'
        ? (isKu ? sc.initialPromptKu : sc.initialPromptEn)
        : targetLang === 'ku'
        ? (isAr ? (sc.initialPromptAr || sc.initialPromptEn) : sc.initialPromptEn)
        : (isAr ? (sc.initialPromptAr || sc.initialPromptKu) : (isKu ? sc.initialPromptKu : sc.initialPromptKu));

    let dynamicReplies: { text: string; translation: string }[] = [];

    if (targetLang === 'ar') {
      if (sc.category === 'hospital') {
        dynamicReplies = [
          {
            text: 'أعاني من ألم حاد ومستمر في منطقة الصدر منذ صباح أمس.',
            translation: isKu ? 'لە بەیانی دوێنێوە ئازارێکی توند و کونکەری بەردەوامم لە سنگمدایە.' : 'I have sharp persistent chest pain since yesterday morning.',
          },
          {
            text: 'هل يمكنك توضيح الفحوصات والتحاليل المخبرية المطلوبة؟',
            translation: isKu ? 'دەتوانیت تکایە ڕوونی بکەیتەوە چ پشکنین و تاقیگەیەک پێویستە؟' : 'Could you explain the required diagnostic laboratory tests?',
          },
          {
            text: 'لدي حساسية معروفة تجاه البنسلين وأتناول علاجاً لضغط الدم.',
            translation: isKu ? 'هەستیاریم بە پێنسیلین هەیە و پێشتر دەرمانی پەستانی خوێنم بەکارهێناوە.' : 'I have an allergy to penicillin and take blood pressure medication.',
          },
        ];
      } else if (sc.category === 'career' || sc.category === 'academic') {
        dynamicReplies = [
          {
            text: 'في وظيفتي السابقة، قمت بقيادة فرق عمل متعددة لإنجاز مشاريع معقدة بنجاح.',
            translation: isKu ? 'لە کاری پێشوومدا سەرپەرشتی چەندین تیمی هاوبەشم کرد بۆ چارەسەری ئاستەنگەکان.' : 'In my previous position, I led cross-functional teams successfully.',
          },
          {
            text: 'هل يمكننا مراجعة بنود العقد والجدول الزمني لتسليم المشروع؟',
            translation: isKu ? 'ئایا دەتوانین پێداچوونەوە بە بەندەکانی گرێبەستەکەدا بکەین؟' : 'Can we review the contract terms and delivery timeline?',
          },
          {
            text: 'استندت منهجية بحثنا إلى جمع البيانات الميدانية والتحليل الأكاديمي الدقيق.',
            translation: isKu ? 'میتۆدۆلۆژیای توێژینەوەکەمان لەسەر بنەمای زانیاریی مەیدانی و شیکاری ئەکادیمی بوو.' : 'Our research methodology was based on field data and analysis.',
          },
        ];
      } else {
        dynamicReplies = [
          {
            text: 'هل يمكنك تزويدي بمزيد من التفاصيل حول الشروط والتكاليف؟',
            translation: isKu ? 'دەتوانیت تکایە وردەکاری زیاترم پێ بدەیت لەسەر مەرج و تێچوونەکان؟' : 'Could you give me more details about terms and costs?',
          },
          {
            text: 'أرغب في استكشاف المعالم التاريخية والثقافية في المدينة.',
            translation: isKu ? 'حەزم لێیە شوێنەوارە کولتوورییەکان و نەریتە ناوخۆییەکان بگەڕێم.' : 'I would like to explore the cultural and historical landmarks.',
          },
          {
            text: 'مرحباً، أتمنى أن يكون يومك ممتعاً ومثمراً للغاية.',
            translation: isKu ? 'سڵاو، هیوادارم ڕۆژێکی زۆر خۆش و بەرهەمدارت هەبێت.' : 'Hello, I hope you are having a wonderful and productive day.',
          },
        ];
      }
    } else if (sc.category === 'hospital') {
      dynamicReplies =
        targetLang === 'en'
          ? [
              {
                text: 'I have been experiencing sharp, persistent pain since yesterday morning.',
                translation: isAr ? 'أعاني من ألم حاد ومستمر منذ صباح الأمس.' : isKu ? 'لە بەیانی دوێنێوە ئازارێکی توند و کونکەری بەردەوامم هەیە.' : 'Sharp persistent pain since yesterday morning.',
              },
              {
                text: 'Could you please explain what diagnostic tests or scans are required?',
                translation: isAr ? 'هل يمكنك توضيح الفحوصات والتحاليل أو الأشعة المطلوبة؟' : isKu ? 'دەتوانیت تکایە ڕوونی بکەیتەوە چ پشکنینی تاقیگە یان تیشکێک پێویستە؟' : 'Explanation of required tests and scans.',
              },
              {
                text: 'I have a known allergy to penicillin and take asthma medication.',
                translation: isAr ? 'لدي حساسية معروفة للبنسلين وأتناول علاجاً للربو.' : isKu ? 'هەستیاریم بە پێنسیلین هەیە و پێشتر دەرمانی تەنگەنەفەسیم بەکارهێناوە.' : 'Allergy to penicillin and asthma medication.',
              },
            ]
          : [
              {
                text: 'نزیکەی دوو بۆ سێ ڕۆژە ئەم نیشانە توندەم هەیە و لەگەڵیدا هەست بە گێژبوون دەکەم.',
                translation: isAr ? 'أعاني من هذه الأعراض الحادة منذ يومين إلى ثلاثة وأشعر بالدوار.' : 'I have had this severe symptom for two or three days and feel dizzy.',
              },
              {
                text: 'ئایا پشکنینی خوێن یان تیشکی CT/MRI پێویستە بۆ دەستنیشانکردنی کێشەکە؟',
                translation: isAr ? 'هل يلزم إجراء فحص دم أو تصوير مقطعي/رنين مغناطيسي؟' : 'Are blood tests or CT/MRI imaging scans necessary to diagnose the issue?',
              },
              {
                text: 'ئەم دەرمانە چۆن دەبێت بەکاربهێندرێت و ئایا کاریگەری لاوەکی هەیە؟',
                translation: isAr ? 'كيف يتم تناول هذا الدواء وهل له آثار جانبية؟' : 'How should this medication be taken and does it cause any side effects?',
              },
            ];
    } else if (sc.category === 'career' || sc.category === 'academic') {
      dynamicReplies =
        targetLang === 'en'
          ? [
              {
                text: 'In my previous position, I spearheaded cross-functional teams to resolve complex challenges.',
                translation: isAr ? 'في وظيفتي السابقة، قدت فرق عمل لإنجاز أهداف معقدة.' : isKu ? 'لە کاری پێشوومدا سەرپەرشتی چەندین تیمی هاوبەشم کرد بۆ چارەسەری ئاستەنگە ئاڵۆزەکان.' : 'Led cross-functional teams to resolve complex challenges.',
              },
              {
                text: 'Could you walk me through the key deliverables and expectations for this milestone?',
                translation: isAr ? 'هل يمكنك شرح المخرجات الرئيسية والتوقعات لهذه المرحلة؟' : isKu ? 'دەتوانیت باسی ئامانج و چاوەڕوانییە سەرەکییەکان بکەیت بۆ ئەم قۆناغە؟' : 'Key deliverables and expectations for this milestone.',
              },
              {
                text: 'Based on our empirical analysis, the data strongly supports our primary hypothesis.',
                translation: isAr ? 'استناداً إلى تحليلنا التجريبي، تدعم البيانات فرضيتنا الأساسية.' : isKu ? 'بەپێی شیکارییەکانمان، زانیارییەکان بەهێزی پشتگیری لە گریمانە سەرەکییەکە دەکەن.' : 'Data strongly supports our primary hypothesis.',
              },
            ]
          : [
              {
                text: 'لە کاری پێشوومدا ئەزموونێکی بەرچاوم لە بەڕێوەبردنی پڕۆژە و سەرکردایەتی بەدەستهێنا.',
                translation: isAr ? 'في وظيفتي السابقة، اكتسبت خبرة واسعة في إدارة المشاريع والقيادة.' : 'In my previous role, I gained substantial experience in project management.',
              },
              {
                text: 'ئایا دەتوانین پێداچوونەوە بە بەندەکانی گرێبەستەکەدا بکەین بۆ گەیشتن بە ڕێککەوتن؟',
                translation: isAr ? 'هل يمكننا مراجعة بنود الاتفاقية للوصول إلى عقد متوازن؟' : 'Can we review the terms of the agreement?',
              },
              {
                text: 'میتۆدۆلۆژیای توێژینەوەکەمان لەسەر بنەمای کۆکردنەوەی زانیاریی مەیدانی و ئەکادیمی بوو.',
                translation: isAr ? 'اعتمدت منهجية بحثنا على جمع البيانات الميدانية والأكاديمية.' : 'Our research methodology was grounded in empirical data.',
              },
            ];
    } else {
      dynamicReplies =
        targetLang === 'en'
          ? [
              {
                text: 'Could you please provide more details regarding the terms and schedule?',
                translation: isAr ? 'هل يمكنك تزويدي بمزيد من التفاصيل حول الشروط والجدول الزمني؟' : isKu ? 'دەتوانیت تکایە وردەکاری زیاترم پێ بدەیت لەسەر مەرجەکان و کاتەکان؟' : 'More details regarding terms and schedule.',
              },
              {
                text: 'I would like to explore the cultural landmarks and local traditions.',
                translation: isAr ? 'أود استكشاف المعالم الثقافية والتراثية والتقاليد المحلية.' : isKu ? 'حەزم لێیە شوێنەوارە کولتوورییەکان و نەریتە ناوخۆییەکان بگەڕێم.' : 'Explore cultural landmarks and local traditions.',
              },
              {
                text: 'I am encountering a persistent system error and need troubleshooting steps.',
                translation: isAr ? 'أواجه خطأ تقنياً مستمراً في النظام وأحتاج لخطوات حل المشكلة.' : isKu ? 'ڕووبەڕووی هەڵەیەکی بەردەوامی سیستەم بوومەتەوە و پێویستم بە هەنگاوی چارەسەرە.' : 'Encountering persistent system error, need troubleshooting.',
              },
            ]
          : [
              {
                text: 'تکایە دەتوانیت زانیاری زیاترم لەسەر مەرجەکان و خزمەتگوزارییەکان پێ بدەیت؟',
                translation: isAr ? 'هل يمكنك تزويدي بمعلومات أكثر حول الشروط والخدمات من فضلك؟' : 'Could you please give me more details regarding the terms and services?',
              },
              {
                text: 'زۆر حەز دەکەم شوێنە مێژووییەکان و چێشتخانە نەریتییەکان بەسەربکەمەوە.',
                translation: isAr ? 'أرغب كثيراً في زيارة الأماكن التاريخية والمطاعم الشعبية.' : 'I would really like to visit the historic sights and traditional restaurants.',
              },
              {
                text: 'سڵاو، هیوادارم هەموو شتێک بەباشی و تەندروستی بەڕێوەبچێت.',
                translation: isAr ? 'مرحباً، أتمنى أن تسير جميع الأمور على ما يرام وبصحة تامة.' : 'Hello, I hope everything is proceeding smoothly and in good health.',
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
    const cleanText = textToSend.trim();
    if (!cleanText || isLoading) return;

    // Prevent duplicate addition of identical consecutive user message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'user' && lastMsg.content.trim() === cleanText) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanText,
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
          ? activeScenario.tutorRoleAr || 'د. أحمد'
          : activeScenario.tutorRoleKu || 'د. ئاراس';

      const scenarioTitle =
        isAr
          ? activeScenario.titleAr || activeScenario.titleEn
          : isKu
          ? activeScenario.titleKu
          : activeScenario.titleEn;

      const response = await chatWithTutor({
        messages: updated.map((m) => ({ role: m.role, content: m.content })),
        scenario: `${activeScenario.id}: ${scenarioTitle} - Role: ${tutorRole} (${activeScenario.descriptionEn})`,
        targetLanguage: targetLang,
        uiLanguage: uiLang,
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
      const isCar = activeScenario.category === 'career';
      const isAcad = activeScenario.category === 'academic';
      const isDai = activeScenario.category === 'daily' || activeScenario.category === 'travel';

      let fallbackReply = '';
      let fallbackTranslation = '';
      let fallbackReplies: { text: string; translation: string }[] = [];

      if (isCar) {
        fallbackReply =
          targetLang === 'en'
            ? "Thank you for explaining your approach. In our corporate strategy, cross-functional execution is crucial. How do you measure team velocity and project deliverables?"
            : targetLang === 'ar'
            ? "شكراً لتوضيح رؤيتك المهنية. في استراتيجيتنا المؤسسية، يعد تنفيذ المشاريع بتناغم أمراً حيوياً. كيف تقيس سرعة الأداء ومخرجات العمل؟"
            : "سوپاس بۆ خستنەڕووی ئەزموونی پیشەییت. لە ستراتیژی کاردا سەرکردایەتی تیم زۆر گرنگە. چۆن خێرایی ڕادەستکردنی پڕۆژە دەپێویت؟";

        fallbackTranslation =
          isAr
            ? "شكراً لتوضيح رؤيتك؛ كيف تقيس سرعة الأداء وجودة المخرجات؟"
            : isKu
            ? "سوپاس بۆ ڕوونکردنەوەکەت؛ چۆن خێرایی و کوالیتی پڕۆژەکان دەپێویت؟"
            : "Thank you for explaining; how do you measure velocity and deliverables?";

        fallbackReplies =
          targetLang === 'en'
            ? [
                { text: 'I track cycle velocity, sprint completion rates, and stakeholder satisfaction.', translation: isAr ? 'أقيس سرعة دورة العمل، ونسبة إنجاز المهام، ورضا أصحاب المصلحة.' : isKu ? 'خێرایی خولی کارکردن، ڕێژەی تەواوبوونی ئەرکەکان و ڕەزامەندی هاوبەشەکان دەپێوم.' : 'Track sprint completion rates and stakeholder satisfaction.' },
                { text: 'We maintain transparent communication to eliminate operational bottlenecks.', translation: isAr ? 'نحافظ على تواصل شفاف لإزالة أي معوقات تشغيلية.' : isKu ? 'پەیوەندیی شەفاف ڕادەگرین بۆ نەهێشتنی کێشە تەکنیکییەکان.' : 'Transparent communication eliminates operational bottlenecks.' },
                { text: 'Could we discuss the key milestones and KPIs for this quarter?', translation: isAr ? 'هل يمكننا مناقشة أهم الأهداف ومؤشرات الأداء لهذا الربع؟' : isKu ? 'دەتوانین باسی ئامانجە سەرەکییەکان و پێوەرەکانی ئەم وەرزە بکەین؟' : 'Discuss key milestones and KPIs for this quarter.' },
              ]
            : targetLang === 'ar'
            ? [
                { text: 'أعتمد على منهجية Agile ومتابعة مؤشرات الأداء ربع السنوية بدقة.', translation: isKu ? 'پشت بە میتۆدی Agile و پێوەرە سەرەکییەکان دەبەستم بە وردی.' : 'I rely on Agile methodologies and quarterly KPIs.' },
                { text: 'التواصل الشفاف مع الفريق يضمن تسليم المهام في المواعيد المحددة.', translation: isKu ? 'پەیوەندی شەفاف لەگەڵ تیم گەرەنتی ڕادەستکردن لە کاتی خۆیدا دەکات.' : 'Transparent team communication ensures timely delivery.' },
                { text: 'ما هي الأولويات الاستراتيجية الأكثر إلحاحاً للفترة القادمة؟', translation: isKu ? 'گرنگترین پێشینە ستراتیژییەکان بۆ قۆناغی داهاتوو چییە؟' : 'What are the most urgent strategic priorities?' },
              ]
            : [
                { text: 'بە دانانی پلانێکی خولاو و پێشینەدان بە کارەکان ئەنجام بەدەستدەهێنم.', translation: isAr ? 'أحقق الأهداف عبر وضع خطة دورية وتحديد الأولويات بدقة.' : 'I deliver results through iterative planning and prioritization.' },
                { text: 'پەیوەندیی بەردەوام و ڕوون لەگەڵ تیم ڕێگە لە هەڵە دەگرێت.', translation: isAr ? 'التواصل المستمر والواضح مع الفريق يمنع الأخطاء.' : 'Continuous and clear communication prevents mistakes.' },
                { text: 'گرنگترین پێوەرەکانی سەرکەوتن بۆ ئەم کارە چییە؟', translation: isAr ? 'ما هي أهم معايير النجاح لهذا المنصب؟' : 'What are the most critical success criteria for this role?' },
              ];
      } else if (isAcad) {
        fallbackReply =
          targetLang === 'en'
            ? "Your academic reasoning provides a solid perspective. Considering your methodology, how do your empirical findings address the primary research questions?"
            : targetLang === 'ar'
            ? "طرحك الأكاديمي يقدم رؤية علمية متماسكة. بالنظر إلى المنهجية المتبعة، كيف تجيب نتائجك الإحصائية عن الأسئلة البحثية الأساسية؟"
            : "بۆچوونی ئەکادیمیت بەهێزە. بە لەبەرچاوگرتنی میتۆدۆلۆژیاکەت، دەرەنجامە ئامارییەکانت چۆن وەڵامی پرسیارە سەرەکییەکانی توێژینەوەکەت دەدەنەوە؟";

        fallbackTranslation =
          isAr
            ? "طرحك الأكاديمي رصين؛ كيف تجيب بياناتك عن أسئلة الدراسة؟"
            : isKu
            ? "بۆچوونی ئەکادیمیت بەهێزە؛ داتاکانت چۆن وەڵامی پرسیارەکانی توێژینەوە دەدەنەوە؟"
            : "Your academic reasoning is solid; how do your findings answer the research questions?";

        fallbackReplies =
          targetLang === 'en'
            ? [
                { text: 'Our statistical regression demonstrates strong significance (p < 0.01).', translation: isAr ? 'أظهر تحليل الانحدار دلالة إحصائية قوية تدعم الفرضية.' : isKu ? 'شیکاریی ئاماریمان جیاوازییەکی واتاداری سەلماندووە (p < 0.01).' : 'Statistical regression demonstrates strong significance.' },
                { text: 'We triangulated qualitative interviews with quantitative survey datasets.', translation: isAr ? 'قمنا بمطابقة المقابلات النوعية مع استطلاعات الرأي الكمية.' : isKu ? 'چاوپێکەوتنی کەسی و ڕاپرسیی ئاماریمان بەیەکەوە بەکارهێنا بۆ دڵنیایی.' : 'Triangulated qualitative interviews with quantitative datasets.' },
                { text: 'What peer-reviewed publications would you recommend for our literature review?', translation: isAr ? 'ما هي المجلات المحكمة التي توصي بالرجوع إليها في الإطار النظري؟' : isKu ? 'چ سەرچاوەیەکی زانستیی نێودەوڵەتی پێشنیار دەکەیت بۆ ڕێبەری توێژینەوەکە؟' : 'Recommend peer-reviewed publications for our review.' },
              ]
            : targetLang === 'ar'
            ? [
                { text: 'أثبتت النتائج الإحصائية صحة الفرضية البديلة بدلالة واضحة.', translation: isKu ? 'ئەنجامە ئامارییەکان ڕاستیی گریمانەکەیان بە بەڵگەوە سەلماند.' : 'Statistical findings confirmed the alternative hypothesis.' },
                { text: 'اعتمدنا على عينة عشوائية ممثلة لمجتمع الدراسة بدقة.', translation: isKu ? 'پشتمان بە نموونەیەکی بەهەڕەمەکیی گونجاو بەست بۆ توێژینەوەکە.' : 'We relied on a representative random sampling strategy.' },
                { text: 'كيف تقيمون مساهمة هذا البحث في تطوير الأدبيات العلمية؟', translation: isKu ? 'ڕۆڵی ئەم توێژینەوەیە لە خزمەتکردنی زانستدا چۆن هەڵدەسەنگێنن؟' : 'How do you evaluate this study contribution to literature?' },
              ]
            : [
                { text: 'شیکارییە ئامارییەکان بە تەواوی پشتیوانی لە گریمانەکەمان دەکەن.', translation: isAr ? 'التحليلات الإحصائية تدعم فرضيتنا بالكامل.' : 'Statistical analysis fully supports our hypothesis.' },
                { text: 'داتای توێژینەوەکە لە چەندین سەرچاوەی باوەڕپێکراوەوە کۆکراوەتەوە.', translation: isAr ? 'تم جمع بيانات الدراسة من مصادر موثوقة متعددة.' : 'Study data was gathered from multiple verified sources.' },
                { text: 'پێشنیاری بەڕێزتان چییە بۆ بڵاوکردنەوەی ئەم بابەتە لە زانکۆ؟', translation: isAr ? 'ما هي نصيحتكم لنشر هذا البحث في الدوريات الجامعية؟' : 'What is your advice for university publication?' },
              ];
      } else if (isDai) {
        fallbackReply =
          targetLang === 'en'
            ? "Understood perfectly. Let us proceed with the practical details: what specific preferences or requirements do you have for this arrangement?"
            : targetLang === 'ar'
            ? "فهمت ما تفضلت به تماماً. دعنا نتابع التفاصيل: ما هي الشروط أو التفضيلات الخاصة التي ترغب في توفيرها؟"
            : "تەواو تێگەیشتم. با بچینە ناو وردەکارییەکانەوە: چ داواکاری یان مەرجێکی تایبەتت هەیە بۆ ئەم بابەتە؟";

        fallbackTranslation =
          isAr
            ? "فهمت رغبتك بدقة؛ ما هي متطلباتك الإضافية المفضلة؟"
            : isKu
            ? "تەواو تێگەیشتم؛ چ مەرج یان داواکارییەکی تایبەتت هەیە؟"
            : "Understood; what specific preferences do you require?";

        fallbackReplies =
          targetLang === 'en'
            ? [
                { text: 'Could you clarify the total fees and maintenance responsibilities?', translation: isAr ? 'هل يمكنك توضيح التكاليف الكلية ومسؤوليات الصيانة؟' : isKu ? 'دەتوانیت تکایە تێچوونی گشتی و چاککردنەوەی کێشەکان ڕوون بکەیتەوە؟' : 'Clarify total fees and maintenance responsibilities.' },
                { text: 'I am ready to finalize the booking and confirm the schedule.', translation: isAr ? 'أنا جاهز لإتمام الحجز وتأكيد المواعيد فوراً.' : isKu ? 'من ئامادەم بۆ تەواوکردنی ڕێککەوتنەکە و دیاریکردنی کاتەکە.' : 'Ready to finalize booking and confirm schedule.' },
                { text: 'Are there any alternative options or flexible time slots available?', translation: isAr ? 'هل تتوفر أي خيارات بديلة أو مواعيد مرنة أخرى؟' : isKu ? 'ئایا هیچ بژاردەیەکی تر یان کاتی گونجاوتر هەیە؟' : 'Alternative options or flexible time slots.' },
              ]
            : targetLang === 'ar'
            ? [
                { text: 'أود الاستفسار عن الشروط ومسؤوليات الصيانة بدقة.', translation: isKu ? 'دەمەوێت لەسەر مەرجەکان و بەرپرسیارییەتی چاککردنەوە بپرسم.' : 'I would like to inquire about terms and maintenance.' },
                { text: 'أنا مستعد لتأكيد الموعد وإتمام الإجراءات اللازمة.', translation: isKu ? 'ئامادەم بۆ پەسەندکردنی کاتەکە و تەواوکردنی ڕێکارەکان.' : 'I am ready to confirm the appointment and finalize steps.' },
                { text: 'هل هناك خيارات أخرى تناسب جدول أوقاتي بشكل أفضل؟', translation: isKu ? 'ئایا هیچ بژاردەیەکی تر هەیە کە لەگەڵ کاتمدا زیاتر بگونجێت؟' : 'Are there other options that fit my schedule better?' },
              ]
            : [
                { text: 'دەمەوێت وردەکاری زیاتر لەسەر تێچوون و مەرجەکان بزانم.', translation: isAr ? 'أرغب في معرفة مزيد من التفاصيل عن التكلفة والشروط.' : 'I would like more details on costs and conditions.' },
                { text: 'ئامادەم بۆ پەسەندکردن و دیاریکردنی کاتی دەستپێکردن.', translation: isAr ? 'مستعد لتأكيد الموعد وتحديد وقت البدء.' : 'Ready to confirm and schedule the start date.' },
                { text: 'ئایا ڕێنماییەکی تایبەت هەیە پێویست بێت ڕەچاوی بکەم؟', translation: isAr ? 'هل توجد أي إرشادات خاصة يجب علي مراعاتها؟' : 'Are there any specific guidelines I should adhere to?' },
              ];
      } else {
        fallbackReply =
          targetLang === 'en'
            ? "I understand your clinical response. Let us continue to monitor your condition closely; can you elaborate on any additional symptoms you felt?"
            : targetLang === 'ar'
            ? "أفهم ملاحظتك السريرية بدقة. دعنا نواصل متابعة حالتك بعناية؛ هل يمكنك توضيح أي أعراض إضافية شعرت بها؟"
            : "بە تەواوی لە وەسفەکەت تێگەیشتم. با بە وریاییەوە چاودێری دۆخەکەت بکەین؛ دەتوانیت باسی هەر نیشانەیەکی تریش بکەیت کە هەستت پێکردووە؟";

        fallbackTranslation =
          isAr
            ? "أفهم ملاحظتك السريرية بدقة؛ سنواصل المتابعة بعناية."
            : isKu
            ? "لە وەسفەکەت گەیشتم. با بەردەوام چاودێری بکەین؛ هیچ نیشانەیەکی ترت هەبووە؟"
            : "I understand your response; let us monitor your condition closely.";

        fallbackReplies =
          targetLang === 'en'
            ? [
                { text: 'I noticed mild fatigue and slight dizziness this morning.', translation: isAr ? 'شعرت ببعض الإرهاق والدوار الخفيف صباح اليوم.' : isKu ? 'بەیانی ئەمڕۆ هەستم بە کەمێک ماندوێتی و سەرگیژە کرد.' : 'Mild fatigue and slight dizziness this morning.' },
                { text: 'My vital signs feel relatively stable right now.', translation: isAr ? 'المؤشرات الحيوية تبدو مستقرة حالياً.' : isKu ? 'نیشانە سەرەکییەکانم لە ئێستادا تا ڕادەیەک جێگیرن.' : 'Vital signs feel relatively stable right now.' },
                { text: 'Could you explain the recommended diagnostic steps?', translation: isAr ? 'هل يمكنك توضيح خطوات التشخيص الموصى بها؟' : isKu ? 'دەتوانیت تکایە هەنگاوەکانی پشکنین ڕوون بکەیتەوە؟' : 'Explain recommended diagnostic steps.' },
              ]
            : targetLang === 'ar'
            ? [
                { text: 'شعرت ببعض الإرهاق والدوار الخفيف صباح اليوم.', translation: isAr ? 'شعرت ببعض الإرهاق والدوار الخفيف صباح اليوم.' : isKu ? 'بەیانی هەستم بە کەمێک ماندووبوون و سەرگێژخواردن کرد.' : 'I felt mild fatigue and slight dizziness this morning.' },
                { text: 'المؤشرات الحيوية تبدو مستقرة نسبياً في الوقت الحالي.', translation: isAr ? 'المؤشرات الحيوية تبدو مستقرة نسبياً في الوقت الحالي.' : isKu ? 'نیشانە سەرەکییەکان لە ئێستادا تا ڕادەیەک جێگیرن.' : 'Vitals appear relatively stable right now.' },
                { text: 'هل يمكنك توضيح الخطوات التشخيصية القادمة؟', translation: isAr ? 'هل يمكنك توضيح الخطوات التشخيصية القادمة؟' : isKu ? 'دەتوانیت هەنگاوەکانی داهاتووی پشکنین ڕوون بکەیتەوە؟' : 'Could you explain upcoming diagnostic steps?' },
              ]
            : [
                { text: 'بەیانی ئەمڕۆ هەستم بە کەمێک ماندووبوون و گێژبوون کرد.', translation: isAr ? 'شعرت ببعض الإرهاق والدوار صباح اليوم.' : 'I felt mild fatigue and lightheadedness this morning.' },
                { text: 'نیشانە سەرەکییەکانم لە ئێستادا تا ڕادەیەک جێگیر دیارن.', translation: isAr ? 'علاماتي الحيوية تبدو مستقرة حالياً.' : 'My vital signs appear relatively stable right now.' },
                { text: 'پێشنیاری بەڕێزتان چییە بۆ قۆناغی داهاتووی چارەسەر؟', translation: isAr ? 'ما هي توصيتكم السريرية للمرحلة التالية؟' : 'What is your clinical recommendation for the next step?' },
              ];
      }

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
        titleKu: 'قۆناغی ١: فریاکەوتنی خێرا و وەرگرتنی سکاڵای نەخۆش',
        titleEn: 'Phase 1: ER Triage & Acute Complaint Assessment',
        titleAr: 'المرحلة 1: فرز الحالات والشكوى السريرية الأساسية',
        color: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
      };
    }
    if (turns <= 6) {
      return {
        phase: 2,
        titleKu: 'قۆناغی ٢: پشکنینی جەستەیی و تۆمارکردنی نیشانەکان',
        titleEn: 'Phase 2: Systematic Vitals & Physical Examination',
        titleAr: 'المرحلة 2: العلامات الحيوية والفحص السريري الدقيق',
        color: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
      };
    }
    if (turns <= 12) {
      return {
        phase: 3,
        titleKu: 'قۆناغی ٣: پشکنینی تاقیگە و تیشکگریی ورد',
        titleEn: 'Phase 3: Lab Biomarkers & Diagnostic Imaging',
        titleAr: 'المرحلة 3: التحاليل المخبرية والتصوير الشعاعي والرنين',
        color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
      };
    }
    if (turns <= 20) {
      return {
        phase: 4,
        titleKu: 'قۆناغی ٤: دەستنیشانکردنی جیاکاریی نەخۆشی و ڕاوێژی پسپۆڕ',
        titleEn: 'Phase 4: Differential Diagnosis & Specialist Consult',
        titleAr: 'المرحلة 4: التشخيص التفريقي والاستشارة التخصصية',
        color: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
      };
    }
    if (turns <= 35) {
      return {
        phase: 5,
        titleKu: 'قۆناغی ٥: چارەسەری دەرمانی و چاودێریی ناوخۆیی',
        titleEn: 'Phase 5: Inpatient Care & Targeted Pharmacotherapy',
        titleAr: 'المرحلة 5: الرعاية السريرية والعلاج الدوائي المتقدم',
        color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
      };
    }
    if (turns <= 60) {
      return {
        phase: 6,
        titleKu: 'قۆناغی ٦: چاودێریی چڕ و بەدواداچوونی نەشتەرگەری',
        titleEn: 'Phase 6: Procedural Care & Intensive Clinical Rounds',
        titleAr: 'المرحلة 6: الإجراءات العلاجية ومتابعة العناية المركزة',
        color: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
      };
    }
    return {
      phase: 7,
      titleKu: `قۆناغی بەردەوام: چاودێریی پزیشکیی درێژخایەن (خولی #${turns})`,
      titleEn: `Continuous Long-Term Care & Medical Follow-up (Infinite Phase - Turn #${turns})`,
      titleAr: `المتابعة الطبية السريرية المستمرة بلا نهاية (جولة #${turns})`,
      color: 'text-teal-300 border-teal-500/50 bg-teal-500/20',
    };
  };

  const getScenarioPhase = (category: string | undefined, turns: number) => {
    if (category === 'career') {
      if (turns <= 2) {
        return {
          titleKu: 'قۆناغی ١: ناساندنی ئەزموونی پیشەیی و دەستپێکی چاوپێکەوتن',
          titleEn: 'Phase 1: Professional Background & Resume Introduction',
          titleAr: 'المرحلة 1: استعراض السيرة الذاتية والخبرات المهنية',
          color: 'text-blue-300 border-blue-500/40 bg-blue-500/10',
          turnTitle: isKu ? `خولی کار: #${turns + 1}` : isAr ? `الجولة المهنية: #${turns + 1}` : `Business Turn #${turns + 1}`,
          categoryTitle: isKu ? 'چاوپێکەوتن و دانوستانی بازرگانیی نێودەوڵەتی' : isAr ? 'الأعمال والتفاوض التجاري المتقدم' : 'Corporate Business & Negotiation',
          icon: <Briefcase className="w-4 h-4 text-blue-300 animate-pulse" />,
        };
      }
      if (turns <= 5) {
        return {
          titleKu: 'قۆناغی ٢: لێهاتوویی پیشەیی، میتۆدی کارکردن و چارەسەری ئاستەنگەکان',
          titleEn: 'Phase 2: Competency Questions & Problem-Solving Scenarios',
          titleAr: 'المرحلة 2: الكفاءة الإدارية وحل المشكلات التنفيذية',
          color: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
          turnTitle: isKu ? `خولی کار: #${turns + 1}` : isAr ? `الجولة المهنية: #${turns + 1}` : `Business Turn #${turns + 1}`,
          categoryTitle: isKu ? 'چاوپێکەوتن و دانوستانی بازرگانیی نێودەوڵەتی' : isAr ? 'الأعمال والتفاوض التجاري المتقدم' : 'Corporate Business & Negotiation',
          icon: <Briefcase className="w-4 h-4 text-blue-300 animate-pulse" />,
        };
      }
      if (turns <= 10) {
        return {
          titleKu: 'قۆناغی ٣: دیدگای ستراتیژی، پێوەرەکانی KPIs و هاوبەشیی بازرگانی',
          titleEn: 'Phase 3: Strategic Vision, Velocity KPIs & Partnership Milestones',
          titleAr: 'المرحلة 3: الرؤية الاستراتيجية ومؤشرات الأداء والشراكات',
          color: 'text-teal-300 border-teal-500/40 bg-teal-500/10',
          turnTitle: isKu ? `خولی کار: #${turns + 1}` : isAr ? `الجولة المهنية: #${turns + 1}` : `Business Turn #${turns + 1}`,
          categoryTitle: isKu ? 'چاوپێکەوتن و دانوستانی بازرگانیی نێودەوڵەتی' : isAr ? 'الأعمال والتفاوض التجاري المتقدم' : 'Corporate Business & Negotiation',
          icon: <Briefcase className="w-4 h-4 text-blue-300 animate-pulse" />,
        };
      }
      return {
        titleKu: `قۆناغی ٤: دانوستانی گرێبەست، بەندەکانی SLA و ڕێککەوتنی کۆتایی (خولی #${turns})`,
        titleEn: `Phase 4: Contract Negotiation, SLA Terms & Deal Finalization (Turn #${turns})`,
        titleAr: `المرحلة 4: بنود العقود والشروط وتأكيد الاتفاق النهائي (جولة #${turns})`,
        color: 'text-indigo-300 border-indigo-500/40 bg-indigo-500/10',
        turnTitle: isKu ? `خولی کار: #${turns + 1}` : isAr ? `الجولة المهنية: #${turns + 1}` : `Business Turn #${turns + 1}`,
        categoryTitle: isKu ? 'چاوپێکەوتن و دانوستانی بازرگانیی نێودەوڵەتی' : isAr ? 'الأعمال والتفاوض التجاري المتقدم' : 'Corporate Business & Negotiation',
        icon: <Briefcase className="w-4 h-4 text-blue-300 animate-pulse" />,
      };
    }

    if (category === 'academic') {
      if (turns <= 2) {
        return {
          titleKu: 'قۆناغی ١: دەستپێکی سیمینار و پێشکەشکردنی کێشەی توێژینەوە',
          titleEn: 'Phase 1: Research Abstract & Problem Statement',
          titleAr: 'المرحلة 1: طرح الإشكالية العلمية والفرضية الأساسية',
          color: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
          turnTitle: isKu ? `خولی ئەکادیمی: #${turns + 1}` : isAr ? `الجولة الأكاديمية: #${turns + 1}` : `Academic Turn #${turns + 1}`,
          categoryTitle: isKu ? 'سیمیناری زانکۆ و گەنگەشەی زانستی' : isAr ? 'الندوة الجامعية والمناقشة العلمية الرصينة' : 'University Graduate Seminar',
          icon: <GraduationCap className="w-4 h-4 text-purple-300 animate-pulse" />,
        };
      }
      if (turns <= 5) {
        return {
          titleKu: 'قۆناغی ٢: بەرگریکردن لە میتۆدۆلۆژیا، نموونە و کۆکردنەوەی داتا',
          titleEn: 'Phase 2: Research Methodology & Sampling Instrument Defense',
          titleAr: 'المرحلة 2: الدفاع عن المنهجية العلمية وأدوات جمع البيانات',
          color: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
          turnTitle: isKu ? `خولی ئەکادیمی: #${turns + 1}` : isAr ? `الجولة الأكاديمية: #${turns + 1}` : `Academic Turn #${turns + 1}`,
          categoryTitle: isKu ? 'سیمیناری زانکۆ و گەنگەشەی زانستی' : isAr ? 'الندوة الجامعية والمناقشة العلمية الرصينة' : 'University Graduate Seminar',
          icon: <GraduationCap className="w-4 h-4 text-purple-300 animate-pulse" />,
        };
      }
      if (turns <= 10) {
        return {
          titleKu: 'قۆناغی ٣: شیکاری ئاماری، دەرەنجامەکان و بەراوردکاری تیۆری',
          titleEn: 'Phase 3: Statistical Findings, Correlation & Paradigm Discussion',
          titleAr: 'المرحلة 3: التحليل الإحصائي ومناقشة الدلالات العلمية',
          color: 'text-violet-300 border-violet-500/40 bg-violet-500/10',
          turnTitle: isKu ? `خولی ئەکادیمی: #${turns + 1}` : isAr ? `الجولة الأكاديمية: #${turns + 1}` : `Academic Turn #${turns + 1}`,
          categoryTitle: isKu ? 'سیمیناری زانکۆ و گەنگەشەی زانستی' : isAr ? 'الندوة الجامعية والمناقشة العلمية الرصينة' : 'University Graduate Seminar',
          icon: <GraduationCap className="w-4 h-4 text-purple-300 animate-pulse" />,
        };
      }
      return {
        titleKu: `قۆناغی ٤: وەڵامدانەوەی ڕەخنە و دەرەنجامی کۆتایی سیمینار (خولی #${turns})`,
        titleEn: `Phase 4: Counter-Arguments, Academic Conclusion & Publication (Turn #${turns})`,
        titleAr: `المرحلة 4: الرد على المناقشين والتوصيات النهائية للنشر (جولة #${turns})`,
        color: 'text-pink-300 border-pink-500/40 bg-pink-500/10',
        turnTitle: isKu ? `خولی ئەکادیمی: #${turns + 1}` : isAr ? `الجولة الأكاديمية: #${turns + 1}` : `Academic Turn #${turns + 1}`,
        categoryTitle: isKu ? 'سیمیناری زانکۆ و گەنگەشەی زانستی' : isAr ? 'الندوة الجامعية والمناقشة العلمية الرصينة' : 'University Graduate Seminar',
        icon: <GraduationCap className="w-4 h-4 text-purple-300 animate-pulse" />,
      };
    }

    if (category === 'daily' || category === 'travel') {
      if (turns <= 2) {
        return {
          titleKu: 'قۆناغی ١: دەستپێکی پەیوەندی، سڵاو و پرسیارە سەرەکییەکان',
          titleEn: 'Phase 1: Practical Introduction & Core Service Inquiries',
          titleAr: 'المرحلة 1: التحية وطلب الخدمات والاستفسار الأساسي',
          color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
          turnTitle: isKu ? `خولی گفتوگۆ: #${turns + 1}` : isAr ? `الجولة اليومية: #${turns + 1}` : `Dialogue Turn #${turns + 1}`,
          categoryTitle: isKu ? 'گفتوگۆی ژیانی ڕۆژانە، خزمەتگوزاری و گەشت' : isAr ? 'حوارات الحياة اليومية والسياحة والخدمات' : 'Daily Life & Practical Services',
          icon: <Compass className="w-4 h-4 text-cyan-300 animate-pulse" />,
        };
      }
      if (turns <= 5) {
        return {
          titleKu: 'قۆناغی ٢: دانوستان لەسەر مەرجەکان، تێچوون و تایبەتمەندییەکان',
          titleEn: 'Phase 2: Terms, Preferences, Costs & Problem Solving',
          titleAr: 'المرحلة 2: توضيح الشروط والأسعار والترتيبات المفضلة',
          color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
          turnTitle: isKu ? `خولی گفتوگۆ: #${turns + 1}` : isAr ? `الجولة اليومية: #${turns + 1}` : `Dialogue Turn #${turns + 1}`,
          categoryTitle: isKu ? 'گفتوگۆی ژیانی ڕۆژانە، خزمەتگوزاری و گەشت' : isAr ? 'حوارات الحياة اليومية والسياحة والخدمات' : 'Daily Life & Practical Services',
          icon: <Compass className="w-4 h-4 text-cyan-300 animate-pulse" />,
        };
      }
      return {
        titleKu: `قۆناغی ٣: گەیشتن بە ڕێککەوتن، جێبەجێکردن و تەواوکردنی گفتوگۆ (خولی #${turns})`,
        titleEn: `Phase 3: Agreement Confirmation & Practical Follow-Through (Turn #${turns})`,
        titleAr: `المرحلة 3: تأكيد الاتفاق وإتمام الإجراءات بنجاح (جولة #${turns})`,
        color: 'text-teal-300 border-teal-500/40 bg-teal-500/10',
        turnTitle: isKu ? `خولی گفتوگۆ: #${turns + 1}` : isAr ? `الجولة اليومية: #${turns + 1}` : `Dialogue Turn #${turns + 1}`,
        categoryTitle: isKu ? 'گفتوگۆی ژیانی ڕۆژانە، خزمەتگوزاری و گەشت' : isAr ? 'حوارات الحياة اليومية والسياحة والخدمات' : 'Daily Life & Practical Services',
        icon: <Compass className="w-4 h-4 text-cyan-300 animate-pulse" />,
      };
    }

    // Default to Medical/Hospital
    const clinical = getClinicalPhase(turns);
    return {
      titleKu: clinical.titleKu,
      titleEn: clinical.titleEn,
      titleAr: clinical.titleAr,
      color: clinical.color,
      turnTitle: isKu ? `خولی پزیشکی: #${turns + 1}` : isAr ? `الجولة السريرية: #${turns + 1}` : `Clinical Turn #${turns + 1}`,
      categoryTitle: isKu ? 'گفتوگۆی پزیشکیی بێ کۆتا (تەلاری نەخۆشخانە)' : isAr ? 'محادثة المستشفى السريرية بلا نهاية' : 'Infinite Hospital Ward & Clinical Journey',
      icon: <Infinity className="w-4 h-4 text-teal-300 animate-pulse" />,
    };
  };

  const currentScenarioPhase = getScenarioPhase(activeScenario.category, userTurnsCount);

  const filteredScenarios = SCENARIOS.filter((sc) => {
    if (scenarioFilter === 'hospital') return sc.category === 'hospital';
    if (scenarioFilter === 'career') return sc.category === 'career';
    if (scenarioFilter === 'academic') return sc.category === 'academic';
    if (scenarioFilter === 'daily') return sc.category === 'daily' || sc.category === 'travel';
    return true;
  });

  const getTrackCategoryKey = (category?: string) => {
    if (!category) return null;
    if (category === 'hospital') return 'hospital';
    if (category === 'career') return 'business';
    if (category === 'academic') return 'academic';
    if (category === 'daily' || category === 'travel') return 'daily';
    return null;
  };

  const isTrackLocked = (category?: string) => {
    // All categories are fully unlocked and accessible by default
    const key = getTrackCategoryKey(category);
    if (!key) return false;
    if (unlockedScenarios.length === 0) return false;
    return !unlockedScenarios.includes(key);
  };

  const getTrackCost = (category?: string) => {
    if (category === 'hospital') return 400;
    if (category === 'career') return 350;
    if (category === 'academic') return 300;
    return 0;
  };

  const handleSelectScenario = (sc: Scenario) => {
    if (isTrackLocked(sc.category)) {
      setLockPromptScenario(sc);
      return;
    }
    setActiveScenario(sc);
  };

  const handleCategoryFilterClick = (cat: 'hospital' | 'career' | 'academic' | 'daily' | 'all') => {
    setScenarioFilter(cat);
    if (cat === 'all') return;
    const targetSc = SCENARIOS.find((s) => {
      if (cat === 'hospital') return s.category === 'hospital';
      if (cat === 'career') return s.category === 'career';
      if (cat === 'academic') return s.category === 'academic';
      if (cat === 'daily') return s.category === 'daily' || s.category === 'travel';
      return false;
    });
    if (targetSc && targetSc.id !== activeScenario.id) {
      setActiveScenario(targetSc);
    }
  };

  const handleConfirmUnlock = (sc: Scenario) => {
    const trackKey = getTrackCategoryKey(sc.category);
    const cost = getTrackCost(sc.category);
    if (!trackKey || cost === 0) return;

    if (coins < cost) {
      if (onOpenStore) {
        onOpenStore();
        setLockPromptScenario(null);
      }
      return;
    }

    if (onUnlockScenario) {
      const ok = onUnlockScenario(trackKey, cost);
      if (ok) {
        setActiveScenario(sc);
        setLockPromptScenario(null);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Scenarios Section with Filter Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-200">
              {isAr ? 'اختر سيناريو المحادثة التخصصية:' : isKu ? 'بواری گفتوگۆی پسپۆڕی هەڵبژێرە:' : 'Select Specialized Conversation Scenario:'}
            </span>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'حالات سريرية في المستشفى، صفقات تجارية، مناقشات أكاديمية، ومواقف الحياة اليومية'
                : isKu
                ? 'گفتوگۆی فراوانی پزیشکی و نەخۆشخانە، بازرگانی، ئەکادیمی و زانستی، و گفتوگۆی ڕۆژانە'
                : 'In-depth hospital clinical rounds, commercial negotiations, academic dissertations, and daily interactions'}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 self-start sm:self-auto">
            {isAr ? 'المحاور الصوتي: ' : isKu ? 'هاوڕێی دەنگی: ' : 'Voice Partner: '}
            <span className="text-emerald-400 font-bold">
              {isAr
                ? activeScenario.tutorRoleAr || activeScenario.tutorRoleEn || 'د. أحمد'
                : isKu
                ? activeScenario.tutorRoleKu || 'د. ئاراس'
                : activeScenario.tutorRoleEn || 'Dr. Arthur'}
            </span>
          </span>
        </div>

        {/* Category Filter Pills Across 4 Major Mandated Domains */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => handleCategoryFilterClick('hospital')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'hospital'
                ? 'bg-red-500/20 text-red-300 border border-red-500/60 shadow-sm shadow-red-950/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-red-400" />
            <span>{isAr ? 'المستشفى والطب (10)' : isKu ? 'پزیشکی و نەخۆشخانە (١٠)' : 'Medical & Hospital (10)'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-200 font-bold">B1-C1</span>
          </button>

          <button
            onClick={() => handleCategoryFilterClick('career')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'career'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/60 shadow-sm shadow-blue-950/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'الأعمال والتجارة (4)' : isKu ? 'بازرگانی و کار (٤)' : 'Business & Trade (4)'}</span>
          </button>

          <button
            onClick={() => handleCategoryFilterClick('academic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'academic'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-sm shadow-purple-950/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAr ? 'الأكاديميا والبحوث (3)' : isKu ? 'ئەکادیمی و زانستی (٣)' : 'Academic & Research (3)'}</span>
          </button>

          <button
            onClick={() => handleCategoryFilterClick('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'daily'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'الحياة اليومية والخدمات (8)' : isKu ? 'گفتوگۆی ڕۆژانە (٨)' : 'Daily Life & Services (8)'}</span>
          </button>

          <button
            onClick={() => handleCategoryFilterClick('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              scenarioFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-600'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{isAr ? `الكل (${SCENARIOS.length})` : isKu ? `هەموو (${SCENARIOS.length})` : `All (${SCENARIOS.length})`}</span>
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {filteredScenarios.map((sc) => {
            const isSelected = sc.id === activeScenario.id;
            const isLocked = isTrackLocked(sc.category);
            const cost = getTrackCost(sc.category);

            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/40'
                    : isLocked
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80 hover:opacity-100 hover:border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    {renderScenarioIcon(sc.icon)}
                  </div>
                  <div className="flex items-center gap-1">
                    {isLocked ? (
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{cost} 🪙</span>
                      </span>
                    ) : (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        sc.difficulty === 'B1-B2'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {sc.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {isAr ? sc.titleAr || sc.titleEn : isKu ? sc.titleKu : sc.titleEn}
                  </div>
                  {(sc.tutorRoleKu || sc.tutorRoleAr) && (
                    <div className="text-[10px] text-teal-400/90 truncate mt-0.5">
                      {isAr ? sc.tutorRoleAr || sc.tutorRoleEn : isKu ? sc.tutorRoleKu : sc.tutorRoleEn}
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
                  {isAr
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
                    {isAr
                      ? activeScenario.tutorRoleAr || activeScenario.tutorRoleEn
                      : isKu
                      ? activeScenario.tutorRoleKu
                      : activeScenario.tutorRoleEn}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {isAr
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

        {/* Dynamic Category Progress & Zero-Repetition Interactive Banner */}
        <div className="bg-gradient-to-r from-slate-950/60 via-slate-900 to-slate-950/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 shrink-0 shadow-inner">
              {currentScenarioPhase.icon}
            </span>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-xs font-bold text-slate-100">
                {currentScenarioPhase.categoryTitle}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-300 font-bold">
                {currentScenarioPhase.turnTitle}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${currentScenarioPhase.color}`}>
                {isKu ? currentScenarioPhase.titleKu : isAr ? currentScenarioPhase.titleAr : currentScenarioPhase.titleEn}
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
                          {isAr
                            ? activeScenario.tutorRoleAr || activeScenario.tutorRoleEn || 'د. أحمد'
                            : isKu
                            ? activeScenario.tutorRoleKu || 'د. ئاراس'
                            : activeScenario.tutorRoleEn || 'Dr. Arthur'}
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
                        <span>{isPlaying ? (isAr ? 'تشغيل...' : isKu ? 'پەخشکردن...' : 'Playing...') : isAr ? 'استماع' : isKu ? 'دەنگ' : 'Listen'}</span>
                      </button>
                    </div>
                  )}

                  {/* Message main content */}
                  <p
                    dir={targetLang === 'en' ? 'ltr' : 'rtl'}
                    style={{ direction: targetLang === 'en' ? 'ltr' : 'rtl', textAlign: targetLang === 'en' ? 'left' : 'right' }}
                    className={`text-sm sm:text-base leading-relaxed font-medium ${
                      targetLang === 'en' ? 'force-ltr text-left' : 'force-rtl text-right'
                    }`}
                  >
                    {msg.content}
                  </p>

                  {/* Translation & Phonetic helper */}
                  {isTutor && msg.translation && msg.translation.trim().toLowerCase() !== msg.content.trim().toLowerCase() && (
                    <div
                      dir={isKu || isAr ? 'rtl' : 'ltr'}
                      style={{ direction: isKu || isAr ? 'rtl' : 'ltr', textAlign: isKu || isAr ? 'right' : 'left' }}
                      className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 force-rtl text-right"
                    >
                      <div className="text-xs text-slate-400 flex items-center justify-start gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="force-rtl">{msg.translation}</span>
                      </div>
                      {msg.phoneticHint && (
                        <div
                          dir="ltr"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                          className="text-[11px] text-emerald-400/80 font-mono force-ltr text-left"
                        >
                          {msg.phoneticHint}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Instant gentle grammar tip if user made a slip */}
                {msg.correctionTip && msg.correctionTip.betterWay && (
                  <div className="max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'توجيه لصياغة أكثر دقة وطبيعية:' : isKu ? 'ڕێنمایی بۆ دەربڕینی سروشتیتر:' : 'Natural phrasing tip:'}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-400 text-[11px]">
                        {isAr ? 'الأفضل أن تقول:' : isKu ? 'باشترە بەم شێوازە بڵێیت:' : 'Better way:'}
                      </div>
                      <div
                        dir="ltr"
                        style={{ direction: 'ltr', textAlign: 'left' }}
                        className="text-emerald-300 font-bold text-xs p-1.5 rounded-lg bg-slate-950/90 border border-emerald-500/30 force-ltr text-left"
                      >
                        "{msg.correctionTip.betterWay}"
                      </div>
                    </div>
                    {msg.correctionTip.explanationKurdish && (
                      <div dir="rtl" className="text-[11px] text-slate-400 force-rtl text-right">
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
                        {isAr ? 'يمكنك التمرن على أحد الردود التالية:' : isKu ? 'دەتوانیت یەکێک لەم وەڵامانە بڵێیتەوە:' : 'Suggested responses to practice speaking:'}
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
                              className="px-3 py-2 text-xs text-slate-300 hover:text-emerald-300 flex-1 flex flex-col gap-1 cursor-pointer"
                            >
                              <span
                                dir={targetLang === 'en' ? 'ltr' : 'rtl'}
                                style={{ direction: targetLang === 'en' ? 'ltr' : 'rtl', textAlign: targetLang === 'en' ? 'left' : 'right' }}
                                className={`font-semibold group-hover:text-emerald-300 ${
                                  targetLang === 'en' ? 'force-ltr text-left' : 'force-rtl text-right'
                                }`}
                              >
                                🗣️ "{reply.text}"
                              </span>
                              {reply.translation && reply.translation.trim().toLowerCase() !== reply.text.trim().toLowerCase() && (
                                <span
                                  dir="rtl"
                                  style={{ direction: 'rtl', textAlign: 'right' }}
                                  className="text-[10px] text-slate-500 group-hover:text-slate-400 pt-0.5 border-t border-slate-900/60 force-rtl text-right"
                                >
                                  {reply.translation}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playTutorAudio(`suggestion-${i}`, reply.text);
                              }}
                              className="px-2.5 flex items-center justify-center bg-slate-900/60 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border-l border-slate-800 cursor-pointer"
                              title={isAr ? 'استماع' : isKu ? 'گوێگرتن لە دەنگ' : 'Listen'}
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
                {isAr ? 'المعلم يفكر ويستجيب...' : isKu ? 'مامۆستا بیردەکاتەوە و وەڵام دەداتەوە...' : 'Tutor is speaking...'}
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
              title={isAr ? 'تحدث بالميكروفون المباشر' : isKu ? 'قسە بکە بە مایکی ڕاستەوخۆ' : 'Speak with live mic'}
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleStopVoice}
              className="p-3 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all shrink-0 animate-pulse cursor-pointer"
              title={isAr ? 'إيقاف وإرسال التسجيل' : isKu ? 'ڕاگرتن و ناردنی دەنگ' : 'Stop & Send speech'}
            >
              <Square className="w-5 h-5 fill-white" />
            </button>
          )}

          {/* Mobile Native Mic Shortcut */}
          <button
            onClick={() => mobileAudioInputRef.current?.click()}
            disabled={isLoading || isRecording}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
            title={isAr ? 'ميكروفون الهاتف الذكي' : isKu ? 'مایکی مۆبایل' : 'Mobile Native Mic'}
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
                ? isAr
                  ? `جاري الاستماع (${recordingSeconds} ثانية)...`
                  : isKu
                  ? `گوێت لێ دەگیرێت (${recordingSeconds} چرکە)...`
                  : `Listening (${recordingSeconds}s)...`
                : isAr
                ? 'تحدث عبر الميكروفون أو اكتب ردك هنا...'
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

      {/* Quick Unlock Track Modal Dialog */}
      {lockPromptScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {isKu ? 'کردنەوەی بەشی پێشکەوتوو' : isAr ? 'فتح القسم التخصصي' : 'Unlock Specialized Track'}
                  </h4>
                  <p className="text-xs text-amber-300 font-semibold">
                    {isAr ? lockPromptScenario.titleAr || lockPromptScenario.titleEn : isKu ? lockPromptScenario.titleKu : lockPromptScenario.titleEn}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLockPromptScenario(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white border border-slate-800 bg-slate-950"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              {isAr ? lockPromptScenario.descriptionAr : isKu ? lockPromptScenario.descriptionKu : lockPromptScenario.descriptionEn}
            </p>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 text-xs">
              <span className="text-slate-300 font-semibold">{isKu ? 'نرخی کردنەوەی هەمیشەیی:' : isAr ? 'سعر الفتح الدائم:' : 'Permanent Unlock Cost:'}</span>
              <span className="font-black text-amber-300 text-sm">🪙 {getTrackCost(lockPromptScenario.category)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>{isKu ? 'باڵانسی تۆ:' : isAr ? 'رصيدك الحالي:' : 'Your Balance:'}</span>
              <span className="font-bold text-white">🪙 {coins.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLockPromptScenario(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isKu ? 'پاشگەزبوونەوە' : isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmUnlock(lockPromptScenario)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {coins >= getTrackCost(lockPromptScenario.category)
                    ? (isKu ? `کردنەوە (${getTrackCost(lockPromptScenario.category)} 🪙)` : `Unlock (${getTrackCost(lockPromptScenario.category)} 🪙)`)
                    : (isKu ? 'چوون بۆ فرۆشگا' : 'Open Shop')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
