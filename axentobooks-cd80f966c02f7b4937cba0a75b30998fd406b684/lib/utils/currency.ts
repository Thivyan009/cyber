import { useCurrencyStore } from '@/lib/stores/currency-store'

// Map of currency codes to their locales
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  LKR: 'si-LK',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  INR: 'en-IN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  CHF: 'de-CH',
  // Add more currency-locale mappings as needed
}

export function formatCurrency(amount: number, currencyCode?: string) {
  const { selectedCurrency, convertAmount, exchangeRates, lastUpdate } = useCurrencyStore.getState()
  const targetCurrency = currencyCode || selectedCurrency.code

  // Convert amount to target currency if needed
  const convertedAmount = convertAmount(amount, 'USD', targetCurrency)

  // Get the appropriate locale for the currency, fallback to en-US if not found
  const locale = CURRENCY_LOCALES[targetCurrency] || 'en-US'

  // Format the amount with the appropriate currency symbol and locale
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount)
}

export function getCurrencySymbol(currencyCode: string): string {
  const { selectedCurrency, lastUpdate } = useCurrencyStore.getState()
  return selectedCurrency.symbol || '$'
}

// Hook to use in React components for reactive currency formatting
export function useCurrencyFormat() {
  const { selectedCurrency, convertAmount, exchangeRates, lastUpdate } = useCurrencyStore()
  
  return {
    formatAmount: (amount: number, currencyCode?: string) => {
      const targetCurrency = currencyCode || selectedCurrency.code
      const convertedAmount = convertAmount(amount, 'USD', targetCurrency)
      const locale = CURRENCY_LOCALES[targetCurrency] || 'en-US'
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: targetCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedAmount)
    },
    getSymbol: (currencyCode?: string) => {
      const targetCurrency = currencyCode || selectedCurrency.code
      return selectedCurrency.symbol || '$'
    }
  }
} 