export const styleNames=['Curto','Cacheado','Comprido','Coque','Moicano','Afro','Tranças','Topete'];
export const stylePoints=[0,0,0,0,300,600,1200,1800];
export const accessories=[{key:'jacket',name:'Casaco aberto',points:1500},{key:'gloves',name:'Luvas esportivas',points:2400},{key:'tattoo',name:'Tatuagem de circuito',points:6000}];
export function unlockedAppearance(a,score=0){return {...a,style:score>=(stylePoints[a.style]??Infinity)?a.style:0,...Object.fromEntries(accessories.map(item=>[item.key,!!a[item.key]&&score>=item.points]))};}
