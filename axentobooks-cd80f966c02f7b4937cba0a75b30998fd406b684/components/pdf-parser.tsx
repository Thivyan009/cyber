"use client";

import { useEffect, useState } from "react";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  rawData: Record<string, unknown>;
}

export async function parsePDFFile(file: File): Promise<ParsedTransaction[]> {
  try {
    // Dynamically import PDF.js only on the client side
    const pdfjsLib = await import("pdfjs-dist");
    
    // Initialize PDF.js worker
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const transactions: ParsedTransaction[] = [];
    
    // Common patterns for transaction lines in bank statements
    const datePattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/; // Matches dates like DD/MM/YYYY or MM/DD/YYYY
    const amountPattern = /[-+]?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/; // Matches amounts like $1,234.56 or -$1,234.56
    
    let currentTransaction: Partial<ParsedTransaction> = {};
    let descriptionBuffer: string[] = [];
    let isCollectingDescription = false;
    
    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Get text items with their positions
      const items = textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5]
      }));
      
      // Sort items by position (top to bottom, left to right)
      items.sort((a: any, b: any) => {
        if (Math.abs(a.y - b.y) < 5) { // Same line if y-coordinates are close
          return a.x - b.x;
        }
        return b.y - a.y;
      });
      
      // Process items line by line
      let currentLine = "";
      let currentY = items[0]?.y;
      
      for (const item of items) {
        // If we're on a new line
        if (Math.abs(item.y - currentY) > 5) {
          if (currentLine.trim()) {
            processLine(currentLine.trim());
          }
          currentLine = item.text;
          currentY = item.y;
        } else {
          // Add space between items on the same line
          currentLine += (currentLine ? " " : "") + item.text;
        }
      }
      
      // Process the last line
      if (currentLine.trim()) {
        processLine(currentLine.trim());
      }
    }
    
    // Add the last transaction if exists
    if (currentTransaction.date && currentTransaction.amount) {
      transactions.push({
        date: currentTransaction.date,
        description: currentTransaction.description || "",
        amount: Number.parseFloat(currentTransaction.amount.toString()),
        rawData: currentTransaction,
      });
    }
    
    return transactions;
    
    function processLine(line: string) {
      // Skip empty lines and headers
      if (!line.trim() || 
          (line.includes("Date") && line.includes("Description") && line.includes("Amount")) ||
          line.includes("Page") || 
          line.includes("Statement")) {
        return;
      }
      
      // Try to find a date in the line
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        // If we have a previous transaction, save it
        if (currentTransaction.date && currentTransaction.amount) {
          transactions.push({
            date: currentTransaction.date,
            description: currentTransaction.description || "",
            amount: Number.parseFloat(currentTransaction.amount.toString()),
            rawData: currentTransaction,
          });
        }
        
        // Start a new transaction
        currentTransaction = {
          date: formatDate(dateMatch[0]),
          description: "",
        };
        
        // Extract description and amount
        let remainingText = line.replace(dateMatch[0], "").trim();
        const amountMatch = remainingText.match(amountPattern);
        
        if (amountMatch) {
          currentTransaction.amount = Number.parseFloat(amountMatch[0].replace(/[$,]/g, ""));
          remainingText = remainingText.replace(amountMatch[0], "").trim();
        }
        
        if (remainingText) {
          currentTransaction.description = remainingText;
          isCollectingDescription = true;
        }
      } else if (isCollectingDescription && currentTransaction.date) {
        // Check if this line contains an amount
        const amountMatch = line.match(amountPattern);
        if (amountMatch) {
          currentTransaction.amount = Number.parseFloat(amountMatch[0].replace(/[$,]/g, ""));
          const descriptionText = line.replace(amountMatch[0], "").trim();
          if (descriptionText) {
            currentTransaction.description = (currentTransaction.description || "") + " " + descriptionText;
          }
          isCollectingDescription = false;
        } else {
          // Continue collecting description
          currentTransaction.description = (currentTransaction.description || "") + " " + line;
        }
      }
    }
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file");
  }
}

function formatDate(dateStr: string): string {
  // Handle different date formats
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    // Assume DD/MM/YYYY or MM/DD/YYYY format
    const [first, second, third] = parts;
    // If the first part is greater than 12, it's likely DD/MM/YYYY
    if (Number(first) > 12) {
      return `${third}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
    }
    // Otherwise assume MM/DD/YYYY
    return `${third}-${first.padStart(2, "0")}-${second.padStart(2, "0")}`;
  }
  return dateStr;
} 