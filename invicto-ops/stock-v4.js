/* INVICTO OPS v4 · stock canónico entre Hoko / LogiGho / Bucaramanga
   Regla confirmada: el mismo número de diseño estampado representa el mismo diseño en todos los operadores. */
let inventoryModeV4='consolidado';

function normalizeColor(v=''){
  let c=cleanText(v).replace(/^\d+\s+/,'').replace(/\bT-?(S|M|L|XL|2XL|3XL|4XL)\b/g,'').replace(/^[\s\-|]+|[\s\-|]+$/g,'');
  c=c.replace('CLARO GRIS','GRIS CLARO');
  const aliases={'VINOTINTO':'VINO','MARFIL CRUDO':'MARFIL','MARFILT':'MARFIL','AZUL PETROLEOT':'AZUL PETROLEO','AZUL OSCUROT':'AZUL OSCURO','GRIS':'GRIS CLARO'};
  return aliases[c]||c;
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
    size=normalizeSize(m[1]);const dm=cleanText(m[2]).match(/^(\d+)(?:\s+(.+))?$/);if(!dm)return null;
    product='Bóxer niño';material='licra';style='estampado';design=dm[2]?`${dm[1]} ${dm[2]}`:dm[1];
  }else if(/ALGODON/.test(u)){
    m=u.match(/^BOXER ALGODON\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(\d+)\s+(.+)$/);if(!m)return null;
    product='Bóxer hombre';material='algodón';style='unicolor';size=m[1];design=normalizeColor(m[3]);
  }else if((m=u.match(/^BOXER\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(\d+)\s+(.+)$/))){
    product='Bóxer hombre';material='licra';style='unicolor';size=m[1];design=normalizeColor(m[3]);
  }else if((m=u.match(/^BOXER\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(\d+)$/))){
    product='Bóxer hombre';material='licra';style='estampado';size=m[1];design=m[2];
  }else if((m=u.match(/^BOXER\s+(\d+)\s*\|\s*(S|M|L|XL|2XL|3XL|4XL)$/))){
    product='Bóxer hombre';material='licra';style='estampado';size=m[2];design=m[1];
  }else return null;
  return baseInventoryRecord({operator:'Hoko',warehouse,externalId,name,reference,stock,min:r['Umbral mínimo de stock'],status:String(r['Estado']||''),product,material,style,size,design});
}

function stockMatrixV4(variantKey){
  const out=Object.fromEntries(WAREHOUSES.map(w=>[w,{physical:0,reserved:0,available:0,id:''}]));
  state.inventory.filter(r=>r.variantKey===variantKey).forEach(r=>{const x=out[r.warehouse]||(out[r.warehouse]={physical:0,reserved:0,available:0,id:''});x.physical+=Math.max(0,Number(r.stock||0));x.reserved+=Number(r.reserved||0);x.available+=availableStock(r);if(r.externalId)x.id=r.externalId;});
  return out;
}
function compactWarehouseNameV4(w){return {'Hoko Bogotá':'HOKO BOG','Hoko Medellín':'HOKO MED','LogiGho Medellín':'LOGI','Bucaramanga':'BGA'}[w]||w;}
function consolidatedVariantsV4(){
  const m=new Map();
  state.inventory.forEach(r=>{let x=m.get(r.variantKey);if(!x){x={variantKey:r.variantKey,product:r.product,material:r.material,style:r.style,size:r.size,design:r.design,productKey:r.productKey,rows:[]};m.set(r.variantKey,x)}x.rows.push(r)});
  return [...m.values()];
}
function stockCellV4(v,w){const r=v.rows.find(x=>x.warehouse===w);if(!r)return '<span class="stock-none">—</span>';const a=availableStock(r);return `<div class="stock-cell ${a<=0?'zero':a<=5?'low':''}"><b>${a}</b><small>${Math.max(0,Number(r.stock||0))} físico${r.reserved?` · ${r.reserved} res.`:''}</small></div>`;}
function setInventoryModeV4(mode){inventoryModeV4=mode;renderInventory();}
function renderInventory(){
  const totals=warehouseTotals(),anomalies=state.inventory.filter(r=>r.sourceStock!=null&&Number(r.sourceStock)<0).length;
  el('view-inventory').innerHTML=`<div class="page-title"><div><h1>Inventario</h1><p>Un mismo diseño estampado usa una sola identidad interna aunque Hoko, LogiGho y Bucaramanga tengan IDs distintos.</p></div></div>
  <div class="warehouse-grid">${WAREHOUSES.map(w=>`<div class="warehouse-card"><small>${w}</small><strong>${totals[w]||0}</strong><small>unidades físicas</small></div>`).join('')}</div>
  ${anomalies?`<div class="warning" style="margin-top:12px"><b>Atención:</b> ${anomalies} registros vienen con stock negativo. Para vender cuentan como 0.</div>`:''}
  <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Actualizar inventario</h3><div class="spacer"></div><span class="tag gray">Hoko / LogiGho / Bucaramanga</span></div><div class="panel-body"><div class="upload-zone"><b>Carga el Excel del operador.</b><p class="muted">El sistema conserva el ID externo de cada bodega, pero cruza la mercancía por producto + material + talla + diseño/color.</p><input id="inventoryFile" type="file" accept=".xlsx,.xls" onchange="importInventory(this.files[0])"></div></div></div>
  <div class="panel" style="margin-top:14px"><div class="panel-head"><div class="toolbar"><input id="invSearch" class="search" placeholder="Buscar diseño, color, talla o ID..." oninput="filterInventory()"><select id="invProduct" class="search" onchange="filterInventory()"><option value="">Todos los productos</option>${Object.entries(PRODUCT_CATALOG).map(([k,p])=>`<option value="${k}">${p.label}</option>`).join('')}</select><select id="invSize" class="search" onchange="filterInventory()"><option value="">Todas las tallas</option>${['2-4','6-8','10-12','14-16','S','M','L','XL','2XL','3XL','4XL'].map(s=>`<option>${s}</option>`).join('')}</select></div><div class="spacer"></div><div class="segmented"><button class="${inventoryModeV4==='consolidado'?'active':''}" onclick="setInventoryModeV4('consolidado')">Consolidado</button><button class="${inventoryModeV4==='detalle'?'active':''}" onclick="setInventoryModeV4('detalle')">Por bodega</button></div></div><div class="table-wrap"><table><thead id="invHead"></thead><tbody id="invBody"></tbody></table></div></div>`;
  filterInventory();
}
function filterInventory(){
  if(!el('invBody'))return;const q=(el('invSearch')?.value||'').toLowerCase(),ck=el('invProduct')?.value||'',size=el('invSize')?.value||'',pk=ck?catalogCanonicalKey(ck):'';
  if(inventoryModeV4==='detalle'){
    const rows=state.inventory.filter(r=>(!pk||r.productKey===pk)&&(!size||normalizeSize(r.size)===normalizeSize(size))&&(!q||[r.externalId,r.name,r.design,r.size,r.product,r.material,r.style].join(' ').toLowerCase().includes(q))).slice(0,1200);
    el('invHead').innerHTML=`<tr><th>Bodega</th><th>Producto</th><th>Talla</th><th>Diseño / color</th>${isAdmin()?'<th>ID externo</th>':''}<th>Físico</th><th>Reservado</th><th>Disponible</th></tr>`;
    el('invBody').innerHTML=rows.map(r=>`<tr><td><b>${esc(r.warehouse)}</b></td><td>${esc(productLabelFromRow(r))}</td><td><b>${esc(r.size)}</b></td><td>${esc(designDisplay(r))}</td>${isAdmin()?`<td class="mono">${esc(r.externalId||'—')}</td>`:''}<td>${Math.max(0,Number(r.stock||0))}</td><td>${r.reserved||0}</td><td class="${availableStock(r)<=3?'stock-low':'stock-ok'}"><b>${availableStock(r)}</b></td></tr>`).join('')||'<tr><td colspan="9" class="muted">Sin resultados.</td></tr>';return;
  }
  let variants=consolidatedVariantsV4().filter(v=>(!pk||v.productKey===pk)&&(!size||normalizeSize(v.size)===normalizeSize(size))&&(!q||[v.product,v.material,v.style,v.size,v.design,...v.rows.map(r=>r.externalId)].join(' ').toLowerCase().includes(q)));
  variants.sort((a,b)=>a.product.localeCompare(b.product,'es')||a.size.localeCompare(b.size,'es',{numeric:true})||String(a.design).localeCompare(String(b.design),'es',{numeric:true}));
  el('invHead').innerHTML='<tr><th>Producto</th><th>Talla</th><th>Diseño / color</th><th>Hoko Bogotá</th><th>Hoko Medellín</th><th>LogiGho</th><th>Bucaramanga</th><th>Total disponible</th></tr>';
  el('invBody').innerHTML=variants.slice(0,1000).map(v=>{const total=v.rows.reduce((a,r)=>a+availableStock(r),0);return `<tr><td><b>${esc(v.product)}</b><div class="muted">${esc(v.material)} · ${esc(v.style)}</div></td><td><b>${esc(v.size)}</b></td><td><b>${esc(v.style==='estampado'?`Diseño #${v.design}`:v.design)}</b></td>${WAREHOUSES.map(w=>`<td>${stockCellV4(v,w)}</td>`).join('')}<td class="stock-total"><b>${total}</b></td></tr>`}).join('')||'<tr><td colspan="8" class="muted">Sin resultados.</td></tr>';
}

function matrixSummaryV4(vk){const m=stockMatrixV4(vk);return WAREHOUSES.map(w=>`${compactWarehouseNameV4(w)} ${m[w].available}`).join(' · ');}
function unitHtmlV3(g,u,i,w,vars){
  const r=w&&u.variantKey?recordV3(u.variantKey,w):null,a=r?availableStock(r):(vars.find(v=>v.variantKey===u.variantKey)?.available||0),st=!u.variantKey?'Sin definir':w&&!r?'No existe aquí':a<=0?'Agotado':a<=5?'Crítico':'OK',cls=st==='OK'?'green':st==='Crítico'?'amber':'red',isPrint=g.catalogKey==='adulto_estampado'||g.catalogKey==='ninos_estampado',label=u.design?(isPrint?`Diseño #${u.design}`:u.design):'Seleccionar';
  const summary=u.variantKey?matrixSummaryV4(u.variantKey):'';
  return `<div class="unit-card-v4"><div class="unit unit-v3"><span class="n">${i+1}</span><select onchange="changeUnitV3('${g.id}',${i},this.value)"><option value="${esc(u.variantKey||'')}">${esc(label)}${u.variantKey?` · ${a} disp. en ${compactWarehouseNameV4(w)}`:''}</option>${vars.filter(v=>v.variantKey!==u.variantKey).map(v=>`<option value="${esc(v.variantKey)}">${esc(isPrint?`Diseño #${v.design}`:v.design)} · ${v.available} disp.</option>`).join('')}</select><span><b>${esc(g.size)}</b></span><span class="${a<=3?'stock-low':'stock-ok'}">${u.variantKey?a:'—'}</span><span class="tag ${cls}">${st}</span></div>${summary?`<div class="stock-matrix-mini">${esc(summary)}</div>`:''}</div>`;
}

// Convierte inventarios ya cargados con el parser anterior a la identidad canónica actual.
(function migrateV4(){
  let changed=false;
  state.inventory.forEach(r=>{if(r.style==='estampado'&&/^\d+$/.test(String(r.design||''))){const vk=canonicalVariantKey(r.product,r.material,'estampado',normalizeSize(r.size),String(r.design));if(r.variantKey!==vk){r.variantKey=vk;r.productKey=canonicalProductKey(r.product,r.material,'estampado');changed=true}}});
  if(changed)saveState();
})();
