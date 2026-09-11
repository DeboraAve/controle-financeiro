-- Controle Financeiro — parte 9: aluno "valor por aula" (sem pacote fixo).
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema-008).
--
-- Substitui a opção "Mensalidade fixa" (que na prática nunca teve nenhum
-- comportamento diferente de "Pacote" — mesmo cálculo, só o texto mudava).
-- Alunos "valor por aula" não têm pacote pré-definido: nasce sem nenhuma
-- aula no mês, o personal confirma cada aula dada (reaproveita o status
-- "extra" que sessão já tem — some no fechamento/zerar ajustes igual),
-- e o total do mês é só a contagem × esse valor.
alter table public.alunos
  add column if not exists valor_aula numeric;
