-- ==============================================================================
-- Schéma Supabase pour l'application Pilule Tracker (PillFlow)
-- À exécuter dans la console Supabase (SQL Editor)
-- Ce script est 100% idempotent (peut être réexécuté sans erreur)
-- ==============================================================================

-- 1. Table des profils utilisateurs
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  timezone text default 'Europe/Paris',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Table des paramètres de la pilule et des rappels
create table if not exists public.pill_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  pill_name text default 'Ma Pilule',
  pill_type text default 'combined' check (pill_type in ('combined', 'progestin_12h', 'progestin_3h')),
  tolerance_hours integer default 12, -- 12h pour combinée/désogestrel, 3h pour progestative pure
  scheduled_time text default '20:00' not null, -- Format HH:mm (ex: '20:00')
  pack_active_days integer default 21 not null, -- Ex: 21 ou 24 ou 28
  pack_break_days integer default 7 not null,   -- Ex: 7 ou 4 ou 0 (si prise en continu)
  cycle_start_date date default current_date not null,
  reminders_enabled boolean default true not null,
  remind_at_pill_time boolean default true not null, -- Rappel à l'heure H
  remind_after_30m boolean default true not null,    -- Rappel à H + 30 min si non validé
  remind_after_60m boolean default true not null,    -- Rappel à H + 1h si non validé
  partner_email text,
  partner_notify_after_hours integer default 12,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Table du journal de prise de la pilule
create table if not exists public.pill_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null, -- Date du jour de la prise (YYYY-MM-DD)
  status text not null check (status in ('taken', 'delayed', 'missed', 'break_day', 'placebo_taken', 'placebo_skipped')),
  scheduled_at timestamp with time zone,
  taken_at timestamp with time zone,
  delay_minutes integer default 0,
  pill_number_in_pack integer, -- Numéro du comprimé sur la plaquette (1 à 21/28)
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- 4. Table du journal des symptômes et effets secondaires
create table if not exists public.symptom_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  mood text check (mood in ('great', 'good', 'neutral', 'sad', 'anxious', 'irritable')),
  bleeding text check (bleeding in ('none', 'spotting', 'light', 'medium', 'heavy')),
  symptoms jsonb default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- 5. Table des souscriptions Web Push
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Table de suivi des notifications envoyées pour éviter les doublons
create table if not exists public.sent_reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  reminder_type text not null check (reminder_type in ('initial', 'delay_30m', 'delay_60m', 'partner_alert')),
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date, reminder_type)
);

-- Activation de Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.pill_settings enable row level security;
alter table public.pill_logs enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.sent_reminders enable row level security;

-- Politiques RLS (nettoyage puis création propre)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can view own settings" on public.pill_settings;
drop policy if exists "Users can insert own settings" on public.pill_settings;
drop policy if exists "Users can update own settings" on public.pill_settings;
create policy "Users can view own settings" on public.pill_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.pill_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.pill_settings for update using (auth.uid() = user_id);

drop policy if exists "Users can view own pill logs" on public.pill_logs;
drop policy if exists "Users can insert own pill logs" on public.pill_logs;
drop policy if exists "Users can update own pill logs" on public.pill_logs;
drop policy if exists "Users can delete own pill logs" on public.pill_logs;
create policy "Users can view own pill logs" on public.pill_logs for select using (auth.uid() = user_id);
create policy "Users can insert own pill logs" on public.pill_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own pill logs" on public.pill_logs for update using (auth.uid() = user_id);
create policy "Users can delete own pill logs" on public.pill_logs for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own symptom logs" on public.symptom_logs;
drop policy if exists "Users can insert own symptom logs" on public.symptom_logs;
drop policy if exists "Users can update own symptom logs" on public.symptom_logs;
drop policy if exists "Users can delete own symptom logs" on public.symptom_logs;
create policy "Users can view own symptom logs" on public.symptom_logs for select using (auth.uid() = user_id);
create policy "Users can insert own symptom logs" on public.symptom_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own symptom logs" on public.symptom_logs for update using (auth.uid() = user_id);
create policy "Users can delete own symptom logs" on public.symptom_logs for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own subscriptions" on public.push_subscriptions;
drop policy if exists "Users can insert own subscriptions" on public.push_subscriptions;
drop policy if exists "Users can delete own subscriptions" on public.push_subscriptions;
create policy "Users can view own subscriptions" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on public.push_subscriptions for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own sent reminders" on public.sent_reminders;
drop policy if exists "Users can insert own sent reminders" on public.sent_reminders;
create policy "Users can view own sent reminders" on public.sent_reminders for select using (auth.uid() = user_id);
create policy "Users can insert own sent reminders" on public.sent_reminders for insert with check (auth.uid() = user_id);

-- Trigger automatique pour créer un profil et les réglages par défaut à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, timezone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'timezone', 'Europe/Paris')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      timezone = coalesce(excluded.timezone, public.profiles.timezone);

  insert into public.pill_settings (user_id, scheduled_time, pack_active_days, pack_break_days)
  values (new.id, '20:00', 21, 7)
  on conflict (user_id) do nothing;

  return new;
exception
  when others then
    -- Ne bloque jamais la création dans auth.users même en cas d'anomalie
    return new;
end;
$$ language plpgsql security definer;

-- Rattachement du trigger à auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
