import { languageNames } from '@/lib/gestureRecognition';
import { Globe } from 'lucide-react';

interface Props {
  value: string;
  onChange: (lang: string) => void;
}

export default function LanguageSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-primary" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary text-secondary-foreground text-sm rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {Object.entries(languageNames).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    </div>
  );
}
