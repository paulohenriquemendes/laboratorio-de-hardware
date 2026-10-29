// Old classroom invitations keep the same room ID, query parameters and hash.
(()=>{
 if(location.hostname!=='paulohenriquemendes.github.io')return;
 const parts=location.pathname.split('/');
 if(!['laboratorio-de-hardware','oficina-3d'].includes(parts[1]))return;
 parts[1]='missao-hardware';
 window.missionRedirecting=true;
 location.replace(location.origin+parts.join('/')+location.search+location.hash);
})();
