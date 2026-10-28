-- Incidents debit only the current student's fictional wallet. Academic activity records are unchanged.
create table hardware_private.floor_incidents(
 id uuid primary key default gen_random_uuid(),room_id uuid not null references public.lab_rooms on delete cascade,
 round integer not null,user_id uuid not null references auth.users on delete cascade,
 hazard integer not null check(hazard between 0 and 7),cost integer not null check(cost between 0 and 10),
 request_id uuid not null,created_at timestamptz not null default clock_timestamp(),unique(user_id,request_id)
);
alter table hardware_private.floor_incidents enable row level security;
revoke all on hardware_private.floor_incidents from public,anon,authenticated;
create index floor_incidents_user_idx on hardware_private.floor_incidents(user_id);
create index floor_incidents_member_idx on hardware_private.floor_incidents(room_id,round,user_id,created_at desc);
create index floor_incidents_period_idx on hardware_private.floor_incidents(room_id,round,created_at);
create function hardware_private.incident(p_room uuid,p_round integer,p_hazard integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_round integer;earned integer;expenses integer;charge integer;previous hardware_private.floor_incidents;
begin
 if uid is null then raise exception 'Sessão expirada.';end if;
 if p_hazard is null or p_hazard not between 0 and 7 or p_request is null then raise exception 'Incidente inválido.';end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 if current_round is distinct from p_round then raise exception 'A rodada mudou. Reconecte à turma.';end if;
 perform 1 from public.lab_members where room_id=p_room and user_id=uid for update;
 if not found then raise exception 'Você não faz parte desta turma.';end if;
 select coalesce(sum(score),0)::integer into earned from public.lab_completions where room_id=p_room and round=p_round and user_id=uid;
 select coalesce(sum(cost),0)::integer into expenses from hardware_private.floor_incidents where room_id=p_room and round=p_round and user_id=uid;
 select * into previous from hardware_private.floor_incidents where user_id=uid and request_id=p_request;
 if found then
  if previous.room_id<>p_room or previous.round<>p_round or previous.hazard<>p_hazard then raise exception 'Identificador de incidente já utilizado.';end if;
  return jsonb_build_object('cost',previous.cost,'charged',false,'duplicate',true,'expenses',expenses,'wallet',greatest(0,earned-expenses));
 end if;
 if exists(select 1 from hardware_private.floor_incidents where room_id=p_room and round=p_round and user_id=uid and created_at>clock_timestamp()-interval '8 seconds') then
  return jsonb_build_object('cost',0,'charged',false,'cooldown',true,'expenses',expenses,'wallet',greatest(0,earned-expenses));
 end if;
 charge:=least(10,greatest(0,earned-expenses));
 insert into hardware_private.floor_incidents(room_id,round,user_id,hazard,cost,request_id) values(p_room,p_round,uid,p_hazard,charge,p_request);
 return jsonb_build_object('cost',charge,'charged',charge>0,'expenses',expenses+charge,'wallet',greatest(0,earned-expenses-charge));
end $$;
revoke all on function hardware_private.incident(uuid,integer,integer,uuid) from public,anon;
grant execute on function hardware_private.incident(uuid,integer,integer,uuid) to authenticated;
create function public.lab_incident(p_room uuid,p_round integer,p_hazard integer,p_request uuid)
returns jsonb language sql security invoker set search_path='' as $$ select hardware_private.incident(p_room,p_round,p_hazard,p_request) $$;
revoke all on function public.lab_incident(uuid,integer,integer,uuid) from public,anon;
grant execute on function public.lab_incident(uuid,integer,integer,uuid) to authenticated;
do $migration$
declare definition text;
begin
 select pg_get_functiondef('hardware_private.snapshot(uuid,integer)'::regprocedure) into definition;
 if position('if not teacher and r.competition_mode' in definition)=0 then raise exception 'Unexpected snapshot definition';end if;
 definition:=replace(definition,'if not teacher and r.competition_mode',
 'select coalesce(jsonb_agg(s.value||jsonb_build_object(''earned'',(s.value->>''score'')::integer,''expenses'',coalesce(i.cost,0),''score'',greatest(0,(s.value->>''score'')::integer-coalesce(i.cost,0)))),''[]''::jsonb) into scores
 from jsonb_array_elements(scores) s(value) left join (
  select user_id,sum(cost)::integer as cost from hardware_private.floor_incidents where room_id=p_room and round=target_round group by user_id
 ) i on i.user_id::text=s.value->>''user_id'';
 if not teacher and r.competition_mode');
 definition:=replace(definition,'return jsonb_build_object(''room'',to_jsonb(r),',
 'return jsonb_build_object(''expenses'',(select coalesce(sum(cost),0) from hardware_private.floor_incidents where room_id=p_room and round=target_round and user_id=uid),''room'',to_jsonb(r),');
 execute definition;
 select pg_get_functiondef('hardware_private.evaluation_report(uuid,integer,timestamp with time zone,timestamp with time zone,uuid)'::regprocedure) into definition;
 if position('), activity as (' in definition)=0 or position('left join activity a on' in definition)=0 then raise exception 'Unexpected evaluation definition';end if;
 definition:=replace(definition,'), activity as (',
 '), incident_totals as (
  select user_id,count(*) as incidents,sum(cost) as costs from hardware_private.floor_incidents where room_id=p_room and round=target_round and created_at>=p_from and created_at<p_until group by user_id
 ), activity as (');
 definition:=replace(definition,'''responses'',coalesce(a.responses,0),','''responses'',coalesce(a.responses,0),''incident_costs'',coalesce(h.costs,0),''incidents'',coalesce(h.incidents,0),');
 definition:=replace(definition,'left join activity a on','left join incident_totals h on h.user_id=p.user_id left join activity a on');
 execute definition;
end $migration$;
