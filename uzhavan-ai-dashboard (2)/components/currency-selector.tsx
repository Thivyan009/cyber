"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { currencies } from "@/lib/currencies"
import { useAuth } from "@/context/auth-context"

export function CurrencySelector() {
  const { user, updateUserPreferences } = useAuth()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(user?.currency.code || "INR")

  // Update value when user changes
  useEffect(() => {
    if (user?.currency.code) {
      setValue(user.currency.code)
    }
  }, [user?.currency.code])

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    setOpen(false)

    const selectedCurrency = currencies.find((currency) => currency.code === currentValue)
    if (selectedCurrency && user) {
      updateUserPreferences({
        currency: {
          code: selectedCurrency.code,
          symbol: selectedCurrency.symbol,
          name: selectedCurrency.name,
        },
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? currencies.find((currency) => currency.code === value)?.name : "Select currency..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem key={currency.code} value={currency.code} onSelect={handleSelect}>
                  <Check className={cn("mr-2 h-4 w-4", value === currency.code ? "opacity-100" : "opacity-0")} />
                  <span className="mr-2">{currency.symbol}</span>
                  {currency.name} ({currency.code})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
