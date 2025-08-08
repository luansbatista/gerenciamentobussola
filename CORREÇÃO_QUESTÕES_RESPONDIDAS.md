# Correção: Questões Respondidas não Aparecem no Dashboard

## Problema Identificado

As questões respondidas no banco de questões não estão aparecendo no dashboard de lançamentos devido a problemas na estrutura do banco de dados.

## Causas do Problema

1. **Chave Estrangeira Incorreta**: A tabela `study_sessions` estava referenciando `profiles(id)` em vez de `auth.users(id)`
2. **Constraint Restritiva**: A constraint `study_time_minutes > 0` estava impedindo inserções quando o tempo de resposta era muito rápido
3. **Políticas RLS**: Possíveis problemas nas políticas de Row Level Security

## Solução

### Passo 1: Executar o Script de Correção

Execute o script SQL `scripts/fix-question-answers-robust.sql` no seu banco de dados Supabase:

1. Acesse o painel do Supabase
2. Vá para a seção "SQL Editor"
3. Cole o conteúdo do arquivo `scripts/fix-question-answers-robust.sql`
4. Execute o script

**Nota**: Este script é mais robusto e verifica se as constraints já existem antes de tentar criá-las, evitando erros como "constraint already exists".

### Passo 2: Verificar se a Correção Funcionou

Após executar o script, teste o sistema:

1. Acesse o banco de questões
2. Responda algumas questões
3. Vá para o dashboard de lançamentos
4. Verifique se as questões respondidas aparecem nas estatísticas

## O que o Script Corrige

### 1. Chave Estrangeira
- Remove a chave estrangeira que referencia `profiles(id)`
- Adiciona chave estrangeira que referencia `auth.users(id)`

### 2. Constraint de Tempo
- Remove a constraint `study_time_minutes > 0`
- Adiciona constraint `study_time_minutes >= 0`

### 3. Políticas RLS
- Recria todas as políticas de Row Level Security
- Garante que usuários podem inserir/visualizar seus próprios dados

### 4. Índices de Performance
- Cria índices para melhorar a performance das consultas

## Código Corrigido

Também foi corrigido o código JavaScript para garantir um tempo mínimo de 1 minuto:

```typescript
// Antes
const minutesToAdd = Math.max(0, Math.round(seconds / 60))

// Depois  
const minutesToAdd = Math.max(1, Math.round(seconds / 60)) // Mínimo de 1 minuto
```

## Verificação

Após aplicar as correções, você pode verificar se tudo está funcionando:

1. **Teste de Resposta**: Responda uma questão no banco de questões
2. **Verificação do Dashboard**: Vá para o dashboard e veja se a sessão aparece
3. **Logs do Console**: Verifique se não há erros no console do navegador

## Se o Problema Persistir

Se após executar o script o problema ainda persistir:

1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase
3. Execute o script de verificação `scripts/verify-database.sql`
4. Entre em contato com o suporte técnico

## Arquivos Modificados

- `app/actions/question-answers.ts` - Corrigido cálculo de tempo mínimo
- `scripts/fix-question-answers-robust.sql` - Script robusto de correção do banco
- `CORREÇÃO_QUESTÕES_RESPONDIDAS.md` - Este arquivo de instruções

## Status

✅ **Problema identificado**  
✅ **Script de correção criado**  
✅ **Código JavaScript corrigido**  
⏳ **Aguardando execução do script no banco de dados**
