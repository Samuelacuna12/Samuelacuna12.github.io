/* INVICTO OPS v14 · flujos operativos persistentes */

function warrantyUiToDbV14(st=''){return ({'Abierta':'abierta','En gestión':'en_gestion','Esperando respuesta externa':'esperando_externo','Resuelta pendiente de validación':'pendiente_validacion_admin','Requiere gestión adicional':'requiere_gestion_adicional','Cerrada':'cerrada'})[st]||'abierta'}
function noveltyUiToDbV14(st=''){return ({'Abierta':'abierta','En gestión':'en_gestion','Esperando respuesta externa':'esperando_externo','Resuelta pendiente de validación':'pendiente_validacion_admin','Cerrada':'cerrada'})[st]||'abierta'}

async function refreshAndStayV14(view){await hydrateOpsV13(true);switchView(view);if(typeof renderAI==='function')renderAI()}

window.createCut=async function(){
  if(!isAdmin())return toast('Solo administración o gerencia puede crear cortes');
  const pending=state.sales.filter(s=>s.status==='Confirmada'&&!s.cutId&&s.dbId);
  if(!pending.length)return toast('No hay pedidos confirmados pendientes de corte');
  try{
    const {data,error}=await invictoSupabaseV12.rpc('create_ops_dispatch_cut',{p_sale_ids:pending.map(s=>s.dbId),p_cut_type:'manual'});if(error)throw error;
    await refreshAndStayV14('cuts');toast(`Corte creado · ${pending.length} pedidos`);
  }catch(e){console.error(e);toast('No se creó el corte: '+(e.message||e))}
};

window.renderGuarantees=function(){
  const rows=state.guarantees.filter(g=>!isAdvisor()||g.advisor===session.name);
  el('view-guarantees').innerHTML=`<div class="page-title"><div><h1>Garantías</h1><p>El asesor original gestiona. Administración valida y cierra.</p></div><button class="btn cyan" onclick="newGuarantee()">+ Abrir garantía</button></div><div class="panel"><div class="table-wrap"><table><thead><tr><th>Caso</th><th>Cliente</th><th>Asesor</th><th>Motivo</th><th>Dependencia</th><th>Estado</th><th>Última gestión</th><th>Acción</th></tr></thead><tbody>${rows.map(g=>`<tr><td><b>${esc(g.displayId||g.id)}</b><div class="muted">${esc(g.saleId||'')}</div></td><td>${esc(g.client)}</td><td>${esc(g.advisor)}</td><td>${esc(g.reason)}</td><td>${esc(g.external||'Interna')}</td><td>${statusTag(g.status)}</td><td>${fmtDate(g.lastUpdate)}</td><td><button class="btn light sm" onclick="manageGuarantee('${g.id}')">Gestionar</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">Sin garantías.</td></tr>'}</tbody></table></div></div>`;
};

window.newGuarantee=async function(){
  const candidates=state.sales.filter(s=>s.dbId&&(!isAdvisor()||s.advisor===session.name));
  if(!candidates.length)return toast('No hay ventas disponibles para asociar');
  const order=prompt('Escribe el número del pedido para abrir la garantía',candidates[0].id);if(!order)return;
  const sale=candidates.find(s=>String(s.id).toLowerCase()===String(order).trim().toLowerCase());if(!sale)return toast('No encontré ese pedido');
  const reason=prompt('Motivo: calidad/defectuoso, talla equivocada, diseño equivocado o faltante','Calidad / defectuoso');if(!reason)return;
  try{
    const {error}=await invictoSupabaseV12.rpc('save_ops_warranty',{p_warranty_id:null,p_sale_id:sale.dbId,p_reason:reason,p_status:'abierta',p_probable_responsible:null,p_proposed_solution:null,p_admin_solution:null,p_transfer_amount:null,p_transfer_done:false});if(error)throw error;
    await refreshAndStayV14('guarantees');toast('Garantía abierta en Supabase');
  }catch(e){console.error(e);toast('No se pudo abrir la garantía: '+(e.message||e))}
};

window.manageGuarantee=async function(id){
  const g=state.guarantees.find(x=>x.id===id);if(!g)return;
  const allowed=isAdmin()?'Abierta|En gestión|Esperando respuesta externa|Resuelta pendiente de validación|Requiere gestión adicional|Cerrada':'Abierta|En gestión|Esperando respuesta externa|Resuelta pendiente de validación';
  const st=prompt(`Estado actual: ${g.status}\nOpciones: ${allowed}`,g.status);if(!st)return;
  if(st==='Cerrada'&&!isAdmin())return toast('Solo administración puede cerrar');
  const proposed=st==='Resuelta pendiente de validación'?prompt('Solución propuesta',g.proposedSolution||''):g.proposedSolution||'';
  try{
    const {error}=await invictoSupabaseV12.rpc('save_ops_warranty',{p_warranty_id:g.id,p_sale_id:g.dbSaleId,p_reason:g.reason,p_status:warrantyUiToDbV14(st),p_probable_responsible:g.external||null,p_proposed_solution:proposed||null,p_admin_solution:g.adminDecision||null,p_transfer_amount:g.transferAmount||null,p_transfer_done:!!g.transferDone});if(error)throw error;
    await refreshAndStayV14('guarantees');toast('Garantía actualizada');
  }catch(e){console.error(e);toast('No se actualizó: '+(e.message||e))}
};

window.renderNovelties=function(){
  const rows=state.novelties.filter(n=>!isAdvisor()||n.advisor===session.name);
  el('view-novelties').innerHTML=`<div class="page-title"><div><h1>Novedades logísticas</h1><p>Gestión obligatoria el mismo día. Los archivos cargados quedan guardados en la base real.</p></div>${isAdmin()?'<label class="btn cyan">Cargar Excel de novedades<input type="file" accept=".xlsx,.xls" hidden onchange="importNovelties(this.files[0])"></label>':''}</div><div class="panel"><div class="table-wrap"><table><thead><tr><th>Caso</th><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Guía</th><th>Asesor</th><th>Novedad</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${rows.map(n=>`<tr><td><b>${esc(n.displayId||n.id)}</b></td><td>${esc(n.client)}</td><td>${esc(n.phone)}</td><td>${esc(n.date||'')}</td><td>${esc(n.guide||'—')}</td><td>${esc(n.advisor)}</td><td>${esc(n.type)}</td><td>${statusTag(n.status)}</td><td><button class="btn light sm" onclick="manageNovelty('${n.id}')">Gestionar</button></td></tr>`).join('')||'<tr><td colspan="9" class="muted">Sin novedades.</td></tr>'}</tbody></table></div></div>`;
};

window.manageNovelty=async function(id){
  const n=state.novelties.find(x=>x.id===id);if(!n)return;
  const allowed=isAdmin()?'Abierta|En gestión|Esperando respuesta externa|Resuelta pendiente de validación|Cerrada':'Abierta|En gestión|Esperando respuesta externa|Resuelta pendiente de validación';
  const st=prompt(`Estado: ${n.status}\nOpciones: ${allowed}`,n.status);if(!st)return;
  if(st==='Cerrada'&&!isAdmin())return toast('Solo administración puede cerrar');
  try{
    const {error}=await invictoSupabaseV12.rpc('save_ops_novelty',{p_novelty_id:n.id,p_sale_id:n.dbSaleId,p_description:n.type,p_status:noveltyUiToDbV14(st),p_source:n.source||'manual',p_phone:n.phone||null,p_date:n.date||null});if(error)throw error;
    await refreshAndStayV14('novelties');toast('Novedad actualizada');
  }catch(e){console.error(e);toast('No se actualizó: '+(e.message||e))}
};

window.importNovelties=async function(file){
  if(!file||!isAdmin())return;
  try{
    const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:''});
    const jobs=[];
    rows.forEach(r=>{
      const phone=extractPhone(r);if(!phone)return;const date=extractDate(r);const candidates=state.sales.filter(s=>digits(s.phone)===digits(phone)&&s.dbId);let sale=null;
      if(candidates.length===1)sale=candidates[0];else if(candidates.length>1)sale=[...candidates].sort((a,b)=>Math.abs(new Date(a.createdAt)-new Date(date||Date.now()))-Math.abs(new Date(b.createdAt)-new Date(date||Date.now())))[0];
      if(!sale)return;const desc=String(r.NOVEDAD||r.Novedad||r.GESTION||r.Gestión||'Novedad importada');
      jobs.push(invictoSupabaseV12.rpc('save_ops_novelty',{p_novelty_id:null,p_sale_id:sale.dbId,p_description:desc,p_status:'abierta',p_source:'excel',p_phone:String(phone),p_date:date||todayBogotaV13()}));
    });
    if(!jobs.length)return toast('No encontré filas que coincidieran con ventas');
    const res=await Promise.all(jobs);const bad=res.filter(x=>x.error);if(bad.length)throw bad[0].error;
    await refreshAndStayV14('novelties');toast(`${jobs.length} novedades guardadas en Supabase`);
  }catch(e){console.error(e);toast('No se pudo importar: '+(e.message||e))}
};

window.confirmManualUploadedV9=async function(id){
  if(!isAdmin())return toast('Solo administración puede registrar la carga manual');
  const s=state.sales.find(x=>x.id===id);if(!s?.dbId)return toast('Pedido no encontrado');
  const guide=(document.getElementById('manualGuideV9')?.value||'').trim(),carrier=document.getElementById('manualCarrierV9')?.value||'',date=document.getElementById('manualDateV9')?.value||'';
  if(!guide)return toast('El número de guía es obligatorio');if(!carrier)return toast('La transportadora es obligatoria');if(!date)return toast('La fecha de guía es obligatoria');
  const wh=warehouseIdFromNameV13(s.warehouse);if(!wh)return toast('Falta la bodega del pedido');
  try{
    let {error}=await invictoSupabaseV12.rpc('register_ops_shipment',{p_sale_id:s.dbId,p_warehouse_id:wh,p_carrier:carrier,p_tracking_number:guide,p_office_pickup:s.deliveryMode==='Reclama en oficina',p_manual_upload:true});if(error)throw error;
    ({error}=await invictoSupabaseV12.rpc('patch_sale_ops_data',{p_sale_id:s.dbId,p_patch:{manualGuideDate:date,manualGuideNumber:guide,manualGuideCarrier:carrier,manualUploadStatus:'done',dispatchStatus:'Pendiente despacho'}}));if(error)throw error;
    closeManualUploadModalV9();await refreshAndStayV14('cuts');toast(`${id}: guía ${guide} registrada`);
  }catch(e){console.error(e);toast('No se guardó la guía: '+(e.message||e))}
};

window.markDispatchedV11=async function(id){
  const s=state.sales.find(x=>x.id===id);if(!s?.dbId)return toast('Pedido no encontrado');
  try{const {data,error}=await invictoSupabaseV12.rpc('mark_ops_dispatched',{p_sale_id:s.dbId});if(error)throw error;await refreshAndStayV14('cuts');toast(`${id}: despachado · ${Number(data?.units||0)} unidades descontadas`)}catch(e){console.error(e);toast('No se pudo despachar: '+(e.message||e))}
};
window.markReturnInTransitV11=async function(id){
  const s=state.sales.find(x=>x.id===id);if(!s?.dbId)return;
  try{const {error}=await invictoSupabaseV12.rpc('mark_ops_return_in_transit',{p_sale_id:s.dbId});if(error)throw error;await refreshAndStayV14('cuts');toast(`${id}: devolución en tránsito · stock sin cambios`)}catch(e){console.error(e);toast('No se actualizó: '+(e.message||e))}
};
window.receiveReturnV11=async function(id){
  if(!isAdmin())return toast('Solo administración puede recibir una devolución física');
  const s=state.sales.find(x=>x.id===id);if(!s?.dbId)return;
  try{const {data,error}=await invictoSupabaseV12.rpc('receive_ops_return',{p_sale_id:s.dbId});if(error)throw error;await refreshAndStayV14('cuts');toast(`${id}: devolución recibida · ${Number(data||0)} unidades restauradas`)}catch(e){console.error(e);toast('No se recibió: '+(e.message||e))}
};

// Convierte el contador de intentos del formulario en historial real de gestión.
const saveOrderBaseV14=window.saveOrderV3;
window.saveOrderV3=async function(confirm){
  const existing=editingSaleId?state.sales.find(x=>x.id===editingSaleId):null;
  const dbId=existing?.dbId||null;
  const beforeAttempts=dbId?(opsAttemptsV13.filter(x=>x.sale_id===dbId).length):0;
  const targetAttempts=Number(document.getElementById('fAttempts')?.value||beforeAttempts);
  await saveOrderBaseV14(confirm);
  if(!dbId||targetAttempts<=beforeAttempts)return;
  try{
    for(let i=beforeAttempts;i<targetAttempts;i++){
      const {error}=await invictoSupabaseV12.rpc('record_ops_sale_attempt',{p_sale_id:dbId,p_channel:'manual',p_outcome:existing?.status||'gestión',p_next_followup_at:null,p_notes:'Intento registrado desde INVICTO OPS'});if(error)throw error;
    }
    await hydrateOpsV13(true);if(document.getElementById('view-sales')?.classList.contains('active'))filterSales();
  }catch(e){console.error(e);toast('Venta guardada, pero no se pudo registrar el intento: '+(e.message||e))}
};
