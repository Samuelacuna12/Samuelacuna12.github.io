/* INVICTO OPS v52.4 */
(function(){
  function apply(){const f=document.querySelector('.sidebar-foot');if(f)f.innerHTML=f.innerHTML.replace(/Versión\s+[^<]+/,'Versión 52.4');}
  apply();setTimeout(apply,300);setTimeout(apply,1500);
  if(!document.querySelector('script[data-v524]')){
    const s=document.createElement('script');
    s.dataset.v524='1';
    s.src='ops-v52-2-admin-presence.js?v=52.4&t='+Date.now();
    document.body.appendChild(s);
  }
})();
