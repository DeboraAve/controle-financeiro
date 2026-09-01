-- Controle Financeiro — parte 3: dobras extras + perimetria na avaliação física.
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema-002).

alter table public.avaliacoes
  add column if not exists dobra_biceps numeric,
  add column if not exists dobra_panturrilha numeric,
  add column if not exists perim_pescoco numeric,
  add column if not exists perim_torax numeric,
  add column if not exists perim_cintura numeric,
  add column if not exists perim_abdomen numeric,
  add column if not exists perim_quadril numeric;
