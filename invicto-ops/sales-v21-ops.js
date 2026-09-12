/* INVICTO OPS v21 · eficiencia operativa, seguridad visual y navegación rápida */
const ACTIVE_SALES_V21=['Nueva','No contesta','Seguimiento futuro','Pendiente stock'];
let salesQuickFilterV21='all';
let opsLastSyncV21=Date.now();
let inventoryHistoryCacheV21={at:0,rows:[]};

function bogotaDateTextV21(d){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function businessMinutesV21(start,end=new Date()){
  const a=new Date(start),b=new Date(end);if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<=a)return 0;
  const first=bogotaDateTextV21(a),last=bogotaDateTextV21(b);let cursor=new Date(first+'T12:00:00Z'),total=0,guard=0;
  while(guard++<400){const ymd=cursor.toISOString().slice(0,10),dow=cursor.getUTCDay();if(dow!==0){const ds=new Date(ymd+'T08:00:00-05:00'),de=new Date(ymd+'T18:00:00-05:00'),lo=Math.max(a.getTime(),ds.getTime()),hi=Math.min(b.getTime(),de.getTime());if(hi>lo)total+=(hi-lo)/60000}if(ymd>=last)break;cursor=new Date(cursor.getTime()+86400000)}
  return Math.max(0,Math.round(total));
}
function fmtBusinessAgeV21(s){const m=businessMinutesV21(s.lastManagedAt||s.receivedAt||s.createdAt);if(m<60)return `${m} min háb.`;return `${Math.floor(m/60)}h ${m%60}m háb.`}
function saleUrgencyV21(s){
  if(!ACTIVE_SALES_V21.includes(s.status))return 0;
  if(s.nextFollowupAt&&new Date(s.nextFollowupAt)<=new Date())return 100000+businessMinutesV21(s.nextFollowupAt);
  const idle=businessMinutesV21(s.lastManagedAt||s.receivedAt||s.createdAt);if(idle>=10)return 60000+idle;if(idle>=5)return 40000+idle;if(s.status==='Pendiente stock')return 25000;return 1000+idle;
}
function slaTagV21(s){if(!ACTIVE_SALES_V21.includes(s.status))return '<span class="tag gray">CERRADA / EN FLUJO</span>';if(s.nextFollowupAt&&new Date(s.nextFollowupAt)<=new Date())return '<span class="tag red">SEGUIMIENTO VENCIDO</span>';const m=businessMinutesV21(s.lastManagedAt||s.receivedAt||s.createdAt);if(m>=10)return '<span class="tag red">SLA ROJO</span>';if(m>=5)return '<span class="tag amber">SLA AMARILLO</span>';return '<span class="tag green">AL DÍA</span>'}
function waDigitsV21(phone=''){let d=String(phone).replace(/\D/g,'');if(d.length===10)d='57'+d;return d}
function openWhatsAppV21(phone){const d=waDigitsV21(phone);if(!d)return toast('El cliente no tiene teléfono válido');window.open(`https://wa.me/${d}`,'_blank','noopener')}

function salesRowsV21(){
  const q=(el('salesSearch')?.value||'').toLowerCase(),st=el('salesStatus')?.value||'',adv=el('salesAdvisor')?.value||'';
  let rows=todaySales().filter(s=>(!q||[s.name,s.phone,s.city,s.id,s.advisor,s.summary].join(' ').toLowerCase().includes(q))&&(!st||s.status===st)&&(!adv||s.advisor===adv));
  if(salesQuickFilterV21==='mine')rows=rows.filter(s=>s.advisorId===session?.id||s.advisor===session?.name);
  if(salesQuickFilterV21==='urgent')rows=rows.filter(s=>saleUrgencyV21(s)>=40000);
  if(salesQuickFilterV21==='drafts')rows=rows.filter(s=>s.isDraft);
  if(salesQuickFilterV21==='unmapped')rows=rows.filter(s=>s.mappingStatus==='pending');
  if(salesQuickFilterV21==='confirmed')rows=rows.filter(s=>s.status==='Confirmada');
  return rows.sort((a,b)=>saleUrgencyV21(b)-saleUrgencyV21(a)||new Date(a.receivedAt||a.createdAt)-new Date(b.receivedAt||b.createdAt));
}
window.setSalesQuickV21=function(v){salesQuickFilterV21=v;document.querySelectorAll('.sales-quick-v21 button').forEach(b=>b.classList.toggle('active',b.dataset.q===v));filterSales()};
window.renderSales=function(){
  const data=todaySales(),drafts=data.filter(s=>s.isDraft).length,pending=data.filter(s=>ACTIVE_SALES_V21.includes(s.status)).length,confirmed=data.filter(s=>s.status==='Confirmada').length,urgent=data.filter(s=>saleUrgencyV21(s)>=40000).length;
  el('view-sales').innerHTML=`<div class="page-title"><div><h1>Ventas del día</h1><p>Ordenadas automáticamente por urgencia operativa y SLA hábil.</p></div><button class="btn cyan" onclick="newOrder()">+ Nueva venta manual</button></div>
  <div class="cards sales-mini-v20">${kpi('Ingresadas',data.length,'hoy')}${kpi('Urgentes',urgent,'SLA vencido / rojo')}${kpi('Por gestionar',pending,'activas')}${kpi('Confirmadas',confirmed,'con reserva')}</div>
  <div class="panel" style="margin-top:14px"><div class="panel-head sales-filter-head-v21"><div class="toolbar"><input id="salesSearch" class="search" placeholder="Pedido, cliente, teléfono o ciudad..." oninput="filterSales()"><select id="salesStatus" class="search" onchange="filterSales()"><option value="">Todos los estados</option>${salesStatusOptionsV20().map(x=>`<option>${x}</option>`).join('')}</select>${isAdmin()?`<select id="salesAdvisor" class="search" onchange="filterSales()"><option value="">Todos los asesores</option>${ADVISORS.map(x=>`<option>${x}</option>`).join('')}</select>`:''}</div><div class="spacer"></div><span id="salesCountV20" class="tag blue">${data.length} visibles</span></div>
  <div class="sales-quick-v21"><button data-q="all" class="${salesQuickFilterV21==='all'?'active':''}" onclick="setSalesQuickV21('all')">Todas</button><button data-q="mine" class="${salesQuickFilterV21==='mine'?'active':''}" onclick="setSalesQuickV21('mine')">Mías</button><button data-q="urgent" class="${salesQuickFilterV21==='urgent'?'active':''}" onclick="setSalesQuickV21('urgent')">Urgentes ${urgent?`(${urgent})`:''}</button><button data-q="drafts" class="${salesQuickFilterV21==='drafts'?'active':''}" onclick="setSalesQuickV21('drafts')">Borradores (${drafts})</button><button data-q="unmapped" class="${salesQuickFilterV21==='unmapped'?'active':''}" onclick="setSalesQuickV21('unmapped')">Referencias pendientes</button><button data-q="confirmed" class="${salesQuickFilterV21==='confirmed'?'active':''}" onclick="setSalesQuickV21('confirmed')">Confirmadas</button></div>
  <div class="table-wrap"><table class="sales-table-v20"><thead><tr><th>Pedido</th><th>SLA</th><th>Cliente</th><th>Ciudad</th><th>Asesor</th><th>Estado</th><th>Pedido Shopify</th><th>Valor</th><th>Bodega</th><th>Acciones</th></tr></thead><tbody id="salesBody"></tbody></table></div></div>`;filterSales();
};
window.filterSales=function(){if(!el('salesBody'))return;const rows=salesRowsV21();if(el('salesCountV20'))el('salesCountV20').textContent=`${rows.length} visibles`;el('salesBody').innerHTML=rows.map(s=>{const id=JSON.stringify(String(s.id));return `<tr class="sales-row-v20 ${saleUrgencyV21(s)>=60000?'row-red-v21':saleUrgencyV21(s)>=40000?'row-amber-v21':''}" onclick='openOrderV20(${id})'><td><b>${esc(s.id)}</b>${s.isDraft?'<div><span class="tag amber">BORRADOR</span></div>':''}<div class="muted">${s.mappingStatus==='pending'?'Referencias por definir':'Referencias listas'}</div></td><td>${slaTagV21(s)}<div class="muted" style="margin-top:4px">${fmtBusinessAgeV21(s)}</div>${s.nextFollowupAt?`<div class="muted">Próx. ${new Date(s.nextFollowupAt).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>`:''}</td><td><b>${esc(s.name)}</b><div class="muted mono">${esc(s.phone||'')}</div></td><td>${esc(s.city||'—')}<div class="muted">${esc(s.department||'')}</div></td><td>${esc(s.advisor||'Sin asignar')}</td><td>${statusTag(s.status)}${typeof manualUploadTagV7==='function'?manualUploadTagV7(s):''}</td><td>${esc(s.summary||'—')}<div class="muted">${s.qty||s.sourceQty||0} unidades</div></td><td><b>${money(s.price)}</b></td><td>${esc(s.warehouse||'Por definir')}</td><td><div class="row-actions-v21"><button class="btn navy sm" onclick='event.stopPropagation();openOrderV20(${id})'>Gestionar</button>${s.phone?`<button class="btn light sm" onclick='event.stopPropagation();openWhatsAppV21(${JSON.stringify(String(s.phone))})'>WhatsApp</button>`:''}</div></td></tr>`}).join('')||'<tr><td colspan="10" class="muted">No hay ventas para este filtro.</td></tr>'};

function drawerOpsContextV21(s){return `<div class="order-context-v21"><div><small>SLA hábil</small><b>${fmtBusinessAgeV21(s)}</b></div><div><small>Estado</small><b>${esc(s.status)}</b></div><div><small>Referencias</small><b>${s.mappingStatus==='pending'?'Pendientes':'Mapeadas'}</b></div><div><small>Próximo seguimiento</small><b>${s.nextFollowupAt?new Date(s.nextFollowupAt).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</b></div><div class="order-context-actions-v21">${s.phone?`<button class="btn light sm safe-v21" onclick="openWhatsAppV21('${esc(s.phone)}')">WhatsApp</button>`:''}<button class="btn light sm safe-v21" onclick="askAIAboutSaleV21('${esc(s.id)}')">Preguntar a I.A.</button></div></div>`}
const openOrderBaseV21=window.openOrderV20;
window.openOrderV20=function(id){openOrderBaseV21(id);const s=id?state.sales.find(x=>String(x.id)===String(id)||String(x.dbId)===String(id)):null;if(!s)return;const body=el('orderDrawer')?.querySelector('.drawer-body');if(body&&!body.querySelector('.order-context-v21'))body.insertAdjacentHTML('afterbegin',drawerOpsContextV21(s));if(isAdvisor()&&!salesPermissionV20(s)){el('orderDrawer')?.querySelectorAll('input,select,textarea').forEach(x=>x.disabled=true);el('orderDrawer')?.querySelectorAll('button:not(.close):not(.safe-v21)').forEach(x=>x.disabled=true)}};
window.openOrder=window.openOrderV20;
window.askAIAboutSaleV21=function(id){const p=el('aiPanel');if(p&&!p.classList.contains('open'))toggleAI();setTimeout(()=>aiAskQuickV19(`Analiza el pedido ${id}. Dime estado, riesgos, stock, seguimiento y la siguiente acción concreta.`),120)};
