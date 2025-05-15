"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { countries } from "@/lib/currencies"

interface CountrySelectorProps {
  onSelect: (country: string) => void
  defaultValue?: string
}

export function CountrySelector({ onSelect, defaultValue = "" }: CountrySelectorProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue)

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    setOpen(false)
    onSelect(currentValue)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value || "Select country..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {countries.map((country) => (
                <CommandItem key={country} value={country} onSelect={handleSelect}>
                  <Check className={cn("mr-2 h-4 w-4", value === country ? "opacity-100" : "opacity-0")} />
                  {country}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
