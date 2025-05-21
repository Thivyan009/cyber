export type TransactionType = "INCOME" | "EXPENSE";
export type AccountType = 
  | "CASH" 
  | "BANK" 
  | "CREDIT" 
  | "ACCOUNTS_RECEIVABLE"
  | "ACCOUNTS_PAYABLE"
  | "INVENTORY"
  | "EQUITY"
  | "RETAINED_EARNINGS"
  | "PREPAID_EXPENSES"
  | "ACCUMULATED_DEPRECIATION";
export type TransactionStatus = "Processing" | "Completed" | "Failed";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
  businessId: string;
  category: string;
  date: string;
  updatedAt: string;
  accountType: AccountType;
  aiConfidence?: number;
  bankStatementId?: string;
  notes?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
}

export interface TransactionFilters {
  month?: string;
  type?: TransactionType;
  account?: AccountType;
  status?: TransactionStatus;
}
