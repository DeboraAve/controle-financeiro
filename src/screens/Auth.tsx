import { useState } from 'react';
import { BlueprintCard } from '../components/BlueprintCard';
import { useAuth } from '../state/AuthContext';

export function Auth() {
  const { signIn, signUp } = useAuth();
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const submeter = async () => {
    setErro(null);
    setAviso(null);
    if (!email || !senha) {
      setErro('Preenche e-mail e senha.');
      return;
    }
    setEnviando(true);
    if (modo === 'entrar') {
      const msg = await signIn(email, senha);
      if (msg) setErro(traduzErro(msg));
    } else {
      if (!nome.trim()) {
        setErro('Preenche seu nome.');
        setEnviando(false);
        return;
      }
      const msg = await signUp(email, senha, nome);
      if (msg) {
        setErro(traduzErro(msg));
      } else {
        setAviso('Conta criada! Confere seu e-mail pra confirmar antes de entrar.');
      }
    }
    setEnviando(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow">Controle financeiro</div>
          <h1 style={{ fontSize: 32, margin: '6px 0 0' }}>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        </div>

        <BlueprintCard style={{ gap: 'var(--space-3)' }}>
          {modo === 'criar' && (
            <div className="field">
              <label>Seu nome</label>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ricardo Alves" />
            </div>
          )}
          <div className="field">
            <label>E-mail</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>
          <div className="field">
            <label>Senha</label>
            <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && submeter()} />
          </div>

          {erro && <div style={{ fontSize: 12, color: 'var(--color-accent-800)' }}>{erro}</div>}
          {aviso && <div style={{ fontSize: 12, color: 'var(--color-accent-700)' }}>{aviso}</div>}

          <button className="btn btn-primary btn-block" onClick={submeter} disabled={enviando}>
            {enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </BlueprintCard>

        <button
          className="btn btn-ghost"
          style={{ alignSelf: 'center' }}
          onClick={() => {
            setModo(modo === 'entrar' ? 'criar' : 'entrar');
            setErro(null);
            setAviso(null);
          }}
        >
          {modo === 'entrar' ? 'Ainda não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  );
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha errados.';
  if (/already registered|already exists/i.test(msg)) return 'Já existe uma conta com esse e-mail.';
  if (/password.*(least|short)/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/email.*invalid/i.test(msg)) return 'E-mail inválido.';
  return msg;
}
