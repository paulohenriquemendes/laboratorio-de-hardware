create or replace function public.lab_join(p_room uuid,p_name text,p_title text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb; profile public.lab_members; n integer; colors text[]:=array['#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69'];
begin
 r:=hardware_private.join_room(p_room,p_name,p_title);
 select * into profile from public.lab_members where room_id=(r->>'id')::uuid and user_id=auth.uid();
 if not profile.hair_custom then
  -- Sequential room entry is serialized by join_room's room lock.
  perform hardware_private.assign_appearance((r->>'id')::uuid);
 end if;
 return r;
end $$;
create or replace function hardware_private.assign_appearance(p_room uuid)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); n integer; colors text[]:=array['#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69'];
begin
 if uid is null or not exists(select 1 from public.lab_members where room_id=p_room and user_id=uid) then raise exception 'Sessão fora da sala.'; end if;
 select candidate into n from generate_series(0,39) candidate where not exists(select 1 from public.lab_members m where m.room_id=p_room and m.appearance_set and m.hair_style=candidate/10 and m.hair_color=colors[candidate%10+1]) order by random() limit 1;
 n:=coalesce(n,floor(random()*40)::integer);
 update public.lab_members set hair_style=n/10,hair_color=colors[n%10+1],appearance_set=true where room_id=p_room and user_id=uid;
end $$;
revoke all on function hardware_private.assign_appearance(uuid) from public,anon;
grant execute on function hardware_private.assign_appearance(uuid) to authenticated;

create or replace function hardware_private.appearance(p_room uuid,p_style integer,p_color text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); m public.lab_members;
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 update public.lab_members set hair_style=p_style,hair_color=p_color,appearance_set=true,hair_custom=true where room_id=p_room and user_id=uid returning * into m;
 if not found then raise exception 'Você não faz parte desta sala.'; end if;
 return jsonb_build_object('style',m.hair_style,'color',m.hair_color);
end $$;
