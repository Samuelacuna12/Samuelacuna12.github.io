/* INVICTO OPS v48 · marcador de versión desplegada */
(function(){
  const VERSION='48.0';
  function apply(){
    const foot=document.querySelector('.sidebar-foot');
    if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión '+VERSION);
  }
  const base=window.renderShell;
  if(typeof base==='function')window.renderShell=function(){base();apply();};
  const mo=new MutationObserver(()=>apply());
  if(document.body)mo.observe(document.body,{childList:true,subtree:true});
  setTimeout(apply,50);setInterval(apply,2500);
  console.info('INVICTO OPS v'+VERSION);
})();