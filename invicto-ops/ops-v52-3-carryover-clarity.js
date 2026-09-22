/* INVICTO OPS v60 · arrastre visible sin banners explicativos */
(function(){
  function clarifyPerformance(){
    const host=document.getElementById('view-performance');
    if(!host)return;
    host.querySelectorAll('th,small').forEach(el=>{
      if((el.textContent||'').trim().toLowerCase()==='sin tocar')el.textContent='Sin gestión hoy';
    });
    host.querySelectorAll('.perf32-card span').forEach(el=>{
      const t=(el.textContent||'');
      if(/sin tocar/i.test(t))el.textContent=t.replace(/sin tocar/ig,'sin gestión hoy');
    });

  }

  const basePaint=window.paintPerformanceV32;
  if(typeof basePaint==='function'&&!basePaint.__v523){
    const wrapped=function(){const r=basePaint.apply(this,arguments);setTimeout(clarifyPerformance,0);return r};
    wrapped.__v523=true;
    window.paintPerformanceV32=wrapped;
  }

  const baseAdvisor=window.openPerf32Advisor;
  if(typeof baseAdvisor==='function'&&!baseAdvisor.__v523){
    const wrapped=function(){const r=baseAdvisor.apply(this,arguments);setTimeout(clarifyPerformance,0);return r};
    wrapped.__v523=true;
    window.openPerf32Advisor=wrapped;
  }

  setTimeout(()=>{
    clarifyPerformance();
    if(typeof loadCanonicalV51==='function')loadCanonicalV51(true);
  },300);
  setTimeout(clarifyPerformance,1500);
  console.info('INVICTO OPS v60 · arrastre visible sin banners redundantes');
})();
