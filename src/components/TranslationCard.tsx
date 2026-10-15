import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Copy,
  Check,
  Download,
  BookOpen,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Smartphone,
  User,
  Globe,
} from 'lucide-react';
import { TranslationRecord, VocabularyItem, ProperNounItem } from '../types';
import { soundController } from '../utils/audio';

interface TranslationCardProps {
  record: TranslationRecord;
  autoPlay?: boolean;
  onReSpeakWithVoice?: (text: string, voiceName: string) => void;
  onSelectVocabulary?: (item: VocabularyItem) => void;
}

export const TranslationCard: React.FC<TranslationCardProps> = ({
  record,
  autoPlay = true,
  onReSpeakWithVoice,
  onSelectVocabulary,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [copiedAncient, setCopiedAncient] = useState(false);
  const [copiedModern, setCopiedModern] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(16).fill(10));
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  // Start audio playback (supports Cloud TTS and fallback Web Speech API)
  const startPlayback = useCallback(async () => {
    soundController.stop();
    setIsPlaying(true);
    setIsAutoplayBlocked(false);

    const success = await soundController.playSpeech(record.ancientText, record.audioBase64, {
      playbackRate: playbackSpeed,
      onTimeUpdate: (curr, dur) => {
        setCurrentTime(curr);
        setDuration(dur);
      },
      onFrequencyData: (dataArray) => {
        const step = Math.max(1, Math.floor(dataArray.length / 16));
        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(10, Math.min(100, Math.floor((val / 255) * 100))));
        }
        setFrequencyBars(bars);
      },
      onEnded: () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setFrequencyBars(new Array(16).fill(10));
      },
      onBlocked: () => {
        setIsPlaying(false);
        setIsAutoplayBlocked(true);
      },
    });

    if (!success) {
      setIsPlaying(false);
      setIsAutoplayBlocked(true);
    }
  }, [record.ancientText, record.audioBase64, playbackSpeed]);

  const togglePlayAudio = useCallback(() => {
    if (isPlaying) {
      soundController.stop();
      setIsPlaying(false);
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback]);

  // Trigger autoplay immediately upon new record
  useEffect(() => {
    if (autoPlay && record.ancientText) {
      startPlayback();
    }
    return () => {
      soundController.stop();
    };
  }, [record.id, autoPlay, startPlayback]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    soundController.setRate(speed);
  };

  const copyToClipboard = async (text: string, type: 'ancient' | 'modern') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'ancient') {
        setCopiedAncient(true);
        setTimeout(() => setCopiedAncient(false), 2000);
      } else {
        setCopiedModern(true);
        setTimeout(() => setCopiedModern(false), 2000);
      }
    } catch (e) {
      console.warn('Clipboard failed:', e);
    }
  };

  const downloadWav = () => {
    if (record.audioBase64) {
      soundController.downloadWav(record.audioBase64, `siamese-${record.styleKey}-${Date.now()}.wav`);
    }
  };

  const getProperNounCategoryBadge = (category: ProperNounItem['category']) => {
    switch (category) {
      case 'person':
        return { label: 'บุคคล', icon: <User className="w-3 h-3 text-emerald-400" />, bg: 'bg-emerald-950/70 border-emerald-700/40 text-emerald-300' };
      case 'place':
        return { label: 'สถานที่', icon: <MapPin className="w-3 h-3 text-sky-400" />, bg: 'bg-sky-950/70 border-sky-700/40 text-sky-300' };
      case 'technology':
        return { label: 'เทคโนโลยี', icon: <Smartphone className="w-3 h-3 text-purple-400" />, bg: 'bg-purple-950/70 border-purple-700/40 text-purple-300' };
      case 'foreign':
        return { label: 'ต่างแดน', icon: <Globe className="w-3 h-3 text-amber-400" />, bg: 'bg-amber-950/70 border-amber-700/40 text-amber-300' };
      default:
        return { label: 'ชื่อเฉพาะ', icon: <Tag className="w-3 h-3 text-amber-400" />, bg: 'bg-amber-950/70 border-amber-700/40 text-amber-300' };
    }
  };

  return (
    <div className="bg-stone-900/90 border-2 border-amber-800/40 rounded-3xl p-5 sm:p-7 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all">
      {/* Antique royal parchment background overlay */}
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Autoplay blocked alert banner */}
      {isAutoplayBlocked && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>เบราว์เซอร์ต้องการให้แตะเพื่ออนุญาตเสียงพูด:</span>
          </div>
          <button
            type="button"
            onClick={startPlayback}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow cursor-pointer transition-all shrink-0"
          >
            🔊 แตะเพื่อฟังเสียงทันที
          </button>
        </div>
      )}

      {/* Card Header: Style and Voice info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-900/30">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-300 text-sm">
            ⚜️
          </span>
          <div>
            <h3 className="font-charm text-lg sm:text-xl font-bold text-amber-200">
              {record.styleTitle || 'สำนวนภาษาไทยโบราณ'}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-stone-400 flex items-center gap-1.5">
                <span>ผู้เอื้อนเอ่ย: {record.voiceName}</span>
                {record.toneDescription && (
                  <>
                    <span>•</span>
                    <span>{record.toneDescription}</span>
                  </>
                )}
              </p>
              {record.quotaInfo && (
                <span className={`text-[10px] px-2 py-0.2 rounded-full border font-mono ${
                  record.quotaInfo.sourceUsed === 'cloud'
                    ? 'bg-amber-950/60 border-amber-600/40 text-amber-300'
                    : 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
                }`}>
                  {record.quotaInfo.sourceUsed === 'cloud'
                    ? `⚡ Cloud AI (เหลือ ${record.quotaInfo.cloudRemaining} ครั้ง)`
                    : `🛡️ สยามวอยซ์ Engine (รีเซ็ต Cloud ใน ${record.quotaInfo.resetTimeFormatted})`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {record.audioBase64 && (
            <button
              onClick={downloadWav}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-stone-300 hover:text-amber-200 bg-stone-950/70 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-700/50 transition-all cursor-pointer"
              title="ดาวน์โหลดไฟล์เสียง (.wav)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">บันทึกเสียง</span>
            </button>
          )}

          <button
            onClick={() => copyToClipboard(record.ancientText, 'ancient')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-stone-300 hover:text-amber-200 bg-stone-950/70 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-700/50 transition-all cursor-pointer"
            title="คัดลอกข้อความโบราณ"
          >
            {copiedAncient ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAncient ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 my-5">
        {/* Modern Thai Column */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-400 font-medium mb-2">
              <span className="flex items-center gap-1">
                <span>🗣️</span> ภาษาไทยกลางต้นฉบับ
              </span>
              <button
                onClick={() => copyToClipboard(record.modernText, 'modern')}
                className="text-stone-500 hover:text-stone-300 transition-colors"
                title="คัดลอกข้อความต้นฉบับ"
              >
                {copiedModern ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-stone-200 text-sm sm:text-base leading-relaxed font-modern">
              "{record.modernText}"
            </p>
          </div>
          <span className="text-[10px] text-stone-500 mt-3 block">
            {new Date(record.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Ancient Thai Column (Hero visual) */}
        <div className="md:col-span-7 p-5 rounded-2xl bg-gradient-to-br from-amber-950/50 via-stone-950 to-stone-900 border border-amber-600/50 shadow-inner relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-2 right-2 text-3xl opacity-10 select-none">🪷</div>

          <div>
            <div className="flex items-center justify-between text-xs text-amber-400 font-medium mb-2.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                สำนวนภาษาไทยโบราณที่แปลแล้ว
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {record.styleTitle}
              </span>
            </div>

            <p className="font-ancient text-amber-100 text-lg sm:text-xl md:text-2xl font-bold leading-relaxed tracking-wide select-all selection:bg-amber-500 selection:text-stone-950">
              "{record.ancientText}"
            </p>
          </div>

          {/* Pronunciation & Tone Note */}
          {record.pronunciationTips && (
            <div className="mt-4 pt-3 border-t border-amber-900/30 text-xs text-amber-300/80 italic font-ancient">
              <span className="font-semibold text-amber-400 not-italic">ลีลาการเอื้อนเอ่ย: </span>
              {record.pronunciationTips}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Audio Player Bar (Always available!) */}
      <div className="p-4 rounded-2xl bg-stone-950/90 border border-amber-700/40 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Play Button & Waveform visualizer */}
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={togglePlayAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer shrink-0 ${
                isPlaying
                  ? 'bg-gradient-to-tr from-amber-400 to-amber-600 text-stone-950 ring-4 ring-amber-400/50 scale-105 animate-pulse'
                  : 'bg-gradient-to-tr from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 ring-2 ring-amber-300/50 hover:scale-105'
              }`}
              title={isPlaying ? 'หยุดเล่น' : 'ฟังเสียงพูด AI'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-stone-950" />
              ) : (
                <Play className="w-5 h-5 fill-stone-950 ml-0.5" />
              )}
            </button>

            <div className="flex-1 sm:w-48">
              <div className="flex items-center justify-between text-[11px] text-amber-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 animate-bounce' : ''}`} />
                  {isPlaying ? 'กำลังเปล่งเสียง AI...' : 'แตะเพื่อฟังเสียง'}
                </span>
                {duration > 0 && (
                  <span className="font-mono text-stone-400">
                    {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Dynamic Audio Visualizer Bars */}
              <div className="flex items-end gap-1 h-7 px-1.5 py-1 bg-stone-900/90 rounded-lg border border-stone-800">
                {frequencyBars.map((height, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-75 ${
                      isPlaying
                        ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-amber-200'
                        : 'bg-amber-900/30'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Playback speed options */}
          <div className="flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-800 self-end sm:self-center">
            <span className="text-[11px] text-stone-400 px-2">ความเร็ว:</span>
            {[0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                  playbackSpeed === speed
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-300 hover:text-amber-200 hover:bg-stone-800'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Proper Nouns Section (New Feature requested by user edits) */}
      {record.properNouns && record.properNouns.length > 0 && (
        <div className="mt-5 pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ชื่อเฉพาะ & สิ่งของยุคใหม่ที่ปรับสำนวนโบราณ ({record.properNouns.length} รายการ)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {record.properNouns.map((item, idx) => {
              const badge = getProperNounCategoryBadge(item.category);
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-stone-950/80 border border-amber-900/40 hover:border-amber-500/50 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-200">{item.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="font-ancient text-sm font-bold text-amber-200">
                    ➔ "{item.ancientAdaptation}"
                  </div>

                  {item.phoneticGuide && (
                    <div className="text-[11px] text-stone-400 font-mono">
                      คำอ่าน: {item.phoneticGuide}
                    </div>
                  )}

                  {item.usageNote && (
                    <p className="text-[11px] text-stone-400 leading-relaxed pt-1 border-t border-stone-900">
                      {item.usageNote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vocabulary Chips extracted from this sentence */}
      {record.vocabularyList && record.vocabularyList.length > 0 && (
        <div className="mt-5 pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              คลังศัพท์โบราณน่ารู้ในประโยคนี้ ({record.vocabularyList.length} คำ)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {record.vocabularyList.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectVocabulary?.(item)}
                className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80 hover:border-amber-600/50 hover:bg-amber-950/30 transition-all cursor-pointer text-left group"
              >
                <div className="flex items-baseline justify-between gap-1 mb-1">
                  <span className="font-ancient font-bold text-amber-200 text-sm group-hover:text-amber-300">
                    {item.ancientWord}
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">
                    = {item.modernWord}
                  </span>
                </div>
                {item.ancientPhonetic && (
                  <div className="text-[10px] text-amber-400/80 font-mono mb-1">
                    อ่านว่า: {item.ancientPhonetic}
                  </div>
                )}
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Note Accordion */}
      {record.historicalNote && (
        <div className="mt-4 pt-3 border-t border-stone-800/60">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs text-amber-400/90 font-medium hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              เกร็ดประวัติศาสตร์และวัฒนธรรม
            </span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <p className="mt-2 text-xs text-stone-300 leading-relaxed p-3 rounded-xl bg-stone-950/50 border border-stone-800 font-ancient">
              {record.historicalNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
