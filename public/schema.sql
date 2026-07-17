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

create policy "Users can upload their own scan images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'trashure-images'
  AND
  (storage.foldername(name))[1] = 'scans'
  AND
  (storage.foldername(name))[2] = auth.uid()::text
);


create policy "Users can view their own scan images"
on storage.objects
for select
to authenticated
using (

bucket_id = 'trashure-images'

AND

(
(storage.foldername(name))[2] = auth.uid()::text
)

);

create policy "Public can view Trashure images"
on storage.objects
for select
to public
using (

bucket_id = 'trashure-images'

);

create policy "Users can delete their own scan images"
on storage.objects
for delete
to authenticated
using (

bucket_id = 'trashure-images'

AND

(storage.foldername(name))[2] = auth.uid()::text

);

create policy "Users can update their own scan images"
on storage.objects
for update
to authenticated
using (

bucket_id = 'trashure-images'

AND

(storage.foldername(name))[2] = auth.uid()::text

);

create table public.ai_usage_logs (

id uuid primary key default gen_random_uuid(),

user_id uuid references profiles(id),

created_at timestamptz default now()

);


---------------07/16/2026-----------

create table public.materials (
  id uuid primary key default gen_random_uuid(),

  material_name text not null unique,
  category text not null,

  recyclable boolean not null default false,

  reuse_options text[] default '{}',
  donation_options text[] default '{}',

  selling_information text,
  recycling_process text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.materials (
  material_name,
  category,
  recyclable,
  reuse_options,
  donation_options,
  selling_information,
  recycling_process
)
values
(
  'PET Plastic Bottle',
  'Plastic',
  true,
  array[
    'Plant container',
    'Storage container',
    'Eco-brick project'
  ],
  array[
    'School sustainability projects',
    'Community garden projects'
  ],
  'Can be sold to participating junkshops by kilogram.',
  'Clean, dry, remove remaining liquid, and separate the bottle cap.'
),
(
  'Cardboard',
  'Paper',
  true,
  array[
    'Storage organizer',
    'School art materials'
  ],
  array[
    'School projects',
    'Community workshops'
  ],
  'Can be sold when clean and dry.',
  'Flatten and keep away from water or food contamination.'
),
(
  'Aluminum Can',
  'Metal',
  true,
  array[
    'Craft projects',
    'Decorative containers'
  ],
  array[
    'School art projects'
  ],
  'Aluminum usually has a higher recycling value than ordinary tin cans.',
  'Empty, rinse, dry, and separate from other metals.'
);

create table public.junkshops (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null unique
    references public.profiles(id)
    on delete cascade,

  junkshop_name text not null,
  description text,

  photo_url text,

  address_line text not null,
  barangay text,
  city text,
  province text,
  postal_code text,

  latitude numeric(9,6),
  longitude numeric(9,6),

  contact_number text,
  contact_email text,

  operating_hours jsonb default '{}'::jsonb,

  verification_status text not null default 'pending'
    check (
      verification_status in (
        'pending',
        'approved',
        'rejected',
        'suspended'
      )
    ),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.junkshop_materials (
  id uuid primary key default gen_random_uuid(),

  junkshop_id uuid not null
    references public.junkshops(id)
    on delete cascade,

  material_id uuid not null
    references public.materials(id)
    on delete restrict,

  price_per_kg numeric(10,2) not null default 0
    check (price_per_kg >= 0),

  minimum_weight_kg numeric(10,2) not null default 0
    check (minimum_weight_kg >= 0),

  accepted_condition text,
  preparation_instructions text,

  is_accepting boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (junkshop_id, material_id)
);

create table public.school_partners (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null unique
    references public.profiles(id)
    on delete cascade,

  organization_name text not null,

  organization_type text not null default 'school'
    check (
      organization_type in (
        'school',
        'community',
        'nonprofit',
        'other'
      )
    ),

  description text,
  project_description text,

  photo_url text,

  address_line text not null,
  barangay text,
  city text,
  province text,
  postal_code text,

  latitude numeric(9,6),
  longitude numeric(9,6),

  contact_person text,
  contact_number text,
  contact_email text,

  verification_status text not null default 'pending'
    check (
      verification_status in (
        'pending',
        'approved',
        'rejected',
        'suspended'
      )
    ),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table public.school_material_requests (
  id uuid primary key default gen_random_uuid(),

  school_partner_id uuid not null
    references public.school_partners(id)
    on delete cascade,

  material_id uuid not null
    references public.materials(id)
    on delete restrict,

  request_title text not null,
  description text,

  quantity_needed numeric(10,2) not null
    check (quantity_needed > 0),

  quantity_received numeric(10,2) not null default 0
    check (quantity_received >= 0),

  unit text not null default 'kg',

  required_condition text,
  intended_use text,

  needed_by date,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'open',
        'partially_fulfilled',
        'fulfilled',
        'cancelled'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (quantity_received <= quantity_needed)
);

create index junkshops_location_index
on public.junkshops (barangay, city, province);

create index junkshops_status_index
on public.junkshops (verification_status, is_active);

create index junkshop_materials_material_index
on public.junkshop_materials (material_id, is_accepting);

create index school_partners_location_index
on public.school_partners (barangay, city, province);

create index school_requests_material_index
on public.school_material_requests (material_id, status);


create policy "Anyone can view materials"
on public.materials
for select
to anon, authenticated
using (true);

create policy "Recycler can create own junkshop"
on public.junkshops
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = junkshops.profile_id
      and profiles.auth_id = auth.uid()
      and profiles.role = 'recycler_partner'
  )
);

create policy "Recycler can view own junkshop"
on public.junkshops
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = junkshops.profile_id
      and profiles.auth_id = auth.uid()
  )
);

create policy "Recycler can update own junkshop"
on public.junkshops
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = junkshops.profile_id
      and profiles.auth_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = junkshops.profile_id
      and profiles.auth_id = auth.uid()
      and profiles.role = 'recycler_partner'
  )
);

create policy "School can create own organization"
on public.school_partners
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = school_partners.profile_id
      and profiles.auth_id = auth.uid()
      and profiles.role = 'school_partner'
  )
);

create policy "School can view own organization"
on public.school_partners
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = school_partners.profile_id
      and profiles.auth_id = auth.uid()
  )
);

create policy "School can update own organization"
on public.school_partners
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = school_partners.profile_id
      and profiles.auth_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = school_partners.profile_id
      and profiles.auth_id = auth.uid()
      and profiles.role = 'school_partner'
  )
);

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'partner-images',
  'partner-images',
  true
)
on conflict (id) do nothing;


alter table public.junkshop_materials
enable row level security;

create policy "Recycler can insert own materials"
on public.junkshop_materials
for insert
to authenticated
with check (
  exists (
    select 1
    from public.junkshops
    join public.profiles
      on profiles.id = junkshops.profile_id
    where junkshops.id =
      junkshop_materials.junkshop_id
      and profiles.auth_id = auth.uid()
      and profiles.role = 'recycler_partner'
  )
);

create policy "Recycler can view own materials"
on public.junkshop_materials
for select
to authenticated
using (
  exists (
    select 1
    from public.junkshops
    join public.profiles
      on profiles.id = junkshops.profile_id
    where junkshops.id =
      junkshop_materials.junkshop_id
      and profiles.auth_id = auth.uid()
  )
);

create policy "Recycler can update own materials"
on public.junkshop_materials
for update
to authenticated
using (
  exists (
    select 1
    from public.junkshops
    join public.profiles
      on profiles.id = junkshops.profile_id
    where junkshops.id =
      junkshop_materials.junkshop_id
      and profiles.auth_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.junkshops
    join public.profiles
      on profiles.id = junkshops.profile_id
    where junkshops.id =
      junkshop_materials.junkshop_id
      and profiles.auth_id = auth.uid()
      and profiles.role = 'recycler_partner'
  )
);

create policy "Recycler can delete own materials"
on public.junkshop_materials
for delete
to authenticated
using (
  exists (
    select 1
    from public.junkshops
    join public.profiles
      on profiles.id = junkshops.profile_id
    where junkshops.id =
      junkshop_materials.junkshop_id
      and profiles.auth_id = auth.uid()
  )
);

create policy "Partners can upload organization photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'partner-images'
  and (storage.foldername(name))[1] = 'junkshops'
  and (storage.foldername(name))[2] =
    auth.uid()::text
);

create policy "Partners can update organization photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'partner-images'
  and (storage.foldername(name))[1] = 'junkshops'
  and (storage.foldername(name))[2] =
    auth.uid()::text
);

create policy "Partners can delete organization photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'partner-images'
  and (storage.foldername(name))[1] = 'junkshops'
  and (storage.foldername(name))[2] =
    auth.uid()::text
);

create policy "Public can view partner images"
on storage.objects
for select
to public
using (
  bucket_id = 'partner-images'
);

create table public.material_opportunities (
    id uuid primary key default gen_random_uuid(),

    resident_profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    material_id uuid not null
        references public.materials(id)
        on delete restrict,

    scan_id uuid
        references public.scans(id)
        on delete set null,

    image_url text,

    estimated_weight_kg numeric(10,2) not null
        check (estimated_weight_kg > 0),

    material_condition text,

    fulfillment_method text not null default 'drop_off'
        check (
            fulfillment_method in (
                'drop_off',
                'pickup',
                'either'
            )
        ),

    barangay text not null,
    city text not null,
    province text,

    status text not null default 'open'
        check (
            status in (
                'open',
                'accepted',
                'completed',
                'cancelled'
            )
        ),

    selected_junkshop_id uuid
        references public.junkshops(id)
        on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table public.opportunity_responses (
    id uuid primary key default gen_random_uuid(),

    opportunity_id uuid not null
        references public.material_opportunities(id)
        on delete cascade,

    junkshop_id uuid not null
        references public.junkshops(id)
        on delete cascade,

    offered_price_per_kg numeric(10,2) not null
        check (offered_price_per_kg >= 0),

    pickup_available boolean not null default false,

    message text,

    status text not null default 'interested'
        check (
            status in (
                'interested',
                'accepted',
                'declined',
                'withdrawn'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (opportunity_id, junkshop_id)
);

-- =========================================================
-- SIMPLE OPPORTUNITIES RLS
-- =========================================================


-- =========================================================
-- 1. ENABLE RLS
-- =========================================================

alter table public.material_opportunities
enable row level security;

alter table public.opportunity_responses
enable row level security;


-- =========================================================
-- 2. TABLE PERMISSIONS
-- =========================================================

revoke all
on public.material_opportunities
from anon;

revoke all
on public.opportunity_responses
from anon;


grant select, insert, update
on public.material_opportunities
to authenticated;

grant select, insert, update
on public.opportunity_responses
to authenticated;


-- =========================================================
-- 3. REMOVE OLD POLICIES
-- =========================================================

drop policy if exists
    "resident_view_own_opportunities"
on public.material_opportunities;

drop policy if exists
    "resident_create_own_opportunities"
on public.material_opportunities;

drop policy if exists
    "resident_update_own_opportunities"
on public.material_opportunities;

drop policy if exists
    "recycler_view_matching_opportunities"
on public.material_opportunities;


drop policy if exists
    "resident_view_opportunity_responses"
on public.opportunity_responses;

drop policy if exists
    "resident_update_opportunity_responses"
on public.opportunity_responses;

drop policy if exists
    "recycler_view_own_responses"
on public.opportunity_responses;

drop policy if exists
    "recycler_create_responses"
on public.opportunity_responses;

drop policy if exists
    "recycler_update_own_responses"
on public.opportunity_responses;


-- =========================================================
-- 4. MATERIAL OPPORTUNITIES POLICIES
-- =========================================================


-- Residents can view opportunities that they created.

create policy
    "resident_view_own_opportunities"
on public.material_opportunities
for select
to authenticated
using (
    exists (
        select 1
        from public.profiles as profile
        where profile.id =
            material_opportunities.resident_profile_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'resident'
    )
);


-- Residents can create opportunities only under
-- their own resident profile.

create policy
    "resident_create_own_opportunities"
on public.material_opportunities
for insert
to authenticated
with check (
    exists (
        select 1
        from public.profiles as profile
        where profile.id =
            material_opportunities.resident_profile_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'resident'
    )

    and status = 'open'
    and selected_junkshop_id is null
);


-- Residents can update their own opportunities.
--
-- This supports:
-- open
-- accepted
-- completed
-- cancelled

create policy
    "resident_update_own_opportunities"
on public.material_opportunities
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles as profile
        where profile.id =
            material_opportunities.resident_profile_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'resident'
    )
)
with check (
    exists (
        select 1
        from public.profiles as profile
        where profile.id =
            material_opportunities.resident_profile_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'resident'
    )

    and status in (
        'open',
        'accepted',
        'completed',
        'cancelled'
    )
);


-- Recyclers can view:
--
-- 1. Open opportunities matching their active materials
-- 2. Opportunities assigned to their junkshop

create policy
    "recycler_view_matching_opportunities"
on public.material_opportunities
for select
to authenticated
using (
    exists (
        select 1
        from public.junkshops as shop

        join public.profiles as profile
            on profile.id = shop.profile_id

        where profile.auth_id =
            (select auth.uid())

        and profile.role = 'recycler_partner'
        and shop.is_active = true

        and (
            (
                material_opportunities.status = 'open'

                and exists (
                    select 1
                    from public.junkshop_materials as shop_material

                    where shop_material.junkshop_id =
                        shop.id

                    and shop_material.material_id =
                        material_opportunities.material_id

                    and shop_material.is_accepting = true
                )
            )

            or

            material_opportunities.selected_junkshop_id =
                shop.id
        )
    )
);


-- =========================================================
-- 5. OPPORTUNITY RESPONSE POLICIES
-- =========================================================


-- Residents can view responses sent to their opportunities.

create policy
    "resident_view_opportunity_responses"
on public.opportunity_responses
for select
to authenticated
using (
    exists (
        select 1
        from public.material_opportunities as opportunity

        join public.profiles as profile
            on profile.id =
                opportunity.resident_profile_id

        where opportunity.id =
            opportunity_responses.opportunity_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'resident'
    )
);


-- Residents can accept or decline responses
-- connected to their opportunities.

create policy
    "resident_update_opportunity_responses"
on public.opportunity_responses
for update
to authenticated
using (
    exists (
        select 1
        from public.material_opportunities as opportunity

        join public.profiles as profile
            on profile.id =
                opportunity.resident_profile_id

        where opportunity.id =
            opportunity_responses.opportunity_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'resident'
    )
)
with check (
    exists (
        select 1
        from public.material_opportunities as opportunity

        join public.profiles as profile
            on profile.id =
                opportunity.resident_profile_id

        where opportunity.id =
            opportunity_responses.opportunity_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'resident'
    )

    and status in (
        'accepted',
        'declined'
    )
);


-- Recyclers can view responses made by
-- their own junkshop.

create policy
    "recycler_view_own_responses"
on public.opportunity_responses
for select
to authenticated
using (
    exists (
        select 1
        from public.junkshops as shop

        join public.profiles as profile
            on profile.id = shop.profile_id

        where shop.id =
            opportunity_responses.junkshop_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'recycler_partner'
    )
);


-- Recyclers can respond only when:
--
-- 1. They own the junkshop
-- 2. The opportunity is open
-- 3. Their junkshop accepts the material

create policy
    "recycler_create_responses"
on public.opportunity_responses
for insert
to authenticated
with check (
    status = 'interested'

    and exists (
        select 1
        from public.junkshops as shop

        join public.profiles as profile
            on profile.id = shop.profile_id

        join public.material_opportunities as opportunity
            on opportunity.id =
                opportunity_responses.opportunity_id

        join public.junkshop_materials as shop_material
            on shop_material.junkshop_id =
                shop.id

        where shop.id =
            opportunity_responses.junkshop_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'recycler_partner'
        and shop.is_active = true

        and opportunity.status = 'open'

        and shop_material.material_id =
            opportunity.material_id

        and shop_material.is_accepting = true
    )
);


-- Recyclers can update their own response.
--
-- They may:
-- update their offer
-- update their message
-- withdraw their interest

create policy
    "recycler_update_own_responses"
on public.opportunity_responses
for update
to authenticated
using (
    status in (
        'interested',
        'withdrawn'
    )

    and exists (
        select 1
        from public.junkshops as shop

        join public.profiles as profile
            on profile.id = shop.profile_id

        where shop.id =
            opportunity_responses.junkshop_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'recycler_partner'
    )
)
with check (
    status in (
        'interested',
        'withdrawn'
    )

    and exists (
        select 1
        from public.junkshops as shop

        join public.profiles as profile
            on profile.id = shop.profile_id

        where shop.id =
            opportunity_responses.junkshop_id

        and profile.auth_id =
            (select auth.uid())

        and profile.role = 'recycler_partner'
    )
);

begin;

-- =========================================================
-- SAMPLE MATERIAL OPPORTUNITIES
-- Recycler profile:
-- 5c941a5b-c601-4127-8664-afec102afd94
-- =========================================================

with recycler_shop as (
    select id
    from public.junkshops
    where profile_id = '5c941a5b-c601-4127-8664-afec102afd94'
    limit 1
),

accepted_materials as (
    select array_agg(
        jm.material_id
        order by jm.material_id
    ) as material_ids
    from public.junkshop_materials jm
    join recycler_shop shop
        on shop.id = jm.junkshop_id
    where jm.is_accepting = true
),

sample_data (
    id,
    resident_profile_id,
    material_slot,
    estimated_weight_kg,
    material_condition,
    fulfillment_method,
    barangay,
    city,
    province,
    status,
    assign_to_junkshop,
    created_at
) as (
    values

    (
        '11111111-1111-4111-8111-111111111101'::uuid,
        'd4ba5306-bef5-4f30-a1c0-8d8fd4a65fe4'::uuid,
        1,
        8.50,
        'Clean, dry, and already placed in a separate sack.',
        'pickup',
        'Cabunbata',
        'Isabela City',
        'Basilan',
        'open',
        false,
        now() - interval '2 hours'
    ),

    (
        '11111111-1111-4111-8111-111111111102'::uuid,
        'acf45fe1-b1db-43f0-9f5f-561aa53e025f'::uuid,
        2,
        12.00,
        'Dry and properly sorted. Some pieces are flattened.',
        'drop_off',
        'Cabunbata',
        'Isabela City',
        'Basilan',
        'open',
        false,
        now() - interval '5 hours'
    ),

    (
        '11111111-1111-4111-8111-111111111103'::uuid,
        '78b43ebf-9422-4203-8e47-05bb1b387384'::uuid,
        3,
        4.75,
        'Mostly clean with minor labels still attached.',
        'either',
        'Menzi',
        'Isabela City',
        'Basilan',
        'open',
        false,
        now() - interval '1 day'
    ),

    -- This will appear under Interested after the response seed below.
    (
        '11111111-1111-4111-8111-111111111104'::uuid,
        '5231a2fe-4f63-4b85-9da0-911d3f13da32'::uuid,
        1,
        18.00,
        'Clean and separated by material type.',
        'pickup',
        'Isabela',
        'Lamitan',
        'Basilan',
        'open',
        false,
        now() - interval '3 hours'
    ),

    -- Accepted recovery assigned to Junkshop 1.
    (
        '11111111-1111-4111-8111-111111111105'::uuid,
        'd4ba5306-bef5-4f30-a1c0-8d8fd4a65fe4'::uuid,
        2,
        7.25,
        'Clean, dry, and ready for collection.',
        'either',
        'Cabunbata',
        'Isabela City',
        'Basilan',
        'accepted',
        true,
        now() - interval '2 days'
    ),

    -- Completed recovery assigned to Junkshop 1.
    (
        '11111111-1111-4111-8111-111111111106'::uuid,
        'acf45fe1-b1db-43f0-9f5f-561aa53e025f'::uuid,
        3,
        20.00,
        'Sorted, weighed, and delivered to the junkshop.',
        'drop_off',
        'Cabunbata',
        'Isabela City',
        'Basilan',
        'completed',
        true,
        now() - interval '5 days'
    )
)

insert into public.material_opportunities (
    id,
    resident_profile_id,
    material_id,
    scan_id,
    image_url,
    estimated_weight_kg,
    material_condition,
    fulfillment_method,
    barangay,
    city,
    province,
    status,
    selected_junkshop_id,
    created_at,
    updated_at
)

select
    sample.id,
    sample.resident_profile_id,

    accepted.material_ids[
        (
            (sample.material_slot - 1)
            % array_length(
                accepted.material_ids,
                1
            )
        ) + 1
    ],

    null,
    null,
    sample.estimated_weight_kg,
    sample.material_condition,
    sample.fulfillment_method,
    sample.barangay,
    sample.city,
    sample.province,
    sample.status,

    case
        when sample.assign_to_junkshop
            then shop.id
        else null
    end,

    sample.created_at,
    now()

from sample_data sample
cross join recycler_shop shop
cross join accepted_materials accepted

where array_length(
    accepted.material_ids,
    1
) > 0

on conflict (id)
do update set
    resident_profile_id =
        excluded.resident_profile_id,

    material_id =
        excluded.material_id,

    estimated_weight_kg =
        excluded.estimated_weight_kg,

    material_condition =
        excluded.material_condition,

    fulfillment_method =
        excluded.fulfillment_method,

    barangay =
        excluded.barangay,

    city =
        excluded.city,

    province =
        excluded.province,

    status =
        excluded.status,

    selected_junkshop_id =
        excluded.selected_junkshop_id,

    updated_at =
        now();


-- =========================================================
-- SAMPLE RECYCLER RESPONSES
-- =========================================================

with recycler_shop as (
    select id
    from public.junkshops
    where profile_id =
        '5c941a5b-c601-4127-8664-afec102afd94'
    limit 1
),

sample_responses (
    id,
    opportunity_id,
    offered_price_per_kg,
    pickup_available,
    message,
    status,
    created_at
) as (
    values

    -- Interested tab
    (
        '22222222-2222-4222-8222-222222222201'::uuid,
        '11111111-1111-4111-8111-111111111104'::uuid,
        20.00,
        true,
        'We can collect this material tomorrow afternoon.',
        'interested',
        now() - interval '2 hours'
    ),

    -- Accepted tab
    (
        '22222222-2222-4222-8222-222222222202'::uuid,
        '11111111-1111-4111-8111-111111111105'::uuid,
        18.50,
        true,
        'Pickup is available on Saturday morning.',
        'accepted',
        now() - interval '1 day'
    ),

    -- Completed item
    (
        '22222222-2222-4222-8222-222222222203'::uuid,
        '11111111-1111-4111-8111-111111111106'::uuid,
        22.00,
        false,
        'Material was delivered and successfully received.',
        'accepted',
        now() - interval '5 days'
    )
)

insert into public.opportunity_responses (
    id,
    opportunity_id,
    junkshop_id,
    offered_price_per_kg,
    pickup_available,
    message,
    status,
    created_at,
    updated_at
)

select
    response.id,
    response.opportunity_id,
    shop.id,
    response.offered_price_per_kg,
    response.pickup_available,
    response.message,
    response.status,
    response.created_at,
    now()

from sample_responses response
cross join recycler_shop shop

on conflict (
    opportunity_id,
    junkshop_id
)
do update set
    offered_price_per_kg =
        excluded.offered_price_per_kg,

    pickup_available =
        excluded.pickup_available,

    message =
        excluded.message,

    status =
        excluded.status,

    updated_at =
        now();


commit;


---------------------

create table if not exists public.schools (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null unique
        references public.profiles(id)
        on delete cascade,

    school_name text not null,
    school_type text,
    school_id_number text,
    description text,
    photo_url text,

    address_line text not null,
    barangay text,
    city text,
    province text,
    postal_code text,

    contact_number text,
    contact_email text,

    recycling_coordinator text,
    program_contact_number text,
    collection_area text,
    collection_days text[] not null default '{}',

    verification_status text not null default 'pending'
        check (
            verification_status in (
                'pending',
                'approved',
                'rejected',
                'suspended'
            )
        ),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


alter table public.schools enable row level security;

grant select, insert, update
on public.schools
to authenticated;


create policy "School partners read own school"
on public.schools
for select
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = schools.profile_id
          and profiles.auth_id = auth.uid()
          and profiles.role = 'school_partner'
    )
);


create policy "School partners create own school"
on public.schools
for insert
to authenticated
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = schools.profile_id
          and profiles.auth_id = auth.uid()
          and profiles.role = 'school_partner'
    )
);


create policy "School partners update own school"
on public.schools
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = schools.profile_id
          and profiles.auth_id = auth.uid()
          and profiles.role = 'school_partner'
    )
)
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = schools.profile_id
          and profiles.auth_id = auth.uid()
          and profiles.role = 'school_partner'
    )
);


create policy "Authenticated users view approved schools"
on public.schools
for select
to authenticated
using (
    verification_status = 'approved'
    and is_active = true
);

-- Allow authenticated school partners to upload only inside:
-- partner-images/school-partners/{their-auth-id}/file.webp

drop policy if exists
"School partners upload own organization images"
on storage.objects;

create policy
"School partners upload own organization images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'partner-images'
    and (storage.foldername(name))[1] = 'school-partners'
    and (storage.foldername(name))[2] = auth.uid()::text
);


drop policy if exists
"School partners view own organization images"
on storage.objects;

create policy
"School partners view own organization images"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'partner-images'
    and (storage.foldername(name))[1] = 'school-partners'
    and (storage.foldername(name))[2] = auth.uid()::text
);


drop policy if exists
"School partners delete own organization images"
on storage.objects;

create policy
"School partners delete own organization images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'partner-images'
    and (storage.foldername(name))[1] = 'school-partners'
    and (storage.foldername(name))[2] = auth.uid()::text
);

create table public.school_drives (
    id uuid primary key default gen_random_uuid(),

    school_partner_id uuid not null
        references public.school_partners(id)
        on delete cascade,

    title text not null,
    description text,

    start_date date not null,
    end_date date not null,

    target_weight_kg numeric(10,2)
        check (
            target_weight_kg is null
            or target_weight_kg > 0
        ),

    collection_location text not null,
    photo_url text,

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'active',
                'completed',
                'cancelled'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint school_drives_date_check
        check (end_date >= start_date)
);

create index school_drives_partner_status_index
on public.school_drives (
    school_partner_id,
    status
);

create table public.school_drive_materials (
    id uuid primary key default gen_random_uuid(),

    drive_id uuid not null
        references public.school_drives(id)
        on delete cascade,

    material_id uuid not null
        references public.materials(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    unique (
        drive_id,
        material_id
    )
);

create index school_drive_materials_drive_index
on public.school_drive_materials (
    drive_id
);

create table public.school_collection_entries (
    id uuid primary key default gen_random_uuid(),

    drive_id uuid not null
        references public.school_drives(id)
        on delete cascade,

    material_id uuid not null
        references public.materials(id)
        on delete restrict,

    source_name text not null,

    weight_kg numeric(10,2) not null
        check (weight_kg > 0),

    notes text,
    photo_url text,

    collected_at timestamptz not null default now(),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index school_collection_entries_drive_index
on public.school_collection_entries (
    drive_id,
    collected_at desc
);

alter table public.school_drives
enable row level security;

alter table public.school_drive_materials
enable row level security;

alter table public.school_collection_entries
enable row level security;


grant select, insert, update, delete
on public.school_drives
to authenticated;

grant select, insert, update, delete
on public.school_drive_materials
to authenticated;

grant select, insert, update, delete
on public.school_collection_entries
to authenticated;


create policy "School partners manage own drives"
on public.school_drives
for all
to authenticated
using (
    exists (
        select 1
        from public.school_partners sp
        join public.profiles p
            on p.id = sp.profile_id
        where sp.id = school_drives.school_partner_id
          and p.auth_id = auth.uid()
          and p.role = 'school_partner'
    )
)
with check (
    exists (
        select 1
        from public.school_partners sp
        join public.profiles p
            on p.id = sp.profile_id
        where sp.id = school_drives.school_partner_id
          and p.auth_id = auth.uid()
          and p.role = 'school_partner'
    )
);




create policy "School partners manage materials in own drives"
on public.school_drive_materials
for all
to authenticated
using (
    exists (
        select 1
        from public.school_drives sd
        join public.school_partners sp
            on sp.id = sd.school_partner_id
        join public.profiles p
            on p.id = sp.profile_id
        where sd.id = school_drive_materials.drive_id
          and p.auth_id = auth.uid()
          and p.role = 'school_partner'
    )
)
with check (
    exists (
        select 1
        from public.school_drives sd
        join public.school_partners sp
            on sp.id = sd.school_partner_id
        join public.profiles p
            on p.id = sp.profile_id
        where sd.id = school_drive_materials.drive_id
          and p.auth_id = auth.uid()
          and p.role = 'school_partner'
    )
);

create policy "School partners manage entries in own drives"
on public.school_collection_entries
for all
to authenticated
using (
    exists (
        select 1
        from public.school_drives sd
        join public.school_partners sp
            on sp.id = sd.school_partner_id
        join public.profiles p
            on p.id = sp.profile_id
        where sd.id = school_collection_entries.drive_id
          and p.auth_id = auth.uid()
          and p.role = 'school_partner'
    )
)
with check (
    exists (
        select 1
        from public.school_drives sd
        join public.school_partners sp
            on sp.id = sd.school_partner_id
        join public.profiles p
            on p.id = sp.profile_id
        where sd.id = school_collection_entries.drive_id
          and p.auth_id = auth.uid()
          and p.role = 'school_partner'
    )
);



drop policy if exists "School partners upload drive images"
on storage.objects;

create policy "School partners upload drive images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'partner-images'
    and (storage.foldername(name))[1] in ('school-drives', 'school-collections')
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
        select 1
        from public.profiles p
        where p.auth_id = auth.uid()
          and p.role = 'school_partner'
    )
);

-- Read own files through authenticated Storage API calls.
drop policy if exists "School partners read own drive images"
on storage.objects;

create policy "School partners read own drive images"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'partner-images'
    and (storage.foldername(name))[1] in ('school-drives', 'school-collections')
    and (storage.foldername(name))[2] = auth.uid()::text
);

-- Remove replaced images.
drop policy if exists "School partners delete own drive images"
on storage.objects;

create policy "School partners delete own drive images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'partner-images'
    and (storage.foldername(name))[1] in ('school-drives', 'school-collections')
    and (storage.foldername(name))[2] = auth.uid()::text
);



------------------------


begin;

create table if not exists public.school_pickup_requests (
    id uuid primary key default gen_random_uuid(),
    school_partner_id uuid not null references public.school_partners(id) on delete cascade,
    drive_id uuid not null references public.school_drives(id) on delete restrict,
    preferred_pickup_date date not null,
    preferred_time_start time,
    preferred_time_end time,
    address_line text not null,
    barangay text not null,
    city text not null,
    province text,
    postal_code text,
    contact_person text not null,
    contact_number text not null,
    notes text,
    status text not null default 'pending'
      check (status in ('pending','accepted','completed','cancelled')),
    selected_junkshop_id uuid references public.junkshops(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint school_pickup_time_check check (
      preferred_time_start is null
      or preferred_time_end is null
      or preferred_time_end > preferred_time_start
    )
);

create table if not exists public.school_pickup_items (
    id uuid primary key default gen_random_uuid(),
    pickup_request_id uuid not null references public.school_pickup_requests(id) on delete cascade,
    material_id uuid not null references public.materials(id) on delete restrict,
    estimated_weight_kg numeric(10,2) not null check (estimated_weight_kg > 0),
    created_at timestamptz not null default now(),
    unique (pickup_request_id, material_id)
);

create table if not exists public.school_pickup_responses (
    id uuid primary key default gen_random_uuid(),
    pickup_request_id uuid not null references public.school_pickup_requests(id) on delete cascade,
    junkshop_id uuid not null references public.junkshops(id) on delete cascade,
    proposed_pickup_date date,
    pickup_available boolean not null default true,
    message text,
    status text not null default 'interested'
      check (status in ('interested','accepted','declined','withdrawn')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (pickup_request_id, junkshop_id)
);

create index if not exists school_pickup_requests_partner_status_index
on public.school_pickup_requests (school_partner_id, status, created_at desc);

create index if not exists school_pickup_requests_selected_junkshop_index
on public.school_pickup_requests (selected_junkshop_id, status);

create index if not exists school_pickup_items_request_index
on public.school_pickup_items (pickup_request_id);

create index if not exists school_pickup_items_material_index
on public.school_pickup_items (material_id);

create index if not exists school_pickup_responses_request_index
on public.school_pickup_responses (pickup_request_id, status);

create index if not exists school_pickup_responses_junkshop_index
on public.school_pickup_responses (junkshop_id, status);

alter table public.school_pickup_requests enable row level security;
alter table public.school_pickup_items enable row level security;
alter table public.school_pickup_responses enable row level security;

grant select, insert, update on public.school_pickup_requests to authenticated;
grant select, insert on public.school_pickup_items to authenticated;
grant select, insert, update on public.school_pickup_responses to authenticated;

-- School partner request policies

drop policy if exists "School partners view own pickup requests" on public.school_pickup_requests;
create policy "School partners view own pickup requests"
on public.school_pickup_requests for select to authenticated
using (
  exists (
    select 1
    from public.school_partners sp
    join public.profiles p on p.id = sp.profile_id
    where sp.id = school_pickup_requests.school_partner_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
);

drop policy if exists "School partners create own pickup requests" on public.school_pickup_requests;
create policy "School partners create own pickup requests"
on public.school_pickup_requests for insert to authenticated
with check (
  status = 'pending'
  and selected_junkshop_id is null
  and exists (
    select 1
    from public.school_partners sp
    join public.profiles p on p.id = sp.profile_id
    where sp.id = school_pickup_requests.school_partner_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
);

drop policy if exists "School partners update own pickup requests" on public.school_pickup_requests;
create policy "School partners update own pickup requests"
on public.school_pickup_requests for update to authenticated
using (
  exists (
    select 1
    from public.school_partners sp
    join public.profiles p on p.id = sp.profile_id
    where sp.id = school_pickup_requests.school_partner_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
)
with check (
  status in ('pending','accepted','completed','cancelled')
  and exists (
    select 1
    from public.school_partners sp
    join public.profiles p on p.id = sp.profile_id
    where sp.id = school_pickup_requests.school_partner_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
);

-- School partner item policies

drop policy if exists "School partners view own pickup items" on public.school_pickup_items;
create policy "School partners view own pickup items"
on public.school_pickup_items for select to authenticated
using (
  exists (
    select 1
    from public.school_pickup_requests spr
    join public.school_partners sp on sp.id = spr.school_partner_id
    join public.profiles p on p.id = sp.profile_id
    where spr.id = school_pickup_items.pickup_request_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
);

drop policy if exists "School partners create own pickup items" on public.school_pickup_items;
create policy "School partners create own pickup items"
on public.school_pickup_items for insert to authenticated
with check (
  exists (
    select 1
    from public.school_pickup_requests spr
    join public.school_partners sp on sp.id = spr.school_partner_id
    join public.profiles p on p.id = sp.profile_id
    where spr.id = school_pickup_items.pickup_request_id
      and spr.status = 'pending'
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
);

-- School partner response policies

drop policy if exists "School partners view responses to own pickups" on public.school_pickup_responses;
create policy "School partners view responses to own pickups"
on public.school_pickup_responses for select to authenticated
using (
  exists (
    select 1
    from public.school_pickup_requests spr
    join public.school_partners sp on sp.id = spr.school_partner_id
    join public.profiles p on p.id = sp.profile_id
    where spr.id = school_pickup_responses.pickup_request_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
);

drop policy if exists "School partners decide pickup responses" on public.school_pickup_responses;
create policy "School partners decide pickup responses"
on public.school_pickup_responses for update to authenticated
using (
  exists (
    select 1
    from public.school_pickup_requests spr
    join public.school_partners sp on sp.id = spr.school_partner_id
    join public.profiles p on p.id = sp.profile_id
    where spr.id = school_pickup_responses.pickup_request_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
)
with check (
  status in ('accepted','declined')
  and exists (
    select 1
    from public.school_pickup_requests spr
    join public.school_partners sp on sp.id = spr.school_partner_id
    join public.profiles p on p.id = sp.profile_id
    where spr.id = school_pickup_responses.pickup_request_id
      and p.auth_id = auth.uid()
      and p.role = 'school_partner'
  )
);

-- Recycler request visibility

drop policy if exists "Recyclers view matching school pickup requests" on public.school_pickup_requests;
create policy "Recyclers view matching school pickup requests"
on public.school_pickup_requests for select to authenticated
using (
  exists (
    select 1
    from public.junkshops j
    join public.profiles p on p.id = j.profile_id
    where p.auth_id = auth.uid()
      and p.role = 'recycler_partner'
      and j.is_active = true
      and (
        (
          school_pickup_requests.status = 'pending'
          and exists (
            select 1
            from public.school_pickup_items spi
            join public.junkshop_materials jm on jm.material_id = spi.material_id
            where spi.pickup_request_id = school_pickup_requests.id
              and jm.junkshop_id = j.id
              and jm.is_accepting = true
          )
        )
        or school_pickup_requests.selected_junkshop_id = j.id
      )
  )
);

drop policy if exists "Recyclers view matching school pickup items" on public.school_pickup_items;
create policy "Recyclers view matching school pickup items"
on public.school_pickup_items for select to authenticated
using (
  exists (
    select 1
    from public.school_pickup_requests spr
    join public.junkshops j on true
    join public.profiles p on p.id = j.profile_id
    where spr.id = school_pickup_items.pickup_request_id
      and p.auth_id = auth.uid()
      and p.role = 'recycler_partner'
      and j.is_active = true
      and (
        (
          spr.status = 'pending'
          and exists (
            select 1
            from public.junkshop_materials jm
            where jm.junkshop_id = j.id
              and jm.material_id = school_pickup_items.material_id
              and jm.is_accepting = true
          )
        )
        or spr.selected_junkshop_id = j.id
      )
  )
);

-- Recycler response policies

drop policy if exists "Recyclers view own school pickup responses" on public.school_pickup_responses;
create policy "Recyclers view own school pickup responses"
on public.school_pickup_responses for select to authenticated
using (
  exists (
    select 1
    from public.junkshops j
    join public.profiles p on p.id = j.profile_id
    where j.id = school_pickup_responses.junkshop_id
      and p.auth_id = auth.uid()
      and p.role = 'recycler_partner'
  )
);

drop policy if exists "Recyclers create school pickup responses" on public.school_pickup_responses;
create policy "Recyclers create school pickup responses"
on public.school_pickup_responses for insert to authenticated
with check (
  status = 'interested'
  and exists (
    select 1
    from public.junkshops j
    join public.profiles p on p.id = j.profile_id
    join public.school_pickup_requests spr on spr.id = school_pickup_responses.pickup_request_id
    where j.id = school_pickup_responses.junkshop_id
      and p.auth_id = auth.uid()
      and p.role = 'recycler_partner'
      and j.is_active = true
      and spr.status = 'pending'
      and exists (
        select 1
        from public.school_pickup_items spi
        join public.junkshop_materials jm on jm.material_id = spi.material_id
        where spi.pickup_request_id = spr.id
          and jm.junkshop_id = j.id
          and jm.is_accepting = true
      )
  )
);

drop policy if exists "Recyclers update own school pickup responses" on public.school_pickup_responses;
create policy "Recyclers update own school pickup responses"
on public.school_pickup_responses for update to authenticated
using (
  exists (
    select 1
    from public.junkshops j
    join public.profiles p on p.id = j.profile_id
    where j.id = school_pickup_responses.junkshop_id
      and p.auth_id = auth.uid()
      and p.role = 'recycler_partner'
  )
)
with check (
  status in ('interested','withdrawn')
  and exists (
    select 1
    from public.junkshops j
    join public.profiles p on p.id = j.profile_id
    where j.id = school_pickup_responses.junkshop_id
      and p.auth_id = auth.uid()
      and p.role = 'recycler_partner'
  )
);

commit;

begin;


-- ============================================================
-- 1. SECURITY-DEFINER HELPERS
--
-- These functions keep policy checks compact and prevent policy
-- chains from becoming recursive.
-- ============================================================

create or replace function public.is_authenticated_resident()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles as profile
        where profile.auth_id = auth.uid()
          and profile.role = 'resident'
    );
$$;


create or replace function public.resident_can_view_junkshop(
    target_junkshop_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.junkshops as junkshop
        where junkshop.id = target_junkshop_id
          and junkshop.is_active = true
          and junkshop.verification_status = 'approved'
    );
$$;


create or replace function public.resident_can_view_school_partner(
    target_school_partner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.school_partners as partner
        where partner.id = target_school_partner_id
          and partner.is_active = true
          and partner.verification_status = 'approved'
    );
$$;


create or replace function public.resident_can_view_school_drive(
    target_drive_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.school_drives as drive
        join public.school_partners as partner
          on partner.id = drive.school_partner_id
        where drive.id = target_drive_id
          and drive.status = 'active'
          and partner.is_active = true
          and partner.verification_status = 'approved'
    );
$$;


revoke all
on function public.is_authenticated_resident()
from public;

revoke all
on function public.resident_can_view_junkshop(uuid)
from public;

revoke all
on function public.resident_can_view_school_partner(uuid)
from public;

revoke all
on function public.resident_can_view_school_drive(uuid)
from public;


grant execute
on function public.is_authenticated_resident()
to authenticated;

grant execute
on function public.resident_can_view_junkshop(uuid)
to authenticated;

grant execute
on function public.resident_can_view_school_partner(uuid)
to authenticated;

grant execute
on function public.resident_can_view_school_drive(uuid)
to authenticated;


-- ============================================================
-- 2. ENABLE ROW-LEVEL SECURITY
-- ============================================================

alter table public.profiles
enable row level security;

alter table public.materials
enable row level security;

alter table public.junkshops
enable row level security;

alter table public.junkshop_materials
enable row level security;

alter table public.school_partners
enable row level security;

alter table public.school_drives
enable row level security;

alter table public.school_drive_materials
enable row level security;


-- ============================================================
-- 3. RESIDENT OWN-PROFILE ACCESS
-- ============================================================

drop policy if exists
"Residents can view their own profile"
on public.profiles;

create policy
"Residents can view their own profile"
on public.profiles
for select
to authenticated
using (
    auth_id = auth.uid()
    and role = 'resident'
);


drop policy if exists
"Residents can update their own profile"
on public.profiles;

create policy
"Residents can update their own profile"
on public.profiles
for update
to authenticated
using (
    auth_id = auth.uid()
    and role = 'resident'
)
with check (
    auth_id = auth.uid()
    and role = 'resident'
);


-- ============================================================
-- 4. MATERIAL CATALOG
--
-- Residents may read the material catalog so the nearby page
-- can display and filter accepted materials.
-- ============================================================

drop policy if exists
"Residents can view materials"
on public.materials;

create policy
"Residents can view materials"
on public.materials
for select
to authenticated
using (
    public.is_authenticated_resident()
);


-- ============================================================
-- 5. APPROVED JUNKSHOPS
-- ============================================================

drop policy if exists
"Residents can view approved active junkshops"
on public.junkshops;

create policy
"Residents can view approved active junkshops"
on public.junkshops
for select
to authenticated
using (
    public.is_authenticated_resident()
    and is_active = true
    and verification_status = 'approved'
);


drop policy if exists
"Residents can view accepted junkshop materials"
on public.junkshop_materials;

create policy
"Residents can view accepted junkshop materials"
on public.junkshop_materials
for select
to authenticated
using (
    public.is_authenticated_resident()
    and is_accepting = true
    and public.resident_can_view_junkshop(
        junkshop_id
    )
);


-- ============================================================
-- 6. APPROVED SCHOOL PARTNERS
-- ============================================================

drop policy if exists
"Residents can view approved active school partners"
on public.school_partners;

create policy
"Residents can view approved active school partners"
on public.school_partners
for select
to authenticated
using (
    public.is_authenticated_resident()
    and is_active = true
    and verification_status = 'approved'
);


-- ============================================================
-- 7. ACTIVE SCHOOL COLLECTION DRIVES
-- ============================================================

drop policy if exists
"Residents can view active school drives"
on public.school_drives;

create policy
"Residents can view active school drives"
on public.school_drives
for select
to authenticated
using (
    public.is_authenticated_resident()
    and status = 'active'
    and public.resident_can_view_school_partner(
        school_partner_id
    )
);


drop policy if exists
"Residents can view active school drive materials"
on public.school_drive_materials;

create policy
"Residents can view active school drive materials"
on public.school_drive_materials
for select
to authenticated
using (
    public.is_authenticated_resident()
    and public.resident_can_view_school_drive(
        drive_id
    )
);


-- ============================================================
-- 8. TABLE PRIVILEGES
--
-- RLS still controls which rows are visible.
-- ============================================================

grant select
on table public.profiles
to authenticated;

grant update (
    full_name,
    avatar_url,
    age,
    sex,
    barangay,
    city,
    province,
    onboarding_completed,
    updated_at
)
on table public.profiles
to authenticated;


grant select
on table public.materials
to authenticated;

grant select
on table public.junkshops
to authenticated;

grant select
on table public.junkshop_materials
to authenticated;

grant select
on table public.school_partners
to authenticated;

grant select
on table public.school_drives
to authenticated;

grant select
on table public.school_drive_materials
to authenticated;


commit;


----------------------===============-----------------------------

begin;

create extension if not exists pgcrypto;


-- ============================================================
-- 1. RESIDENT OWNERSHIP HELPERS
--
-- SECURITY DEFINER prevents recursive profile-policy checks.
-- ============================================================

create or replace function public.is_authenticated_resident()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles as profile
        where profile.auth_id = auth.uid()
          and profile.role = 'resident'
    );
$$;


create or replace function public.resident_owns_profile(
    target_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles as profile
        where profile.id = target_profile_id
          and profile.auth_id = auth.uid()
          and profile.role = 'resident'
    );
$$;


revoke all
on function public.is_authenticated_resident()
from public;

revoke all
on function public.resident_owns_profile(uuid)
from public;


grant execute
on function public.is_authenticated_resident()
to authenticated;

grant execute
on function public.resident_owns_profile(uuid)
to authenticated;


-- ============================================================
-- 2. CREATE OR EXTEND THE SCANS TABLE
-- ============================================================

create table if not exists public.scans (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    image_url text null,

    detected_object text not null,

    material_type text not null,

    confidence_score numeric(5, 4) null,

    recommended_action jsonb null,

    barangay text null,

    created_at timestamptz not null default now()
);


alter table public.scans
add column if not exists image_storage_path text null;

alter table public.scans
add column if not exists object_description text null;

alter table public.scans
add column if not exists material_id uuid null
references public.materials(id)
on delete set null;

alter table public.scans
add column if not exists material_category text null;

alter table public.scans
add column if not exists condition text null;

alter table public.scans
add column if not exists primary_action text null;

alter table public.scans
add column if not exists preparation_steps jsonb not null
default '[]'::jsonb;

alter table public.scans
add column if not exists hazardous boolean not null
default false;

alter table public.scans
add column if not exists hazard_notes text null;

alter table public.scans
add column if not exists needs_user_confirmation boolean not null
default true;

alter table public.scans
add column if not exists user_confirmed boolean not null
default false;

alter table public.scans
add column if not exists correction_material_id uuid null
references public.materials(id)
on delete set null;

alter table public.scans
add column if not exists ai_raw_result jsonb null;

alter table public.scans
add column if not exists model_name text null;

alter table public.scans
add column if not exists analysis_status text not null
default 'processing';

alter table public.scans
add column if not exists updated_at timestamptz not null
default now();


-- ============================================================
-- 3. CONVERT AN OLDER TEXT recommended_action COLUMN TO JSONB
-- ============================================================

create or replace function public.safe_text_to_jsonb(
    input_text text
)
returns jsonb
language plpgsql
immutable
as $$
begin
    if input_text is null or btrim(input_text) = '' then
        return null;
    end if;

    begin
        return input_text::jsonb;
    exception
        when others then
            return jsonb_build_object(
                'title',
                input_text,
                'description',
                input_text
            );
    end;
end;
$$;


do $$
declare
    current_type text;
begin
    select data_type
      into current_type
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'scans'
       and column_name = 'recommended_action';

    if current_type in (
        'text',
        'character varying'
    ) then
        alter table public.scans
        alter column recommended_action
        type jsonb
        using public.safe_text_to_jsonb(
            recommended_action
        );
    end if;
end
$$;


drop function if exists public.safe_text_to_jsonb(text);


-- ============================================================
-- 4. VALIDATION CONSTRAINTS
--
-- NOT VALID protects the migration from older inconsistent rows.
-- New and updated rows must still satisfy the constraints.
-- ============================================================

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'scans_analysis_status_check'
          and conrelid = 'public.scans'::regclass
    ) then
        alter table public.scans
        add constraint scans_analysis_status_check
        check (
            analysis_status in (
                'processing',
                'completed',
                'needs_confirmation',
                'failed'
            )
        )
        not valid;
    end if;
end
$$;


do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'scans_condition_check'
          and conrelid = 'public.scans'::regclass
    ) then
        alter table public.scans
        add constraint scans_condition_check
        check (
            condition is null
            or condition in (
                'clean',
                'dirty',
                'damaged',
                'mixed',
                'unknown'
            )
        )
        not valid;
    end if;
end
$$;


do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'scans_primary_action_check'
          and conrelid = 'public.scans'::regclass
    ) then
        alter table public.scans
        add constraint scans_primary_action_check
        check (
            primary_action is null
            or primary_action in (
                'reuse',
                'donate',
                'sell',
                'recycle',
                'special_handling',
                'dispose'
            )
        )
        not valid;
    end if;
end
$$;


do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'scans_confidence_score_check'
          and conrelid = 'public.scans'::regclass
    ) then
        alter table public.scans
        add constraint scans_confidence_score_check
        check (
            confidence_score is null
            or (
                confidence_score >= 0
                and confidence_score <= 1
            )
        )
        not valid;
    end if;
end
$$;


-- ============================================================
-- 5. INDEXES
-- ============================================================

create index if not exists scans_user_created_index
on public.scans (
    user_id,
    created_at desc
);

create index if not exists scans_material_index
on public.scans (
    material_id
);

create index if not exists scans_status_index
on public.scans (
    analysis_status
);

create unique index if not exists scans_image_storage_path_unique
on public.scans (
    image_storage_path
)
where image_storage_path is not null;


-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_scans_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


drop trigger if exists set_scans_updated_at
on public.scans;

create trigger set_scans_updated_at
before update
on public.scans
for each row
execute function public.set_scans_updated_at();


-- ============================================================
-- 7. SCAN ROW LEVEL SECURITY
-- ============================================================

alter table public.scans
enable row level security;


drop policy if exists
"Residents can view their own scans"
on public.scans;

create policy
"Residents can view their own scans"
on public.scans
for select
to authenticated
using (
    public.resident_owns_profile(
        user_id
    )
);


drop policy if exists
"Residents can create their own scans"
on public.scans;

create policy
"Residents can create their own scans"
on public.scans
for insert
to authenticated
with check (
    public.resident_owns_profile(
        user_id
    )
);


drop policy if exists
"Residents can update their own scans"
on public.scans;

create policy
"Residents can update their own scans"
on public.scans
for update
to authenticated
using (
    public.resident_owns_profile(
        user_id
    )
)
with check (
    public.resident_owns_profile(
        user_id
    )
);


drop policy if exists
"Residents can delete their own scans"
on public.scans;

create policy
"Residents can delete their own scans"
on public.scans
for delete
to authenticated
using (
    public.resident_owns_profile(
        user_id
    )
);


grant select, insert, update, delete
on table public.scans
to authenticated;


-- ============================================================
-- 8. MATERIAL CATALOG ACCESS
--
-- Residents need this to confirm or correct AI results.
-- ============================================================

alter table public.materials
enable row level security;


drop policy if exists
"Residents can view materials"
on public.materials;

create policy
"Residents can view materials"
on public.materials
for select
to authenticated
using (
    public.is_authenticated_resident()
);


grant select
on table public.materials
to authenticated;


commit;





begin;


-- ============================================================
-- 1. ENSURE THE RESIDENT HELPER EXISTS
-- ============================================================

create or replace function public.is_authenticated_resident()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles as profile
        where profile.auth_id = auth.uid()
          and profile.role = 'resident'
    );
$$;


revoke all
on function public.is_authenticated_resident()
from public;


grant execute
on function public.is_authenticated_resident()
to authenticated;


-- ============================================================
-- 2. CREATE A PRIVATE STORAGE BUCKET
--
-- 5 MB server-side limit.
-- The client page should compress images below this limit.
-- ============================================================

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'resident-scans',
    'resident-scans',
    false,
    5242880,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
on conflict (id)
do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- 3. RESIDENT STORAGE POLICIES
--
-- Residents can only access the folder matching auth.uid().
-- ============================================================

drop policy if exists
"Residents can upload their scan images"
on storage.objects;

create policy
"Residents can upload their scan images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'resident-scans'
    and public.is_authenticated_resident()
    and (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists
"Residents can view their scan images"
on storage.objects;

create policy
"Residents can view their scan images"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'resident-scans'
    and public.is_authenticated_resident()
    and (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists
"Residents can delete their scan images"
on storage.objects;

create policy
"Residents can delete their scan images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'resident-scans'
    and public.is_authenticated_resident()
    and (storage.foldername(name))[1] = auth.uid()::text
);


-- No UPDATE policy is included.
-- Scanner uploads should use upsert: false and create a new UUID file.


commit;

create unique index if not exists
material_opportunities_active_scan_unique
on public.material_opportunities(scan_id)
where scan_id is not null
and status in ('open', 'accepted');


begin;

drop function if exists public.accept_opportunity_response(uuid, uuid);

create function public.accept_opportunity_response(
  p_opportunity_id uuid,
  p_response_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_resident_profile_id uuid;
  v_opportunity public.material_opportunities%rowtype;
  v_response public.opportunity_responses%rowtype;
  v_junkshop_name text;
begin
  /*
   * Resolve the authenticated resident.
   * auth.uid() is supplied by Supabase when the RPC is called
   * using the signed-in user's access token.
   */
  select profile.id
  into v_resident_profile_id
  from public.profiles as profile
  where profile.auth_id = auth.uid()
    and profile.role = 'resident'
  limit 1;

  if v_resident_profile_id is null then
    raise exception 'Resident account was not found.'
      using errcode = '42501';
  end if;

  /*
   * Lock the opportunity so two responses cannot be accepted
   * at the same time.
   */
  select opportunity.*
  into v_opportunity
  from public.material_opportunities as opportunity
  where opportunity.id = p_opportunity_id
  for update;

  if not found then
    raise exception 'Opportunity was not found.'
      using errcode = 'P0002';
  end if;

  if v_opportunity.resident_profile_id <> v_resident_profile_id then
    raise exception 'You do not own this opportunity.'
      using errcode = '42501';
  end if;

  /*
   * Lock and validate the selected recycler response.
   */
  select response.*
  into v_response
  from public.opportunity_responses as response
  where response.id = p_response_id
    and response.opportunity_id = p_opportunity_id
  for update;

  if not found then
    raise exception 'Recycler response was not found for this opportunity.'
      using errcode = 'P0002';
  end if;

  /*
   * Make repeat requests safe. A second click on the already
   * accepted response returns the current accepted result.
   */
  if v_opportunity.status = 'accepted'
     and v_opportunity.selected_junkshop_id = v_response.junkshop_id
     and v_response.status = 'accepted' then

    select junkshop.junkshop_name
    into v_junkshop_name
    from public.junkshops as junkshop
    where junkshop.id = v_response.junkshop_id;

    return jsonb_build_object(
      'opportunity_id', v_opportunity.id,
      'response_id', v_response.id,
      'selected_junkshop_id', v_response.junkshop_id,
      'junkshop_name', v_junkshop_name,
      'offered_price_per_kg', v_response.offered_price_per_kg,
      'pickup_available', v_response.pickup_available,
      'status', 'accepted',
      'already_accepted', true
    );
  end if;

  if v_opportunity.status <> 'open' then
    raise exception
      'Only an open opportunity can accept a recycler response.';
  end if;

  if v_response.status <> 'interested' then
    raise exception
      'Only an interested recycler response can be accepted.';
  end if;

  /*
   * Do not assign an inactive or unapproved junkshop.
   */
  select junkshop.junkshop_name
  into v_junkshop_name
  from public.junkshops as junkshop
  where junkshop.id = v_response.junkshop_id
    and junkshop.verification_status = 'approved'
    and junkshop.is_active = true;

  if not found then
    raise exception
      'The selected junkshop is not currently approved and active.';
  end if;

  /*
   * Accept the opportunity and assign the selected junkshop.
   */
  update public.material_opportunities
  set
    status = 'accepted',
    selected_junkshop_id = v_response.junkshop_id,
    updated_at = now()
  where id = p_opportunity_id;

  /*
   * Accept the chosen response.
   */
  update public.opportunity_responses
  set
    status = 'accepted',
    updated_at = now()
  where id = p_response_id;

  /*
   * Decline the remaining active responses while preserving
   * responses that were already withdrawn or declined.
   */
  update public.opportunity_responses
  set
    status = 'declined',
    updated_at = now()
  where opportunity_id = p_opportunity_id
    and id <> p_response_id
    and status = 'interested';

  return jsonb_build_object(
    'opportunity_id', p_opportunity_id,
    'response_id', p_response_id,
    'selected_junkshop_id', v_response.junkshop_id,
    'junkshop_name', v_junkshop_name,
    'offered_price_per_kg', v_response.offered_price_per_kg,
    'pickup_available', v_response.pickup_available,
    'status', 'accepted',
    'already_accepted', false
  );
end;
$function$;

revoke all
on function public.accept_opportunity_response(uuid, uuid)
from public;

grant execute
on function public.accept_opportunity_response(uuid, uuid)
to authenticated;

comment on function public.accept_opportunity_response(uuid, uuid)
is 'Allows the authenticated resident owner to atomically accept one recycler response and decline competing interested responses.';

commit;

/*
 * Ask PostgREST to discover the newly created RPC and its
 * exact named arguments.
 */
notify pgrst, 'reload schema';

/*
 * Verification query. Expected signature:
 * public.accept_opportunity_response(uuid,uuid)
 *
 * Expected arguments:
 * p_opportunity_id uuid, p_response_id uuid
 */
select
  procedure.oid::regprocedure as function_signature,
  pg_get_function_arguments(
    procedure.oid
  ) as function_arguments
from pg_proc as procedure
join pg_namespace as namespace
  on namespace.oid = procedure.pronamespace
where namespace.nspname = 'public'
  and procedure.proname = 'accept_opportunity_response';

  ----------------------


  begin;

create index if not exists material_opportunities_recycler_feed_index
on public.material_opportunities (
  material_id,
  status,
  created_at desc
);

create index if not exists opportunity_responses_junkshop_status_index
on public.opportunity_responses (
  junkshop_id,
  status,
  updated_at desc
);


drop function if exists public.get_recycler_opportunity_dashboard();

create function public.get_recycler_opportunity_dashboard()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $function$
declare
  v_profile_id uuid;
  v_junkshop public.junkshops%rowtype;
  v_accepted_material_count integer;
  v_payload jsonb;
begin
  select profile.id
  into v_profile_id
  from public.profiles as profile
  where profile.auth_id = auth.uid()
    and profile.role = 'recycler_partner'
  limit 1;

  if v_profile_id is null then
    raise exception 'Recycler account was not found.'
      using errcode = '42501';
  end if;

  select junkshop.*
  into v_junkshop
  from public.junkshops as junkshop
  where junkshop.profile_id = v_profile_id
  limit 1;

  if not found then
    return jsonb_build_object(
      'ready', false,
      'reason', 'missing_junkshop',
      'junkshop', null,
      'accepted_material_count', 0,
      'stats', jsonb_build_object(
        'available', 0,
        'interested', 0,
        'accepted', 0,
        'completed', 0
      ),
      'opportunities', '[]'::jsonb
    );
  end if;

  if v_junkshop.verification_status <> 'approved'
     or v_junkshop.is_active is not true then
    return jsonb_build_object(
      'ready', false,
      'reason', 'junkshop_unavailable',
      'junkshop', jsonb_build_object(
        'id', v_junkshop.id,
        'junkshop_name', v_junkshop.junkshop_name,
        'barangay', v_junkshop.barangay,
        'city', v_junkshop.city,
        'province', v_junkshop.province,
        'verification_status', v_junkshop.verification_status,
        'is_active', v_junkshop.is_active
      ),
      'accepted_material_count', 0,
      'stats', jsonb_build_object(
        'available', 0,
        'interested', 0,
        'accepted', 0,
        'completed', 0
      ),
      'opportunities', '[]'::jsonb
    );
  end if;

  select count(*)::integer
  into v_accepted_material_count
  from public.junkshop_materials as junkshop_material
  where junkshop_material.junkshop_id = v_junkshop.id
    and junkshop_material.is_accepting = true;

  if v_accepted_material_count = 0 then
    return jsonb_build_object(
      'ready', false,
      'reason', 'missing_materials',
      'junkshop', jsonb_build_object(
        'id', v_junkshop.id,
        'junkshop_name', v_junkshop.junkshop_name,
        'barangay', v_junkshop.barangay,
        'city', v_junkshop.city,
        'province', v_junkshop.province,
        'verification_status', v_junkshop.verification_status,
        'is_active', v_junkshop.is_active
      ),
      'accepted_material_count', 0,
      'stats', jsonb_build_object(
        'available', 0,
        'interested', 0,
        'accepted', 0,
        'completed', 0
      ),
      'opportunities', '[]'::jsonb
    );
  end if;

  with feed as (
    select
      opportunity.id,
      opportunity.resident_profile_id,
      opportunity.material_id,
      opportunity.scan_id,
      material.material_name,
      material.category,
      opportunity.estimated_weight_kg,
      opportunity.material_condition,
      opportunity.fulfillment_method,
      opportunity.barangay,
      opportunity.city,
      opportunity.province,
      opportunity.status,
      opportunity.selected_junkshop_id,
      opportunity.created_at,
      opportunity.updated_at,

      junkshop_material.price_per_kg as listed_price_per_kg,
      junkshop_material.minimum_weight_kg,
      junkshop_material.accepted_condition,
      junkshop_material.preparation_instructions,

      response.id as response_id,
      response.offered_price_per_kg,
      response.pickup_available,
      response.message,
      response.status as response_status,
      response.created_at as response_created_at,
      response.updated_at as response_updated_at,

      case
        when nullif(trim(opportunity.barangay), '') is not null
         and lower(trim(opportunity.barangay)) =
             lower(trim(coalesce(v_junkshop.barangay, '')))
          then 3

        when nullif(trim(opportunity.city), '') is not null
         and lower(trim(opportunity.city)) =
             lower(trim(coalesce(v_junkshop.city, '')))
          then 2

        when nullif(trim(coalesce(opportunity.province, '')), '') is not null
         and lower(trim(opportunity.province)) =
             lower(trim(coalesce(v_junkshop.province, '')))
          then 1

        else 0
      end as location_score,

      case
        when opportunity.status = 'completed'
         and opportunity.selected_junkshop_id = v_junkshop.id
          then 'completed'

        when opportunity.status = 'accepted'
         and opportunity.selected_junkshop_id = v_junkshop.id
          then 'accepted'

        when opportunity.status = 'open'
         and response.status = 'interested'
          then 'interested'

        when opportunity.status = 'open'
          then 'available'

        else null
      end as bucket,

      case
        when opportunity.status = 'open'
         and response.status = 'interested'
          then 2

        when opportunity.status = 'open'
          then 1

        when opportunity.status = 'accepted'
          then 3

        when opportunity.status = 'completed'
          then 4

        else 5
      end as sort_group

    from public.material_opportunities as opportunity

    join public.materials as material
      on material.id = opportunity.material_id

    join public.junkshop_materials as junkshop_material
      on junkshop_material.material_id = opportunity.material_id
     and junkshop_material.junkshop_id = v_junkshop.id
     and junkshop_material.is_accepting = true

    left join public.opportunity_responses as response
      on response.opportunity_id = opportunity.id
     and response.junkshop_id = v_junkshop.id

    where
      opportunity.status = 'open'
      or (
        opportunity.selected_junkshop_id = v_junkshop.id
        and opportunity.status in ('accepted', 'completed')
      )
  )

  select jsonb_build_object(
    'ready', true,
    'reason', null,

    'junkshop', jsonb_build_object(
      'id', v_junkshop.id,
      'junkshop_name', v_junkshop.junkshop_name,
      'barangay', v_junkshop.barangay,
      'city', v_junkshop.city,
      'province', v_junkshop.province,
      'verification_status', v_junkshop.verification_status,
      'is_active', v_junkshop.is_active
    ),

    'accepted_material_count',
      v_accepted_material_count,

    'stats', jsonb_build_object(
      'available',
        (
          select count(*)::integer
          from feed
          where bucket = 'available'
        ),

      'interested',
        (
          select count(*)::integer
          from feed
          where bucket = 'interested'
        ),

      'accepted',
        (
          select count(*)::integer
          from feed
          where bucket = 'accepted'
        ),

      'completed',
        (
          select count(*)::integer
          from feed
          where bucket = 'completed'
        )
    ),

    'opportunities',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', feed.id,
              'resident_profile_id', feed.resident_profile_id,
              'material_id', feed.material_id,
              'scan_id', feed.scan_id,
              'material_name', feed.material_name,
              'category', feed.category,
              'image_url',
                case
                  when feed.scan_id is not null
                    then '/api/opportunities/' ||
                         feed.id::text ||
                         '/image'
                  else null
                end,
              'estimated_weight_kg', feed.estimated_weight_kg,
              'material_condition', feed.material_condition,
              'fulfillment_method', feed.fulfillment_method,
              'barangay', feed.barangay,
              'city', feed.city,
              'province', feed.province,
              'status', feed.status,
              'selected_junkshop_id', feed.selected_junkshop_id,
              'created_at', feed.created_at,
              'updated_at', feed.updated_at,
              'listed_price_per_kg', feed.listed_price_per_kg,
              'minimum_weight_kg', feed.minimum_weight_kg,
              'accepted_condition', feed.accepted_condition,
              'preparation_instructions', feed.preparation_instructions,
              'location_score', feed.location_score,
              'match_label',
                case feed.location_score
                  when 3 then 'Same barangay'
                  when 2 then 'Same city'
                  when 1 then 'Same province'
                  else 'Other area'
                end,
              'estimated_listed_value',
                feed.estimated_weight_kg *
                feed.listed_price_per_kg,
              'bucket', feed.bucket,
              'response',
                case
                  when feed.response_id is null
                    then null
                  else jsonb_build_object(
                    'id', feed.response_id,
                    'offered_price_per_kg', feed.offered_price_per_kg,
                    'pickup_available', feed.pickup_available,
                    'message', feed.message,
                    'status', feed.response_status,
                    'created_at', feed.response_created_at,
                    'updated_at', feed.response_updated_at
                  )
                end
            )
            order by
              feed.sort_group,
              feed.location_score desc,
              feed.created_at desc
          )
          from feed
          where feed.bucket is not null
        ),
        '[]'::jsonb
      )
  )
  into v_payload;

  return v_payload;
end;
$function$;


drop function if exists public.upsert_recycler_opportunity_response(
  uuid,
  numeric,
  boolean,
  text
);

create function public.upsert_recycler_opportunity_response(
  p_opportunity_id uuid,
  p_offered_price_per_kg numeric,
  p_pickup_available boolean,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_profile_id uuid;
  v_junkshop public.junkshops%rowtype;
  v_opportunity public.material_opportunities%rowtype;
  v_material_listing public.junkshop_materials%rowtype;
  v_response public.opportunity_responses%rowtype;
begin
  if p_offered_price_per_kg is null
     or p_offered_price_per_kg <= 0 then
    raise exception 'The offered price must be greater than zero.';
  end if;

  if length(coalesce(p_message, '')) > 250 then
    raise exception 'The message cannot exceed 250 characters.';
  end if;

  select profile.id
  into v_profile_id
  from public.profiles as profile
  where profile.auth_id = auth.uid()
    and profile.role = 'recycler_partner'
  limit 1;

  if v_profile_id is null then
    raise exception 'Recycler account was not found.'
      using errcode = '42501';
  end if;

  select junkshop.*
  into v_junkshop
  from public.junkshops as junkshop
  where junkshop.profile_id = v_profile_id
    and junkshop.verification_status = 'approved'
    and junkshop.is_active = true
  limit 1;

  if not found then
    raise exception 'An approved and active junkshop is required.'
      using errcode = '42501';
  end if;

  select opportunity.*
  into v_opportunity
  from public.material_opportunities as opportunity
  where opportunity.id = p_opportunity_id
  for update;

  if not found then
    raise exception 'Opportunity was not found.'
      using errcode = 'P0002';
  end if;

  if v_opportunity.status <> 'open' then
    raise exception 'Only an open opportunity can receive an offer.';
  end if;

  select listing.*
  into v_material_listing
  from public.junkshop_materials as listing
  where listing.junkshop_id = v_junkshop.id
    and listing.material_id = v_opportunity.material_id
    and listing.is_accepting = true
  limit 1;

  if not found then
    raise exception 'Your junkshop does not currently accept this material.'
      using errcode = '42501';
  end if;

  if v_opportunity.fulfillment_method = 'pickup'
     and p_pickup_available is not true then
    raise exception 'This resident requires pickup. Enable pickup availability before sending the offer.';
  end if;

  insert into public.opportunity_responses (
    opportunity_id,
    junkshop_id,
    offered_price_per_kg,
    pickup_available,
    message,
    status,
    created_at,
    updated_at
  )
  values (
    v_opportunity.id,
    v_junkshop.id,
    p_offered_price_per_kg,
    coalesce(p_pickup_available, false),
    nullif(trim(coalesce(p_message, '')), ''),
    'interested',
    now(),
    now()
  )
  on conflict (
    opportunity_id,
    junkshop_id
  )
  do update
  set
    offered_price_per_kg = excluded.offered_price_per_kg,
    pickup_available = excluded.pickup_available,
    message = excluded.message,
    status = 'interested',
    updated_at = now()
  returning *
  into v_response;

  return jsonb_build_object(
    'id', v_response.id,
    'opportunity_id', v_response.opportunity_id,
    'junkshop_id', v_response.junkshop_id,
    'offered_price_per_kg', v_response.offered_price_per_kg,
    'pickup_available', v_response.pickup_available,
    'message', v_response.message,
    'status', v_response.status,
    'created_at', v_response.created_at,
    'updated_at', v_response.updated_at
  );
end;
$function$;


drop function if exists public.withdraw_recycler_opportunity_response(uuid);

create function public.withdraw_recycler_opportunity_response(
  p_opportunity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_profile_id uuid;
  v_junkshop_id uuid;
  v_opportunity_status text;
  v_response public.opportunity_responses%rowtype;
begin
  select profile.id
  into v_profile_id
  from public.profiles as profile
  where profile.auth_id = auth.uid()
    and profile.role = 'recycler_partner'
  limit 1;

  if v_profile_id is null then
    raise exception 'Recycler account was not found.'
      using errcode = '42501';
  end if;

  select junkshop.id
  into v_junkshop_id
  from public.junkshops as junkshop
  where junkshop.profile_id = v_profile_id
    and junkshop.verification_status = 'approved'
    and junkshop.is_active = true
  limit 1;

  if v_junkshop_id is null then
    raise exception 'An approved and active junkshop is required.'
      using errcode = '42501';
  end if;

  select opportunity.status
  into v_opportunity_status
  from public.material_opportunities as opportunity
  where opportunity.id = p_opportunity_id
  for update;

  if not found then
    raise exception 'Opportunity was not found.'
      using errcode = 'P0002';
  end if;

  if v_opportunity_status <> 'open' then
    raise exception 'Only responses to open opportunities can be withdrawn.';
  end if;

  update public.opportunity_responses
  set
    status = 'withdrawn',
    updated_at = now()
  where opportunity_id = p_opportunity_id
    and junkshop_id = v_junkshop_id
    and status = 'interested'
  returning *
  into v_response;

  if not found then
    raise exception 'No active response was found.'
      using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'id', v_response.id,
    'opportunity_id', v_response.opportunity_id,
    'status', v_response.status,
    'updated_at', v_response.updated_at
  );
end;
$function$;


revoke all
on function public.get_recycler_opportunity_dashboard()
from public;

revoke all
on function public.upsert_recycler_opportunity_response(
  uuid,
  numeric,
  boolean,
  text
)
from public;

revoke all
on function public.withdraw_recycler_opportunity_response(uuid)
from public;


grant execute
on function public.get_recycler_opportunity_dashboard()
to authenticated;

grant execute
on function public.upsert_recycler_opportunity_response(
  uuid,
  numeric,
  boolean,
  text
)
to authenticated;

grant execute
on function public.withdraw_recycler_opportunity_response(uuid)
to authenticated;

commit;

notify pgrst, 'reload schema';


--------------------------=====-====-=-=-=-=========-
begin;

/*
 * Replace only the recycler dashboard feed.
 * Existing response RPC functions can remain unchanged.
 *
 * The feed now returns every open resident opportunity.
 * Exact material matches are still the only records that can receive an offer.
 */

drop function if exists public.get_recycler_opportunity_dashboard();

create function public.get_recycler_opportunity_dashboard()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $function$
declare
  v_profile_id uuid;
  v_junkshop public.junkshops%rowtype;
  v_accepted_material_count integer;
  v_payload jsonb;
begin
  select profile.id
  into v_profile_id
  from public.profiles as profile
  where profile.auth_id = auth.uid()
    and profile.role = 'recycler_partner'
  limit 1;

  if v_profile_id is null then
    raise exception 'Recycler account was not found.'
      using errcode = '42501';
  end if;

  select junkshop.*
  into v_junkshop
  from public.junkshops as junkshop
  where junkshop.profile_id = v_profile_id
  limit 1;

  if not found then
    return jsonb_build_object(
      'ready', false,
      'reason', 'missing_junkshop',
      'junkshop', null,
      'accepted_material_count', 0,
      'stats', jsonb_build_object(
        'available', 0,
        'interested', 0,
        'accepted', 0,
        'completed', 0
      ),
      'opportunities', '[]'::jsonb
    );
  end if;

  if v_junkshop.verification_status <> 'approved'
     or v_junkshop.is_active is not true then
    return jsonb_build_object(
      'ready', false,
      'reason', 'junkshop_unavailable',
      'junkshop', jsonb_build_object(
        'id', v_junkshop.id,
        'junkshop_name', v_junkshop.junkshop_name,
        'barangay', v_junkshop.barangay,
        'city', v_junkshop.city,
        'province', v_junkshop.province,
        'verification_status', v_junkshop.verification_status,
        'is_active', v_junkshop.is_active
      ),
      'accepted_material_count', 0,
      'stats', jsonb_build_object(
        'available', 0,
        'interested', 0,
        'accepted', 0,
        'completed', 0
      ),
      'opportunities', '[]'::jsonb
    );
  end if;

  select count(*)::integer
  into v_accepted_material_count
  from public.junkshop_materials as junkshop_material
  where junkshop_material.junkshop_id = v_junkshop.id
    and junkshop_material.is_accepting = true;

  with feed as (
    select
      opportunity.id,
      opportunity.resident_profile_id,
      opportunity.material_id,
      opportunity.scan_id,
      material.material_name,
      material.category,
      opportunity.estimated_weight_kg,
      opportunity.material_condition,
      opportunity.fulfillment_method,
      opportunity.barangay,
      opportunity.city,
      opportunity.province,
      opportunity.status,
      opportunity.selected_junkshop_id,
      opportunity.created_at,
      opportunity.updated_at,

      exact_listing.price_per_kg as listed_price_per_kg,
      exact_listing.minimum_weight_kg,
      exact_listing.accepted_condition,
      exact_listing.preparation_instructions,

      response.id as response_id,
      response.offered_price_per_kg,
      response.pickup_available,
      response.message,
      response.status as response_status,
      response.created_at as response_created_at,
      response.updated_at as response_updated_at,

      (exact_listing.id is not null) as exact_material_match,

      exists (
        select 1
        from public.junkshop_materials as category_listing
        join public.materials as accepted_material
          on accepted_material.id = category_listing.material_id
        where category_listing.junkshop_id = v_junkshop.id
          and category_listing.is_accepting = true
          and lower(trim(accepted_material.category)) =
              lower(trim(material.category))
      ) as same_category_match,

      case
        when exact_listing.id is not null then 'exact'
        when exists (
          select 1
          from public.junkshop_materials as category_listing
          join public.materials as accepted_material
            on accepted_material.id = category_listing.material_id
          where category_listing.junkshop_id = v_junkshop.id
            and category_listing.is_accepting = true
            and lower(trim(accepted_material.category)) =
                lower(trim(material.category))
        ) then 'category'
        else 'unconfigured'
      end as match_type,

      case
        when exact_listing.id is not null
         and opportunity.status = 'open'
          then true
        else false
      end as can_respond,

      case
        when nullif(trim(opportunity.barangay), '') is not null
         and lower(trim(opportunity.barangay)) =
             lower(trim(coalesce(v_junkshop.barangay, '')))
          then 3
        when nullif(trim(opportunity.city), '') is not null
         and lower(trim(opportunity.city)) =
             lower(trim(coalesce(v_junkshop.city, '')))
          then 2
        when nullif(trim(coalesce(opportunity.province, '')), '') is not null
         and lower(trim(opportunity.province)) =
             lower(trim(coalesce(v_junkshop.province, '')))
          then 1
        else 0
      end as location_score,

      case
        when opportunity.status = 'completed'
         and opportunity.selected_junkshop_id = v_junkshop.id
          then 'completed'
        when opportunity.status = 'accepted'
         and opportunity.selected_junkshop_id = v_junkshop.id
          then 'accepted'
        when opportunity.status = 'open'
         and response.status = 'interested'
          then 'interested'
        when opportunity.status = 'open'
          then 'available'
        else null
      end as bucket,

      case
        when exact_listing.id is not null then 3
        when exists (
          select 1
          from public.junkshop_materials as category_listing
          join public.materials as accepted_material
            on accepted_material.id = category_listing.material_id
          where category_listing.junkshop_id = v_junkshop.id
            and category_listing.is_accepting = true
            and lower(trim(accepted_material.category)) =
                lower(trim(material.category))
        ) then 2
        else 1
      end as material_match_score

    from public.material_opportunities as opportunity

    join public.materials as material
      on material.id = opportunity.material_id

    left join public.junkshop_materials as exact_listing
      on exact_listing.material_id = opportunity.material_id
     and exact_listing.junkshop_id = v_junkshop.id
     and exact_listing.is_accepting = true

    left join public.opportunity_responses as response
      on response.opportunity_id = opportunity.id
     and response.junkshop_id = v_junkshop.id

    where
      opportunity.status = 'open'
      or (
        opportunity.selected_junkshop_id = v_junkshop.id
        and opportunity.status in ('accepted', 'completed')
      )
  )

  select jsonb_build_object(
    'ready', true,
    'reason', null,

    'junkshop', jsonb_build_object(
      'id', v_junkshop.id,
      'junkshop_name', v_junkshop.junkshop_name,
      'barangay', v_junkshop.barangay,
      'city', v_junkshop.city,
      'province', v_junkshop.province,
      'verification_status', v_junkshop.verification_status,
      'is_active', v_junkshop.is_active
    ),

    'accepted_material_count', v_accepted_material_count,

    'stats', jsonb_build_object(
      'available', (
        select count(*)::integer
        from feed
        where bucket = 'available'
      ),
      'interested', (
        select count(*)::integer
        from feed
        where bucket = 'interested'
      ),
      'accepted', (
        select count(*)::integer
        from feed
        where bucket = 'accepted'
      ),
      'completed', (
        select count(*)::integer
        from feed
        where bucket = 'completed'
      )
    ),

    'opportunities', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', feed.id,
            'resident_profile_id', feed.resident_profile_id,
            'material_id', feed.material_id,
            'scan_id', feed.scan_id,
            'material_name', feed.material_name,
            'category', feed.category,
            'image_url', case
              when feed.scan_id is not null
                then '/api/opportunities/' || feed.id::text || '/image'
              else null
            end,
            'estimated_weight_kg', feed.estimated_weight_kg,
            'material_condition', feed.material_condition,
            'fulfillment_method', feed.fulfillment_method,
            'barangay', feed.barangay,
            'city', feed.city,
            'province', feed.province,
            'status', feed.status,
            'selected_junkshop_id', feed.selected_junkshop_id,
            'created_at', feed.created_at,
            'updated_at', feed.updated_at,

            'listed_price_per_kg', feed.listed_price_per_kg,
            'minimum_weight_kg', feed.minimum_weight_kg,
            'accepted_condition', feed.accepted_condition,
            'preparation_instructions', feed.preparation_instructions,

            'exact_material_match', feed.exact_material_match,
            'same_category_match', feed.same_category_match,
            'match_type', feed.match_type,
            'material_match_score', feed.material_match_score,
            'can_respond', feed.can_respond,

            'location_score', feed.location_score,
            'match_label', case feed.location_score
              when 3 then 'Same barangay'
              when 2 then 'Same city'
              when 1 then 'Same province'
              else 'Other area'
            end,

            'estimated_listed_value', case
              when feed.listed_price_per_kg is null then null
              else feed.estimated_weight_kg * feed.listed_price_per_kg
            end,

            'bucket', feed.bucket,

            'response', case
              when feed.response_id is null then null
              else jsonb_build_object(
                'id', feed.response_id,
                'offered_price_per_kg', feed.offered_price_per_kg,
                'pickup_available', feed.pickup_available,
                'message', feed.message,
                'status', feed.response_status,
                'created_at', feed.response_created_at,
                'updated_at', feed.response_updated_at
              )
            end
          )
          order by
            feed.material_match_score desc,
            feed.location_score desc,
            feed.created_at desc
        )
        from feed
        where feed.bucket is not null
      ),
      '[]'::jsonb
    )
  )
  into v_payload;

  return v_payload;
end;
$function$;

revoke all
on function public.get_recycler_opportunity_dashboard()
from public;

grant execute
on function public.get_recycler_opportunity_dashboard()
to authenticated;

commit;

notify pgrst, 'reload schema';

begin;

-- 1. Require a confirmed actual weight before an opportunity can be completed.
create or replace function public.sync_material_opportunity_completion()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at := now();

  if new.status = 'completed' then
    if new.actual_weight_kg is null or new.actual_weight_kg <= 0 then
      raise exception 'An actual weight greater than zero is required before completion.'
        using errcode = '22023';
    end if;

    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;

  return new;
end;
$function$;

-- Recreate the trigger so changes to either status or actual weight are checked.
drop trigger if exists material_opportunities_completion_trigger
on public.material_opportunities;

create trigger material_opportunities_completion_trigger
before insert or update of status, actual_weight_kg
on public.material_opportunities
for each row
execute function public.sync_material_opportunity_completion();

-- Enforce the rule for all new and updated rows without failing on older legacy data.
alter table public.material_opportunities
  drop constraint if exists material_opportunities_completed_weight_check;

alter table public.material_opportunities
  add constraint material_opportunities_completed_weight_check
  check (
    status <> 'completed'
    or (
      actual_weight_kg is not null
      and actual_weight_kg > 0
      and completed_at is not null
    )
  )
  not valid;

-- 2. Complete one accepted recovery as the authenticated recycler.
create or replace function public.complete_recycler_material_opportunity(
  p_opportunity_id uuid,
  p_actual_weight_kg numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_opportunity public.material_opportunities%rowtype;
  v_is_owner boolean := false;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.'
      using errcode = '42501';
  end if;

  if p_actual_weight_kg is null or p_actual_weight_kg <= 0 then
    raise exception 'Enter an actual weight greater than zero.'
      using errcode = '22023';
  end if;

  select opportunity.*
  into v_opportunity
  from public.material_opportunities as opportunity
  where opportunity.id = p_opportunity_id
  for update;

  if not found then
    raise exception 'The recovery opportunity was not found.'
      using errcode = 'P0002';
  end if;

  select exists (
    select 1
    from public.junkshops as junkshop
    join public.profiles as profile
      on profile.id = junkshop.profile_id
    where junkshop.id = v_opportunity.selected_junkshop_id
      and profile.auth_id = auth.uid()
      and junkshop.verification_status = 'approved'
      and junkshop.is_active = true
  )
  into v_is_owner;

  if not v_is_owner then
    raise exception 'This recovery is not assigned to your active junkshop.'
      using errcode = '42501';
  end if;

  if v_opportunity.status = 'completed' then
    return jsonb_build_object(
      'opportunity_id', v_opportunity.id,
      'status', v_opportunity.status,
      'actual_weight_kg', v_opportunity.actual_weight_kg,
      'completed_at', v_opportunity.completed_at,
      'already_completed', true
    );
  end if;

  if v_opportunity.status <> 'accepted' then
    raise exception 'Only an accepted recovery can be completed.'
      using errcode = '22023';
  end if;

  update public.material_opportunities
  set
    actual_weight_kg = round(p_actual_weight_kg, 2),
    status = 'completed',
    completed_at = now()
  where id = p_opportunity_id
  returning *
  into v_opportunity;

  return jsonb_build_object(
    'opportunity_id', v_opportunity.id,
    'status', v_opportunity.status,
    'actual_weight_kg', v_opportunity.actual_weight_kg,
    'completed_at', v_opportunity.completed_at,
    'already_completed', false
  );
end;
$function$;

-- 3. Return actual weights and completion dates for this recycler's assigned rows.
create or replace function public.get_recycler_opportunity_completion_details()
returns jsonb
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'opportunity_id', opportunity.id,
        'actual_weight_kg', opportunity.actual_weight_kg,
        'completed_at', opportunity.completed_at
      )
      order by opportunity.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.material_opportunities as opportunity
  join public.junkshops as junkshop
    on junkshop.id = opportunity.selected_junkshop_id
  join public.profiles as profile
    on profile.id = junkshop.profile_id
  where profile.auth_id = auth.uid()
    and junkshop.verification_status = 'approved'
    and junkshop.is_active = true
    and opportunity.status in ('accepted', 'completed');
$function$;

revoke all
on function public.complete_recycler_material_opportunity(uuid, numeric)
from public;

grant execute
on function public.complete_recycler_material_opportunity(uuid, numeric)
to authenticated;

revoke all
on function public.get_recycler_opportunity_completion_details()
from public;

grant execute
on function public.get_recycler_opportunity_completion_details()
to authenticated;

commit;

notify pgrst, 'reload schema';