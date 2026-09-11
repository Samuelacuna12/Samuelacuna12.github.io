/* INVICTO OPS v10 · reserva de stock desde la creación del pedido */

function reservationKeyV10(warehouse,variantKey){return `${warehouse}@@${variantKey}`;}

function reservationMapV10(lines=[]){
  const m=new Map();
  (lines||[]).forEach(x=>{
    const warehouse=x.warehouse||'';
    const variantKey=x.variantKey||'';
    const qty=Math.max(0,Number(x.qty||1));
    if(!warehouse||!variantKey||!qty)return;
    const k=reservationKeyV10(warehouse,variantKey);
    m.set(k,(m.get(k)||0)+qty);
  });
  return m;
}

function requestedMapV10(s){
  const m=new Map();
  const w=s?.warehouse||'';
  (s?.items||[]).forEach(x=>{
    if(!w||!x.variantKey)return;
    const k=reservationKeyV10(w,x.variantKey);
    m.set(k,(m.get(k)||0)+1);
  });
  return m;
}

function inferredOldAllocationV10(s){
  if(!s)return new Map();
  if(Array.isArray(s.stockReservationItems)&&s.stockReservationItems.length)return reservationMapV10(s.stockReservationItems);
  // Compatibilidad con ventas confirmadas antes de v10: el flujo anterior reservaba al confirmar.
  if(s.status==='Confirmada'&&s.warehouse&&Array.isArray(s.items)){
    return requestedMapV10(s);
  }
  return new Map();
}

function terminalSaleV10(status=''){
  const st=String(status||'');
  return st==='Duplicado'||st==='No recuperado – sin contacto'||st.startsWith('Perdido')||st.startsWith('Cancelad');
}

function inventoryReservedSnapshotV10(){
  const m=new Map();
  state.inventory.forEach(r=>m.set(reservationKeyV10(r.warehouse,r.variantKey),Number(r.reserved||0)));
  return m;
}

function recordFromReservationKeyV10(k){
  const pos=k.indexOf('@@');
  if(pos<0)return null;
  const warehouse=k.slice(0,pos),variantKey=k.slice(pos+2);
  return recordV3(variantKey,warehouse);
}

function allocationLinesV10(map){
  const out=[];
  for(const [k,qty] of map){
    const pos=k.indexOf('@@');
    if(pos<0||qty<=0)continue;
    out.push({warehouse:k.slice(0,pos),variantKey:k.slice(pos+2),qty});
  }
  return out;
}

function reconcileSaleReservationV10(s,oldAllocation,beforeReserved,afterReserved){
  if(!s)return;
  const requested=terminalSaleV10(s.status)?new Map():requestedMapV10(s);
  const desired=new Map();
  let requestedTotal=0,reservedTotal=0;

  // Calcula cuánto puede reservar esta venta sin tocar reservas de otros pedidos.
  for(const [k,need] of requested){
    requestedTotal+=need;
    const r=recordFromReservationKeyV10(k);
    if(!r)continue;
    const oldQty=oldAllocation.get(k)||0;
    const baseline=Math.max(0,(beforeReserved.get(k)||0)-oldQty);
    const physical=Math.max(0,Number(r.stock||0));
    const canHold=Math.max(0,physical-baseline);
    const qty=Math.min(need,canHold);
    if(qty>0){desired.set(k,qty);reservedTotal+=qty;}
  }

  // El flujo antiguo todavía puede haber sumado una reserva al confirmar.
  // La neutralizamos y dejamos exactamente la reserva calculada arriba.
  const keys=new Set([...oldAllocation.keys(),...desired.keys(),...beforeReserved.keys(),...afterReserved.keys()]);
  for(const k of keys){
    const r=recordFromReservationKeyV10(k);if(!r)continue;
    const oldQty=oldAllocation.get(k)||0;
    const newQty=desired.get(k)||0;
    const baseDelta=(afterReserved.get(k)||0)-(beforeReserved.get(k)||0);
    if(!oldQty&&!newQty&&!baseDelta)continue;
    const corrected=Number(r.reserved||0)+newQty-oldQty-baseDelta;
    r.reserved=Math.max(0,Math.min(Math.max(0,Number(r.stock||0)),corrected));
  }

  s.stockReservationItems=allocationLinesV10(desired);
  s.stockReservationRequested=requestedTotal;
  s.stockReservationQty=reservedTotal;
  s.stockReservationShortfall=Math.max(0,requestedTotal-reservedTotal);
  s.stockReservationStatus=requestedTotal===0?'pending':reservedTotal===requestedTotal?'reserved':reservedTotal>0?'partial':'pending';
  s.stockReservationActive=reservedTotal>0;
  if(reservedTotal>0&&!s.stockReservedAt)s.stockReservedAt=new Date().toISOString();
  if(reservedTotal===0)s.stockReservedAt=null;
  s.stockReservationUpdatedAt=new Date().toISOString();
}

const saveOrderV9BaseV10=window.saveOrderV3;
window.saveOrderV3=function(confirm){
  const editingBefore=editingSaleId;
  const oldSale=editingBefore?state.sales.find(x=>x.id===editingBefore):null;
  const oldAllocation=inferredOldAllocationV10(oldSale);
  const beforeReserved=inventoryReservedSnapshotV10();

  saveOrderV9BaseV10(confirm);

  const s=editingBefore?state.sales.find(x=>x.id===editingBefore):state.sales[0];
  if(!s)return;
  const afterReserved=inventoryReservedSnapshotV10();
  reconcileSaleReservationV10(s,oldAllocation,beforeReserved,afterReserved);
  saveState();

  if(typeof renderInventory==='function'&&document.getElementById('view-inventory')?.classList.contains('active'))renderInventory();
  if(typeof filterSales==='function'&&document.getElementById('salesBody'))filterSales();
  if(typeof renderAI==='function')renderAI();

  if(s.stockReservationStatus==='reserved')toast(`Pedido guardado · ${s.stockReservationQty} unidades reservadas`);
  else if(s.stockReservationStatus==='partial')toast(`Pedido guardado · reserva parcial ${s.stockReservationQty}/${s.stockReservationRequested}`);
  else if(!terminalSaleV10(s.status))toast('Pedido guardado · reserva pendiente de referencias/stock');
};

function reservationTagV10(s){
  if(terminalSaleV10(s.status))return '';
  if(s.stockReservationStatus==='reserved')return `<span class="tag green" style="margin-left:5px">STOCK RESERVADO ${s.stockReservationQty||0}</span>`;
  if(s.stockReservationStatus==='partial')return `<span class="tag amber" style="margin-left:5px">RESERVA ${s.stockReservationQty||0}/${s.stockReservationRequested||0}</span>`;
  return `<span class="tag gray" style="margin-left:5px">RESERVA PENDIENTE</span>`;
}

const manualUploadTagBaseV10=window.manualUploadTagV7;
window.manualUploadTagV7=function(s){
  return (manualUploadTagBaseV10?manualUploadTagBaseV10(s):'')+reservationTagV10(s);
};
