/* INVICTO OPS v40 · rendimiento mensual solo desde corte 15 Sep 12:00 */
(function(){
  let monthlyData=null,monthlyMonth='',monthlyLoading=false,lastFetch=0;
  const basePaint=window.paintPerformanceV32;
  const baseRefresh=window.refreshPerformanceV32;
  const baseChange=window.changePerformanceV32;
  const CUTOVER_DATE='2026-09-15';

  function monthStart(){const d=window.perf32Date||window.perf32DefaultDate();return `${String(d).slice(0,7)}-01`;}
  function esc40(v=''){return typeof window.perf32Esc==='function'?perf32Esc(v):String(v);}
  function money40(v){return typeof window.perf32Money==='function'?perf32Money(v):new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v||0));}
  function monthLabel(ms){const [y,m]=String(ms).slice(0,7).split('-').map(Number);return new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1))).replace(/^./,c=>c.toUpperCase());}
  function operationDays(ms){
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
    const today=`${p.year}-${p.month}-${p.day}`,ym=String(ms).slice(0,7);
    if(ym!=='2026-09'){
      if(ym===`${p.year}-${p.month}`)return Math.max(1,Number(p.day||1));
      const [y,m]=ym.split('-').map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate();
    }
    if(today<CUTOVER_DATE)return 1;
    return Math.max(1,Math.floor((new Date(`${today}T12:00:00Z`)-new Date(`${CUTOVER_DATE}T12:00:00Z`))/86400000)+1);
  }

  function render40(){
    const host=document.getElementById('perf39Monthly');if(!host)return;
    if(monthlyLoading&&!monthlyData){host.innerHTML='<div class="perf39-loading">Calculando acumulado mensual OPS…</div>';return;}
    if(!monthlyData){host.innerHTML='<div class="perf39-error">No fue posible cargar el rendimiento mensual.</div>';return;}
    const d=monthlyData,rows=d.advisors||[],days=operationDays(d.month_start),max=Math.max(1,...rows.map(r=>Number(r.total_month||0)));
    if(!d.can_view_all){
      const r=rows[0]||{};
      host.innerHTML=`<div class="perf39-head"><div><div class="eyebrow">RENDIMIENTO MENSUAL OPS · ${esc40(monthLabel(d.month_start).toUpperCase())}</div><h3>Tu acumulado desde el nuevo corte</h3><p>Solo cuenta ventas confirmadas en INVICTO OPS desde el 15 de septiembre a las 12:00.</p></div></div><div class="perf39-self"><div class="perf39-self-card"><div><small>Confirmadas OPS</small><b>${Number(r.total_month||0)}</b></div><div><small>Unidades</small><b>${Number(r.ops_units||0)}</b></div><div><small>Valor confirmado</small><b class="perf39-new">${money40(r.ops_value||0)}</b></div></div></div><div class="perf39-note">Promedio desde el corte: ${(Number(r.total_month||0)/days).toFixed(1)} ventas confirmadas por día de operación.</div>`;
      return;
    }
    const team=Number(d.team_total||0),target=Number(d.target||0),pct=Number(d.progress_pct||0);
    host.innerHTML=`<div class="perf39-head"><div><div class="eyebrow">RENDIMIENTO MENSUAL OPS · ${esc40(monthLabel(d.month_start).toUpperCase())}</div><h3>Acumulado por asesor</h3><p>Conteo limpio desde el 15 de septiembre a las 12:00. Todo lo anterior queda fuera de esta medición.</p></div><div class="spacer"></div><span class="tag green">ACTUALIZACIÓN AUTOMÁTICA</span></div><div class="perf39-summary"><div class="perf39-kpi"><small>Confirmadas OPS</small><b>${team.toLocaleString('es-CO')}</b><div class="perf39-progress"><i style="width:${Math.min(100,pct)}%"></i></div></div><div class="perf39-kpi"><small>Inicio del conteo</small><b>0</b><span>15 Sep · 12:00</span></div><div class="perf39-kpi"><small>Meta mensual</small><b>${target.toLocaleString('es-CO')}</b></div><div class="perf39-kpi"><small>Faltantes</small><b>${Number(d.remaining||0).toLocaleString('es-CO')}</b><span>${pct.toFixed(1)}% de avance OPS</span></div></div><div class="perf39-tablewrap"><table class="perf39-table"><thead><tr><th>#</th><th>Asesor</th><th>Confirmadas OPS</th><th>Unidades</th><th>Valor OPS</th><th>Promedio/día</th><th>Ritmo</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><span class="perf39-rank">${i+1}</span></td><td class="perf39-advisor"><b>${esc40(r.advisor)}</b><small>Desde 15 Sep · 12:00</small></td><td class="perf39-total">${Number(r.total_month||0)}</td><td>${Number(r.ops_units||0)}</td><td>${money40(r.ops_value||0)}</td><td>${(Number(r.total_month||0)/days).toFixed(1)}</td><td><div class="perf39-bar"><i style="width:${Math.round(Number(r.total_month||0)/max*100)}%"></i></div></td></tr>`).join('')}</tbody></table></div><div class="perf39-note">El histórico anterior permanece disponible en Ventas por mes, pero no suma a Rendimiento OPS.</div>`;
  }

  function mount(){
    const view=document.getElementById('view-performance');if(!view)return;
    let block=document.getElementById('perf39Monthly');
    if(!block){block=document.createElement('section');block.id='perf39Monthly';block.className='perf39-monthly';const cards=view.querySelector('.perf32-cards');if(cards)view.insertBefore(block,cards);else view.appendChild(block);}
    render40();
  }
  async function load(force=false){
    const ms=monthStart();if(monthlyLoading)return;
    if(!force&&monthlyData&&monthlyMonth===ms&&Date.now()-lastFetch<300000){mount();return;}
    monthlyLoading=true;monthlyMonth=ms;mount();
    try{const {data,error}=await invictoSupabaseV12.rpc('get_monthly_advisor_performance_v39',{p_month:ms});if(error)throw error;monthlyData=data;lastFetch=Date.now();}
    catch(e){console.error('monthly performance v40',e);monthlyData=null;}
    finally{monthlyLoading=false;mount();}
  }

  window.paintPerformanceV32=function(){basePaint();mount();load(false);};
  window.refreshPerformanceV32=function(){monthlyData=null;lastFetch=0;baseRefresh();setTimeout(()=>load(true),80);};
  window.changePerformanceV32=function(v){monthlyData=null;lastFetch=0;baseChange(v);setTimeout(()=>load(true),80);};
  setInterval(()=>{const v=document.getElementById('view-performance');if(v&&getComputedStyle(v).display!=='none')load(true);},300000);
  console.info('INVICTO OPS v40 · rendimiento mensual desde cero al corte de las 12:00');
})();