-- Add AI-generated summary field to people
-- Run this in the Supabase SQL editor: https://app.supabase.com → SQL Editor

alter table people
  add column if not exists ai_summary text;
