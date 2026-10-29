// School-day boundaries are explicit, independent of the teacher's browser timezone.
export function periodBounds(from,through){
 if(!from&&!through)return null;
 const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00-03:00'))&&new Date(value+'T00:00:00-03:00').toISOString().slice(0,10)===value;
 if(!valid(from)||!valid(through)||from>through)throw new Error('Preencha as duas datas; a data final deve ser igual ou posterior à inicial.');
 return {from:new Date(from+'T00:00:00-03:00').toISOString(),until:new Date(Date.parse(through+'T00:00:00-03:00')+86400000).toISOString(),label:from.split('-').reverse().join('/')+' a '+through.split('-').reverse().join('/')+' · horário de Fortaleza',slug:from+'-a-'+through};
}
export function csvCell(value){let text=String(value??'');if(/^\s*[=+@\-]|^[\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function evaluationCsv(students,round,period=null){
 const headers=['Nome completo','Turma','Apelido','Rodada',period?'Desafios praticados no período':'Desafios iniciados','Desafios concluídos','Conceitos concluídos','Recompensas obtidas nos PCs (BRL fictício)','Envio da participação'];
 if(period)headers.push('Erros registrados no período','Respostas registradas no período','Primeira atividade','Última atividade','Período (Fortaleza)','Incidentes simulados no período','Custos fictícios de incidentes (BRL)');
 const display=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'}):'';
 headers.push('Clientes atendidos','Pagamentos de clientes (BRL fictício)','Compras de comemorações (BRL fictício)','Práticas concluídas','Recompensas de práticas (BRL fictício)');
 const rows=[headers,...students.map(s=>{const row=[s.full_name||'Não identificado',s.class_name||'',s.nickname,round,s.practiced,s.solved,s.concepts,s.score,display(s.submitted_at)];if(period)row.push(s.errors,s.responses,display(s.first_activity),display(s.last_activity),period.label,s.incidents||0,s.incident_costs||0);row.push(s.extra_solved||0,s.bonus||0,s.celebration_costs||0,s.workshop_solved||0,s.workshop_bonus||0);return row;})];
 return '\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
}
