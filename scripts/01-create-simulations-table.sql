-- Script simples para criar a tabela de simulados
-- Execute este script no SQL Editor do Supabase

-- 1. Remover tabela se existir (para recriar do zero)
DROP TABLE IF EXISTS simulations CASCADE;

-- 2. Criar a tabela simulations
CREATE TABLE simulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discipline VARCHAR(100) NOT NULL,
    subject VARCHAR(100),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    duration_minutes INTEGER,
    total_questions INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX idx_simulations_discipline ON simulations(discipline);
CREATE INDEX idx_simulations_is_active ON simulations(is_active);
CREATE INDEX idx_simulations_created_by ON simulations(created_by);
CREATE INDEX idx_simulations_created_at ON simulations(created_at);

-- 4. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_simulations_updated_at
    BEFORE UPDATE ON simulations
    FOR EACH ROW
    EXECUTE FUNCTION update_simulations_updated_at();

-- 5. Configurar RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de segurança
CREATE POLICY "Users can view active simulations" ON simulations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all simulations" ON simulations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

-- 7. Verificar se foi criada
SELECT 'Tabela simulations criada com sucesso!' as status;
