/* INVICTO OPS v51.2 · restaura Inicio completo + fuente canónica */
(function(){
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const N=v=>Number(v||0);
  const M=v=>typeof money==='function'?money(N(v)):N(v).toLocaleString('es-CO');
  const C=()=>window.opsCanonicalV51||{};
  const D=()=>C().data||{};
  const rows=()=>Array.isArray(D().advisors)?D().advisors:[];
  const tasks=()=>Array.isArray(D().tasks)?D().tasks:[];
  const adm=()=>typeof isAdmin==='function'&&isAdmin();
  const adv=()=>typeof isAdvisor==='function'&&isAdvisor();

  function installStyles(){if(document.getElementById('homeRestoreV512Styles'))return;const s=document.createElement('style');s.id='homeRestoreV512Styles';s.textContent=`
    .home512-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:14px}.home512-hero h1{margin:4px 0 6px;font-size:clamp(30px,4vw,48px)}.home512-hero p{margin:0;color:#667085}.home512-rate{min-width:220px;background:#071229;color:white;border-radius:20px;padding:18px 20px}.home512-rate small{display:block;color:#b9c4d8;font-weight:800;letter-spacing:.07em}.home512-rate b{display:block;font-size:38px;margin:3px 0}.home512-rate span{font-size:12px;color:#d5dceb}
    .home512-section{margin-top:14px}.home512-title{display:flex;align-items:center;gap:10px;margin-bottom:10px}.home512-title h2,.home512-title h3{margin:0}.home512-title .spacer{flex:1}
    .home512-daily{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.home512-daily .card{min-width:0}.home512-work{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.home512-work button{appearance:none;background:#fff;border:1px solid #dfe3ea;border-radius:16px;padding:14px;text-align:left;cursor:pointer}.home512-work button:hover{border-color:#071229}.home512-work small{display:block;color:#667085;font-size:10px;font-weight:900;letter-spacing:.05em}.home512-work b{display:block;font-size:29px;margin-top:4px;color:#101828}.home512-work .total{background:#071229;border-color:#071229}.home512-work .total small{color:#cbd5e1}.home512-work .total b{color:#fff}
    .home512-performance{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.home512-mini{border:1px solid #e4e7ec;background:#f8fafc;border-radius:13px;padding:12px}.home512-mini small{display:block;color:#667085;font-size:10px;font-weight:800}.home512-mini b{display:block;font-size:22px;margin-top:3px}.home512-task{display:grid;grid-template-columns:minmax(120px,1.1fr) minmax(150px,1.5fr) minmax(110px,.9fr) minmax(120px,1fr) auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #edf0f4}.home512-task:last-child{border-bottom:0}.home512-kind{font-size:10px;font-weight:900;color:#475467}.home512-urgent{color:#b42318;font-weight:900}.home512-team table td,.home512-team table th{white-space:nowrap}
    @media(max-width:1200px){.home512-daily{grid-template-columns:repeat(3,1fr)}.home512-work{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:760px){.home512-hero{align-items:flex-start;flex-direction:column}.home512-rate{width:100%;min-width:0}.home512-daily,.home512-work,.home512-performance{grid-template-columns:repeat(2,1fr)}.home512-work .total{grid-column:1/-1}.home512-task{grid-template-columns:1fr}.home512-task .btn{width:100%}}
  `;document.head.appendChild(s)}

  function summary(){
    if(adv())return rows()[0]||{};
    const t=D().totals||{};
    return {...t,full_name:'Equipo'};
  }
  function fullTotals(){
    const t={...(D().totals||{})};
    const rr=rows();
    const sum=k=>rr.reduce((a,x)=>a+N(x[k]),0);
    ['pedidos_recibidos_hoy','borradores_recibidos_hoy','valor_confirmado_hoy','perdidas_hoy','canceladas_hoy','duplicadas_hoy'].forEach(k=>{if(t[k]==null)t[k]=sum(k)});
    if(t.tasa_confirmacion_hoy==null)t.tasa_confirmacion_hoy=N(t.asignadas_hoy)?Math.round(N(t.confirmadas_hoy)/N(t.asignadas_hoy)*1000)/10:0;
    return t;
  }
  function myTotals(){
    const s=summary();if(!adv())return fullTotals();
    return {...s,tasa_confirmacion_hoy:N(s.tasa_confirmacion_hoy)};
  }
  function goal(){try{return typeof goalPanelV18==='function'?goalPanelV18():''}catch(e){console.warn('goal home v51.2',e);return ''}}
  function taskCounts(s){return `<div class="home512-work">
    <button onclick="switchView('sales');setCanonicalFilterV51('venta')"><small>VENTAS NUEVAS</small><b>${N(s.ventas_nuevas)}</b></button>
    <button onclick="switchView('sales');setCanonicalFilterV51('recuperacion')"><small>RECUPERACIONES</small><b>${N(s.recuperaciones)}</b></button>
    <button onclick="switchView('sales');setCanonicalFilterV51('borrador')"><small>BORRADORES</small><b>${N(s.borradores)}</b></button>
    <button onclick="switchView('sales');setCanonicalFilterV51('garantia')"><small>GARANTÍAS</small><b>${N(s.garantias)}</b></button>
    <button class="total" onclick="switchView('sales');setCanonicalFilterV51('all')"><small>TOTAL POR GESTIONAR</small><b>${N(s.total_tareas)}</b></button>
  </div>`}
  function dailyCards(t){return `<div class="home512-daily">
    ${kpi('Ventas recibidas hoy',N(t.asignadas_hoy),'pedidos + borradores')}
    ${kpi('Pedidos recibidos',N(t.pedidos_recibidos_hoy),'sin borradores')}
    ${kpi('Borradores recibidos',N(t.borradores_recibidos_hoy),'hoy')}
    ${kpi('Confirmadas hoy',N(t.confirmadas_hoy),'equipo')}
    ${kpi('Tasa confirmación',N(t.tasa_confirmacion_hoy).toFixed(1)+'%','ventas asignadas hoy')}
    ${kpi('Facturación confirmada',M(t.valor_confirmado_hoy),'hoy')}
  </div>`}
  function performance(s){
    if(adm())return `<div class="panel home512-section home512-team"><div class="panel-head"><div><h3>Rendimiento del equipo hoy</h3><div class="muted">Misma fuente usada por Ventas del día y la I.A.</div></div><div class="spacer"></div><button class="btn light sm" onclick="switchView('performance')">Ver rendimiento completo</button></div><div class="table-wrap"><table><thead><tr><th>ASESOR</th><th>ACTIVO</th><th>VENTAS RECIBIDAS</th><th>CONFIRMADAS</th><th>TASA</th><th>TAREAS PENDIENTES</th><th>VENTAS NUEVAS</th><th>RECUPERACIONES</th><th>BORRADORES</th><th>GARANTÍAS</th></tr></thead><tbody>${rows().map(r=>`<tr><td><b>${E(r.full_name)}</b></td><td>${r.receiving?'<span style="color:#067647;font-weight:800">RECIBE</span>':'<span style="color:#b42318;font-weight:800">PAUSADO</span>'}</td><td>${N(r.asignadas_hoy)}</td><td><b>${N(r.confirmadas_hoy)}</b></td><td>${N(r.tasa_confirmacion_hoy).toFixed(1)}%</td><td><b>${N(r.total_tareas)}</b></td><td>${N(r.ventas_nuevas)}</td><td>${N(r.recuperaciones)}</td><td>${N(r.borradores)}</td><td>${N(r.garantias)}</td></tr>`).join('')}</tbody></table></div></div>`;
    return `<div class="panel home512-section"><div class="panel-head"><div><h3>Mi rendimiento hoy</h3><div class="muted">Tus resultados y tu carga real.</div></div><div class="spacer"></div><button class="btn light sm" onclick="switchView('performance')">Ver detalle</button></div><div class="panel-body"><div class="home512-performance"><div class="home512-mini"><small>VENTAS RECIBIDAS</small><b>${N(s.asignadas_hoy)}</b></div><div class="home512-mini"><small>CONFIRMADAS</small><b>${N(s.confirmadas_hoy)}</b></div><div class="home512-mini"><small>TASA</small><b>${N(s.tasa_confirmacion_hoy).toFixed(1)}%</b></div><div class="home512-mini"><small>TAREAS PENDIENTES</small><b>${N(s.total_tareas)}</b></div></div></div></div>`
  }
  function pendingTasks(){
    let list=tasks();
    if(adm())list=[...list].sort((a,b)=>Number(b.urgent)-Number(a.urgent)||(new Date(a.due_at||'2999-01-01')-new Date(b.due_at||'2999-01-01'))).slice(0,8);else list=list.slice(0,8);
    return `<div class="panel home512-section"><div class="panel-head"><div><h3>${adv()?'Mis tareas prioritarias':'Tareas prioritarias del equipo'}</h3><div class="muted">Ventas, recuperaciones, borradores y garantías desde la misma cola oficial.</div></div><div class="spacer"></div><button class="btn navy sm" onclick="switchView('sales')">Ver todas</button></div><div class="panel-body">${list.map(r=>`<div class="home512-task"><div><b>${E(r.reference||'Tarea')}</b><div class="home512-kind">${E(({venta:'VENTA NUEVA',recuperacion:'RECUPERACIÓN',borrador:'BORRADOR',garantia:'GARANTÍA'})[r.category]||r.category)}</div></div><div><b>${E(r.customer||'Sin nombre')}</b><div class="muted">${E(r.phone||'')}</div></div><div>${E(r.advisor_name||'Sin asignar')}<div class="muted">${E(r.channel||'')}</div></div><div class="${r.urgent?'home512-urgent':''}">${r.urgent?'URGENTE':E(String(r.status||'').replaceAll('_',' '))}</div><button class="btn light sm" onclick="openCanonicalTaskV51('${E(r.task_id)}')">Gestionar</button></div>`).join('')||'<div class="muted">No hay tareas pendientes.</div>'}</div></div>`
  }
  function oldOperationalPanels(){
    let alerts='';try{alerts=(typeof buildAlerts==='function'?buildAlerts():[]).slice(0,5).map(alertHtml).join('')}catch(e){}
    let inv='';try{inv=typeof inventorySourceStatus==='function'?inventorySourceStatus():''}catch(e){}
    return `<div class="grid-2 home512-section"><div class="panel"><div class="panel-head"><h3>Alertas operativas</h3><div class="spacer"></div><button class="btn light sm" onclick="toggleAI()">Abrir I.A.</button></div><div class="panel-body"><div class="alert-list">${alerts||'<div class="muted">Sin alertas críticas.</div>'}</div></div></div><div class="panel"><div class="panel-head"><h3>Estado de inventario</h3><div class="spacer"></div><button class="btn light sm" onclick="switchView('inventory')">Ver inventario</button></div><div class="panel-body">${inv||'<div class="muted">Inventario sincronizado desde Supabase.</div>'}</div></div></div>`
  }

  window.renderHomeV51=function(){
    installStyles();const host=document.getElementById('view-home');if(!host)return;
    if(!C().loaded&&!C().loading){host.innerHTML='<div class="panel"><div class="panel-body">Sincronizando panel completo…</div></div>';window.loadCanonicalV51?.(false).then(()=>window.renderHomeV51());return}
    const s=summary(),t=myTotals(),first=(session?.name||'Usuario').split(' ')[0];
    const rate=N(t.tasa_confirmacion_hoy),confirmed=N(t.confirmadas_hoy),received=N(t.asignadas_hoy);
    host.innerHTML=`
      <div class="home512-hero"><div><div class="eyebrow">${new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</div><h1>${typeof greeting==='function'?greeting():'Hola'}, ${E(first)}.</h1><p>${adv()?`Tienes <b>${N(s.total_tareas)}</b> tareas por gestionar. Todo lo que ves aquí corresponde a tu usuario.`:'Aquí tienes la fotografía completa de la operación, las metas y el rendimiento del equipo.'}</p></div><div class="home512-rate"><small>${adv()?'MI TASA HOY':'TASA EQUIPO HOY'}</small><b>${rate.toFixed(1)}%</b><span>${confirmed} confirmadas / ${received} recibidas</span></div></div>
      ${goal()}
      <div class="home512-section"><div class="home512-title"><h2>Ventas de hoy</h2><div class="spacer"></div><button class="btn light sm" onclick="refreshCanonicalV51()">↻ Actualizar cifras</button></div>${dailyCards(t)}</div>
      <div class="home512-section"><div class="home512-title"><div><h2>${adv()?'Mis tareas por gestionar':'Tareas por gestionar'}</h2><div class="muted">Una sola asignación oficial en todas las pestañas y en la I.A.</div></div><div class="spacer"></div><button class="btn navy sm" onclick="switchView('sales')">Abrir Ventas del día</button></div>${taskCounts(s)}</div>
      ${performance(s)}
      ${pendingTasks()}
      ${oldOperationalPanels()}
      <div class="grid-equal home512-section"><div class="panel"><div class="panel-head"><h3>Flujo de hoy</h3></div><div class="panel-body"><div class="statline"><span>Corte fijo 1</span><b>11:00</b></div><div class="statline"><span>Corte fijo 2</span><b>17:00</b></div><div class="statline"><span>Cierre de jornada</span><b>18:00</b></div><div class="statline"><span>Ventas fuera de horario</span><b>Se asignan siempre</b></div></div></div><div class="panel"><div class="panel-head"><h3>Fuente de datos</h3></div><div class="panel-body"><div class="statline"><span>Asignaciones y tareas</span><b>Supabase canónico</b></div><div class="statline"><span>Meta mensual</span><b>Documento Invicto</b></div><div class="statline"><span>I.A.</span><b>Misma fuente operativa</b></div><div class="statline"><span>Última sincronización</span><b>${D().generated_at?new Date(D().generated_at).toLocaleTimeString('es-CO',{timeZone:'America/Bogota',hour:'2-digit',minute:'2-digit'}):'—'}</b></div></div></div></div>`;
    const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión 51.2');
  };
  window.renderHome=window.renderHomeV51;
  setTimeout(()=>{if(typeof currentView!=='undefined'&&currentView==='home')window.renderHomeV51()},150);
  console.info('INVICTO OPS v51.2 · Inicio completo restaurado');
})();
