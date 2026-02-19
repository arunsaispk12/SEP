-- Simple schema without RLS policies (to avoid recursion)
-- Enable the uuid-ossp extension for UUID generation
create extension if not exists "uuid-ossp";

-- profiles table - core user profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text not null,
  role text not null default 'engineer' check (role in ('engineer', 'manager', 'admin')),
  is_admin boolean default false,
  location_id integer,
  phone text,
  bio text,
  skills text[] default '{}',
  certifications text[] default '{}',
  experience_years integer default 0,
  avatar text,
  is_available boolean default true,
  is_active boolean default true,
  last_login timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- locations table - service locations
create table public.locations (
  id serial primary key,
  name text not null unique,
  address text,
  city text,
  state text,
  pincode text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- cases table - service requests/cases
create table public.cases (
  id bigserial primary key,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  category text, -- e.g., 'hardware', 'software', 'network', 'maintenance'
  location_id integer references public.locations(id) on delete set null,
  assigned_engineer_id uuid references public.profiles(id) on delete set null,
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
  created_by uuid references public.profiles(id) not null,
  completed_by uuid references public.profiles(id),
  notes text,
  attachments text[], -- URLs to uploaded files
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- schedules table - engineer schedules and appointments
create table public.schedules (
  id bigserial primary key,
  engineer_id uuid not null references public.profiles(id) on delete cascade,
  case_id bigint references public.cases(id) on delete set null,
  location_id integer references public.locations(id) on delete set null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  is_recurring boolean default false,
  recurrence_rule text, -- RRULE format for recurring events
  recurrence_id bigint, -- Links recurring instances
  is_all_day boolean default false,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_by uuid references public.profiles(id) not null,
  updated_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_time_range check (end_time > start_time)
);

-- leaves table - employee leave management
create table public.leaves (
  id bigserial primary key,
  engineer_id uuid not null references public.profiles(id) on delete cascade,
  leave_type text not null check (leave_type in ('vacation', 'sick', 'personal', 'emergency', 'maternity', 'paternity')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  start_date date not null,
  end_date date not null,
  total_days integer generated always as (
    case
      when end_date >= start_date then (end_date - start_date + 1)
      else 0
    end
  ) stored,
  reason text,
  emergency_contact text,
  approved_by uuid references public.profiles(id),
  approved_at timestamp with time zone,
  rejected_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_date_range check (end_date >= start_date),
  constraint max_leave_duration check (total_days <= 30)
);

-- Seed data
insert into public.locations (name, address, city, state, pincode) values
('Hyderabad Office', '123 Tech Park, Gachibowli', 'Hyderabad', 'Telangana', '500032'),
('Bangalore Office', '456 Silicon Valley, Whitefield', 'Bangalore', 'Karnataka', '560066'),
('Coimbatore Office', '789 Industrial Area, Peelamedu', 'Coimbatore', 'Tamil Nadu', '641004'),
('Chennai Office', '321 IT Corridor, T. Nagar', 'Chennai', 'Tamil Nadu', '600017')
on conflict (name) do nothing;