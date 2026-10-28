import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:320,height:568},hasTouch:true});
 await page.setContent('<main></main>');
 await page.addStyleTag({content:fs.readFileSync('practice.css','utf8')});
 const source=fs.readFileSync('src/practice-widgets.js','utf8');
 const mount=async id=>page.evaluate(async({source,id})=>{const {mountPractice}=await import('data:text/javascript;base64,'+btoa(unescape(encodeURIComponent(source))));const main=document.querySelector('main');main.replaceChildren();mountPractice(main,id);},{source,id});
 await mount(43);await page.locator('summary').tap();
 await page.getByLabel('Bit de peso 8',{exact:true}).check();await page.getByLabel('Bit de peso 4',{exact:true}).check();await page.getByLabel('Bit de peso 1',{exact:true}).check();
 assert.match(await page.locator('output').innerText(),/1101₂ = 13 em decimal = D/);
 await mount(46);await page.locator('summary').tap();for(const box of await page.locator('input').all())await box.check();assert.match(await page.locator('output').innerText(),/11111111₂ = 255 em decimal = FF/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await mount(55);await page.locator('summary').tap();assert.match(await page.locator('output').innerText(),/5 s/);await page.getByLabel('Taxa').fill('10');assert.match(await page.locator('output').innerText(),/10 s/);await page.getByLabel('Taxa').fill('0');assert.match(await page.locator('output').innerText(),/positivos/);await page.getByLabel('Taxa').fill('');assert.match(await page.locator('output').innerText(),/positivos/);
 await mount(0);assert.equal(await page.locator('details').count(),0);
 console.log('PASS painéis práticos: binário, hexadecimal, cópia, entrada inválida e tela estreita');
}finally{await browser.close()}
