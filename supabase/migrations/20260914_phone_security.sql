-- Nightgram phone integration hardening
-- Phone numbers are stored on profiles for app-level profile data.
-- Supabase Auth remains the source of truth for authentication and verification.

create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone)
  where phone is not null and phone <> '';

comment on column public.profiles.phone is 'Verified mobile number associated with the Supabase Auth user; store in E.164 format.';
