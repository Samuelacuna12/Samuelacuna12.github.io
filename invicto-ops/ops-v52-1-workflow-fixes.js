/* INVICTO OPS v52.1 · estabilidad de gestión, seguimiento 3h y recuperación completa */
(function(){
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})};
  const cash=v=>typeof money==='function'?money(v):Number(v||0).toLocaleString('es-CO');
  const admin=()=>typeof isAdmin==='function'&&isAdmin();
  const advisor=()=>typeof isAdvisor==='function'&&isAdvisor();

  // 1) CRÍTICO: abrir una venta por UUID nunca debe convertir una edición en una venta nueva.
  // El módulo legado guarda usando state.sales[].id; la bandeja canónica abre usando dbId UUID.
  function patchOpenOrder(){
    const base=window.openOrderV20;
    if(typeof base!=='function'||base.__v521)return;
    const wrapped=function(id){
      if(id!=null && typeof state!=='undefined' && Array.isArray(state?.sales)){
        const s=state.sales.find(x=>String(x.id)===String(id)||String(x.dbId)===String(id));
        if(s) id=s.id;
      }
      return base.call(this,id);
    };
    wrapped.__v521=true;
    window.openOrderV20=wrapped;
    window.openOrder=wrapped;
  }

  // 2) En el panel del asesor debe verse claramente que la bandeja es "MÍOS".
  function injectMine(){
    if(!advisor())return;
    const host=document.getElementById('view-sales'); if(!host)return;
    if(host.querySelector('[data-mine-v521]'))return;
    const hero=host.querySelector('.canon-hero-v51');
    if(!hero)return;
    const total=Number(window.opsCanonicalV51?.data?.totals?.total_tareas||window.opsCanonicalV51?.data?.advisors?.[0]?.total_tareas||0);
    const pill=document.createElement('div');
    pill.dataset.mineV521='1';
    pill.style.cssText='display:inline-flex;align-items:center;gap:7px;margin-top:8px;padding:7px 11px;border-radius:999px;background:#071229;color:#fff;font-size:11px;font-weight:900;letter-spacing:.03em';
    pill.innerHTML=`<span style="width:7px;height:7px;border-radius:50%;background:#12d6b5;display:inline-block"></span>MÍOS · ${total}`;
    hero.querySelector('div')?.appendChild(pill);
  }
  function patchSalesRenderer(){
    const base=window.renderSalesV51;
    if(typeof base!=='function'||base.__v521)return;
    const wrapped=function(){const r=base.apply(this,arguments);setTimeout(()=>{patchOpenOrder();injectMine()},0);return r};
    wrapped.__v521=true; window.renderSalesV51=wrapped;
  }

  // 3) Recuperación: acciones completas, notas, tramitada/cancelada y seguimiento que desaparece hasta vencer.
  const R={rows:[],loading:false,filter:'pendientes',search:''};
  const terminal=new Set(['recuperada','cerrada','tramitada','cancelada']);
  function due(r){return !r.next_followup_at||new Date(r.next_followup_at).getTime()<=Date.now()}
  function recoveryFiltered(){
    const q=R.search.trim().toLowerCase();
    return R.rows.filter(r=>{
      if(R.filter==='pendientes' && !(r.status==='pendiente'||(r.status==='seguimiento'&&due(r))))return false;
      if(R.filter==='programadas' && !(r.status==='seguimiento'&&!due(r)))return false;
      if(R.filter==='recuperadas' && r.status!=='recuperada')return false;
      if(R.filter==='tramitadas' && r.status!=='tramitada')return false;
      if(R.filter==='canceladas' && r.status!=='cancelada')return false;
      if(R.filter==='cerradas' && r.status!=='cerrada')return false;
      if(q && ![r.source_id,r.customer_name,r.customer_phone,r.city,r.department,r.advisor_name,r.source_channel,r.source_order_status,r.notes].some(x=>String(x||'').toLowerCase().includes(q)))return false;
      return true;
    });
  }
  function recoveryStatus(r){
    const m={pendiente:['amber','PENDIENTE'],seguimiento:['blue',due(r)?'SEGUIMIENTO VENCIDO':'PROGRAMADA'],recuperada:['green','RECUPERADA'],tramitada:['green','YA TRAMITADA'],cancelada:['red','CLIENTE CANCELA'],cerrada:['gray','CERRADA']};
    const x=m[r.status]||['gray',String(r.status||'').toUpperCase()];return `<span class="tag ${x[0]}">${E(x[1])}</span>`;
  }
  function recoveryActions(r){
    if(terminal.has(r.status))return '<span class="muted">Finalizada</span>';
    return `<div style="display:flex;gap:5px;flex-wrap:wrap">
      ${r.customer_phone?`<button class="btn light sm" onclick="recoveryWhatsAppV521('${E(r.customer_phone)}')">WhatsApp</button>`:''}
      <button class="btn light sm" onclick="recoveryActionV521('${r.id}','no_contesta')">No contestó</button>
      <button class="btn light sm" onclick="recoveryActionV521('${r.id}','programar')">Programar</button>
      <button class="btn light sm" onclick="recoveryActionV521('${r.id}','nota')">+ Nota</button>
      <button class="btn cyan sm" onclick="recoveryActionV521('${r.id}','recuperada')">Recuperada</button>
      <button class="btn navy sm" onclick="recoveryActionV521('${r.id}','tramitada')">Ya tramitada</button>
      <button class="btn danger-lite sm" onclick="recoveryActionV521('${r.id}','cancelada')">Cliente cancela</button>
    </div>`;
  }
  function paintRecovery(){
    const host=document.getElementById('view-recovery');if(!host)return;
    const shown=recoveryFiltered();
    const pending=R.rows.filter(r=>r.status==='pendiente'||(r.status==='seguimiento'&&due(r))).length;
    const programmed=R.rows.filter(r=>r.status==='seguimiento'&&!due(r)).length;
    const recovered=R.rows.filter(r=>r.status==='recuperada').length;
    host.innerHTML=`<div class="page-title"><div><div class="eyebrow">RECUPERACIÓN · GESTIÓN INDIVIDUAL</div><h1>Recuperación</h1><p>No contestó vuelve a la cola solo al cumplirse 3 horas. Cada gestión puede dejar nota y cerrarse correctamente.</p></div>${admin()?`<label class="btn cyan">Cargar archivo de recuperación<input type="file" accept=".xlsx,.xls" hidden onchange="importRecoveryV46(this.files[0])"></label>`:''}</div>
      <div class="cards" style="margin-bottom:14px">${typeof kpi==='function'?kpi('Por gestionar',pending,'visibles ahora'):''}${typeof kpi==='function'?kpi('Programadas',programmed,'ocultas hasta su hora'):''}${typeof kpi==='function'?kpi('Recuperadas',recovered,'cerradas con venta'):''}</div>
      <div class="panel"><div class="panel-head"><div class="toolbar"><input class="search" placeholder="Cliente, teléfono, pedido, ciudad…" value="${E(R.search)}" oninput="recoverySearchV521(this.value)"><select class="search" onchange="recoveryFilterV521(this.value)"><option value="pendientes" ${R.filter==='pendientes'?'selected':''}>Por gestionar ahora</option><option value="programadas" ${R.filter==='programadas'?'selected':''}>Programadas</option><option value="recuperadas" ${R.filter==='recuperadas'?'selected':''}>Recuperadas</option><option value="tramitadas" ${R.filter==='tramitadas'?'selected':''}>Ya tramitadas</option><option value="canceladas" ${R.filter==='canceladas'?'selected':''}>Cliente cancela</option><option value="cerradas" ${R.filter==='cerradas'?'selected':''}>Cerradas</option><option value="todas" ${R.filter==='todas'?'selected':''}>Todas</option></select></div><div class="spacer"></div><span class="tag blue">${shown.length} visibles</span><button class="btn light sm" onclick="loadRecoveryV521(true)">↻ Actualizar</button></div>
      ${R.loading&&!R.rows.length?'<div class="panel-body">Cargando recuperación…</div>':`<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Canal</th><th>Cliente</th><th>Ciudad</th><th>Estado</th><th>Asesor</th><th>Intentos</th><th>Próxima acción</th><th>Notas</th><th>Valor</th><th>Gestión</th></tr></thead><tbody>${shown.map(r=>`<tr><td><b>${E(r.source_id)}</b><div class="muted">${r.source_entity_type==='draft_order'?'BORRADOR':'PEDIDO'}${r.linked_sale_id?' · enlazado':''}</div></td><td><span class="tag blue">${E(r.source_channel||'Shopify')}</span></td><td><b>${E(r.customer_name||'Sin nombre')}</b><div class="muted">${E(r.customer_phone||'')}</div></td><td>${E(r.city||'—')}<div class="muted">${E(r.department||'')}</div></td><td>${recoveryStatus(r)}<div class="muted">${E(r.source_order_status||'')}</div></td><td><b>${E(r.advisor_name||'Sin asignar')}</b></td><td>${Number(r.attempts||0)}</td><td>${r.status==='seguimiento'?fmt(r.next_followup_at):'—'}</td><td><div style="max-width:220px;white-space:normal">${E(r.notes||'—')}</div></td><td>${cash(r.total_price||0)}<div class="muted">${Number(r.quantity||0)} uds.</div></td><td>${recoveryActions(r)}</td></tr>`).join('')||'<tr><td colspan="11" class="muted">Sin registros para este filtro.</td></tr>'}</tbody></table></div>`}</div>`;
  }
  window.loadRecoveryV521=async function(force=false){
    if(R.loading||typeof invictoSupabaseV12==='undefined')return;R.loading=true;if(typeof currentView!=='undefined'&&currentView==='recovery')paintRecovery();
    try{const {data,error}=await invictoSupabaseV12.rpc('get_recovery_queue_v46');if(error)throw error;R.rows=data||[]}
    catch(e){console.error('recovery v52.1',e);if(typeof toast==='function')toast('No se pudo cargar Recuperación: '+(e.message||e))}
    finally{R.loading=false;if(typeof currentView!=='undefined'&&currentView==='recovery')paintRecovery()}
  };
  window.renderRecovery=function(){paintRecovery();window.loadRecoveryV521(false)};
  window.recoveryFilterV521=v=>{R.filter=v;paintRecovery()};
  window.recoverySearchV521=v=>{R.search=v;paintRecovery();setTimeout(()=>document.querySelector('#view-recovery input.search')?.focus(),0)};
  window.recoveryWhatsAppV521=phone=>{if(typeof openWhatsAppV21==='function')return openWhatsAppV21(phone);let d=String(phone).replace(/\D/g,'');if(d.length===10)d='57'+d;window.open('https://wa.me/'+d,'_blank','noopener')};
  window.recoveryActionV521=async function(id,action){
    let at=null,notes=null;
    if(action==='no_contesta')notes=prompt('Nota de la gestión (opcional)','No contestó')||'No contestó';
    if(action==='programar'){
      const def=(()=>{const d=new Date(Date.now()+3*3600000);return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(',','')})();
      const raw=prompt('Fecha y hora Colombia (AAAA-MM-DD HH:MM)',def);if(!raw)return;const d=typeof parseBogotaFollowupV16==='function'?parseBogotaFollowupV16(raw):new Date(raw.replace(' ','T')+':00-05:00');if(!d||Number.isNaN(d.getTime()))return toast('Fecha inválida');at=d.toISOString();notes=prompt('Nota / motivo del seguimiento','Volver a contactar')||'Seguimiento programado';
    }
    if(action==='nota'){notes=prompt('Escribe la nota de esta gestión');if(!notes)return}
    if(action==='recuperada')notes=prompt('Nota de recuperación (opcional)','Cliente recuperado')||'Cliente recuperado';
    if(action==='tramitada')notes=prompt('Nota de cierre (opcional)','Gestión ya tramitada')||'Gestión ya tramitada';
    if(action==='cancelada'){if(!confirm('¿Confirmas que el cliente canceló?'))return;notes=prompt('Motivo de cancelación','Cliente cancela')||'Cliente cancela'}
    try{
      const {error}=await invictoSupabaseV12.rpc('update_recovery_queue_v45',{p_id:id,p_action:action,p_next_followup_at:at,p_notes:notes});if(error)throw error;
      await window.loadRecoveryV521(true);if(typeof loadCanonicalV51==='function')await loadCanonicalV51(true);if(typeof toast==='function')toast(action==='no_contesta'?'Se ocultó por 3 horas y volverá en su momento':'Gestión actualizada');
    }catch(e){console.error(e);if(typeof toast==='function')toast('No se actualizó: '+(e.message||e))}
  };

  patchOpenOrder();patchSalesRenderer();
  setTimeout(()=>{patchOpenOrder();patchSalesRenderer();if(typeof currentView!=='undefined'&&currentView==='sales')injectMine();if(typeof currentView!=='undefined'&&currentView==='recovery')window.renderRecovery()},500);
  console.info('INVICTO OPS v52.1 · duplicados por edición corregidos + seguimiento 3h + recuperación completa');
})();
