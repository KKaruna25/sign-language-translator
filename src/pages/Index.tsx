import { useState } from 'react';
import { Hand, Mic } from 'lucide-react';
import CameraGestureDetector from '@/components/CameraGestureDetector';
import SpeechToSign from '@/components/SpeechToSign';
import LanguageSelector from '@/components/LanguageSelector';
import { SUPPORTED_GESTURES } from '@/lib/gestureRecognition';

type Mode = 'gesture' | 'speech';

const Index = () => {
  const [mode, setMode] = useState<Mode>('gesture');
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Hand className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-foreground">SignBridge</h1>
          </div>
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* Mode Switcher */}
        <div className="glass-card p-1 flex mb-6">
          <button
            onClick={() => setMode('gesture')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'gesture'
                ? 'gradient-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Hand className="w-4 h-4" />
            Gesture → Text
          </button>
          <button
            onClick={() => setMode('speech')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'speech'
                ? 'gradient-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic className="w-4 h-4" />
            Speech → Sign
          </button>
        </div>

        {/* Mode content */}
        <div className="animate-fade-in">
          {mode === 'gesture' ? (
            <CameraGestureDetector language={language} />
          ) : (
            <SpeechToSign language={language} />
          )}
        </div>

        {/* Supported gestures reference */}
        <div className="mt-6 glass-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Supported Gestures
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_GESTURES.map((g) => (
              <span
                key={g}
                className={`text-xs px-2 py-1 rounded-md font-medium ${
                  g === 'Help'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
