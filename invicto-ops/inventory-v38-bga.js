/* INVICTO OPS v38 · importador flexible de Bucaramanga */
(function(){
  const baseStage=window.stageInventoryV20;

  function h(v=''){
    return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,' ').trim().toUpperCase();
  }
  function num(v){
    if(typeof v==='number')return Number.isFinite(v)?v:0;
    let s=String(v??'').trim().replace(/\s+/g,'');
    if(!s)return 0;
    if(/^[-+]?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
    else if(/^[-+]?\d+,\d+$/.test(s))s=s.replace(',','.');
    const n=Number(s);return Number.isFinite(n)?n:0;
  }
  const REF_ALIASES=['REFERENCIA','REF','REFERENCIA PRODUCTO','REFERENCIA DEL PRODUCTO','PRODUCTO','NOMBRE','NOMBRE PRODUCTO','DESCRIPCION'];
  const STOCK_ALIASES=['STOCK ACTUAL','STOCK','CANTIDAD','CANTIDAD ACTUAL','EXISTENCIA','EXISTENCIAS','UNIDADES','SALDO','ACTUAL'];
  const SIZE_ALIASES=['TALLA','SIZE'];
  const DESIGN_ALIASES=['DISENO','TIPO','MATERIAL','TELA','CATEGORIA','LINEA','CLASE'];
  const validSizes=new Set(['S','M','L','XL','2XL','3XL','4XL','2-4','6-8','10-12','14-16','MEDIAS','UNICA']);
  const validKinds=new Set(['ESTAMPADO','LICRA','ALGODON','MEDIAS']);
  function idx(headers,aliases){return headers.findIndex(x=>aliases.includes(x));}
  function inferColumn(matrix,start,excluded,kind){
    const width=Math.max(0,...matrix.slice(start,start+25).map(r=>r.length));let best=-1,bestScore=0;
    for(let c=0;c<width;c++){
      if(excluded.has(c))continue;let seen=0,ok=0;
      for(const row of matrix.slice(start,start+25)){
        const v=h(row[c]);if(!v)continue;seen++;
        if(kind==='size'&&validSizes.has(v))ok++;
        if(kind==='design'&&validKinds.has(v))ok++;
      }
      const score=seen?ok/seen:0;if(ok>=2&&score>bestScore){best=c;bestScore=score;}
    }
    return best;
  }
  function findLayout(wb){
    let best=null;
    for(const sheetName of wb.SheetNames){
      const ws=wb.Sheets[sheetName];
      const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:false});
      const limit=Math.min(matrix.length,60);
      for(let r=0;r<limit;r++){
        const headers=(matrix[r]||[]).map(h);
        const ref=idx(headers,REF_ALIASES),stock=idx(headers,STOCK_ALIASES);
        if(ref<0||stock<0)continue;
        let size=idx(headers,SIZE_ALIASES),design=idx(headers,DESIGN_ALIASES);
        const excluded=new Set([ref,stock]);
        if(size<0)size=inferColumn(matrix,r+1,excluded,'size');if(size>=0)excluded.add(size);
        if(design<0)design=inferColumn(matrix,r+1,excluded,'design');
        const score=10+(size>=0?3:0)+(design>=0?3:0)-r*.02;
        if(!best||score>best.score)best={sheetName,matrix,headerRow:r,ref,stock,size,design,headers,score};
      }
    }
    return best;
  }
  function canonicalRows(layout){
    const out=[];
    for(const row of layout.matrix.slice(layout.headerRow+1)){
      if(!row||!row.some(v=>v!==null&&String(v).trim()!==''))continue;
      const reference=row[layout.ref],rawStock=row[layout.stock],rawSize=layout.size>=0?row[layout.size]:'',rawDesign=layout.design>=0?row[layout.design]:'';
      if((reference===null||String(reference).trim()==='')&&(rawStock===null||String(rawStock).trim()===''))continue;
      let design=h(rawDesign),size=h(rawSize).replace(/^TALLA\s*/,'').replace(/\s+/g,'');
      const refText=h(reference);
      if(!design){
        if(size==='MEDIAS')design='MEDIAS';
        else if(/^\d+$/.test(refText)&&validSizes.has(size))design='ESTAMPADO';
        else if(/^DAMA ALGODON/.test(refText))design='ALGODON';
      }
      out.push({'TALLA':rawSize,'REFERENCIA':reference,'DISEÑO':design,'STOCK ACTUAL':num(rawStock)});
    }
    return out;
  }
  async function parseBga(file){
    if(typeof XLSX==='undefined')throw new Error('No está disponible el lector de Excel');
    const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array'}),layout=findLayout(wb);
    if(!layout)throw new Error('No encontré las columnas de referencia y stock de Bucaramanga. El archivo puede traer títulos arriba; ya se revisaron todas las hojas y las primeras 60 filas.');
    const rows=canonicalRows(layout);
    if(!rows.length)throw new Error('El archivo de Bucaramanga no contiene filas de inventario debajo del encabezado detectado.');
    const report={warehouse:'Bucaramanga',fileName:file.name,kind:'bga',sourceRows:rows.length,targetRows:rows.length,acceptedRows:0,ignoredRows:0,invalidRows:0,negativeRows:0,duplicateRows:0,sourcePositive:0,acceptedPhysical:0,externalIds:0,invalidExamples:[],ignoredExamples:[],hardErrors:[],detectedSheet:layout.sheetName,detectedHeaderRow:layout.headerRow+1};
    const normalized=[];
    for(const r of rows){
      const raw=num(r['STOCK ACTUAL']);report.sourcePositive+=Math.max(0,raw);if(raw<0)report.negativeRows++;
      const n=normalizeBgaRow(r);
      if(n){normalized.push(n);report.acceptedRows++;report.acceptedPhysical+=Math.max(0,num(n.sourceStock));}
      else if(raw===0){report.ignoredRows++;if(report.ignoredExamples.length<5)report.ignoredExamples.push(`${r['TALLA']??''} · ${r['REFERENCIA']??''}`);}
      else{report.invalidRows++;if(report.invalidExamples.length<5)report.invalidExamples.push(`${r['TALLA']??''} · ${r['REFERENCIA']??''} · ${r['DISEÑO']??''}`);}
    }
    if(!normalized.length)report.hardErrors.push('No se encontró ninguna variante válida para importar.');
    if(report.invalidRows)report.hardErrors.push(`${report.invalidRows} filas con stock no pudieron interpretarse; no se aplicará nada hasta revisarlas.`);
    const payload=normalized.map(invInternalPayloadV20),seen=new Map();
    payload.forEach(x=>seen.set(x.internal_sku,(seen.get(x.internal_sku)||0)+1));
    const dups=[...seen].filter(([,n])=>n>1);report.duplicateRows=dups.reduce((a,[,n])=>a+n-1,0);
    if(dups.length)report.hardErrors.push(`${dups.length} variantes canónicas están repetidas dentro del archivo.`);
    return {report,payload};
  }

  window.stageInventoryV20=async function(warehouse,file){
    if(warehouse!=='Bucaramanga')return baseStage(warehouse,file);
    if(!file||!isAdmin())return;
    try{
      toast('Validando Bucaramanga…');
      const parsed=await parseBga(file);inventoryPendingV20.set(warehouse,parsed);renderInventory();
      const r=parsed.report;
      toast(r.hardErrors.length?'Archivo revisado · hay filas que requieren revisión':`Bucaramanga validado · ${r.acceptedRows} variantes · ${r.acceptedPhysical.toLocaleString('es-CO')} uds`);
    }catch(e){
      console.error('BGA v38',e);
      inventoryPendingV20.set(warehouse,{report:{warehouse,fileName:file.name,kind:'bga',hardErrors:[e.message||String(e)],targetRows:0,acceptedRows:0,acceptedPhysical:0,negativeRows:0,ignoredRows:0,invalidRows:0,ignoredExamples:[],invalidExamples:[]},payload:[]});
      renderInventory();toast('No se pudo validar Bucaramanga: '+(e.message||e));
    }finally{
      const i=document.getElementById('invFileV20-'+warehouse.replace(/\W+/g,'-'));if(i)i.value='';
    }
  };
  console.info('INVICTO OPS v38 · parser flexible Bucaramanga activo');
})();