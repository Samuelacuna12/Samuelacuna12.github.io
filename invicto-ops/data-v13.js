/* INVICTO OPS v13 · datos operativos reales Supabase
   Hidrata ventas, inventario, equipo, cortes, garantías, novedades y logística.
   Las ventas se guardan en Postgres y la confirmación reserva stock transaccionalmente. */

let opsHydratedV13=false;
let opsLoadingV13=false;
let opsRealtimeV13=null;
let opsReloadTimerV13=null;
let opsProfilesV13=[];
let opsWarehousesV13=[];
let opsSaleItemsV13=[];
let opsShipmentsV13=[];
let opsAttemptsV13=[];
const renderBaseV13=window.render;
const saveOrderBaseV13=window.saveOrderV3;

function todayBogotaV13(){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const m=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return `${m.year}-${m.month}-${m.day}`;
}
function dateDaysAgoV13(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
function dbStatusToUiV13(st,reason=''){
  const x={nueva:'Nueva',asignada:'Nueva',en_gestion:'Nueva',no_contesta:'No contesta',seguimiento_programado:'Seguimiento futuro',pendiente_stock:'Pendiente stock',confirmada:'Confirmada',duplicada:'Duplicado',cancelada:'Cancelada'}[st];
  if(st==='perdida')return reason?`Perdido – ${reason}`:'Perdido – cambió de opinión';
  return x||'Nueva';
}
function uiStatusToDbV13(st=''){
  if(st==='Confirmada')return {status:'confirmada',loss_reason:''};
  if(st==='No contesta')return {status:'no_contesta',loss_reason:''};
  if(st==='Seguimiento futuro'||st==='Llamar más tarde')return {status:'seguimiento_programado',loss_reason:''};
  if(st==='Pendiente stock')return {status:'pendiente_stock',loss_reason:''};
  if(st==='Duplicado')return {status:'duplicada',loss_reason:''};
  if(st.startsWith('Cancelad'))return {status:'cancelada',loss_reason:''};
  if(st.startsWith('Perdido'))return {status:'perdida',loss_reason:st.split('–').slice(1).join('–').trim()||'Otro'};
  return {status:'nueva',loss_reason:''};
}
function escV13(s=''){return typeof esc==='function'?esc(s):String(s)}

async function fetchAllV13(table,select='*',configure=null){
  const out=[];let from=0;const step=900;
  while(true){
    let q=invictoSupabaseV12.from(table).select(select).range(from,from+step-1);
    if(configure)q=configure(q);
    const {data,error}=await q;if(error)throw error;
    out.push(...(data||[]));
    if(!data||data.length<step)break;
    from+=step;
  }
  return out;
}
function sourceSummaryV13(lines=[]){
  const src=lines.filter(x=>!String(x.source_line_item_id||'').startsWith('ops:'));
  if(!src.length)return '';
  return src.map(x=>`${Number(x.source_quantity||x.quantity||1)} ${x.external_title||'producto'}${x.external_variant?` · ${x.external_variant}`:''}`).join(' + ');
}
function buildInventoryV13(inventory,variants,warehouses,external){
  const pv=new Map(variants.map(x=>[x.id,x]));
  const wh=new Map(warehouses.map(x=>[x.id,x]));
  const ex=new Map(external.map(x=>[`${x.warehouse_id}|${x.product_variant_id}`,x]));
  const rows=inventory.map(i=>{
    const p=pv.get(i.product_variant_id)||{},w=wh.get(i.warehouse_id)||{},e=ex.get(`${i.warehouse_id}|${i.product_variant_id}`)||{};
    const product=p.category||'Producto',material=p.material||'',style=p.style||'',size=p.size||'',design=p.design_or_color||'';
    return {
      id:`DB|${i.warehouse_id}|${i.product_variant_id}`,
      dbWarehouseId:i.warehouse_id,productVariantId:i.product_variant_id,
      operator:w.operator||'',warehouse:w.name||'Sin bodega',externalId:String(e.external_id||''),name:e.external_name||`${product} ${size} ${design}`,
      reference:p.internal_sku||'',stock:Math.max(0,Number(i.on_hand||0)),sourceStock:Number(i.on_hand||0),reserved:Number(i.reserved||0),min:0,status:'',
      product,material,style,size,design,productKey:canonicalProductKey(product,material,style),variantKey:canonicalVariantKey(product,material,style,size,design),updatedAt:i.updated_at
    };
  });
  const sources={};
  WAREHOUSES.forEach(name=>{const r=rows.filter(x=>x.warehouse===name);sources[name]={rows:r.length,updatedAt:r.map(x=>x.updatedAt).filter(Boolean).sort().at(-1)||new Date().toISOString(),fileName:'Supabase',parser:'database-v13'}});
  return {rows,sources};
}
function expandOpsItemsV13(lines,variantMap,warehouseMap){
  const out=[];
  lines.filter(x=>String(x.source_line_item_id||'').startsWith('ops:')).forEach(line=>{
    const p=variantMap.get(line.product_variant_id)||{},w=warehouseMap.get(line.warehouse_id)||{};
    const vk=canonicalVariantKey(p.category||'',p.material||'',p.style||'',p.size||'',p.design_or_color||'');
    for(let i=0;i<Number(line.quantity||1);i++)out.push({variantKey:vk,product:p.category||'',material:p.material||'',style:p.style||'',size:p.size||'',design:p.design_or_color||'',warehouse:w.name||'',productVariantId:p.id||line.product_variant_id,warehouseId:line.warehouse_id});
  });
  return out;
}
function saleDisplayIdV13(s){return s.source_order_name||s.source_draft_order_name||(s.daily_number?`V-${String(s.daily_number).padStart(3,'0')}`:`V-${String(s.id).slice(0,8)}`)}

async function hydrateOpsV13(force=false){
  if(!session||opsLoadingV13)return;
  if(opsHydratedV13&&!force)return;
  opsLoadingV13=true;
  try{
    const since=dateDaysAgoV13(120);
    const [profiles,warehouses,variants,inventory,external,sales,customers,saleItems,reservations,shipments,warranties,novelties,cuts,cutSales,attempts,alerts,targets,schedules]=await Promise.all([
      fetchAllV13('profiles','id,full_name,username,role,active,can_receive_sales,last_seen_at'),
      fetchAllV13('warehouses','*'),fetchAllV13('product_variants','*'),fetchAllV13('inventory','*'),fetchAllV13('external_product_ids','*'),
      fetchAllV13('sales','*',q=>q.gte('commercial_date',since).order('received_at',{ascending:false})),fetchAllV13('customers','*'),fetchAllV13('sale_items','*'),
      fetchAllV13('stock_reservations','*'),fetchAllV13('shipments','*'),fetchAllV13('warranties','*'),fetchAllV13('logistics_novelties','*'),
      fetchAllV13('dispatch_cuts','*'),fetchAllV13('dispatch_cut_sales','*'),fetchAllV13('sale_attempts','*'),fetchAllV13('alerts','*'),fetchAllV13('monthly_targets','*'),fetchAllV13('work_schedules','*')
    ]);
    opsProfilesV13=profiles;opsWarehousesV13=warehouses;opsSaleItemsV13=saleItems;opsShipmentsV13=shipments;opsAttemptsV13=attempts;
    const pm=new Map(profiles.map(x=>[x.id,x])),cm=new Map(customers.map(x=>[x.id,x])),wm=new Map(warehouses.map(x=>[x.id,x])),vm=new Map(variants.map(x=>[x.id,x]));
    const itemsBySale=new Map(),resBySale=new Map(),shipBySale=new Map(),attemptBySale=new Map();
    saleItems.forEach(x=>{if(!itemsBySale.has(x.sale_id))itemsBySale.set(x.sale_id,[]);itemsBySale.get(x.sale_id).push(x)});
    reservations.filter(x=>x.status==='reserved').forEach(x=>{if(!resBySale.has(x.sale_id))resBySale.set(x.sale_id,[]);resBySale.get(x.sale_id).push(x)});
    shipments.forEach(x=>shipBySale.set(x.sale_id,x));attempts.forEach(x=>{if(!attemptBySale.has(x.sale_id))attemptBySale.set(x.sale_id,[]);attemptBySale.get(x.sale_id).push(x)});
    const inv=buildInventoryV13(inventory,variants,warehouses,external);state.inventory=inv.rows;state.inventorySources=inv.sources;
    state.sales=sales.map(s=>{
      const c=cm.get(s.customer_id)||{},p=pm.get(s.assigned_to)||{},lines=itemsBySale.get(s.id)||[],ops=s.ops_data||{},shipment=shipBySale.get(s.id),r=resBySale.get(s.id)||[];
      const exact=expandOpsItemsV13(lines,vm,wm),sourceQty=Number(s.source_quantity||0),qty=Number(s.quantity||sourceQty||exact.length||0);
      const reserved=r.reduce((a,x)=>a+Number(x.quantity||0),0),whName=ops.warehouse||wm.get(lines.find(x=>String(x.source_line_item_id||'').startsWith('ops:'))?.warehouse_id)?.name||wm.get(shipment?.warehouse_id)?.name||'';
      const srcSummary=sourceSummaryV13(lines),isDraft=s.source_entity_type==='draft_order';
      const summary=ops.summary||srcSummary||(qty?`${qty} unidades`:'Sin detalle');
      return {
        id:saleDisplayIdV13(s),dbId:s.id,dailyNumber:s.daily_number,commercialDate:s.commercial_date,createdAt:s.received_at||s.created_at,receivedAt:s.received_at,
        name:c.full_name||'Sin nombre',phone:c.phone||'',email:c.email||'',city:c.city||'',department:c.department||'',address:c.address||'',
        source:'Shopify'===s.source?'Shopify':(s.source||'Shopify'),sourceEntityType:s.source_entity_type||'order',sourceOrderId:s.source_order_id,sourceDraftOrderId:s.source_draft_order_id,isDraft,
        advisor:p.full_name||'Sin asignar',advisorId:s.assigned_to,status:dbStatusToUiV13(s.status,s.loss_reason),lossReason:s.loss_reason||'',attempts:(attemptBySale.get(s.id)||[]).length,
        qty,sourceQty,price:Number(s.total_price||0),currency:s.currency_code||'COP',payment:s.payment_method||'Contraentrega',financialStatus:s.financial_status||'',fulfillmentStatus:s.fulfillment_status||'',
        size:ops.size||'MIXTO',summary,warehouse:whName,carrier:shipment?.carrier||ops.carrier||'',guide:shipment?.tracking_number||ops.guide||'',deliveryMode:shipment?.office_pickup?'Reclama en oficina':(ops.deliveryMode||'Domicilio'),notes:s.notes||'',
        groups:Array.isArray(ops.groups)?ops.groups:[],items:exact,sourceItems:lines.filter(x=>!String(x.source_line_item_id||'').startsWith('ops:')),mappingStatus:s.mapping_status,
        confirmedAt:s.confirmed_at,confirmedBy:s.confirmed_by,stockReservationItems:r.map(x=>({warehouse:wm.get(x.warehouse_id)?.name||'',warehouseId:x.warehouse_id,productVariantId:x.product_variant_id,variantKey:canonicalVariantKey(vm.get(x.product_variant_id)?.category||'',vm.get(x.product_variant_id)?.material||'',vm.get(x.product_variant_id)?.style||'',vm.get(x.product_variant_id)?.size||'',vm.get(x.product_variant_id)?.design_or_color||''),qty:Number(x.quantity||0)})),
        stockReservationRequested:Number(ops?.reservation?.requested||qty||0),stockReservationQty:reserved,stockReservationStatus:reserved?((reserved===Number(ops?.reservation?.requested||qty))?'reserved':'partial'):'pending',stockReservationActive:reserved>0,
        cutId:null,manualUploadRequired:!!ops.manualUploadRequired,manualUploadStatus:ops.manualUploadStatus||null,manualUploadReason:ops.manualUploadReason||'',massiveLineCount:ops.massiveLineCount||0,massiveMaxLines:ops.massiveMaxLines||null,massiveOperator:ops.massiveOperator||'',
        manualGuideNumber:ops.manualGuideNumber||'',manualGuideDate:ops.manualGuideDate||'',manualGuideCarrier:ops.manualGuideCarrier||'',dispatchStatus:shipment?dbLogisticsToUiV13(shipment.status):ops.dispatchStatus||'',returnStatus:ops.returnStatus||'',opsData:ops
      };
    });
    const saleByDb=new Map(state.sales.map(x=>[x.dbId,x]));
    cutSales.forEach(x=>{const s=saleByDb.get(x.sale_id);if(s)s.cutId=x.cut_id});
    state.cuts=cuts.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(c=>{const ids=cutSales.filter(x=>x.cut_id===c.id).map(x=>saleByDb.get(x.sale_id)).filter(Boolean);const by={};ids.forEach(s=>by[s.warehouse]=(by[s.warehouse]||0)+1);return {id:c.id,displayId:`C-${String(c.id).slice(0,6).toUpperCase()}`,createdAt:c.created_at,createdBy:pm.get(c.created_by)?.full_name||'Sistema',saleIds:ids.map(x=>x.id),byWarehouse:by,cutType:c.cut_type}});
    state.guarantees=warranties.map(g=>{const s=saleByDb.get(g.sale_id);return {id:g.id,displayId:`G-${String(g.id).slice(0,6).toUpperCase()}`,saleId:s?.id||'',dbSaleId:g.sale_id,advisor:pm.get(g.owner_advisor_id)?.full_name||'',client:s?.name||'',reason:g.reason,status:dbWarrantyToUiV13(g.status),external:g.probable_responsible||'',lastUpdate:g.last_customer_update_at||g.created_at,proposedSolution:g.proposed_solution||'',adminDecision:g.admin_solution||'',transferAmount:Number(g.transfer_amount||0),transferDone:!!g.transfer_done}});
    state.novelties=novelties.map(n=>{const s=saleByDb.get(n.sale_id),sh=shipments.find(x=>x.id===n.shipment_id);return {id:n.id,displayId:`N-${String(n.id).slice(0,6).toUpperCase()}`,saleId:s?.id||'',dbSaleId:n.sale_id,advisor:pm.get(n.owner_advisor_id)?.full_name||'',client:s?.name||'',phone:n.imported_phone||s?.phone||'',date:n.imported_date||n.created_at?.slice(0,10)||'',guide:sh?.tracking_number||'',type:n.description,status:dbNoveltyToUiV13(n.status),lastUpdate:n.updated_at,source:n.source}});
    state.alerts=alerts;state.monthlyTargets=targets;state.workSchedules=schedules;state.profiles=profiles;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){}
    opsHydratedV13=true;
    startRealtimeV13();
  }finally{opsLoadingV13=false;}
}
function dbLogisticsToUiV13(st){return ({pendiente:'Pendiente despacho',lista_despacho:'Lista despacho',guia_generada:'Guía generada',en_transito:'Despachado',reclama_oficina:'Reclama en oficina',entregada:'Entregada',novedad:'Novedad',devuelta:'Devuelto recibido',cancelada:'Cancelada'})[st]||st||''}
function dbWarrantyToUiV13(st){return ({abierta:'Abierta',en_gestion:'En gestión',esperando_externo:'Esperando respuesta externa',pendiente_validacion_admin:'Resuelta pendiente de validación',requiere_gestion_adicional:'Requiere gestión adicional',cerrada:'Cerrada'})[st]||st}
function dbNoveltyToUiV13(st){return ({abierta:'Abierta',en_gestion:'En gestión',esperando_externo:'Esperando respuesta externa',pendiente_validacion_admin:'Resuelta pendiente de validación',cerrada:'Cerrada'})[st]||st}

function renderLoadingV13(){
  if(!document.getElementById('app'))return;
  document.getElementById('app').innerHTML='<section class="login-shell"><div class="login-card"><div class="login-art"><div class="brand"><span class="planet"></span><div>INVICTO OPS</div></div><h1>Conectando operación…</h1><p>Cargando ventas, inventario, equipo y logística desde Supabase.</p></div><div class="login-form"><div class="eyebrow">DATOS EN VIVO</div><h2>Sincronizando</h2><p>Esto normalmente toma unos segundos.</p></div></div></section>';
}
window.render=function(){
  if(session&&!opsHydratedV13){renderLoadingV13();hydrateOpsV13().then(()=>renderBaseV13()).catch(e=>{console.error(e);renderBaseV13();toast('No fue posible cargar los datos reales: '+(e.message||e))});return;}
  renderBaseV13();
};
window.todaySales=function(){const d=todayBogotaV13();return state.sales.filter(s=>s.commercialDate===d)};

function startRealtimeV13(){
  if(opsRealtimeV13||!session)return;
  const trigger=()=>{clearTimeout(opsReloadTimerV13);opsReloadTimerV13=setTimeout(async()=>{try{await hydrateOpsV13(true);if(session)renderBaseV13()}catch(e){console.error('Realtime reload',e)}},700)};
  opsRealtimeV13=invictoSupabaseV12.channel('invicto-ops-live-v13');
  ['sales','sale_items','inventory','stock_reservations','shipments','warranties','logistics_novelties','dispatch_cuts','dispatch_cut_sales','profiles'].forEach(table=>opsRealtimeV13.on('postgres_changes',{event:'*',schema:'public',table},trigger));
  opsRealtimeV13.subscribe();
  if(!window.__invictoFallbackV13)window.__invictoFallbackV13=setInterval(()=>{if(session)trigger()},30000);
}

function advisorIdFromNameV13(name){return opsProfilesV13.find(x=>x.full_name===name)?.id||null}
function warehouseIdFromNameV13(name){return opsWarehousesV13.find(x=>x.name===name)?.id||null}
function buildOpsPayloadV13(s){
  const st=uiStatusToDbV13(s.status||'Nueva'),agg=new Map();
  (s.items||[]).forEach(u=>{
    const r=state.inventory.find(x=>x.variantKey===u.variantKey&&x.warehouse===(s.warehouse||u.warehouse));if(!r?.productVariantId||!r?.dbWarehouseId)return;
    const k=`${r.productVariantId}|${r.dbWarehouseId}`;const x=agg.get(k)||{product_variant_id:r.productVariantId,warehouse_id:r.dbWarehouseId,quantity:0,title:r.product,variant:`${r.size} · ${r.design}`,sku:r.reference||''};x.quantity++;agg.set(k,x);
  });
  const opsData={...(s.opsData||{}),groups:s.groups||[],summary:s.summary||'',size:s.size||'MIXTO',warehouse:s.warehouse||'',carrier:s.carrier||'',deliveryMode:s.deliveryMode||'Domicilio',manualUploadRequired:!!s.manualUploadRequired,manualUploadStatus:s.manualUploadStatus||null,manualUploadReason:s.manualUploadReason||'',massiveLineCount:s.massiveLineCount||0,massiveMaxLines:s.massiveMaxLines||null,massiveOperator:s.massiveOperator||'',manualGuideNumber:s.manualGuideNumber||'',manualGuideDate:s.manualGuideDate||'',manualGuideCarrier:s.manualGuideCarrier||'',dispatchStatus:s.dispatchStatus||'',returnStatus:s.returnStatus||''};
  return {name:s.name||'',phone:s.phone||'',email:s.email||'',city:s.city||'',department:s.department||'',address:s.address||'',source:s.source||'manual',advisor_id:advisorIdFromNameV13(s.advisor),status:st.status,loss_reason:st.loss_reason,quantity:Number(s.qty||s.items?.length||0),total_price:Number(s.price||0),currency_code:'COP',payment_method:s.payment||'Contraentrega',notes:s.notes||'',items:[...agg.values()],ops_data:opsData};
}

window.saveOrderV3=async function(confirm){
  const editingBefore=editingSaleId;
  const beforeIds=new Set(state.sales.map(x=>x.id));
  saveOrderBaseV13(confirm);
  if(document.getElementById('orderDrawer')?.classList.contains('open'))return;
  let s=editingBefore?state.sales.find(x=>x.id===editingBefore):state.sales.find(x=>!beforeIds.has(x.id));
  if(!s)s=state.sales[0];if(!s)return;
  try{
    toast('Guardando en INVICTO OPS…');
    const payload=buildOpsPayloadV13(s);
    const {data,error}=await invictoSupabaseV12.rpc('save_ops_sale',{p_sale_id:s.dbId||null,p_payload:payload,p_confirm:!!confirm});
    if(error)throw error;
    await hydrateOpsV13(true);switchView('sales');renderAI();
    toast(confirm?`Venta confirmada · ${Number(data?.reserved||0)} unidades reservadas`:'Gestión guardada en Supabase');
  }catch(e){
    console.error(e);await hydrateOpsV13(true).catch(()=>{});if(session)renderBaseV13();toast('No se guardó: '+(e.message||e));
  }
};

window.filterSales=function(){
  if(!el('salesBody'))return;
  const q=(el('salesSearch')?.value||'').toLowerCase(),st=el('salesStatus')?.value||'';
  const rows=todaySales().filter(s=>(!q||[s.name,s.phone,s.city,s.id,s.advisor,s.summary].join(' ').toLowerCase().includes(q))&&(!st||s.status===st));
  el('salesBody').innerHTML=rows.map((s,i)=>`<tr><td><b>${i+1}</b><div class="muted mono">${escV13(s.id)}</div></td><td class="mono">${new Date(s.createdAt).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</td><td><b>${escV13(s.name)}</b>${s.isDraft?'<div><span class="tag amber">BORRADOR</span></div>':''}</td><td class="mono">${escV13(s.phone)}</td><td>${escV13(s.city)}</td><td>${escV13(s.advisor||'Sin asignar')}</td><td>${statusTag(s.status)}${typeof manualUploadTagV7==='function'?manualUploadTagV7(s):''}</td><td>${escV13(s.attempts??0)}</td><td>${escV13(s.summary||'—')}<div class="muted">${s.mappingStatus==='pending'?'Referencias por definir':'Referencias mapeadas'}</div></td><td><b>${money(s.price)}</b></td><td>${escV13(s.warehouse||'—')}</td><td><button class="btn light sm" onclick="openOrder('${escV13(s.id)}')">Abrir</button></td></tr>`).join('')||'<tr><td colspan="12" class="muted">No hay resultados.</td></tr>';
};

// Si auth v12 terminó antes de cargar este archivo, hidrata inmediatamente.
if(session){opsHydratedV13=false;render();}
