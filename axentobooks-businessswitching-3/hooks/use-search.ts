"use client"

import { useCallback } from "react"
import type { Transaction } from "@/lib/types"

export function useSearch(transactions: Transaction[], searchQuery: string) {
  const searchResults = useCallback(() => {
    if (!searchQuery.trim()) return transactions

    const query = searchQuery.toLowerCase().trim()
    return transactions.filter((transaction) => {
      // Search in all relevant fields
      const searchableFields = [
        transaction.name,
        transaction.category,
        transaction.type,
        transaction.amount.toString(),
        transaction.description || '',
        transaction.date,
        transaction.status || '',
      ]

      return searchableFields.some(field => 
        field.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, transactions])

  return {
    searchResults: searchResults(),
  }
}

