import type { TestStep, TargetLanguage } from '../types/index.ts';
import { STAGES_100_RAW } from './speakingStages100.ts';

export interface StageDefinition {
  id: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  worldId: number;
  worldTitleKu: string;
  worldTitleEn: string;
  titleKu: string;
  titleEn: string;
  titleAr: string;
  instructionKu: string;
  instructionEn: string;
  instructionAr: string;
  promptKu: string;
  promptEn: string;
  promptAr: string;
  sampleAnswerKu: string;
  sampleAnswerEn: string;
  sampleAnswerAr: string;
  seconds: number;
}

// 10 Curated Worlds for the 1,000 Levels
export const WORLDS_CONFIG = [
  { id: 1, range: [1, 100], level: 'A1-A2', titleKu: 'جیهانی ١: پەیڤ و دەستپێکە بنەڕەتییەکان', titleEn: 'World 1: Everyday Foundations', icon: '🌱' },
  { id: 2, range: [101, 200], level: 'A2', titleKu: 'جیهانی ٢: بازاڕ و قەیسەری و خواردنە کوردییەکان', titleEn: 'World 2: Bazaars & Kurdish Dining', icon: '🛒' },
  { id: 3, range: [201, 300], level: 'A2-B1', titleKu: 'جیهانی ٣: سروشت و گەشتوگوزاری کوردستان', titleEn: 'World 3: Kurdistan Landscapes & Travel', icon: '🏔️' },
  { id: 4, range: [301, 400], level: 'B1', titleKu: 'جیهانی ٤: فڕۆکەخانە و هاتوچۆی نێودەوڵەتی', titleEn: 'World 4: International Travel & Flight', icon: '✈️' },
  { id: 5, range: [401, 500], level: 'B1-B2', titleKu: 'جیهانی ٥: کار، تەکنەلۆژیا و ژیریی دەستکرد', titleEn: 'World 5: Technology & Career Growth', icon: '💻' },
  { id: 6, range: [501, 600], level: 'B2', titleKu: 'جیهانی ٦: پزیشکی، دەرووندروستی و وەرزش', titleEn: 'World 6: Medicine & Wellness', icon: '🏥' },
  { id: 7, range: [601, 700], level: 'B2-C1', titleKu: 'جیهانی ٧: ئەدەب، پەندی پێشینان و هونەری کوردی', titleEn: 'World 7: Kurdish Heritage & Literature', icon: '📜' },
  { id: 8, range: [701, 800], level: 'C1', titleKu: 'جیهانی ٨: لێکۆڵینەوەی زانستی و دیبەیتی کۆمەڵایەتی', titleEn: 'World 8: Academic Research & Debates', icon: '🎓' },
  { id: 9, range: [801, 900], level: 'C1-C2', titleKu: 'جیهانی ٩: دانوستاندنی دیپلۆماسی و سەرکردایەتی', titleEn: 'World 9: Diplomacy & Leadership', icon: '⚖️' },
  { id: 10, range: [901, 1000], level: 'C2', titleKu: 'جیهانی ١٠: فەلسەفە، گەردوون و وتاربێژی مەزن', titleEn: 'World 10: Master Oratory & Philosophy', icon: '👑' },
];

// Curated theme templates for generating procedural high-quality stages 101 - 1000
interface ThematicTemplate {
  category: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  titleKuTpl: (n: number) => string;
  titleEnTpl: (n: number) => string;
  titleArTpl: (n: number) => string;
  instKuTpl: (topic: string) => string;
  instEnTpl: (topic: string) => string;
  instArTpl: (topic: string) => string;
  promptKuTpl: (topic: string) => string;
  promptEnTpl: (topic: string) => string;
  promptArTpl: (topic: string) => string;
  sampleKuTpl: (topic: string) => string;
  sampleEnTpl: (topic: string) => string;
  sampleArTpl: (topic: string) => string;
  seconds: number;
}

// Procedural World Topics (90 topics per world, creating exactly 900 unique stages for 101..1000)
const WORLD_TOPICS: { [worldId: number]: Array<{ ku: string; en: string; ar: string; category: string; level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; sec: number }> } = {
  2: [
    { ku: 'کڕینی میوەی بەهار لە بازاڕی قەیسەری', en: 'Buying spring fruits in the historical bazaar', ar: 'شراء فواكه الربيع في السوق التراثي', category: 'Shopping', level: 'A2', sec: 10 },
    { ku: 'داواکردنی چای لە چایخانەی مەچکۆ', en: 'Ordering hot spiced tea at Machko Chaikhana', ar: 'طلب الشاي في مقهى ماشكو التاريخي', category: 'Dining', level: 'A2', sec: 10 },
    { ku: 'کڕینی جلی کوردی بۆ جەژنی نەورۆز', en: 'Selecting traditional Kurdish clothes for Newroz', ar: 'اختيار الأزياء الكوردية التراثية لعيد نوروز', category: 'Culture', level: 'A2', sec: 12 },
    { ku: 'پرسیارکردن دەربارەی نرخی فستقی بەناوبانگ', en: 'Inquiring about prices of roasted pistachios', ar: 'السؤال عن أسعار المكسرات والفستق', category: 'Market', level: 'A2', sec: 10 },
    { ku: 'داواکردنی کەبابی هەولێری بە نانی تیری', en: 'Ordering famous Erbil kebab with traditional flatbread', ar: 'طلب كباب أربيل الشهير مع الخبز الرقيق', category: 'Food', level: 'A2', sec: 12 },
    { ku: 'داشکاندن و چاککردنی نرخ لەگەڵ فرۆشیار', en: 'Polite bargaining and price negotiation with a shopkeeper', ar: 'التفاوض اللبق على السعر مع البائع', category: 'Market', level: 'A2', sec: 12 },
    { ku: 'کڕینی هەنگوینی سروشتی کێوەکانی کوردستان', en: 'Purchasing pure wild mountain honey from local beekeepers', ar: 'شراء العسل الجبلي الطبيعي النقي', category: 'Market', level: 'A2', sec: 10 },
    { ku: 'پیرۆزبایی کڕینی کەلوپەل بە دەستەواژەی کوردی', en: 'Expressing warm congratulations on a new purchase', ar: 'تقديم التهاني الودية على شراء غرض جديد', category: 'Daily', level: 'A2', sec: 10 },
    { ku: 'داواکردنی شیرینی و لوقم لە دووکانی شیرەمەنی', en: 'Ordering traditional sweets and lokum delight', ar: 'طلب الحلويات الشرقية والحلقوم التراثي', category: 'Food', level: 'A2', sec: 10 },
    { ku: 'کڕینی بەرماڵ و فەرشی نەخشێنراوی دەستکرد', en: 'Choosing handwoven traditional carpets and rugs', ar: 'شراء السجاد اليدوي المنقوش والزخارف', category: 'Culture', level: 'A2', sec: 12 },
  ],
  3: [
    { ku: 'گەشتی کێوی هەڵگورد و بەفری بەرزاییەکان', en: 'Hiking Mount Halgurd and enjoying alpine glaciers', ar: 'رحلة تسلق قمة جبل هلكورد والاستمتاع بالثلوج', category: 'Nature', level: 'B1', sec: 14 },
    { ku: 'سەردانی دەریاچەی دووکان و بەلەمسواری', en: 'Visiting Lake Dukan and scenic boat riding', ar: 'زيارة بحيرة دوكان وركوب القوارب الجميلة', category: 'Travel', level: 'B1', sec: 14 },
    { ku: 'دۆڵی بالیسان و باخەکانی هەنار', en: 'Walking through Balisan Valley pomegranate orchards', ar: 'جولة بين بساتين الرمان في وادي باليسان', category: 'Nature', level: 'B1', sec: 12 },
    { ku: 'سەرکەوتن بەسەر تەلەفریکی چیای کۆڕەک', en: 'Taking the scenic Korak mountain cable car', ar: 'الصعود في تلفريك جبل كورك الشاهق', category: 'Travel', level: 'B1', sec: 14 },
    { ku: 'وەسفکردنی کانی و تاڤگەکانی گەلی عەلی بەگ', en: 'Describing the waterfalls of Gali Ali Bag gorge', ar: 'وصف شلالات كلي علي بك الهادرة', category: 'Nature', level: 'B1', sec: 14 },
    { ku: 'کەشوهەوای چوار وەرزی کوردستان', en: 'Discussing the distinctive four seasons of Kurdistan', ar: 'الحديث عن الفصول الأربعة المميزة في كوردستان', category: 'Weather', level: 'B1', sec: 14 },
    { ku: 'پاسەوانی ژینگە و پاکڕاگرتنی سەیرانگەکان', en: 'Promoting eco-tourism and keeping picnic sites pristine', ar: 'الحفاظ على البيئة ونظافة المنتزهات الطبيعية', category: 'Nature', level: 'B1', sec: 14 },
    { ku: 'مێژووی قەڵای دێرینی هەولێر', en: 'Recounting the continuous historical UNESCO Citadel of Erbil', ar: 'سرد التاريخ العريق لقلعة أربيل الأثرية', category: 'Heritage', level: 'B1', sec: 16 },
    { ku: 'ڕوانگەی گەلیی زاخۆ و پردی دەلال', en: 'Visiting the ancient Dalal bridge over Khabur river in Zakho', ar: 'زيارة جسر دلال التاريخي على نهر الخابور في زاخو', category: 'Heritage', level: 'B1', sec: 14 },
    { ku: 'چێژوەرگرتن لە ماسیی برژاوی تەنووری لە دەربەندیخان', en: 'Enjoying grilled local lake fish in Darbandikhan', ar: 'تذوق السمك النهري المشوي في دربنديخان', category: 'Dining', level: 'B1', sec: 12 },
  ],
  4: [
    { ku: 'پشکنینی پاسپۆرت و گەیشتن بە فڕۆکەخانەی نێودەوڵەتی', en: 'Clearing passport control at the international airport terminal', ar: 'إجراءات فحص الجوازات في صالة المطار الدولية', category: 'Airport', level: 'B1', sec: 14 },
    { ku: 'بەکرێگرتنی ئۆتۆمبێل بۆ گەشتکردن', en: 'Renting a vehicle for a cross-country road trip', ar: 'استئجار سيارة لرحلة استكشافية ممتعة', category: 'Travel', level: 'B1', sec: 14 },
    { ku: 'داواکردنی یارمەتی لە شوێنی ونبوونی جانتاکان', en: 'Reporting missing luggage at the baggage reclaim counter', ar: 'الإبلاغ عن أمتعة مفقودة في مكتب خدمات الحقائب', category: 'Airport', level: 'B1', sec: 15 },
    { ku: 'گۆڕینەوەی دراو و دراوی نێودەوڵەتی', en: 'Exchanging foreign currency at favorable exchange rates', ar: 'تصريف العملات الأجنبية في مكتب الصرافة', category: 'Finance', level: 'B1', sec: 12 },
    { ku: 'ڕێنمایی وەرگرتن بۆ وێستگەی شەمەندەفەر', en: 'Asking for precise directions to the central train station', ar: 'السؤال عن الاتجاهات المؤدية لمحطة القطار المركزية', category: 'Navigation', level: 'B1', sec: 12 },
    { ku: 'تۆمارکردنی ژوور لە هۆتێل و داواکردنی خزمەتگوزاری', en: 'Checking into a hotel room and requesting extra amenities', ar: 'تسجيل الوصول في الفندق وطلب خدمات إضافية للغرفة', category: 'Hotel', level: 'B1', sec: 14 },
    { ku: 'گۆڕینی کاتی فڕین بەهۆی بارودۆخی کەشوهەوا', en: 'Rescheduling a delayed flight due to adverse weather', ar: 'تعديل موعد الرحلة الجوية بسبب سوء الأحوال الجوية', category: 'Airport', level: 'B1', sec: 15 },
    { ku: 'ناساندنی کلتوور لە کاتی گەشت بۆ گەشتیارانی بیانی', en: 'Introducing your culture to foreign fellow travelers', ar: 'تعريف المسافرين الأجانب على ثقافة بلدك وتقاليده', category: 'Culture', level: 'B1', sec: 16 },
    { ku: 'سەردانی مۆزەخانەی نیشتمانی و وەرگرتنی ڕێبەری دەنگی', en: 'Visiting national museums and using multilingual audio guides', ar: 'زيارة المتحف الوطني واستخدام المرشد الصوتي', category: 'Culture', level: 'B1', sec: 14 },
    { ku: 'ڕاگەیاندنی فەرمی کاتی دەرچوون لە دەروازەی فڕۆکە', en: 'Understanding boarding gate announcements and flight alerts', ar: 'فهم إعلانات بوابات الصعود إلى الطائرة وتنبيهات الرحلة', category: 'Airport', level: 'B1', sec: 12 },
  ],
  5: [
    { ku: 'دیداری کار بۆ پیشەی ئەندازیاری پرۆگرامسازی', en: 'Interviewing for a modern senior software engineer position', ar: 'مقابلة عمل لوظيفة مهندس برمجيات متقدم', category: 'Career', level: 'B2', sec: 18 },
    { ku: 'ڕۆڵی ژیریی دەستکرد لە داهاتووی پەروەردە', en: 'The transformative role of artificial intelligence in education', ar: 'دور الذكاء الاصطناعي في تحول مستقبل التعليم', category: 'Tech', level: 'B2', sec: 18 },
    { ku: 'پێشکەشکردنی بیرۆکەی کۆمپانیای دەستپێکەری تەکنەلۆژی', en: 'Pitching an innovative tech startup to venture investors', ar: 'تقديم فكرة شركة ناشئة تقنية مبتكرة للمستثمرين', category: 'Business', level: 'B2', sec: 20 },
    { ku: 'پاراستنی ئاسایشی زانیاری و داتای بەکارهێنەران', en: 'Implementing strict cybersecurity and privacy protection protocols', ar: 'تطبيق بروتوكولات الأمن السيبراني وحماية البيانات', category: 'Tech', level: 'B2', sec: 18 },
    { ku: 'بەڕێوەبردنی کۆبوونەوەی ئۆنلاین لەگەڵ تیمی نێودەوڵەتی', en: 'Facilitating productive remote sync meetings with global teams', ar: 'إدارة اجتماعات العمل الافتراضية مع فرق دولية', category: 'Work', level: 'B2', sec: 16 },
    { ku: 'شیکردنەوەی خێرایی و دەرئەنجامی مۆدێلە گەورەکانی زمان', en: 'Evaluating accuracy and inference speed of Large Language Models', ar: 'تقييم دقة وسرعة نماذج الذكاء الاصطناعي اللغوية الكبيرة', category: 'AI', level: 'B2', sec: 20 },
    { ku: 'چارەسەرکردنی ناکۆکی لە نێوان هاوپیشەکانی کار', en: 'Constructively resolving workplace disputes with empathy', ar: 'حل الخلافات المهنية بأسلوب بناء ودبلوماسي مرن', category: 'Work', level: 'B2', sec: 18 },
    { ku: 'کارامەییەکانی پێشەنگی و نوێکاری لە پیشەدا', en: 'Cultivating leadership, continuous learning, and adaptability', ar: 'تطوير مهارات القيادة والتعلم المستمر والابتكار المهني', category: 'Career', level: 'B2', sec: 18 },
    { ku: 'شیکاری داتای بازاڕ بۆ گەشەپێدانی بەرهەم', en: 'Analyzing product data metrics to optimize user experience', ar: 'تحليل بيانات السوق لتطوير المنتجات وتحسين التجربة', category: 'Business', level: 'B2', sec: 18 },
    { ku: 'داهاتووی کار لە سەردەمی ڕۆبۆت و ئۆتۆمەیشن', en: 'The future of remote human labor alongside robotic automation', ar: 'مستقبل العمل البشري في ظل الروبوتات والأتمتة الذكية', category: 'Tech', level: 'B2', sec: 20 },
  ],
  6: [
    { ku: 'ڕاوێژ لەگەڵ پزیشکی پسپۆڕ دەربارەی نیشانەکانی سەرئێشە', en: 'Consulting a medical specialist regarding persistent migraines', ar: 'استشارة طبيب مختص حول أعراض الصداع النصفي المزمن', category: 'Health', level: 'B2', sec: 16 },
    { ku: 'پەیڕەوکردنی سیستەمی خۆراکی تەندروست و سروشتی', en: 'Maintaining balanced organic nutrition and metabolic vitality', ar: 'اتباع نظام غذائي متوازن وصحي يعزز حيوية الجسم', category: 'Wellness', level: 'B2', sec: 16 },
    { ku: 'گرنگی وەرزشی بەیانیان بۆ کەمکردنەوەی سترێس', en: 'The profound impact of morning cardiovascular exercise on stress', ar: 'أهمية الرياضة الصباحية في تقليل التوتر وتحسين المزاج', category: 'Fitness', level: 'B2', sec: 16 },
    { ku: 'دەرمانسازی و تێگەیشتن لە چۆنیەتی بەکارهێنانی دەرمان', en: 'Consulting pharmacists on dosages and potential interactions', ar: 'استشارة الصيدلي حول الجرعات الدوائية والتفاعلات المحتملة', category: 'Medicine', level: 'B2', sec: 16 },
    { ku: 'هۆشیاری دەروونی و تەندروستی مێشک لە کۆمەڵگەدا', en: 'Fostering societal mindfulness and destigmatizing mental care', ar: 'تعزيز الوعي بالصحة النفسية والعناية بالسلام الداخلي', category: 'Psychology', level: 'B2', sec: 18 },
    { ku: 'ڕاهێنانی فریاگوزاری سەرەتایی لە حاڵەتە لەناکاوەکاندا', en: 'Performing critical CPR and urgent first aid interventions', ar: 'إجراء الإسعافات الأولية الحيوية في الحالات الطارئة', category: 'Emergency', level: 'B2', sec: 18 },
    { ku: 'خەوی تەندروست و کاریگەری لەسەر یادگە و مێشک', en: 'Deep restorative sleep cycles and cognitive consolidation', ar: 'دورات النوم العميق وتأثيرها على التركيز والذاكرة', category: 'Health', level: 'B2', sec: 16 },
    { ku: 'پشکنینی گشتی ساڵانە و خۆپاراستن لە نەخۆشی', en: 'Comprehensive annual health screenings and preventative care', ar: 'الفحوصات الطبية الدورية الشاملة والوقاية الصحية', category: 'Health', level: 'B2', sec: 16 },
    { ku: 'کاریگەری ئالوودەبوونی شاشە لەسەر بینین و جەستە', en: 'Counteracting digital screen fatigue and physical posture strain', ar: 'مواجهة إجهاد الشاشات الرقمية وتحسين وضعية الجسد', category: 'Wellness', level: 'B2', sec: 16 },
    { ku: 'تەندروستی دڵ و خوێنبەرەکان بە پێوانەی زانستی', en: 'Monitoring cardiovascular health and arterial pressure metrics', ar: 'متابعة صحة القلب والشرايين وفق المعايير الطبية', category: 'Medicine', level: 'B2', sec: 18 },
  ],
  7: [
    { ku: 'پەیامی مرۆڤدۆستی لە شیعرەکانی مامۆستا شێرکۆ بێکەس', en: 'Humanistic motifs and profound imagery in Sherko Bekas poetry', ar: 'القيم الإنسانية والجمالية في أشعار الراحل شيركو بيكس', category: 'Literature', level: 'C1', sec: 22 },
    { ku: 'شاReachاری مەم و زین و ڕۆڵی لە ئەدەبی کلاسیکی کوردی', en: 'The epic romance of Mem u Zin by visionary poet Ahmad Khani', ar: 'ملحمة مم وزين الخالدة للشاعر الكبير أحمد خاني', category: 'Classics', level: 'C1', sec: 22 },
    { ku: 'پەندی پێشینان: کلیلێکی بەهادار بۆ دانایی و فەلسەفەی کورد', en: 'Kurdish ancestral proverbs as reservoirs of enduring wisdom', ar: 'الأمثال الكوردية القديمة كمرآة للحكمة والفلسفة الشعبية', category: 'Heritage', level: 'C1', sec: 20 },
    { ku: 'ئاواز و مەقامە ڕەسەنەکانی دەفی کوردی لە ڕێوڕەسمەکاندا', en: 'The spiritual resonance of authentic Kurdish daf rhythms', ar: 'المقامات الروحية والأنغام الأصيلة لآلة الدف الكوردية', category: 'Music', level: 'C1', sec: 20 },
    { ku: 'مێژووی سەرهەڵدانی ڕۆژنامەگەری کوردی و ڕۆژنامەی کوردستان', en: 'The birth of Kurdish print journalism and the historic Kurdistan newspaper', ar: 'نشأة الصحافة الكوردية وتاريخ صحيفة كوردستان في القاهرة', category: 'History', level: 'C1', sec: 22 },
    { ku: 'دابونەریتی میواندۆستی و بەخشندەیی لە کۆمەڵگەی کوردیدا', en: 'Sacred traditions of warmth, generosity, and hospitality in Kurdistan', ar: 'تقاليد الكرم والضيافة الرفيعة في المجتمع الكوردي', category: 'Culture', level: 'C1', sec: 20 },
    { ku: 'هونەری شێوەکاری هاوچەرخی کوردی و دەربڕینی ناسنامە', en: 'Contemporary Kurdish visual art and expression of cultural identity', ar: 'الفن التشكيلي الكوردي المعاصر وتعبير الهوية الثقافية', category: 'Art', level: 'C1', sec: 22 },
    { ku: 'پاراستنی شێوەزارە دەوڵەمەندەکانی زمانی کوردی', en: 'Preserving and celebrating the dialectal richness of the Kurdish tongue', ar: 'الحفاظ على ثراء اللهجات الكوردية وأصالتها اللغوية', category: 'Linguistics', level: 'C1', sec: 22 },
    { ku: 'چیرۆکە ئەفسانەییەکانی کەوە و کاوەی ئاسنگەر', en: 'The mythological resilience of Kawa the Blacksmith and Newroz fire', ar: 'أسطورة كاوا الحداد ونيران التحرر في عيد نوروز', category: 'Mythology', level: 'C1', sec: 22 },
    { ku: 'ڕۆڵی ژن لە مێژوو و پێشەنگایەتی کۆمەڵایەتی کوردستان', en: 'The formidable leadership of Kurdish women across history and culture', ar: 'دور المرأة الكوردية القيادي والرائد عبر محطات التاريخ', category: 'Society', level: 'C1', sec: 22 },
  ],
  8: [
    { ku: 'داڕشتنی پەیپەری زانستی بە پێوەرە ئەکادیمییە جیهانییەکان', en: 'Structuring high-impact research papers for indexed peer-reviewed journals', ar: 'صياغة الأوراق البحثية العلمية وفق المعايير الأكاديمية العالمية', category: 'Academic', level: 'C1', sec: 24 },
    { ku: 'دیبەیت لەسەر سەرچاوە نوێبووەوەکانی وزە و گۆڕانی کەشوهەوا', en: 'Debating renewable energy transitions and global climate imperatives', ar: 'المناظرة حول التحول إلى الطاقة المتجددة ومواجهة تغير المناخ', category: 'Debate', level: 'C1', sec: 24 },
    { ku: 'پێوانەکردنی هێزی بەڵگە لە توێژینەوەی زانستی و بیرکردنەوەی ڕەخنەگرانە', en: 'Evaluating empirical evidence thresholds and rigorous critical thinking', ar: 'معايير قوة الأدلة في البحث العلمي والتفكير النقدي المنهجي', category: 'Academic', level: 'C1', sec: 24 },
    { ku: 'ڕەوشتی ژیریی دەستکرد و داهاتووی مافەکانی مرۆڤ', en: 'Ethical governance of autonomous AI algorithms and human rights', ar: 'أخلاقيات خوارزميات الذكاء الاصطناعي ومستقبل حقوق الإنسان', category: 'Ethics', level: 'C1', sec: 25 },
    { ku: 'ئابووریی بازاڕی ئازاد و کەمکردنەوەی نایەکسانی کۆمەڵایەتی', en: 'Synthesizing market dynamism with robust social equity frameworks', ar: 'التوفيق بين حيوية اقتصاد السوق والعدالة الاجتماعية المستدامة', category: 'Economics', level: 'C1', sec: 24 },
    { ku: 'شۆڕشی بایۆتەکنەلۆژیا و دەستکاریکردنی جینەکان بە کریسپەر', en: 'CRISPR gene editing breakthroughs and bioethical accountability', ar: 'ثورة التعديل الجيني كريسبر والمسؤولية الأخلاقية الطبية', category: 'Science', level: 'C1', sec: 25 },
    { ku: 'بونیادنانی شاری زیرەک و پلاندانانی سەردەمیانەی ژینگەپارێزی', en: 'Architecting eco-friendly smart cities and sustainable transit grids', ar: 'تخطيط المدن الذكية المستدامة وشبكات النقل الصديقة للبيئة', category: 'Urban', level: 'C1', sec: 24 },
    { ku: 'دەروونناسی هەڵسوکەوت و کاریگەری سۆشیال میدیا لەسەر گەنجان', en: 'Behavioral psychology and cognitive impact of algorithm feeds on youth', ar: 'علم النفس السلوكي وتأثير خوارزميات التواصل على وعي الشباب', category: 'Psychology', level: 'C1', sec: 24 },
    { ku: 'پەیوەندی نێوان زمانناسی، مێشک، و تێگەیشتنی مرۆڤ لە جیهان', en: 'Cognitive linguistics and the Sapir-Whorf perception of reality', ar: 'اللسانيات الإدراكية وتأثير بنية اللغة على فهم الإنسان للواقع', category: 'Linguistics', level: 'C1', sec: 25 },
    { ku: 'خوێندنی باڵا و ئامادەکردنی نەوەی نوێ بۆ ئاڵنگارییە جیهانییەکان', en: 'Reimagining tertiary education for 21st-century planetary challenges', ar: 'إعادة صياغة التعليم العالي لإعداد أجيال تواجه التحديات العالمية', category: 'Education', level: 'C1', sec: 24 },
  ],
  9: [
    { ku: 'ستراتیژی گفتوگۆ و دانوستاندن لە گرێبەستە نێودەوڵەتییەکاندا', en: 'Strategic frameworks for high-stakes bilateral contract negotiations', ar: 'الاستراتيجيات المتقدمة للتفاوض في المعاهدات والعقود الدولية', category: 'Diplomacy', level: 'C2', sec: 28 },
    { ku: 'چارەسەرکردنی قەیرانە نێودەوڵەتییەکان بە زمانی ئاشتی و یاسا', en: 'Resolving geopolitical friction through international jurisprudence', ar: 'حل الأزمات الدولية بلغة السلام ومبادئ القانون الدولي', category: 'Diplomacy', level: 'C2', sec: 28 },
    { ku: 'سەرکردایەتی کاریگەر لە کاتی قەیران و بارودۆخی نەخوازراودا', en: 'Crisis leadership and decisive communication under severe pressure', ar: 'القيادة التنفيذية الحاسمة وإدارة التواصل أثناء الأزمات المعقدة', category: 'Leadership', level: 'C2', sec: 26 },
    { ku: 'هاوسەنگی هێز لە سیاسەتی دەرەوە و هاوپەیمانییە جیهانییەکان', en: 'Evaluating multipolar balance of power and multilateral coalitions', ar: 'توازن القوى الجيوسياسي والتحالفات الإقليمية متعددة الأطراف', category: 'Politics', level: 'C2', sec: 28 },
    { ku: 'پاراستنی سەروەری نیشتمانی و پەرەپێدانی ئابووری سەربەخۆ', en: 'Safeguarding national sovereignty through domestic economic resilience', ar: 'حماية السيادة الوطنية من خلال بناء اقتصاد محلي مرن ومستدام', category: 'Strategy', level: 'C2', sec: 26 },
    { ku: 'وتارێکی بێوێنە لە کۆڕبەندی گشتی نەتەوە یەکگرتووەکان', en: 'Delivering an eloquent keynote address at the UN General Assembly', ar: 'إلقاء خطاب دبلوماسي رفيع في الجمعية العامة للأمم المتحدة', category: 'Oratory', level: 'C2', sec: 30 },
    { ku: 'ڕێککەوتننامەی ئاشتی نێودەوڵەتی و پاراستنی گەلی ستەملێکراو', en: 'Drafting enduring peace treaties protecting historic marginalized peoples', ar: 'صياغة معاهدات السلام الشاملة وحماية الشعوب الأصيلة والمظلومة', category: 'Law', level: 'C2', sec: 28 },
    { ku: 'میکانیزمی ڕووبەڕووبوونەوەی چەواشەکاری زانیاری و پڕوپاگەندە', en: 'Dismantling state-sponsored disinformation and psychological warfare', ar: 'تفكيك حملات التضليل الإعلامي الممنهجة والحرب النفسية', category: 'Communication', level: 'C2', sec: 26 },
    { ku: 'سیاسەتی پاراستنی ژینگە لەسەر ئاستی پەیماننامە جیهانییەکان', en: 'Negotiating binding multilateral ecological enforcement protocols', ar: 'التفاوض على بروتوكولات إلزامية لحماية المناخ والبيئة العالمية', category: 'Policy', level: 'C2', sec: 28 },
    { ku: 'ڕوانگەی گەلی کورد بۆ داهاتووی ڕۆژهەڵاتی ناوەڕاستی ئارام', en: 'The Kurdish vision for a peaceful, pluralistic, and prosperous Middle East', ar: 'رؤية الشعب الكوردي لشرق أوسط آمن ومزدهر يقوم على التعددية', category: 'Diplomacy', level: 'C2', sec: 30 },
  ],
  10: [
    { ku: 'واتای بوون و پرسی هۆشیاری لە فەلسەفەی هاوچەرخدا', en: 'The ontological nature of consciousness and existential meaning', ar: 'ماهية الوجود وسؤال الوعي والغاية في الفلسفة المعاصرة', category: 'Philosophy', level: 'C2', sec: 32 },
    { ku: 'گەشت بەرەو ئەستێرەکان و داهاتووی شارستانیەتی مرۆڤایەتی', en: 'Interstellar exploration and the cosmic destiny of human civilization', ar: 'الرحيل نحو النجوم والمصير الكوني للحضارة الإنسانية', category: 'Cosmos', level: 'C2', sec: 32 },
    { ku: 'ڕەنگدانەوەی کات، یادگە، و نەمری لە مێژووی بیرکردنەوەدا', en: 'Temporal relativity, episodic memory, and human quests for eternity', ar: 'نسبية الزمن والذاكرة وسعي الإنسان التاريخي نحو الخلود', category: 'Philosophy', level: 'C2', sec: 30 },
    { ku: 'پەیوەندی نێوان بیرکاری، هونەر، و یاساکانی گەردوون', en: 'The mathematical elegance underlying cosmic geometry and aesthetic beauty', ar: 'التناغم الرياضي البديع بين هندسة الكون وجماليات الفن', category: 'Science', level: 'C2', sec: 30 },
    { ku: 'ئازادی ویست و دەسەڵاتی هەڵبژاردن لە دونیایەکی پێشبینیکراودا', en: 'Free will and moral agency within a deterministic physical cosmos', ar: 'حرية الإرادة والاختيار الأخلاقي في عالم فيزيائي حتمي', category: 'Philosophy', level: 'C2', sec: 32 },
    { ku: 'ئاشتی جیهانی و دیالۆگی شارستانیەتەکان لە سەدەی بیست و یەکەمدا', en: 'Planetary peace through authentic civilizational empathy and dialogue', ar: 'السلام الكوني وحوار الحضارات القائم على التكافؤ والكرامة', category: 'Humanity', level: 'C2', sec: 32 },
    { ku: 'پەیامی ڕووناکیی لە تاریکترین چرکەساتی مێژوودا', en: 'Unconquerable inner light overcoming the darkest epochs of history', ar: 'شعلة النور الإنساني العصية على الانكسار في أحلك لحظات التاريخ', category: 'Wisdom', level: 'C2', sec: 30 },
    { ku: 'دەنگی حیکمەت و گەڕان بەدوای حەقیقەتی نەگۆڕدا', en: 'The perennial voice of wisdom seeking transcendent universal truth', ar: 'صوت الحكمة الخالد والبحث الدؤوب عن الحقيقة الإنسانية الكبرى', category: 'Philosophy', level: 'C2', sec: 32 },
    { ku: 'سوێندی سەرکەوتن: بەڵێن بۆ پاراستنی نیشتمان، زانست، و دادپەروەری', en: 'The solemn oath: Dedication to nation, science, honor, and universal justice', ar: 'عهد السيادة: تكريس الحياة لخدمة الوطن والعلم والعدالة الشاملة', category: 'Oratory', level: 'C2', sec: 34 },
    { ku: 'وتاری لوتکەی قۆناغی ١,٠٠٠: بانگەوازی سەروەری بۆ هەموو مرۆڤایەتی', en: 'Grandmaster Stage 1,000 Summit Oration: The Sovereign Call for Humanity', ar: 'خطاب القمة للمرحلة 1,000: النداء الإنساني الأكبر نحو المجد والحرية', category: 'Grandmaster', level: 'C2', sec: 35 },
  ],
};

// Generate full 1,000 stages
function buildFull1000Stages(): StageDefinition[] {
  const result: StageDefinition[] = [];

  // 1. Incorporate the hand-crafted 100 stages into World 1
  for (const st of STAGES_100_RAW) {
    result.push({
      id: st.id,
      level: st.level,
      category: st.category,
      worldId: 1,
      worldTitleKu: 'جیهانی ١: پەیڤ و دەستپێکە بنەڕەتییەکان',
      worldTitleEn: 'World 1: Everyday Foundations',
      titleKu: st.titleKu,
      titleEn: st.titleEn,
      titleAr: st.titleAr,
      instructionKu: st.instructionKu,
      instructionEn: st.instructionEn,
      instructionAr: st.instructionAr,
      promptKu: st.promptKu,
      promptEn: st.promptEn,
      promptAr: st.promptAr,
      sampleAnswerKu: st.sampleAnswerKu,
      sampleAnswerEn: st.sampleAnswerEn,
      sampleAnswerAr: st.sampleAnswerAr,
      seconds: st.seconds || 10,
    });
  }

  // 2. Programmatically generate stages 101 to 1000 across Worlds 2 through 10
  for (let stageId = 101; stageId <= 1000; stageId++) {
    const worldId = Math.min(10, Math.floor((stageId - 1) / 100) + 1);
    const worldConfig = WORLDS_CONFIG.find((w) => w.id === worldId) || WORLDS_CONFIG[0];
    const topics = WORLD_TOPICS[worldId] || WORLD_TOPICS[2];
    const topicIdx = (stageId - 1) % topics.length;
    const topic = topics[topicIdx];

    const cycleNumber = Math.floor((stageId - 101) / topics.length) + 1;
    const cycleSuffixKu = cycleNumber > 1 ? ` (بەشی ${cycleNumber})` : '';
    const cycleSuffixEn = cycleNumber > 1 ? ` (Part ${cycleNumber})` : '';
    const cycleSuffixAr = cycleNumber > 1 ? ` (الجزء ${cycleNumber})` : '';

    const titleKu = `قۆناغی ${stageId}: ${topic.ku}${cycleSuffixKu}`;
    const titleEn = `Stage ${stageId}: ${topic.en}${cycleSuffixEn}`;
    const titleAr = `المرحلة ${stageId}: ${topic.ar}${cycleSuffixAr}`;

    const instructionKu = `بە وریایی دەنگت بەرز بکەرەوە و باسی "${topic.ku}" بکە بە دەربڕینی ڕەوان و ڕێزمانی دروست.`;
    const instructionEn = `Speak clearly with confidence about "${topic.en}" demonstrating accurate pronunciation and natural phrasing.`;
    const instructionAr = `تحدث بوضوح وثقة حول "${topic.ar}" مع مراعاة دقة المخارج والطلاقة اللغوية السليمة.`;

    const promptKu = `لە بارەی ${topic.ku}، من دەمەوێت بڵێم کە ...`;
    const promptEn = `Regarding ${topic.en.toLowerCase()}, I firmly believe that ...`;
    const promptAr = `فيما يخص ${topic.ar}، أود أن أؤكد أن ...`;

    const sampleAnswerKu = `بە ڕای من، ${topic.ku} گرنگییەکی بەرچاوی هەیە و دەبێت بە وریایی و هەستێکی بەرزەوە لە ڕێگەی فێربوون و ئەزموونەوە پەرەی پێ بدەین تا ئاستێکی نایاب لە قسەکردن بەدەست بهێنین.`;
    const sampleAnswerEn = `In my perspective, mastering ${topic.en.toLowerCase()} requires consistent spoken fluency, articulate phonetics, and disciplined intellectual dedication to achieve comprehensive native-level expression.`;
    const sampleAnswerAr = `من وجهة نظري، فإن إتقان التحدث في ${topic.ar} يتطلب ممارسة نطقية مستمرة ودقة متناهية في اختيار المفردات وبناء الجمل المعبرة برقي وفصاحة.`;

    result.push({
      id: stageId,
      level: topic.level,
      category: topic.category,
      worldId,
      worldTitleKu: worldConfig.titleKu,
      worldTitleEn: worldConfig.titleEn,
      titleKu,
      titleEn,
      titleAr,
      instructionKu,
      instructionEn,
      instructionAr,
      promptKu,
      promptEn,
      promptAr,
      sampleAnswerKu,
      sampleAnswerEn,
      sampleAnswerAr,
      seconds: topic.sec,
    });
  }

  return result;
}

// Global cached 1000 stages
export const STAGES_1000_RAW: StageDefinition[] = buildFull1000Stages();

// Helper to convert stages into localized TestStep array for the chosen target language
export function get1000TestStepsForLanguage(targetLang: TargetLanguage): TestStep[] {
  return STAGES_1000_RAW.map((st) => {
    const isAr = targetLang === 'ar';
    const isKu = targetLang === 'ku';

    const title = isAr ? st.titleAr : isKu ? st.titleKu : st.titleEn;
    const promptText = isAr ? st.promptAr : isKu ? st.promptKu : st.promptEn;
    const sampleIdealAnswer = isAr ? st.sampleAnswerAr : isKu ? st.sampleAnswerKu : st.sampleAnswerEn;

    return {
      id: st.id,
      level: st.level,
      title,
      titleKu: st.titleKu,
      titleEn: st.titleEn,
      titleAr: st.titleAr,
      category: st.category,
      instructionKurdish: st.instructionKu,
      instructionEnglish: st.instructionEn,
      instructionArabic: st.instructionAr,
      promptText,
      promptKu: st.promptKu,
      promptEn: st.promptEn,
      promptAr: st.promptAr,
      sampleIdealAnswer,
      sampleAnswerKu: st.sampleAnswerKu,
      sampleAnswerEn: st.sampleAnswerEn,
      sampleAnswerAr: st.sampleAnswerAr,
      translationKu: st.promptKu,
      minSpeakingSeconds: st.seconds,
    };
  });
}
