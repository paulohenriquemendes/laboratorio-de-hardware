import {setupLearningMap} from './learning-map.js';
import {workshopLesson,workshopLessons} from './workshop-content.js';
import {customerQuestions} from './customer-questions.js';
import {customerCases} from './customer-cases.js';
import {money} from './economy.js';
import {pcLabel,byPcNumber} from './challenge-order.js';
import {cases} from './cases.js';
import {challenges} from './challenges.js';
import {periodBounds,evaluationCsv} from './evaluation-export.js';
const $=s=>document.querySelector(s);
const date=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'}):'Não enviado';
function download(name,content,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function eventText(e){const c=cases[e.pc],names={test:'Evidência consultada',diagnosis:'Diagnóstico',repair:'Solução',validate:'Validação',challenge:'Questão conceitual'};const option=e.kind==='test'?c?.tests[e.choice]?.[0]:e.kind==='diagnosis'?c?.options[e.choice]:e.kind==='repair'?c?.repairs[e.choice]:e.kind==='challenge'?challenges[e.pc]?.options[e.choice]:'Solução validada';return `${date(e.created_at)} · ${names[e.kind]||e.kind}: ${option||'Alternativa não identificada'}${e.correct===true?' · Correta':e.correct===false?' · Incorreta':''}`;}
export function setupParticipation({client,getRoom}){
 const learningMap=setupLearningMap({client,getRoom});
 let round=null,room=null,students=[],serial=0,detailSerial=0,reportText='',period=null,ready=false;
 async function call(user=null){const {data,error}=await client.rpc(period?'lab_evaluation_report':'lab_student_report',{p_room:room,p_round:round,p_user:user,...(period?{p_from:period.from,p_until:period.until}:{})});if(error)throw error;return data;}
 async function practices(user){const {data,error}=await client.rpc('lab_workshop_report',{p_room:room,p_round:round,p_user:user,...(period?{p_from:period.from,p_until:period.until}:{})});if(error)throw error;return data;}
 async function extras(user=null){const {data,error}=await client.rpc('lab_customer_report',{p_room:room,p_round:round,p_user:user,...(period?{p_from:period.from,p_until:period.until}:{})});if(error)throw error;return data;}
 function clear(){learningMap.clear();serial++;detailSerial++;ready=false;students=[];reportText='';$('#downloadStudents').disabled=true;$('#downloadAnswers').disabled=true;$('#studentRows').replaceChildren();$('#studentAnswerRows').replaceChildren();$('#studentAnswers').hidden=true;$('#studentsStatus').textContent='';}
 async function load(value){
  clear();round=value;room=getRoom();const token=serial;$('#studentsStatus').textContent='Carregando participação…';
  try{const data=await call();if(token!==serial)return;students=data.students;learningMap.load(round,period);ready=true;$('#downloadStudents').disabled=false;
   $('#evaluationPeriodStatus').textContent=period?'Filtro aplicado: '+period.label+'. Contagens e exportação consideram apenas esse período; alunos sem atividade aparecem com zero.':'Filtro aplicado: rodada inteira. Para restringir à aula, preencha as datas e clique em Aplicar período.';
   $('#studentsStatus').textContent=`Rodada ${data.round} · ${students.length} alunos`+(period?' · '+students.filter(s=>s.responses||s.solved||s.extra_solved||s.workshop_solved).length+' com atividade no período':' com identificação ou atividades iniciadas')+' · Concluídos: PCs, clientes e práticas. Recompensas incluem os pagamentos extras; compras não reduzem a participação.';
   $('#practicedHeader').textContent=period?'Praticados no período':'Iniciados';
   for(const student of students){const tr=document.createElement('tr');for(const text of [student.full_name?student.full_name+'\nApelido: '+student.nickname:'Não identificado · '+student.nickname,student.class_name||'—',student.practiced,student.solved+(student.extra_solved?' + '+student.extra_solved+' clientes':'')+(student.workshop_solved?' + '+student.workshop_solved+' práticas':''),student.concepts,money(student.score+(student.bonus||0)+(student.workshop_bonus||0)),date(student.submitted_at)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}const td=document.createElement('td'),button=document.createElement('button');button.textContent=period?'Ver respostas do período':'Ver respostas';button.setAttribute('aria-label','Ver respostas de '+(student.full_name||student.nickname));button.onclick=()=>details(student);td.append(button);tr.append(td);$('#studentRows').append(tr);}
  }catch(e){if(token===serial)$('#studentsStatus').textContent=e.message;}
 }
 async function details(student){
  const token=++detailSerial;$('#studentAnswers').hidden=false;$('#studentAnswersTitle').textContent=student.full_name||student.nickname;$('#studentAnswersHint').textContent='Carregando respostas…';$('#studentAnswerRows').replaceChildren();reportText='';$('#downloadAnswers').disabled=true;
  try{const [data,extra,practice]=await Promise.all([call(student.user_id),extras(student.user_id),practices(student.user_id)]);if(token!==detailSerial)return;
   const hint=(period?'Somente respostas e conclusões registradas em '+period.label+'.':'Respostas específicas são registradas a partir da implantação do histórico. Atividades anteriores podem ter apenas as etapas preservadas.')+(data.events_truncated?' Exibindo os 2000 registros mais recentes deste filtro; os totais da planilha não são limitados.':'');$('#studentAnswersHint').textContent=hint;
   const lines=['MISSÃO HARDWARE — PARTICIPAÇÃO',student.full_name||'Nome completo não informado','Apelido: '+student.nickname,'Turma: '+(student.class_name||'Não informada'),'Rodada: '+round,period?'Período: '+period.label:'Período: rodada inteira',`Praticados: ${student.practiced} | Concluídos: ${student.solved} | Conceitos: ${student.concepts} | Reais fictícios: ${money(student.score)}`,'Enviado no filtro: '+date(student.submitted_at),hint,''];
   const attempts=period?[...new Set([...data.events.map(e=>e.pc),...data.completions.map(c=>c.pc)])].map(pc=>({pc,completion:data.completions.find(c=>c.pc===pc)})):data.attempts;
   for(const attempt of [...attempts].sort(byPcNumber)){const p=attempt.progress,title=`PC ${pcLabel(attempt.pc)} · ${cases[attempt.pc]?.title} · ${period?(attempt.completion?'Concluído no período':'Com respostas no período'):(p.validated?'Concluído':'Em andamento')}`;
    const events=data.events.filter(e=>e.pc===attempt.pc),summary=period?`${events.length} respostas exibidas neste período`+(attempt.completion?' · Conclusão: '+date(attempt.completion.completed_at):''):`Evidências: ${p.tests.length}/2 · Erros práticos: ${p.errors} · Conceito: ${p.challenge?'concluído':'pendente'} · Erros conceituais: ${p.challengeErrors}`;
    const content=events.length?events.map(eventText):['Sem registro das alternativas específicas desta atividade anterior.'];lines.push(title,summary,...content,'');const d=document.createElement('details'),h=document.createElement('summary'),paragraph=document.createElement('p'),list=document.createElement('ol');h.textContent=title;paragraph.textContent=summary;for(const text of content){const li=document.createElement('li');li.textContent=text;list.append(li);}d.append(h,paragraph,list);$('#studentAnswerRows').append(d);
   }
   if(!attempts.length)$('#studentAnswersHint').textContent=period?'Este aluno não tem respostas nem conclusões no período escolhido.':'Este aluno ainda não consultou evidências nem resolveu desafios nesta rodada.';
   lines.push('ATENDIMENTOS EXTRAS: '+(student.extra_solved||0)+' | Pagamentos: '+money(student.bonus||0)+' | Compras de comemorações: '+money(student.celebration_costs||0));
   for(const [id,c] of customerCases.entries()){const job=extra.jobs.find(j=>j.customer===id),events=extra.events.filter(e=>e.customer===id);if(!job&&!events.length)continue;const d=document.createElement('details'),h=document.createElement('summary'),ul=document.createElement('ol');h.textContent='Cliente '+c.name+' · '+c.title+(job?' · '+money(job.reward):' · Em andamento');d.append(h);lines.push(h.textContent);for(const e of events){const option=e.kind==='question'?customerQuestions[id][e.choice]?.join(': '):e.kind==='test'?c.tests[e.choice]?.[0]:e.kind==='diagnosis'?c.options[e.choice]:e.kind==='repair'?c.repairs[e.choice]:'Solução validada';const text=date(e.created_at)+' · '+option+(e.correct===false?' · Incorreta':e.correct===true?' · Correta':'');const li=document.createElement('li');li.textContent=text;ul.append(li);lines.push(text);}d.append(ul);$('#studentAnswerRows').append(d);}
   if(extra.jobs.length||extra.events.length)$('#studentAnswersHint').textContent=hint;
   lines.push('BANCADA PRÁTICA: '+(student.workshop_solved||0)+' conclusões | Recompensas: '+money(student.workshop_bonus||0));
   for(const base of workshopLessons){const events=practice.events.filter(e=>e.lesson===base.id);if(!events.length)continue;const c=workshopLesson(base.id,round),d=document.createElement('details'),h=document.createElement('summary'),ul=document.createElement('ol');h.textContent='Bancada prática · '+c.title;lines.push(h.textContent);for(const e of events){const step=c.steps[e.step],text=date(e.created_at)+' · '+step.title+' · '+(step.options[e.choice]||'Alternativa')+' · '+(e.correct?'Correta':'Incorreta');const li=document.createElement('li');li.textContent=text;ul.append(li);lines.push(text);}d.append(h,ul);$('#studentAnswerRows').append(d);}
   if(practice.events.length)$('#studentAnswersHint').textContent=hint;
   reportText=lines.join('\n');$('#downloadAnswers').disabled=false;$('#studentAnswers').scrollIntoView({block:'start'});
  }catch(e){if(token===detailSerial)$('#studentAnswersHint').textContent=e.message;}
 }
 $('#refreshStudents').onclick=()=>load(Number($('#teacherRound').value));
 $('#evaluationPeriod').onsubmit=e=>{e.preventDefault();try{period=periodBounds($('#evaluationFrom').value,$('#evaluationThrough').value);void load(Number($('#teacherRound').value));}catch(error){$('#evaluationPeriodStatus').textContent=error.message;}};
 $('#clearEvaluationPeriod').onclick=()=>{$('#evaluationFrom').value=$('#evaluationThrough').value='';period=null;void load(Number($('#teacherRound').value));};
 $('#downloadStudents').onclick=()=>{if(ready)download('participacao-rodada-'+round+(period?'-'+period.slug:'')+'.csv',evaluationCsv(students,round,period),'text/csv;charset=utf-8');};
 $('#downloadAnswers').onclick=()=>{if(reportText)download('respostas-aluno-rodada-'+round+(period?'-'+period.slug:'')+'.txt',reportText);};
 return {load,clear};
}
