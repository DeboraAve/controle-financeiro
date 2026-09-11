import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchProfile, updateOwnProfile, type ProfileRow } from '../lib/db';
import { supabase } from '../lib/supabaseClient';

interface AuthVm {
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  profile: ProfileRow | null;
  recovery: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, nome: string) => Promise<string | null>;
  signOut: () => void;
  enviarRecuperacaoSenha: (email: string) => Promise<string | null>;
  definirNovaSenha: (senha: string) => Promise<string | null>;
  salvarMeusDados: (nome: string, fone: string, email: string) => Promise<string | null>;
  trocarSenha: (senha: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthVm | null>(null);

// Erro do Supabase (PostgrestError etc.) não é `instanceof Error` — sem
// isso a mensagem real (ex.: função não encontrada no banco) some atrás
// de um "Erro ao salvar" genérico que não ajuda ninguém a descobrir o quê.
function mensagemDeErro(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return 'Erro ao salvar';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    let ativo = true;
    fetchProfile(userId)
      .then((p) => {
        if (ativo) setProfile(p);
      })
      .catch(() => {
        if (ativo) setProfile(null);
      });
    return () => {
      ativo = false;
    };
  }, [session?.user.id]);

  const vm: AuthVm = {
    session,
    loading,
    isAdmin: profile?.role === 'admin',
    profile,
    recovery,
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
    // Manda um e-mail com link de recuperação — ao clicar, o Supabase volta
    // pro app já autenticado num "modo recuperação" (evento PASSWORD_RECOVERY
    // acima), daí a pessoa define a senha nova sem precisar da antiga.
    enviarRecuperacaoSenha: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
      return error ? error.message : null;
    },
    definirNovaSenha: async (senha) => {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (!error) setRecovery(false);
      return error ? error.message : null;
    },
    trocarSenha: async (senha) => {
      const { error } = await supabase.auth.updateUser({ password: senha });
      return error ? error.message : null;
    },
    salvarMeusDados: async (nome, fone, email) => {
      const userId = session?.user.id;
      if (!userId) return 'Sessão expirada — entra de novo.';
      const emailMudou = email.trim() && email.trim() !== session?.user.email;
      if (emailMudou) {
        const { error } = await supabase.auth.updateUser({ email: email.trim() });
        if (error) return error.message;
      }
      try {
        await updateOwnProfile(nome, fone, email.trim() || session?.user.email || '');
      } catch (e) {
        return mensagemDeErro(e);
      }
      return null;
    },
  };

  return <AuthContext.Provider value={vm}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthVm {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
