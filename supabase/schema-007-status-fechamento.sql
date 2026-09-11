-- Controle Financeiro — parte 7: status de pagamento por fechamento.
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema-006).
--
-- Até aqui só o aluno tinha um status de pagamento (pago/aberto/atrasado/
-- cobrado) — um só, não um por mês. Se ele devesse 2 meses, não dava pra
-- separar "deve julho" de "deve agosto". Agora cada linha de `fechamentos`
-- (o mês já fechado) carrega seu próprio status, então dá pra cobrar cada
-- mês em aberto separadamente. O status do aluno continua existindo — ele
-- passa a representar só o mês corrente, ainda não fechado.
alter table public.fechamentos
  add column if not exists status text not null default 'aberto'
    check (status in ('pago', 'aberto', 'atrasado', 'cobrado'));
