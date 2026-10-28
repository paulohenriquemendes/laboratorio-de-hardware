-- Class settings preserve existing behavior and never reset a round.
alter table public.lab_rooms add column competition_mode text not null default 'ranking' check(competition_mode in ('ranking','individual','hidden'));
create function hardware_private.competition(p_room uuid,p_mode text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();teacher boolean;r public.lab_rooms;
begin
 if uid is null then raise exception 'Sessão expirada.';end if;
 select exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) into teacher;
 if not teacher and not exists(select 1 from public.lab_members where room_id=p_room and user_id=uid) then raise exception 'Entre na turma.';end if;
 if p_mode is not null then
  if not teacher then raise exception 'Configuração exclusiva do professor.';end if;
  if p_mode not in ('ranking','individual','hidden') then raise exception 'Modo de competição inválido.';end if;
  update public.lab_rooms set competition_mode=p_mode where id=p_room;
 end if;
 select * into r from public.lab_rooms where id=p_room;
 if not found then raise exception 'Turma não encontrada.';end if;
 return jsonb_build_object('mode',r.competition_mode,'room_id',r.id);
end $$;
revoke all on function hardware_private.competition(uuid,text) from public,anon;
grant execute on function hardware_private.competition(uuid,text) to authenticated;
create function public.lab_competition(p_room uuid,p_mode text default null)
returns jsonb language sql security invoker set search_path='' as $$ select hardware_private.competition(p_room,p_mode) $$;
revoke all on function public.lab_competition(uuid,text) from public,anon;
grant execute on function public.lab_competition(uuid,text) to authenticated;
-- Keep the professor's complete report, but omit other students' ranking entries in the student snapshot.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('hardware_private.snapshot(uuid,integer)'::regprocedure) into definition;
 if position('return jsonb_build_object(''room'',to_jsonb(r),' in definition)=0 then raise exception 'Unexpected snapshot definition';end if;
 definition:=replace(definition,'return jsonb_build_object(''room'',to_jsonb(r),',
 'if not teacher and r.competition_mode<>''ranking'' then
  select coalesce(jsonb_agg(value),''[]''::jsonb) into scores from jsonb_array_elements(scores) where value->>''user_id''=uid::text;
 end if;
 return jsonb_build_object(''room'',to_jsonb(r),');
 execute definition;
end $migration$;
-- Period reports query indexed timestamps and count only activity within [from, until).
create index response_events_period_idx on hardware_private.response_events(room_id,round,created_at);
create index lab_completions_period_idx on public.lab_completions(room_id,round,completed_at);
create function hardware_private.evaluation_report(p_room uuid,p_round integer,p_from timestamptz,p_until timestamptz,p_user uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();target_round integer;students jsonb;events jsonb;completions jsonb;total_events integer;
begin
 if uid is null or not exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) then raise exception 'Acesso exclusivo do professor.';end if;
 if p_from is null or p_until is null or not isfinite(p_from) or not isfinite(p_until) or p_from>=p_until then raise exception 'Informe um período válido.';end if;
 select coalesce(p_round,round) into target_round from public.lab_rooms where id=p_room;
 if target_round is null then raise exception 'Turma não encontrada.';end if;
 with participants as (
  select user_id from hardware_private.student_profiles where room_id=p_room and round=target_round
  union select user_id from public.lab_attempts where room_id=p_room and round=target_round and jsonb_array_length(progress->'tests')>0
  union select user_id from public.lab_completions where room_id=p_room and round=target_round
 ), activity as (
  select user_id,count(distinct pc) as practiced,count(distinct pc) filter(where kind='challenge' and correct) as concepts,
   count(*) filter(where correct=false) as errors,count(*) as responses,min(created_at) as first_activity,max(created_at) as last_activity
  from hardware_private.response_events where room_id=p_room and round=target_round and created_at>=p_from and created_at<p_until group by user_id
 ), completed as (
  select user_id,count(*) as solved,sum(score) as score,min(completed_at) as first_activity,max(completed_at) as last_activity
  from public.lab_completions where room_id=p_room and round=target_round and completed_at>=p_from and completed_at<p_until group by user_id
 )
 select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'nickname',coalesce(m.nickname,'Aluno sem apelido'),'full_name',i.full_name,'class_name',i.class_name,
  'submitted_at',case when i.submitted_at>=p_from and i.submitted_at<p_until then i.submitted_at end,
  'practiced',coalesce(a.practiced,0),'solved',coalesce(c.solved,0),'concepts',coalesce(a.concepts,0),'score',coalesce(c.score,0),'errors',coalesce(a.errors,0),'responses',coalesce(a.responses,0),
  'first_activity',least(a.first_activity,c.first_activity),'last_activity',greatest(a.last_activity,c.last_activity)) order by i.full_name nulls last,m.nickname),'[]'::jsonb) into students
 from participants p left join public.lab_members m on m.room_id=p_room and m.user_id=p.user_id
 left join hardware_private.student_profiles i on i.room_id=p_room and i.round=target_round and i.user_id=p.user_id
 left join activity a on a.user_id=p.user_id left join completed c on c.user_id=p.user_id;
 if p_user is not null then
  select count(*) into total_events from hardware_private.response_events where room_id=p_room and round=target_round and user_id=p_user and created_at>=p_from and created_at<p_until;
  select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at,e.id),'[]'::jsonb) into events from (
   select id,pc,kind,choice,correct,created_at from hardware_private.response_events where room_id=p_room and round=target_round and user_id=p_user and created_at>=p_from and created_at<p_until order by created_at desc,id desc limit 2000
  ) e;
  select coalesce(jsonb_agg(jsonb_build_object('pc',pc,'completed_at',completed_at,'score',score) order by pc),'[]'::jsonb) into completions from public.lab_completions where room_id=p_room and round=target_round and user_id=p_user and completed_at>=p_from and completed_at<p_until;
 end if;
 return jsonb_build_object('round',target_round,'students',students,'from',p_from,'until',p_until,'events',coalesce(events,'[]'::jsonb),'events_truncated',coalesce(total_events>2000,false),'completions',coalesce(completions,'[]'::jsonb));
end $$;
revoke all on function hardware_private.evaluation_report(uuid,integer,timestamptz,timestamptz,uuid) from public,anon;
grant execute on function hardware_private.evaluation_report(uuid,integer,timestamptz,timestamptz,uuid) to authenticated;
create function public.lab_evaluation_report(p_room uuid,p_round integer,p_from timestamptz,p_until timestamptz,p_user uuid default null)
returns jsonb language sql security invoker set search_path='' as $$ select hardware_private.evaluation_report(p_room,p_round,p_from,p_until,p_user) $$;
revoke all on function public.lab_evaluation_report(uuid,integer,timestamptz,timestamptz,uuid) from public,anon;
grant execute on function public.lab_evaluation_report(uuid,integer,timestamptz,timestamptz,uuid) to authenticated;
