import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { translateSiameseFallback } from './src/services/siameseEngine';
import { AncientStyleKey, QuotaInfo } from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Daily Free Tier limits
const CLOUD_LIMIT = 20;
const TTS_LIMIT = 10;

// Compute next UTC midnight reset timestamp
function getNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return next.getTime();
}

function parseRetryDelayMs(errorObj: any): number | null {
  try {
    const str = typeof errorObj === 'string' ? errorObj : (errorObj?.message || JSON.stringify(errorObj));
    const match = str.match(/retryDelay["\s:]+([0-9]+)s/i);
    if (match && match[1]) {
      const sec = parseInt(match[1], 10);
      if (sec > 0) return sec * 1000;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const QUOTA_CACHE_FILE = path.resolve(process.cwd(), 'quota_cache.json');

let quotaCooldownUntil = 0;
let ttsQuotaCooldownUntil = 0;

const quotaState = {
  cloudUsed: 0,
  ttsUsed: 0,
  isExhausted: false,
  resetTimestamp: getNextUtcMidnight(),
};

function loadQuotaState() {
  try {
    if (fs.existsSync(QUOTA_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUOTA_CACHE_FILE, 'utf-8'));
      if (data && typeof data === 'object') {
        const now = Date.now();
        if (data.resetTimestamp && now < data.resetTimestamp) {
          quotaState.cloudUsed = typeof data.cloudUsed === 'number' ? data.cloudUsed : 0;
          quotaState.ttsUsed = typeof data.ttsUsed === 'number' ? data.ttsUsed : 0;
          quotaState.isExhausted = !!data.isExhausted;
          quotaState.resetTimestamp = data.resetTimestamp;
          quotaCooldownUntil = data.quotaCooldownUntil || (quotaState.isExhausted ? data.resetTimestamp : 0);
          ttsQuotaCooldownUntil = data.ttsQuotaCooldownUntil || (quotaState.isExhausted ? data.resetTimestamp : 0);
          return;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Reset if expired or not found
  quotaState.cloudUsed = 0;
  quotaState.ttsUsed = 0;
  quotaState.isExhausted = false;
  quotaState.resetTimestamp = getNextUtcMidnight();
  quotaCooldownUntil = 0;
  ttsQuotaCooldownUntil = 0;
}

function saveQuotaState() {
  try {
    const data = {
      ...quotaState,
      quotaCooldownUntil,
      ttsQuotaCooldownUntil,
    };
    fs.writeFileSync(QUOTA_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

// Initial load
loadQuotaState();

function getQuotaPayload(sourceUsed: 'cloud' | 'siamese_engine'): QuotaInfo {
  // If resetTimestamp has passed, refresh counter
  if (Date.now() >= quotaState.resetTimestamp) {
    quotaState.cloudUsed = 0;
    quotaState.ttsUsed = 0;
    quotaState.isExhausted = false;
    quotaState.resetTimestamp = getNextUtcMidnight();
    quotaCooldownUntil = 0;
    ttsQuotaCooldownUntil = 0;
    saveQuotaState();
  }

  const cloudRemaining = Math.max(0, CLOUD_LIMIT - quotaState.cloudUsed);
  const ttsRemaining = Math.max(0, TTS_LIMIT - quotaState.ttsUsed);

  const diffMs = Math.max(0, quotaState.resetTimestamp - Date.now());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const resetTimeFormatted = `${hours} ชม. ${minutes} นาที`;

  return {
    cloudLimit: CLOUD_LIMIT,
    cloudUsed: quotaState.cloudUsed,
    cloudRemaining: quotaState.isExhausted ? 0 : cloudRemaining,
    ttsLimit: TTS_LIMIT,
    ttsUsed: quotaState.ttsUsed,
    ttsRemaining: (quotaState.isExhausted || Date.now() < ttsQuotaCooldownUntil) ? 0 : ttsRemaining,
    isExhausted: quotaState.isExhausted || cloudRemaining === 0,
    resetTimestamp: quotaState.resetTimestamp,
    resetTimeFormatted,
    sourceUsed,
  };
}

interface TranslationRequest {
  text: string;
  style?: string;
  voice?: string;
  speakerRole?: string;
}

// 1. Endpoint: Translate Modern Thai to Ancient Thai + generate Spoken AI Voice
app.post('/api/translate-and-speak', async (req, res) => {
  try {
    const { text, style = 'ayutthaya_colloquial', voice = 'Kore', speakerRole = 'default' }: TranslationRequest = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุข้อความภาษาไทยกลางที่ต้องการแปล' });
    }

    let styleInstruction = '';
    let voiceStylePrompt = 'Traditional Siamese Thai cadence, clear, dignified ancient vocal expression';

    switch (style) {
      case 'ayutthaya_court':
        styleInstruction = 'ภาษาอยุธยาระดับราชสำนัก/ขุนนางชั้นผู้ใหญ่: ใช้คำสุภาพโบราณ เช่น ข้าพเจ้า, ท่านเจ้าคุณ, ออกญา, คุณพี่, จัก (จะ), ฤๅ (หรือ), มิได้, หามิได้, ขอรับ, เจ้าข้า มีความสง่างาม สุภาพภูมิฐานตามจารีตโบราณ';
        voiceStylePrompt = 'Dignified Siamese court nobleman/noblewoman, formal ancient cadence, measured and courteous';
        break;
      case 'ayutthaya_colloquial':
        styleInstruction = 'ภาษาอยุธยาระดับชาวบ้าน/ยุคบุพเพสันนิวาส: นิยมใช้สรรพนาม เช่น ออเจ้า, ข้า, เอ็ง, แม่หญิง, พ่อหนุ่ม, แม่นาย, ใช้คำว่า "เพลา" แทนเวลา, "ประเดี๋ยว", "กินข้าวปลา", ลงท้ายด้วย "หนา", "ฤๅ", มีชีวิตชีวาเสมือนชาวกรุงศรีอยุธยา';
        voiceStylePrompt = 'Expressive traditional Ayutthaya speaker, warm Siamese tone, lively and authentic ancient inflection';
        break;
      case 'sukhothai':
        styleInstruction = 'ภาษาไทยยุคสุโขทัย/พ่อขุนรามคำแหง: ใช้คำไทยแท้ดั้งเดิม สรรพนาม ตู, สู, กู, มึง (ใช้อย่างเป็นธรรมชาติในฐานะภาษาโบราณบริสุทธิ์), คำว่า ไพร่ฟ้า, บ้านเมือง, หมากส้มหมากหวาน, ใคร่ (อยาก), หนาน';
        voiceStylePrompt = 'Ancient Sukhothai archaic resonance, grounded, deep historical cadence';
        break;
      case 'poetic':
        styleInstruction = 'ภาษาไทยโบราณเชิงวรรณศิลป์/ร้อยกรองกวี: เลือกใช้คำสละสลวย มีสัมผัสคล้องจองเปรียบเปรยแบบกาพย์กลอนและวรรณคดีไทย เช่น สุริยง, จันทรา, ดาราราย, ดวงฤทัย, กายา, ชลเนตร';
        voiceStylePrompt = 'Poetic, melodious traditional Siamese verse reciter, graceful cadence';
        break;
      case 'royal':
        styleInstruction = 'ภาษาชั้นสูง/ราชาศัพท์กึ่งทางการ: ใช้คำศัพท์หลวง บรรพชน คำสุภาพขั้นสูง เช่น ทรง, พระทัย, ปรีดาปราโมทย์, เกษมศานต์, พระกรุณา';
        voiceStylePrompt = 'High courtly Siamese elegance, respectful, serene and aristocratic tone';
        break;
      default:
        styleInstruction = 'ภาษาไทยโบราณสมัยอยุธยา: สำเนียงออเจ้า ข้า เอ็ง จัก มิได้ หนา คำศัพท์โบราณชัดเจน';
        break;
    }

    // Step 1: Translate via gemini-3.8-flash with structured output
    const prompt = `คุณคือผู้เชี่ยวชาญด้านโบราณคดี ภาษาศาสตร์ไทยโบราณ และวรรณคดีไทยแห่งกรุงศรีอยุธยาและสุโขทัย
หน้าที่ของคุณ: แปลข้อความภาษาไทยกลางปัจจุบันนี้ให้กลายเป็น "ภาษาไทยโบราณแท้ๆ" ที่ถูกต้องตามยุคสมัย รื่นหู และเปี่ยมไปด้วยเสน่ห์ของวรรณศิลป์

ข้อความภาษาไทยกลางต้นฉบับ: "${text}"
รูปแบบสำนวนที่ต้องการ: ${styleInstruction}

ข้อกำหนดสำคัญ:
1. แปลงคำศัพท์ปัจจุบันเป็นคำโบราณทั้งหมด เช่น:
   - "ตอนนี้ / เวลา" -> "เพลานี้ / ยามนี้"
   - "คุณ / เธอ" -> "ออเจ้า / เจ้า / แม่หญิง / พ่อคุณ"
   - "ฉัน / ผม" -> "ข้า / ตัวข้า / ข้าพเจ้า / น้อง"
   - "พูด / บอก" -> "เจรจา / เอื้อนเอ่ย / แถลง / ว่าความ"
   - "กินข้าว" -> "กินข้าวปลาอาหาร / กินข้าวปลา"
   - "โกหก" -> "โป้ปดมดเท็จ / ปด / สับปลับ"
   - "สวย / หล่อ" -> "งดงามแฉล้มแช่มช้อย / ผุดผ่อง / คมคาย"
   - "รัก" -> "มีใจปฏิพัทธ์ / พิศวาส / เสน่หา"
   - "โกรธ" -> "เคืองแค้น / ขัดเคืองใจ / โกรธา"
   - "ไปไหนมา" -> "ไปแห่งหนตำบลใดมาฤๅ"
2. สำนวนต้องเป็นธรรมชาติของคนยุคนั้น ไม่ใช่แค่แทนคำทื่อๆ ต้องสอดคล้องกับอารมณ์ความรู้สึกของประโยคเดิม
3. ระบุคำศัพท์โบราณที่นำมาใช้ พร้อมความหมายภาษาปัจจุบัน เพื่อเป็นคลังความรู้`;

    // Step 1: Translate via gemini-3.8-flash (or fallback model if busy)
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let parsedData: any = null;
    let lastError: any = null;

    const isQuotaTemporarilyExhausted = Date.now() < quotaCooldownUntil;
    let sourceUsed: 'cloud' | 'siamese_engine' = 'cloud';

    if (!isQuotaTemporarilyExhausted) {
      for (const modelName of modelsToTry) {
        try {
          const translationResponse = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  ancientText: {
                    type: Type.STRING,
                    description: 'ข้อความภาษาไทยโบราณที่แปลได้อย่างสมบูรณ์และไพเราะ',
                  },
                  styleTitle: {
                    type: Type.STRING,
                    description: 'ชื่อสไตล์หรือยุคสมัย เช่น อยุธยาสำนวนชาวบ้าน, อยุธยาราชสำนัก',
                  },
                  toneDescription: {
                    type: Type.STRING,
                    description: 'คำอธิบายอารมณ์และน้ำเสียงของประโยคโบราณนี้',
                  },
                  pronunciationTips: {
                    type: Type.STRING,
                    description: 'คำแนะนำการออกเสียงและลีลาจังหวะ เช่น การทอดเสียง การลงท้ายด้วย หนา หรือ ขอรับ',
                  },
                  vocabularyList: {
                    type: Type.ARRAY,
                    description: 'รายการคำศัพท์โบราณที่โดดเด่นในประโยคนี้',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        ancientWord: {
                          type: Type.STRING,
                          description: 'คำศัพท์โบราณ',
                        },
                        modernWord: {
                          type: Type.STRING,
                          description: 'ความหมายในภาษาไทยปัจจุบัน',
                        },
                        detail: {
                          type: Type.STRING,
                          description: 'ที่มาหรือวิธีใช้ในอดีต',
                        },
                      },
                      required: ['ancientWord', 'modernWord', 'detail'],
                    },
                  },
                  historicalNote: {
                    type: Type.STRING,
                    description: 'เกร็ดความรู้ทางประวัติศาสตร์หรือวัฒนธรรมเกี่ยวกับบริบทของประโยคนี้',
                  },
                },
                required: ['ancientText', 'styleTitle', 'vocabularyList'],
              },
            },
          });

          parsedData = JSON.parse(translationResponse.text || '{}');
          if (parsedData && parsedData.ancientText) {
            quotaState.cloudUsed = Math.min(CLOUD_LIMIT, quotaState.cloudUsed + 1);
            saveQuotaState();
            sourceUsed = 'cloud';
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || JSON.stringify(err);
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
            const retryMs = parseRetryDelayMs(errMsg) || Math.max(60000, quotaState.resetTimestamp - Date.now());
            quotaCooldownUntil = Date.now() + retryMs;
            ttsQuotaCooldownUntil = Date.now() + retryMs;
            quotaState.isExhausted = true;
            quotaState.cloudUsed = CLOUD_LIMIT;
            quotaState.ttsUsed = TTS_LIMIT;
            quotaState.resetTimestamp = Date.now() + retryMs;
            saveQuotaState();
            console.log('[Notice] Gemini Cloud translation quota limit reached. Activating Siamese Linguistic Engine seamlessly.');
            break; // Stop attempting other models in the same exhausted bucket
          }
        }
      }
    }

    // If Gemini was exhausted by rate limit / quota 429, seamlessly activate Siamese Linguistic Engine!
    if (!parsedData || !parsedData.ancientText) {
      console.log('Activating Siamese Linguistic Fallback Engine for uninterrupted service');
      parsedData = translateSiameseFallback(text, (style || 'ayutthaya_colloquial') as AncientStyleKey);
      sourceUsed = 'siamese_engine';
    } else if (!parsedData.properNouns || parsedData.properNouns.length === 0) {
      // Enrich with proper noun detector
      const localAnalysis = translateSiameseFallback(text, (style || 'ayutthaya_colloquial') as AncientStyleKey);
      parsedData.properNouns = localAnalysis.properNouns;
    }

    const ancientText = parsedData.ancientText || text;

    // Step 2: Generate Speech via gemini-3.8-flash-lite-tts
    // Allowed voiceNames: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const allowedVoices = ['Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir'];
    const chosenVoice = allowedVoices.includes(voice) ? voice : 'Kore';

    let audioBase64: string | null = null;
    const isTtsTemporarilyExhausted = Date.now() < ttsQuotaCooldownUntil || quotaState.isExhausted || quotaState.ttsUsed >= TTS_LIMIT;

    if (!isTtsTemporarilyExhausted) {
      const ttsModelsToTry = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];

      for (const ttsModel of ttsModelsToTry) {
        try {
          const ttsResponse = await ai.models.generateContent({
            model: ttsModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: ancientText,
                    speechMetadata: {
                      style: `${voiceStylePrompt}. Speak slowly, poetically and rhythmically like a traditional Siamese period drama speaker.`,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: chosenVoice },
                },
              },
            },
          });

          audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
          if (audioBase64) {
            quotaState.ttsUsed = Math.min(TTS_LIMIT, quotaState.ttsUsed + 1);
            saveQuotaState();
            break;
          }
        } catch (ttsErr: any) {
          const errMsg = ttsErr?.message || JSON.stringify(ttsErr);
          const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
          if (is429) {
            const retryMs = parseRetryDelayMs(errMsg) || Math.max(60000, quotaState.resetTimestamp - Date.now());
            ttsQuotaCooldownUntil = Date.now() + retryMs;
            quotaState.ttsUsed = TTS_LIMIT;
            saveQuotaState();
            console.log('[Notice] Gemini Cloud TTS quota reached. Client will use browser speech synthesis seamlessly.');
            break; // Do NOT try other models in same exhausted quota pool
          }
        }
      }
    }

    const quotaInfo = getQuotaPayload(sourceUsed);

    return res.json({
      success: true,
      modernText: text,
      ancientText: parsedData.ancientText,
      styleTitle: parsedData.styleTitle,
      toneDescription: parsedData.toneDescription,
      pronunciationTips: parsedData.pronunciationTips,
      vocabularyList: parsedData.vocabularyList || [],
      properNouns: parsedData.properNouns || [],
      historicalNote: parsedData.historicalNote,
      voiceName: chosenVoice,
      audioBase64,
      quotaInfo,
    });
  } catch (err: any) {
    console.error('Translation error:', err);
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการแปลภาษาโบราณ: ' + (err?.message || 'โปรดลองใหม่อีกครั้ง'),
    });
  }
});

// 1.5 Endpoint: Get Quota Status & Countdown
app.get('/api/quota-status', (req, res) => {
  return res.json({
    success: true,
    quota: getQuotaPayload('cloud'),
  });
});

// 2. Endpoint: Transcribe Audio (if client records audio blob directly)
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลไฟล์เสียง' });
    }

    if (Date.now() < quotaCooldownUntil || quotaState.isExhausted) {
      return res.json({
        success: false,
        quotaExhausted: true,
        message: 'โควตา Cloud หมดชั่วคราว กรุณาใช้การพูดสดผ่านไมโครโฟนหรือพิมพ์ข้อความ',
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioData,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'กรุณาถอดความเสียงพูดภาษาไทยนี้เป็นข้อความภาษาไทยกลางอย่างแม่นยำ ไม่ต้องใส่คำอธิบายอื่น ให้ส่งกลับเฉพาะข้อความที่พูดเท่านั้น',
          },
        ],
      },
    });

    const transcribedText = response.text?.trim() || '';
    return res.json({ success: true, text: transcribedText });
  } catch (err: any) {
    const errMsg = err?.message || JSON.stringify(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
      const retryMs = parseRetryDelayMs(errMsg) || Math.max(60000, quotaState.resetTimestamp - Date.now());
      quotaCooldownUntil = Date.now() + retryMs;
      quotaState.isExhausted = true;
      quotaState.cloudUsed = CLOUD_LIMIT;
      saveQuotaState();
      return res.json({
        success: false,
        quotaExhausted: true,
        message: 'โควตา Cloud เต็มชั่วคราว กรุณาใช้การพูดสดผ่านไมโครโฟนหรือพิมพ์ข้อความ',
      });
    }

    return res.status(500).json({
      error: 'ไม่สามารถถอดความเสียงได้: ' + (err?.message || 'โปรดลองใหม่อีกครั้ง'),
    });
  }
});

// 3. Endpoint: Speech TTS only (if user edits text and wants to re-speak)
app.post('/api/speak', async (req, res) => {
  try {
    const { text, voice = 'Kore', stylePrompt = 'Traditional Siamese Thai cadence' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'ไม่พบข้อความสำหรับเปล่งเสียง' });
    }

    const isTtsTemporarilyExhausted = Date.now() < ttsQuotaCooldownUntil || quotaState.isExhausted || quotaState.ttsUsed >= TTS_LIMIT;
    if (isTtsTemporarilyExhausted) {
      return res.json({
        success: true,
        audioBase64: null,
        useBrowserVoice: true,
      });
    }

    const allowedVoices = ['Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir'];
    const chosenVoice = allowedVoices.includes(voice) ? voice : 'Kore';

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: stylePrompt,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      return res.json({ success: true, audioBase64: null, useBrowserVoice: true });
    }

    quotaState.ttsUsed = Math.min(TTS_LIMIT, quotaState.ttsUsed + 1);
    saveQuotaState();

    return res.json({ success: true, audioBase64 });
  } catch (err: any) {
    const errMsg = err?.message || JSON.stringify(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
      const retryMs = parseRetryDelayMs(errMsg) || Math.max(60000, quotaState.resetTimestamp - Date.now());
      ttsQuotaCooldownUntil = Date.now() + retryMs;
      quotaState.ttsUsed = TTS_LIMIT;
      saveQuotaState();
      return res.json({ success: true, audioBase64: null, useBrowserVoice: true });
    }

    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการสร้างเสียงพูด: ' + (err?.message || 'โปรดลองใหม่อีกครั้ง'),
    });
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Siamese Voice server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
