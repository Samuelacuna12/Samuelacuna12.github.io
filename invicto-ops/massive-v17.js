/* INVICTO OPS v17 · exportación MASSIVE Hoko / LogiGho / Bucaramanga */

const HOKO_HEADERS_V17=[
'NOMBRE','IDENTIFICACION (OPCIONAL)','CORREO  (OPCIONAL)','TELEFONO','CIUDAD','DEPARTAMENTO','DIRECCION','INFORMACION ADICIONAL (OPCIONAL)','TRANSPORTADORA','TIPO DE ENTREGA (OPCIONAL)','FECHA DE ENTREGA ESTIMADA','FORMA DE PAGO','ALTO','ANCHO','LARGO','PESO','DICE CONTENER','VALOR DECLARADO (OPCIONAL)',
...Array.from({length:15},(_,i)=>[`ID STOCK ${i+1}`,`CANTIDAD STOCK ${i+1}`,`PRECIO POR UNIDAD STOCK ${i+1}`]).flat()
];
const LOGIGHO_HEADERS_V17=[
'NOMBRE COMPLETO','IDENTIFICACION (OPCIONAL)','CORREO (OPCIONAL)','TELEFONO','CIUDAD','DEPARTAMENTO','DIRECCION','INFORMACION ADICIONAL (OPCIONAL)','TRANSPORTADORA','FECHA DE ENTREGA ESTIMADA','FORMA DE PAGO','FECHA RECOGIDA','ALTO','ANCHO','LARGO','PESO','APLICA CONTRA PAGO','TIPO ENTREGA','ASESOR','DICE CONTENER','SEGURO','VALOR DECLARADO','COSTO TRANSPORTE','ID TIENDA',
...Array.from({length:12},(_,i)=>[`ID STOCK ${i+1}`,`CANTIDAD STOCK ${i+1}`,`PRECIO POR UNIDAD STOCK ${i+1}`]).flat(),
'OBSERVACIONES','CODIGO OFICINA','CODIGO REGIONAL','CIUDAD ORIGEN','DIRECCION ORIGEN','VALOR BASE PRODUCTO'
];

let logighoCitiesV17=null;
function normCityV17(v=''){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
function digitsV17(v=''){return String(v||'').replace(/\D/g,'')}
function plusDaysV17(n){const d=new Date();d.setDate(d.getDate()+n);return d}
function dateTextV17(d){return new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}
function safeFileV17(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')}
function cutSalesV17(cut){const ids=new Set(cut?.saleIds||[]);return state.sales.filter(s=>ids.has(s.id))}
function exactUnitsV17(s){return Array.isArray(s?.items)?s.items.filter(x=>x?.variantKey):[]}
function inventoryRowForUnitV17(u,w){return state.inventory.find(r=>r.warehouse===w&&r.variantKey===u.variantKey)||null}
function linePricesV17(total,n){n=Math.max(1,Number(n||1));let t=Math.max(0,Math.round(Number(total||0)));const base=Math.floor(t/n),rem=t-base*n;return Array.from({length:n},(_,i)=>base+(i<rem?1:0))}
function containsTextV17(units,qty){const cats=[...new Set(units.map(x=>String(x.product||'').toUpperCase()))];let label=cats.some(x=>x.includes('BRIEF'))?'BRIEF':cats.some(x=>x.includes('MEDIA'))?'MEDIAS':'BOXER';return `${qty} ${label}${qty===1?'':' '} - CLIENTE AUTORIZADO A REVISAR`}
function hokoCarrierV17(s){const c=normCityV17(s.carrier);if(c.includes('INTER'))return 'INTER';const city=normCityV17(s.city);if(s.warehouse==='Hoko Bogotá'&&city.includes('BOGOTA'))return 'HOKO ENVIOS BOGOTA';return 'HOKO ENVIOS NACIONAL'}
function logiCarrierV17(s){const c=normCityV17(s.carrier);return c.includes('ENVIA')?'ENVIA':'INTERRAPIDISIMO'}
function paymentHokoV17(s){return normCityV17(s.payment).includes('CONTRA')?'RECAUDO':'CREDITO'}
function isCODV17(s){return normCityV17(s.payment).includes('CONTRA')||normCityV17(s.financialStatus).includes('PENDING')||normCityV17(s.financialStatus).includes('PENDIENTE')}

async function loadLogighoCitiesV17(force=false){
  if(logighoCitiesV17&&!force)return logighoCitiesV17;
  const {data,error}=await invictoSupabaseV12.from('logigho_city_codes').select('label,code,normalized_key,city,department').limit(5000);if(error)throw error;
  logighoCitiesV17=data||[];return logighoCitiesV17;
}
function resolveLogighoCityV17(s){
  const arr=logighoCitiesV17||[],city=normCityV17(s.city),dept=normCityV17(s.department),full=`${city} ${dept}`.trim();
  let row=arr.find(x=>normCityV17(x.normalized_key)===full||normCityV17(x.label)===full);
  if(!row&&city){const candidates=arr.filter(x=>normCityV17(x.city)===city||normCityV17(x.label).startsWith(city+' '));if(candidates.length===1)row=candidates[0];else if(dept)row=candidates.find(x=>normCityV17(x.department)===dept)}
  return row||null;
}

async function importLogighoCatalogV17(file){
  if(!file||!isAdmin())return;
  try{
    if(typeof XLSX==='undefined')throw new Error('No está disponible el lector de Excel');
    const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array'}),ws=wb.Sheets['opciones'];if(!ws)throw new Error('La plantilla no contiene la hoja "opciones"');
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}).slice(1).filter(r=>r[0]&&r[1]).map(r=>{
      const label=String(r[0]).trim(),code=String(r[1]).trim();const parts=label.split('/');const department=parts.length>1?parts.pop():'';const city=parts.join('/');
      return {label,code,normalized_key:normCityV17(`${city} ${department}`),city,department};
    });
    if(!rows.length)throw new Error('No encontré ciudades válidas');
    for(let i=0;i<rows.length;i+=350){const {error}=await invictoSupabaseV12.from('logigho_city_codes').upsert(rows.slice(i,i+350),{onConflict:'label'});if(error)throw error}
    await loadLogighoCitiesV17(true);toast(`Catálogo LogiGho cargado: ${rows.length} ciudades`);
  }catch(e){console.error(e);toast('No se pudo cargar catálogo LogiGho: '+(e.message||e))}
  finally{const x=document.getElementById('logiCatalogV17');if(x)x.value=''}
}

function validateSaleForMassiveV17(s,maxLines){
  const units=exactUnitsV17(s);if(!units.length)return 'Faltan referencias exactas de talla/diseño/color';
  if(units.length>maxLines)return `${units.length} unidades exceden las ${maxLines} líneas automáticas`;
  for(const u of units){const r=inventoryRowForUnitV17(u,s.warehouse);if(!r?.externalId)return `Falta ID externo para ${u.size||''} ${u.design||''}`}
  return '';
}
function hokoRowV17(s){
  const units=exactUnitsV17(s),prices=linePricesV17(s.price,units.length),stock=[];
  units.forEach((u,i)=>{const r=inventoryRowForUnitV17(u,s.warehouse);stock.push(String(r.externalId),1,prices[i])});
  while(stock.length<45)stock.push(null);
  return [
    s.name||'',null,s.email||null,digitsV17(s.phone),`${String(s.city||'').toUpperCase()}${s.department?` - ${String(s.department).toUpperCase()}`:''}`,String(s.department||'').toUpperCase(),s.address||'',s.notes||null,hokoCarrierV17(s),null,dateTextV17(plusDaysV17(5)),paymentHokoV17(s),10,10,10,1,containsTextV17(units,units.length),null,...stock
  ];
}
async function logighoRowV17(s){
  const city=resolveLogighoCityV17(s);if(!city)throw new Error(`Sin código LogiGho para ${s.city||'—'} / ${s.department||'—'}`);
  const units=exactUnitsV17(s),prices=linePricesV17(s.price,units.length),stock=[];
  units.forEach((u,i)=>{const r=inventoryRowForUnitV17(u,s.warehouse);stock.push(String(r.externalId),1,prices[i])});while(stock.length<36)stock.push(null);
  return [s.name||'',null,s.email||null,digitsV17(s.phone),String(city.code),String(city.label),s.address||'',s.notes||null,logiCarrierV17(s),dateTextV17(plusDaysV17(5)),'CONTADO',null,10,10,10,1,isCODV17(s)?'SI':'NO',s.deliveryMode==='Reclama en oficina'?2:1,String(s.advisor||'').toUpperCase(),containsTextV17(units,units.length),'SI',Math.round(Number(s.price||0)),null,12083,...stock,containsTextV17(units,units.length),null,null,null,null,null];
}
function bgaRowV17(s){const units=exactUnitsV17(s);return [s.id,s.name||'',digitsV17(s.phone),s.city||'',s.department||'',s.address||'',s.advisor||'',units.length,units.map(u=>`${u.product||'Producto'} ${u.size||''} ${u.design||''}`).join(' | '),Math.round(Number(s.price||0)),s.payment||'',s.notes||'']}

async function exportCutV17(cutId,warehouse){
  if(!isAdmin())return toast('Solo administración o gerencia puede generar massives');
  const cut=state.cuts.find(c=>c.id===cutId);if(!cut)return toast('Corte no encontrado');
  const sales=cutSalesV17(cut).filter(s=>s.warehouse===warehouse),manual=[],rows=[];
  if(!sales.length)return toast('Este corte no tiene pedidos para '+warehouse);
  try{
    if(warehouse==='LogiGho Medellín')await loadLogighoCitiesV17();
    const max=warehouse==='LogiGho Medellín'?12:warehouse.startsWith('Hoko')?15:9999;
    for(const s of sales){
      let reason=validateSaleForMassiveV17(s,max);
      if(!reason&&warehouse==='LogiGho Medellín'&&!resolveLogighoCityV17(s))reason=`Sin código LogiGho: ${s.city||'—'} / ${s.department||'—'}`;
      if(reason){manual.push([s.id,s.name,warehouse,reason,s.qty||exactUnitsV17(s).length]);continue}
      if(warehouse==='LogiGho Medellín')rows.push(await logighoRowV17(s));else if(warehouse.startsWith('Hoko'))rows.push(hokoRowV17(s));else rows.push(bgaRowV17(s));
    }
    const wb=XLSX.utils.book_new();let headers,operator;
    if(warehouse==='LogiGho Medellín'){headers=LOGIGHO_HEADERS_V17;operator='LogiGho'}else if(warehouse.startsWith('Hoko')){headers=HOKO_HEADERS_V17;operator='Hoko'}else{headers=['PEDIDO','NOMBRE','TELEFONO','CIUDAD','DEPARTAMENTO','DIRECCION','ASESOR','UNIDADES','DETALLE EXACTO','VALOR','PAGO','OBSERVACIONES'];operator='Bucaramanga'}
    const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);ws['!freeze']={xSplit:0,ySplit:1};XLSX.utils.book_append_sheet(wb,ws,'ordenes');
    if(manual.length){const m=XLSX.utils.aoa_to_sheet([['PEDIDO','CLIENTE','BODEGA','MOTIVO','UNIDADES'],...manual]);XLSX.utils.book_append_sheet(wb,m,'PENDIENTES_MANUAL')}
    const label=cut.displayId||`C-${String(cut.id).slice(0,6)}`,file=`${safeFileV17(label)}_${safeFileV17(operator)}_${safeFileV17(warehouse)}.xlsx`;
    XLSX.writeFile(wb,file);
    try{await invictoSupabaseV12.rpc('log_dispatch_export',{p_cut_id:cut.id,p_warehouse_name:warehouse,p_operator:operator,p_file_name:file,p_sale_count:rows.length,p_notes:manual.length?`${manual.length} pedidos quedaron en PENDIENTES_MANUAL`:null})}catch(e){console.warn('No export log',e)}
    toast(`${file}: ${rows.length} pedidos${manual.length?` · ${manual.length} manuales`:''}`);
  }catch(e){console.error(e);toast('No se pudo generar massive: '+(e.message||e))}
}

const renderCutsBaseV17=window.renderCuts;
window.renderCuts=function(){
  renderCutsBaseV17();const host=document.getElementById('view-cuts');if(!host)return;
  const cuts=[...(state.cuts||[])].slice(0,12);
  host.insertAdjacentHTML('afterbegin',`<div class="panel" style="margin-bottom:14px"><div class="panel-head"><div><h3>Exportación MASSIVE</h3><div class="muted">Genera el archivo exacto del operador usando los IDs de la bodega y prorratea el valor comercial para que cuadre.</div></div><div class="spacer"></div>${isAdmin()?`<label class="btn light sm">Catálogo ciudades LogiGho<input id="logiCatalogV17" type="file" accept=".xlsx,.xls" hidden onchange="importLogighoCatalogV17(this.files[0])"></label>`:''}</div><div class="table-wrap"><table><thead><tr><th>Corte</th><th>Fecha</th><th>Hoko Bogotá</th><th>Hoko Medellín</th><th>LogiGho</th><th>Bucaramanga</th></tr></thead><tbody>${cuts.map(c=>{const ss=cutSalesV17(c);const btn=w=>{const n=ss.filter(s=>s.warehouse===w).length;return n&&isAdmin()?`<button class="btn navy sm" onclick="exportCutV17('${c.id}','${w}')">Descargar ${n}</button>`:`<span class="muted">${n||0}</span>`};return `<tr><td><b>${esc(c.displayId||c.id)}</b></td><td>${fmtDate(c.createdAt)}</td><td>${btn('Hoko Bogotá')}</td><td>${btn('Hoko Medellín')}</td><td>${btn('LogiGho Medellín')}</td><td>${btn('Bucaramanga')}</td></tr>`}).join('')||'<tr><td colspan="6" class="muted">Crea un corte para habilitar los massives.</td></tr>'}</tbody></table></div></div>`);
};
