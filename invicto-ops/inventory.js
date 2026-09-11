const PRODUCT_CATALOG = {
  adulto_estampado:{label:'Bóxer hombre estampado',product:'Bóxer hombre',material:'licra',style:'estampado',sizes:['S','M','L','XL','2XL','3XL','4XL'],quantities:[3,6,12]},
  adulto_licra:{label:'Bóxer hombre unicolor · licra',product:'Bóxer hombre',material:'licra',style:'unicolor',sizes:['S','M','L','XL','2XL','3XL','4XL'],quantities:[3,6,12]},
  adulto_algodon:{label:'Bóxer hombre unicolor · algodón',product:'Bóxer hombre',material:'algodón',style:'unicolor',sizes:['S','M','L','XL','2XL','3XL','4XL'],quantities:[3,6,12]},
  mujer_algodon:{label:'Bóxer mujer · algodón',product:'Bóxer mujer',material:'algodón',style:'unicolor',sizes:['S','M','L','XL'],quantities:[6,12]},
  ninos_estampado:{label:'Bóxer niño estampado',product:'Bóxer niño',material:'licra',style:'estampado',sizes:['2-4','6-8','10-12','14-16'],quantities:[6,12]},
  brief:{label:'Brief',product:'Brief',material:'licra',style:'unicolor',sizes:['S','M','L','XL','2XL'],quantities:[3,6,12]}
};

function canonicalProductKey(product,material,style){return [product,material,style].join('|');}
function canonicalVariantKey(product,material,style,size,design){return [product,material,style,size,design].map(slugify).join('|');}
function slugify(v){return cleanText(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function cleanText(v=''){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();}
function normalizeSize(v=''){
  let s=cleanText(v).replace(/^TALLA\s*/,'').replace(/14\s*-\s*16/,'14-16').replace(/\s/g,'');
  return s;
}
function normalizeColor(v=''){
  // Conservador: no fusionar colores distintos entre operadores sin una equivalencia confirmada.
  // Solo corregimos el orden evidente "CLARO GRIS" -> "GRIS CLARO".
  let c=cleanText(v).replace(/^\d+\s+/,'').replace(/\bT-?(S|M|L|XL|2XL|3XL|4XL)\b/g,'').replace(/^[\s\-|]+|[\s\-|]+$/g,'');
  return c==='CLARO GRIS'?'GRIS CLARO':c;
}
function productLabelFromRow(r){
  const material=r.material?` · ${r.material}`:'';
  const style=r.style?` · ${r.style}`:'';
  return `${r.product||'Producto'}${material}${style}`;
}
function designDisplay(r){return r.style==='estampado'?`Diseño #${r.design}`:r.design;}
function availableStock(r){return Math.max(0,Number(r.stock||0)-Number(r.reserved||0));}

function inventorySourceStatus(){
  return Object.entries(state.inventorySources).map(([name,meta])=>`<div class="statline"><span>${name}</span><b class="${meta?'source-ok':'source-wait'}">${meta?`✓ ${meta.rows} variantes · ${fmtDate(meta.updatedAt)}`:'Pendiente de carga'}</b></div>`).join('');
}
function renderInventory(){
  const totals=warehouseTotals();
  const anomalies=state.inventory.filter(r=>r.sourceStock!=null&&Number(r.sourceStock)<0).length;
  el('view-inventory').innerHTML=`
    <div class="page-title"><div><h1>Inventario</h1><p>El stock se identifica por producto + material + tipo + talla + diseño/color. El ID externo queda separado por operador.</p></div></div>
    <div class="warehouse-grid">${WAREHOUSES.map(w=>`<div class="warehouse-card"><small>${w}</small><strong>${totals[w]||0}</strong><small>unidades físicas</small><div style="margin-top:8px">${state.inventorySources[w]?'<span class="tag green">Cargado</span>':'<span class="tag amber">Pendiente</span>'}</div></div>`).join('')}</div>
    ${anomalies?`<div class="warning" style="margin-top:12px"><b>Atención:</b> hay ${anomalies} filas con stock negativo en el archivo fuente. Para venta se toman como 0 y quedan marcadas para revisión.</div>`:''}
    <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Cargar inventario</h3><div class="spacer"></div><span class="tag gray">Excel .xlsx / .xls</span></div><div class="panel-body"><div class="upload-zone"><b>Sube Hoko, LogiGho o Bucaramanga.</b><p class="muted">No se mezclan IDs entre operadores. El sistema construye una variante interna común y luego enlaza el ID correcto según la bodega elegida.</p><input id="inventoryFile" type="file" accept=".xlsx,.xls" onchange="importInventory(this.files[0])"></div></div></div>
    <div class="panel" style="margin-top:14px"><div class="panel-head"><div class="toolbar"><input id="invSearch" class="search" placeholder="Buscar diseño, color, talla, ID..." oninput="filterInventory()"><select id="invWarehouse" class="search" onchange="filterInventory()"><option value="">Todas las bodegas</option>${WAREHOUSES.map(w=>`<option>${w}</option>`).join('')}</select><select id="invProduct" class="search" onchange="filterInventory()"><option value="">Todos los productos</option>${Object.entries(PRODUCT_CATALOG).map(([k,p])=>`<option value="${k}">${p.label}</option>`).join('')}</select></div><div class="spacer"></div><span class="tag blue" id="invCount">${state.inventory.length} registros</span></div><div class="table-wrap"><table><thead><tr><th>Bodega</th><th>Producto</th><th>Talla</th><th>Diseño / color</th>${isAdmin()?'<th>ID externo</th>':''}<th>Físico</th><th>Reservado</th><th>Disponible</th><th>Estado</th></tr></thead><tbody id="invBody"></tbody></table></div></div>`;
  filterInventory();
}
function warehouseTotals(){const out={};state.inventory.forEach(r=>out[r.warehouse]=(out[r.warehouse]||0)+Math.max(0,Number(r.stock||0)));return out;}
function filterInventory(){
  if(!el('invBody'))return;
  const q=(el('invSearch')?.value||'').toLowerCase(),w=el('invWarehouse')?.value||'',pk=el('invProduct')?.value||'';
  const catalogKey=pk?catalogCanonicalKey(pk):'';
  const rows=state.inventory.filter(r=>(!w||r.warehouse===w)&&(!catalogKey||r.productKey===catalogKey)&&(!q||[r.externalId,r.name,r.design,r.size,r.product,r.material,r.style,r.reference].join(' ').toLowerCase().includes(q))).slice(0,900);
  el('invCount').textContent=`${rows.length}${rows.length<state.inventory.length?' visibles':''} / ${state.inventory.length} registros`;
  const colspan=isAdmin()?9:8;
  el('invBody').innerHTML=rows.map(r=>{const avail=availableStock(r);return `<tr><td><b>${esc(r.warehouse)}</b><div class="muted">${esc(r.operator)}</div></td><td>${esc(productLabelFromRow(r))}</td><td><b>${esc(r.size||'—')}</b></td><td>${esc(designDisplay(r))}</td>${isAdmin()?`<td class="mono">${esc(r.externalId||'—')}</td>`:''}<td><b>${Math.max(0,Number(r.stock||0))}</b>${Number(r.sourceStock)<0?'<div class="tag red">Fuente negativa</div>':''}</td><td>${r.reserved||0}</td><td class="${avail<=3?'stock-low':'stock-ok'}">${avail}</td><td>${avail<=0?'<span class="tag red">Agotado</span>':avail<=5?'<span class="tag amber">Crítico</span>':'<span class="tag green">Disponible</span>'}</td></tr>`}).join('')||`<tr><td colspan="${colspan}" class="muted">No hay inventario para este filtro.</td></tr>`;
}
function catalogCanonicalKey(key){const p=PRODUCT_CATALOG[key];return p?canonicalProductKey(p.product,p.material,p.style):'';}

async function importInventory(file){
  if(!file)return;
  if(typeof XLSX==='undefined'){toast('No fue posible cargar el lector de Excel.');return;}
  try{
    const data=await file.arrayBuffer();
    const wb=XLSX.read(data,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{defval:null});
    if(!rows.length)throw new Error('Archivo vacío');
    const keys=Object.keys(rows[0]).map(x=>String(x).trim());
    let normalized=[],sources=[];
    if(keys.includes('Nombre del producto')&&keys.includes('Bodega')){
      rows.forEach(r=>{const wh=cleanText(r['Bodega']).includes('MEDELLIN')?'Hoko Medellín':'Hoko Bogotá';const n=normalizeHokoRow(r,wh);if(n)normalized.push(n);sources.push(wh);});
    }else if(keys.includes('Nombre')&&keys.includes('Actual')){
      normalized=rows.map(normalizeLogiRow).filter(Boolean);sources=['LogiGho Medellín'];
    }else if(keys.includes('REFERENCIA')||keys.includes('Referencia')){
      normalized=rows.map(normalizeBgaRow).filter(Boolean);sources=['Bucaramanga'];
    }else throw new Error('Formato no reconocido');
    [...new Set(sources)].forEach(source=>{
      state.inventory=state.inventory.filter(x=>x.warehouse!==source);
      const add=normalized.filter(x=>x.warehouse===source);
      state.inventory.push(...add);
      state.inventorySources[source]={rows:add.length,updatedAt:new Date().toISOString(),fileName:file.name,parser:'catalog-v3'};
    });
    saveState();renderInventory();renderAI();toast(`Inventario identificado: ${normalized.length} variantes`);
  }catch(err){alert('No pude reconocer este archivo de inventario: '+err.message);}
}
function baseInventoryRecord({operator,warehouse,externalId,name,reference='',stock=0,min=0,status='',product,material,style,size,design}){
  const sourceStock=Number(stock||0);const safeStock=Math.max(0,sourceStock);const productKey=canonicalProductKey(product,material,style);const variantKey=canonicalVariantKey(product,material,style,size,design);
  return {operator,warehouse,id:`${warehouse}|${externalId||variantKey}`,externalId:String(externalId||''),name,reference:String(reference||''),stock:safeStock,sourceStock,reserved:0,min:Number(min||0),status,product,material,style,size,design,productKey,variantKey};
}
function normalizeHokoRow(r,warehouse){
  const externalId=String(r['ID']??''),name=String(r['Nombre del producto']||'').trim(),reference=String(r['Referencia del producto']??''),stock=Number(r['Stock actual']||0),u=cleanText(name);
  if(!name||/OPCION|CAJA BOXER|CAJA MERCANCIA|GARANTIA/.test(u))return null;
  let product,material,style,size,design,m;
  if(/^MEDIAS/.test(u)){product='Medias';material='textil';style='pack';size='UNICA';design='PACK 3';}
  else if(/^BRIEF/.test(u)){
    m=u.match(/^BRIEF\s+(.+?)\s*\|\s*(S|M|L|XL|2XL|3XL|4XL)$/);if(!m)return null;
    product='Brief';material='licra';style='unicolor';design=normalizeColor(m[1]);size=m[2];
  }else if(/NI[NÑ]O/.test(u)){
    m=u.match(/^BOXER NI[NÑ]O\s+([^|]+)\|\s*(.+)$/);if(!m)return null;
    size=normalizeSize(m[1]);const token=cleanText(m[2]),rm=token.match(/^(\d+)(?:\s+(.+))?$/);if(!rm)return null;
    product='Bóxer niño';material='licra';style=rm[2]&&rm[1]==='11'?'especial':'estampado';design=rm[2]&&rm[1]==='11'?`${rm[1]} ${rm[2]}`:rm[1];
  }else if(/ALGODON/.test(u)){
    m=u.match(/^BOXER ALGODON\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(.+)$/);if(!m)return null;
    product='Bóxer hombre';material='algodón';style='unicolor';size=m[1];design=normalizeColor(m[2]);
  }else if((m=u.match(/^BOXER\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(\d+)\s+(.+)$/))){
    product='Bóxer hombre';material='licra';style='unicolor';size=m[1];design=normalizeColor(m[3]);
  }else if((m=u.match(/^BOXER\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(\d+)$/))){
    product='Bóxer hombre';material='licra';style='estampado';size=m[1];design=m[2];
  }else if((m=u.match(/^BOXER\s+(\d+)\s*\|\s*(S|M|L|XL|2XL|3XL|4XL)$/))){
    product='Bóxer hombre';material='licra';style='estampado';size=m[2];design=m[1];
  }else return null;
  return baseInventoryRecord({operator:'Hoko',warehouse,externalId,name,reference,stock,min:r['Umbral mínimo de stock'],status:String(r['Estado']||''),product,material,style,size,design});
}
function normalizeLogiRow(r){
  const externalId=String(r['ID']??''),name=String(r['Nombre']||'').trim(),stock=Number(r['Actual']||0),u=cleanText(name);if(!name)return null;
  let product,material,style,size,design,m;
  if(/^MEDIAS/.test(u)){product='Medias';material='textil';style='pack';size='UNICA';design='PACK 3';}
  else if(/^DAMA ALGODON/.test(u)){
    m=u.match(/^DAMA ALGODON\s+(.+?)-\s*(S|M|L|XL|2XL)$/);if(!m)return null;
    product='Bóxer mujer';material='algodón';style='unicolor';design=normalizeColor(m[1]);size=m[2];
  }else if(/^BOXER ALGODON/.test(u)){
    m=u.match(/^BOXER ALGODON\s+(.+?)\s*T-?\s*(S|M|L|XL|2XL|3XL|4XL)$/);if(!m)return null;
    product='Bóxer hombre';material='algodón';style='unicolor';design=normalizeColor(m[1]);size=m[2];
  }else if((m=u.match(/^BOXER\s+(\d+)\s*\|\s*(S|M|L|XL|2XL|3XL|4XL)$/))){
    product='Bóxer hombre';material='licra';style='estampado';design=m[1];size=m[2];
  }else if((m=u.match(/^BOXER\s+(.+?)\s*T-?\s*(S|M|L|XL|2XL|3XL|4XL)$/))){
    product='Bóxer hombre';material='licra';style='unicolor';design=normalizeColor(m[1]);size=m[2];
  }else return null;
  return baseInventoryRecord({operator:'LogiGho',warehouse:'LogiGho Medellín',externalId,name,stock,status:stock>0?'Disponible':'Agotado',product,material,style,size,design});
}
function normalizeBgaRow(r){
  const rawSize=r['__EMPTY']??r['TALLA']??r['Talla']??'',reference=r['REFERENCIA']??r['Referencia'],designType=cleanText(r['DISEÑO']??r['Diseño']??''),sourceStock=Number(r['STOCK ACTUAL']??r['Stock actual']??0),size=normalizeSize(rawSize),name=String(reference??'').trim();
  if(reference==null&&sourceStock===0)return null;
  let product,material,style,design,m,u=cleanText(name);
  if(size==='MEDIAS'||designType==='MEDIAS'){product='Medias';material='textil';style='pack';size='UNICA';design='PACK 3';}
  else if(['2-4','6-8','10-12','14-16'].includes(size)&&designType==='ESTAMPADO'){product='Bóxer niño';material='licra';style='estampado';design=cleanText(reference);}
  else if(['S','M','L','XL','2XL','3XL','4XL'].includes(size)&&designType==='ESTAMPADO'){product='Bóxer hombre';material='licra';style='estampado';design=cleanText(reference);}
  else if(['S','M','L','XL','2XL'].includes(size)&&designType==='ALGODON'&&/^DAMA ALGODON/.test(u)){
    m=u.match(/^DAMA ALGODON\s+(.+?)-\s*(S|M|L|XL|2XL)$/);if(!m)return null;
    product='Bóxer mujer';material='algodón';style='unicolor';design=normalizeColor(m[1]);size=m[2];
  }else if(['S','M','L','XL','2XL','3XL','4XL'].includes(size)&&['LICRA','ALGODON'].includes(designType)){
    m=u.match(/^BOXER\s+(.+?)\s*T-?\s*(S|M|L|XL|2XL|3XL|4XL)$/);
    if(m){product='Bóxer hombre';material=designType==='LICRA'?'licra':'algodón';style='unicolor';design=normalizeColor(m[1]);size=m[2];}
    else if(u==='AMARILLO DICIEMBRE'){product='Bóxer hombre';material='licra';style='unicolor';design='AMARILLO DICIEMBRE';}
    else return null;
  }else return null;
  return baseInventoryRecord({operator:'Invicto',warehouse:'Bucaramanga',externalId:'',name,reference:name,stock:sourceStock,status:sourceStock>0?'Disponible':'Agotado',product,material,style,size,design});
}
