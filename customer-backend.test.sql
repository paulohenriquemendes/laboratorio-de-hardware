-- No student records survive this test: all fixtures are rolled back.
begin;
do $test$
#variable_conflict use_variable
declare room uuid:=gen_random_uuid();users uuid[];u uuid;other uuid;pos jsonb;result jsonb;again jsonb;request uuid;id integer;definition jsonb;failed boolean;snapshot jsonb;
begin
 select array_agg(a.id) into users from (select au.id from auth.users au order by au.id limit 2) a;
 if array_length(users,1)<2 then raise exception 'Two existing accounts are required for this rollback-only test.';end if;u:=users[1];other:=users[2];delete from hardware_private.admin_sessions where user_id=any(users);
 insert into public.lab_rooms(id,title) values(room,'QA rollback customer test');
 insert into public.lab_members(room_id,user_id,nickname) values(room,u,'Tecnico QA'),(room,other,'Colega QA');
 insert into hardware_private.student_profiles(room_id,round,user_id,full_name,class_name) values(room,1,u,'Tecnico Completo QA','QA rollback');
 perform set_config('request.jwt.claim.sub',u::text,true);
 failed:=false;begin perform public.lab_celebration(room,1,true);exception when others then failed:=true;end;if not failed then raise exception 'Purchase allowed without money';end if;
 failed:=false;begin perform public.lab_customer_action(room,1,0,'claim',null,gen_random_uuid(),0,0);exception when others then failed:=true;end;if not failed then raise exception 'Remote claim allowed';end if;
 for id in 0..3 loop
  select c.definition into definition from hardware_private.customer_catalog c where c.id=id;
  pos:=hardware_private.customer_position(id,extract(epoch from clock_timestamp())::double precision);
  result:=public.lab_customer_action(room,1,id,'claim',null,gen_random_uuid(),(pos->>'x')::double precision,18.3);
  if id=0 then
   perform public.lab_customer_action(room,1,id,'release');
   perform set_config('request.jwt.claim.sub',other::text,true);
   perform public.lab_customer_action(room,1,id,'claim',null,gen_random_uuid(),(pos->>'x')::double precision,18.3);
   update hardware_private.customer_jobs set lease_until=now()-interval '1 second' where room_id=room and round=1 and customer=id;
   perform set_config('request.jwt.claim.sub',u::text,true);
   perform public.lab_customer_action(room,1,id,'claim',null,gen_random_uuid(),(pos->>'x')::double precision,18.3);
  end if;
  perform set_config('request.jwt.claim.sub',other::text,true);
  failed:=false;begin perform public.lab_customer_action(room,1,id,'claim',null,gen_random_uuid(),(pos->>'x')::double precision,18.3);exception when others then failed:=true;end;if not failed then raise exception 'Second student stole a reserved job';end if;
  failed:=false;begin perform public.lab_customer_action(room,1,id,'validate');exception when others then failed:=true;end;if not failed then raise exception 'Other student validated reserved job';end if;
  perform set_config('request.jwt.claim.sub',u::text,true);
  failed:=false;begin perform public.lab_customer_action(room,1,id,'validate');exception when others then failed:=true;end;if not failed then raise exception 'Stage bypass allowed';end if;
  perform public.lab_customer_action(room,1,id,'test',0);perform public.lab_customer_action(room,1,id,'test',1);
  if id=0 then request:=gen_random_uuid();perform public.lab_customer_action(room,1,id,'diagnosis',1,request);perform public.lab_customer_action(room,1,id,'diagnosis',1,request);end if;
  perform public.lab_customer_action(room,1,id,'diagnosis',(definition->>'answer')::integer);
  perform public.lab_customer_action(room,1,id,'repair',(definition->>'repair')::integer);
  request:=gen_random_uuid();result:=public.lab_customer_action(room,1,id,'validate',null,request);again:=public.lab_customer_action(room,1,id,'validate',null,request);
  if (result->>'paid')::integer<>(definition->>'reward')::integer-(case when id=0 then 5 else 0 end) or (again->>'paid')::integer<>0 then raise exception 'Incorrect or repeated payment';end if;
 end loop;
 snapshot:=public.lab_snapshot(room);
 if (snapshot->>'bonus')::integer<>815 or (snapshot->>'bonus_solved')::integer<>4 or (snapshot->'scores'->0->>'score')::integer<>815 then raise exception 'Bonus missing from wallet/ranking';end if;
 perform public.lab_celebration(room,1,true);perform public.lab_celebration(room,1,true);perform public.lab_celebration(room,2,true);
 snapshot:=public.lab_snapshot(room);if (snapshot->>'expenses')::integer<>550 or (snapshot->'scores'->0->>'score')::integer<>265 then raise exception 'Duplicate shop charge or wrong net balance';end if;
 failed:=false;begin perform public.lab_celebration(room,3,true);exception when others then failed:=true;end;if not failed then raise exception 'Overspending allowed';end if;
 result:=public.lab_incident(room,1,0,gen_random_uuid());if (result->>'wallet')::integer<>260 then raise exception 'Incident ignored bonus or purchases';end if;
 result:=public.lab_wardrobe(room,jsonb_build_object('style',7,'color','#171717'));if (result->>'style')::integer<>7 then raise exception 'Gross bonus not used for unlocks';end if;
 failed:=false;begin perform public.lab_customer_report(room);exception when others then failed:=true;end;
 if not failed then raise exception 'Student read teacher report without grant';end if;
 if has_function_privilege('anon','public.lab_customer_action(uuid,integer,integer,text,integer,uuid,double precision,double precision)','EXECUTE') then raise exception 'Anon can invoke student actions';end if;
 insert into hardware_private.admin_sessions(user_id,expires_at) values(u,now()+interval '1 hour') on conflict(user_id) do update set expires_at=excluded.expires_at;
 result:=public.lab_customer_report(room);if jsonb_array_length(result->'jobs')<>4 then raise exception 'Teacher jobs missing';end if;
 result:=public.lab_student_report(room,1);if (result->'students'->0->>'bonus')::integer<>815 then raise exception 'Teacher bonus missing';end if;
 result:=public.lab_evaluation_report(room,1,now()-interval '1 day',now()+interval '1 day');if (result->'students'->0->>'extra_solved')::integer<>4 then raise exception 'Evaluation bonus missing';end if;
 update public.lab_rooms set round=2 where lab_rooms.id=room;
 snapshot:=public.lab_snapshot(room);if (snapshot->>'bonus')::integer<>0 or (snapshot->>'expenses')::integer<>0 or snapshot->'celebrations'->'owned'<>'[0]'::jsonb then raise exception 'Round did not reset extra ledger';end if;
end $test$;
rollback;



