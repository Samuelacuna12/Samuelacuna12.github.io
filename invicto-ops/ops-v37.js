/* INVICTO OPS v37 · corte 14 Sep 18:00 · SLA partido · brief de turno · mensual operativo */
const OPS_V37_CUTOVER_MS = Date.parse('2026-09-14T23:00:00Z');
const OPS_V37_CUTOVER_DATE = '2026-09-14';
const OPS_V37_ACTIVE_DB = ['nueva','asignada','en_gestion','no_contesta','seguimiento_programado','pendiente_stock'];

function opsV37BogotaParts(d=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(d);
  return Object.fromEntries(parts.map(x=>[x.type,x.value]));
}
function opsV37BogotaDate(d=new Date()){
  const p=opsV37BogotaParts(d);return `${p.year}-${p.month}-${p.day}`;
}
function opsV37IsNewSale(s){
  if(!s)return false;
  if(s.opsData?.legacy_system===true||s.ops_data?.legacy_system===true)return false;
  const raw=s.receivedAt||s.received_at||s.createdAt||s.created_at;
  if(raw){const t=new Date(raw).getTime();if(Number.isFinite(t))return t>=OPS_V37_CUTOVER_MS;}
  return String(s.commercialDate||s.commercial_date||'')>OPS_V37_CUTOVER_DATE;
}
function opsV37IsLegacyMonthly(r){
  if(!r||r.record_origin==='historical_shopify')return false;
  const raw=r.received_at||r.created_at;
  if(raw){const t=new Date(raw).getTime();if(Number.isFinite(t))return t<OPS_V37_CUTOVER_MS;}
  return String(r.commercial_date||'')<OPS_V37_CUTOVER_DATE;
}

/* El SLA corre Lun–Sáb 08:00–12:00 y 14:00–18:00. Fuera de esas ventanas, reloj pausado. */
window.businessMinutesV21=function(start,end=new Date()){
  const a=new Date(start),b=new Date(end);if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<=a)return 0;
  const first=opsV37BogotaDate(a),last=opsV37BogotaDate(b);let cursor=new Date(first+'T12:00:00Z'),total=0,guard=0;
  while(guard++<400){
    const ymd=cursor.toISOString().slice(0,10),dow=cursor.getUTCDay();
    if(dow!==0){
      for(const [ss,ee] of [['08:00','12:00'],['14:00','18:00']]){
        const ds=new Date(`${ymd}T${ss}:00-05:00`),de=new Date(`${ymd}T${ee}:00-05:00`),lo=Math.max(a.getTime(),ds.getTime()),hi=Math.min(b.getTime(),de.getTime());
        if(hi>lo)total+=(hi-lo)/60000;
      }
    }
    if(ymd>=last)break;cursor=new Date(cursor.getTime()+86400000);
  }
  return Math.max(0,Math.round(total));
};

/* Corte operativo desde hoy 14 Sep 18:00. Las ventas siguen asignándose fuera de horario. */
window.todaySales=function(){
  const d=typeof todayBogotaV13==='function'?todayBogotaV13():opsV37BogotaDate();
  return (state.sales||[]).filter(s=>opsV37IsNewSale(s)&&String(s.commercialDate||s.commercial_date||'')===d);
};
window.advisorSales=function(){
  const rows=(state.sales||[]).filter(opsV37IsNewSale);
  return isAdvisor()?rows.filter(s=>s.advisor===session.name||s.advisorId===session.id):rows;
};
window.getPendingCounts=function(){
  const mine=s=>!isAdvisor()||s.advisor===session.name||s.advisorId===session.id;
  const sales=(state.sales||[]).filter(opsV37IsNewSale);
  return {
    sales:sales.filter(s=>String(s.commercialDate||s.commercial_date||'')===opsV37BogotaDate()&&mine(s)&&['Nueva','No contesta','Seguimiento futuro','Pendiente stock'].includes(s.status)).length,
    recovery:sales.filter(s=>mine(s)&&['No contesta','Seguimiento futuro','Pendiente stock','No recuperado – sin contacto'].includes(s.status)).length,
    guarantees:(state.guarantees||[]).filter(g=>mine(g)&&g.status!=='Cerrada').length,
    novelties:(state.novelties||[]).filter(n=>mine(n)&&n.status!=='Cerrada').length,
    stock:Object.values(state.inventorySources||{}).filter(x=>!x).length
  };
};
if(typeof window.isLegacyMonthlyV26==='function')window.isLegacyMonthlyV26=opsV37IsLegacyMonthly;
if(typeof window.perf32DefaultDate==='function')window.perf32DefaultDate=()=>opsV37BogotaDate();

/* Ajustes de texto del tablero de rendimiento sin tocar sus cálculos. */
if(typeof window.paintPerformanceV32==='function'){
  const opsV37PaintPerfBase=window.paintPerformanceV32;
  window.paintPerformanceV32=function(){
    opsV37PaintPerfBase();
    const host=document.getElementById('view-performance');if(!host)return;
    const e=host.querySelector('.eyebrow');if(e)e.textContent='MEDICIÓN OPERATIVA · DESDE 14 SEP 2026 · 18:00';
    const b=host.querySelector('.perf32-banner');
    const d=String(perf32Data?.date||perf32Date||'');
    if(b&&d===OPS_V37_CUTOVER_DATE){b.className='perf32-banner';b.innerHTML='<b>Nueva operación activa.</b> Esta fecha cuenta únicamente ventas recibidas desde las 6:00 p. m. Colombia.';}
  };
}

function opsV37LocalInput(iso){
  if(!iso)return '';
  const d=new Date(iso);if(Number.isNaN(d.getTime()))return '';
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
  const m=Object.fromEntries(p.map(x=>[x.type,x.value]));return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
}
function opsV37DateLabel(ymd){
  const [y,m,d]=String(ymd).split('-').map(Number);if(!y)return ymd;
  return new Intl.DateTimeFormat('es-CO',{weekday:'short',day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));
}
function opsV37IsActiveMonthly(r){return !isHistoricalV23(r)&&!opsV37IsLegacyMonthly(r)&&OPS_V37_ACTIVE_DB.includes(r.status)}
function opsV37CarrierOptions(current=''){
  const arr=[...new Set([current,...(typeof TRANSPORTS!=='undefined'?TRANSPORTS:[]),'Interrapidísimo','Servientrega','Envia','Coordinadora'].filter(Boolean))];
  return `<option value="">Transportadora</option>${arr.map(x=>`<option ${x===current?'selected':''}>${esc(x)}</option>`).join('')}`;
}
function opsV37LogisticsOptions(current='pendiente'){
  const arr=['pendiente','lista_despacho','guia_generada','en_transito','reclama_oficina','entregada','novedad','devuelta','cancelada'];
  return arr.map(x=>`<option value="${x}" ${x===current?'selected':''}>${esc(shipmentLabelV23(x))}</option>`).join('');
}

/* Ventas por mes: tabla diaria clara. */
function opsV37DailyBreakdown(rows){
  const by={};
  for(const r of rows){
    const k=String(r.commercial_date||'');if(!k)continue;
    const x=by[k]||(by[k]={sales:0,ops:0,historical:0,confirmed:0,pending:0,guides:0,followups:0,value:0});
    x.sales++;x.value+=Number(r.total_price||0);
    if(isHistoricalV23(r)||opsV37IsLegacyMonthly(r))x.historical++;else{x.ops++;if(r.status==='confirmada')x.confirmed++;if(OPS_V37_ACTIVE_DB.includes(r.status))x.pending++;if(r.tracking_number)x.guides++;if(r.next_followup_at)x.followups++;}
  }
  const items=Object.entries(by).sort((a,b)=>b[0].localeCompare(a[0]));
  return `<div id="monthlyDailyBreakdownV37" class="panel monthly-daily-v37"><div class="panel-head"><div><h3>Ventas por día · detalle claro</h3><div class="muted">Cada fecha del mes con ventas, operación nueva, guías y seguimientos.</div></div><div class="spacer"></div><span class="tag blue">${items.length} DÍAS CON VENTAS</span></div><div class="table-wrap"><table><thead><tr><th>Día</th><th>Ventas</th><th>OPS</th><th>Histórico</th><th>Confirmadas</th><th>Pendientes</th><th>Con guía</th><th>Seguimientos</th><th>Valor</th></tr></thead><tbody>${items.map(([d,x])=>`<tr><td><b>${esc(opsV37DateLabel(d))}</b><div class="muted">${esc(d)}</div></td><td><b>${x.sales}</b></td><td>${x.ops}</td><td>${x.historical}</td><td><span class="tag green">${x.confirmed}</span></td><td>${x.pending}</td><td>${x.guides}</td><td>${x.followups}</td><td><b>${money(x.value)}</b></td></tr>`).join('')||'<tr><td colspan="9" class="muted">Sin ventas.</td></tr>'}</tbody></table></div></div>`;
}

/* Ventas por mes: edición directa de guía y seguimiento. */
window.renderMonthlyTableV23=function(){
  const body=el('monthlySalesBodyV23'),count=el('monthlyCountV23'),pager=el('monthlyPagerV23');if(!body)return;
  const rows=filteredMonthlyRowsV23(),pages=Math.max(1,Math.ceil(rows.length/monthlyPageSizeV23));monthlyPageV23=Math.min(monthlyPageV23,pages);const from=(monthlyPageV23-1)*monthlyPageSizeV23,part=rows.slice(from,from+monthlyPageSizeV23);
  if(count)count.textContent=`${rows.length.toLocaleString('es-CO')} ventas visibles`;
  body.innerHTML=part.map(r=>{
    const code=rowCodeV23(r),dt=new Date(r.received_at||r.created_at),historical=isHistoricalV23(r),legacy=opsV37IsLegacyMonthly(r),type=historical?'<span class="tag gray">HISTÓRICO</span>':isDraftV23(r)?'<span class="tag amber">BORRADOR</span>':r.source==='Shopify'?'<span class="tag blue">PEDIDO</span>':'<span class="tag gray">MANUAL</span>',mapping=(historical||legacy)?'<span class="tag gray">PRE-OPS</span>':r.mapping_status==='pending'?'<span class="tag amber">PENDIENTE</span>':'<span class="tag green">LISTO</span>';
    const guide=(historical||legacy)?'<span class="muted">Sistema anterior</span>':r.status==='confirmada'?`<div class="month-guide-v37"><input id="mGuide-${r.id}" class="search" value="${esc(r.tracking_number||'')}" placeholder="Guía"><select id="mCarrier-${r.id}" class="search">${opsV37CarrierOptions(r.carrier||'')}</select><select id="mLogStatus-${r.id}" class="search">${opsV37LogisticsOptions(r.shipment_status||'pendiente')}</select><button class="btn navy sm" onclick="saveMonthlyGuideV37('${r.id}')">Guardar</button></div>`:'<span class="muted">Se habilita al confirmar</span>';
    const follow=(historical||legacy)?'<span class="muted">Sistema anterior</span>':opsV37IsActiveMonthly(r)?`<div class="month-follow-v37">${r.next_followup_at?`<div class="tag ${new Date(r.next_followup_at)<=new Date()?'red':'blue'}">${new Date(r.next_followup_at).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>`:''}<input id="mFollow-${r.id}" type="datetime-local" class="search" value="${opsV37LocalInput(r.next_followup_at)}"><select id="mFollowReason-${r.id}" class="search"><option>Llamar más tarde</option><option>Espera salario / dinero</option><option>Cliente pidió otra fecha</option><option>Validar stock</option><option>Otro seguimiento</option></select><button class="btn cyan sm" onclick="saveMonthlyFollowupV37('${r.id}')">Programar</button></div>`:'<span class="muted">Sin seguimiento pendiente</span>';
    return `<tr><td><b>${esc(code)}</b><div class="muted">${esc(r.commercial_date||'')}</div></td><td>${Number.isNaN(dt.getTime())?'—':dt.toLocaleTimeString('es-CO',{timeZone:'America/Bogota',hour:'2-digit',minute:'2-digit'})}</td><td><b>${esc(r.customer_name||'Sin nombre')}</b><div class="muted mono">${esc(r.customer_phone||'')}</div></td><td>${esc(r.customer_city||'—')}<div class="muted">${esc(r.customer_department||'')}</div></td><td>${historical||legacy?'Pre-OPS':esc(r.advisor_name||'Sin asignar')}</td><td>${type}</td><td>${reportStatusTagV23(r)}</td><td><b>${Number(r.quantity||0)}</b></td><td><b>${money(r.total_price)}</b></td><td>${mapping}</td><td>${guide}</td><td>${follow}</td><td><button class="btn light sm" onclick="openMonthlySaleV23('${r.id}')">Ver venta</button></td></tr>`;
  }).join('')||'<tr><td colspan="13" class="muted">No hay ventas con esos filtros.</td></tr>';
  if(pager)pager.innerHTML=`<button class="btn light sm" ${monthlyPageV23<=1?'disabled':''} onclick="monthlyPageV23--;renderMonthlyTableV23()">← Anterior</button><span>Página <b>${monthlyPageV23}</b> de <b>${pages}</b></span><button class="btn light sm" ${monthlyPageV23>=pages?'disabled':''} onclick="monthlyPageV23++;renderMonthlyTableV23()">Siguiente →</button>`;
};

window.saveMonthlyGuideV37=async function(id){
  const guide=el('mGuide-'+id)?.value?.trim()||'',carrier=el('mCarrier-'+id)?.value||'',status=el('mLogStatus-'+id)?.value||'pendiente';
  if(['guia_generada','en_transito','reclama_oficina','entregada'].includes(status)&&!guide)return toast('Escribe el número de guía');
  try{toast('Guardando guía…');const {data,error}=await invictoSupabaseV12.rpc('save_ops_day_by_day_logistics',{p_sale_id:id,p_tracking_number:guide,p_carrier:carrier,p_status:status});if(error)throw error;if(!data?.ok)throw new Error('No se pudo guardar');monthlyRowsV23=[];monthlyPrevRowsV23=[];await loadMonthlyV23(true);toast('Guía actualizada');}catch(e){console.error(e);toast('No se guardó: '+(e?.message||e));}
};
window.saveMonthlyFollowupV37=async function(id){
  const raw=el('mFollow-'+id)?.value||'',reason=el('mFollowReason-'+id)?.value||'Seguimiento';if(!raw)return toast('Selecciona fecha y hora');
  const d=new Date(raw+':00-05:00');if(Number.isNaN(d.getTime())||d<=new Date())return toast('Selecciona una fecha futura');
  try{toast('Programando seguimiento…');const {error}=await invictoSupabaseV12.rpc('schedule_ops_followup',{p_sale_id:id,p_followup_at:d.toISOString(),p_reason:reason});if(error)throw error;monthlyRowsV23=[];monthlyPrevRowsV23=[];await loadMonthlyV23(true);toast('Seguimiento programado');}catch(e){console.error(e);toast('No se programó: '+(e?.message||e));}
};

if(typeof window.renderMonthlySalesV23==='function'){
  const opsV37MonthlyBase=window.renderMonthlySalesV23;
  window.renderMonthlySalesV23=function(skipLoad=false){
    opsV37MonthlyBase(skipLoad);
    const host=el('view-monthly-sales');if(!host||!monthlyRowsV23?.length)return;
    const title=host.querySelector('.page-title p');if(title)title.textContent='Cada venta del mes, separada por día, con guía, logística y seguimiento operativo.';
    const grid=host.querySelector('.month-grid-v23');if(grid&&!el('monthlyDailyBreakdownV37'))grid.insertAdjacentHTML('afterend',opsV37DailyBreakdown(monthlyRowsV23));
    const table=host.querySelector('.monthly-table-v23');if(table){const head=table.querySelector('thead tr');if(head)head.innerHTML='<th>Pedido / fecha</th><th>Hora</th><th>Cliente</th><th>Ciudad</th><th>Asesor</th><th>Tipo</th><th>Estado</th><th>Uds.</th><th>Valor</th><th>Surtido</th><th>Guía / logística</th><th>Seguimiento</th><th></th>';renderMonthlyTableV23();}
  };
}

/* Brief de apertura de turno. */
function opsV37BriefKey(date){return `invicto_ops_shift_brief_v37_${session?.id||session?.name||'user'}_${date}`;}
function opsV37ShouldShowBrief(){
  if(!session||typeof invictoSupabaseV12==='undefined')return false;
  const p=opsV37BogotaParts(),date=`${p.year}-${p.month}-${p.day}`,hour=Number(p.hour||0);
  const dow=new Date(`${date}T12:00:00-05:00`).getUTCDay();
  if(dow===0||date<'2026-09-15'||hour<8||hour>=18)return false;
  try{return localStorage.getItem(opsV37BriefKey(date))!=='shown';}catch(e){return true;}
}
function opsV37TaskLabel(r){
  if(r.followup_overdue)return 'ATENDER AHORA · seguimiento vencido';
  if(r.next_followup_at)return `Seguimiento ${new Date(r.next_followup_at).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}`;
  return ({nueva:'Contactar cliente',asignada:'Primer contacto',en_gestion:'Continuar gestión',no_contesta:'Reintentar contacto',seguimiento_programado:'Cumplir seguimiento',pendiente_stock:'Validar stock'})[r.status]||'Revisar venta';
}
async function opsV37ShowOpeningBrief(){
  if(!opsV37ShouldShowBrief()||document.getElementById('opsShiftBriefV37'))return;
  const date=opsV37BogotaDate();
  try{
    const [perf,follow]=await Promise.all([
      invictoSupabaseV12.rpc('get_unified_advisor_performance_v33',{p_date:date}),
      invictoSupabaseV12.rpc('get_ops_followup_board',{p_date:date})
    ]);
    if(perf.error)throw perf.error;if(follow.error)throw follow.error;
    const d=perf.data||{},s=d.summary||{},advisors=d.advisors||[],tasks=(follow.data?.sales||[]).filter(x=>OPS_V37_ACTIVE_DB.includes(x.status));
    const team=d.can_view_all?`<div class="shift-team-v37"><div class="shift-section-title-v37">Carga por asesor</div>${advisors.map(a=>`<div class="shift-advisor-v37"><div><b>${esc(a.advisor)}</b><small>${Number(a.assigned||0)} nuevas · ${Number(a.carryover||0)} arrastre</small></div><div><strong>${Number(a.workload||0)}</strong><span>carga</span></div><div><strong>${Number(a.pending||0)}</strong><span>pend.</span></div><div><strong>${Number(a.followups||0)}</strong><span>seg.</span></div><div class="${Number(a.overdue||0)?'danger':''}"><strong>${Number(a.overdue||0)}</strong><span>venc.</span></div></div>`).join('')||'<div class="muted">Sin carga asignada.</div>'}</div>`:'';
    const list=tasks.slice(0,14).map(r=>`<div class="shift-task-v37"><div><b>${esc(r.order||'—')}</b><small>${esc(r.customer_name||'')} · ${esc(r.advisor||'')}</small></div><span class="${r.followup_overdue?'urgent':''}">${esc(opsV37TaskLabel(r))}</span></div>`).join('')||'<div class="shift-empty-v37">No hay tareas pendientes al iniciar el turno.</div>';
    const wrap=document.createElement('div');wrap.id='opsShiftBriefV37';wrap.innerHTML=`<div class="shift-back-v37"></div><section class="shift-modal-v37"><div class="shift-head-v37"><div><div class="eyebrow">APERTURA DE TURNO · 08:00</div><h2>${d.can_view_all?'Panorama operativo del equipo':'Tus tareas para iniciar'}</h2><p>El SLA corre 08:00–12:00 y 14:00–18:00. Las ventas recibidas fuera de horario ya quedaron asignadas y entran como arrastre.</p></div><button class="close" onclick="closeShiftBriefV37()">×</button></div><div class="shift-kpis-v37"><div><small>Carga inicial</small><b>${Number(s.workload||0)}</b></div><div><small>Nuevas hoy</small><b>${Number(s.assigned||0)}</b></div><div><small>Arrastre</small><b>${Number(s.carryover||0)}</b></div><div><small>Pendientes</small><b>${Number(s.pending||0)}</b></div><div><small>Seguimientos</small><b>${Number(s.followups||0)}</b></div><div class="${Number(s.overdue||0)?'danger':''}"><small>Vencidos</small><b>${Number(s.overdue||0)}</b></div><div><small>Amarillas</small><b>${Number(s.yellow||0)}</b></div><div class="${Number(s.red||0)?'danger':''}"><small>Rojas</small><b>${Number(s.red||0)}</b></div></div>${team}<div class="shift-tasks-v37"><div class="shift-section-title-v37">Qué debe gestionarse ahora</div>${list}${tasks.length>14?`<div class="muted" style="padding-top:8px">+ ${tasks.length-14} tareas adicionales en Rendimiento.</div>`:''}</div><div class="shift-foot-v37"><button class="btn light" onclick="closeShiftBriefV37()">Cerrar</button><button class="btn light" onclick="closeShiftBriefV37();switchView('sales')">Ventas del día</button><button class="btn cyan" onclick="closeShiftBriefV37();switchView('performance')">Abrir Rendimiento</button></div></section>`;document.body.appendChild(wrap);
    try{localStorage.setItem(opsV37BriefKey(date),'shown');}catch(e){}
  }catch(e){console.error('opening brief v37',e);}
}
window.closeShiftBriefV37=function(){document.getElementById('opsShiftBriefV37')?.remove();};
function opsV37ScheduleBrief(){
  setTimeout(()=>opsV37ShowOpeningBrief(),900);
  const p=opsV37BogotaParts(),hour=Number(p.hour||0),minute=Number(p.minute||0);
  if(hour<8){const ms=((8-hour)*60-minute)*60000;setTimeout(()=>opsV37ShowOpeningBrief(),Math.max(1000,ms+1500));}
}
const opsV37RenderShellBase=window.renderShell;
window.renderShell=function(){opsV37RenderShellBase();const foot=document.querySelector('.sidebar-foot');if(foot){foot.innerHTML=foot.innerHTML.replace(/Lun–Sáb[^<]*/,'Lun–Sáb · 08:00–12:00 / 14:00–18:00').replace(/Versión\s+[^<]+/,'Versión 35.0');}opsV37ScheduleBrief();};

console.info('INVICTO OPS v37 · corte 18:00 + SLA partido + mensual operativo + brief de apertura');
