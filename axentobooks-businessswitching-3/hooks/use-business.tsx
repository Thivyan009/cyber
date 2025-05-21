"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Business = {
  id: string;
  name: string;
  industry?: string;
};

type BusinessContextType = {
  businesses: Business[];
  currentBusinessId: string | null;
  setCurrentBusinessId: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
};

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/businesses");

        if (!response.ok) {
          throw new Error("Failed to fetch businesses");
        }

        const data = await response.json();
        setBusinesses(data);

        // Set current business from localStorage or use the first business
        const savedBusinessId = localStorage.getItem("currentBusinessId");
        if (
          savedBusinessId &&
          data.some((b: Business) => b.id === savedBusinessId)
        ) {
          setCurrentBusinessId(savedBusinessId);
        } else if (data.length > 0) {
          setCurrentBusinessId(data[0].id);
          localStorage.setItem("currentBusinessId", data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  // Save current business ID to localStorage when it changes
  useEffect(() => {
    if (currentBusinessId) {
      localStorage.setItem("currentBusinessId", currentBusinessId);
    }
  }, [currentBusinessId]);

  const handleSetCurrentBusinessId = async (id: string) => {
    // Set the current business ID
    setCurrentBusinessId(id);

    // Save to localStorage
    localStorage.setItem("currentBusinessId", id);

    // Only force a reload if not in onboarding flow, to prevent loops
    if (!window.location.pathname.includes("/onboarding")) {
      // Force a complete page reload to ensure all data is refreshed for the new business
      window.location.reload();
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        currentBusinessId,
        setCurrentBusinessId: handleSetCurrentBusinessId,
        isLoading,
        error,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
 
 
 