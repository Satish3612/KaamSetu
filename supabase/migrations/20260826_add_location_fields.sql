-- Safe, additive KaamSetu location fields. Existing rows remain valid.
alter table public.service_requests
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_source text;

alter table public.service_requests
  drop constraint if exists service_requests_location_source_check;

alter table public.service_requests
  add constraint service_requests_location_source_check
  check (location_source is null or location_source in ('gps', 'manual'));

alter table public.professionals
  add column if not exists current_latitude double precision,
  add column if not exists current_longitude double precision,
  add column if not exists location_updated_at timestamptz;

comment on column public.service_requests.latitude is 'Customer-provided GPS latitude; nullable for legacy/manual requests.';
comment on column public.service_requests.longitude is 'Customer-provided GPS longitude; nullable for legacy/manual requests.';
comment on column public.service_requests.location_source is 'Customer location source: gps or manual.';
comment on column public.professionals.location_updated_at is 'Last manual professional location update time; not continuous tracking.';
