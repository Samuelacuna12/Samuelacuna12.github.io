/* INVICTO OPS v25 · mezcla por unidad, stock global y duplicados neutrales */
const OPS_UI_VERSION_V25_FIXES='25.1';
const V25_ADULT_KEYS=['adulto_estampado','adulto_licra','adulto_algodon'];

function v25CatalogKeyFromRow(r){
  if(!r)return '';
  const hit=Object.entries(PRODUCT_CATALOG).find(([,p])=>canonicalProductKey(p.product,p.material,p.style)===r.productKey);
  return hit?.[0]||'';
}
function v25CatalogKeyFromUnit(g,u){
  if(u?.catalogKey&&PRODUCT_CATALOG[u.catalogKey])return u.catalogKey;
  if(u?.variantKey){const r=(state.inventory||[]).find(x=>x.variantKey===u.variantKey);const k=v25CatalogKeyFromRow(r);if(k)return k;}
  const hit=Object.entries(PRODUCT_CATALOG).find(([,p])=>cleanText(p.product)===cleanText(u?.product)&&cleanText(p.material)===cleanText(u?.material)&&cleanText(p.style)===cleanText(u?.style));
  return hit?.[0]||g?.catalogKey||'adulto_estampado';
}
function v25TypeLabel(k){
  return ({adulto_estampado:'Estampado',adulto_licra:'Unicolor · licra',adulto_algodon:'Unicolor · algodón',mujer_algodon:'Mujer · unicolor',ninos_estampado:'Niño · estampado',brief:'Brief',medias:'Medias'})[k]||PRODUCT_CATALOG[k]?.label||k;
}
function v25AllowedTypes(g,u){
  const k=v25CatalogKeyFromUnit(g,u);
  return (V25_ADULT_KEYS.includes(k)||V25_ADULT_KEYS.includes(g?.catalogKey))?V25_ADULT_KEYS.filter(x=>PRODUCT_CATALOG[x]):[k];
}
function v25AvailableVariants(k,size,warehouse=''){
  const pk=catalogCanonicalKey(k),map=new Map();
  (state.inventory||[]).filter(r=>r.productKey===pk&&normalizeSize(r.size)===normalizeSize(size)&&(!warehouse||r.warehouse===warehouse)).forEach(r=>{
    const x=map.get(r.variantKey)||{variantKey:r.variantKey,design:r.design,size:r.size,available:0,row:r};x.available+=availableStock(r);map.set(r.variantKey,x);
  });
  return [...map.values()].sort((a,b)=>(b.available-a.available)||String(a.design).localeCompare(String(b.design),'es',{numeric:true}));
}

const v22InitGroupsBaseV25=window.v22InitGroups;
window.v22InitGroups=function(s){
  const groups=v22InitGroupsBaseV25(s);
  groups.forEach(g=>{
    g.units=(g.units||[]).map(u=>{
      const k=v25CatalogKeyFromUnit(g,u),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey];
      const r=u.variantKey?(state.inventory||[]).find(x=>x.variantKey===u.variantKey):null;
      return {...u,catalogKey:k,size:p.sizes.includes(r?.size||u.size)?(r?.size||u.size):(p.sizes.includes(g.size)?g.size:p.sizes[0]),product:r?.product||u.product||p.product,material:r?.material||u.material||p.material,style:r?.style||u.style||p.style,design:r?.design||u.design||''};
    });
  });
  return groups;
};

window.v22WarehouseCoverage=function(w,groups){
  let have=0,need=0;const used=new Map();
  for(const g of groups){for(const u of g.units||[]){
    need++;const k=v25CatalogKeyFromUnit(g,u),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey],size=p.sizes.includes(u.size)?u.size:p.sizes[0],bucket=`${catalogCanonicalKey(k)}@@${normalizeSize(size)}`;
    const n=(state.inventory||[]).filter(r=>r.warehouse===w&&r.productKey===catalogCanonicalKey(k)&&normalizeSize(r.size)===normalizeSize(size)).reduce((a,r)=>a+availableStock(r),0),uN=(used.get(bucket)||0)+1;used.set(bucket,uN);if(n>=uN)have++;
  }}return {w,have,need};
};
window.v22BestWarehouse=function(city,groups){
  const c=cleanText(city||'');let pref=/BUCARAMANGA|FLORIDABLANCA|GIRON|PIEDECUESTA/.test(c)?['Bucaramanga','Hoko Medellín','LogiGho Medellín','Hoko Bogotá']:/BOGOTA|SOACHA/.test(c)?['Hoko Bogotá','Hoko Medellín','LogiGho Medellín','Bucaramanga']:['Hoko Medellín','LogiGho Medellín','Hoko Bogotá','Bucaramanga'];
  return pref.map(w=>v22WarehouseCoverage(w,groups)).sort((a,b)=>b.have-a.have||pref.indexOf(a.w)-pref.indexOf(b.w))[0]?.w||'';
};
window.v22AutoFill=function(force=false){
  const w=el('fWarehouse')?.value||'';if(!w)return;const used=new Map();
  currentGroups.forEach(g=>{g.units=(g.units||[]).map(u=>{
    const k=v25CatalogKeyFromUnit(g,u),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey],size=p.sizes.includes(u.size)?u.size:(p.sizes.includes(g.size)?g.size:p.sizes[0]);
    if(!force&&u.variantKey){const row=(state.inventory||[]).find(x=>x.variantKey===u.variantKey&&x.warehouse===w),n=(used.get(u.variantKey)||0)+1;if(row&&availableStock(row)>=n){used.set(u.variantKey,n);return {...u,catalogKey:k,size,product:row.product,material:row.material,style:row.style,design:row.design}}}
    const pool=v25AvailableVariants(k,size,w).filter(v=>v.available>(used.get(v.variantKey)||0)),pick=pool[0];
    if(!pick)return {...u,catalogKey:k,size,variantKey:'',design:'',product:p.product,material:p.material,style:p.style};
    used.set(pick.variantKey,(used.get(pick.variantKey)||0)+1);return {catalogKey:k,variantKey:pick.variantKey,product:pick.row?.product||p.product,material:pick.row?.material||p.material,style:pick.row?.style||p.style,size,design:pick.design};
  })});v22RenderGroups();
};

window.v25ChangeUnitType=function(id,i,k){
  const g=currentGroups.find(x=>x.id===id);if(!g||!PRODUCT_CATALOG[k])return;const p=PRODUCT_CATALOG[k],old=g.units?.[i]||{},size=p.sizes.includes(old.size)?old.size:(p.sizes.includes(g.size)?g.size:p.sizes[0]);
  g.units[i]={...old,catalogKey:k,size,variantKey:'',design:'',product:p.product,material:p.material,style:p.style};v22RenderGroups();
};
window.v22ChangeUnitSize=function(id,i,size){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;const old=g.units?.[i]||{},k=v25CatalogKeyFromUnit(g,old),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey];if(!p.sizes.includes(size))size=p.sizes[0];g.units[i]={...old,catalogKey:k,size,variantKey:'',design:'',product:p.product,material:p.material,style:p.style};v22RenderGroups();
};
window.v22ChangeUnit=function(id,i,vk){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;const r=(state.inventory||[]).find(x=>x.variantKey===vk),k=v25CatalogKeyFromRow(r)||v25CatalogKeyFromUnit(g,g.units?.[i]||{}),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey];g.units[i]={...(g.units[i]||{}),catalogKey:k,variantKey:vk,design:r?.design||'',size:r?.size||g.units[i]?.size||g.size,product:r?.product||p.product,material:r?.material||p.material,style:r?.style||p.style};v22RenderGroups();
};
window.v22ChangeGroup=function(id,key,val){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;const oldUnits=(g.units||[]).map(x=>({...x}));
  if(key==='catalogKey'){
    g.catalogKey=val;const p=PRODUCT_CATALOG[val]||PRODUCT_CATALOG.adulto_estampado;g.size=p.sizes.includes(g.size)?g.size:p.sizes[0];g.units=Array.from({length:g.qty},(_,i)=>({...(oldUnits[i]||{}),catalogKey:val,size:g.size,variantKey:'',design:'',product:p.product,material:p.material,style:p.style}));
  }else if(key==='qty'){
    g.qty=Math.max(1,Number(val||1));g.units=Array.from({length:g.qty},(_,i)=>{const old=oldUnits[i]||{},k=v25CatalogKeyFromUnit(g,old),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey];return {...old,catalogKey:k,size:p.sizes.includes(old.size)?old.size:(p.sizes.includes(g.size)?g.size:p.sizes[0]),product:old.product||p.product,material:old.material||p.material,style:old.style||p.style,variantKey:old.variantKey||'',design:old.design||''}});
  }else{
    g.size=val;g.units=oldUnits.map(old=>{const k=v25CatalogKeyFromUnit(g,old),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey],size=p.sizes.includes(val)?val:p.sizes[0];return {...old,catalogKey:k,size,variantKey:'',design:'',product:p.product,material:p.material,style:p.style}});
  }
  v22AutoFill(true);
};
window.v25HalfMix=function(id){
  const g=currentGroups.find(x=>x.id===id);if(!g)return;const n=Math.ceil((g.units||[]).length/2);g.units=(g.units||[]).map((u,i)=>{const k=i<n?'adulto_estampado':'adulto_licra',p=PRODUCT_CATALOG[k],size=p.sizes.includes(u.size)?u.size:(p.sizes.includes(g.size)?g.size:p.sizes[0]);return {...u,catalogKey:k,size,variantKey:'',design:'',product:p.product,material:p.material,style:p.style}});v22AutoFill(true);
};
function v25UnitHtml(g,u,i,w){
  const k=v25CatalogKeyFromUnit(g,u),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey],size=p.sizes.includes(u.size)?u.size:(p.sizes.includes(g.size)?g.size:p.sizes[0]),vars=v25AvailableVariants(k,size,w),sel=vars.find(v=>v.variantKey===u.variantKey),a=sel?.available||0,st=!u.variantKey?'Sin definir':a<=0?'SIN STOCK':a<=3?'Crítico':'OK',cls=st==='OK'?'green':st==='Crítico'?'amber':'red',print=p.style==='estampado';
  return `<div class="unit unit-v25"><span class="n">${i+1}</span><select onchange="v25ChangeUnitType('${g.id}',${i},this.value)">${v25AllowedTypes(g,u).map(x=>`<option value="${x}" ${x===k?'selected':''}>${esc(v25TypeLabel(x))}</option>`).join('')}</select><select onchange="v22ChangeUnitSize('${g.id}',${i},this.value)">${p.sizes.map(s=>`<option ${s===size?'selected':''}>${esc(s)}</option>`).join('')}</select><select onchange="v22ChangeUnit('${g.id}',${i},this.value)"><option value="">${print?'Seleccionar diseño':'Seleccionar color'}</option>${vars.map(v=>`<option value="${esc(v.variantKey)}" ${v.variantKey===u.variantKey?'selected':''}>${esc(print?`Diseño #${v.design}`:v.design)} · ${v.available>0?v.available+' disp.':'SIN STOCK'}</option>`).join('')}</select><span class="${a<=3?'stock-low':'stock-ok'}">${u.variantKey?a:'—'}</span><span class="tag ${cls}">${st}</span></div>`;
}
window.v22RenderGroups=function(){
  const host=el('productGroups');if(!host)return;const w=el('fWarehouse')?.value||'';
  host.innerHTML=currentGroups.map((g,gi)=>{const p=PRODUCT_CATALOG[g.catalogKey]||PRODUCT_CATALOG.adulto_estampado,adult=V25_ADULT_KEYS.includes(g.catalogKey);return `<div class="product-group"><div class="product-group-head"><div><span class="group-number">${gi+1}</span><b>${adult?'Bóxer hombre · selección por unidad':esc(p.label)}</b><div class="muted">${Number(g.qty)} unidades · cada unidad puede tener su propio tipo, talla y diseño/color</div></div><div class="group-actions">${adult&&Number(g.qty)>1?`<button type="button" class="btn light sm" onclick="v25HalfMix('${g.id}')">½ Estampado / ½ Unicolor</button>`:''}</div></div><div class="group-config"><div class="field"><label>Tipo base</label><select onchange="v22ChangeGroup('${g.id}','catalogKey',this.value)">${Object.entries(PRODUCT_CATALOG).map(([k,x])=>`<option value="${k}" ${k===g.catalogKey?'selected':''}>${esc(x.label)}</option>`).join('')}</select></div><div class="field"><label>Cantidad total</label><input type="number" min="1" value="${Number(g.qty)}" onchange="v22ChangeGroup('${g.id}','qty',this.value)"></div><div class="field"><label>Talla base</label><select onchange="v22ChangeGroup('${g.id}','size',this.value)">${p.sizes.map(s=>`<option ${s===g.size?'selected':''}>${esc(s)}</option>`).join('')}</select></div></div><div class="unit-head unit-head-v25"><span>#</span><span>Tipo</span><span>Talla</span><span>Diseño / color</span><span>Disponible</span><span>Estado</span></div><div class="units">${(g.units||[]).map((u,i)=>v25UnitHtml(g,u,i,w)).join('')}</div></div>`}).join('');
  if(el('orderQtyTotal'))el('orderQtyTotal').textContent=currentGroups.reduce((a,g)=>a+Number(g.qty||0),0);
};
window.summaryV20=function(){
  const buckets=new Map();currentGroups.forEach(g=>(g.units||[]).forEach(u=>{const k=v25CatalogKeyFromUnit(g,u),p=PRODUCT_CATALOG[k]||PRODUCT_CATALOG[g.catalogKey],size=u.size||g.size,b=`${k}@@${size}`,x=buckets.get(b)||{n:0,label:p.label,size};x.n++;buckets.set(b,x)}));
  if(!buckets.size)return currentGroups.map(g=>`${Number(g.qty||0)} ${(PRODUCT_CATALOG[g.catalogKey]||{}).label||'unidades'}`).join(' + ');
  return [...buckets.values()].map(x=>`${x.n} ${x.label} · ${x.size}`).join(' + ');
};

/* No hay envío manual de WhatsApp desde el POS: solo WhatsApp API fuera de esta interfaz. */
function stripDirectWhatsAppV25(root=document){
  root.querySelectorAll?.('a,button').forEach(node=>{const t=cleanText(node.textContent||''),href=String(node.getAttribute?.('href')||''),oc=String(node.getAttribute?.('onclick')||'');if(/WA\.ME|WHATSAPP/i.test(href)||/WA\.ME|WHATSAPP/i.test(oc)||/^(WHATSAPP|ABRIR WHATSAPP|ENVIAR WHATSAPP|ENVIAR MENSAJE)$/.test(t))node.remove()});
}
const waObserverV25=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)stripDirectWhatsAppV25(n)})));
if(document.documentElement)waObserverV25.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>stripDirectWhatsAppV25(document),0);

/* Duplicados: visibles, pero nunca contabilizados. */
function countableSaleV25(s){return s?.status!=='Duplicado'}
const statusTagBaseV25=window.statusTag;
window.statusTag=function(st){if(st==='Duplicado')return '<span class="tag gray">⧉ DUPLICADO · NO CONTABILIZA</span>';return statusTagBaseV25(st)};
const salesMonthBaseV25=window.salesMonthV18;
if(salesMonthBaseV25)window.salesMonthV18=function(){return salesMonthBaseV25().filter(countableSaleV25)};
window.teamConfirmRate=function(){const arr=todaySales().filter(countableSaleV25).filter(s=>s.status!=='Perdido – datos inválidos');if(!arr.length)return 0;return Math.round(arr.filter(s=>s.status==='Confirmada').length/arr.length*100)};
function withCountableTodayV25(fn){return function(...args){const base=window.todaySales;window.todaySales=()=>base().filter(countableSaleV25);try{return fn.apply(this,args)}finally{window.todaySales=base}}}
if(window.renderReports)window.renderReports=withCountableTodayV25(window.renderReports);
if(window.renderTeam)window.renderTeam=withCountableTodayV25(window.renderTeam);
if(window.renderHome)window.renderHome=withCountableTodayV25(window.renderHome);
if(window.reportMetricsV23){
  window.reportMetricsV23=function(rows){const historical=rows.filter(isHistoricalV23),liveRaw=rows.filter(r=>!isHistoricalV23(r)),live=liveRaw.filter(r=>r.status!=='duplicada'),valid=live.filter(validConversionV23),confirmed=live.filter(r=>r.status==='confirmada'),lost=live.filter(r=>r.status==='perdida'),drafts=live.filter(isDraftV23),pending=live.filter(r=>r.mapping_status==='pending'),countable=[...historical,...live];const totalValue=countable.reduce((a,r)=>a+Number(r.total_price||0),0),confirmedValue=confirmed.reduce((a,r)=>a+Number(r.total_price||0),0),units=countable.reduce((a,r)=>a+Number(r.quantity||r.source_quantity||0),0);return {sales:countable.length,live:live.length,historical:historical.length,valid:valid.length,confirmed:confirmed.length,lost:lost.length,drafts:drafts.length,pending:pending.length,totalValue,confirmedValue,units,rate:valid.length?Math.round(confirmed.length/valid.length*100):0,aov:countable.length?Math.round(totalValue/countable.length):0};
  };
}

/* Stock global: Realtime dedicado + verificación ligera cada 12 s. */
let inventoryStampV25='';let inventorySyncBusyV25=false;let inventoryTimerV25=null;
function localInventoryStampV25(){return (state.inventory||[]).map(x=>x.updatedAt||'').filter(Boolean).sort().at(-1)||''}
async function syncInventoryAllUsersV25(force=false){
  if(!session||inventorySyncBusyV25)return;inventorySyncBusyV25=true;try{await hydrateOpsV13(true);inventoryStampV25=localInventoryStampV25();if(el('orderDrawer')?.classList.contains('open')&&typeof v22RenderGroups==='function')v22RenderGroups();else if(currentView)window.switchView(currentView,true)}catch(e){console.warn('inventory sync v25',e)}finally{inventorySyncBusyV25=false}
}
function scheduleInventorySyncV25(){clearTimeout(inventoryTimerV25);inventoryTimerV25=setTimeout(()=>syncInventoryAllUsersV25(true),450)}
function installInventoryLiveV25(){
  if(!session||window.__invictoInventoryLiveV25)return;inventoryStampV25=localInventoryStampV25();
  const ch=invictoSupabaseV12.channel('invicto-inventory-v25').on('postgres_changes',{event:'*',schema:'public',table:'inventory'},scheduleInventorySyncV25).on('postgres_changes',{event:'*',schema:'public',table:'stock_reservations'},scheduleInventorySyncV25);
  window.__invictoInventoryLiveV25=ch;ch.subscribe();
  if(!window.__invictoInventoryPollV25)window.__invictoInventoryPollV25=setInterval(async()=>{if(!session||document.visibilityState!=='visible'||inventorySyncBusyV25)return;try{const {data,error}=await invictoSupabaseV12.from('inventory').select('updated_at').order('updated_at',{ascending:false}).limit(1).maybeSingle();if(error)return;const stamp=data?.updated_at||'';if(stamp&&inventoryStampV25&&stamp!==inventoryStampV25)await syncInventoryAllUsersV25(true);else if(stamp&&!inventoryStampV25)inventoryStampV25=stamp}catch(e){}},12000);
}
const hydrateBaseV25=window.hydrateOpsV13;
window.hydrateOpsV13=async function(force=false){const r=await hydrateBaseV25(force);inventoryStampV25=localInventoryStampV25();installInventoryLiveV25();return r};
const renderShellBaseV25=window.renderShell;
window.renderShell=function(){renderShellBaseV25();installInventoryLiveV25();stripDirectWhatsAppV25(document);const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión '+OPS_UI_VERSION_V25_FIXES)};
