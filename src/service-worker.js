const VERSION='__VERSION__',FILES=__FILES__;
const ROOT=new URL('./',self.location.href),PREFIX='hardware-offline-'+ROOT.pathname+'-',CACHE=PREFIX+VERSION;
const paths=new Set(FILES.map(f=>new URL(f,ROOT).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{await cache.addAll(FILES.map(f=>new Request(new URL(f,ROOT),{cache:'reload'})));}
 catch(error){await caches.delete(CACHE);throw error;}
 // Activate only after every file is stored successfully.
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Keep the preceding release for tabs that still reference its hashed assets.
 const old=(await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE);
 await Promise.all(old.slice(0,-1).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='OFFLINE_STATUS')event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);const stored=await Promise.all(FILES.map(f=>cache.match(new URL(f,ROOT))));
  event.ports[0]?.postMessage({ready:stored.every(Boolean),version:VERSION});
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin)return;
 // The game always opens from its complete, versioned shell. No network wait on a poor connection.
 if(request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===ROOT.pathname+'index.html')){
  event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(new URL('index.html',ROOT))||fetch(request);})());return;
 }
 // Never cache API calls, student records, admin pages or arbitrary navigation.
 if(paths.has(url.href))event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(request)||fetch(request);})());
 else if(url.pathname.startsWith(ROOT.pathname+'assets/'))event.respondWith((async()=>{return await caches.match(request)||fetch(request);})());
});
