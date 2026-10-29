-- Append four notebook challenges without reordering or changing the 100 desktop IDs.
alter table public.lab_tasks drop constraint lab_tasks_pc_check;
alter table public.lab_tasks add constraint lab_tasks_pc_check check(pc between 0 and 103);
alter table public.lab_attempts drop constraint lab_attempts_pc_check;
alter table public.lab_attempts add constraint lab_attempts_pc_check check(pc between 0 and 103);
alter table public.lab_completions drop constraint lab_completions_pc_check;
alter table public.lab_completions add constraint lab_completions_pc_check check(pc between 0 and 103);
do $migration$
declare d text;sig text;
begin
 foreach sig in array array['hardware_private.join_room(uuid,text,text)','hardware_private.admin(text,uuid,text,integer)','hardware_private.individual_action_core(uuid,integer,integer,text,integer,uuid)','hardware_private.learning_map(uuid,integer,timestamp with time zone,timestamp with time zone)'] loop
  select pg_get_functiondef(sig::regprocedure) into d;
  if position('generate_series(0,99)' in d)=0 and position('between 0 and 99' in d)=0 then raise exception 'Unexpected function: %',sig;end if;
  d:=replace(replace(d,'generate_series(0,99)','generate_series(0,103)'),'between 0 and 99','between 0 and 103');execute d;
 end loop;
 select pg_get_functiondef('hardware_private.reward(integer,integer)'::regprocedure) into d;
 if position('])[p_pc+1]' in d)=0 then raise exception 'Unexpected reward function';end if;
 d:=replace(d,'])[p_pc+1]',',20,40,60,100])[p_pc+1]');execute d;
end $migration$;
insert into public.lab_tasks(room_id,round,pc) select r.id,r.round,n from public.lab_rooms r cross join generate_series(100,103) n on conflict do nothing;

insert into hardware_private.answers(pc,diagnosis,repair,concept) values
(100,0,1,1),
(101,1,0,0),
(102,2,2,2),
(103,0,1,0);
