import { NextRequest } from "next/server";
import { getInvoice } from "@/lib/actions/invoice";
import { generateInvoicePDF } from "@/lib/services/pdf-generator";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    // Await the session check
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get and validate the invoice ID
    const invoiceId = params.invoiceId;
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Invoice ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the invoice
    const invoice = await getInvoice(invoiceId);
    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Return PDF response
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error in /api/invoices/[invoiceId]/view:", error);
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
