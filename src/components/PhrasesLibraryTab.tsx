import React, { useState } from 'react';
import { TargetLanguage, UILanguage } from '../types';
import { playWordOrSentence, stopCurrentAudio } from '../utils/audio';
import {
  Volume2,
  Search,
  BookMarked,
  Sparkles,
  Layers,
  Heart,
  Check,
} from 'lucide-react';

interface PhraseItem {
  id: string;
  category: string;
  categoryKu: string;
  categoryAr?: string;
  en: string;
  ku: string;
  ar?: string;
  phonetic: string;
  tipKu: string;
  tipAr?: string;
}

const PHRASE_COLLECTION: PhraseItem[] = [
  {
    id: 'ph1',
    category: 'Greetings',
    categoryKu: 'سڵاو و دەستپێک',
    categoryAr: 'التحيات والتعارف',
    en: 'How have you been doing lately?',
    ku: 'لە ئەم دواییانەدا حاڵت چۆن بووە؟',
    ar: 'كيف كانت أحوالك في الآونة الأخيرة؟',
    phonetic: '/haʊ hæv juː biːn ˈduːɪŋ ˈleɪtli/',
    tipKu: 'دەنگی "lately" بە ڕوونی دەرببڕە و لەگەڵ "been" بە خێرایی بیبەستەوە.',
    tipAr: 'انطق "الآونة الأخيرة" بفصاحة مع تسكين الهاء عند الوقف.',
  },
  {
    id: 'ph2',
    category: 'Greetings',
    categoryKu: 'سڵاو و دەستپێک',
    categoryAr: 'التحيات والتعارف',
    en: 'It is a pleasure to meet you.',
    ku: 'خۆشحاڵم بە ناسینت.',
    ar: 'يسعدني ويشرفني جداً لقاؤك والتعرف عليك.',
    phonetic: '/ɪt ɪz ə ˈpleʒər tuː miːt juː/',
    tipKu: 'دەنگی "s" لە "pleasure" دەنگی "ژ"ی کوردییە.',
    tipAr: 'عبارة ترحيبية مهذبة ورسمية، ركز على مخرج القاف في "لقاؤك".',
  },
  {
    id: 'ph3',
    category: 'Opinion',
    categoryKu: 'ڕا دەربڕین',
    categoryAr: 'إبداء الرأي',
    en: 'From my point of view, that makes total sense.',
    ku: 'لە ڕوانگەی منەوە، ئەوە تەواو لۆژیکی و دروستە.',
    ar: 'من وجهة نظري الشخصية، هذا الأمر منطقي وسليم تماماً.',
    phonetic: '/frɒm maɪ pɔɪnt əv vjuː, ðæt meɪks ˈtəʊtl sɛns/',
    tipKu: 'دەنگی "point of view" لەگەڵ یەک بلکێنە.',
    tipAr: 'انتبه لإخراج حرف الظاء في "نظري" ومخرج الطاء في "منطقي".',
  },
  {
    id: 'ph4',
    category: 'Opinion',
    categoryKu: 'ڕا دەربڕین',
    categoryAr: 'إبداء الرأي',
    en: 'I completely agree with what you just said.',
    ku: 'من بە تەواوی هاوڕام لەگەڵ ئەوەی ئێستا وتت.',
    ar: 'أنا أتفق معك تماماً في كل ما تفضلت به للتو.',
    phonetic: '/aɪ kəmˈpliːtli əˈɡriː wɪð wɒt juː dʒʌst sɛd/',
    tipKu: 'تەرکیز لەسەر دەنگی "ee" لە agree و "th" لە with.',
    tipAr: 'تأكيد ودود ومهني في النقاش، ركز على نطق التاء المرققة في "أتفق".',
  },
  {
    id: 'ph5',
    category: 'Travel',
    categoryKu: 'گەشت و سەفەر',
    categoryAr: 'السياحة والسفر',
    en: 'Could you tell me how to get to the main square?',
    ku: 'دەتوانیت پێم بڵێیت چۆن دەگەم بە مەیدانی سەرەکی؟',
    ar: 'هل يمكنك أن تدلني على الطريق المؤدي إلى الساحة الرئيسية؟',
    phonetic: '/kʊd juː tɛl miː haʊ tuː ɡɛt tuː ðə meɪn skwɛər/',
    tipKu: 'وشەی "square" دەنگی "skw" بە نەرمی بێژە بکە.',
    tipAr: 'سؤال استدلالي مهم للمسافرين، ركز على سين "الساحة" المرققة.',
  },
  {
    id: 'ph6',
    category: 'Business',
    categoryKu: 'کار و بازرگانی',
    categoryAr: 'الأعمال والشركات',
    en: 'Let us schedule a follow-up meeting next week.',
    ku: 'با بۆ هەفتەی داهاتوو کۆبوونەوەیەکی بەدواداچوون دابنێین.',
    ar: 'دعنا نحدد موعداً لاجتماع المتابعة خلال الأسبوع القادم.',
    phonetic: '/lɛt ʌs ˈʃɛdjuːl ə ˈfɒləʊ ʌp ˈmiːtɪŋ nɛkst wiːk/',
    tipKu: 'وشەی "schedule" بە شێوازی بەریتانی (شیدیول) یان ئەمریکی (سکێجیول) دەوترێت.',
    tipAr: 'مصطلح مهني شائع في بيئة العمل، ركز على مخرج العين في "المتابعة".',
  },
  {
    id: 'ph7',
    category: 'Kurdish Core',
    categoryKu: 'دەستەواژەی کوردی',
    categoryAr: 'كوردستان والتراث',
    en: 'Kurdistan is a land of peace, mountains, and hospitality.',
    ku: 'کوردستان وڵاتی ئاشتی، شاخە سەربەرزەکان، و میواندۆستییە.',
    ar: 'كوردستان أرض السلام والجبال الشامخة وحفاوة الضيافة.',
    phonetic: 'Kurdistan welati ashti, shaxa sarbarzakan, u mewandostiya.',
    tipKu: 'پیتی "ڵ"ی قورس لە وڵات و "ڕ" لە سەربەرزەکان دەرببڕە.',
    tipAr: 'عبارة تعبر عن كرم الضيافة والجمال الطبيعي لكوردستان.',
  },
  {
    id: 'ph8',
    category: 'Kurdish Core',
    categoryKu: 'دەستەواژەی کوردی',
    categoryAr: 'كوردستان والتراث',
    en: 'Success requires patience, knowledge, and persistent effort.',
    ku: 'سەرکەوتن پێویستی بە ئارامی، زانست، و تێکۆشانی بەردەوام هەیە.',
    ar: 'النجاح يتطلب الصبر الدؤوب والمعرفة والجهد المتواصل.',
    phonetic: 'Sarkawtn pewisti ba arami, zanst, u teikoshani bardawam haya.',
    tipKu: 'وشەی "سەرکەوتن" بە ڕیتمی بڕگەیی دروست بخوێنەرەوە.',
    tipAr: 'حكمة محفزة للتعلم المستمر، انتبه لإخراج الصاد في "الصبر".',
  },
  {
    id: 'ph9',
    category: 'Hospital',
    categoryKu: 'نەخۆشخانە و تەندروستی',
    categoryAr: 'المستشفى والرعاية الصحية',
    en: 'I have a sharp, throbbing pain in my chest that radiates to my left arm.',
    ku: 'ئازارێکی توند و کونکەرم لە سنگمدایە کە تەزووی دێت بۆ باڵی چەپم.',
    ar: 'أعاني من ألم حاد ونابض في الصدر يمتد نحو ذراعي الأيسر.',
    phonetic: '/aɪ hæv ə ʃɑːp ˈθrɒbɪŋ peɪn ɪn maɪ tʃɛst ðæt ˈreɪdieɪts tuː maɪ lɛft ɑːm/',
    tipKu: 'تەرکیز لەسەر دەنگی "th" لە throbbing و "radiates" کە واتای تەزوودان یان بڵاوبوونەوەی ئازارە.',
    tipAr: 'وصف طبي دقيق لأعراض الطوارئ، انتبه لنطق الذال في "ذراعي".',
  },
  {
    id: 'ph10',
    category: 'Hospital',
    categoryKu: 'نەخۆشخانە و تەندروستی',
    categoryAr: 'المستشفى والرعاية الصحية',
    en: 'Are there any contraindications or adverse side effects with this antibiotic?',
    ku: 'ئایا هیچ ڕێگری یان کاریگەریی لاوەکی مەترسیدار لەگەڵ ئەم دژەزیندەییەدا هەیە؟',
    ar: 'هل توجد أي موانع للاستعمال أو آثار جانبية خطيرة لهذا المضاد الحيوي؟',
    phonetic: '/ɑː ðeər ˈɛni ˌkɒntrəˌɪndɪˈkeɪʃənz ɔːr ˈædvɜːs saɪd ɪˈfɛkts wɪð ðɪs ˌæntibaɪˈɒtɪk/',
    tipKu: 'دەستەواژەی "adverse side effects" بڕگەییە و بۆ کاتی وەرگرتنی ڕێنمایی دەرمان پێویستە.',
    tipAr: 'مصطلح صيدلاني دقيق، ركز على نطق الهمزة في "آثار" والضاد في "مضاد".',
  },
  {
    id: 'ph11',
    category: 'Hospital',
    categoryKu: 'نەخۆشخانە و تەندروستی',
    categoryAr: 'المستشفى والرعاية الصحية',
    en: 'The physician instructed me to fast for at least ten hours prior to the diagnostic blood panel.',
    ku: 'پزیشکەکە ڕێنمایی کردم لانیکەم دە کاتژمێر پێش پشکنینی تاقیگەی خوێنەکە بەڕۆژوو بم.',
    ar: 'أوصاني الطبيب بالصيام لمدة عشر ساعات على الأقل قبل إجراء فحص الدم التشخيصي.',
    phonetic: '/ðə fɪˈzɪʃən ɪnˈstrʌktɪd miː tuː fɑːst fɔːr æt liːst tɛn ˈaʊəz ˈpraɪər tuː ðə ˌdaɪəɡˈnɒstɪk blʌd ˈpænəl/',
    tipKu: 'وشەی "fast" لێرەدا بە واتای بەڕۆژووبوون/خۆپاراستن لە خواردن دێت.',
    tipAr: 'إرشادات مخبرية شائعة، ركز على الصاد في "الصيام" والخاء في "فحص".',
  },
  {
    id: 'ph12',
    category: 'Hospital',
    categoryKu: 'نەخۆشخانە و تەندروستی',
    categoryAr: 'المستشفى والرعاية الصحية',
    en: 'I am scheduled for an MRI scan to determine the root cause of these chronic migraines.',
    ku: 'وادەی تیشکی موگناتیسی (MRI)م هەیە بۆ دیاریکردنی هۆکاری سەرەکی ئەم سەرئێشە درێژخایەنانە.',
    ar: 'لدي موعد للتصوير بالرنين المغناطيسي لتحديد السبب الجذري لنوبات الصداع النصفي المزمن.',
    phonetic: '/aɪ æm ˈʃɛdjuːld fɔːr ən ˌɛm ɑːr ˈaɪ skæn tuː dɪˈtɜːmɪn ðə ruːt kɔːz əv ðiːz ˈkrɒnɪk ˈmaɪɡreɪnz/',
    tipKu: 'بێژەکردنی "chronic migraines" /krɒnɪk maɪɡreɪnz/ بۆ دەربڕینی نیشانەی ئاستی B2 گرنگە.',
    tipAr: 'مصطلح طبي متخصص لصور الأشعة وتشخيص الصداع النصفي.',
  },
];

interface PhrasesLibraryTabProps {
  uiLang: UILanguage;
  targetLang: TargetLanguage;
  selectedVoice: string;
  voiceSpeed: number;
}

export const PhrasesLibraryTab: React.FC<PhrasesLibraryTabProps> = ({
  uiLang,
  targetLang,
  selectedVoice,
  voiceSpeed,
}) => {
  const isKu = uiLang === 'ku';
  const isAr = uiLang === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const categories = [
    { id: 'all', nameKu: 'هەموو', nameEn: 'All', nameAr: 'الكل' },
    { id: 'Hospital', nameKu: 'نەخۆشخانە و تەندروستی (B1-B2)', nameEn: 'Hospital & Health', nameAr: 'المستشفى والصحة' },
    { id: 'Greetings', nameKu: 'سڵاو و ناسین', nameEn: 'Greetings', nameAr: 'التحيات' },
    { id: 'Opinion', nameKu: 'ڕا دەربڕین', nameEn: 'Opinions', nameAr: 'إبداء الرأي' },
    { id: 'Travel', nameKu: 'گەشت', nameEn: 'Travel', nameAr: 'السياحة' },
    { id: 'Business', nameKu: 'کار و بازرگانی', nameEn: 'Business', nameAr: 'الأعمال' },
    { id: 'Kurdish Core', nameKu: 'کەلتوور و کوردی', nameEn: 'Kurdish Core', nameAr: 'التراث والكوردية' },
  ];

  const filtered = PHRASE_COLLECTION.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.en.toLowerCase().includes(term) ||
      p.ku.includes(term) ||
      (p.ar && p.ar.includes(term)) ||
      p.phonetic.toLowerCase().includes(term);
    return matchesCat && matchesSearch;
  });

  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const handlePlay = async (phrase: PhraseItem, speed: number = voiceSpeed) => {
    try {
      stopCurrentAudio();
      setPlayingId(phrase.id);
      const textToSpeak =
        targetLang === 'en'
          ? phrase.en
          : targetLang === 'ar'
          ? phrase.ar || phrase.en
          : phrase.ku;

      await playWordOrSentence({
        text: textToSpeak,
        lang: targetLang,
        voiceName: selectedVoice,
        speed: speed || 1.0,
      });
    } catch (e) {
      console.warn('Phrase audio error:', e);
    } finally {
      setPlayingId(null);
    }
  };

  const handlePlayWord = async (word: string, speed: number = 0.8) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim();
    if (!cleanWord) return;

    try {
      stopCurrentAudio();
      setPlayingWord(cleanWord);
      await playWordOrSentence({
        text: cleanWord,
        lang: targetLang,
        voiceName: selectedVoice,
        speed: speed,
      });
    } catch (e) {
      console.warn('Word audio error:', e);
    } finally {
      setPlayingWord((curr) => (curr === cleanWord ? null : curr));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <BookMarked className="w-3.5 h-3.5" />
            {isKu ? 'بانکی دەنگیی ڕستەکان' : 'Audio Phrasebook'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isKu ? 'فەرهەنگی دەنگیی دەستەواژە باوەکان' : 'Core Spoken Audio Library'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isKu
              ? 'دەستەواژە گرنگەکان بە دەنگی ڕاستەقینە و فۆنەتیکەوە لەسەر هەردوو زمانی کوردی و ئینگلیزی ببیستە.'
              : 'Listen to native audio, phonetics, and pronunciation hints for essential conversational expressions.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isKu ? 'گەڕان لە ڕستەکان...' : 'Search phrases...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isKu ? cat.nameKu : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Phrase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isPlaying = playingId === item.id;
          const targetTextStr = targetLang === 'en' ? item.en : targetLang === 'ar' ? item.ar || item.en : item.ku;
          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase">
                  {targetLang === 'ar' ? item.categoryAr || item.category : isKu ? item.categoryKu : item.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePlay(item, 0.75)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                    title={isAr ? 'قراءة بطيئة' : isKu ? 'خوێندنەوەی هێواش' : 'Slow 0.75x'}
                  >
                    🐢 0.75x
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlay(item, voiceSpeed)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlaying ? (isAr ? 'جاري التشغيل...' : isKu ? 'پەخشکردن...' : 'Playing...') : isAr ? 'استمع' : isKu ? 'خوێندنەوە' : 'Listen'}</span>
                  </button>
                </div>
              </div>

              {/* Phrase text with clickable words */}
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {targetTextStr.split(/\s+/).map((w, wIdx) => {
                    const cleanW = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '').trim();
                    const isWordActive = playingWord === cleanW;

                    return (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => handlePlayWord(cleanW)}
                        className={`text-base font-bold px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                          isWordActive
                            ? 'bg-emerald-500 text-slate-950 scale-105'
                            : 'text-white hover:bg-slate-800 hover:text-emerald-300'
                        }`}
                        title={isAr ? `انقر لسماع "${cleanW}"` : isKu ? `کلیک بکە بۆ بیستنی "${cleanW}"` : `Click to hear "${cleanW}"`}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-emerald-300 font-medium">
                  {targetLang === 'en' ? item.ku : targetLang === 'ar' ? item.ku : item.en}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
                <span className="font-mono text-slate-400 text-[10px]">{item.phonetic}</span>
                <span className="text-slate-400">
                  💡 {targetLang === 'ar' && item.tipAr ? item.tipAr : isKu ? item.tipKu : item.tipKu}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
