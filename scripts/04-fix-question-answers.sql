-- =====================================================
-- SCRIPT ROBUSTO PARA CORRIGIR PROBLEMAS COM QUESTÕES RESPONDIDAS
-- Bússola da Aprovação PMBA
-- =====================================================

-- 1. CORRIGIR TABELA study_sessions (VERIFICANDO SE JÁ EXISTE)
-- =====================================================

-- Verificar se a constraint fk_user_profile existe e removê-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_profile' 
        AND table_name = 'study_sessions'
    ) THEN
        ALTER TABLE study_sessions DROP CONSTRAINT fk_user_profile;
        RAISE NOTICE 'Constraint fk_user_profile removida';
    ELSE
        RAISE NOTICE 'Constraint fk_user_profile não existe';
    END IF;
END $$;

-- Verificar se a constraint fk_study_sessions_user_id já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_study_sessions_user_id' 
        AND table_name = 'study_sessions'
    ) THEN
        ALTER TABLE study_sessions 
        ADD CONSTRAINT fk_study_sessions_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        RAISE NOTICE 'Constraint fk_study_sessions_user_id criada';
    ELSE
        RAISE NOTICE 'Constraint fk_study_sessions_user_id já existe';
    END IF;
END $$;

-- 2. CORRIGIR CONSTRAINT DE study_time_minutes (VERIFICANDO SE JÁ EXISTE)
-- =====================================================

-- Verificar se a constraint study_time_minutes > 0 existe e removê-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'study_sessions_study_time_minutes_check'
    ) THEN
        ALTER TABLE study_sessions DROP CONSTRAINT study_sessions_study_time_minutes_check;
        RAISE NOTICE 'Constraint study_sessions_study_time_minutes_check removida';
    ELSE
        RAISE NOTICE 'Constraint study_sessions_study_time_minutes_check não existe';
    END IF;
END $$;

-- Adicionar nova constraint que permite valores >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'study_sessions_study_time_minutes_check_new'
    ) THEN
        ALTER TABLE study_sessions 
        ADD CONSTRAINT study_sessions_study_time_minutes_check_new 
        CHECK (study_time_minutes >= 0);
        RAISE NOTICE 'Nova constraint study_time_minutes >= 0 criada';
    ELSE
        RAISE NOTICE 'Constraint study_time_minutes >= 0 já existe';
    END IF;
END $$;

-- 3. VERIFICAR E CRIAR TABELAS NECESSÁRIAS
-- =====================================================

-- Verificar se a tabela question_answers existe
CREATE TABLE IF NOT EXISTS question_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  subject TEXT NOT NULL,
  user_answer_index INTEGER NOT NULL CHECK (user_answer_index >= 0),
  correct_option_index INTEGER NOT NULL CHECK (correct_option_index >= 0),
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER DEFAULT 0 CHECK (time_taken_seconds >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que um usuário só pode responder uma questão uma vez
  CONSTRAINT unique_user_question UNIQUE (user_id, question_id)
);

-- Verificar se a tabela user_subject_progress existe
CREATE TABLE IF NOT EXISTS user_subject_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  subject TEXT NOT NULL,
  last_study_date DATE NOT NULL,
  next_review_date DATE NOT NULL,
  total_study_time_minutes INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
  strength_level INTEGER DEFAULT 1 CHECK (strength_level >= 1 AND strength_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, discipline, subject)
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE (SE NÃO EXISTIREM)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_question_answers_user_id ON question_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_discipline ON question_answers(discipline);
CREATE INDEX IF NOT EXISTS idx_question_answers_created_at ON question_answers(created_at);

CREATE INDEX IF NOT EXISTS idx_user_subject_progress_user_id ON user_subject_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subject_progress_next_review ON user_subject_progress(next_review_date);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_discipline ON study_sessions(discipline);

-- 5. HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subject_progress ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS PARA study_sessions (REMOVENDO ANTIGAS PRIMEIRO)
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can insert own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can update own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete own study sessions" ON study_sessions;

-- Criar políticas corretas
CREATE POLICY "Users can view own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 7. CRIAR POLÍTICAS RLS PARA question_answers
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own question answers" ON question_answers;
DROP POLICY IF EXISTS "Users can insert own question answers" ON question_answers;
DROP POLICY IF EXISTS "Users can update own question answers" ON question_answers;
DROP POLICY IF EXISTS "Users can delete own question answers" ON question_answers;

-- Criar políticas corretas
CREATE POLICY "Users can view own question answers" ON question_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question answers" ON question_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question answers" ON question_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own question answers" ON question_answers
  FOR DELETE USING (auth.uid() = user_id);

-- 8. CRIAR POLÍTICAS RLS PARA user_subject_progress
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own subject progress" ON user_subject_progress;
DROP POLICY IF EXISTS "Users can insert own subject progress" ON user_subject_progress;
DROP POLICY IF EXISTS "Users can update own subject progress" ON user_subject_progress;
DROP POLICY IF EXISTS "Users can delete own subject progress" ON user_subject_progress;

-- Criar políticas corretas
CREATE POLICY "Users can view own subject progress" ON user_subject_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject progress" ON user_subject_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subject progress" ON user_subject_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subject progress" ON user_subject_progress
  FOR DELETE USING (auth.uid() = user_id);

-- 9. VERIFICAR SE EXISTEM DADOS ÓRFÃOS
-- =====================================================

-- Verificar se há user_ids na tabela study_sessions que não existem em auth.users
SELECT COUNT(*) as orphaned_study_sessions
FROM study_sessions ss
LEFT JOIN auth.users u ON ss.user_id = u.id
WHERE u.id IS NULL;

-- Verificar se há user_ids na tabela question_answers que não existem em auth.users
SELECT COUNT(*) as orphaned_question_answers
FROM question_answers qa
LEFT JOIN auth.users u ON qa.user_id = u.id
WHERE u.id IS NULL;

-- Verificar se há user_ids na tabela user_subject_progress que não existem em auth.users
SELECT COUNT(*) as orphaned_user_subject_progress
FROM user_subject_progress usp
LEFT JOIN auth.users u ON usp.user_id = u.id
WHERE u.id IS NULL;

-- 10. VERIFICAR ESTRUTURA FINAL
-- =====================================================

-- Verificar as constraints da tabela study_sessions
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='study_sessions';

-- Verificar as check constraints da tabela study_sessions
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%study_sessions%';

-- 11. MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CORREÇÃO DAS QUESTÕES RESPONDIDAS CONCLUÍDA!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Problemas corrigidos:';
    RAISE NOTICE '1. Chave estrangeira da tabela study_sessions agora referencia auth.users';
    RAISE NOTICE '2. Constraint de study_time_minutes foi ajustada para permitir valores >= 0';
    RAISE NOTICE '3. Políticas RLS foram recriadas corretamente';
    RAISE NOTICE '4. Índices de performance foram criados';
    RAISE NOTICE '5. Tabelas question_answers e user_subject_progress foram verificadas';
    RAISE NOTICE '';
    RAISE NOTICE 'Agora as questões respondidas devem aparecer no dashboard de lançamentos!';
    RAISE NOTICE '=====================================================';
END $$;
