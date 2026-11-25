-- =====================================================================
-- TMG TMS - cài đặt máy chủ dữ liệu Supabase (chạy 1 lần, chạy lại cũng an toàn)
-- Supabase Dashboard -> SQL Editor -> New query -> dán toàn bộ file -> Run
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- ---------- Bảng ----------
-- Mọi bảng nghiệp vụ (xe, tài xế, chuyến, doanh thu, chi phí...) lưu chung 1 bảng,
-- mỗi dòng = 1 bản ghi JSON, phân biệt bằng cột col (giống cấu trúc trong ứng dụng)
create table if not exists public.tmg_records (
  col text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
create index if not exists tmg_records_updated_idx on public.tmg_records (updated_at);
create index if not exists tmg_records_vehicle_idx on public.tmg_records (col, (data->>'vehicle_id'));
create index if not exists tmg_records_driver_idx on public.tmg_records (col, (data->>'driver_id'));

create table if not exists public.tmg_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role text not null check (role in ('admin', 'accountant', 'dispatcher', 'driver')),
  driver_id text,
  created_at timestamptz not null default now()
);
create table if not exists public.tmg_seq (col text primary key, n bigint not null default 0);

-- ---------- Hàm hỗ trợ phân quyền ----------
create or replace function public.tmg_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.tmg_profiles where user_id = auth.uid() $$;

create or replace function public.tmg_driver() returns text language sql stable security definer set search_path = public as
$$ select driver_id from public.tmg_profiles where user_id = auth.uid() $$;

-- Các xe tài xế được làm việc: xe phụ trách trong hồ sơ tài xế + xe nhận tài xế này là tài xế chính
create or replace function public.tmg_my_vehicles() returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct v), '{}') from (
    select data->>'vehicle_id' as v from public.tmg_records
      where col = 'driver' and id = public.tmg_driver() and coalesce(data->>'vehicle_id', '') <> ''
    union
    select id from public.tmg_records where col = 'vehicle' and data->>'driver_id' = public.tmg_driver()
  ) s
$$;

create or replace function public.tmg_driver_can_read(p_col text, p_id text, p_data jsonb) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_col in ('vehicle_group', 'location', 'cost_category', 'customer', 'goods_type', '_settings') then true
    when p_col = 'vehicle' then p_id = any(public.tmg_my_vehicles())
    when p_col = 'driver' then p_id = public.tmg_driver()
    when p_col in ('route', 'order', 'revenue', 'cost_request', 'route_fuel', 'incident', 'op_cost', 'repair_ticket') then (p_data->>'vehicle_id') = any(public.tmg_my_vehicles())
    when p_col = 'salary' then (p_data->>'driver_id') = public.tmg_driver()
    else false end
$$;

create or replace function public.tmg_driver_can_write(p_col text, p_id text, p_data jsonb) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_col in ('route', 'order', 'revenue', 'cost_request', 'route_fuel', 'incident') then (p_data->>'vehicle_id') = any(public.tmg_my_vehicles())
    when p_col = 'vehicle' then p_id = any(public.tmg_my_vehicles())
    when p_col = 'driver' then p_id = public.tmg_driver()
    when p_col = 'salary' then (p_data->>'driver_id') = public.tmg_driver()
    when p_col in ('document', 'activity_log') then true
    else false end
$$;

-- ---------- Phân quyền dòng (RLS) ----------
alter table public.tmg_records enable row level security;
alter table public.tmg_profiles enable row level security;
alter table public.tmg_seq enable row level security;

drop policy if exists tmg_sel on public.tmg_records;
drop policy if exists tmg_ins on public.tmg_records;
drop policy if exists tmg_upd on public.tmg_records;
drop policy if exists tmg_del on public.tmg_records;
create policy tmg_sel on public.tmg_records for select to authenticated using (
  (select public.tmg_role()) in ('admin', 'accountant', 'dispatcher')
  or ((select public.tmg_role()) = 'driver' and public.tmg_driver_can_read(col, id, data)));
create policy tmg_ins on public.tmg_records for insert to authenticated with check (
  (select public.tmg_role()) in ('admin', 'accountant', 'dispatcher')
  or ((select public.tmg_role()) = 'driver' and public.tmg_driver_can_write(col, id, data)));
create policy tmg_upd on public.tmg_records for update to authenticated
  using ((select public.tmg_role()) in ('admin', 'accountant', 'dispatcher') or ((select public.tmg_role()) = 'driver' and public.tmg_driver_can_write(col, id, data)))
  with check ((select public.tmg_role()) in ('admin', 'accountant', 'dispatcher') or ((select public.tmg_role()) = 'driver' and public.tmg_driver_can_write(col, id, data)));
create policy tmg_del on public.tmg_records for delete to authenticated using ((select public.tmg_role()) = 'admin');

drop policy if exists tmg_prof_sel on public.tmg_profiles;
create policy tmg_prof_sel on public.tmg_profiles for select to authenticated using (user_id = auth.uid() or (select public.tmg_role()) = 'admin');
-- tmg_seq: chỉ truy cập qua hàm

-- ---------- Kiểm soát nghiệp vụ phía máy chủ ----------
create or replace function public.tmg_before_write() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := public.tmg_role(); s_new text := new.data->>'status'; s_old text;
begin
  new.updated_at := now();
  if r is null then raise exception 'Tài khoản chưa được cấp quyền'; end if;
  if tg_op = 'UPDATE' then s_old := old.data->>'status'; end if;
  if new.col = 'cost_request' and s_new in ('Đã duyệt', 'Từ chối', 'Đã chi') and s_new is distinct from s_old and r not in ('admin', 'accountant') then
    raise exception 'Không có quyền duyệt chi phí';
  end if;
  if new.col = 'revenue' and s_new in ('Đã xác nhận', 'Từ chối') and s_new is distinct from s_old and r = 'driver' then
    raise exception 'Tài xế không được tự xác nhận doanh thu';
  end if;
  if new.col = 'route' and r = 'driver' and new.data->>'approve' = 'Đã phê duyệt'
     and (tg_op = 'INSERT' or (old.data->>'approve') is distinct from 'Đã phê duyệt') then
    raise exception 'Tài xế không được tự phê duyệt chuyến';
  end if;
  return new;
end $$;
drop trigger if exists tmg_before_write on public.tmg_records;
create trigger tmg_before_write before insert or update on public.tmg_records for each row execute function public.tmg_before_write();

-- ---------- Tài khoản ----------
create or replace function public._tmg_new_auth_user(p_email text, p_password text) returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare uid uuid := gen_random_uuid(); em text := lower(trim(p_email));
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Email không hợp lệ: %', p_email; end if;
  if length(coalesce(p_password, '')) < 4 then raise exception 'Mật khẩu / PIN tối thiểu 4 ký tự'; end if;
  if exists (select 1 from auth.users where lower(email) = em) then raise exception 'Email đã có tài khoản: %', em; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  return uid;
end $$;
revoke all on function public._tmg_new_auth_user(text, text) from public, anon, authenticated;

create or replace function public.tmg_status() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ok', true, 'version', 1,
    'has_admin', exists (select 1 from public.tmg_profiles where role = 'admin'),
    'role', p.role, 'name', p.name, 'driver_id', p.driver_id, 'email', p.email)
  from (select 1) x left join public.tmg_profiles p on p.user_id = auth.uid()
$$;

-- Tạo quản trị viên đầu tiên (chỉ chạy được khi hệ thống chưa có quản trị viên nào)
create or replace function public.tmg_bootstrap_admin(p_email text, p_password text, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  perform pg_advisory_xact_lock(712001);
  if exists (select 1 from public.tmg_profiles where role = 'admin') then raise exception 'Hệ thống đã có quản trị viên'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'Mật khẩu quản trị tối thiểu 8 ký tự'; end if;
  uid := public._tmg_new_auth_user(p_email, p_password);
  insert into public.tmg_profiles (user_id, email, name, role) values (uid, lower(trim(p_email)), p_name, 'admin');
  return uid;
end $$;

create or replace function public.tmg_create_user(p_email text, p_password text, p_name text, p_role text, p_driver_id text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if coalesce(public.tmg_role(), '') <> 'admin' then raise exception 'Chỉ quản trị viên được tạo tài khoản'; end if;
  if p_role not in ('admin', 'accountant', 'dispatcher', 'driver') then raise exception 'Vai trò không hợp lệ'; end if;
  if p_role = 'driver' and coalesce(p_driver_id, '') = '' then raise exception 'Thiếu tài xế'; end if;
  if p_role = 'driver' and exists (select 1 from public.tmg_profiles where driver_id = p_driver_id) then raise exception 'Tài xế này đã có tài khoản'; end if;
  uid := public._tmg_new_auth_user(p_email, p_password);
  insert into public.tmg_profiles (user_id, email, name, role, driver_id) values (uid, lower(trim(p_email)), p_name, p_role, nullif(p_driver_id, ''));
  return uid;
end $$;

create or replace function public.tmg_set_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  if p_user <> auth.uid() and coalesce(public.tmg_role(), '') <> 'admin' then raise exception 'Không có quyền'; end if;
  if length(coalesce(p_password, '')) < 4 then raise exception 'Mật khẩu / PIN tối thiểu 4 ký tự'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
end $$;

create or replace function public.tmg_delete_user(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if coalesce(public.tmg_role(), '') <> 'admin' then raise exception 'Chỉ quản trị viên được xoá tài khoản'; end if;
  if p_user = auth.uid() then raise exception 'Không thể tự xoá tài khoản đang dùng'; end if;
  delete from auth.users where id = p_user;
end $$;

create or replace function public.tmg_list_users() returns table (user_id uuid, email text, name text, role text, driver_id text, last_sign_in_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if coalesce(public.tmg_role(), '') <> 'admin' then raise exception 'Chỉ quản trị viên'; end if;
  return query select p.user_id, p.email, p.name, p.role, p.driver_id, u.last_sign_in_at, p.created_at
    from public.tmg_profiles p join auth.users u on u.id = p.user_id order by p.created_at;
end $$;

-- ---------- Số thứ tự mã chứng từ (không trùng giữa các máy) ----------
create or replace function public.tmg_reserve_many(p_cols text[], p_n int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text; res jsonb := '{}'; v bigint;
begin
  if public.tmg_role() is null then raise exception 'Chưa đăng nhập'; end if;
  foreach c in array p_cols loop
    insert into public.tmg_seq (col, n) values (c, p_n)
      on conflict (col) do update set n = public.tmg_seq.n + p_n returning n into v;
    res := res || jsonb_build_object(c, v - p_n + 1);
  end loop;
  return res;
end $$;

create or replace function public.tmg_seq_floor(p_vals jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare k text; v text;
begin
  if coalesce(public.tmg_role(), '') <> 'admin' then raise exception 'Chỉ quản trị viên'; end if;
  for k, v in select * from jsonb_each_text(p_vals) loop
    insert into public.tmg_seq (col, n) values (k, v::bigint) on conflict (col) do update set n = greatest(public.tmg_seq.n, excluded.n);
  end loop;
end $$;

grant execute on function public.tmg_status() to anon, authenticated;
grant execute on function public.tmg_bootstrap_admin(text, text, text) to anon, authenticated;

-- ---------- Ảnh chứng từ ----------
insert into storage.buckets (id, name, public) values ('tmg-files', 'tmg-files', false) on conflict (id) do nothing;
drop policy if exists "tmg files read" on storage.objects;
drop policy if exists "tmg files write" on storage.objects;
drop policy if exists "tmg files update" on storage.objects;
create policy "tmg files read" on storage.objects for select to authenticated using (bucket_id = 'tmg-files' and public.tmg_role() is not null);
create policy "tmg files write" on storage.objects for insert to authenticated with check (bucket_id = 'tmg-files' and public.tmg_role() is not null);
create policy "tmg files update" on storage.objects for update to authenticated using (bucket_id = 'tmg-files' and public.tmg_role() is not null);

-- ---------- Cập nhật tức thời giữa các máy ----------
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tmg_records') then
    alter publication supabase_realtime add table public.tmg_records;
  end if;
end $$;

select public.tmg_status() as "Cài đặt xong — trạng thái";
