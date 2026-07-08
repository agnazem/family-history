-- Enable Row-Level Security on all public tables that were missing it.
-- Policies for every operation already exist on each table; this just activates enforcement.
-- is_family_member / is_family_admin are SECURITY DEFINER so no recursion risk.

alter table public.families        enable row level security;
alter table public.family_members  enable row level security;
alter table public.invitations     enable row level security;
alter table public.memories        enable row level security;
alter table public.people          enable row level security;
alter table public.relationships   enable row level security;
