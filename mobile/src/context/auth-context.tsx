import React, { createContext, useContext, useState } from 'react';

export type User = {
  name: string;
  email: string;
  country: string;
  university: string;
  studentId: string;
  avatarInitials: string;
};

type SignupData = {
  name: string;
  email: string;
  password: string;
  country: string;
  university: string;
  studentId: string;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Mock user used when logging in (existing account)
const MOCK_LOGIN_USER: User = {
  name: 'Alain Niyonzima',
  email: 'alain.niyonzima@student.dau.edu',
  country: 'Rwanda (Kigali)',
  university: 'Digital Art University (DAU)',
  studentId: 'DAU/2024/CS/0042',
  avatarInitials: 'AN',
};

function makeInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (_email: string, _password: string) => {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setUser(MOCK_LOGIN_USER);
  };

  const signup = async (data: SignupData) => {
    // Simulate API call — store exactly what the user entered
    await new Promise((r) => setTimeout(r, 1200));
    setUser({
      name: data.name,
      email: data.email,
      country: data.country,
      university: data.university,
      studentId: data.studentId,
      avatarInitials: makeInitials(data.name) || 'BC',
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
