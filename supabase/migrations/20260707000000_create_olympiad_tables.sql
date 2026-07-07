-- Migration to create tables for the AI Olympiad Registration System

-- Tabela de Inscrições
create table if not exists olympiad_registrations (
  id bigint primary key generated always as identity,
  full_name text not null,
  class_name text not null,
  phone text not null,
  school_year text not null,
  created_at timestamp with time zone default now()
);

-- Tabela de Configurações do Sistema
create table if not exists olympiad_settings (
  key text primary key,
  value text not null
);

-- Inserir status padrão aberto (se não existir)
insert into olympiad_settings (key, value)
values ('registrations_open', 'true')
on conflict (key) do nothing;

-- Habilitar RLS (Row Level Security) nas tabelas
alter table olympiad_registrations enable row level security;
alter table olympiad_settings enable row level security;

-- Criar políticas de acesso públicas para simplificar
create policy "Acesso público para inserção de inscrições" 
on olympiad_registrations 
for insert 
with check (true);

create policy "Acesso público para leitura de inscrições" 
on olympiad_registrations 
for select 
using (true);

create policy "Acesso público para gerenciar configurações" 
on olympiad_settings 
for all 
using (true);
