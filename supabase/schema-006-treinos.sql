-- Controle Financeiro — parte 6: biblioteca de exercícios e treinos por aluno.
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema-005).
--
-- Exercício é cadastrado uma vez na biblioteca e reusado em vários treinos.
-- Um treino é organizado em "dias" (ex.: "Treino A — Peito/Tríceps"), cada
-- um com sua lista de exercícios. Só um treino fica "ativo" por aluno por
-- vez — ao montar um novo, o app arquiva o anterior (igual ao fechamento
-- mensal já faz com os ajustes do aluno).

-- EXERCÍCIOS ------------------------------------------------------------
create table if not exists public.exercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  grupo_muscular text not null default '',
  video_url text not null default '',
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.exercicios enable row level security;

create policy "exercicios: own rows or admin" on public.exercicios
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists idx_exercicios_user on public.exercicios(user_id);

-- TREINOS -----------------------------------------------------------------
create table if not exists public.treinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  nome text not null default '',
  status text not null default 'ativo' check (status in ('ativo', 'arquivado')),
  created_at timestamptz not null default now()
);

alter table public.treinos enable row level security;

create policy "treinos: own rows or admin" on public.treinos
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists idx_treinos_aluno on public.treinos(aluno_id);
create index if not exists idx_treinos_user on public.treinos(user_id);

-- DIAS DO TREINO ------------------------------------------------------------
create table if not exists public.treino_dias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  treino_id uuid not null references public.treinos(id) on delete cascade,
  nome text not null default '',
  ordem integer not null default 0
);

alter table public.treino_dias enable row level security;

create policy "treino_dias: own rows or admin" on public.treino_dias
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists idx_treino_dias_treino on public.treino_dias(treino_id);

-- ITENS DO TREINO (exercício dentro de um dia) -------------------------------
create table if not exists public.treino_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  treino_dia_id uuid not null references public.treino_dias(id) on delete cascade,
  exercicio_id uuid not null references public.exercicios(id) on delete restrict,
  ordem integer not null default 0,
  series integer,
  repeticoes text not null default '', -- texto livre: "8-12", "até a falha"
  carga numeric, -- kg — número pra dar pra acompanhar evolução, igual peso na avaliação
  descanso text not null default '', -- texto livre: "60s", "1min30"
  observacoes text not null default ''
);

alter table public.treino_itens enable row level security;

create policy "treino_itens: own rows or admin" on public.treino_itens
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists idx_treino_itens_dia on public.treino_itens(treino_dia_id);
