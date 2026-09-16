/* INVICTO OPS v51.3 · restaura meta mensual azul del diseño original */
(function(){
  function n(v){return Number(v||0)}
  function fmt(v){return n(v).toLocaleString('es-CO')}
  function stats(){
    try{
      const g=typeof goalStatsV18==='function'?goalStatsV18():{};
      return {
        target:n(g.target),
        confirmed:n(g.confirmed??g.counted),
        pct:n(g.pct),
        remaining:n(g.remaining),
        required:n(g.required),
        projection:n(g.projection),
        elapsed:n(g.elapsed),
        totalDays:n(g.totalDays),
        document:n(g.document??g.confirmed??g.counted),
        shopify:n(g.shopify)
      };
    }catch(e){return {}}
  }
  function install(){
    if(document.getElementById('blueGoalV513Styles'))return;
    const s=document.createElement('style');
    s.id='blueGoalV513Styles';
    s.textContent=`
      .goal513{background:#fff;border:1px solid #e4e7ec;border-radius:18px;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 2px rgba(16,24,40,.03)}
      .goal513-head{display:flex;align-items:flex-start;gap:18px;padding:18px 20px 12px}.goal513-head h3{font-size:20px;margin:0 0 4px}.goal513-head p{margin:0;color:#667085;font-size:13px}.goal513-head .spacer{flex:1}
      .goal513-track{height:18px;margin:0 20px;background:#eaf1ff;border-radius:999px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(16,24,40,.08)}
      .goal513-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#0f5ee8 0%,#2176ff 55%,#45a2ff 100%);box-shadow:0 0 16px rgba(33,118,255,.28);transition:width .35s ease}
      .goal513-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;margin-top:16px;border-top:1px solid #edf0f5}.goal513-item{padding:15px 18px;border-right:1px solid #edf0f5}.goal513-item:last-child{border-right:0}.goal513-item small{display:block;color:#667085;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.goal513-item b{display:block;color:#101828;font-size:22px;margin-top:4px}.goal513-item span{display:block;color:#98a2b3;font-size:11px;margin-top:2px}
      .goal513-pct{font-size:28px;font-weight:900;color:#0f5ee8;line-height:1}.goal513-pct small{font-size:11px;color:#667085;display:block;margin-top:5px;text-align:right;font-weight:800;letter-spacing:.04em}
      @media(max-width:900px){.goal513-grid{grid-template-columns:repeat(2,1fr)}.goal513-item{border-bottom:1px solid #edf0f5}.goal513-head{flex-wrap:wrap}.goal513-pct{width:100%;text-align:left}.goal513-pct small{text-align:left}}
    `;
    document.head.appendChild(s);
  }
  window.goalPanelV18=function(){
    install();
    const g=stats();
    if(!g.target)return `<div class="goal513"><div class="goal513-head"><div><h3>Meta mensual</h3><p>Aún no hay una meta configurada.</p></div><div class="spacer"></div>${typeof isAdmin==='function'&&isAdmin()?'<button class="btn light sm" onclick="setMonthlyTargetV18()">Configurar meta</button>':''}</div></div>`;
    const pct=Math.max(0,Math.min(100,g.pct));
    return `<div class="goal513">
      <div class="goal513-head">
        <div><h3>Meta mensual · ${fmt(g.target)} ventas</h3><p><b>${fmt(g.confirmed)}</b> contabilizadas · faltan <b>${fmt(g.remaining)}</b> para cumplir la meta.</p></div>
        <div class="spacer"></div>
        <div class="goal513-pct">${n(g.pct).toFixed(1)}%<small>CUMPLIMIENTO</small></div>
        ${typeof isAdmin==='function'&&isAdmin()?'<button class="btn light sm" onclick="setMonthlyTargetV18()">Editar meta</button>':''}
      </div>
      <div class="goal513-track"><div class="goal513-fill" style="width:${pct}%"></div></div>
      <div class="goal513-grid">
        <div class="goal513-item"><small>Ventas contabilizadas</small><b>${fmt(g.confirmed)}</b><span>conteo oficial</span></div>
        <div class="goal513-item"><small>Faltan</small><b>${fmt(g.remaining)}</b><span>para llegar a la meta</span></div>
        <div class="goal513-item"><small>Necesarias / día</small><b>${fmt(g.required)}</b><span>Lun–Sáb restantes</span></div>
        <div class="goal513-item"><small>Proyección</small><b>${fmt(g.projection)}</b><span>al cierre del mes</span></div>
        <div class="goal513-item"><small>Días operativos</small><b>${fmt(g.elapsed)}/${fmt(g.totalDays)}</b><span>transcurridos</span></div>
      </div>
    </div>`;
  };
  install();
  setTimeout(()=>{try{if(typeof currentView!=='undefined'&&currentView==='home'&&typeof renderHomeV51==='function')renderHomeV51()}catch(e){}},200);
  console.info('INVICTO OPS v51.3 · barra azul de meta restaurada');
})();
