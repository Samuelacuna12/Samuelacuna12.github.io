/* INVICTO OPS v52.4 · pendientes reales accionables */
(function(){
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const N=v=>Number(v||0);
  const admin=()=>typeof isAdmin==='function'&&isAdmin();

  function styles(){
    if(document.getElementById('opsV524Styles'))return;
    const s=document.createElement('style');s.id='opsV524Styles';s.textContent=`
      .pending524{margin:0 0 14px;border:1px solid #dfe4ea;background:#fff;border-radius:16px;padding:13px 14px}
      .pending524-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}.pending524-head h3{margin:0}.pending524-head .muted{margin-left:auto}
      .pending524-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
      .pending524-card{border:1px solid #e1e6ed;border-radius:13px;padding:11px 12px;background:#f8fafc;text-align:left;cursor:pointer}
      .pending524-card:hover{border-color:#1d4ed8;box-shadow:0 0 0 2px rgba(37,99,235,.06)}
      .pending524-card small{display:block;font-size:9px;letter-spacing:.06em;font-weight:900;color:#667085}.pending524-card b{display:block;font-size:22px;margin-top:3px;color:#0b1324}
      .pending524-card.red b{color:#b42318}.pending524-card.blue b{color:#175cd3}.pending524-card.amber b{color:#b54708}
      .pending524-team{margin-top:10px;border-top:1px solid #edf0f4;padding-top:9px}.pending524-row{display:grid;grid-template-columns:1.3fr repeat(3,.8fr);gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #f0f2f5}.pending524-row:last-child{border-bottom:0}
      .pending524-link{border:0;background:transparent;color:#175cd3;font-weight:900;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
      .pending524-back{position:fixed;inset:0;background:rgba(2,12,27,.50);z-index:99980}.pending524-modal{position:fixed;right:0;top:0;bottom:0;width:min(860px,96vw);background:#fff;z-index:99981;box-shadow:-18px 0 55px rgba(2,12,27,.22);overflow:auto}
      .pending524-modal-head{position:sticky;top:0;background:#fff;z-index:2;padding:18px 20px;border-bottom:1px solid #e8ecf2;display:flex;align-items:flex-start;gap:12px}.pending524-modal-head h2{margin:2px 0}.pending524-modal-head button{margin-left:auto}
      .pending524-body{padding:16px 20px}.pending524-table{width:100%;border-collapse:collapse}.pending524-table th,.pending524-table td{padding:10px 8px;border-bottom:1px solid #edf0f4;text-align:left;vertical-align:top}.pending524-table th{font-size:9px;letter-spacing:.05em;color:#667085}.pending524-table td{font-size:12px}
      .pending524-badge{display:inline-flex;padding:3px 7px;border-radius:999px;background:#fff1f0;color:#b42318;font-size:9px;font-weight:900}.pending524-carry{background:#eff4ff;color:#175cd3}
      @media(max-width:800px){.pending524-grid{grid-template-columns:1fr 1fr}.pending524-row{grid-template-columns:1fr 1fr}.pending524-row>div:first-child{grid-column:1/-1}}
    `;document.head.appendChild(s);
  }
  function data(){return window.opsCanonicalV51?.data||{}}
  function summary(){
    const C=window.opsCanonicalV51||{}, rows=Array.isArray(data().advisors)?data().advisors:[];
    if(typeof isAdvisor==='function'&&isAdvisor()) return rows[0]||{};
    if(C.selectedAdvisor&&C.selectedAdvisor!=='all') return rows.find(x=>String(x.advisor_id)===String(C.selectedAdvisor))||{};
    return data().totals||{};
  }
  function card(kind,label,value,cls=''){
    const C=window.opsCanonicalV51||{}, aid=(typeof isAdvisor==='function'&&isAdvisor())?(summary().advisor_id||''):(C.selectedAdvisor&&C.selectedAdvisor!=='all'?C.selectedAdvisor:'');
    return `<button class="pending524-card ${cls}" onclick="openPendingV524('${kind}','${E(aid)}','${E(label)}')"><small>${E(label)}</small><b>${N(value)}</b><span class="muted">Ver cuáles son →</span></button>`;
  }
  function inject(){
    styles();const host=document.getElementById('view-sales');if(!host)return;
    host.querySelector('[data-pending-v524]')?.remove();
    const s=summary(), rows=Array.isArray(data().advisors)?data().advisors:[];
    const box=document.createElement('section');box.className='pending524';box.dataset.pendingV524='1';
    box.innerHTML=`<div class="pending524-head"><div><h3>Pendientes</h3><div class="muted">Aquí ves exactamente qué ventas faltan por gestionar.</div></div><div class="muted"></div></div>
      <div class="pending524-grid">
        ${card('never','SIN GESTIONAR',s.sin_gestionar,'red')}
        ${card('today','SIN GESTIÓN HOY',s.sin_gestion_hoy,'amber')}
        ${card('scheduled','SEGUIMIENTOS PROGRAMADOS',s.seguimientos_programados,'blue')}
        ${card('carryover','ARRASTRE ABIERTO',s.arrastre_abierto,'blue')}
      </div>
      ${admin()&&(!window.opsCanonicalV51?.selectedAdvisor||window.opsCanonicalV51.selectedAdvisor==='all')?`<div class="pending524-team">
        <div class="pending524-team-title"><b>Pendientes por asesor</b><span>Haz clic en cualquier contador para ver las ventas</span></div>
        ${rows.map(r=>`<div class="pending524-row"><div><b>${E(r.full_name)}</b></div>
          <div>Sin gestionar: <button class="pending524-link" onclick="openPendingV524('never','${E(r.advisor_id)}','Sin gestionar · ${E(r.full_name)}')">${N(r.sin_gestionar)}</button></div>
          <div>Sin gestión hoy: <button class="pending524-link" onclick="openPendingV524('today','${E(r.advisor_id)}','Sin gestión hoy · ${E(r.full_name)}')">${N(r.sin_gestion_hoy)}</button></div>
          <div>Programados: <button class="pending524-link" onclick="openPendingV524('scheduled','${E(r.advisor_id)}','Programados · ${E(r.full_name)}')">${N(r.seguimientos_programados)}</button></div>
        </div>`).join('')}
      </div>`:''}`;
    const stats=host.querySelector('.canon-stats-v51'); if(stats)stats.insertAdjacentElement('afterend',box); else host.prepend(box);
  }
  function dt(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
  window.closePendingV524=function(){document.getElementById('pendingV524Wrap')?.remove()};
  window.openPendingV524=async function(kind='never',advisorId='',label='Pendientes'){
    document.getElementById('pendingV524Wrap')?.remove();
    const w=document.createElement('div');w.id='pendingV524Wrap';w.innerHTML=`<div class="pending524-back" onclick="closePendingV524()"></div><aside class="pending524-modal"><div class="pending524-modal-head"><div><div class="eyebrow">VENTAS DEL DÍA · PENDIENTES</div><h2>${E(label)}</h2><div class="muted">Cargando ventas…</div></div><button class="btn light" onclick="closePendingV524()">×</button></div><div class="pending524-body">Sincronizando…</div></aside>`;document.body.appendChild(w);
    try{
      const {data:rows,error}=await invictoSupabaseV12.rpc('get_ops_pending_detail_v524',{p_kind:kind,p_advisor_id:advisorId||null}); if(error)throw error;
      const arr=Array.isArray(rows)?rows:[];
      w.querySelector('.pending524-modal-head .muted').textContent=arr.length+' ventas';
      w.querySelector('.pending524-body').innerHTML=arr.length?`<table class="pending524-table"><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>ASESOR</th><th>FECHA</th><th>ESTADO</th><th>GESTIÓN</th></tr></thead><tbody>${arr.map(r=>`<tr>
        <td><b>${E(r.reference)}</b><div class="muted">${E(r.source)} · ${r.entity_type==='draft_order'||r.entity_type==='manual_draft'?'Borrador':'Pedido'}</div>${r.is_carryover?'<span class="pending524-badge pending524-carry">ARRASTRE</span>':''}</td>
        <td><b>${E(r.customer)}</b><div class="muted">${E(r.phone)} · ${E(r.city)}</div></td>
        <td>${E(r.advisor)}</td><td>${E(r.commercial_date||'—')}</td>
        <td><span class="pending524-badge">${E(String(r.status||'').replaceAll('_',' '))}</span><div class="muted">Intentos: ${N(r.attempts)}</div></td>
        <td><button class="btn navy sm" onclick="managePendingV524('${E(r.id)}')">Gestionar</button>${r.next_followup_at?`<div class="muted">Próx: ${dt(r.next_followup_at)}</div>`:''}</td>
      </tr>`).join('')}</tbody></table>`:'<div class="canon-empty-v51"><b>No hay ventas en esta categoría.</b><br>La cifra ya está en cero.</div>';
    }catch(e){w.querySelector('.pending524-body').innerHTML='<div class="blocking"><b>No se pudo abrir el detalle.</b><br>'+E(e?.message||e)+'</div>'}
  };
  window.managePendingV524=function(id){closePendingV524();if(typeof switchView==='function')switchView('sales');setTimeout(()=>{if(typeof openOrderV20==='function')openOrderV20(id);else if(typeof openOrder==='function')openOrder(id)},120)};
  function wrap(){
    const base=window.renderSalesV51;if(typeof base!=='function'||base.__v524)return;
    const fn=function(){const r=base.apply(this,arguments);setTimeout(inject,0);return r};fn.__v524=true;window.renderSalesV51=fn;
  }
  wrap();setTimeout(()=>{wrap();if(typeof currentView!=='undefined'&&currentView==='sales')inject()},250);setTimeout(()=>{if(typeof currentView!=='undefined'&&currentView==='sales')inject()},1200);
  console.info('INVICTO OPS v59 · pendientes restaurados y clicables');
})();