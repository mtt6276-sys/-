import React, { useState, useEffect } from 'react';
import { X, Clock, Zap, ShieldCheck, Volume2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { QuotaInfo } from '../types';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaInfo: QuotaInfo | null;
  onRefreshQuota: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  isOpen,
  onClose,
  quotaInfo,
  onRefreshQuota,
}) => {
  const [countdownText, setCountdownText] = useState<string>('');

  // Live countdown timer ticking every second
  useEffect(() => {
    if (!quotaInfo?.resetTimestamp) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, quotaInfo.resetTimestamp - now);

      if (diff <= 0) {
        setCountdownText('พร้อมรีเซ็ตโควตาแล้ว');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hours.toString().padStart(2, '0');
      const mStr = minutes.toString().padStart(2, '0');
      const sStr = seconds.toString().padStart(2, '0');

      setCountdownText(`${hStr}:${mStr}:${sStr}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quotaInfo?.resetTimestamp]);

  if (!isOpen) return null;

  const cloudRemaining = quotaInfo?.cloudRemaining ?? 0;
  const cloudLimit = quotaInfo?.cloudLimit ?? 20;
  const ttsRemaining = quotaInfo?.ttsRemaining ?? 0;
  const ttsLimit = quotaInfo?.ttsLimit ?? 10;
  const isExhausted = quotaInfo?.isExhausted ?? false;

  const cloudPercent = Math.min(100, Math.round((cloudRemaining / cloudLimit) * 100));
  const ttsPercent = Math.min(100, Math.round((ttsRemaining / ttsLimit) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-amber-900/60 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-amber-900/30 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-charm text-xl font-bold text-amber-200">
                สถานะโควตา & รอบการรีเซ็ต
              </h3>
              <p className="text-xs text-stone-400">
                ตรวจสอบจำนวนครั้งการแปลและระยะเวลาคืนโควตา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Countdown Timer Hero */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-stone-950 to-stone-900 border border-amber-600/40 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>ระยะเวลาที่โควตาจะกลับมา (นับถอยหลัง)</span>
            </div>

            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-100 tracking-wider my-2 drop-shadow">
              {countdownText || 'กำลังคำนวณ...'}
            </div>

            <p className="text-[11px] text-stone-400">
              โควตา Cloud AI ฟรีรีเซ็ตทุกวันเวลา 00:00 UTC (07:00 น. ตามเวลาประเทศไทย)
            </p>
          </div>

          {/* Quota Progress Cards */}
          <div className="space-y-3">
            {/* 1. Cloud Translation Quota */}
            <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Gemini Cloud AI แปลภาษา
                </span>
                <span className="font-mono font-bold text-amber-300">
                  เหลือ {cloudRemaining} / {cloudLimit} ครั้ง
                </span>
              </div>
              <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    cloudRemaining > 5
                      ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                      : cloudRemaining > 0
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${cloudPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>ใช้งานไปแล้ว {quotaInfo?.cloudUsed ?? 0} ครั้ง</span>
                <span>{cloudPercent}% เหลืออยู่</span>
              </div>
            </div>

            {/* 2. Cloud TTS Voice Quota */}
            <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Gemini Cloud TTS เสียงสังเคราะห์
                </span>
                <span className="font-mono font-bold text-amber-300">
                  เหลือ {ttsRemaining} / {ttsLimit} ครั้ง
                </span>
              </div>
              <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    ttsRemaining > 3
                      ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                      : ttsRemaining > 0
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${ttsPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>ใช้งานไปแล้ว {quotaInfo?.ttsUsed ?? 0} ครั้ง</span>
                <span>{ttsPercent}% เหลืออยู่</span>
              </div>
            </div>

            {/* 3. Unlimited Siamese Linguistic Fallback Status */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-700/40 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-emerald-300 text-xs">
                    สยามวอยซ์ Linguistic Engine (ระบบในตัว)
                  </h4>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 font-mono font-bold">
                    ไม่จำกัด (Unlimited)
                  </span>
                </div>
                <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
                  แม้โควตา Cloud AI จะเต็ม ระบบภาษาศาสตร์โบราณและเสียงพูดสังเคราะห์เบราว์เซอร์ยังคงทำงานได้ต่อเนื่อง แปลได้ทุกประโยคโดยไม่มีการสะดุด
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <button
            onClick={onRefreshQuota}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>อัปเดตสถานะ</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer transition-colors shadow"
          >
            รับทราบ
          </button>
        </div>
      </div>
    </div>
  );
};
