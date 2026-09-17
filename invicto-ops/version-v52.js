/* INVICTO OPS v52.3 */
(function(){
  function apply(){const f=document.querySelector('.sidebar-foot');if(f)f.innerHTML=f.innerHTML.replace(/Versión\s+[^<]+/,'Versión 52.3');}
  apply();setTimeout(apply,300);setTimeout(apply,1500);
  if(!document.querySelector('script[data-v523]')){
    const s=document.createElement('script');
    s.dataset.v523='1';
    s.src='ops-v52-3-carryover-clarity.js?v=52.3&t='+Date.now();
    document.body.appendChild(s);
  }
})();
