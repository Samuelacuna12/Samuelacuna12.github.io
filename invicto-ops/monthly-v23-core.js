/* INVICTO OPS v23 · historial mensual de ventas y dashboard individual */
const OPS_UI_VERSION_V23='23.0';
let monthlySelectedV23='';
let monthlyRowsV23=[];
let monthlyPrevRowsV23=[];
let monthlyLoadingV23=false;
let monthlyPageV23=1;
const monthlyPageSizeV23=100;

function bogotaMonthV23(d=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit'}).formatToParts(d);
  const m=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return `${m.year}-${m.month}`;
}
function monthStartFromYmV23(ym){return `${ym}-01`}
function addMonthsV23(ms,delta){const [y,m]=ms.slice(0,7).split('-').map(Number),d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-01`}
function monthLabelV23(ms){const [y,m]=ms.split('-').map(Number);return new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1))).replace(/^./,x=>x.toUpperCase())}
function reportStatusLabelV23(st,reason=''){
  const m={nueva:'Nueva',asignada:'Nueva',en_gestion:'En gestión',no_contesta:'No contesta',seguimiento_programado:'Seguimiento futuro',pendiente_stock:'Pendiente stock',confirmada:'Confirmada',perdida:'Perdida',duplicada:'Duplicada',cancelada:'Cancelada'};
  if(st==='perdida'&&reason)return `Perdida · ${reason}`;
  return m[st]||st||'—';
}
function shipmentLabelV23(st){return ({pendiente:'Pendiente',lista_despacho:'Lista despacho',guia_generada:'Guía generada',en_transito:'En tránsito',reclama_oficina:'Reclama oficina',entregada:'Entregada',novedad:'Novedad',devuelta:'Devuelta',cancelada:'Cancelada'})[st]||st||'—'}
function reportStatusTagV23(r){const st=reportStatusLabelV23(r.status,r.loss_reason),cls=r.status==='confirmada'?'green':r.status==='perdida'||r.status==='cancelada'?'red':r.status==='duplicada'?'gray':r.status==='pendiente_stock'||r.status==='seguimiento_programado'?'amber':'blue';return `<span class="tag ${cls}">${esc(st)}</span>`}
function rowCodeV23(r){return r.source_order_name||r.source_draft_order_name||(r.daily_number?`V-${String(r.daily_number).padStart(3,'0')}`:String(r.id).slice(0,8))}
function isDraftV23(r){return r.source_entity_type==='draft_order'}
function validConversionV23(r){return r.valid_for_conversion!==false&&r.status!=='duplicada'}
function pctV23(a,b){return b?Math.round((a-b)/Math.abs(b)*100):a?100:0}
function deltaHtmlV23(a,b,suffix=''){const d=pctV23(a,b),cls=d>0?'up':d<0?'down':'flat',sign=d>0?'+':'';return `<span class="month-delta ${cls}">${sign}${d}%${suffix}</span>`}
function reportMetricsV23(rows){
  const valid=rows.filter(validConversionV23),confirmed=rows.filter(r=>r.status==='confirmada'),lost=rows.filter(r=>r.status==='perdida'),drafts=rows.filter(isDraftV23),pending=rows.filter(r=>r.mapping_status==='pending');
  const totalValue=rows.reduce((a,r)=>a+Number(r.total_price||0),0),confirmedValue=confirmed.reduce((a,r)=>a+Number(r.total_price||0),0),units=rows.reduce((a,r)=>a+Number(r.quantity||r.source_quantity||0),0);
  return {sales:rows.length,valid:valid.length,confirmed:confirmed.length,lost:lost.length,drafts:drafts.length,pending:pending.length,totalValue,confirmedValue,units,rate:valid.length?Math.round(confirmed.length/valid.length*100):0,aov:rows.length?Math.round(totalValue/rows.length):0};
}
async function fetchMonthV23(ms){
  const next=addMonthsV23(ms,1),out=[];let from=0;const step=900;
  while(true){
    const {data,error}=await invictoSupabaseV12.from('monthly_sales_detail').select('*').gte('commercial_date',ms).lt('commercial_date',next).order('received_at',{ascending:false}).range(from,from+step-1);
    if(error)throw error;out.push(...(data||[]));if(!data||data.length<step)break;from+=step;
  }
  return out;
}
async function loadMonthlyV23(force=false){
  if(monthlyLoadingV23)return;
  if(!monthlySelectedV23)monthlySelectedV23=monthStartFromYmV23(bogotaMonthV23());
  if(!force&&monthlyRowsV23.length&&monthlyRowsV23[0]?.commercial_date?.startsWith(monthlySelectedV23.slice(0,7)))return;
  monthlyLoadingV23=true;
  const host=el('view-monthly-sales');if(host)host.innerHTML='<div class="page-title"><div><h1>Ventas por mes</h1><p>Cargando historial individual desde Supabase…</p></div><span class="tag blue">CONSULTANDO</span></div>';
  try{
    [monthlyRowsV23,monthlyPrevRowsV23]=await Promise.all([fetchMonthV23(monthlySelectedV23),fetchMonthV23(addMonthsV23(monthlySelectedV23,-1))]);
    monthlyPageV23=1;renderMonthlySalesV23(true);
  }catch(e){console.error('monthly v23',e);if(host)host.innerHTML=`<div class="page-title"><div><h1>Ventas por mes</h1><p>No fue posible cargar el historial.</p></div></div><div class="panel"><div class="panel-body"><b>${esc(e.message||e)}</b><div style="margin-top:12px"><button class="btn navy" onclick="refreshMonthlyV23()">Reintentar</button></div></div></div>`;}
  finally{monthlyLoadingV23=false;}
}
function statusOptionsV23(){return [...new Set(monthlyRowsV23.map(r=>r.status).filter(Boolean))].sort()}
function advisorOptionsV23(){return [...new Set(monthlyRowsV23.map(r=>r.advisor_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'))}
function sourceOptionsV23(){return [...new Set(monthlyRowsV23.map(r=>r.source).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'))}
function filteredMonthlyRowsV23(){
  const q=(el('monthSearchV23')?.value||'').trim().toLowerCase(),st=el('monthStatusV23')?.value||'',adv=el('monthAdvisorV23')?.value||'',src=el('monthSourceV23')?.value||'',typ=el('monthTypeV23')?.value||'',map=el('monthMappingV23')?.value||'';
  return monthlyRowsV23.filter(r=>(!q||[rowCodeV23(r),r.customer_name,r.customer_phone,r.customer_email,r.customer_city,r.customer_department,r.advisor_name,r.tracking_number].join(' ').toLowerCase().includes(q))&&(!st||r.status===st)&&(!adv||r.advisor_name===adv)&&(!src||r.source===src)&&(!typ||r.source_entity_type===typ)&&(!map||r.mapping_status===map));
}
function miniBarsV23(rows){
  const [y,m]=monthlySelectedV23.split('-').map(Number),days=new Date(Date.UTC(y,m,0)).getUTCDate(),by={};
  for(let d=1;d<=days;d++)by[d]={all:0,confirmed:0};
  rows.forEach(r=>{const d=Number(String(r.commercial_date).slice(8,10));if(by[d]){by[d].all++;if(r.status==='confirmada')by[d].confirmed++}});
  const max=Math.max(1,...Object.values(by).map(x=>x.all));
  return `<div class="monthly-chart-v23">${Object.entries(by).map(([d,x])=>`<div class="month-bar-col" title="Día ${d}: ${x.all} ventas · ${x.confirmed} confirmadas"><div class="month-bar-stack"><i class="month-bar-all" style="height:${Math.max(2,Math.round(x.all/max*100))}%"></i><i class="month-bar-confirmed" style="height:${Math.round(x.confirmed/max*100)}%"></i></div><small>${d}</small></div>`).join('')}</div><div class="month-chart-legend"><span><i></i>Ventas</span><span><i class="confirmed"></i>Confirmadas</span></div>`;
}
function groupRowsV23(rows,key){return rows.reduce((a,r)=>{const k=r[key]||'Sin definir';a[k]=(a[k]||0)+1;return a},{})}
function statLinesV23(obj,total){return Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="statline"><span>${esc(k)}</span><b>${v} <small class="muted">${total?Math.round(v/total*100):0}%</small></b></div>`).join('')||'<div class="muted">Sin datos.</div>'}
function monthlyCardsV23(cur,prev){
  return `<div class="cards month-cards-v23">
    <div class="card"><small>Ventas ingresadas</small><b>${cur.sales.toLocaleString('es-CO')}</b><div class="sub">${deltaHtmlV23(cur.sales,prev.sales)} vs. ${monthLabelV23(addMonthsV23(monthlySelectedV23,-1))}</div></div>
    <div class="card"><small>Confirmadas</small><b>${cur.confirmed.toLocaleString('es-CO')}</b><div class="sub">${deltaHtmlV23(cur.confirmed,prev.confirmed)} · tasa ${cur.rate}%</div></div>
    <div class="card"><small>Valor creado</small><b>${money(cur.totalValue)}</b><div class="sub">${deltaHtmlV23(cur.totalValue,prev.totalValue)}</div></div>
    <div class="card"><small>Valor confirmado</small><b>${money(cur.confirmedValue)}</b><div class="sub">${deltaHtmlV23(cur.confirmedValue,prev.confirmedValue)}</div></div>
    <div class="card"><small>Unidades</small><b>${cur.units.toLocaleString('es-CO')}</b><div class="sub">ticket prom. ${money(cur.aov)}</div></div>
    <div class="card"><small>Borradores</small><b>${cur.drafts}</b><div class="sub">${cur.pending} con referencias pendientes</div></div>
  </div>`;
}
