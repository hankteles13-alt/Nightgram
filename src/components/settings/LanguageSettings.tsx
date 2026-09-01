import React from 'react';
import { Globe, Check } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

interface LanguageSettingsProps {
  language: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'sw' | 'zh' | 'ar';
  onChangeLanguage: (lang: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'sw' | 'zh' | 'ar') => void;
}

export const LANGUAGES = [
  { id: 'en', name: 'English (US)', native: 'English' },
  { id: 'es', name: 'Spanish', native: 'Español' },
  { id: 'fr', name: 'French', native: 'Français' },
  { id: 'de', name: 'German', native: 'Deutsch' },
  { id: 'pt', name: 'Portuguese', native: 'Português' },
  { id: 'ja', name: 'Japanese', native: '日本語' },
  { id: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { id: 'zh', name: 'Chinese Simplified', native: '中文' },
  { id: 'ar', name: 'Arabic', native: 'العربية' },
] as const;

export default function LanguageSettings({
  language,
  onChangeLanguage,
}: LanguageSettingsProps) {
  return (
    <div className="p-4 space-y-4" id="settings-language-page">
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => {
                onChangeLanguage(lang.id);
                playSoundEffect('pop');
              }}
              className={`w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer ${
                isSelected ? 'bg-cyan-950/20' : ''
              }`}
            >
              <div>
                <h5 className="text-xs font-semibold text-zinc-200">{lang.native}</h5>
                <p className="text-[11px] text-zinc-400">{lang.name}</p>
              </div>
              {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
