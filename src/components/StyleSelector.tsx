import React from 'react';
import { ANCIENT_STYLES, VOICES } from '../data/presets';
import { AncientStyleKey, VoiceOption } from '../types';
import { Volume2, Sparkles, User, ShieldCheck } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: AncientStyleKey;
  onSelectStyle: (style: AncientStyleKey) => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  autoPlayAudio: boolean;
  onToggleAutoPlay: (enabled: boolean) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
  selectedVoice,
  onSelectVoice,
  autoPlayAudio,
  onToggleAutoPlay,
}) => {
  return (
    <div className="bg-stone-900/70 border border-amber-900/30 rounded-2xl p-4 sm:p-5 backdrop-blur-sm space-y-4 shadow-xl shadow-black/20">
      {/* 1. Ancient Era / Style selection */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            เลือกระดับภาษาและยุคสมัยโบราณ
          </label>
          <span className="text-[11px] text-stone-400">
            {ANCIENT_STYLES.find((s) => s.key === selectedStyle)?.era}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {ANCIENT_STYLES.map((style) => {
            const isSelected = selectedStyle === style.key;
            return (
              <button
                key={style.key}
                type="button"
                onClick={() => onSelectStyle(style.key)}
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-950/60 border-amber-500 shadow-md shadow-amber-900/20 ring-1 ring-amber-400/30 text-amber-100'
                    : 'bg-stone-950/50 border-stone-800/80 hover:border-amber-700/40 hover:bg-stone-900/80 text-stone-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full border-b border-l border-amber-500/30" />
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{style.icon}</span>
                  <span className={`font-medium text-xs sm:text-sm ${isSelected ? 'text-amber-200 font-bold' : ''}`}>
                    {style.title}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 line-clamp-1 leading-tight">
                  {style.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Voice Persona & Autoplay options */}
      <div className="pt-2 border-t border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5 mb-2">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            เลือกน้ำเสียงผู้เอื้อนเอ่ย (AI Voice Persona)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {VOICES.map((v) => {
              const isSelected = selectedVoice === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => onSelectVoice(v.name)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-950/80 to-amber-900/50 border-amber-400 text-amber-200 ring-1 ring-amber-400/30 shadow'
                      : 'bg-stone-950/40 border-stone-800 hover:border-amber-800/50 text-stone-300 hover:bg-stone-900/50'
                  }`}
                >
                  <span className="text-base">
                    {v.gender === 'female' ? '🌸' : '🗡️'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{v.displayName}</p>
                    <p className="text-[10px] text-stone-400 truncate">{v.characterTitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Autoplay toggle */}
        <div className="flex items-center justify-between md:justify-end gap-3 self-end sm:self-auto pt-1 md:pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-amber-300 transition-colors">
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => onToggleAutoPlay(e.target.checked)}
              className="w-4 h-4 rounded border-stone-700 text-amber-600 focus:ring-amber-500 bg-stone-950 cursor-pointer"
            />
            <span>เปล่งเสียง AI ทันทีเมื่อแปลเสร็จ</span>
          </label>
        </div>
      </div>
    </div>
  );
};
