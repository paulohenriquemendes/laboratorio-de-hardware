// Keep the authoritative reward map and cosmetic requirements aligned with the game.
import fs from 'node:fs';
import {baseReward} from './src/economy.js';
import {accessories,stylePoints} from './src/cosmetics.js';
const values=Array.from({length:80},(_,id)=>baseReward(id)).join(',');
const requirements=accessories.map(a=>`('${a.key}',${a.points},${a.solved||0})`).join(',');
const sql=`-- Convert the existing records once; case IDs and completed activities are preserved.
create or replace function hardware_private.reward(p_pc integer,p_errors integer)
returns integer language sql immutable set search_path='' as $$
 select greatest(20,(array[${values}])[p_pc+1]-least(greatest(coalesce(p_errors,0),0),10000)*5)
$$;
revoke all on function hardware_private.reward(integer,integer) from public,anon,authenticated;
alter table public.lab_completions drop constraint lab_completions_score_check;
alter table public.lab_completions add column legacy_points integer;
update public.lab_completions c set legacy_points=c.score,score=hardware_private.reward(c.pc,coalesce((select (a.progress->>'errors')::integer from public.lab_attempts a where a.room_id=c.room_id and a.round=c.round and a.pc=c.pc and a.user_id=c.user_id),greatest(0,(150-c.score)/15)));
alter table public.lab_completions add constraint lab_completions_score_check check(score between 20 and 100);
-- Patch only the audited reward expressions. Abort rather than silently diverge if the function changed.
do $migration$
declare d text;
begin
 select pg_get_functiondef('hardware_private.individual_action_core(uuid,integer,integer,text,integer,uuid)'::regprocedure) into d;
 if position('greatest(30,150-(t.progress->>''errors'')::integer*15)' in d)=0 then raise exception 'Unexpected action reward expression';end if;
 d:=replace(d,'greatest(30,150-(t.progress->>''errors'')::integer*15)','hardware_private.reward(p_pc,(t.progress->>''errors'')::integer)');
 d:=replace(d,'−15 pontos.','Reduz R$ 5 da recompensa fictícia, até o mínimo de R$ 20.');
 d:=replace(d,'Pontuação prática mantida.','Recompensa fictícia mantida.');execute d;
 select pg_get_functiondef('hardware_private.student_report(uuid,integer,uuid)'::regprocedure) into d;
 if position('greatest(30,150-(progress->>''errors'')::integer*15)' in d)=0 then raise exception 'Unexpected report reward expression';end if;
 d:=replace(d,'greatest(30,150-(progress->>''errors'')::integer*15)','hardware_private.reward(pc,(progress->>''errors'')::integer)');execute d;
end $migration$;
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
 if jsonb_typeof(a)<>'object' or jsonb_typeof(a->'style') is distinct from 'number' or (a->>'style')!~'^[0-7]$' or
 (a->>'color') is null or (a->>'color') not in ('#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69') then raise exception 'Visual inválido.';end if;
 style:=(a->>'style')::integer;needed:=(array[${stylePoints.join(',')}])[style+1];
 if p_appearance is not null and earned<needed then raise exception 'Recompensa fictícia insuficiente para este cabelo.';end if;
 result:=jsonb_build_object('style',case when earned>=needed then style else 0 end,'color',a->>'color');
 for item in select * from (values ${requirements}) as requirements(key,cost,min_solved) loop
  if a ? item.key and jsonb_typeof(a->item.key) is distinct from 'boolean' then raise exception 'Visual inválido.';end if;
  selected:=coalesce((a->>item.key)::boolean,false);
  if p_appearance is not null and selected and (earned<item.cost or solved<item.min_solved) then raise exception 'Este visual exige R$ % fictícios e % desafios concluídos.',item.cost,item.min_solved;end if;
  result:=result||jsonb_build_object(item.key,selected and earned>=item.cost and solved>=item.min_solved);
 end loop;
 if p_appearance is not null then
  update public.lab_members set wardrobe=result,hair_style=least(style,3),hair_color=result->>'color',hair_custom=true,appearance_set=true where room_id=p_room and user_id=uid;
 end if;
 return result;
end $$;
revoke all on function hardware_private.wardrobe(uuid,jsonb) from public,anon;
grant execute on function hardware_private.wardrobe(uuid,jsonb) to authenticated;
`;
fs.writeFileSync('supabase/migrations/20261028180000_virtual_rewards_and_cosmetics.sql',sql);
