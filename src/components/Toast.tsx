import { useApp } from '../state/AppContext';

export function Toast() {
  const { toast, temToast } = useApp();
  if (!temToast) return null;
  return <div className="toast">{toast}</div>;
}
