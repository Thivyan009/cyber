"use client"

import { Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useLanguage, languages } from "@/components/language-provider"

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Globe className="h-4 w-4" />
          <span className="absolute -bottom-1 -right-1 text-[10px]">{language.flag}</span>
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={cn("flex items-center gap-2 cursor-pointer", language.code === lang.code && "bg-accent")}
            onClick={() => setLanguage(lang.code)}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.name}</span>
            {language.code === lang.code && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
