do $migration$
declare definition text;
begin
 select pg_get_functiondef('hardware_private.incident(uuid,integer,integer,uuid)'::regprocedure) into definition;
 if position('charge:=least(10,greatest(0,earned-expenses));' in definition)=0 then raise exception 'Unexpected incident charge rule';end if;
 definition:=replace(definition,'charge:=least(10,greatest(0,earned-expenses));','charge:=least(5,greatest(0,earned-expenses));');
 execute definition;
end $migration$;
-- Historical incident costs remain untouched; only new accepted contacts use the lower amount.
