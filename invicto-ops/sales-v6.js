/* INVICTO OPS v6 · carga rápida mayorista por cantidades */

const updateGroupV5BaseV6 = window.updateGroupV3;

function bulkLineIdV6(){return 'BL-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)}

function ensureBulkLinesV6(g){
  if(Array.isArray(g.bulkLines)&&g.bulkLines.length)return;
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  const grouped=new Map();
  (g.units||[]).forEach(u=>{
    const size=p.sizes.includes(u.size)?u.size:(g.size||p.sizes[0]);
    const key=size+'@@'+(u.variantKey||'');
    if(!grouped.has(key))grouped.set(key,{id:bulkLineIdV6(),qty:0,size,variantKey:u.variantKey||'',design:u.design||''});
    grouped.get(key).qty++;
  });
  g.bulkLines=[...grouped.values()];
  if(!g.bulkLines.length)g.bulkLines=[{id:bulkLineIdV6(),qty:Math.max(1,Number(g.qty||1)),size:g.size||p.sizes[0],variantKey:'',design:''}];
}

function rebuildUnitsFromBulkV6(g){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  const units=[];
  (g.bulkLines||[]).forEach(line=>{
    const qty=Math.max(1,Math.min(9999,Math.floor(Number(line.qty)||1)));
    line.qty=qty;
    const r=line.variantKey?state.inventory.find(x=>x.variantKey===line.variantKey):null;
    const design=r?.design||line.design||'';
    for(let i=0;i<qty;i++)units.push({variantKey:line.variantKey||'',product:p.product,material:p.material,style:p.style,size:line.size||p.sizes[0],design});
  });
  g.units=units;
  g.qty=units.length;
}

function setEntryModeV6(id,mode){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  if(mode==='bulk'){
    ensureBulkLinesV6(g);
    g.entryMode='bulk';
    rebuildUnitsFromBulkV6(g);
  }else{
    g.entryMode='individual';
    g.bulkLines=null;
    ensureGroupUnitsV3(g,false);
  }
  renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

function addBulkLineV6(id){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  ensureBulkLinesV6(g);
  g.bulkLines.push({id:bulkLineIdV6(),qty:1,size:g.size||p.sizes[0],variantKey:'',design:''});
  rebuildUnitsFromBulkV6(g);renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

function removeBulkLineV6(id,lineId){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  ensureBulkLinesV6(g);
  if(g.bulkLines.length===1)return toast('Debe quedar al menos una línea');
  g.bulkLines=g.bulkLines.filter(x=>x.id!==lineId);
  rebuildUnitsFromBulkV6(g);renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

function updateBulkLineV6(id,lineId,key,value){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  ensureBulkLinesV6(g);
  const line=g.bulkLines.find(x=>x.id===lineId);if(!line)return;
  if(key==='qty')line.qty=Math.max(1,Math.min(9999,Math.floor(Number(value)||1)));
  if(key==='size'){
    line.size=value;line.variantKey='';line.design='';
  }
  if(key==='variantKey'){
    line.variantKey=value;
    const r=value?state.inventory.find(x=>x.variantKey===value):null;
    line.design=r?.design||'';
  }
  rebuildUnitsFromBulkV6(g);renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

window.updateGroupV3=function(id,key,value){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  if(key==='catalogKey'){
    g.bulkLines=null;g.entryMode=g.entryMode||'individual';
    return updateGroupV5BaseV6(id,key,value);
  }
  if(g.entryMode==='bulk'&&key==='qty')return;
  return updateGroupV5BaseV6(id,key,value);
};

function bulkLineHtmlV6(g,line,w){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  const size=p.sizes.includes(line.size)?line.size:p.sizes[0];
  const vars=variantsForSizeV5(g,size,w);
  const selected=vars.find(x=>x.variantKey===line.variantKey);
  const avail=selected?.available||0;
  const need=Math.max(1,Number(line.qty||1));
  const isPrint=(g.catalogKey==='adulto_estampado'||g.catalogKey==='ninos_estampado');
  const display=x=>isPrint?`Diseño #${x}`:x;
  const status=!line.variantKey?'SIN DEFINIR':avail<=0?'SIN STOCK':avail<need?`FALTAN ${need-avail}`:'OK';
  const cls=status==='OK'?'green':status.startsWith('FALTAN')?'amber':'red';
  return `<div class="unit unit-v3" style="grid-template-columns:80px 110px minmax(220px,1fr) 120px 110px 38px">
    <input type="number" min="1" max="9999" value="${need}" onchange="updateBulkLineV6('${g.id}','${line.id}','qty',this.value)" title="Cantidad">
    <select onchange="updateBulkLineV6('${g.id}','${line.id}','size',this.value)">${p.sizes.map(s=>`<option value="${esc(s)}" ${s===size?'selected':''}>${esc(s)}</option>`).join('')}</select>
    <select onchange="updateBulkLineV6('${g.id}','${line.id}','variantKey',this.value)"><option value="">Seleccionar color / diseño</option>${vars.map(v=>`<option value="${esc(v.variantKey)}" ${v.variantKey===line.variantKey?'selected':''}>${esc(display(v.design))} · ${v.available>0?`${v.available} disp.`:'SIN STOCK'}</option>`).join('')}</select>
    <span class="${avail<need?'stock-low':'stock-ok'}">${line.variantKey?`${avail} disp.`:'—'}</span>
    <span class="tag ${cls}">${status}</span>
    <button type="button" class="btn danger-lite sm" onclick="removeBulkLineV6('${g.id}','${line.id}')" title="Quitar línea">×</button>
  </div>`;
}

window.groupHtmlV3=function(g,i,w){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  g.entryMode=g.entryMode||'individual';
  if(g.entryMode==='bulk'){ensureBulkLinesV6(g);rebuildUnitsFromBulkV6(g)}else ensureGroupUnitsV3(g,false,w);
  const total=state.inventory.filter(r=>r.productKey===groupProductKeyV3(g)&&(!w||r.warehouse===w)).reduce((a,r)=>a+availableStock(r),0);
  const modeBar=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
    <button type="button" class="btn ${g.entryMode==='individual'?'navy':'light'} sm" onclick="setEntryModeV6('${g.id}','individual')">Detalle individual</button>
    <button type="button" class="btn ${g.entryMode==='bulk'?'navy':'light'} sm" onclick="setEntryModeV6('${g.id}','bulk')">Carga rápida / mayorista</button>
    <span class="muted" style="align-self:center">${g.entryMode==='bulk'?'Agrupa cantidades por talla y color/diseño.':'Edita cada unidad por separado.'}</span>
  </div>`;
  const individual=`<div class="group-config">
      <div class="field"><label>Tipo de producto</label><select onchange="updateGroupV3('${g.id}','catalogKey',this.value)">${Object.entries(PRODUCT_CATALOG).map(([k,x])=>`<option value="${k}" ${k===g.catalogKey?'selected':''}>${x.label}</option>`).join('')}</select></div>
      <div class="field"><label>Cantidad libre</label><input type="number" min="1" step="1" value="${Number(g.qty||1)}" onchange="updateGroupV3('${g.id}','qty',this.value)"><div class="muted" style="margin-top:5px">Venta normal o mayorista</div></div>
      <div class="field"><label>Accesos rápidos</label><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',3)">3</button><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',6)">6</button><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',12)">12</button><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',24)">24</button></div></div>
    </div>
    <div class="unit-head"><span>#</span><span>Talla</span><span>Diseño / color</span><span>Disponible</span><span>Estado</span></div>
    <div class="units">${g.units.map((u,n)=>unitHtmlV3(g,u,n,w)).join('')}</div>`;
  const bulk=`<div class="group-config">
      <div class="field"><label>Tipo de producto</label><select onchange="updateGroupV3('${g.id}','catalogKey',this.value)">${Object.entries(PRODUCT_CATALOG).map(([k,x])=>`<option value="${k}" ${k===g.catalogKey?'selected':''}>${x.label}</option>`).join('')}</select></div>
      <div class="field"><label>Total unidades</label><div style="font-size:24px;font-weight:800;padding:8px 0">${Number(g.qty||0)}</div><div class="muted">Calculado desde las líneas</div></div>
      <div class="field"><label>Acción</label><button type="button" class="btn navy sm" onclick="addBulkLineV6('${g.id}')">+ Agregar combinación</button></div>
    </div>
    <div class="unit-head" style="grid-template-columns:80px 110px minmax(220px,1fr) 120px 110px 38px"><span>Cant.</span><span>Talla</span><span>Diseño / color</span><span>Disponible</span><span>Estado</span><span></span></div>
    <div class="units">${g.bulkLines.map(line=>bulkLineHtmlV6(g,line,w)).join('')}</div>
    <div class="muted" style="margin-top:8px">Ejemplo: 20 talla M negro + 15 talla L azul oscuro + 30 talla XL diseño #25. Internamente el sistema mantiene ${Number(g.qty||0)} unidades exactas para reservar y despachar.</div>`;
  return `<div class="product-group">
    <div class="product-group-head"><div><span class="group-number">${i+1}</span><b>Producto ${i+1}</b><div class="muted">${w?`${esc(w)} · ${total} unidades disponibles en este producto`:'Selecciona bodega'}</div></div><div class="group-actions"><button class="btn light sm" onclick="regenerateGroupV3('${g.id}')">↻ Nuevo surtido</button>${currentGroups.length>1?`<button class="btn danger-lite sm" onclick="removeProductGroupV3('${g.id}')">Quitar</button>`:''}</div></div>
    ${modeBar}${g.entryMode==='bulk'?bulk:individual}
  </div>`;
};
