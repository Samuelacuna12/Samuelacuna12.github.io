/* INVICTO OPS v22 · hotfix estable para gestión avanzada de ventas */
function reportFrontErrorV22(message,stack='',context={}){
  try{
    if(!window.invictoSupabaseV12||!session?.id)return;
    const scrub=v=>String(v||'').replace(/sk-[A-Za-z0-9_-]+/g,'[secret]').slice(0,5000);
    invictoSupabaseV12.from('frontend_errors').insert({user_id:session.id,page:currentView||'unknown',message:scrub(message),stack:scrub(stack),context}).then(()=>{}).catch(()=>{});
  }catch(_){ }
}
window.addEventListener('error',e=>reportFrontErrorV22(e.message,e.error?.stack||'',{file:e.filename||'',line:e.lineno||0,col:e.colno||0}));
window.addEventListener('unhandledrejection',e=>reportFrontErrorV22(e.reason?.message||String(e.reason||'Promise rejection'),e.reason?.stack||'',{type:'unhandledrejection'}));

function v22Product(g){return PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado}
function v22AvailableVariants(g,size,warehouse=''){
  const key=catalogCanonicalKey(g.catalogKey),map=new Map();
  (state.inventory||[]).filter(r=>r.productKey===key&&normalizeSize(r.size)===normalizeSize(size)).forEach(r=>{
    const x=map.get(r.variantKey)||{variantKey:r.variantKey,design:r.design,size:r.size,available:0,totalAvailable:0,byWarehouse:{}};
    const n=Math.max(0,Number(availableStock(r)||0));
    x.totalAvailable+=n;
    x.byWarehouse[r.warehouse]=(x.byWarehouse[r.warehouse]||0)+n;
    if(!warehouse||r.warehouse===warehouse)x.available+=n;
    map.set(r.variantKey,x)
  });
  const rows=[...map.values()].map(x=>{
    const ranked=Object.entries(x.byWarehouse).sort((a,b)=>Number(b[1])-Number(a[1]));
    return {...x,bestWarehouse:ranked[0]?.[0]||'',bestWarehouseAvailable:Number(ranked[0]?.[1]||0)}
  });
  return rows.sort((a,b)=>
    ((b.available>0)-(a.available>0))||
    (b.available-a.available)||
    (b.totalAvailable-a.totalAvailable)||
    String(a.design).localeCompare(String(b.design),'es',{numeric:true})
  )
}
function v22InitGroups(s){
  let groups=[];try{groups=sourceGroupsV20(s)}catch(e){reportFrontErrorV22('sourceGroupsV20: '+e.message,e.stack,{sale:s?.id});groups=[]}
  if(!groups.length)groups=[{id:groupId(),catalogKey:'adulto_estampado',qty:Math.max(1,Number(s?.qty||s?.sourceQty||6)),size:'L',units:[]}];
  groups.forEach(g=>{const p=v22Product(g);g.qty=Math.max(1,Number(g.qty||1));g.size=p.sizes.includes(g.size)?g.size:p.sizes[0];g.units=Array.from({length:g.qty},(_,i)=>{const old=g.units?.[i]||{};return {...old,size:p.sizes.includes(old.size)?old.size:g.size,variantKey:old.variantKey||'',design:old.design||''}})});
  return groups
}
function v22WarehouseCoverage(w,groups){
  const demand=new Map();
  for(const g of groups||[]){
    for(const u of g.units||[]){
      const k=catalogCanonicalKey(g.catalogKey)+'@@'+normalizeSize(u.size||g.size);
      demand.set(k,(demand.get(k)||0)+1)
    }
  }
  let covered=0,need=0,available=0;
  for(const [k,n] of demand){
    const pos=k.lastIndexOf('@@'),pk=k.slice(0,pos),size=k.slice(pos+2);
    const have=(state.inventory||[]).filter(r=>
      r.warehouse===w&&r.productKey===pk&&normalizeSize(r.size)===size
    ).reduce((a,r)=>a+Math.max(0,Number(availableStock(r)||0)),0);
    need+=n;available+=have;covered+=Math.min(n,have)
  }
  return {w,covered,need,available,complete:need>0&&covered>=need}
}
function v22SelectedCoverage(w,groups=currentGroups){
  const counts=new Map();
  for(const g of groups||[])for(const u of g.units||[])if(u.variantKey)counts.set(u.variantKey,(counts.get(u.variantKey)||0)+1);
  let covered=0,need=0;
  for(const [vk,n] of counts){
    const have=(state.inventory||[]).filter(r=>r.warehouse===w&&r.variantKey===vk).reduce((a,r)=>a+Math.max(0,Number(availableStock(r)||0)),0);
    need+=n;covered+=Math.min(n,have)
  }
  return {w,covered,need,complete:need>0&&covered>=need}
}
function v22WarehousePreference(city){
  const c=cleanText(city||'');
  return /BUCARAMANGA|FLORIDABLANCA|GIRON|PIEDECUESTA/.test(c)
    ?['Bucaramanga','Hoko Medellín','LogiGho Medellín','Hoko Bogotá']
    :/BOGOTA|SOACHA/.test(c)
      ?['Hoko Bogotá','Hoko Medellín','LogiGho Medellín','Bucaramanga']
      :['Hoko Medellín','LogiGho Medellín','Hoko Bogotá','Bucaramanga']
}
function v22BestWarehouse(city,groups){
  const pref=v22WarehousePreference(city);
  return pref.map(w=>v22WarehouseCoverage(w,groups)).sort((a,b)=>
    Number(b.complete)-Number(a.complete)||
    b.covered-a.covered||
    b.available-a.available||
    pref.indexOf(a.w)-pref.indexOf(b.w)
  )[0]?.w||''
}
function v22BestWarehouseForSelection(city,groups=currentGroups){
  const pref=v22WarehousePreference(city);
  return pref.map(w=>v22SelectedCoverage(w,groups)).sort((a,b)=>
    Number(b.complete)-Number(a.complete)||
    b.covered-a.covered||
    pref.indexOf(a.w)-pref.indexOf(b.w)
  )[0]||null
}
function v22AutoFill(force=false){
  const w=el('fWarehouse')?.value||'';if(!w)return;const used=new Map();
  currentGroups.forEach(g=>{const p=v22Product(g);g.units=(g.units||[]).map(u=>{if(!force&&u.variantKey){used.set(u.variantKey,(used.get(u.variantKey)||0)+1);return u}const pool=v22AvailableVariants(g,u.size||g.size,w).filter(v=>v.available>(used.get(v.variantKey)||0));const pick=pool[0];if(!pick)return {...u,variantKey:'',design:'',product:p.product,material:p.material,style:p.style};used.set(pick.variantKey,(used.get(pick.variantKey)||0)+1);return {variantKey:pick.variantKey,product:p.product,material:p.material,style:p.style,size:u.size||g.size,design:pick.design}})});v22RenderGroups()
}
function v22RenderGroups(){
  const host=el('productGroups');if(!host)return;const w=el('fWarehouse')?.value||'';
  host.innerHTML=currentGroups.map((g,gi)=>{const p=v22Product(g);return `<div class="product-group"><div class="product-group-head"><div><span class="group-number">${gi+1}</span><b>${esc(p.label)}</b><div class="muted">${Number(g.qty)} unidades · ${esc(w||'Selecciona bodega')}</div></div></div><div class="group-config"><div class="field"><label>Producto</label><select onchange="v22ChangeGroup('${g.id}','catalogKey',this.value)">${Object.entries(PRODUCT_CATALOG).map(([k,x])=>`<option value="${k}" ${k===g.catalogKey?'selected':''}>${esc(x.label)}</option>`).join('')}</select></div><div class="field"><label>Cantidad</label><input type="number" min="1" value="${Number(g.qty)}" onchange="v22ChangeGroup('${g.id}','qty',this.value)"></div><div class="field"><label>Talla base</label><select onchange="v22ChangeGroup('${g.id}','size',this.value)">${p.sizes.map(s=>`<option ${s===g.size?'selected':''}>${esc(s)}</option>`).join('')}</select></div></div><div class="unit-head"><span>#</span><span>Talla</span><span>Diseño / color</span><span>Disponible</span><span>Estado</span></div><div class="units">${(g.units||[]).map((u,i)=>v22UnitHtml(g,u,i,w)).join('')}</div></div>`}).join('');
  if(el('orderQtyTotal'))el('orderQtyTotal').textContent=currentGroups.reduce((a,g)=>a+Number(g.qty||0),0)
}
function v22UnitHtml(g,u,i,w){
  const p=v22Product(g),size=p.sizes.includes(u.size)?u.size:g.size,vars=v22AvailableVariants(g,size,w),sel=vars.find(v=>v.variantKey===u.variantKey);
  const local=Number(sel?.available||0),total=Number(sel?.totalAvailable||0);
  const st=!u.variantKey?'Sin definir':local>3?'OK':local>0?'Crítico':total>0?'OTRA BODEGA':'SIN STOCK';
  const cls=st==='OK'?'green':(st==='Crítico'||st==='OTRA BODEGA')?'amber':'red';
  const print=g.catalogKey==='adulto_estampado'||g.catalogKey==='ninos_estampado';
  const optionText=v=>{
    const name=print?`Diseño #${v.design}`:v.design;
    if(v.available>0)return `${name} · ${v.available} aquí${v.totalAvailable!==v.available?` / ${v.totalAvailable} total`:''}`;
    if(v.totalAvailable>0)return `${name} · ${v.totalAvailable} total · ${v.bestWarehouse||'otra bodega'}`;
    return `${name} · SIN STOCK`
  };
  const shown=u.variantKey?(local>0?local:(total>0?`${total} total`:0)):'—';
  return `<div class="unit unit-v3"><span class="n">${i+1}</span><select onchange="v22ChangeUnitSize('${g.id}',${i},this.value)">${p.sizes.map(s=>`<option ${s===size?'selected':''}>${esc(s)}</option>`).join('')}</select><select onchange="v22ChangeUnit('${g.id}',${i},this.value)"><option value="">Seleccionar</option>${vars.map(v=>`<option value="${esc(v.variantKey)}" ${v.variantKey===u.variantKey?'selected':''}>${esc(optionText(v))}</option>`).join('')}</select><span class="${local<=3?'stock-low':'stock-ok'}">${shown}</span><span class="tag ${cls}">${st}</span></div>`
}
window.v22ChangeGroup=function(id,key,val){const g=currentGroups.find(x=>x.id===id);if(!g)return;const old=v22Product(g);if(key==='catalogKey'){g.catalogKey=val;const p=v22Product(g);g.size=p.sizes[0];g.units=[]}else if(key==='qty'){g.qty=Math.max(1,Number(val||1))}else{g.size=val;g.units=[]}const p=v22Product(g);g.units=Array.from({length:g.qty},(_,i)=>{const u=g.units?.[i]||{};return {...u,size:p.sizes.includes(u.size)?u.size:g.size,variantKey:u.variantKey||'',design:u.design||''}});v22AutoFill(true)};
window.v22ChangeUnitSize=function(id,i,size){const g=currentGroups.find(x=>x.id===id);if(!g)return;const p=v22Product(g);g.units[i]={...(g.units[i]||{}),size,variantKey:'',design:'',product:p.product,material:p.material,style:p.style};v22RenderGroups()};
window.v22ChangeUnit=function(id,i,vk){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;
  const p=v22Product(g),r=(state.inventory||[]).find(x=>x.variantKey===vk);
  g.units[i]={...(g.units[i]||{}),variantKey:vk,design:r?.design||'',size:r?.size||g.units[i]?.size||g.size,product:p.product,material:p.material,style:p.style};
  if(vk){
    const current=el('fWarehouse')?.value||'';
    const local=(state.inventory||[]).filter(x=>x.variantKey===vk&&x.warehouse===current).reduce((a,x)=>a+Math.max(0,Number(availableStock(x)||0)),0);
    const total=(state.inventory||[]).filter(x=>x.variantKey===vk).reduce((a,x)=>a+Math.max(0,Number(availableStock(x)||0)),0);
    if(local<=0&&total>0){
      const best=v22BestWarehouseForSelection(el('fCity')?.value||'',currentGroups);
      if(best?.complete&&best.w&&best.w!==current){
        if(el('fWarehouse'))el('fWarehouse').value=best.w;
        toast(`Ese diseño no tenía stock en ${current||'la bodega actual'}. Se cambió a ${best.w}, que sí cubre las referencias seleccionadas.`)
      }else{
        toast(`Ese diseño sí tiene ${total} unidad(es) disponibles en otra bodega, pero el surtido actual no cabe completo en una sola bodega.`)
      }
    }
  }
  v22RenderGroups()
};
window.v22WarehouseChanged=function(){v22AutoFill(true)};

function renderOrderDrawerV22(s){
  const d=el('orderDrawer');if(!d)throw new Error('orderDrawer no existe');const sale=s||{name:'',phone:'',city:'',department:'',address:'',source:'WhatsApp',advisor:isAdvisor()?session.name:(ADVISORS[0]||''),status:'Nueva',attempts:0,price:149900,payment:'Contraentrega',warehouse:'',carrier:'',deliveryMode:'Domicilio',notes:''};
  currentGroups=v22InitGroups(s);let wh=sale.warehouse||v22BestWarehouse(sale.city,currentGroups);
  d.innerHTML=`<div class="drawer-head"><div><div class="eyebrow">${esc(sale.id||'NUEVA VENTA')}</div><h2>${s?'Gestionar venta':'Crear venta manual'}</h2></div><div class="spacer"></div><span class="tag green">VISTA OPERATIVA</span><button class="close" onclick="closeOrder()">×</button></div><div class="drawer-body">${s?drawerSourcePanelV20(s):''}<div class="form-section"><h3>Cliente</h3><div class="form-grid"><div class="field"><label>Nombre *</label><input id="fName" value="${esc(sale.name||'')}"></div><div class="field"><label>Teléfono *</label><input id="fPhone" value="${esc(sale.phone||'')}"></div><div class="field"><label>Ciudad *</label><input id="fCity" value="${esc(sale.city||'')}"></div><div class="field"><label>Departamento</label><input id="fDepartment" value="${esc(sale.department||'')}"></div><div class="field span2"><label>Dirección *</label><input id="fAddress" value="${esc(sale.address||'')}"></div><div class="field"><label>Origen</label><select id="fSource">${['Shopify','WhatsApp','Recuperación','Remarketing','Web','Bot','Presencial','manual'].map(x=>`<option ${sale.source===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Asesor</label><select id="fAdvisor" ${isAdvisor()?'disabled':''}>${ADVISORS.map(x=>`<option ${sale.advisor===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div></div></div><div class="form-section"><h3>Gestión comercial</h3><div class="form-grid"><div class="field"><label>Estado</label><select id="fStatus">${salesStatusOptionsV20().map(x=>`<option ${x===sale.status?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>Intentos</label><input id="fAttempts" type="number" min="0" max="3" value="${Number(sale.attempts||0)}"></div><div class="field"><label>Valor total *</label><input id="fPrice" type="number" value="${Number(sale.price||0)}"></div><div class="field"><label>Pago</label><select id="fPayment">${['Contraentrega','Transferencia','Pago anticipado'].map(x=>`<option ${sale.payment===x?'selected':''}>${x}</option>`).join('')}</select></div></div></div><div class="form-section"><div class="product-section-head"><div><h3>Referencias exactas</h3><p class="muted">Cada unidad se valida contra stock real de la bodega seleccionada.</p></div><button type="button" class="btn light sm" onclick="v22AutoFill(true)">↻ Surtido disponible</button></div><div id="productGroups"></div><div class="order-total-strip"><div><span>Total unidades</span><b id="orderQtyTotal">0</b></div></div></div><div class="form-section"><h3>Bodega & despacho</h3><div class="form-grid"><div class="field"><label>Bodega *</label><select id="fWarehouse" onchange="v22WarehouseChanged()"><option value="">Seleccionar</option>${WAREHOUSES.map(x=>`<option ${x===wh?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>Transportadora</label><select id="fCarrier"><option value="">Por definir</option>${TRANSPORTS.map(x=>`<option ${sale.carrier===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>Modalidad</label><select id="fDeliveryMode">${['Domicilio','Reclama en oficina'].map(x=>`<option ${sale.deliveryMode===x?'selected':''}>${x}</option>`).join('')}</select></div></div></div><div class="form-section"><h3>Observaciones</h3><textarea id="fNotes">${esc(sale.notes||'')}</textarea></div></div><div class="drawer-foot"><button class="btn light" onclick="saveOrderV3(false)">Guardar gestión</button><button class="btn cyan" onclick="saveOrderV3(true)">Confirmar orden + reservar stock</button></div>`;
  v22AutoFill(false)
}

window.openOrderV20=function(id){editingSaleId=id||null;const s=id?state.sales.find(x=>String(x.id)===String(id)||String(x.dbId)===String(id)):null;if(id&&!s)return toast('No encontré esa venta');try{renderOrderDrawerV22(s);if(s&&!salesPermissionV20(s)&&isAdvisor()){el('orderDrawer')?.querySelectorAll('input,select,textarea,.drawer-foot button').forEach(x=>x.disabled=true)}el('drawerBack')?.classList.add('open');el('orderDrawer')?.classList.add('open')}catch(e){console.error('openOrderV22',e);reportFrontErrorV22(e.message,e.stack,{sale:s?.id||id});fallbackDrawerV20(s);el('drawerBack')?.classList.add('open');el('orderDrawer')?.classList.add('open');toast('Ocurrió un error al abrir la venta; quedó registrado para revisión')}};
window.openOrder=window.openOrderV20;
window.newOrder=function(){editingSaleId=null;openOrderV20(null)};
window.v22AutoFill=v22AutoFill;
