// Currency data with symbols, codes, and conversion rates (relative to USD)
export const currencies = [
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rate: 83.12, // 1 USD = 83.12 INR
    countries: ["India"],
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rate: 1, // Base currency
    countries: ["United States", "Ecuador", "El Salvador"],
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rate: 0.92, // 1 USD = 0.92 EUR
    countries: ["Germany", "France", "Italy", "Spain", "Netherlands"],
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rate: 0.79, // 1 USD = 0.79 GBP
    countries: ["United Kingdom"],
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    rate: 154.38, // 1 USD = 154.38 JPY
    countries: ["Japan"],
  },
  {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    rate: 7.23, // 1 USD = 7.23 CNY
    countries: ["China"],
  },
  {
    code: "BDT",
    symbol: "৳",
    name: "Bangladeshi Taka",
    rate: 109.82, // 1 USD = 109.82 BDT
    countries: ["Bangladesh"],
  },
  {
    code: "PKR",
    symbol: "₨",
    name: "Pakistani Rupee",
    rate: 278.25, // 1 USD = 278.25 PKR
    countries: ["Pakistan"],
  },
  {
    code: "LKR",
    symbol: "රු",
    name: "Sri Lankan Rupee",
    rate: 312.5, // 1 USD = 312.50 LKR
    countries: ["Sri Lanka"],
  },
  {
    code: "NPR",
    symbol: "रू",
    name: "Nepalese Rupee",
    rate: 132.95, // 1 USD = 132.95 NPR
    countries: ["Nepal"],
  },
]

// Function to get currency by country
export function getCurrencyByCountry(country: string) {
  const currency = currencies.find((c) => c.countries.includes(country))
  return currency || currencies[0] // Default to INR if country not found
}

// Function to get currency by code
export function getCurrencyByCode(code: string) {
  return currencies.find((c) => c.code === code) || currencies[0]
}

// Function to convert amount from one currency to another
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string) {
  const from = getCurrencyByCode(fromCurrency)
  const to = getCurrencyByCode(toCurrency)

  // Convert to USD first (as base), then to target currency
  const amountInUSD = amount / from.rate
  const amountInTargetCurrency = amountInUSD * to.rate

  return amountInTargetCurrency
}

// Function to format currency with symbol
export function formatCurrency(amount: number, currencyCode: string) {
  const currency = getCurrencyByCode(currencyCode)

  return `${currency.symbol}${amount.toFixed(2)}`
}

// List of countries for selection
export const countries = [
  "India",
  "Bangladesh",
  "Pakistan",
  "Sri Lanka",
  "Nepal",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Japan",
  "China",
  // Add more countries as needed
]
