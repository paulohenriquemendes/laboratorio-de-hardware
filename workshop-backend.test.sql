begin;
do $test$
#variable_conflict use_variable
declare room uuid:=gen_random_uuid();uid uuid;definition jsonb;result jsonb;after jsonb;step integer;lesson integer;request uuid;failed boolean;pos jsonb;
begin
 select id into uid from auth.users order by id limit 1;
 if uid is null then raise exception 'Existing session required';end if;
 delete from hardware_private.admin_sessions where user_id=uid;
 insert into public.lab_rooms(id,title) values(room,'QA workshop rollback');
 insert into public.lab_members(room_id,user_id,nickname) values(room,uid,'Pratica QA');
 insert into hardware_private.student_profiles(room_id,round,user_id,full_name,class_name) values(room,1,uid,'Aluno Pratica QA','QA rollback');
 perform set_config('request.jwt.claim.sub',uid::text,true);
 for lesson in 0..7 loop
  definition:=hardware_private.workshop_definition(lesson,1);
  execute 'set local role authenticated';
  failed:=false;begin perform public.lab_workshop_action(room,1,lesson,1,0,gen_random_uuid());exception when others then failed:=true;end;if not failed then raise exception 'Stage skipping allowed';end if;
  execute 'reset role';
  for step in 0..jsonb_array_length(definition->'steps')-1 loop
   if lesson=0 and step=0 then
    request:=gen_random_uuid();execute 'set local role authenticated';perform public.lab_workshop_action(room,1,lesson,step,0,request);perform public.lab_workshop_action(room,1,lesson,step,0,request);execute 'reset role';
   end if;
   request:=gen_random_uuid();execute 'set local role authenticated';result:=public.lab_workshop_action(room,1,lesson,step,(definition->'steps'->step->>'answer')::integer,request);after:=public.lab_workshop_action(room,1,lesson,step,(definition->'steps'->step->>'answer')::integer,request);execute 'reset role';
   if (after->>'reward')::integer<>0 then raise exception 'Duplicate payment';end if;
  end loop;
 end loop;
 result:=public.lab_snapshot(room);
 if (result->>'bonus')::integer<>555 or (result->>'workshop_solved')::integer<>8 or jsonb_array_length(result->'workshops')<>8 or (result->'scores'->0->>'score')::integer<>555 then raise exception 'Incorrect workshop wallet: %',result->'scores';end if;
 execute 'set local role authenticated';
 failed:=false;begin perform public.lab_learning_map(room);exception when others then failed:=true;end;if not failed then raise exception 'Student read teacher map';end if;
 failed:=false;begin perform public.lab_workshop_report(room,1,uid);exception when others then failed:=true;end;if not failed then raise exception 'Student read private report';end if;
 perform public.lab_celebration(room,2,true);result:=public.lab_incident(room,1,0,gen_random_uuid());execute 'reset role';if (result->>'wallet')::integer<>200 then raise exception 'Shop/incident ignored workshop income';end if;
 pos:=hardware_private.customer_position(0,extract(epoch from clock_timestamp())::double precision);
 execute 'set local role authenticated';perform public.lab_customer_action(room,1,0,'claim',null,gen_random_uuid(),(pos->>'x')::double precision,18.3);result:=public.lab_customer_action(room,1,0,'question',1);execute 'reset role';
 if jsonb_array_length(result->'progress'->'tests')<>0 then raise exception 'Conversation skipped investigation';end if;
 insert into hardware_private.admin_sessions(user_id,expires_at) values(uid,now()+interval '1 hour');
 result:=public.lab_learning_map(room);
 if jsonb_array_length(result->'items')<>116 or not exists(select 1 from jsonb_array_elements(result->'items') r where r->>'kind'='workshop' and (r->>'item')::integer=0 and (r->>'errors')::integer=1 and (r->>'answers')::integer=7 and (r->>'solved')::integer=1) then raise exception 'Incorrect difficulty map';end if;
 result:=public.lab_student_report(room,1);if (result->'students'->0->>'workshop_solved')::integer<>8 or (result->'students'->0->>'workshop_bonus')::integer<>555 then raise exception 'Teacher totals missing';end if;
 result:=public.lab_evaluation_report(room,1,now()-interval '1 day',now()+interval '1 day');if (result->'students'->0->>'workshop_bonus')::integer<>555 then raise exception 'Period totals missing';end if;
 result:=public.lab_workshop_report(room,1,uid);if jsonb_array_length(result->'events')<25 then raise exception 'Practice history missing';end if;
 result:=public.lab_learning_map(room,1,now()-interval '3 days',now()-interval '2 days');if exists(select 1 from jsonb_array_elements(result->'items') r where (r->>'answers')::integer<>0) then raise exception 'Period filtering failed';end if;
 update public.lab_rooms set round=2 where id=room;
 result:=public.lab_snapshot(room);if (result->>'bonus')::integer<>0 or (result->>'expenses')::integer<>0 or jsonb_array_length(result->'workshops')<>0 then raise exception 'Round reset failed';end if;
 if hardware_private.workshop_definition(7,1)->'steps'->2->>'answer'=hardware_private.workshop_definition(7,2)->'steps'->2->>'answer' then raise exception 'Surprise diagnosis did not change';end if;
 if has_table_privilege('authenticated','hardware_private.workshop_events','SELECT') or has_function_privilege('anon','public.lab_workshop_action(uuid,integer,integer,integer,integer,uuid)','EXECUTE') then raise exception 'Unexpected public grants';end if;
end $test$;
rollback;
