/* INVICTO OPS v45 · cola independiente de recuperación importada */
(function(){
  let rows45=[];
  let loading45=false;
  let loaded45=false;

  function e45(v){return typeof esc==='function'?esc(v??''):String(v??'')}
  function m45(v){return typeof money==='function'?money(v||0):Number(v||0).toLocaleString('es-CO')}
  function status45(s){
    const map={pendiente:['PENDIENTE','amber'],seguimiento:['SEGUIMIENTO','blue'],recuperada:['RECUPERADA','green'],cerrada:['CERRADA','gray']};
    const x=map[s]||[String(s||'').toUpperCase(),'gray'];
    return `<span class="tag ${x[1]}">${x[0]}</span>`;
  }
  function follow45(v){if(!v)return '—';try{return new Date(v).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return '—'}}

  async function load45(force=false){
    if(loading45||typeof invictoSupabaseV12==='undefined'||!session)return;
    if(loaded45&&!force)return;
    loading45=true;
    try{
      const {data,error}=await invictoSupabaseV12.rpc('get_recovery_queue_v45');
      if(error)throw error;
      rows45=data||[];loaded45=true;
    }catch(err){console.error('recovery v45',err);toast('No se pudo cargar Recuperación: '+(err.message||err));}
    finally{loading45=false;if(currentView==='recovery')paint45();}
  }

  function stats45(){
    const c={pendiente:0,seguimiento:0,recuperada:0,cerrada:0};
    rows45.forEach(r=>{if(c[r.status]!==undefined)c[r.status]++});
    return c;
  }

  function paint45(){
    const root=el('view-recovery');if(!root)return;
    if(loading45&&!loaded45){root.innerHTML='<div class="panel"><div class="panel-body"><b>Cargando recuperación…</b></div></div>';return;}
    const c=stats45();
    const open=rows45.filter(r=>r.status!=='recuperada'&&r.status!=='cerrada');
    const closed=rows45.filter(r=>r.status==='recuperada'||r.status==='cerrada');
    const list=[...open,...closed];
    root.innerHTML=`<div class="page-title"><div><h1>Recuperación</h1><p>Cola importada de RECUPERACION (1).xlsx · independiente de Ventas y Rendimiento.</p></div><div><button class="btn light sm" onclick="refreshRecoveryV45()">Actualizar</button></div></div>
      <div class="cards" style="margin-bottom:14px">
        <div class="card"><small>Total asignado</small><b>${rows45.length}</b><div class="sub">casos visibles para tu usuario</div></div>
        <div class="card"><small>Pendientes</small><b>${c.pendiente}</b><div class="sub">por gestionar</div></div>
        <div class="card"><small>Seguimientos</small><b>${c.seguimiento}</b><div class="sub">programados</div></div>
        <div class="card"><small>Recuperadas</small><b>${c.recuperada}</b><div class="sub">ventas recuperadas</div></div>
        <div class="card"><small>Cerradas</small><b>${c.cerrada}</b><div class="sub">sin recuperación</div></div>
      </div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th>Estado</th><th>Pedido</th><th>Cliente</th><th>Teléfono</th><th>Ciudad</th><th>Origen</th><th>Uds.</th><th>Valor</th><th>Asesor</th><th>Intentos</th><th>Seguimiento</th><th>Acciones</th></tr></thead><tbody>${list.map(r=>`<tr><td>${status45(r.status)}</td><td><b>${e45(r.source_id)}</b></td><td>${e45(r.customer_name||'Sin nombre')}</td><td>${e45(r.customer_phone||'—')}</td><td>${e45(r.city||'—')}<div class="muted">${e45(r.department||'')}</div></td><td>${e45(r.source_order_status||r.source_entity_type||'')}</td><td>${Number(r.quantity||0)}</td><td>${m45(r.total_price)}</td><td>${e45(r.advisor_name||'Sin asignar')}</td><td>${Number(r.attempts||0)}</td><td>${e45(follow45(r.next_followup_at))}</td><td>${r.status==='recuperada'||r.status==='cerrada'?'<span class="muted">Finalizada</span>':`<div style="display:flex;gap:5px;flex-wrap:wrap"><button class="btn light sm" onclick="recoveryActionV45('${r.id}','no_contesta')">No contestó</button><button class="btn light sm" onclick="recoveryScheduleV45('${r.id}')">Programar</button><button class="btn navy sm" onclick="recoveryActionV45('${r.id}','recuperada')">Recuperada</button><button class="btn danger-lite sm" onclick="recoveryActionV45('${r.id}','cerrar')">Cerrar</button></div>`}</td></tr>`).join('')||'<tr><td colspan="12" class="muted">Sin casos de recuperación asignados.</td></tr>'}</tbody></table></div></div>`;
  }

  window.renderRecovery=function(){paint45();load45(false);};
  window.refreshRecoveryV45=async function(){loaded45=false;await load45(true);toast('Recuperación actualizada');};

  window.recoveryActionV45=async function(id,action){
    const item=rows45.find(x=>x.id===id);if(!item)return;
    let notes=null;
    if(action==='cerrar'&&!confirm('¿Cerrar este caso sin recuperación?'))return;
    if(action==='recuperada'&&!confirm('¿Marcar esta venta como recuperada?'))return;
    if(action==='no_contesta')notes=prompt('Nota del intento (opcional)','No contestó')||'No contestó';
    try{
      const {error}=await invictoSupabaseV12.rpc('update_recovery_queue_v45',{p_id:id,p_action:action,p_next_followup_at:null,p_notes:notes});
      if(error)throw error;loaded45=false;await load45(true);toast(action==='recuperada'?'Venta recuperada':action==='cerrar'?'Caso cerrado':'Intento registrado');
    }catch(err){console.error(err);toast('No se pudo actualizar: '+(err.message||err));}
  };

  window.recoveryScheduleV45=async function(id){
    const tomorrow=new Date(Date.now()+86400000);
    const d0=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(tomorrow);
    const raw=prompt('Fecha y hora Colombia (AAAA-MM-DD HH:MM)',d0+' 14:00');if(!raw)return;
    const d=typeof parseBogotaFollowupV16==='function'?parseBogotaFollowupV16(raw):new Date(raw.replace(' ','T')+':00-05:00');
    if(!d||Number.isNaN(d.getTime())||d<=new Date())return toast('Fecha/hora inválida');
    const notes=prompt('Motivo del seguimiento','Volver a contactar')||'Volver a contactar';
    try{
      const {error}=await invictoSupabaseV12.rpc('update_recovery_queue_v45',{p_id:id,p_action:'programar',p_next_followup_at:d.toISOString(),p_notes:notes});
      if(error)throw error;loaded45=false;await load45(true);toast('Seguimiento programado');
    }catch(err){console.error(err);toast('No se pudo programar: '+(err.message||err));}
  };

  setInterval(()=>{if(currentView==='recovery')load45(true)},120000);
  console.info('INVICTO OPS v45 · recuperación importada');
})();