function inventorySourceStatus(){
  return Object.entries(state.inventorySources).map(([name,meta])=>`<div class="statline"><span>${name}</span><b class="${meta?'source-ok':'source-wait'}">${meta?`✓ ${meta.rows} filas · ${fmtDate(meta.updatedAt)}`:'Pendiente de carga'}</b></div>`).join('');
}
function renderInventory(){
  const totals=warehouseTotals();
  el('view-inventory').innerHTML=`
    <div class="page-title"><div><h1>Inventario</h1><p>Importa los archivos actuales. El sistema reconoce Hoko Bogotá/Medellín, LogiGho Medellín y Bucaramanga.</p></div></div>
    <div class="warehouse-grid">${WAREHOUSES.map(w=>`<div class="warehouse-card"><small>${w}</small><strong>${totals[w]||0}</strong><small>unidades registradas</small><div style="margin-top:8px">${state.inventorySources[w]?'<span class="tag green">Cargado</span>':'<span class="tag amber">Pendiente</span>'}</div></div>`).join('')}</div>
    <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Cargar inventario</h3><div class="spacer"></div><span class="tag gray">Excel .xlsx / .xls</span></div><div class="panel-body"><div class="upload-zone"><b>Sube cualquiera de los archivos de stock.</b><p class="muted">Puedes cargar Hoko, LogiGho o Bucaramanga. Hoko separa automáticamente Bogotá y Medellín según la columna Bodega.</p><input id="inventoryFile" type="file" accept=".xlsx,.xls" onchange="importInventory(this.files[0])"></div></div></div>
    <div class="panel" style="margin-top:14px"><div class="panel-head"><div class="toolbar"><input id="invSearch" class="search" placeholder="Buscar producto, ID, referencia..." oninput="filterInventory()"><select id="invWarehouse" class="search" onchange="filterInventory()"><option value="">Todas las bodegas</option>${WAREHOUSES.map(w=>`<option>${w}</option>`).join('')}</select></div><div class="spacer"></div><span class="tag blue" id="invCount">${state.inventory.length} registros</span></div><div class="table-wrap"><table><thead><tr><th>Operador</th><th>Bodega</th><th>ID</th><th>Producto</th><th>Talla</th><th>Variante</th><th>Stock físico</th><th>Reservado</th><th>Disponible</th><th>Estado</th></tr></thead><tbody id="invBody"></tbody></table></div></div>`;
  filterInventory();
}
function warehouseTotals(){const out={};state.inventory.forEach(r=>out[r.warehouse]=(out[r.warehouse]||0)+Number(r.stock||0));return out;}
function filterInventory(){
  if(!el('invBody'))return;
  const q=(el('invSearch')?.value||'').toLowerCase(),w=el('invWarehouse')?.value||'';
  const rows=state.inventory.filter(r=>(!w||r.warehouse===w)&&(!q||[r.id,r.name,r.variant,r.size,r.reference,r.operator].join(' ').toLowerCase().includes(q))).slice(0,700);
  el('invCount').textContent=`${rows.length}${rows.length<state.inventory.length?' visibles':''} / ${state.inventory.length} registros`;
  el('invBody').innerHTML=rows.map(r=>{const avail=Math.max(0,Number(r.stock||0)-Number(r.reserved||0));return `<tr><td><b>${esc(r.operator)}</b></td><td>${esc(r.warehouse)}</td><td class="mono">${esc(r.id||'—')}</td><td>${esc(r.name)}</td><td>${esc(r.size||'—')}</td><td>${esc(r.variant||'—')}</td><td><b>${r.stock||0}</b></td><td>${r.reserved||0}</td><td class="${avail<=3?'stock-low':'stock-ok'}">${avail}</td><td>${avail<=0?'<span class="tag red">Agotado</span>':avail<=5?'<span class="tag amber">Crítico</span>':'<span class="tag green">Disponible</span>'}</td></tr>`}).join('')||'<tr><td colspan="10" class="muted">Aún no hay inventario cargado.</td></tr>';
}

async function importInventory(file){
  if(!file)return;
  if(typeof XLSX==='undefined'){toast('No fue posible cargar el lector de Excel.');return;}
  try{
    const data=await file.arrayBuffer();
    const wb=XLSX.read(data,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{defval:null});
    if(!rows.length)throw new Error('Archivo vacío');
    const keys=Object.keys(rows[0]).map(x=>String(x).trim());
    let normalized=[], sources=[];
    if(keys.includes('Nombre del producto')&&keys.includes('Bodega')){
      rows.forEach(r=>{const wh=String(r['Bodega']||'').toUpperCase().includes('MEDELLIN')?'Hoko Medellín':'Hoko Bogotá';normalized.push(normalizeHokoRow(r,wh));sources.push(wh);});
    }else if(keys.includes('Nombre')&&keys.includes('Actual')){
      normalized=rows.map(normalizeLogiRow);sources=['LogiGho Medellín'];
    }else if(keys.includes('REFERENCIA')||keys.includes('Referencia')){
      normalized=rows.map(normalizeBgaRow).filter(Boolean);sources=['Bucaramanga'];
    }else throw new Error('Formato no reconocido');
    [...new Set(sources)].forEach(source=>{
      state.inventory=state.inventory.filter(x=>x.warehouse!==source);
      const add=normalized.filter(x=>x.warehouse===source);
      state.inventory.push(...add);
      state.inventorySources[source]={rows:add.length,updatedAt:new Date().toISOString(),fileName:file.name};
    });
    saveState();renderInventory();renderAI();toast(`Inventario cargado: ${normalized.length} registros`);
  }catch(err){alert('No pude reconocer este archivo de inventario: '+err.message);}
}
function normalizeHokoRow(r,warehouse){const name=String(r['Nombre del producto']||'').trim();const p=parseProductName(name);return {operator:'Hoko',warehouse,id:String(r['ID']??''),name,reference:String(r['Referencia del producto']??''),stock:Number(r['Stock actual']||0),reserved:0,min:Number(r['Umbral mínimo de stock']||0),status:String(r['Estado']||''),...p};}
function normalizeLogiRow(r){const name=String(r['Nombre']||'').trim();const p=parseProductName(name);return {operator:'LogiGho',warehouse:'LogiGho Medellín',id:String(r['ID']??''),name,reference:'',stock:Number(r['Actual']||0),reserved:0,transit:Number(r['Tránsito']||0),status:Number(r['Actual']||0)>0?'Disponible':'Agotado',...p};}
function normalizeBgaRow(r){const size=String(r['__EMPTY']??r['TALLA']??r['Talla']??'').replace(/^TALLA\s*/i,'').trim();const reference=r['REFERENCIA']??r['Referencia'];const design=r['DISEÑO']??r['Diseño'];const stock=r['STOCK ACTUAL']??r['Stock actual'];if(reference==null&&stock==null)return null;return {operator:'Propio',warehouse:'Bucaramanga',id:`BGA-${size}-${reference}-${design||''}`,name:`${design||'Producto'} ${reference||''} · ${size}`.trim(),reference:String(reference??''),stock:Number(stock||0),reserved:0,status:Number(stock||0)>0?'Disponible':'Agotado',size,variant:String(reference??design??''),category:inferCategory(`${design||''} ${size}`),kind:String(design||'').toUpperCase().includes('ESTAMP')?'estampado':'unicolor'};}
function parseProductName(name){
  const u=name.toUpperCase().replace(/\s+/g,' ').trim();let category=inferCategory(u),kind='otro',size='',variant='';
  if(u.includes('BRIEF')){kind='brief';const m=u.match(/BRIEF\s+(.+?)\s*\|\s*(S|M|L|XL|2XL|3XL|4XL)/);if(m){variant=m[1].trim();size=m[2];}}
  else if(u.includes('NIÑO')){kind='ninos';const m=u.match(/NIÑO\s+([^|]+)\|\s*(.+)$/);if(m){size=m[1].trim();variant=m[2].trim();}}
  else if(u.startsWith('DAMA')){kind='mujer';const m=u.match(/DAMA\s+ALGODON\s+(.+?)-\s*(S|M|L|XL|2XL)/);if(m){variant=m[1].trim();size=m[2];}}
  else if(u.includes('ALGODON')){kind='unicolor';const m=u.match(/BOXER\s+ALGODON\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(.+)$/)||u.match(/BOXER\s+ALGODON\s+(.+?)\s*T-?\s*(S|M|L|XL|2XL|3XL|4XL)/);if(m){if(/^(S|M|L|XL|2XL|3XL|4XL)$/.test(m[1])){size=m[1];variant=m[2];}else{variant=m[1];size=m[2];}}}
  else if(/^BOXER/.test(u)&&u.includes('|')){kind='estampado';let m=u.match(/BOXER\s+(S|M|L|XL|2XL|3XL|4XL)\s*\|\s*(.+)$/);if(m){size=m[1];variant=m[2];}else{m=u.match(/BOXER\s+(.+?)\s*\|\s*(S|M|L|XL|2XL|3XL|4XL)$/);if(m){variant=m[1];size=m[2];}}}
  else if(/^BOXER/.test(u)&&/T-?\s*(S|M|L|XL|2XL|3XL|4XL)/.test(u)){kind='unicolor';const m=u.match(/BOXER\s+(.+?)\s*T-?\s*(S|M|L|XL|2XL|3XL|4XL)/);if(m){variant=m[1].trim();size=m[2];}}
  return {category,kind,size,variant};
}
function inferCategory(u){u=String(u).toUpperCase();if(u.includes('NIÑO')||/^2-4|6-8|10-12|14-16/.test(u))return 'Niños';if(u.includes('DAMA'))return 'Mujer';if(u.includes('BRIEF'))return 'Brief';return 'Adulto';}
