/* INVICTO OPS v48.1 · marcador de versión sin MutationObserver */
(function(){
  const VERSION='48.1';
  function apply(){
    const foot=document.querySelector('.sidebar-foot');
    if(!foot)return;
    const before=foot.innerHTML;
    const after=before.replace(/Versión\s+[^<]+/,'Versión '+VERSION);
    if(after!==before)foot.innerHTML=after;
  }
  const base=window.renderShell;
  if(typeof base==='function')window.renderShell=function(){
    const r=base.apply(this,arguments);
    apply();
    return r;
  };
  setTimeout(apply,100);
  setTimeout(apply,1200);
  console.info('INVICTO OPS v'+VERSION+' · freeze hotfix activo');
})();
