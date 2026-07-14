create table profiles (

id uuid primary key default gen_random_uuid(),

auth_id uuid references auth.users(id) on delete cascade,

full_name text not null,

email text not null,

avatar_url text,

age integer,

sex text,

role text not null default 'resident',

barangay text,

city text,

province text,

onboarding_completed boolean default false,

created_at timestamp with time zone default now(),

updated_at timestamp with time zone default now()

);

create table scans (

id uuid primary key default gen_random_uuid(),

user_id uuid references profiles(id) on delete cascade,

image_url text,

detected_object text,

material_type text,

confidence_score integer,

recommended_action jsonb,

barangay text,

created_at timestamp default now()

);

CREATE POLICY "Public can view profiles"
ON profiles
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can view approved partners"
ON profiles
FOR SELECT
TO anon
USING (
role IN ('school_partner','recycler_partner')
);

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
auth.uid() = auth_id
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
auth.uid() = auth_id
);

CREATE TYPE public.sex_enum AS ENUM (
    'male',
    'female',
    'prefer_not_to_say'
);

CREATE TYPE public.role_enum AS ENUM (
    'resident',
    'school_partner',
    'recycler_partner',
    'lgu_admin'
);

CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = auth_id
);


-- Create avatar storage bucket

insert into storage.buckets
(
id,
name,
public
)

values
(
'avatars',
'avatars',
true
);

create policy "Users can upload avatar"
on storage.objects
for insert
to authenticated
with check
(
bucket_id = 'avatars'
and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own avatar"
on storage.objects
for update
to authenticated
using
(
bucket_id = 'avatars'
and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Public can view avatars"
on storage.objects
for select
to public
using
(
bucket_id = 'avatars'
);

create policy "Users can delete own avatar"
on storage.objects
for delete
to authenticated
using
(
bucket_id = 'avatars'
and auth.uid()::text = (storage.foldername(name))[1]
);

alter table scans
add column estimated_weight numeric default 0;

alter table scans
add column estimated_value numeric default 0;

alter table scans
add column if not exists category text;
alter table scans
add column if not exists action_taken text;