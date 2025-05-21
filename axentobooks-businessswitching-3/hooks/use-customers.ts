"use client";

import useSWR from "swr";
import { getCustomers } from "@/lib/actions/customer";
import { useState, useEffect } from "react";
import { useBusiness } from "@/hooks/use-business";

export function useCustomers() {
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { currentBusinessId } = useBusiness();

  const fetcher = async () => {
    if (!currentBusinessId) return [];
    return getCustomers(currentBusinessId);
  };

  const { data, error, isLoading, mutate } = useSWR(
    currentBusinessId ? ["customers", currentBusinessId] : null,
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
        console.log("SWR fetched customers successfully:", data?.length);
      },
      onError: (err) => {
        console.error("SWR error fetching customers:", err);
      },
    }
  );

  // Force a revalidation on mount
  useEffect(() => {
    if (isInitialMount && currentBusinessId) {
      console.log("Initial mount of useCustomers, forcing fetch");
      mutate();
      setIsInitialMount(false);
    }
  }, [mutate, isInitialMount, currentBusinessId]);

  // Enhanced mutate function that ensures we get fresh data
  const forceRefresh = async () => {
    console.log("Force refreshing customers data");
    return mutate(undefined, { revalidate: true });
  };

  return {
    customers: data || [],
    isLoading,
    isError: error,
    mutate: forceRefresh,
  };
}
