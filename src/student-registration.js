const KEY='hardware.studentRegistration.v1';
export function setupStudentRegistration(){
 const full=document.querySelector('#registrationName'),nick=document.querySelector('#nickname');
 let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
 full.value=typeof saved.fullName==='string'?saved.fullName.slice(0,120):'';
 function read(){
  const fullName=full.value.trim().replace(/\s+/g,' ');
  full.setCustomValidity(fullName.length<5||!/^\S+\s+\S+/.test(fullName)||/[<>\x00-\x1f]/.test(fullName)?'Informe seu nome completo, com nome e sobrenome.':'');
  if(!full.reportValidity())return null;
  const nickname=(nick.value.trim()||fullName.split(' ')[0]).slice(0,24);
  if(nickname.length<2||/[<>\x00-\x1f]/.test(nickname)){nick.setCustomValidity('Escolha um apelido de 2 a 24 caracteres.');nick.reportValidity();return null;}
  const data={...saved,fullName};saved=data;try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}
  return {...data,nickname};
 }
 for(const input of [full,nick])input.addEventListener('input',()=>input.setCustomValidity(''));
 return {read,rememberRoom(room){saved={...saved,roomId:room.id,className:room.title};try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{}},get saved(){const rid=new URL(location.href).searchParams.get('sala');return {...saved,className:rid&&rid!==saved.roomId?'':saved.className};}};
}
