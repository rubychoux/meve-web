-- MEVE · partners 신청폼 백엔드
-- Supabase 프로젝트: auyqgcppbrhjthvkkwwb (meve-app과 동일)
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('clinic','brand','creator','retail')),
  company text not null check (char_length(company) between 1 and 200),
  contact_name text not null check (char_length(contact_name) between 1 and 100),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 255),
  phone text check (phone is null or char_length(phone) <= 40),
  website text check (website is null or char_length(website) <= 300),
  message text not null check (char_length(message) between 1 and 5000),
  source text default 'meve.beauty/partners',
  status text not null default 'new' check (status in ('new','reviewing','replied','onboarded','declined')),
  created_at timestamptz not null default now()
);

alter table public.partner_applications enable row level security;

-- 익명 방문자는 신청서 제출(insert)만 가능. 조회/수정/삭제 불가.
create policy "anon can submit partner application"
  on public.partner_applications
  for insert
  to anon
  with check (true);

-- 신청서 확인은 Supabase Dashboard(Table Editor)에서.
