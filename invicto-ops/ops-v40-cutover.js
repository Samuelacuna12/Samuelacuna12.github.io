/* INVICTO OPS v40 · corte definitivo 15 Sep 12:00 · asesores 14:00–18:00 */
(function(){
  const CUTOVER_MS=Date.parse('2026-09-15T17:00:00Z');
  const CUTOVER_DATE='2026-09-15';
  const ACTIVE=['nueva','asignada','en_gestion','no_contesta','seguimiento_programado','pendiente_stock'];
  const HOURLY=new Set([15,16,17]);
  let hourlyTimer=null,briefTimer=null,hourlyShowing=false;

  function parts(d=new Date()){
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
    return Object.fromEntries(p.map(x=>[x.type,x.value]));
  }
  function dateKey(d=new Date()){const p=parts(d);return `${p.year}-${p.month}-${p.day}`;}
  function dow(date){return new Date(`${date}T12:00:00-05:00`).getUTCDay();}
  function esc40(v=''){return typeof esc==='function'?esc(v):String(v);}

  window.opsV37IsNewSale=function(s){
    if(!s)return false;
    if(s.opsData?.legacy_system===true||s.ops_data?.legacy_system===true)return false;
    const raw=s.receivedAt||s.received_at||s.createdAt||s.created_at;
    if(raw){const t=new Date(raw).getTime();if(Number.isFinite(t))return t>=CUTOVER_MS;}
    return false;
  };
  window.opsV37IsLegacyMonthly=function(r){
    if(!r||r.record_origin==='historical_shopify')return false;
    const raw=r.received_at||r.created_at;
    if(raw){const t=new Date(raw).getTime();if(Number.isFinite(t))return t<CUTOVER_MS;}
    return String(r.commercial_date||'')<=CUTOVER_DATE;
  };
  if(typeof window.isLegacyMonthlyV26!=='undefined')window.isLegacyMonthlyV26=window.opsV37IsLegacyMonthly;

  /* Única ventana SLA: Lun–Sáb 14:00–18:00 Colombia. */
  window.businessMinutesV21=function(start,end=new Date()){
    const a=new Date(start),b=new Date(end);if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<=a)return 0;
    const first=dateKey(a),last=dateKey(b);let cursor=new Date(first+'T12:00:00Z'),total=0,guard=0;
    while(guard++<400){
      const ymd=cursor.toISOString().slice(0,10),day=cursor.getUTCDay();
      if(day!==0){
        const ds=new Date(`${ymd}T14:00:00-05:00`),de=new Date(`${ymd}T18:00:00-05:00`);
        const lo=Math.max(a.getTime(),ds.getTime()),hi=Math.min(b.getTime(),de.getTime());if(hi>lo)total+=(hi-lo)/60000;
      }
      if(ymd>=last)break;cursor=new Date(cursor.getTime()+86400000);
    }
    return Math.max(0,Math.round(total));
  };

  function briefKey(date){return `invicto_ops_shift_brief_v40_${window.session?.id||window.session?.name||'user'}_${date}`;}
  window.opsV37ShouldShowBrief=function(){
    if(!window.session?.id||!window.invictoSupabaseV12)return false;
    const p=parts(),date=`${p.year}-${p.month}-${p.day}`,hour=Number(p.hour||0);
    if(dow(date)===0||date<CUTOVER_DATE||hour<14||hour>=18)return false;
    try{return localStorage.getItem(briefKey(date))!=='shown';}catch(e){return true;}
  };
  function taskLabel(r){
    if(r.followup_overdue)return 'ATENDER AHORA · seguimiento vencido';
    if(r.next_followup_at)return `Seguimiento ${new Date(r.next_followup_at).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}`;
    return ({nueva:'Contactar cliente',asignada:'Primer contacto',en_gestion:'Continuar gestión',no_contesta:'Reintentar contacto',seguimiento_programado:'Cumplir seguimiento',pendiente_stock:'Validar stock'})[r.status]||'Revisar venta';
  }
  window.opsV37ShowOpeningBrief=async function(){
    if(!window.opsV37ShouldShowBrief()||document.getElementById('opsShiftBriefV37'))return;
    const date=dateKey();
    try{
      try{await invictoSupabaseV12.rpc('refresh_ops_alerts');}catch(e){}
      const [perf,follow]=await Promise.all([
        invictoSupabaseV12.rpc('get_unified_advisor_performance_v33',{p_date:date}),
        invictoSupabaseV12.rpc('get_ops_followup_board',{p_date:date})
      ]);
      if(perf.error)throw perf.error;if(follow.error)throw follow.error;
      const d=perf.data||{},s=d.summary||{},advisors=d.advisors||[],tasks=(follow.data?.sales||[]).filter(x=>ACTIVE.includes(x.status));
      const team=d.can_view_all?`<div class="shift-team-v37"><div class="shift-section-title-v37">Carga por asesor</div>${advisors.map(a=>`<div class="shift-advisor-v37"><div><b>${esc40(a.advisor)}</b><small>${Number(a.assigned||0)} nuevas · ${Number(a.carryover||0)} arrastre</small></div><div><strong>${Number(a.workload||0)}</strong><span>carga</span></div><div><strong>${Number(a.pending||0)}</strong><span>pend.</span></div><div><strong>${Number(a.followups||0)}</strong><span>seg.</span></div><div class="${Number(a.overdue||0)?'danger':''}"><strong>${Number(a.overdue||0)}</strong><span>venc.</span></div></div>`).join('')||'<div class="muted">Sin carga asignada.</div>'}</div>`:'';
      const list=tasks.slice(0,14).map(r=>`<div class="shift-task-v37"><div><b>${esc40(r.order||'—')}</b><small>${esc40(r.customer_name||'')} · ${esc40(r.advisor||'')}</small></div><span class="${r.followup_overdue?'urgent':''}">${esc40(taskLabel(r))}</span></div>`).join('')||'<div class="shift-empty-v37">No hay tareas pendientes al iniciar el turno.</div>';
      const wrap=document.createElement('div');wrap.id='opsShiftBriefV37';
      wrap.innerHTML=`<div class="shift-back-v37"></div><section class="shift-modal-v37"><div class="shift-head-v37"><div><div class="eyebrow">APERTURA DE TURNO · 14:00</div><h2>${d.can_view_all?'Panorama operativo del equipo':'Tus tareas para iniciar'}</h2><p>Las ventas entran y se asignan desde las 12:00. El reloj SLA empieza a correr a las 14:00 y se detiene a las 18:00.</p></div><button class="close" onclick="closeShiftBriefV37()">×</button></div><div class="shift-kpis-v37"><div><small>Carga inicial</small><b>${Number(s.workload||0)}</b></div><div><small>Nuevas desde 12:00</small><b>${Number(s.assigned||0)}</b></div><div><small>Arrastre</small><b>${Number(s.carryover||0)}</b></div><div><small>Pendientes</small><b>${Number(s.pending||0)}</b></div><div><small>Seguimientos</small><b>${Number(s.followups||0)}</b></div><div class="${Number(s.overdue||0)?'danger':''}"><small>Vencidos</small><b>${Number(s.overdue||0)}</b></div><div><small>Amarillas</small><b>${Number(s.yellow||0)}</b></div><div class="${Number(s.red||0)?'danger':''}"><small>Rojas</small><b>${Number(s.red||0)}</b></div></div>${team}<div class="shift-tasks-v37"><div class="shift-section-title-v37">Qué debe gestionarse ahora</div>${list}${tasks.length>14?`<div class="muted" style="padding-top:8px">+ ${tasks.length-14} tareas adicionales en Rendimiento.</div>`:''}</div><div class="shift-foot-v37"><button class="btn light" onclick="closeShiftBriefV37()">Cerrar</button><button class="btn light" onclick="closeShiftBriefV37();switchView('sales')">Ventas del día</button><button class="btn cyan" onclick="closeShiftBriefV37();switchView('performance')">Abrir Rendimiento</button></div></section>`;
      document.body.appendChild(wrap);try{localStorage.setItem(briefKey(date),'shown');}catch(e){}
    }catch(e){console.error('opening brief v40',e);}
  };
  window.opsV37ScheduleBrief=function(){
    if(briefTimer)clearTimeout(briefTimer);
    setTimeout(()=>window.opsV37ShowOpeningBrief(),700);
    const p=parts(),hour=Number(p.hour||0),minute=Number(p.minute||0),date=`${p.year}-${p.month}-${p.day}`;
    if(date>=CUTOVER_DATE&&dow(date)!==0&&hour<14){const ms=((14-hour)*60-minute)*60000;briefTimer=setTimeout(()=>window.opsV37ShowOpeningBrief(),Math.max(1000,ms+1200));}
  };

  function hourlyKey(hour){return `invicto_ops_hourly_backlog_v40_${window.session?.id||window.session?.name||'user'}_${dateKey()}_${hour}`;}
  function hourlyDue(){
    if(!window.session?.id||!window.invictoSupabaseV12)return false;
    const p=parts(),hour=Number(p.hour||0),date=`${p.year}-${p.month}-${p.day}`;
    if(date<CUTOVER_DATE||dow(date)===0||!HOURLY.has(hour))return false;
    try{return localStorage.getItem(hourlyKey(hour))!=='shown';}catch(e){return true;}
  }
  window.closeHourlyBacklogV40=function(){document.getElementById('opsHourlyBacklogV372')?.remove();};
  async function showHourly(){
    if(hourlyShowing||!hourlyDue()||document.getElementById('opsHourlyBacklogV372'))return;hourlyShowing=true;
    const p=parts(),hour=Number(p.hour||0),date=`${p.year}-${p.month}-${p.day}`;
    try{
      try{await invictoSupabaseV12.rpc('refresh_ops_alerts');}catch(e){}
      const [perf,follow]=await Promise.all([
        invictoSupabaseV12.rpc('get_unified_advisor_performance_v33',{p_date:date}),
        invictoSupabaseV12.rpc('get_ops_followup_board',{p_date:date})
      ]);
      if(perf.error)throw perf.error;if(follow.error)throw follow.error;
      const d=perf.data||{},advisors=d.advisors||[],all=(follow.data?.sales||[]).filter(x=>ACTIVE.includes(x.status));
      const backlog=all.filter(r=>!!r.followup_overdue||Number(r.minutes_without_management||0)>=5).sort((a,b)=>(Number(b.followup_overdue)-Number(a.followup_overdue))||Number(b.minutes_without_management||0)-Number(a.minutes_without_management||0));
      const red=backlog.filter(r=>Number(r.minutes_without_management||0)>=10||r.followup_overdue&&Number(r.minutes_without_management||0)>=10).length,amber=backlog.length-red;
      const team=d.can_view_all?`<div class="hourly-team-v372"><div class="hourly-title-v372">Represadas por asesor</div>${advisors.map(a=>{const mine=backlog.filter(r=>String(r.advisor_id||'')===String(a.id||'')),rr=mine.filter(r=>Number(r.minutes_without_management||0)>=10).length;return `<div class="hourly-advisor-v372"><b>${esc40(a.advisor)}</b><span><strong>${mine.length}</strong> represadas</span><span class="${rr?'danger':''}"><strong>${rr}</strong> rojas</span><span><strong>${Number(a.followups||0)}</strong> seguimientos</span></div>`;}).join('')}</div>`:'';
      const list=backlog.slice(0,12).map(r=>`<button class="hourly-row-v372" onclick="closeHourlyBacklogV40();switchView('sales')"><div><b>${esc40(r.order||'—')}</b><small>${esc40(r.customer_name||'')} · ${esc40(r.advisor||'')}</small></div><span class="${Number(r.minutes_without_management||0)>=10?'red':'amber'}">${r.followup_overdue?'Seguimiento vencido':`${Number(r.minutes_without_management||0)} min hábiles sin gestión`}</span></button>`).join('')||'<div class="hourly-empty-v372">No tienes ventas represadas en este corte horario.</div>';
      const wrap=document.createElement('div');wrap.id='opsHourlyBacklogV372';wrap.innerHTML=`<div class="hourly-back-v372"></div><section class="hourly-modal-v372"><div class="hourly-head-v372"><div><div class="eyebrow">CONTROL HORARIO · ${String(hour).padStart(2,'0')}:00</div><h2>${d.can_view_all?'Estado de ventas represadas':'Ventas que debes destrabar ahora'}</h2><p>El SLA solo contabiliza tiempo hábil entre 14:00 y 18:00.</p></div><button class="close" onclick="closeHourlyBacklogV40()">×</button></div><div class="hourly-kpis-v372"><div><small>Represadas</small><b>${backlog.length}</b></div><div class="danger"><small>Rojas</small><b>${red}</b></div><div><small>Amarillas</small><b>${amber}</b></div><div><small>Activas totales</small><b>${all.length}</b></div></div>${team}<div class="hourly-list-v372"><div class="hourly-title-v372">Prioridad inmediata</div>${list}</div><div class="hourly-foot-v372"><button class="btn light" onclick="closeHourlyBacklogV40()">Cerrar</button><button class="btn light" onclick="closeHourlyBacklogV40();switchView('sales')">Ver ventas</button><button class="btn cyan" onclick="closeHourlyBacklogV40();switchView('performance')">Abrir Rendimiento</button></div></section>`;document.body.appendChild(wrap);try{localStorage.setItem(hourlyKey(hour),'shown');}catch(e){}
    }catch(e){console.error('hourly backlog v40',e);}finally{hourlyShowing=false;}
  }
  function startHourly(){if(hourlyTimer)clearInterval(hourlyTimer);setTimeout(showHourly,1200);hourlyTimer=setInterval(showHourly,30000);}

  /* Corrige etiquetas antiguas después de cada render. */
  function patchVisible(){
    const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=foot.innerHTML.replace(/Lun–Sáb[^<]*/,'Lun–Sáb · 14:00–18:00').replace(/Versión\s+[^<]+/,'Versión 40.0');
    const perf=document.getElementById('view-performance');if(perf){const e=perf.querySelector('.perf32-head .eyebrow');if(e)e.textContent='MEDICIÓN OPERATIVA · DESDE 15 SEP 2026 · 12:00';const b=perf.querySelector('.perf32-banner');if(b&&String(window.perf32Date||'')===CUTOVER_DATE){b.className='perf32-banner';b.innerHTML='<b>Nuevo conteo activo desde las 12:00.</b> Las ventas 12:00–14:00 se asignan, pero el SLA empieza a correr a las 14:00.';}}
  }
  if(typeof window.renderRecovery==='function'){const b=window.renderRecovery;window.renderRecovery=function(){b();const h=document.getElementById('view-recovery');if(h)h.querySelectorAll('p').forEach(p=>{p.textContent=p.textContent.replace(/Lun–Sáb[^.]+/g,'Lun–Sáb 14:00–18:00')});};}
  if(typeof window.renderConfig==='function'){const b=window.renderConfig;window.renderConfig=async function(){await b();const h=document.getElementById('view-config');if(h)h.querySelectorAll('.statline').forEach(r=>{if(r.querySelector('span')?.textContent?.trim()==='Horario SLA'){const x=r.querySelector('b');if(x)x.textContent='Lun–Sáb 14:00–18:00';}});};}
  if(typeof window.paintPerformanceV32==='function'){const b=window.paintPerformanceV32;window.paintPerformanceV32=function(){b();setTimeout(patchVisible,0);};}
  const baseShell=window.renderShell;window.renderShell=function(){baseShell();patchVisible();window.opsV37ScheduleBrief();startHourly();};

  startHourly();setTimeout(patchVisible,500);
  console.info('INVICTO OPS v40 · corte 12:00 + asesores 14:00–18:00 activo');
})();