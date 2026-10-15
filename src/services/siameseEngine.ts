import { ProperNounItem, VocabularyItem, AncientStyleKey } from '../types';

export interface SiameseTranslationResult {
  ancientText: string;
  styleTitle: string;
  toneDescription: string;
  pronunciationTips: string;
  vocabularyList: VocabularyItem[];
  properNouns: ProperNounItem[];
  historicalNote: string;
}

// Known proper nouns dictionary for Siamese period adaptation
const PROPER_NOUN_PATTERNS: Array<{
  regex: RegExp;
  category: ProperNounItem['category'];
  adaptation: (match: string, style: AncientStyleKey) => string;
  phoneticGuide: string;
  ancientPronunciation?: string;
  usageNote: string;
}> = [
  // People
  {
    regex: /ลิซ่า/g,
    category: 'person',
    adaptation: (_m, style) => style === 'ayutthaya_court' ? 'แม่หญิงลิซ่า' : 'แม่หญิงลิซ่า',
    phoneticGuide: 'ลิ-ซ่า (Li-sa)',
    ancientPronunciation: 'แม่-หยิง-ลิ-ซ่า',
    usageNote: 'เติมคำนำหน้าสตรีสูงศักดิ์ "แม่หญิง" ตามธรรมเนียมอยุธยา',
  },
  {
    regex: /เจนนี่/g,
    category: 'person',
    adaptation: () => 'แม่หญิงเจนนี่',
    phoneticGuide: 'เจน-นี่ (Jen-nie)',
    ancientPronunciation: 'แม่-หยิง-เจน-นี่',
    usageNote: 'เติมคำนำหน้านาง "แม่หญิง" เพื่อความไพเราะสุภาพแบบชาวสยาม',
  },
  {
    regex: /จอห์น/g,
    category: 'person',
    adaptation: (_m, style) => style === 'ayutthaya_court' ? 'ท่านขุนจอห์น' : 'นายจอห์นชาววิลาศ',
    phoneticGuide: 'จอห์น (John)',
    ancientPronunciation: 'ท่าน-ขุน-จอน',
    usageNote: 'คนโบราณเรียกฝรั่งต่างชาติด้วยยศขุนนางหรือระบุสัญชาติวิลาศ (ชาวตะวันตก)',
  },
  {
    regex: /(?:พี่)?สมชาย/g,
    category: 'person',
    adaptation: (_m, style) => style === 'sukhothai' ? 'อ้ายสมชาย' : style === 'ayutthaya_court' ? 'คุณพี่สมชาย' : 'พี่สมชาย',
    phoneticGuide: 'สม-ชาย (Som-chai)',
    ancientPronunciation: 'คุน-พี่-สม-ชาย',
    usageNote: 'ใช้สรรพนาม "คุณพี่" หรือ "พี่" ตามสถานะความเคารพแบบไทยโบราณ',
  },
  {
    regex: /อาจารย์สมศักดิ์/g,
    category: 'person',
    adaptation: (_m, style) => style === 'ayutthaya_court' ? 'ท่านปราชญ์ราชครูสมศักดิ์' : 'ท่านครูสมศักดิ์',
    phoneticGuide: 'อา-จาน-สม-สัก (Som-sak)',
    ancientPronunciation: 'ท่าน-ปาด-สม-สัก',
    usageNote: 'โบราณยกย่องอาจารย์เป็น "ราชครู" หรือ "ท่านปราชญ์"',
  },
  // Places
  {
    regex: /โตเกียว/g,
    category: 'place',
    adaptation: () => 'พระนครโตเกียว แดนบูรพาอาทิตย์อุทัย',
    phoneticGuide: 'โต-เกียว (To-kyo)',
    ancientPronunciation: 'พฺระ-นะ-คอน-โต-เกียว',
    usageNote: 'ชาวสยามโบราณเรียกดินแดนญี่ปุ่นว่า "แดนอาทิตย์อุทัย" หรือ "แคว้นบูรพา"',
  },
  {
    regex: /กรุงเทพฯ|กรุงเทพมหานคร|กรุงเทพ/g,
    category: 'place',
    adaptation: (_m, style) => style === 'ayutthaya_colloquial' || style === 'ayutthaya_court' ? 'พระนครบางกอก กรุงเทพทวารวดี' : 'เมืองบางกอก',
    phoneticGuide: 'กรุง-เทบ (Krung-thep)',
    ancientPronunciation: 'พฺระ-นะ-คอน-บาง-กอก',
    usageNote: 'ในสมัยอยุธยา พื้นที่นี้คือชุมชน "บางกอก" ด่านหน้าปากแม่น้ำเจ้าพระยา',
  },
  {
    regex: /สยามพารากอน/g,
    category: 'place',
    adaptation: () => 'โรงห้างการค้ายิ่งใหญ่สยามพารากอน',
    phoneticGuide: 'สะ-หยาม-พา-รา-กอน (Siam Paragon)',
    ancientPronunciation: 'โรง-ห้าง-สะ-หยาม-พา-รา-กอน',
    usageNote: 'แปลงสถานที่ศูนย์การค้ายุคใหม่เป็น "โรงห้างการค้า" ตามสำนวนจัดตั้งชุมชนการค้าโบราณ',
  },
  // Technology & Modern Concepts
  {
    regex: /ไอโฟน|iphone/gi,
    category: 'technology',
    adaptation: () => 'กระจกส่องเสียงอัจฉริยะไอโฟน',
    phoneticGuide: 'ไอ-โฟน (iPhone)',
    ancientPronunciation: 'กฺระ-จก-ส่อง-เสียง-ไอ-โฟน',
    usageNote: 'เปรียบเทียบหน้าจอสมาร์ตโฟนดั่ง "กระจกส่องเงาส่งเสียง" ในวรรณคดี',
  },
  {
    regex: /ไลน์|line/gi,
    category: 'technology',
    adaptation: () => 'สารลายลักษณ์อักษรไลน์',
    phoneticGuide: 'ลายน / ไลน์ (Line)',
    ancientPronunciation: 'สาน-ลาย-ลัก-อัก-สอน-ลายน',
    usageNote: 'เปรียบแอปพลิเคชันแชตเป็น "การส่งสารลายลักษณ์อักษรด่วน"',
  },
  {
    regex: /รถยนต์|รถเก๋ง/g,
    category: 'technology',
    adaptation: () => 'ยานเกวียนยนต์เทียมกล',
    phoneticGuide: 'รด-ยน (Car)',
    ancientPronunciation: 'ยาน-เกวียน-ยน-เทียม-กน',
    usageNote: 'โบราณไม่มียานยนต์ ใช้คำว่า "ยานเกวียนเทียมกล" เพื่อสื่อถึงพาหนะเคลื่อนที่ด้วยเครื่องจักร',
  },
  {
    regex: /ไอศกรีม|ไอติม/g,
    category: 'other',
    adaptation: () => 'ของหวานน้ำแข็งใสไอศกรีม',
    phoneticGuide: 'ไอ-สะ-กะ-รีม (Ice-cream)',
    ancientPronunciation: 'ของ-หวาน-น้ำ-แข็ง-ไอ-สะ-กะ-รีม',
    usageNote: 'น้ำแข็งเริ่มเข้ามาในสยามสมัย ร.4 จึงเรียกของหวานเย็นนี้ตามลักษณะของหวานเย็น',
  },
];

export function translateSiameseFallback(
  inputText: string,
  style: AncientStyleKey = 'ayutthaya_colloquial'
): SiameseTranslationResult {
  let text = inputText.trim();
  const detectedProperNouns: ProperNounItem[] = [];
  const vocabularyList: VocabularyItem[] = [];

  // 1. Process Proper Nouns first (Preserve and enrich)
  for (const item of PROPER_NOUN_PATTERNS) {
    if (item.regex.test(text)) {
      const matches = text.match(item.regex) || [];
      const originalWord = matches[0] || '';
      const adapted = item.adaptation(originalWord, style);

      if (!detectedProperNouns.some((n) => n.name === originalWord)) {
        detectedProperNouns.push({
          name: originalWord,
          category: item.category,
          ancientAdaptation: adapted,
          phoneticGuide: item.phoneticGuide,
          ancientPronunciation: item.ancientPronunciation,
          usageNote: item.usageNote,
        });
      }

      text = text.replace(item.regex, adapted);
    }
  }

  // 2. Vocabulary transformations mapped to styles
  interface ReplacementRule {
    pattern: RegExp;
    ancientWord: string;
    modernWord: string;
    ancientPhonetic: string;
    modernPhonetic: string;
    detail: string;
    styles?: AncientStyleKey[];
  }

  const RULES: ReplacementRule[] = [
    // Temporal terms
    {
      pattern: /พรุ่งนี้/g,
      ancientWord: 'เพลารุ่งพรุ่งนี้',
      modernWord: 'พรุ่งนี้',
      ancientPhonetic: 'เพ-ลา-รุ่ง-พฺรุ่ง-นี้',
      modernPhonetic: 'พฺรุ่ง-นี้',
      detail: 'คนโบราณบอกเวลาด้วย "เพลา" และระบุยามรุ่ง',
    },
    {
      pattern: /วันนี้/g,
      ancientWord: 'เพลานี้วันปัจจุบัน',
      modernWord: 'วันนี้',
      ancientPhonetic: 'เพ-ลา-นี้',
      modernPhonetic: 'วัน-นี้',
      detail: 'ใช้ "เพลา" หมายถึงเวลาหรือห้วงยาม',
    },
    {
      pattern: /ตอนนี้|ขณะนี้|เวลานี้/g,
      ancientWord: 'เพลานี้',
      modernWord: 'ตอนนี้/เวลา',
      ancientPhonetic: 'เพ-ลา-นี้',
      modernPhonetic: 'ตอน-นี้',
      detail: 'คำว่า "เพลา" (เพ-ลา) นิยมใช้ในสมัยอยุธยาบอกกาลเวลา',
    },
    {
      pattern: /เดี๋ยวนี้|ทันที/g,
      ancientWord: 'ประเดี๋ยวนี้',
      modernWord: 'เดี๋ยวนี้',
      ancientPhonetic: 'ปฺระ-เดี๋ย-วนี้',
      modernPhonetic: 'เดี๋ยว-นี้',
      detail: 'คำว่า "ประเดี๋ยว" ใช้บอกการกระทำที่รวดเร็วทันที',
    },
    {
      pattern: /เดี๋ยว/g,
      ancientWord: 'ประเดี๋ยว',
      modernWord: 'เดี๋ยว/สักครู่',
      ancientPhonetic: 'ปฺระ-เดี๋ยว',
      modernPhonetic: 'เดี๋ยว',
      detail: 'คำวิเศษณ์บอกระยะเวลาชั่วครู่',
    },
    // Pronouns & Verbs
    {
      pattern: /โทรหา|โทรศัพท์หา|โทรบอก/g,
      ancientWord: 'ส่งสัญญาณเจรจาข้ามแดนบอก',
      modernWord: 'โทรศัพท์หา',
      ancientPhonetic: 'ส่ง-สัญ-ยาน-เจ-ระ-จา',
      modernPhonetic: 'โทร-หา',
      detail: 'โบราณสื่อสารข้ามแดนด้วยสัญญาณไฟหรือม้าเร็ว จึงเทียบเป็นการเจรจาข้ามแดน',
    },
    {
      pattern: /จะเดินทางไป|จะไป/g,
      ancientWord: 'จักยาตรามุ่งตรงไปยัง',
      modernWord: 'จะไป/เดินทางไป',
      ancientPhonetic: 'จัก-ยา-ตฺรา',
      modernPhonetic: 'จะ-ไป',
      detail: '"จัก" คือ "จะ", "ยาตรา" คือการเคลื่อนขบวนเดินทาง',
    },
    {
      pattern: /จะ/g,
      ancientWord: 'จัก',
      modernWord: 'จะ',
      ancientPhonetic: 'จัก',
      modernPhonetic: 'จะ',
      detail: 'แสดงอนาคตกาลในภาษาไทยโบราณ',
    },
    {
      pattern: /ช่วยส่งข้อความ/g,
      ancientWord: 'วานช่วยส่งสารถ้อยคำ',
      modernWord: 'ช่วยส่งข้อความ',
      ancientPhonetic: 'วาน-ช่วย-ส่ง-สาน',
      modernPhonetic: 'ช่วย-ส่ง-ข้อ-ความ',
      detail: 'การขอร้องสุภาพใช้คำว่า "วาน" และเรียกข้อความว่า "สารถ้อยคำ"',
    },
    {
      pattern: /กินข้าวหรือยัง|กินข้าวรึยัง/g,
      ancientWord: 'กินข้าวปลาอาหารแล้วฤๅยัง',
      modernWord: 'กินข้าวหรือยัง',
      ancientPhonetic: 'กิน-ข้าว-ปฺลา-อา-หาน-แล้ว-ลือ-ยัง',
      modernPhonetic: 'กิน-ข้าว-หรือ-ยัง',
      detail: 'คนโบราณเรียกอาหารหลักว่า "ข้าวปลาอาหาร" และลงท้ายคำถามด้วย "ฤๅ"',
    },
    {
      pattern: /กินข้าว/g,
      ancientWord: 'กินข้าวปลาอาหาร',
      modernWord: 'กินข้าว',
      ancientPhonetic: 'กิน-ข้าว-ปฺลา',
      modernPhonetic: 'กิน-ข้าว',
      detail: 'สะท้อนความอุดมสมบูรณ์ในน้ำมีปลาในนามีข้าว',
    },
    {
      pattern: /ไปเที่ยวตลาด/g,
      ancientWord: 'ไปเที่ยวชมตลาดบกตลาดย่านร้านค้า',
      modernWord: 'ไปเที่ยวตลาด',
      ancientPhonetic: 'ตะ-หลาด-บก-ตะ-หลาด-ย่าน',
      modernPhonetic: 'ไป-เที่ยว-ตะ-หลาด',
      detail: 'อยุธยามีตลาดบกและตลาดน้ำอันคึกคัก',
    },
    {
      pattern: /พูดโกหก|โกหก/g,
      ancientWord: 'เจรจาโป้ปดมดเท็จ',
      modernWord: 'พูดโกหก',
      ancientPhonetic: 'เจ-ระ-จา-โป้-ปด-มด-เท็ด',
      modernPhonetic: 'พูต-โก-หก',
      detail: '"โป้ปดมดเท็จ" สำนวนโบราณว่าด้วยการพูดเท็จหลอกลวง',
    },
    {
      pattern: /รู้ความจริงหมดแล้ว|รู้ทันหมดแล้ว/g,
      ancientWord: 'รู้เท่าทันความจริงทั้งมวลสิ้นแล้ว',
      modernWord: 'รู้ความจริงหมดแล้ว',
      ancientPhonetic: 'รู้-เท่า-ทัน-ทั้ง-มวน',
      modernPhonetic: 'รู้-ความ-จิง-หมด-แล้ว',
      detail: 'คำสร้อย "สิ้นแล้ว" บ่งบอกความสมบูรณ์ของความรับรู้',
    },
    {
      pattern: /คิดถึงเธอมากเลย|คิดถึงมาก/g,
      ancientWord: 'เฝ้าคะนึงหาออเจ้าทุกลมหายใจเข้าออกยิ่งนัก',
      modernWord: 'คิดถึงมาก',
      ancientPhonetic: 'คะ-นึง-หา-ออ-เจ้า',
      modernPhonetic: 'คิต-ถึง-มาก',
      detail: '"คะนึงหา" การรำพึงคิดถึงด้วยความรักเสน่หา',
    },
    {
      pattern: /เมื่อไหร่จะ|เมื่อไหร่จะได้/g,
      ancientWord: 'เพลาใดจักได้',
      modernWord: 'เมื่อไหร่จะ',
      ancientPhonetic: 'เพ-ลา-ใด-จัก-ได้',
      modernPhonetic: 'เมื่อ-ไหร่-จะ',
      detail: 'ใช้ "เพลาใด" แทนคำว่า "เมื่อไหร่"',
    },
    {
      pattern: /พบกันอีก/g,
      ancientWord: 'พานพบสบพักตร์กันอีกเล่า',
      modernWord: 'เจอกันอีก',
      ancientPhonetic: 'พาน-พบ-สบ-พัก',
      modernPhonetic: 'พบ-กัน-อีก',
      detail: '"สบพักตร์" คือการมองเห็นหน้าตากัน',
    },
    {
      pattern: /อากาศร้อน/g,
      ancientWord: 'ไอดินไอแดดร้อนรุ่มกายายิ่งนัก',
      modernWord: 'อากาศร้อน',
      ancientPhonetic: 'ร้อน-รุ่ม-กา-ยา',
      modernPhonetic: 'อา-กาด-ร้อน',
      detail: 'พรรณนาถึงความร้อนที่กระทบผิวกาย',
    },
    {
      pattern: /ช่วยด้วย/g,
      ancientWord: 'ช่วยข้าด้วยเถิดหนาพวกพ้องไพร่ฟ้า',
      modernWord: 'ช่วยด้วย',
      ancientPhonetic: 'ช่วย-ข้า-ด้วย-เถิด-หนา',
      modernPhonetic: 'ช่วย-ด้วย',
      detail: 'การร้องขอความช่วยเหลือด้วยน้ำเสียงโบราณ',
    },
    {
      pattern: /แต่งตัวสวยมาก/g,
      ancientWord: 'แต่งองค์ทรงเครื่องงามแฉล้มแช่มช้อยยิ่งนัก',
      modernWord: 'แต่งตัวสวยมาก',
      ancientPhonetic: 'แฉ-แล้ม-แช่ม-ช้อย',
      modernPhonetic: 'แต่ง-ตัว-สวย-มาก',
      detail: '"แฉล้มแช่มช้อย" ชมสตรีว่างดงามหมดจด',
    },
    {
      pattern: /พูด|บอก/g,
      ancientWord: 'เจรจาบอก',
      modernWord: 'พูด/บอก',
      ancientPhonetic: 'เจ-ระ-จา',
      modernPhonetic: 'พูต',
      detail: 'การสนทนาแลกเปลี่ยนถ้อยคำ',
    },
    {
      pattern: /เธอ|คุณ/g,
      ancientWord: style === 'sukhothai' ? 'สู' : style === 'ayutthaya_court' ? 'ท่าน' : 'ออเจ้า',
      modernWord: 'เธอ/คุณ',
      ancientPhonetic: style === 'sukhothai' ? 'สู' : style === 'ayutthaya_court' ? 'ท่าน' : 'ออ-เจ้า',
      modernPhonetic: 'เธอ/คุน',
      detail: 'สรรพนามบุรุษที่สองยอดนิยมในยุคนั้น',
    },
    {
      pattern: /ฉัน|ผม/g,
      ancientWord: style === 'sukhothai' ? 'กู' : style === 'ayutthaya_court' ? 'ข้าพเจ้า' : 'ข้า',
      modernWord: 'ฉัน/ผม',
      ancientPhonetic: style === 'sukhothai' ? 'กู' : style === 'ayutthaya_court' ? 'ข้า-พะ-เจ้า' : 'ข้า',
      modernPhonetic: 'ฉัน/ผม',
      detail: 'สรรพนามบุรุษที่หนึ่งตามสถานะและยุคสมัย',
    },
    {
      pattern: /ด้วยนะ|นะ/g,
      ancientWord: style === 'ayutthaya_court' ? 'ด้วยขอรับ' : 'ด้วยหนา',
      modernWord: 'ด้วยนะ',
      ancientPhonetic: style === 'ayutthaya_court' ? 'ด้วย-ขอ-รับ' : 'ด้วย-หนา',
      modernPhonetic: 'ด้วย-นะ',
      detail: 'คำลงท้ายหางเสียงโบราณเพื่อความอ่อนโยน',
    },
  ];

  // Apply substitutions
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      text = text.replace(rule.pattern, rule.ancientWord);
      if (!vocabularyList.some((v) => v.ancientWord === rule.ancientWord)) {
        vocabularyList.push({
          ancientWord: rule.ancientWord,
          modernWord: rule.modernWord,
          ancientPhonetic: rule.ancientPhonetic,
          modernPhonetic: rule.modernPhonetic,
          detail: rule.detail,
        });
      }
    }
  }

  // Add authentic final particles according to style if not already present
  let ancientText = text.trim();
  if (style === 'ayutthaya_colloquial' && !ancientText.endsWith('หนา') && !ancientText.endsWith('ฤๅ')) {
    if (ancientText.includes('ฤๅ')) {
      ancientText += ' หนา';
    } else {
      ancientText += ' หนาออเจ้า';
    }
  } else if (style === 'ayutthaya_court' && !ancientText.endsWith('ขอรับ') && !ancientText.endsWith('เจ้าข้า')) {
    ancientText += ' ขอรับท่านเจ้าคุณ';
  } else if (style === 'sukhothai' && !ancientText.endsWith('แท้แล')) {
    ancientText += ' แท้แล';
  }

  // Meta descriptions by style
  const styleMetadata: Record<
    AncientStyleKey,
    { title: string; tone: string; tips: string; note: string }
  > = {
    ayutthaya_colloquial: {
      title: 'ภาษาอยุธยาสำนวนชาวบ้าน (ยุคบุพเพสันนิวาส)',
      tone: 'น้ำเสียงมีชีวิตชีวา อบอุ่น สนิทสนมดั่งชาวสยามผู้มีอัธยาศัยไมตรี',
      tips: 'ทอดเสียงเอื้อนคำลงท้าย "หนา" ให้เนิบช้า สระเสียงยาวมีความไพเราะน่าฟัง',
      note: 'ในสมัยกรุงศรีอยุธยาตอนกลาง ชุมชนริมแม่น้ำเจ้าพระยาใช้สรรพนาม "ออเจ้า" อย่างกว้างขวาง และนิยมการสื่อสารที่ตรงไปตรงมาทว่าเปี่ยมวรรณศิลป์',
    },
    ayutthaya_court: {
      title: 'ภาษาอยุธยาราชสำนัก (ขุนนางชั้นผู้ใหญ่)',
      tone: 'น้ำเสียงสุขุม ภูมิฐาน ทรงเกียรติ สุภาพตามจารีตพระนคร',
      tips: 'ออกเสียงชัดถ้อยชัดคำ จังหวะหนักแน่น เว้นวรรคอย่างมีท่วงที ลงท้ายด้วย "ขอรับ" หรือ "เจ้าข้า"',
      note: 'ธรรมเนียมในราชสำนักอยุธยาให้ความสำคัญกับการลำดับศักดิ์ คำศัพท์ทุกคำสะท้อนความประณีตและการเคารพซึ่งกันและกัน',
    },
    sukhothai: {
      title: 'ภาษาไทยยุคสุโขทัย (พ่อขุนรามคำแหง)',
      tone: 'น้ำเสียงซื่อตรง หนักแน่น จริงใจ บริสุทธิ์ดั่งภาษาไทยดั้งเดิม',
      tips: 'เน้นเสียงสั้นกระชับ คำโดดไม่มีการประดิษฐ์ซับซ้อน เปล่งเสียงจากอกอย่างเปิดเผย',
      note: 'จารึกสุโขทัยหลักที่ ๑ สะท้อนความเรียบง่ายและเป็นกันเองของสังคมไทยยุคแรกเริ่ม คำว่า "กู-มึง" เป็นคำสามัญที่เปี่ยมด้วยความจริงใจ',
    },
    poetic: {
      title: 'ภาษาไทยเชิงวรรณศิลป์ (กวีร้อยกรอง)',
      tone: 'ท่วงทำนองไพเราะประดุจลำนำกวี มีสัมผัสคล้องจองและจินตภาพ',
      tips: 'เอื้อนเสียงขึ้นลงตามวรรณยุกต์ เปรียบเสมือนการขับเสภาหรืออ่านบทอัศจรรย์',
      note: 'วรรณคดีสยามเช่น ลิลิตพระลอ หรือ โคลงทวาทศมาส นิยมใช้คำไวพจน์บรรยายอารมณ์ความรู้สึกอย่างลึกซึ้ง',
    },
    royal: {
      title: 'ภาษาชั้นสูง & ราชาศัพท์',
      tone: 'น้ำเสียงสง่างาม บริสุทธิ์ นอบน้อมสูงสุดตามราชประเพณี',
      tips: 'กล่าวด้วยน้ำเสียงนุ่มนวลราบเรียบ ไม่ยกเสียงสูงจนเกินงาม',
      note: 'ราชาศัพท์ไทยได้รับอิทธิพลจากภาษาสันสกฤตและเขมรโบราณ เป็นเครื่องสะท้อนความเคารพในสถาบันสูงสุดแห่งแผ่นดิน',
    },
  };

  const meta = styleMetadata[style] || styleMetadata.ayutthaya_colloquial;

  return {
    ancientText,
    styleTitle: meta.title,
    toneDescription: meta.tone,
    pronunciationTips: meta.tips,
    vocabularyList: vocabularyList.slice(0, 8),
    properNouns: detectedProperNouns,
    historicalNote: meta.note,
  };
}
