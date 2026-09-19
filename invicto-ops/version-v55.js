/* INVICTO OPS v55.0 */
(function(){
  function apply55(){
    const f=document.querySelector('.sidebar-foot');
    if(f)f.innerHTML=f.innerHTML.replace(/Versión\s+[^<]+/,'Versión 55.0');
  }
  apply55();setTimeout(apply55,300);setTimeout(apply55,1500);
})();