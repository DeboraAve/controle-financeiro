-- Controle Financeiro — parte 8: cada pessoa edita os próprios dados.
-- Cole isto no SQL Editor do Supabase e clique em "Run" (depois do schema-007).
--
-- Hoje só admin pode dar UPDATE em `profiles` (schema-002). Em vez de abrir
-- uma política de UPDATE genérica pro próprio usuário — o que deixaria
-- qualquer coluna editável, inclusive `role` e `mensalidade_status` — essa
-- função só mexe em nome/telefone/e-mail, e só na própria linha
-- (auth.uid()), então dá pra chamar do app sem risco de alguém se
-- promover a admin ou marcar a própria mensalidade como paga.
create or replace function public.update_own_profile(p_nome text, p_fone text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    nome = coalesce(p_nome, nome),
    fone = coalesce(p_fone, fone),
    email = coalesce(p_email, email)
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_profile(text, text, text) to authenticated;
