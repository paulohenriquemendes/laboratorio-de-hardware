alter table public.lab_members add column hair_style integer not null default 0 check(hair_style between 0 and 3),add column hair_color text not null default '#613b22' check(hair_color in ('#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b'));
create function hardware_private.appearance(p_room uuid,p_style integer,p_color text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); m public.lab_members;
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 update public.lab_members set hair_style=p_style,hair_color=p_color where room_id=p_room and user_id=uid returning * into m;
 if not found then raise exception 'Você não faz parte desta sala.'; end if;
 return jsonb_build_object('style',m.hair_style,'color',m.hair_color);
end $$;
create function public.lab_appearance(p_room uuid,p_style integer,p_color text) returns jsonb language sql security invoker set search_path='' as $$select hardware_private.appearance(p_room,p_style,p_color)$$;
revoke all on function hardware_private.appearance(uuid,integer,text),public.lab_appearance(uuid,integer,text) from public,anon;
grant execute on function hardware_private.appearance(uuid,integer,text),public.lab_appearance(uuid,integer,text) to authenticated;
alter table public.lab_members add column appearance_set boolean not null default false;
create or replace function hardware_private.appearance(p_room uuid,p_style integer,p_color text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); m public.lab_members;
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 update public.lab_members set hair_style=p_style,hair_color=p_color,appearance_set=true where room_id=p_room and user_id=uid returning * into m;
 if not found then raise exception 'Você não faz parte desta sala.'; end if;
 return jsonb_build_object('style',m.hair_style,'color',m.hair_color);
end $$;
