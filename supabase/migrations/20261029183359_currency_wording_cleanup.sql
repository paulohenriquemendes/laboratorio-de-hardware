CREATE OR REPLACE FUNCTION hardware_private.celebration(p_room uuid, p_style integer, p_buy boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid();r integer;cost integer;earned integer;extra jsonb;
begin
 if uid is null then raise exception 'Sessão expirada.';end if;
 select round into r from public.lab_rooms where id=p_room for share;
 perform 1 from public.lab_members where room_id=p_room and user_id=uid for update;if not found then raise exception 'Entre nesta turma.';end if;
 if p_style is not null then
  if p_style not between 0 and 3 then raise exception 'Comemoração inválida.';end if;
  if p_style>0 and not exists(select 1 from hardware_private.celebration_purchases where room_id=p_room and round=r and user_id=uid and style=p_style) then
   if not coalesce(p_buy,false) then raise exception 'Compre este estilo antes de usar.';end if;
   cost:=(array[0,200,350,600])[p_style+1];extra:=hardware_private.extra_wallet(p_room,r,uid);
   select coalesce(sum(score),0)::integer+(extra->>'bonus')::integer-(extra->>'expenses')::integer into earned from public.lab_completions where room_id=p_room and round=r and user_id=uid;
   if earned<cost then raise exception 'Saldo insuficiente para esta comemoração.';end if;
   insert into hardware_private.celebration_purchases(room_id,round,user_id,style,cost) values(p_room,r,uid,p_style,cost);
  end if;
  insert into hardware_private.student_celebrations(room_id,round,user_id,selected) values(p_room,r,uid,p_style) on conflict(room_id,round,user_id) do update set selected=excluded.selected;
 end if;
 return hardware_private.celebration_profile(p_room,r,uid);
end $function$
;
