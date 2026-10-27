-- Preserve existing base hairstyles and old clients. New cosmetics are separate.
alter table public.lab_members add column wardrobe jsonb not null default '{}'::jsonb check(jsonb_typeof(wardrobe)='object');
create or replace function hardware_private.wardrobe(p_room uuid,p_appearance jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); m public.lab_members; current_round integer; points integer; a jsonb; style integer; needed integer;
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 select * into m from public.lab_members where room_id=p_room and user_id=uid for update;
 if not found then raise exception 'Você não faz parte desta turma.'; end if;
 select coalesce(sum(score),0)::integer into points from public.lab_completions where room_id=p_room and round=current_round and user_id=uid;
 a:=coalesce(p_appearance,jsonb_build_object('style',m.hair_style,'color',m.hair_color,'jacket',false,'gloves',false,'tattoo',false)||m.wardrobe);
 if jsonb_typeof(a)<>'object' or jsonb_typeof(a->'style') is distinct from 'number' or (a->>'style')!~'^[0-7]$' or
  (a->>'color') is null or (a->>'color') not in ('#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69') or
  jsonb_typeof(a->'jacket') is distinct from 'boolean' or jsonb_typeof(a->'gloves') is distinct from 'boolean' or jsonb_typeof(a->'tattoo') is distinct from 'boolean'
 then raise exception 'Visual inválido.'; end if;
 style:=(a->>'style')::integer;needed:=(array[0,0,0,0,300,600,1200,1800])[style+1];
 if p_appearance is not null then
  if points<needed or ((a->>'jacket')::boolean and points<1500) or ((a->>'gloves')::boolean and points<2400) or ((a->>'tattoo')::boolean and points<6000) then raise exception 'Pontuação insuficiente nesta rodada para esse item.'; end if;
  update public.lab_members set wardrobe=a,hair_style=least(style,3),hair_color=a->>'color',hair_custom=true,appearance_set=true where room_id=p_room and user_id=uid;
 end if;
 -- Current-round unlocks apply on read too; preferences can return when points are earned again.
 return jsonb_build_object('style',case when points>=needed then style else 0 end,'color',a->>'color','jacket',(a->>'jacket')::boolean and points>=1500,'gloves',(a->>'gloves')::boolean and points>=2400,'tattoo',(a->>'tattoo')::boolean and points>=6000);
end $$;
revoke all on function hardware_private.wardrobe(uuid,jsonb) from public,anon;
grant execute on function hardware_private.wardrobe(uuid,jsonb) to authenticated;
create or replace function public.lab_wardrobe(p_room uuid,p_appearance jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select hardware_private.wardrobe(p_room,p_appearance)$$;
revoke all on function public.lab_wardrobe(uuid,jsonb) from public,anon;
grant execute on function public.lab_wardrobe(uuid,jsonb) to authenticated;
