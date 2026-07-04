-- ============================================================
-- CalorieFlow — Sprint 2 · Schema inicial + RLS
--
-- Como executar:
--   1. Abra o painel do projeto no Supabase (https://supabase.com/dashboard)
--   2. Vá em "SQL Editor" → "New query"
--   3. Cole este arquivo inteiro e clique em "Run"
--
-- O script é idempotente: pode ser executado mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- Função utilitária: mantém updated_at sempre atualizado
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles — dados públicos do usuário (1:1 com auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  avatar_url text
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- meal_logs — refeições registradas
-- ------------------------------------------------------------
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  description text not null default '',
  analysis_json jsonb,
  calories integer not null default 0 check (calories >= 0),
  protein integer not null default 0 check (protein >= 0),
  carbs integer not null default 0 check (carbs >= 0),
  fat integer not null default 0 check (fat >= 0),
  fiber integer not null default 0 check (fiber >= 0),
  sodium integer not null default 0 check (sodium >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_logs_user_created_idx
  on public.meal_logs (user_id, created_at desc);

alter table public.meal_logs enable row level security;

drop policy if exists "meal_logs_select_own" on public.meal_logs;
create policy "meal_logs_select_own"
  on public.meal_logs for select
  using (auth.uid() = user_id);

drop policy if exists "meal_logs_insert_own" on public.meal_logs;
create policy "meal_logs_insert_own"
  on public.meal_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "meal_logs_update_own" on public.meal_logs;
create policy "meal_logs_update_own"
  on public.meal_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "meal_logs_delete_own" on public.meal_logs;
create policy "meal_logs_delete_own"
  on public.meal_logs for delete
  using (auth.uid() = user_id);

drop trigger if exists meal_logs_set_updated_at on public.meal_logs;
create trigger meal_logs_set_updated_at
  before update on public.meal_logs
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- user_goals — metas diárias (1 linha por usuário)
-- ------------------------------------------------------------
create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  calories_goal integer not null default 2400 check (calories_goal > 0),
  protein_goal integer not null default 160 check (protein_goal > 0),
  carbs_goal integer not null default 260 check (carbs_goal > 0),
  fat_goal integer not null default 75 check (fat_goal > 0),
  water_goal_ml integer not null default 3000 check (water_goal_ml > 0),
  objective text not null default 'maintain'
    check (objective in ('lose_fat', 'maintain', 'gain_muscle')),
  updated_at timestamptz not null default now()
);

alter table public.user_goals enable row level security;

drop policy if exists "user_goals_select_own" on public.user_goals;
create policy "user_goals_select_own"
  on public.user_goals for select
  using (auth.uid() = user_id);

drop policy if exists "user_goals_insert_own" on public.user_goals;
create policy "user_goals_insert_own"
  on public.user_goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_goals_update_own" on public.user_goals;
create policy "user_goals_update_own"
  on public.user_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_goals_delete_own" on public.user_goals;
create policy "user_goals_delete_own"
  on public.user_goals for delete
  using (auth.uid() = user_id);

drop trigger if exists user_goals_set_updated_at on public.user_goals;
create trigger user_goals_set_updated_at
  before update on public.user_goals
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- daily_water — hidratação acumulada por dia (1 linha por dia)
-- ------------------------------------------------------------
create table if not exists public.daily_water (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  water_ml integer not null default 0 check (water_ml >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.daily_water enable row level security;

drop policy if exists "daily_water_select_own" on public.daily_water;
create policy "daily_water_select_own"
  on public.daily_water for select
  using (auth.uid() = user_id);

drop policy if exists "daily_water_insert_own" on public.daily_water;
create policy "daily_water_insert_own"
  on public.daily_water for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_water_update_own" on public.daily_water;
create policy "daily_water_update_own"
  on public.daily_water for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_water_delete_own" on public.daily_water;
create policy "daily_water_delete_own"
  on public.daily_water for delete
  using (auth.uid() = user_id);

drop trigger if exists daily_water_set_updated_at on public.daily_water;
create trigger daily_water_set_updated_at
  before update on public.daily_water
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- daily_activity — atividade física por dia (1 linha por dia)
-- ------------------------------------------------------------
create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  minutes integer not null default 0 check (minutes >= 0),
  calories_burned integer not null default 0 check (calories_burned >= 0),
  type text,
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.daily_activity enable row level security;

drop policy if exists "daily_activity_select_own" on public.daily_activity;
create policy "daily_activity_select_own"
  on public.daily_activity for select
  using (auth.uid() = user_id);

drop policy if exists "daily_activity_insert_own" on public.daily_activity;
create policy "daily_activity_insert_own"
  on public.daily_activity for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_activity_update_own" on public.daily_activity;
create policy "daily_activity_update_own"
  on public.daily_activity for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_activity_delete_own" on public.daily_activity;
create policy "daily_activity_delete_own"
  on public.daily_activity for delete
  using (auth.uid() = user_id);

drop trigger if exists daily_activity_set_updated_at on public.daily_activity;
create trigger daily_activity_set_updated_at
  before update on public.daily_activity
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Bootstrap automático: ao criar usuário no Auth,
-- cria profile + metas padrão.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into public.user_goals (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
