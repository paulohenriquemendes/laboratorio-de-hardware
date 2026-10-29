begin;
do $test$
declare users uuid[];uid uuid;room uuid;result jsonb;request uuid;i integer;answer integer;repair integer;concept integer;failed boolean;
begin
 select array_agg(a.id) into users from (select id from auth.users order by id limit 2) a;if array_length(users,1)<2 then raise exception 'Existing test sessions required';end if;uid:=users[1];
 perform set_config('request.jwt.claim.sub',uid::text,true);execute 'set local role authenticated';perform public.lab_open_admin();result:=public.lab_manage_rooms('QA notebooks rollback');room:=(result->>'id')::uuid;perform public.lab_join(room,'Aluno Notebook QA');
 result:=public.lab_snapshot(room);if jsonb_array_length(result->'tasks')<>104 then raise exception 'Notebook tasks missing';end if;execute 'reset role';
 for i in 100..103 loop
  select diagnosis,a.repair,a.concept into answer,repair,concept from hardware_private.answers a where pc=i;
  execute 'set local role authenticated';perform public.lab_action_v3(room,1,i,'claim',null,gen_random_uuid());perform public.lab_action_v3(room,1,i,'test',0,gen_random_uuid());perform public.lab_action_v3(room,1,i,'test',1,gen_random_uuid());
  if i=103 then perform public.lab_action_v3(room,1,i,'diagnosis',1,gen_random_uuid());end if;
  perform public.lab_action_v3(room,1,i,'diagnosis',answer,gen_random_uuid());perform public.lab_action_v3(room,1,i,'repair',repair,gen_random_uuid());request:=gen_random_uuid();perform public.lab_action_v3(room,1,i,'validate',null,request);perform public.lab_action_v3(room,1,i,'validate',null,request);result:=public.lab_action_v3(room,1,i,'challenge',concept,gen_random_uuid());if not (result->'task'->'progress'->>'challenge')::boolean then raise exception 'Notebook concept not recorded';end if;execute 'reset role';
 end loop;
 execute 'set local role authenticated';result:=public.lab_snapshot(room);if (result->'scores'->0->>'earned')::integer<>215 or (result->'scores'->0->>'solved')::integer<>4 then raise exception 'Notebook rewards incorrect';end if;
 failed:=false;begin perform public.lab_action_v3(room,1,104,'claim',null,gen_random_uuid());exception when others then failed:=true;end;if not failed then raise exception 'Invalid station accepted';end if;execute 'reset role';
 if (select sum(hardware_private.reward(pc,0)) from generate_series(0,99) pc)<>5200 or (select sum(hardware_private.reward(pc,0)) from generate_series(100,103) pc)<>220 then raise exception 'Legacy rewards changed';end if;
 perform set_config('request.jwt.claim.sub',users[2]::text,true);execute 'set local role authenticated';perform public.lab_join(room,'Outro Notebook QA');result:=public.lab_snapshot(room);
 if not exists(select 1 from jsonb_array_elements(result->'tasks') t where (t->>'pc')::integer=100 and (t->>'shared_solved')::boolean and not (t->'progress'->>'validated')::boolean) then raise exception 'Notebook personal/shared progress mixed';end if;
 perform public.lab_action_v3(room,1,100,'claim',null,gen_random_uuid());perform public.lab_action_v3(room,1,100,'test',0,gen_random_uuid());perform public.lab_action_v3(room,1,100,'test',1,gen_random_uuid());perform public.lab_action_v3(room,1,100,'diagnosis',0,gen_random_uuid());perform public.lab_action_v3(room,1,100,'repair',1,gen_random_uuid());perform public.lab_action_v3(room,1,100,'validate',null,gen_random_uuid());result:=public.lab_snapshot(room);
 if not exists(select 1 from jsonb_array_elements(result->'tasks') t where (t->>'pc')::integer=100 and jsonb_array_length(t->'solvers')=2) then raise exception 'Second student could not complete notebook';end if;
 perform set_config('request.jwt.claim.sub',uid::text,true);result:=public.lab_admin('reset',room,null,1);if jsonb_array_length(result->'tasks')<>104 then raise exception 'Reset missing notebooks';end if;result:=public.lab_admin('report',room,null,1);if jsonb_array_length(result->'scores')<>2 then raise exception 'Notebook history lost';end if;execute 'reset role';
end $test$;
rollback;
