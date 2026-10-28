-- Expand the existing catalog without changing rewards, accounts or activity records.
create or replace function hardware_private.wardrobe(p_room uuid,p_appearance jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();m public.lab_members;current_round integer;earned integer;solved integer;a jsonb;result jsonb;style integer;needed integer;item record;selected boolean;
begin
 if uid is null then raise exception 'Sessão expirada.';end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 select * into m from public.lab_members where room_id=p_room and user_id=uid for update;
 if not found then raise exception 'Você não faz parte desta turma.';end if;
 select coalesce(sum(score),0)::integer,count(*)::integer into earned,solved from public.lab_completions where room_id=p_room and round=current_round and user_id=uid;
 a:=coalesce(p_appearance,jsonb_build_object('style',m.hair_style,'color',m.hair_color)||m.wardrobe);
 if jsonb_typeof(a)<>'object' or jsonb_typeof(a->'style') is distinct from 'number' or (a->>'style')!~'^([0-9]|1[0-3])$' or
 (a->>'color') is null or (a->>'color') not in ('#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69') then raise exception 'Visual inválido.';end if;
 style:=(a->>'style')::integer;needed:=(array[0,0,0,0,100,240,480,720,1000,1200,1400,1800,2100,2600])[style+1];
 if p_appearance is not null and earned<needed then raise exception 'Recompensa fictícia insuficiente para este cabelo.';end if;
 result:=jsonb_build_object('style',case when earned>=needed then style else 0 end,'color',a->>'color');
 for item in select * from (values ('jacket',600,0),('gloves',960,0),('tattoo',2400,0),('tattooBolt',3000,0),('tattooStar',3600,0),('beard',400,0),('nails',200,0),('strong',1600,0),('sandals',800,20),('bracelets',150,0),('phone',1000,0),('tablet',1800,0),('bluePants',300,0),('greenSkirt',300,0)) as requirements(key,cost,min_solved) loop
  if a ? item.key and jsonb_typeof(a->item.key) is distinct from 'boolean' then raise exception 'Visual inválido.';end if;
  selected:=coalesce((a->>item.key)::boolean,false);
  if p_appearance is not null and selected and (earned<item.cost or solved<item.min_solved) then raise exception 'Este visual exige R$ % fictícios e % desafios concluídos.',item.cost,item.min_solved;end if;
  result:=result||jsonb_build_object(item.key,selected and earned>=item.cost and solved>=item.min_solved);
 end loop;
 if (coalesce((result->>'tattoo')::boolean,false))::integer+(coalesce((result->>'tattooBolt')::boolean,false))::integer+(coalesce((result->>'tattooStar')::boolean,false))::integer>1 then
  if p_appearance is not null then raise exception 'Escolha apenas um visual deste grupo.';end if;
  result:=result||jsonb_build_object('tattooBolt',false);
  result:=result||jsonb_build_object('tattooStar',false);
 end if;
 if (coalesce((result->>'gloves')::boolean,false))::integer+(coalesce((result->>'nails')::boolean,false))::integer>1 then
  if p_appearance is not null then raise exception 'Escolha apenas um visual deste grupo.';end if;
  result:=result||jsonb_build_object('nails',false);
 end if;
 if (coalesce((result->>'phone')::boolean,false))::integer+(coalesce((result->>'tablet')::boolean,false))::integer>1 then
  if p_appearance is not null then raise exception 'Escolha apenas um visual deste grupo.';end if;
  result:=result||jsonb_build_object('tablet',false);
 end if;
 if (coalesce((result->>'bluePants')::boolean,false))::integer+(coalesce((result->>'greenSkirt')::boolean,false))::integer>1 then
  if p_appearance is not null then raise exception 'Escolha apenas um visual deste grupo.';end if;
  result:=result||jsonb_build_object('greenSkirt',false);
 end if;
 if p_appearance is not null then
  update public.lab_members set wardrobe=result,hair_style=least(style,3),hair_color=result->>'color',hair_custom=true,appearance_set=true where room_id=p_room and user_id=uid;
 end if;
 return result;
end $$;
revoke all on function hardware_private.wardrobe(uuid,jsonb) from public,anon;
grant execute on function hardware_private.wardrobe(uuid,jsonb) to authenticated;
