import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Field';
import { Stack } from '../components/ui/Stack';
import { useAuth } from '../state/AuthContext';

export function RecuperarSenha() {
  const { definirNovaSenha } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const submeter = async () => {
    setErro(null);
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setErro('As senhas não são iguais.');
      return;
    }
    setEnviando(true);
    const msg = await definirNovaSenha(senha);
    if (msg) setErro(msg);
    setEnviando(false);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--surface-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      <Stack gap={4} style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow">Impulsa</div>
          <h1 style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 0' }}>Nova senha</h1>
        </div>

        <Card style={{ gap: 'var(--space-3)' }}>
          <Field label="Nova senha">
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Confirmar nova senha">
            <Input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && submeter()}
            />
          </Field>
          {erro && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--status-danger)' }}>{erro}</div>}
          <Button variant="primary" block onClick={submeter} disabled={enviando} loading={enviando}>Salvar senha nova</Button>
        </Card>
      </Stack>
    </main>
  );
}
