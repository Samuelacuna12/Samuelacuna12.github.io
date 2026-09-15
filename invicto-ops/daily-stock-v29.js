/* INVICTO OPS v29 · cierre diario de stock + solicitud flotante al iniciar el día */
const OPS_DAILY_STOCK_VERSION_V29='29.3';
let dailyStockCheckingV29=false;
let dailyStockLastCheckV29=0;
let dailyStockRowsV29=[];
let dailyStockDismissedV29=false;

function dailyStockEscV29(v=''){return typeof esc==='function'?esc(v):String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function dailyStockIdV29(w=''){return String(w).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()}
function dailyStockFmtV29(iso){if(!iso)return '—';try{return new Date(iso).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return iso}}
function dailyStockDateV29(){return new Intl.DateTimeFormat('es-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}

function dailyStockStylesV29(){
  if(document.getElementById('dailyStockStylesV29'))return;
  const s=document.createElement('style');s.id='dailyStockStylesV29';s.textContent=`
  .daily-stock-back-v29{position:fixed;inset:0;background:rgba(2,16,68,.54);backdrop-filter:blur(5px);z-index:99990;display:flex;align-items:center;justify-content:center;padding:24px}
  .daily-stock-modal-v29{width:min(760px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:26px;box-shadow:0 28px 80px rgba(2,16,68,.28);border:1px solid #e6e9f0}
  .daily-stock-head-v29{padding:24px 26px 18px;border-bottom:1px solid #edf0f5;display:flex;gap:16px;align-items:flex-start}.daily-stock-head-v29 h2{margin:3px 0 6px;font-size:28px;color:#071128}.daily-stock-head-v29 p{margin:0;color:#657189}.daily-stock-close-v29{margin-left:auto;border:0;background:#f1f4f8;width:38px;height:38px;border-radius:50%;font-size:20px;cursor:pointer}
  .daily-stock-body-v29{padding:20px 26px 26px}.daily-stock-alert-v29{background:#fff7e8;border:1px solid #ffd896;border-radius:16px;padding:14px 16px;margin-bottom:16px;color:#805100}.daily-stock-grid-v29{display:grid;gap:10px}.daily-stock-row-v29{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:15px 16px;border:1px solid #e7ebf2;border-radius:16px;background:#fafbfc}.daily-stock-row-v29.done{background:#f0fbf5;border-color:#bdebd0}.daily-stock-row-v29.loading{background:#eef7ff;border-color:#b9d9ff}.daily-stock-row-v29.error{background:#fff1f0;border-color:#ffc9c4}.daily-stock-row-v29 b{display:block;color:#071128}.daily-stock-row-v29 small{display:block;margin-top:4px;color:#6d7890}.daily-stock-actions-v29{display:flex;align-items:center;gap:9px}.daily-stock-tag-v29{font-size:12px;font-weight:800;border-radius:999px;padding:7px 10px;background:#ffede9;color:#a93623}.daily-stock-row-v29.done .daily-stock-tag-v29{background:#dff7e8;color:#147447}.daily-stock-btn-v29{border:0;border-radius:12px;padding:10px 14px;background:#03154f;color:#fff;font-weight:800;cursor:pointer}.daily-stock-btn-v29:disabled{opacity:.55;cursor:wait}.daily-stock-footer-v29{display:flex;align-items:center;gap:12px;margin-top:18px;color:#657189;font-size:13px}.daily-stock-footer-v29 button{margin-left:auto;border:0;background:transparent;color:#526079;cursor:pointer;text-decoration:underline}
  .daily-stock-reminder-v29{position:fixed;right:20px;bottom:20px;z-index:99980;border:0;border-radius:16px;background:#c43d28;color:#fff;padding:13px 16px;font-weight:900;box-shadow:0 10px 30px rgba(118,31,18,.28);cursor:pointer}
  @media(max-width:620px){.daily-stock-back-v29{padding:10px}.daily-stock-modal-v29{border-radius:20px}.daily-stock-head-v29,.daily-stock-body-v29{padding-left:18px;padding-right:18px}.daily-stock-row-v29{grid-template-columns:1fr}.daily-stock-actions-v29{justify-content:space-between}.daily-stock-head-v29 h2{font-size:23px}}
  `;document.head.appendChild(s);
}

async function fetchDailyStockStatusV29(force=false){
  if(typeof invictoSupabaseV12==='undefined'||!session||!isAdmin())return [];
  const now=Date.now();if(!force&&now-dailyStockLastCheckV29<15000)return dailyStockRowsV29;
  if(dailyStockCheckingV29)return dailyStockRowsV29;
  dailyStockCheckingV29=true;
  try{
    const {data,error}=await invictoSupabaseV12.rpc('daily_stock_status_v29');
    if(error)throw error;
    dailyStockRowsV29=data||[];dailyStockLastCheckV29=Date.now();return dailyStockRowsV29;
  }catch(e){console.warn('daily_stock_status_v29',e);return []}
  finally{dailyStockCheckingV29=false}
}

function dailyStockPendingV29(){return (dailyStockRowsV29||[]).filter(r=>!r.loaded)}
function removeDailyStockReminderV29(){document.getElementById('dailyStockReminderV29')?.remove()}
function showDailyStockReminderV29(){
  removeDailyStockReminderV29();const n=dailyStockPendingV29().length;if(!n)return;
  const b=document.createElement('button');b.id='dailyStockReminderV29';b.className='daily-stock-reminder-v29';b.textContent=`Stock pendiente · ${n}/4`;b.onclick=()=>{dailyStockDismissedV29=false;renderDailyStockModalV29()};document.body.appendChild(b);
}

function closeDailyStockModalV29(){document.getElementById('dailyStockBackV29')?.remove();dailyStockDismissedV29=true;showDailyStockReminderV29()}
window.closeDailyStockModalV29=closeDailyStockModalV29;

function renderDailyStockModalV29(){
  dailyStockStylesV29();removeDailyStockReminderV29();
  const rows=dailyStockRowsV29||[],pending=rows.filter(r=>!r.loaded);
  if(!pending.length){document.getElementById('dailyStockBackV29')?.remove();return}
  let back=document.getElementById('dailyStockBackV29');if(!back){back=document.createElement('div');back.id='dailyStockBackV29';back.className='daily-stock-back-v29';document.body.appendChild(back)}
  const resetAt=rows[0]?.reset_at;
  back.innerHTML=`<div class="daily-stock-modal-v29" role="dialog" aria-modal="true" aria-label="Stock del día">
    <div class="daily-stock-head-v29"><div><div class="eyebrow">INVENTARIO DIARIO</div><h2>Cargar stock del día</h2><p>${dailyStockEscV29(dailyStockDateV29())} · faltan ${pending.length} de 4 bodegas.</p></div><button class="daily-stock-close-v29" onclick="closeDailyStockModalV29()" aria-label="Cerrar">×</button></div>
    <div class="daily-stock-body-v29"><div class="daily-stock-alert-v29"><b>El stock físico se reinicia automáticamente a 0 todos los días a las 23:59.</b><br>Para comenzar el nuevo día, carga el corte completo de cada bodega. Las reservas activas se conservan para no romper pedidos ya confirmados.</div>
      <div class="daily-stock-grid-v29">${rows.map(r=>{const id=dailyStockIdV29(r.warehouse),done=!!r.loaded;return `<div class="daily-stock-row-v29 ${done?'done':''}" id="dailyStockRow-${id}"><div><b>${dailyStockEscV29(r.warehouse)}</b><small>${done?`Cargado ${dailyStockEscV29(dailyStockFmtV29(r.imported_at))} · ${Number(r.physical||0).toLocaleString('es-CO')} uds`:'Pendiente de cargar el corte de hoy'}</small><small id="dailyStockMsg-${id}"></small></div><div class="daily-stock-actions-v29"><span class="daily-stock-tag-v29">${done?'CARGADO':'PENDIENTE'}</span>${done?'':`<button class="daily-stock-btn-v29" id="dailyStockBtn-${id}" onclick="document.getElementById('dailyStockFile-${id}').click()">Seleccionar archivo</button><input id="dailyStockFile-${id}" type="file" accept=".xlsx,.xls" hidden onchange="uploadDailyStockV29('${dailyStockEscV29(r.warehouse)}',this)">`}</div></div>`}).join('')}</div>
      <div class="daily-stock-footer-v29"><span>Último reinicio: ${dailyStockEscV29(dailyStockFmtV29(resetAt))}</span><button onclick="closeDailyStockModalV29()">Cerrar por ahora</button></div>
    </div></div>`;
}

window.uploadDailyStockV29=async function(warehouse,input){
  const file=input?.files?.[0];if(!file)return;
  const id=dailyStockIdV29(warehouse),row=document.getElementById('dailyStockRow-'+id),btn=document.getElementById('dailyStockBtn-'+id),msg=document.getElementById('dailyStockMsg-'+id);
  row?.classList.add('loading');if(btn){btn.disabled=true;btn.textContent='Validando…'}if(msg)msg.textContent='Validando archivo y IDs…';
  try{
    if(typeof window.stageInventoryV20!=='function'||typeof window.applyInventoryV20!=='function')throw new Error('El módulo de inventario aún no está listo.');
    await window.stageInventoryV20(warehouse,file);
    const pending=inventoryPendingV20?.get?.(warehouse);
    const errors=pending?.report?.hardErrors||[];
    if(errors.length)throw new Error(errors.join(' '));
    if(msg)msg.textContent='Archivo válido. Aplicando y verificando…';
    await window.applyInventoryV20(warehouse);
    await new Promise(r=>setTimeout(r,400));
    dailyStockLastCheckV29=0;await fetchDailyStockStatusV29(true);
    const current=(dailyStockRowsV29||[]).find(x=>x.warehouse===warehouse);
    if(!current?.loaded)throw new Error('El archivo se validó pero no quedó aplicado. Revisa la validación de inventario.');
    if(typeof window.hydrateOpsV13==='function'){try{await window.hydrateOpsV13(true)}catch(e){}}
    if(dailyStockPendingV29().length){renderDailyStockModalV29()}else{document.getElementById('dailyStockBackV29')?.remove();removeDailyStockReminderV29();if(typeof toast==='function')toast('Stock diario completo · 4/4 bodegas cargadas')}
  }catch(e){console.error(e);row?.classList.remove('loading');row?.classList.add('error');if(btn){btn.disabled=false;btn.textContent='Intentar de nuevo'}if(msg)msg.textContent=e.message||String(e);if(typeof toast==='function')toast('No se pudo cargar '+warehouse)}
  finally{if(input)input.value=''}
};

async function dailyStockTickV29(){
  if(!session||!isAdmin()){document.getElementById('dailyStockBackV29')?.remove();removeDailyStockReminderV29();return}
  const rows=await fetchDailyStockStatusV29();if(!rows.length)return;
  if(!dailyStockPendingV29().length){document.getElementById('dailyStockBackV29')?.remove();removeDailyStockReminderV29();return}
  if(dailyStockDismissedV29)showDailyStockReminderV29();else renderDailyStockModalV29();
}

setTimeout(dailyStockTickV29,1200);
setInterval(dailyStockTickV29,60000);
console.info('INVICTO OPS v29.3 · stock diario a cero 23:59 + ventana de carga activa');
