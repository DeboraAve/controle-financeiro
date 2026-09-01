-- Controle Financeiro — schema + RLS
-- Cole isto no SQL Editor do Supabase (menu lateral, ícone de terminal) e clique em "Run".
-- Cria as tabelas e garante que cada personal só enxerga os próprios dados.

create extension if not exists "pgcrypto";

-- ACADEMIAS ------------------------------------------------------------
create table if not exists public.academias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  modelo text not null check (modelo in ('mensal_fixo','por_aluno')),
  valor_cobrado numeric not null default 0,
  custo_por_trecho numeric not null default 0,
  viagens_por_semana numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.academias enable row level security;

create policy "academias: own rows" on public.academias
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ALUNOS -----------------------------------------------------------------
create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  academia_id uuid references public.academias(id) on delete set null,
  nome text not null,
  inicial text not null default '',
  plano text not null default '',
  base numeric not null default 0,
  previstas integer not null default 8,
  status text not null default 'ativo' check (status in ('ativo','ferias','inativo')),
  pag text not null default 'aberto' check (pag in ('pago','aberto','atrasado','cobrado')),
  atraso integer,
  horario text not null default '',
  desde text not null default '',
  fone text not null default '',
  ferias numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.alunos enable row level security;

create policy "alunos: own rows" on public.alunos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- SESSOES (aulas do mês por aluno: feita / cancelada / extra) ------------
create table if not exists public.sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  dia text not null,
  status text not null default 'feita' check (status in ('feita','cancelada','extra')),
  created_at timestamptz not null default now()
);

alter table public.sessoes enable row level security;

create policy "sessoes: own rows" on public.sessoes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- DESPESAS ----------------------------------------------------------------
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dia text not null,
  cat text not null default '',
  descricao text not null default '',
  valor numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.despesas enable row level security;

create policy "despesas: own rows" on public.despesas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AJUSTES (uma linha por personal) ----------------------------------------
create table if not exists public.ajustes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  grafico text not null default 'Barras mensais',
  meta_mensal numeric not null default 7500,
  dias_para_atraso integer not null default 5,
  semanas_por_mes integer not null default 4
);

alter table public.ajustes enable row level security;

create policy "ajustes: own row" on public.ajustes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Índices úteis -------------------------------------------------------------
create index if not exists idx_alunos_user on public.alunos(user_id);
create index if not exists idx_academias_user on public.academias(user_id);
create index if not exists idx_sessoes_user on public.sessoes(user_id);
create index if not exists idx_sessoes_aluno on public.sessoes(aluno_id);
create index if not exists idx_despesas_user on public.despesas(user_id);
