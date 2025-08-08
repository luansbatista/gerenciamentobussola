-- Script para corrigir as datas de revisão que foram definidas incorretamente
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar quantos registros têm next_review_date como hoje
SELECT 
    COUNT(*) as registros_com_revisao_hoje,
    COUNT(CASE WHEN next_review_date = CURRENT_DATE THEN 1 END) as revisoes_hoje,
    COUNT(CASE WHEN next_review_date < CURRENT_DATE THEN 1 END) as revisoes_vencidas,
    COUNT(CASE WHEN next_review_date > CURRENT_DATE THEN 1 END) as revisoes_futuras
FROM user_subject_progress;

-- 2. Mostrar exemplos de registros problemáticos
SELECT 
    id,
    user_id,
    discipline,
    subject,
    last_study_date,
    next_review_date,
    created_at
FROM user_subject_progress 
WHERE next_review_date <= CURRENT_DATE
ORDER BY next_review_date ASC
LIMIT 10;

-- 3. Corrigir registros onde next_review_date é igual ou anterior a last_study_date
-- Isso corrige registros onde a revisão foi definida incorretamente
UPDATE user_subject_progress 
SET next_review_date = (last_study_date::date + INTERVAL '7 days')::date
WHERE next_review_date <= last_study_date::date + INTERVAL '1 day'
AND last_study_date IS NOT NULL;

-- 4. Verificar o resultado da correção
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN next_review_date = CURRENT_DATE THEN 1 END) as revisoes_hoje,
    COUNT(CASE WHEN next_review_date < CURRENT_DATE THEN 1 END) as revisoes_vencidas,
    COUNT(CASE WHEN next_review_date > CURRENT_DATE THEN 1 END) as revisoes_futuras
FROM user_subject_progress;

-- 5. Mostrar alguns registros corrigidos
SELECT 
    id,
    user_id,
    discipline,
    subject,
    last_study_date,
    next_review_date,
    (next_review_date::date - last_study_date::date) as dias_ate_revisao
FROM user_subject_progress 
ORDER BY next_review_date ASC
LIMIT 10;
