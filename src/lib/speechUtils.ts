import { speechLangCodes } from './gestureRecognition';

export function speak(text: string, lang: string = 'en'): void {
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLangCodes[lang] || 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function playAlertSound(): void {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create alarm-like oscillating sound
  const playTone = (freq: number, startTime: number, duration: number) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'square';
    oscillator.frequency.value = freq;
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  const now = audioContext.currentTime;
  // Alternating high-low alarm pattern
  for (let i = 0; i < 6; i++) {
    playTone(880, now + i * 0.3, 0.15);
    playTone(660, now + i * 0.3 + 0.15, 0.15);
  }
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;

  constructor(
    private onResult: (text: string) => void,
    private onError: (error: string) => void,
    private lang: string = 'en'
  ) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.onError('Speech recognition not supported in this browser');
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = speechLangCodes[lang] || 'en-US';
    
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        this.onResult(result[0].transcript);
      }
    };
    
    this.recognition.onerror = (event: any) => {
      this.onError(event.error);
      this.isListening = false;
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  setLang(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = speechLangCodes[lang] || 'en-US';
    }
  }

  start() {
    if (!this.recognition || this.isListening) return;
    this.isListening = true;
    this.recognition.start();
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
  }

  get listening() {
    return this.isListening;
  }
}
