/* INVICTO OPS v29.2 · corrección de sesión para ventana diaria de stock */
window.fetchDailyStockStatusV29=async function(force=false){
  if(typeof invictoSupabaseV12==='undefined'||!session||!isAdmin())return [];
  const now=Date.now();
  if(!force&&now-dailyStockLastCheckV29<15000)return dailyStockRowsV29;
  if(dailyStockCheckingV29)return dailyStockRowsV29;
  dailyStockCheckingV29=true;
  try{
    const {data,error}=await invictoSupabaseV12.rpc('daily_stock_status_v29');
    if(error)throw error;
    dailyStockRowsV29=data||[];
    dailyStockLastCheckV29=Date.now();
    return dailyStockRowsV29;
  }catch(e){console.warn('daily_stock_status_v29',e);return []}
  finally{dailyStockCheckingV29=false}
};

window.dailyStockTickV29=async function(){
  if(!session||!isAdmin()){
    document.getElementById('dailyStockBackV29')?.remove();
    if(typeof removeDailyStockReminderV29==='function')removeDailyStockReminderV29();
    return;
  }
  const rows=await window.fetchDailyStockStatusV29();
  if(!rows.length)return;
  if(!dailyStockPendingV29().length){
    document.getElementById('dailyStockBackV29')?.remove();
    removeDailyStockReminderV29();
    return;
  }
  if(dailyStockDismissedV29)showDailyStockReminderV29();else renderDailyStockModalV29();
};

setTimeout(()=>window.dailyStockTickV29(),1500);
setInterval(()=>window.dailyStockTickV29(),60000);
console.info('INVICTO OPS v29.2 · ventana diaria de stock corregida');
