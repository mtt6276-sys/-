/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StyleSelector } from './components/StyleSelector';
import { VoiceInputPanel } from './components/VoiceInputPanel';
import { TranslationCard } from './components/TranslationCard';
import { AncientGlossaryModal } from './components/AncientGlossaryModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { GuideModal } from './components/GuideModal';
import { QuotaModal } from './components/QuotaModal';
import { AncientStyleKey, TranslationRecord, VocabularyItem, QuotaInfo } from './types';
import { ANCIENT_STYLES, VOICES } from './data/presets';
import { soundController } from './utils/audio';
import { Sparkles, History as HistoryIcon, AlertCircle, Zap, Clock, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'siamese_voice_history_v1';

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<AncientStyleKey>('ayutthaya_colloquial');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<TranslationRecord | null>(null);
  const [history, setHistory] = useState<TranslationRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  // Modals state
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState<boolean>(false);

  // Fetch quota status from server
  const fetchQuotaStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/quota-status');
      if (res.ok) {
        const data = await res.json();
        if (data.quota) {
          setQuotaInfo(data.quota);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch quota status:', e);
    }
  }, []);

  useEffect(() => {
    fetchQuotaStatus();
  }, [fetchQuotaStatus]);

  // Unlock audio on first user interaction anywhere on the page
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundController.unlockAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setCurrentRecord(parsed[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveRecordToHistory = (newRecord: TranslationRecord) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== newRecord.id);
      const updated = [newRecord, ...filtered].slice(0, 30); // keep up to 30 items
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save history:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  // Main translate and speak handler
  const handleTranslateAndSpeak = useCallback(
    async (textToTranslate: string) => {
      if (!textToTranslate || !textToTranslate.trim() || isTranslating) return;

      // Unlock browser audio immediately on user intent
      soundController.unlockAudio();

      setIsTranslating(true);
      setErrorMessage(null);

      try {
        const response = await fetch('/api/translate-and-speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToTranslate.trim(),
            style: selectedStyle,
            voice: selectedVoice,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'การแปลภาษาล้มเหลว');
        }

        if (data.quotaInfo) {
          setQuotaInfo(data.quotaInfo);
        }

        const newRecord: TranslationRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          modernText: textToTranslate.trim(),
          ancientText: data.ancientText,
          styleTitle: data.styleTitle || ANCIENT_STYLES.find((s) => s.key === selectedStyle)?.title || 'ไทยโบราณ',
          styleKey: selectedStyle,
          toneDescription: data.toneDescription,
          pronunciationTips: data.pronunciationTips,
          vocabularyList: data.vocabularyList || [],
          properNouns: data.properNouns || [],
          historicalNote: data.historicalNote,
          voiceName: VOICES.find((v) => v.name === selectedVoice)?.displayName || selectedVoice,
          audioBase64: data.audioBase64,
          quotaInfo: data.quotaInfo,
        };

        setCurrentRecord(newRecord);
        saveRecordToHistory(newRecord);
      } catch (err: any) {
        console.error('Translation process error:', err);
        setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการแปลและสังเคราะห์เสียง กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsTranslating(false);
      }
    },
    [selectedStyle, selectedVoice, isTranslating]
  );

  const currentStyleObj = ANCIENT_STYLES.find((s) => s.key === selectedStyle);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950/20 text-stone-100 flex flex-col font-modern">
      {/* Navbar */}
      <Navbar
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenQuota={() => setIsQuotaModalOpen(true)}
        quotaInfo={quotaInfo}
        historyCount={history.length}
        isTranslating={isTranslating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error Notification banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-700/60 text-red-200 text-sm flex items-center justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2 py-1 rounded bg-red-900/60 hover:bg-red-900 text-red-200 cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Hero Banner with Siamese motif */}
        <section className="text-center py-2 sm:py-4 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/40 text-amber-300 text-xs font-medium mb-3 shadow">
            <span>✨</span>
            <span>นวัตกรรมแปลงเสียงพูดสดสู่สำเนียงชาวสยามด้วย Gemini 3.8 AI</span>
          </div>

          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-wide drop-shadow-sm">
            เอื้อนเอ่ยวาจาสยามโบราณ
          </h2>
          <p className="mt-2 text-stone-300 text-sm sm:text-base max-w-2xl mx-auto font-ancient">
            พูดภาษาไทยกลางผ่านไมโครโฟน แล้วฟังเสียง AI แปลงเป็นสำเนียงอยุธยา สุโขทัย หรือราชาศัพท์แบบเรียลไทม์
          </p>
        </section>

        {/* Quota & Reset Banner */}
        {quotaInfo && (
          <div
            onClick={() => setIsQuotaModalOpen(true)}
            className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] ${
              quotaInfo.isExhausted
                ? 'bg-amber-950/70 border-amber-500/60 shadow-lg shadow-amber-950/40'
                : 'bg-stone-900/60 border-stone-800 hover:border-amber-700/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                quotaInfo.isExhausted ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-300'
              }`}>
                {quotaInfo.isExhausted ? (
                  <Clock className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-200">
                    {quotaInfo.isExhausted ? 'โควตา Cloud AI ฟรีใช้ครบแล้ว' : 'โควตา Cloud AI แปลภาษา'}
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-stone-950 border border-stone-800 text-amber-300 font-bold">
                    เหลือ {quotaInfo.cloudRemaining} / {quotaInfo.cloudLimit} ครั้ง
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-stone-950 border border-stone-800 text-stone-400">
                    เสียง Cloud: {quotaInfo.ttsRemaining} / {quotaInfo.ttsLimit} ครั้ง
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {quotaInfo.isExhausted
                    ? `จะรีเซ็ตโควตาในอีก ${quotaInfo.resetTimeFormatted} • ระบบสยามวอยซ์ในตัวพร้อมแปลและพูดต่อได้ไม่จำกัด!`
                    : `รีเซ็ตรอบถัดไปในอีก ${quotaInfo.resetTimeFormatted} • มีระบบสำรองในตัวไม่จำกัดครั้ง`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 text-xs text-amber-400 hover:text-amber-300 font-semibold">
              <span>ดูเวลานับถอยหลัง</span>
              <span>➔</span>
            </div>
          </div>
        )}

        {/* Style & Voice Selector */}
        <StyleSelector
          selectedStyle={selectedStyle}
          onSelectStyle={setSelectedStyle}
          selectedVoice={selectedVoice}
          onSelectVoice={setSelectedVoice}
          autoPlayAudio={autoPlayAudio}
          onToggleAutoPlay={setAutoPlayAudio}
        />

        {/* Real-time Voice Input & Text Submission Panel */}
        <VoiceInputPanel
          inputText={inputText}
          setInputText={setInputText}
          onTranslateAndSpeak={handleTranslateAndSpeak}
          isTranslating={isTranslating}
          selectedStyleTitle={currentStyleObj?.title || 'ไทยโบราณ'}
        />

        {/* Active Translation Output Card */}
        {currentRecord && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-charm text-xl font-bold text-amber-200 flex items-center gap-2">
                <span>📜</span>
                <span>ผลการแปลและเสียงพูดโบราณ</span>
              </h3>
              <span className="text-xs text-stone-400">
                พร้อมให้รับฟังและแบ่งปัน
              </span>
            </div>

            <TranslationCard
              record={currentRecord}
              autoPlay={autoPlayAudio}
              onSelectVocabulary={(vocab) => {
                // If user clicks a vocab, show details in glossary
                setIsGlossaryOpen(true);
              }}
            />
          </section>
        )}

        {/* If no translation yet, show quick welcome invitation */}
        {!currentRecord && (
          <div className="p-8 rounded-3xl bg-stone-900/40 border border-amber-900/30 text-center space-y-3 my-4">
            <span className="text-4xl block select-none">🪷</span>
            <h3 className="font-charm text-xl font-bold text-amber-200">
              ยินดีต้อนรับสู่อาณาจักรสยามวอยซ์
            </h3>
            <p className="text-stone-400 text-sm max-w-md mx-auto">
              ลองแตะปุ่มไมโครโฟนสีทองด้านบนเพื่อพูด หรือคลิกเลือกประโยคตัวอย่าง เพื่อสัมผัสสำนวนและเสียงพูดโบราณอันทรงคุณค่า
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const sample = 'วันนี้กินข้าวหรือยัง เดี๋ยวเราไปเที่ยวตลาดกันนะ';
                  setInputText(sample);
                  handleTranslateAndSpeak(sample);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ทดลองแปลประโยคตัวอย่างทันที</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-900/30 bg-stone-950/90 py-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p className="text-stone-400 font-ancient">
            สยามวอยซ์ (Siamese Voice) • ระบบแปลเสียงพูดไทยกลางเป็นไทยโบราณและเสียงสังเคราะห์เรียลไทม์
          </p>
          <p className="text-stone-500 text-[11px]">
            ขับเคลื่อนด้วย Google Gemini 3.8 Flash & Gemini 3.8 Flash TTS เทคโนโลยีปัญญาประดิษฐ์สยามยุคดิจิทัล
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AncientGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        onSelectWordToSpeak={(word) => {
          setInputText(`คำว่า "${word}" ในสมัยโบราณมีความหมายอย่างไร`);
          handleTranslateAndSpeak(`คำว่า "${word}" ในสมัยโบราณมีความหมายอย่างไร`);
        }}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={(rec) => setCurrentRecord(rec)}
        onClearHistory={handleClearHistory}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <QuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        quotaInfo={quotaInfo}
        onRefreshQuota={fetchQuotaStatus}
      />
    </div>
  );
}
