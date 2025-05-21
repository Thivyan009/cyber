"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { detectFileFormat, parseFileContent } from "./file-parsers";
import { processTransactionsBatch } from "./ai-transaction-processor";

interface Transaction {
  date: string;
  name: string;
  description: string;
  amount: string;
  category: string;
  type: string;
  paymentMethod: string;
  account: string;
  notes?: string;
}

const VALID_PAYMENT_METHODS = [
  "cash",
  "bank transfer",
  "check",
  "credit card",
  "debit card",
];
const VALID_ACCOUNTS = ["Bank", "Cash", "Credit"];

const CLASSIFICATION_PROMPT = `Analyze this bank transaction and classify it accurately:

Transaction: {description}
Amount: {amount}

Classify this transaction into one of these categories:

INCOME CATEGORIES:
- SALES: Revenue from selling products or services
- REFUNDS: Money returned from purchases or services
- INTEREST: Interest earned from accounts or investments
- TRANSFERS: Money received from other accounts
- OTHER_INCOME: Any other type of income

EXPENSE CATEGORIES:
- SUPPLIES: Office supplies, materials, inventory
- UTILITIES: Electricity, water, gas, internet, phone
- RENT: Office space, equipment, or property rental
- SALARIES: Employee wages and compensation
- MARKETING: Advertising, promotions, marketing costs
- TRAVEL: Business travel, transportation, fuel
- INSURANCE: Business insurance premiums
- TAXES: Business taxes, VAT, GST
- SOFTWARE: Software licenses, subscriptions, IT services
- MAINTENANCE: Equipment maintenance, repairs
- PROFESSIONAL: Legal, accounting, consulting fees
- BANKING: Bank fees, charges, interest
- TRANSFERS: Money sent to other accounts
- OTHER_EXPENSE: Any other type of expense

Provide the classification in this format:
{
  "type": "INCOME or EXPENSE",
  "category": "ONE_OF_THE_CATEGORIES_ABOVE",
  "confidence": 0.0 to 1.0,
  "notes": "Brief explanation of why this category was chosen"
}`;

export async function processBankStatement(file: File, businessId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Use provided businessId if available, otherwise look up by userId
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      // Verify the business belongs to the user
      if (business && business.userId !== session.user.id) {
        return { error: "Unauthorized access to business" };
      }
    }

    // If no business found or no businessId provided, fall back to finding by userId
    if (!business) {
      business = await prisma.business.findFirst({
        where: { userId: session.user.id },
      });
    }

    if (!business) {
      return { error: "Business not found" };
    }

    console.log(`Processing bank statement for business: ${business.id}`);

    // Detect file format
    const format = detectFileFormat(file.name);
    if (!format) {
      return { error: "Unsupported file format" };
    }

    // Generate unique file name and statement number
    const fileName = `${uuidv4()}.${format}`;
    const statementNumber = `ST-${Date.now()}`;

    // Create bank statement record first
    const bankStatement = await prisma.bankStatement.create({
      data: {
        fileName,
        originalName: file.name,
        status: "processing",
        date: new Date(), // Will be updated with actual statement date
        balance: 0, // Will be updated after processing transactions
        currency: business.currency,
        accountId: "default", // Default account ID
        statementNumber,
        businessId: business.id,
      },
    });

    // Parse file content
    const parsedTransactions = await parseFileContent(file, format);
    if (parsedTransactions.length === 0) {
      await prisma.bankStatement.update({
        where: { id: bankStatement.id },
        data: { status: "failed" },
      });
      return { error: "No transactions found in file" };
    }

    // Process transactions with AI
    const processedTransactions = await processTransactionsBatch(parsedTransactions);

    // Create transactions in batches
    const batchSize = 100;
    const transactions = [];
    let totalBalance = 0;
    let statementDate = new Date();

    for (let i = 0; i < processedTransactions.length; i += batchSize) {
      const batch = processedTransactions.slice(i, i + batchSize);
      const batchTransactions = await Promise.all(
        batch.map(async (processed) => {
          // Update total balance
          totalBalance +=
            processed.type === "INCOME" ? processed.amount : -processed.amount;

          // Use the first transaction's date as the statement date
          if (i === 0) {
            statementDate = processed.date;
          }

          return prisma.transaction.create({
            data: {
              description: processed.description,
              type: processed.type,
              accountType: processed.accountType,
              category: processed.category,
              amount: processed.amount,
              businessId: business.id,
              date: processed.date,
              bankStatementId: fileName,
              aiConfidence: processed.aiConfidence,
              notes: processed.notes,
            },
          });
        })
      );
      transactions.push(...batchTransactions);
    }

    // Update bank statement with final details
    await prisma.bankStatement.update({
      where: { id: bankStatement.id },
      data: {
        status: "completed",
        balance: totalBalance,
        date: statementDate,
      },
    });

    // Revalidate all relevant paths to trigger UI updates
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath("/reports");
    revalidatePath(`/api/transactions?businessId=${business.id}`);
    revalidatePath(`/api/financial/metrics?businessId=${business.id}`);

    // Log success message with business ID
    console.log(
      `Successfully processed ${transactions.length} transactions for business: ${business.id}`
    );

    return { 
      success: true,
      message: `Successfully processed ${transactions.length} transactions`,
      businessId: business.id,
      transactions: transactions.map((t) => ({
        id: t.id,
        name: t.description,
        type: t.type.toLowerCase() as "expense" | "income",
        account: t.accountType.toLowerCase() as "cash" | "bank" | "credit",
        category: t.category,
        amount: Number(t.amount),
        description: t.description,
        date: t.date.toISOString(),
        status: "Completed" as const,
        aiConfidence: t.aiConfidence,
        notes: t.notes,
      })),
      bankStatement: {
        id: bankStatement.id,
        fileName: bankStatement.fileName,
        originalName: bankStatement.originalName,
        status: bankStatement.status,
        date: bankStatement.date,
        balance: bankStatement.balance,
        currency: bankStatement.currency,
        accountId: bankStatement.accountId,
        statementNumber: bankStatement.statementNumber,
        createdAt: bankStatement.createdAt,
      },
    };
  } catch (error) {
    console.error("Error processing bank statement:", error);
    return { error: "Failed to process bank statement" };
  }
}
