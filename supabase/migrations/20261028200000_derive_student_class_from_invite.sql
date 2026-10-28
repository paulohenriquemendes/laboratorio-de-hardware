-- The invitation already identifies the class. Do not accept a separately typed class name.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('hardware_private.student_identity(uuid,text,text,text)'::regprocedure) into definition;
 if position('select round into current_round from public.lab_rooms where id=p_room for share;' in definition)=0 then
  raise exception 'Unexpected student identity function';
 end if;
 definition:=replace(definition,
  'select round into current_round from public.lab_rooms where id=p_room for share;',
  'select round,title into current_round,p_class from public.lab_rooms where id=p_room for share;');
 execute definition;
end $migration$;
