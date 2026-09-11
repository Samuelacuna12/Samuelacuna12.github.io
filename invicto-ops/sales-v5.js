/* INVICTO OPS v5 · selector muestra agotados sin ocultarlos */

// Catálogo visible: toma todas las variantes conocidas para producto+talla.
// Si hay bodega seleccionada, la disponibilidad mostrada corresponde a esa bodega;
// si no hay bodega, muestra la disponibilidad consolidada.
function variantsForGroupV3(g,w=''){
  const productKey=groupProductKeyV3(g);
  const size=normalizeSize(g.size);
  const master=new Map();

  state.inventory
    .filter(r=>r.productKey===productKey&&normalizeSize(r.size)===size)
    .forEach(r=>{
      if(!master.has(r.variantKey)) master.set(r.variantKey,{variantKey:r.variantKey,design:r.design,available:0,totalAvailable:0});
      const v=master.get(r.variantKey);
      const a=availableStock(r);
      v.totalAvailable+=a;
      if(!w||r.warehouse===w) v.available+=a;
    });

  return [...master.values()].sort((a,b)=>{
    const aOut=a.available<=0?1:0,bOut=b.available<=0?1:0;
    if(aOut!==bOut)return aOut-bOut;
    if(b.available!==a.available)return b.available-a.available;
    return String(a.design).localeCompare(String(b.design),'es',{numeric:true});
  });
}

function unitHtmlV3(g,u,i,w,vars){
  const r=w&&u.variantKey?recordV3(u.variantKey,w):null;
  const v=vars.find(x=>x.variantKey===u.variantKey);
  const a=w?(r?availableStock(r):0):(v?.available||0);
  const st=!u.variantKey?'Sin definir':a<=0?'SIN STOCK':a<=5?'Crítico':'OK';
  const cls=st==='OK'?'green':st==='Crítico'?'amber':'red';
  const isPrint=(g.catalogKey==='adulto_estampado'||g.catalogKey==='ninos_estampado');
  const display=x=>isPrint?`Diseño #${x}`:x;
  const label=u.design?display(u.design):'Seleccionar';

  const options=vars.filter(x=>x.variantKey!==u.variantKey).map(x=>{
    const stockLabel=x.available>0?`${x.available} disp.`:'SIN STOCK';
    return `<option value="${esc(x.variantKey)}">${esc(display(x.design))} · ${stockLabel}</option>`;
  }).join('');

  const selectedStock=u.variantKey?(a>0?`${a} disp.`:'SIN STOCK'):'';
  return `<div class="unit unit-v3">
    <span class="n">${i+1}</span>
    <select onchange="changeUnitV3('${g.id}',${i},this.value)">
      <option value="${esc(u.variantKey||'')}">${esc(label)}${selectedStock?` · ${selectedStock}`:''}</option>
      ${options}
    </select>
    <span><b>${esc(g.size)}</b></span>
    <span class="${a<=3?'stock-low':'stock-ok'}">${u.variantKey?a:'—'}</span>
    <span class="tag ${cls}">${st}</span>
  </div>`;
}
