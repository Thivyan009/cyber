import { getInvoices } from "@/lib/actions/invoice";
import { InvoicesClient } from "./invoices-client";
import { getCurrentBusiness } from "@/lib/actions/business";

export default async function InvoicesPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    throw new Error("No business selected");
  }

  const initialInvoices = await getInvoices(business.id);
  return <InvoicesClient initialInvoices={initialInvoices} />;
}
