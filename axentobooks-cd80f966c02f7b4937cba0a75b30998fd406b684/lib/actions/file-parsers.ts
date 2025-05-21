import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { parse as qifParse } from "qif-parser";
import { parse as ofxParse } from "ofx";
import { parse as iifParse } from "iif-parser";
import { parse as difParse } from "dif-parser";

export type SupportedFileFormat = "csv" | "xlsx" | "qif" | "dif" | "ofx" | "iif" | "pdf";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  rawData: Record<string, unknown>;
}

export function detectFileFormat(fileName: string): SupportedFileFormat | null {
  const extension = fileName.toLowerCase().split(".").pop();
  switch (extension) {
    case "csv":
      return "csv";
    case "xlsx":
    case "xls":
      return "xlsx";
    case "qif":
      return "qif";
    case "dif":
      return "dif";
    case "ofx":
      return "ofx";
    case "iif":
      return "iif";
    case "pdf":
      return "pdf";
    default:
      return null;
  }
}

export async function parseFileContent(
  file: File,
  format: SupportedFileFormat
): Promise<ParsedTransaction[]> {
  const content = await file.text();
  
  switch (format) {
    case "csv":
      return parseCSV(content);
    case "xlsx":
      return parseXLSX(content);
    case "qif":
      return parseQIF(content);
    case "dif":
      return parseDIF(content);
    case "ofx":
      return parseOFX(content);
    case "iif":
      return parseIIF(content);
    case "pdf":
      throw new Error("PDF parsing must be done on the client side");
    default:
      throw new Error(`Unsupported file format: ${format}`);
  }
}

function parseCSV(content: string): ParsedTransaction[] {
  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((record: Record<string, unknown>) => ({
    date: getFieldValue(record, ["date", "Date", "DATE", "transaction_date"]),
    description: getFieldValue(record, ["description", "Description", "DESCRIPTION", "memo", "Memo", "narrative", "Narrative"]),
    amount: Number.parseFloat(getFieldValue(record, ["amount", "Amount", "AMOUNT", "value", "Value"])),
    rawData: record,
  }));
}

function parseXLSX(content: string): ParsedTransaction[] {
  const workbook = XLSX.read(content, { type: "string" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

  return records.map((record) => ({
    date: getFieldValue(record, ["date", "Date", "DATE", "transaction_date"]),
    description: getFieldValue(record, ["description", "Description", "DESCRIPTION", "memo", "Memo", "narrative", "Narrative"]),
    amount: Number.parseFloat(getFieldValue(record, ["amount", "Amount", "AMOUNT", "value", "Value"])),
    rawData: record,
  }));
}

function parseQIF(content: string): ParsedTransaction[] {
  const lines = content.split("\n");
  const transactions: ParsedTransaction[] = [];
  let currentTransaction: Partial<ParsedTransaction> = {};

  for (const line of lines) {
    if (line.startsWith("^")) {
      if (currentTransaction.date && currentTransaction.amount) {
        transactions.push({
          date: currentTransaction.date,
          description: currentTransaction.description || "",
          amount: Number.parseFloat(currentTransaction.amount.toString()),
          rawData: currentTransaction,
        });
      }
      currentTransaction = {};
    } else if (line.startsWith("D")) {
      currentTransaction.date = line.substring(1).trim();
    } else if (line.startsWith("T")) {
      currentTransaction.amount = line.substring(1).trim();
    } else if (line.startsWith("M")) {
      currentTransaction.description = line.substring(1).trim();
    }
  }

  return transactions;
}

function parseDIF(content: string): ParsedTransaction[] {
  const lines = content.split("\n");
  const transactions: ParsedTransaction[] = [];
  let headers: string[] = [];
  let isData = false;

  for (const line of lines) {
    if (line.startsWith("BOT")) {
      isData = true;
      continue;
    } else if (line.startsWith("EOD")) {
      break;
    }

    if (isData) {
      const values = line.split("\t");
      if (headers.length === 0) {
        headers = values;
      } else {
        const record: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        transactions.push({
          date: getFieldValue(record, ["date", "Date", "DATE"]),
          description: getFieldValue(record, ["description", "Description", "DESCRIPTION"]),
          amount: Number.parseFloat(getFieldValue(record, ["amount", "Amount", "AMOUNT"])),
          rawData: record,
        });
      }
    }
  }

  return transactions;
}

function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = stmttrnRegex.exec(content)) !== null) {
    const transaction = match[1];
    const date = transaction.match(/<DTPOSTED>(\d{8})/)?.[1];
    const amount = transaction.match(/<TRNAMT>([-\d.]+)/)?.[1];
    const memo = transaction.match(/<MEMO>([^<]+)/)?.[1];

    if (date && amount) {
      transactions.push({
        date: formatOFXDate(date),
        description: memo || "",
        amount: Number.parseFloat(amount),
        rawData: { date, amount, memo },
      });
    }
  }

  return transactions;
}

function parseIIF(content: string): ParsedTransaction[] {
  const lines = content.split("\n");
  const transactions: ParsedTransaction[] = [];
  let headers: string[] = [];
  let isData = false;

  for (const line of lines) {
    if (line.startsWith("!TRNS")) {
      headers = line.split("\t").map(h => h.replace("!", ""));
      isData = true;
      continue;
    } else if (line.startsWith("!ENDTRNS")) {
      break;
    }

    if (isData && line.trim()) {
      const values = line.split("\t");
      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });

      transactions.push({
        date: getFieldValue(record, ["DATE", "Date"]),
        description: getFieldValue(record, ["MEMO", "NAME", "DESC"]),
        amount: Number.parseFloat(getFieldValue(record, ["AMOUNT", "Amount"])),
        rawData: record,
      });
    }
  }

  return transactions;
}

function getFieldValue(record: Record<string, unknown>, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    if (record[key] !== undefined) {
      return String(record[key]);
    }
  }
  return "";
}

function formatOFXDate(dateStr: string): string {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
} 