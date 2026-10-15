-- LAST NITE — run this entire file in the Supabase SQL editor.
-- Images live in Storage. The database only stores metadata and votes.
-- RLS is enabled: anonymous users cannot read or write captioned images.

drop table if exists public.caption_votes cascade;
drop table if exists public.captioned_images cascade;
drop table if exists public.excuse_votes cascade;
drop table if exists public.email_excuses cascade;

create table public.captioned_images (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    storage_path text not null,
    image_url text not null,
    caption text not null check (char_length(caption) between 1 and 280),
    created_at timestamptz not null default now()
);

create index captioned_images_created_at_idx on public.captioned_images (created_at desc);
create index captioned_images_user_id_idx on public.captioned_images (user_id);

create table public.caption_votes (
    image_id uuid not null references public.captioned_images (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    vote_value smallint not null check (vote_value in (-1, 1)),
    created_at timestamptz not null default now(),
    primary key (image_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.captioned_images enable row level security;
alter table public.caption_votes enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "captioned_images_select_authenticated" on public.captioned_images;
drop policy if exists "captioned_images_insert_own" on public.captioned_images;
drop policy if exists "captioned_images_delete_own" on public.captioned_images;
drop policy if exists "caption_votes_select_authenticated" on public.caption_votes;
drop policy if exists "caption_votes_upsert_own" on public.caption_votes;
drop policy if exists "caption_votes_update_own" on public.caption_votes;

create policy "profiles_select_authenticated"
    on public.profiles for select
    to authenticated
    using (true);

create policy "profiles_insert_own"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

create policy "profiles_update_own"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "captioned_images_select_authenticated"
    on public.captioned_images for select
    to authenticated
    using (true);

create policy "captioned_images_insert_own"
    on public.captioned_images for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "captioned_images_delete_own"
    on public.captioned_images for delete
    to authenticated
    using (auth.uid() = user_id);

create policy "caption_votes_select_authenticated"
    on public.caption_votes for select
    to authenticated
    using (true);

create policy "caption_votes_upsert_own"
    on public.caption_votes for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "caption_votes_update_own"
    on public.caption_votes for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('captioned-images', 'captioned-images', true)
on conflict (id) do update set public = true;

drop policy if exists "captioned_images_public_read" on storage.objects;
drop policy if exists "captioned_images_authenticated_insert" on storage.objects;
drop policy if exists "captioned_images_authenticated_update" on storage.objects;
drop policy if exists "captioned_images_authenticated_delete" on storage.objects;

create policy "captioned_images_public_read"
    on storage.objects for select
    to public
    using (bucket_id = 'captioned-images');

create policy "captioned_images_authenticated_insert"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'captioned-images'
        and split_part(name, '/', 1) = auth.uid()::text
    );

create policy "captioned_images_authenticated_update"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'captioned-images'
        and split_part(name, '/', 1) = auth.uid()::text
    )
    with check (
        bucket_id = 'captioned-images'
        and split_part(name, '/', 1) = auth.uid()::text
    );

create policy "captioned_images_authenticated_delete"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'captioned-images'
        and split_part(name, '/', 1) = auth.uid()::text
    );
