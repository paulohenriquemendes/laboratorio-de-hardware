import {pcNumber} from './challenge-order.js';
export const MAX_EARNINGS=4800;
const currencyFormat=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
export const money=value=>currencyFormat.format(value);
export const baseReward=id=>20*Math.ceil(pcNumber(id)/16);
export const caseReward=(id,errors=0)=>Math.max(20,baseReward(id)-5*Math.max(0,errors));
