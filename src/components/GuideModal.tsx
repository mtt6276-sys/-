import React from 'react';
import { X, Mic, Volume2, Sparkles, BookOpen, Clock } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-amber-900/60 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-amber-900/30 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏮</span>
            <div>
              <h3 className="font-charm text-xl font-bold text-amber-200">
                วิธีใช้งานสยามวอยซ์ (Siamese Voice)
              </h3>
              <p className="text-xs text-stone-400">
                เรียนรู้เคล็ดลับการแปลงเสียงพูดปัจจุบันสู่สำเนียงโบราณ
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-200 mb-1">1. พูดผ่านไมโครโฟนแบบเรียลไทม์</h4>
              <p className="text-stone-400 text-xs">
                กดปุ่มไมโครโฟนสีทองตรงกลาง แล้วพูดภาษาไทยกลางตามปกติ เมื่อหยุดพูดประมาณ 1 วินาที ระบบจะจับเสียงและแปลเป็นภาษาไทยโบราณพร้อมเปล่งเสียง AI ให้ทันที
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-200 mb-1">2. เลือกระดับภาษาและยุคสมัย</h4>
              <p className="text-stone-400 text-xs">
                สามารถเปลี่ยนสไตล์ได้ตามต้องการ เช่น <strong>อยุธยาชาวบ้าน (ออเจ้า)</strong>, <strong>อยุธยาราชสำนัก (ท่านเจ้าคุณ)</strong>, <strong>สุโขทัย (พ่อขุนรามคำแหง)</strong> หรือ <strong>กวีร้อยกรอง</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-200 mb-1">3. เลือกผู้เอื้อนเอ่ย (AI Voice Persona)</h4>
              <p className="text-stone-400 text-xs">
                มีน้ำเสียง AI ให้เลือกหลากหลาย เช่น แม่หญิงการะเกด (อ่อนหวาน), ท่านหมื่น (คมเข้ม), ท่านเจ้าคุณ (ทุ้มลึกมีบารมี) หรือแม่ทัพศึก (ดุดัน) พร้อมปรับความเร็วในการพูดได้
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-200 mb-1">4. เรียนรู้คำศัพท์และเกร็ดโบราณ</h4>
              <p className="text-stone-400 text-xs">
                ใต้การ์ดบทแปลจะมีคลังคำศัพท์โบราณที่ถอดความจากประโยค พร้อมความหมายและเกร็ดประวัติศาสตร์ประกอบ ให้คุณเข้าใจวัฒนธรรมไทยอย่างลึกซึ้ง
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
          >
            เข้าใจแล้ว เริ่มใช้งานเลย
          </button>
        </div>
      </div>
    </div>
  );
};
