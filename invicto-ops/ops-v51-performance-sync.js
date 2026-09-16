/* INVICTO OPS v51 · alinea Rendimiento con la fuente canónica sin mezclar conceptos */
(function(){
  function E(v){return typeof esc==='function'?esc(v??''):String(v??'')}
  function N(v){return Number(v||0)}
  function today(){return window.opsCanonicalV51?.data?.business_date||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
  function canon(){return window.opsCanonicalV51?.data||null}

  function canonicalPerformanceBlock(){const d=canon();if(!d)return '';const rows=Array.isArray(d.advisors)?d.advisors:[],t=d.totals||{};return `<div data-canon-perf-v51="1" class="canon-inline-v51" style="margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px"><div><div class="eyebrow">FUENTE ÚNICA DE ASIGNACIONES · ${E(d.business_date||'')}</div><h3 style="margin:3px 0">Tareas asignadas por asesor</h3></div><div class="spacer"></div><button class="btn light sm" onclick="refreshCanonicalV51()">↻ Sincronizar</button></div><div class="canon-inline-grid-v51" style="margin-top:10px"><div><small>VENTAS NUEVAS</small><b>${N(t.ventas_nuevas)}</b></div><div><small>RECUPERACIONES</small><b>${N(t.recuperaciones)}</b></div><div><small>BORRADORES</small><b>${N(t.borradores)}</b></div><div><small>GARANTÍAS</small><b>${N(t.garantias)}</b></div><div><small>TOTAL POR GESTIONAR</small><b>${N(t.total_tareas)}</b></div></div>${rows.length>1?`<div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>ASESOR</th><th>VENTAS NUEVAS</th><th>RECUPERACIONES</th><th>BORRADORES</th><th>GARANTÍAS</th><th>TOTAL TAREAS</th><th>VENTAS RECIBIDAS HOY</th><th>CONFIRMADAS</th><th>TASA</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${E(r.full_name)}</b></td><td>${N(r.ventas_nuevas)}</td><td>${N(r.recuperaciones)}</td><td>${N(r.borradores)}</td><td>${N(r.garantias)}</td><td><b>${N(r.total_tareas)}</b></td><td>${N(r.asignadas_hoy)}</td><td>${N(r.confirmadas_hoy)}</td><td>${N(r.tasa_confirmacion_hoy)}%</td></tr>`).join('')}</tbody></table></div>`:''}</div>`}

  window.applyCanonicalPerformanceV51=function(){const host=document.getElementById('view-performance');if(!host||!canon())return;host.querySelector('[data-canon-perf-v51]')?.remove();const date=typeof perf32Date!=='undefined'&&perf32Date?perf32Date:today();if(String(date)!==String(today()))return;host.insertAdjacentHTML('afterbegin',canonicalPerformanceBlock());
    const cards=[...host.querySelectorAll('.perf32-card')];cards.forEach(c=>{const s=c.querySelector('small');if(!s)return;const x=s.textContent.trim();if(x==='Asignadas hoy')s.textContent='Ventas recibidas hoy';else if(x==='Carga total')s.textContent='Carga comercial de ventas';else if(x==='Pendientes')s.textContent='Pendientes comerciales';});
    const th=[...host.querySelectorAll('.perf32-table thead th')];th.forEach(x=>{const t=x.textContent.trim();if(t==='Asignadas')x.textContent='Ventas recibidas';else if(t==='Carga total')x.textContent='Carga comercial';else if(t==='Pendientes')x.textContent='Pendientes ventas';});
    const head=host.querySelector('.perf32-head p');if(head)head.textContent=(head.textContent||'')+' La carga total de tareas se muestra arriba desde la fuente canónica.';
  };

  const basePaint=window.paintPerformanceV32;
  if(typeof basePaint==='function')window.paintPerformanceV32=function(){const r=basePaint.apply(this,arguments);const apply=()=>window.applyCanonicalPerformanceV51();if(canon())setTimeout(apply,0);else window.loadCanonicalV51?.(false).then(()=>setTimeout(apply,0));return r};

  const oldFilter=window.setCanonicalFilterV51;window.setCanonicalFilterV51=function(v){window.opsCanonicalV51.filter=v;if(typeof currentView!=='undefined'&&currentView!=='sales'){if(typeof switchView==='function')switchView('sales');setTimeout(()=>window.renderSalesV51?.(),20)}else window.renderSalesV51?.()};
  const oldAdvisor=window.setCanonicalAdvisorV51;window.setCanonicalAdvisorV51=function(v){window.opsCanonicalV51.selectedAdvisor=String(v||'all');window.opsCanonicalV51.filter='all';if(typeof currentView!=='undefined'&&currentView!=='sales'){if(typeof switchView==='function')switchView('sales');setTimeout(()=>window.renderSalesV51?.(),20)}else window.renderSalesV51?.()};

  setInterval(()=>{if(typeof currentView!=='undefined'&&currentView==='performance')window.applyCanonicalPerformanceV51()},30000);
  console.info('INVICTO OPS v51 · Rendimiento etiquetado y sincronizado con fuente canónica');
})();