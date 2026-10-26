-- Identification and answer history are private teacher data, never public presence.
create table hardware_private.student_profiles(
 room_id uuid not null references public.lab_rooms on delete cascade,
 round integer not null,
 user_id uuid not null references auth.users on delete cascade,
 full_name text not null check(length(full_name) between 5 and 120),
 class_name text not null check(length(class_name) between 2 and 80),
 submitted_at timestamptz,
 primary key(room_id,round,user_id)
);
create index student_profiles_user_idx on hardware_private.student_profiles(user_id);
alter table hardware_private.student_profiles enable row level security;
revoke all on hardware_private.student_profiles from public,anon,authenticated;
create table hardware_private.response_events(
 id bigint generated always as identity primary key,
 room_id uuid not null references public.lab_rooms on delete cascade,
 round integer not null, pc integer not null,
 user_id uuid not null references auth.users on delete cascade,
 request_id uuid not null, kind text not null, choice integer, correct boolean,
 created_at timestamptz not null default clock_timestamp(),
 unique(user_id,request_id)
);
create index response_events_classroom_idx on hardware_private.response_events(room_id,round,user_id,id);
alter table hardware_private.response_events enable row level security;
revoke all on hardware_private.response_events from public,anon,authenticated;
create function hardware_private.student_identity(p_room uuid,p_operation text,p_name text,p_class text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); current_round integer; profile hardware_private.student_profiles;
begin
 if uid is null or not exists(select 1 from public.lab_members where room_id=p_room and user_id=uid) then raise exception 'Entre na turma para identificar sua participação.';end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 if p_operation='get' then
  select * into profile from hardware_private.student_profiles where room_id=p_room and round=current_round and user_id=uid;
  return jsonb_build_object('full_name',profile.full_name,'class_name',profile.class_name,'submitted_at',profile.submitted_at,'round',current_round);
 end if;
 if p_operation not in ('save','submit') then raise exception 'Operação inválida.';end if;
 if p_name is null or length(btrim(p_name)) not between 5 and 120 or btrim(p_name) !~ '[^[:space:]]+[[:space:]]+[^[:space:]]+' or p_name ~ '[<>[:cntrl:]]' then raise exception 'Informe seu nome completo, com nome e sobrenome.';end if;
 if p_class is null or length(btrim(p_class)) not between 2 and 80 or p_class ~ '[<>[:cntrl:]]' then raise exception 'Informe sua turma (2 a 80 caracteres).';end if;
 insert into hardware_private.student_profiles(room_id,round,user_id,full_name,class_name,submitted_at) values(p_room,current_round,uid,btrim(p_name),btrim(p_class),case when p_operation='submit' then now() else null end)
 on conflict(room_id,round,user_id) do update set full_name=excluded.full_name,class_name=excluded.class_name,submitted_at=coalesce(excluded.submitted_at,hardware_private.student_profiles.submitted_at) returning * into profile;
 return jsonb_build_object('full_name',profile.full_name,'class_name',profile.class_name,'submitted_at',profile.submitted_at,'round',current_round);
end $$;
create function public.lab_student_identity(p_room uuid,p_operation text default 'get',p_name text default null,p_class text default null)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.student_identity(p_room,p_operation,p_name,p_class)$$;
revoke all on function hardware_private.student_identity(uuid,text,text,text),public.lab_student_identity(uuid,text,text,text) from public,anon;
grant execute on function hardware_private.student_identity(uuid,text,text,text),public.lab_student_identity(uuid,text,text,text) to authenticated;
-- Keep server validation unchanged; record accepted submissions atomically with each action.
alter function hardware_private.individual_action(uuid,integer,integer,text,integer,uuid) rename to individual_action_core;
revoke execute on function hardware_private.individual_action_core(uuid,integer,integer,text,integer,uuid) from public,anon,authenticated;
create function hardware_private.individual_action(p_room uuid,p_round integer,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); already_done boolean; result jsonb; a hardware_private.answers; correct boolean;
begin
 if uid is null then raise exception 'Sessão expirada.';end if;
 select exists(select 1 from hardware_private.actions where user_id=uid and request_id=p_request) into already_done;
 result:=hardware_private.individual_action_core(p_room,p_round,p_pc,p_kind,p_choice,p_request);
 if not already_done and p_kind in ('test','diagnosis','repair','validate','challenge') then
  select * into a from hardware_private.answers where pc=p_pc;
  correct:=case p_kind when 'diagnosis' then p_choice=a.diagnosis when 'repair' then p_choice=a.repair when 'challenge' then p_choice=a.concept else null end;
  insert into hardware_private.response_events(room_id,round,pc,user_id,request_id,kind,choice,correct) values(p_room,p_round,p_pc,uid,p_request,p_kind,p_choice,correct) on conflict(user_id,request_id) do nothing;
 end if;
 return result;
end $$;
revoke all on function hardware_private.individual_action(uuid,integer,integer,text,integer,uuid) from public,anon;
grant execute on function hardware_private.individual_action(uuid,integer,integer,text,integer,uuid) to authenticated;
create or replace function public.lab_action_v3(p_room uuid,p_round integer,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.individual_action(p_room,p_round,p_pc,p_kind,p_choice,p_request)$$;
create function hardware_private.student_report(p_room uuid,p_round integer,p_user uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); target_round integer; students jsonb; attempts jsonb; events jsonb; total_events integer;
begin
 if uid is null or not exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) then raise exception 'Acesso exclusivo do professor.';end if;
 select coalesce(p_round,round) into target_round from public.lab_rooms where id=p_room;
 if target_round is null then raise exception 'Turma não encontrada.';end if;
 with participants as (
  select user_id from public.lab_attempts where room_id=p_room and round=target_round and jsonb_array_length(progress->'tests')>0
  union select user_id from hardware_private.student_profiles where room_id=p_room and round=target_round
 ), totals as (
  select user_id,count(*) filter(where jsonb_array_length(progress->'tests')>0) as practiced,count(*) filter(where (progress->>'validated')::boolean) as solved,count(*) filter(where (progress->>'challenge')::boolean) as concepts,
   coalesce(sum(case when (progress->>'validated')::boolean then greatest(30,150-(progress->>'errors')::integer*15) else 0 end),0) as score
  from public.lab_attempts where room_id=p_room and round=target_round group by user_id
 )
 select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'nickname',m.nickname,'full_name',i.full_name,'class_name',i.class_name,'submitted_at',i.submitted_at,'practiced',coalesce(t.practiced,0),'solved',coalesce(t.solved,0),'concepts',coalesce(t.concepts,0),'score',coalesce(t.score,0)) order by i.full_name nulls last,m.nickname),'[]') into students from participants p
 left join public.lab_members m on m.room_id=p_room and m.user_id=p.user_id
 left join hardware_private.student_profiles i on i.room_id=p_room and i.round=target_round and i.user_id=p.user_id
 left join totals t on t.user_id=p.user_id;
 if p_user is null then return jsonb_build_object('round',target_round,'students',students);end if;
 select coalesce(jsonb_agg(jsonb_build_object('pc',pc,'progress',progress,'completed_at',completed_at) order by pc),'[]') into attempts from public.lab_attempts where room_id=p_room and round=target_round and user_id=p_user and jsonb_array_length(progress->'tests')>0;
 select count(*) into total_events from hardware_private.response_events where room_id=p_room and round=target_round and user_id=p_user;
 select coalesce(jsonb_agg(to_jsonb(e) order by e.id),'[]') into events from (select id,pc,kind,choice,correct,created_at from hardware_private.response_events where room_id=p_room and round=target_round and user_id=p_user order by id desc limit 2000) e;
 return jsonb_build_object('round',target_round,'students',students,'attempts',attempts,'events',events,'events_truncated',total_events>2000);
end $$;
create function public.lab_student_report(p_room uuid,p_round integer default null,p_user uuid default null)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.student_report(p_room,p_round,p_user)$$;
revoke all on function hardware_private.student_report(uuid,integer,uuid),public.lab_student_report(uuid,integer,uuid) from public,anon;
grant execute on function hardware_private.student_report(uuid,integer,uuid),public.lab_student_report(uuid,integer,uuid) to authenticated;
alter table public.lab_notes add column full_name text,add column class_name text;
create or replace function hardware_private.notes(p_operation text,p_room uuid,p_body text,p_request uuid,p_note uuid,p_offset integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); note public.lab_notes; nick text; current_round integer; data jsonb; profile hardware_private.student_profiles;
begin
 if uid is null then raise exception 'Entre na turma para enviar sua anotação.';end if;
 if p_operation='send' then
  select nickname into nick from public.lab_members where room_id=p_room and user_id=uid;
  if not found then raise exception 'Entre na turma antes de enviar.';end if;
  if p_request is null then raise exception 'Identificador obrigatório.';end if;
  -- Serialize the rate-limit check for this author, and deduplicate retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0));
  select * into note from public.lab_notes where user_id=uid and request_id=p_request;
  if found then return jsonb_build_object('id',note.id,'sent',true);end if;
  if p_body is null or length(btrim(p_body)) not between 5 and 2000 then raise exception 'Escreva entre 5 e 2000 caracteres.';end if;
  if (select count(*) from public.lab_notes where user_id=uid and created_at>now()-interval '1 hour')>=10 then raise exception 'Você enviou 10 anotações nesta hora. Guarde o rascunho e tente mais tarde.';end if;
  select round into current_round from public.lab_rooms where id=p_room for share;
  select * into profile from hardware_private.student_profiles where room_id=p_room and round=current_round and user_id=uid;
  if not found then raise exception 'Informe nome completo e turma antes de enviar.';end if;
  insert into public.lab_notes(room_id,user_id,request_id,nickname,round,body,full_name,class_name) values(p_room,uid,p_request,nick,current_round,btrim(p_body),profile.full_name,profile.class_name) returning * into note;
  return jsonb_build_object('id',note.id,'sent',true);
 end if;
 if not exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) then raise exception 'Acesso exclusivo do professor.';end if;
 if p_operation='read' then
  update public.lab_notes set read_at=coalesce(read_at,now()) where id=p_note returning * into note;
  if not found then raise exception 'Anotação não encontrada.';end if;
  return jsonb_build_object('id',note.id,'read_at',note.read_at);
 elsif p_operation<>'list' then raise exception 'Operação inválida.';end if;
 if p_offset is null or p_offset<0 then raise exception 'Página inválida.';end if;
 select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc,n.id),'[]') into data from (
  select n.id,n.nickname,n.full_name,n.class_name,n.round,n.body,n.created_at,n.read_at,n.room_id,r.title as room_title from public.lab_notes n join public.lab_rooms r on r.id=n.room_id
  where p_room is null or n.room_id=p_room order by n.created_at desc,n.id limit 50 offset p_offset
 ) n;
 return jsonb_build_object('notes',data,'total',(select count(*) from public.lab_notes where p_room is null or room_id=p_room),'unread',(select count(*) from public.lab_notes where read_at is null and (p_room is null or room_id=p_room)));
end $$;
