/* INVICTO OPS v37.1 · coherencia visual de horario + brief fresco */
(function(){
  if(typeof window.renderRecovery==='function'){
    const baseRecovery=window.renderRecovery;
    window.renderRecovery=function(){
      baseRecovery();
      const host=document.getElementById('view-recovery');
      if(host)host.querySelectorAll('p').forEach(p=>{p.textContent=p.textContent.replace('Lun–Sáb 08:00–18:00','Lun–Sáb 08:00–12:00 y 14:00–18:00')});
    };
  }
  if(typeof window.renderConfig==='function'){
    const baseConfig=window.renderConfig;
    window.renderConfig=async function(){
      await baseConfig();
      const host=document.getElementById('view-config');if(!host)return;
      host.querySelectorAll('.statline').forEach(row=>{
        const label=row.querySelector('span')?.textContent?.trim();
        if(label==='Horario SLA'){const b=row.querySelector('b');if(b)b.textContent='Lun–Sáb 08:00–12:00 / 14:00–18:00';}
      });
    };
  }
  if(typeof window.opsV37ShowOpeningBrief==='function'){
    const baseBrief=window.opsV37ShowOpeningBrief;
    window.opsV37ShowOpeningBrief=async function(){
      try{if(window.invictoSupabaseV12&&window.session?.id)await invictoSupabaseV12.rpc('refresh_ops_alerts');}catch(e){console.warn('refresh alerts before brief',e)}
      return baseBrief();
    };
  }
  setTimeout(()=>{try{if(typeof window.opsV37ScheduleBrief==='function')window.opsV37ScheduleBrief();}catch(e){console.warn(e)}},1200);
  console.info('INVICTO OPS v37.1 · horario visible y brief sincronizados');
})();
