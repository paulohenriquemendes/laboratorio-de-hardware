create table hardware_private.customer_catalog(id smallint primary key check(id between 0 and 3),definition jsonb not null);
create table hardware_private.customer_jobs(room_id uuid not null references public.lab_rooms on delete cascade,round integer not null,customer smallint not null references hardware_private.customer_catalog,owner_id uuid references auth.users on delete set null,owner_name text,lease_until timestamptz,x double precision,z double precision,completed_user uuid references auth.users on delete set null,completed_name text,completed_at timestamptz,reward integer not null default 0 check(reward between 0 and 500),primary key(room_id,round,customer));
create table hardware_private.customer_attempts(room_id uuid not null references public.lab_rooms on delete cascade,round integer not null,customer smallint not null references hardware_private.customer_catalog,user_id uuid not null references auth.users on delete cascade,progress jsonb not null default '{"tests":[],"diagnosed":false,"repaired":false,"validated":false,"errors":0}',updated_at timestamptz not null default now(),primary key(room_id,round,customer,user_id));
create table hardware_private.customer_events(room_id uuid not null references public.lab_rooms on delete cascade,round integer not null,customer smallint not null references hardware_private.customer_catalog,user_id uuid not null references auth.users on delete cascade,request uuid not null,kind text not null,choice integer,correct boolean,created_at timestamptz not null default clock_timestamp(),primary key(user_id,request));
create table hardware_private.celebration_purchases(room_id uuid not null references public.lab_rooms on delete cascade,round integer not null,user_id uuid not null references auth.users on delete cascade,style smallint not null check(style between 1 and 3),cost integer not null check(cost in (200,350,600)),created_at timestamptz not null default clock_timestamp(),primary key(room_id,round,user_id,style));
create table hardware_private.student_celebrations(room_id uuid not null references public.lab_rooms on delete cascade,round integer not null,user_id uuid not null references auth.users on delete cascade,selected smallint not null default 0 check(selected between 0 and 3),primary key(room_id,round,user_id));
alter table hardware_private.customer_catalog enable row level security;
alter table hardware_private.customer_jobs enable row level security;
alter table hardware_private.customer_attempts enable row level security;
alter table hardware_private.customer_events enable row level security;
alter table hardware_private.celebration_purchases enable row level security;
alter table hardware_private.student_celebrations enable row level security;
revoke all on hardware_private.customer_catalog,hardware_private.customer_jobs,hardware_private.customer_attempts,hardware_private.customer_events,hardware_private.celebration_purchases,hardware_private.student_celebrations from public,anon,authenticated;
create index customer_jobs_owner_idx on hardware_private.customer_jobs(owner_id);
create index customer_jobs_completed_idx on hardware_private.customer_jobs(completed_user);
create index customer_attempts_user_idx on hardware_private.customer_attempts(user_id);
create index customer_events_room_idx on hardware_private.customer_events(room_id,round,user_id,created_at);
create index celebration_purchases_user_idx on hardware_private.celebration_purchases(user_id);
create index student_celebrations_user_idx on hardware_private.student_celebrations(user_id);
create function hardware_private.extra_wallet(p_room uuid,p_round integer,p_user uuid)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('bonus',coalesce((select sum(reward) from hardware_private.customer_jobs where room_id=p_room and round=p_round and completed_user=p_user),0),'bonus_solved',(select count(*) from hardware_private.customer_jobs where room_id=p_room and round=p_round and completed_user=p_user),'expenses',coalesce((select sum(cost) from hardware_private.floor_incidents where room_id=p_room and round=p_round and user_id=p_user),0)+coalesce((select sum(cost) from hardware_private.celebration_purchases where room_id=p_room and round=p_round and user_id=p_user),0))
$$;
create function hardware_private.celebration_profile(p_room uuid,p_round integer,p_user uuid)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('selected',coalesce((select selected from hardware_private.student_celebrations where room_id=p_room and round=p_round and user_id=p_user),0),'owned',jsonb_build_array(0)||coalesce((select jsonb_agg(style order by style) from hardware_private.celebration_purchases where room_id=p_room and round=p_round and user_id=p_user),'[]'::jsonb))
$$;
create function hardware_private.customer_position(p_id integer,p_time double precision)
returns jsonb language plpgsql stable set search_path='' as $$
declare c jsonb;v double precision;u double precision;a double precision;b double precision;
begin select definition into c from hardware_private.customer_catalog where id=p_id;if not found then raise exception 'Cliente inválido.';end if;a:=(c->>'from')::double precision;b:=(c->>'to')::double precision;v:=p_time*.7/(b-a)+(c->>'phase')::double precision;u:=v-floor(v/2)*2;return jsonb_build_object('x',a+(b-a)*case when u<=1 then u else 2-u end,'z',18.3);end $$;
create function hardware_private.customer_snapshot(p_room uuid,p_round integer,p_user uuid)
returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'status',case when j.completed_at is not null then 'done' when j.lease_until>now() then 'reserved' else 'available' end,'owner_id',case when j.lease_until>now() then j.owner_id end,'owner_name',case when j.lease_until>now() then j.owner_name end,'lease_until',j.lease_until,'x',j.x,'z',j.z,'completed_user',j.completed_user,'completed_name',j.completed_name,'reward',j.reward,'progress',coalesce(a.progress,'{"tests":[],"diagnosed":false,"repaired":false,"validated":false,"errors":0}'::jsonb)) order by c.id),'[]'::jsonb) from hardware_private.customer_catalog c left join hardware_private.customer_jobs j on j.room_id=p_room and j.round=p_round and j.customer=c.id left join hardware_private.customer_attempts a on a.room_id=p_room and a.round=p_round and a.customer=c.id and a.user_id=p_user
$$;
create function hardware_private.customer_action(p_room uuid,p_round integer,p_customer integer,p_kind text,p_choice integer,p_request uuid,p_x double precision,p_z double precision)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r integer;nick text;c jsonb;j hardware_private.customer_jobs;p jsonb;ev hardware_private.customer_events;pos jsonb;correct boolean;feedback text:='';paid integer:=0;
begin
 if uid is null or p_request is null then raise exception 'Sessão expirada.';end if;
 select round into r from public.lab_rooms where id=p_room for share;if r is distinct from p_round then raise exception 'A rodada mudou. Reconecte à turma.';end if;
 select nickname into nick from public.lab_members where room_id=p_room and user_id=uid for update;if not found then raise exception 'Entre nesta turma.';end if;
 select definition into c from hardware_private.customer_catalog where id=p_customer;if not found then raise exception 'Cliente inválido.';end if;
 insert into hardware_private.customer_jobs(room_id,round,customer) values(p_room,r,p_customer) on conflict do nothing;
 select * into j from hardware_private.customer_jobs where room_id=p_room and round=r and customer=p_customer for update;
 select * into ev from hardware_private.customer_events where user_id=uid and request=p_request;
 if found then if ev.room_id<>p_room or ev.round<>r or ev.customer<>p_customer or ev.kind<>p_kind or ev.choice is distinct from p_choice then raise exception 'Identificador já utilizado.';end if;
 else
  if p_kind='release' then
   if j.owner_id=uid and j.completed_at is null then update hardware_private.customer_jobs set owner_id=null,owner_name=null,lease_until=null where room_id=p_room and round=r and customer=p_customer;end if;
  elsif p_kind='claim' then
   if j.completed_at is not null then raise exception 'Este cliente já foi atendido nesta rodada.';end if;
   if j.owner_id is distinct from uid and j.lease_until>now() then raise exception 'Outro colega chegou primeiro e está atendendo este cliente.';end if;
   if exists(select 1 from hardware_private.customer_jobs where room_id=p_room and round=r and owner_id=uid and lease_until>now() and completed_at is null and customer<>p_customer) then raise exception 'Conclua ou libere o atendimento atual antes de assumir outro.';end if;
   pos:=hardware_private.customer_position(p_customer,extract(epoch from clock_timestamp())::double precision);
   if p_x is null or p_z is null or not (p_x between -12.6 and 40.6 and p_z between -19.2 and 19.2) or sqrt(power(p_x-(pos->>'x')::double precision,2)+power(p_z-18.3,2))>2.2 then raise exception 'Aproxime-se do cliente para assumir o chamado.';end if;
   insert into hardware_private.customer_attempts(room_id,round,customer,user_id) values(p_room,r,p_customer,uid) on conflict do nothing;
   update hardware_private.customer_jobs set owner_id=uid,owner_name=nick,lease_until=now()+interval '2 minutes',x=(pos->>'x')::double precision,z=18.3 where room_id=p_room and round=r and customer=p_customer;
  else
   if j.completed_at is not null then
    if j.completed_user<>uid then raise exception 'O atendimento já foi concluído por outro colega.';end if;
   else
    if j.owner_id is distinct from uid or j.lease_until is null or j.lease_until<=now() then raise exception 'A reserva expirou ou pertence a outro colega. Aproxime-se e assuma novamente.';end if;
    select progress into p from hardware_private.customer_attempts where room_id=p_room and round=r and customer=p_customer and user_id=uid for update;
    if p_kind='renew' then null;
    elsif p_kind='test' and not (p->>'diagnosed')::boolean and p_choice between 0 and 1 then if not (p->'tests') @> to_jsonb(array[p_choice]) then p:=jsonb_set(p,'{tests}',(p->'tests')||to_jsonb(p_choice));end if;
    elsif p_kind='diagnosis' and jsonb_array_length(p->'tests')=2 and not (p->>'diagnosed')::boolean and p_choice between 0 and 2 then correct:=p_choice=(c->>'answer')::integer;if correct then p:=jsonb_set(p,'{diagnosed}','true');else p:=jsonb_set(p,'{errors}',to_jsonb((p->>'errors')::integer+1));feedback:='Compare a hipótese com os dois testes. O segundo resultado ajuda a separar a causa do sintoma.';end if;
    elsif p_kind='repair' and (p->>'diagnosed')::boolean and not (p->>'repaired')::boolean and p_choice between 0 and 2 then correct:=p_choice=(c->>'repair')::integer;if correct then p:=jsonb_set(p,'{repaired}','true');else p:=jsonb_set(p,'{errors}',to_jsonb((p->>'errors')::integer+1));feedback:='A solução precisa tratar o diagnóstico confirmado. Releia os resultados e preserve os dados do cliente.';end if;
    elsif p_kind='validate' and (p->>'repaired')::boolean and not (p->>'validated')::boolean then correct:=true;paid:=greatest(120,(c->>'reward')::integer-(p->>'errors')::integer*5);p:=jsonb_set(p,'{validated}','true');update hardware_private.customer_jobs set completed_user=uid,completed_name=nick,completed_at=clock_timestamp(),reward=paid,lease_until=null where room_id=p_room and round=r and customer=p_customer;
    else raise exception 'Etapa inválida. Complete os testes, o diagnóstico e a solução na ordem.';end if;
    update hardware_private.customer_attempts set progress=p,updated_at=clock_timestamp() where room_id=p_room and round=r and customer=p_customer and user_id=uid;
    if p_kind<>'renew' then insert into hardware_private.customer_events(room_id,round,customer,user_id,request,kind,choice,correct) values(p_room,r,p_customer,uid,p_request,p_kind,p_choice,correct);end if;
    if p_kind<>'validate' then update hardware_private.customer_jobs set lease_until=now()+interval '2 minutes' where room_id=p_room and round=r and customer=p_customer;end if;
   end if;
  end if;
 end if;
 select progress into p from hardware_private.customer_attempts where room_id=p_room and round=r and customer=p_customer and user_id=uid;
 return jsonb_build_object('job',(select value from jsonb_array_elements(hardware_private.customer_snapshot(p_room,r,uid)) where (value->>'id')::integer=p_customer),'progress',p,'feedback',feedback,'paid',paid);
end $$;
create function public.lab_customer_action(p_room uuid,p_round integer,p_customer integer,p_kind text,p_choice integer default null,p_request uuid default gen_random_uuid(),p_x double precision default null,p_z double precision default null)
returns jsonb language sql security invoker set search_path='' as $$ select hardware_private.customer_action(p_room,p_round,p_customer,p_kind,p_choice,p_request,p_x,p_z) $$;
revoke all on function hardware_private.customer_action(uuid,integer,integer,text,integer,uuid,double precision,double precision) from public,anon;
grant execute on function hardware_private.customer_action(uuid,integer,integer,text,integer,uuid,double precision,double precision) to authenticated;
revoke all on function public.lab_customer_action(uuid,integer,integer,text,integer,uuid,double precision,double precision) from public,anon;
grant execute on function public.lab_customer_action(uuid,integer,integer,text,integer,uuid,double precision,double precision) to authenticated;
create function hardware_private.celebration(p_room uuid,p_style integer,p_buy boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
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
   if earned<cost then raise exception 'Saldo fictício insuficiente para esta comemoração.';end if;
   insert into hardware_private.celebration_purchases(room_id,round,user_id,style,cost) values(p_room,r,uid,p_style,cost);
  end if;
  insert into hardware_private.student_celebrations(room_id,round,user_id,selected) values(p_room,r,uid,p_style) on conflict(room_id,round,user_id) do update set selected=excluded.selected;
 end if;
 return hardware_private.celebration_profile(p_room,r,uid);
end $$;
create function public.lab_celebration(p_room uuid,p_style integer default null,p_buy boolean default false)
returns jsonb language sql security invoker set search_path='' as $$ select hardware_private.celebration(p_room,p_style,p_buy) $$;
revoke all on function hardware_private.celebration(uuid,integer,boolean) from public,anon;
grant execute on function hardware_private.celebration(uuid,integer,boolean) to authenticated;
revoke all on function public.lab_celebration(uuid,integer,boolean) from public,anon;
grant execute on function public.lab_celebration(uuid,integer,boolean) to authenticated;

insert into hardware_private.customer_catalog(id,definition) values
(0,'{"name":"Bia","role":"Criadora de vídeos","color":"#8755b6","pants":"#283e58","hair":2,"from":-8,"to":0,"phase":0.2,"reward":160,"title":"A câmera sumiu da chamada","quote":"Minha apresentação está pronta, mas virei uma voz sem rosto!","symptom":"No notebook, a câmera funciona no teste do sistema. No navegador da videochamada, aparece acesso negado.","tests":[["Testar câmera no sistema","A câmera mostra imagem normal no aplicativo de teste."],["Conferir permissão do site","A permissão de câmera está bloqueada somente no site da chamada."]],"options":["Permissão do site bloqueada","Câmera fisicamente quebrada","Memória RAM insuficiente"],"answer":0,"repairs":["Formatar todo o notebook","Autorizar a câmera para o site confiável da chamada","Trocar a câmera"],"repair":1,"validation":"A chamada mostra imagem, com a permissão concedida apenas ao site necessário."}'::jsonb),
(1,'{"name":"Caio","role":"DJ da turma","color":"#d47b36","pants":"#26476b","hair":7,"from":1,"to":12,"phase":0.8,"reward":180,"title":"O notebook toca no lugar errado","quote":"Minha playlist está animada. Só o notebook resolveu fazer silêncio!","symptom":"O áudio avança na tela, mas o alto-falante do notebook fica mudo depois de conectar uma tela HDMI.","tests":[["Testar os alto-falantes","O som de teste é reproduzido normalmente pelos alto-falantes internos."],["Conferir dispositivo de saída","O aplicativo envia o áudio para a tela HDMI, que não possui alto-falantes."]],"options":["Alto-falantes internos queimados","SSD sem espaço","Saída de áudio selecionada incorretamente"],"answer":2,"repairs":["Selecionar os alto-falantes internos e testar o áudio","Substituir o SSD","Abrir o notebook e cortar o cabo HDMI"],"repair":0,"validation":"A saída correta foi selecionada e a música voltou a tocar nos alto-falantes internos."}'::jsonb),
(2,'{"name":"Lúcia","role":"Bibliotecária","color":"#368b82","pants":"#364b61","hair":3,"from":15,"to":26,"phase":1.2,"reward":220,"title":"O carregador não dá conta","quote":"Organizei todos os livros. Agora só falta organizar essa bateria teimosa!","symptom":"O notebook liga, mas informa carregador de baixa potência e a bateria descarrega durante o uso.","tests":[["Conferir especificações","O notebook exige alimentação USB-C PD de 65 W; o carregador conectado fornece apenas 18 W."],["Testar alimentação compatível","Com carregador USB-C PD de 65 W, aprovado e compatível com o notebook, a bateria carrega normalmente."]],"options":["Teclado com defeito","Carregador com potência e perfil incompatíveis","Tela com brilho alto como causa única"],"answer":1,"repairs":["Trocar a bateria antes de testar a alimentação","Usar qualquer adaptador que encaixe","Utilizar carregador e cabo compatíveis com o perfil exigido"],"repair":2,"validation":"O carregador e o cabo compatíveis mantiveram a alimentação e o carregamento durante o teste."}'::jsonb),
(3,'{"name":"Theo","role":"Jogador e curioso","color":"#bf4d63","pants":"#304058","hair":0,"from":29,"to":39,"phase":1.6,"reward":260,"title":"A tecla digita números","quote":"Eu queria escrever uma estratégia. O notebook está inventando uma senha!","symptom":"Ao digitar letras como J, K e L no teclado compacto, o notebook escreve números.","tests":[["Testar teclado externo","O teclado externo digita letras corretamente no mesmo aplicativo."],["Conferir função do teclado compacto","O teclado numérico embutido está ativado por Num Lock; ao desativá-lo, J, K e L voltam a ser letras."]],"options":["Layout de vídeo incorreto","Sistema inteiro corrompido","Teclado numérico embutido ativado"],"answer":2,"repairs":["Trocar a placa-mãe","Desativar a função numérica conforme o teclado e testar as letras","Formatar o SSD"],"repair":1,"validation":"A função numérica foi desativada e as letras foram conferidas no teclado do notebook."}'::jsonb);

-- All financial reads share the same ledger. Member-row locks serialize spending.
create function hardware_private.enrich_customer_students(p_room uuid,p_round integer,p_students jsonb,p_from timestamptz default '-infinity',p_until timestamptz default 'infinity')
returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(s.value||jsonb_build_object('extra_solved',coalesce(c.solved,0),'bonus',coalesce(c.bonus,0),'celebration_costs',coalesce(b.cost,0))),'[]'::jsonb)
 from jsonb_array_elements(p_students) s(value)
 left join (select completed_user,count(*) as solved,sum(reward) as bonus from hardware_private.customer_jobs where room_id=p_room and round=p_round and completed_at>=p_from and completed_at<p_until group by completed_user) c on c.completed_user::text=s.value->>'user_id'
 left join (select user_id,sum(cost) as cost from hardware_private.celebration_purchases where room_id=p_room and round=p_round and created_at>=p_from and created_at<p_until group by user_id) b on b.user_id::text=s.value->>'user_id'
$$;
create function hardware_private.customer_report(p_room uuid,p_round integer,p_user uuid,p_from timestamptz,p_until timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r integer;result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from hardware_private.admin_sessions where user_id=auth.uid() and expires_at>now()) then raise exception 'Acesso exclusivo do professor.';end if;
 select coalesce(p_round,round) into r from public.lab_rooms where id=p_room;if r is null then raise exception 'Turma não encontrada.';end if;
 if p_from is null or p_until is null or p_from>=p_until then raise exception 'Período inválido.';end if;
 select jsonb_build_object('jobs',coalesce((select jsonb_agg(jsonb_build_object('customer',j.customer,'name',c.definition->>'name','title',c.definition->>'title','user_id',j.completed_user,'nickname',j.completed_name,'full_name',s.full_name,'completed_at',j.completed_at,'reward',j.reward) order by j.completed_at) from hardware_private.customer_jobs j join hardware_private.customer_catalog c on c.id=j.customer left join hardware_private.student_profiles s on s.room_id=j.room_id and s.round=j.round and s.user_id=j.completed_user where j.room_id=p_room and j.round=r and j.completed_at>=p_from and j.completed_at<p_until and (p_user is null or j.completed_user=p_user)),'[]'::jsonb),'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at) from (select customer,kind,choice,correct,created_at from hardware_private.customer_events where room_id=p_room and round=r and user_id=p_user and created_at>=p_from and created_at<p_until order by created_at desc limit 2000) e),'[]'::jsonb)) into result;
 return result;
end $$;
create function public.lab_customer_report(p_room uuid,p_round integer default null,p_user uuid default null,p_from timestamptz default '-infinity',p_until timestamptz default 'infinity')
returns jsonb language sql security invoker set search_path='' as $$ select hardware_private.customer_report(p_room,p_round,p_user,p_from,p_until) $$;
revoke all on function public.lab_customer_report(uuid,integer,uuid,timestamptz,timestamptz) from public,anon;
grant execute on function public.lab_customer_report(uuid,integer,uuid,timestamptz,timestamptz) to authenticated;
revoke all on function hardware_private.customer_report(uuid,integer,uuid,timestamptz,timestamptz) from public,anon;
grant execute on function hardware_private.customer_report(uuid,integer,uuid,timestamptz,timestamptz) to authenticated;
revoke all on function hardware_private.extra_wallet(uuid,integer,uuid),hardware_private.celebration_profile(uuid,integer,uuid),hardware_private.customer_position(integer,double precision),hardware_private.customer_snapshot(uuid,integer,uuid),hardware_private.enrich_customer_students(uuid,integer,jsonb,timestamptz,timestamptz) from public,anon,authenticated;
create index customer_jobs_catalog_idx on hardware_private.customer_jobs(customer);
create index customer_attempts_catalog_idx on hardware_private.customer_attempts(customer);
create index customer_events_catalog_idx on hardware_private.customer_events(customer);
create index customer_events_user_idx on hardware_private.customer_events(user_id);

do $migration$
declare definition text;
begin
 select pg_get_functiondef('hardware_private.snapshot(uuid,integer)'::regprocedure) into definition;
 if position('if not teacher and r.competition_mode' in definition)=0 then raise exception 'Unexpected snapshot definition';end if;
 definition:=replace(definition,'if not teacher and r.competition_mode',$patch$
 with earnings as (
  select user_id,score,1 as solved,0 as extra from public.lab_completions where room_id=p_room and round=target_round
  union all select completed_user,reward,0,1 from hardware_private.customer_jobs where room_id=p_room and round=target_round and completed_user is not null
 ), totals as (select user_id,sum(score)::integer as earned,sum(solved)::integer as solved,sum(extra)::integer as extra_solved from earnings group by user_id)
 select coalesce(jsonb_agg(jsonb_build_object('user_id',t.user_id,'name',m.nickname,'earned',t.earned,'score',greatest(0,t.earned-(w.value->>'expenses')::integer),'expenses',(w.value->>'expenses')::integer,'solved',t.solved,'extra_solved',t.extra_solved) order by greatest(0,t.earned-(w.value->>'expenses')::integer) desc,m.nickname,t.user_id),'[]'::jsonb) into scores from totals t join public.lab_members m on m.room_id=p_room and m.user_id=t.user_id cross join lateral (select hardware_private.extra_wallet(p_room,target_round,t.user_id) as value) w;
 if not teacher and r.competition_mode$patch$);
 definition:=replace(definition,'''scores'',scores);','''scores'',scores,''customers'',hardware_private.customer_snapshot(p_room,target_round,uid),''celebrations'',hardware_private.celebration_profile(p_room,target_round,uid),''server_time'',extract(epoch from clock_timestamp()))||hardware_private.extra_wallet(p_room,target_round,uid);');
 execute definition;
 select pg_get_functiondef('hardware_private.incident(uuid,integer,integer,uuid)'::regprocedure) into definition;
 if position('into earned from public.lab_completions' in definition)=0 then raise exception 'Unexpected incident definition';end if;
 definition:=replace(definition,'select coalesce(sum(score),0)::integer into earned from public.lab_completions','select coalesce(sum(score),0)::integer+(hardware_private.extra_wallet(p_room,p_round,uid)->>''bonus'')::integer into earned from public.lab_completions');
 definition:=replace(definition,'select coalesce(sum(cost),0)::integer into expenses from hardware_private.floor_incidents where room_id=p_room and round=p_round and user_id=uid;','expenses:=(hardware_private.extra_wallet(p_room,p_round,uid)->>''expenses'')::integer;');
 execute definition;
 select pg_get_functiondef('hardware_private.wardrobe(uuid,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'a:=coalesce(p_appearance,','earned:=earned+(hardware_private.extra_wallet(p_room,current_round,uid)->>''bonus'')::integer; a:=coalesce(p_appearance,');
 execute definition;
 select pg_get_functiondef('hardware_private.student_report(uuid,integer,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'if p_user is null then','students:=hardware_private.enrich_customer_students(p_room,target_round,students); if p_user is null then');
 execute definition;
 select pg_get_functiondef('hardware_private.evaluation_report(uuid,integer,timestamptz,timestamptz,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'if p_user is not null then','students:=hardware_private.enrich_customer_students(p_room,target_round,students,p_from,p_until); if p_user is not null then');
 execute definition;
end $migration$;
