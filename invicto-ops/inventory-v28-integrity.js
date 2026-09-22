/* INVICTO OPS v28 · integridad fuerte de inventario e interfaz post-carga */
const OPS_INVENTORY_VERSION_V28='28.0';

window.applyInventoryV20=async function(warehouse){
  const pending=inventoryPendingV20.get(warehouse),r=pending?.report;
  if(!pending||r.hardErrors?.length)return toast('Primero valida un archivo correcto');
  if(!isAdmin())return toast('Solo administración o gerencia puede actualizar inventario');

  const risky=r.currentPhysical!=null&&(Math.abs(Number(r.deltaPct||0))>=25||Number(r.rowDeltaPct||0)<=-20);
  if(risky&&!confirm(`${warehouse}: el archivo cambiará el stock ${r.deltaPct>=0?'+':''}${r.deltaPct}% y las variantes ${r.rowDeltaPct>=0?'+':''}${r.rowDeltaPct}%.\n\nConfirma únicamente si este archivo es un corte COMPLETO del operador.`))return;

  try{
    toast(`Actualizando y verificando IDs de ${warehouse}…`);
    const {data,error}=await invictoSupabaseV12.rpc('apply_ops_inventory_import_v28',{
      p_warehouse_name:warehouse,
      p_rows:pending.payload,
      p_source_name:r.fileName,
      p_force:!!risky
    });
    if(error)throw error;
    if(!data?.verification?.ok)throw new Error('El servidor no confirmó la integridad de la carga. No se considera aplicada.');

    inventoryHistoryCacheV21={at:0,rows:[]};
    opsHydratedV13=false;
    await hydrateOpsV13(true);

    const s=invWarehouseStatsV20(warehouse),actual=s.physical,conf=Number(data?.reservation_conflicts||0),v=data.verification;
    r.applied=true;
    r.actualPhysical=actual;
    r.appliedAt=new Date().toISOString();
    r.serverVerification=v;

    // La comparación debe pasar a la NUEVA foto una vez aplicada.
    // Esto evita que el panel siga mostrando el delta contra el stock anterior.
    r.currentPhysical=actual;
    r.currentRows=s.rows;
    r.delta=r.acceptedPhysical-actual;
    r.deltaPct=actual?Math.round((r.delta/actual)*100):0;
    r.rowDelta=r.acceptedRows-s.rows;
    r.rowDeltaPct=s.rows?Math.round((r.rowDelta/s.rows)*100):0;

    const exactStock=(actual===r.acceptedPhysical)||conf>0;
    const exactIds=Number(v.external_ids_matched||0)===Number(v.external_ids_expected||0)&&Number(v.external_id_mismatches||0)===0;
    const exactVariants=Number(v.inventory_matches||0)===Number(v.incoming_variants||0)&&Number(v.stock_mismatches||0)===0;
    if(!exactStock||!exactIds||!exactVariants){
      throw new Error(`Verificación posterior incompleta: stock ${actual}/${r.acceptedPhysical}, IDs ${v.external_ids_matched}/${v.external_ids_expected}, variantes ${v.inventory_matches}/${v.incoming_variants}`);
    }

    renderInventory();
    if(typeof renderAI==='function')renderAI();
    toast(`${warehouse}: ${Number(actual||0).toLocaleString('es-CO')} uds · ${v.external_ids_matched} IDs verificados`);
  }catch(e){
    console.error(e);
    toast('No se pudo verificar la actualización: '+(e.message||e));
  }
};

const renderInventoryBaseV28=window.renderInventory;
window.renderInventory=function(){
  renderInventoryBaseV28();
  WAREHOUSES.forEach((w,idx)=>{
    const r=inventoryPendingV20.get(w)?.report;
    if(!r?.applied||!r.serverVerification?.ok)return;
    const card=document.querySelectorAll('.inv-upload-card-v20')[idx];
    const box=card?.querySelector('.inv-validation-v20');
    if(!box)return;

    const v=r.serverVerification;
    const delta=box.querySelector('.delta-v21');
    if(delta){
      delta.classList.remove('risk');
      delta.innerHTML=`<span>Estado después de aplicar</span><b>✓ SIN DIFERENCIAS</b><small>${Number(r.currentRows||0).toLocaleString('es-CO')} variantes · ${Number(r.currentPhysical||0).toLocaleString('es-CO')} uds</small>`;
    }

    const title=box.querySelector('.inv-validation-title b');
    if(title)title.textContent='✓ Actualizado y verificado';

    const btn=box.querySelector('button[onclick^="applyInventoryV20"]');
    if(btn)btn.remove();

    if(!box.querySelector('.integrity-v28')){
      box.insertAdjacentHTML('beforeend',`<div class="inv-explain-v20 integrity-v28"><b>Verificación de integridad:</b> ${Number(v.external_ids_matched||0).toLocaleString('es-CO')}/${Number(v.external_ids_expected||0).toLocaleString('es-CO')} IDs correctos · ${Number(v.inventory_matches||0).toLocaleString('es-CO')}/${Number(v.incoming_variants||0).toLocaleString('es-CO')} variantes correctas · 0 diferencias de cantidad.</div>`);
    }
  });
};

console.info('INVICTO OPS v28 · verificación transaccional de inventario activa');
