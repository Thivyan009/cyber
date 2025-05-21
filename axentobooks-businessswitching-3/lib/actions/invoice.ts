"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import nodemailer from "nodemailer";
import { updateFinancialMetrics } from "@/lib/actions/financial";
import { revalidatePath } from "next/cache";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  rate: number;
}

interface CustomerDetails {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CreateInvoiceWithCustomerData {
  customer: CustomerDetails;
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
}

interface CreateInvoiceData {
  customerId: string;
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
}

function generateInvoiceNumber() {
  const prefix = "INV";
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export async function createInvoice(
  data: CreateInvoiceData,
  businessId?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  let targetBusinessId = businessId;

  if (!targetBusinessId) {
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    targetBusinessId = business.id;
  }

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  // You can customize tax calculation based on your needs
  const tax = 0;
  const total = subtotal + tax;

  // Default issue date to today
  const issueDate = new Date();

  return prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      customerId: data.customerId,
      businessId: targetBusinessId,
      issueDate,
      dueDate: data.dueDate,
      subtotal,
      tax,
      total,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
        })),
      },
    },
    include: {
      items: true,
      customer: true,
    },
  });
}

export async function getInvoices(businessId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Require businessId parameter
  if (!businessId) {
    throw new Error("Business ID is required");
  }

  // Verify business ownership
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      userId: session.user.id,
    },
  });

  if (!business) {
    throw new Error("Business not found or unauthorized");
  }

  const invoices = await prisma.invoice.findMany({
    where: { businessId },
    include: {
      customer: true,
      items: true,
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((invoice) => ({
    ...invoice,
    customerName: invoice.customer.name,
  }));
}

export async function getInvoice(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      business: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Verify that the invoice belongs to the user's business
  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
  });

  if (!business || invoice.businessId !== business.id) {
    throw new Error("Unauthorized");
  }

  return invoice;
}

export async function markInvoiceAsPaid(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      business: true,
      transactions: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Verify ownership
  const business = await prisma.business.findFirst({
    where: {
      id: invoice.businessId,
      userId: session.user.id,
    },
  });

  if (!business) {
    throw new Error("Unauthorized");
  }

  // Skip if already paid
  if (invoice.status === "PAID") {
    return invoice;
  }

  // Start a transaction to ensure both invoice and transaction are updated atomically
  const result = await prisma.$transaction(async (tx) => {
    // Update invoice status
    const updatedInvoice = await tx.invoice.update({
      where: { id },
      data: { status: "PAID" },
    });

    // Check for existing payment transaction
    const existingPayment = await tx.transaction.findFirst({
      where: {
        invoiceId: invoice.id,
        type: "INCOME",
        description: { contains: invoice.invoiceNumber },
      },
    });
    if (!existingPayment) {
      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: invoice.total,
          description: `Invoice Payment: ${invoice.invoiceNumber}`,
          date: new Date(),
          businessId: invoice.businessId,
          category: "Invoice Payment",
          accountType: "ACCOUNTS_RECEIVABLE",
          invoiceId: invoice.id,
        },
      });
    }
    // Remove any reversal transactions
    await tx.transaction.deleteMany({
      where: {
        invoiceId: invoice.id,
        type: "EXPENSE",
        description: { contains: "Reversal" },
      },
    });

    // Update financial metrics for the business
    await updateFinancialMetrics(invoice.businessId, invoice.total);

    return updatedInvoice;
  });

  // Revalidate dashboard and invoices pages
  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  return result;
}

export async function markInvoiceAsUnpaid(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      business: true,
      transactions: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Verify ownership
  const business = await prisma.business.findFirst({
    where: {
      id: invoice.businessId,
      userId: session.user.id,
    },
  });

  if (!business) {
    throw new Error("Unauthorized");
  }

  // Skip if already unpaid
  if (invoice.status === "DUE") {
    return invoice;
  }

  // Start a transaction to ensure both invoice and transaction are updated atomically
  const result = await prisma.$transaction(async (tx) => {
    // Update invoice status
    const updatedInvoice = await tx.invoice.update({
      where: { id },
      data: { status: "DUE" },
    });

    // Delete all payment transactions for this invoice
    await tx.transaction.deleteMany({
      where: {
        invoiceId: invoice.id,
        type: "INCOME",
        description: { contains: invoice.invoiceNumber },
      },
    });
    // Only create reversal if not already present
    const existingReversal = await tx.transaction.findFirst({
      where: {
        invoiceId: invoice.id,
        type: "EXPENSE",
        description: { contains: "Reversal" },
      },
    });
    if (!existingReversal) {
      await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: invoice.total,
          description: `Invoice Reversal: ${invoice.invoiceNumber}`,
          date: new Date(),
          businessId: invoice.businessId,
          category: "Invoice Reversal",
          accountType: "ACCOUNTS_RECEIVABLE",
          invoiceId: invoice.id,
        },
      });
    }

    // Update financial metrics for the business
    await updateFinancialMetrics(invoice.businessId, -invoice.total);

    return updatedInvoice;
  });

  // Revalidate dashboard and invoices pages
  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  return result;
}

export async function downloadInvoice(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invoice = await getInvoice(id);

  // This function would normally generate a PDF file
  // For demonstration, we'll return a status that would be handled by the frontend
  return { success: true, message: "PDF generated successfully" };
}

export async function emailInvoice(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invoice = await getInvoice(id);

  // This function would normally send an email with the invoice
  // For demonstration, we'll return a status that would be handled by the frontend
  return { success: true, message: "Email sent successfully" };
}

export async function updateInvoice(
  id: string,
  data: Partial<CreateInvoiceData>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Verify ownership
  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
  });

  if (!business || invoice.businessId !== business.id) {
    throw new Error("Unauthorized");
  }

  // Calculate new values if items are updated
  let subtotal = invoice.subtotal;
  let total = invoice.total;

  if (data.items) {
    // Delete existing items
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Calculate new totals
    subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    total = subtotal; // No tax for simplicity
  }

  // Update invoice
  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(data.customerId && { customerId: data.customerId }),
      ...(data.dueDate && { dueDate: data.dueDate }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.items && {
        subtotal,
        total,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })),
        },
      }),
    },
    include: {
      items: true,
      customer: true,
    },
  });

  // Revalidate the invoices page
  revalidatePath("/invoices");

  return updatedInvoice;
}

export async function deleteInvoice(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Verify ownership
  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
  });

  if (!business || invoice.businessId !== business.id) {
    throw new Error("Unauthorized");
  }

  // If invoice was paid, update financial metrics
  if (invoice.status === "PAID") {
    await updateFinancialMetrics(business.id, -invoice.total);
  }

  // Delete invoice and all related items (using cascade)
  await prisma.invoice.delete({
    where: { id },
  });

  // Revalidate pages
  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  return { success: true };
}

export async function createInvoiceWithCustomer(
  data: CreateInvoiceWithCustomerData,
  businessId?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Require businessId parameter
  if (!businessId) {
    throw new Error("Business ID is required");
  }

  // Verify business ownership
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      userId: session.user.id,
    },
  });

  if (!business) {
    throw new Error("Business not found or unauthorized");
  }

  // Calculate totals
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const tax = 0; // No tax for simplicity
  const total = subtotal + tax;

  // Default issue date to today
  const issueDate = new Date();

  try {
    // Begin transaction
    return await prisma.$transaction(async (tx) => {
      // Create or find the customer
      let customer = await tx.customer.findFirst({
        where: {
          businessId: business.id,
          name: data.customer.name,
          email: data.customer.email || undefined,
        },
      });

      if (!customer) {
        // If customer doesn't exist, create it
        customer = await tx.customer.create({
          data: {
            ...data.customer,
            businessId: business.id,
          },
        });
      }

      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          customerId: customer.id,
          businessId: business.id,
          issueDate,
          dueDate: data.dueDate,
          subtotal,
          tax,
          total,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.quantity * item.rate,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      return invoice;
    });
  } catch (error) {
    console.error("Error creating invoice with customer:", error);
    throw new Error("Failed to create invoice. Please try again.");
  } finally {
    // Revalidate related paths
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
  }
}
