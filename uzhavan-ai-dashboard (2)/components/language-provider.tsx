"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Language = {
  code: string
  name: string
  flag: string
}

export const languages: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
]

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: string
}

type LanguageContextType = {
  language: Language
  setLanguage: (code: string) => void
  getTranslation: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children, defaultLanguage = "en" }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(
    languages.find((lang) => lang.code === defaultLanguage) || languages[0],
  )

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      const lang = languages.find((l) => l.code === savedLanguage)
      if (lang) {
        setLanguageState(lang)
      }
    }
  }, [])

  const setLanguage = (code: string) => {
    const newLanguage = languages.find((lang) => lang.code === code)
    if (newLanguage) {
      setLanguageState(newLanguage)
      localStorage.setItem("language", code)
      document.documentElement.lang = code
    }
  }

  // Simple translation function - in a real app, this would be more sophisticated
  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      welcome: {
        en: "Welcome",
        ta: "வரவேற்கிறோம்",
        hi: "स्वागत हे",
        te: "స్వాగతం",
        kn: "ಸ್ವಾಗತ",
      },
      login: {
        en: "Login",
        ta: "உள்நுழைய",
        hi: "लॉग इन करें",
        te: "లాగిన్",
        kn: "ಲಾಗಿನ್",
      },
      register: {
        en: "Register",
        ta: "பதிவு செய்ய",
        hi: "रजिस्टर करें",
        te: "నమోదు",
        kn: "ನೋಂದಣಿ",
      },
      dashboard: {
        en: "Dashboard",
        ta: "டாஷ்போர்டு",
        hi: "डैशबोर्ड",
        te: "డాష్‌బోర్డ్",
        kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      },
      weather: {
        en: "Weather Forecast",
        ta: "வானிலை முன்னறிவிப்பு",
        hi: "मौसम का पूर्वानुमान",
        te: "వాతావరణ సూచన",
        kn: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
      },
      market: {
        en: "Market Prices",
        ta: "சந்தை விலைகள்",
        hi: "बाजार मूल्य",
        te: "మార్కెట్ ధరలు",
        kn: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
      },
      suggestions: {
        en: "Smart Suggestions",
        ta: "ஸ்மார்ட் பரிந்துரைகள்",
        hi: "स्मार्ट सुझाव",
        te: "స్మార్ట్ సూచనలు",
        kn: "ಸ್ಮಾರ್ಟ್ ಸಲಹೆಗಳು",
      },
      settings: {
        en: "Settings",
        ta: "அமைப்புகள்",
        hi: "सेटिंग्स",
        te: "సెట్టింగులు",
        kn: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
      },
      logout: {
        en: "Log out",
        ta: "வெளியேறு",
        hi: "लॉग आउट",
        te: "లాగ్ అవుట్",
        kn: "ಲಾಗ್ ಔಟ್",
      },
    }

    return translations[key]?.[language.code] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getTranslation }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
