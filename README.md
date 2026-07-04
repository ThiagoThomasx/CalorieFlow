# CalorieFlow

App mobile-first de tracking nutricional. Registre calorias, macros, água e
atividades em menos de 20 segundos.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS 4 · React Router 7 ·
Framer Motion · Supabase (Auth + Postgres + RLS) · Lucide Icons

---

## Rodando localmente

Pré-requisito: Node.js 20+.

```bash
npm install
npm run dev
```

O app abre em `http://localhost:5173`.

Outros comandos:

```bash
npm run build     # build de produção (com checagem TypeScript)
npm run preview   # serve o build localmente
```

> Sem o `.env.local` configurado, o app abre normalmente mas mostra
> instruções de configuração na tela de login — auth e persistência
> exigem o Supabase.

---

## Criando o projeto Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New project**.
2. Escolha nome, senha do banco e região. Aguarde o provisionamento.
3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **Publishable (anon) key** — nunca use a Service Role no frontend.

## Executando o SQL

1. No painel do projeto, abra **SQL Editor → New query**.
2. Cole o conteúdo de [`supabase/init.sql`](supabase/init.sql) e clique em **Run**.
3. O script cria as tabelas `profiles`, `meal_logs`, `user_goals`,
   `daily_water` e `daily_activity`, habilita **Row Level Security** em todas
   (cada usuário só acessa os próprios dados) e instala um trigger que cria
   perfil + metas padrão automaticamente a cada novo cadastro.

O script é idempotente — pode ser executado mais de uma vez sem efeitos colaterais.

> Dica: em **Authentication → Providers → Email** você pode ativar/desativar a
> confirmação de e-mail. O app trata os dois casos: com confirmação exigida,
> mostra uma tela pedindo para verificar a caixa de entrada; sem confirmação,
> entra automaticamente após o cadastro.

## Configurando o ambiente

Crie um arquivo `.env.local` na raiz (baseado no `.env.example`):

```bash
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-publishable-key
```

Reinicie o `npm run dev` após criar/alterar o arquivo.

> **Nunca** commite o `.env.local`. Apenas o `.env.example` vai para o git.
> **Nunca** coloque a Service Role key no frontend.

---

## Deploy na Vercel

1. Faça push do repositório para o GitHub.
2. Na [Vercel](https://vercel.com), clique em **Add New → Project** e importe o repo.
3. A Vercel detecta Vite automaticamente (`npm run build`, output `dist/`).
4. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
5. Deploy. O `vercel.json` já cuida do rewrite de SPA para o React Router.
6. Em **Authentication → URL Configuration** no Supabase, adicione a URL do
   deploy como **Site URL** para os links de confirmação de e-mail funcionarem.

---

## Estrutura do projeto

```text
src/
├── components/
│   ├── layout/        # AppLayout, BottomNav, PageTransition
│   ├── nutrition/     # MacroBar, MealCard
│   └── ui/            # Button, GlassCard, ProgressRing, EmptyState, Toast,
│                      # Skeleton, ErrorState, SplashScreen, OfflineBanner
├── pages/             # Welcome, Auth, Home, Log, History, Goals, Profile
├── repositories/      # Meals, Goals, Water, Activity, Profile (Supabase)
├── routes/            # AppRoutes + guards (ProtectedRoute, PublicOnlyRoute)
├── state/             # AuthContext (sessão) + AppStateContext (dados)
├── hooks/             # useOnlineStatus
├── lib/
│   ├── supabase.ts    # client único + tradução de erros de auth
│   ├── nutrition.ts   # analisador mockado + contrato p/ futura IA
│   ├── constants.ts   # metas padrão, tamanho do copo
│   └── format.ts      # datas, horários e labels pt-BR
├── types/             # nutrition.ts (MealLog, UserGoals…) + user.ts (Profile)
├── App.tsx
├── index.css          # design tokens (Tailwind 4 @theme) + utilities
└── main.tsx

supabase/
└── init.sql           # schema completo + RLS + triggers (executar no painel)
```

## Decisões de arquitetura

- **Repositories**: todo acesso ao Supabase passa por `src/repositories/` —
  nenhuma tela fala com o banco diretamente. Trocar o backend significa trocar
  apenas essa camada.
- **AuthContext**: dono da sessão (restauração, login, cadastro, logout).
  A sessão é persistida pelo Supabase (localStorage) e sobrevive a refresh e
  reabertura do navegador.
- **AppStateContext**: sincroniza dados em memória com os repositories.
  Escritas de água/metas são otimistas com debounce; refeições persistem
  antes de atualizar a UI.
- **RLS como camada final de segurança**: mesmo que uma query esqueça o filtro
  por usuário, o Postgres bloqueia acesso a dados de terceiros.
- **Analisador nutricional**: `src/lib/nutrition.ts` expõe o tipo
  `NutritionAnalyzer` — a implementação atual é uma tabela mock local; na
  Sprint 3 basta trocar por uma chamada de IA mantendo a mesma assinatura.
