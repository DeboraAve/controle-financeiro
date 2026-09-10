-- Controle Financeiro — parte 5: fechamento mensal real por aluno.
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema-004).
--
-- Uma linha por (aluno, mês) — guarda o que realmente foi cobrado naquele
-- mês (já líquido de cancelada/extra/férias), não um recálculo em cima do
-- valor atual do aluno. É o que falta pro Painel ter um gráfico de tendência
-- de verdade e pro histórico de cada aluno parar de ser inventado.
create table if not exists public.fechamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  mes text not null, -- "2026-09"
  base numeric not null, -- valor do pacote/mensalidade no momento do fechamento
  total numeric not null, -- o que realmente fechou, já com desconto/extra/férias
  canceladas integer not null default 0,
  extras integer not null default 0,
  ferias_valor numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (aluno_id, mes)
);

alter table public.fechamentos enable row level security;

create policy "fechamentos: own rows or admin" on public.fechamentos
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists idx_fechamentos_aluno on public.fechamentos(aluno_id);
create index if not exists idx_fechamentos_user_mes on public.fechamentos(user_id, mes);
