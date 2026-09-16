/* INVICTO OPS v51.6 · versión canónica */
(function(){
  const VERSION='51.6';
  function apply(){const foot=document.querySelector('.sidebar-foot');if(!foot)return;const before=foot.innerHTML,after=before.replace(/Versión\s+[^<]+/,'Versión '+VERSION);if(after!==before)foot.innerHTML=after}
  const base=window.renderShell;if(typeof base==='function')window.renderShell=function(){const r=base.apply(this,arguments);apply();return r};
  if(!document.querySelector('script[data-v51-performance]')){const s=document.createElement('script');s.src='ops-v51-performance-sync.js?v=51.6';s.dataset.v51Performance='1';document.body.appendChild(s)}
  setTimeout(apply,120);setTimeout(apply,1200);setTimeout(apply,2200);
  console.info('INVICTO OPS v'+VERSION+' · fuente única + Inicio premium + operación completa de ventas');
})();