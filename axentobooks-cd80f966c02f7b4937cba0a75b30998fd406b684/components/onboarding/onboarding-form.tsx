"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { WelcomeStep } from "./steps/welcome-step";
import { BusinessInfoStep } from "./steps/business-info-step";
import { FinancialGoalsStep } from "./steps/financial-goals-step";
import { AssetsStep } from "./steps/assets-step";
import { LiabilitiesStep } from "./steps/liabilities-step";
import { EquityStep } from "./steps/equity-step";
import { SuccessStep } from "./steps/success-step";
import { OnboardingProgress } from "./onboarding-progress";
import {
  saveOnboardingData,
  completeOnboardingAction,
} from "@/lib/actions/onboarding";
import { useBusiness } from "@/hooks/use-business";
import { useSearchParams } from "next/navigation";
import type {
  Asset,
  Liability,
  Equity,
  BusinessInfo,
  FinancialGoal,
} from "@/lib/types/onboarding";

export type FormData = {
  businessInfo: BusinessInfo;
  financialGoals: FinancialGoal[];
  assets: Asset[];
  liabilities: Liability[];
  equity: Equity[];
};

export type FormValue =
  | BusinessInfo
  | FinancialGoal[]
  | Asset[]
  | Liability[]
  | Equity[];

export function OnboardingForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBusinessId } = useBusiness();

  // Use provided businessId or fall back to current business
  const businessId = searchParams?.get("businessId") || currentBusinessId;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessInfo: {
      name: "",
      industry: "",
      registrationNumber: "",
      taxId: "",
    },
    financialGoals: [],
    assets: [],
    liabilities: [],
    equity: [],
  });

  const steps = [
    { title: "Welcome", component: WelcomeStep },
    { title: "Business Info", component: BusinessInfoStep },
    { title: "Financial Goals", component: FinancialGoalsStep },
    { title: "Assets", component: AssetsStep },
    { title: "Liabilities", component: LiabilitiesStep },
    { title: "Equity", component: EquityStep },
    { title: "Success", component: SuccessStep },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive",
      });
      return;
    }

    if (!businessId) {
      toast({
        title: "Error",
        description: "Business ID is required to complete onboarding",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First save the onboarding data
      await saveOnboardingData(session.user.id, formData, businessId);

      // Then complete the onboarding process with the business ID
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to complete onboarding");
      }

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error(
        "Onboarding error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof FormData, data: FormValue) => {
    setFormData({
      ...formData,
      [field]: data,
    });
  };

  // Create a form object to pass to components
  const form = {
    getValues: () => formData,
    setValue: (field: keyof FormData, value: FormValue) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
  };

  const CurrentStep = steps[currentStep].component;

  return (
    <div className="mx-auto max-w-4xl">
      <OnboardingProgress currentStep={currentStep} totalSteps={steps.length} />
      <div className="mt-8">
        <CurrentStep
          form={form}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
          formData={formData}
          updateFormData={updateFormData}
          isSubmitting={isSubmitting}
          businessId={businessId}
        />
      </div>
    </div>
  );
}
