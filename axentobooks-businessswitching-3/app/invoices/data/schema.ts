export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  address?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  date: string;
  dueDate: string;
  status: "DUE" | "PAID";
  items: InvoiceItem[];
  taxRate?: number;
  notes?: string;
} 