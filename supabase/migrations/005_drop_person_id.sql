-- ============================================================
-- 005_drop_person_id.sql
--
-- IMPORTANT: Run ONLY after deploying the code changes that:
--   1. Remove `person_id` from AddMemoryModal inserts (use RPC instead)
--   2. Remove `person_id: string` from the Memory TypeScript interface
--
-- Running this before those code changes will break active inserts.
-- ============================================================

alter table public.memories drop column person_id;
