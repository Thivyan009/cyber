import puppeteer from "puppeteer";
import { Invoice } from "@/app/invoices/data/schema";

export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    // Generate HTML content that matches the modal's layout
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
            .text-right { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
            th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
            th:last-child, td:last-child, 
            th:nth-last-child(2), td:nth-last-child(2),
            th:nth-last-child(3), td:nth-last-child(3) { text-align: right; }
            .totals { margin-top: 2rem; margin-left: auto; width: 250px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 0.5rem; }
            .total-row.final { border-top: 1px solid #eee; padding-top: 0.5rem; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1 style="text-align: right">Invoice #${invoice.invoiceNumber}</h1>
          
          <div class="grid">
            <div>
              <h3>Customer Details</h3>
              <p>${invoice.customer.name}</p>
              <p>${invoice.customer.email}</p>
              ${
                invoice.customer.address
                  ? `<p>${invoice.customer.address}</p>`
                  : ""
              }
            </div>
            
            <div class="text-right">
              <h3>Invoice Details</h3>
              <p>Date: ${new Date(invoice.date).toLocaleDateString()}</p>
              <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p>Status: ${invoice.status}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.description || ""}</td>
                  <td style="text-align: right">${item.quantity}</td>
                  <td style="text-align: right">$${item.rate.toFixed(2)}</td>
                  <td style="text-align: right">$${(
                    item.quantity * item.rate
                  ).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${invoice.items
                .reduce((sum, item) => sum + item.quantity * item.rate, 0)
                .toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>$${(
                invoice.items.reduce(
                  (sum, item) => sum + item.quantity * item.rate,
                  0
                ) * (invoice.taxRate || 0)
              ).toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>Total:</span>
              <span>$${(
                invoice.items.reduce(
                  (sum, item) => sum + item.quantity * item.rate,
                  0
                ) *
                (1 + (invoice.taxRate || 0))
              ).toFixed(2)}</span>
            </div>
          </div>

          ${
            invoice.notes
              ? `
            <div style="margin-top: 2rem">
              <h3>Notes</h3>
              <p style="color: #666">${invoice.notes}</p>
            </div>
          `
              : ""
          }
        </body>
      </html>
    `;

    await page.setContent(html);
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "40px", right: "40px", bottom: "40px", left: "40px" },
      printBackground: true,
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
