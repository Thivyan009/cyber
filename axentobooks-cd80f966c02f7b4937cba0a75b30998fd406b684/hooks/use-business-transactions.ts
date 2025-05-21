"use client";

import useSWR from "swr";
import { getTransactions } from "@/lib/actions/transactions";
import { useState, useEffect } from "react";
import { useBusiness } from "@/hooks/use-business";

export function useBusinessTransactions() {
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { currentBusinessId } = useBusiness();

  const fetcher = async () => {
    if (!currentBusinessId) {
      console.log("No business ID available for transactions");
      return { transactions: [] };
    }

    console.log("Fetching transactions for business:", currentBusinessId);
    try {
      const result = await getTransactions(currentBusinessId);
      if (result.error) {
        console.error("Error fetching transactions:", result.error);
        throw new Error(result.error);
      }

      console.log("Transactions received:", result.transactions?.length || 0);
      return result;
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR(
    currentBusinessId ? ["transactions", currentBusinessId] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      dedupingInterval: 5000, // Wait 5 seconds between duplicate requests
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      onSuccess: (data) => {
        console.log(
          "SWR fetched transactions successfully:",
          data?.transactions?.length,
          "for business:",
          currentBusinessId
        );
      },
      onError: (err) => {
        console.error("SWR error fetching transactions:", err);
      },
    }
  );

  // Force a revalidation when business changes
  useEffect(() => {
    if (currentBusinessId) {
      console.log("Business ID changed, forcing transactions refresh");
      mutate();
    }
  }, [currentBusinessId, mutate]);

  // Enhanced mutate function that ensures we get fresh data
  const forceRefresh = async () => {
    console.log(
      `Force refreshing transactions for business: ${currentBusinessId}`
    );

    // Clear the cache and make a new request
    await mutate(undefined, {
      revalidate: true,
      populateCache: true, // Force update of cache
      optimisticData: data || { transactions: [] }, // Show optimistic data
    });

    // After a brief delay, refresh again to ensure we have the latest data
    setTimeout(async () => {
      console.log("Secondary transactions refresh to ensure latest data");
      await mutate();
    }, 500);

    return true;
  };

  return {
    transactions: data?.transactions || [],
    isLoading,
    isError: error || data?.error,
    mutate: forceRefresh,
  };
}
