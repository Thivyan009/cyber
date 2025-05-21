import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import * as csv from "csv-parse/sync";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "csv";
    const fileName = `${uuidv4()}.${fileExtension}`;
    const originalName = file.name;

    // Create the statement in the database
    const statement = await prisma.bankStatement.create({
      data: {
        fileName,
        originalName,
        status: "pending",
        businessId: business.id,
        date: new Date(), // This will be updated when the statement is processed
        balance: 0, // This will be updated when the statement is processed
        currency: business.currency,
        accountId: "default", // This will be updated when the statement is processed
        statementNumber: `STMT-${Date.now()}`, // This will be updated when the statement is processed
      },
    });

    // Save the file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const path = join(process.cwd(), "uploads", fileName);
    await writeFile(path, buffer);

    // Process CSV file and create transactions if it's a CSV file
    const createdTransactions = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    if (fileExtension === "csv") {
      try {
        // Read the CSV file
        const fileContent = await readFile(path, "utf-8");

        // Parse CSV data
        const records = csv.parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        // Process each row and create transactions
        for (const record of records) {
          // Normalize column names (different banks might use different headers)
          const date =
            record.date ||
            record.Date ||
            record.DATE ||
            record.transaction_date ||
            record["Transaction Date"];
          const description =
            record.description ||
            record.Description ||
            record.DESCRIPTION ||
            record.memo ||
            record.Memo ||
            record.narrative ||
            record.Narrative;
          const amount = parseFloat(
            record.amount ||
              record.Amount ||
              record.AMOUNT ||
              record.value ||
              record.Value
          );

          // Skip invalid records
          if (!date || isNaN(amount)) {
            continue;
          }

          // Determine transaction type
          const type = amount >= 0 ? "income" : "expense";
          const category = amount >= 0 ? "Income" : "Expenses"; // Default categories, can be improved with AI categorization

          // Update totals
          if (amount >= 0) {
            totalRevenue += amount;
          } else {
            totalExpenses += Math.abs(amount);
          }

          // Create transaction record
          const transaction = await prisma.transaction.create({
            data: {
              date: new Date(date),
              type,
              amount: Math.abs(amount), // Store absolute value and use type field to determine sign
              category,
              description,
              businessId: business.id,
              accountType: "cash", // Default account type
              aiConfidence: 0.8, // Default confidence
              notes: `Imported from ${originalName}`,
              statementId: statement.id,
            },
          });

          createdTransactions.push(transaction);
        }
      } catch (csvError) {
        console.error("Error processing CSV:", csvError);
        // Still mark statement as completed, but log the error
      }
    }

    // Update the status to completed after successful file upload
    const updatedStatement = await prisma.bankStatement.update({
      where: { id: statement.id },
      data: {
        status: "completed",
        balance: totalRevenue - totalExpenses, // Update balance based on imported transactions
      },
    });

    return NextResponse.json({
      id: updatedStatement.id,
      fileName: updatedStatement.fileName,
      originalName: updatedStatement.originalName,
      status: updatedStatement.status,
      date: updatedStatement.date,
      balance: updatedStatement.balance,
      currency: updatedStatement.currency,
      accountId: updatedStatement.accountId,
      statementNumber: updatedStatement.statementNumber,
      transactionsCreated: createdTransactions.length,
      totalRevenue,
      totalExpenses,
    });
  } catch (error) {
    console.error("Error uploading statement:", error);
    return NextResponse.json(
      { error: "Failed to upload statement" },
      { status: 500 }
    );
  }
}
