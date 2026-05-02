alter table people
  add column if not exists middle_name text,
  add column if not exists nickname text;
