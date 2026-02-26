-- CRM AM Consultoria IA
-- Schema base para Supabase (PostgreSQL + Auth + RLS)

create extension if not exists pgcrypto;

-- Perfis vinculados ao auth.users
create table if not exists public.crm_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null,
  role text not null check (role in ('dono', 'operador', 'cliente')),
  cliente_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text,
  contato text,
  email text,
  telefone text,
  status text check (status in ('ativo', 'lead', 'churn_risk', 'inativo')) default 'lead',
  servicos text[] not null default '{}',
  mrr numeric(12,2) not null default 0,
  desde date,
  satisfacao numeric(3,2),
  cidade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_projetos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cliente_id uuid not null references public.crm_clientes(id) on delete cascade,
  status text check (status in ('backlog', 'em_progresso', 'revisao', 'concluido')) default 'backlog',
  prioridade text check (prioridade in ('baixa', 'media', 'alta', 'critica')) default 'media',
  tipo text,
  responsavel text,
  prazo date,
  progresso int not null default 0 check (progresso between 0 and 100),
  descricao text,
  tarefas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_tickets (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cliente_id uuid not null references public.crm_clientes(id) on delete cascade,
  status text check (status in ('aberto', 'em_andamento', 'resolvido')) default 'aberto',
  prioridade text check (prioridade in ('baixa', 'media', 'alta', 'critica')) default 'media',
  tipo text,
  responsavel text,
  criado date not null default current_date,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_contratos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cliente_id uuid not null references public.crm_clientes(id) on delete cascade,
  tipo text,
  inicio date,
  fim date,
  valor_mensal numeric(12,2) not null default 0,
  sla_horas int,
  multa_rescisao_pct numeric(5,2),
  reajuste text,
  clausula_lgpd boolean not null default false,
  renovacao_automatica boolean not null default false,
  escopo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_interacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.crm_clientes(id) on delete cascade,
  tipo text not null,
  desc text not null,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

-- Vincula profile.role=cliente ao cliente_id
alter table public.crm_profiles
  add constraint crm_profiles_cliente_fk
  foreign key (cliente_id) references public.crm_clientes(id) on delete set null;

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.crm_profiles;
create trigger trg_profiles_updated_at before update on public.crm_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_clientes_updated_at on public.crm_clientes;
create trigger trg_clientes_updated_at before update on public.crm_clientes
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_projetos_updated_at on public.crm_projetos;
create trigger trg_projetos_updated_at before update on public.crm_projetos
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_tickets_updated_at on public.crm_tickets;
create trigger trg_tickets_updated_at before update on public.crm_tickets
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_contratos_updated_at on public.crm_contratos;
create trigger trg_contratos_updated_at before update on public.crm_contratos
for each row execute procedure public.set_updated_at();

-- Helpers de autorizacao
create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.crm_profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_user_cliente_id()
returns uuid
language sql
stable
as $$
  select cliente_id from public.crm_profiles where user_id = auth.uid() limit 1;
$$;

-- RLS
alter table public.crm_profiles enable row level security;
alter table public.crm_clientes enable row level security;
alter table public.crm_projetos enable row level security;
alter table public.crm_tickets enable row level security;
alter table public.crm_contratos enable row level security;
alter table public.crm_interacoes enable row level security;

-- Perfis: usuario ve/edita o proprio perfil
drop policy if exists profiles_select_own on public.crm_profiles;
create policy profiles_select_own on public.crm_profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists profiles_update_own on public.crm_profiles;
create policy profiles_update_own on public.crm_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists profiles_insert_own on public.crm_profiles;
create policy profiles_insert_own on public.crm_profiles
for insert to authenticated
with check (user_id = auth.uid());

-- Dono/Operador podem ver tudo; Cliente ve apenas seu proprio registro
drop policy if exists clientes_select on public.crm_clientes;
create policy clientes_select on public.crm_clientes
for select to authenticated
using (
  public.current_user_role() in ('dono', 'operador')
  or id = public.current_user_cliente_id()
);

drop policy if exists clientes_mutation_staff on public.crm_clientes;
create policy clientes_mutation_staff on public.crm_clientes
for all to authenticated
using (public.current_user_role() in ('dono', 'operador'))
with check (public.current_user_role() in ('dono', 'operador'));

drop policy if exists projetos_select on public.crm_projetos;
create policy projetos_select on public.crm_projetos
for select to authenticated
using (
  public.current_user_role() in ('dono', 'operador')
  or cliente_id = public.current_user_cliente_id()
);

drop policy if exists projetos_mutation_staff on public.crm_projetos;
create policy projetos_mutation_staff on public.crm_projetos
for all to authenticated
using (public.current_user_role() in ('dono', 'operador'))
with check (public.current_user_role() in ('dono', 'operador'));

drop policy if exists tickets_select on public.crm_tickets;
create policy tickets_select on public.crm_tickets
for select to authenticated
using (
  public.current_user_role() in ('dono', 'operador')
  or cliente_id = public.current_user_cliente_id()
);

drop policy if exists tickets_mutation_staff on public.crm_tickets;
create policy tickets_mutation_staff on public.crm_tickets
for all to authenticated
using (public.current_user_role() in ('dono', 'operador'))
with check (public.current_user_role() in ('dono', 'operador'));

drop policy if exists contratos_select on public.crm_contratos;
create policy contratos_select on public.crm_contratos
for select to authenticated
using (
  public.current_user_role() in ('dono', 'operador')
  or cliente_id = public.current_user_cliente_id()
);

drop policy if exists contratos_mutation_staff on public.crm_contratos;
create policy contratos_mutation_staff on public.crm_contratos
for all to authenticated
using (public.current_user_role() in ('dono', 'operador'))
with check (public.current_user_role() in ('dono', 'operador'));

drop policy if exists interacoes_select on public.crm_interacoes;
create policy interacoes_select on public.crm_interacoes
for select to authenticated
using (
  public.current_user_role() in ('dono', 'operador')
  or cliente_id = public.current_user_cliente_id()
);

drop policy if exists interacoes_mutation_staff on public.crm_interacoes;
create policy interacoes_mutation_staff on public.crm_interacoes
for all to authenticated
using (public.current_user_role() in ('dono', 'operador'))
with check (public.current_user_role() in ('dono', 'operador'));
