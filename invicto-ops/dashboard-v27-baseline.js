/* INVICTO OPS v27 · meta mensual con base acumulada previa al corte */
const OPS_GOAL_CUTOVER_V27 = Date.parse('2026-09-15T05:00:00Z');
const OPS_GOAL_CUTOVER_DATE_V27 = '2026-09-15';

function isGoalNewSaleV27(s){
  if(!s || s.status!=='Confirmada') return false;
  if(s.opsData?.legacy_system===true || s.ops_data?.legacy_system===true) return false;
  const raw=s.receivedAt||s.received_at||s.createdAt||s.created_at;
  if(raw){
    const t=new Date(raw).getTime();
    if(Number.isFinite(t)) return t>=OPS_GOAL_CUTOVER_V27;
  }
  return String(s.commercialDate||s.commercial_date||'')>=OPS_GOAL_CUTOVER_DATE_V27;
}

function workingDaysRangeV27(monthStart,fromDay,toDay){
  const [y,m]=monthStart.split('-').map(Number);let n=0;
  for(let d=fromDay;d<=toDay;d++){
    const wd=new Date(Date.UTC(y,m-1,d)).getUTCDay();
    if(wd!==0)n++;
  }
  return n;
}

window.goalStatsV18=function(){
  const ms=monthStartV18();
  const arr=(state.sales||[]).filter(s=>String(s.commercialDate||'').slice(0,7)===ms.slice(0,7));
  const targetRow=currentTargetV18();
  const baseline=Number(targetRow?.opening_sales_count||0);
  const newConfirmed=arr.filter(isGoalNewSaleV27);
  const newConfirmedCount=newConfirmed.length;
  const confirmed=baseline+newConfirmedCount;
  const target=Number(targetRow?.target_confirmed_sales||0);
  const p=currentBogotaPartsV18();
  const day=Number(p.day);
  const elapsed=workingDaysV18(ms,day);
  const totalDays=workingDaysV18(ms);
  let remainingDays;
  if(ms==='2026-09-01' && day<15){
    remainingDays=workingDaysRangeV27(ms,15,daysInMonthV18(ms));
  }else{
    remainingDays=Math.max(1,totalDays-elapsed+1);
  }
  const remaining=Math.max(0,target-confirmed);
  const required=target?Math.ceil(remaining/Math.max(1,remainingDays)):0;
  const projection=elapsed?Math.round(confirmed/elapsed*totalDays):confirmed;
  const pct=target?Math.min(999,Math.round(confirmed/target*100)):0;
  return {ms,arr,confirmed,target,elapsed,totalDays,remainingDays,remaining,required,projection,pct,baseline,newConfirmedCount,newConfirmed};
};

window.goalPanelV18=function(){
  const g=goalStatsV18();
  if(!g.target)return `<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h3>Meta mensual</h3><div class="muted">Todavía no hay una meta configurada para ${g.ms.slice(0,7)}.</div></div><div class="spacer"></div>${isAdmin()?'<button class="btn cyan sm" onclick="setMonthlyTargetV18()">Configurar meta</button>':''}</div></div>`;
  const breakdown=g.baseline>0?`<div class="muted" style="margin-top:4px">Base sistema anterior: <b>${g.baseline.toLocaleString('es-CO')}</b> · Nuevas INVICTO OPS: <b>${g.newConfirmedCount.toLocaleString('es-CO')}</b></div>`:'';
  return `<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h3>Meta mensual · ${g.target.toLocaleString('es-CO')} confirmadas</h3><div class="muted">${g.confirmed.toLocaleString('es-CO')} ventas contabilizadas · ${g.pct}% de cumplimiento</div>${breakdown}</div><div class="spacer"></div>${isAdmin()?'<button class="btn light sm" onclick="setMonthlyTargetV18()">Editar meta</button>':''}</div><div class="panel-body"><div style="height:12px;background:#e8edf3;border-radius:99px;overflow:hidden"><div style="height:100%;width:${Math.min(100,g.pct)}%;background:#00cfa8"></div></div><div class="mini-grid" style="margin-top:14px"><div class="mini"><small>Faltan</small><b>${g.remaining.toLocaleString('es-CO')}</b><div class="muted">para llegar a la meta</div></div><div class="mini"><small>Necesarias / día</small><b>${g.required.toLocaleString('es-CO')}</b><div class="muted">días hábiles Lun–Sáb restantes</div></div><div class="mini"><small>Proyección</small><b>${g.projection.toLocaleString('es-CO')}</b><div class="muted">al cierre del mes</div></div><div class="mini"><small>Días operativos</small><b>${g.elapsed}/${g.totalDays}</b><div class="muted">transcurridos</div></div></div></div></div>`;
};

if(typeof session!=='undefined' && session){
  try{render();}catch(e){console.warn('v27 goal rerender',e);}
}
console.info('INVICTO OPS v27 · base mensual acumulada activa');
