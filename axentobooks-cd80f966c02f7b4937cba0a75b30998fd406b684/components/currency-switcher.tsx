"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useCurrencyStore } from "@/lib/stores/currency-store";
import { currencies } from "@/lib/types/currency";
import ReactCountryFlag from "react-country-flag";

// Map currency codes to ISO country codes for flags
const currencyToCountryCode: Record<string, string> = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  AUD: "AU",
  CAD: "CA",
  CHF: "CH",
  CNY: "CN",
  LKR: "LK",
};

export function CurrencySwitcher() {
  const [open, setOpen] = useState(false);
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Switch currency</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => {
              setSelectedCurrency(currency);
              setOpen(false);
            }}
            className="flex items-center gap-2"
          >
            <ReactCountryFlag
              countryCode={currencyToCountryCode[currency.code] || ""}
              svg
              style={{
                width: "1.2em",
                height: "1.2em",
              }}
              title={currency.name}
            />
            <span>{currency.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
