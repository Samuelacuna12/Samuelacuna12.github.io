/* INVICTO OPS · Frontend operativo v3
   Modo actual: almacenamiento local del navegador.
   El backend/auth real se conecta posteriormente con Supabase. */

const STORAGE_KEY = 'invicto_ops_v3_state';
const SESSION_KEY = 'invicto_ops_v3_session';
const APP_VERSION = '3.0-catalog';

const USERS = [
  {username:'omar', password:'invicto', name:'Omar Gonzalez', role:'Gerente'},
  {username:'samuel', password:'invicto', name:'Samuel Acuña', role:'Administrador'},
  {username:'lidibeth', password:'invicto', name:'Lidibeth Donado Paez', role:'Administrador'},
  {username:'fernanda', password:'invicto', name:'Fernanda', role:'Vendedor'},
  {username:'keiner', password:'invicto', name:'Keiner', role:'Vendedor'},
  {username:'sebastian', password:'invicto', name:'Sebastian', role:'Vendedor'}
];
const ADVISORS = USERS.filter(u=>u.role==='Vendedor').map(u=>u.name);
const WAREHOUSES = ['Hoko Bogotá','Hoko Medellín','LogiGho Medellín','Bucaramanga'];
const TRANSPORTS = ['Go Envíos','Interrapidísimo','Envia','Coordinadora','Domientrega'];

const DEFAULT_STATE = {
  version: APP_VERSION,
  inventory: [],
  inventorySources: {
    'Hoko Bogotá': null,
    'Hoko Medellín': null,
    'LogiGho Medellín': null,
    'Bucaramanga': null
  },
  sales: [],
  guarantees: [],
  novelties: [],
  cuts: [],
  settings:{workStart:'08:00',workEnd:'18:00',cut1:'11:00',cut2:'17:00',yellowMinutes:5,redMinutes:10}
};

let state = loadState();
let session = loadSession();
let currentView = 'home';
let currentGroups = [];
let editingSaleId = null;

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){
  try{ const x=localStorage.getItem(STORAGE_KEY); return x?Object.assign(clone(DEFAULT_STATE),JSON.parse(x)):clone(DEFAULT_STATE); }
  catch(e){ return clone(DEFAULT_STATE); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function loadSession(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null} }
function saveSession(u){ session=u; localStorage.setItem(SESSION_KEY,JSON.stringify(u)); }
function clearSession(){ session=null; localStorage.removeItem(SESSION_KEY); }
function el(id){ return document.getElementById(id); }
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function money(v){return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v||0));}
function fmtDate(iso){const d=new Date(iso);return Number.isNaN(d)?'—':d.toLocaleString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
function isAdmin(){return session && (session.role==='Administrador'||session.role==='Gerente');}
function isManager(){return session && session.role==='Gerente';}
function isAdvisor(){return session && session.role==='Vendedor';}
function isToday(iso){const d=new Date(iso),n=new Date();return d.toDateString()===n.toDateString();}
function toast(msg){const t=el('toast'); if(!t)return; t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}

function render(){
  if(!session){ renderLogin(); return; }
  renderShell();
  switchView(currentView,true);
}

function renderLogin(){
  document.body.className='';
  el('app').innerHTML=`
  <section class="login-shell">
    <div class="login-card">
      <div class="login-art">
        <div class="brand"><span class="planet"></span><div>INVICTO OPS</div></div>
        <h1>Una sola operación. Todo bajo control.</h1>
        <p>Ventas, recuperación, inventario, logística, garantías, novedades, cortes y métricas en una sola interfaz operativa.</p>
      </div>
      <div class="login-form">
        <div class="eyebrow">CENTRO DE OPERACIONES</div>
        <h2>Iniciar sesión</h2>
        <p>Ingresa con tu usuario y contraseña.</p>
        <form onsubmit="login(event)">
          <div class="field"><label>Usuario</label><input id="loginUser" autocomplete="username" placeholder="usuario" required></div>
          <div class="field"><label>Contraseña</label><input id="loginPass" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
          <button class="btn navy block" type="submit">Entrar a INVICTO OPS</button>
        </form>
        <div id="loginError" class="login-note hidden"></div>
        <div class="login-note"><b>Versión de prueba.</b> Para validar el flujo antes de conectar Supabase: usuarios <b>omar, samuel, lidibeth, fernanda, keiner, sebastian</b>. Clave temporal: <b>invicto</b>. Esta autenticación es local y será reemplazada por acceso seguro real.</div>
      </div>
    </div>
  </section>`;
}

function login(ev){
  ev.preventDefault();
  const user=el('loginUser').value.trim().toLowerCase();
  const pass=el('loginPass').value;
  const found=USERS.find(u=>u.username===user&&u.password===pass);
  if(!found){const e=el('loginError');e.textContent='Usuario o contraseña incorrectos.';e.classList.remove('hidden');return;}
  saveSession({username:found.username,name:found.name,role:found.role});
  currentView='home';
  render();
}
function logout(){clearSession();render();}

function renderShell(){
  const counts=getPendingCounts();
  document.body.className=(isAdmin()?'admin-mode ':'')+(isManager()?'manager-mode ':'')+(isAdvisor()?'advisor-mode ':'');
  el('app').innerHTML=`
  <div class="app">
    <aside id="sidebar" class="sidebar">
      <div class="brand"><span class="planet"></span><div>INVICTO OPS<small>OPERACIONES UNIVERSO INVICTO</small></div></div>
      <nav class="nav">
        ${navButton('home','Inicio')}
        ${navButton('sales','Ventas del día',counts.sales)}
        ${navButton('recovery','Recuperación',counts.recovery)}
        ${navButton('inventory','Inventario',counts.stock)}
        ${navButton('cuts','Cortes / Guías')}
        ${navButton('guarantees','Garantías',counts.guarantees)}
        ${navButton('novelties','Novedades',counts.novelties)}
        ${navButton('reports','Dashboard / Reportes')}
        ${navButton('team','Equipo / KPIs')}
        ${isAdmin()?navButton('config','Configuración'):''}
      </nav>
      <div class="sidebar-foot">Lun–Sáb · 08:00–18:00<br>Domingos sin alertas.<br><br>Versión ${APP_VERSION}</div>
    </aside>
    <main class="main">
      <header class="topbar">
        <button class="btn light sm" onclick="toggleSidebar()">☰</button>
        <div class="topbar-title" id="topTitle">INVICTO OPS</div>
        <span class="chip mode-chip">MODO PRUEBA LOCAL</span>
        <div class="spacer"></div>
        <button class="ai-button" onclick="toggleAI()">✦ INVICTO I.A.</button>
        <div class="user-block"><b>${esc(session.name)}</b><small>${esc(session.role)}</small></div>
        <button class="btn light sm" onclick="logout()">Salir</button>
      </header>
      <section class="content">
        <section id="view-home" class="view"></section>
        <section id="view-sales" class="view"></section>
        <section id="view-recovery" class="view"></section>
        <section id="view-inventory" class="view"></section>
        <section id="view-cuts" class="view"></section>
        <section id="view-guarantees" class="view"></section>
        <section id="view-novelties" class="view"></section>
        <section id="view-reports" class="view"></section>
        <section id="view-team" class="view"></section>
        <section id="view-config" class="view"></section>
      </section>
    </main>
  </div>
  <div id="drawerBack" class="drawer-back" onclick="closeOrder()"></div>
  <aside id="orderDrawer" class="drawer"></aside>
  <aside id="aiPanel" class="ai-panel"></aside>
  <div id="toast" class="toast"></div>`;
  renderAI();
}
function navButton(id,label,badge){return `<button data-view="${id}" class="${currentView===id?'active':''}" onclick="switchView('${id}')">${label}${badge?`<span class="badge">${badge}</span>`:''}</button>`;}
function toggleSidebar(){el('sidebar').classList.toggle('open');}

function switchView(view,initial=false){
  currentView=view;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const target=el('view-'+view);if(target)target.classList.add('active');
  const titles={home:'Inicio',sales:'Ventas del día',recovery:'Recuperación',inventory:'Inventario',cuts:'Cortes / Guías',guarantees:'Garantías',novelties:'Novedades',reports:'Dashboard / Reportes',team:'Equipo / KPIs',config:'Configuración'};
  el('topTitle').textContent=titles[view]||'INVICTO OPS';
  const f={home:renderHome,sales:renderSales,recovery:renderRecovery,inventory:renderInventory,cuts:renderCuts,guarantees:renderGuarantees,novelties:renderNovelties,reports:renderReports,team:renderTeam,config:renderConfig}[view];
  if(f)f();
  if(!initial && innerWidth<800)el('sidebar').classList.remove('open');
}

function getPendingCounts(){
  const mine=s=>!isAdvisor()||s.advisor===session.name;
  return {
    sales:state.sales.filter(s=>isToday(s.createdAt)&&mine(s)&&['Nueva','No contesta','Seguimiento futuro','Pendiente stock'].includes(s.status)).length,
    recovery:state.sales.filter(s=>mine(s)&&['No contesta','Seguimiento futuro','Pendiente stock','No recuperado – sin contacto'].includes(s.status)).length,
    guarantees:state.guarantees.filter(g=>mine(g)&&!['Cerrada'].includes(g.status)).length,
    novelties:state.novelties.filter(n=>mine(n)&&!['Cerrada'].includes(n.status)).length,
    stock:Object.values(state.inventorySources).filter(x=>!x).length
  };
}
function todaySales(){return state.sales.filter(s=>isToday(s.createdAt));}
function advisorSales(){return isAdvisor()?state.sales.filter(s=>s.advisor===session.name):state.sales;}
function teamConfirmRate(){const arr=todaySales().filter(s=>s.status!=='Duplicado'&&s.status!=='Perdido – datos inválidos');if(!arr.length)return 0;return Math.round(arr.filter(s=>s.status==='Confirmada').length/arr.length*100);}

function renderHome(){
  const pending=getPendingCounts(), ts=todaySales(), confirmed=ts.filter(s=>s.status==='Confirmada').length;
  const my=advisorSales().filter(s=>isToday(s.createdAt));
  const myPending=my.filter(s=>['Nueva','No contesta','Seguimiento futuro','Pendiente stock'].includes(s.status));
  el('view-home').innerHTML=`
    <div class="hero"><div><div class="eyebrow">${new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</div><h1>${greeting()}, ${esc(session.name.split(' ')[0])}.</h1><p>${isAdvisor()?`Tienes ${myPending.length} pendientes operativos asignados.`:'Aquí tienes la fotografía operativa del equipo en tiempo real.'}</p></div><div class="hero-kpi"><span class="eyebrow">TASA EQUIPO HOY</span><strong>${teamConfirmRate()}%</strong><small>${confirmed} confirmadas / ${ts.length} creadas</small></div></div>
    <div class="cards">
      ${kpi('Ventas creadas',ts.length,'00:00–23:59')}
      ${kpi('Confirmadas',confirmed,'ventas del día')}
      ${kpi('Mis pendientes',myPending.length,isAdvisor()?'asignados a ti':'operación')}
      ${kpi('Garantías',pending.guarantees,'abiertas')}
      ${kpi('Novedades',pending.novelties,'por gestionar')}
      ${kpi('Bodegas cargadas',4-pending.stock,'de 4 fuentes')}
    </div>
    <div class="grid-2">
      <div class="panel"><div class="panel-head"><h2>${isAdvisor()?'Mis pendientes iniciales':'Pendientes prioritarios'}</h2><div class="spacer"></div><button class="btn navy sm" onclick="switchView('sales')">Ir a ventas</button></div><div class="panel-body"><div class="pending-list">${renderPendingList(myPending)}</div></div></div>
      <div class="panel"><div class="panel-head"><h3>Alertas operativas</h3><div class="spacer"></div><button class="btn light sm" onclick="toggleAI()">Abrir I.A.</button></div><div class="panel-body"><div class="alert-list">${buildAlerts().slice(0,5).map(alertHtml).join('')||'<div class="muted">Sin alertas críticas.</div>'}</div></div></div>
    </div>
    <div class="grid-equal" style="margin-top:14px">
      <div class="panel"><div class="panel-head"><h3>Estado de inventario</h3></div><div class="panel-body">${inventorySourceStatus()}</div></div>
      <div class="panel"><div class="panel-head"><h3>Flujo de hoy</h3></div><div class="panel-body"><div class="statline"><span>Corte fijo 1</span><b>11:00</b></div><div class="statline"><span>Corte fijo 2</span><b>17:00</b></div><div class="statline"><span>Cierre de jornada</span><b>18:00</b></div><div class="statline"><span>Ventas fuera de horario</span><b>Se asignan · reloj pausado</b></div></div></div>
    </div>`;
}
function greeting(){const h=new Date().getHours();return h<12?'Buenos días':h<18?'Buenas tardes':'Buenas noches';}
function kpi(label,value,sub){return `<div class="card"><small>${label}</small><b>${value}</b><div class="sub">${sub}</div></div>`;}
function renderPendingList(arr){
  const extra=[];
  state.guarantees.filter(g=>(!isAdvisor()||g.advisor===session.name)&&g.status!=='Cerrada').forEach(g=>extra.push({type:'Garantía',title:`${g.id} · ${g.client}`,meta:`${g.reason} · ${g.status}`,view:'guarantees'}));
  state.novelties.filter(n=>(!isAdvisor()||n.advisor===session.name)&&n.status!=='Cerrada').forEach(n=>extra.push({type:'Novedad',title:`${n.id} · ${n.client}`,meta:`${n.type} · ${n.status}`,view:'novelties'}));
  const sales=arr.map(s=>({type:'Venta',title:`${s.id} · ${s.name}`,meta:`${s.status} · ${s.city}`,view:'sales',sale:s}));
  return [...sales,...extra].slice(0,10).map(x=>`<div class="pending"><strong>${x.type} · ${esc(x.title)}</strong><div class="meta">${esc(x.meta)}</div><div class="alert-row"><span></span><span class="spacer"></span><button class="btn light sm" onclick="${x.sale?`openOrder('${x.sale.id}')`:`switchView('${x.view}')`}">Gestionar</button></div></div>`).join('')||'<div class="muted">No tienes pendientes en este momento.</div>';
}
