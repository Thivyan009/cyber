"use client";

import useSWR from "swr";
import { getInvoices } from "@/lib/actions/invoice";
import { useState, useEffect } from "react";
import { useBusiness } from "@/lib/hooks/use-business";

export function useInvoices() {
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { currentBusinessId } = useBusiness();

  const fetcher = async () => {
    if (!currentBusinessId) return [];
    return getInvoices(currentBusinessId);
  };

  const { data, error, isLoading, mutate } = useSWR(
    currentBusinessId ? ["invoices", currentBusinessId] : null,
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
        console.log("SWR fetched invoices successfully:", data?.length);
      },
      onError: (err) => {
        console.error("SWR error fetching invoices:", err);
      },
    }
  );

  // Force a revalidation on mount
  useEffect(() => {
    if (isInitialMount && currentBusinessId) {
      console.log("Initial mount of useInvoices, forcing fetch");
      mutate();
      setIsInitialMount(false);
    }
  }, [mutate, isInitialMount, currentBusinessId]);

  // Enhanced mutate function that ensures we get fresh data
  const forceRefresh = async () => {
    console.log("Force refreshing invoices data");
    return mutate(undefined, { revalidate: true });
  };

  return {
    invoices: data || [],
    isLoading,
    isError: error,
    mutate: forceRefresh,
  };
}

 
 