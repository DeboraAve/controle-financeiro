import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';

export interface PageHeaderDescriptor {
  content: ReactNode;
}

// Contexto do valor (lido só pelo <PageHeaderOutlet />) separado do
// contexto do setter (usado só pelas telas, via useSetPageHeader) — se
// fosse um contexto só com {header, setHeader}, cada `setHeader(...)`
// trocaria a identidade do objeto do contexto inteiro, re-renderizando
// também quem só queria o setter (as telas); como o efeito que chama
// setHeader não tem array de dependências (de propósito, pra
// ressincronizar a cada render), esse re-render disparava o efeito nas
// telas de novo → setHeader de novo → loop infinito ("Maximum update
// depth exceeded", achado rodando de verdade, não só lendo o código).
// `setHeader` de um useState é estável entre renders, então separar os
// dois contextos quebra o ciclo: mudar `header` não afeta quem só
// consome o setter.
const HeaderValueContext = createContext<PageHeaderDescriptor | null>(null);
const HeaderSetterContext = createContext<((h: PageHeaderDescriptor | null) => void) | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderDescriptor | null>(null);
  return (
    <HeaderSetterContext.Provider value={setHeader}>
      <HeaderValueContext.Provider value={header}>{children}</HeaderValueContext.Provider>
    </HeaderSetterContext.Provider>
  );
}

export function PageHeaderOutlet() {
  const header = useContext(HeaderValueContext);
  if (!header) return null;
  return <div className="page-header">{header.content}</div>;
}

// Cada tela chama isso com o próprio título/ações — o conteúdo migra do
// topo da rolagem pra um cabeçalho fixo (ver `.page-header` em app.css)
// renderizado uma vez só, fora da árvore da tela. O 1º efeito resincroniza
// a cada render (título pode mudar, ex. nome do aluno carregando); o 2º só
// existe pra limpar quando a tela desmonta — senão o cabeçalho de quem
// saiu ficaria preso até a próxima tela chamar isso de novo.
export function useSetPageHeader(content: ReactNode) {
  const setHeader = useContext(HeaderSetterContext);
  if (!setHeader) throw new Error('useSetPageHeader precisa estar dentro de <PageHeaderProvider>');
  useLayoutEffect(() => {
    setHeader({ content });
  });
  useEffect(() => {
    return () => setHeader(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
