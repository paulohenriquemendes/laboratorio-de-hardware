begin;
do $test$
declare uid uuid;peer uuid;rid uuid;data jsonb;s jsonb;request uuid:=gen_random_uuid();denied boolean;start_at timestamptz:='2026-10-28 03:00:00+00';end_at timestamptz:='2026-10-29 03:00:00+00';
begin
 select id into uid from auth.users u where not exists(select 1 from hardware_private.admin_sessions a where a.user_id=u.id) limit 1;
 select id into peer from auth.users u where id<>uid and not exists(select 1 from hardware_private.admin_sessions a where a.user_id=u.id) limit 1;
 if uid is null or peer is null then raise exception 'Two isolated fixture users required';end if;
 insert into public.lab_rooms(title) values('QA rollback teaching tools') returning id into rid;
 insert into public.lab_members(room_id,user_id,nickname) values(rid,uid,'QA um'),(rid,peer,'QA dois');
 insert into public.lab_tasks(room_id,round,pc) select rid,1,i from generate_series(0,79) i;
 insert into hardware_private.student_profiles(room_id,round,user_id,full_name,class_name) values(rid,1,uid,'Aluno Privado Teste','QA rollback'),(rid,1,peer,'Colega Privado Teste','QA rollback');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated')::text,true);
 if (public.lab_competition(rid)->>'mode')<>'ranking' then raise exception 'Default competition changed';end if;
 denied:=false;begin perform public.lab_competition(rid,'hidden');exception when raise_exception then if sqlerrm not like 'Configuração exclusiva%' then raise;end if;denied:=true;end;if not denied then raise exception 'Student changed competition';end if;
 denied:=false;begin perform public.lab_evaluation_report(rid,1,start_at,end_at);exception when raise_exception then if sqlerrm not like 'Acesso exclusivo%' then raise;end if;denied:=true;end;if not denied then raise exception 'Student read private evaluation';end if;
 data:=public.lab_incident(rid,1,0,gen_random_uuid());if (data->>'wallet')::integer<>0 or (data->>'cost')::integer<>0 then raise exception 'Negative wallet';end if;
 update hardware_private.floor_incidents set created_at=clock_timestamp()-interval '9 seconds' where room_id=rid;
 insert into public.lab_completions(room_id,round,pc,user_id,nickname,score,completed_at) values
 (rid,1,40,uid,'QA um',20,'2026-10-27 10:00:00+00'),(rid,1,41,uid,'QA um',20,start_at),(rid,1,42,uid,'QA um',40,end_at),(rid,1,40,peer,'QA dois',20,'2026-10-27 10:00:00+00');
 data:=public.lab_incident(rid,1,0,request);if (data->>'cost')::integer<>10 or (data->>'wallet')::integer<>70 then raise exception 'Wrong incident charge: %',data;end if;
 data:=public.lab_incident(rid,1,0,request);if not (data->>'duplicate')::boolean or (data->>'expenses')::integer<>10 then raise exception 'Duplicate incident charged twice';end if;
 data:=public.lab_incident(rid,1,1,gen_random_uuid());if not (data->>'cooldown')::boolean or (data->>'expenses')::integer<>10 then raise exception 'Incident cooldown failed';end if;
 data:=public.lab_snapshot(rid);if jsonb_array_length(data->'scores')<>2 or (data->>'expenses')::integer<>10 then raise exception 'Snapshot wallet mismatch';end if;
 if data::text like '%Aluno Privado%' then raise exception 'Private identity leaked';end if;
 insert into hardware_private.admin_sessions(user_id,expires_at) values(uid,now()+interval '5 minutes');
 perform public.lab_competition(rid,'hidden');data:=public.lab_snapshot(rid);if jsonb_array_length(data->'scores')<>2 then raise exception 'Teacher ranking lost';end if;
 delete from hardware_private.admin_sessions where user_id=uid;
 data:=public.lab_snapshot(rid);if jsonb_array_length(data->'scores')<>1 or data->'scores'->0->>'user_id'<>uid::text then raise exception 'Hidden ranking not filtered';end if;
 insert into hardware_private.admin_sessions(user_id,expires_at) values(uid,now()+interval '5 minutes');
 perform public.lab_competition(rid,'individual');
 insert into hardware_private.response_events(room_id,round,pc,user_id,request_id,kind,choice,correct,created_at) values
 (rid,1,40,uid,gen_random_uuid(),'test',0,null,start_at-interval '1 second'),
 (rid,1,41,uid,gen_random_uuid(),'test',0,null,start_at),
 (rid,1,41,uid,gen_random_uuid(),'diagnosis',0,false,'2026-10-28 10:00:00+00'),
 (rid,1,42,uid,gen_random_uuid(),'challenge',0,true,end_at-interval '1 second'),
 (rid,1,43,uid,gen_random_uuid(),'test',0,null,end_at);
 update hardware_private.floor_incidents set created_at='2026-10-28 11:00:00+00' where room_id=rid;
 data:=public.lab_evaluation_report(rid,1,start_at,end_at,uid);
 select value into s from jsonb_array_elements(data->'students') where value->>'user_id'=uid::text;
 if (s->>'practiced')::integer<>2 or (s->>'solved')::integer<>1 or (s->>'concepts')::integer<>1 or (s->>'errors')::integer<>1 or (s->>'score')::integer<>20 or (s->>'responses')::integer<>3 or (s->>'incident_costs')::integer<>10 then raise exception 'Period totals mismatch: %',s;end if;
 if jsonb_array_length(data->'events')<>3 or jsonb_array_length(data->'completions')<>1 then raise exception 'Period details include outside events';end if;
 select value into s from jsonb_array_elements(data->'students') where value->>'user_id'=peer::text;if (s->>'score')::integer<>0 or (s->>'practiced')::integer<>0 then raise exception 'Inactive student credited';end if;
 denied:=false;begin perform public.lab_evaluation_report(rid,1,end_at,start_at);exception when raise_exception then if sqlerrm not like 'Informe um período%' then raise;end if;denied:=true;end;if not denied then raise exception 'Invalid date range accepted';end if;
 update public.lab_rooms set round=2 where id=rid;
 denied:=false;begin perform public.lab_incident(rid,1,0,gen_random_uuid());exception when raise_exception then if sqlerrm not like 'A rodada mudou%' then raise;end if;denied:=true;end;if not denied then raise exception 'Previous round charged';end if;
 data:=public.lab_snapshot(rid);if (data->>'expenses')::integer<>0 then raise exception 'Expenses carried to new round';end if;
end $test$;
rollback;
