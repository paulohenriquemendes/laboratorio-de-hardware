import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
export function offlineBuild(){return {
 name:'hardware-offline',apply:'build',enforce:'post',
 generateBundle(_,bundle){
  const names=Object.keys(bundle).filter(n=>n==='index.html'||n.startsWith('assets/')).sort();
  const publicFiles=['logo.svg','brand-lockup.svg','route-redirect.js'];
  const hash=createHash('sha256');for(const n of names)hash.update(n).update(bundle[n].code||bundle[n].source);for(const name of publicFiles)hash.update(name).update(readFileSync(new URL('./public/'+name,import.meta.url)));
  const template=readFileSync(new URL('./src/service-worker.js',import.meta.url),'utf8');
  hash.update(template);const version=hash.digest('hex').slice(0,16);
  const list=[...names,...publicFiles];
  this.emitFile({type:'asset',fileName:'sw.js',source:template.replace('__VERSION__',version).replace('__FILES__',JSON.stringify(list))});
 }
};}
