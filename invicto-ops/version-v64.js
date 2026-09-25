/* INVICTO OPS v64.0 · auditoría de entrega */
(function(){
  function apply(){
    const f=document.querySelector('.sidebar-foot');
    if(f)f.innerHTML=f.innerHTML.replace(/Versión\s+[^<]+/,'Versión 64.0');
  }
  apply();setTimeout(apply,300);setTimeout(apply,1500);
})();