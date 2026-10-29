import {notebookRewards} from './notebook-cases.js';
import {legacyOrder} from './challenge-order.js';
export const MAX_EARNINGS=5420;
const currencyFormat=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
export const money=value=>currencyFormat.format(value);
const originalRewards=new Map(legacyOrder.map((id,index)=>[id,20*Math.ceil((index+1)/16)]));
export const baseReward=id=>originalRewards.get(id)??notebookRewards[id-100]??20;
export const caseReward=(id,errors=0)=>Math.max(20,baseReward(id)-5*Math.max(0,errors));
