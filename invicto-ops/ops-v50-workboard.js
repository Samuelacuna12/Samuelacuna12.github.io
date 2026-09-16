/* INVICTO OPS v50 · bandeja unificada de tareas por asesor */
(function(){
  let workRowsV50=[];
  let workLoadedV50=false;
  let workLoadingV50=false;
  let workFilterV50='all';
  let workSearchV50='';

  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const M=v=>typeof money==='function'?money(Number(v||0)):Number(v||0).toLocaleString('es-CO');
  const adminV50=()=>typeof isAdmin==='function'&&isAdmin();
  const advisorV50=()=>typeof isAdvisor==='function'&&isAdvisor();

  function categoryLabelV50(v){return ({venta:'Venta nueva',recuperacion:'Recuperación',borrador:'Borrador',garantia:'Garantía'})[v]||v;}
  function statusLabelV50(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
  function countV50(key){
    if(key==='all')return workRowsV50.length;
    if(key==='urgent')return workRowsV50.filter(x=>x.urgent).length;
    if(key==='reference')return workRowsV50.filter(x=>x.reference_pending).length;
    return workRowsV50.filter(x=>x.category===key).length;
  }
  function filteredV50(){
    const q=workSearchV50.trim().toLowerCase();
    return workRowsV50.filter(r=>{
      if(workFilterV50==='urgent'&&!r.urgent)return false;
      if(workFilterV50==='reference'&&!r.reference_pending)return false;
      if(!['all','urgent','reference'].includes(workFilterV50)&&r.category!==workFilterV50)return false;
      if(q&&![r.reference,r.customer,r.phone,r.city,r.advisor_name,r.channel,r.status,r.detail].join(' ').toLowerCase().includes(q))return false;
      return true;
    });
  }
  function dueLabelV50(r){
    if(r.urgent)return '<span class="task-sla-v50 urgent">URGENTE</span>';
    if(r.due_at){
      const d=new Date(r.due_at);if(!Number.isNaN(d.getTime()))return `<span class="task-sla-v50">${E(d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}))}</span>`;
    }
    return '<span class="task-sla-v50 neutral">PENDIENTE</span>';
  }
  function advisorSummaryV50(){
    if(!adminV50())return '';
    const map=new Map();workRowsV50.forEach(r=>map.set(r.advisor_name,(map.get(r.advisor_name)||0)+1));
    return `<div class="task-advisors-v50">${[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([n,c])=>`<span><b>${E(n)}</b> ${c}</span>`).join('')}</div>`;
  }
  function navBadgeV50(view,value){
    const b=document.querySelector(`.nav button[data-view="${view}"]`);if(!b)return;
    let badge=b.querySelector('.badge');
    if(value>0){if(!badge){badge=document.createElement('span');badge.className='badge';b.appendChild(badge)}badge.textContent=String(value)}else badge?.remove();
  }
  function updateNavV50(){
    if(!workLoadedV50)return;
    navBadgeV50('sales',countV50('venta')+countV50('borrador'));
    navBadgeV50('recovery',countV50('recuperacion'));
    navBadgeV50('guarantees',countV50('garantia'));
  }
  window.loadWorkQueueV50=async function(force=false){
    if(workLoadingV50||typeof invictoSupabaseV12==='undefined')return;
    if(workLoadedV50&&!force)return;
    workLoadingV50=true;
    try{
      const {data,error}=await invictoSupabaseV12.rpc('get_advisor_work_queue_v50');
      if(error)throw error;
      workRowsV50=data||[];workLoadedV50=true;updateNavV50();
    }catch(e){console.error('work queue v50',e);if(typeof toast==='function')toast('No se pudo cargar la bandeja de tareas: '+(e.message||e));}
    finally{workLoadingV50=false;if(typeof currentView!=='undefined'&&currentView==='home')window.renderHome();}
  };
  window.setWorkFilterV50=function(v){workFilterV50=v;window.renderHome()};
  window.setWorkSearchV50=function(v){workSearchV50=v;window.renderHome();setTimeout(()=>document.getElementById('workSearchV50')?.focus(),0)};
  window.openWorkTaskV50=function(id){
    const r=workRowsV50.find(x=>String(x.task_id)===String(id));if(!r)return;
    if(r.category==='venta'||r.category==='borrador'){
      if(typeof switchView==='function')switchView('sales');
      setTimeout(()=>{if(typeof openOrderV20==='function')openOrderV20(r.sale_id||r.task_id);else if(typeof openOrder==='function')openOrder(r.sale_id||r.task_id)},80);return;
    }
    if(r.category==='recuperacion'){
      if(typeof switchView==='function')switchView('recovery');
      setTimeout(()=>{if(typeof recoverySearchV46==='function')recoverySearchV46(r.reference||r.customer||'')},120);return;
    }
    if(r.category==='garantia'){
      if(typeof switchView==='function')switchView('guarantees');
      setTimeout(()=>{const i=document.getElementById('warrantySearchV48');if(i)i.value=r.reference||r.phone||r.customer||'';if(typeof searchWarrantyClientV48==='function')searchWarrantyClientV48()},120);
    }
  };

  window.renderHome=function(){
    const host=document.getElementById('view-home');if(!host)return;
    if(!workLoadedV50&&!workLoadingV50)setTimeout(()=>window.loadWorkQueueV50(false),0);
    const rows=filteredV50();
    const total=countV50('all'),sales=countV50('venta'),recovery=countV50('recuperacion'),drafts=countV50('borrador'),warranties=countV50('garantia'),urgent=countV50('urgent'),refs=countV50('reference');
    const first=(session?.name||'').split(' ')[0]||'Equipo';
    const tabs=[['all','Todas',total],['urgent','Urgentes',urgent],['venta','Ventas nuevas',sales],['recuperacion','Recuperaciones',recovery],['borrador','Borradores',drafts],['reference','Referencias pendientes',refs],['garantia','Garantías',warranties]];
    host.innerHTML=`
      <div class="work-hero-v50"><div><div class="eyebrow">BANDEJA OPERATIVA · DATOS EN VIVO</div><h1>${advisorV50()?`Hola, ${E(first)}.`:'Control de tareas del equipo'}</h1><p>${advisorV50()?'Aquí aparecen únicamente las tareas que están asignadas a tu usuario.':'Vista consolidada por asesor, usando asignación por UUID y no por nombre.'}</p></div><div class="work-total-v50"><small>TOTAL POR GESTIONAR</small><b>${total}</b><span>${urgent} urgentes</span></div></div>
      <div class="work-cards-v50"><button onclick="setWorkFilterV50('venta')"><small>VENTAS NUEVAS</small><b>${sales}</b></button><button onclick="setWorkFilterV50('recuperacion')"><small>RECUPERACIONES</small><b>${recovery}</b></button><button onclick="setWorkFilterV50('borrador')"><small>BORRADORES</small><b>${drafts}</b></button><button onclick="setWorkFilterV50('garantia')"><small>GARANTÍAS</small><b>${warranties}</b></button></div>
      ${advisorSummaryV50()}
      <div class="work-panel-v50">
        <div class="work-toolbar-v50"><div class="work-tabs-v50">${tabs.map(([k,l,c])=>`<button class="${workFilterV50===k?'active':''}" onclick="setWorkFilterV50('${k}')">${E(l)}${Number(c)>0?` <span>${c}</span>`:''}</button>`).join('')}</div><div class="work-search-wrap-v50"><input id="workSearchV50" value="${E(workSearchV50)}" oninput="setWorkSearchV50(this.value)" placeholder="Buscar cliente, pedido, guía o ciudad…"><button onclick="loadWorkQueueV50(true)">↻</button></div></div>
        <div class="table-wrap"><table class="work-table-v50"><thead><tr><th>PEDIDO / TAREA</th><th>SLA</th><th>CLIENTE</th><th>CIUDAD</th><th>ASESOR / CANAL</th><th>ESTADO</th><th></th></tr></thead><tbody>${workLoadingV50&&!workLoadedV50?'<tr><td colspan="7" class="muted">Cargando tareas…</td></tr>':rows.map(r=>`<tr class="${r.urgent?'urgent-row':''}"><td><b>${E(r.reference||categoryLabelV50(r.category))}</b><div class="task-kind-v50">${E(categoryLabelV50(r.category))}${r.reference_pending?' · REFERENCIA PENDIENTE':''}</div></td><td>${dueLabelV50(r)}</td><td><b>${E(r.customer||'Sin nombre')}</b><div class="muted">${E(r.phone||'')}</div></td><td>${E(r.city||'—')}</td><td><b>${E(r.advisor_name||'Sin asignar')}</b><div class="muted">${E(r.channel||'')}</div></td><td><span class="task-status-v50">${E(statusLabelV50(r.status))}</span><div class="muted">${E(r.detail||'')}</div></td><td><button class="btn navy sm" onclick="openWorkTaskV50('${E(r.task_id)}')">Gestionar</button></td></tr>`).join('')||'<tr><td colspan="7"><div class="work-empty-v50">No hay tareas en este filtro.</div></td></tr>'}</tbody></table></div>
      </div>`;
    updateNavV50();
  };

  const shellBaseV50=window.renderShell;
  if(typeof shellBaseV50==='function')window.renderShell=function(){const r=shellBaseV50.apply(this,arguments);setTimeout(updateNavV50,0);return r;};
  setTimeout(()=>{if(typeof session!=='undefined'&&session)window.loadWorkQueueV50(true)},900);
  console.info('INVICTO OPS v50 · bandeja unificada de tareas activa');
})();
