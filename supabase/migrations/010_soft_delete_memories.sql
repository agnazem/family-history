-- Soft delete for memories
alter table public.memories
  add column if not exists deleted_at timestamptz;

-- Index for efficient filtering
create index if not exists memories_deleted_at_idx
  on public.memories (deleted_at)
  where deleted_at is null;

-- Update RLS: deleted memories are invisible to regular members but admins can still see them
-- We rely on app-level filtering for admin queries; the existing RLS remains in place.
