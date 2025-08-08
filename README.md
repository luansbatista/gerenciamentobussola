# Bússola da Aprovação - PMBA

Plataforma profissional para preparação em concursos policiais.

## 🚀 Deploy na Netlify

### Pré-requisitos
- Conta na Netlify
- Repositório no GitHub/GitLab
- Variáveis de ambiente configuradas

### Passos para Deploy

1. **Faça push do código para o GitHub:**
```bash
git add .
git commit -m "Preparando para deploy na Netlify"
git push origin main
```

2. **Configure as variáveis de ambiente na Netlify:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Conecte o repositório na Netlify:**
   - Acesse [netlify.com](https://netlify.com)
   - Clique em "New site from Git"
   - Selecione seu repositório
   - Configure as variáveis de ambiente
   - Deploy!

### Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento local
npm run build    # Build para produção
npm run start    # Iniciar servidor de produção
npm run lint     # Verificar código
```

## 📋 Funcionalidades

- ✅ Dashboard unificado com estatísticas
- ✅ Sistema de simulados (usuário + admin)
- ✅ Sistema de PDFs (usuário + admin)
- ✅ Banco de questões com prática
- ✅ Sistema de revisões com agendamento
- ✅ Flashcards para memorização
- ✅ Ranking global de usuários
- ✅ Exportação de dados para Excel
- ✅ Configurações personalizáveis

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React 19, TypeScript
- **UI:** Tailwind CSS, Shadcn/ui, Lucide React
- **Backend:** Supabase (Auth, Database, Storage)
- **Deploy:** Netlify

## 📝 Licença

Este projeto é privado e desenvolvido para uso específico.

