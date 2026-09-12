/* INVICTO OPS v21 · privacidad de cache + monitoreo de errores del cliente */
let lastClientErrorV21={key:'',at:0};
function purgePersistentOpsCacheV21(){try{localStorage.removeItem(STORAGE_KEY);sessionStorage.removeItem(STORAGE_KEY)}catch(e){}}
function sanitizeClientErrorV21(v=''){return String(v||'').replace(/Bearer\s+[A-Za-z0-9._-]+/gi,'Bearer [redacted]').replace(/sk-[A-Za-z0-9_-]+/g,'[redacted]').replace(/sb_secret_[A-Za-z0-9_-]+/g,'[redacted]').slice(0,5000)}
async function logClientErrorV21(message,stack=''){
  if(!session?.id||!window.invictoSupabaseV12)return;
  const clean=sanitizeClientErrorV21(message).slice(0,1000),key=`${currentView}|${clean}`;if(!clean)return;
  if(lastClientErrorV21.key===key&&Date.now()-lastClientErrorV21.at<60000)return;lastClientErrorV21={key,at:Date.now()};
  try{await invictoSupabaseV12.from('client_error_events').insert({user_id:session.id,message:clean,stack:sanitizeClientErrorV21(stack),view_name:currentView||'',app_version:'21.0',user_agent:String(navigator.userAgent||'').slice(0,500)})}catch(e){}
}
window.addEventListener('error',e=>logClientErrorV21(e.message||'Error de interfaz',e.error?.stack||`${e.filename||''}:${e.lineno||''}:${e.colno||''}`));
window.addEventListener('unhandledrejection',e=>{const r=e.reason;logClientErrorV21(r?.message||String(r||'Promesa rechazada'),r?.stack||'')});

// Los datos reales viven en Supabase. Evita dejar clientes, teléfonos y pedidos persistidos en localStorage.
purgePersistentOpsCacheV21();
window.saveState=function(){/* estado en memoria únicamente; Supabase es la fuente de verdad */};
const hydratePrivacyBaseV21=window.hydrateOpsV13;
window.hydrateOpsV13=async function(force=false){const r=await hydratePrivacyBaseV21(force);purgePersistentOpsCacheV21();return r};
const logoutPrivacyBaseV21=window.logout;
window.logout=async function(){purgePersistentOpsCacheV21();try{return await logoutPrivacyBaseV21()}finally{purgePersistentOpsCacheV21()}};

const renderConfigMonitorBaseV21=window.renderConfig;
window.renderConfig=async function(){
  await renderConfigMonitorBaseV21();if(!isAdmin())return;
  try{
    const since=new Date(Date.now()-86400000).toISOString();const {count,error}=await invictoSupabaseV12.from('client_error_events').select('id',{count:'exact',head:true}).gte('created_at',since);if(error)throw error;
    const grid=document.querySelector('.health-grid-v21');if(grid&&!document.getElementById('clientErrorsV21'))grid.insertAdjacentHTML('beforeend',`<div id="clientErrorsV21"><small>Errores interfaz 24h</small><b class="${Number(count||0)?'stock-low':''}">${Number(count||0)}</b></div>`);
  }catch(e){console.warn('Client error health',e)}
};
