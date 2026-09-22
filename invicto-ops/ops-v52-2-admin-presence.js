/* INVICTO OPS v60 · presencia solo admin + rendimiento limpio */
(function(){
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const M=v=>typeof money==='function'?money(v):Number(v||0).toLocaleString('es-CO');
  const admin=()=>typeof isAdmin==='function'&&isAdmin();
  const advisor=()=>typeof isAdvisor==='function'&&isAdvisor();
  const ui={mode:null,advisorId:null};

  function hideAdvisorPresence(){
    const styleId='opsV522PresenceStyle';
    if(!document.getElementById(styleId)){
      const s=document.createElement('style');s.id=styleId;
      s.textContent='#presenceV46{display:none!important}';document.head.appendChild(s);
    }
    document.getElementById('presenceV46')?.remove();
  }
  window.togglePresenceV46=function(){if(typeof toast==='function')toast('Solo administración puede activar o pausar asesores.');hideAdvisorPresence()};
  const baseShell=window.renderShell;
  if(typeof baseShell==='function'&&!baseShell.__v524){
    const wrapped=function(){const r=baseShell.apply(this,arguments);setTimeout(hideAdvisorPresence,0);setTimeout(hideAdvisorPresence,300);return r};
    wrapped.__v524=true;window.renderShell=wrapped;
  }

  function styles(){
    if(document.getElementById('opsV524Styles'))return;
    const s=document.createElement('style');s.id='opsV524Styles';s.textContent=`
      .clarity524{margin:0 0 14px;border:1px solid #dfe4ea;border-radius:17px;background:#fff;overflow:hidden}.clarity524-head{display:flex;gap:12px;align-items:center;padding:13px 15px;border-bottom:1px solid #edf0f4}.clarity524-head h3{margin:0}.clarity524-head p{margin:2px 0 0;color:#667085;font-size:11px}.clarity524-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;padding:12px}.clarity524-card{border:1px solid #e4e7ec;border-radius:14px;background:#f8fafc;padding:12px;text-align:left;cursor:pointer}.clarity524-card:hover,.clarity524-card.active{border-color:#1677ff;box-shadow:0 0 0 2px rgba(22,119,255,.08)}.clarity524-card small{display:block;font-size:9px;font-weight:900;color:#667085;letter-spacing:.05em}.clarity524-card b{display:block;font-size:26px;color:#101828;margin:3px 0}.clarity524-card span{font-size:10px;color:#667085}.clarity524-card.alert b{color:#b42318}.clarity524-note{padding:0 12px 12px;color:#667085;font-size:10px}.clarity524-list{border-top:1px solid #e4e7ec}.clarity524-list .panel-head{border:0}.clarity524-btn{border:0;border-radius:9px;padding:6px 9px;background:#fff1f0;color:#b42318;font-weight:900;cursor:pointer}.clarity524-btn.zero{background:#f2f4f7;color:#667085}.clarity524-go{border:0;border-radius:8px;padding:6px 9px;background:#071229;color:#fff;font-weight:900;cursor:pointer}.clarity524-chip{display:inline-flex;padding:3px 7px;border-radius:999px;background:#fff1f0;color:#b42318;font-size:9px;font-weight:900}.clarity524-chip.carry{background:#eef4ff;color:#175cd3}.clarity524-chip.scheduled{background:#fffaeb;color:#b54708}@media(max-width:850px){.clarity524-grid{grid-template-columns:1fr 1fr}}
    `;document.head.appendChild(s);
  }
  function clarity(){return window.opsCanonicalV51?.data?.clarity||{advisors:[],items:[],totals:{}}}
  function selectedAdvisorId(){
    const C=window.opsCanonicalV51;
    if(advisor())return String(session?.id||clarity().advisors?.[0]?.advisor_id||'');
    return C?.selectedAdvisor&&C.selectedAdvisor!=='all'?String(C.selectedAdvisor):'all';
  }
  function counts(id=selectedAdvisorId()){
    const c=clarity();if(id==='all'||!id)return c.totals||{};
    return (c.advisors||[]).find(x=>String(x.advisor_id)===String(id))||{};
  }
  const cfg={
    never:{label:'Sin gestionar',sub:'Nunca han tenido una gestión',key:'sin_gestionar'},
    today:{label:'Sin gestión hoy',sub:'Abiertas sin acción registrada hoy',key:'sin_gestion_hoy'},
    carryover:{label:'Arrastre abierto',sub:'Pendientes de días anteriores',key:'arrastre_abierto'},
    scheduled:{label:'Programados',sub:'Ocultos hasta la hora acordada',key:'seguimientos_programados'},
    open:{label:'Pendientes abiertas',sub:'Todas las ventas abiertas',key:'open_total'}
  };
  function itemMatch(x,mode){if(mode==='never')return !!x.sin_gestionar;if(mode==='today')return !!x.sin_gestion_hoy;if(mode==='carryover')return !!x.arrastre;if(mode==='scheduled')return !!x.programado;if(mode==='open')return true;return false}
  function items(mode=ui.mode,id=ui.advisorId||selectedAdvisorId()){
    return (clarity().items||[]).filter(x=>(id==='all'||!id||String(x.advisor_id)===String(id))&&itemMatch(x,mode));
  }
  function dt(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}

  window.showSalesClarityV524=function(mode,id){ui.mode=mode;ui.advisorId=id||selectedAdvisorId();injectSalesClarity()};
  window.closeSalesClarityV524=function(){ui.mode=null;injectSalesClarity()};
  window.openClaritySaleV524=function(id){if(typeof openOrderV20==='function')return openOrderV20(id);if(typeof openOrder==='function')return openOrder(id)};
  window.goSalesClarityV524=function(mode,id){
    const C=window.opsCanonicalV51;if(C&&admin()&&id)C.selectedAdvisor=String(id);
    ui.mode=mode;ui.advisorId=id||selectedAdvisorId();
    if(typeof switchView==='function')switchView('sales');
    setTimeout(()=>{if(typeof renderSalesV51==='function')renderSalesV51();else injectSalesClarity()},80);
  };

  function detailHtml(){
    if(!ui.mode)return '';
    const c=cfg[ui.mode]||cfg.never,rows=items();
    return `<div class="clarity524-list"><div class="panel-head"><div><h3>${E(c.label)} · ${rows.length}</h3><div class="muted">Estas son exactamente las ventas que componen esta cifra.</div></div><div class="spacer"></div><button class="btn light sm" onclick="closeSalesClarityV524()">Cerrar</button></div><div class="table-wrap"><table><thead><tr><th>PEDIDO</th><th>TIPO</th><th>CLIENTE</th><th>CIUDAD</th><th>ASESOR / CANAL</th><th>FECHA</th><th>ESTADO</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${E(r.reference)}</b>${r.arrastre?'<div><span class="clarity524-chip carry">ARRASTRE</span></div>':''}</td><td>${E(r.tipo||'Venta')}</td><td><b>${E(r.customer)}</b><div class="muted">${E(r.phone||'')}</div></td><td>${E(r.city||'—')}</td><td><b>${E(r.advisor||'')}</b><div class="muted">${E(r.channel||'')}</div></td><td>${E(r.commercial_date||'—')}<div class="muted">${dt(r.received_at)}</div></td><td>${r.programado?'<span class="clarity524-chip scheduled">PROGRAMADO</span>':`<span class="clarity524-chip">${E(String(r.status||'').replaceAll('_',' ').toUpperCase())}</span>`}</td><td><button class="clarity524-go" onclick="openClaritySaleV524('${E(r.sale_id)}')">Gestionar</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">No hay ventas en esta categoría.</td></tr>'}</tbody></table></div></div>`;
  }
  function injectTeamColumn(){
    if(!admin())return;const host=document.getElementById('view-sales'),table=host?.querySelector('.canon-team-v51 table');if(!table)return;
    const head=table.querySelector('thead tr');if(head&&!head.querySelector('[data-v524-th]')){const th=document.createElement('th');th.dataset.v524Th='1';th.textContent='SIN GESTIONAR';head.appendChild(th)}
    table.querySelectorAll('tbody tr[data-advisor]').forEach(tr=>{
      if(tr.querySelector('[data-v524-td]'))return;const id=tr.dataset.advisor,c=counts(id),n=Number(c.sin_gestionar||0),td=document.createElement('td');td.dataset.v524Td='1';td.innerHTML=`<button class="clarity524-btn ${n?'':'zero'}" onclick="event.stopPropagation();showSalesClarityV524('never','${E(id)}')">${n} · Ver</button>`;tr.appendChild(td);
    });
  }
  function injectSalesClarity(){
    styles();const host=document.getElementById('view-sales');if(!host||!window.opsCanonicalV51?.data)return;
    host.querySelector('[data-v524-control]')?.remove();const id=selectedAdvisorId(),c=counts(id),panel=document.createElement('div');panel.className='clarity524';panel.dataset.v524Control='1';
    const defs=['never','today','carryover','scheduled'];
    panel.innerHTML=`<div class="clarity524-head"><div><h3>Control real de pendientes</h3><p><b>${Number(c.open_total||0)} ventas abiertas.</b> Cada cifra de abajo es una vista distinta; <b>no se suman entre sí</b>.</p></div></div><div class="clarity524-grid">${defs.map(m=>{const z=cfg[m],n=Number(c[z.key]||0);return `<button class="clarity524-card ${m==='never'?'alert':''} ${ui.mode===m?'active':''}" onclick="showSalesClarityV524('${m}','${E(id)}')"><small>${E(z.label.toUpperCase())}</small><b>${n}</b><span>${E(z.sub)} · Ver cuáles</span></button>`}).join('')}</div><div class="clarity524-note"><b>Regla:</b> “Sin gestionar” = nunca tuvo gestión. “Sin gestión hoy” = no tuvo acción hoy, aunque pudo trabajarse antes. “Arrastre” = sigue abierta desde un día anterior. “Programados” = seguimiento futuro y no debe aparecer como urgente antes de su hora.</div>${detailHtml()}`;
    const anchor=host.querySelector('.canon-stats-v51')||host.querySelector('.canon-cards-v51')||host.querySelector('.canon-hero-v51');if(anchor)anchor.insertAdjacentElement('afterend',panel);else host.prepend(panel);
    injectTeamColumn();
  }

  function patchSales(){
    const base=window.renderSalesV51;if(typeof base!=='function'||base.__v524)return;
    const wrapped=function(){const r=base.apply(this,arguments);setTimeout(injectSalesClarity,0);return r};wrapped.__v524=true;window.renderSalesV51=wrapped;
  }
  function patchPerformanceDom(){
    const host=document.getElementById('view-performance');if(!host||!window.opsCanonicalV51?.data)return;
    const today=typeof perf32Today==='function'?perf32Today():new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota'}).format(new Date());
    if(typeof perf32Data!=='undefined'&&perf32Data?.date&&String(perf32Data.date)!==String(today))return;
    host.querySelectorAll('table').forEach(table=>{
      const hs=[...table.querySelectorAll('thead th')].map(x=>(x.textContent||'').trim().toLowerCase());const ai=hs.findIndex(x=>x==='asesor');if(ai<0)return;
      let ui=hs.findIndex(x=>x==='sin tocar'||x==='sin gestión hoy');let pi=hs.findIndex(x=>x==='pendientes ventas'||x==='pendientes'||x==='pendientes abiertas');
      if(ui>=0)table.querySelectorAll('thead th')[ui].textContent='SIN GESTIÓN HOY';
      if(pi>=0)table.querySelectorAll('thead th')[pi].textContent='PENDIENTES ABIERTAS';
      table.querySelectorAll('tbody tr').forEach(tr=>{const cells=tr.querySelectorAll('td'),name=(cells[ai]?.textContent||'').trim(),row=(clarity().advisors||[]).find(x=>String(x.full_name).trim()===name);if(!row)return;
        if(ui>=0&&cells[ui])cells[ui].innerHTML=`<b>${Number(row.sin_gestion_hoy||0)}</b> <button class="clarity524-btn ${Number(row.sin_gestion_hoy||0)?'':'zero'}" onclick="goSalesClarityV524('today','${E(row.advisor_id)}')">Ver</button>`;
        if(pi>=0&&cells[pi])cells[pi].innerHTML=`<b>${Number(row.open_total||0)}</b> <button class="clarity524-btn ${Number(row.open_total||0)?'':'zero'}" onclick="goSalesClarityV524('open','${E(row.advisor_id)}')">Ver</button>`;
      });
    });

  }
  function patchPerformance(){
    const base=window.paintPerformanceV32;if(typeof base!=='function'||base.__v524)return;
    const wrapped=function(){const r=base.apply(this,arguments);setTimeout(patchPerformanceDom,0);return r};wrapped.__v524=true;window.paintPerformanceV32=wrapped;
  }

  hideAdvisorPresence();patchSales();patchPerformance();
  setTimeout(()=>{hideAdvisorPresence();patchSales();patchPerformance();if(typeof currentView!=='undefined'&&currentView==='sales')injectSalesClarity();if(typeof currentView!=='undefined'&&currentView==='performance')patchPerformanceDom()},350);
  setTimeout(()=>{if(typeof loadCanonicalV51==='function')loadCanonicalV51(true).then(()=>{if(typeof currentView!=='undefined'&&currentView==='sales')renderSalesV51?.();if(typeof currentView!=='undefined'&&currentView==='performance')patchPerformanceDom()})},900);
  console.info('INVICTO OPS v52.4 · cuentas claras: sin gestionar, sin gestión hoy, arrastre y programados');
})();
