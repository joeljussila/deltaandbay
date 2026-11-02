-- Tap-to-choose questions added to /apply on 16 Oct 2026, so the 15-minute call can be prepared in advance.
-- Verified present in production on 2026-11-02: columns, constraints and INSERT grants
-- match this migration. Do not rerun it against an already-migrated database.
-- All columns are nullable so earlier applications stay valid. The personal website field left the form;
-- its column stays for existing rows.
begin;
-- "Can you join for the full trip?" gains a "Not sure yet" answer.
alter table public.applications
  drop constraint applications_dates_check,
  add constraint applications_dates_check check (dates in ('Yes','Not sure yet','No'));
alter table public.applications
  add column stage text check (stage is null or stage in ('Idea or research','Prototype','First production batch','Shipping product','I''m an investor')),
  add column timing text check (timing is null or timing in ('Within 3 months','In 3–6 months','In 6–12 months','Not right now')),
  add column wants text[] check (wants is null or (cardinality(wants) between 1 and 6 and wants <@ array['Suppliers for my parts','Factory visits','Chinese robotics companies','Robots deployed in the real world','Local founders and investors','The electronics market'])),
  add column parts text[] check (parts is null or (cardinality(parts) between 1 and 7 and parts <@ array['Actuators and motors','PCBs and electronics','Machining and metal parts','Cameras and sensors','Tactile sensing and gloves','Batteries and power','Other'])),
  add column teammate text check (teammate is null or teammate in ('Yes','Maybe','No'));
grant insert (stage, timing, wants, parts, teammate) on public.applications to anon, authenticated;
commit;
