-- Script para verificar se a tabela simulations foi criada corretamente
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT 
    'Tabela simulations existe?' as pergunta,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'simulations') 
        THEN 'SIM' 
        ELSE 'NÃO' 
    END as resposta;

-- 2. Verificar colunas da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'simulations'
ORDER BY ordinal_position;

-- 3. Verificar se há dados
SELECT 
    'Total de simulados' as info,
    COUNT(*) as quantidade
FROM simulations;

-- 4. Testar inserção de um simulado de exemplo
INSERT INTO simulations (
    title, 
    description, 
    discipline, 
    subject, 
    file_name, 
    file_url, 
    file_size, 
    duration_minutes, 
    total_questions
) VALUES (
    'Simulado Teste - Português',
    'Simulado de teste para verificar se a tabela está funcionando',
    'Português',
    'Gramática',
    'simulado-teste-portugues.pdf',
    'https://example.com/simulado-teste.pdf',
    1024000,
    60,
    20
) ON CONFLICT DO NOTHING;

-- 5. Verificar se o simulado foi inserido
SELECT 
    title,
    discipline,
    duration_minutes,
    total_questions,
    is_active
FROM simulations 
ORDER BY created_at DESC 
LIMIT 5;
