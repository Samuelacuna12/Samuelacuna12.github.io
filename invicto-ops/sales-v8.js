/* INVICTO OPS v8 · bloqueo de despacho hasta confirmar carga manual */

function dispatchGateV8(s){
  if(!s)return {allowed:false,reason:'Venta no encontrada'};
  if(s.manualUploadRequired&&s.manualUploadStatus==='pending'){
    return {allowed:false,reason:'Pendiente por subir manual. Administración debe marcar la carga manual antes del despacho.'};
  }
  return {allowed:true,reason:''};
}

window.canDispatchSaleV8=function(idOrSale){
  const s=typeof idOrSale==='string'?state.sales.find(x=>x.id===idOrSale):idOrSale;
  return dispatchGateV8(s).allowed;
};

window.assertDispatchAllowedV8=function(id){
  const s=state.sales.find(x=>x.id===id);
  const gate=dispatchGateV8(s);
  if(!gate.allowed){toast(gate.reason);return false;}
  return true;
};

const saveOrderV7BaseV8=window.saveOrderV3;
window.saveOrderV3=function(confirm){
  const editingBefore=editingSaleId;
  saveOrderV7BaseV8(confirm);
  if(!confirm)return;
  const s=editingBefore?state.sales.find(x=>x.id===editingBefore):state.sales[0];
  if(!s)return;
  const gate=dispatchGateV8(s);
  s.dispatchBlocked=!gate.allowed;
  s.dispatchBlockReason=gate.reason||'';
  if(!gate.allowed){
    s.dispatchUnlockedAt=null;
    s.dispatchUnlockedBy='';
  }
  saveState();
};

const markManualUploadedV7BaseV8=window.markManualUploadedV7;
window.markManualUploadedV7=function(id){
  if(!isAdmin())return toast('Solo administración puede marcar este pedido como subido manual');
  markManualUploadedV7BaseV8(id);
  const s=state.sales.find(x=>x.id===id);if(!s)return;
  s.dispatchBlocked=false;
  s.dispatchBlockReason='';
  s.dispatchUnlockedAt=new Date().toISOString();
  s.dispatchUnlockedBy=session.name;
  saveState();
  renderCuts();
  renderAI();
};

function dispatchStateTagV8(s){
  const gate=dispatchGateV8(s);
  if(!gate.allowed)return '<span class="tag red">DESPACHO BLOQUEADO</span>';
  if(s.manualUploadRequired&&s.manualUploadStatus==='done')return '<span class="tag green">DESPACHO HABILITADO</span>';
  return '<span class="tag green">LISTO PARA DESPACHO</span>';
}

window.renderCuts=function(){
  const pending=state.sales.filter(s=>s.status==='Confirmada'&&!s.cutId);
  const manualPending=state.sales.filter(s=>s.status==='Confirmada'&&s.manualUploadRequired&&s.manualUploadStatus==='pending');
  const manualDone=state.sales.filter(s=>s.status==='Confirmada'&&s.manualUploadRequired&&s.manualUploadStatus==='done');

  const manualPanel=manualPending.length?`<div class="panel" style="margin-top:14px;border:1px solid #ef4444"><div class="panel-head"><h3>Pendientes por subir manual</h3><div class="spacer"></div><span class="tag red">${manualPending.length} BLOQUEADOS</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Operador</th><th>IDs</th><th>Corte</th><th>Despacho</th><th>Acción administración</th></tr></thead><tbody>${manualPending.map(s=>`<tr><td><b>${esc(s.id)}</b></td><td>${esc(s.name)}</td><td>${esc(s.massiveOperator||'—')}</td><td>${esc(s.massiveLineCount||'—')} / ${esc(s.massiveMaxLines||'—')}</td><td>${esc(s.cutId||'Aún sin corte')}</td><td>${dispatchStateTagV8(s)}<div class="muted" style="margin-top:4px">No puede marcarse como despachado hasta confirmar la carga.</div></td><td>${isAdmin()?`<button class="btn cyan sm" onclick="markManualUploadedV7('${s.id}')">Marcar como subido</button>`:'<span class="muted">Solo administración</span>'}</td></tr>`).join('')}</tbody></table></div></div>`:'';

  el('view-cuts').innerHTML=`<div class="page-title"><div><h1>Cortes / Guías</h1><p>Cortes fijos 11:00 y 17:00. Los pedidos que exceden el massive quedan confirmados, pero el despacho permanece bloqueado hasta que administración confirme la carga manual.</p></div>${isAdmin()?'<button class="btn cyan" onclick="createCut()">Crear corte ahora</button>':''}</div>
  <div class="cards">${WAREHOUSES.map(w=>kpi(w,pending.filter(s=>s.warehouse===w).length,'pedidos pendientes')).join('')}${kpi('Carga manual',manualPending.length,'despacho bloqueado')}${kpi('Manual completado',manualDone.length,'despacho habilitado')}</div>
  ${manualPanel}
  <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Pedidos listos para próximo corte</h3><div class="spacer"></div><span class="tag blue">${pending.length} pedidos</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Asesor</th><th>Bodega</th><th>Transportadora</th><th>Valor</th><th>Estado massive</th><th>Despacho</th></tr></thead><tbody>${pending.map(s=>`<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.advisor)}</td><td>${esc(s.warehouse)}</td><td>${esc(s.carrier||'Por definir')}</td><td>${money(s.price)}</td><td>${s.manualUploadRequired&&s.manualUploadStatus==='pending'?`<span class="tag red">PENDIENTE SUBIR MANUAL</span><div class="muted">${esc(s.manualUploadReason||'')}</div>`:s.manualUploadRequired&&s.manualUploadStatus==='done'?`<span class="tag green">SUBIDO MANUAL</span><div class="muted">${esc(s.manualUploadedBy||'Administración')} · ${s.manualUploadedAt?fmtDate(s.manualUploadedAt):''}</div>`:'<span class="tag green">AUTOMÁTICO</span>'}</td><td>${dispatchStateTagV8(s)}</td></tr>`).join('')||'<tr><td colspan="8" class="muted">No hay pedidos pendientes.</td></tr>'}</tbody></table></div></div>
  <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Historial de cortes</h3></div><div class="table-wrap"><table><thead><tr><th>Corte</th><th>Fecha</th><th>Creado por</th><th>Pedidos</th><th>Hoko BOG</th><th>Hoko MED</th><th>LogiGho</th><th>BGA</th></tr></thead><tbody>${state.cuts.map(c=>`<tr><td>${c.id}</td><td>${fmtDate(c.createdAt)}</td><td>${esc(c.createdBy)}</td><td>${c.saleIds.length}</td>${WAREHOUSES.map(w=>`<td>${c.byWarehouse[w]||0}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="8" class="muted">Aún no hay cortes.</td></tr>'}</tbody></table></div></div>`;
};

const buildAlertsBaseV8=window.buildAlerts;
window.buildAlerts=function(){
  const alerts=buildAlertsBaseV8?buildAlertsBaseV8():[];
  if(isAdmin()){
    state.sales.filter(s=>s.status==='Confirmada'&&s.manualUploadRequired&&s.manualUploadStatus==='pending').forEach(s=>{
      if(!alerts.some(a=>a.title===`${s.id} · despacho bloqueado`))alerts.unshift({level:'red',title:`${s.id} · despacho bloqueado`,text:'Administración debe marcar el pedido como subido manual antes de permitir el despacho.'});
    });
  }
  return alerts;
};
