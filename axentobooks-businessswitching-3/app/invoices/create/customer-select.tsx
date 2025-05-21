"use client";

import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import { useCustomers } from "@/hooks/use-customers";
import { toast } from "sonner";

interface CustomerSelectProps {
  onValueChange: (value: string) => void;
  value?: string;
}

export function CustomerSelect({ onValueChange, value }: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { customers, isLoading, mutate } = useCustomers();

  // Force a revalidation when the component mounts
  useEffect(() => {
    console.log("CustomerSelect mounted, fetching customers");
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      console.log("Manually fetching customers");
      await mutate(); // Force SWR to revalidate
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, [mutate]);

  const handleNewCustomerCreated = useCallback(async () => {
    try {
      setShowNewCustomerDialog(false);

      // Wait a moment before fetching to ensure the server has processed the new customer
      setTimeout(async () => {
        console.log("Customer created, fetching updated list");
        await fetchCustomers();

        // Open the popover after new data is fetched
        setTimeout(() => setOpen(true), 100);

        toast.success("New customer added to the list");
      }, 500);
    } catch (error) {
      console.error("Error refreshing customer list:", error);
    }
  }, [fetchCustomers]);

  // Filter customers based on search term
  const filteredCustomers =
    searchTerm.trim() === ""
      ? customers
      : customers?.filter((customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  // Show loading indicator only during initial load
  if (isLoading && !customers?.length) {
    return (
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            onClick={() => fetchCustomers()} // Fetch latest data when opening
          >
            {value && customers?.find((c) => c.id === value)
              ? customers.find((c) => c.id === value)?.name
              : "Select customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Search customers..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p>No customer found.</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    setOpen(false);
                    setShowNewCustomerDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new customer
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {customers?.length === 0 ? (
                <div className="py-6 text-center text-sm">
                  No customers yet. Create your first one!
                </div>
              ) : (
                filteredCustomers?.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {customer.name}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog
        open={showNewCustomerDialog}
        onOpenChange={setShowNewCustomerDialog}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={handleNewCustomerCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
