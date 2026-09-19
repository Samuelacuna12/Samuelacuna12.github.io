/* INVICTO OPS v55 · estado exacto de exportación MASSIVE */
(function(){
  let data55=null,loading55=false,last55=0;
  const E=function(v){return typeof esc==='function'?esc(v==null?'':v):String(v==null?'':v)};
  const D=function(v){try{return new Date(v).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return String(v||'')}};
  const cutName=function(id){return id?'C-'+String(id).slice(0,6).toUpperCase():'—'};

  function styles55(){
    if(document.getElementById('massiveStatus55Styles'))return;
    const s=document.createElement('style');
    s.id='massiveStatus55Styles';
    s.textContent=
      '.ms55{margin-bottom:16px;border:1px solid #dfe5ee;border-radius:22px;background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.08);overflow:hidden}'+
      '.ms55-hero{display:flex;gap:14px;align-items:flex-start;padding:18px 20px;background:linear-gradient(135deg,#07162f,#102b5b);color:#fff}'+
      '.ms55-hero h2{margin:4px 0 6px;font-size:22px}.ms55-hero p{margin:0;color:#cbd7e8;font-size:12px;max-width:760px}.ms55-hero .spacer{flex:1}'+
      '.ms55-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e8edf3}'+
      '.ms55-card{padding:12px;border:1px solid #e1e7ef;border-radius:14px;background:#fff}.ms55-card small{font-size:9px;font-weight:900;letter-spacing:.04em;color:#667085;display:block}.ms55-card b{display:block;font-size:24px;margin:4px 0;color:#101828}.ms55-card.red b{color:#b42318}.ms55-card.green b{color:#067647}.ms55-card.blue b{color:#175cd3}'+
      '.ms55-sec{padding:15px 18px;border-bottom:1px solid #eef1f5}.ms55-title{display:flex;align-items:center;gap:8px;margin-bottom:10px}.ms55-title h3{margin:0;font-size:14px}.ms55-title .spacer{flex:1}.ms55-count{border-radius:999px;padding:4px 8px;background:#eef4ff;color:#3538cd;font-size:10px;font-weight:900}'+
      '.ms55-wrap{overflow:auto}.ms55-table{width:100%;border-collapse:collapse;min-width:840px;font-size:11px}.ms55-table th{text-align:left;padding:7px;color:#667085;font-size:9px;border-bottom:1px solid #e5eaf0}.ms55-table td{padding:8px 7px;border-bottom:1px solid #f0f2f5;vertical-align:top}.ms55-sub{font-size:10px;color:#667085;margin-top:2px}.ms55-reason{font-size:10px;color:#b42318;margin-top:3px}.ms55-ok{font-size:10px;color:#067647;margin-top:3px}'+
      '.ms55-tag{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900;background:#ecfdf3;color:#067647;border:1px solid #abefc6;white-space:nowrap}.ms55-tag.wait{background:#eff4ff;color:#175cd3;border-color:#b2ccff}.ms55-tag.block{background:#fff1f0;color:#b42318;border-color:#fda29b}'+
      '.ms55-group{border:1px solid #e5eaf0;border-radius:14px;margin-bottom:9px;overflow:hidden}.ms55-group-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc}.ms55-group-head .spacer{flex:1}.ms55-empty{padding:12px;border-radius:12px;background:#f8fafc;color:#667085;font-size:11px}'+
      '@media(max-width:900px){.ms55-cards{grid-template-columns:1fr 1fr}.ms55-hero{flex-wrap:wrap}.ms55-cards .ms55-card:last-child{grid-column:1/-1}}';
    document.head.appendChild(s);
  }

  function localSale55(id){return (state&&state.sales||[]).find(function(s){return String(s.dbId||'')===String(id)})||null}
  function extraReason55(r){
    const s=localSale55(r.sale_id);
    if(!s||typeof preflightSaleV33!=='function'||!r.warehouse)return '';
    const max=r.warehouse==='LogiGho Medellín'?12:String(r.warehouse).indexOf('Hoko')===0?15:9999;
    try{return preflightSaleV33(s,r.warehouse,max)||''}catch(e){return ''}
  }

  window.openMassiveSaleV55=function(id){
    const s=localSale55(id);
    if(!s){if(typeof toast==='function')toast('Actualiza la pantalla y vuelve a intentar');return}
    if(typeof openOrderV20==='function')return openOrderV20(s.id);
    if(typeof openOrder==='function')return openOrder(s.id);
  };
  window.downloadMassiveV55=async function(cutId,warehouse){
    if(typeof exportCutV17!=='function'){toast('Exportador MASSIVE no disponible');return}
    await exportCutV17(cutId,warehouse);
    data55=null;
    await load55(true);
  };
  window.createMassiveCutV55=async function(){
    if(typeof createCut!=='function'){toast('Creación de corte no disponible');return}
    await createCut();
    data55=null;
    setTimeout(function(){load55(true)},250);
  };
  window.loadMassiveExportStatusV55=load55;

  async function load55(force){
    if(loading55||!window.invictoSupabaseV12)return;
    if(!force&&data55&&Date.now()-last55<20000)return;
    loading55=true;paint55();
    try{
      const r=await invictoSupabaseV12.rpc('get_massive_export_status_v55');
      if(r.error)throw r.error;
      data55=r.data||{};last55=Date.now();
    }catch(e){
      console.error('massive status v55',e);
      if(typeof toast==='function')toast('No se pudo cargar el control MASSIVE: '+(e&&e.message||e));
    }finally{loading55=false;paint55()}
  }

  function pendingRow55(r){
    const extra=extraReason55(r);
    const blocked=r.massive_status==='blocked'||!!extra;
    let cutHtml=r.cut_id?'<span class="ms55-tag wait">'+E(cutName(r.cut_id))+'</span>':'<span class="ms55-sub">Próximo corte</span>';
    let reason=blocked?'<div class="ms55-reason">'+E(extra||r.status_reason||'Requiere revisión')+'</div>':'<div class="ms55-ok">'+E(r.status_reason||'Lista')+'</div>';
    return '<tr>'+
      '<td><b>'+E(r.reference||'—')+'</b><div class="ms55-sub">'+E(r.commercial_date||'')+'</div></td>'+
      '<td><b>'+E(r.customer||'Sin nombre')+'</b><div class="ms55-sub">'+E(r.phone||'')+'</div></td>'+
      '<td>'+E(r.city||'—')+'<div class="ms55-sub">'+E(r.department||'')+'</div></td>'+
      '<td><b>'+E(r.warehouse||'Sin bodega')+'</b><div class="ms55-sub">'+Number(r.quantity||0)+' und.</div></td>'+
      '<td>'+cutHtml+reason+'</td>'+
      '<td><button class="btn light sm" onclick="openMassiveSaleV55(\''+E(r.sale_id)+'\')">Abrir</button></td>'+
    '</tr>';
  }

  function exportedRow55(r){
    return '<tr>'+
      '<td><b>'+E(r.reference||'—')+'</b><div class="ms55-sub">'+E(r.commercial_date||'')+'</div></td>'+
      '<td><b>'+E(r.customer||'Sin nombre')+'</b><div class="ms55-sub">'+E(r.phone||'')+'</div></td>'+
      '<td><b>'+E(r.warehouse||'—')+'</b><div class="ms55-sub">'+E(r.operator||'')+'</div></td>'+
      '<td><span class="ms55-tag">MASSIVE EXPORTADA</span><div class="ms55-sub">'+E(D(r.exported_at))+'</div></td>'+
      '<td><b>'+E(r.file_name||'—')+'</b><div class="ms55-sub">'+E(cutName(r.cut_id))+'</div></td>'+
      '<td><button class="btn light sm" onclick="openMassiveSaleV55(\''+E(r.sale_id)+'\')">Ver venta</button></td>'+
    '</tr>';
  }

  function table55(rows,exported){
    if(!rows.length)return '<div class="ms55-empty">No hay registros en este estado.</div>';
    const head=exported?
      '<th>VENTA</th><th>CLIENTE</th><th>BODEGA</th><th>ESTADO</th><th>ARCHIVO</th><th></th>':
      '<th>VENTA</th><th>CLIENTE</th><th>CIUDAD</th><th>BODEGA</th><th>ESTADO</th><th></th>';
    return '<div class="ms55-wrap"><table class="ms55-table"><thead><tr>'+head+'</tr></thead><tbody>'+
      rows.map(function(r){return exported?exportedRow55(r):pendingRow55(r)}).join('')+
      '</tbody></table></div>';
  }

  function groups55(rows){
    const map=new Map();
    rows.filter(function(r){return r.massive_status==='in_cut'&&r.cut_id}).forEach(function(r){
      const k=String(r.cut_id)+'|'+String(r.warehouse||'');
      if(!map.has(k))map.set(k,{cutId:r.cut_id,warehouse:r.warehouse,rows:[]});
      map.get(k).rows.push(r);
    });
    const groups=Array.from(map.values());
    if(!groups.length)return '<div class="ms55-empty">No hay cortes esperando descarga.</div>';
    return groups.map(function(g){
      return '<div class="ms55-group">'+
        '<div class="ms55-group-head"><b>'+E(cutName(g.cutId))+'</b><span class="ms55-tag wait">'+E(g.warehouse||'Sin bodega')+'</span><span class="ms55-count">'+g.rows.length+' ventas</span><div class="spacer"></div><button class="btn navy sm" onclick="downloadMassiveV55(\''+E(g.cutId)+'\',\''+E(g.warehouse||'')+'\')">Descargar MASSIVE '+g.rows.length+'</button></div>'+
        table55(g.rows,false)+
      '</div>';
    }).join('');
  }

  function paint55(){
    styles55();
    const host=document.getElementById('view-cuts');if(!host)return;
    const old=host.querySelector('#massiveStatusV55');if(old)old.remove();
    const d=data55||{},sum=d.summary||{};
    const allPending=(d.pending||[]).filter(function(r){return r.massive_status!=='guide_already_present'});
    const historical=allPending.filter(function(r){return r.massive_status==='historical_unknown'});
    const pending=allPending.filter(function(r){return r.massive_status!=='historical_unknown'});
    const ready=pending.filter(function(r){return r.massive_status==='ready'});
    const blocked=pending.filter(function(r){return r.massive_status==='blocked'||!!extraReason55(r)});
    const exported=d.exported||[];
    const box=document.createElement('div');
    box.id='massiveStatusV55';box.className='ms55';
    box.innerHTML=
      '<div class="ms55-hero"><div><div class="eyebrow">CORTES · EXPORTACIÓN ÚNICA</div><h2>Control de guías MASSIVE</h2><p>Una venta confirmada permanece aquí hasta que realmente salga en un Excel. Al exportarse pasa a “Guías exportadas masivamente” y no vuelve a entrar en otro MASSIVE.</p></div><div class="spacer"></div><button class="btn light sm" onclick="loadMassiveExportStatusV55(true)">'+(loading55?'Actualizando…':'Actualizar')+'</button></div>'+
      '<div class="ms55-cards">'+
        '<div class="ms55-card blue"><small>POR EXPORTAR</small><b>'+Number(sum.pending_total||0)+'</b><span class="ms55-sub">confirmadas sin MASSIVE</span></div>'+
        '<div class="ms55-card"><small>EN CORTE</small><b>'+Number(sum.in_cut||0)+'</b><span class="ms55-sub">esperando descarga</span></div>'+
        '<div class="ms55-card green"><small>LISTAS PRÓXIMO CORTE</small><b>'+Number(sum.ready||0)+'</b><span class="ms55-sub">pueden entrar ya</span></div>'+
        '<div class="ms55-card red"><small>BLOQUEADAS</small><b>'+blocked.length+'</b><span class="ms55-sub">visibles, nunca perdidas</span></div>'+
        '<div class="ms55-card green"><small>EXPORTADAS HOY</small><b>'+Number(sum.exported_today||0)+'</b><span class="ms55-sub">una sola vez</span></div>'+
      '</div>'+
      '<div class="ms55-sec"><div class="ms55-title"><h3>Guías en corte listas para descargar</h3><span class="ms55-count">'+Number(sum.in_cut||0)+'</span></div>'+groups55(pending)+'</div>'+
      '<div class="ms55-sec"><div class="ms55-title"><h3>Confirmadas listas para el próximo corte</h3><span class="ms55-count">'+ready.length+'</span><div class="spacer"></div>'+(ready.length?'<button class="btn navy sm" onclick="createMassiveCutV55()">Crear corte con las listas</button>':'')+'</div>'+table55(ready,false)+'</div>'+
      (blocked.length?'<div class="ms55-sec"><div class="ms55-title"><h3>Bloqueadas antes de exportar</h3><span class="ms55-count">'+blocked.length+'</span></div>'+table55(blocked,false)+'</div>':'')+
      '<div class="ms55-sec"><div class="ms55-title"><h3>Guías exportadas masivamente</h3><span class="ms55-count">'+exported.length+'</span></div>'+table55(exported.slice(0,150),true)+'</div>'+ 
      (historical.length?'<div class="ms55-sec"><div class="ms55-title"><h3>Histórico anterior a v55 · revisión</h3><span class="ms55-count">'+historical.length+'</span></div><div class="ms55-empty">Estos pedidos pertenecen a archivos antiguos donde no existía trazabilidad fila por fila. No se reexportan automáticamente para evitar duplicados.</div>'+table55(historical,false)+'</div>':'');
    host.prepend(box);
    if(!data55&&!loading55)setTimeout(function(){load55(false)},20);
  }

  const base=window.renderCuts;
  if(typeof base==='function'&&!base.__massive55){
    const fn=function(){const r=base.apply(this,arguments);setTimeout(paint55,30);return r};
    fn.__massive55=true;window.renderCuts=fn;
  }
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-view="cuts"]'))setTimeout(function(){paint55();load55(false)},100);
  });
  setInterval(function(){if(window.currentView==='cuts')load55(true)},60000);
  console.info('INVICTO OPS v55 · MASSIVE por exportar / exportada una sola vez');
})();