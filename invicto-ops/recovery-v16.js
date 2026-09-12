/* INVICTO OPS v16 · recuperación, seguimientos y SLA en horas hábiles */
const hydrateBaseV16=window.hydrateOpsV13;
const saveOrderBaseV16=window.saveOrderV3;

window.hydrateOpsV13=async function(force=false){
  await hydrateBaseV16(force);
  if(!session)return;
  try{
    await invictoSupabaseV12.rpc('refresh_ops_alerts');
    const [{data:timing,error:e1},{data:alerts,error:e2}]=await Promise.all([
      invictoSupabaseV12.from('sales').select('id,next_followup_at,recovery_stage,last_attempt_at,last_managed_at').gte('commercial_date',dateDaysAgoV13(120)),
      invictoSupabaseV12.from('alerts').select('*').eq('status','open').order('created_at',{ascending:false})
    ]);
    if(e1)throw e1;if(e2)throw e2;
    const tm=new Map((timing||[]).map(x=>[x.id,x]));
    state.sales.forEach(s=>{const t=tm.get(s.dbId);if(!t)return;s.nextFollowupAt=t.next_followup_at;s.recoveryStage=Number(t.recovery_stage||0);s.lastAttemptAt=t.last_attempt_at;s.lastManagedAt=t.last_managed_at});
    state.alerts=alerts||[];
  }catch(e){console.error('SLA refresh',e)}
};

window.buildAlerts=function(){
  const out=[];
  (state.alerts||[]).filter(a=>a.status==='open'&&(!isAdvisor()||!a.user_id||a.user_id===session.id)).forEach(a=>out.push({level:a.severity==='roja'?'red':a.severity==='amarilla'?'amber':'info',title:a.title,text:a.body||'',dbId:a.id,blocking:!!a.blocking}));
  if(isAdmin())state.sales.filter(s=>s.status==='Confirmada'&&s.manualUploadRequired&&s.manualUploadStatus==='pending').forEach(s=>out.unshift({level:'red',title:`${s.id} · despacho bloqueado`,text:'Debe completarse la carga manual y registrar la guía antes del despacho.'}));
  return out;
};

function followupLabelV16(s){
  if(!s.nextFollowupAt)return s.status==='Pendiente stock'?'Cuando vuelva stock':'Sin hora programada';
  const d=new Date(s.nextFollowupAt);return d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
window.renderRecovery=function(){
  const rows=advisorSales().filter(s=>['No contesta','Seguimiento futuro','Pendiente stock'].includes(s.status));
  el('view-recovery').innerHTML=`<div class="page-title"><div><h1>Recuperación</h1><p>No contesta: mañana → tarde → mañana siguiente. Los relojes corren solo Lun–Sáb 08:00–18:00.</p></div></div>
  <div class="panel"><div class="table-wrap"><table><thead><tr><th>Prioridad</th><th>Cliente</th><th>Teléfono</th><th>Estado</th><th>Intentos</th><th>Asesor</th><th>Próxima acción</th><th>Acción</th></tr></thead><tbody>${rows.map(s=>`<tr><td>${s.status==='Pendiente stock'?'<span class="tag amber">STOCK</span>':s.nextFollowupAt&&new Date(s.nextFollowupAt)<=new Date()?'<span class="tag red">VENCIDA</span>':'<span class="tag blue">PROGRAMADA</span>'}</td><td><b>${esc(s.name)}</b><div class="muted">${esc(s.city)}</div></td><td>${esc(s.phone)}</td><td>${statusTag(s.status)}</td><td>${Number(s.recoveryStage??s.attempts??0)}/3</td><td>${esc(s.advisor)}</td><td><b>${esc(followupLabelV16(s))}</b></td><td><div style="display:flex;gap:5px;flex-wrap:wrap"><button class="btn light sm" onclick="openOrder('${s.id}')">Abrir</button>${s.status!=='Pendiente stock'&&Number(s.recoveryStage||0)<3?`<button class="btn navy sm" onclick="registerNoAnswerV16('${s.id}')">No contestó</button>`:''}<button class="btn light sm" onclick="scheduleRecoveryV16('${s.id}')">Programar</button>${Number(s.recoveryStage||0)>=3?`<button class="btn danger-lite sm" onclick="closeNoContactV16('${s.id}')">Cerrar sin contacto</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="8" class="muted">Sin recuperaciones pendientes.</td></tr>'}</tbody></table></div></div>`;
};

window.registerNoAnswerV16=async function(id){
  const s=state.sales.find(x=>x.id===id);if(!s?.dbId)return toast('Pedido no encontrado');
  try{
    const {error}=await invictoSupabaseV12.rpc('record_ops_sale_attempt',{p_sale_id:s.dbId,p_channel:'manual',p_outcome:'No contesta',p_next_followup_at:null,p_notes:'Intento de recuperación registrado desde INVICTO OPS'});if(error)throw error;
    await hydrateOpsV13(true);switchView('recovery');renderAI();
    const n=state.sales.find(x=>x.dbId===s.dbId);toast(n?.nextFollowupAt?`Seguimiento programado: ${followupLabelV16(n)}`:'Tercer intento registrado · listo para cierre sin contacto');
  }catch(e){console.error(e);toast('No se registró el intento: '+(e.message||e))}
};

function parseBogotaFollowupV16(raw){
  const m=String(raw||'').trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);if(!m)return null;
  const iso=`${m[1]}-${m[2]}-${m[3]}T${String(m[4]).padStart(2,'0')}:${m[5]}:00-05:00`;const d=new Date(iso);return Number.isNaN(d.getTime())?null:d;
}
window.scheduleRecoveryV16=async function(id){
  const s=state.sales.find(x=>x.id===id);if(!s?.dbId)return toast('Pedido no encontrado');
  const tomorrow=new Date(Date.now()+86400000);const def=`${new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(tomorrow)} 09:00`;
  const raw=prompt('Fecha y hora exacta en Colombia (AAAA-MM-DD HH:MM)',def);if(!raw)return;
  const d=parseBogotaFollowupV16(raw);if(!d||d<=new Date())return toast('La fecha/hora debe ser futura y usar el formato indicado');
  const reason=prompt('Motivo del seguimiento (ej. salario, dinero, llamar más tarde)','Llamar más tarde')||'Seguimiento programado';
  try{const {error}=await invictoSupabaseV12.rpc('schedule_ops_followup',{p_sale_id:s.dbId,p_followup_at:d.toISOString(),p_reason:reason});if(error)throw error;await hydrateOpsV13(true);switchView('recovery');renderAI();toast('Seguimiento programado')}
  catch(e){console.error(e);toast('No se programó: '+(e.message||e))}
};

window.closeNoContactV16=async function(id){
  const s=state.sales.find(x=>x.id===id);if(!s?.dbId)return;
  if(Number(s.recoveryStage||0)<3)return toast('Primero deben registrarse los 3 intentos');
  try{
    const clone={...s,status:'Perdido – sin contacto'};const payload=buildOpsPayloadV13(clone);payload.status='perdida';payload.loss_reason='sin contacto';
    const {error}=await invictoSupabaseV12.rpc('save_ops_sale',{p_sale_id:s.dbId,p_payload:payload,p_confirm:false});if(error)throw error;
    await hydrateOpsV13(true);switchView('recovery');renderAI();toast(`${id}: cerrado por sin contacto`);
  }catch(e){console.error(e);toast('No se cerró: '+(e.message||e))}
};

window.saveOrderV3=async function(confirm){
  const selected=document.getElementById('fStatus')?.value||'';
  let followup=null,reason='';
  if(!confirm&&(selected==='Llamar más tarde'||selected==='Seguimiento futuro')){
    const raw=prompt('Programa la fecha y hora exacta (AAAA-MM-DD HH:MM)');if(!raw)return toast('Para seguimiento futuro debes indicar fecha y hora');
    const d=parseBogotaFollowupV16(raw);if(!d||d<=new Date())return toast('Fecha/hora inválida o no futura');
    followup=d.toISOString();reason=prompt('Motivo del seguimiento','Llamar más tarde')||'Seguimiento programado';
  }
  const beforeId=editingSaleId,existing=beforeId?state.sales.find(x=>x.id===beforeId):null;
  await saveOrderBaseV16(confirm);
  if(followup){
    let s=existing?.dbId?state.sales.find(x=>x.dbId===existing.dbId):null;
    if(!s){const phone=(document.getElementById('fPhone')?.value||existing?.phone||'').replace(/\D/g,'').slice(-10);s=[...state.sales].find(x=>String(x.phone||'').replace(/\D/g,'').slice(-10)===phone)}
    if(s?.dbId){try{const {error}=await invictoSupabaseV12.rpc('schedule_ops_followup',{p_sale_id:s.dbId,p_followup_at:followup,p_reason:reason});if(error)throw error;await hydrateOpsV13(true);if(currentView==='sales')filterSales()}catch(e){console.error(e);toast('Venta guardada, pero falló la programación: '+(e.message||e))}}
  }
};
