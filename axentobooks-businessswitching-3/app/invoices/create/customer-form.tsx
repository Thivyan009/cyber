"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer } from "@/lib/actions/customer";
import { toast } from "sonner";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  onSuccess: () => void;
}

export function CustomerForm({ onSuccess }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Clear any previous errors
    setError(null);

    try {
      setIsSubmitting(true);

      console.log("Submitting customer form with data:", data);

      const newCustomer = await createCustomer({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      });

      console.log("Customer created response:", newCustomer);

      if (!newCustomer || !newCustomer.id) {
        throw new Error("Failed to create customer. No data returned.");
      }

      toast.success(`Customer "${data.name}" created successfully`);
      form.reset();

      // Trigger the success callback to notify parent component
      if (onSuccess) {
        console.log("Triggering onSuccess callback");
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create customer. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Customer"}
        </Button>
      </form>
    </Form>
  );
}
