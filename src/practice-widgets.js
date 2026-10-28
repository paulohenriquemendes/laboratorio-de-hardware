// Exploratory tools: assessed answers still use the existing individual workflow.
export function mountPractice(container, caseId) {
 const binary = [40,41,42,43,44,45,46,47,48,49].includes(caseId);
 if (!binary && caseId !== 55) return;
 const section = document.createElement('details');
 section.className = 'practice-widget';
 section.innerHTML = `<summary>Experimentar: ${binary ? 'painel de bits' : 'tempo de cópia'}</summary><p>Área de experimentação livre, sem pontos. Depois, responda à ficha do computador.</p>`;
 const output = document.createElement('output');
 output.setAttribute('aria-live','polite');
 if(binary) {
  const count = [40,41,44,46,47,49].includes(caseId) ? 8 : 4;
  const bits = Array(count).fill(0), row = document.createElement('div');
  row.className = 'bit-controls';
  const update = () => {
   const value = bits.reduce((sum,bit,i)=>sum+bit*2**(count-i-1),0);
   output.textContent = `${bits.join('')}₂ = ${value} em decimal = ${value.toString(16).toUpperCase()} em hexadecimal`;
  };
  bits.forEach((_,i)=>{
   const weight = 2**(count-i-1), label = document.createElement('label');
   const input = document.createElement('input');input.type='checkbox';input.setAttribute('aria-label',`Bit de peso ${weight}`);
   const digit = document.createElement('span');digit.textContent='0';
   const caption = document.createElement('small');caption.textContent=`Peso ${weight}`;
   input.onchange=()=>{bits[i]=Number(input.checked);digit.textContent=String(bits[i]);update();};
   label.append(input,digit,caption);row.append(label);
  });
  section.append(row);update();
 } else {
  const fields = document.createElement('div');fields.className='copy-controls';
  fields.innerHTML='<label>Tamanho (MB)<input name="size" type="number" min="1" max="1000000" value="100" inputmode="decimal"></label><label>Taxa (MB/s)<input name="rate" type="number" min="0.1" step="0.1" max="1000000" value="20" inputmode="decimal"></label>';
  const update=()=>{
   const size=fields.querySelector('[name=size]'),rate=fields.querySelector('[name=rate]');
   output.textContent=size.checkValidity()&&rate.checkValidity()&&size.value&&rate.value ? `Tempo ideal: ${(Number(size.value)/Number(rate.value)).toLocaleString('pt-BR',{maximumFractionDigits:2})} s (sem overhead).` : 'Informe tamanho e taxa positivos, dentro dos limites indicados.';
  };
  fields.addEventListener('input',update);section.append(fields);update();
 }
 section.append(output);container.append(section);
}
