const app=document.getElementById('app');
const SB_URL='https://ntafomzqtjdfslanggak.supabase.co';
const SB_KEY='sb_publishable_IBdKw7gD078zjvB38UWcVQ_dyV4lI9s';
const sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const state={mov:[],items:[],rates:[],tab:'resumen',draft:[],file:null};
const SIZES=['S','M','L','XL','2XL','3XL','4XL'];
const $=q=>document.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n||0));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota'}).format(new Date());

function toast(t){const x=$('#toast');x.textContent=t;x.classList.remove('hidden');clearTimeout(window.__tt);window.__tt=setTimeout(()=>x.classList.add('hidden'),2800)}
function totals(){const paid=state.mov.filter(x=>x.movement_type==='payment').reduce((a,b)=>a+Number(b.amount||0),0);const delivered=state.mov.filter(x=>x.movement_type==='delivery').reduce((a,b)=>a+Number(b.amount||0),0);const units=state.items.reduce((a,b)=>a+Number(b.quantity||0),0);return{paid,delivered,balance:paid-delivered,units}}
function balanceText(v){return v>0?'Carlos debe entregar '+money(v)+' en mercancía a Invicto.':v<0?'Invicto debe pagarle '+money(Math.abs(v))+' a Carlos.':'Invicto y Carlos están al día.'}

async function loadData(){
  const r=await sb.rpc('carlos_public_state');
  if(r.error)throw r.error;
  const d=r.data||{};
  state.mov=Array.isArray(d.movements)?d.movements:[];
  state.items=Array.isArray(d.items)?d.items:[];
  state.rates=Array.isArray(d.rates)?d.rates:[];
}
async function refreshAll(){try{await loadData();render();toast('Actualizado')}catch(e){toast(e.message||'No se pudo actualizar')}}

function render(){
  const t=totals();
  app.innerHTML='<main class="shell">'+
  '<header class="top"><div class="brand"><div class="logo">I</div><div><b>INVICTO</b><span>Cuentas Carlos · Público</span></div></div><div class="user"><small>Acceso público</small><button class="iconbtn" onclick="refreshAll()" title="Actualizar">↻</button></div></header>'+
  '<h1 class="page-title">Cuentas Carlos</h1>'+
  '<section class="account"><div><div class="acct-top"><span class="dot"></span><span>Cuenta proveedor · Carlos Pérez</span></div><div class="balance-label">Saldo actual</div><div class="balance">'+money(Math.abs(t.balance))+'</div><div class="balance-note">'+esc(balanceText(t.balance))+'</div></div><div class="acct-brand"><div><strong>INVICTO</strong><small>PRODUCCIÓN</small></div><div class="chip"></div></div></section>'+
  '<section class="metrics"><div class="metric"><small>CONSIGNADO A CARLOS</small><b>'+money(t.paid)+'</b><span>Dinero entregado por Invicto</span></div><div class="metric"><small>MERCANCÍA RECIBIDA</small><b>'+money(t.delivered)+'</b><span>Producción valorizada</span></div><div class="metric"><small>UNIDADES RECIBIDAS</small><b>'+t.units.toLocaleString('es-CO')+'</b><span>Acumulado registrado</span></div></section>'+
  '<section class="actions"><button class="action" onclick="paymentModal()"><i>↗</i>Registrar consignación</button><button class="action" onclick="deliveryModal()"><i>↙</i>Registrar entrega</button><button class="action green" onclick="rateModal()"><i>+</i>Configurar tarifas</button></section>'+
  '<nav class="tabs"><button class="'+(state.tab==='resumen'?'on':'')+'" onclick="tab(\'resumen\')">Resumen</button><button class="'+(state.tab==='mov'?'on':'')+'" onclick="tab(\'mov\')">Movimientos</button><button class="'+(state.tab==='prod'?'on':'')+'" onclick="tab(\'prod\')">Producción</button><button class="'+(state.tab==='rates'?'on':'')+'" onclick="tab(\'rates\')">Tarifas</button></nav>'+
  '<section id="content">'+content()+'</section></main>';
}
function tab(x){state.tab=x;render()}
function content(){if(state.tab==='mov')return movementPanel();if(state.tab==='prod')return productionPanel();if(state.tab==='rates')return ratesPanel();return summaryPanel()}
function summaryPanel(){const a=state.mov.slice(0,8);return '<div class="panel"><div class="panel-head"><h2>Actividad reciente</h2><span>'+state.mov.length+' movimientos</span></div><div class="panel-body">'+(a.length?a.map(txRow).join(''):'<div class="empty">Todavía no hay movimientos registrados.</div>')+'</div></div>'}
function txRow(x){
  const p=x.movement_type==='payment', doc=x.document_path&&String(x.document_path).startsWith('db:');
  return '<div class="tx"><div class="tx-ico">'+(p?'↗':'↙')+'</div><div class="tx-main"><b>'+(p?'Consignación a Carlos':'Entrega de producción')+'</b><small>'+esc(x.movement_date)+' · '+esc(x.reference||'Sin referencia')+'</small></div><div class="tx-val '+(p?'pos':'neg')+'">'+(p?'+':'−')+' '+money(x.amount)+'</div><div class="row">'+(doc?'<button class="mini" onclick="openDoc(\''+esc(String(x.document_path).slice(3))+'\')">Soporte</button>':'')+'<button class="mini danger" onclick="delMovement(\''+esc(x.id)+'\')">Eliminar</button></div></div>';
}
function movementPanel(){return '<div class="panel"><div class="panel-head"><h2>Todos los movimientos</h2><span>'+state.mov.length+' registros</span></div><div class="panel-body">'+(state.mov.length?state.mov.map(txRow).join(''):'<div class="empty">No hay movimientos.</div>')+'</div></div>'}
function productionPanel(){
  if(!state.items.length)return '<div class="panel"><div class="empty">Aún no hay producción registrada.</div></div>';
  const a=[...state.items].sort((x,y)=>String(x.product_type).localeCompare(String(y.product_type))||SIZES.indexOf(x.size)-SIZES.indexOf(y.size));
  return '<div class="panel"><div class="panel-head"><h2>Producción recibida</h2><span>'+totals().units.toLocaleString('es-CO')+' unidades</span></div><div class="panel-body tablewrap"><table class="table"><thead><tr><th>PRODUCTO</th><th>DISEÑO</th><th>MATERIAL</th><th>TALLA</th><th>UNIDADES</th><th>COSTO/U</th><th>TOTAL</th></tr></thead><tbody>'+a.map(x=>'<tr><td><b>'+esc(x.product_type)+'</b></td><td>'+esc(x.design_type)+'</td><td>'+esc(x.material)+'</td><td><b>'+esc(x.size)+'</b></td><td>'+Number(x.quantity).toLocaleString('es-CO')+'</td><td>'+money(x.unit_cost)+'</td><td><b>'+money(x.line_total)+'</b></td></tr>').join('')+'</tbody></table></div></div>';
}
function ratesPanel(){return '<div class="panel"><div class="panel-head"><h2>Tarifas por unidad</h2><span>'+state.rates.length+' configuradas</span></div><div class="panel-body">'+(state.rates.length?state.rates.map(x=>'<div class="tx"><div class="tx-ico">₱</div><div class="tx-main"><b>'+esc(x.product_type)+' · '+esc(x.design_type)+' · '+esc(x.material)+'</b><small>Talla '+esc(x.size)+'</small></div><div class="tx-val">'+money(x.unit_cost)+'</div><button class="mini danger" onclick="delRate(\''+esc(x.id)+'\')">Eliminar</button></div>').join(''):'<div class="empty">No hay tarifas configuradas.</div>')+'</div></div>'}

async function delMovement(id){
  if(!confirm('¿Eliminar este movimiento? El saldo se recalculará.'))return;
  const r=await sb.rpc('carlos_public_delete_movement',{p_id:id});
  if(r.error)return toast(r.error.message);
  await loadData();render();
}
async function delRate(id){
  if(!confirm('¿Eliminar esta tarifa?'))return;
  const r=await sb.rpc('carlos_public_delete_rate',{p_id:id});
  if(r.error)return toast(r.error.message);
  await loadData();render();
}
async function openDoc(id){
  const r=await sb.rpc('carlos_public_get_document',{p_id:id});
  if(r.error)return toast(r.error.message);
  const d=Array.isArray(r.data)?r.data[0]:null;
  if(!d)return toast('No encontré el soporte.');
  try{
    const bin=atob(d.content_base64),bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([bytes],{type:d.mime_type||'application/octet-stream'}));
    window.open(url,'_blank','noopener');
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){toast('No se pudo abrir el soporte.')}
}
async function boot(){
  app.innerHTML='<div class="login"><div class="login-form" style="max-width:420px;border-radius:28px"><h2>Cuentas Carlos</h2><p>Cargando cuenta compartida…</p></div></div>';
  try{await loadData();render()}catch(e){app.innerHTML='<div class="login"><div class="login-form" style="max-width:460px;border-radius:28px"><h2>No se pudo cargar</h2><p>'+esc(e.message||'Error de conexión')+'</p><button class="primary" onclick="location.reload()">Reintentar</button></div></div>'}
}
boot();