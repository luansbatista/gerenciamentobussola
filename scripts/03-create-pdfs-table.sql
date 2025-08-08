-- Script corrigido para criar tabela de PDFs
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS discipline_pdfs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discipline VARCHAR(100) NOT NULL,
    subject VARCHAR(100),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_discipline_pdfs_discipline ON discipline_pdfs(discipline);
CREATE INDEX IF NOT EXISTS idx_discipline_pdfs_is_active ON discipline_pdfs(is_active);

-- 3. Habilitar RLS
ALTER TABLE discipline_pdfs ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "Users can view active PDFs" ON discipline_pdfs;
DROP POLICY IF EXISTS "Admins can manage all PDFs" ON discipline_pdfs;
DROP POLICY IF EXISTS "Admins can view all PDFs" ON discipline_pdfs;
DROP POLICY IF EXISTS "Admins can insert PDFs" ON discipline_pdfs;
DROP POLICY IF EXISTS "Admins can update PDFs" ON discipline_pdfs;
DROP POLICY IF EXISTS "Admins can delete PDFs" ON discipline_pdfs;

-- 5. Criar políticas básicas
CREATE POLICY "Users can view active PDFs" ON discipline_pdfs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all PDFs" ON discipline_pdfs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

-- 6. Criar função e trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_discipline_pdfs_updated_at ON discipline_pdfs;
CREATE TRIGGER update_discipline_pdfs_updated_at
    BEFORE UPDATE ON discipline_pdfs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir alguns dados de exemplo (opcional)
INSERT INTO discipline_pdfs (title, description, discipline, subject, file_name, file_url, file_size) VALUES
('Manual de Português', 'Material completo de português para concursos', 'Português', 'Gramática', 'manual-portugues.pdf', 'https://example.com/manual-portugues.pdf', 2048576),
('Apostila de Matemática', 'Conceitos fundamentais de matemática', 'Matemática', 'Álgebra', 'apostila-matematica.pdf', 'https://example.com/apostila-matematica.pdf', 1536000),
('Guia de Direito Constitucional', 'Princípios constitucionais básicos', 'Direito', 'Constitucional', 'guia-direito-constitucional.pdf', 'https://example.com/guia-direito.pdf', 3072000)
ON CONFLICT DO NOTHING;
