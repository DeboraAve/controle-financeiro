/* Tema claro/escuro/sistema. "Sistema" é a ausência de `data-theme`
 * no <html> — os tokens já cobrem esse caso via prefers-color-scheme
 * (ver tokens.css). Escolher claro ou escuro só escreve o atributo. */
export type Tema = 'light' | 'dark' | 'system';

const CHAVE = 'impulsa-theme';

export function lerTema(): Tema {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // localStorage indisponível (modo privado etc.) — cai pro padrão.
  }
  return 'system';
}

export function aplicarTema(tema: Tema) {
  if (tema === 'system') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = tema;
  }
  try {
    if (tema === 'system') localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, tema);
  } catch {
    // idem — falha silenciosa, o tema só não persiste entre sessões.
  }
}
