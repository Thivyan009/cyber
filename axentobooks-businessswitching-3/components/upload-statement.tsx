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

const formSchema = z.object({
  file: z.instanceof(File, { message: "Please select a file" }),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);

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
      const result = await processBankStatement(file, currentBusinessId);
      
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

          refreshAttempts.forEach((delay) => {
            setTimeout(() => {
              console.log(`Refreshing dashboard data after ${delay}ms`);
              onImportSuccess();
            }, delay);
          });
        }
      }

      setIsDialogOpen(true);
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
    await handleFileUpload(values.file);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import Transactions</CardTitle>
          <CardDescription>
            Upload a CSV file to import transactions
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
                  type="file"
                  accept=".csv"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            field.onChange(files[0]);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a CSV file containing your transactions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload and Process"}
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
