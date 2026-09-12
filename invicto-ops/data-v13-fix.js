/* INVICTO OPS v13.1 · ciclo de sesión y señales de datos reales */
const logoutBaseV131=window.logout;
const renderShellBaseV131=window.renderShell;

window.renderShell=function(){
  renderShellBaseV131();
  const chip=document.querySelector('.mode-chip');
  if(chip){chip.textContent='DATOS EN VIVO · SUPABASE';chip.classList.remove('red','amber');chip.classList.add('green');}
};

window.logout=async function(){
  opsHydratedV13=false;opsLoadingV13=false;
  if(opsReloadTimerV13){clearTimeout(opsReloadTimerV13);opsReloadTimerV13=null;}
  if(opsRealtimeV13){try{await invictoSupabaseV12.removeChannel(opsRealtimeV13)}catch(e){}opsRealtimeV13=null;}
  return logoutBaseV131();
};

invictoSupabaseV12.auth.onAuthStateChange((event)=>{
  if(event==='SIGNED_OUT'){opsHydratedV13=false;opsLoadingV13=false;opsProfilesV13=[];opsWarehousesV13=[];}
});

// Mientras el importador persistente se termina, impedimos que una carga Excel quede solo en el navegador.
const importInventoryLocalV131=window.importInventory;
window.importInventory=function(file){
  if(!file)return;
  toast('La carga Excel local está bloqueada para evitar datos fantasma. El inventario visible ya viene de Supabase.');
  const input=document.getElementById('inventoryFile');if(input)input.value='';
};
