/* INVICTO OPS v24 · búsqueda de clientes con histórico Shopify */
const OPS_UI_VERSION_V24='24.0';
let customerHistoryResultsV24=[];
let customerHistoryQueryV24='';

function canSearchCustomersV24(){return isAdmin()||isAdvisor()}
function historyMoneyV24(v){return money(Number(v||0))}
function historyStatusV24(r){return r.source_cancelled_at?'<span class="tag red">RESUELTA · CANCELADA SHOPIFY</span>':'<span class="tag green">RESUELTA · HISTÓRICO</span>'}
function historyCustomerKeyV24(r){return String(r.customer_phone||r.customer_email||r.customer_name||'Sin identificar').trim().toLowerCase()}

window.searchCustomerHistoryV24=async function(){
  const input=el('customerHistorySearchV24'),host=el('customerHistoryResultsV24');
  const q=(input?.value||'').trim();customerHistoryQueryV24=q;
  if(!host)return;
  if(q.length<3){host.innerHTML='<div class="panel"><div class="panel-body muted">Escribe al menos 3 caracteres del nombre, teléfono, correo o número de pedido.</div></div>';return}
  host.innerHTML='<div class="panel"><div class="panel-body"><b>Buscando historial…</b></div></div>';
  try{
    const {data,error}=await invictoSupabaseV12.rpc('search_shopify_customer_history',{p_query:q,p_limit:300});
    if(error)throw error;customerHistoryResultsV24=data||[];renderCustomerHistoryResultsV24();
  }catch(e){console.error('customer history v24',e);host.innerHTML=`<div class="panel"><div class="panel-body"><b>No fue posible buscar el historial.</b><div class="muted">${esc(e?.message||e)}</div></div></div>`}
};

function renderCustomerHistoryResultsV24(){
  const host=el('customerHistoryResultsV24');if(!host)return;
  const rows=customerHistoryResultsV24;
  if(!rows.length){host.innerHTML=`<div class="panel"><div class="panel-body"><b>Sin coincidencias.</b><div class="muted">No hay compras históricas Shopify que coincidan con “${esc(customerHistoryQueryV24)}”.</div></div></div>`;return}
  const total=rows.reduce((a,r)=>a+Number(r.total_price||0),0),units=rows.reduce((a,r)=>a+Number(r.quantity||0),0),customers=new Set(rows.map(historyCustomerKeyV24)).size,last=rows[0]?.commercial_date||'—';
  host.innerHTML=`<div class="cards" style="margin-bottom:14px">
    <div class="card"><small>Compras encontradas</small><b>${rows.length.toLocaleString('es-CO')}</b><div class="sub">máximo 300 resultados</div></div>
    <div class="card"><small>Clientes coincidentes</small><b>${customers.toLocaleString('es-CO')}</b><div class="sub">por teléfono / correo / nombre</div></div>
    <div class="card"><small>Valor histórico</small><b>${historyMoneyV24(total)}</b><div class="sub">${units.toLocaleString('es-CO')} unidades</div></div>
    <div class="card"><small>Compra más reciente</small><b style="font-size:22px">${esc(last)}</b><div class="sub">histórico Shopify</div></div>
  </div>
  <div class="panel"><div class="panel-head"><h3>Compras anteriores</h3><div class="spacer"></div><span class="tag blue">${rows.length} RESULTADOS</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Contacto</th><th>Ciudad</th><th>Estado</th><th>Uds.</th><th>Valor</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.source_order_name||'—')}</b></td><td>${esc(r.commercial_date||'—')}</td><td><b>${esc(r.customer_name||'Sin nombre')}</b></td><td><div>${esc(r.customer_phone||'—')}</div><div class="muted">${esc(r.customer_email||'')}</div></td><td>${esc(r.customer_city||'—')}<div class="muted">${esc(r.customer_department||'')}</div></td><td>${historyStatusV24(r)}<div class="muted">${esc(r.financial_status||'')} · ${esc(r.fulfillment_status||'')}</div></td><td>${Number(r.quantity||0)}</td><td><b>${historyMoneyV24(r.total_price)}</b></td><td><button class="btn light sm" onclick="openHistoryOrderV24('${r.id}')">Ver compra</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

window.openHistoryOrderV24=async function(id){
  try{
    const {data,error}=await invictoSupabaseV12.from('monthly_sales_detail').select('*').eq('id',id).eq('record_origin','historical_shopify').maybeSingle();if(error)throw error;if(!data)return toast('No encontré la compra histórica');
    if(!monthlyRowsV23.some(x=>String(x.id)===String(id)))monthlyRowsV23.push(data);
    openMonthlySaleV23(id);
  }catch(e){console.error(e);toast('No fue posible abrir la compra')}
};

window.renderCustomerHistoryV24=function(){
  const host=el('view-customer-history');if(!host)return;
  host.innerHTML=`<div class="page-title"><div><div class="eyebrow">CLIENTES · HISTÓRICO SHOPIFY</div><h1>Buscar cliente</h1><p>Consulta compras anteriores sin reabrirlas ni afectar la operación actual.</p></div><span class="tag green">SOLO CONSULTA</span></div>
  <div class="panel" style="margin-bottom:14px"><div class="panel-body"><div class="toolbar"><input id="customerHistorySearchV24" class="search" style="min-width:320px;flex:1" placeholder="Nombre, teléfono, correo o pedido (#12345)…" value="${esc(customerHistoryQueryV24)}" onkeydown="if(event.key==='Enter')searchCustomerHistoryV24()"><button class="btn navy" onclick="searchCustomerHistoryV24()">Buscar historial</button></div><div class="muted" style="margin-top:10px">Las ventas anteriores aparecen como <b>Resueltas · Histórico Shopify</b>. No generan SLA, asignación, reservas, cortes ni movimientos de inventario.</div></div></div>
  <div id="customerHistoryResultsV24"></div>`;
  if(customerHistoryQueryV24)searchCustomerHistoryV24();else el('customerHistoryResultsV24').innerHTML='<div class="panel"><div class="panel-body muted">Busca un cliente para ver todas sus compras anteriores de Shopify.</div></div>';
};

const renderShellBaseV24=window.renderShell;
window.renderShell=function(){
  renderShellBaseV24();
  if(!canSearchCustomersV24())return;
  const content=document.querySelector('.content');if(content&&!el('view-customer-history')){const s=document.createElement('section');s.id='view-customer-history';s.className='view';const sales=el('view-sales');content.insertBefore(s,sales?.nextSibling||null)}
  const nav=document.querySelector('.nav');if(nav&&!nav.querySelector('[data-view="customer-history"]')){const b=document.createElement('button');b.dataset.view='customer-history';b.textContent='Buscar cliente';b.onclick=()=>switchView('customer-history');const ref=nav.querySelector('[data-view="recovery"]');nav.insertBefore(b,ref||null)}
  const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión '+OPS_UI_VERSION_V24);
};
const switchViewBaseV24=window.switchView;
window.switchView=function(view,initial=false){
  if(view!=='customer-history')return switchViewBaseV24(view,initial);
  if(!canSearchCustomersV24()){toast('Sin acceso al historial de clientes');return switchViewBaseV24('home',initial)}
  currentView=view;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));el('view-customer-history')?.classList.add('active');if(el('topTitle'))el('topTitle').textContent='Buscar cliente';renderCustomerHistoryV24();if(!initial&&innerWidth<800)el('sidebar')?.classList.remove('open');
};
