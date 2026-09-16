/* INVICTO OPS v52 · meta mensual conciliada Drive + OPS + Shopify */
(function(){
  let d=null,loading=false,last=0;
  const baseHome=window.renderHome,baseReports=window.renderReports,basePanel=window.goalPanelV18;
  function month(){return typeof monthStartV18==='function'?monthStartV18():'2026-09-01';}
  function n(v){return Number(v||0)}
  function f(v){return n(v).toLocaleString('es-CO')}
  function stats(){
    const ms=month(),p=currentBogotaPartsV18(),day=Number(p.day||1),elapsed=workingDaysV18(ms,day),totalDays=workingDaysV18(ms),remainingDays=Math.max(1,totalDays-elapsed+1);
    const target=n(d?.target||currentTargetV18()?.target_confirmed_sales),counted=n(d?.document_sales),remaining=Math.max(0,target-counted),required=target?Math.ceil(remaining/remainingDays):0,projection=elapsed?Math.round(counted/elapsed*totalDays):counted,pct=target?Math.round(counted/target*1000)/10:0;
    return {ms,target,counted,remaining,required,projection,pct,elapsed,totalDays,shopify:n(d?.shopify_orders),drive:n(d?.drive_rows),extra:n(d?.system_confirmed_not_yet_in_drive),document:n(d?.document_sales)};
  }
  window.goalStatsV18=function(){if(!d)return {};const g=stats();return {...g,confirmed:g.counted};};
  window.goalPanelV18=function(){
    load(false);
    if(!d)return loading?'<div class="panel" style="margin-bottom:14px"><div class="panel-head"><h3>Meta mensual</h3><span class="tag blue">ACTUALIZANDO</span></div></div>':(basePanel?basePanel():'');
    const g=stats();
    return `<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h3>Meta mensual · ${f(g.target)} ventas</h3><div class="muted"><b>${f(g.counted)}</b> ventas únicas conciliadas · <b>${g.pct.toFixed(1)}%</b> de cumplimiento</div><div class="muted" style="margin-top:4px">Conteo en vivo: Drive + INVICTO OPS + Shopify. Una venta se cuenta una sola vez.</div></div><div class="spacer"></div>${isAdmin()?'<button class="btn light sm" onclick="setMonthlyTargetV18()">Editar meta</button>':''}</div><div class="panel-body"><div style="height:12px;background:#e8edf3;border-radius:99px;overflow:hidden"><div style="height:100%;width:${Math.min(100,g.pct)}%;background:#1565ff"></div></div><div class="mini-grid" style="margin-top:14px"><div class="mini"><small>Ventas únicas</small><b>${f(g.counted)}</b><div class="muted">conteo oficial conciliado</div></div><div class="mini"><small>Drive</small><b>${f(g.drive)}</b><div class="muted">filas de ventas sincronizadas</div></div><div class="mini"><small>OPS aún no en Drive</small><b>${f(g.extra)}</b><div class="muted">confirmadas adicionales sin duplicar</div></div><div class="mini"><small>Shopify</small><b>${f(g.shopify)}</b><div class="muted">pedidos del mes · ya conciliados</div></div><div class="mini"><small>Faltan</small><b>${f(g.remaining)}</b><div class="muted">para llegar a la meta</div></div><div class="mini"><small>Necesarias / día</small><b>${f(g.required)}</b><div class="muted">días hábiles Lun–Sáb restantes</div></div><div class="mini"><small>Proyección</small><b>${f(g.projection)}</b><div class="muted">al cierre del mes</div></div><div class="mini"><small>Días operativos</small><b>${g.elapsed}/${g.totalDays}</b><div class="muted">transcurridos</div></div></div></div></div>`;
  };
  async function load(force){
    if(loading||typeof invictoSupabaseV12==='undefined')return;
    if(!force&&d&&Date.now()-last<60000)return;
    loading=true;
    try{const r=await invictoSupabaseV12.rpc('get_monthly_goal_v43',{p_month:month()});if(r.error)throw r.error;d=r.data;last=Date.now();}
    catch(e){console.error('monthly goal v52',e)}
    finally{
      loading=false;
      try{
        if(document.getElementById('view-home')?.classList.contains('active')&&typeof window.renderHome==='function')window.renderHome();
        if(document.getElementById('view-reports')?.classList.contains('active')&&typeof window.renderReports==='function')window.renderReports();
      }catch(e){console.warn('monthly goal repaint',e)}
    }
  }
  window.renderHome=function(){baseHome();load(false)};
  window.renderReports=function(){baseReports();load(false)};
  window.refreshMonthlyGoalV44=function(){d=null;last=0;load(true)};
  setTimeout(()=>load(true),300);
  setInterval(()=>load(true),60000);
})();
