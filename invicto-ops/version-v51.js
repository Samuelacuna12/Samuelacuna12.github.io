/* INVICTO OPS v51.3 · versión canónica */
(function(){
  const VERSION='51.3';
  function apply(){const foot=document.querySelector('.sidebar-foot');if(!foot)return;const before=foot.innerHTML,after=before.replace(/Versión\s+[^<]+/,'Versión '+VERSION);if(after!==before)foot.innerHTML=after}
  const base=window.renderShell;if(typeof base==='function')window.renderShell=function(){const r=base.apply(this,arguments);apply();return r};
  if(!document.querySelector('script[data-v51-performance]')){const s=document.createElement('script');s.src='ops-v51-performance-sync.js?v=51.3';s.dataset.v51Performance='1';document.body.appendChild(s)}
  if(!document.querySelector('script[data-v513-blue-goal]')){const s=document.createElement('script');s.src='ops-v51-3-blue-goal.js?v=51.3';s.async=false;s.dataset.v513BlueGoal='1';document.body.appendChild(s)}
  setTimeout(apply,120);setTimeout(apply,1200);
  console.info('INVICTO OPS v'+VERSION+' · fuente única + Inicio completo + meta azul');
})();