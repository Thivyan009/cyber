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
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { createInvoiceWithCustomer } from "@/lib/actions/invoice";
import { createCustomer } from "@/lib/actions/customer";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useCustomers } from "@/hooks/use-customers";
import { useBusiness } from "@/hooks/use-business";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  dueDate: z.date(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        description: z.string().optional(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        rate: z.number().min(0, "Rate must be positive"),
      })
    )
    .min(1, "At least one item is required"),
  notes: z.string().optional(),
  tax: z.number().min(0, "Tax must be 0 or more").optional().or(z.nan()),
});

// Customer creation form schema
const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;
type FormValues = z.infer<typeof formSchema>;

export function CreateInvoiceForm() {
  const router = useRouter();
  const [items, setItems] = useState([{ id: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const { customers, isLoading, mutate: refreshCustomers } = useCustomers();
  const { currentBusinessId } = useBusiness();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  // Filter customers by current business
  const businessCustomers = customers.filter(
    (customer) => customer.businessId === currentBusinessId
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
      items: [{ name: "", description: "", quantity: 1, rate: 0 }],
      notes: "",
      tax: 0,
    },
  });

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  // Update customerForm when business changes
  useEffect(() => {
    if (currentBusinessId) {
      customerForm.setValue("businessId", currentBusinessId);
    }
  }, [currentBusinessId, customerForm]);

  // Handle selecting an existing customer
  const handleCustomerSelect = (customerId: string) => {
    if (customerId === "new") {
      setCustomerDialogOpen(true);
      return;
    }

    setSelectedCustomerId(customerId);
    const selectedCustomer = businessCustomers.find((c) => c.id === customerId);

    if (selectedCustomer) {
      form.setValue("customer.name", selectedCustomer.name);
      form.setValue("customer.email", selectedCustomer.email || "");
      form.setValue("customer.phone", selectedCustomer.phone || "");
      form.setValue("customer.address", selectedCustomer.address || "");
    }
  };

  // Create a new customer
  const onCreateCustomer = async (data: CustomerFormValues) => {
    if (!currentBusinessId) {
      toast.error("Please select a business first");
      return;
    }

    try {
      setIsCreatingCustomer(true);
      const newCustomer = await createCustomer(data, currentBusinessId);

      if (newCustomer) {
        toast.success("Customer created successfully");

        // Close the dialog and reset the customer form
        setCustomerDialogOpen(false);
        customerForm.reset();

        // Refresh the customers list and wait for it to complete
        await refreshCustomers();

        // Set the selected customer to the newly created one
        setSelectedCustomerId(newCustomer.id);

        // Auto-fill the form with the new customer's details
        form.setValue("customer.name", newCustomer.name);
        form.setValue("customer.email", newCustomer.email || "");
        form.setValue("customer.phone", newCustomer.phone || "");
        form.setValue("customer.address", newCustomer.address || "");
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      toast.error("Failed to create customer. Please try again.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentBusinessId) {
      toast.error("Please select a business first");
      return;
    }

    try {
      setIsSubmitting(true);
      await createInvoiceWithCustomer(data, currentBusinessId);
      toast.success("Invoice created successfully");
      router.push("/invoices");
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast.error("Failed to create invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: items.length + 1 }]);
    form.setValue("items", [
      ...form.getValues("items"),
      { name: "", description: "", quantity: 1, rate: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const currentItems = form.getValues("items");
    form.setValue(
      "items",
      currentItems.filter((_, i) => i !== index)
    );
  };

  const calculateSubtotal = () => {
    const items = form.getValues("items");
    return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const tax = form.getValues("tax") || 0;
    return subtotal * (tax / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Customer Details</h3>

              {/* Customer Selection */}
              <div className="mb-4">
                <FormLabel>Select Customer</FormLabel>
                <Select
                  value={selectedCustomerId || ""}
                  onValueChange={handleCustomerSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <Plus size={16} />
                        <span>Add New Customer</span>
                      </div>
                    </SelectItem>
                    {businessCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer.email"
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
                  name="customer.phone"
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date*</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="customer.address"
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
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items</h3>
              <Button type="button" onClick={addItem}>
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty*</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate*</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="mb-2"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span className="text-muted-foreground text-sm">(Optional)</span>
            </div>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-base">Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base">Tax:</span>
              <span>${calculateTaxAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Add New Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter customer details to add them to your database.
            </DialogDescription>
          </DialogHeader>
          <Form {...customerForm}>
            <form
              onSubmit={customerForm.handleSubmit(onCreateCustomer)}
              className="space-y-4"
            >
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
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
                control={customerForm.control}
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
                control={customerForm.control}
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomerDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingCustomer}>
                  {isCreatingCustomer ? "Creating..." : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
