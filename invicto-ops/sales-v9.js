/* INVICTO OPS v9 · carga manual exige guía + transportadora + fecha */

function todayBogotaV9(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const m=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

function closeManualUploadModalV9(){
  document.getElementById('manualUploadModalV9')?.remove();
}

function openManualUploadModalV9(id){
  if(!isAdmin())return toast('Solo administración puede registrar la carga manual');
  const s=state.sales.find(x=>x.id===id);if(!s)return toast('Pedido no encontrado');
  closeManualUploadModalV9();
  const carrier=s.carrier&&TRANSPORTS.includes(s.carrier)?s.carrier:'';
  const wrap=document.createElement('div');
  wrap.id='manualUploadModalV9';
  wrap.innerHTML=`<div style="position:fixed;inset:0;background:rgba(2,16,68,.55);z-index:9998" onclick="closeManualUploadModalV9()"></div>
  <div style="position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 28px));background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(2,16,68,.25);overflow:hidden">
    <div style="padding:18px 20px;border-bottom:1px solid #e8edf3;display:flex;gap:12px;align-items:center"><div><div class="eyebrow">CARGA MANUAL</div><h3 style="margin:2px 0 0">${esc(s.id)} · registrar guía</h3></div><div class="spacer"></div><button class="close" onclick="closeManualUploadModalV9()">×</button></div>
    <div style="padding:20px;display:grid;gap:14px">
      <div class="blocking"><b>Obligatorio para desbloquear despacho.</b><br>Registra el número de guía, la transportadora y la fecha real de creación/subida.</div>
      <div class="field"><label>Número de guía *</label><input id="manualGuideV9" autocomplete="off" placeholder="Ej. 240056138099" value="${esc(s.manualGuideNumber||s.guide||'')}"></div>
      <div class="field"><label>Transportadora *</label><select id="manualCarrierV9"><option value="">Seleccionar</option>${TRANSPORTS.map(x=>`<option value="${esc(x)}" ${x===carrier?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="field"><label>Fecha de guía *</label><input id="manualDateV9" type="date" value="${esc(s.manualGuideDate||todayBogotaV9())}"></div>
      <div class="muted">Operador: <b>${esc(s.massiveOperator||s.warehouse||'—')}</b> · ${esc(s.massiveLineCount||'—')} IDs / máximo ${esc(s.massiveMaxLines||'—')}</div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #e8edf3;display:flex;justify-content:flex-end;gap:8px"><button class="btn light" onclick="closeManualUploadModalV9()">Cancelar</button><button class="btn cyan" onclick="confirmManualUploadedV9('${esc(s.id)}')">Guardar y habilitar despacho</button></div>
  </div>`;
  document.body.appendChild(wrap);
  setTimeout(()=>document.getElementById('manualGuideV9')?.focus(),30);
}

function confirmManualUploadedV9(id){
  if(!isAdmin())return toast('Solo administración puede registrar la carga manual');
  const s=state.sales.find(x=>x.id===id);if(!s)return;
  const guide=(document.getElementById('manualGuideV9')?.value||'').trim();
  const carrier=document.getElementById('manualCarrierV9')?.value||'';
  const date=document.getElementById('manualDateV9')?.value||'';
  if(!guide)return toast('El número de guía es obligatorio');
  if(!carrier)return toast('La transportadora es obligatoria');
  if(!date)return toast('La fecha de guía es obligatoria');

  const now=new Date().toISOString();
  s.manualUploadStatus='done';
  s.manualUploadedAt=now;
  s.manualUploadedBy=session.name;
  s.manualGuideNumber=guide;
  s.manualGuideDate=date;
  s.manualGuideCarrier=carrier;
  s.guide=guide;
  s.carrier=carrier;
  s.guideRegisteredAt=now;
  s.guideRegisteredBy=session.name;
  s.guideStatus='Subido manual';
  s.dispatchBlocked=false;
  s.dispatchBlockReason='';
  s.dispatchUnlockedAt=now;
  s.dispatchUnlockedBy=session.name;
  if(!s.dispatchStatus)s.dispatchStatus='Pendiente despacho';

  saveState();
  closeManualUploadModalV9();
  if(document.getElementById('view-cuts')?.classList.contains('active'))renderCuts();
  if(typeof renderAI==='function')renderAI();
  if(typeof filterSales==='function'&&document.getElementById('salesBody'))filterSales();
  toast(`${id}: guía ${guide} registrada · despacho habilitado`);
}

// El botón existente de v7/v8 ahora abre el formulario obligatorio en vez de cerrar directamente.
window.markManualUploadedV7=function(id){
  openManualUploadModalV9(id);
};

const renderCutsBaseV9=window.renderCuts;
window.renderCuts=function(){
  renderCutsBaseV9();
  const host=document.getElementById('view-cuts');if(!host)return;
  const done=state.sales
    .filter(s=>s.status==='Confirmada'&&s.manualUploadRequired&&s.manualUploadStatus==='done')
    .sort((a,b)=>new Date(b.manualUploadedAt||0)-new Date(a.manualUploadedAt||0));
  if(!done.length)return;
  host.insertAdjacentHTML('beforeend',`<div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Cargas manuales registradas</h3><div class="spacer"></div><span class="tag green">${done.length}</span></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Guía</th><th>Transportadora</th><th>Fecha guía</th><th>Registrado por</th><th>Despacho</th></tr></thead><tbody>${done.map(s=>`<tr><td><b>${esc(s.id)}</b></td><td>${esc(s.name)}</td><td class="mono"><b>${esc(s.manualGuideNumber||s.guide||'—')}</b></td><td>${esc(s.manualGuideCarrier||s.carrier||'—')}</td><td>${esc(s.manualGuideDate||'—')}</td><td>${esc(s.manualUploadedBy||'—')}<div class="muted">${s.manualUploadedAt?fmtDate(s.manualUploadedAt):''}</div></td><td><span class="tag green">HABILITADO</span></td></tr>`).join('')}</tbody></table></div></div>`);
};
