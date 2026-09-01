-- Controle Financeiro — parte 2: papéis (admin/personal) + avaliação física
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema.sql original).

-- PROFILES ------------------------------------------------------------------
-- Uma linha por usuário, criada automaticamente no cadastro. 'role' controla
-- se a pessoa é 'admin' (vê e mexe em tudo) ou 'personal' (só o próprio).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'personal' check (role in ('admin','personal')),
  nome text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- função auxiliar: "esse usuário é admin?" — security definer pra não cair
-- em recursão de RLS ao consultar a própria tabela profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- cria a linha de profile sozinha quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), new.email, 'personal');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- cada um vê o próprio profile; admin vê todos. Ninguém edita o próprio role
-- por aqui (só via Table Editor, manualmente) — evita autopromoção.
create policy "profiles: ver próprio ou admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: admin edita" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ATUALIZA as políticas das tabelas já existentes pra admin também poder
-- ver/mexer em tudo, mantendo o personal restrito ao próprio.
drop policy if exists "academias: own rows" on public.academias;
create policy "academias: own rows or admin" on public.academias
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "alunos: own rows" on public.alunos;
create policy "alunos: own rows or admin" on public.alunos
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "sessoes: own rows" on public.sessoes;
create policy "sessoes: own rows or admin" on public.sessoes
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "despesas: own rows" on public.despesas;
create policy "despesas: own rows or admin" on public.despesas
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "ajustes: own row" on public.ajustes;
create policy "ajustes: own row or admin" on public.ajustes
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- AVALIAÇÃO FÍSICA ------------------------------------------------------------
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  data text not null,
  peso numeric not null,
  estatura numeric not null,
  idade integer not null,
  sexo text not null check (sexo in ('M','F')),
  dobra_peitoral numeric,
  dobra_axilar numeric,
  dobra_triceps numeric,
  dobra_subescapular numeric,
  dobra_abdominal numeric,
  dobra_suprailiaca numeric,
  dobra_coxa numeric,
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.avaliacoes enable row level security;

create policy "avaliacoes: own rows or admin" on public.avaliacoes
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists idx_avaliacoes_aluno on public.avaliacoes(aluno_id);
create index if not exists idx_avaliacoes_user on public.avaliacoes(user_id);

-- Preenche profiles pra quem já criou conta antes desta migração
insert into public.profiles (id, nome, email, role)
select u.id, coalesce(u.raw_user_meta_data->>'nome', ''), u.email, 'personal'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
