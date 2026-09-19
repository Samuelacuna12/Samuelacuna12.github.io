/* INVICTO OPS v33 · MASSIVE validado antes de exportar */
const OPS_MASSIVE_VERSION_V33='55.0';

function excelDateSerialV33(days=0){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const m=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  const utc=Date.UTC(Number(m.year),Number(m.month)-1,Number(m.day)+Number(days||0));
  return Math.floor((utc-Date.UTC(1899,11,30))/86400000);
}
function moneyIntV33(v){return Math.max(0,Math.round(Number(v||0)))}
function nonEmptyV33(v){return v!==null&&v!==undefined&&String(v).trim()!==''}
function numericIdV33(v){return /^\d+$/.test(String(v??'').trim())}
function stockLinesV54(s){
  const units=exactUnitsV17(s), prices=linePricesV17(s.price,units.length), by=new Map();
  units.forEach((u,i)=>{
    const inv=inventoryRowForUnitV17(u,s.warehouse), price=Number(prices[i]||0);
    const key=[u.variantKey,inv?.externalId||'',price].join('|');
    const x=by.get(key)||{unit:u,inv,qty:0,unitPrice:price};
    x.qty++;by.set(key,x);
  });
  return [...by.values()];
}
function unitRowsV33(s){return stockLinesV54(s)}
function sumStockPricesV33(row,start,max){let total=0;for(let i=0;i<max;i++){const qty=Number(row[start+i*3+1]||0),price=Number(row[start+i*3+2]||0);total+=qty*price}return Math.round(total)}

function preflightSaleV33(s,warehouse,maxLines){
  if(s.status!=='Confirmada')return 'La venta no está confirmada';
  const units=exactUnitsV17(s), lines=stockLinesV54(s);
  if(!units.length)return 'Faltan referencias exactas de talla/diseño/color';
  if(lines.length>maxLines)return `${lines.length} referencias/precios exceden las ${maxLines} líneas del MASSIVE`;
  if(!nonEmptyV33(s.name))return 'Falta nombre del cliente';
  const phone=digitsV17(s.phone);if(phone.length<7||phone.length>15)return 'Teléfono inválido';
  if(!nonEmptyV33(s.city))return 'Falta ciudad';
  if(!nonEmptyV33(s.address))return 'Falta dirección';
  if(!nonEmptyV33(s.warehouse)||s.warehouse!==warehouse)return 'La bodega de la venta no coincide con el MASSIVE';
  if(warehouse!=='Bucaramanga'){
    for(const {unit,inv} of stockLinesV54(s)){
      if(!inv)return `No existe la variante ${unit.size||''} ${unit.design||''} en ${warehouse}`;
      if(!numericIdV33(inv.externalId))return `ID externo inválido para ${unit.size||''} ${unit.design||''}`;
    }
  }
  if(warehouse==='LogiGho Medellín'&&!resolveLogighoCityV17(s))return `Sin código LogiGho: ${s.city||'—'} / ${s.department||'—'}`;
  return '';
}

window.hokoRowV17=function(s){
  const units=exactUnitsV17(s),lines=stockLinesV54(s),stock=[];
  lines.forEach(x=>stock.push(String(x.inv.externalId),x.qty,x.unitPrice));
  while(stock.length<45)stock.push(null);
  return [
    s.name||'',null,s.email||null,digitsV17(s.phone),`${String(s.city||'').toUpperCase()}${s.department?` - ${String(s.department).toUpperCase()}`:''}`,String(s.department||'').toUpperCase(),s.address||'',s.notes||null,hokoCarrierV17(s),null,excelDateSerialV33(5),paymentHokoV17(s),10,10,10,1,containsTextV17(units,units.length),null,...stock
  ];
};

window.logighoRowV17=async function(s){
  const city=resolveLogighoCityV17(s);if(!city)throw new Error(`Sin código LogiGho para ${s.city||'—'} / ${s.department||'—'}`);
  const units=exactUnitsV17(s),lines=stockLinesV54(s),stock=[];
  lines.forEach(x=>stock.push(String(x.inv.externalId),x.qty,x.unitPrice));
  while(stock.length<36)stock.push(null);
  return [s.name||'',null,s.email||null,digitsV17(s.phone),String(city.code),String(city.label),s.address||'',s.notes||null,logiCarrierV17(s),excelDateSerialV33(5),'CONTADO',null,10,10,10,1,isCODV17(s)?'SI':'NO',s.deliveryMode==='Reclama en oficina'?2:1,String(s.advisor||'').toUpperCase(),containsTextV17(units,units.length),'SI',moneyIntV33(s.price),null,12083,...stock,containsTextV17(units,units.length),null,null,null,null,null];
};

function validateRowV33(row,warehouse,s){
  const isHoko=warehouse.startsWith('Hoko'),isLogi=warehouse==='LogiGho Medellín';
  const headers=isHoko?HOKO_HEADERS_V17:isLogi?LOGIGHO_HEADERS_V17:null;
  if(headers&&row.length!==headers.length)return `Estructura inválida: ${row.length}/${headers.length} columnas`;
  if(!headers)return '';
  const max=isHoko?15:12,start=isHoko?18:24,total=moneyIntV33(s.price);
  let lines=0;
  for(let i=0;i<max;i++){
    const id=row[start+i*3],qty=row[start+i*3+1],price=row[start+i*3+2];
    const any=nonEmptyV33(id)||nonEmptyV33(qty)||nonEmptyV33(price);
    if(!any)continue;
    lines++;
    if(!numericIdV33(id))return `ID STOCK ${i+1} inválido`;
    if(!Number.isInteger(Number(qty))||Number(qty)<=0)return `CANTIDAD STOCK ${i+1} inválida`;
    if(!Number.isFinite(Number(price))||Number(price)<0)return `PRECIO STOCK ${i+1} inválido`;
  }
  const expected=stockLinesV54(s).length;
  if(lines!==expected)return `Líneas de stock ${lines}/${expected}`;
  const expectedQty=exactUnitsV17(s).length;
  let rowQty=0;for(let i=0;i<max;i++)rowQty+=Number(row[start+i*3+1]||0);
  if(rowQty!==expectedQty)return `Cantidad MASSIVE ${rowQty}/${expectedQty}`;
  if(sumStockPricesV33(row,start,max)!==total)return `La suma de líneas no cuadra: ${sumStockPricesV33(row,start,max)}/${total}`;
  if(!Number.isInteger(Number(row[isHoko?10:9]))||Number(row[isHoko?10:9])<40000)return 'Fecha de entrega no es fecha Excel válida';
  if(isLogi){
    if(!numericIdV33(row[4]))return 'Código LogiGho de ciudad inválido';
    if(Number(row[21])!==total)return `Valor declarado ${row[21]}/${total}`;
    if(Number(row[23])!==12083)return 'ID TIENDA LogiGho inválido';
  }
  return '';
}

function formatMassiveSheetV33(ws,warehouse,rowCount){
  const dateCol=warehouse.startsWith('Hoko')?10:warehouse==='LogiGho Medellín'?9:null;
  if(dateCol!==null){for(let r=1;r<=rowCount;r++){const addr=XLSX.utils.encode_cell({r,c:dateCol}),cell=ws[addr];if(cell){cell.t='n';cell.z='dd/mm/yyyy'}}}
  ws['!freeze']={xSplit:0,ySplit:1};
  if(ws['!ref'])ws['!autofilter']={ref:ws['!ref']};
}

window.exportCutV17=async function(cutId,warehouse){
  if(!isAdmin())return toast('Solo administración o gerencia puede generar massives');
  if(typeof XLSX==='undefined')return toast('No está disponible el generador Excel');
  const cut=state.cuts.find(c=>c.id===cutId);if(!cut)return toast('Corte no encontrado');
  const allSales=cutSalesV17(cut).filter(s=>s.warehouse===warehouse);
  if(!allSales.length)return toast('Este corte no tiene pedidos para '+warehouse);
  try{
    const {data:already,error:alreadyErr}=await invictoSupabaseV12.rpc('get_massive_exported_sale_ids_v55',{p_cut_id:cut.id,p_warehouse_name:warehouse});
    if(alreadyErr)throw alreadyErr;
    const exportedSet=new Set((already||[]).map(String));
    const sales=allSales.filter(s=>!exportedSet.has(String(s.dbId||'')));
    if(!sales.length)return toast('Esta bodega ya fue exportada completamente. No se generará otra vez.');
    const manual=[],manualMeta=[],rows=[],includedSaleIds=[];
    if(warehouse==='LogiGho Medellín')await loadLogighoCitiesV17();
    const max=warehouse==='LogiGho Medellín'?12:warehouse.startsWith('Hoko')?15:9999;
    for(const s of sales){
      let reason=preflightSaleV33(s,warehouse,max);
      if(reason){
        manual.push([s.id,s.name,warehouse,reason,s.qty||exactUnitsV17(s).length]);
        manualMeta.push({sale_id:s.dbId||null,reason});
        continue;
      }
      const row=warehouse==='LogiGho Medellín'?await logighoRowV17(s):warehouse.startsWith('Hoko')?hokoRowV17(s):bgaRowV17(s);
      reason=validateRowV33(row,warehouse,s);
      if(reason){
        const msg='Validación MASSIVE: '+reason;
        manual.push([s.id,s.name,warehouse,msg,s.qty||exactUnitsV17(s).length]);
        manualMeta.push({sale_id:s.dbId||null,reason:msg});
        continue;
      }
      rows.push(row);
      if(s.dbId)includedSaleIds.push(s.dbId);
    }
    const wb=XLSX.utils.book_new();let headers,operator;
    if(warehouse==='LogiGho Medellín'){headers=LOGIGHO_HEADERS_V17;operator='LogiGho'}
    else if(warehouse.startsWith('Hoko')){headers=HOKO_HEADERS_V17;operator='Hoko'}
    else{headers=['PEDIDO','NOMBRE','TELEFONO','CIUDAD','DEPARTAMENTO','DIRECCION','ASESOR','UNIDADES','DETALLE EXACTO','VALOR','PAGO','OBSERVACIONES'];operator='Bucaramanga'}
    const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);formatMassiveSheetV33(ws,warehouse,rows.length);XLSX.utils.book_append_sheet(wb,ws,'ordenes');
    if(manual.length){const m=XLSX.utils.aoa_to_sheet([['PEDIDO','CLIENTE','BODEGA','MOTIVO','UNIDADES'],...manual]);XLSX.utils.book_append_sheet(wb,m,'PENDIENTES_MANUAL')}
    const label=cut.displayId||`C-${String(cut.id).slice(0,6)}`,file=`${safeFileV17(label)}_${safeFileV17(operator)}_${safeFileV17(warehouse)}.xlsx`;
    XLSX.writeFile(wb,file,{bookType:'xlsx',compression:true});

    const cleanManual=manualMeta.filter(x=>x.sale_id);
    const {data:logData,error:logError}=await invictoSupabaseV12.rpc('log_dispatch_export_v54',{
      p_cut_id:cut.id,
      p_warehouse_name:warehouse,
      p_operator:operator,
      p_file_name:file,
      p_included_sale_ids:includedSaleIds,
      p_manual:cleanManual
    });
    if(logError)throw new Error('El archivo se descargó, pero no se pudo registrar su trazabilidad: '+logError.message);

    if(typeof hydrateOpsV13==='function')await hydrateOpsV13(true);
    if(typeof renderCuts==='function'&&currentView==='cuts')setTimeout(()=>renderCuts(),50);
    toast(`${file}: ${rows.length} pedidos exportados${manual.length?` · ${manual.length} bloqueados vuelven al próximo corte`:''}`);
    return logData;
  }catch(e){console.error(e);toast('No se pudo completar la exportación MASSIVE: '+(e.message||e))}
};

console.info('INVICTO OPS v55 · MASSIVE una sola vez + cantidades agrupadas + trazabilidad exacta');
