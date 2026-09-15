/* INVICTO OPS v35 · activador visual solamente */
(function(){
  function applyV35(){
    document.documentElement.classList.add('invicto-ui-v35');
    document.body?.classList.add('invicto-ui-v35');
    const foot=document.querySelector('.sidebar-foot');
    if(foot){
      if(/Versión\s+[^<\n]+/.test(foot.innerHTML)) foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<\n]+/,'Versión 35.0');
      else if(!foot.textContent.includes('35.0')) foot.insertAdjacentHTML('beforeend','<div style="margin-top:12px">Versión 35.0</div>');
    }
  }
  const mo=new MutationObserver(applyV35);
  mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',applyV35);
  applyV35();
  console.info('INVICTO OPS v35 · capa visual premium activa');
})();
