/* INVICTO OPS v33 · Rendimiento: acciones realmente ejecutadas en la fecha */
async function loadPerformanceV33(force=false){
  if(perf32Loading)return;
  if(!perf32Date)perf32Date=perf32DefaultDate();
  if(!force&&perf32Data?.date===perf32Date&&perf32Data?.metric_semantics==='daily_actions_v33'){paintPerformanceV32();return}
  perf32Loading=true;
  if(!perf32Data)perf32Data=perf32ZeroData(perf32Date);
  paintPerformanceV32();
  try{
    const req=invictoSupabaseV12.rpc('get_unified_advisor_performance_v33',{p_date:perf32Date});
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('La consulta tardó demasiado.')),8000));
    const p=await Promise.race([req,timeout]);
    if(p.error)throw p.error;
    perf32Data=p.data||perf32ZeroData(perf32Date);
  }catch(e){
    console.error('performance v33',e);
    const host=el('view-performance');
    if(host)host.insertAdjacentHTML('afterbegin',`<div class="blocking"><b>No se pudo actualizar Rendimiento.</b><br>${perf32Esc(e?.message||e)} <button class="btn light sm" onclick="refreshPerformanceV32()">Reintentar</button></div>`);
  }finally{
    perf32Loading=false;
    paintPerformanceV32();
  }
}
window.renderPerformanceV32=function(){if(!perf32Date)perf32Date=perf32DefaultDate();loadPerformanceV33(false)};
window.refreshPerformanceV32=function(){perf32Data=null;loadPerformanceV33(true)};
window.changePerformanceV32=function(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return;perf32Date=v;perf32Data=null;loadPerformanceV33(true)};

const renderShellBaseV33=window.renderShell;
window.renderShell=function(){renderShellBaseV33();const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión 33.0')};
console.info('INVICTO OPS v33 · Rendimiento diario exacto activo');
