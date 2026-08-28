import React, { createContext, useContext, useState } from 'react';

export type Transaction = {
  id: string;
  university: string;
  studentId: string;
  amount: number;
  currency: string;
  btcAmount: string;
  method: 'lightning' | 'card';
  status: 'pending' | 'success' | 'failed';
  date: string;
  description: string;
  txHash?: string;
};

type PaymentContextType = {
  pendingFees: { label: string; amount: number; currency: string; dueDate: string }[];
  selectedUniversity: string;
  selectedStudentId: string;
  selectedAmount: number;
  selectedCurrency: string;
  btcRate: number;
  transactions: Transaction[];
  lastTransaction: Transaction | null;
  setPaymentDetails: (u: string, sid: string, amt: number, cur: string) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => Transaction;
};

const PaymentContext = createContext<PaymentContextType | null>(null);

const MOCK_FEES = [
  { label: '2024/25 School Fees', amount: 285000, currency: 'NGN', dueDate: '2025-02-28' },
  { label: 'Accommodation Levy', amount: 45000, currency: 'NGN', dueDate: '2025-01-31' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001-2024',
    university: 'University of Lagos',
    studentId: 'UL/2021/ENG/0042',
    amount: 285000,
    currency: 'NGN',
    btcAmount: '0.00341',
    method: 'lightning',
    status: 'success',
    date: '2024-10-15',
    description: '2023/24 School Fees',
    txHash: 'bc1q9x...k4f2',
  },
  {
    id: 'TXN-002-2024',
    university: 'University of Lagos',
    studentId: 'UL/2021/ENG/0042',
    amount: 45000,
    currency: 'NGN',
    btcAmount: '0.000538',
    method: 'card',
    status: 'success',
    date: '2024-09-02',
    description: 'Accommodation Levy',
  },
  {
    id: 'TXN-003-2024',
    university: 'University of Lagos',
    studentId: 'UL/2021/ENG/0042',
    amount: 120000,
    currency: 'NGN',
    btcAmount: '0.001435',
    method: 'lightning',
    status: 'failed',
    date: '2024-08-18',
    description: 'Faculty Development Fee',
  },
];

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const setPaymentDetails = (u: string, sid: string, amt: number, cur: string) => {
    setSelectedUniversity(u);
    setSelectedStudentId(sid);
    setSelectedAmount(amt);
    setSelectedCurrency(cur);
  };

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>): Transaction => {
    const newTx: Transaction = {
      ...t,
      id: `TXN-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setTransactions((prev) => [newTx, ...prev]);
    setLastTransaction(newTx);
    return newTx;
  };

  return (
    <PaymentContext.Provider
      value={{
        pendingFees: MOCK_FEES,
        selectedUniversity,
        selectedStudentId,
        selectedAmount,
        selectedCurrency,
        btcRate: 83620000, // 1 BTC = 83,620,000 NGN (mock)
        transactions,
        lastTransaction,
        setPaymentDetails,
        addTransaction,
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
