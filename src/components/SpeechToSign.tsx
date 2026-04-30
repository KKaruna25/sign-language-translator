import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechRecognizer } from '@/lib/speechUtils';

// Map characters to sign gesture descriptions
const SIGN_LETTERS: Record<string, string> = {
  'a': '✊', 'b': '🖐️', 'c': '🤏', 'd': '☝️', 'e': '✊',
  'f': '🤌', 'g': '👈', 'h': '👉', 'i': '🤙', 'j': '🤙',
  'k': '✌️', 'l': '🤟', 'm': '✊', 'n': '✊', 'o': '👌',
  'p': '👇', 'q': '👇', 'r': '✌️', 's': '✊', 't': '✊',
  'u': '✌️', 'v': '✌️', 'w': '🤟', 'x': '☝️', 'y': '🤙',
  'z': '☝️', ' ': '  ',
  '1': '☝️', '2': '✌️', '3': '🤟', '4': '🖐️', '5': '🖐️',
};

interface Props {
  language: string;
}

export default function SpeechToSign({ language }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [signSequence, setSignSequence] = useState<{ char: string; emoji: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  const handleResult = useCallback((text: string) => {
    setSpokenText(text);
    const sequence = text.toLowerCase().split('').map(char => ({
      char: char.toUpperCase(),
      emoji: SIGN_LETTERS[char] || '❓',
    })).filter(s => s.char.trim() || s.emoji === '  ');
    setSignSequence(sequence);
    setIsListening(false);
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognizerRef.current = new SpeechRecognizer(handleResult, handleError, language);
      recognizerRef.current.start();
      setIsListening(true);
    }
  }, [isListening, language, handleResult, handleError]);

  const reset = () => {
    setSpokenText('');
    setSignSequence([]);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mic controls */}
      <div className="glass-card p-6 flex flex-col items-center gap-4">
        <button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? 'gradient-alert glow-alert animate-pulse-alert'
              : 'gradient-primary glow-primary hover:scale-105'
          }`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-foreground" />
          ) : (
            <Mic className="w-8 h-8 text-primary-foreground" />
          )}
        </button>
        <p className="text-sm text-muted-foreground">
          {isListening ? 'Listening... Speak now' : 'Tap to start speaking'}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
      )}

      {/* Spoken text */}
      {spokenText && (
        <div className="glass-card p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">You Said</p>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>
          <p className="text-xl font-semibold text-foreground">"{spokenText}"</p>
        </div>
      )}

      {/* Sign sequence */}
      {signSequence.length > 0 && (
        <div className="glass-card p-4 animate-slide-up">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Sign Language</p>
          <div className="flex flex-wrap gap-2">
            {signSequence.map((sign, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 bg-secondary rounded-lg p-3 min-w-[48px] animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-2xl">{sign.emoji}</span>
                <span className="text-xs font-mono text-muted-foreground">{sign.char}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
