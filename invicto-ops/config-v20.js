/* INVICTO OPS v20 · estado de integraciones y configuración productiva */
async function integrationStatusV20(){
  const out={logiCities:0,webhooks:0,webhookErrors:0,exports:0};
  try{
    const [a,b,c]=await Promise.all([
      invictoSupabaseV12.from('logigho_city_codes').select('label',{count:'exact',head:true}),
      invictoSupabaseV12.from('dispatch_exports').select('id',{count:'exact',head:true}),
      invictoSupabaseV12.from('monthly_targets').select('month_start,target_confirmed_sales').order('month_start',{ascending:false}).limit(1)
    ]);
    out.logiCities=a.count||0;out.exports=b.count||0;out.target=c.data?.[0]?.target_confirmed_sales||0;
  }catch(e){console.warn(e)}
  return out;
}
function integrationCardV20(title,status,detail,cls='green'){return `<div class="card"><small>${esc(title)}</small><b style="font-size:17px">${esc(status)}</b><div class="sub">${esc(detail)}</div><div style="margin-top:8px"><span class="tag ${cls}">${esc(status)}</span></div></div>`}
window.renderConfig=async function(){
  if(!isAdmin()){el('view-config').innerHTML='<div class="page-title"><div><h1>Sin acceso</h1><p>Esta sección está reservada a administración y gerencia.</p></div></div>';return}
  const host=el('view-config');host.innerHTML='<div class="page-title"><div><h1>Configuración e integraciones</h1><p>Estado productivo de INVICTO OPS.</p></div><span class="tag blue">Consultando…</span></div>';
  const st=await integrationStatusV20();const aiStatus=aiConfiguredV19===true?'ACTIVA':aiConfiguredV19===false?'FALTA API KEY':'POR VERIFICAR';const aiCls=aiConfiguredV19===true?'green':aiConfiguredV19===false?'red':'amber';
  const sellers=(state.profiles||[]).filter(p=>p.active&&p.role==='vendedor');
  host.innerHTML=`<div class="page-title"><div><h1>Configuración e integraciones</h1><p>Esta pantalla reemplaza la antigua configuración de prueba local.</p></div><span class="tag green">PRODUCCIÓN</span></div>
  <div class="cards" style="grid-template-columns:repeat(3,minmax(170px,1fr))">
    ${integrationCardV20('Supabase','CONECTADO','Base de datos, Auth, RLS y Realtime','green')}
    ${integrationCardV20('Shopify','EN VIVO','Pedidos + borradores + cancelaciones','green')}
    ${integrationCardV20('INVICTO I.A.',aiStatus,aiConfiguredV19===true?'Agente conversacional con datos en vivo':'Necesita OPENAI_API_KEY en Secrets',aiCls)}
    ${integrationCardV20('MASSIVE Hoko','LISTO','Hasta 15 líneas exactas por archivo','green')}
    ${integrationCardV20('MASSIVE LogiGho',st.logiCities?'LISTO':'CATÁLOGO PENDIENTE',st.logiCities?`${st.logiCities} códigos de destino cargados`:'Carga una vez la plantilla LogiGho en Cortes',st.logiCities?'green':'amber')}
    ${integrationCardV20('Hoko API','PENDIENTE','Requiere documentación/endpoints oficiales de Hoko','amber')}
  </div>
  <div class="grid-equal" style="margin-top:14px">
    <div class="panel"><div class="panel-head"><h3>Equipo operativo</h3></div><div class="panel-body">${(state.profiles||[]).filter(p=>p.active).map(p=>`<div class="statline"><span>${esc(p.full_name)}</span><b>${esc(roleLabelV12(p.role))}${p.can_receive_sales?' · RECIBE VENTAS':''}</b></div>`).join('')||'<div class="muted">Sin perfiles.</div>'}</div></div>
    <div class="panel"><div class="panel-head"><h3>Reglas principales</h3></div><div class="panel-body"><div class="statline"><span>Horario SLA</span><b>Lun–Sáb 08:00–18:00</b></div><div class="statline"><span>Alerta venta</span><b>5 min amarilla / 10 min roja</b></div><div class="statline"><span>Cortes sugeridos</span><b>11:00 / 17:00</b></div><div class="statline"><span>Reserva de stock</span><b>Al confirmar</b></div><div class="statline"><span>Meta mensual actual</span><b>${Number(st.target||0).toLocaleString('es-CO')}</b></div></div></div>
  </div>
  <div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Arquitectura activa</h3></div><div class="panel-body"><p class="muted" style="line-height:1.6;margin:0">Shopify → Webhooks firmados → Supabase Edge Functions → PostgreSQL/RLS → INVICTO OPS. Inventario, reservas, recuperación, cortes, logística, garantías, novedades y KPIs usan la misma base compartida. Las credenciales privadas permanecen del lado servidor.</p></div></div>`;
};
