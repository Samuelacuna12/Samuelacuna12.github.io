/* INVICTO OPS v59.0 */
(function(){
  function apply(){
    const f=document.querySelector('.sidebar-foot');
    if(f)f.innerHTML=f.innerHTML.replace(/Versión\s+[^<]+/,'Versión 59.0');
  }
  apply();setTimeout(apply,300);setTimeout(apply,1500);
})();