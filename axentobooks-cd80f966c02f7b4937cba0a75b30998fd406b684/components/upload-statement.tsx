"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { processBankStatement } from "@/lib/actions/statements";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useBusiness } from "@/hooks/use-business";
import { Loader2 } from "lucide-react";
import { detectFileFormat } from "@/lib/actions/file-parsers";
import { parsePDFFile } from "./pdf-parser";

const SUPPORTED_FORMATS = [
  { extension: "csv", description: "Comma-Separated Values" },
  { extension: "xlsx", description: "Excel Spreadsheet" },
  { extension: "pdf", description: "PDF Bank Statement" },
  { extension: "qif", description: "Quicken Interchange Format" },
  { extension: "dif", description: "Data Interchange Format" },
  { extension: "ofx", description: "Open Financial Exchange" },
  { extension: "iif", description: "Intuit Interchange Format" },
];

const formSchema = z.object({
  file: z.any().refine((file: unknown) => {
    if (!file) return false;
    if (typeof window === 'undefined') return true; // Skip validation during SSR
    return file instanceof File;
  }, "Please select a bank statement file"),
});

interface UploadStatementProps {
  onImportSuccess?: () => void;
}

export function UploadStatement({ onImportSuccess }: UploadStatementProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentBusinessId } = useBusiness();
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const format = detectFileFormat(selectedFile.name);
      if (!format) {
        toast({
          title: "Unsupported file format",
          description: `Please upload a file in one of these formats: ${SUPPORTED_FORMATS.map(f => f.extension.toUpperCase()).join(", ")}`,
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      form.setValue("file", selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      if (!currentBusinessId) {
        toast({
          title: "No business selected",
          description: "Please select a business before uploading transactions",
          variant: "destructive",
        });
        return;
      }

      console.log(
        `Uploading bank statement for business: ${currentBusinessId}`
      );

      let result;
      const format = detectFileFormat(file.name);
      
      if (format === "pdf") {
        // Parse PDF on the client side
        const transactions = await parsePDFFile(file);
        // Create a new file with the parsed transactions
        const csvContent = transactions.map(t => 
          `date,description,amount\n${t.date},${t.description},${t.amount}`
        ).join("\n");
        const csvFile = new File([csvContent], "parsed_transactions.csv", { type: "text/csv" });
        result = await processBankStatement(csvFile, currentBusinessId);
      } else {
        result = await processBankStatement(file, currentBusinessId);
      }
      
      if (result.error) {
        setUploadSuccess(false);
        setMessage(result.error);
        console.error("Error processing bank statement:", result.error);
      } else {
        setUploadSuccess(true);
        const transactionCount = result.transactions?.length || 0;
        setMessage(`Successfully processed ${transactionCount} transactions`);
        console.log(
          `Successfully imported ${transactionCount} transactions for business: ${currentBusinessId}`
        );

        // Log transaction details for debugging
        if (result.transactions && result.transactions.length > 0) {
          console.log("Sample transactions:", result.transactions.slice(0, 3));
        }

        // Call the onImportSuccess callback after a slight delay to ensure
        // backend processing is complete
        if (onImportSuccess) {
          console.log("Triggering dashboard refresh after successful import");

          // Try refreshing multiple times to ensure data is updated
          const refreshAttempts = [100, 500, 1500]; // Milliseconds

          for (const delay of refreshAttempts) {
            setTimeout(() => {
              console.log(`Refreshing dashboard data after ${delay}ms`);
              onImportSuccess();
            }, delay);
          }
        }
      }

      setIsDialogOpen(true);
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload and process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await handleUpload();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import Transactions</CardTitle>
          <CardDescription>
            Upload a bank statement file to import transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Statement</FormLabel>
                    <FormControl>
                      <Input
                        id="file"
                        type="file"
                        accept={SUPPORTED_FORMATS.map(f => `.${f.extension}`).join(",")}
                        onChange={(e) => {
                          handleFileChange(e);
                          field.onChange(e.target.files?.[0]);
                        }}
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormDescription>
                      Supported formats: {SUPPORTED_FORMATS.map(f => `${f.extension.toUpperCase()} (${f.description})`).join(", ")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upload Statement"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {uploadSuccess ? "Upload Successful" : "Upload Failed"}
            </DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsDialogOpen(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
                form.reset();
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
