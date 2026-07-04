# CalorieFlow

App mobile-first de tracking nutricional. Registre calorias, macros, água e
atividades em menos de 20 segundos.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS 4 · React Router 7 ·
Framer Motion · Supabase (preparado) · Lucide Icons

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

> O app funciona **sem nenhuma variável de ambiente** — nesse caso roda em
> modo demonstração, com autenticação mockada e dados locais.

---

## Configurando o Supabase (opcional nesta sprint)

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
3. Crie um arquivo `.env.local` na raiz (baseado no `.env.example`):

```bash
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

4. Reinicie o `npm run dev`.

O status da conexão aparece na tela **Perfil**. Quando configurado, o
login/registro por e-mail e senha passam a usar o Supabase Auth de verdade.
As tabelas do banco (refeições, metas, etc.) serão criadas na Sprint 2.

> **Nunca** commite o `.env.local`. Apenas o `.env.example` vai para o git.

---

## Deploy na Vercel

1. Faça push do repositório para o GitHub.
2. Na [Vercel](https://vercel.com), clique em **Add New → Project** e importe o repo.
3. A Vercel detecta Vite automaticamente (`npm run build`, output `dist/`).
4. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (se já tiver o Supabase configurado).
5. Deploy. O `vercel.json` já cuida do rewrite de SPA para o React Router.

---

## Estrutura do projeto

```text
src/
├── components/
│   ├── layout/        # AppLayout, BottomNav, PageTransition
│   ├── nutrition/     # MacroBar, MealCard
│   └── ui/            # Button, GlassCard, ProgressRing, EmptyState, Toast
├── pages/             # Welcome, Auth, Home, Log, History, Goals, Profile
├── lib/
│   ├── supabase.ts    # client + helpers de auth (seguro sem envs)
│   ├── nutrition.ts   # analisador mockado + contrato p/ futura IA
│   ├── mockData.ts    # dados de demonstração
│   └── format.ts      # datas, horários e labels pt-BR
├── state/             # AppStateContext (refeições, metas, água, toast)
├── types/             # MealLog, DailySummary, UserGoals, NutritionAnalysis
├── routes/            # AppRoutes
├── App.tsx
├── index.css          # design tokens (Tailwind 4 @theme) + utilities
└── main.tsx
```

## Decisões de arquitetura

- **Analisador nutricional**: `src/lib/nutrition.ts` expõe o tipo
  `NutritionAnalyzer` — a implementação atual é uma tabela mock local; na
  Sprint 2 basta trocar por uma chamada de IA mantendo a mesma assinatura.
- **Supabase opcional**: `src/lib/supabase.ts` retorna `null` quando as envs
  não existem e todos os helpers têm fallback mock. O app nunca quebra.
- **Estado local**: um único `AppStateContext` (React Context) guarda
  refeições, metas e água. Simples de migrar para Supabase depois.
