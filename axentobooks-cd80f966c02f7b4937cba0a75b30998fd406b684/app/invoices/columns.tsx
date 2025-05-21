"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, Download, Mail, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  markInvoiceAsPaid,
  markInvoiceAsUnpaid,
  downloadInvoice,
  emailInvoice,
} from "@/lib/actions/invoice";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Dispatch, SetStateAction } from "react";
import { Invoice } from "./data/schema";

interface ColumnActionsProps {
  setSelectedInvoice: Dispatch<SetStateAction<Invoice | null>>;
  setIsViewModalOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
}

async function handleMarkAsPaid(invoiceId: string, onSuccess?: () => void) {
  try {
    await markInvoiceAsPaid(invoiceId);
    toast.success("Invoice marked as paid");
    onSuccess?.();
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    toast.error("Failed to update invoice");
  }
}

async function handleMarkAsUnpaid(invoiceId: string, onSuccess?: () => void) {
  try {
    await markInvoiceAsUnpaid(invoiceId);
    toast.success("Invoice marked as unpaid");
    onSuccess?.();
  } catch (error) {
    console.error("Error marking invoice as unpaid:", error);
    toast.error("Failed to update invoice");
  }
}

async function handleDownloadPDF(invoiceId: string) {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/download`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || "Download failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("Invoice downloaded successfully");
  } catch (error) {
    toast.error(error.message || "Error downloading PDF");
    console.error("Error downloading PDF:", error);
  }
}

async function handleEmail(invoiceId: string) {
  try {
    await emailInvoice(invoiceId);
    toast.success("Invoice sent via email");
  } catch (error) {
    toast.error("Failed to send invoice");
  }
}

export const getColumns = ({
  setSelectedInvoice,
  setIsViewModalOpen,
  onSuccess,
}: ColumnActionsProps): ColumnDef<Invoice>[] => [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customer.name,
  },
  {
    accessorKey: "creationDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("creationDate") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    accessorKey: "paidDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Paid Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("paidDate") as string;
      return date ? new Date(date).toLocaleDateString() : "-";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "PAID" ? "success" : "destructive"}>
          {status === "PAID" ? "Paid" : "Due"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("subtotal"));
      return formatCurrency(amount);
    },
  },
  {
    accessorKey: "tax",
    header: "Tax",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("tax"));
      return formatCurrency(amount);
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("total"));
      return formatCurrency(amount);
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const invoice = row.original;
      const isPaid = invoice.status === "PAID";

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedInvoice(invoice);
              setIsViewModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDownloadPDF(invoice.id)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setIsViewModalOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEmail(invoice.id)}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {invoice.status === "DUE" ? (
                <DropdownMenuItem
                  onClick={() => handleMarkAsPaid(invoice.id, onSuccess)}
                >
                  Mark as Paid
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleMarkAsUnpaid(invoice.id, onSuccess)}
                >
                  Mark as Unpaid
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
