-- Multiplayer storage. Only authenticated room members can read classroom data.
create schema if not exists hardware_private;
revoke all on schema hardware_private from public;
grant usage on schema hardware_private to authenticated;
create table public.lab_rooms (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(title) between 1 and 60),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create table public.lab_members (
 room_id uuid references public.lab_rooms on delete cascade,
 user_id uuid references auth.users on delete cascade,
 nickname text not null check (length(nickname) between 2 and 24),
 joined_at timestamptz not null default now(),
 primary key(room_id,user_id)
);
create table public.lab_tasks (
 room_id uuid references public.lab_rooms on delete cascade,
 pc integer not null check(pc between 0 and 39),
 progress jsonb not null default '{"tests":[],"diagnosed":false,"repaired":false,"validated":false,"errors":0,"challenge":false,"challengeErrors":0}',
 owner_id uuid references auth.users on delete set null,
 owner_name text,
 lease_until timestamptz,
 completed_by text,
 revision integer not null default 0,
 primary key(room_id,pc)
);
create table hardware_private.answers (pc integer primary key, diagnosis integer, repair integer, concept integer);
create table hardware_private.actions (
 user_id uuid references auth.users on delete cascade,
 request_id uuid,
 room_id uuid references public.lab_rooms on delete cascade,
 created_at timestamptz default now(),
 primary key(user_id,request_id)
);
alter table public.lab_rooms enable row level security;
alter table public.lab_members enable row level security;
alter table public.lab_tasks enable row level security;
revoke all on public.lab_rooms,public.lab_members,public.lab_tasks from anon,authenticated;
grant select on public.lab_rooms,public.lab_members,public.lab_tasks to authenticated;
create policy own_membership on public.lab_members for select to authenticated using (user_id=(select auth.uid()));
create policy member_rooms on public.lab_rooms for select to authenticated using (exists(select 1 from public.lab_members m where m.room_id=id and m.user_id=(select auth.uid())));
create policy member_tasks on public.lab_tasks for select to authenticated using (exists(select 1 from public.lab_members m where m.room_id=lab_tasks.room_id and m.user_id=(select auth.uid())));
-- The open classroom contains no personal information; use nicknames only.
insert into public.lab_rooms(id,title) values('00000000-0000-4000-8000-000000000040','Laboratório aberto');
insert into public.lab_tasks(room_id,pc) select '00000000-0000-4000-8000-000000000040'::uuid,generate_series(0,39);
create function hardware_private.join_room(p_room uuid,p_name text,p_title text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); rid uuid:=p_room; title text; nick text:=btrim(p_name);
begin
 if uid is null then raise exception 'Entre com uma sessão de aluno.'; end if;
 if nick is null or length(nick)<2 or length(nick)>24 or nick ~ '[<>[:cntrl:]]' then raise exception 'Use um apelido de 2 a 24 caracteres.'; end if;
 if rid is null then
  if (select count(*) from public.lab_rooms where created_by=uid)>19 then raise exception 'Limite de salas deste participante atingido.'; end if;
  insert into public.lab_rooms(title,created_by) values(left(coalesce(nullif(btrim(p_title),''),'Sala da turma'),60),uid) returning id into rid;
  insert into public.lab_tasks(room_id,pc) select rid,generate_series(0,39);
 end if;
 select r.title into title from public.lab_rooms r where r.id=rid for update;
 if not found then raise exception 'Sala não encontrada. Confira o link.'; end if;
 if not exists(select 1 from public.lab_members where room_id=rid and user_id=uid) and (select count(*) from public.lab_members where room_id=rid)>=60 then raise exception 'Esta sala já tem 60 participantes. Crie uma nova sala.'; end if;
 insert into public.lab_members(room_id,user_id,nickname) values(rid,uid,nick) on conflict(room_id,user_id) do update set nickname=excluded.nickname;
 return jsonb_build_object('id',rid,'title',title,'userId',uid,'nickname',nick);
end $$;
create function public.lab_join(p_room uuid,p_name text,p_title text default null)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.join_room(p_room,p_name,p_title)$$;
create function hardware_private.task_action(p_room uuid,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); nick text; t public.lab_tasks; p jsonb; a hardware_private.answers; correct integer; err text:='';
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 select nickname into nick from public.lab_members where room_id=p_room and user_id=uid;
 if not found then raise exception 'Você não faz parte desta sala.'; end if;
 select * into t from public.lab_tasks where room_id=p_room and pc=p_pc for update;
 if not found then raise exception 'Computador inválido.'; end if;
 if p_request is null then raise exception 'Identificador da ação obrigatório.'; end if;
 if exists(select 1 from hardware_private.actions where user_id=uid and request_id=p_request) then return jsonb_build_object('task',to_jsonb(t),'feedback',''); end if;
 if p_kind='claim' then
  if t.owner_id is not null and t.owner_id<>uid and t.lease_until>now() then raise exception 'Computador em atendimento por %. Escolha outro ou aguarde.',t.owner_name; end if;
  t.owner_id:=uid; t.owner_name:=nick; t.lease_until:=now()+interval '60 seconds';
 elsif p_kind='release' then
  if t.owner_id=uid then t.owner_id:=null; t.owner_name:=null; t.lease_until:=null; end if;
 else
  if t.owner_id is distinct from uid or t.lease_until<=now() then raise exception 'A reserva expirou. Feche a ficha e abra novamente.'; end if;
  if p_kind='renew' then t.lease_until:=now()+interval '60 seconds';
  else
   p:=t.progress; select * into a from hardware_private.answers where pc=p_pc;
   if p_kind='test' and not (p->>'diagnosed')::boolean and p_choice in (0,1) then
    if not (p->'tests') @> to_jsonb(array[p_choice]) then p:=jsonb_set(p,'{tests}',(p->'tests')||to_jsonb(p_choice)); end if;
   elsif p_kind='diagnosis' and not (p->>'diagnosed')::boolean and jsonb_array_length(p->'tests')=2 and p_choice between 0 and 2 then
    if p_choice=a.diagnosis then p:=jsonb_set(p,'{diagnosed}','true'); else p:=jsonb_set(p,'{errors}',to_jsonb((p->>'errors')::integer+1));err:='As evidências não sustentam essa hipótese. −15 pontos.'; end if;
   elsif p_kind='repair' and (p->>'diagnosed')::boolean and not (p->>'repaired')::boolean and p_choice between 0 and 2 then
    if p_choice=a.repair then p:=jsonb_set(p,'{repaired}','true'); else p:=jsonb_set(p,'{errors}',to_jsonb((p->>'errors')::integer+1));err:='Esse procedimento não resolve o defeito. −15 pontos.'; end if;
   elsif p_kind='validate' and (p->>'repaired')::boolean and not (p->>'validated')::boolean then
    p:=jsonb_set(p,'{validated}','true');t.completed_by:=nick;
   elsif p_kind='challenge' and (p->>'validated')::boolean and not (p->>'challenge')::boolean and p_choice between 0 and 2 then
    if p_choice=a.concept then p:=jsonb_set(p,'{challenge}','true'); else p:=jsonb_set(p,'{challengeErrors}',to_jsonb((p->>'challengeErrors')::integer+1));err:='Releia o conceito e tente novamente. Pontuação prática mantida.'; end if;
   else raise exception 'Ação indisponível nesta etapa. Atualize a ficha.';
   end if;
   t.progress:=p;t.lease_until:=now()+interval '60 seconds';
  end if;
 end if;
 update public.lab_tasks set progress=t.progress,owner_id=t.owner_id,owner_name=t.owner_name,lease_until=t.lease_until,completed_by=t.completed_by,revision=revision+1 where room_id=p_room and pc=p_pc returning * into t;
 insert into hardware_private.actions(user_id,request_id,room_id) values(uid,p_request,p_room);
 return jsonb_build_object('task',to_jsonb(t),'feedback',err);
end $$;
create function public.lab_action(p_room uuid,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.task_action(p_room,p_pc,p_kind,p_choice,p_request)$$;
revoke all on function hardware_private.join_room(uuid,text,text),hardware_private.task_action(uuid,integer,text,integer,uuid),public.lab_join(uuid,text,text),public.lab_action(uuid,integer,text,integer,uuid) from public,anon;
grant execute on function hardware_private.join_room(uuid,text,text),hardware_private.task_action(uuid,integer,text,integer,uuid),public.lab_join(uuid,text,text),public.lab_action(uuid,integer,text,integer,uuid) to authenticated;
create policy lab_realtime_read on realtime.messages for select to authenticated using (extension in ('broadcast','presence') and exists(select 1 from public.lab_members m where m.user_id=(select auth.uid()) and 'lab:'||m.room_id::text=(select realtime.topic())));
create policy lab_realtime_write on realtime.messages for insert to authenticated with check (extension in ('broadcast','presence') and exists(select 1 from public.lab_members m where m.user_id=(select auth.uid()) and 'lab:'||m.room_id::text=(select realtime.topic())));
alter publication supabase_realtime add table public.lab_tasks;

insert into hardware_private.answers(pc,diagnosis,repair,concept) values
(0,0,0,1),
(1,1,0,2),
(2,0,0,0),
(3,1,0,1),
(4,2,1,2),
(5,1,2,0),
(6,0,0,1),
(7,0,1,1),
(8,1,0,2),
(9,0,1,1),
(10,0,2,0),
(11,0,1,2),
(12,0,2,0),
(13,0,0,1),
(14,0,1,2),
(15,0,1,0),
(16,0,2,1),
(17,0,1,2),
(18,0,0,1),
(19,0,2,0),
(20,0,1,2),
(21,1,2,0),
(22,2,0,1),
(23,0,1,2),
(24,1,2,0),
(25,2,0,1),
(26,0,1,2),
(27,1,2,0),
(28,2,0,1),
(29,0,1,2),
(30,1,2,0),
(31,2,0,1),
(32,0,1,2),
(33,1,2,0),
(34,2,0,1),
(35,0,1,2),
(36,1,2,0),
(37,2,0,1),
(38,0,1,2),
(39,1,2,0);
create index lab_members_user_idx on public.lab_members(user_id);
create index lab_rooms_creator_idx on public.lab_rooms(created_by);
create index lab_tasks_owner_idx on public.lab_tasks(owner_id);
create index lab_actions_room_idx on hardware_private.actions(room_id);
