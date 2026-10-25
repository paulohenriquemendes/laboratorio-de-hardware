-- Teacher access is a high-entropy key; only its digest is stored on the server.
create table hardware_private.admin_key(id boolean primary key default true check(id),key_hash text not null);
insert into hardware_private.admin_key(key_hash) values('5eae55fa9e3b21bee47659169f1e1ba5032470316dde7b180cda0f3a60b0b442');
create table hardware_private.admin_sessions(user_id uuid primary key references auth.users on delete cascade,expires_at timestamptz not null);
create table hardware_private.admin_attempts(user_id uuid primary key references auth.users on delete cascade,failures integer not null default 0,window_start timestamptz not null default now());
create function hardware_private.admin(p_operation text,p_room uuid,p_key text,p_round integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); allowed boolean; failures integer; since timestamptz; room public.lab_rooms; data jsonb;
begin
 if uid is null then raise exception 'Entre na sala antes de abrir a área do professor.'; end if;
 if p_operation='login' then
  insert into hardware_private.admin_attempts(user_id) values(uid) on conflict do nothing;
  select a.failures,a.window_start into failures,since from hardware_private.admin_attempts a where user_id=uid for update;
  if since<now()-interval '15 minutes' then failures:=0;update hardware_private.admin_attempts set failures=0,window_start=now() where user_id=uid;end if;
  if failures>=5 then return jsonb_build_object('ok',false,'error','Muitas tentativas. Aguarde 15 minutos.');end if;
  if p_key is null or length(p_key)>256 or not exists(select 1 from hardware_private.admin_key where key_hash=encode(sha256(convert_to(p_key,'UTF8')),'hex')) then
   update hardware_private.admin_attempts a set failures=a.failures+1 where user_id=uid;
   return jsonb_build_object('ok',false,'error','Chave do professor inválida.');
  end if;
  insert into hardware_private.admin_sessions(user_id,expires_at) values(uid,now()+interval '8 hours') on conflict(user_id) do update set expires_at=excluded.expires_at;
  update hardware_private.admin_attempts set failures=0 where user_id=uid;
 end if;
 if p_operation='logout' then delete from hardware_private.admin_sessions where user_id=uid;return jsonb_build_object('ok',true,'authorized',false);end if;
 select exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) into allowed;
 if not allowed then
  if p_operation='status' then return jsonb_build_object('ok',true,'authorized',false);end if;
  raise exception 'Acesso exclusivo do professor. Informe a chave privada.';
 end if;
 select * into room from public.lab_rooms where id=p_room for update;
 if not found then raise exception 'Sala não encontrada.';end if;
 if p_operation='reset' then
  if p_round is distinct from room.round then raise exception 'A rodada já mudou. Atualize o painel.';end if;
  insert into public.lab_tasks(room_id,round,pc) select p_room,room.round+1,generate_series(0,79);
  update public.lab_rooms set round=round+1 where id=p_room returning * into room;
 elsif p_operation not in ('login','status','report') then raise exception 'Operação inválida.';
 end if;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.pc),'[]') into data from public.lab_tasks t where t.room_id=p_room and t.round=case when p_operation='report' then coalesce(p_round,room.round) else room.round end;
 return jsonb_build_object('ok',true,'authorized',true,'room',to_jsonb(room),'tasks',data,'rounds',(select jsonb_agg(r order by r desc) from (select distinct round r from public.lab_tasks where room_id=p_room) rounds));
end $$;
create function public.lab_admin(p_operation text,p_room uuid,p_key text default null,p_round integer default null)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.admin(p_operation,p_room,p_key,p_round)$$;
revoke all on function hardware_private.admin(text,uuid,text,integer),public.lab_admin(text,uuid,text,integer) from public,anon;
grant execute on function hardware_private.admin(text,uuid,text,integer),public.lab_admin(text,uuid,text,integer) to authenticated;
