/* INVICTO OPS v43 · meta mensual consolidada sin duplicar Shopify vs documento Invicto */
(function(){
  let goal43=null;
  let loading43=false;
  let last43=0;

  const baseGoalStats43=window.goalStatsV18;
  const baseGoalPanel43=window.goalPanelV18;
  const baseRenderHome43=window.renderHome;
  const baseRenderReports43=window.renderReports;

  function month43(){
    try{return typeof monthStartV18==='function'?monthStartV18():new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit'}).format(new Date())+'-01';}
    catch(e){return '2026-09-01';}
  }
  function n43(v){return Number(v||0);}
  function fmt43(v){return n43(v).toLocaleString('es-CO');}

  function calc43(){
    const ms=month43();
    const p=typeof currentBogotaPartsV18==='function'?currentBogotaPartsV18():{day:'1'};
    const day=Number(p.day||1);
    const elapsed=typeof workingDaysV18==='function'?workingDaysV18(ms,day):1;
    const totalDays=typeof workingDaysV18==='function'?workingDaysV18(ms):1;
    const remainingDays=Math.max(1,totalDays-elapsed+1);
    const target=n43(goal43?.target||currentTargetV18?.()?.target_confirmed_sales||0);
    const confirmed=n43(goal43?.total_unique||0);
    const remaining=Math.max(0,target-confirmed);
    const required=target?Math.ceil(remaining/remainingDays):0;
    const projection=elapsed?Math.round(confirmed/elapsed*totalDays):confirmed;
    const pct=target?Math.round((confirmed/target)*1000)/10:0;
    return {ms,target,confirmed,remaining,required,projection,pct,elapsed,totalDays,remainingDays,
      shopify:n43(goal43?.shopify_orders),
      document:n43(goal43?.document_sales),
      overlap:n43(goal43?.document_shopify_overlap),
      documentUnique:n43(goal43?.document_unique_additional),
      snapshot:goal43?.document_snapshot_at||null};
  }

  window.goalStatsV18=function(){
    if(!goal43)return baseGoalStats43?baseGoalStats43():{};
    return calc43();
  };

  function sourceCards43(g){
    return `<div class="mini-grid" style="margin-top:14px">
      <div class="mini"><small>Shopify</small><b>${fmt43(g.shopify)}</b><div class="muted">pedidos reales del mes</div></div>
      <div class="mini"><small>Documento Invicto</small><b>${fmt43(g.document)}</b><div class="muted">ventas registradas en el documento</div></div>
      <div class="mini"><small>Coinciden en ambas fuentes</small><b>${fmt43(g.overlap)}</b><div class="muted">no se cuentan dos veces</div></div>
      <div class="mini"><small>Adicionales del documento</small><b>${fmt43(g.documentUnique)}</b><div class="muted">WhatsApp, recuperación, bot, web y otros</div></div>
    </div>`;
  }

  window.goalPanelV18=function(){
    ensure43(false);
    if(loading43&&!goal43){
      return `<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h3>Meta mensual</h3><div class="muted">Conciliando Shopify + documento de ventas INVICTO…</div></div><span class="tag blue">ACTUALIZANDO</span></div></div>`;
    }
    if(!goal43){
      return baseGoalPanel43?baseGoalPanel43():'';
    }
    const g=calc43();
    if(!g.target)return `<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h3>Meta mensual</h3><div class="muted">Todavía no hay una meta configurada para ${g.ms.slice(0,7)}.</div></div><div class="spacer"></div>${isAdmin()?'<button class="btn cyan sm" onclick="setMonthlyTargetV18()">Configurar meta</button>':''}</div></div>`;
    return `<div class="panel" style="margin-bottom:14px">
      <div class="panel-head"><div><h3>Meta mensual · ${fmt43(g.target)} ventas</h3><div class="muted"><b>${fmt43(g.confirmed)}</b> ventas únicas contabilizadas · <b>${g.pct.toFixed(1)}%</b> de cumplimiento</div><div class="muted" style="margin-top:4px">Shopify y Documento Invicto se muestran separados y las coincidencias se descuentan automáticamente.</div></div><div class="spacer"></div>${isAdmin()?'<button class="btn light sm" onclick="setMonthlyTargetV18()">Editar meta</button>':''}</div>
      <div class="panel-body">
        <div style="height:12px;background:#e8edf3;border-radius:99px;overflow:hidden"><div style="height:100%;width:${Math.min(100,g.pct)}%;background:#00cfa8"></div></div>
        ${sourceCards43(g)}
        <div class="mini-grid" style="margin-top:14px">
          <div class="mini"><small>Total real sin duplicados</small><b>${fmt43(g.confirmed)}</b><div class="muted">Shopify + ventas adicionales del documento</div></div>
          <div class="mini"><small>Faltan</small><b>${fmt43(g.remaining)}</b><div class="muted">para llegar a la meta</div></div>
          <div class="mini"><small>Necesarias / día</small><b>${fmt43(g.required)}</b><div class="muted">días hábiles Lun–Sáb restantes</div></div>
          <div class="mini"><small>Proyección</small><b>${fmt43(g.projection)}</b><div class="muted">al cierre del mes</div></div>
          <div class="mini"><small>Días operativos</small><b>${g.elapsed}/${g.totalDays}</b><div class="muted">transcurridos</div></div>
        </div>
      </div>
    </div>`;
  };

  async function ensure43(force=false){
    if(loading43||typeof invictoSupabaseV12==='undefined')return;
    const ms=month43();
    if(!force&&goal43&&goal43.month_start===ms&&Date.now()-last43<120000)return;
    loading43=true;
    try{
      const {data,error}=await invictoSupabaseV12.rpc('get_monthly_goal_v43',{p_month:ms});
      if(error)throw error;
      goal43=data||null;
      last43=Date.now();
    }catch(e){
      console.error('monthly goal v43',e);
    }finally{
      loading43=false;
      try{
        if(document.getElementById('view-home')?.classList.contains('active'))baseRenderHome43();
        if(document.getElementById('view-reports')?.classList.contains('active'))baseRenderReports43();
      }catch(e){console.warn('monthly goal v43 repaint',e);}
    }
  }

  window.refreshMonthlyGoalV43=function(){goal43=null;last43=0;ensure43(true);};

  window.renderHome=function(){baseRenderHome43();ensure43(false);};
  window.renderReports=function(){baseRenderReports43();ensure43(false);};

  setTimeout(()=>ensure43(true),1200);
  setInterval(()=>ensure43(true),120000);
  console.info('INVICTO OPS v43 · meta mensual Shopify + Documento Invicto sin duplicados');
})();
