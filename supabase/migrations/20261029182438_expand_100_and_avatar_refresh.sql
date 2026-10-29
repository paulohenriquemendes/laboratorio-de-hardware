-- Preserve every existing attempt and completion; add only new current-round tasks.
alter table public.lab_tasks drop constraint lab_tasks_pc_check;
alter table public.lab_tasks add constraint lab_tasks_pc_check check(pc between 0 and 99);
alter table public.lab_attempts drop constraint lab_attempts_pc_check;
alter table public.lab_attempts add constraint lab_attempts_pc_check check(pc between 0 and 99);
alter table public.lab_completions drop constraint lab_completions_pc_check;
alter table public.lab_completions add constraint lab_completions_pc_check check(pc between 0 and 99);
CREATE OR REPLACE FUNCTION hardware_private.join_room(p_room uuid, p_name text, p_title text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); rid uuid:=p_room; title text; current_round integer; nick text:=btrim(p_name);
begin
 if uid is null then raise exception 'Entre com uma sessão de aluno.'; end if;
 if nick is null or length(nick)<2 or length(nick)>24 or nick ~ '[<>[:cntrl:]]' then raise exception 'Use um apelido de 2 a 24 caracteres.'; end if;
 if rid is null then
  if not exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) then
   raise exception 'Somente a administração pode criar turmas. Use o convite enviado pelo professor.';
  end if;
  if (select count(*) from public.lab_rooms where created_by=uid)>19 then raise exception 'Limite de salas deste participante atingido.'; end if;
  insert into public.lab_rooms(title,created_by) values(left(coalesce(nullif(btrim(p_title),''),'Sala da turma'),60),uid) returning id into rid;
  insert into public.lab_tasks(room_id,pc) select rid,generate_series(0,99);
 end if;
 select r.title,r.round into title,current_round from public.lab_rooms r where r.id=rid for update;
 if not found then raise exception 'Sala não encontrada. Confira o link.'; end if;
 if not exists(select 1 from public.lab_members where room_id=rid and user_id=uid) and (select count(*) from public.lab_members where room_id=rid and joined_round=current_round)>=100 then raise exception 'Esta sala já tem 100 participantes nesta rodada. Crie uma nova sala.'; end if;
 insert into public.lab_members(room_id,user_id,nickname,joined_round) values(rid,uid,nick,current_round) on conflict(room_id,user_id) do update set nickname=excluded.nickname,joined_round=excluded.joined_round;
 return jsonb_build_object('id',rid,'title',title,'userId',uid,'nickname',nick,'round',current_round);
end $function$
;
CREATE OR REPLACE FUNCTION hardware_private.admin(p_operation text, p_room uuid, p_key text, p_round integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); allowed boolean; failures integer; since timestamptz; room public.lab_rooms; data jsonb;
begin
 if uid is null then raise exception 'Entre na sala antes de abrir a área do professor.'; end if;
 if p_operation='login' then
  insert into hardware_private.admin_attempts(user_id) values(uid) on conflict do nothing;
  select a.failures,a.window_start into failures,since from hardware_private.admin_attempts a where user_id=uid for update;
  if since<now()-interval '15 minutes' then failures:=0;update hardware_private.admin_attempts set failures=0,window_start=now() where user_id=uid;end if;
  if failures>=5 then return jsonb_build_object('ok',false,'error','Muitas tentativas. Aguarde 15 minutos.');end if;
  if p_key is null or length(p_key)>256 or not exists(select 1 from hardware_private.admin_key where key_hash=encode(sha256(convert_to(p_key,'UTF8')),'hex')) then
   update hardware_private.admin_attempts a set failures=a.failures+1 where user_id=uid;
   return jsonb_build_object('ok',false,'error','Chave do professor inválida.');
  end if;
  insert into hardware_private.admin_sessions(user_id,expires_at) values(uid,now()+interval '8 hours') on conflict(user_id) do update set expires_at=excluded.expires_at;
  update hardware_private.admin_attempts set failures=0 where user_id=uid;
 end if;
 if p_operation='logout' then delete from hardware_private.admin_sessions where user_id=uid;return jsonb_build_object('ok',true,'authorized',false);end if;
 select exists(select 1 from hardware_private.admin_sessions where user_id=uid and expires_at>now()) into allowed;
 if not allowed then
  if p_operation='status' then return jsonb_build_object('ok',true,'authorized',false);end if;
  raise exception 'Acesso exclusivo do professor. Informe a chave privada.';
 end if;
 select * into room from public.lab_rooms where id=p_room for update;
 if not found then raise exception 'Sala não encontrada.';end if;
 if p_operation='reset' then
  if p_round is distinct from room.round then raise exception 'A rodada já mudou. Atualize o painel.';end if;
  insert into public.lab_tasks(room_id,round,pc) select p_room,room.round+1,generate_series(0,99);
  update public.lab_rooms set round=round+1 where id=p_room returning * into room;
 elsif p_operation not in ('login','status','report') then raise exception 'Operação inválida.';
 end if;
 data:=hardware_private.snapshot(p_room,case when p_operation='report' then coalesce(p_round,room.round) else room.round end);
 return data || jsonb_build_object('ok',true,'authorized',true,'rounds',(select jsonb_agg(r order by r desc) from (select distinct round r from public.lab_tasks where room_id=p_room) rounds));
end $function$
;
CREATE OR REPLACE FUNCTION hardware_private.individual_action_core(p_room uuid, p_round integer, p_pc integer, p_kind text, p_choice integer, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); nick text; t public.lab_attempts; p jsonb; a hardware_private.answers; correct integer; err text:=''; current_round integer;
begin
 if uid is null then raise exception 'Sessão expirada.'; end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 select nickname into nick from public.lab_members where room_id=p_room and user_id=uid;
 if not found then raise exception 'Você não faz parte desta sala.'; end if;
 if current_round is distinct from p_round then raise exception 'A rodada mudou. Abra o computador novamente.';end if;
 if p_pc is null or p_pc not between 0 and 99 then raise exception 'Computador inválido.';end if;
 insert into public.lab_attempts(room_id,round,pc,user_id) values(p_room,current_round,p_pc,uid) on conflict do nothing;
 select * into t from public.lab_attempts where room_id=p_room and pc=p_pc and round=current_round and user_id=uid for update;
 if not found then raise exception 'Computador inválido.'; end if;
 if p_request is null then raise exception 'Identificador da ação obrigatório.'; end if;
 if exists(select 1 from hardware_private.actions where user_id=uid and request_id=p_request) then return jsonb_build_object('task',to_jsonb(t),'feedback',''); end if;
 if p_kind='claim' then
  t.owner_id:=uid; t.owner_name:=nick; t.lease_until:=now()+interval '60 seconds';
 elsif p_kind='release' then
  if t.owner_id=uid then t.owner_id:=null; t.owner_name:=null; t.lease_until:=null; end if;
 else
  if t.owner_id is distinct from uid or t.lease_until<=now() then raise exception 'A reserva expirou. Feche a ficha e abra novamente.'; end if;
  if p_kind='renew' then t.lease_until:=now()+interval '60 seconds';
  else
   p:=t.progress; select * into a from hardware_private.answers where pc=p_pc;
   if p_kind='test' and not (p->>'diagnosed')::boolean and p_choice in (0,1) then
    if not (p->'tests') @> to_jsonb(array[p_choice]) then p:=jsonb_set(p,'{tests}',(p->'tests')||to_jsonb(p_choice)); end if;
   elsif p_kind='diagnosis' and not (p->>'diagnosed')::boolean and jsonb_array_length(p->'tests')=2 and p_choice between 0 and 2 then
    if p_choice=a.diagnosis then p:=jsonb_set(p,'{diagnosed}','true'); else p:=jsonb_set(p,'{errors}',to_jsonb((p->>'errors')::integer+1));err:='As evidências não sustentam essa hipótese. Reduz R$ 5 da recompensa, até o mínimo de R$ 20.'; end if;
   elsif p_kind='repair' and (p->>'diagnosed')::boolean and not (p->>'repaired')::boolean and p_choice between 0 and 2 then
    if p_choice=a.repair then p:=jsonb_set(p,'{repaired}','true'); else p:=jsonb_set(p,'{errors}',to_jsonb((p->>'errors')::integer+1));err:='Esse procedimento não resolve o defeito. Reduz R$ 5 da recompensa, até o mínimo de R$ 20.'; end if;
   elsif p_kind='validate' and (p->>'repaired')::boolean and not (p->>'validated')::boolean then
    p:=jsonb_set(p,'{validated}','true');t.completed_by:=nick;t.completed_user:=uid;t.completed_at:=now();
   elsif p_kind='challenge' and (p->>'validated')::boolean and not (p->>'challenge')::boolean and p_choice between 0 and 2 then
    if p_choice=a.concept then p:=jsonb_set(p,'{challenge}','true'); else p:=jsonb_set(p,'{challengeErrors}',to_jsonb((p->>'challengeErrors')::integer+1));err:='Releia o conceito e tente novamente. Recompensa mantida.'; end if;
   else raise exception 'Ação indisponível nesta etapa. Atualize a ficha.';
   end if;
   t.progress:=p;t.lease_until:=now()+interval '60 seconds';
  end if;
 end if;
 update public.lab_attempts set progress=t.progress,owner_id=t.owner_id,owner_name=t.owner_name,lease_until=t.lease_until,completed_by=t.completed_by,completed_user=t.completed_user,completed_at=t.completed_at,revision=revision+1 where room_id=p_room and pc=p_pc and round=current_round and user_id=uid returning * into t;
 if (t.progress->>'validated')::boolean then
  insert into public.lab_completions(room_id,round,pc,user_id,nickname,score,completed_at) values(p_room,current_round,p_pc,uid,t.completed_by,hardware_private.reward(p_pc,(t.progress->>'errors')::integer),t.completed_at) on conflict do nothing;
 end if;
 insert into hardware_private.actions(user_id,request_id,room_id) values(uid,p_request,p_room);
 return jsonb_build_object('task',to_jsonb(t),'feedback',err);
end $function$
;
CREATE OR REPLACE FUNCTION hardware_private.reward(p_pc integer, p_errors integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 select greatest(20,(array[100,100,100,100,80,80,80,80,80,20,80,100,100,100,80,20,80,100,80,80,100,20,20,100,80,80,100,100,80,80,80,80,20,100,20,100,20,100,100,20,20,20,40,40,40,40,40,60,40,40,40,40,40,60,60,60,60,60,60,60,20,20,20,40,40,40,40,60,40,40,60,60,60,60,60,60,60,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20])[p_pc+1]-least(greatest(coalesce(p_errors,0),0),10000)*5)
$function$
;
CREATE OR REPLACE FUNCTION hardware_private.wardrobe(p_room uuid, p_appearance jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid();m public.lab_members;current_round integer;earned integer;solved integer;a jsonb;result jsonb;style integer;needed integer;item record;selected boolean;
begin
 if uid is null then raise exception 'Sessão expirada.';end if;
 select round into current_round from public.lab_rooms where id=p_room for share;
 select * into m from public.lab_members where room_id=p_room and user_id=uid for update;
 if not found then raise exception 'Você não faz parte desta turma.';end if;
 select coalesce(sum(score),0)::integer,count(*)::integer into earned,solved from public.lab_completions where room_id=p_room and round=current_round and user_id=uid;
 earned:=earned+(hardware_private.extra_wallet(p_room,current_round,uid)->>'bonus')::integer; a:=coalesce(p_appearance,jsonb_build_object('style',m.hair_style,'color',m.hair_color)||m.wardrobe);
 if jsonb_typeof(a)<>'object' or jsonb_typeof(a->'style') is distinct from 'number' or (a->>'style')!~'^([0-9]|1[0-3])$' or
 (a->>'color') is null or (a->>'color') not in ('#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69') then raise exception 'Visual inválido.';end if;
 style:=(a->>'style')::integer;needed:=(array[0,0,0,0,100,240,480,720,0,1200,1400,1800,2100,2600])[style+1];
 if p_appearance is not null and earned<needed then raise exception 'Recompensa insuficiente para este cabelo.';end if;
 result:=jsonb_build_object('style',case when earned>=needed then style else 0 end,'color',a->>'color');
 for item in select * from (values ('jacket',600,0),('gloves',960,0),('tattoo',2400,0),('tattooBolt',3000,0),('tattooStar',3600,0),('beard',400,0),('nails',200,0),('strong',1600,0),('sandals',800,20),('bracelets',150,0),('phone',1000,0),('tablet',1800,0),('bluePants',300,0),('greenSkirt',300,0)) as requirements(key,cost,min_solved) loop
  if a ? item.key and jsonb_typeof(a->item.key) is distinct from 'boolean' then raise exception 'Visual inválido.';end if;
  selected:=coalesce((a->>item.key)::boolean,false);
  if p_appearance is not null and selected and (earned<item.cost or solved<item.min_solved) then raise exception 'Este visual exige R$ % e % desafios concluídos.',item.cost,item.min_solved;end if;
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
end $function$
;
CREATE OR REPLACE FUNCTION hardware_private.learning_map(p_room uuid, p_round integer, p_from timestamp with time zone, p_until timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r integer;result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from hardware_private.admin_sessions where user_id=auth.uid() and expires_at>now()) then raise exception 'Acesso exclusivo do professor.';end if;
 select coalesce(p_round,round) into r from public.lab_rooms where id=p_room;if r is null then raise exception 'Turma não encontrada.';end if;
 if p_from is null or p_until is null or p_from>=p_until then raise exception 'Período inválido.';end if;
 with events as (
 select 'pc' as kind,pc as item,user_id,correct,kind in ('diagnosis','repair','challenge') as assessed from hardware_private.response_events where room_id=p_room and round=r and created_at>=p_from and created_at<p_until
 union all select 'client',customer,user_id,correct,kind in ('diagnosis','repair') from hardware_private.customer_events where room_id=p_room and round=r and created_at>=p_from and created_at<p_until
 union all select 'workshop',lesson,user_id,correct,true from hardware_private.workshop_events where room_id=p_room and round=r and created_at>=p_from and created_at<p_until
 ), totals as (select kind,item,count(distinct user_id) as students,count(*) filter(where assessed) as answers,count(*) filter(where assessed and correct=false) as errors from events group by kind,item), completions as (
 select 'pc' as kind,pc as item,count(*) as solved from public.lab_completions where room_id=p_room and round=r and completed_at>=p_from and completed_at<p_until group by pc
 union all select 'client',customer,count(*) from hardware_private.customer_jobs where room_id=p_room and round=r and completed_at>=p_from and completed_at<p_until group by customer
 union all select 'workshop',lesson,count(*) from hardware_private.workshop_attempts where room_id=p_room and round=r and completed_at>=p_from and completed_at<p_until group by lesson
 ), items as (select 'pc' as kind,generate_series(0,99) as item union all select 'client',id from hardware_private.customer_catalog union all select 'workshop',id from hardware_private.workshop_catalog)
 select coalesce(jsonb_agg(jsonb_build_object('kind',i.kind,'item',i.item,'students',coalesce(t.students,0),'answers',coalesce(t.answers,0),'errors',coalesce(t.errors,0),'solved',coalesce(c.solved,0)) order by i.kind,i.item),'[]'::jsonb) into result from items i left join totals t on t.kind=i.kind and t.item=i.item left join completions c on c.kind=i.kind and c.item=i.item;
 return jsonb_build_object('round',r,'items',result);
end $function$
;
insert into public.lab_tasks(room_id,round,pc) select r.id,r.round,n from public.lab_rooms r cross join generate_series(80,99) n on conflict do nothing;

insert into hardware_private.answers(pc,diagnosis,repair,concept) values
(80,0,1,2),
(81,1,2,0),
(82,2,0,1),
(83,0,1,2),
(84,1,2,0),
(85,2,0,1),
(86,0,1,2),
(87,1,2,0),
(88,2,0,1),
(89,0,1,2),
(90,1,2,0),
(91,2,0,1),
(92,0,1,2),
(93,1,2,0),
(94,2,0,1),
(95,0,1,2),
(96,1,2,0),
(97,2,0,1),
(98,0,1,2),
(99,1,2,0);
