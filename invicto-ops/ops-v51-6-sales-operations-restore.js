/* INVICTO OPS v51.6 · restaura operación completa en Ventas del día */
(function(){
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  let realtimeChannel=null;
  let refreshTimer=null;
  let pendingLiveRefresh=false;

  function drawerOpen(){
    const d=document.getElementById('orderDrawer');
    return !!(d && d.classList.contains('open'));
  }
  function styles(){
    if(document.getElementById('salesOpsV516Styles'))return;
    const s=document.createElement('style');s.id='salesOpsV516Styles';s.textContent=`
      .salesops516{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:13px 14px;border:1px solid #dfe4ea;border-radius:16px;background:linear-gradient(135deg,#071229 0%,#0d1e38 65%,#0d574e 140%);color:#fff;box-shadow:0 12px 30px rgba(7,18,41,.10)}
      .salesops516 .copy{min-width:240px;flex:1}.salesops516 .copy b{display:block;font-size:15px}.salesops516 .copy span{display:block;margin-top:2px;color:#bac6d9;font-size:11px}.salesops516 .steps{display:flex;gap:6px;flex-wrap:wrap}.salesops516 .step{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);padding:7px 9px;border-radius:999px;font-size:10px;font-weight:800;color:#e5edf8}.salesops516 .manual{border:0;background:#12d6b5;color:#04110f;border-radius:11px;padding:10px 14px;font-weight:900;cursor:pointer;white-space:nowrap}.salesops516 .manual:hover{filter:brightness(1.05)}
      .sales-live516{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;color:#067647;background:#ecfdf3;border:1px solid #abefc6;border-radius:999px;padding:5px 8px}.sales-live516 i{width:7px;height:7px;border-radius:50%;background:#12b76a;box-shadow:0 0 0 4px rgba(18,183,106,.10)}
      .sales-live516.wait{color:#b54708;background:#fffaeb;border-color:#fedf89}.sales-live516.wait i{background:#f79009}
      @media(max-width:760px){.salesops516{align-items:stretch}.salesops516 .manual{width:100%}}
    `;document.head.appendChild(s);
  }

  function manualButtonAllowed(){return typeof session!=='undefined'&&!!session}
  window.openManualSaleV516=function(){
    if(typeof newOrder==='function')return newOrder();
    if(typeof openOrderV20==='function')return openOrderV20(null);
    if(typeof openOrder==='function')return openOrder(null);
    if(typeof toast==='function')toast('No se pudo abrir la venta manual');
  };

  function injectOperations(){
    styles();const host=document.getElementById('view-sales');if(!host)return;
    host.querySelector('[data-salesops-v516]')?.remove();
    const hero=host.querySelector('.canon-hero-v51');
    const bar=document.createElement('div');bar.className='salesops516';bar.dataset.salesopsV516='1';
    bar.innerHTML=`<div class="copy"><b>Gestión completa de pedidos</b><span>El pedido conserva validación de datos con Google, referencias, confirmación de stock, bodega, estado y seguimiento.</span></div><div class="steps"><span class="step">✓ Datos / Google</span><span class="step">✓ Referencias</span><span class="step">✓ Stock</span><span class="step">✓ Bodega</span><span class="step">✓ Confirmación</span><span class="sales-live516 ${pendingLiveRefresh?'wait':''}"><i></i>${pendingLiveRefresh?'Nueva venta pendiente de refrescar':'ACTUALIZACIÓN EN VIVO'}</span></div>${manualButtonAllowed()?'<button class="manual" onclick="openManualSaleV516()">+ Nueva venta manual</button>':''}`;
    if(hero)hero.insertAdjacentElement('afterend',bar);else host.prepend(bar);
  }

  function wrapRenderer(){
    const base=window.renderSalesV51;
    if(typeof base!=='function'||base.__ops516)return;
    const wrapped=function(){const r=base.apply(this,arguments);setTimeout(injectOperations,0);return r};
    wrapped.__ops516=true;window.renderSalesV51=wrapped;
    if(window.renderSales===base)window.renderSales=wrapped;
  }

  async function liveRefresh(reason='realtime'){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(async()=>{
      try{
        await window.loadCanonicalV51?.(true);
        if(typeof hydrateOpsV13==='function')await hydrateOpsV13(true);
        if(typeof currentView!=='undefined'&&currentView==='sales'){
          if(drawerOpen()){
            pendingLiveRefresh=true;injectOperations();
          }else{
            pendingLiveRefresh=false;window.renderSalesV51?.();
          }
        }
        if(typeof currentView!=='undefined'&&currentView==='home'&&!drawerOpen())window.renderHomeV51?.();
        if(reason==='insert'&&typeof toast==='function')toast('Nueva venta recibida y asignaciones actualizadas');
      }catch(e){console.error('live sales refresh v51.6',e)}
    },300);
  }

  function installRealtime(){
    if(realtimeChannel||typeof invictoSupabaseV12==='undefined')return;
    try{
      realtimeChannel=invictoSupabaseV12.channel('ops-sales-live-v516')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'sales'},()=>liveRefresh('insert'))
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'sales'},()=>liveRefresh('update'))
        .subscribe();
    }catch(e){console.warn('Realtime ventas v51.6 no disponible',e)}
  }

  // Cuando se cierra un pedido, aplica cualquier venta que haya entrado sin destruir lo editado.
  const closeBase=window.closeOrder;
  if(typeof closeBase==='function'&&!closeBase.__ops516){
    const closeWrapped=function(){const r=closeBase.apply(this,arguments);if(pendingLiveRefresh){pendingLiveRefresh=false;setTimeout(()=>liveRefresh('close'),20)}return r};closeWrapped.__ops516=true;window.closeOrder=closeWrapped;
  }

  function verifyOperationalDrawer(){
    const d=document.getElementById('orderDrawer');if(!d||!d.classList.contains('open'))return;
    // Los módulos existentes insertan estas funciones/campos. Esto solo deja diagnóstico visible si algún módulo legado falla.
    const body=d.querySelector('.drawer-body');if(!body||body.querySelector('[data-opcheck-v516]'))return;
    const hasGoogle=typeof validateAddressV34==='function';
    const hasWarehouse=!!document.getElementById('fWarehouse')||!!body.querySelector('[name="warehouse"],select[id*="Warehouse"]');
    const hasStock=typeof confirmValidationV20==='function'||!!body.querySelector('[class*="stock"],[id*="stock" i]');
    if(hasGoogle&&hasWarehouse&&hasStock)return;
    const note=document.createElement('div');note.dataset.opcheckV516='1';note.className='warning';note.innerHTML=`<b>Diagnóstico operativo:</b> ${!hasGoogle?'validador Google ':''}${!hasStock?'confirmador de stock ':''}${!hasWarehouse?'selector de bodega ':''}no se cargó correctamente. Cierra el pedido y vuelve a abrirlo.`;body.prepend(note);
  }

  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="openOrder"],.sales-row-v20'))setTimeout(verifyOperationalDrawer,100)});
  wrapRenderer();installRealtime();setTimeout(()=>{wrapRenderer();installRealtime();if(typeof currentView!=='undefined'&&currentView==='sales')injectOperations()},250);
  console.info('INVICTO OPS v51.6 · ventas manuales + operación completa + realtime restaurados');
})();
