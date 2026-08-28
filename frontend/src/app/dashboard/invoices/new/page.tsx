import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form"

export const metadata = {
  title: "Create Invoice",
}

export default function CreateInvoicePage() {
  return (
    <div className="h-[calc(100vh-7rem)] overflow-hidden">
      <CreateInvoiceForm />
    </div>
  )
}
