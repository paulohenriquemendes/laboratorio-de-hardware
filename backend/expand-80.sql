-- Add a second wing without changing any existing task or progress.
alter table public.lab_rooms add column round integer not null default 1;
alter table public.lab_members add column joined_round integer not null default 1,add column hair_custom boolean not null default false;
alter table public.lab_tasks add column round integer not null default 1,add column completed_user uuid references auth.users on delete set null,add column completed_at timestamptz;
alter table public.lab_tasks drop constraint lab_tasks_pkey;
alter table public.lab_tasks add primary key(room_id,round,pc);
alter table public.lab_tasks drop constraint lab_tasks_pc_check;
alter table public.lab_tasks add constraint lab_tasks_pc_check check(pc between 0 and 79);
create index lab_tasks_completed_user_idx on public.lab_tasks(completed_user);
insert into public.lab_tasks(room_id,round,pc) select r.id,r.round,n from public.lab_rooms r cross join generate_series(40,79) n;
create or replace function hardware_private.join_room(p_room uuid,p_name text,p_title text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); rid uuid:=p_room; title text; current_round integer; nick text:=btrim(p_name);
begin
 if uid is null then raise exception 'Entre com uma sessão de aluno.'; end if;
 if nick is null or length(nick)<2 or length(nick)>24 or nick ~ '[<>[:cntrl:]]' then raise exception 'Use um apelido de 2 a 24 caracteres.'; end if;
 if rid is null then
  if (select count(*) from public.lab_rooms where created_by=uid)>19 then raise exception 'Limite de salas deste participante atingido.'; end if;
  insert into public.lab_rooms(title,created_by) values(left(coalesce(nullif(btrim(p_title),''),'Sala da turma'),60),uid) returning id into rid;
  insert into public.lab_tasks(room_id,pc) select rid,generate_series(0,79);
 end if;
 select r.title,r.round into title,current_round from public.lab_rooms r where r.id=rid for update;
 if not found then raise exception 'Sala não encontrada. Confira o link.'; end if;
 if not exists(select 1 from public.lab_members where room_id=rid and user_id=uid) and (select count(*) from public.lab_members where room_id=rid and joined_round=current_round)>=100 then raise exception 'Esta sala já tem 100 participantes nesta rodada. Crie uma nova sala.'; end if;
 insert into public.lab_members(room_id,user_id,nickname,joined_round) values(rid,uid,nick,current_round) on conflict(room_id,user_id) do update set nickname=excluded.nickname,joined_round=excluded.joined_round;
 return jsonb_build_object('id',rid,'title',title,'userId',uid,'nickname',nick,'round',current_round);
end $$;
create or replace function hardware_private.task_action(p_room uuid,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); nick text; t public.lab_tasks; p jsonb; a hardware_private.answers; correct integer; err text:=''; current_round integer;
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 select nickname into nick from public.lab_members where room_id=p_room and user_id=uid;
 if not found then raise exception 'Você não faz parte desta sala.'; end if;
 select * into t from public.lab_tasks where room_id=p_room and pc=p_pc and round=current_round for update;
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
    p:=jsonb_set(p,'{validated}','true');t.completed_by:=nick;t.completed_user:=uid;t.completed_at:=now();
   elsif p_kind='challenge' and (p->>'validated')::boolean and not (p->>'challenge')::boolean and p_choice between 0 and 2 then
    if p_choice=a.concept then p:=jsonb_set(p,'{challenge}','true'); else p:=jsonb_set(p,'{challengeErrors}',to_jsonb((p->>'challengeErrors')::integer+1));err:='Releia o conceito e tente novamente. Pontuação prática mantida.'; end if;
   else raise exception 'Ação indisponível nesta etapa. Atualize a ficha.';
   end if;
   t.progress:=p;t.lease_until:=now()+interval '60 seconds';
  end if;
 end if;
 update public.lab_tasks set progress=t.progress,owner_id=t.owner_id,owner_name=t.owner_name,lease_until=t.lease_until,completed_by=t.completed_by,completed_user=t.completed_user,completed_at=t.completed_at,revision=revision+1 where room_id=p_room and pc=p_pc and round=current_round returning * into t;
 insert into hardware_private.actions(user_id,request_id,room_id) values(uid,p_request,p_room);
 return jsonb_build_object('task',to_jsonb(t),'feedback',err);
end $$;

create function hardware_private.task_action_v2(p_room uuid,p_round integer,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare current_round integer;
begin
 if auth.uid() is null or not exists(select 1 from public.lab_members where room_id=p_room and user_id=auth.uid()) then raise exception 'Você não faz parte desta sala.';end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 if current_round is null or current_round<>p_round then raise exception 'A rodada mudou. Aguarde a atualização e abra o computador novamente.'; end if;
 return hardware_private.task_action(p_room,p_pc,p_kind,p_choice,p_request);
end $$;
create function public.lab_action_v2(p_room uuid,p_round integer,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.task_action_v2(p_room,p_round,p_pc,p_kind,p_choice,p_request)$$;
revoke all on function hardware_private.task_action_v2(uuid,integer,integer,text,integer,uuid) from public,anon;
grant execute on function hardware_private.task_action_v2(uuid,integer,integer,text,integer,uuid) to authenticated;
revoke all on function public.lab_action_v2(uuid,integer,integer,text,integer,uuid) from public,anon;
grant execute on function public.lab_action_v2(uuid,integer,integer,text,integer,uuid) to authenticated;
create or replace function public.lab_action(p_room uuid,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$begin raise exception 'Há uma nova versão com 80 computadores. Recarregue a página.';end $$;
alter publication supabase_realtime add table public.lab_rooms;

insert into hardware_private.answers(pc,diagnosis,repair,concept) values
(40,0,1,2),
(41,1,2,0),
(42,2,0,1),
(43,0,1,2),
(44,1,2,0),
(45,2,0,1),
(46,0,1,2),
(47,1,2,0),
(48,2,0,1),
(49,0,1,2),
(50,1,2,0),
(51,2,0,1),
(52,0,1,2),
(53,1,2,0),
(54,2,0,1),
(55,0,1,2),
(56,1,2,0),
(57,2,0,1),
(58,0,1,2),
(59,1,2,0),
(60,2,0,1),
(61,0,1,2),
(62,1,2,0),
(63,2,0,1),
(64,0,1,2),
(65,1,2,0),
(66,2,0,1),
(67,0,1,2),
(68,1,2,0),
(69,2,0,1),
(70,0,1,2),
(71,1,2,0),
(72,2,0,1),
(73,0,1,2),
(74,1,2,0),
(75,2,0,1),
(76,0,1,2),
(77,1,2,0),
(78,2,0,1),
(79,0,1,2);
