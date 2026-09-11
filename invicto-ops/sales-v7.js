/* INVICTO OPS v7 · pedidos que exceden el massive pasan confirmados + carga manual */

function massiveRuleV7(warehouse=''){
  if(warehouse==='LogiGho Medellín')return {operator:'LogiGho',maxLines:12};
  if(warehouse==='Hoko Bogotá'||warehouse==='Hoko Medellín')return {operator:'Hoko',maxLines:15};
  return null;
}

function massiveLineCountV7(items=[]){
  const ids=new Set((items||[]).map(x=>String(x.externalId||'').trim()).filter(Boolean));
  return ids.size;
}

function manualMassiveCheckV7(warehouse,items=[]){
  const rule=massiveRuleV7(warehouse);
  if(!rule)return {required:false,lineCount:0,maxLines:null,operator:''};
  const lineCount=massiveLineCountV7(items);
  return {
    required:lineCount>rule.maxLines,
    lineCount,
    maxLines:rule.maxLines,
    operator:rule.operator,
    reason:lineCount>rule.maxLines?`El pedido usa ${lineCount} IDs diferentes y el massive de ${rule.operator} admite máximo ${rule.maxLines} líneas.`:''
  };
}

const saveOrderV6BaseV7=window.saveOrderV3;
window.saveOrderV3=function(confirm){
  const editingBefore=editingSaleId;
  const warehouse=el('fWarehouse')?.value||'';
  const previewItems=confirm?exactItemsV3(warehouse):[];
  const manual=confirm?manualMassiveCheckV7(warehouse,previewItems):null;

  saveOrderV6BaseV7(confirm);

  if(!confirm)return;
  const sale=editingBefore?state.sales.find(x=>x.id===editingBefore):state.sales[0];
  if(!sale)return;

  const result=manual||manualMassiveCheckV7(sale.warehouse,sale.items||[]);
  sale.manualUploadRequired=!!result.required;
  sale.manualUploadStatus=result.required?'pending':null;
  sale.manualUploadReason=result.reason||'';
  sale.massiveLineCount=result.lineCount||0;
  sale.massiveMaxLines=result.maxLines||null;
  sale.massiveOperator=result.operator||'';
  if(result.required){
    sale.manualUploadDetectedAt=new Date().toISOString();
    sale.manualUploadedAt=null;
    sale.manualUploadedBy='';
  }
  saveState();
  if(typeof filterSales==='function'&&el('salesBody'))filterSales();
  if(typeof renderAI==='function')renderAI();
  if(result.required)toast(`Venta confirmada · pendiente por subir manual a ${result.operator}`);
};

function manualUploadTagV7(s){
  if(s.manualUploadRequired&&s.manualUploadStatus==='pending')return '<span class="tag red" style="margin-left:5px">PENDIENTE SUBIR MANUAL</span>';
  if(s.manualUploadRequired&&s.manualUploadStatus==='done')return '<span class="tag green" style="margin-left:5px">SUBIDO MANUAL</span>';
  return '';
}

window.filterSales=function(){
  const q=(el('salesSearch')?.value||'').toLowerCase(), st=el('salesStatus')?.value||'';
  const rows=todaySales().filter(s=>(!q||[s.name,s.phone,s.city,s.id,s.advisor].join(' ').toLowerCase().includes(q))&&(!st||s.status===st));
  el('salesBody').innerHTML=rows.map((s,i)=>`<tr><td><b>${i+1}</b><div class="muted mono">${s.id}</div></td><td class="mono">${new Date(s.createdAt).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</td><td><b>${esc(s.name)}</b></td><td class="mono">${esc(s.phone)}</td><td>${esc(s.city)}</td><td>${esc(s.advisor||'Sin asignar')}</td><td>${statusTag(s.status)}${manualUploadTagV7(s)}</td><td>${esc(s.attempts??0)}</td><td>${esc(s.summary||'—')}</td><td><b>${money(s.price)}</b></td><td>${esc(s.warehouse||'—')}</td><td><button class="btn light sm" onclick="openOrder('${s.id}')">Abrir</button></td></tr>`).join('')||'<tr><td colspan="12" class="muted">No hay resultados.</td></tr>';
};

function markManualUploadedV7(id){
  if(!isAdmin())return toast('Solo administración puede cerrar esta notificación');
  const s=state.sales.find(x=>x.id===id);if(!s)return;
  s.manualUploadStatus='done';
  s.manualUploadedAt=new Date().toISOString();
  s.manualUploadedBy=session.name;
  saveState();
  renderCuts();
  renderAI();
  toast(`${id} marcado como subido manual`);
}

const buildAlertsBaseV7=window.buildAlerts;
window.buildAlerts=function(){
  const alerts=buildAlertsBaseV7?buildAlertsBaseV7():[];
  if(isAdmin()){
    state.sales
      .filter(s=>s.status==='Confirmada'&&s.manualUploadRequired&&s.manualUploadStatus==='pending')
      .forEach(s=>alerts.unshift({
        level:'red',
        title:`${s.id} · carga manual pendiente`,
        text:`${s.massiveOperator||'Operador'}: ${s.massiveLineCount||'—'} líneas / máximo ${s.massiveMaxLines||'—'}. Debe subirse manualmente antes del despacho.`
      }));
  }
  return alerts;
};

window.renderCuts=function(){
  const pending=state.sales.filter(s=>s.status==='Confirmada'&&!s.cutId);
  const manualPending=state.sales.filter(s=>s.status==='Confirmada'&&s.manualUploadRequired&&s.manualUploadStatus==='pending');
  el('view-cuts').innerHTML=`<div class="page-title"><div><h1>Cortes / Guías</h1><p>Cortes fijos 11:00 y 17:00. Los pedidos que exceden el límite del massive siguen confirmados, pero quedan señalados para carga manual por administración.</p></div>${isAdmin()?'<button class="btn cyan" onclick="createCut()">Crear corte ahora</button>':''}</div>
  <div class="cards">${WAREHOUSES.map(w=>kpi(w,pending.filter(s=>s.warehouse===w).length,'pedidos pendientes')).join('')}${kpi('Carga manual',manualPending.length,'requieren administración')}</div>
  <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Pedidos listos para próximo corte</h3><div class="spacer"></div><span class="tag blue">${pending.length} pedidos</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Asesor</th><th>Bodega</th><th>Transportadora</th><th>Valor</th><th>Estado massive</th><th>Acción</th></tr></thead><tbody>${pending.map(s=>`<tr><td>${s.id}</td><td>${esc(s.name)}</td><td>${esc(s.advisor)}</td><td>${esc(s.warehouse)}</td><td>${esc(s.carrier||'Por definir')}</td><td>${money(s.price)}</td><td>${s.manualUploadRequired&&s.manualUploadStatus==='pending'?`<span class="tag red">PENDIENTE SUBIR MANUAL</span><div class="muted">${esc(s.manualUploadReason||'')}</div>`:'<span class="tag green">AUTOMÁTICO</span>'}</td><td>${s.manualUploadRequired&&s.manualUploadStatus==='pending'&&isAdmin()?`<button class="btn light sm" onclick="markManualUploadedV7('${s.id}')">Marcar subido manual</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="8" class="muted">No hay pedidos pendientes.</td></tr>'}</tbody></table></div></div>
  <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Historial de cortes</h3></div><div class="table-wrap"><table><thead><tr><th>Corte</th><th>Fecha</th><th>Creado por</th><th>Pedidos</th><th>Hoko BOG</th><th>Hoko MED</th><th>LogiGho</th><th>BGA</th></tr></thead><tbody>${state.cuts.map(c=>`<tr><td>${c.id}</td><td>${fmtDate(c.createdAt)}</td><td>${esc(c.createdBy)}</td><td>${c.saleIds.length}</td>${WAREHOUSES.map(w=>`<td>${c.byWarehouse[w]||0}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="8" class="muted">Aún no hay cortes.</td></tr>'}</tbody></table></div></div>`;
};
