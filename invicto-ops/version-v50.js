/* INVICTO OPS v50 · marcador de versión */
(function(){
  const VERSION='50.0';
  function apply(){
    const foot=document.querySelector('.sidebar-foot');if(!foot)return;
    const before=foot.innerHTML,after=before.replace(/Versión\s+[^<]+/,'Versión '+VERSION);
    if(after!==before)foot.innerHTML=after;
  }
  const base=window.renderShell;
  if(typeof base==='function')window.renderShell=function(){const r=base.apply(this,arguments);apply();return r;};
  setTimeout(apply,100);setTimeout(apply,1200);
  console.info('INVICTO OPS v'+VERSION);
})();
