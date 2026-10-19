import React, { useState, useEffect, useRef } from 'react';
import { TargetLanguage, UILanguage } from '../types';
import { MINIMAL_PAIRS, TONGUE_GUIDES } from '../data/learningHubData';
import { playWordOrSentence } from '../utils/audio';
import {
  Mic,
  Volume2,
  Activity,
  Layers,
  Sparkles,
  Headphones,
  Info,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface AudioToolsStudioProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  voiceSpeed?: number;
  selectedVoice?: string;
}

export const AudioToolsStudio: React.FC<AudioToolsStudioProps> = ({
  uiLang,
  targetLang,
  voiceSpeed = 1.0,
  selectedVoice = 'Kore',
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  // 1. Microphone Hardware & Decibel Meter
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'good' | 'low' | 'clipping'>('idle');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 2. Syllable Segmenter
  const [syllableWord, setSyllableWord] = useState('Hospitalization');
  const [syllableResult, setSyllableResult] = useState<string[]>(['Hos', 'pi', 'tal', 'i', 'za', 'tion']);

  // 3. Shadowing Practice
  const [shadowingText, setShadowingText] = useState('The doctor recommended immediate clinical rest and complete recovery.');
  const [isShadowingActive, setIsShadowingActive] = useState(false);
  const [shadowingCountdown, setShadowingCountdown] = useState<number | null>(null);

  // 4. Minimal Pairs selection
  const [activeMinimalPair, setActiveMinimalPair] = useState(MINIMAL_PAIRS[0]);
  const [activeTongueGuide, setActiveTongueGuide] = useState(TONGUE_GUIDES[0]);

  // Clean up mic on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const startMicTest = async () => {
    try {
      stopMicTest();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsMicTesting(true);
      setMicStatus('testing');

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);

        if (normalized > 85) setMicStatus('clipping');
        else if (normalized > 25) setMicStatus('good');
        else if (normalized > 5) setMicStatus('low');

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error('Mic access error:', err);
      setMicErrorMessage(
        isAr
          ? 'يرجى السماح بالوصول إلى الميكروفون في المتصفح'
          : isKu
          ? 'تکایە ڕێگە بە مایکڕۆفۆن بدە لە وێبگەڕەکەت'
          : 'Please allow microphone access in your browser settings.'
      );
    }
  };

  const stopMicTest = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicTesting(false);
    setMicVolume(0);
    setMicStatus('idle');
  };

  const handleSyllabify = (word: string) => {
    setSyllableWord(word);
    const clean = word.trim();
    if (!clean) return;
    // Simple heuristic syllabification for practice visual
    const parts = clean.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi) || [clean];
    setSyllableResult(parts);
  };

  const handleStartShadowing = () => {
    setIsShadowingActive(true);
    setShadowingCountdown(3);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        setShadowingCountdown(null);
        // Play audio for shadowing in appropriate language based on text script
        const shadowLang = /[\u0600-\u06FF]/.test(shadowingText) ? (targetLang === 'ar' ? 'ar' : 'ku') : 'en';
        playWordOrSentence(shadowingText, shadowLang, voiceSpeed, selectedVoice);
      } else {
        setShadowingCountdown(count);
      }
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>{isAr ? 'استوديو الصوت والأدوات السريرية' : isKu ? 'تاقیگەی دەنگ و ئامرازە پسپۆڕییەکان' : 'Voice Lab & Audio Diagnostic Tools'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isAr
                ? 'فحص الميكروفون، مخارج الحروف، وتقنية التظليل الصوتي'
                : isKu
                ? 'پشکنینی مایک، بێژەکردنی بڕگەکان، و ڕاهێنەری زمانی دەم'
                : 'Microphone Diagnostics, Phonetic Anatomy & Shadowing Studio'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {isAr
                ? 'مجموعة من الأدوات الاحترافية لفحص جودة التقاط الصوت ومعايرة النطق السليم للوصول إلى دقة 100%.'
                : isKu
                ? 'کۆمەڵێک ئامرازی پێشکەوتوو بۆ پشکنینی ڕێکی مایکڕۆفۆن، تێگەیشتن لە جووڵەی زمان، و بەراوردی دەنگە هاوشێوەکان.'
                : 'Advanced real-time vocal diagnostics, syllable segmenter, and articulation mechanics.'}
            </p>
          </div>

          {/* Quick Hardware Test Button */}
          <div className="flex items-center gap-3 shrink-0">
            {!isMicTesting ? (
              <button
                onClick={startMicTest}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>{isAr ? 'فحص الميكروفون المباشر' : isKu ? 'پشکنینی مایکڕۆفۆن' : 'Test Live Microphone'}</span>
              </button>
            ) : (
              <button
                onClick={stopMicTest}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm hover:bg-rose-500/30 active:scale-95 transition-all"
              >
                <Mic className="w-4 h-4 animate-pulse text-rose-400" />
                <span>{isAr ? 'إيقاف الفحص' : isKu ? 'ڕاگرتنی پشکنین' : 'Stop Mic Test'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mic Error Notice */}
        {micErrorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-fadeIn">
            <span>{micErrorMessage}</span>
            <button onClick={() => setMicErrorMessage(null)} className="text-amber-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {/* Live Audio Volume Meter Bar */}
        {isMicTesting && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {isAr ? 'مستوى التقاط الصوت في الميكروفون:' : isKu ? 'ئاستی هێزی دەنگ لە مایکدا:' : 'Microphone Input Volume:'}
              </span>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                  micStatus === 'clipping'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : micStatus === 'good'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {micVolume}% -{' '}
                {micStatus === 'clipping'
                  ? isAr ? 'الصوت مرتفع جداً (ابتعد قليلاً)' : isKu ? 'دەنگ زۆر بەرزە (تۆزێ دوورکەوە)' : 'Too Loud / Clipping'
                  : micStatus === 'good'
                  ? isAr ? 'مستوى الصوت مثالي وممتاز' : isKu ? 'ئاستی دەنگ تەواو و نایابە' : 'Optimal Voice Level'
                  : isAr ? 'الصوت منخفض (اقترب قليلاً)' : isKu ? 'دەنگ کەمە (نزیکتر بە)' : 'Low Input'}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  micVolume > 85
                    ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${micVolume}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid: 3 Interactive Specialized Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool 1: Minimal Pairs Audio Contrast */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'أزواج الكلمات المتشابهة' : isKu ? 'بەراوردی جووتە وشە نزیکەکان' : 'Minimal Pairs Drill'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isKu ? 'جیاوازی دەنگی پیتە کێشەدارەکان' : 'Ear & Tongue Contrast'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector list */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {MINIMAL_PAIRS.slice(0, 4).map((pair) => (
                <button
                  key={pair.id}
                  onClick={() => setActiveMinimalPair(pair)}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                    activeMinimalPair.id === pair.id
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">{pair.wordA} vs {pair.wordB}</div>
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">{pair.soundDifference}</div>
                </button>
              ))}
            </div>

            {/* Active Pair Card with Dual Audio Players */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div>
                  <div className="text-base font-black text-white">{activeMinimalPair.wordA}</div>
                  <div className="text-[11px] font-mono text-cyan-400">{activeMinimalPair.phoneticA}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isAr ? (activeMinimalPair as any).meaningArA || activeMinimalPair.meaningEnA : isKu ? activeMinimalPair.meaningKuA : activeMinimalPair.meaningEnA}</div>
                </div>
                <button
                  onClick={() => playWordOrSentence(activeMinimalPair.wordA, 'en', 0.85, selectedVoice)}
                  className="w-9 h-9 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center transition-all cursor-pointer"
                  title="Play Sound A"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-base font-black text-white">{activeMinimalPair.wordB}</div>
                  <div className="text-[11px] font-mono text-indigo-400">{activeMinimalPair.phoneticB}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isAr ? (activeMinimalPair as any).meaningArB || activeMinimalPair.meaningEnB : isKu ? activeMinimalPair.meaningKuB : activeMinimalPair.meaningEnB}</div>
                </div>
                <button
                  onClick={() => playWordOrSentence(activeMinimalPair.wordB, 'en', 0.85, selectedVoice)}
                  className="w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center transition-all cursor-pointer"
                  title="Play Sound B"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>{activeMinimalPair.soundDifference}</span>
          </div>
        </div>

        {/* Tool 2: Tongue Position & Articulation Mechanics */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'هندسة مخارج الحروف' : isKu ? 'جووڵەی زمان و ئەندامەکانی دەم' : 'Tongue & Mouth Anatomy'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? 'تحديد مواضع جهاز النطق ومخارج الأصوات' : isKu ? 'ڕێنمایی دەرهێنانی دەنگە قورسەکان' : 'Vocal Tract Positioning'}
                  </span>
                </div>
              </div>
            </div>

            {/* Phoneme selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
              {TONGUE_GUIDES.map((g) => (
                <button
                  key={g.sound}
                  onClick={() => setActiveTongueGuide(g)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                    activeTongueGuide.sound === g.sound
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {g.sound.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Instruction Display */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">{activeTongueGuide.sound}</span>
                <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {activeTongueGuide.phonetic}
                </span>
              </div>
              <div className="text-xs text-slate-200 font-medium">
                {activeTongueGuide.mouthImage}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr ? (activeTongueGuide as any).instructionAr || activeTongueGuide.instructionEn : isKu ? activeTongueGuide.instructionKu : activeTongueGuide.instructionEn}
              </p>
              <div className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-900">
                <span className="font-bold">{isAr ? 'الخطأ الشائع: ' : isKu ? 'هەڵەی باو: ' : 'Common mistake: '}</span>
                {isAr ? (activeTongueGuide as any).commonMistakeAr || activeTongueGuide.commonMistake : isKu ? (activeTongueGuide as any).commonMistakeKu || activeTongueGuide.commonMistake : activeTongueGuide.commonMistake}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <span>{isAr ? 'مثال: ' : isKu ? 'نموونە: ' : 'Sample: '}</span>
              <span dir="ltr" style={{ direction: 'ltr' }} className="text-white font-bold force-ltr">
                "{activeTongueGuide.sampleWord}"
              </span>
            </span>
            <button
              onClick={() => playWordOrSentence(activeTongueGuide.sampleWord, 'en', 0.8, selectedVoice)}
              className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'استماع' : isKu ? 'گوێگرتن' : 'Listen'}</span>
            </button>
          </div>
        </div>

        {/* Tool 3: Syllable Segmenter & Stress Visualizer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'تقطيع الكلمات إلى مقاطع' : isKu ? 'بڕگە بڕگە کردنی وشەکان' : 'Syllable Segmenter'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? 'نطق الكلمات الطويلة بسهولة عبر تقسيمها' : isKu ? 'دابەشکردنی وشەی درێژ بۆ بڕگەی سووک' : 'Pronounce long words easily'}
                  </span>
                </div>
              </div>
            </div>

            {/* Word Input */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={syllableWord}
                  onChange={(e) => handleSyllabify(e.target.value)}
                  placeholder={isAr ? 'اكتب أي كلمة طويلة...' : isKu ? 'وشەیەک بنووسە...' : 'Type any long word...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={() => {
                    const sylLang = /[\u0600-\u06FF]/.test(syllableWord) ? (targetLang === 'ar' ? 'ar' : 'ku') : 'en';
                    playWordOrSentence(syllableWord, sylLang, 0.8, selectedVoice);
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center transition-all cursor-pointer"
                  title="Play"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap gap-1.5">
                {['Hospitalization', 'Cardiovascular', 'Prescription', 'Convalescence'].map((w) => (
                  <button
                    key={w}
                    onClick={() => handleSyllabify(w)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Syllables Visual Blocks */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 mb-2 font-medium">
                {isAr ? 'المقاطع الصوتية المجزأة:' : isKu ? 'بڕگە دەنگییە جیاکراوەکان:' : 'Acoustic Syllables:'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {syllableResult.map((part, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const partLang = /[\u0600-\u06FF]/.test(part) ? (targetLang === 'ar' ? 'ar' : 'ku') : 'en';
                      playWordOrSentence(part, partLang, 0.7, selectedVoice);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-gradient-to-b from-purple-500/20 to-purple-600/10 border border-purple-500/30 text-purple-200 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                    title={`Click to pronounce syllable ${part}`}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>{isAr ? 'انقر على أي مقطع للاستماع لصوته منفرداً' : isKu ? 'کرتە لە هەر بڕگەیەک بکە بۆ بیستنی دەنگەکەی بە تەنیا' : 'Tap any syllable to hear isolated phoneme'}</span>
          </div>
        </div>
      </div>

      {/* Tool 4: Shadowing Speaking Mode */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'تقنية التظليل الصوتي ومحاكاة النطق' : isKu ? 'تەکنیکی سێبەر و هاوئاوازی دەنگ' : 'Speech Shadowing Simulator'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'الاستماع لصوت ناطق أصيل والتحدث معه بالتزامن بفارق زمني بسيط لاكتساب طلاقة التعبير.'
                  : isKu
                  ? 'گوێگرتن لە کەسی ڕەسەن و دووبارەکردنەوەی لە یەک کاتدا بۆ توانەوەی ئەکسێنت'
                  : 'Listen to native voice and speak simultaneously with a half-second delay to internalize native cadence.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleStartShadowing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs sm:text-sm hover:opacity-95 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isAr ? 'بدء تدريب التظليل' : isKu ? 'دەستپێکردنی ڕاهێنان' : 'Start Shadowing'}</span>
          </button>
        </div>

        {/* Text for Shadowing */}
        <div className="relative p-5 rounded-2xl bg-slate-950 border border-slate-800">
          {shadowingCountdown !== null && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <div className="text-4xl font-black text-amber-400 animate-bounce">{shadowingCountdown}</div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  {isAr ? 'استعد للتحدث بالمحاكاة مع الصوت...' : isKu ? 'ئامادەبە بۆ هاوبێژی لەگەڵ دەنگ...' : 'Get ready to shadow...'}
                </div>
              </div>
            </div>
          )}
          <div
            dir="ltr"
            style={{ direction: 'ltr', textAlign: 'left' }}
            className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed mb-3 force-ltr text-left"
          >
            "{shadowingText}"
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-900">
            <span>{isAr ? 'جملة سريرية لمحاكاة النطق' : isKu ? 'ڕستە نموونەیی بۆ مەشقی نەخۆشخانە' : 'Clinical Shadowing Sentence'}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShadowingText('The electrocardiogram confirms normal cardiac sinus rhythm with zero abnormalities.')}
                className="text-[11px] text-amber-400 hover:underline"
              >
                {isAr ? 'الجملة التالية' : isKu ? 'ڕستەی تر' : 'Next Sentence'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
