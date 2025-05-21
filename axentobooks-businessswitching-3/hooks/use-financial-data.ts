"use client";

import useSWR from "swr";
import { getFinancialData } from "@/lib/actions/financial";
import { useState, useEffect } from "react";
import { useBusiness } from "@/hooks/use-business";

export function useFinancialData() {
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { currentBusinessId } = useBusiness();

  const fetcher = async () => {
    if (!currentBusinessId) return null;
    console.log("Fetching financial data for business:", currentBusinessId);
    const data = await getFinancialData(currentBusinessId);
    console.log("Financial data received:", data);
    return data;
  };

  const { data, error, isLoading, mutate } = useSWR(
    currentBusinessId ? ["financial-data", currentBusinessId] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      refreshInterval: 10000, // Refresh every 10 seconds to pick up changes
      dedupingInterval: 2000, // Wait 2 seconds between duplicate requests
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      onSuccess: (data) => {
        console.log("SWR fetched financial data successfully:", {
          hasData: !!data,
          assetsTotal: data?.assets?.total,
          liabilitiesTotal: data?.liabilities?.total,
          equityTotal: data?.equity?.total,
        });
      },
      onError: (err) => {
        console.error("SWR error fetching financial data:", err);
      },
    }
  );

  // Force a revalidation on mount and when business changes
  useEffect(() => {
    if (currentBusinessId) {
      console.log("Business ID changed, forcing financial data refresh");
      mutate();
      setIsInitialMount(false);
    }
  }, [mutate, currentBusinessId]);

  // Enhanced mutate function that ensures we get fresh data
  const forceRefresh = async () => {
    console.log("Force refreshing financial data");
    return mutate(undefined, { revalidate: true });
  };

  return {
    financialData: data,
    isLoading,
    isError: error,
    mutate: forceRefresh,
  };
}

 
 