/* INVICTO OPS v11 · movimientos físicos de inventario */

function ensureInventoryMovementsV11(){
  if(!Array.isArray(state.inventoryMovements))state.inventoryMovements=[];
}

function addInventoryMovementV11({saleId,type,warehouse,variantKey,qty,beforeStock,afterStock,beforeReserved,afterReserved,note=''}){
  ensureInventoryMovementsV11();
  state.inventoryMovements.unshift({
    id:'MOV-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),
    saleId,type,warehouse,variantKey,qty,
    beforeStock,afterStock,beforeReserved,afterReserved,
    note,createdAt:new Date().toISOString(),createdBy:session?.name||'Sistema'
  });
}

function dispatchValidationV11(s){
  if(!s)return {ok:false,reason:'Pedido no encontrado'};
  if(s.status!=='Confirmada')return {ok:false,reason:'El pedido debe estar confirmado antes de despacharse.'};
  if(s.dispatchStatus==='Despachado')return {ok:false,reason:'Este pedido ya fue despachado.'};
  if(typeof dispatchGateV8==='function'){
    const gate=dispatchGateV8(s);if(!gate.allowed)return {ok:false,reason:gate.reason};
  }
  const requested=Number(s.stockReservationRequested||0);
  const reserved=Number(s.stockReservationQty||0);
  if(!requested)return {ok:false,reason:'El pedido todavía no tiene referencias de inventario reservadas.'};
  if(reserved!==requested)return {ok:false,reason:`No se puede despachar con reserva incompleta (${reserved}/${requested}).`};
  const lines=Array.isArray(s.stockReservationItems)?s.stockReservationItems:[];
  if(!lines.length)return {ok:false,reason:'No se encontró el detalle de la reserva.'};
  for(const line of lines){
    const r=recordV3(line.variantKey,line.warehouse);
    const qty=Number(line.qty||0);
    if(!r)return {ok:false,reason:'Una referencia reservada ya no existe en el inventario.'};
    if(Number(r.reserved||0)<qty)return {ok:false,reason:`La reserva de una referencia cambió. Revisa el pedido antes de despachar.`};
    if(Number(r.stock||0)<qty)return {ok:false,reason:'El stock físico ya no alcanza para completar el despacho.'};
  }
  return {ok:true,reason:''};
}

function markDispatchedV11(id){
  const s=state.sales.find(x=>x.id===id);
  const valid=dispatchValidationV11(s);
  if(!valid.ok)return toast(valid.reason);
  const now=new Date().toISOString();
  const dispatched=[];

  (s.stockReservationItems||[]).forEach(line=>{
    const r=recordV3(line.variantKey,line.warehouse);if(!r)return;
    const qty=Number(line.qty||0);
    const beforeStock=Number(r.stock||0),beforeReserved=Number(r.reserved||0);
    r.stock=Math.max(0,beforeStock-qty);
    r.reserved=Math.max(0,beforeReserved-qty);
    dispatched.push({warehouse:line.warehouse,variantKey:line.variantKey,qty});
    addInventoryMovementV11({saleId:s.id,type:'DESPACHO',warehouse:line.warehouse,variantKey:line.variantKey,qty,beforeStock,afterStock:r.stock,beforeReserved,afterReserved:r.reserved,note:'Reserva convertida en salida física'});
  });

  s.dispatchedInventoryItems=dispatched;
  s.stockReservationItems=[];
  s.stockReservationQty=0;
  s.stockReservationActive=false;
  s.stockReservationStatus='dispatched';
  s.dispatchStatus='Despachado';
  s.dispatchedAt=now;
  s.dispatchedBy=session?.name||'Sistema';
  s.returnStatus=null;
  saveState();
  if(document.getElementById('view-cuts')?.classList.contains('active'))renderCuts();
  if(document.getElementById('view-inventory')?.classList.contains('active'))renderInventory();
  if(typeof renderAI==='function')renderAI();
  toast(`${id}: despachado · stock físico descontado`);
}

function markReturnInTransitV11(id){
  const s=state.sales.find(x=>x.id===id);if(!s)return;
  if(s.dispatchStatus!=='Despachado')return toast('Solo un pedido despachado puede entrar en devolución.');
  if(s.returnStatus==='Recibida')return toast('La devolución ya fue recibida físicamente.');
  s.returnStatus='En tránsito';
  s.returnInTransitAt=new Date().toISOString();
  s.returnInTransitBy=session?.name||'Sistema';
  saveState();
  if(document.getElementById('view-cuts')?.classList.contains('active'))renderCuts();
  toast(`${id}: devolución en tránsito · el stock físico NO cambia`);
}

function receiveReturnV11(id){
  if(!isAdmin())return toast('Solo administración puede confirmar la recepción física de una devolución.');
  const s=state.sales.find(x=>x.id===id);if(!s)return;
  if(s.dispatchStatus!=='Despachado')return toast('Este pedido no figura como despachado.');
  if(s.returnStatus==='Recibida')return toast('Esta devolución ya fue ingresada al inventario.');
  if(s.returnStatus!=='En tránsito')return toast('Primero marca la devolución como en tránsito.');
  const lines=Array.isArray(s.dispatchedInventoryItems)?s.dispatchedInventoryItems:[];
  if(!lines.length)return toast('No hay detalle de unidades despachadas para retornar.');

  lines.forEach(line=>{
    const r=recordV3(line.variantKey,line.warehouse);if(!r)return;
    const qty=Number(line.qty||0);
    const beforeStock=Number(r.stock||0),beforeReserved=Number(r.reserved||0);
    r.stock=beforeStock+qty;
    addInventoryMovementV11({saleId:s.id,type:'DEVOLUCION_RECIBIDA',warehouse:line.warehouse,variantKey:line.variantKey,qty,beforeStock,afterStock:r.stock,beforeReserved,afterReserved:r.reserved,note:'Mercancía recibida físicamente en bodega'});
  });

  s.returnStatus='Recibida';
  s.returnReceivedAt=new Date().toISOString();
  s.returnReceivedBy=session?.name||'Sistema';
  s.dispatchStatus='Devuelto recibido';
  saveState();
  if(document.getElementById('view-cuts')?.classList.contains('active'))renderCuts();
  if(document.getElementById('view-inventory')?.classList.contains('active'))renderInventory();
  if(typeof renderAI==='function')renderAI();
  toast(`${id}: devolución recibida · stock físico restaurado`);
}

function inventoryFlowTagV11(s){
  if(s.returnStatus==='Recibida')return '<span class="tag green">DEVOLUCIÓN RECIBIDA</span>';
  if(s.returnStatus==='En tránsito')return '<span class="tag amber">DEVOLUCIÓN EN TRÁNSITO</span>';
  if(s.dispatchStatus==='Despachado')return '<span class="tag blue">DESPACHADO</span>';
  if(s.stockReservationStatus==='reserved')return '<span class="tag green">RESERVADO</span>';
  if(s.stockReservationStatus==='partial')return '<span class="tag amber">RESERVA PARCIAL</span>';
  return '<span class="tag gray">PENDIENTE</span>';
}

const renderCutsBaseV11=window.renderCuts;
window.renderCuts=function(){
  renderCutsBaseV11();
  const host=document.getElementById('view-cuts');if(!host)return;
  const rows=state.sales.filter(s=>s.status==='Confirmada'||s.dispatchStatus==='Despachado'||s.returnStatus==='En tránsito'||s.returnStatus==='Recibida');
  if(!rows.length)return;
  host.insertAdjacentHTML('beforeend',`<div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Movimientos físicos de inventario</h3><div class="spacer"></div><span class="tag blue">${rows.length}</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Stock</th><th>Guía</th><th>Estado físico</th><th>Acción</th></tr></thead><tbody>${rows.map(s=>{
    const canDispatch=dispatchValidationV11(s).ok;
    let action='—';
    if(s.returnStatus==='En tránsito')action=isAdmin()?`<button class="btn cyan sm" onclick="receiveReturnV11('${s.id}')">Recibir devolución</button>`:'<span class="muted">Esperando recepción</span>';
    else if(s.dispatchStatus==='Despachado')action=`<button class="btn light sm" onclick="markReturnInTransitV11('${s.id}')">Marcar devolución</button>`;
    else if(canDispatch)action=`<button class="btn navy sm" onclick="markDispatchedV11('${s.id}')">Marcar despachado</button>`;
    else action=`<span class="muted">${esc(dispatchValidationV11(s).reason||'No disponible')}</span>`;
    return `<tr><td><b>${esc(s.id)}</b></td><td>${esc(s.name)}</td><td>${inventoryFlowTagV11(s)}</td><td class="mono">${esc(s.guide||'—')}</td><td>${s.dispatchStatus==='Despachado'?'Físico descontado':s.returnStatus==='Recibida'?'Físico restaurado':s.returnStatus==='En tránsito'?'Sin cambio hasta recibir':'Reserva activa'}</td><td>${action}</td></tr>`;
  }).join('')}</tbody></table></div></div>`);
};
