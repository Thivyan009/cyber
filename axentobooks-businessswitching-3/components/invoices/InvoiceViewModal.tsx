"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Invoice } from "@/app/invoices/data/schema";

export function InvoiceViewModal({
  invoice,
  isOpen,
  onClose,
}: {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${invoice?.id}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice?.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download PDF"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Invoice #{invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Customer Details</h3>
            <div className="space-y-1">
              <p>{invoice.customer.name}</p>
              <p>{invoice.customer.email}</p>
              {invoice.customer.address && <p>{invoice.customer.address}</p>}
            </div>
          </div>

          <div className="text-right">
            <h3 className="font-semibold mb-2">Invoice Details</h3>
            <div className="space-y-1">
              <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
              <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p>Status: {invoice.status}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold mb-4">Items</h3>
          <div className="border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Item</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-right p-4">Quantity</th>
                  <th className="text-right p-4">Rate</th>
                  <th className="text-right p-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-4">{item.name}</td>
                    <td className="p-4">{item.description}</td>
                    <td className="p-4 text-right">{item.quantity}</td>
                    <td className="p-4 text-right">${item.rate.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      ${(item.quantity * item.rate).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>
                $
                {invoice.items
                  .reduce((sum, item) => sum + item.quantity * item.rate, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>
                $
                {(
                  invoice.items.reduce(
                    (sum, item) => sum + item.quantity * item.rate,
                    0
                  ) * (invoice.taxRate || 0)
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total:</span>
              <span>
                $
                {(
                  invoice.items.reduce(
                    (sum, item) => sum + item.quantity * item.rate,
                    0
                  ) *
                  (1 + (invoice.taxRate || 0))
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Close
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
