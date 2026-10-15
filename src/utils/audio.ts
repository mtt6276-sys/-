/**
 * Robust Audio Controller for Gemini 3.8 Flash TTS WAV responses
 * Guarantees playback across modern browsers, overcoming Autoplay Policy restrictions.
 */

class SoundController {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentBufferSource: AudioBufferSourceNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private animationFrameId: number | null = null;
  private isUnlocked: boolean = false;
  private playbackRate: number = 1.0;
  private startTime: number = 0;
  private audioDuration: number = 0;
  private onEndCallback: (() => void) | null = null;
  private onTimeUpdateCallback: ((curr: number, dur: number) => void) | null = null;
  private onFrequencyCallback: ((data: Uint8Array) => void) | null = null;
  private timeUpdateIntervalId: any = null;

  public initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Must be called during any initial user gesture (e.g. clicking mic, buttons)
   * to satisfy browser Autoplay requirements.
   */
  public unlockAudio(): void {
    try {
      const ctx = this.initContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play a tiny silent buffer to warm up the audio hardware
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Also create and prime HTMLAudioElement
      if (!this.currentAudioElement) {
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        silentAudio.volume = 0.01;
        silentAudio.play().then(() => {
          silentAudio.pause();
        }).catch(() => {});
      }

      this.isUnlocked = true;
    } catch (e) {
      console.warn('Unlock audio note:', e);
    }
  }

  /**
   * Converts base64 string to ArrayBuffer for Web Audio API
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Plays base64 WAV audio with guaranteed playback and visualizer support
   */
  public async playBase64Wav(
    base64Data: string,
    options?: {
      playbackRate?: number;
      onEnded?: () => void;
      onTimeUpdate?: (currentTime: number, duration: number) => void;
      onFrequencyData?: (dataArray: Uint8Array) => void;
      onBlocked?: (error: any) => void;
    }
  ): Promise<boolean> {
    this.stop();
    this.unlockAudio();

    this.playbackRate = options?.playbackRate || 1.0;
    this.onEndCallback = options?.onEnded || null;
    this.onTimeUpdateCallback = options?.onTimeUpdate || null;
    this.onFrequencyCallback = options?.onFrequencyData || null;

    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    try {
      // METHOD 1: Web Audio API (decodeAudioData + AudioBufferSourceNode)
      // Highly reliable, immune to HTMLAudioElement CORS/data URI restrictions
      const arrayBuffer = this.base64ToArrayBuffer(base64Data);
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = this.playbackRate;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      this.analyser = analyser;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      this.currentBufferSource = source;
      this.audioDuration = audioBuffer.duration / this.playbackRate;
      this.startTime = ctx.currentTime;

      // Visualizer loop
      if (this.onFrequencyCallback) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVisualizer = () => {
          if (this.currentBufferSource) {
            analyser.getByteFrequencyData(dataArray);
            this.onFrequencyCallback!(dataArray);
            this.animationFrameId = requestAnimationFrame(updateVisualizer);
          } else {
            this.onFrequencyCallback!(new Uint8Array(bufferLength));
          }
        };
        this.animationFrameId = requestAnimationFrame(updateVisualizer);
      }

      // Time update interval
      if (this.onTimeUpdateCallback) {
        this.timeUpdateIntervalId = setInterval(() => {
          if (this.currentBufferSource && this.audioCtx) {
            const elapsed = (this.audioCtx.currentTime - this.startTime) * this.playbackRate;
            this.onTimeUpdateCallback!(Math.min(elapsed, this.audioDuration), this.audioDuration);
          }
        }, 100);
      }

      source.onended = () => {
        this.cleanupPlayback();
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };

      source.start(0);
      return true;
    } catch (webAudioError) {
      console.warn('Web Audio playback fallback to HTMLAudioElement:', webAudioError);

      // METHOD 2: Fallback to HTMLAudioElement with Blob URL
      try {
        const arrayBuffer = this.base64ToArrayBuffer(base64Data);
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        const blobUrl = URL.createObjectURL(blob);
        const audio = new Audio(blobUrl);
        this.currentAudioElement = audio;
        audio.playbackRate = this.playbackRate;

        if (this.onTimeUpdateCallback) {
          audio.ontimeupdate = () => {
            this.onTimeUpdateCallback!(audio.currentTime, audio.duration || 0);
          };
        }

        audio.onended = () => {
          URL.revokeObjectURL(blobUrl);
          this.cleanupPlayback();
          if (this.onEndCallback) {
            this.onEndCallback();
          }
        };

        await audio.play();
        return true;
      } catch (audioElError) {
        console.error('All audio playback methods failed:', audioElError);
        if (options?.onBlocked) {
          options.onBlocked(audioElError);
        }
        return false;
      }
    }
  }

  private cleanupPlayback(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timeUpdateIntervalId) {
      clearInterval(this.timeUpdateIntervalId);
      this.timeUpdateIntervalId = null;
    }
    if (this.onFrequencyCallback) {
      this.onFrequencyCallback(new Uint8Array(16));
    }
    this.currentBufferSource = null;
    this.currentAudioElement = null;
  }

  public setRate(rate: number): void {
    this.playbackRate = rate;
    if (this.currentBufferSource) {
      this.currentBufferSource.playbackRate.value = rate;
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.playbackRate = rate;
    }
  }

  public stop(): void {
    if (this.currentBufferSource) {
      try {
        this.currentBufferSource.stop();
        this.currentBufferSource.disconnect();
      } catch (e) {}
      this.currentBufferSource = null;
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.cleanupPlayback();
  }

  public isPlaying(): boolean {
    return (
      this.currentBufferSource !== null ||
      (this.currentAudioElement !== null && !this.currentAudioElement.paused) ||
      (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking)
    );
  }

  /**
   * Browser Web Speech API fallback when Cloud TTS audio is unavailable (e.g. quota limits)
   */
  public speakWithBrowserVoice(
    text: string,
    options?: {
      playbackRate?: number;
      onEnded?: () => void;
      onFrequencyData?: (dataArray: Uint8Array) => void;
    }
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

    this.stop();

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = (options?.playbackRate || 1.0) * 0.9; // Natural rhythmic cadence
    utterance.pitch = 1.0;

    // Look for Thai voice
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang.toLowerCase().replace('_', '-').includes('th'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    // Animated simulated frequency bars while speaking
    let intervalId: any = null;
    if (options?.onFrequencyData) {
      const bufferLength = 16;
      let tick = 0;
      intervalId = setInterval(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
          tick++;
          const fakeData = new Uint8Array(bufferLength);
          for (let i = 0; i < bufferLength; i++) {
            fakeData[i] = Math.floor(45 + Math.sin(tick * 0.5 + i) * 35 + Math.random() * 20);
          }
          options.onFrequencyData!(fakeData);
        } else {
          clearInterval(intervalId);
          intervalId = null;
          options.onFrequencyData!(new Uint8Array(bufferLength));
        }
      }, 70);
    }

    const cleanUp = () => {
      (window as any).__activeUtterance = null;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      this.cleanupPlayback();
    };

    utterance.onend = () => {
      cleanUp();
      if (options?.onEnded) options.onEnded();
    };

    utterance.onerror = () => {
      cleanUp();
      if (options?.onEnded) options.onEnded();
    };

    // Keep reference on window to prevent Chrome V8 garbage collector premature cutoff
    (window as any).__activeUtterance = utterance;

    window.speechSynthesis.speak(utterance);
    return true;
  }

  /**
   * Unified speech player: plays Cloud TTS WAV if available, otherwise speaks via Browser Speech API
   */
  public async playSpeech(
    text: string,
    audioBase64?: string | null,
    options?: {
      playbackRate?: number;
      onEnded?: () => void;
      onTimeUpdate?: (currentTime: number, duration: number) => void;
      onFrequencyData?: (dataArray: Uint8Array) => void;
      onBlocked?: (error: any) => void;
    }
  ): Promise<boolean> {
    if (audioBase64) {
      const success = await this.playBase64Wav(audioBase64, options);
      if (success) return true;
    }

    // Fallback to browser voice synthesis
    console.log('Using browser speech synthesis for immediate speech output');
    const spoken = this.speakWithBrowserVoice(text, {
      playbackRate: options?.playbackRate,
      onEnded: options?.onEnded,
      onFrequencyData: options?.onFrequencyData,
    });

    return spoken;
  }

  public downloadWav(base64Data: string, filename = 'siamese-voice.wav') {
    const arrayBuffer = this.base64ToArrayBuffer(base64Data);
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const soundController = new SoundController();
