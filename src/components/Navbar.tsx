import React from 'react';
import { BookOpen, History, Sparkles, Volume2, HelpCircle, Zap, Clock } from 'lucide-react';
import { QuotaInfo } from '../types';

interface NavbarProps {
  onOpenGlossary: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onOpenQuota: () => void;
  quotaInfo: QuotaInfo | null;
  historyCount: number;
  isTranslating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGlossary,
  onOpenHistory,
  onOpenGuide,
  onOpenQuota,
  quotaInfo,
  historyCount,
  isTranslating,
}) => {
  const cloudRemaining = quotaInfo?.cloudRemaining ?? 0;
  const cloudLimit = quotaInfo?.cloudLimit ?? 20;
  const isExhausted = quotaInfo?.isExhausted ?? false;

  return (
    <header className="sticky top-0 z-40 bg-stone-950/85 backdrop-blur-md border-b border-amber-900/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-stone-950 shadow-lg shadow-amber-900/30 ring-1 ring-amber-300/40">
            <span className="text-2xl select-none">🪷</span>
            {isTranslating && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-charm text-2xl font-bold tracking-wide text-amber-200">
                สยามวอยซ์
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/40 text-amber-300 font-mono font-medium">
                Siamese Voice Live
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              แปลเสียงพูดไทยกลางเป็นไทยโบราณ & เปล่งเสียงพูด AI ย้อนยุคเรียลไทม์
            </p>
          </div>
        </div>

        {/* Action navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quota & Reset status badge */}
          <button
            onClick={onOpenQuota}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shadow-sm ${
              isExhausted
                ? 'bg-amber-950/70 border-amber-600/60 text-amber-300 hover:bg-amber-900/60'
                : cloudRemaining <= 5
                ? 'bg-amber-950/50 border-amber-600/50 text-amber-300 hover:bg-amber-900/50'
                : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:text-amber-200 hover:border-amber-700/50'
            }`}
            title="คลิกเพื่อดูรายละเอียดโควตาและเวลานับถอยหลังการรีเซ็ต"
          >
            {isExhausted ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="font-mono text-[11px] sm:text-xs">
                  รีเซ็ต {quotaInfo?.resetTimeFormatted || '00:00'}
                </span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[11px] sm:text-xs">
                  โควตา: {cloudRemaining}/{cloudLimit}
                </span>
              </>
            )}
          </button>

          <button
            onClick={onOpenGlossary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-amber-300 bg-stone-900/80 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-700/50 transition-all cursor-pointer"
            title="พจนานุกรมคำศัพท์โบราณ"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">คลังศัพท์</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-amber-300 bg-stone-900/80 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-700/50 transition-all cursor-pointer"
            title="ประวัติการแปลเสียง"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">สมุดบันทึก</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-600/80 text-stone-100 font-mono">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-amber-300 bg-stone-900/80 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-700/50 transition-all cursor-pointer"
            title="วิธีใช้งาน"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">วิธีใช้</span>
          </button>
        </div>
      </div>
    </header>
  );
};
