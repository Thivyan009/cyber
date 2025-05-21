import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 
  | 'en'  // English
  | 'es'  // Spanish
  | 'fr'  // French
  | 'de'  // German
  | 'zh'  // Chinese
  | 'ja'  // Japanese
  | 'ta'  // Tamil
  | 'si'  // Sinhala
  | 'hi'  // Hindi
  | 'te'  // Telugu
  | 'ml'  // Malayalam
  | 'bn'  // Bengali
  | 'ur'  // Urdu
  | 'ar'  // Arabic
  | 'ru'  // Russian
  | 'ko'  // Korean;

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
); 