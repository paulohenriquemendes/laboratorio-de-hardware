begin;
do $test$
declare uid uuid;room uuid;result jsonb;request uuid;i integer;failed boolean;
begin
 select id into uid from auth.users order by id limit 1;if uid is null then raise exception 'Existing account required';end if;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 execute 'set local role authenticated';
 perform public.lab_open_admin();result:=public.lab_manage_rooms('QA100 rollback');room:=(result->>'id')::uuid;
 perform public.lab_join(room,'Aluno QA100');
 result:=public.lab_snapshot(room);if jsonb_array_length(result->'tasks')<>100 then raise exception 'New room does not have 100 tasks';end if;
 result:=public.lab_wardrobe(room,'{"style":8,"color":"#171717"}'::jsonb);if (result->>'style')::integer<>8 then raise exception 'Bald style must be free';end if;
 for i in 80..99 loop
  perform public.lab_action_v3(room,1,i,'claim',null,gen_random_uuid());
  perform public.lab_action_v3(room,1,i,'test',0,gen_random_uuid());perform public.lab_action_v3(room,1,i,'test',1,gen_random_uuid());
  perform public.lab_action_v3(room,1,i,'diagnosis',(i-80)%3,gen_random_uuid());
  perform public.lab_action_v3(room,1,i,'repair',(i-80+1)%3,gen_random_uuid());
  request:=gen_random_uuid();perform public.lab_action_v3(room,1,i,'validate',null,request);perform public.lab_action_v3(room,1,i,'validate',null,request);
  result:=public.lab_action_v3(room,1,i,'challenge',(i-80+2)%3,gen_random_uuid());
  if not (result->'task'->'progress'->>'challenge')::boolean then raise exception 'New concept failed: %',i;end if;
 end loop;
 result:=public.lab_snapshot(room);if (result->'scores'->0->>'earned')::integer<>400 or (result->'scores'->0->>'solved')::integer<>20 then raise exception 'Incorrect beginner rewards';end if;
 failed:=false;begin perform public.lab_action_v3(room,1,100,'claim',null,gen_random_uuid());exception when others then failed:=true;end;if not failed then raise exception 'Out-of-range task allowed';end if;
 execute 'reset role';
 if hardware_private.reward(0,0)<>100 or hardware_private.reward(40,0)<>20 or (select sum(hardware_private.reward(pc,0)) from generate_series(0,79) pc)<>4800 then raise exception 'Legacy rewards changed';end if;
 insert into public.lab_completions(room_id,round,pc,user_id,nickname,score) values(room,1,0,uid,'Aluno QA100',100);
 execute 'set local role authenticated';result:=public.lab_snapshot(room);if (result->'scores'->0->>'earned')::integer<>500 then raise exception 'Legacy wallet changed';end if;
 result:=public.lab_admin('reset',room,null,1);if jsonb_array_length(result->'tasks')<>100 then raise exception 'Reset does not create 100 tasks';end if;
 result:=public.lab_snapshot(room);if jsonb_array_length(result->'scores')<>0 then raise exception 'New round inherited rewards';end if;
 result:=public.lab_admin('report',room,null,1);if (result->'scores'->0->>'earned')::integer<>500 then raise exception 'History lost';end if;
 execute 'reset role';
end $test$;
rollback;
