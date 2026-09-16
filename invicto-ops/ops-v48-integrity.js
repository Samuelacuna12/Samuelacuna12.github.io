/* INVICTO OPS v48 · garantías integradas, guías verificadas, borradores manuales y drawer estable */
(function(){
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cash=v=>typeof money==='function'?money(Number(v||0)):Number(v||0).toLocaleString('es-CO');
  const dt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});};
  const admin=()=>typeof isAdmin==='function'&&isAdmin();
  let warrantySearchRows48=[];
  let customerOpsRows48=[];
  let safeTimer48=null;
  let pendingRefresh48=false;

  function addStyles48(){
    if(document.getElementById('opsV48Styles'))return;
    const s=document.createElement('style');s.id='opsV48Styles';s.textContent=`
      .v48-search-results{display:grid;gap:8px;margin-top:12px}.v48-search-row{display:grid;grid-template-columns:1fr 1.2fr 1fr 1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid var(--line,#e7e7e7);border-radius:12px;background:#fff}.v48-search-row small{display:block;color:#7b8187;margin-top:3px}.v48-modal-back{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:9998}.v48-modal{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,calc(100vw - 24px));max-height:88vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.28)}.v48-modal-head,.v48-modal-foot{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #ececec}.v48-modal-foot{border-top:1px solid #ececec;border-bottom:0;justify-content:flex-end}.v48-modal-body{padding:18px}.v48-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.v48-grid .span2{grid-column:1/-1}.v48-chip{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef7f5;font-size:11px;font-weight:700;margin:2px 4px 2px 0}.v48-guide{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700}.v48-saving{opacity:.55;pointer-events:none}.v48-note{font-size:12px;color:#687078}.v48-follow{display:flex;gap:6px;flex-wrap:wrap;align-items:center}@media(max-width:850px){.v48-search-row{grid-template-columns:1fr}.v48-grid{grid-template-columns:1fr}.v48-grid .span2{grid-column:auto}}
    `;document.head.appendChild(s);
  }

  /* ---------- DRAFT MANUAL REAL ---------- */
  const hydrateBase48=window.hydrateOpsV13;
  if(typeof hydrateBase48==='function')window.hydrateOpsV13=async function(force=false){
    const r=await hydrateBase48(force);
    (state?.sales||[]).forEach(s=>{if(s?.sourceEntityType==='manual_draft'||s?.opsData?.manualDraft===true)s.isDraft=true;});
    return r;
  };

  function patchDraftField48(){
    const src=document.getElementById('fSource');if(!src||document.getElementById('fManualDraft'))return;
    const field=src.closest('.field');if(!field)return;
    const sale=editingSaleId?(state.sales||[]).find(x=>String(x.id)===String(editingSaleId)||String(x.dbId)===String(editingSaleId)):null;
    const isDraft=!!(sale?.isDraft||sale?.opsData?.manualDraft||sale?.sourceEntityType==='manual_draft'||sale?.sourceEntityType==='draft_order');
    const wrap=document.createElement('div');wrap.className='field';wrap.innerHTML=`<label>Tipo de registro</label><select id="fManualDraft"><option value="sale" ${!isDraft?'selected':''}>Pedido / venta</option><option value="draft" ${isDraft?'selected':''}>Borrador</option></select><div class="v48-note">Usa Borrador cuando todavía estás montando el pedido manual y no quieres tratarlo como venta final.</div>`;
    field.insertAdjacentElement('afterend',wrap);
  }

  const openBase48=window.openOrderV20||window.openOrder;
  if(typeof openBase48==='function'){
    window.openOrderV20=function(id){const r=openBase48(id);setTimeout(patchDraftField48,0);return r;};
    window.openOrder=window.openOrderV20;
    window.newOrder=function(){editingSaleId=null;window.openOrderV20(null);};
  }
  const collectBase48=window.collectDraftV20;
  if(typeof collectBase48==='function')window.collectDraftV20=function(confirm=false){
    const d=collectBase48(confirm),manualDraft=!confirm&&document.getElementById('fManualDraft')?.value==='draft';
    d.opsData={...(d.opsData||{}),manualDraft};d.isDraft=manualDraft;d.sourceEntityType=manualDraft?'manual_draft':(d.sourceEntityType==='manual_draft'?'manual':d.sourceEntityType);return d;
  };

  /* ---------- REALTIME SIN CERRAR EL PEDIDO ---------- */
  function drawerOpen48(){return !!document.getElementById('orderDrawer')?.classList.contains('open');}
  async function safeRefresh48(){
    if(drawerOpen48()){pendingRefresh48=true;return;}
    pendingRefresh48=false;
    try{
      const view=typeof currentView!=='undefined'?currentView:'';
      await window.hydrateOpsV13?.(true);
      if(typeof window.render==='function')window.render();
      if(view&&typeof window.switchView==='function')setTimeout(()=>{try{window.switchView(view,true)}catch(e){}},0);
    }catch(e){console.error('safe realtime v48',e)}
  }
  function scheduleSafe48(){clearTimeout(safeTimer48);safeTimer48=setTimeout(safeRefresh48,750);}
  function installSafeRealtime48(){
    if(typeof session==='undefined'||!session||typeof invictoSupabaseV12==='undefined')return;
    try{if(typeof opsRealtimeV13!=='undefined'&&opsRealtimeV13){invictoSupabaseV12.removeChannel(opsRealtimeV13);opsRealtimeV13=null;}}catch(e){}
    try{if(window.__invictoFallbackV13){clearInterval(window.__invictoFallbackV13);window.__invictoFallbackV13=null;}}catch(e){}
    try{
      opsRealtimeV13=invictoSupabaseV12.channel('invicto-ops-live-v48');
      ['sales','sale_items','inventory','stock_reservations','shipments','warranties','logistics_novelties','dispatch_cuts','dispatch_cut_sales','profiles','guide_tasks'].forEach(table=>opsRealtimeV13.on('postgres_changes',{event:'*',schema:'public',table},scheduleSafe48));
      opsRealtimeV13.subscribe();
      window.__invictoFallbackV13=setInterval(scheduleSafe48,30000);
      window.__safeRealtimeInstalledV48=true;
    }catch(e){console.error('install realtime v48',e)}
  }
  window.startRealtimeV13=installSafeRealtime48;
  const closeBase48=window.closeOrder;
  if(typeof closeBase48==='function')window.closeOrder=function(){closeBase48();if(pendingRefresh48)setTimeout(safeRefresh48,220);};
  setTimeout(installSafeRealtime48,900);

  /* ---------- GARANTÍAS INTEGRADAS ---------- */
  function warrantyReasonLabel48(v){return ({calidad_defectuoso:'Calidad / defectuoso',talla_equivocada:'Talla equivocada',diseno_equivocado:'Diseño equivocado',faltante:'Faltante'})[v]||String(v||'');}
  function warrantyStatusLabel48(v){return String(v||'').replaceAll('_',' ').toUpperCase();}
  function warrantyStatusKey48(v){const x=String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return ({'abierta':'abierta','en gestion':'en_gestion','esperando respuesta externa':'esperando_externo','resuelta pendiente de validacion':'pendiente_validacion_admin','requiere gestion adicional':'requiere_gestion_adicional','cerrada':'cerrada'})[x]||x.replaceAll(' ','_');}
  function saleForWarranty48(g){return (state.sales||[]).find(s=>String(s.dbId)===String(g.dbSaleId)||String(s.id)===String(g.saleId));}
  window.renderGuarantees=function(){
    addStyles48();
    const rows=(state.guarantees||[]).filter(g=>!isAdvisor()||g.advisor===session.name);
    const host=document.getElementById('view-guarantees');if(!host)return;
    host.innerHTML=`<div class="page-title"><div><div class="eyebrow">POSTVENTA · GARANTÍAS</div><h1>Garantías</h1><p>Busca al cliente por guía, pedido, teléfono o nombre. No necesitas ir a Shopify ni copiar el número del pedido.</p></div></div>
      <div class="panel"><div class="panel-head"><div><h3>Abrir garantía</h3><div class="muted">La garantía queda ligada a la venta y aparece después en el seguimiento del cliente.</div></div></div><div class="panel-body"><div class="toolbar"><input id="warrantySearchV48" class="search" style="min-width:320px;flex:1" placeholder="Guía, pedido, teléfono o cliente…" onkeydown="if(event.key==='Enter')searchWarrantyClientV48()"><button class="btn navy" onclick="searchWarrantyClientV48()">Buscar cliente</button></div><div id="warrantySearchResultsV48" class="v48-search-results"><div class="muted">Busca primero el cliente. Luego abre la garantía desde el resultado correcto.</div></div></div></div>
      <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Garantías registradas</h3><div class="spacer"></div><span class="tag blue">${rows.length}</span></div><div class="table-wrap"><table><thead><tr><th>Caso</th><th>Cliente</th><th>Guía</th><th>Asesor</th><th>Motivo</th><th>Estado</th><th>Última gestión</th><th></th></tr></thead><tbody>${rows.map(g=>{const s=saleForWarranty48(g);return `<tr><td><b>${E(g.displayId||g.id)}</b><div class="muted">${E(g.saleId||s?.id||'')}</div></td><td><b>${E(g.client||s?.name||'')}</b><div class="muted">${E(s?.phone||'')}</div></td><td><span class="v48-guide">${E(s?.guide||s?.manualGuideNumber||'—')}</span></td><td>${E(g.advisor||s?.advisor||'')}</td><td>${E(warrantyReasonLabel48(g.reason))}</td><td>${statusTag(g.status)}</td><td>${dt(g.lastUpdate)}</td><td><button class="btn light sm" onclick="manageWarrantyV48('${g.id}')">Gestionar</button></td></tr>`}).join('')||'<tr><td colspan="8" class="muted">Sin garantías registradas.</td></tr>'}</tbody></table></div></div>`;
  };

  window.searchWarrantyClientV48=async function(){
    const q=document.getElementById('warrantySearchV48')?.value?.trim()||'',host=document.getElementById('warrantySearchResultsV48');if(!host)return;
    if(q.length<3)return host.innerHTML='<div class="muted">Escribe al menos 3 caracteres.</div>';
    host.innerHTML='<div class="muted">Buscando…</div>';
    try{const {data,error}=await invictoSupabaseV12.rpc('search_ops_sales_v48',{p_query:q,p_limit:80});if(error)throw error;warrantySearchRows48=data||[];host.innerHTML=warrantySearchRows48.map(r=>{const own=admin()||String(r.advisor_id||'')===String(session?.id||'');return `<div class="v48-search-row"><div><b>${E(r.order||'Venta')}</b><small>${E(r.source||'')} · ${E(r.sale_status||'')}</small></div><div><b>${E(r.customer_name||'Sin nombre')}</b><small>${E(r.customer_phone||'')}</small></div><div><span class="v48-guide">${E(r.tracking_number||'SIN GUÍA')}</span><small>${E(r.carrier||'')}</small></div><div><b>${E(r.advisor||'Sin asignar')}</b><small>${Number(r.attempts||0)} gestiones</small></div><div>${own?`<button class="btn cyan sm" onclick="openWarrantyForSaleV48('${r.sale_id}')">Abrir garantía</button>`:'<span class="tag gray">OTRO ASESOR</span>'}</div></div>`}).join('')||'<div class="muted">No encontré ventas con ese dato.</div>';}
    catch(e){console.error(e);host.innerHTML=`<div class="blocking">No se pudo buscar: ${E(e.message||e)}</div>`;}
  };

  function openWarrantyModal48(row,g=null){
    document.getElementById('warrantyModalV48')?.remove();
    const currentReason=g?.reason||'calidad_defectuoso';
    const statuses=['abierta','en_gestion','esperando_externo','pendiente_validacion_admin',...(admin()?['requiere_gestion_adicional','cerrada']:[])];
    const wrap=document.createElement('div');wrap.id='warrantyModalV48';wrap.innerHTML=`<div class="v48-modal-back" onclick="closeWarrantyModalV48()"></div><section class="v48-modal"><div class="v48-modal-head"><div><div class="eyebrow">${g?'GESTIONAR GARANTÍA':'NUEVA GARANTÍA'}</div><h2 style="margin:2px 0">${E(row?.customer_name||g?.client||'Cliente')}</h2><div class="muted">${E(row?.order||g?.saleId||'')} · Guía ${E(row?.tracking_number||saleForWarranty48(g||{})?.guide||'—')}</div></div><div class="spacer"></div><button class="close" onclick="closeWarrantyModalV48()">×</button></div><div class="v48-modal-body"><div class="v48-grid"><div class="field"><label>Motivo</label><select id="w48Reason"><option value="calidad_defectuoso" ${currentReason==='calidad_defectuoso'?'selected':''}>Calidad / defectuoso</option><option value="talla_equivocada" ${currentReason==='talla_equivocada'?'selected':''}>Talla equivocada</option><option value="diseno_equivocado" ${currentReason==='diseno_equivocado'?'selected':''}>Diseño equivocado</option><option value="faltante" ${currentReason==='faltante'?'selected':''}>Faltante</option></select></div>${g?`<div class="field"><label>Estado</label><select id="w48Status">${statuses.map(x=>`<option value="${x}" ${x===warrantyStatusKey48(g.status)?'selected':''}>${E(warrantyStatusLabel48(x))}</option>`).join('')}</select></div>`:''}<div class="field"><label>Dependencia / responsable probable</label><input id="w48Responsible" value="${E(g?.external||'')}" placeholder="Interna, transportadora, proveedor…"></div><div class="field span2"><label>Solución propuesta / seguimiento</label><textarea id="w48Solution" rows="4" placeholder="Qué se hará y qué se habló con el cliente">${E(g?.proposedSolution||'')}</textarea></div>${g&&admin()?`<div class="field span2"><label>Decisión administración</label><textarea id="w48Admin" rows="3">${E(g?.adminDecision||'')}</textarea></div>`:''}</div></div><div class="v48-modal-foot"><button class="btn light" onclick="closeWarrantyModalV48()">Cancelar</button><button class="btn cyan" onclick="saveWarrantyV48('${row?.sale_id||g?.dbSaleId||''}','${g?.id||''}')">Guardar garantía</button></div></section>`;document.body.appendChild(wrap);
  }
  window.closeWarrantyModalV48=()=>document.getElementById('warrantyModalV48')?.remove();
  window.openWarrantyForSaleV48=function(saleId){const row=warrantySearchRows48.find(x=>String(x.sale_id)===String(saleId));if(!row)return toast('No encontré la venta seleccionada');openWarrantyModal48(row,null);};
  window.manageWarrantyV48=function(id){const g=(state.guarantees||[]).find(x=>String(x.id)===String(id));if(!g)return;const s=saleForWarranty48(g);openWarrantyModal48({sale_id:g.dbSaleId,customer_name:g.client||s?.name,order:g.saleId||s?.id,tracking_number:s?.guide||''},g);};
  window.saveWarrantyV48=async function(saleId,warrantyId=''){
    const reason=document.getElementById('w48Reason')?.value||'calidad_defectuoso',responsible=document.getElementById('w48Responsible')?.value?.trim()||null,solution=document.getElementById('w48Solution')?.value?.trim()||null,adminSolution=document.getElementById('w48Admin')?.value?.trim()||null,status=document.getElementById('w48Status')?.value||'abierta';
    try{const btn=document.querySelector('#warrantyModalV48 .btn.cyan');if(btn){btn.disabled=true;btn.textContent='Guardando…'}const g=warrantyId?(state.guarantees||[]).find(x=>String(x.id)===String(warrantyId)):null;const {error}=await invictoSupabaseV12.rpc('save_ops_warranty',{p_warranty_id:warrantyId||null,p_sale_id:saleId,p_reason:reason,p_status:status,p_probable_responsible:responsible,p_proposed_solution:solution,p_admin_solution:adminSolution,p_transfer_amount:g?.transferAmount||null,p_transfer_done:!!g?.transferDone});if(error)throw error;closeWarrantyModalV48();await window.hydrateOpsV13?.(true);window.renderGuarantees();const q=document.getElementById('warrantySearchV48')?.value;if(q)window.searchWarrantyClientV48();toast(warrantyId?'Garantía actualizada':'Garantía creada y ligada al cliente');}
    catch(e){console.error(e);toast('No se guardó la garantía: '+(e.message||e));const btn=document.querySelector('#warrantyModalV48 .btn.cyan');if(btn){btn.disabled=false;btn.textContent='Guardar garantía'}}
  };
  window.newGuarantee=function(){window.renderGuarantees();setTimeout(()=>document.getElementById('warrantySearchV48')?.focus(),0);};

  /* ---------- CLIENTE: GUÍA + GARANTÍAS + SEGUIMIENTO ---------- */
  const customerRenderBase48=window.renderCustomerHistoryResultsV24;
  function opsCustomerPanel48(){
    if(!customerOpsRows48.length)return '';
    return `<div class="panel" id="customerOpsV48" style="margin-bottom:14px"><div class="panel-head"><div><h3>Operación actual y seguimiento</h3><div class="muted">Incluye guía, canal, asesor, gestiones y garantías del cliente.</div></div><div class="spacer"></div><span class="tag blue">${customerOpsRows48.length}</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Guía</th><th>Cliente</th><th>Canal / asesor</th><th>Seguimiento</th><th>Garantías</th><th>Valor</th></tr></thead><tbody>${customerOpsRows48.map(r=>`<tr><td><b>${E(r.order||'—')}</b><div class="muted">${E(r.sale_status||'')}</div></td><td><span class="v48-guide">${E(r.tracking_number||'—')}</span><div class="muted">${E(r.carrier||'')}</div></td><td><b>${E(r.customer_name||'')}</b><div class="muted">${E(r.customer_phone||'')}</div></td><td>${E(r.source||'')}<div class="muted">${E(r.advisor||'')}</div></td><td><div class="v48-follow"><span class="v48-chip">${Number(r.attempts||0)} gestiones</span>${r.last_managed_at?`<span class="v48-chip">Última ${E(dt(r.last_managed_at))}</span>`:''}${r.next_followup_at?`<span class="v48-chip">Próxima ${E(dt(r.next_followup_at))}</span>`:''}</div></td><td>${(r.warranties||[]).map(w=>`<span class="v48-chip">${E(warrantyReasonLabel48(w.reason))} · ${E(w.status)}</span>`).join('')||'<span class="muted">Sin garantía</span>'}</td><td><b>${cash(r.total_price)}</b></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  if(typeof customerRenderBase48==='function')window.renderCustomerHistoryResultsV24=function(){
    customerRenderBase48();const host=document.getElementById('customerHistoryResultsV24');if(!host)return;
    [...host.querySelectorAll('.panel')].forEach(p=>{if(p.querySelector('h3')?.textContent?.includes('Ventas en INVICTO OPS'))p.remove();});
    const html=opsCustomerPanel48();if(html)host.insertAdjacentHTML('afterbegin',html);
  };
  window.searchCustomerHistoryV24=async function(){
    const input=document.getElementById('customerHistorySearchV24'),host=document.getElementById('customerHistoryResultsV24'),q=(input?.value||'').trim();customerHistoryQueryV24=q;if(!host)return;
    if(q.length<3){host.innerHTML='<div class="panel"><div class="panel-body muted">Escribe al menos 3 caracteres del nombre, teléfono, correo, pedido o guía.</div></div>';return}
    host.innerHTML='<div class="panel"><div class="panel-body"><b>Buscando cliente, guía y seguimiento…</b></div></div>';
    try{const [hist,ops]=await Promise.all([invictoSupabaseV12.rpc('search_shopify_customer_history',{p_query:q,p_limit:300}),invictoSupabaseV12.rpc('search_ops_sales_v48',{p_query:q,p_limit:150})]);if(hist.error)throw hist.error;if(ops.error)throw ops.error;customerHistoryResultsV24=hist.data||[];customerOpsRows48=ops.data||[];window.renderCustomerHistoryResultsV24();}
    catch(e){console.error(e);host.innerHTML=`<div class="panel"><div class="panel-body"><b>No fue posible buscar.</b><div class="muted">${E(e.message||e)}</div></div></div>`}
  };
  const customerPageBase48=window.renderCustomerHistoryV24;
  if(typeof customerPageBase48==='function')window.renderCustomerHistoryV24=function(){customerPageBase48();const i=document.getElementById('customerHistorySearchV24');if(i)i.placeholder='Nombre, teléfono, correo, pedido o número de guía…';const p=document.querySelector('#view-customer-history .page-title p');if(p)p.textContent='Consulta compras, guías, asesor, canal, gestiones y garantías del cliente.';};

  /* ---------- GUÍAS: GUARDADO VERIFICADO ---------- */
  window.guideResultV42=async function(taskId,result){
    const track=document.getElementById('g42Track-'+taskId)?.value?.trim()||'',carrier=document.getElementById('g42Carrier-'+taskId)?.value||'',note=document.getElementById('g42Note-'+taskId)?.value?.trim()||'',box=document.getElementById('g42Track-'+taskId)?.closest('.guide42-action');
    if(result==='guia_enviada'&&!track)return toast('Escribe el número de guía');if(result==='guia_enviada'&&!carrier)return toast('Selecciona la transportadora');if(result==='error_envio_guia'&&!note)return toast('Describe el error de envío de guía');
    try{box?.classList.add('v48-saving');box?.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);const {data,error}=await invictoSupabaseV12.rpc('set_guide_task_result_v48',{p_task_id:taskId,p_result:result,p_tracking_number:track||null,p_carrier:carrier||null,p_note:note||null});if(error)throw error;if(!data?.ok||String(data.status)!==String(result))throw new Error('El servidor no confirmó el cambio');if(result==='guia_enviada'&&String(data.tracking_number||'')!==track)throw new Error('La guía no quedó persistida');if(result==='guia_enviada'){const tr=box?.closest('tr');if(tr){tr.style.opacity='.35';tr.style.pointerEvents='none';}}await Promise.all([window.loadGuideDashboardV42?.(true),window.hydrateOpsV13?.(true)]);const msg={guia_enviada:`Guía ${track} guardada y retirada de pendientes`,cliente_no_confirmado:'Caso aplazado para revisión',error_envio_guia:'Incidencia registrada'};toast(msg[result]||'Actualizado');}
    catch(e){console.error(e);toast('No se guardó: '+(e.message||e));box?.classList.remove('v48-saving');box?.querySelectorAll('button,input,select').forEach(x=>x.disabled=false);}
  };
  window.submitGuideV41=async function(taskId){return window.guideResultV42(taskId,'guia_enviada');};

  addStyles48();
  console.info('INVICTO OPS v48 activo');
})();