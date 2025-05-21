"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBusiness } from "@/hooks/use-business";
import { useSession } from "next-auth/react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingControllerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get("businessId");
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const { businesses, currentBusinessId, setCurrentBusinessId, isLoading } =
    useBusiness();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && !isLoading) {
      // If businessId is provided in URL, always use it for onboarding
      if (businessIdParam) {
        console.log("Setting business from URL param:", businessIdParam);
        setCurrentBusinessId(businessIdParam);
        return; // Don't do any further redirects
      }

      // Check if the user has any businesses
      const fetchBusinesses = async () => {
        try {
          const response = await fetch("/api/businesses");
          if (response.ok) {
            const businesses = await response.json();

            if (businesses.length === 0) {
              // No businesses, redirect to create first business
              router.push("/onboarding/new-business");
              return;
            }

            // If we already have a current business ID selected, continue with onboarding
            if (currentBusinessId) {
              // Check if this business needs onboarding
              const currentBusiness = businesses.find(
                (b) => b.id === currentBusinessId
              );

              if (currentBusiness && !currentBusiness.onboardingCompleted) {
                // Current business needs onboarding, stay here
                return;
              }
            }

            // Find a business that needs onboarding
            const businessNeedingOnboarding = businesses.find(
              (b) => !b.onboardingCompleted
            );

            if (businessNeedingOnboarding) {
              // Switch to this business and stay on onboarding
              setCurrentBusinessId(businessNeedingOnboarding.id);
              return;
            }

            // All businesses are onboarded, go to dashboard
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching businesses:", error);
        }
      };

      fetchBusinesses();
    }
  }, [status, router, setCurrentBusinessId, isLoading, businessIdParam, currentBusinessId]);

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-medium">Loading...</h2>
          <p className="text-muted-foreground">
            We're preparing your experience...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <OnboardingForm />;
}
