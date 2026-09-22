/* INVICTO OPS v56 · stock upload reliability hotfix */
(function(){
  function errText(e){
    if(!e)return 'Error desconocido';
    return [e.message,e.details,e.hint].filter(Boolean).join(' · ')||String(e);
  }
  async function applyStockV56(warehouse){
    const pending=inventoryPendingV20&&inventoryPendingV20.get?inventoryPendingV20.get(warehouse):null;
    const r=pending&&pending.report;
    if(!pending)throw new Error('No hay un archivo validado para '+warehouse);
    if(r&&Array.isArray(r.hardErrors)&&r.hardErrors.length)throw new Error(r.hardErrors.join(' '));
    if(typeof isAdmin==='function'&&!isAdmin())throw new Error('Solo administración o gerencia puede actualizar inventario');

    const risky=r&&r.currentPhysical!=null&&(Math.abs(Number(r.deltaPct||0))>=25||Number(r.rowDeltaPct||0)<=-20);
    if(risky&&!confirm(warehouse+': el archivo cambiará el stock '+(r.deltaPct>=0?'+':'')+r.deltaPct+'% y las variantes '+(r.rowDeltaPct>=0?'+':'')+r.rowDeltaPct+'%.\n\nConfirma únicamente si este archivo es un corte COMPLETO del operador.')){
      throw new Error('Carga cancelada por el usuario');
    }

    if(typeof toast==='function')toast('Actualizando '+warehouse+'…');
    const resp=await invictoSupabaseV12.rpc('apply_ops_inventory_import_v28',{
      p_warehouse_name:warehouse,
      p_rows:pending.payload,
      p_source_name:(r&&r.fileName)||'Excel',
      p_force:!!risky
    });
    if(resp.error)throw new Error(errText(resp.error));
    const data=resp.data;
    if(!data||!data.verification||!data.verification.ok)throw new Error('Supabase no confirmó la integridad de la carga');

    if(typeof inventoryHistoryCacheV21!=='undefined')inventoryHistoryCacheV21={at:0,rows:[]};
    if(typeof opsHydratedV13!=='undefined')opsHydratedV13=false;

    // La importación ya fue confirmada por Supabase. Un error de render/hidratación
    // NO puede convertir una carga exitosa en "fallida".
    try{
      if(typeof hydrateOpsV13==='function')await hydrateOpsV13(true);
    }catch(uiHydrateError){
      console.warn('hydrate post stock v58',uiHydrateError);
    }

    let serverStatus=null;
    try{
      const st=await invictoSupabaseV12.rpc('daily_stock_status_v29');
      if(!st.error&&Array.isArray(st.data))serverStatus=st.data.find(x=>x.warehouse===warehouse)||null;
    }catch(statusError){
      console.warn('daily stock status post import v58',statusError);
    }

    const s=typeof invWarehouseStatsV20==='function'?invWarehouseStatsV20(warehouse):null;
    const actual=Number(serverStatus?.physical ?? s?.physical ?? data.incoming_stock ?? 0);
    const rowsNow=Number(s?.rows ?? data.verification?.inventory_matches ?? 0);
    const conf=Number(data.reservation_conflicts||0);
    const v=data.verification||{};

    if(r){
      r.applied=true;
      r.actualPhysical=actual;
      r.appliedAt=new Date().toISOString();
      r.serverVerification=v;
      r.currentPhysical=actual;
      r.currentRows=rowsNow;
      r.delta=Number(r.acceptedPhysical||0)-actual;
      r.deltaPct=actual?Math.round((r.delta/actual)*100):0;
      r.rowDelta=Number(r.acceptedRows||0)-rowsNow;
      r.rowDeltaPct=rowsNow?Math.round((r.rowDelta/rowsNow)*100):0;
    }

    const exactStock=actual===Number(r?.acceptedPhysical||0)||conf>0;
    const exactIds=Number(v.external_ids_matched||0)===Number(v.external_ids_expected||0)&&Number(v.external_id_mismatches||0)===0;
    const exactVariants=Number(v.inventory_matches||0)===Number(v.incoming_variants||0)&&Number(v.stock_mismatches||0)===0;
    if(!exactStock||!exactIds||!exactVariants){
      throw new Error('Verificación posterior incompleta: stock '+actual+'/'+Number(r?.acceptedPhysical||0)+', IDs '+Number(v.external_ids_matched||0)+'/'+Number(v.external_ids_expected||0)+', variantes '+Number(v.inventory_matches||0)+'/'+Number(v.incoming_variants||0));
    }

    try{if(typeof renderInventory==='function')renderInventory()}catch(renderError){console.warn('render inventory post stock v58',renderError)}
    try{if(typeof renderAI==='function')renderAI()}catch(renderAIError){console.warn('render AI post stock v58',renderAIError)}
    if(typeof toast==='function')toast(warehouse+': '+Number(actual||0).toLocaleString('es-CO')+' unidades cargadas y verificadas');
    return data;
  }

  window.applyInventoryV20=async function(warehouse){
    try{
      return await applyStockV56(warehouse);
    }catch(e){
      console.error('applyInventoryV56',warehouse,e);
      if(typeof toast==='function')toast('Stock '+warehouse+': '+errText(e));
      throw e;
    }
  };

  window.uploadDailyStockV29=async function(warehouse,input){
    const file=input&&input.files&&input.files[0];
    if(!file)return;
    const id=typeof dailyStockIdV29==='function'?dailyStockIdV29(warehouse):String(warehouse).replace(/\W+/g,'-');
    const row=document.getElementById('dailyStockRow-'+id);
    const btn=document.getElementById('dailyStockBtn-'+id);
    const msg=document.getElementById('dailyStockMsg-'+id);
    if(row){row.classList.remove('error');row.classList.add('loading')}
    if(btn){btn.disabled=true;btn.textContent='Validando…'}
    if(msg)msg.textContent='Validando archivo…';
    try{
      if(typeof window.stageInventoryV20!=='function')throw new Error('El lector de inventario no está disponible');
      await window.stageInventoryV20(warehouse,file);
      const pending=inventoryPendingV20&&inventoryPendingV20.get?inventoryPendingV20.get(warehouse):null;
      const errors=pending&&pending.report&&pending.report.hardErrors||[];
      if(errors.length)throw new Error(errors.join(' '));

      if(msg)msg.textContent='Archivo válido. Aplicando en Supabase…';
      if(btn)btn.textContent='Aplicando…';
      await applyStockV56(warehouse);

      if(typeof dailyStockLastCheckV29!=='undefined')dailyStockLastCheckV29=0;
      let current=null;
      try{
        if(typeof fetchDailyStockStatusV29==='function')await fetchDailyStockStatusV29(true);
        current=(typeof dailyStockRowsV29!=='undefined'?dailyStockRowsV29:[]).find(function(x){return x.warehouse===warehouse})||null;
      }catch(refreshError){
        console.warn('daily modal refresh v58',refreshError);
      }
      if(!current||!current.loaded){
        const st=await invictoSupabaseV12.rpc('daily_stock_status_v29');
        if(st.error)throw st.error;
        current=(st.data||[]).find(function(x){return x.warehouse===warehouse})||null;
      }
      if(!current||!current.loaded)throw new Error('La carga no quedó registrada como corte de hoy');

      if(row){row.classList.remove('loading','error');row.classList.add('done')}
      if(msg)msg.textContent='Cargado y verificado · '+Number(current.physical||0).toLocaleString('es-CO')+' uds';
      if(typeof dailyStockPendingV29==='function'&&dailyStockPendingV29().length){
        if(typeof renderDailyStockModalV29==='function')renderDailyStockModalV29();
      }else{
        const back=document.getElementById('dailyStockBackV29');if(back)back.remove();
        if(typeof removeDailyStockReminderV29==='function')removeDailyStockReminderV29();
        if(typeof toast==='function')toast('Stock diario completo');
      }
    }catch(e){
      console.error('uploadDailyStockV56',warehouse,e);
      if(row){row.classList.remove('loading');row.classList.add('error')}
      if(btn){btn.disabled=false;btn.textContent='Intentar de nuevo'}
      if(msg)msg.textContent=errText(e);
      if(typeof toast==='function')toast('No se pudo cargar '+warehouse+': '+errText(e));
    }finally{
      if(input)input.value='';
    }
  };

  console.info('INVICTO OPS v58 · stock confirmado por backend, render no puede falsear error');
})();