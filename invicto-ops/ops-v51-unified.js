/* INVICTO OPS v51 · una sola fuente de verdad para tareas y estadísticas */
(function(){
  let queueV51=[], summaryV51=[], loadedV51=false, loadingV51=false, filterV51='all', searchV51='';
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const isAdm=()=>typeof isAdmin==='function'&&isAdmin();
  const isAdv=()=>typeof isAdvisor==='function'&&isAdvisor();
  const labels={venta:'Ventas nuevas',recuperacion:'Recuperaciones',borrador:'Borradores',garantia:'Garantías'};

  function counts(){
    return {
      venta:queueV51.filter(x=>x.category==='venta').length,
      recuperacion:queueV51.filter(x=>x.category==='recuperacion').length,
      borrador:queueV51.filter(x=>x.category==='borrador').length,
      garantia:queueV51.filter(x=>x.category==='garantia').length,
      total:queueV51.length,
      urgent:queueV51.filter(x=>x.urgent).length,
      reference:queueV51.filter(x=>x.reference_pending).length
    };
  }
  function mineSummary(){
    if(!summaryV51.length)return {ventas_nuevas:0,recuperaciones:0,borradores:0,garantias:0,total_tareas:0,urgentes:0,referencias_pendientes:0};
    if(isAdv())return summaryV51.find(x=>String(x.advisor_id)===String(session?.id))||summaryV51[0];
    const z={ventas_nuevas:0,recuperaciones:0,borradores:0,garantias:0,total_tareas:0,urgentes:0,referencias_pendientes:0};
    summaryV51.forEach(x=>Object.keys(z).forEach(k=>z[k]+=Number(x[k]||0)));return z;
  }
  function filtered(){
    const q=searchV51.trim().toLowerCase();
    return queueV51.filter(r=>{
      if(filterV51!=='all'&&filterV51!=='urgent'&&filterV51!=='reference'&&r.category!==filterV51)return false;
      if(filterV51==='urgent'&&!r.urgent)return false;
      if(filterV51==='reference'&&!r.reference_pending)return false;
      if(q&&![r.reference,r.customer,r.phone,r.city,r.advisor_name,r.channel,r.status,r.detail].join(' ').toLowerCase().includes(q))return false;
      return true;
    });
  }
  function statusLabel(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
  function taskOpen(id){
    const r=queueV51.find(x=>String(x.task_id)===String(id));if(!r)return;
    if(['venta','borrador'].includes(r.category)){if(typeof openOrderV20==='function')openOrderV20(r.sale_id||r.task_id);else if(typeof openOrder==='function')openOrder(r.sale_id||r.task_id);return}
    if(r.category==='recuperacion'){switchView('recovery');setTimeout(()=>typeof recoverySearchV46==='function'&&recoverySearchV46(r.reference||r.customer||''),100);return}
    if(r.category==='garantia'){switchView('guarantees');setTimeout(()=>{const i=document.getElementById('warrantySearchV48');if(i)i.value=r.reference||r.phone||r.customer||'';if(typeof searchWarrantyClientV48==='function')searchWarrantyClientV48()},100)}
  }
  window.openUnifiedTaskV51=taskOpen;
  window.setUnifiedFilterV51=v=>{filterV51=v;renderSalesV51()};
  window.setUnifiedSearchV51=v=>{searchV51=v;renderSalesV51();setTimeout(()=>document.getElementById('unifiedSearchV51')?.focus(),0)};

  async function load(force=false){
    if(loadingV51||typeof invictoSupabaseV12==='undefined')return;
    if(loadedV51&&!force)return;
    loadingV51=true;
    try{
      const [q,s]=await Promise.all([
        invictoSupabaseV12.rpc('get_advisor_work_queue_v50'),
        invictoSupabaseV12.rpc('get_advisor_task_summary_v51')
      ]);
      if(q.error)throw q.error;if(s.error)throw s.error;
      queueV51=q.data||[];summaryV51=s.data||[];loadedV51=true;
      window.INVICTO_CANONICAL_TASKS_V51={queue:queueV51,summary:summaryV51,loaded_at:new Date().toISOString()};
      updateBadges();
    }catch(e){console.error('unified v51',e);typeof toast==='function'&&toast('No se pudo actualizar la bandeja unificada: '+(e.message||e));}
    finally{loadingV51=false;refreshCurrent();}
  }
  window.loadUnifiedTasksV51=load;

  function updateBadges(){
    const c=counts();
    [['sales',c.venta+c.borrador+c.recuperacion+c.garantia],['recovery',c.recuperacion],['guarantees',c.garantia]].forEach(([view,n])=>{
      const b=document.querySelector(`.nav button[data-view="${view}"]`);if(!b)return;let x=b.querySelector('.badge');
      if(n>0){if(!x){x=document.createElement('span');x.className='badge';b.appendChild(x)}x.textContent=n}else x?.remove();
    });
  }
  function cardsHtml(s){return `<div class="work-cards-v50 unified-cards-v51">
    <button onclick="setUnifiedFilterV51('venta')"><small>VENTAS NUEVAS</small><b>${Number(s.ventas_nuevas||0)}</b></button>
    <button onclick="setUnifiedFilterV51('recuperacion')"><small>RECUPERACIONES</small><b>${Number(s.recuperaciones||0)}</b></button>
    <button onclick="setUnifiedFilterV51('borrador')"><small>BORRADORES</small><b>${Number(s.borradores||0)}</b></button>
    <button onclick="setUnifiedFilterV51('garantia')"><small>GARANTÍAS</small><b>${Number(s.garantias||0)}</b></button>
    <button class="total-v51" onclick="setUnifiedFilterV51('all')"><small>TOTAL POR GESTIONAR</small><b>${Number(s.total_tareas||0)}</b></button>
  </div>`}
  function teamHtml(){
    if(!isAdm())return '';
    return `<div class="panel unified-team-v51"><div class="panel-head"><div><h3>Carga oficial por asesor</h3><div class="muted">Misma fuente usada en Ventas del día, Inicio, Rendimiento e IA.</div></div></div><div class="table-wrap"><table><thead><tr><th>Asesor</th><th>Ventas nuevas</th><th>Recuperaciones</th><th>Borradores</th><th>Garantías</th><th>Total</th></tr></thead><tbody>${summaryV51.map(x=>`<tr><td><b>${E(x.advisor_name)}</b></td><td>${Number(x.ventas_nuevas||0)}</td><td>${Number(x.recuperaciones||0)}</td><td>${Number(x.borradores||0)}</td><td>${Number(x.garantias||0)}</td><td><b>${Number(x.total_tareas||0)}</b></td></tr>`).join('')}</tbody></table></div></div>`
  }
  function tabsHtml(){const c=counts(),tabs=[['all','Todas',c.total],['venta','Ventas nuevas',c.venta],['recuperacion','Recuperaciones',c.recuperacion],['borrador','Borradores',c.borrador],['garantia','Garantías',c.garantia],['urgent','Urgentes',c.urgent],['reference','Referencias pendientes',c.reference]];return `<div class="work-tabs-v50">${tabs.map(([k,l,n])=>`<button class="${filterV51===k?'active':''}" onclick="setUnifiedFilterV51('${k}')">${l}${n?` <span>${n}</span>`:''}</button>`).join('')}</div>`}
  function tableHtml(){const rows=filtered();return `<div class="table-wrap"><table class="work-table-v50"><thead><tr><th>PEDIDO / TAREA</th><th>CLIENTE</th><th>CIUDAD</th><th>ASESOR / CANAL</th><th>ESTADO</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${E(r.reference||labels[r.category])}</b><div class="task-kind-v50">${E(labels[r.category]||r.category)}${r.reference_pending?' · REFERENCIA PENDIENTE':''}${r.urgent?' · URGENTE':''}</div></td><td><b>${E(r.customer||'Sin nombre')}</b><div class="muted">${E(r.phone||'')}</div></td><td>${E(r.city||'—')}</td><td><b>${E(r.advisor_name||'Sin asignar')}</b><div class="muted">${E(r.channel||'')}</div></td><td><span class="task-status-v50">${E(statusLabel(r.status))}</span><div class="muted">${E(r.detail||'')}</div></td><td><button class="btn navy sm" onclick="openUnifiedTaskV51('${E(r.task_id)}')">Gestionar</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">No hay tareas en este filtro.</td></tr>'}</tbody></table></div>`}

  function renderSalesV51(){
    const host=document.getElementById('view-sales');if(!host)return;
    if(!loadedV51&&!loadingV51)setTimeout(()=>load(false),0);
    const s=mineSummary();
    host.innerHTML=`<div class="page-title"><div><div class="eyebrow">VENTAS DEL DÍA · FUENTE ÚNICA</div><h1>${isAdv()?'Mi panel de gestión':'Panel de gestión del equipo'}</h1><p>Estos números son los oficiales del sistema y son los mismos que usa la IA.</p></div>${isAdm()?'<button class="btn cyan" onclick="newOrder()">+ Nueva venta manual</button>':''}</div>
    ${cardsHtml(s)}${teamHtml()}
    <div class="work-panel-v50" style="margin-top:14px"><div class="work-toolbar-v50">${tabsHtml()}<div class="work-search-wrap-v50"><input id="unifiedSearchV51" value="${E(searchV51)}" oninput="setUnifiedSearchV51(this.value)" placeholder="Buscar cliente, pedido, guía o ciudad…"><button onclick="loadUnifiedTasksV51(true)">↻</button></div></div>${loadingV51&&!loadedV51?'<div class="panel-body muted">Cargando datos oficiales…</div>':tableHtml()}</div>`;
  }
  window.renderSales=renderSalesV51;

  const homeBase=window.renderHome;
  window.renderHome=function(){
    if(typeof homeBase==='function')homeBase();
    const host=document.getElementById('view-home');if(!host)return;if(!loadedV51&&!loadingV51)setTimeout(()=>load(false),0);
    const s=mineSummary();
    let box=document.getElementById('canonicalSummaryV51');if(!box){box=document.createElement('div');box.id='canonicalSummaryV51';host.prepend(box)}
    box.innerHTML=`<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h3>Tareas oficiales de hoy</h3><div class="muted">Única fuente de verdad para todo INVICTO OPS.</div></div><div class="spacer"></div><button class="btn navy sm" onclick="switchView('sales')">Gestionar</button></div><div class="panel-body">${cardsHtml(s)}</div></div>`;
  };

  function injectStrip(view){
    const host=document.getElementById('view-'+view);if(!host||host.querySelector('.canonical-strip-v51'))return;
    const s=mineSummary(),d=document.createElement('div');d.className='canonical-strip-v51 panel';d.style.marginBottom='14px';d.innerHTML=`<div class="panel-head"><div><b>Resumen operativo oficial</b><div class="muted">Ventas ${Number(s.ventas_nuevas||0)} · Recuperaciones ${Number(s.recuperaciones||0)} · Borradores ${Number(s.borradores||0)} · Garantías ${Number(s.garantias||0)}</div></div><div class="spacer"></div><span class="tag blue">${Number(s.total_tareas||0)} tareas</span></div>`;host.prepend(d);
  }
  const switchBase=window.switchView;
  window.switchView=function(view,initial=false){const r=switchBase.apply(this,arguments);setTimeout(()=>{if(['reports','team','performance'].includes(view))injectStrip(view)},0);return r};

  function refreshCurrent(){
    if(typeof currentView==='undefined')return;
    if(currentView==='sales')renderSalesV51();else if(currentView==='home')window.renderHome();else if(['reports','team','performance'].includes(currentView)){const host=document.getElementById('view-'+currentView);host?.querySelector('.canonical-strip-v51')?.remove();injectStrip(currentView)}
  }

  setInterval(()=>{if(typeof session!=='undefined'&&session&&document.visibilityState==='visible')load(true)},60000);
  setTimeout(()=>{if(typeof session!=='undefined'&&session)load(true)},700);
  console.info('INVICTO OPS v51 · estadísticas unificadas activas');
})();