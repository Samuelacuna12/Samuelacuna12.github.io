/* INVICTO OPS v24 · presentación de histórico Shopify resuelto */
window.reportStatusLabelV23=function(st,reason=''){
  const m={nueva:'Nueva',asignada:'Nueva',en_gestion:'En gestión',no_contesta:'No contesta',seguimiento_programado:'Seguimiento futuro',pendiente_stock:'Pendiente stock',confirmada:'Confirmada',perdida:'Perdida',duplicada:'Duplicada',cancelada:'Cancelada',historica:'Resuelta',resuelta:'Resuelta'};
  if(st==='perdida'&&reason)return `Perdida · ${reason}`;
  return m[st]||st||'—';
};
window.reportStatusTagV23=function(r){
  if(isHistoricalV23(r))return r.source_cancelled_at?'<span class="tag green">RESUELTA · HISTÓRICO</span>':'<span class="tag green">RESUELTA</span>';
  const st=reportStatusLabelV23(r.status,r.loss_reason),cls=r.status==='confirmada'?'green':r.status==='perdida'||r.status==='cancelada'?'red':r.status==='duplicada'?'gray':r.status==='pendiente_stock'||r.status==='seguimiento_programado'?'amber':'blue';return `<span class="tag ${cls}">${esc(st)}</span>`;
};

window.openMonthlySaleV23=async function(dbId){
  const live=(state.sales||[]).find(s=>String(s.dbId)===String(dbId));if(live&&typeof openOrderV20==='function')return openOrderV20(live.dbId);
  const r=monthlyRowsV23.find(x=>String(x.id)===String(dbId));if(!r)return toast('No encontré la venta');
  const d=el('orderDrawer');if(!d)return;
  d.innerHTML='<div class="drawer-head"><div><div class="eyebrow">HISTORIAL</div><h2>Cargando venta…</h2></div><div class="spacer"></div><button class="close" onclick="closeOrder()">×</button></div>';
  el('drawerBack')?.classList.add('open');d.classList.add('open');
  const historical=isHistoricalV23(r);let items=[];
  try{
    if(historical){const q=await invictoSupabaseV12.from('shopify_sales_history_items').select('id,title,variant_title,sku,quantity,current_quantity,unit_price,currency_code').eq('history_id',dbId);if(q.error)throw q.error;items=q.data||[]}
    else{const q=await invictoSupabaseV12.from('sale_items').select('id,external_title,external_variant,external_sku,quantity,mapping_status,product_variant_id,warehouse_id').eq('sale_id',dbId).order('line_number');if(q.error)throw q.error;items=q.data||[]}
  }catch(e){console.warn('history items',e)}
  const itemsHtml=items.length?`<div class="report-items-v23">${items.map((x,i)=>{const title=historical?x.title:x.external_title,variant=historical?(x.variant_title||x.sku):x.external_variant||x.external_sku,meta=historical?`${Number(x.quantity||0)} uds${Number(x.unit_price||0)?' · '+money(x.unit_price):''}`:`${Number(x.quantity||1)} uds · ${esc(x.mapping_status||'')}`;return `<div><span>${i+1}</span><b>${esc(title||'Producto')}</b><small>${esc(variant||'')} · ${meta}</small></div>`}).join('')}</div>`:'<div class="muted">Sin líneas disponibles para este pedido.</div>';
  d.innerHTML=`<div class="drawer-head"><div><div class="eyebrow">${esc(rowCodeV23(r))}</div><h2>${historical?'Compra histórica':'Detalle de venta'}</h2></div><div class="spacer"></div>${reportStatusTagV23(r)}<button class="close" onclick="closeOrder()">×</button></div><div class="drawer-body">${historical?'<div class="panel"><div class="panel-body"><b>RESUELTA · HISTÓRICO SHOPIFY</b><div class="muted">Registro de consulta. No se asigna asesor, no genera SLA, no reserva inventario y no entra a cortes.</div></div></div>':''}<div class="form-section"><h3>Cliente</h3><div class="report-detail-grid-v23"><div><small>Nombre</small><b>${esc(r.customer_name||'—')}</b></div><div><small>Teléfono</small><b>${esc(r.customer_phone||'—')}</b></div><div><small>Email</small><b>${esc(r.customer_email||'—')}</b></div><div><small>Ciudad</small><b>${esc([r.customer_city,r.customer_department].filter(Boolean).join(', ')||'—')}</b></div><div class="span2"><small>Dirección</small><b>${esc(r.customer_address||'—')}</b></div></div></div><div class="form-section"><h3>Venta</h3><div class="report-detail-grid-v23"><div><small>Fecha</small><b>${esc(r.commercial_date)}</b></div><div><small>Asesor</small><b>${historical?'Pre-POS':esc(r.advisor_name||'—')}</b></div><div><small>Origen</small><b>${esc(r.source||'—')}</b></div><div><small>Tipo</small><b>${historical?'Histórico Shopify':isDraftV23(r)?'Borrador':'Pedido'}</b></div><div><small>Unidades</small><b>${Number(r.quantity||0)}</b></div><div><small>Valor</small><b>${money(r.total_price)}</b></div><div><small>Estado financiero Shopify</small><b>${esc(r.financial_status||'—')}</b></div><div><small>Fulfillment Shopify</small><b>${esc(r.fulfillment_status||'—')}</b></div></div></div><div class="form-section"><h3>Productos</h3>${itemsHtml}</div>${historical?'':`<div class="form-section"><h3>Despacho OPS</h3><div class="report-detail-grid-v23"><div><small>Bodega</small><b>${esc(r.warehouse_name||'—')}</b></div><div><small>Transportadora</small><b>${esc(r.carrier||'—')}</b></div><div><small>Guía</small><b>${esc(r.tracking_number||'—')}</b></div><div><small>Estado</small><b>${esc(shipmentLabelV23(r.shipment_status))}</b></div></div></div>`}</div><div class="drawer-foot"><button class="btn light" onclick="closeOrder()">Cerrar</button></div>`;
};

window.syncHistoryV23=async function(){toast('Histórico Shopify completo: 14.931 pedidos importados. Las ventas nuevas entran automáticamente por webhook.')};
