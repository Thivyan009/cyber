"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  registrationNo: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewBusinessPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      industry: "",
      registrationNo: "",
      taxId: "",
      currency: "USD",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Creating new business with data:", data);

      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create business");
      }

      const result = await response.json();
      console.log("Business created successfully:", result);
      toast.success("Business created successfully");

      // Select the new business
      localStorage.setItem("currentBusinessId", result.id);

      // Redirect to the main onboarding flow for this business
      router.push(`/onboarding/controller?businessId=${result.id}`);
    } catch (error: unknown) {
      console.error("Error creating business:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create business";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add a New Business</h1>
          <p className="text-muted-foreground mt-2">
            Enter your business details to get started
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Business Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="manufacturing">
                        Manufacturing
                      </SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registrationNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your business registration number (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your business tax ID (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CNY">CNY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Add Business"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
 
 
 