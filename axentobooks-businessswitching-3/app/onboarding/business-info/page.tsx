"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/hooks/use-business";

const formSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  registrationNo: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BusinessInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("businessId");
  const { currentBusinessId } = useBusiness();

  // Use provided businessId or fall back to current business
  const targetBusinessId = businessId || currentBusinessId;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      industry: "",
      registrationNo: "",
      taxId: "",
      address: "",
      phone: "",
      email: "",
      website: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Include the business ID in the data
      const payload = {
        ...data,
        businessId: targetBusinessId,
      };

      const response = await fetch("/api/businesses/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update business info");
      }

      toast.success("Business information updated successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating business info:", error);
      toast.error("Failed to update business information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Enter your business details to set up your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name*</FormLabel>
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
                    <FormLabel>Industry*</FormLabel>
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
                        <SelectItem value="construction">
                          Construction
                        </SelectItem>
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
                        Your business registration number
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
                      <FormDescription>Your business tax ID</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Optional" {...field} />
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
                      <FormLabel>Business Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Skip for now
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save and Continue"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

 
 