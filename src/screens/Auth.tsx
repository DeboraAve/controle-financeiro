import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Field';
import { Stack } from '../components/ui/Stack';
import { useAuth } from '../state/AuthContext';

export function Auth() {
  const { signIn, signUp, enviarRecuperacaoSenha } = useAuth();
  const [modo, setModo] = useState<'entrar' | 'criar' | 'recuperar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const submeter = async () => {
    setErro(null);
    setAviso(null);
    if (modo === 'recuperar') {
      if (!email) {
        setErro('Preenche o e-mail.');
        return;
      }
      setEnviando(true);
      const msg = await enviarRecuperacaoSenha(email);
      if (msg) setErro(traduzErro(msg));
      else setAviso('Te mandamos um link por e-mail pra você escolher uma senha nova.');
      setEnviando(false);
      return;
    }
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
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--surface-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      <Stack gap={4} style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow">Impulsa</div>
          <h1 style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 0' }}>{modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Recuperar senha'}</h1>
        </div>

        <Card style={{ gap: 'var(--space-3)' }}>
          {modo === 'criar' && (
            <Field label="Seu nome">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ricardo Alves" />
            </Field>
          )}
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" onKeyDown={(e) => modo === 'recuperar' && e.key === 'Enter' && submeter()} />
          </Field>
          {modo !== 'recuperar' && (
            <Field label="Senha">
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && submeter()}
              />
            </Field>
          )}
          {modo === 'entrar' && (
            <Button
              variant="ghost"
              style={{ alignSelf: 'flex-start', padding: 0, fontSize: 12 }}
              onClick={() => {
                setModo('recuperar');
                setErro(null);
                setAviso(null);
              }}
            >
              Esqueci minha senha
            </Button>
          )}

          {erro && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--status-danger)' }}>{erro}</div>}
          {aviso && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-accent)' }}>{aviso}</div>}

          <Button variant="primary" block onClick={submeter} disabled={enviando} loading={enviando}>
            {modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Enviar link de recuperação'}
          </Button>
        </Card>

        <Button
          variant="ghost"
          style={{ alignSelf: 'center' }}
          onClick={() => {
            setModo(modo === 'entrar' ? 'criar' : 'entrar');
            setErro(null);
            setAviso(null);
          }}
        >
          {modo === 'entrar' ? 'Ainda não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </Button>
      </Stack>
    </main>
  );
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha errados.';
  if (/already registered|already exists/i.test(msg)) return 'Já existe uma conta com esse e-mail.';
  if (/password.*(least|short)/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/email.*invalid/i.test(msg)) return 'E-mail inválido.';
  return msg;
}
