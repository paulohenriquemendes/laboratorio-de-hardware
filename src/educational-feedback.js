import {cases} from './cases.js';
import {challenges} from './challenges.js';
export function educationalFeedback(id,kind,choice,before,after){
 const c=cases[id],q=challenges[id];
 if(!c||!Number.isInteger(choice))return null;
 const conceptual=kind==='challenge';
 if(!['diagnosis','repair','challenge'].includes(kind)||(after?.[conceptual?'challengeErrors':'errors']||0)<=(before?.[conceptual?'challengeErrors':'errors']||0))return null;
 const options=conceptual?q.options:kind==='repair'?c.repairs:c.options;
 if(!options[choice])return null;
 const evidence=c.tests[1];
 return {
  title:'Vamos analisar essa escolha',chosen:options[choice],
  reason:conceptual?q.hint:kind==='repair'?`A solução precisa tratar o diagnóstico que você já confirmou: ${c.options[c.answer]}. A opção escolhida ainda não resolveu esse problema.`:'Essa hipótese ainda não reúne as evidências necessárias para explicar o caso. Compare sua escolha com o resultado abaixo.',
  evidence:conceptual?null:{title:evidence[0],result:evidence[1]},
  reflection:conceptual?'Releia o enunciado e confira qual relação ou unidade precisa ser respeitada.':kind==='repair'?'Qual procedimento atende a esse resultado? Escolha uma ação que trate a causa confirmada, preservando os dados e a segurança.':'O que esse teste confirmou ou descartou? Sua hipótese explica esse resultado e também o outro teste?',
  followup:!conceptual&&after.errors>=3?'Dica adicional: altere uma variável de cada vez e escolha a hipótese que explica os dois testes.':null,
  penalty:conceptual?'Você pode tentar novamente sem desconto na recompensa.':'O erro foi registrado. A regra continua: desconto de R$ 5, com recompensa mínima de R$ 20.'
 };
}
export function showEducationalFeedback(container,feedback,fallback=''){
 container.replaceChildren();container.classList.toggle('educational-feedback',!!feedback);
 if(!feedback){container.textContent=fallback;return;}
 const add=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;container.append(el);return el;};
 add('strong',feedback.title);add('p','Sua escolha: “'+feedback.chosen+'”.');add('p',feedback.reason);
 if(feedback.evidence){add('p','Resultado de “'+feedback.evidence.title+'”: '+feedback.evidence.result);const button=add('button','Rever evidências na ficha');button.type='button';button.onclick=()=>{const book=document.querySelector('#caseContent .evidence-book');if(book){book.open=true;book.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}};}
 add('p',feedback.reflection);if(feedback.followup)add('p',feedback.followup);add('small',feedback.penalty);
 container.scrollIntoView({block:'nearest'});
}
