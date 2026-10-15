import React, { useState } from 'react';
import { X, Search, BookOpen, Volume2, Sparkles } from 'lucide-react';
import { SIAMESE_DICTIONARY } from '../data/presets';
import { VocabularyItem } from '../types';

interface AncientGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWordToSpeak?: (word: string) => void;
}

export const AncientGlossaryModal: React.FC<AncientGlossaryModalProps> = ({
  isOpen,
  onClose,
  onSelectWordToSpeak,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<string>('ทั้งหมด');

  if (!isOpen) return null;

  const filteredWords = SIAMESE_DICTIONARY.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEra = selectedEra === 'ทั้งหมด' || item.era.includes(selectedEra);
    return matchesSearch && matchesEra;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-amber-900/60 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-amber-900/30 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-charm text-xl font-bold text-amber-200">
                พจนานุกรมคำศัพท์สยามโบราณ
              </h3>
              <p className="text-xs text-stone-400">
                รวมคำศัพท์โบราณสมัยกรุงศรีอยุธยาและสุโขทัยพร้อมคำแปล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-stone-800 bg-stone-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาคำศัพท์โบราณหรือความหมาย..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-stone-100 placeholder-stone-500 text-xs sm:text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['ทั้งหมด', 'อยุธยา', 'สุโขทัย', 'วรรณคดี', 'โบราณ'].map((era) => (
              <button
                key={era}
                onClick={() => setSelectedEra(era)}
                className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                  selectedEra === era
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
                }`}
              >
                {era}
              </button>
            ))}
          </div>
        </div>

        {/* Word List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-stone-800/60">
          {filteredWords.length > 0 ? (
            filteredWords.map((item, idx) => (
              <div
                key={idx}
                className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-ancient text-base font-bold text-amber-200">
                      {item.word}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-amber-950/80 border border-amber-800/40 text-amber-400 font-mono">
                      {item.era}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed font-modern">
                    {item.meaning}
                  </p>
                </div>

                {onSelectWordToSpeak && (
                  <button
                    onClick={() => {
                      onSelectWordToSpeak(item.word);
                      onClose();
                    }}
                    className="shrink-0 p-2 rounded-lg bg-stone-800/60 hover:bg-amber-950/60 text-stone-400 hover:text-amber-300 border border-stone-800 hover:border-amber-700/40 transition-colors cursor-pointer"
                    title="ทดลองแปลและเปล่งเสียงคำนี้"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-stone-400 text-xs">
              ไม่พบคำศัพท์ที่ตรงกับการค้นหา
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
