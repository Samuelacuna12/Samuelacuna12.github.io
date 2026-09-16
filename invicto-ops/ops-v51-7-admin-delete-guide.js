/* INVICTO OPS v51.7 · eliminación administrativa controlada + guía siempre visible */
(function(){
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  const admin=()=>typeof isAdmin==='function'&&isAdmin();
  const C=()=>window.opsCanonicalV51||{};
  const tasks=()=>Array.isArray(C().data?.tasks)?C().data.tasks:[];

  function styles(){
    if(document.getElementById('opsV517Styles'))return;
    const s=document.createElement('style');s.id='opsV517Styles';s.textContent=`
      .guide517{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:#ecfdf3;border:1px solid #abefc6;color:#067647;font-size:10px;font-weight:900;white-space:nowrap}.guide517.none{background:#f8fafc;border-color:#e4e7ec;color:#667085}.guide517 small{font-weight:700;opacity:.8}.delete517{border:1px solid #fecdca;background:#fff5f4;color:#b42318;border-radius:9px;padding:7px 9px;font-size:10px;font-weight:900;cursor:pointer;margin-left:5px}.delete517:hover{background:#fee4e2}.drawer-guide517{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #dfe4ea;background:#f8fafc;border-radius:13px;padding:11px 12px;margin-bottom:12px}.drawer-guide517 b{font-size:12px}.drawer-guide517 .spacer{flex:1}.drawer-delete517{border:1px solid #fecdca;background:#fff5f4;color:#b42318;border-radius:10px;padding:8px 10px;font-weight:900;cursor:pointer}
    `;document.head.appendChild(s);
  }

  async function filterDeleted(){
    if(typeof invictoSupabaseV12==='undefined'||typeof state==='undefined')return;
    try{
      const {data,error}=await invictoSupabaseV12.rpc('get_deleted_sale_ids_v517');if(error)throw error;
      const ids=new Set((Array.isArray(data)?data:[]).map(String));
      if(!ids.size)return;
      if(Array.isArray(state.sales))state.sales=state.sales.filter(x=>!ids.has(String(x.dbId||'')));
      if(Array.isArray(state.guarantees))state.guarantees=state.guarantees.filter(x=>!ids.has(String(x.dbSaleId||'')));
      if(Array.isArray(state.novelties))state.novelties=state.novelties.filter(x=>!ids.has(String(x.dbSaleId||'')));
    }catch(e){console.warn('filter deleted v51.7',e)}
  }

  const hydrateBase=window.hydrateOpsV13;
  if(typeof hydrateBase==='function'&&!hydrateBase.__v517){
    const wrapped=async function(force=false){const r=await hydrateBase(force);await filterDeleted();return r};wrapped.__v517=true;window.hydrateOpsV13=wrapped;
  }

  function taskById(id){return tasks().find(x=>String(x.task_id)===String(id))||null}
  function guideBadge(t){const g=String(t?.tracking_number||'').trim(),c=String(t?.carrier||'').trim();return g?`<span class="guide517">GUÍA ${E(g)}${c?` <small>· ${E(c)}</small>`:''}</span>`:'<span class="guide517 none">SIN GUÍA</span>'}

  function enhanceSalesTable(){
    styles();const host=document.getElementById('view-sales');if(!host)return;
    const table=[...host.querySelectorAll('table')].find(t=>/TAREA/.test(t.querySelector('thead')?.textContent||'')&&/ASESOR \/ CANAL/.test(t.querySelector('thead')?.textContent||''));
    if(!table)return;
    const hr=table.querySelector('thead tr');if(hr&&!hr.querySelector('[data-guide-v517]')){const th=document.createElement('th');th.dataset.guideV517='1';th.textContent='GUÍA';const cells=hr.children;hr.insertBefore(th,cells[Math.max(0,cells.length-2)]||null)}
    [...table.querySelectorAll('tbody tr')].forEach(tr=>{
      if(tr.dataset.v517==='1')return;
      const btn=tr.querySelector('button[onclick*="openCanonicalTaskV51"]');if(!btn){const td=tr.querySelector('td[colspan]');if(td)td.colSpan=8;return}
      const m=(btn.getAttribute('onclick')||'').match(/openCanonicalTaskV51\('([^']+)'\)/);if(!m)return;
      const t=taskById(m[1]);if(!t)return;
      const cells=tr.children;const td=document.createElement('td');td.innerHTML=guideBadge(t);tr.insertBefore(td,cells[Math.max(0,cells.length-2)]||null);
      const action=tr.lastElementChild;
      if(admin()&&['venta','borrador'].includes(String(t.category))&&action&&!action.querySelector('.delete517'))action.insertAdjacentHTML('beforeend',`<button class="delete517" onclick="event.stopPropagation();deleteSaleV517('${E(t.task_id)}')">Eliminar</button>`);
      tr.dataset.v517='1';
    });
  }

  window.deleteSaleV517=async function(taskId){
    if(!admin())return typeof toast==='function'&&toast('Solo administración puede eliminar ventas');
    const t=taskById(taskId);if(!t?.sale_id)return typeof toast==='function'&&toast('No encontré la venta');
    const reason=prompt(`Motivo para eliminar ${t.reference||'esta venta'}:`,'Venta creada por error');if(reason===null)return;if(!reason.trim())return typeof toast==='function'&&toast('Debes indicar el motivo');
    if(!confirm(`¿Eliminar ${t.reference||'esta venta'} de la operación?\n\nNo se borra el historial de auditoría. Se retirará de estadísticas, tareas y reservas de stock.`))return;
    try{
      const {data,error}=await invictoSupabaseV12.rpc('admin_soft_delete_sale_v517',{p_sale_id:t.sale_id,p_reason:reason.trim()});if(error)throw error;
      await filterDeleted();await window.loadCanonicalV51?.(true);if(typeof window.hydrateOpsV13==='function')await window.hydrateOpsV13(true);
      if(typeof currentView!=='undefined'&&currentView==='sales')window.renderSalesV51?.();if(typeof currentView!=='undefined'&&currentView==='home')window.renderHomeV51?.();
      if(typeof toast==='function')toast(`Venta eliminada de la operación${Number(data?.released_units||0)?` · ${data.released_units} unidades liberadas`:''}`);
    }catch(e){console.error(e);if(typeof toast==='function')toast('No se pudo eliminar: '+(e.message||e))}
  };

  function decorateDrawer(s){
    styles();const d=document.getElementById('orderDrawer');const body=d?.querySelector('.drawer-body');if(!body||body.querySelector('[data-guide-drawer-v517]')||!s)return;
    const g=String(s.guide||s.manualGuideNumber||'').trim(),c=String(s.carrier||s.manualGuideCarrier||'').trim();
    const box=document.createElement('div');box.className='drawer-guide517';box.dataset.guideDrawerV517='1';box.innerHTML=`<b>Despacho / guía</b>${guideBadge({tracking_number:g,carrier:c})}<div class="spacer"></div>${admin()?`<button class="drawer-delete517" onclick="deleteOpenSaleV517('${E(s.dbId||'')}')">Eliminar venta</button>`:''}`;body.prepend(box);
  }

  window.deleteOpenSaleV517=async function(dbId){
    if(!admin()||!dbId)return;
    const t=tasks().find(x=>String(x.sale_id)===String(dbId))||{task_id:String(dbId),sale_id:String(dbId),reference:(state.sales||[]).find(s=>String(s.dbId)===String(dbId))?.id||'Venta'};
    const reason=prompt(`Motivo para eliminar ${t.reference||'esta venta'}:`,'Venta creada por error');if(reason===null||!reason.trim())return;
    if(!confirm('¿Eliminar esta venta de la operación? Se conservará auditoría y se liberará cualquier reserva de stock.'))return;
    try{const {data,error}=await invictoSupabaseV12.rpc('admin_soft_delete_sale_v517',{p_sale_id:t.sale_id,p_reason:reason.trim()});if(error)throw error;window.closeOrder?.();await filterDeleted();await window.loadCanonicalV51?.(true);await window.hydrateOpsV13?.(true);window.renderSalesV51?.();if(typeof toast==='function')toast(`Venta eliminada${Number(data?.released_units||0)?` · ${data.released_units} unidades liberadas`:''}`)}catch(e){console.error(e);if(typeof toast==='function')toast('No se pudo eliminar: '+(e.message||e))}
  };

  const openBase=window.openOrderV20||window.openOrder;
  if(typeof openBase==='function'&&!openBase.__v517){
    const wrapped=function(id){const r=openBase.apply(this,arguments);if(id)setTimeout(()=>{const s=(state.sales||[]).find(x=>String(x.id)===String(id)||String(x.dbId)===String(id));decorateDrawer(s)},80);return r};wrapped.__v517=true;window.openOrderV20=wrapped;window.openOrder=wrapped;
  }

  function wrapSales(){const base=window.renderSalesV51;if(typeof base!=='function'||base.__v517)return;const wrapped=function(){const r=base.apply(this,arguments);setTimeout(enhanceSalesTable,0);return r};wrapped.__v517=true;window.renderSalesV51=wrapped;if(window.renderSales===base)window.renderSales=wrapped}
  wrapSales();setTimeout(()=>{wrapSales();filterDeleted();if(typeof currentView!=='undefined'&&currentView==='sales')enhanceSalesTable()},250);
  console.info('INVICTO OPS v51.7 · eliminación admin + guía persistente visible');
})();
