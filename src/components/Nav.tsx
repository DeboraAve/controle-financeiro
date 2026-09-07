import { useApp } from '../state/AppContext';
import { BrandMark } from './ui/BrandMark';
import { TAMANHO_ICONE } from './ui/icons';

export function TabBar() {
  const { tabs } = useApp();
  const ativoIndex = Math.max(0, tabs.findIndex((t) => t.ativo));
  return (
    <nav className="tabbar">
      <div className="tabbar-indicator" style={{ transform: `translateX(${ativoIndex * 100}%)` }} />
      {tabs.map((t) => (
        <div
          key={t.key}
          onClick={t.ir}
          className="tabbar-item"
          style={{ color: t.ativo ? 'var(--brand-active)' : 'var(--text-disabled)' }}
        >
          <t.Icone size={TAMANHO_ICONE.md} aria-hidden />
          <div className="tabbar-label">{t.rotulo}</div>
        </div>
      ))}
    </nav>
  );
}

export function SideNav() {
  const { tabs } = useApp();
  return (
    <nav className="sidenav">
      <div className="sidenav-brand">
        <BrandMark size={TAMANHO_ICONE.md} />
        impulsa
      </div>
      <div className="sidenav-items">
        {tabs.map((t) => (
          <div
            key={t.key}
            onClick={t.ir}
            className="sidenav-item"
            style={{ color: t.ativo ? 'var(--brand-active)' : 'var(--text-disabled)' }}
          >
            <t.Icone size={TAMANHO_ICONE.md} aria-hidden />
            <div className="sidenav-label">{t.rotulo}</div>
          </div>
        ))}
      </div>
    </nav>
  );
}
