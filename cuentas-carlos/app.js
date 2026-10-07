var sb=null;\nconst app=document.getElementById('app');
var state={profile:null,mov:[],items:[],rates:[],tab:'resumen',draft:[],file:null};
const SIZES=['S','M','L','XL','2XL','3XL','4XL'];
const $=q=>document.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n||0));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota'}).format(new Date());

function toast(t){const x=$('#toast');x.textContent=t;x.classList.remove('hidden');clearTimeout(window.__tt);window.__tt=setTimeout(()=>x.classList.add('hidden'),2800)}
function totals(){const paid=state.mov.filter(x=>x.movement_type==='payment').reduce((a,b)=>a+Number(b.amount||0),0);const delivered=state.mov.filter(x=>x.movement_type==='delivery').reduce((a,b)=>a+Number(b.amount||0),0);const units=state.items.reduce((a,b)=>a+Number(b.quantity||0),0);return{paid,delivered,balance:paid-delivered,units}}
function balanceText(v){return v>0?'Carlos debe entregar '+money(v)+' en mercancía a Invicto.':v<0?'Invicto debe pagarle '+money(Math.abs(v))+' a Carlos.':'Invicto y Carlos están al día.'}

async function initSupabase(){
  const src=await fetch('../invicto-ops/auth-v12.js?v=64.0',{cache:'no-store'}).then(r=>r.text());
  const u=src.match(/INVICTO_SUPABASE_URL_V12='([^']+)'/);
  const k=src.match(/INVICTO_SUPABASE_KEY_V12='([^']+)'/);
  if(!u||!k)throw Error('No fue posible cargar la conexión.');
  sb=supabase.createClient(u[1],k[1],{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}

function loginView(msg=''){
  app.innerHTML='<div class="login"><div class="login-card"><section class="login-art"><div class="brand"><div class="logo">I</div><div><b>INVICTO</b><span>Control de producción</span></div></div><div><h1>Cuentas claras con Carlos.</h1><p>Consignaciones, producción entregada y saldo actual en un solo lugar.</p></div><small>Cuenta corriente de proveedor · Carlos Pérez</small></section><section class="login-form"><h2>Ingresar</h2><p>Acceso independiente a Cuentas Carlos.</p><form onsubmit="doLogin(event)"><div class="field"><label>USUARIO</label><input id="lu" autocomplete="username" required placeholder="usuario"></div><div class="field" style="margin-top:12px"><label>CONTRASEÑA</label><input id="lp" type="password" autocomplete="current-password" required></div><button class="primary" style="width:100%;margin-top:16px">Entrar</button><div class="error">'+esc(msg)+'</div></form></section></div></div>';
}
async function doLogin(e){
  e.preventDefault();
  const u=$('#lu').value.trim().toLowerCase().replace(/\s+/g,''),p=$('#lp').value;
  const r=await sb.auth.signInWithPassword({email:u+'@invicto.local',password:p});
  if(r.error)return loginView('Usuario o contraseña incorrectos.');
  try{await loadProfile(r.data.user);await loadData();render()}catch(err){await sb.auth.signOut();loginView(err.message||'No tienes acceso.')}
}
async function loadProfile(user){
  const r=await sb.from('profiles').select('id,full_name,username,role,active').eq('id',user.id).single();
  if(r.error)throw r.error;if(!r.data.active)throw Error('Usuario inactivo.');
  if(!['admin','gerencia'].includes(r.data.role))throw Error('Tu usuario no tiene acceso a Cuentas Carlos.');
  state.profile=r.data;
}
async function loadData(){
  const [a,b,c]=await Promise.all([
    sb.from('carlos_movements').select('*').order('movement_date',{ascending:false}).order('created_at',{ascending:false}),
    sb.from('carlos_delivery_items').select('*'),
    sb.from('carlos_rates').select('*').order('product_type').order('design_type').order('material').order('size')
  ]);
  if(a.error)throw a.error;if(b.error)throw b.error;if(c.error)throw c.error;
  state.mov=a.data||[];state.items=b.data||[];state.rates=c.data||[];
}
async function logout(){await sb.auth.signOut();state.profile=null;loginView()}
async function refreshAll(){try{await loadData();render();toast('Actualizado')}catch(e){toast(e.message)}}

function render(){
  const t=totals();
  app.innerHTML='<main class="shell"><header class="top"><div class="brand"><div class="logo">I</div><div><b>INVICTO</b><span>Cuentas Carlos</span></div></div><div class="user"><small>'+esc(state.profile?.full_name||'')+'</small><button class="iconbtn" onclick="refreshAll()" title="Actualizar">↻</button><button class="iconbtn" onclick="logout()" title="Salir">⌁</button></div></header><h1 class="page-title">Cuentas Carlos</h1><section class="account"><div><div class="acct-top"><span class="dot"></span><span>Cuenta proveedor · Carlos Pérez</span></div><div class="balance-label">Saldo actual</div><div class="balance">'+money(Math.abs(t.balance))+'</div><div class="balance-note">'+esc(balanceText(t.balance))+'</div></div><div class="acct-brand"><div><strong>INVICTO</strong><small>PRODUCCIÓN</small></div><div class="chip"></div></div></section><section class="metrics"><div class="metric"><small>CONSIGNADO A CARLOS</small><b>'+money(t.paid)+'</b><span>Dinero entregado por Invicto</span></div><div class="metric"><small>MERCANCÍA RECIBIDA</small><b>'+money(t.delivered)+'</b><span>Producción valorizada</span></div><div class="metric"><small>UNIDADES RECIBIDAS</small><b>'+t.units.toLocaleString('es-CO')+'</b><span>Acumulado registrado</span></div></section><section class="actions"><button class="action" onclick="paymentModal()"><i>↗</i>Registrar consignación</button><button class="action" onclick="deliveryModal()"><i>↙</i>Registrar entrega</button><button class="action green" onclick="rateModal()"><i>+</i>Configurar tarifas</button></section><nav class="tabs"><button class="'+(state.tab==='resumen'?'on':'')+'" onclick="tab(\'resumen\')">Resumen</button><button class="'+(state.tab==='mov'?'on':'')+'" onclick="tab(\'mov\')">Movimientos</button><button class="'+(state.tab==='prod'?'on':'')+'" onclick="tab(\'prod\')">Producción</button><button class="'+(state.tab==='rates'?'on':'')+'" onclick="tab(\'rates\')">Tarifas</button></nav><section id="content">'+content()+'</section></main>';
}
function tab(x){state.tab=x;render()}
function content(){if(state.tab==='mov')return movementPanel();if(state.tab==='prod')return productionPanel();if(state.tab==='rates')return ratesPanel();return summaryPanel()}
function summaryPanel(){const a=state.mov.slice(0,8);return '<div class="panel"><div class="panel-head"><h2>Actividad reciente</h2><span>'+state.mov.length+' movimientos</span></div><div class="panel-body">'+(a.length?a.map(txRow).join(''):'<div class="empty">Todavía no hay movimientos registrados.</div>')+'</div></div>'}
function txRow(x){const p=x.movement_type==='payment';return '<div class="tx"><div class="tx-ico">'+(p?'↗':'↙')+'</div><div class="tx-main"><b>'+(p?'Consignación a Carlos':'Entrega de producción')+'</b><small>'+esc(x.movement_date)+' · '+esc(x.reference||'Sin referencia')+'</small></div><div class="tx-val '+(p?'pos':'neg')+'">'+(p?'+':'−')+' '+money(x.amount)+'</div><button class="mini danger" onclick="delMovement(\''+esc(x.id)+'\')">Eliminar</button></div>'}
function movementPanel(){return '<div class="panel"><div class="panel-head"><h2>Todos los movimientos</h2><span>'+state.mov.length+' registros</span></div><div class="panel-body">'+(state.mov.length?state.mov.map(txRow).join(''):'<div class="empty">No hay movimientos.</div>')+'</div></div>'}
function productionPanel(){
  if(!state.items.length)return '<div class="panel"><div class="empty">Aún no hay producción registrada.</div></div>';
  const a=[...state.items].sort((x,y)=>String(x.product_type).localeCompare(String(y.product_type))||SIZES.indexOf(x.size)-SIZES.indexOf(y.size));
  return '<div class="panel"><div class="panel-head"><h2>Producción recibida</h2><span>'+totals().units.toLocaleString('es-CO')+' unidades</span></div><div class="panel-body tablewrap"><table class="table"><thead><tr><th>PRODUCTO</th><th>DISEÑO</th><th>MATERIAL</th><th>TALLA</th><th>UNIDADES</th><th>COSTO/U</th><th>TOTAL</th></tr></thead><tbody>'+a.map(x=>'<tr><td><b>'+esc(x.product_type)+'</b></td><td>'+esc(x.design_type)+'</td><td>'+esc(x.material)+'</td><td><b>'+esc(x.size)+'</b></td><td>'+Number(x.quantity).toLocaleString('es-CO')+'</td><td>'+money(x.unit_cost)+'</td><td><b>'+money(x.line_total)+'</b></td></tr>').join('')+'</tbody></table></div></div>';
}
function ratesPanel(){return '<div class="panel"><div class="panel-head"><h2>Tarifas por unidad</h2><span>'+state.rates.length+' configuradas</span></div><div class="panel-body">'+(state.rates.length?state.rates.map(x=>'<div class="tx"><div class="tx-ico">₱</div><div class="tx-main"><b>'+esc(x.product_type)+' · '+esc(x.design_type)+' · '+esc(x.material)+'</b><small>Talla '+esc(x.size)+'</small></div><div class="tx-val">'+money(x.unit_cost)+'</div><button class="mini danger" onclick="delRate(\''+esc(x.id)+'\')">Eliminar</button></div>').join(''):'<div class="empty">No hay tarifas configuradas.</div>')+'</div></div>'}
async function delMovement(id){
  if(!confirm('¿Eliminar este movimiento? El saldo se recalculará.'))return;
  const row=state.mov.find(x=>x.id===id),r=await sb.from('carlos_movements').delete().eq('id',id);
  if(r.error)return toast(r.error.message);
  if(row?.document_path)await sb.storage.from('carlos-documentos').remove([row.document_path]);
  await loadData();render();
}
async function delRate(id){if(!confirm('¿Eliminar esta tarifa?'))return;const r=await sb.from('carlos_rates').delete().eq('id',id);if(r.error)return toast(r.error.message);await loadData();render()}

async function boot(){
  try{
    await initSupabase();
    const r=await sb.auth.getSession();
    if(!r.data?.session?.user)return loginView();
    await loadProfile(r.data.session.user);await loadData();render();
  }catch(e){loginView(e.message||'No fue posible iniciar el sistema.')}
}
boot();