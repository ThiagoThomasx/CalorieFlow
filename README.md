# CalorieFlow

App mobile-first de tracking nutricional. Registre calorias, macros, água e
atividades em menos de 20 segundos.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS 4 · React Router 7 ·
Framer Motion · Supabase (Auth + Postgres + RLS + Edge Functions) ·
Claude API (análise nutricional por IA) · Lucide Icons

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

## IA Nutricional (Edge Function)

> **💰 Custo externo:** a análise por IA usa a **Claude API da Anthropic, que é
> paga** (exige conta em [console.anthropic.com](https://console.anthropic.com)
> com créditos). Ordem de grandeza por análise: ~US$ 0,02 com o modelo padrão
> (`claude-opus-4-8`) ou ~US$ 0,004 com `claude-haiku-4-5`.
>
> **Sem custo nenhum:** se a Edge Function não estiver deployada (ou a secret
> não existir), o app continua 100% utilizável — a análise cai automaticamente
> para uma **estimativa local gratuita** (tabela offline de alimentos
> brasileiros), sinalizada na UI como "Estimativa local aproximada".

O registro de refeições usa IA real desde a Sprint 3. A arquitetura é:

```text
Frontend (NutritionService)
   ↓ JWT do usuário
Supabase Edge Function (nutrition-analysis)
   ↓ ANTHROPIC_API_KEY (secret — nunca chega ao navegador)
Claude API → JSON estruturado → validado → frontend
```

- **Nenhuma tela conhece a API de IA** — o `LogPage` só usa
  `analyzeMealWithAI` de `src/services/ai/NutritionService.ts`, que implementa
  o contrato `NutritionAnalyzer` de `src/lib/nutrition.ts`.
- **A API key nunca fica no frontend** — vive como secret da Edge Function.
- **Fallback local automático** — se a função responder 404/500/503 (não
  deployada, sem secret ou instável), `NutritionService` usa
  `src/services/ai/localAnalyzer.ts` (estimativa offline, confiança 30%,
  `model: "local-fallback"` gravado no histórico). Erros semânticos (texto
  inválido, sessão expirada, rate limit) continuam sendo mostrados ao usuário.

### Arquivos da função

```text
supabase/functions/nutrition-analysis/
├── index.ts      # handler: CORS, auth (JWT), orquestração, logs, erros
├── prompt.ts     # system prompt + JSON Schema (structured outputs)
├── types.ts      # contratos da resposta + PARSER_VERSION
├── parser.ts     # resposta da IA → objetos internos (totais recalculados)
└── validator.ts  # estrutura, campos obrigatórios, coerência de macros
```

### Deploy da função

Pré-requisito: [Supabase CLI](https://supabase.com/docs/guides/cli) logada
(`supabase login`) e vinculada ao projeto (`supabase link --project-ref SEU_REF`).

```bash
# 1. Configure a secret com a chave da Anthropic (console.anthropic.com)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 2. (Opcional) escolha outro modelo — padrão: claude-opus-4-8
supabase secrets set NUTRITION_MODEL=claude-haiku-4-5

# 3. Deploy
supabase functions deploy nutrition-analysis
```

A função exige JWT válido (verify_jwt ativo por padrão) **e** revalida o
usuário internamente via `auth.getUser()`.

### Testando a função direto (curl)

```bash
curl -X POST "https://SEU-PROJETO.supabase.co/functions/v1/nutrition-analysis" \
  -H "Authorization: Bearer TOKEN_DE_ACESSO_DO_USUARIO" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"2 ovos, 100g de arroz e uma banana"}'
```

Resposta esperada: `{ "items": [...], "totals": {...}, "confidence": 0.9, "meta": {...} }`.

### Como trocar de modelo ou provedor de IA

- **Trocar o modelo (mesmo provedor):** `supabase secrets set NUTRITION_MODEL=...`
  e redeploy — nenhum código muda.
- **Trocar o provedor (OpenAI, Gemini…):** edite apenas
  `supabase/functions/nutrition-analysis/index.ts` (a chamada ao SDK) e, se o
  novo provedor não suportar JSON Schema, ajuste `prompt.ts` para pedir o JSON
  no prompt. `parser.ts` já tolera respostas com cercas de código, e
  `validator.ts` garante o contrato. **O frontend não muda em nada.**

### Histórico para evolução da IA

Cada refeição salva grava em `meal_logs.analysis_json`: texto original
(`sourceText`), itens e totais retornados, `confidence`, `parserVersion`,
`model` e `analyzedAt` — base para comparar versões de prompt/modelo no futuro.

### Logs e observabilidade

A função emite logs estruturados (JSON) sem dados sensíveis — duração,
contagem de itens, confidence e tokens. Veja em
**Edge Functions → nutrition-analysis → Logs** no painel do Supabase.

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
├── services/
│   └── ai/            # NutritionService — única porta p/ a Edge Function de IA
├── state/             # AuthContext (sessão) + AppStateContext (dados)
├── hooks/             # useOnlineStatus
├── lib/
│   ├── supabase.ts    # client único + tradução de erros de auth
│   ├── nutrition.ts   # contrato NutritionAnalyzer + edição de análises
│   ├── constants.ts   # metas padrão, tamanho do copo
│   └── format.ts      # datas, horários e labels pt-BR
├── types/             # nutrition.ts (MealLog, UserGoals…) + user.ts (Profile)
├── App.tsx
├── index.css          # design tokens (Tailwind 4 @theme) + utilities
└── main.tsx

supabase/
├── init.sql           # schema completo + RLS + triggers (executar no painel)
└── functions/
    └── nutrition-analysis/   # Edge Function de análise nutricional por IA
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
  `NutritionAnalyzer`; a implementação real é `analyzeMealWithAI`
  (`src/services/ai/NutritionService.ts`), que chama a Edge Function
  `nutrition-analysis`. Novas fontes (foto, voz) implementam o mesmo contrato.
- **IA isolada no backend**: a chave do provedor de IA é secret da Edge
  Function; trocar de modelo é uma env var, trocar de provedor é editar um
  único arquivo no backend.
