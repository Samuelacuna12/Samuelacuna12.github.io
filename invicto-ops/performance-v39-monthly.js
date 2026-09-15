/* INVICTO OPS v39 · rendimiento mensual por asesor */
(function(){
  let monthlyData=null,monthlyMonth='',monthlyLoading=false,lastFetch=0;
  const basePaint=window.paintPerformanceV32;
  const baseRefresh=window.refreshPerformanceV32;
  const baseChange=window.changePerformanceV32;

  function monthStart(){const d=perf32Date||perf32DefaultDate();return `${String(d).slice(0,7)}-01`;}
  function esc39(v=''){return typeof perf32Esc==='function'?perf32Esc(v):String(v);}
  function money39(v){return typeof perf32Money==='function'?perf32Money(v):new Intl.NumberFormat('es-CO').format(Number(v||0));}
  function monthLabel(ms){const [y,m]=String(ms).slice(0,7).split('-').map(Number);return new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1))).replace(/^./,c=>c.toUpperCase());}
  function elapsedDays(ms){const now=new Date(),p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),x=Object.fromEntries(p.map(i=>[i.type,i.value]));const ym=`${x.year}-${x.month}`;if(String(ms).slice(0,7)!==ym){const [y,m]=String(ms).slice(0,7).split('-').map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate();}return Number(x.day||1);}
  function activeRows(){return (monthlyData?.advisors||[]).filter(r=>!r.historical_only);}
  function historicalRows(){return (monthlyData?.advisors||[]).filter(r=>r.historical_only);}

  function render39(){
    const host=document.getElementById('perf39Monthly');if(!host)return;
    if(monthlyLoading&&!monthlyData){host.innerHTML='<div class="perf39-loading">Calculando acumulado mensual…</div>';return;}
    if(!monthlyData){host.innerHTML='<div class="perf39-error">No fue posible cargar el rendimiento mensual.</div>';return;}
    const d=monthlyData,rows=activeRows(),hist=historicalRows(),days=Math.max(1,elapsedDays(d.month_start)),max=Math.max(1,...rows.map(r=>Number(r.total_month||0)));
    if(!d.can_view_all){
      const r=rows[0]||{};host.innerHTML=`<div class="perf39-head"><div><div class="eyebrow">RENDIMIENTO MENSUAL · ${esc39(monthLabel(d.month_start).toUpperCase())}</div><h3>Tu acumulado del mes</h3><p>Base histórica + confirmaciones nuevas registradas en INVICTO OPS.</p></div></div><div class="perf39-self"><div class="perf39-self-card"><div><small>Total del mes</small><b>${Number(r.total_month||0)}</b></div><div><small>Base histórica</small><b>${Number(r.opening_sales||0)}</b></div><div><small>Nuevas OPS</small><b class="perf39-new">+${Number(r.ops_confirmed||0)}</b></div></div></div><div class="perf39-note">Promedio acumulado: ${(Number(r.total_month||0)/days).toFixed(1)} ventas por día transcurrido.</div>`;return;
    }
    const team=Number(d.team_total||0),target=Number(d.target||0),pct=Number(d.progress_pct||0);
    host.innerHTML=`<div class="perf39-head"><div><div class="eyebrow">RENDIMIENTO MENSUAL · ${esc39(monthLabel(d.month_start).toUpperCase())}</div><h3>Acumulado por asesor</h3><p>El Excel queda como línea base; OPS suma automáticamente solo confirmaciones nuevas no incluidas en esa base.</p></div><div class="spacer"></div><span class="tag green">ACTUALIZACIÓN AUTOMÁTICA</span></div><div class="perf39-summary"><div class="perf39-kpi"><small>Total mes</small><b>${team.toLocaleString('es-CO')}</b><div class="perf39-progress"><i style="width:${Math.min(100,pct)}%"></i></div></div><div class="perf39-kpi"><small>Base Excel</small><b>${Number(d.opening_total||0).toLocaleString('es-CO')}</b></div><div class="perf39-kpi"><small>Nuevas OPS</small><b class="perf39-new">+${Number(d.ops_confirmed_new||0).toLocaleString('es-CO')}</b></div><div class="perf39-kpi"><small>Meta mensual</small><b>${target.toLocaleString('es-CO')}</b><span>${Number(d.remaining||0).toLocaleString('es-CO')} faltantes · ${pct.toFixed(1)}%</span></div></div><div class="perf39-tablewrap"><table class="perf39-table"><thead><tr><th>#</th><th>Asesor</th><th>Base Excel</th><th>Nuevas OPS</th><th>Total mes</th><th>Promedio/día</th><th>Valor OPS</th><th>Ritmo</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><span class="perf39-rank">${i+1}</span></td><td class="perf39-advisor"><b>${esc39(r.advisor)}</b><small>${Number(r.ops_units||0)} unidades nuevas OPS</small></td><td>${Number(r.opening_sales||0)}</td><td class="perf39-new">+${Number(r.ops_confirmed||0)}</td><td class="perf39-total">${Number(r.total_month||0)}</td><td>${(Number(r.total_month||0)/days).toFixed(1)}</td><td>${money39(r.ops_value||0)}</td><td><div class="perf39-bar"><i style="width:${Math.round(Number(r.total_month||0)/max*100)}%"></i></div></td></tr>`).join('')}</tbody>${hist.length?`<tfoot>${hist.map(r=>`<tr class="perf39-historical"><td>—</td><td class="perf39-advisor"><b>${esc39(r.advisor)}</b><small>Solo base histórica</small></td><td>${Number(r.opening_sales||0)}</td><td>—</td><td class="perf39-total">${Number(r.total_month||0)}</td><td>—</td><td>—</td><td>—</td></tr>`).join('')}</tfoot>`:''}</table></div><div class="perf39-note">Fuente inicial: VENTAS INVICTO 2025 · SEPTIEMBRE 2026. Las ventas recuperadas del sistema anterior que ya estaban en Excel no se vuelven a sumar.</div>`;
  }

  function mount39(){
    const view=document.getElementById('view-performance');if(!view)return;
    let block=document.getElementById('perf39Monthly');
    if(!block){block=document.createElement('section');block.id='perf39Monthly';block.className='perf39-monthly';const cards=view.querySelector('.perf32-cards');if(cards)view.insertBefore(block,cards);else view.appendChild(block);}
    render39();
  }

  async function load39(force=false){
    const ms=monthStart();
    if(monthlyLoading)return;
    if(!force&&monthlyData&&monthlyMonth===ms&&Date.now()-lastFetch<300000){mount39();return;}
    monthlyLoading=true;monthlyMonth=ms;mount39();
    try{
      const {data,error}=await invictoSupabaseV12.rpc('get_monthly_advisor_performance_v39',{p_month:ms});
      if(error)throw error;monthlyData=data;lastFetch=Date.now();
    }catch(e){console.error('monthly performance v39',e);monthlyData=null;}
    finally{monthlyLoading=false;mount39();}
  }

  window.paintPerformanceV32=function(){basePaint();mount39();load39(false);};
  window.refreshPerformanceV32=function(){monthlyData=null;lastFetch=0;baseRefresh();setTimeout(()=>load39(true),80);};
  window.changePerformanceV32=function(v){monthlyData=null;lastFetch=0;baseChange(v);setTimeout(()=>load39(true),80);};
  setInterval(()=>{const v=document.getElementById('view-performance');if(v&&getComputedStyle(v).display!=='none')load39(true);},300000);
  console.info('INVICTO OPS v39 · rendimiento mensual por asesor activo');
})();