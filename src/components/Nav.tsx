import { useApp } from '../state/AppContext';

function Marker({ color, filled }: { color: string; filled: string }) {
  return <div style={{ width: 15, height: 15, border: '1.5px solid currentColor', background: filled, color, flex: 'none' }} />;
}

export function TabBar() {
  const { tabs } = useApp();
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <div key={t.key} onClick={t.ir} className="tabbar-item" style={{ color: t.cor }}>
          <Marker color={t.cor} filled={t.marca} />
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
        <div className="sidenav-brand-mark" />
        Controle financeiro
      </div>
      <div className="sidenav-items">
        {tabs.map((t) => (
          <div key={t.key} onClick={t.ir} className="sidenav-item" style={{ color: t.cor }}>
            <Marker color={t.cor} filled={t.marca} />
            <div className="sidenav-label">{t.rotulo}</div>
          </div>
        ))}
      </div>
    </nav>
  );
}
