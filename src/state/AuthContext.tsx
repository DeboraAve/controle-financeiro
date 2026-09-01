import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchProfile } from '../lib/db';
import { supabase } from '../lib/supabaseClient';

interface AuthVm {
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, nome: string) => Promise<string | null>;
  signOut: () => void;
}

const AuthContext = createContext<AuthVm | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let ativo = true;
    fetchProfile(userId)
      .then((profile) => {
        if (ativo) setIsAdmin(profile?.role === 'admin');
      })
      .catch(() => {
        if (ativo) setIsAdmin(false);
      });
    return () => {
      ativo = false;
    };
  }, [session?.user.id]);

  const vm: AuthVm = {
    session,
    loading,
    isAdmin,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },
    signUp: async (email, password, nome) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } },
      });
      return error ? error.message : null;
    },
    signOut: () => {
      supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={vm}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthVm {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
