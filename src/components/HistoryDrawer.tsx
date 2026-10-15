import React from 'react';
import { X, Trash2, Play, Volume2, ArrowRight } from 'lucide-react';
import { TranslationRecord } from '../types';
import { soundController } from '../utils/audio';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: TranslationRecord[];
  onSelectRecord: (record: TranslationRecord) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-stone-900 border-l border-amber-900/50 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div>
            <h3 className="font-charm text-lg font-bold text-amber-200">
              สมุดบันทึกประวัติการแปลเสียง
            </h3>
            <p className="text-[11px] text-stone-400">
              รวมบทแปลและเสียงพูดที่คุณบันทึกไว้ ({history.length} รายการ)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectRecord(item);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-amber-600/50 hover:bg-stone-950 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/40 font-mono">
                    {item.styleTitle}
                  </span>
                  <span>
                    {new Date(item.timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-stone-400 line-clamp-1">
                    <span className="text-stone-500 mr-1">ไทยกลาง:</span> "{item.modernText}"
                  </p>
                  <p className="font-ancient text-sm font-semibold text-amber-200 line-clamp-2 mt-1 group-hover:text-amber-300">
                    "{item.ancientText}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-900 text-[11px]">
                  <span className="text-stone-500">เสียง: {item.voiceName}</span>
                  {item.audioBase64 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundController.playBase64Wav(item.audioBase64!);
                      }}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-200 p-1 rounded hover:bg-amber-950/50 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-amber-400" />
                      <span>ฟังเสียง</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-stone-400 text-xs">
              ยังไม่มีประวัติการแปลเสียงพูด
              <br />
              <span className="text-stone-500">
                เมื่อเริ่มแปลเสียง รายการจะถูกบันทึกที่นี่โดยอัตโนมัติ
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-stone-800 bg-stone-950 flex justify-between items-center">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างประวัติทั้งหมด</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white text-xs cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
