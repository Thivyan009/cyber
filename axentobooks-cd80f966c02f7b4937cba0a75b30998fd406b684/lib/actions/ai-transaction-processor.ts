import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ProcessedTransaction {
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  amount: number;
  date: Date;
  accountType: "CASH" | "BANK" | "CREDIT";
  aiConfidence: number;
  notes?: string;
}

const CATEGORIES = {
  INCOME: [
    "Sales Revenue",
    "Service Revenue",
    "Interest Income",
    "Investment Income",
    "Other Income"
  ],
  EXPENSE: [
    "Office Supplies",
    "Rent",
    "Utilities",
    "Salaries",
    "Marketing",
    "Travel",
    "Insurance",
    "Taxes",
    "Maintenance",
    "Professional Services",
    "Other Expenses"
  ]
};

export async function processTransactionWithAI(
  rawTransaction: {
    date: string;
    description: string;
    amount: number;
  }
): Promise<ProcessedTransaction> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Analyze this bank transaction and classify it according to the following rules:
    
    Transaction Details:
    Date: ${rawTransaction.date}
    Description: ${rawTransaction.description}
    Amount: ${rawTransaction.amount}
    
    Please classify this transaction with the following information:
    1. Type (INCOME or EXPENSE)
    2. Category (from the predefined list)
    3. Account Type (CASH, BANK, or CREDIT)
    4. Confidence score (0-1)
    5. Additional notes or context
    
    Available Categories:
    Income Categories: ${CATEGORIES.INCOME.join(", ")}
    Expense Categories: ${CATEGORIES.EXPENSE.join(", ")}
    
    Respond in JSON format with the following structure:
    {
      "type": "INCOME or EXPENSE",
      "category": "category from the list",
      "description": "cleaned description",
      "amount": number,
      "date": "YYYY-MM-DD",
      "accountType": "CASH, BANK, or CREDIT",
      "aiConfidence": number between 0 and 1,
      "notes": "any additional context"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const processedData = JSON.parse(text) as ProcessedTransaction;
    
    // Validate the response
    if (!processedData.type || !processedData.category || !processedData.accountType) {
      throw new Error("Invalid AI response format");
    }

    return processedData;
  } catch (error) {
    console.error("Error processing transaction with AI:", error);
    // Return a default classification if AI processing fails
    return {
      type: rawTransaction.amount >= 0 ? "INCOME" : "EXPENSE",
      category: rawTransaction.amount >= 0 ? "Other Income" : "Other Expenses",
      description: rawTransaction.description,
      amount: Math.abs(rawTransaction.amount),
      date: new Date(rawTransaction.date),
      accountType: "BANK",
      aiConfidence: 0.5,
      notes: "Default classification due to AI processing error"
    };
  }
}

export async function processTransactionsBatch(
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
  }>
): Promise<ProcessedTransaction[]> {
  const processedTransactions: ProcessedTransaction[] = [];
  
  for (const transaction of transactions) {
    try {
      const processed = await processTransactionWithAI(transaction);
      processedTransactions.push(processed);
    } catch (error) {
      console.error("Error processing transaction:", error);
      // Add default classification for failed transactions
      processedTransactions.push({
        type: transaction.amount >= 0 ? "INCOME" : "EXPENSE",
        category: transaction.amount >= 0 ? "Other Income" : "Other Expenses",
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date),
        accountType: "BANK",
        aiConfidence: 0.5,
        notes: "Default classification due to processing error"
      });
    }
  }
  
  return processedTransactions;
} 