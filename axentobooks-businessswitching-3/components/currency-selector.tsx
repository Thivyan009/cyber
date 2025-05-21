"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrencyStore } from "@/lib/store/currency-store";
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

export function CurrencySelector() {
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();

  const handleCurrencyChange = (value: string) => {
    const currency = currencies.find((c) => c.code === value);
    if (currency) {
      setSelectedCurrency(currency);
    }
  };

  return (
    <Select value={selectedCurrency.code} onValueChange={handleCurrencyChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <ReactCountryFlag
            countryCode={currencyToCountryCode[selectedCurrency.code] || ""}
            svg
            style={{
              width: "1.2em",
              height: "1.2em",
            }}
            title={selectedCurrency.name}
          />
          <SelectValue placeholder="Select currency" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            <span className="flex items-center gap-2">
              <ReactCountryFlag
                countryCode={currencyToCountryCode[curr.code] || ""}
                svg
                style={{
                  width: "1.2em",
                  height: "1.2em",
                }}
                title={curr.name}
              />
              <span>{curr.code}</span>
              <span className="text-muted-foreground">({curr.symbol})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
