import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
export function offlineBuild(){return {
 name:'hardware-offline',apply:'build',enforce:'post',
 generateBundle(_,bundle){
  const names=Object.keys(bundle).filter(n=>n==='index.html'||n.startsWith('assets/')).sort();
  const logo=readFileSync(new URL('./public/logo.svg',import.meta.url));
  const hash=createHash('sha256');for(const n of names)hash.update(n).update(bundle[n].code||bundle[n].source);hash.update(logo);
  const version=hash.digest('hex').slice(0,16);
  const list=[...names,'logo.svg'];
  const template=readFileSync(new URL('./src/service-worker.js',import.meta.url),'utf8');
  this.emitFile({type:'asset',fileName:'sw.js',source:template.replace('__VERSION__',version).replace('__FILES__',JSON.stringify(list))});
 }
};}
