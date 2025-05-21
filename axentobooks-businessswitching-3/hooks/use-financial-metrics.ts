"use client";

import useSWR from "swr";
import { getFinancialMetrics } from "@/lib/actions/transactions";
import { useState, useEffect } from "react";
import { useBusiness } from "@/hooks/use-business";

export function useFinancialMetrics() {
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { currentBusinessId } = useBusiness();

  const fetcher = async () => {
    if (!currentBusinessId) {
      console.log("No business ID available for metrics");
      return { metrics: { totalRevenue: 0, totalExpenses: 0, cashFlow: 0 } };
    }

    console.log("Fetching financial metrics for business:", currentBusinessId);
    try {
      const result = await getFinancialMetrics(currentBusinessId);
      if (result.error) {
        console.error("Error fetching metrics:", result.error);
        throw new Error(result.error);
      }

      console.log("Financial metrics received:", result.metrics);
      return result;
    } catch (error) {
      console.error("Failed to fetch financial metrics:", error);
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR(
    currentBusinessId ? ["financial-metrics", currentBusinessId] : null,
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
        console.log("SWR fetched financial metrics successfully:", {
          totalRevenue: data?.metrics?.totalRevenue,
          totalExpenses: data?.metrics?.totalExpenses,
          cashFlow: data?.metrics?.cashFlow,
        });
      },
      onError: (err) => {
        console.error("SWR error fetching financial metrics:", err);
      },
    }
  );

  // Force a revalidation when business changes
  useEffect(() => {
    if (currentBusinessId) {
      console.log("Business ID changed, forcing metrics refresh");
      mutate();
    }
  }, [currentBusinessId, mutate]);

  // Force refresh the metrics data with no caching
  const forceRefresh = async () => {
    console.log(`Force refreshing metrics for business: ${currentBusinessId}`);

    // Clear the cache and make a new request
    await mutate(undefined, {
      revalidate: true,
      populateCache: true, // Force update of cache
      optimisticData: data?.metrics || {
        totalRevenue: 0,
        totalExpenses: 0,
        cashFlow: 0,
      }, // Show optimistic data
    });

    // After a brief delay, refresh again to ensure we have the latest data
    setTimeout(async () => {
      console.log("Secondary metrics refresh to ensure latest data");
      await mutate();
    }, 500);

    return true;
  };

  return {
    metrics: data?.metrics || {
      totalRevenue: 0,
      totalExpenses: 0,
      cashFlow: 0,
    },
    isLoading,
    isError: error || data?.error,
    mutate: forceRefresh,
  };
}
