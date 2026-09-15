/* INVICTO OPS v37.2 · recordatorio horario de ventas represadas */
(function(){
  const ACTIVE = ['nueva','asignada','en_gestion','no_contesta','seguimiento_programado','pendiente_stock'];
  const NOTIFY_HOURS = new Set([9,10,11,14,15,16,17]);
  let checkTimer = null;
  let showing = false;

  function parts(d=new Date()){
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
    return Object.fromEntries(p.map(x=>[x.type,x.value]));
  }
  function dateKey(){const p=parts();return `${p.year}-${p.month}-${p.day}`;}
  function dow(date){return new Date(`${date}T12:00:00-05:00`).getUTCDay();}
  function hourKey(hour){return `invicto_ops_hourly_backlog_v372_${session?.id||session?.name||'user'}_${dateKey()}_${hour}`;}
  function alreadyShown(hour){try{return localStorage.getItem(hourKey(hour))==='shown';}catch(e){return false;}}
  function markShown(hour){try{localStorage.setItem(hourKey(hour),'shown');}catch(e){}}
  function escv(v=''){return typeof esc==='function'?esc(v):String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  function shouldRun(){
    if(!window.session?.id||!window.invictoSupabaseV12)return false;
    const p=parts(),hour=Number(p.hour||0),date=`${p.year}-${p.month}-${p.day}`;
    if(date<'2026-09-15'||dow(date)===0||!NOTIFY_HOURS.has(hour))return false;
    return !alreadyShown(hour);
  }

  function isBacklog(r){
    if(!r||!ACTIVE.includes(r.status))return false;
    return !!r.followup_overdue || Number(r.minutes_without_management||0)>=5;
  }
  function severity(r){
    if(r.followup_overdue && Number(r.minutes_without_management||0)>=10)return 'red';
    if(Number(r.minutes_without_management||0)>=10)return 'red';
    return 'amber';
  }
  function taskLabel(r){
    if(r.followup_overdue)return 'Seguimiento vencido';
    const mins=Number(r.minutes_without_management||0);
    if(mins>=10)return `${mins} min hábiles sin gestión`;
    if(mins>=5)return `${mins} min hábiles sin gestión`;
    return 'Pendiente';
  }

  async function showHourlyBacklog(){
    if(showing||!shouldRun()||document.getElementById('opsHourlyBacklogV372'))return;
    showing=true;
    const p=parts(),hour=Number(p.hour||0),date=`${p.year}-${p.month}-${p.day}`;
    try{
      try{await invictoSupabaseV12.rpc('refresh_ops_alerts');}catch(e){console.warn('hourly alerts refresh',e);}
      const [perf,follow]=await Promise.all([
        invictoSupabaseV12.rpc('get_unified_advisor_performance_v33',{p_date:date}),
        invictoSupabaseV12.rpc('get_ops_followup_board',{p_date:date})
      ]);
      if(perf.error)throw perf.error;if(follow.error)throw follow.error;
      const d=perf.data||{},advisors=d.advisors||[],all=(follow.data?.sales||[]).filter(x=>ACTIVE.includes(x.status));
      const backlog=all.filter(isBacklog).sort((a,b)=>{
        const au=a.followup_overdue?1:0,bu=b.followup_overdue?1:0;if(au!==bu)return bu-au;
        return Number(b.minutes_without_management||0)-Number(a.minutes_without_management||0);
      });
      const red=backlog.filter(x=>severity(x)==='red').length,amber=backlog.length-red;

      const team=d.can_view_all?`<div class="hourly-team-v372"><div class="hourly-title-v372">Represadas por asesor</div>${advisors.map(a=>{
        const mine=backlog.filter(r=>String(r.advisor_id||'')===String(a.id||''));
        const r=mine.filter(x=>severity(x)==='red').length;
        return `<div class="hourly-advisor-v372"><b>${escv(a.advisor)}</b><span><strong>${mine.length}</strong> represadas</span><span class="${r?'danger':''}"><strong>${r}</strong> rojas</span><span><strong>${Number(a.followups||0)}</strong> seguimientos</span></div>`;
      }).join('')}</div>`:'';

      const list=backlog.slice(0,12).map(r=>`<button class="hourly-row-v372" onclick="closeHourlyBacklogV372();switchView('sales')"><div><b>${escv(r.order||'—')}</b><small>${escv(r.customer_name||'')} · ${escv(r.advisor||'')}</small></div><span class="${severity(r)==='red'?'red':'amber'}">${escv(taskLabel(r))}</span></button>`).join('')||'<div class="hourly-empty-v372">No tienes ventas represadas en este corte horario.</div>';

      const wrap=document.createElement('div');wrap.id='opsHourlyBacklogV372';
      wrap.innerHTML=`<div class="hourly-back-v372"></div><section class="hourly-modal-v372"><div class="hourly-head-v372"><div><div class="eyebrow">CONTROL HORARIO · ${String(hour).padStart(2,'0')}:00</div><h2>${d.can_view_all?'Estado de ventas represadas':'Ventas que debes destrabar ahora'}</h2><p>El sistema revisa únicamente tiempo hábil: 08:00–12:00 y 14:00–18:00.</p></div><button class="close" onclick="closeHourlyBacklogV372()">×</button></div><div class="hourly-kpis-v372"><div><small>Represadas</small><b>${backlog.length}</b></div><div class="danger"><small>Rojas</small><b>${red}</b></div><div><small>Amarillas</small><b>${amber}</b></div><div><small>Activas totales</small><b>${all.length}</b></div></div>${team}<div class="hourly-list-v372"><div class="hourly-title-v372">Prioridad inmediata</div>${list}${backlog.length>12?`<div class="muted" style="padding-top:8px">+ ${backlog.length-12} ventas adicionales en Rendimiento.</div>`:''}</div><div class="hourly-foot-v372"><button class="btn light" onclick="closeHourlyBacklogV372()">Cerrar</button><button class="btn light" onclick="closeHourlyBacklogV372();switchView('sales')">Ver ventas</button><button class="btn cyan" onclick="closeHourlyBacklogV372();switchView('performance')">Abrir Rendimiento</button></div></section>`;
      document.body.appendChild(wrap);markShown(hour);
    }catch(e){console.error('hourly backlog v37.2',e);}finally{showing=false;}
  }

  window.closeHourlyBacklogV372=function(){document.getElementById('opsHourlyBacklogV372')?.remove();};
  window.showHourlyBacklogV372=showHourlyBacklog;
  function start(){
    if(checkTimer)clearInterval(checkTimer);
    setTimeout(showHourlyBacklog,1400);
    checkTimer=setInterval(showHourlyBacklog,30000);
  }
  const baseRenderShell=window.renderShell;
  window.renderShell=function(){baseRenderShell();start();};
  if(document.readyState==='complete'||document.readyState==='interactive')start();else document.addEventListener('DOMContentLoaded',start,{once:true});
  console.info('INVICTO OPS v37.2 · recordatorio horario de represadas activo');
})();