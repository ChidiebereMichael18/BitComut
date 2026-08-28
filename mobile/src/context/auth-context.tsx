import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  studentLogin,
  studentLogout,
  studentMe,
  studentRegister,
} from '@/lib/api/student';
import { clearStudentAuthToken } from '@/lib/api/client';
import type { Student, Tenant } from '@/lib/types';
import { DEFAULT_SLUG } from '@/lib/constants';

// ── Shape of user we expose to the UI ──────────────────────────────────────
export type AppUser = {
  name: string;
  email: string;
  country: string;
  university: string;
  studentId: string;
  avatarInitials: string;
  // raw data from backend
  student: Student;
  tenant: Tenant;
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
  user: AppUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function makeInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function buildAppUser(student: Student, tenant: Tenant): AppUser {
  return {
    name: student.name,
    email: student.email,
    country: tenant.country ?? 'Rwanda (Kigali)',
    university: tenant.name,
    studentId: student.id,
    avatarInitials: makeInitials(student.name) || 'BC',
    student,
    tenant,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const me = await studentMe();
        if (me) setUser(buildAppUser(me.student, me.tenant));
      } catch {
        // no valid session
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await studentLogin(email, password, DEFAULT_SLUG);
    setUser(buildAppUser(res.student, res.tenant));
  };

  const signup = async (data: SignupData) => {
    const res = await studentRegister({
      tenantSlug: DEFAULT_SLUG,
      studentId: data.studentId,
      email: data.email,
      password: data.password,
      name: data.name,
    });
    setUser(buildAppUser(res.student, res.tenant));
  };

  const logout = async () => {
    try {
      await studentLogout();
    } catch {
      await clearStudentAuthToken();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
