-- Service Engineer Planner Database Schema
-- Complete schema with all required tables

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- locations table - service locations
create table if not exists public.locations (
  id serial primary key,
  name text not null unique,
  address text,
  city text,
  state text,
  pincode text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- clients table - IVF Hospitals and Fertility Centres
create table if not exists public.clients (
  id serial primary key,
  name text not null,
  location_id integer references public.locations(id) on delete set null,
  contact_person text,
  designation text,
  mobile text,
  address text,
  assigned_executive_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  is_disclosed boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for clients
alter table public.clients enable row level security;

create policy "Users can view disclosed clients"
  on public.clients for select
  using (is_disclosed = true or auth.uid() = assigned_executive_id or auth.uid() = created_by or exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager')
  ));

create policy "Users can insert clients"
  on public.clients for insert
  with check (auth.role() = 'authenticated');

create policy "Owners and Admins can update clients"
  on public.clients for update
  using (auth.uid() = created_by or auth.uid() = assigned_executive_id or exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager')
  ));

create policy "Admins and Managers can delete clients"
  on public.clients for delete
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager')
  ));

-- profiles table - user profiles for authentication
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null default 'engineer' check (role in ('engineer', 'manager', 'admin', 'executive', 'client')),
  is_approved boolean default false,
  is_admin boolean default false,
  location_id integer references public.locations(id) on delete set null,
  current_location_id integer references public.locations(id) on delete set null,
  phone text,
  bio text,
  skills text[],
  certifications text[],
  experience_years integer default 0,
  avatar text default '👤',
  is_available boolean default true,
  is_active boolean default true,
  laser_type text,
  serial_number text,
  tracker_status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- engineers table - engineer-specific information
create table if not exists public.engineers (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  phone text,
  location_id integer references public.locations(id) on delete set null,
  current_location_id integer references public.locations(id) on delete set null,
  skills text[],
  certifications text[],
  experience_years integer default 0,
  is_available boolean default true,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- cases table - service requests/cases
create table if not exists public.cases (
  id bigserial primary key,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  category text,
  location_id integer references public.locations(id) on delete set null,
  assigned_engineer_id uuid references auth.users(id) on delete set null,
  client_name text,
  client_email text,
  client_phone text,
  client_address text,
  estimated_duration_hours integer,
  actual_duration_hours integer,
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  actual_start timestamp with time zone,
  actual_end timestamp with time zone,
  created_by uuid references auth.users(id) not null,
  completed_by uuid references auth.users(id),
  notes text,
  completion_details jsonb,
  attachments text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- schedules table - engineer schedules and appointments
create table if not exists public.schedules (
  id bigserial primary key,
  engineer_id uuid not null references auth.users(id) on delete cascade,
  case_id bigint references public.cases(id) on delete set null,
  client_id integer references public.clients(id) on delete set null,
  location_id integer references public.locations(id) on delete set null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  is_recurring boolean default false,
  recurrence_rule text,
  recurrence_id bigint,
  is_all_day boolean default false,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_by uuid references auth.users(id) not null,
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_time_range check (end_time > start_time)
);

-- leaves table - engineer leave requests
create table if not exists public.leaves (
  id bigserial primary key,
  engineer_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null check (leave_type in ('annual', 'sick', 'personal', 'emergency')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  approved_by uuid references auth.users(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_date_range check (end_date >= start_date)
);

-- user_sessions table - session management
create table if not exists public.user_sessions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_token text not null unique,
  device_info jsonb,
  ip_address text,
  user_agent text,
  expires_at timestamp with time zone not null,
  last_activity timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- google_calendar_tokens table - OAuth tokens
create table if not exists public.google_calendar_tokens (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  access_token text not null,
  refresh_token text,
  token_type text default 'Bearer',
  expires_at timestamp with time zone,
  scope text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- notifications table - user notifications
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info', 'warning', 'error', 'success')),
  is_read boolean default false,
  related_id bigint,
  related_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- audit_logs table - audit trail (admin only)
create table if not exists public.audit_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text,
  record_id bigint,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.engineers enable row level security;
alter table public.cases enable row level security;
alter table public.schedules enable row level security;
alter table public.leaves enable row level security;
alter table public.user_sessions enable row level security;
alter table public.google_calendar_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.locations enable row level security;

-- Drop existing policies if they exist
drop policy if exists "cases_select" on public.cases;
drop policy if exists "cases_insert" on public.cases;
drop policy if exists "cases_update" on public.cases;
drop policy if exists "schedules_select" on public.schedules;
drop policy if exists "schedules_insert" on public.schedules;
drop policy if exists "schedules_update" on public.schedules;
drop policy if exists "schedules_delete" on public.schedules;

-- Cases policies - simple ownership-based
create policy "cases_select" on public.cases for select using (
  created_by = auth.uid() or assigned_engineer_id = auth.uid()
);
create policy "cases_insert" on public.cases for insert with check (created_by = auth.uid());
create policy "cases_update" on public.cases for update using (
  created_by = auth.uid() or assigned_engineer_id = auth.uid()
);

-- Schedules policies - simple ownership-based
create policy "schedules_select" on public.schedules for select using (
  engineer_id = auth.uid() or created_by = auth.uid()
);
create policy "schedules_insert" on public.schedules for insert with check (created_by = auth.uid());
create policy "schedules_update" on public.schedules for update using (
  engineer_id = auth.uid() or created_by = auth.uid()
);
create policy "schedules_delete" on public.schedules for delete using (created_by = auth.uid());

-- Drop existing policies if they exist
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "engineers_select" on public.engineers;
drop policy if exists "engineers_insert" on public.engineers;
drop policy if exists "engineers_update" on public.engineers;
drop policy if exists "cases_select" on public.cases;
drop policy if exists "cases_insert" on public.cases;
drop policy if exists "cases_update" on public.cases;
drop policy if exists "schedules_select" on public.schedules;
drop policy if exists "schedules_insert" on public.schedules;
drop policy if exists "schedules_update" on public.schedules;
drop policy if exists "schedules_delete" on public.schedules;
drop policy if exists "leaves_select" on public.leaves;
drop policy if exists "leaves_insert" on public.leaves;
drop policy if exists "leaves_update" on public.leaves;
drop policy if exists "locations_select" on public.locations;
drop policy if exists "locations_insert" on public.locations;
drop policy if exists "locations_update" on public.locations;
drop policy if exists "sessions_select" on public.user_sessions;
drop policy if exists "sessions_insert" on public.user_sessions;
drop policy if exists "sessions_update" on public.user_sessions;
drop policy if exists "tokens_select" on public.google_calendar_tokens;
drop policy if exists "tokens_insert" on public.google_calendar_tokens;
drop policy if exists "tokens_update" on public.google_calendar_tokens;
drop policy if exists "tokens_delete" on public.google_calendar_tokens;
drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;
drop policy if exists "notifications_delete" on public.notifications;
drop policy if exists "audit_logs_select" on public.audit_logs;

-- Profiles policies - user profile management
create policy "profiles_select" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_insert" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
for update using (auth.uid() = id);

-- Engineers policies - engineer management (admin/manager access)
create policy "engineers_select" on public.engineers
for select using (true); -- Allow all authenticated users to view engineers

create policy "engineers_insert" on public.engineers
for insert with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

create policy "engineers_update" on public.engineers
for update using (
  auth.uid() = id or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

-- Cases policies - case management
create policy "cases_select" on public.cases
for select using (
  created_by = auth.uid() or
  assigned_engineer_id = auth.uid() or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

create policy "cases_insert" on public.cases
for insert with check (created_by = auth.uid());

create policy "cases_update" on public.cases
for update using (
  created_by = auth.uid() or
  assigned_engineer_id = auth.uid() or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

-- Schedules policies - schedule management
create policy "schedules_select" on public.schedules
for select using (
  engineer_id = auth.uid() or
  created_by = auth.uid() or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

create policy "schedules_insert" on public.schedules
for insert with check (created_by = auth.uid());

create policy "schedules_update" on public.schedules
for update using (
  engineer_id = auth.uid() or
  created_by = auth.uid() or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

create policy "schedules_delete" on public.schedules
for delete using (
  created_by = auth.uid() or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

-- Leaves policies - leave management
create policy "leaves_select" on public.leaves
for select using (
  engineer_id = auth.uid() or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

create policy "leaves_insert" on public.leaves
for insert with check (engineer_id = auth.uid());

create policy "leaves_update" on public.leaves
for update using (
  engineer_id = auth.uid() or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

-- Locations policies - location management
create policy "locations_select" on public.locations
for select using (true); -- Allow all authenticated users to view locations

create policy "locations_insert" on public.locations
for insert with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

create policy "locations_update" on public.locations
for update using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('manager', 'admin') or is_admin = true)
  )
);

-- User sessions policies - session management
create policy "sessions_select" on public.user_sessions
for select using (auth.uid() = user_id);

create policy "sessions_insert" on public.user_sessions
for insert with check (auth.uid() = user_id);

create policy "sessions_update" on public.user_sessions
for update using (auth.uid() = user_id);

-- Google tokens policies - OAuth security
create policy "tokens_select" on public.google_calendar_tokens
for select using (auth.uid() = user_id);

create policy "tokens_insert" on public.google_calendar_tokens
for insert with check (auth.uid() = user_id);

create policy "tokens_update" on public.google_calendar_tokens
for update using (auth.uid() = user_id);

create policy "tokens_delete" on public.google_calendar_tokens
for delete using (auth.uid() = user_id);

-- Notifications policies - user notifications
create policy "notifications_select" on public.notifications
for select using (auth.uid() = user_id);

create policy "notifications_insert" on public.notifications
for insert with check (auth.uid() = user_id);

create policy "notifications_update" on public.notifications
for update using (auth.uid() = user_id);

create policy "notifications_delete" on public.notifications
for delete using (auth.uid() = user_id);

-- Audit logs policies - admin-only access
create policy "audit_logs_select" on public.audit_logs
for select using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'admin' or is_admin = true)
  )
);

-- Simple update timestamp function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_engineers_updated_at
  before update on public.engineers
  for each row execute procedure public.handle_updated_at();

create trigger handle_cases_updated_at
  before update on public.cases
  for each row execute procedure public.handle_updated_at();

create trigger handle_schedules_updated_at
  before update on public.schedules
  for each row execute procedure public.handle_updated_at();

create trigger handle_leaves_updated_at
  before update on public.leaves
  for each row execute procedure public.handle_updated_at();

create trigger handle_user_sessions_updated_at
  before update on public.user_sessions
  for each row execute procedure public.handle_updated_at();

create trigger handle_google_calendar_tokens_updated_at
  before update on public.google_calendar_tokens
  for each row execute procedure public.handle_updated_at();

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'engineer');
  insert into public.profiles (id, name, email, role, is_admin, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    user_role,
    coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false),
    case 
      when user_role = 'admin' then true 
      else false 
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed data
insert into public.locations (name, address, city, state, pincode) values
('Hyderabad Office', '123 Tech Park, Gachibowli', 'Hyderabad', 'Telangana', '500032'),
('Bangalore Office', '456 Silicon Valley, Whitefield', 'Bangalore', 'Karnataka', '560066'),
('Coimbatore Office', '789 Industrial Area, Peelamedu', 'Coimbatore', 'Tamil Nadu', '641004'),
('Chennai Office', '321 IT Corridor, T. Nagar', 'Chennai', 'Tamil Nadu', '600017')
on conflict (name) do nothing;
