/* INVICTO OPS v26 · corte operativo 15 Sep 2026 + tablero Día a día */
const OPS_CUTOVER_V26 = Date.parse('2026-09-15T05:00:00Z');
const OPS_CUTOVER_DATE_V26 = '2026-09-15';
let dayByDayDataV26 = null;
let dayByDayDateV26 = null;
let dayByDayBusyV26 = false;

function bogotaDateV26(){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function isNewOpsSaleV26(s){
  if(!s)return false;
  if(s.opsData?.legacy_system===true || s.ops_data?.legacy_system===true)return false;
  const raw=s.receivedAt||s.received_at||s.createdAt||s.created_at;
  if(raw){const t=new Date(raw).getTime();if(Number.isFinite(t))return t>=OPS_CUTOVER_V26;}
  const d=String(s.commercialDate||s.commercial_date||'');
  return d>=OPS_CUTOVER_DATE_V26;
}
function isLegacyMonthlyV26(r){
  if(!r || r.record_origin==='historical_shopify')return false;
  const raw=r.received_at||r.created_at;
  if(raw){const t=new Date(raw).getTime();if(Number.isFinite(t))return t<OPS_CUTOVER_V26;}
  return String(r.commercial_date||'')<OPS_CUTOVER_DATE_V26;
}

/* Todos los módulos operativos antiguos empiezan desde el corte. */
window.todaySales=function(){
  const d=typeof todayBogotaV13==='function'?todayBogotaV13():bogotaDateV26();
  return (state.sales||[]).filter(s=>isNewOpsSaleV26(s)&&String(s.commercialDate||'')===d);
};
window.advisorSales=function(){
  const rows=(state.sales||[]).filter(isNewOpsSaleV26);
  return isAdvisor()?rows.filter(s=>s.advisor===session.name):rows;
};
window.getPendingCounts=function(){
  const mine=s=>!isAdvisor()||s.advisor===session.name;
  const sales=(state.sales||[]).filter(isNewOpsSaleV26);
  return {
    sales:sales.filter(s=>String(s.commercialDate||'')===bogotaDateV26()&&mine(s)&&['Nueva','No contesta','Seguimiento futuro','Pendiente stock'].includes(s.status)).length,
    recovery:sales.filter(s=>mine(s)&&['No contesta','Seguimiento futuro','Pendiente stock','No recuperado – sin contacto'].includes(s.status)).length,
    guarantees:(state.guarantees||[]).filter(g=>mine(g)&&g.status!=='Cerrada').length,
    novelties:(state.novelties||[]).filter(n=>mine(n)&&n.status!=='Cerrada').length,
    stock:Object.values(state.inventorySources||{}).filter(x=>!x).length
  };
};

if(typeof window.reportStatusTagV23==='function'){
  const reportStatusTagBaseV26=window.reportStatusTagV23;
  window.reportStatusTagV23=function(r){
    if(isLegacyMonthlyV26(r))return '<span class="tag gray">GESTIONADA POR SISTEMA ANTIGUO</span>';
    return reportStatusTagBaseV26(r);
  };
}

function dbStatusLabelV26(st=''){
  const m={nueva:'Nueva',asignada:'Asignada',en_gestion:'En gestión',no_contesta:'No contesta',seguimiento_programado:'Seguimiento',pendiente_stock:'Pendiente stock',confirmada:'Confirmada',perdida:'Perdida',cancelada:'Cancelada',duplicada:'Duplicada'};
  return m[st]||st||'—';
}
function logisticsLabelV26(st='pendiente'){
  return ({pendiente:'Pendiente',lista_despacho:'Lista para despacho',guia_generada:'Guía generada',en_transito:'En tránsito',reclama_oficina:'Reclama en oficina',entregada:'Entregada',novedad:'Novedad',devuelta:'Devuelta',cancelada:'Cancelada'})[st]||st;
}
function logisticsClassV26(st='pendiente'){
  if(st==='entregada')return 'green';if(['novedad','devuelta','cancelada'].includes(st))return 'red';if(['guia_generada','en_transito','reclama_oficina','lista_despacho'].includes(st))return 'blue';return 'amber';
}
function fmtTimeV26(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleTimeString('es-CO',{timeZone:'America/Bogota',hour:'2-digit',minute:'2-digit'});}
function fmtDateTimeV26(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}

async function loadDayByDayV26(force=false){
  if(dayByDayBusyV26)return;
  const date=dayByDayDateV26||bogotaDateV26();
  if(!force&&dayByDayDataV26?.date===date){renderDayByDayV26(true);return;}
  dayByDayBusyV26=true;renderDayByDayLoadingV26();
  try{
    const {data,error}=await invictoSupabaseV12.rpc('get_ops_day_by_day',{p_date:date});
    if(error)throw error;dayByDayDataV26=data||{};renderDayByDayV26(true);
  }catch(e){console.error('day by day v26',e);const h=el('view-day-by-day');if(h)h.innerHTML=`<div class="page-title"><div><h1>Día a día</h1><p>No fue posible cargar el tablero.</p></div></div><div class="blocking">${esc(e?.message||e)}</div>`;}
  finally{dayByDayBusyV26=false;}
}
function renderDayByDayLoadingV26(){const h=el('view-day-by-day');if(h)h.innerHTML='<div class="page-title"><div><h1>Día a día</h1><p>Cargando operación...</p></div></div><div class="panel"><div class="panel-body"><b>Consultando Supabase…</b></div></div>';}
window.changeDayByDayDateV26=function(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return;dayByDayDateV26=v;dayByDayDataV26=null;loadDayByDayV26(true);};
window.refreshDayByDayV26=function(){dayByDayDataV26=null;loadDayByDayV26(true);};

function dayMetricV26(label,value,sub){return `<div class="card day-card-v26"><small>${esc(label)}</small><b>${value}</b><div class="sub">${esc(sub)}</div></div>`;}
function advisorTableV26(rows){return `<div class="panel day-team-v26"><div class="panel-head"><div><h3>Equipo · desempeño del día</h3><div class="muted">Administración y gerencia ven el equipo completo.</div></div></div><div class="table-wrap"><table><thead><tr><th>Asesor</th><th>Asignadas</th><th>Gestionadas</th><th>Confirmadas</th><th>Pendientes</th><th>Perdidas</th><th>Intentos</th><th>Conversión</th><th>Tiempo gestión</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.advisor)}</b></td><td>${Number(r.assigned||0)}</td><td>${Number(r.managed||0)}</td><td><b>${Number(r.confirmed||0)}</b></td><td>${Number(r.pending||0)}</td><td>${Number(r.lost||0)}</td><td>${Number(r.attempts||0)}</td><td><b>${Number(r.conversion||0)}%</b></td><td>${r.avg_management_minutes==null?'—':Number(r.avg_management_minutes).toFixed(1)+' min'}</td></tr>`).join('')||'<tr><td colspan="9" class="muted">Sin asesores activos.</td></tr>'}</tbody></table></div></div>`;}
function activityTableV26(rows){return `<div class="panel day-activity-v26"><div class="panel-head"><div><h3>Actividad del día</h3><div class="muted">Qué recibió cada asesor, qué gestionó y qué está pendiente.</div></div><div class="spacer"></div><span class="tag blue">${rows.length} ventas</span></div><div class="table-wrap"><table><thead><tr><th>Hora</th><th>Pedido</th><th>Cliente</th><th>Asesor</th><th>Estado</th><th>Intentos</th><th>Última gestión</th><th>Seguimiento</th><th>Valor</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmtTimeV26(r.received_at)}</td><td><b>${esc(r.order||'—')}</b></td><td><b>${esc(r.customer_name||'Sin nombre')}</b><div class="muted">${esc(r.customer_phone||'')}</div></td><td>${esc(r.advisor||'Sin asignar')}</td><td><span class="tag ${r.status==='confirmada'?'green':r.status==='perdida'?'red':'blue'}">${esc(dbStatusLabelV26(r.status))}</span></td><td>${Number(r.attempts||0)}</td><td>${fmtDateTimeV26(r.last_managed_at)}</td><td>${fmtDateTimeV26(r.next_followup_at)}</td><td><b>${money(r.total_price||0)}</b></td></tr>`).join('')||'<tr><td colspan="9" class="muted">Todavía no hay ventas de la nueva operación.</td></tr>'}</tbody></table></div></div>`;}
function carrierOptionsV26(current=''){
  const arr=[...new Set([current,...(typeof TRANSPORTS!=='undefined'?TRANSPORTS:[]),'Interrapidísimo','Servientrega','Envia','Coordinadora'].filter(Boolean))];
  return `<option value="">Transportadora</option>${arr.map(x=>`<option ${x===current?'selected':''}>${esc(x)}</option>`).join('')}`;
}
function logisticsOptionsV26(current='pendiente'){
  const arr=['pendiente','lista_despacho','guia_generada','en_transito','reclama_oficina','entregada','novedad','devuelta','cancelada'];
  return arr.map(x=>`<option value="${x}" ${x===current?'selected':''}>${esc(logisticsLabelV26(x))}</option>`).join('');
}
function confirmedControlV26(rows){
  const confirmed=rows.filter(r=>r.status==='confirmada');
  return `<div class="panel day-confirmed-v26"><div class="panel-head"><div><h3>Confirmadas · guía y estado</h3><div class="muted">Editable desde el primer momento. Guarda manualmente la guía, transportadora y estado actual.</div></div><div class="spacer"></div><span class="tag green">${confirmed.length} CONFIRMADAS</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Asesor</th><th>Bodega</th><th>Guía</th><th>Transportadora</th><th>Estado actual</th><th></th></tr></thead><tbody>${confirmed.map(r=>`<tr><td><b>${esc(r.order||'—')}</b><div class="muted">${money(r.total_price||0)}</div></td><td>${esc(r.customer_name||'')}</td><td>${esc(r.advisor||'')}</td><td>${esc(r.warehouse||'—')}</td><td><input id="dayGuide-${r.id}" class="day-inline-input-v26" value="${esc(r.tracking_number||'')}" placeholder="Número de guía"></td><td><select id="dayCarrier-${r.id}" class="day-inline-select-v26">${carrierOptionsV26(r.carrier||'')}</select></td><td><select id="dayStatus-${r.id}" class="day-inline-select-v26">${logisticsOptionsV26(r.logistics_status||'pendiente')}</select><div style="margin-top:5px"><span class="tag ${logisticsClassV26(r.logistics_status)}">${esc(logisticsLabelV26(r.logistics_status||'pendiente'))}</span></div></td><td><button class="btn navy sm" onclick="saveDayLogisticsV26('${r.id}')">Guardar</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">Aún no hay ventas confirmadas en esta fecha.</td></tr>'}</tbody></table></div></div>`;
}
window.saveDayLogisticsV26=async function(id){
  const guide=el('dayGuide-'+id)?.value?.trim()||'',carrier=el('dayCarrier-'+id)?.value||'',status=el('dayStatus-'+id)?.value||'pendiente';
  if(['guia_generada','en_transito','reclama_oficina','entregada'].includes(status)&&!guide)return toast('Escribe el número de guía');
  try{
    toast('Guardando guía y estado…');
    const {data,error}=await invictoSupabaseV12.rpc('save_ops_day_by_day_logistics',{p_sale_id:id,p_tracking_number:guide,p_carrier:carrier,p_status:status});
    if(error)throw error;if(!data?.ok)throw new Error('No se pudo guardar');
    await hydrateOpsV13(true).catch(()=>{});dayByDayDataV26=null;await loadDayByDayV26(true);toast('Guía y estado actualizados');
  }catch(e){console.error(e);toast('No se guardó: '+(e?.message||e));}
};

window.renderDayByDayV26=function(skipLoad=false){
  const host=el('view-day-by-day');if(!host)return;
  if(!dayByDayDateV26)dayByDayDateV26=bogotaDateV26();
  if(!skipLoad||!dayByDayDataV26||dayByDayDataV26.date!==dayByDayDateV26){loadDayByDayV26();return;}
  const d=dayByDayDataV26,s=d.summary||{},rows=d.sales||[],pre=String(d.date)<OPS_CUTOVER_DATE_V26;
  host.innerHTML=`<div class="page-title day-title-v26"><div><div class="eyebrow">OPERACIÓN NUEVA · DESDE 15 SEP 2026</div><h1>Día a día</h1><p>${d.can_view_all?'Vista completa de administración y gerencia.':'Solo ves tus propias ventas, gestiones y resultados.'}</p></div><div class="day-actions-v26"><input type="date" class="search" value="${esc(d.date)}" onchange="changeDayByDayDateV26(this.value)"><button class="btn light sm" onclick="refreshDayByDayV26()">↻ Actualizar</button></div></div>
  ${pre?'<div class="legacy-banner-v26"><b>Esta fecha pertenece al sistema anterior.</b><span>Toda la operación previa al 15 de septiembre quedó como “Gestionada por sistema antiguo”. Las métricas nuevas empiezan en 0.</span></div>':'<div class="cutover-banner-v26"><b>Nueva operación activa.</b><span>Solo cuenta lo recibido desde el 15 de septiembre a las 00:00 hora Colombia.</span></div>'}
  <div class="cards day-cards-v26">${dayMetricV26('Recibidas',Number(s.received||0),'ventas asignables')}${dayMetricV26('Gestionadas',Number(s.managed||0),'con gestión registrada')}${dayMetricV26('Confirmadas',Number(s.confirmed||0),'ventas cerradas')}${dayMetricV26('Pendientes',Number(s.pending||0),'por trabajar')}${dayMetricV26('Intentos',Number(s.attempts||0),'gestiones registradas')}${dayMetricV26('Conversión',Number(s.conversion||0)+'%','sobre ventas válidas')}${dayMetricV26('Facturación confirmada',money(s.confirmed_value||0),'valor confirmado')}</div>
  ${d.can_view_all?advisorTableV26(d.advisors||[]):''}
  ${confirmedControlV26(rows)}
  ${activityTableV26(rows)}`;
};

/* Inserta el módulo en shell y navegación. */
const renderShellBaseV26=window.renderShell;
window.renderShell=function(){
  renderShellBaseV26();
  const content=document.querySelector('.content');
  if(content&&!el('view-day-by-day')){const s=document.createElement('section');s.id='view-day-by-day';s.className='view';const home=el('view-home');content.insertBefore(s,home?.nextSibling||content.firstChild);}
  const nav=document.querySelector('.nav');
  if(nav&&!nav.querySelector('[data-view="day-by-day"]')){const b=document.createElement('button');b.dataset.view='day-by-day';b.textContent='Día a día';b.onclick=()=>switchView('day-by-day');const sales=nav.querySelector('[data-view="sales"]');nav.insertBefore(b,sales||nav.firstChild);}
  const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión 26.0');
};
const switchViewBaseV26=window.switchView;
window.switchView=function(view,initial=false){
  if(view!=='day-by-day')return switchViewBaseV26(view,initial);
  currentView=view;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));el('view-day-by-day')?.classList.add('active');if(el('topTitle'))el('topTitle').textContent='Día a día';renderDayByDayV26();if(!initial&&innerWidth<800)el('sidebar')?.classList.remove('open');
};

/* Si la app ya estaba renderizada antes de cargar v26, reconstruye el shell una vez. */
if(session){try{render();}catch(e){console.warn('v26 initial render',e);}}
console.info('INVICTO OPS v26 · corte operativo y Día a día activos');
