'use client'

import { useEffect } from 'react'
import { useCurrencyStore } from '@/lib/stores/currency-store'

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { setExchangeRates, selectedCurrency, forceUpdate } = useCurrencyStore()

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Fetch rates from a reliable exchange rate API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates')
        }
        const data = await response.json()
        
        // Ensure we have rates for all supported currencies
        const rates = {
          USD: 1, // Base currency
          ...data.rates
        }
        
        setExchangeRates(rates)
        forceUpdate() // Force update after setting new rates
        console.log('Exchange rates updated:', rates)
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error)
        // Set default rates if API fails
        setExchangeRates({
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          JPY: 151.62,
          AUD: 1.52,
          CAD: 1.35,
          CHF: 0.90,
          CNY: 7.23,
          LKR: 313.50
        })
        forceUpdate() // Force update after setting fallback rates
      }
    }

    // Fetch rates immediately
    fetchRates()

    // Update rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [setExchangeRates, forceUpdate])

  // Force update when currency changes
  useEffect(() => {
    forceUpdate()
  }, [selectedCurrency, forceUpdate])

  return <>{children}</>
} 