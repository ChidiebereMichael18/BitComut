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
  { label: '2024/25 Semester Tuition', amount: 1500000, currency: 'RWF', dueDate: '2025-03-31' },
  { label: 'Library & Tech Levy', amount: 120000, currency: 'RWF', dueDate: '2025-02-15' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001-2024',
    university: 'Digital Art University (DAU)',
    studentId: 'DAU/2024/CS/0042',
    amount: 1500000,
    currency: 'RWF',
    btcAmount: '0.01083',
    method: 'lightning',
    status: 'success',
    date: '2024-10-15',
    description: '2024/25 Semester Tuition',
    txHash: 'bc1q9x...k4f2',
  },
  {
    id: 'TXN-002-2024',
    university: 'Digital Art University (DAU)',
    studentId: 'DAU/2024/CS/0042',
    amount: 120000,
    currency: 'RWF',
    btcAmount: '0.000866',
    method: 'lightning',
    status: 'success',
    date: '2024-09-02',
    description: 'Library & Tech Levy',
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
