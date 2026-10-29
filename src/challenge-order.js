// Pedagogical order uses immutable case IDs (zero-based in storage/API).
// Never reorder cases/challenges: existing answers and scores belong to those IDs.
const originalNumbers = [
 41,42,78,63,61,62,79,80,22,23,10,33,35,16,37,40,
 51,69,67,64,65,66,70,43,44,45,46,47,49,50,52,53,55,
 54,56,57,58,60,59,71,72,74,73,75,48,68,77,76,
 15,29,20,17,7,6,19,11,26,25,5,8,9,30,31,32,
 21,38,1,2,18,27,28,3,39,4,24,12,14,34,13,36
];
export const legacyOrder = Object.freeze(originalNumbers.map(n=>n-1));
export const challengeOrder = Object.freeze([...Array.from({length:20},(_,i)=>80+i),...legacyOrder]);
const numbers = new Map(challengeOrder.map((id,index)=>[id,index+1]));
export const pcNumber = id => numbers.get(id);
export const pcLabel = id => String(pcNumber(id)).padStart(2,'0');
export const byPcNumber = (a,b) => pcNumber(a.pc)-pcNumber(b.pc);
