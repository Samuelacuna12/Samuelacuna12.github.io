/* INVICTO OPS v20 · inventario por 4 fuentes + validación previa */
const inventoryPendingV20=new Map();
const INVENTORY_UPLOADS_V20={
  'Hoko Bogotá':{kind:'hoko',label:'Hoko Bogotá',hint:'Export de stock Hoko. Esta tarjeta toma únicamente FULFILLMENT BOGOTA.',accent:'HOKO BOG'},
  'Hoko Medellín':{kind:'hoko',label:'Hoko Medellín',hint:'Export de stock Hoko. Esta tarjeta toma únicamente FULFILLMENT MEDELLIN.',accent:'HOKO MED'},
  'LogiGho Medellín':{kind:'logi',label:'LogiGho Medellín',hint:'Archivo Resumen Inventario de LogiGho. Se utiliza la columna Actual.',accent:'LOGIGHO'},
  'Bucaramanga':{kind:'bga',label:'Bucaramanga',hint:'Maestro local con REFERENCIA, DISEÑO y STOCK ACTUAL. No requiere ID externo.',accent:'BGA'}
};

function invNumV20(v){const n=Number(v);return Number.isFinite(n)?n:0}
function invWarehouseRowsV20(w){return (state.inventory||[]).filter(r=>r.warehouse===w)}
function invWarehouseStatsV20(w){const rows=invWarehouseRowsV20(w);return {rows:rows.length,physical:rows.reduce((a,r)=>a+Math.max(0,invNumV20(r.stock)),0),reserved:rows.reduce((a,r)=>a+Math.max(0,invNumV20(r.reserved)),0),available:rows.reduce((a,r)=>a+availableStock(r),0),updated:rows.map(r=>r.updatedAt).filter(Boolean).sort().at(-1)||null}}
function invKnownHokoExcludedV20(name=''){const u=cleanText(name);return /OPCION|CAJA BOXER|CAJA MERCANCIA|GARANTIA/.test(u)}
function invInternalPayloadV20(r){return {internal_sku:canonicalVariantKey(r.product,r.material,r.style,r.size,r.design),product:r.product,material:r.material,style:r.style,size:r.size,design:r.design,stock:Math.max(0,invNumV20(r.sourceStock??r.stock)),external_id:String(r.externalId||''),external_name:r.name||''}}

async function parseInventoryFileV20(file,warehouse){
  const cfg=INVENTORY_UPLOADS_V20[warehouse];if(!cfg)throw new Error('Bodega no reconocida');
  if(typeof XLSX==='undefined')throw new Error('No está disponible el lector de Excel');
  const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:null});
  if(!rows.length)throw new Error('El archivo está vacío');
  const keys=Object.keys(rows[0]).map(x=>String(x).trim());
  const report={warehouse,fileName:file.name,kind:cfg.kind,sourceRows:rows.length,targetRows:0,acceptedRows:0,ignoredRows:0,invalidRows:0,negativeRows:0,duplicateRows:0,sourcePositive:0,acceptedPhysical:0,externalIds:0,invalidExamples:[],ignoredExamples:[],hardErrors:[]};
  let normalized=[];
  if(cfg.kind==='hoko'){
    if(!(keys.includes('Nombre del producto')&&keys.includes('Bodega')&&keys.includes('Stock actual')))throw new Error('Este archivo no corresponde al formato de stock Hoko');
    const token=warehouse==='Hoko Medellín'?'MEDELLIN':'BOGOTA';
    const target=rows.filter(r=>cleanText(r['Bodega']).includes(token));report.targetRows=target.length;
    for(const r of target){
      const raw=invNumV20(r['Stock actual']);report.sourcePositive+=Math.max(0,raw);if(raw<0)report.negativeRows++;
      const n=normalizeHokoRow(r,warehouse);
      if(n){normalized.push(n);report.acceptedRows++;report.acceptedPhysical+=Math.max(0,invNumV20(n.sourceStock));if(n.externalId)report.externalIds++;}
      else if(invKnownHokoExcludedV20(r['Nombre del producto'])){report.ignoredRows++;if(report.ignoredExamples.length<5)report.ignoredExamples.push(String(r['Nombre del producto']||''));}
      else{report.invalidRows++;if(report.invalidExamples.length<5)report.invalidExamples.push(String(r['Nombre del producto']||''));}
    }
  }else if(cfg.kind==='logi'){
    if(!(keys.includes('Nombre')&&keys.includes('Actual')&&keys.includes('ID')))throw new Error('Este archivo no corresponde al formato de inventario LogiGho');
    report.targetRows=rows.length;
    for(const r of rows){const raw=invNumV20(r['Actual']);report.sourcePositive+=Math.max(0,raw);if(raw<0)report.negativeRows++;const n=normalizeLogiRow(r);if(n){normalized.push(n);report.acceptedRows++;report.acceptedPhysical+=Math.max(0,invNumV20(n.sourceStock));if(n.externalId)report.externalIds++;}else{report.invalidRows++;if(report.invalidExamples.length<5)report.invalidExamples.push(String(r['Nombre']||''));}}
  }else{
    if(!(keys.includes('REFERENCIA')||keys.includes('Referencia'))||!(keys.includes('STOCK ACTUAL')||keys.includes('Stock actual')))throw new Error('Este archivo no corresponde al formato de inventario Bucaramanga');
    report.targetRows=rows.length;
    for(const r of rows){const raw=invNumV20(r['STOCK ACTUAL']??r['Stock actual']);report.sourcePositive+=Math.max(0,raw);if(raw<0)report.negativeRows++;const n=normalizeBgaRow(r);if(n){normalized.push(n);report.acceptedRows++;report.acceptedPhysical+=Math.max(0,invNumV20(n.sourceStock));}else if(raw===0){report.ignoredRows++;if(report.ignoredExamples.length<5)report.ignoredExamples.push(`${r['__EMPTY']??r['TALLA']??''} · ${r['REFERENCIA']??r['Referencia']??''}`);}else{report.invalidRows++;if(report.invalidExamples.length<5)report.invalidExamples.push(`${r['__EMPTY']??r['TALLA']??''} · ${r['REFERENCIA']??r['Referencia']??''}`);}}
  }
  if(!report.targetRows)report.hardErrors.push('El archivo no contiene filas para esta bodega.');
  if(!normalized.length)report.hardErrors.push('No se encontró ninguna variante válida para importar.');
  if(report.invalidRows)report.hardErrors.push(`${report.invalidRows} filas con stock no pudieron interpretarse.`);
  const payload=normalized.map(invInternalPayloadV20),seen=new Map();
  payload.forEach(x=>{seen.set(x.internal_sku,(seen.get(x.internal_sku)||0)+1)});const dups=[...seen].filter(([,n])=>n>1);report.duplicateRows=dups.reduce((a,[,n])=>a+n-1,0);if(dups.length)report.hardErrors.push(`${dups.length} variantes canónicas están repetidas dentro del archivo.`);
  if(cfg.kind!=='bga'&&report.externalIds!==report.acceptedRows)report.hardErrors.push('Hay variantes válidas sin ID externo del operador.');
  return {report,payload};
}

function inventoryValidationHtmlV20(p){if(!p)return '<div class="muted" style="margin-top:10px">Selecciona un archivo para validarlo antes de reemplazar esta bodega.</div>';const r=p.report,ok=!r.hardErrors.length;return `<div class="inv-validation-v20 ${ok?'ok':'bad'}"><div class="inv-validation-title"><b>${ok?'✓ Archivo validado':'⚠ Revisión requerida'}</b><span>${esc(r.fileName)}</span></div><div class="inv-validation-grid"><span>Filas fuente <b>${r.targetRows}</b></span><span>Variantes válidas <b>${r.acceptedRows}</b></span><span>Físico a importar <b>${r.acceptedPhysical.toLocaleString('es-CO')}</b></span><span>Negativos <b>${r.negativeRows}</b></span><span>Ignoradas <b>${r.ignoredRows}</b></span><span>Inválidas <b>${r.invalidRows}</b></span></div>${r.kind==='hoko'&&r.sourcePositive!==r.acceptedPhysical?`<div class="inv-explain-v20">El export trae ${r.sourcePositive.toLocaleString('es-CO')} unidades positivas en todas sus filas, pero ${Math.max(0,r.sourcePositive-r.acceptedPhysical).toLocaleString('es-CO')} pertenecen a filas no vendibles/agrupadas como GARANTÍA, CAJA u OPCIÓN. No se suman al stock utilizable.</div>`:''}${r.kind==='bga'&&r.negativeRows?`<div class="inv-explain-v20">Bucaramanga tiene ${r.negativeRows} filas negativas. El físico vendible las toma como 0, por eso el total utilizable se calcula sin restar stock negativo.</div>`:''}${r.ignoredExamples.length?`<details><summary>Ver ejemplos ignorados</summary><div class="muted">${r.ignoredExamples.map(esc).join(' · ')}</div></details>`:''}${r.invalidExamples.length?`<details open><summary>Ver filas no interpretadas</summary><div class="muted">${r.invalidExamples.map(esc).join(' · ')}</div></details>`:''}${r.hardErrors.length?`<div class="blocking">${r.hardErrors.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`:`<button class="btn cyan sm" style="margin-top:10px" onclick="applyInventoryV20('${r.warehouse}')">Aplicar actualización validada</button>`}</div>`}

window.stageInventoryV20=async function(warehouse,file){if(!file||!isAdmin())return;try{toast(`Validando ${warehouse}…`);const parsed=await parseInventoryFileV20(file,warehouse);inventoryPendingV20.set(warehouse,parsed);renderInventory();toast(parsed.report.hardErrors.length?'Archivo revisado · hay errores que corregir':'Archivo validado · listo para aplicar')}catch(e){console.error(e);inventoryPendingV20.set(warehouse,{report:{warehouse,fileName:file.name,kind:INVENTORY_UPLOADS_V20[warehouse]?.kind||'',hardErrors:[e.message||String(e)],targetRows:0,acceptedRows:0,acceptedPhysical:0,negativeRows:0,ignoredRows:0,invalidRows:0,ignoredExamples:[],invalidExamples:[]},payload:[]});renderInventory();toast('No se pudo validar: '+(e.message||e))}finally{const i=document.getElementById('invFileV20-'+warehouse.replace(/\W+/g,'-'));if(i)i.value=''}};

window.applyInventoryV20=async function(warehouse){const pending=inventoryPendingV20.get(warehouse);if(!pending||pending.report.hardErrors.length)return toast('Primero valida un archivo correcto');if(!isAdmin())return toast('Solo administración o gerencia puede actualizar inventario');try{toast(`Actualizando ${warehouse}…`);const {data,error}=await invictoSupabaseV12.rpc('apply_ops_inventory_import',{p_warehouse_name:warehouse,p_rows:pending.payload,p_source_name:pending.report.fileName});if(error)throw error;await hydrateOpsV13(true);const actual=invWarehouseStatsV20(warehouse).physical;pending.report.applied=true;pending.report.actualPhysical=actual;pending.report.appliedAt=new Date().toISOString();if(actual!==pending.report.acceptedPhysical)pending.report.hardErrors=[`Después de importar, Supabase reporta ${actual} unidades y el archivo validado ${pending.report.acceptedPhysical}. No continúes sin revisar.`];renderInventory();if(typeof renderAI==='function')renderAI();toast(actual===pending.report.acceptedPhysical?`${warehouse}: ${actual.toLocaleString('es-CO')} unidades verificadas`:`${warehouse}: diferencia detectada después de importar`)}catch(e){console.error(e);toast('No se pudo actualizar: '+(e.message||e))}};

function inventoryUploadCardV20(w){const cfg=INVENTORY_UPLOADS_V20[w],s=invWarehouseStatsV20(w),p=inventoryPendingV20.get(w),id='invFileV20-'+w.replace(/\W+/g,'-');return `<div class="inv-upload-card-v20"><div class="inv-upload-top-v20"><div><span class="eyebrow">${cfg.accent}</span><h3>${cfg.label}</h3></div><span class="tag ${s.rows?'green':'amber'}">${s.rows?'CARGADO':'PENDIENTE'}</span></div><div class="inv-upload-metrics-v20"><div><small>Físico actual</small><b>${s.physical.toLocaleString('es-CO')}</b></div><div><small>Variantes</small><b>${s.rows}</b></div><div><small>Reservado</small><b>${s.reserved}</b></div></div><p class="muted">${cfg.hint}</p>${isAdmin()?`<label class="btn navy sm inv-file-btn-v20">Seleccionar archivo<input id="${id}" type="file" accept=".xlsx,.xls" hidden onchange="stageInventoryV20('${w}',this.files[0])"></label>`:''}${inventoryValidationHtmlV20(p)}</div>`}

window.renderInventory=function(){
  const totals=warehouseTotals(),anomalies=(state.inventory||[]).filter(r=>r.sourceStock!=null&&Number(r.sourceStock)<0).length;
  el('view-inventory').innerHTML=`<div class="page-title"><div><h1>Inventario</h1><p>Cuatro fuentes independientes. Cada archivo se valida antes de reemplazar el stock de su bodega.</p></div><span class="tag green">SUPABASE EN VIVO</span></div>
  <div class="inv-upload-grid-v20">${WAREHOUSES.map(inventoryUploadCardV20).join('')}</div>
  ${anomalies?`<div class="warning" style="margin-top:12px"><b>Atención:</b> ${anomalies} registros de la base están marcados con origen negativo; disponible nunca baja de 0.</div>`:''}
  <div class="panel" style="margin-top:14px"><div class="panel-head"><div><h3>Maestro consolidado</h3><div class="muted">Físico − reservado = disponible. IDs externos se mantienen separados por operador.</div></div><div class="spacer"></div><div class="segmented"><button class="${inventoryModeV4==='consolidado'?'active':''}" onclick="setInventoryModeV4('consolidado')">Consolidado</button><button class="${inventoryModeV4==='detalle'?'active':''}" onclick="setInventoryModeV4('detalle')">Por bodega</button></div></div><div class="panel-head" style="border-top:1px solid var(--line)"><div class="toolbar"><input id="invSearch" class="search" placeholder="Buscar diseño, color, talla o ID..." oninput="filterInventory()"><select id="invProduct" class="search" onchange="filterInventory()"><option value="">Todos los productos</option>${Object.entries(PRODUCT_CATALOG).map(([k,p])=>`<option value="${k}">${p.label}</option>`).join('')}</select><select id="invSize" class="search" onchange="filterInventory()"><option value="">Todas las tallas</option>${['2-4','6-8','10-12','14-16','S','M','L','XL','2XL','3XL','4XL','UNICA'].map(s=>`<option>${s}</option>`).join('')}</select></div><div class="spacer"></div><span class="tag blue">${Object.values(totals).reduce((a,b)=>a+b,0).toLocaleString('es-CO')} físico</span></div><div class="table-wrap"><table><thead id="invHead"></thead><tbody id="invBody"></tbody></table></div></div>`;
  filterInventory();
};

// Compatibilidad: cualquier llamada antigua abre ahora el flujo validado y exige bodega explícita.
window.importInventory=function(file){if(!file)return;toast('Usa una de las 4 tarjetas de bodega para cargar el stock correcto.');};
