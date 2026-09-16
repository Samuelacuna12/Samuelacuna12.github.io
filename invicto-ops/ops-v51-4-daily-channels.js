/* INVICTO OPS v51.4 · desglose diario por canal en Inicio */
(function(){
  const N=v=>Number(v||0);
  const E=v=>typeof esc==='function'?esc(v??''):String(v??'');
  function canonical(){return window.opsCanonicalV51||{}}
  function data(){return canonical().data||{}}
  function rows(){return Array.isArray(data().channel_breakdown)?data().channel_breakdown:[]}
  function map(){const out={};for(const r of rows())out[String(r.canal||'Sin canal')]={total:N(r.total),confirmadas:N(r.confirmadas),canceladas:N(r.canceladas)};return out}
  function styles(){if(document.getElementById('dailyChannelsV514Styles'))return;const s=document.createElement('style');s.id='dailyChannelsV514Styles';s.textContent=`
    .channels514{margin-top:14px}.channels514-head{display:flex;align-items:flex-end;gap:12px;margin-bottom:10px}.channels514-head h2{margin:0}.channels514-head p{margin:3px 0 0;color:#667085;font-size:13px}.channels514-head .spacer{flex:1}.channels514-date{font-size:12px;color:#667085;font-weight:700}
    .channels514-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}.channels514-card{background:#fff;border:1px solid #dfe3ea;border-radius:16px;padding:14px;min-width:0}.channels514-card small{display:block;font-size:10px;font-weight:900;letter-spacing:.06em;color:#667085;text-transform:uppercase}.channels514-card b{display:block;font-size:30px;line-height:1.1;margin:5px 0;color:#101828}.channels514-card span{font-size:11px;color:#98a2b3}.channels514-total{background:#071229;border-color:#071229}.channels514-total small,.channels514-total span{color:#cbd5e1}.channels514-total b{color:white}.channels514-other{background:#f8fafc}
    @media(max-width:1200px){.channels514-grid{grid-template-columns:repeat(4,1fr)}}@media(max-width:760px){.channels514-grid{grid-template-columns:repeat(2,1fr)}.channels514-total{grid-column:1/-1}}
  `;document.head.appendChild(s)}
  function card(label,obj,cls=''){return `<div class="channels514-card ${cls}"><small>${E(label)}</small><b>${N(obj?.total)}</b><span>${N(obj?.confirmadas)} confirmadas${N(obj?.canceladas)?` · ${N(obj.canceladas)} canceladas`:''}</span></div>`}
  function setHomeDailyCards(total,drafts,confirmed){
    const cards=document.querySelectorAll('#view-home .home512-daily .card');
    const values=[total,Math.max(0,total-drafts),drafts,confirmed,total?((confirmed/total)*100).toFixed(1)+'%':'0.0%'];
    values.forEach((v,i)=>{const b=cards[i]?.querySelector('b');if(b)b.textContent=String(v)});
  }
  function inject(){
    styles();const host=document.getElementById('view-home');if(!host)return;
    host.querySelector('[data-daily-channels-v514]')?.remove();
    const m=map(),primary=['Shopify','WhatsApp','Borradores','Recuperación','Bot'];
    const others=rows().filter(r=>!primary.includes(String(r.canal))).reduce((a,r)=>({total:a.total+N(r.total),confirmadas:a.confirmadas+N(r.confirmadas),canceladas:a.canceladas+N(r.canceladas)}),{total:0,confirmadas:0,canceladas:0});
    const total=N(data()?.totals?.total_recibidas_hoy ?? rows().reduce((a,r)=>a+N(r.total),0));
    const totalConfirmed=rows().reduce((a,r)=>a+N(r.confirmadas),0), totalCancelled=rows().reduce((a,r)=>a+N(r.canceladas),0), drafts=N(m.Borradores?.total);
    setHomeDailyCards(total,drafts,totalConfirmed);
    const wrap=document.createElement('section');wrap.className='channels514';wrap.dataset.dailyChannelsV514='1';wrap.innerHTML=`<div class="channels514-head"><div><h2>Origen de las ventas de hoy</h2><p>Entradas reales del día, sin duplicados. Se reinicia automáticamente a las 00:00 hora Colombia y aumenta con cada venta nueva.</p></div><div class="spacer"></div><div class="channels514-date">${E(data().business_date||'')}</div></div><div class="channels514-grid">${card('Shopify',m.Shopify)}${card('WhatsApp',m.WhatsApp)}${card('Borradores',m.Borradores)}${card('Recuperación',m['Recuperación'])}${card('Bot',m.Bot)}${card('Otros',others,'channels514-other')}${card('TOTAL DEL DÍA',{total,confirmadas:totalConfirmed,canceladas:totalCancelled},'channels514-total')}</div>`;
    const sections=host.querySelectorAll('.home512-section');const anchor=sections[0];if(anchor)anchor.insertAdjacentElement('afterend',wrap);else host.appendChild(wrap);
    const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión 51.4');
  }
  const base=window.renderHomeV51||window.renderHome;
  if(typeof base==='function'){
    window.renderHomeV51=function(){const r=base.apply(this,arguments);setTimeout(inject,0);return r};
    window.renderHome=window.renderHomeV51;
  }
  const refresh=window.refreshCanonicalV51;
  if(typeof refresh==='function')window.refreshCanonicalV51=async function(){const r=await refresh.apply(this,arguments);setTimeout(inject,0);return r};
  setTimeout(()=>{if(typeof currentView!=='undefined'&&currentView==='home'){try{window.renderHomeV51?.()}catch(e){inject()}}},200);
  console.info('INVICTO OPS v51.4 · canales diarios canónicos activos');
})();