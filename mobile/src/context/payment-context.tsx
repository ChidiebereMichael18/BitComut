import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getMyInvoices,
  getMyPayments,
  getMyBalance,
  payInvoice,
  type StudentBalance,
  type StudentPayResponse,
} from '@/lib/api/student';
import type { Invoice, Payment } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

type PaymentContextType = {
  // data
  invoices: Invoice[];
  pendingFees: { label: string; amount: number; currency: string; dueDate: string }[];
  transactions: Payment[];
  balance: StudentBalance | null;
  lastPayResponse: StudentPayResponse | null;
  // selection state for pay flow
  selectedInvoiceId: string;
  selectedUniversity: string;
  selectedStudentId: string;
  selectedAmount: number;
  selectedCurrency: string;
  // actions
  setPaymentDetails: (invoiceId: string, u: string, sid: string, amt: number, cur: string) => void;
  paySelectedInvoice: () => Promise<StudentPayResponse>;
  refresh: () => Promise<void>;
  loading: boolean;
};

const PaymentContext = createContext<PaymentContextType | null>(null);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<StudentBalance | null>(null);
  const [lastPayResponse, setLastPayResponse] = useState<StudentPayResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // pay flow selection state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('RWF');

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [inv, pmt, bal] = await Promise.all([
        getMyInvoices(),
        getMyPayments(),
        getMyBalance(),
      ]);
      setInvoices(inv);
      setTransactions(pmt);
      setBalance(bal);
    } catch {
      // network error — keep stale data
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Fetch on login
  useEffect(() => {
    if (isLoggedIn) refresh();
  }, [isLoggedIn, refresh]);

  // Derive pending fees (unpaid / overdue invoices)
  const pendingFees = invoices
    .filter((i) => i.status === 'Unpaid' || i.status === 'Overdue' || i.status === 'Partially Paid')
    .map((i) => ({
      label: i.description || i.type,
      amount: i.amount - i.amountPaid,
      currency: i.currency,
      dueDate: i.dueDate,
    }));

  const setPaymentDetails = (
    invoiceId: string,
    u: string,
    sid: string,
    amt: number,
    cur: string
  ) => {
    setSelectedInvoiceId(invoiceId);
    setSelectedUniversity(u);
    setSelectedStudentId(sid);
    setSelectedAmount(amt);
    setSelectedCurrency(cur);
  };

  const paySelectedInvoice = async (): Promise<StudentPayResponse> => {
    const res = await payInvoice(selectedInvoiceId);
    setLastPayResponse(res);
    // refresh balances after payment
    await refresh();
    return res;
  };

  return (
    <PaymentContext.Provider
      value={{
        invoices,
        pendingFees,
        transactions,
        balance,
        lastPayResponse,
        selectedInvoiceId,
        selectedUniversity,
        selectedStudentId,
        selectedAmount,
        selectedCurrency,
        setPaymentDetails,
        paySelectedInvoice,
        refresh,
        loading,
      }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider');
  return ctx;
}
