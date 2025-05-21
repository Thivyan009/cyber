import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { CreateInvoiceForm } from "./create-invoice-form";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCurrentBusiness } from "@/lib/actions/business";

export default async function CreateInvoicePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Get current business
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding"); // Redirect to business setup/onboarding
  }

  return (
    <div className="flex-col">
      <div className="flex items-center space-x-4 p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/invoices" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Invoices</span>
          </Link>
        </Button>
      </div>
      <Separator />
      <div className="flex-1 space-y-4 p-8">
        <CreateInvoiceForm />
      </div>
    </div>
  );
}
