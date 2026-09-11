/* INVICTO OPS v5 · cantidad libre + talla/color por unidad + agotados visibles */

function defaultGroup(){
  return {id:groupId(),catalogKey:'adulto_estampado',qty:6,size:'L',units:[]};
}

function saleGroupsV3(s){
  if(s?.groups?.length){
    return s.groups.map(g=>{
      const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
      const fallbackSize=p.sizes.includes(g.size)?g.size:p.sizes[0];
      const units=(g.units||[]).map(u=>({...u,size:p.sizes.includes(u.size)?u.size:fallbackSize}));
      return {...g,id:g.id||groupId(),qty:Math.max(1,Number(g.qty||units.length||6)),size:fallbackSize,units};
    });
  }
  const key=String(s?.summary||'').toLowerCase().includes('algod')?'adulto_algodon':String(s?.summary||'').toLowerCase().includes('unicolor')?'adulto_licra':'adulto_estampado';
  const p=PRODUCT_CATALOG[key];
  const fallbackSize=s?.size&&s.size!=='MIXTO'&&p.sizes.includes(s.size)?s.size:p.sizes[0];
  return [{id:groupId(),catalogKey:key,qty:Math.max(1,Number(s?.qty||6)),size:fallbackSize,units:[]}];
}

function rowsForGroupV3(g,w='',availableOnly=true,sizeOverride=''){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  const size=normalizeSize(sizeOverride||g.size||p.sizes[0]);
  return state.inventory.filter(r=>r.productKey===groupProductKeyV3(g)&&normalizeSize(r.size)===size&&(!w||r.warehouse===w)&&(!availableOnly||availableStock(r)>0));
}

function variantsForSizeV5(g,size,w=''){
  const master=new Map();
  state.inventory
    .filter(r=>r.productKey===groupProductKeyV3(g)&&normalizeSize(r.size)===normalizeSize(size))
    .forEach(r=>{
      if(!master.has(r.variantKey)) master.set(r.variantKey,{variantKey:r.variantKey,design:r.design,size:r.size,available:0,totalAvailable:0});
      const v=master.get(r.variantKey),a=availableStock(r);
      v.totalAvailable+=a;
      if(!w||r.warehouse===w)v.available+=a;
    });
  return [...master.values()].sort((a,b)=>{
    const ao=a.available<=0?1:0,bo=b.available<=0?1:0;
    if(ao!==bo)return ao-bo;
    if(b.available!==a.available)return b.available-a.available;
    return String(a.design).localeCompare(String(b.design),'es',{numeric:true});
  });
}

function variantsForGroupV3(g,w=''){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  return variantsForSizeV5(g,g.size||p.sizes[0],w);
}

function demandBucketsV3(){
  const m=new Map();
  currentGroups.forEach(g=>{
    const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
    const units=(g.units||[]).length?(g.units||[]):Array.from({length:Number(g.qty||0)},()=>({size:g.size||p.sizes[0]}));
    units.forEach(u=>{
      const size=normalizeSize(u.size||g.size||p.sizes[0]);
      const k=groupProductKeyV3(g)+'@@'+size;
      m.set(k,(m.get(k)||0)+1);
    });
  });
  return m;
}

function coverageV3(w){
  let score=0;
  for(const [k,need] of demandBucketsV3()){
    const [pk,size]=k.split('@@');
    const have=state.inventory.filter(r=>r.warehouse===w&&r.productKey===pk&&normalizeSize(r.size)===size).reduce((a,r)=>a+availableStock(r),0);
    score+=Math.min(need,have);
  }
  return score;
}

function bestVariantForSizeV5(g,size,w,used){
  const pool=variantsForSizeV5(g,size,w).filter(v=>v.available>(used.get(v.variantKey)||0));
  if(!pool.length)return null;
  pool.sort((a,b)=>{
    const ar=a.available-(used.get(a.variantKey)||0),br=b.available-(used.get(b.variantKey)||0);
    const au=(used.get(a.variantKey)||0)>0?1:0,bu=(used.get(b.variantKey)||0)>0?1:0;
    if(au!==bu)return au-bu;
    return br-ar;
  });
  return pool[0];
}

function ensureGroupUnitsV3(g,force=false,w=''){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  g.qty=Math.max(1,Math.floor(Number(g.qty)||1));
  if(!p.sizes.includes(g.size))g.size=p.sizes[0];
  w=w||el('fWarehouse')?.value||chooseWarehouseV3(false)||'';
  const old=Array.isArray(g.units)?g.units:[];
  const targetSizes=Array.from({length:g.qty},(_,i)=>p.sizes.includes(old[i]?.size)?old[i].size:g.size);
  const used=new Map();
  const next=[];
  for(let i=0;i<g.qty;i++){
    const prev=old[i];
    if(!force&&prev&&prev.variantKey&&p.sizes.includes(prev.size)){
      next.push({...prev,size:prev.size});
      used.set(prev.variantKey,(used.get(prev.variantKey)||0)+1);
      continue;
    }
    const size=targetSizes[i];
    const v=bestVariantForSizeV5(g,size,w,used);
    if(v){
      used.set(v.variantKey,(used.get(v.variantKey)||0)+1);
      next.push({variantKey:v.variantKey,product:p.product,material:p.material,style:p.style,size,design:v.design});
    }else{
      next.push({variantKey:'',product:p.product,material:p.material,style:p.style,size,design:''});
    }
  }
  g.units=next;
}

function updateGroupV3(id,key,value){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  if(key==='catalogKey'){
    g.catalogKey=value;
    const p=PRODUCT_CATALOG[value];
    g.size=p.sizes[0];
    g.units=[];
    ensureGroupUnitsV3(g,true);
  }else if(key==='qty'){
    g.qty=Math.max(1,Math.floor(Number(value)||1));
    ensureGroupUnitsV3(g,false);
  }else{
    g.size=value;
    g.units=(g.units||[]).map(u=>({...u,size:value,variantKey:'',design:''}));
    ensureGroupUnitsV3(g,true);
  }
  renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

function setQuickQtyV5(id,qty){
  updateGroupV3(id,'qty',qty);
}

function changeUnitSizeV5(id,i,size){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  const p=PRODUCT_CATALOG[g.catalogKey];
  if(!p.sizes.includes(size))return;
  const u=g.units[i]||{};
  g.units[i]={...u,product:p.product,material:p.material,style:p.style,size,variantKey:'',design:''};
  renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

function changeUnitV3(id,i,vk){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  const p=PRODUCT_CATALOG[g.catalogKey];
  const current=g.units[i]||{};
  if(!vk){
    g.units[i]={...current,variantKey:'',design:'',product:p.product,material:p.material,style:p.style};
  }else{
    const r=state.inventory.find(x=>x.variantKey===vk);
    g.units[i]={variantKey:vk,product:p.product,material:p.material,style:p.style,size:r?.size||current.size||g.size,design:r?.design||''};
  }
  renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

function renderProductGroupsV3(){
  const h=el('productGroups');if(!h)return;
  const w=el('fWarehouse')?.value||'';
  h.innerHTML=currentGroups.map((g,i)=>groupHtmlV3(g,i,w)).join('');
  el('orderQtyTotal').textContent=currentGroups.reduce((a,g)=>a+Number(g.qty||0),0);
}

function groupHtmlV3(g,i,w){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  ensureGroupUnitsV3(g,false,w);
  const total=state.inventory.filter(r=>r.productKey===groupProductKeyV3(g)&&(!w||r.warehouse===w)).reduce((a,r)=>a+availableStock(r),0);
  return `<div class="product-group">
    <div class="product-group-head"><div><span class="group-number">${i+1}</span><b>Producto ${i+1}</b><div class="muted">${w?`${esc(w)} · ${total} unidades disponibles en este producto`:'Selecciona bodega'}</div></div><div class="group-actions"><button class="btn light sm" onclick="regenerateGroupV3('${g.id}')">↻ Nuevo surtido</button>${currentGroups.length>1?`<button class="btn danger-lite sm" onclick="removeProductGroupV3('${g.id}')">Quitar</button>`:''}</div></div>
    <div class="group-config">
      <div class="field"><label>Tipo de producto</label><select onchange="updateGroupV3('${g.id}','catalogKey',this.value)">${Object.entries(PRODUCT_CATALOG).map(([k,x])=>`<option value="${k}" ${k===g.catalogKey?'selected':''}>${x.label}</option>`).join('')}</select></div>
      <div class="field"><label>Cantidad libre</label><input type="number" min="1" step="1" value="${Number(g.qty||1)}" onchange="updateGroupV3('${g.id}','qty',this.value)"><div class="muted" style="margin-top:5px">Venta normal o mayorista</div></div>
      <div class="field"><label>Accesos rápidos</label><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',3)">3</button><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',6)">6</button><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',12)">12</button><button type="button" class="btn light sm" onclick="setQuickQtyV5('${g.id}',24)">24</button></div></div>
    </div>
    <div class="unit-head"><span>#</span><span>Talla</span><span>Diseño / color</span><span>Disponible</span><span>Estado</span></div>
    <div class="units">${g.units.map((u,n)=>unitHtmlV3(g,u,n,w)).join('')}</div>
  </div>`;
}

function unitHtmlV3(g,u,i,w){
  const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado;
  const size=p.sizes.includes(u.size)?u.size:(g.size||p.sizes[0]);
  const vars=variantsForSizeV5(g,size,w);
  const r=w&&u.variantKey?recordV3(u.variantKey,w):null;
  const v=vars.find(x=>x.variantKey===u.variantKey);
  const a=w?(r?availableStock(r):0):(v?.available||0);
  const st=!u.variantKey?'Sin definir':a<=0?'SIN STOCK':a<=5?'Crítico':'OK';
  const cls=st==='OK'?'green':st==='Crítico'?'amber':'red';
  const isPrint=(g.catalogKey==='adulto_estampado'||g.catalogKey==='ninos_estampado');
  const display=x=>isPrint?`Diseño #${x}`:x;
  const options=vars.map(x=>`<option value="${esc(x.variantKey)}" ${x.variantKey===u.variantKey?'selected':''}>${esc(display(x.design))} · ${x.available>0?`${x.available} disp.`:'SIN STOCK'}</option>`).join('');
  return `<div class="unit unit-v3">
    <span class="n">${i+1}</span>
    <select onchange="changeUnitSizeV5('${g.id}',${i},this.value)">${p.sizes.map(s=>`<option value="${esc(s)}" ${s===size?'selected':''}>${esc(s)}</option>`).join('')}</select>
    <select onchange="changeUnitV3('${g.id}',${i},this.value)"><option value="">Seleccionar</option>${options}</select>
    <span class="${a<=3?'stock-low':'stock-ok'}">${u.variantKey?a:'—'}</span>
    <span class="tag ${cls}">${st}</span>
  </div>`;
}

function regenerateGroupV3(id){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  ensureGroupUnitsV3(g,true);
  renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}

function warehouseChangedV3(){
  renderProductGroupsV3();updateRecommendationV3();checkBlockingV3();
}
