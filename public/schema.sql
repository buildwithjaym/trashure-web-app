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