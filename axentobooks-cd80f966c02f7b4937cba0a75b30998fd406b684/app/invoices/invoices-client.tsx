"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./columns";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { InvoiceViewModal } from "@/components/invoices/InvoiceViewModal";
import type { Invoice } from "./data/schema";
import { useBusiness } from "@/hooks/use-business";
import useSWR from "swr";
import { getInvoices } from "@/lib/actions/invoice";

interface InvoicesClientProps {
  initialInvoices: Invoice[];
}

export function InvoicesClient({ initialInvoices }: InvoicesClientProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { currentBusinessId } = useBusiness();

  const { data: invoices = initialInvoices, mutate } = useSWR(
    currentBusinessId ? `/api/invoices?businessId=${currentBusinessId}` : null,
    () => getInvoices(currentBusinessId!),
    {
      fallbackData: initialInvoices,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
    }
  );

  const columns = getColumns({
    setSelectedInvoice,
    setIsViewModalOpen,
    onSuccess: () => mutate(),
  });

  return (
    <PageLayout
      title="Invoices"
      description="Manage and create your business invoices"
    >
      <div className="flex items-center justify-between">
        <Heading
          title="Invoices"
          description="Manage your invoices and track payments"
        />
        <Button asChild>
          <Link href="/invoices/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>
      <Separator className="my-4" />
      <div className="container mx-auto py-4">
        <DataTable
          columns={columns}
          data={invoices}
          searchKey="invoiceNumber"
        />
      </div>
      <InvoiceViewModal
        invoice={selectedInvoice}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </PageLayout>
  );
}
