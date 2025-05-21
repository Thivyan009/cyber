import { NextApiRequest, NextApiResponse } from "next";
import { getInvoice } from "@/lib/actions/invoice";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing invoice ID" });
  }

  try {
    const invoice = await getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Invoice", 14, 18);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 28);
    doc.text(`Customer: ${invoice.customer.name}`, 14, 36);
    doc.text(`Email: ${invoice.customer.email || "-"}`, 14, 44);
    doc.text(
      `Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`,
      14,
      52
    );
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      14,
      60
    );
    doc.text(`Status: ${invoice.status}`, 14, 68);

    // Table of items
    const itemRows = invoice.items.map((item: any) => [
      item.name,
      item.description || "",
      item.quantity,
      item.rate,
      item.amount,
    ]);
    (doc as any).autoTable({
      head: [["Item", "Description", "Qty", "Rate", "Amount"]],
      body: itemRows,
      startY: 75,
    });

    // Summary
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 14, y);
    y += 8;
    doc.text(`Tax: $${invoice.tax.toFixed(2)}`, 14, y);
    y += 8;
    doc.setFontSize(14);
    doc.text(`Total: $${invoice.total.toFixed(2)}`, 14, y + 6);

    // Notes
    if (invoice.notes) {
      doc.setFontSize(12);
      doc.text("Notes:", 14, y + 18);
      doc.text(invoice.notes, 14, y + 26);
    }

    // Output PDF
    const pdf = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
    if (req.query.download) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${filename}\"`
      );
    } else {
      res.setHeader("Content-Disposition", `inline; filename=\"${filename}\"`);
    }
    res.status(200).send(Buffer.from(pdf));
  } catch (error) {
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}
