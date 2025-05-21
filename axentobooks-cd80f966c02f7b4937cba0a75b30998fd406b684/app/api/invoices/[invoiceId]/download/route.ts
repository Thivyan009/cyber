import { NextRequest } from "next/server";
import { getInvoice } from "@/lib/actions/invoice";
import { generateInvoicePDF } from "@/lib/services/pdf-generator";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get invoice
    const invoice = await getInvoice(params.invoiceId);
    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Return PDF
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error in /api/invoices/[invoiceId]/download:", error);
    return new Response(
      JSON.stringify({
        error: "Error generating PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
