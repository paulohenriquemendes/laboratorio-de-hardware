const KEY='hardware.studentRegistration.v1';
export function setupStudentRegistration(){
 const full=document.querySelector('#registrationName'),group=document.querySelector('#registrationClass'),nick=document.querySelector('#nickname');
 let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
 full.value=typeof saved.fullName==='string'?saved.fullName.slice(0,120):'';
 group.value=typeof saved.className==='string'?saved.className.slice(0,80):'';
 function read(){
  const fullName=full.value.trim().replace(/\s+/g,' '),className=group.value.trim();
  full.setCustomValidity(fullName.length<5||!/^\S+\s+\S+/.test(fullName)||/[<>\x00-\x1f]/.test(fullName)?'Informe seu nome completo, com nome e sobrenome.':'');
  group.setCustomValidity(className.length<2||/[<>\x00-\x1f]/.test(className)?'Informe sua turma.':'');
  if(!full.reportValidity()||!group.reportValidity())return null;
  const nickname=(nick.value.trim()||fullName.split(' ')[0]).slice(0,24);
  if(nickname.length<2||/[<>\x00-\x1f]/.test(nickname)){nick.setCustomValidity('Escolha um apelido de 2 a 24 caracteres.');nick.reportValidity();return null;}
  const data={fullName,className};try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}
  return {...data,nickname};
 }
 for(const input of [full,group,nick])input.addEventListener('input',()=>input.setCustomValidity(''));
 return {read,get saved(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}};
}
