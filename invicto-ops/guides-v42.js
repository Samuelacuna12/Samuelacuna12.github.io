/* INVICTO OPS v42 · guías solo desde confirmación + resultados operativos */
(function(){
  let filter42='pendiente';
  let data42=null;
  let loading42=false;
  let search42='';
  let timer42=null;

  const CARRIERS42=[...new Set([
    ...(typeof TRANSPORTS!=='undefined'?TRANSPORTS:[]),
    'Interrapidísimo','Servientrega','Envia','Coordinadora','Go Envíos','Domina Entrega'
  ].filter(Boolean))];

  function esc42(v=''){return typeof esc==='function'?esc(v):String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function money42(v){return typeof money==='function'?money(v):new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v||0));}
  function canUse42(){return typeof session!=='undefined'&&session&&['Vendedor','Administrador','Gerente'].includes(session.role);}
  function isAdmin42(){return typeof session!=='undefined'&&session&&['Administrador','Gerente'].includes(session.role);}
  function current42(){try{return typeof currentView!=='undefined'?currentView:'';}catch(e){return '';}}
  function setCurrent42(v){try{currentView=v;}catch(e){}}
  function date42(v,withTime=true){
    if(!v)return '—';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);
    return d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',...(withTime?{hour:'2-digit',minute:'2-digit'}:{year:'numeric'})});
  }
  function day42(v){
    if(!v)return '—';const [y,m,d]=String(v).slice(0,10).split('-').map(Number);
    if(!y)return String(v);return new Intl.DateTimeFormat('es-CO',{weekday:'short',day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));
  }
  function carriers42(selected=''){
    const arr=[...new Set([selected,...CARRIERS42].filter(Boolean))];
    return `<option value="">Transportadora</option>${arr.map(x=>`<option value="${esc42(x)}" ${x===selected?'selected':''}>${esc42(x)}</option>`).join('')}`;
  }
  function status42(r){
    if(r.guide_status==='guia_enviada')return '<span class="guide42-status sent">GUÍA ENVIADA</span>';
    if(r.guide_status==='cliente_no_confirmado')return '<span class="guide42-status waiting">CLIENTE AÚN NO CONFIRMADO</span>';
    if(r.guide_status==='error_envio_guia')return '<span class="guide42-status error">ERROR EN ENVÍO DE GUÍA</span>';
    return '<span class="guide42-status pending">PENDIENTE DE GUÍA</span>';
  }
  function saleState42(r){
    return r.sale_status==='confirmada'
      ? '<span class="guide42-sale confirmed">VENTA CONFIRMADA</span>'
      : `<span class="guide42-sale unconfirmed">${esc42(String(r.sale_status||'sin confirmar').replaceAll('_',' ').toUpperCase())}</span>`;
  }

  function patchShell42(){
    if(!canUse42())return;
    const nav=document.querySelector('.sidebar .nav');
    if(nav){
      let b=nav.querySelector('[data-view="guides-advisor"]');
      if(!b){
        const ref=nav.querySelector('[data-view="cuts"]');b=document.createElement('button');b.dataset.view='guides-advisor';b.setAttribute('onclick',"switchView('guides-advisor')");
        b.innerHTML='Guías asesores <span id="guideNavBadgeV41" class="badge" style="display:none"></span>';
        if(ref)nav.insertBefore(b,ref);else nav.appendChild(b);
      }
      b.classList.toggle('active',current42()==='guides-advisor');
    }
    const content=document.querySelector('.content');
    if(content&&!document.getElementById('view-guides-advisor')){const s=document.createElement('section');s.id='view-guides-advisor';s.className='view';content.appendChild(s);}
  }

  const renderShellBase42=window.renderShell;
  window.renderShell=function(){renderShellBase42();patchShell42();refreshBadge42();};

  const switchBase42=window.switchView;
  window.switchView=function(view,initial=false){
    if(view!=='guides-advisor')return switchBase42(view,initial);
    setCurrent42(view);patchShell42();
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    const target=document.getElementById('view-guides-advisor');if(target)target.classList.add('active');
    const top=document.getElementById('topTitle');if(top)top.textContent='Guías asesores';
    render42();load42(false);
    if(!initial&&innerWidth<800)document.getElementById('sidebar')?.classList.remove('open');
  };

  function summary42(d){
    const s=d?.summary||{};
    return `<div class="guide42-kpis">
      <div><small>Por gestionar hoy</small><b>${Number(s.actionable||0)}</b><span>cola activa</span></div>
      <div><small>Pendiente de guía</small><b>${Number(s.pending||0)}</b><span>listas para procesar</span></div>
      <div class="warn"><small>Cliente no confirmado</small><b>${Number(s.unconfirmed||0)}</b><span>requieren revisión</span></div>
      <div class="danger"><small>Errores de guía</small><b>${Number(s.errors||0)}</b><span>incidencias abiertas</span></div>
      <div><small>Para próximo día</small><b>${Number(s.scheduled||0)}</b><span>confirmadas, aún no vencen</span></div>
      <div class="sent"><small>Guías enviadas</small><b>${Number(s.sent||0)}</b><span>completadas</span></div>
    </div>`;
  }

  function team42(d){
    if(!d?.can_view_all)return '';
    return `<div class="guide42-team"><div class="guide42-section-title">Carga de guías por asesor</div><div class="guide42-team-grid">${(d.team||[]).map(r=>`<div class="guide42-team-card"><div><b>${esc42(r.advisor)}</b><small>${Number(r.total||0)} tareas totales</small></div><div class="guide42-team-stats"><span><strong>${Number(r.pending||0)}</strong> guía</span><span><strong>${Number(r.unconfirmed||0)}</strong> no conf.</span><span class="err"><strong>${Number(r.errors||0)}</strong> error</span><span><strong>${Number(r.scheduled||0)}</strong> próximas</span><span class="ok"><strong>${Number(r.sent||0)}</strong> enviadas</span></div></div>`).join('')}</div></div>`;
  }

  function filtered42(){
    const rows=data42?.tasks||[],q=search42.trim().toLowerCase();if(!q)return rows;
    return rows.filter(r=>[r.order,r.customer_name,r.customer_phone,r.customer_city,r.customer_department,r.guide_advisor,r.tracking_number,r.carrier,r.result_note,r.sale_status].some(v=>String(v||'').toLowerCase().includes(q)));
  }

  function advisor42(r,d){
    if(!d?.can_view_all||r.guide_status==='guia_enviada')return `<b>${esc42(r.guide_advisor||'—')}</b>`;
    return `<select class="guide42-select" onchange="reassignGuideV42('${r.task_id}',this.value)">${(d.team||[]).map(a=>`<option value="${a.advisor_id}" ${String(a.advisor_id)===String(r.assigned_to)?'selected':''}>${esc42(a.advisor)}</option>`).join('')}</select>`;
  }

  function action42(r){
    if(r.guide_status==='guia_enviada'){
      return `<div class="guide42-sent-detail"><b>${esc42(r.tracking_number||'—')}</b><span>${esc42(r.carrier||'—')}</span><small>${r.sent_by_name?`Por ${esc42(r.sent_by_name)} · `:''}${date42(r.sent_at)}</small>${r.result_note?`<em>${esc42(r.result_note)}</em>`:''}</div>`;
    }
    const note=r.result_note?esc42(r.result_note):'';
    return `<div class="guide42-action">
      ${r.guide_status!=='pendiente_guia'&&r.result_note?`<div class="guide42-last-note"><b>Último resultado:</b> ${esc42(r.result_note)}${r.result_at?` · ${date42(r.result_at)}`:''}</div>`:''}
      <div class="guide42-fields">
        <input id="g42Track-${r.task_id}" class="guide42-input" placeholder="Número de guía" value="${esc42(r.tracking_number||'')}" autocomplete="off">
        <select id="g42Carrier-${r.task_id}" class="guide42-select">${carriers42(r.carrier||'')}</select>
        <input id="g42Note-${r.task_id}" class="guide42-input note" placeholder="Nota / motivo del error" value="${note}">
      </div>
      <div class="guide42-actions">
        <button class="btn cyan sm" onclick="guideResultV42('${r.task_id}','guia_enviada')">✓ Se envió guía</button>
        <button class="btn light sm" onclick="guideResultV42('${r.task_id}','cliente_no_confirmado')">Cliente aún no confirmado</button>
        <button class="btn light sm guide42-error-btn" onclick="guideResultV42('${r.task_id}','error_envio_guia')">Error en envío de guía</button>
      </div>
    </div>`;
  }

  function row42(r,d){
    const future=String(r.available_on||'')>String(d.today||'');
    return `<tr class="${r.guide_status==='error_envio_guia'?'guide42-row-error':''}">
      <td><div class="guide42-order"><b>${esc42(r.order||'—')}</b><small>${esc42(r.commercial_date||'')} · ${date42(r.received_at)}</small>${future?`<span class="guide42-next">Disponible ${esc42(day42(r.available_on))}</span>`:''}</div></td>
      <td><b>${esc42(r.customer_name||'Sin nombre')}</b><small>${esc42(r.customer_phone||'')}</small></td>
      <td><span>${esc42(r.customer_city||'—')}</span><small>${esc42(r.customer_department||'')}</small></td>
      <td><span>${Number(r.quantity||0)} uds.</span><small>${money42(r.total_price||0)}</small></td>
      <td><div class="guide42-status-stack">${saleState42(r)}${status42(r)}</div></td>
      <td>${advisor42(r,d)}</td>
      <td>${action42(r)}</td>
    </tr>`;
  }

  function table42(d){
    const rows=filtered42();
    const title=filter42==='enviada'?'Guías enviadas':filter42==='todas'?'Todas las tareas de guía':'Tareas que deben gestionarse';
    return `<div class="guide42-panel"><div class="guide42-table-head"><div><h3>${title}</h3><p>${rows.length} resultados visibles</p></div><div class="spacer"></div><input id="guideSearchV42" class="guide42-search" value="${esc42(search42)}" placeholder="Buscar venta, cliente, teléfono…" oninput="guideSearchV42(this.value)"></div><div class="guide42-table-wrap"><table class="guide42-table"><thead><tr><th>Venta</th><th>Cliente</th><th>Ciudad</th><th>Pedido</th><th>Estado</th><th>Asesor guía</th><th>Gestión de guía</th></tr></thead><tbody>${rows.map(r=>row42(r,d)).join('')||'<tr><td colspan="7"><div class="guide42-empty">No hay tareas en este filtro.</div></td></tr>'}</tbody></table></div></div>`;
  }

  function render42(){
    const host=document.getElementById('view-guides-advisor');if(!host)return;
    if(loading42&&!data42){host.innerHTML='<div class="guide42-loading">Cargando cola de guías…</div>';return;}
    const d=data42;
    host.innerHTML=`<div class="guide42-page">
      <div class="guide42-hero"><div><div class="eyebrow">LOGÍSTICA · FLUJO DE GUÍAS</div><h1>Guías de asesores</h1><p>Una venta confirmada entra automáticamente a esta cola y queda disponible para gestionar al siguiente día hábil.</p></div><div class="guide42-rule"><small>REGLA AUTOMÁTICA</small><b>Confirmada hoy → guía mañana</b><span>Esta asignación es independiente del asesor comercial.</span></div></div>
      ${d?summary42(d):''}${d?team42(d):''}
      <div class="guide42-tabs"><button class="${filter42==='pendiente'?'active':''}" onclick="setGuideFilterV42('pendiente')">Por gestionar</button><button class="${filter42==='enviada'?'active':''}" onclick="setGuideFilterV42('enviada')">Guías enviadas</button><button class="${filter42==='todas'?'active':''}" onclick="setGuideFilterV42('todas')">Todas / próximas</button><div class="spacer"></div><button class="btn light" onclick="loadGuideDashboardV42(true)">Actualizar</button></div>
      ${d?table42(d):'<div class="guide42-loading">Cargando cola de guías…</div>'}
    </div>`;
  }
  window.renderGuideDashboardV42=render42;

  async function load42(force=false){
    if(loading42||!canUse42()||typeof invictoSupabaseV12==='undefined')return;
    loading42=true;if(current42()==='guides-advisor')render42();
    try{
      const {data,error}=await invictoSupabaseV12.rpc('get_guide_dashboard_v42',{p_filter:filter42});
      if(error)throw error;data42=data||{};updateBadge42();
    }catch(e){console.error('guide dashboard v42',e);if(typeof toast==='function')toast('No se pudo cargar Guías: '+(e?.message||e));}
    finally{loading42=false;if(current42()==='guides-advisor')render42();}
  }
  window.loadGuideDashboardV42=load42;
  window.setGuideFilterV42=function(v){filter42=v;data42=null;search42='';render42();load42(true);};
  window.guideSearchV42=function(v){search42=v;render42();setTimeout(()=>{const i=document.getElementById('guideSearchV42');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},0);};

  window.guideResultV42=async function(taskId,result){
    const tracking=document.getElementById('g42Track-'+taskId)?.value?.trim()||'';
    const carrier=document.getElementById('g42Carrier-'+taskId)?.value||'';
    const note=document.getElementById('g42Note-'+taskId)?.value?.trim()||'';
    if(result==='guia_enviada'&&!tracking)return toast('Escribe el número de guía');
    if(result==='guia_enviada'&&!carrier)return toast('Selecciona la transportadora');
    if(result==='error_envio_guia'&&!note)return toast('Describe el error de envío de guía');
    try{
      const labels={guia_enviada:'Guardando guía…',cliente_no_confirmado:'Aplazando para revisión…',error_envio_guia:'Registrando incidencia…'};
      toast(labels[result]||'Guardando…');
      const {data,error}=await invictoSupabaseV12.rpc('set_guide_task_result_v42',{p_task_id:taskId,p_result:result,p_tracking_number:tracking||null,p_carrier:carrier||null,p_note:note||null});
      if(error)throw error;if(!data?.ok)throw new Error('No se pudo guardar el resultado');
      data42=null;await load42(true);
      const done={guia_enviada:'Guía enviada correctamente',cliente_no_confirmado:'Queda para revisar el próximo día hábil',error_envio_guia:'Error registrado; sigue pendiente'};
      toast(done[result]||'Resultado guardado');
    }catch(e){console.error(e);toast('No se guardó: '+(e?.message||e));}
  };

  window.reassignGuideV42=async function(taskId,advisorId){
    if(!advisorId||!isAdmin42())return;
    try{const {data,error}=await invictoSupabaseV12.rpc('reassign_guide_task_v41',{p_task_id:taskId,p_advisor_id:advisorId});if(error)throw error;if(!data?.ok)throw new Error('No se pudo reasignar');data42=null;await load42(true);toast('Tarea de guía reasignada');}catch(e){console.error(e);toast('No se reasignó: '+(e?.message||e));}
  };

  function updateBadge42(){
    const b=document.getElementById('guideNavBadgeV41');if(!b)return;const n=Number(data42?.summary?.actionable||0);b.textContent=n;b.style.display=n?'inline-flex':'none';
  }
  async function refreshBadge42(){
    if(!canUse42()||typeof invictoSupabaseV12==='undefined')return;
    try{const {data,error}=await invictoSupabaseV12.rpc('get_guide_dashboard_v42',{p_filter:'pendiente'});if(error)throw error;const b=document.getElementById('guideNavBadgeV41');if(b){const n=Number(data?.summary?.actionable||0);b.textContent=n;b.style.display=n?'inline-flex':'none';}}catch(e){console.warn('guide badge v42',e);}
  }

  patchShell42();
  setTimeout(refreshBadge42,1600);
  if(timer42)clearInterval(timer42);timer42=setInterval(()=>{if(current42()==='guides-advisor')load42(true);else refreshBadge42();},60000);
  console.info('INVICTO OPS v42 · guía al día siguiente + resultados operativos activo');
})();