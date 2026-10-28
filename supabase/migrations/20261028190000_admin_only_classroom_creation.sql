-- Existing links remain usable; only the administrative session can create rooms.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('hardware_private.join_room(uuid,text,text)'::regprocedure) into definition;
 if position('if rid is null then' in definition)=0 then raise exception 'Unexpected room creation function';end if;
 definition:=replace(definition,'if rid is null then',
 'if rid is null then
  if not exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) then
   raise exception ''Somente a administração pode criar turmas. Use o convite enviado pelo professor.'';
  end if;');
 execute definition;
end $migration$;
