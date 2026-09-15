/* INVICTO OPS v31.1 · corrige render recursivo de Rendimiento */
function paintPerformanceV311(){
  perfStylesV31();
  const host=el('view-performance');
  if(!host)return;
  if(!perfDataV31){
    host.innerHTML='<div class="page-title"><div><h1>Rendimiento</h1><p>Sin datos cargados todavía.</p></div></div>';
    return;
  }
  const d=perfDataV31,s=d.summary||{},ad=d.advisors||[],sales=perfFilteredSalesV31(),pre=String(d.date||'')<'2026-09-15';
  host.innerHTML=`<div class="perf-hero-v31"><div><div class="eyebrow">MEDICIÓN OPERATIVA UNIFICADA · DESDE 15 SEP 2026</div><h1>Rendimiento</h1><p>${d.can_view_all?'Vista total del equipo, usuario por usuario y venta por venta.':'Tu rendimiento, tus tareas y toda tu gestión en una sola pantalla.'}</p></div><div class="perf-actions-v31"><input type="date" class="search" value="${esc(d.date||perfDateV31)}" onchange="changePerformanceDateV31(this.value)"><button class="btn light sm" onclick="refreshPerformanceV31()">↻ Actualizar</button></div></div>${pre?'<div class="perf-zero-v31"><b>Sistema anterior.</b> La medición nueva comienza el 15 de septiembre a las 00:00; esta fecha permanece en 0.</div>':'<div class="perf-zero-v31"><b>Una sola fuente de rendimiento.</b> Día a día, KPIs y reportes de asesores están unificados aquí.</div>'}<div class="perf-cards-v31">${perfCardV31('Asignadas hoy',s.assigned||0,'ventas nuevas')}${perfCardV31('Carga total',s.workload||0,`${s.carryover||0} arrastre`)}${perfCardV31('Gestionadas',s.managed||0,`${s.untouched||0} sin tocar`)}${perfCardV31('Intentos',s.attempts||0,'acciones registradas')}${perfCardV31('Pendientes',s.pending||0,`${s.overdue||0} vencidas`)}${perfCardV31('Confirmadas',s.confirmed||0,`${s.confirmed_units||0} unidades`)}${perfCardV31('Perdidas',s.lost||0,'ventas válidas')}${perfCardV31('Canceladas',s.cancelled||0,'cerradas')}${perfCardV31('Duplicadas',s.duplicates||0,'no contabilizan')}${perfCardV31('Ventas manuales',s.manual_sales||0,'acreditadas al creador')}${perfCardV31('Alertas amarillas',s.yellow||0,'desde el nuevo sistema')}${perfCardV31('Alertas rojas',s.red||0,'desde el nuevo sistema')}</div>${perfAdvisorTableV31(ad)}${perfSalesTableV31(sales)}${perfActivityV31(d.activity||[])}`;
}

async function loadPerformanceV311(force=false){
  if(perfBusyV31)return;
  if(!perfDateV31)perfDateV31=perfTodayV31();
  if(!force&&perfDataV31?.date===perfDateV31){paintPerformanceV311();return;}
  perfBusyV31=true;
  const host=el('view-performance');
  if(host)host.innerHTML='<div class="page-title"><div><h1>Rendimiento</h1><p>Cargando medición detallada…</p></div></div>';
  try{
    const p=await invictoSupabaseV12.rpc('get_unified_advisor_performance_v31',{p_date:perfDateV31});
    if(p.error)throw p.error;
    perfDataV31=p.data||{date:perfDateV31,summary:{},advisors:[],sales:[],activity:[],can_view_all:isAdmin()};
    perfFollowV31={sales:[]};
    paintPerformanceV311();

    /* La bitácora completa carga en segundo plano; nunca bloquea el tablero. */
    invictoSupabaseV12.rpc('get_ops_followup_board',{p_date:perfDateV31}).then(f=>{
      if(!f.error)perfFollowV31=f.data||{sales:[]};
    }).catch(()=>{});
  }catch(e){
    console.error('performance v31.1',e);
    if(host)host.innerHTML=`<div class="page-title"><div><h1>Rendimiento</h1><p>No se pudo cargar la medición.</p></div></div><div class="blocking">${esc(e?.message||e)}</div><button class="btn navy" onclick="refreshPerformanceV31()">Reintentar</button>`;
  }finally{
    perfBusyV31=false;
  }
}

window.renderPerformanceV31=function(){if(!perfDateV31)perfDateV31=perfTodayV31();loadPerformanceV311(false)};
window.refreshPerformanceV31=function(){perfDataV31=null;perfFollowV31=null;loadPerformanceV311(true)};
window.changePerformanceDateV31=function(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return;perfDateV31=v;perfDataV31=null;perfFollowV31=null;loadPerformanceV311(true)};

console.info('INVICTO OPS v31.1 · Rendimiento render corregido');
