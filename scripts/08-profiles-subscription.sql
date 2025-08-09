-- Adiciona campos de assinatura ao perfil
alter table public.profiles
  add column if not exists is_subscribed boolean default false,
  add column if not exists plan text check (plan in ('monthly','annual'));

-- Políticas continuam válidas; usuários só podem ver/alterar o próprio perfil
-- Opcional: permitir update desses campos pelo próprio usuário quando implementar checkout webhook
