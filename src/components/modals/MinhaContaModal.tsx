import { useEffect, useState } from 'react';
import { useApp } from '../../state/AppContext';
import { useAuth } from '../../state/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function MinhaContaModal() {
  const { modalMinhaConta, fecharMinhaConta } = useApp();
  const { session, profile, salvarMeusDados, trocarSenha } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [fone, setFone] = useState('');
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroDados, setErroDados] = useState<string | null>(null);
  const [avisoDados, setAvisoDados] = useState<string | null>(null);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [avisoSenha, setAvisoSenha] = useState<string | null>(null);

  useEffect(() => {
    if (!modalMinhaConta) return;
    setNome(profile?.nome || (session?.user.user_metadata?.nome as string | undefined) || '');
    setEmail(session?.user.email || '');
    setFone(profile?.fone || '');
    setErroDados(null);
    setAvisoDados(null);
    setNovaSenha('');
    setConfirmarSenha('');
    setErroSenha(null);
    setAvisoSenha(null);
  }, [modalMinhaConta, profile, session]);

  const salvarDados = async () => {
    setErroDados(null);
    setAvisoDados(null);
    if (!nome.trim()) {
      setErroDados('Dá um nome pra você.');
      return;
    }
    setSalvandoDados(true);
    const msg = await salvarMeusDados(nome, fone, email);
    setSalvandoDados(false);
    if (msg) {
      setErroDados(msg);
    } else if (email.trim() !== session?.user.email) {
      setAvisoDados('Dados salvos. Te mandamos um e-mail de confirmação pro endereço novo — o e-mail só muda de verdade depois de confirmar.');
    } else {
      setAvisoDados('Dados salvos.');
    }
  };

  const salvarSenha = async () => {
    setErroSenha(null);
    setAvisoSenha(null);
    if (novaSenha.length < 6) {
      setErroSenha('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não são iguais.');
      return;
    }
    setTrocandoSenha(true);
    const msg = await trocarSenha(novaSenha);
    setTrocandoSenha(false);
    if (msg) {
      setErroSenha(msg);
    } else {
      setAvisoSenha('Senha trocada.');
      setNovaSenha('');
      setConfirmarSenha('');
    }
  };

  return (
    <Modal open={modalMinhaConta} onClose={fecharMinhaConta} title="Minha conta" actions={<Button variant="primary" onClick={fecharMinhaConta}>Pronto</Button>}>
      <div className="field">
        <label>Nome</label>
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
      </div>
      <div className="field">
        <label>E-mail</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
      </div>
      <div className="field">
        <label>Telefone</label>
        <input className="input" value={fone} onChange={(e) => setFone(e.target.value)} placeholder="(11) 9 0000-0000" />
      </div>
      {erroDados && <div style={{ fontSize: 12, color: 'var(--status-danger)' }}>{erroDados}</div>}
      {avisoDados && <div style={{ fontSize: 12, color: 'var(--text-accent)' }}>{avisoDados}</div>}
      <Button variant="secondary" block onClick={salvarDados} disabled={salvandoDados} loading={salvandoDados}>Salvar dados</Button>

      <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div className="card-kicker">Trocar senha</div>
        <div className="field">
          <label>Nova senha</label>
          <input className="input" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="field">
          <label>Confirmar nova senha</label>
          <input className="input" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="••••••••" />
        </div>
        {erroSenha && <div style={{ fontSize: 12, color: 'var(--status-danger)' }}>{erroSenha}</div>}
        {avisoSenha && <div style={{ fontSize: 12, color: 'var(--text-accent)' }}>{avisoSenha}</div>}
        <Button variant="secondary" block onClick={salvarSenha} disabled={trocandoSenha} loading={trocandoSenha}>Trocar senha</Button>
      </div>
    </Modal>
  );
}
