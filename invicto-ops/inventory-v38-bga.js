/* INVICTO OPS v38.2 · importador Bucaramanga validado contra archivo real */
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
  const childSizes=new Set(['2-4','6-8','10-12','14-16']);
  const adultSizes=new Set(['S','M','L','XL','2XL','3XL','4XL']);
  const validKinds=new Set(['ESTAMPADO','LICRA','ALGODON','MEDIAS']);
  const excelDateSizeMap={46114:'2-4',46240:'6-8',46366:'10-12'};

  function sizeToken(v){
    if(typeof v==='number'&&excelDateSizeMap[Math.round(v)])return excelDateSizeMap[Math.round(v)];
    let s=h(v);
    if(/^\d{1,5}$/.test(s)&&excelDateSizeMap[Number(s)])return excelDateSizeMap[Number(s)];
    const compact=s.replace(/\s+/g,'');
    if(/^(0?2[\/\-.]0?4|0?4[\/\-.]0?2)([\/\-.]\d{2,4})?$/.test(compact))return '2-4';
    if(/^(0?6[\/\-.]0?8|0?8[\/\-.]0?6)([\/\-.]\d{2,4})?$/.test(compact))return '6-8';
    if(/^(10[\/\-.]12|12[\/\-.]10)([\/\-.]\d{2,4})?$/.test(compact))return '10-12';
    s=s.replace(/^TALLA\s*/,'').replace(/\s+/g,'');
    s=s.replace(/^14-?16$/,'14-16').replace(/^2-?4$/,'2-4').replace(/^6-?8$/,'6-8').replace(/^10-?12$/,'10-12');
    return s;
  }
  function idx(headers,aliases){return headers.findIndex(x=>aliases.includes(x));}
  function inferColumn(matrix,start,excluded,kind){
    const width=Math.max(0,...matrix.slice(start,start+30).map(r=>r.length));let best=-1,bestScore=0;
    for(let c=0;c<width;c++){
      if(excluded.has(c))continue;let seen=0,ok=0;
      for(const row of matrix.slice(start,start+30)){
        const raw=row[c],v=kind==='size'?sizeToken(raw):h(raw);if(!v)continue;seen++;
        if(kind==='size'&&(childSizes.has(v)||adultSizes.has(v)||v==='MEDIAS'||v==='UNICA'))ok++;
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
      const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
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
        if(!best||score>best.score)best={sheetName,matrix,headerRow:r,ref,stock,size,design,score};
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
      const size=sizeToken(rawSize),design=h(rawDesign);
      out.push({'TALLA':size||rawSize,'REFERENCIA':reference,'DISEÑO':design,'STOCK ACTUAL':num(rawStock)});
    }
    return out;
  }

  // Normalizador propio: evita la función legacy que reasignaba una variable const.
  function normalizeBgaV382(r){
    const reference=r['REFERENCIA']??r['Referencia'];
    const kind=h(r['DISEÑO']??r['Diseño']??'');
    const stock=num(r['STOCK ACTUAL']??r['Stock actual']??0);
    let size=sizeToken(r['TALLA']??r['Talla']??r['__EMPTY']??'');
    const name=String(reference??'').trim();
    const u=cleanText(name);
    if(reference==null&&stock===0)return null;

    let product,material,style,design,m;
    if(size==='MEDIAS'||kind==='MEDIAS'){
      product='Medias';material='textil';style='pack';size='UNICA';design='PACK 3';
    }else if(childSizes.has(size)&&kind==='ESTAMPADO'){
      product='Bóxer niño';material='licra';style='estampado';design=cleanText(reference);
    }else if(adultSizes.has(size)&&kind==='ESTAMPADO'){
      product='Bóxer hombre';material='licra';style='estampado';design=cleanText(reference);
    }else if(['S','M','L','XL','2XL'].includes(size)&&kind==='ALGODON'&&/^DAMA ALGODON/.test(u)){
      m=u.match(/^DAMA ALGODON\s+(.+?)-\s*(S|M|L|XL|2XL)$/);if(!m)return null;
      product='Bóxer mujer';material='algodón';style='unicolor';design=normalizeColor(m[1]);size=m[2];
    }else if(adultSizes.has(size)&&['LICRA','ALGODON'].includes(kind)){
      m=u.match(/^BOXER\s+(.+?)\s*T-?\s*(S|M|L|XL|2XL|3XL|4XL)$/);
      if(m){product='Bóxer hombre';material=kind==='LICRA'?'licra':'algodón';style='unicolor';design=normalizeColor(m[1]);size=m[2];}
      else if(u==='AMARILLO DICIEMBRE'){product='Bóxer hombre';material='licra';style='unicolor';design='AMARILLO DICIEMBRE';}
      else return null;
    }else if(childSizes.has(size)&&kind==='LICRA'&&u==='AMARILLO DICIEMBRE'){
      product='Bóxer niño';material='licra';style='unicolor';design='AMARILLO DICIEMBRE';
    }else return null;

    return baseInventoryRecord({operator:'Invicto',warehouse:'Bucaramanga',externalId:'',name,reference:name,stock,status:stock>0?'Disponible':'Agotado',product,material,style,size,design});
  }

  async function parseBga(file){
    if(typeof XLSX==='undefined')throw new Error('No está disponible el lector de Excel');
    const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array',cellDates:false}),layout=findLayout(wb);
    if(!layout)throw new Error('No encontré las columnas de referencia y stock de Bucaramanga.');
    const rows=canonicalRows(layout);
    if(!rows.length)throw new Error('El archivo no contiene filas de inventario debajo del encabezado detectado.');
    const report={warehouse:'Bucaramanga',fileName:file.name,kind:'bga',sourceRows:rows.length,targetRows:rows.length,acceptedRows:0,ignoredRows:0,invalidRows:0,negativeRows:0,duplicateRows:0,sourcePositive:0,acceptedPhysical:0,externalIds:0,invalidExamples:[],ignoredExamples:[],hardErrors:[],detectedSheet:layout.sheetName,detectedHeaderRow:layout.headerRow+1};
    const normalized=[];
    for(const r of rows){
      const raw=num(r['STOCK ACTUAL']);report.sourcePositive+=Math.max(0,raw);if(raw<0)report.negativeRows++;
      const n=normalizeBgaV382(r);
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
      toast(r.hardErrors.length?'Archivo revisado · hay filas que requieren revisión':`Bucaramanga listo · ${r.acceptedRows} variantes · ${r.acceptedPhysical.toLocaleString('es-CO')} uds${r.negativeRows?` · ${r.negativeRows} negativos→0`:''}`);
    }catch(e){
      console.error('BGA v38.2',e);
      inventoryPendingV20.set(warehouse,{report:{warehouse,fileName:file.name,kind:'bga',hardErrors:[e.message||String(e)],targetRows:0,acceptedRows:0,acceptedPhysical:0,negativeRows:0,ignoredRows:0,invalidRows:0,ignoredExamples:[],invalidExamples:[]},payload:[]});
      renderInventory();toast('No se pudo validar Bucaramanga: '+(e.message||e));
    }finally{
      const i=document.getElementById('invFileV20-'+warehouse.replace(/\W+/g,'-'));if(i)i.value='';
    }
  };
  console.info('INVICTO OPS v38.2 · Bucaramanga parser estable');
})();