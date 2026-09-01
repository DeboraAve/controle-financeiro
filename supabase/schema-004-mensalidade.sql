-- Controle Financeiro — parte 4: mensalidade do app cobrada pelo admin de cada personal.
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema-003).

alter table public.profiles
  add column if not exists fone text not null default '',
  add column if not exists mensalidade_valor numeric not null default 0,
  add column if not exists mensalidade_status text not null default 'aberto'
    check (mensalidade_status in ('pago', 'aberto', 'atrasado', 'cobrado'));
