export type InvoiceType =
  | "Tuition"
  | "Registration"
  | "Application Fee"
  | "Examination Fee"
  | "Accommodation"
  | "Library Fee"

export type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Processing"
  | "Failed"
  | "Refunded"
  | "Settlement Pending"
  | "Settled"

export type InvoiceStatus =
  | "Unpaid"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled"

export type SettlementStatus = "Pending" | "Processing" | "Settled" | "Failed"

export type WithdrawalStatus = "Pending" | "Processing" | "Completed" | "Failed"

export type PaymentAccountType = "bank" | "mobile_money"

export interface PaymentAccount {
  id: string
  type: PaymentAccountType
  label: string
  holderName: string
  number: string
  provider?: string
  currency: string
  isDefault?: boolean
  masked?: string
}

export interface Withdrawal {
  id: string
  reference: string
  amount: number
  currency: string
  paymentAccountId: string
  bankAccountLabel: string
  status: WithdrawalStatus
  createdAt: string
  completedAt?: string
}

export type PaymentMethod = "Bitcoin / Lightning" | "Lightning Network"

export type PaymentNetwork = "Lightning Network" | "On-chain (Bitcoin)"

export interface Student {
  id: string
  name: string
  email: string
  phone?: string
  program: string
  year: string
  status: "Active" | "Inactive" | "Graduated"
  createdAt?: string
}

export interface Invoice {
  id: string
  number: string
  studentId: string
  type: InvoiceType
  description: string
  amount: number
  currency: string
  dueDate: string
  status: InvoiceStatus
  created: string
  amountPaid: number
}

export interface Payment {
  id: string
  reference: string
  studentId: string
  invoiceId: string
  amount: number
  currency: string
  btcSats: number
  exchangeRate: number
  method: PaymentMethod
  network: PaymentNetwork
  status: PaymentStatus
  date: string
  confirmedAt?: string
  settlementDate?: string
}

export interface Settlement {
  id: string
  reference: string
  paymentId: string
  studentId: string
  btcSats: number
  localAmount: number
  currency: string
  exchangeRate: number
  fees: number
  netAmount: number
  status: SettlementStatus
  date: string
}

export interface Receipt {
  id: string
  number: string
  studentId: string
  invoiceId: string
  paymentId: string
  amount: number
  currency: string
  date: string
  status: "Issued" | "Void"
}

export interface University {
  name: string
  shortName: string
  address: string
  email: string
  phone: string
  website: string
  currency: string
  defaultCurrency: string
  settlementCurrency: string
}

export interface Tenant extends University {
  id: string
  slug: string
  adminName: string
  adminEmail: string
  country: string
  campusName: string
  studentCount: number
  established: string
  createdAt: string
  logoColor: string
}

export interface User {
  id: string
  tenantId: string
  email: string
  displayName: string
  role: string
  createdAt: string
}
