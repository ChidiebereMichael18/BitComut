/**
 * Shared domain types — reproduced verbatim from the frontend contract
 * (`frontend/src/lib/types.ts`). Frontend is the source of truth for shapes.
 */

export type InvoiceType =
  | 'Tuition'
  | 'Registration'
  | 'Application Fee'
  | 'Examination Fee'
  | 'Accommodation'
  | 'Library Fee';

export type InvoiceStatus =
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled';

export type PaymentStatus =
  | 'Paid'
  | 'Pending'
  | 'Processing'
  | 'Failed'
  | 'Refunded'
  | 'Settlement Pending'
  | 'Settled';

export type SettlementStatus = 'Pending' | 'Processing' | 'Settled' | 'Failed';

export type WithdrawalStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Failed';

export type StudentStatus = 'Active' | 'Inactive' | 'Graduated';

export type PaymentAccountType = 'bank' | 'mobile_money';

export type PaymentMethod = 'Bitcoin / Lightning' | 'Lightning Network';

export type PaymentNetwork = 'Lightning Network' | 'On-chain (Bitcoin)';

export type ReceiptStatus = 'Issued' | 'Void';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  currency: string;
  defaultCurrency: string;
  settlementCurrency: string;
  adminName: string;
  adminEmail: string;
  country: string;
  campusName: string;
  studentCount: number;
  established: string;
  created_at: string;
  logoColor: string;
}

export interface Student {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string | null;
  program: string;
  year: string;
  status: StudentStatus;
  createdAt?: string | null;
}

export interface Invoice {
  id: string;
  tenantId: string;
  studentId: string;
  number?: string;
  type: InvoiceType;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  created: string;
  amountPaid: number;
  // joined for display
  studentName?: string;
}

export interface Payment {
  id: string;
  reference: string;
  tenantId: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  btcSats: number;
  exchangeRate: number;
  method: PaymentMethod;
  network: PaymentNetwork;
  status: PaymentStatus;
  date: string;
  confirmedAt?: string | null;
  settlementDate?: string | null;
  lnbitsPaymentHash?: string | null;
  lnbitsWalletId?: string | null;
  paymentRequest?: string | null;
}

export interface Settlement {
  id: string;
  reference: string;
  tenantId: string;
  paymentId: string;
  studentId: string;
  btcSats: number;
  localAmount: number;
  currency: string;
  exchangeRate: number;
  fees: number;
  netAmount: number;
  status: SettlementStatus;
  date: string;
}

export interface Receipt {
  id: string;
  number: string;
  tenantId: string;
  studentId: string;
  invoiceId: string;
  paymentId: string;
  amount: number;
  currency: string;
  date: string;
  status: ReceiptStatus;
}

export interface PaymentAccount {
  id: string;
  tenantId: string;
  type: PaymentAccountType;
  label: string;
  holderName: string;
  number: string;
  provider?: string | null;
  currency: string;
  isDefault: boolean;
  masked?: string;
}

export interface Withdrawal {
  id: string;
  reference: string;
  tenantId: string;
  amount: number;
  currency: string;
  paymentAccountId: string;
  bankAccountLabel: string;
  status: WithdrawalStatus;
  createdAt: string;
  completedAt?: string | null;
  masked?: string;
}

export interface SettlementBalance {
  totalCollected: number;
  totalWithdrawn: number;
  pendingAmount: number;
  availableBalance: number;
  lastWithdrawalAt?: string | null;
  currency: string;
}
