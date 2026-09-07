# PRD — Backend, Segurança e Infraestrutura (Controle Financeiro)

**Produto:** Controle Financeiro (PWA para personal trainers, multi-tenant sobre Supabase)
**Autora do PRD:** Claude, a pedido de Débora
**Data:** 04/09/2026
**Status:** Rascunho para avaliação por fases

> Aviso importante: as seções de "questões legais" abaixo são uma triagem técnica para orientar prioridades de engenharia — não substituem uma consulta a um advogado especializado em proteção de dados. Recomendo validar o enquadramento jurídico específico (principalmente sobre dado de saúde de terceiros) com um profissional antes de formalizar Termos de Uso e Política de Privacidade.

## 1. Arquitetura atual (como está hoje)

- **Frontend:** SPA React servida estática (GitHub Pages, via `.github/workflows/deploy.yml`), PWA com Workbox.
- **Backend:** Supabase (Postgres + Auth + RLS), sem servidor próprio — o cliente fala direto com o Supabase usando a "publishable key" (chave anônima pública, correta para esse modelo).
- **Autenticação:** e-mail/senha via `supabase.auth`, com confirmação de e-mail no cadastro.
- **Autorização:** Row Level Security em todas as tabelas (`academias`, `alunos`, `sessoes`, `despesas`, `ajustes`, `avaliacoes`, `profiles`), com policy padrão `user_id = auth.uid()`, e uma função `is_admin()` (security definer) que dá acesso total a quem tem `role = 'admin'` em `profiles`.
- **Multi-tenant:** cada personal trainer é um `user_id`; o "admin" (dono do SaaS) enxerga e edita tudo via `adminViewingUserId` no frontend + RLS liberando quando `is_admin()`.
- **Dado sensível coletado:** a tabela `avaliacoes` guarda avaliação física dos **alunos** dos personais — peso, estatura, idade, sexo, dobras cutâneas (7 pontos), perimetria (5 pontos), RCQ, observações. Isso é dado de saúde de uma **pessoa que nunca criou conta no sistema** (o aluno) — coletado por um terceiro (o personal trainer) e armazenado pelo SaaS.
- **Compartilhamento externo:** avaliação e cobrança são enviadas via link `wa.me/<numero>?text=<mensagem>` (WhatsApp Web/App), com o conteúdo da mensagem montado no cliente.

## 2. Falhas e riscos de segurança encontrados

Ordenados por severidade percebida (não há como confirmar exploração real sem acesso ao painel Supabase — algumas dependem de configuração que não está no código, sinalizado abaixo).

### 2.1 Alto risco

1. **Um admin comprometido expõe todos os tenants.** `is_admin()` dá bypass total de RLS para qualquer tabela, sem log de acesso. Se a conta admin (senha simples, sem MFA visível) for comprometida, o atacante vê e edita dados financeiros e de saúde de **todos** os personais e seus alunos, de uma vez. Hoje não existe MFA, não existe log de auditoria (quem viu/editou o quê e quando), e não existe alerta de acesso anômalo.
2. **Nenhuma política de senha reforçada nem proteção contra senha vazada.** O app só valida "mínimo 6 caracteres" (mensagem de erro traduzida em `Auth.tsx` confirma isso). O Supabase oferece "Leaked Password Protection" (checagem contra bases de senha vazada, tipo HaveIBeenPwned) e política de senha mais forte — não há evidência de que estejam ativadas no projeto (é configuração de painel, não de código).
3. **Sem MFA para nenhuma conta, inclusive a de admin.** Dado que o admin tem acesso irrestrito a dados de saúde e financeiros de todos os tenants, essa conta especificamente deveria exigir 2FA.
4. **Sem rate limiting/CAPTCHA visível em login e cadastro.** Abre espaço para credential stuffing e para spam de contas (o cadastro é público e sem verificação humana). Isso também facilita **enumeração de e-mail**: a mensagem de erro "já existe uma conta com esse e-mail" (`traduzErro`, em `Auth.tsx`) confirma para um atacante se um e-mail está cadastrado.

### 2.2 Médio risco

5. **Dado de saúde de terceiro sem tratamento diferenciado.** `avaliacoes` fica na mesma política de RLS simples que o resto (`user_id = auth.uid() or is_admin()`) — funcionalmente correta, mas não há nada no schema ou no app que marque esse dado como sensível (ex.: sem campo de consentimento do aluno, sem data de coleta de consentimento, sem possibilidade de o aluno pedir exclusão diretamente). Ver seção legal abaixo.
6. **Vazamento potencial via link do WhatsApp.** `wa.me/...?text=...` carrega o conteúdo da mensagem na própria URL. Isso significa que o texto (que inclui nome, valores e, no caso da avaliação, possivelmente resumo de dados de saúde) passa a existir em: histórico do navegador, meta tags de preview caso alguém encurte/repostar o link, e logs de qualquer proxy/rede corporativa no caminho. Vale revisar exatamente o que entra na mensagem de avaliação física antes de continuar usando esse canal para isso.
7. **Sessão em localStorage sem CSP.** O `supabase-js` guarda o token de sessão em `localStorage` por padrão. Sem um Content-Security-Policy configurado (não há indício de CSP nem no `index.html` nem no workflow de deploy), qualquer XSS (ex.: via uma dependência comprometida, ou um campo de texto livre mal sanitizado renderizado sem escape) rouba a sessão. Prioridade sobe se no futuro o app passar a renderizar HTML de terceiros (hoje parece só texto simples).
8. **Sem varredura de dependências.** Não há `npm audit`, Dependabot ou similar configurado no workflow (`.github/workflows/deploy.yml` cobre só o build/deploy). `jsPDF` e `@supabase/supabase-js` são dependências ativas; sem checagem automática, uma CVE pode ficar meses sem ser notada.
9. **Sem cabeçalhos de segurança.** GitHub Pages não permite configurar headers HTTP customizados (CSP, `X-Frame-Options`, `Permissions-Policy` etc.) — isso é uma limitação da hospedagem, não do código, mas vale considerar ao decidir infra futura (ver Fase 4 abaixo).
10. **Promoção de admin é manual e sem trilha.** O comentário no schema confirma que só é possível virar admin manualmente pelo Table Editor do Supabase — isso é uma boa prática (evita autopromoção via app), mas hoje não há log de quem fez essa alteração nem quando.

### 2.3 Observação positiva (não é falha, mas vale registrar)
- A chave "publishable" hardcoded em `supabaseClient.ts` **não é uma falha** — é o modelo correto para esse tipo de app (SPA estática sem backend próprio), desde que toda tabela tenha RLS habilitada, o que parece ser o caso hoje.
- A separação de `is_admin()` como função `security definer` para evitar recursão de RLS na própria tabela `profiles` está bem feita.
- Cascade de exclusão (`on delete cascade`) nas FKs para `auth.users` é uma boa base para o direito de eliminação de dados (ver seção legal), mas precisa de um fluxo de produto em cima, não só do schema.

## 3. Questões legais (LGPD) — triagem

O app roda no Brasil, coleta dados pessoais e, na tabela `avaliacoes`, dados de saúde — categoria de **dado pessoal sensível** pela LGPD (Lei 13.709/2018, art. 5º, II). Alguns pontos que merecem atenção jurídica formal:

1. **Quem é o titular do dado x quem é o controlador.** O aluno (titular do dado de saúde) nunca interage com o sistema nem consente diretamente nele — quem insere os dados é o personal trainer. Juridicamente, isso normalmente coloca o **personal trainer como controlador** dos dados dos próprios alunos, e o SaaS (Débora/plataforma) como **operador**. Essa relação hoje não está formalizada em nenhum Termo de Uso ou contrato entre a plataforma e os personais — o que deveria existir é um contrato/termo que deixe isso explícito, incluindo as obrigações do operador (segurança, notificação de incidentes, etc.).
2. **Base legal para dado de saúde.** Dado sensível exige uma das bases do art. 11 da LGPD — normalmente consentimento específico e destacado do titular (o aluno) para essa finalidade, ou outra hipótese legal aplicável (ex.: tutela da saúde, se o personal trainer for enquadrado como exercendo essa função — discutível para educador físico, recomenda-se checar com jurídico). Hoje o app não tem nenhum campo ou fluxo de captura desse consentimento.
3. **Falta de Política de Privacidade e Termos de Uso publicados.** Não há nenhum arquivo/tela no repositório com esse conteúdo. Isso é exigido tanto para os personais (usuários diretos, titulares de seus próprios dados de cadastro e financeiros) quanto para orientar como os personais devem coletar consentimento dos próprios alunos.
4. **Direitos do titular sem mecanismo de autoatendimento.** LGPD art. 18 garante acesso, correção, portabilidade e eliminação de dados. Hoje, tecnicamente é possível apagar um aluno (cascade cuida da limpeza relacional), mas não há um fluxo de produto para "o personal exporta/apaga todos os dados de um aluno específico a pedido dele" nem para o próprio personal encerrar a conta e levar seus dados.
5. **Encarregado (DPO) / canal de contato.** Para uma operação pequena pode não ser obrigatório nomear um DPO formal, mas é recomendável ter pelo menos um canal de contato documentado para solicitações de titulares — hoje inexistente.
6. **Fiscalização da ANPD em dados de saúde crescendo em 2026.** Reportagens recentes indicam intensificação da fiscalização da ANPD especificamente sobre dados de saúde neste período — reforça a prioridade de tratar os pontos 2-4 antes de crescer a base de usuários.
7. **Localização dos dados / transferência internacional.** Supabase por padrão hospeda em regiões AWS que podem não ser o Brasil (depende da região escolhida no projeto). Se os dados estiverem fora do Brasil, isso é uma transferência internacional de dados sensíveis e precisa de uma das salvaguardas do art. 33 da LGPD — vale confirmar a região do projeto Supabase.
8. **Cobrança da mensalidade do app aos personais (`mensalidade_valor`/`mensalidade_status`)** transforma isso de "ferramenta pessoal" em relação comercial B2B — reforça a necessidade de Termos de Uso e, possivelmente, nota fiscal/CNPJ para essa receita especificamente (separado da questão de dado sensível, mas relevante para a operação como um todo).

Sources: [LGPD na saúde em 2026: o ano da virada regulatória](https://medicinasa.com.br/lgpd-saude-2026/), [Fiscalização de dados de saúde: ANPD intensifica em 2026](https://hdpo.com.br/fiscalizacao-de-dados-de-saude-anpd-2026/), [Tratamento de dados (sensíveis) da saúde na LGPD](https://academiamedica.com.br/blog/tratamento-de-dados-da-saude-sensiveis-na-lei-geral-de-protecao-de-dados)

## 4. Fases de implantação recomendadas

### Fase 1 — Contenção imediata (P, sem mudança de arquitetura)
Prioridade máxima porque são ajustes de configuração/baixo esforço com alto retorno de risco reduzido.

- Ativar no painel Supabase: confirmação de e-mail obrigatória (confirmar se já está ligado), Leaked Password Protection, política de senha mínima mais forte (ex.: 8+ caracteres).
- Ativar MFA (TOTP) obrigatório para a conta admin, no mínimo.
- Ativar CAPTCHA (hCaptcha/Turnstile, suportado nativamente pelo Supabase Auth) no cadastro e, se possível, no login.
- Revisar a mensagem de avaliação física enviada por WhatsApp — remover qualquer dado de saúde específico do texto da URL, deixando o link do WhatsApp só para avisar/direcionar, com o PDF anexado separadamente (não embutido na URL).
- Adicionar `npm audit`/Dependabot ao workflow de CI.

### Fase 2 — Base legal (LGPD) (M)
- Redigir e publicar Política de Privacidade e Termos de Uso (com apoio jurídico) — cobrindo especificamente a relação controlador (personal) / operador (plataforma) e o tratamento de dado de saúde dos alunos.
- Adicionar ao cadastro de aluno um campo de "consentimento do titular coletado" (checkbox + data), para o personal trainer registrar que obteve o consentimento do aluno antes de inserir dados de avaliação física.
- Criar um canal de contato para solicitações de titulares (mesmo que simples, um e-mail dedicado) e documentar o processo interno de resposta.
- Confirmar e documentar a região de hospedagem dos dados no Supabase.

### Fase 3 — Auditoria e controle de acesso (M)
- Criar tabela de log de auditoria (`audit_log`) registrando: quem (user_id), o quê (tabela/registro), quando, e especialmente toda vez que `is_admin()` for usado para acessar dados de outro tenant — via trigger ou nas próprias funções de acesso admin no frontend.
- Adicionar tela de "atividade da conta" para o admin revisar seu próprio histórico de acessos a dados de terceiros — cria transparência e é evidência de boa-fé em caso de fiscalização.
- Implementar fluxo de exportação e exclusão de dados por aluno/personal, cobrindo os direitos do art. 18.

### Fase 4 — Infraestrutura e resiliência (M/G)
- Avaliar migração de hospedagem do frontend de GitHub Pages para uma plataforma que permita configurar headers de segurança (CSP, `X-Frame-Options`, `Permissions-Policy`) — ex.: Cloudflare Pages, Vercel, Netlify — mantendo o mesmo modelo estático/PWA.
- Definir e testar rotina de backup do Postgres do Supabase (point-in-time recovery, se disponível no plano) e um plano de restauração testado (não só configurado).
- Adicionar monitoramento de erros no frontend (ex.: Sentry) para detectar falhas silenciosas e comportamento anômalo.
- Definir política de retenção de dados (ex.: dados de alunos inativos há X anos) e automatizar a limpeza, coerente com a política de privacidade da Fase 2.

### Fase 5 — Maturidade de acesso multi-tenant (G, pode esperar até haver mais de um "admin" ou crescimento relevante de base)
- Se a operação crescer (mais personais pagantes, eventualmente mais de uma pessoa com papel administrativo), avaliar RBAC mais granular do que só `admin`/`personal` (ex.: suporte que vê metadados mas não dado de saúde).
- Revisar necessidade de nomear formalmente um encarregado (DPO) conforme volume de dados sensíveis tratado.
- Testes de penetração/revisão de segurança externa antes de qualquer expansão significativa de base de usuários.

## 5. Ordem recomendada

Fase 1 é a mais urgente e a mais barata — deveria acontecer independente de qualquer decisão sobre as demais. Fase 2 (legal) é a segunda prioridade real porque o app já lida com dado de saúde de terceiros em produção; o risco aqui não é só técnico, é de exposição jurídica direta da Débora e de quem usa o app. Fases 3 e 4 podem correr em paralelo depois disso. Fase 5 só faz sentido quando houver sinal real de crescimento da operação.
