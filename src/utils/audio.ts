/**
 * Audio helpers optimized for iOS (iPhone/iPad), Android, Desktop browsers, and iframes.
 */
import { requestTTS } from '../services/api';

let activeAudioElement: HTMLAudioElement | null = null;
let activeBlobUrl: string | null = null;
let sharedAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

// Initialize or resume shared AudioContext for low-latency, mobile-safe playback
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioContext = new AudioContextClass();
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
  } catch (e) {
    console.warn('AudioContext init note:', e);
  }
  return sharedAudioContext;
}

// Global user gesture unlocker for iOS Safari and iframe sandbox contexts
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
      window.removeEventListener(evt, unlockAudio);
    });
  };
  ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true, capture: true });
  });
}

// Convert base64 string to a Uint8Array & ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Detect audio MIME type from base64 magic bytes (MP3, WAV, OGG, WEBM)
export function detectAudioMimeType(cleanBase64: string, fallback: string = 'audio/mpeg'): string {
  if (
    cleanBase64.startsWith('//OE') ||
    cleanBase64.startsWith('//NA') ||
    cleanBase64.startsWith('//PE') ||
    cleanBase64.startsWith('SUQz')
  ) {
    return 'audio/mpeg';
  }
  if (cleanBase64.startsWith('UklGR')) {
    return 'audio/wav';
  }
  if (cleanBase64.startsWith('T2dnUw')) {
    return 'audio/ogg';
  }
  if (cleanBase64.startsWith('GkXfo')) {
    return 'audio/webm';
  }
  return fallback;
}

// Convert base64 string to a Blob for fast, memory-safe playback on mobile devices
export function base64ToBlob(base64: string, mimeType?: string): Blob {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  const detectedType = mimeType || detectAudioMimeType(cleanBase64);
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: detectedType });
}

// Stop any currently playing audio across Web Audio, HTML5 Audio, and SpeechSynthesis
export function stopCurrentAudio() {
  cleanupPlayback();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

function cleanupPlayback() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch (e) {}
    currentSourceNode = null;
  }

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.src = '';
    } catch (e) {}
    activeAudioElement = null;
  }

  if (activeBlobUrl) {
    try {
      URL.revokeObjectURL(activeBlobUrl);
    } catch (e) {}
    activeBlobUrl = null;
  }
}

// Play audio safely using Web Audio API first (bypasses iframe autoplay blocks), falling back to HTMLAudioElement
export async function playBase64Audio(base64Data: string, mimeType?: string): Promise<void> {
  stopCurrentAudio();
  if (!base64Data) return;

  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  const realMime = mimeType || detectAudioMimeType(cleanBase64);

  // 1. Try Web Audio API (most reliable in modern mobile browsers and iframes)
  const ctx = getAudioContext();
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const arrayBuffer = base64ToArrayBuffer(cleanBase64);
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

      return await new Promise<void>((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        currentSourceNode = source;

        source.onended = () => {
          if (currentSourceNode === source) {
            currentSourceNode = null;
          }
          resolve();
        };

        source.start(0);
      });
    } catch (webAudioErr) {
      console.warn('Web Audio API playback note, falling back to HTMLAudioElement:', webAudioErr);
    }
  }

  // 2. Fallback to HTMLAudioElement with detected MIME type
  return new Promise((resolve) => {
    try {
      const blob = base64ToBlob(cleanBase64, realMime);
      const url = URL.createObjectURL(blob);
      activeBlobUrl = url;

      const audio = new Audio();
      audio.src = url;
      audio.preload = 'auto';
      activeAudioElement = audio;

      audio.onended = () => {
        cleanupPlayback();
        resolve();
      };

      audio.onerror = (e) => {
        console.warn('Audio element playback note:', e);
        cleanupPlayback();
        resolve();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play promise rejected:', err);
          cleanupPlayback();
          resolve();
        });
      }
    } catch (err) {
      cleanupPlayback();
      resolve();
    }
  });
}

// Phonetic transliterator from Central Kurdish (Sorani) to readable Latin letters
// Ensures browser speech engines can vocalize Kurdish phonemes if offline
function transliterateKurdishToPhoneticLatin(text: string): string {
  const charMap: Record<string, string> = {
    'ا': 'a', 'ئا': 'a', 'ێ': 'e', 'ئێ': 'e', 'ە': 'a',
    'ب': 'b', 'پ': 'p', 'ت': 't', 'ج': 'j', 'چ': 'ch', 'ح': 'h',
    'خ': 'kh', 'د': 'd', 'ر': 'r', 'ڕ': 'rr', 'ز': 'z', 'ژ': 'zh',
    'س': 's', 'ش': 'sh', 'ع': "'", 'غ': 'gh', 'ف': 'f', 'ڤ': 'v',
    'ق': 'q', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'ڵ': 'll', 'م': 'm',
    'ن': 'n', 'و': 'u', 'ۆ': 'o', 'ئۆ': 'o', 'وو': 'oo', 'ی': 'y',
    'یی': 'ee', 'ئ': '', '؟': '?', '،': ',', '؛': ';'
  };

  return text
    .split('')
    .map((c) => charMap[c] ?? c)
    .join('');
}

// Phonetic adaptation for Arabic/Middle-Eastern speech engines to articulate Kurdish text
function kurdishToVoiceAdaptedArabic(text: string): string {
  return text
    .replace(/چ/g, 'تش')
    .replace(/پ/g, 'ب')
    .replace(/گ/g, 'ك')
    .replace(/ژ/g, 'ج')
    .replace(/ڤ/g, 'ف')
    .replace(/ڵ/g, 'ل')
    .replace(/ڕ/g, 'ر')
    .replace(/ۆ/g, 'و')
    .replace(/ێ/g, 'ي')
    .replace(/ە/g, 'ه')
    .replace(/ئـ/g, 'أ')
    .replace(/ئێ/g, 'إي')
    .replace(/ئۆ/g, 'أو')
    .replace(/ئا/g, 'آ')
    .replace(/ئ/g, 'أ');
}

// Fallback to browser SpeechSynthesis if TTS API is unavailable
export async function speakBrowserSpeech(text: string, lang: 'en' | 'ku' | 'ar' = 'en', speed: number = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const loadVoices = (): SpeechSynthesisVoice[] => {
        try {
          return window.speechSynthesis.getVoices() || [];
        } catch {
          return [];
        }
      };

      let voices = loadVoices();

      const runSpeak = (voiceList: SpeechSynthesisVoice[]) => {
        try {
          let textToUtter = text;
          let langCode = 'en-US';
          let matchedVoice: SpeechSynthesisVoice | undefined;

          if (lang === 'ar') {
            matchedVoice = voiceList.find(
              (v) =>
                v.lang.startsWith('ar') ||
                v.name.toLowerCase().includes('arabic') ||
                v.name.toLowerCase().includes('maged') ||
                v.name.toLowerCase().includes('tarik') ||
                v.name.toLowerCase().includes('laila')
            );
            langCode = matchedVoice ? matchedVoice.lang : 'ar-SA';
          } else if (lang === 'ku') {
            matchedVoice = voiceList.find(
              (v) =>
                v.lang.startsWith('ku') ||
                v.lang.startsWith('ckb') ||
                v.name.toLowerCase().includes('kurdish')
            );
            if (matchedVoice) {
              langCode = matchedVoice.lang;
            } else {
              // Arabic or Persian engine vocalizes Central Kurdish (Sorani) script faithfully when phonetically adapted
              matchedVoice = voiceList.find(
                (v) => v.lang.startsWith('ar') || v.lang.startsWith('fa') || v.lang.startsWith('tr')
              );
              langCode = matchedVoice ? matchedVoice.lang : 'ar-SA';
              textToUtter = kurdishToVoiceAdaptedArabic(text);
            }
          } else {
            matchedVoice =
              voiceList.find(
                (v) =>
                  (v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en')) &&
                  (v.name.includes('Natural') ||
                    v.name.includes('Google') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Jenny') ||
                    v.name.includes('Siri'))
              ) || voiceList.find((v) => v.lang.startsWith('en'));

            langCode = matchedVoice ? matchedVoice.lang : 'en-US';
          }

          const utterance = new SpeechSynthesisUtterance(textToUtter);
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
          utterance.rate = Math.max(0.75, Math.min(1.15, speed));
          utterance.pitch = 1.0;
          utterance.lang = langCode;

          // Prevent Chrome garbage collection bug
          (window as any).__lastUtterance = utterance;

          let hasResolved = false;
          const safeResolve = () => {
            if (!hasResolved) {
              hasResolved = true;
              (window as any).__lastUtterance = null;
              resolve();
            }
          };

          utterance.onend = safeResolve;
          utterance.onerror = safeResolve;

          // Safety timeout in case browser gets suspended
          const estimatedDurationMs = Math.max(2000, (text.length / 10) * 1000);
          setTimeout(safeResolve, estimatedDurationMs + 1500);

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis invocation error:', err);
          resolve();
        }
      };

      if (!voices || voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          runSpeak(loadVoices());
        };
        setTimeout(() => {
          runSpeak(loadVoices());
        }, 150);
      } else {
        runSpeak(voices);
      }
    } catch (e) {
      console.warn('speakBrowserSpeech failed', e);
      resolve();
    }
  });
}

// Complete unified reading utility for words and sentences (supports both object and positional params)
export async function playWordOrSentence(
  paramsOrText:
    | string
    | {
        text: string;
        lang?: 'en' | 'ku' | 'ar';
        voiceName?: string;
        speed?: number;
      },
  langParam?: 'en' | 'ku' | 'ar',
  speedParam?: number,
  voiceNameParam?: string
): Promise<void> {
  let text = '';
  let lang: 'en' | 'ku' | 'ar' = 'en';
  let voiceName = 'Kore';
  let speed = 1.0;

  if (typeof paramsOrText === 'string') {
    text = paramsOrText;
    lang = langParam || 'en';
    speed = speedParam !== undefined ? speedParam : 1.0;
    voiceName = voiceNameParam || 'Kore';
  } else if (paramsOrText && typeof paramsOrText === 'object') {
    text = paramsOrText.text;
    lang = paramsOrText.lang || 'en';
    voiceName = paramsOrText.voiceName || 'Kore';
    speed = paramsOrText.speed !== undefined ? paramsOrText.speed : 1.0;
  }

  if (!text || !text.trim()) return;

  try {
    const audioBase64 = await requestTTS(text.trim(), voiceName, lang);
    if (audioBase64) {
      await playBase64Audio(audioBase64);
      return;
    }
  } catch (err) {
    console.warn('requestTTS error in playWordOrSentence:', err);
  }

  // Graceful client fallback
  await speakBrowserSpeech(text.trim(), lang, speed);
}

// Helper to detect iOS and Android devices
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

// Media recorder controller hardened for iOS, Android, and Desktop
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  async start(): Promise<void> {
    this.audioChunks = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('BROWSER_UNSUPPORTED_MEDIA_DEVICES');
    }

    // Mobile-tolerant constraints
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (firstErr) {
      // Fallback for mobile devices that fail on advanced audio constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (secondErr: any) {
        if (secondErr?.name === 'NotAllowedError' || secondErr?.name === 'PermissionDeniedError') {
          throw new Error('PERMISSION_DENIED');
        }
        throw secondErr;
      }
    }

    this.stream = stream;

    // Setup analyzer safely (does not break recording if AudioContext is restricted on iOS)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128;
        source.connect(this.analyser);
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
      }
    } catch (e) {
      console.warn('AudioContext visualizer skipped on this device:', e);
    }

    // Select supported mimeType for the specific mobile/desktop platform
    let recorderOptions: MediaRecorderOptions | undefined = undefined;
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];

    if (typeof MediaRecorder.isTypeSupported === 'function') {
      for (const candidate of candidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          recorderOptions = { mimeType: candidate };
          break;
        }
      }
    }

    // Instantiate MediaRecorder safely
    try {
      this.mediaRecorder = recorderOptions ? new MediaRecorder(stream, recorderOptions) : new MediaRecorder(stream);
    } catch (err) {
      // In iOS Safari, options can throw NotSupportedError even when claimed supported
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // On iOS Safari with MP4, start() with timeslice causes corrupt chunks; start() without timeslice is standard
    const isMp4 = this.mediaRecorder.mimeType?.includes('mp4') || isIOS();
    if (isMp4) {
      this.mediaRecorder.start();
    } else {
      this.mediaRecorder.start(250);
    }
  }

  getFrequencyData(): Uint8Array | null {
    if (this.analyser && this.dataArray) {
      try {
        this.analyser.getByteFrequencyData(this.dataArray as any);
        return this.dataArray;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async stop(): Promise<{ blob: Blob; base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not started'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || (isIOS() ? 'audio/mp4' : 'audio/webm');
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Clean up tracks
        if (this.stream) {
          try {
            this.stream.getTracks().forEach((track) => track.stop());
          } catch (e) {}
          this.stream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
          try {
            this.audioContext.close();
          } catch (e) {}
          this.audioContext = null;
        }

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || '';
          resolve({
            blob: audioBlob,
            base64,
            mimeType,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      };

      // Request any pending chunk
      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      } catch (e) {}

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        reject(e);
      }
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}
