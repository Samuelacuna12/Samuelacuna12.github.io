/* INVICTO OPS v47 · marcador de versión actual */
(function(){
  const VERSION='47.0';
  window.INVICTO_OPS_VERSION=VERSION;
  function patchVersion(){
    const foot=document.querySelector('.sidebar-foot');
    if(!foot)return;
    const current=foot.innerHTML;
    const next=current.replace(/Versión\s+[^<]+/,'Versión '+VERSION);
    if(next!==current)foot.innerHTML=next;
  }
  patchVersion();
  const observer=new MutationObserver(()=>queueMicrotask(patchVersion));
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  const baseRenderShell=window.renderShell;
  if(typeof baseRenderShell==='function'){
    window.renderShell=function(...args){
      const result=baseRenderShell.apply(this,args);
      queueMicrotask(patchVersion);
      return result;
    };
  }
  console.info('INVICTO OPS · Versión '+VERSION);
})();
