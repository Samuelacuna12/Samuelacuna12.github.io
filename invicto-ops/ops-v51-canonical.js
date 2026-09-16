/* INVICTO OPS v51 · fuente única de asignaciones, tareas y estadísticas */
(function(){
  const C={data:null,loading:false,loaded:false,selectedAdvisor:'all',filter:'all',search:'',lastAt:0};
  window.opsCanonicalV51=C;
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const admin=()=>typeof isAdmin==='function'&&isAdmin();
  const advisor=()=>typeof isAdvisor==='function'&&isAdvisor();
  const uid=()=>String(session?.id||'');
  const num=v=>Number(v||0);

  function style(){if(document.getElementById('opsV51Style'))return;const s=document.createElement('style');s.id='opsV51Style';s.textContent=`
    .canon-hero-v51{display:flex;align-items:flex-end;gap:18px;justify-content:space-between;margin-bottom:16px}.canon-hero-v51 h1{margin:3px 0 5px}.canon-hero-v51 p{margin:0;color:#667085}.canon-date-v51{font-size:12px;color:#667085;font-weight:700}
    .canon-cards-v51{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0}.canon-card-v51{appearance:none;border:1px solid #dfe3ea;background:#fff;border-radius:16px;padding:14px;text-align:left;cursor:pointer;color:#101828}.canon-card-v51:hover,.canon-card-v51.active{border-color:#071229;box-shadow:0 0 0 2px rgba(7,18,41,.06)}.canon-card-v51 small{display:block;font-size:10px;letter-spacing:.05em;color:#667085;font-weight:800}.canon-card-v51 b{display:block;font-size:29px;margin-top:4px}.canon-card-v51.total{background:#071229;color:#fff;border-color:#071229}.canon-card-v51.total small{color:#cbd5e1}
    .canon-stats-v51{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:0 0 14px}.canon-stat-v51{background:#f8fafc;border:1px solid #e4e7ec;border-radius:13px;padding:11px}.canon-stat-v51 small{display:block;color:#667085;font-size:9px;font-weight:800;letter-spacing:.05em}.canon-stat-v51 b{font-size:19px;display:block;margin-top:3px}
    .canon-toolbar-v51{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid #e4e7ec}.canon-tabs-v51{display:flex;gap:7px;flex-wrap:wrap}.canon-tabs-v51 button{border:1px solid #d0d5dd;background:#fff;border-radius:999px;padding:8px 12px;font-weight:800;color:#475467;cursor:pointer}.canon-tabs-v51 button.active{background:#071229;color:#fff;border-color:#071229}.canon-tabs-v51 span{opacity:.7}.canon-tools-v51{margin-left:auto;display:flex;gap:7px}.canon-tools-v51 select,.canon-tools-v51 input{border:1px solid #d0d5dd;border-radius:10px;padding:8px 10px;background:#fff;min-width:170px}
    .canon-team-v51{margin:12px 0 16px;border:1px solid #e4e7ec;border-radius:15px;overflow:hidden;background:#fff}.canon-team-v51 table{margin:0}.canon-team-v51 tr[data-advisor]{cursor:pointer}.canon-team-v51 tr[data-advisor]:hover{background:#f8fafc}.canon-team-v51 .on{color:#067647}.canon-team-v51 .off{color:#b42318}
    .canon-kind-v51{display:inline-flex;border-radius:999px;padding:3px 7px;font-size:9px;font-weight:900;background:#eef2f6;color:#344054;margin-top:4px}.canon-urgent-v51{color:#b42318;font-weight:900}.canon-empty-v51{padding:30px;text-align:center;color:#667085}.canon-source-v51{font-size:10px;color:#667085;margin-top:3px}.canon-inline-v51{border:1px solid #e4e7ec;border-radius:15px;background:#fff;padding:13px 14px;margin:0 0 14px}.canon-inline-v51 h3{margin:0 0 8px}.canon-inline-grid-v51{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.canon-inline-grid-v51 div{padding:9px;border-radius:10px;background:#f8fafc}.canon-inline-grid-v51 small{display:block;color:#667085;font-size:9px}.canon-inline-grid-v51 b{font-size:17px}
    @media(max-width:1000px){.canon-cards-v51,.canon-stats-v51,.canon-inline-grid-v51{grid-template-columns:repeat(2,minmax(0,1fr))}.canon-card-v51.total{grid-column:1/-1}}
    @media(max-width:620px){.canon-cards-v51,.canon-stats-v51,.canon-inline-grid-v51{grid-template-columns:1fr 1fr}.canon-toolbar-v51{align-items:stretch}.canon-tools-v51{margin-left:0;width:100%}.canon-tools-v51 input{min-width:0;flex:1}.canon-hero-v51{align-items:flex-start;flex-direction:column}}
  `;document.head.appendChild(s)}

  function summaryRows(){return Array.isArray(C.data?.advisors)?C.data.advisors:[]}
  function tasks(){return Array.isArray(C.data?.tasks)?C.data.tasks:[]}
  function currentSummary(){
    const rows=summaryRows();
    if(advisor())return rows[0]||{};
    if(C.selectedAdvisor!=='all')return rows.find(x=>String(x.advisor_id)===String(C.selectedAdvisor))||{};
    const total=C.data?.totals||{};
    return {...total,full_name:'Equipo',advisor_id:'all',asignadas_hoy:num(total.asignadas_hoy),confirmadas_hoy:num(total.confirmadas_hoy),
      ventas_nuevas:num(total.ventas_nuevas),recuperaciones:num(total.recuperaciones),borradores:num(total.borradores),garantias:num(total.garantias),total_tareas:num(total.total_tareas),urgentes:num(total.urgentes),
      tasa_confirmacion_hoy:num(total.asignadas_hoy)?Math.round(num(total.confirmadas_hoy)/num(total.asignadas_hoy)*1000)/10:0};
  }
  function selectedTasks(){
    let a=tasks();
    if(admin()&&C.selectedAdvisor!=='all')a=a.filter(x=>String(x.advisor_id)===String(C.selectedAdvisor));
    if(C.filter!=='all')a=a.filter(x=>x.category===C.filter);
    const q=C.search.trim().toLowerCase();if(q)a=a.filter(x=>[x.reference,x.customer,x.phone,x.city,x.advisor_name,x.channel,x.status,x.detail].join(' ').toLowerCase().includes(q));
    return a;
  }
  function categoryCount(summary,key){return num(summary?.[key]);}
  function categoryLabel(k){return ({venta:'Venta nueva',recuperacion:'Recuperación',borrador:'Borrador',garantia:'Garantía'})[k]||k}
  function statusText(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
  function dateLabel(v){if(!v)return 'Pendiente';const d=new Date(v);if(Number.isNaN(d.getTime()))return 'Pendiente';return d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}

  function updateBadges(){if(!C.loaded)return;const s=currentSummary();const set=(view,n)=>{const b=document.querySelector(`.nav button[data-view="${view}"]`);if(!b)return;let badge=b.querySelector('.badge');if(num(n)>0){if(!badge){badge=document.createElement('span');badge.className='badge';b.appendChild(badge)}badge.textContent=String(n)}else badge?.remove()};set('sales',s.total_tareas);set('recovery',s.recuperaciones);set('guarantees',s.garantias)}

  window.loadCanonicalV51=async function(force=false){
    if(C.loading||typeof invictoSupabaseV12==='undefined'||!session)return C.data;
    if(C.loaded&&!force&&Date.now()-C.lastAt<12000)return C.data;
    C.loading=true;
    try{const {data,error}=await invictoSupabaseV12.rpc('get_ops_canonical_v51');if(error)throw error;C.data=data||{};C.loaded=true;C.lastAt=Date.now();if(advisor())C.selectedAdvisor=String(summaryRows()[0]?.advisor_id||uid()||'all');updateBadges();return C.data}
    catch(e){console.error('canonical v51',e);if(typeof toast==='function')toast('No se pudieron sincronizar las asignaciones: '+(e.message||e));return C.data}
    finally{C.loading=false}
  };
  window.setCanonicalAdvisorV51=function(v){C.selectedAdvisor=String(v||'all');C.filter='all';renderSalesV51();updateBadges()};
  window.setCanonicalFilterV51=function(v){C.filter=v;renderSalesV51()};
  window.setCanonicalSearchV51=function(v){C.search=v;renderSalesV51();setTimeout(()=>document.getElementById('canonSearchV51')?.focus(),0)};
  window.refreshCanonicalV51=async function(){await window.loadCanonicalV51(true);if(currentView==='sales')renderSalesV51();else if(currentView==='home')renderHomeV51();else if(currentView==='reports'||currentView==='team')injectCanonicalV51(currentView);if(typeof toast==='function')toast('Asignaciones y estadísticas sincronizadas')};

  window.openCanonicalTaskV51=function(id){const r=tasks().find(x=>String(x.task_id)===String(id));if(!r)return;
    if(r.category==='venta'||r.category==='borrador'){if(typeof switchView==='function')switchView('sales');setTimeout(()=>{if(typeof openOrderV20==='function')openOrderV20(r.sale_id||r.task_id);else if(typeof openOrder==='function')openOrder(r.sale_id||r.task_id)},70);return}
    if(r.category==='recuperacion'){if(typeof switchView==='function')switchView('recovery');setTimeout(()=>{if(typeof recoverySearchV46==='function')recoverySearchV46(r.reference||r.customer||'')},100);return}
    if(r.category==='garantia'){if(typeof switchView==='function')switchView('guarantees');setTimeout(()=>{const i=document.getElementById('warrantySearchV48');if(i)i.value=r.reference||r.phone||r.customer||'';if(typeof searchWarrantyClientV48==='function')searchWarrantyClientV48()},100)}
  };

  function cards(s){const defs=[['venta','VENTAS NUEVAS','ventas_nuevas'],['recuperacion','RECUPERACIONES','recuperaciones'],['borrador','BORRADORES','borradores'],['garantia','GARANTÍAS','garantias'],['all','TOTAL POR GESTIONAR','total_tareas']];return `<div class="canon-cards-v51">${defs.map(([f,l,k])=>`<button class="canon-card-v51 ${f==='all'?'total':''} ${C.filter===f?'active':''}" onclick="setCanonicalFilterV51('${f}')"><small>${l}</small><b>${categoryCount(s,k)}</b></button>`).join('')}</div>`}
  function dailyStats(s){return `<div class="canon-stats-v51"><div class="canon-stat-v51"><small>ASIGNADAS HOY</small><b>${num(s.asignadas_hoy)}</b></div><div class="canon-stat-v51"><small>CONFIRMADAS HOY</small><b>${num(s.confirmadas_hoy)}</b></div><div class="canon-stat-v51"><small>TASA CONFIRMACIÓN</small><b>${num(s.tasa_confirmacion_hoy)}%</b></div><div class="canon-stat-v51"><small>PEDIDOS RECIBIDOS</small><b>${num(s.pedidos_recibidos_hoy)}</b></div><div class="canon-stat-v51"><small>BORRADORES RECIBIDOS</small><b>${num(s.borradores_recibidos_hoy)}</b></div></div>`}
  function teamTable(){if(!admin())return '';const rows=summaryRows();return `<div class="canon-team-v51"><div class="panel-head"><h3>Carga operativa canónica por asesor</h3><div class="spacer"></div><span class="muted">Mismos datos usados por Inicio, Ventas, KPIs e I.A.</span></div><div class="table-wrap"><table><thead><tr><th>ASESOR</th><th>ACTIVO</th><th>VENTAS NUEVAS</th><th>RECUPERACIONES</th><th>BORRADORES</th><th>GARANTÍAS</th><th>TOTAL TAREAS</th><th>ASIGNADAS HOY</th><th>CONFIRMADAS</th><th>TASA</th></tr></thead><tbody>${rows.map(r=>`<tr data-advisor="${E(r.advisor_id)}" onclick="setCanonicalAdvisorV51('${E(r.advisor_id)}')"><td><b>${E(r.full_name)}</b></td><td class="${r.receiving?'on':'off'}">${r.receiving?'RECIBE':'PAUSADO'}</td><td>${num(r.ventas_nuevas)}</td><td>${num(r.recuperaciones)}</td><td>${num(r.borradores)}</td><td>${num(r.garantias)}</td><td><b>${num(r.total_tareas)}</b></td><td>${num(r.asignadas_hoy)}</td><td>${num(r.confirmadas_hoy)}</td><td>${num(r.tasa_confirmacion_hoy)}%</td></tr>`).join('')}</tbody></table></div></div>`}

  window.renderSalesV51=function(){style();const host=document.getElementById('view-sales');if(!host)return;if(!C.loaded&&!C.loading){host.innerHTML='<div class="panel"><div class="panel-body">Sincronizando asignaciones…</div></div>';window.loadCanonicalV51(false).then(()=>renderSalesV51());return}const s=currentSummary(),rows=selectedTasks();const who=admin()?(C.selectedAdvisor==='all'?'Todo el equipo':s.full_name):(s.full_name||session?.name||'Mi panel');const advisorSelect=admin()?`<select onchange="setCanonicalAdvisorV51(this.value)"><option value="all" ${C.selectedAdvisor==='all'?'selected':''}>Todo el equipo</option>${summaryRows().map(x=>`<option value="${E(x.advisor_id)}" ${String(C.selectedAdvisor)===String(x.advisor_id)?'selected':''}>${E(x.full_name)}</option>`).join('')}</select>`:'';const tabs=[['all','Todas',s.total_tareas],['venta','Ventas nuevas',s.ventas_nuevas],['recuperacion','Recuperaciones',s.recuperaciones],['borrador','Borradores',s.borradores],['garantia','Garantías',s.garantias]];
    host.innerHTML=`<div class="canon-hero-v51"><div><div class="eyebrow">VENTAS DEL DÍA · CARGA OPERATIVA UNIFICADA</div><h1>${E(who)}</h1><p>Una sola asignación para ventas, recuperación, borradores y garantías.</p></div><div class="canon-date-v51">Fecha operativa: ${E(C.data?.business_date||'—')} · <button class="btn light sm" onclick="refreshCanonicalV51()">↻ Sincronizar</button></div></div>${cards(s)}${dailyStats(s)}${teamTable()}<div class="panel"><div class="canon-toolbar-v51"><div class="canon-tabs-v51">${tabs.map(([k,l,n])=>`<button class="${C.filter===k?'active':''}" onclick="setCanonicalFilterV51('${k}')">${E(l)} <span>${num(n)}</span></button>`).join('')}</div><div class="canon-tools-v51">${advisorSelect}<input id="canonSearchV51" value="${E(C.search)}" oninput="setCanonicalSearchV51(this.value)" placeholder="Buscar cliente, pedido o guía…"></div></div><div class="table-wrap"><table><thead><tr><th>TAREA</th><th>SLA</th><th>CLIENTE</th><th>CIUDAD</th><th>ASESOR / CANAL</th><th>ESTADO</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${E(r.reference||categoryLabel(r.category))}</b><div class="canon-kind-v51">${E(categoryLabel(r.category))}</div></td><td>${r.urgent?'<span class="canon-urgent-v51">URGENTE</span>':E(dateLabel(r.due_at))}</td><td><b>${E(r.customer||'Sin nombre')}</b><div class="muted">${E(r.phone||'')}</div></td><td>${E(r.city||'—')}</td><td><b>${E(r.advisor_name||'Sin asignar')}</b><div class="canon-source-v51">${E(r.channel||'')}</div></td><td>${E(statusText(r.status))}<div class="muted">${E(r.detail||'')}</div></td><td><button class="btn navy sm" onclick="openCanonicalTaskV51('${E(r.task_id)}')">Gestionar</button></td></tr>`).join('')||'<tr><td colspan="7"><div class="canon-empty-v51">No hay tareas pendientes en esta categoría.</div></td></tr>'}</tbody></table></div></div>`;updateBadges()}

  window.renderHomeV51=function(){style();const host=document.getElementById('view-home');if(!host)return;if(!C.loaded&&!C.loading){host.innerHTML='<div class="panel"><div class="panel-body">Sincronizando panel…</div></div>';window.loadCanonicalV51(false).then(()=>renderHomeV51());return}const s=currentSummary(),first=(session?.name||'Equipo').split(' ')[0];host.innerHTML=`<div class="canon-hero-v51"><div><div class="eyebrow">PANEL OPERATIVO · FUENTE ÚNICA</div><h1>${advisor()?`Hola, ${E(first)}.`:'Operación del equipo'}</h1><p>${advisor()?'Estas son exactamente las tareas que tienes asignadas.':'Las cifras de este panel son las mismas que usa Ventas del día y la I.A.'}</p></div><button class="btn navy" onclick="switchView('sales')">Abrir Ventas del día</button></div>${cards(s)}${dailyStats(s)}${teamTable()}`;updateBadges()}

  window.injectCanonicalV51=function(view){if(!C.loaded)return;const host=document.getElementById('view-'+view);if(!host||host.querySelector('[data-canon-v51]'))return;const rows=summaryRows();const h=document.createElement('div');h.dataset.canonV51='1';h.className='canon-inline-v51';h.innerHTML=`<h3>Carga operativa unificada</h3><div class="canon-inline-grid-v51">${admin()?rows.map(r=>`<div><small>${E(r.full_name)} · TOTAL TAREAS</small><b>${num(r.total_tareas)}</b><span class="muted"> ${num(r.ventas_nuevas)} ventas · ${num(r.recuperaciones)} rec. · ${num(r.borradores)} borr. · ${num(r.garantias)} gar.</span></div>`).join(''):`<div><small>VENTAS NUEVAS</small><b>${num(rows[0]?.ventas_nuevas)}</b></div><div><small>RECUPERACIONES</small><b>${num(rows[0]?.recuperaciones)}</b></div><div><small>BORRADORES</small><b>${num(rows[0]?.borradores)}</b></div><div><small>GARANTÍAS</small><b>${num(rows[0]?.garantias)}</b></div><div><small>TOTAL TAREAS</small><b>${num(rows[0]?.total_tareas)}</b></div>`}</div>`;host.prepend(h)};

  // Reemplazos finales: todas las pantallas relevantes leen el mismo payload.
  window.renderHome=window.renderHomeV51;
  window.renderSales=window.renderSalesV51;
  const reportBase=window.renderReports; if(typeof reportBase==='function')window.renderReports=function(){const r=reportBase.apply(this,arguments);setTimeout(()=>injectCanonicalV51('reports'),0);return r};
  const teamBase=window.renderTeam; if(typeof teamBase==='function')window.renderTeam=function(){const r=teamBase.apply(this,arguments);setTimeout(()=>injectCanonicalV51('team'),0);return r};
  const hydrateBase=window.hydrateOpsV13; if(typeof hydrateBase==='function')window.hydrateOpsV13=async function(){const r=await hydrateBase.apply(this,arguments);await window.loadCanonicalV51(true);return r};
  const switchBase=window.switchView; if(typeof switchBase==='function')window.switchView=function(view,initial=false){const r=switchBase.call(this,view,initial);if(['home','sales','reports','team'].includes(view))window.loadCanonicalV51(false).then(()=>{if(view==='home')renderHomeV51();else if(view==='sales')renderSalesV51();else injectCanonicalV51(view)});return r};
  const oldCounts=window.getPendingCounts;window.getPendingCounts=function(){if(!C.loaded)return typeof oldCounts==='function'?oldCounts():{sales:0,recovery:0,guarantees:0,novelties:0,stock:0};const s=currentSummary(),base=typeof oldCounts==='function'?oldCounts():{};return {...base,sales:num(s.total_tareas),recovery:num(s.recuperaciones),guarantees:num(s.garantias)}};

  style();
  setTimeout(()=>window.loadCanonicalV51(true).then(()=>{if(currentView==='home')renderHomeV51();if(currentView==='sales')renderSalesV51()}),700);
  setInterval(()=>{if(session&&document.visibilityState==='visible')window.loadCanonicalV51(true).then(()=>{if(currentView==='home')renderHomeV51();else if(currentView==='sales')renderSalesV51();else if(currentView==='reports'||currentView==='team')injectCanonicalV51(currentView)})},30000);
  console.info('INVICTO OPS v51 · asignaciones y estadísticas canónicas activas');
})();