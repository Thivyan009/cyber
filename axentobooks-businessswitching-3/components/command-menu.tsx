"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Calculator, Calendar, CreditCard, Search, Settings, User, FileSpreadsheet } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { DialogTitle } from "@/components/ui/dialog"

// Types for fetched entities
type Customer = { id: string; name: string }
type Invoice = { id: string; number?: string }

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (query.length < 2) {
      setCustomers([])
      setInvoices([])
      return
    }
    // Fetch customers
    fetch(`/api/customers?search=${encodeURIComponent(query)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]))
    // Fetch invoices
    fetch(`/api/invoices?search=${encodeURIComponent(query)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => setInvoices([]))
  }, [query])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground pl-8"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <span className="inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search Commands</DialogTitle>
        <CommandInput placeholder="Type a command or search..." onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/transactions"))}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Transactions
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/reports"))}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Reports
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Customers">
            {query.length > 1 && customers.length === 0 ? (
              <CommandEmpty>No customers found.</CommandEmpty>
            ) : (
              customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => runCommand(() => router.push(`/customers/${customer.id}`))}
                >
                  <User className="mr-2 h-4 w-4" />
                  {customer.name}
                </CommandItem>
              ))
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Invoices">
            {query.length > 1 && invoices.length === 0 ? (
              <CommandEmpty>No invoices found.</CommandEmpty>
            ) : (
              invoices.map((invoice) => (
                <CommandItem
                  key={invoice.id}
                  onSelect={() => runCommand(() => router.push(`/invoices/${invoice.id}`))}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Invoice #{invoice.number || invoice.id}
                </CommandItem>
              ))
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Spreadsheets">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/spreadsheets"))}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Spreadsheet Formats
              <CommandShortcut className="text-xs text-muted-foreground ml-2">(Case Sensitive)</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/settings"))}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/profile"))}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
} 