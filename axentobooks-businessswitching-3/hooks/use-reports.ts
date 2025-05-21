"use client";

import useSWR from "swr";
import { getReports } from "@/lib/actions/reports";
import { useState, useEffect } from "react";
import { useBusiness } from "@/hooks/use-business";

export function useReports() {
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { currentBusinessId } = useBusiness();

  const fetcher = async () => {
    if (!currentBusinessId) return { reports: [] };
    const result = await getReports(currentBusinessId);
    return result;
  };

  const { data, error, isLoading, mutate } = useSWR(
    currentBusinessId ? ["reports", currentBusinessId] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      refreshInterval: 0, // Don't auto-refresh
      dedupingInterval: 0, // Don't dedupe requests (always fetch fresh data)
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      onSuccess: (data) => {
        console.log("SWR fetched reports successfully:", data?.reports?.length);
      },
      onError: (err) => {
        console.error("SWR error fetching reports:", err);
      },
    }
  );

  // Force a revalidation on mount
  useEffect(() => {
    if (isInitialMount && currentBusinessId) {
      console.log("Initial mount of useReports, forcing fetch");
      mutate();
      setIsInitialMount(false);
    }
  }, [mutate, isInitialMount, currentBusinessId]);

  // Enhanced mutate function that ensures we get fresh data
  const forceRefresh = async () => {
    console.log("Force refreshing reports data");
    return mutate(undefined, { revalidate: true });
  };

  return {
    reports: data?.reports || [],
    isLoading,
    isError: error || data?.error,
    mutate: forceRefresh,
  };
}

 
 