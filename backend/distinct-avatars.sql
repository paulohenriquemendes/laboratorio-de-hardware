alter table public.lab_members drop constraint lab_members_hair_color_check;
alter table public.lab_members add constraint lab_members_hair_color_check check(hair_color in ('#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69'));
create or replace function public.lab_join(p_room uuid,p_name text,p_title text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb; profile public.lab_members; n integer; colors text[]:=array['#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69'];
begin
 r:=hardware_private.join_room(p_room,p_name,p_title);
 select * into profile from public.lab_members where room_id=(r->>'id')::uuid and user_id=auth.uid();
 if not profile.appearance_set then
  -- Sequential room entry is serialized by join_room's room lock.
  perform hardware_private.assign_appearance((r->>'id')::uuid);
 end if;
 return r;
end $$;
create function hardware_private.assign_appearance(p_room uuid)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); n integer; colors text[]:=array['#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69'];
begin
 if uid is null or not exists(select 1 from public.lab_members where room_id=p_room and user_id=uid) then raise exception 'Sessão fora da sala.'; end if;
 select candidate into n from generate_series(0,39) candidate where not exists(select 1 from public.lab_members m where m.room_id=p_room and m.appearance_set and m.hair_style=candidate/10 and m.hair_color=colors[candidate%10+1]) order by candidate limit 1;
 n:=coalesce(n,0);
 update public.lab_members set hair_style=n/10,hair_color=colors[n%10+1],appearance_set=true where room_id=p_room and user_id=uid and not appearance_set;
end $$;
revoke all on function hardware_private.assign_appearance(uuid) from public,anon;
grant execute on function hardware_private.assign_appearance(uuid) to authenticated;
