-- Each student owns an independent attempt; public completions contain no answers.
create table public.lab_attempts (
 room_id uuid not null references public.lab_rooms on delete cascade,
 round integer not null,
 pc integer not null check(pc between 0 and 79),
 user_id uuid not null references auth.users on delete cascade,
 progress jsonb not null default '{"tests":[],"diagnosed":false,"repaired":false,"validated":false,"errors":0,"challenge":false,"challengeErrors":0}',
 owner_id uuid, owner_name text, lease_until timestamptz,
 completed_by text, completed_user uuid, completed_at timestamptz,
 revision integer not null default 0,
 primary key(room_id,round,pc,user_id)
);
create index lab_attempts_user_idx on public.lab_attempts(user_id);
create table public.lab_completions (
 room_id uuid not null references public.lab_rooms on delete cascade,
 round integer not null,
 pc integer not null check(pc between 0 and 79),
 user_id uuid not null references auth.users on delete cascade,
 nickname text not null,
 score integer not null check(score between 30 and 150),
 completed_at timestamptz not null default now(),
 primary key(room_id,round,pc,user_id)
);
create index lab_completions_user_idx on public.lab_completions(user_id);
alter table public.lab_attempts enable row level security;
alter table public.lab_completions enable row level security;
revoke all on public.lab_attempts,public.lab_completions from public,anon,authenticated;
grant select on public.lab_attempts,public.lab_completions to authenticated;
create policy own_attempts on public.lab_attempts for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.lab_members m where m.room_id=lab_attempts.room_id and m.user_id=(select auth.uid())));
create policy classroom_completions on public.lab_completions for select to authenticated using(exists(select 1 from public.lab_members m where m.room_id=lab_completions.room_id and m.user_id=(select auth.uid())));
-- Preserve attributable progress. Legacy rows remain intact for historical records.
insert into public.lab_attempts(room_id,round,pc,user_id,progress,completed_by,completed_user,completed_at,revision)
select room_id,round,pc,completed_user,progress,completed_by,completed_user,completed_at,revision from public.lab_tasks where completed_user is not null and (progress->>'validated')::boolean;
insert into public.lab_attempts(room_id,round,pc,user_id,progress,revision)
select room_id,round,pc,owner_id,progress,revision from public.lab_tasks where owner_id is not null and not (progress->>'validated')::boolean and jsonb_array_length(progress->'tests')>0 on conflict do nothing;
insert into public.lab_completions(room_id,round,pc,user_id,nickname,score,completed_at)
select room_id,round,pc,user_id,coalesce(completed_by,'Aluno'),greatest(30,150-(progress->>'errors')::integer*15),coalesce(completed_at,now()) from public.lab_attempts where (progress->>'validated')::boolean;
alter publication supabase_realtime add table public.lab_attempts,public.lab_completions;

create function hardware_private.snapshot(p_room uuid,p_round integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); r public.lab_rooms; target_round integer; teacher boolean; tasks jsonb; scores jsonb;
begin
 if uid is null then raise exception 'Sessão expirada.';end if;
 select exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) into teacher;
 if not teacher and not exists(select 1 from public.lab_members where room_id=p_room and user_id=uid) then raise exception 'Você não faz parte desta sala.';end if;
 select * into r from public.lab_rooms where id=p_room for share;
 if not found then raise exception 'Sala não encontrada.';end if;
 target_round:=coalesce(p_round,r.round);
 if target_round<>r.round and not teacher then raise exception 'Histórico exclusivo do professor.';end if;
 with completed as (
  select pc,jsonb_agg(jsonb_build_object('user_id',user_id,'name',nickname,'score',score,'completed_at',completed_at) order by completed_at,user_id) solvers
  from public.lab_completions where room_id=p_room and round=target_round group by pc
 )
 select jsonb_agg(jsonb_build_object(
  'room_id',p_room,'round',target_round,'pc',t.pc,
  'progress',coalesce(a.progress,'{"tests":[],"diagnosed":false,"repaired":false,"validated":false,"errors":0,"challenge":false,"challengeErrors":0}'::jsonb),
  'revision',coalesce(a.revision,0),'owner_id',a.owner_id,'owner_name',a.owner_name,'lease_until',a.lease_until,
  'shared_solved',c.solvers is not null or (t.progress->>'validated')::boolean,
  'solvers',coalesce(c.solvers,'[]'::jsonb) || case when (t.progress->>'validated')::boolean and t.completed_user is null then jsonb_build_array(jsonb_build_object('user_id',null,'name',coalesce(t.completed_by,'Registro anterior da turma'),'score',null,'completed_at',t.completed_at)) else '[]'::jsonb end
 ) order by t.pc) into tasks from public.lab_tasks t
 left join public.lab_attempts a on a.room_id=t.room_id and a.round=t.round and a.pc=t.pc and a.user_id=uid
 left join completed c on c.pc=t.pc where t.room_id=p_room and t.round=target_round;
 select coalesce(jsonb_agg(to_jsonb(s) order by s.score desc,s.name,s.user_id),'[]'::jsonb) into scores from (
  select c.user_id,coalesce(m.nickname,max(c.nickname)) as name,sum(c.score)::integer as score,count(*)::integer as solved
  from public.lab_completions c left join public.lab_members m on m.room_id=c.room_id and m.user_id=c.user_id
  where c.room_id=p_room and c.round=target_round group by c.user_id,m.nickname
 ) s;
 return jsonb_build_object('room',to_jsonb(r),'tasks',coalesce(tasks,'[]'::jsonb),'scores',scores);
end $$;
create function public.lab_snapshot(p_room uuid,p_round integer default null)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.snapshot(p_room,p_round)$$;
revoke all on function hardware_private.snapshot(uuid,integer),public.lab_snapshot(uuid,integer) from public,anon;
grant execute on function hardware_private.snapshot(uuid,integer),public.lab_snapshot(uuid,integer) to authenticated;
create function hardware_private.individual_action(p_room uuid,p_round integer,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); nick text; t public.lab_attempts; p jsonb; a hardware_private.answers; correct integer; err text:=''; current_round integer;
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 select nickname into nick from public.lab_members where room_id=p_room and user_id=uid;
 if not found then raise exception 'Você não faz parte desta sala.'; end if;
 if current_round is distinct from p_round then raise exception 'A rodada mudou. Abra o computador novamente.';end if;
 if p_pc is null or p_pc not between 0 and 79 then raise exception 'Computador inválido.';end if;
 insert into public.lab_attempts(room_id,round,pc,user_id) values(p_room,current_round,p_pc,uid) on conflict do nothing;
 select * into t from public.lab_attempts where room_id=p_room and pc=p_pc and round=current_round and user_id=uid for update;
 if not found then raise exception 'Computador inválido.'; end if;
 if p_request is null then raise exception 'Identificador da ação obrigatório.'; end if;
 if exists(select 1 from hardware_private.actions where user_id=uid and request_id=p_request) then return jsonb_build_object('task',to_jsonb(t),'feedback',''); end if;
 if p_kind='claim' then
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
 update public.lab_attempts set progress=t.progress,owner_id=t.owner_id,owner_name=t.owner_name,lease_until=t.lease_until,completed_by=t.completed_by,completed_user=t.completed_user,completed_at=t.completed_at,revision=revision+1 where room_id=p_room and pc=p_pc and round=current_round and user_id=uid returning * into t;
 if (t.progress->>'validated')::boolean then
  insert into public.lab_completions(room_id,round,pc,user_id,nickname,score,completed_at) values(p_room,current_round,p_pc,uid,t.completed_by,greatest(30,150-(t.progress->>'errors')::integer*15),t.completed_at) on conflict do nothing;
 end if;
 insert into hardware_private.actions(user_id,request_id,room_id) values(uid,p_request,p_room);
 return jsonb_build_object('task',to_jsonb(t),'feedback',err);
end $$;

create function public.lab_action_v3(p_room uuid,p_round integer,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.individual_action(p_room,p_round,p_pc,p_kind,p_choice,p_request)$$;
revoke all on function hardware_private.individual_action(uuid,integer,integer,text,integer,uuid),public.lab_action_v3(uuid,integer,integer,text,integer,uuid) from public,anon;
grant execute on function hardware_private.individual_action(uuid,integer,integer,text,integer,uuid),public.lab_action_v3(uuid,integer,integer,text,integer,uuid) to authenticated;
-- Old clients must reload instead of changing the preserved collective records.
create or replace function public.lab_action_v2(p_room uuid,p_round integer,p_pc integer,p_kind text,p_choice integer,p_request uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$begin raise exception 'Atualização disponível: recarregue a página para usar seu progresso individual.';end $$;
revoke execute on function hardware_private.task_action(uuid,integer,text,integer,uuid),hardware_private.task_action_v2(uuid,integer,integer,text,integer,uuid) from authenticated;
create or replace function hardware_private.admin(p_operation text,p_room uuid,p_key text,p_round integer)
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
 data:=hardware_private.snapshot(p_room,case when p_operation='report' then coalesce(p_round,room.round) else room.round end);
 return data || jsonb_build_object('ok',true,'authorized',true,'rounds',(select jsonb_agg(r order by r desc) from (select distinct round r from public.lab_tasks where room_id=p_room) rounds));
end $$;
