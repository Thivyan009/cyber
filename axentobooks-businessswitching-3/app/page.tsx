"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageLoading } from "@/components/ui/page-loading";

export default function IndexPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Return loading state while checking
  return <PageLoading />;
}
