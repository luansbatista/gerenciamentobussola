-- Script para verificar se o usuário é admin
-- Execute este script no SQL Editor do Supabase

-- Verificar todos os usuários e seus status de admin
SELECT 
  au.email,
  au.created_at as user_created_at,
  p.is_admin,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Verificar se a tabela profiles existe e tem dados
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_admin = TRUE THEN 1 END) as admin_count,
  COUNT(CASE WHEN is_admin = FALSE THEN 1 END) as user_count
FROM profiles;

-- Verificar a estrutura da tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
