create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.get_nightgram_moments_cleanup_secret()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'nightgram_moments_cleanup_token'
  limit 1;
$$;

revoke all on function public.get_nightgram_moments_cleanup_secret() from public, anon, authenticated;
grant execute on function public.get_nightgram_moments_cleanup_secret() to service_role;

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'nightgram_moments_cleanup_token'
  ) then
    perform vault.create_secret(
      'ngm_' || gen_random_uuid()::text || gen_random_uuid()::text,
      'nightgram_moments_cleanup_token',
      'Internal authentication token for scheduled cleanup of expired Nightgram Moments'
    );
  end if;
end
$$;

select cron.unschedule(jobid)
from cron.job
where jobname = 'nightgram-moments-cleanup';

select cron.schedule(
  'nightgram-moments-cleanup',
  '*/15 * * * *',
  $job$
    select net.http_post(
      url := 'https://difccvkjzsrdszywarqb.supabase.co/functions/v1/nightgram-moments-cleanup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cleanup-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'nightgram_moments_cleanup_token'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);
