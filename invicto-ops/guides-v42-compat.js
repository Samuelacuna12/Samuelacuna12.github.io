/* INVICTO OPS v42 · compatibilidad con refrescos v41 */
(function(){
  if(window.renderGuideDashboardV42)window.renderGuideDashboardV41=window.renderGuideDashboardV42;
  if(window.loadGuideDashboardV42)window.loadGuideDashboardV41=window.loadGuideDashboardV42;
  if(window.setGuideFilterV42)window.setGuideFilterV41=window.setGuideFilterV42;
  if(window.guideSearchV42)window.guideSearchChangeV41=window.guideSearchV42;

  window.submitGuideV41=async function(taskId){
    const tracking=document.getElementById('guideTrack-'+taskId)?.value?.trim()||document.getElementById('g42Track-'+taskId)?.value?.trim()||'';
    const carrier=document.getElementById('guideCarrier-'+taskId)?.value||document.getElementById('g42Carrier-'+taskId)?.value||'';
    if(!tracking)return typeof toast==='function'&&toast('Escribe el número de guía');
    if(!carrier)return typeof toast==='function'&&toast('Selecciona la transportadora');
    try{
      const {data,error}=await invictoSupabaseV12.rpc('set_guide_task_result_v42',{p_task_id:taskId,p_result:'guia_enviada',p_tracking_number:tracking,p_carrier:carrier,p_note:null});
      if(error)throw error;if(!data?.ok)throw new Error('No se pudo registrar la guía');
      if(window.loadGuideDashboardV42)await window.loadGuideDashboardV42(true);
      if(typeof toast==='function')toast('Guía enviada correctamente');
    }catch(e){console.error(e);if(typeof toast==='function')toast('No se guardó: '+(e?.message||e));}
  };
  console.info('INVICTO OPS v42 · refrescos de guías v41 redirigidos a v42');
})();