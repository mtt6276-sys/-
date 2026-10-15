import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Radio, Sparkles, Volume2, Loader2, RefreshCw, Square } from 'lucide-react';
import { SAMPLE_SENTENCES } from '../data/presets';
import { soundController } from '../utils/audio';

interface VoiceInputPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  onTranslateAndSpeak: (text: string) => void;
  isTranslating: boolean;
  selectedStyleTitle: string;
}

export const VoiceInputPanel: React.FC<VoiceInputPanelProps> = ({
  inputText,
  setInputText,
  onTranslateAndSpeak,
  isTranslating,
  selectedStyleTitle,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isRecordingMedia, setIsRecordingMedia] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // References
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
    }
  }, []);

  // Handle continuous live voice recognition
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('เบราว์เซอร์ของคุณไม่รองรับ Web Speech API กรุณาใช้การพิมพ์ข้อความหรืออัดเสียงแทน');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'th-TH';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentSaid = (final || interim).trim();
        if (currentSaid) {
          setLiveTranscript(currentSaid);
          setInputText(currentSaid);

          // Clear previous silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // If silence for 1.4s, automatically translate and speak
          silenceTimerRef.current = setTimeout(() => {
            if (currentSaid.length >= 2 && !isTranslating) {
              onTranslateAndSpeak(currentSaid);
              // Stop recognition after successful translation trigger
              stopListening();
            }
          }, 1400);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition notice:', err.error);
        if (err.error === 'not-allowed') {
          alert('กรุณาอนุญาตการเข้าถึงไมโครโฟนเพื่อใช้งานระบบแปลเสียง');
          stopListening();
        }
      };

      recognition.onend = () => {
        // If still supposed to listen, restart it
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  }, [setInputText, onTranslateAndSpeak, isTranslating]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    soundController.unlockAudio();
    if (isListening) {
      stopListening();
    } else {
      startSpeechRecognition();
    }
  };

  // Fallback MediaRecorder for direct audio recording
  const startMediaRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        // Convert blob to base64 and send to server transcription
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData: base64Data, mimeType: 'audio/webm' }),
            });
            const data = await res.json();
            if (data.text) {
              setInputText(data.text);
              onTranslateAndSpeak(data.text);
            }
          } catch (err) {
            console.error('Transcription fallback error:', err);
          }
        };
      };

      mediaRecorder.start();
      setIsRecordingMedia(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาตรวจสอบสิทธิ์การใช้งาน');
    }
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && isRecordingMedia) {
      mediaRecorderRef.current.stop();
      setIsRecordingMedia(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    soundController.unlockAudio();
    if (e) e.preventDefault();
    if (inputText.trim() && !isTranslating) {
      stopListening();
      onTranslateAndSpeak(inputText.trim());
    }
  };

  return (
    <div className="bg-stone-900/80 border border-amber-900/40 rounded-3xl p-5 sm:p-7 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Decorative Siamese pattern accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />

      {/* Header status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-600/30 text-amber-300 text-xs font-medium">
            <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
            <span>
              {isListening
                ? 'กำลังสดับตรับฟังเสียงสดของคุณ...'
                : isRecordingMedia
                ? `กำลังบันทึกเสียง (${recordingSeconds}s)...`
                : isTranslating
                ? 'กำลังแปลเป็นภาษาโบราณ & สังเคราะห์เสียง AI...'
                : 'พร้อมรับฟังเสียงพูดภาษาไทยกลาง'}
            </span>
          </div>
        </div>

        <div className="text-xs text-stone-400 font-ancient">
          เป้าหมายสำนวน: <span className="text-amber-300 font-bold">{selectedStyleTitle}</span>
        </div>
      </div>

      {/* Main Microphone Interaction Circle */}
      <div className="flex flex-col items-center justify-center my-4 sm:my-6">
        <div className="relative group">
          {/* Animated pulsing rings when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-75 duration-1000" />
              <div className="absolute -inset-4 rounded-full bg-amber-400/10 animate-pulse" />
              <div className="absolute -inset-8 rounded-full border border-amber-500/20 animate-spin" />
            </>
          )}

          <button
            type="button"
            onClick={toggleListening}
            disabled={isTranslating}
            className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
              isListening
                ? 'bg-gradient-to-br from-red-600 via-amber-700 to-amber-900 ring-4 ring-red-400/80 shadow-red-900/50 scale-105'
                : 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 hover:from-amber-400 hover:to-amber-700 ring-4 ring-amber-400/30 hover:ring-amber-300/60 shadow-amber-950/60 hover:scale-105'
            } ${isTranslating ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={isListening ? 'แตะเพื่อหยุดฟัง' : 'แตะเพื่อเริ่มพูดแบบเรียลไทม์'}
          >
            {isTranslating ? (
              <Loader2 className="w-10 h-10 sm:w-11 sm:h-11 text-stone-900 animate-spin" />
            ) : isListening ? (
              <div className="flex flex-col items-center">
                <Square className="w-8 h-8 text-white fill-white" />
                <span className="text-[11px] font-bold text-white mt-1 tracking-wider uppercase">
                  หยุดฟัง
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-stone-950">
                <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-stone-950 drop-shadow" />
                <span className="text-[11px] font-bold mt-1 tracking-wider uppercase">
                  แตะเพื่อพูด
                </span>
              </div>
            )}
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-stone-300 font-medium text-center">
          {isListening
            ? 'พูดภาษาไทยกลางได้เลย ระบบจะจับคำพูดและแปลเป็นไทยโบราณทันทีเมื่อหยุดพูด'
            : 'กดปุ่มไมโครโฟนเพื่อเริ่มพูด หรือพิมพ์ข้อความด้านล่าง'}
        </p>

        {/* Live speech interim banner */}
        {isListening && liveTranscript && (
          <div className="mt-3 px-4 py-2 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-sm max-w-lg text-center animate-fade-in shadow-inner">
            <span className="text-xs text-amber-400/80 font-mono block mb-0.5">ได้ยินเสียงพูดว่า:</span>
            "{liveTranscript}"
          </div>
        )}
      </div>

      {/* Input Text Form (Type or Edit speech) */}
      <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleManualSubmit();
              }
            }}
            placeholder="หรือพิมพ์ข้อความภาษาไทยกลางที่ต้องการแปล เช่น 'วันนี้กินข้าวหรือยัง เดี๋ยวเราไปเที่ยวตลาดกันนะ'..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-stone-950/70 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-stone-100 placeholder-stone-500 text-sm sm:text-base resize-none transition-all outline-none"
          />

          {inputText && (
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setLiveTranscript('');
              }}
              className="absolute top-3 right-3 text-xs text-stone-400 hover:text-stone-200 px-2 py-1 rounded bg-stone-800/60 hover:bg-stone-800 cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Preset sentences */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-400" />
              ลองประโยคตัวอย่าง:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SAMPLE_SENTENCES.slice(0, 6).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundController.unlockAudio();
                    setInputText(s.text);
                    onTranslateAndSpeak(s.text);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-950/60 hover:bg-amber-950/50 border border-stone-800 hover:border-amber-700/50 text-stone-300 hover:text-amber-200 transition-all cursor-pointer truncate max-w-[200px]"
                  title={s.text}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isTranslating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-semibold text-sm shadow-lg shadow-amber-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer ml-auto"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>กำลังแปล & สังเคราะห์เสียง...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-stone-950" />
                <span>แปลและเปล่งเสียง AI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
