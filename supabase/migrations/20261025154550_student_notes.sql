-- Suggestions are visible only to their author and to an authorized teacher.
create table public.lab_notes (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.lab_rooms on delete cascade,
 user_id uuid not null references auth.users on delete cascade,
 request_id uuid not null,
 nickname text not null,
 round integer not null,
 body text not null check(length(body) between 5 and 2000),
 created_at timestamptz not null default now(),
 read_at timestamptz,
 unique(user_id,request_id)
);
create index lab_notes_room_created_idx on public.lab_notes(room_id,created_at desc);
create index lab_notes_user_created_idx on public.lab_notes(user_id,created_at desc);
alter table public.lab_notes enable row level security;
revoke all on public.lab_notes from public,anon,authenticated;
grant select on public.lab_notes to authenticated;
create policy own_notes on public.lab_notes for select to authenticated using(user_id=(select auth.uid()));
create function hardware_private.notes(p_operation text,p_room uuid,p_body text,p_request uuid,p_note uuid,p_offset integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); note public.lab_notes; nick text; current_round integer; data jsonb;
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
  select round into current_round from public.lab_rooms where id=p_room;
  insert into public.lab_notes(room_id,user_id,request_id,nickname,round,body) values(p_room,uid,p_request,nick,current_round,btrim(p_body)) returning * into note;
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
  select n.id,n.nickname,n.round,n.body,n.created_at,n.read_at,n.room_id,r.title as room_title from public.lab_notes n join public.lab_rooms r on r.id=n.room_id
  where p_room is null or n.room_id=p_room order by n.created_at desc,n.id limit 50 offset p_offset
 ) n;
 return jsonb_build_object('notes',data,'total',(select count(*) from public.lab_notes where p_room is null or room_id=p_room),'unread',(select count(*) from public.lab_notes where read_at is null and (p_room is null or room_id=p_room)));
end $$;
create function public.lab_notes(p_operation text,p_room uuid default null,p_body text default null,p_request uuid default null,p_note uuid default null,p_offset integer default 0)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.notes(p_operation,p_room,p_body,p_request,p_note,p_offset)$$;
revoke all on function hardware_private.notes(text,uuid,text,uuid,uuid,integer),public.lab_notes(text,uuid,text,uuid,uuid,integer) from public,anon;
grant execute on function hardware_private.notes(text,uuid,text,uuid,uuid,integer),public.lab_notes(text,uuid,text,uuid,uuid,integer) to authenticated;
create function hardware_private.manage_rooms(p_title text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); data jsonb;
begin
 if uid is null or not exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) then raise exception 'Acesso exclusivo do professor.';end if;
 if p_title is not null then
  if length(btrim(p_title)) not between 2 and 60 then raise exception 'Use de 2 a 60 caracteres para o nome da turma.';end if;
  return hardware_private.join_room(null,'Professor',btrim(p_title));
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'round',round) order by created_at desc),'[]') into data from public.lab_rooms;
 return data;
end $$;
create function public.lab_manage_rooms(p_title text default null)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.manage_rooms(p_title)$$;
revoke all on function hardware_private.manage_rooms(text),public.lab_manage_rooms(text) from public,anon;
grant execute on function hardware_private.manage_rooms(text),public.lab_manage_rooms(text) to authenticated;
