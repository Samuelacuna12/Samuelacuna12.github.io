/* INVICTO OPS v15 · importación de inventario persistente */
window.importInventory=async function(file){
  if(!file)return;
  if(!isAdmin())return toast('Solo administración o gerencia puede actualizar inventario');
  if(typeof XLSX==='undefined')return toast('No fue posible cargar el lector de Excel');
  try{
    toast('Procesando inventario…');
    const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:null});
    if(!rows.length)throw new Error('Archivo vacío');
    const keys=Object.keys(rows[0]).map(x=>String(x).trim());
    let normalized=[];
    if(keys.includes('Nombre del producto')&&keys.includes('Bodega')){
      rows.forEach(r=>{const wh=cleanText(r['Bodega']).includes('MEDELLIN')?'Hoko Medellín':'Hoko Bogotá';const n=normalizeHokoRow(r,wh);if(n)normalized.push(n)});
    }else if(keys.includes('Nombre')&&keys.includes('Actual')){
      normalized=rows.map(normalizeLogiRow).filter(Boolean);
    }else if(keys.includes('REFERENCIA')||keys.includes('Referencia')){
      normalized=rows.map(normalizeBgaRow).filter(Boolean);
    }else throw new Error('Formato no reconocido');
    if(!normalized.length)throw new Error('No encontré variantes válidas');

    const groups=new Map();
    normalized.forEach(r=>{if(!groups.has(r.warehouse))groups.set(r.warehouse,[]);groups.get(r.warehouse).push({
      internal_sku:canonicalVariantKey(r.product,r.material,r.style,r.size,r.design),product:r.product,material:r.material,style:r.style,size:r.size,design:r.design,
      stock:Math.max(0,Number(r.sourceStock??r.stock??0)),external_id:String(r.externalId||''),external_name:r.name||''
    })});
    const results=[];
    for(const [warehouse,payload] of groups){
      const {data:res,error}=await invictoSupabaseV12.rpc('apply_ops_inventory_import',{p_warehouse_name:warehouse,p_rows:payload,p_source_name:file.name});
      if(error)throw error;results.push(res);
    }
    await hydrateOpsV13(true);renderInventory();if(typeof renderAI==='function')renderAI();
    const total=results.reduce((a,x)=>a+Number(x?.rows||0),0),conf=results.reduce((a,x)=>a+Number(x?.reservation_conflicts||0),0);
    toast(`Inventario actualizado: ${total} variantes${conf?` · ${conf} protegidas por reservas`:''}`);
  }catch(e){console.error(e);toast('No se pudo importar: '+(e.message||e))}
  finally{const input=document.getElementById('inventoryFile');if(input)input.value=''}
};
