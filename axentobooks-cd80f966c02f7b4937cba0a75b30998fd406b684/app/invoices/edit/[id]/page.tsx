import { PageLayout } from "@/components/layouts/page-layout";
import { getInvoice } from "@/lib/actions/invoice";
import { EditInvoiceForm } from "@/components/invoices/edit-invoice-form";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Check if user has a business
  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
  });

  if (!business) {
    redirect("/onboarding");
  }

  const invoice = await getInvoice(params.id);

  return (
    <PageLayout
      title="Edit Invoice"
      description={`Edit invoice ${invoice.invoiceNumber}`}
    >
      <div className="flex justify-between items-center">
        <Heading
          title="Edit Invoice"
          description="Update invoice details and items"
        />
        <Button variant="outline" asChild>
          <Link href={`/invoices/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Link>
        </Button>
      </div>
      <Separator className="my-4" />
      <EditInvoiceForm invoice={invoice} />
    </PageLayout>
  );
}
