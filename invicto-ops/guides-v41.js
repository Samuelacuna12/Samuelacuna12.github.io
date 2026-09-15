/* INVICTO OPS v41 · dashboard independiente de guías por asesor */
(function(){
  let guideFilterV41='pendiente';
  let guideDataV41=null;
  let guideLoadingV41=false;
  let guideSearchV41='';
  let guideRefreshTimerV41=null;

  const CARRIERS_V41=[...new Set([
    ...(typeof TRANSPORTS!=='undefined'?TRANSPORTS:[]),
    'Interrapidísimo','Servientrega','Envia','Coordinadora','Go Envíos','Domina Entrega'
  ].filter(Boolean))];

  function esc41(v=''){return typeof esc==='function'?esc(v):String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function money41(v){return typeof money==='function'?money(v):new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v||0));}
  function date41(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
  function canUse41(){return typeof session!=='undefined'&&session&&['Vendedor','Administrador','Gerente'].includes(session.role);}
  function canAdmin41(){return typeof session!=='undefined'&&session&&['Administrador','Gerente'].includes(session.role);}
  function current41(){try{return typeof currentView!=='undefined'?currentView:'';}catch(e){return '';}}
  function setCurrent41(v){try{currentView=v;}catch(e){}}

  function carriers41(selected=''){
    const arr=[...new Set([selected,...CARRIERS_V41].filter(Boolean))];
    return `<option value="">Transportadora</option>${arr.map(x=>`<option value="${esc41(x)}" ${x===selected?'selected':''}>${esc41(x)}</option>`).join('')}`;
  }

  function patchShell41(){
    if(!canUse41())return;
    const nav=document.querySelector('.sidebar .nav');
    if(nav&&!nav.querySelector('[data-view="guides-advisor"]')){
      const ref=nav.querySelector('[data-view="cuts"]');
      const b=document.createElement('button');
      b.dataset.view='guides-advisor';
      b.className=current41()==='guides-advisor'?'active':'';
      b.setAttribute('onclick',"switchView('guides-advisor')");
      b.innerHTML=`Guías asesores <span id="guideNavBadgeV41" class="badge" style="display:none"></span>`;
      if(ref)nav.insertBefore(b,ref);else nav.appendChild(b);
    }
    const content=document.querySelector('.content');
    if(content&&!document.getElementById('view-guides-advisor')){
      const sec=document.createElement('section');sec.id='view-guides-advisor';sec.className='view';content.appendChild(sec);
    }
    refreshGuideBadgeV41();
  }

  const baseRenderShell41=window.renderShell;
  window.renderShell=function(){
    baseRenderShell41();
    patchShell41();
  };

  const baseSwitchView41=window.switchView;
  window.switchView=function(view,initial=false){
    if(view!=='guides-advisor')return baseSwitchView41(view,initial);
    setCurrent41(view);
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    const target=document.getElementById('view-guides-advisor');if(target)target.classList.add('active');
    const top=document.getElementById('topTitle');if(top)top.textContent='Guías asesores';
    renderGuideDashboardV41();
    loadGuideDashboardV41(false);
    if(!initial&&innerWidth<800)document.getElementById('sidebar')?.classList.remove('open');
  };

  function summaryCards41(d){
    const s=d?.summary||{};
    return `<div class="guide-kpis-v41">
      <div><small>Pendientes de guía</small><b>${Number(s.pending||0)}</b><span>por gestionar</span></div>
      <div><small>Guías enviadas</small><b>${Number(s.sent||0)}</b><span>registradas</span></div>
      <div><small>Total en cola</small><b>${Number(s.total||0)}</b><span>dashboard independiente</span></div>
    </div>`;
  }

  function team41(d){
    if(!d?.can_view_all)return '';
    const rows=d.team||[];
    return `<div class="guide-team-v41"><div class="guide-section-title-v41">Distribución por asesor</div><div class="guide-team-grid-v41">${rows.map(r=>`<div class="guide-team-card-v41"><div><b>${esc41(r.advisor)}</b><small>${Number(r.total||0)} asignadas</small></div><strong>${Number(r.pending||0)}</strong><span>pendientes</span><em>${Number(r.sent||0)} enviadas</em></div>`).join('')}</div></div>`;
  }

  function filteredTasks41(){
    const rows=guideDataV41?.tasks||[];
    const q=guideSearchV41.trim().toLowerCase();if(!q)return rows;
    return rows.filter(r=>[r.order,r.customer_name,r.customer_phone,r.customer_city,r.customer_department,r.guide_advisor,r.tracking_number,r.carrier].some(v=>String(v||'').toLowerCase().includes(q)));
  }

  function advisorSelect41(r,d){
    if(!d?.can_view_all||r.guide_status!=='pendiente_guia')return `<b>${esc41(r.guide_advisor||'—')}</b>`;
    return `<select class="guide-select-v41" onchange="reassignGuideV41('${r.task_id}',this.value)">${(d.team||[]).map(a=>`<option value="${a.advisor_id}" ${String(a.advisor_id)===String(r.assigned_to)?'selected':''}>${esc41(a.advisor)}</option>`).join('')}</select>`;
  }

  function taskRow41(r,d){
    const sent=r.guide_status==='guia_enviada';
    const status=sent?'<span class="guide-status-v41 sent">GUÍA ENVIADA</span>':'<span class="guide-status-v41 pending">PENDIENTE DE GUÍA</span>';
    const action=sent
      ? `<div class="guide-sent-v41"><b>${esc41(r.tracking_number||'—')}</b><span>${esc41(r.carrier||'—')}</span><small>${r.sent_by_name?`Enviada por ${esc41(r.sent_by_name)} · `:''}${date41(r.sent_at)}</small></div>`
      : `<div class="guide-entry-v41"><input id="guideTrack-${r.task_id}" class="guide-input-v41" placeholder="Número de guía" autocomplete="off"><select id="guideCarrier-${r.task_id}" class="guide-select-v41">${carriers41(r.carrier||'')}</select><button class="btn cyan" onclick="submitGuideV41('${r.task_id}')">Marcar guía enviada</button></div>`;
    return `<tr>
      <td><div class="guide-order-v41"><b>${esc41(r.order||'—')}</b><small>${esc41(r.commercial_date||'')} · ${date41(r.received_at)}</small></div></td>
      <td><b>${esc41(r.customer_name||'Sin nombre')}</b><small>${esc41(r.customer_phone||'')}</small></td>
      <td><span>${esc41(r.customer_city||'—')}</span><small>${esc41(r.customer_department||'')}</small></td>
      <td><span>${Number(r.quantity||0)} uds.</span><small>${money41(r.total_price||0)}</small></td>
      <td>${advisorSelect41(r,d)}</td>
      <td>${status}</td>
      <td>${action}</td>
    </tr>`;
  }

  function table41(d){
    const rows=filteredTasks41();
    return `<div class="guide-table-panel-v41">
      <div class="guide-table-head-v41"><div><h3>${guideFilterV41==='enviada'?'Guías enviadas':guideFilterV41==='todas'?'Todas las ventas':'Ventas pendientes de guía'}</h3><p>${rows.length} resultados visibles</p></div><div class="spacer"></div><input id="guideSearchV41" class="guide-search-v41" value="${esc41(guideSearchV41)}" placeholder="Buscar pedido, cliente, teléfono…" oninput="guideSearchChangeV41(this.value)"></div>
      <div class="guide-table-wrap-v41"><table class="guide-table-v41"><thead><tr><th>Venta</th><th>Cliente</th><th>Ciudad</th><th>Pedido</th><th>Asesor de guía</th><th>Estado</th><th>Guía</th></tr></thead><tbody>${rows.map(r=>taskRow41(r,d)).join('')||'<tr><td colspan="7"><div class="guide-empty-v41">No hay ventas en este filtro.</div></td></tr>'}</tbody></table></div>
    </div>`;
  }

  window.renderGuideDashboardV41=function(){
    const host=document.getElementById('view-guides-advisor');if(!host)return;
    if(guideLoadingV41&&!guideDataV41){host.innerHTML='<div class="guide-loading-v41">Cargando cola de guías…</div>';return;}
    const d=guideDataV41;
    host.innerHTML=`<div class="guide-page-v41">
      <div class="guide-hero-v41"><div><div class="eyebrow">LOGÍSTICA · COLA INDEPENDIENTE</div><h1>Guías de asesores</h1><p>${d?.can_view_all?'Controla todas las ventas asignadas para generación y envío de guía.':'Aquí aparecen únicamente las ventas que te fueron asignadas para registrar guía.'}</p></div><div class="guide-hero-note-v41"><small>ESTADO OPERATIVO</small><b>${Number(d?.summary?.pending||0)} pendientes</b><span>La asignación de este tablero no modifica ventas ni rendimiento.</span></div></div>
      ${d?summaryCards41(d):''}
      ${d?team41(d):''}
      <div class="guide-tabs-v41"><button class="${guideFilterV41==='pendiente'?'active':''}" onclick="setGuideFilterV41('pendiente')">Pendiente de guía</button><button class="${guideFilterV41==='enviada'?'active':''}" onclick="setGuideFilterV41('enviada')">Guía enviada</button><button class="${guideFilterV41==='todas'?'active':''}" onclick="setGuideFilterV41('todas')">Todas</button><div class="spacer"></div><button class="btn light" onclick="loadGuideDashboardV41(true)">Actualizar</button></div>
      ${d?table41(d):'<div class="guide-loading-v41">Cargando cola de guías…</div>'}
    </div>`;
  };

  window.loadGuideDashboardV41=async function(force=false){
    if(guideLoadingV41||!canUse41()||!window.invictoSupabaseV12)return;
    guideLoadingV41=true;if(current41()==='guides-advisor')renderGuideDashboardV41();
    try{
      const {data,error}=await invictoSupabaseV12.rpc('get_guide_dashboard_v41',{p_filter:guideFilterV41});
      if(error)throw error;guideDataV41=data||{};updateBadge41();
    }catch(e){console.error('guide dashboard v41',e);if(typeof toast==='function')toast('No se pudo cargar Guías: '+(e?.message||e));}
    finally{guideLoadingV41=false;if(current41()==='guides-advisor')renderGuideDashboardV41();}
  };

  window.setGuideFilterV41=function(v){guideFilterV41=v;guideDataV41=null;guideSearchV41='';renderGuideDashboardV41();loadGuideDashboardV41(true);};
  window.guideSearchChangeV41=function(v){guideSearchV41=v;const d=guideDataV41;if(d)renderGuideDashboardV41();setTimeout(()=>{const i=document.getElementById('guideSearchV41');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},0);};

  window.submitGuideV41=async function(taskId){
    const tracking=document.getElementById('guideTrack-'+taskId)?.value?.trim()||'';
    const carrier=document.getElementById('guideCarrier-'+taskId)?.value||'';
    if(!tracking)return toast('Escribe el número de guía');
    if(!carrier)return toast('Selecciona la transportadora');
    try{
      toast('Registrando guía…');
      const {data,error}=await invictoSupabaseV12.rpc('submit_guide_v41',{p_task_id:taskId,p_tracking_number:tracking,p_carrier:carrier});
      if(error)throw error;if(!data?.ok)throw new Error('No se pudo registrar la guía');
      guideDataV41=null;await loadGuideDashboardV41(true);toast('Guía enviada correctamente');
    }catch(e){console.error(e);toast('No se guardó: '+(e?.message||e));}
  };

  window.reassignGuideV41=async function(taskId,advisorId){
    if(!advisorId)return;
    try{
      const {data,error}=await invictoSupabaseV12.rpc('reassign_guide_task_v41',{p_task_id:taskId,p_advisor_id:advisorId});
      if(error)throw error;if(!data?.ok)throw new Error('No se pudo reasignar');
      guideDataV41=null;await loadGuideDashboardV41(true);toast('Guía reasignada');
    }catch(e){console.error(e);toast('No se reasignó: '+(e?.message||e));}
  };

  function updateBadge41(){
    const b=document.getElementById('guideNavBadgeV41');if(!b)return;
    const n=Number(guideDataV41?.summary?.pending||0);b.textContent=n;b.style.display=n?'inline-flex':'none';
  }
  async function refreshGuideBadgeV41(){
    if(!canUse41()||!window.invictoSupabaseV12)return;
    try{const {data,error}=await invictoSupabaseV12.rpc('get_guide_dashboard_v41',{p_filter:'pendiente'});if(error)throw error;if(guideFilterV41==='pendiente'&&!guideDataV41)guideDataV41=data;const b=document.getElementById('guideNavBadgeV41');if(b){const n=Number(data?.summary?.pending||0);b.textContent=n;b.style.display=n?'inline-flex':'none';}}catch(e){console.warn('guide badge v41',e);}
  }

  guideRefreshTimerV41=setInterval(()=>{if(current41()==='guides-advisor')loadGuideDashboardV41(true);else refreshGuideBadgeV41();},60000);
  setTimeout(()=>{patchShell41();refreshGuideBadgeV41();},1200);
  console.info('INVICTO OPS v41 · dashboard independiente de guías activo');
})();