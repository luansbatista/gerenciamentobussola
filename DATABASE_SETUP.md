# 🗄️ Configuração do Banco de Dados - Bússola da Aprovação PMBA

## ✅ Status Atual
- ✅ Scripts SQL encontrados
- ✅ Estrutura do banco definida
- ⏳ Banco de dados precisa ser configurado

## 🔧 Passo a Passo para Configurar o Banco

### 1. Criar Projeto no Supabase

1. **Acesse** [supabase.com](https://supabase.com)
2. **Faça login** ou crie uma conta
3. **Clique em "New Project"**
4. **Configure o projeto**:
   - **Nome**: `bussola-pmba`
   - **Senha do banco**: Escolha uma senha forte
   - **Região**: São Paulo (recomendado)
5. **Clique em "Create new project"**
6. **Aguarde** 2-3 minutos para o projeto ser criado

### 2. Obter Credenciais

1. **Vá em Settings** (ícone de engrenagem) → **API**
2. **Copie as credenciais**:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Executar Scripts SQL

#### 4.1 Acessar o SQL Editor

1. **No Supabase Dashboard**, clique em **"SQL Editor"** no menu lateral
2. **Clique em "New query"**

#### 4.2 Executar Scripts na Ordem

**Execute os scripts na seguinte ordem:**

1. **`create-tables.sql`** - Tabelas principais
2. **`create-questions-table.sql`** - Tabela de questões
3. **`create-simulations-tables.sql`** - Tabelas de simulados
4. **`create-flashcards-table.sql`** - Tabela de flashcards
5. **`create-user-subject-progress-table.sql`** - Progresso por assunto
6. **`add-is-admin-to-profiles.sql`** - Coluna de admin

### 5. Verificar Configuração

#### 5.1 Verificar Tabelas Criadas

No SQL Editor, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Tabelas esperadas:**
- `profiles`
- `study_sessions`
- `questions`
- `simulations`
- `simulation_questions`
- `user_simulation_attempts`
- `user_question_answers`
- `flashcards`
- `user_subject_progress`

#### 5.2 Verificar Políticas RLS

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

### 6. Testar o Sistema

#### 6.1 Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm run dev
```

#### 6.2 Acessar o Sistema

1. **Abra** `http://localhost:3000`
2. **Crie uma conta** ou faça login
3. **Teste as funcionalidades**:
   - Dashboard
   - Lançamentos
   - Banco de questões
   - Simulados

## 🚨 Troubleshooting

### Erro: "relation does not exist"
- Verifique se os scripts SQL foram executados
- Confirme se as tabelas foram criadas

### Erro: "permission denied"
- Verifique se as políticas RLS estão configuradas
- Confirme se o usuário tem permissões

### Erro: "invalid API key"
- Verifique se as credenciais estão corretas
- Confirme se o projeto está ativo

## 📊 Estrutura do Banco

### Tabelas Principais

1. **`profiles`** - Perfis de usuários
2. **`study_sessions`** - Sessões de estudo
3. **`questions`** - Banco de questões
4. **`simulations`** - Simulados
5. **`flashcards`** - Flashcards
6. **`user_subject_progress`** - Progresso por assunto

### Relacionamentos

- `profiles` ↔ `study_sessions` (1:N)
- `simulations` ↔ `questions` (N:N via `simulation_questions`)
- `users` ↔ `simulation_attempts` (1:N)
- `users` ↔ `flashcards` (1:N)

## 🎯 Próximos Passos

Após a configuração:
1. **Teste todas as funcionalidades**
2. **Adicione questões** via painel admin
3. **Crie simulados** para teste
4. **Configure flashcards**
5. **Monitore o desempenho**

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todos os scripts foram executados
2. Confirme se as políticas RLS estão ativas
3. Teste a conexão com o Supabase
4. Consulte os logs do console

**Boa sorte! 🚀**
