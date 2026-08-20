'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  setUserSession: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = authService.getStoredUser();
      if (savedUser) {
        setUser(savedUser);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const supaUser = data.session.user;
        const formattedUser: User = {
          id: supaUser.id,
          email: supaUser.email || '',
          name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || '',
          role: 'customer',
        };
        setUser(formattedUser);
        localStorage.setItem('user', JSON.stringify(formattedUser));
        if (data.session.access_token) {
          localStorage.setItem('token', data.session.access_token);
        }
      }

      setLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const supaUser = session.user;
          const formattedUser: User = {
            id: supaUser.id,
            email: supaUser.email || '',
            name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || '',
            role: 'customer',
          };
          setUser(formattedUser);
          localStorage.setItem('user', JSON.stringify(formattedUser));
          if (session.access_token) {
            localStorage.setItem('token', session.access_token);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setUserSession = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('divine_cart');
      window.dispatchEvent(new Event('clear-cart-event'));
    }

    setUser(null);
    authService.logout();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        logout,
        setUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}