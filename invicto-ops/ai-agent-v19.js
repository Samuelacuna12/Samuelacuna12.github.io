/* INVICTO OPS v19 · agente conversacional real */
let aiMessagesV19=[];
let aiHistoryLoadedV19=false;
let aiBusyV19=false;
let aiConfiguredV19=null;
let aiModelV19='';

function aiTextV19(v=''){return esc(String(v||'')).replace(/\n/g,'<br>')}
function aiOrderButtonsV19(text=''){const ids=[...new Set((String(text).match(/#D?\d+/gi)||[]).map(x=>x.toUpperCase()))].filter(id=>state.sales.some(s=>String(s.id).toUpperCase()===id)).slice(0,5);return ids.length?`<div class="ai-order-actions">${ids.map(id=>`<button class="btn light sm" onclick="aiOpenOrderV19('${id}')">Abrir ${esc(id)}</button>`).join('')}</div>`:''}
function aiMessageHtmlV19(m){return `<div class="ai-chat-row ${m.role==='user'?'user':'assistant'}"><div class="ai-chat-bubble"><div class="ai-chat-role">${m.role==='user'?'TÚ':'INVICTO I.A.'}</div><div>${aiTextV19(m.content)}</div>${m.role==='assistant'?aiOrderButtonsV19(m.content):''}</div></div>`}

window.renderAI=function(){
  const p=el('aiPanel');if(!p)return;const alerts=(typeof buildAlerts==='function'?buildAlerts():[]),red=alerts.filter(a=>a.level==='red').length;
  p.classList.add('ai-agent-panel');
  p.innerHTML=`<div class="ai-head ai-agent-head"><span class="planet" style="width:27px;height:27px;border-width:4px"></span><div><b>INVICTO I.A.</b><small>${aiConfiguredV19===false?'FALTA API KEY':aiBusyV19?'PENSANDO…':aiHistoryLoadedV19?'AGENTE EN VIVO':'CONECTANDO…'}${aiModelV19?` · ${esc(aiModelV19)}`:''}</small></div><div class="spacer"></div>${red?`<span class="tag red">${red} críticas</span>`:''}<button class="close" onclick="toggleAI()">×</button></div>
  <div class="ai-agent-status ${aiConfiguredV19===false?'warning':'live'}">${aiConfiguredV19===false?'El panel ya está instalado. Falta configurar OPENAI_API_KEY en Supabase para activar el razonamiento.':'El agente consulta ventas, borradores, stock, recuperación, logística, garantías, novedades y metas directamente desde Supabase.'}</div>
  <div class="ai-quick-prompts"><button onclick="aiAskQuickV19('¿Qué debo atender primero ahora mismo?')">Prioridades</button><button onclick="aiAskQuickV19('¿Cómo vamos hoy en ventas y confirmación?')">Cómo vamos hoy</button><button onclick="aiAskQuickV19('¿Qué inventario está crítico o agotado?')">Stock crítico</button><button onclick="aiAskQuickV19('¿Qué bloqueos operativos tenemos ahora?')">Bloqueos</button></div>
  <div id="aiChatBodyV19" class="ai-chat-body">${aiMessagesV19.length?aiMessagesV19.map(aiMessageHtmlV19).join(''):`<div class="ai-empty-v19"><b>Soy el agente operativo de INVICTO OPS.</b><br>Puedes preguntarme por prioridades, un pedido como #15904, inventario, desempeño, garantías o logística.</div>`}${aiBusyV19?'<div class="ai-chat-row assistant"><div class="ai-chat-bubble typing">Analizando la operación en vivo…</div></div>':''}</div>
  <form class="ai-compose-v19" onsubmit="sendInvictoAIV19(event)"><textarea id="aiInputV19" rows="2" placeholder="Ej. ¿Qué ventas están atrasadas y qué debería hacer primero?" ${aiBusyV19?'disabled':''}></textarea><button class="btn cyan" type="submit" ${aiBusyV19||aiConfiguredV19===false?'disabled':''}>Enviar</button></form>`;
  requestAnimationFrame(()=>{const b=document.getElementById('aiChatBodyV19');if(b)b.scrollTop=b.scrollHeight});
};

async function loadAIHistoryV19(){
  if(aiHistoryLoadedV19||aiBusyV19)return;aiBusyV19=true;renderAI();
  try{const {data,error}=await invictoSupabaseV12.functions.invoke('invicto-ai-agent',{body:{action:'history'}});if(error)throw error;aiMessagesV19=(data?.messages||[]).map(x=>({role:x.role,content:x.content,created_at:x.created_at}));aiConfiguredV19=!!data?.configured;aiModelV19=data?.model||'';aiHistoryLoadedV19=true}
  catch(e){console.error('AI history',e);aiConfiguredV19=null;aiHistoryLoadedV19=true;aiMessagesV19.push({role:'assistant',content:'No pude conectar con el agente en este momento. Revisa la conexión e inténtalo de nuevo.'})}
  finally{aiBusyV19=false;renderAI()}
}

window.toggleAI=function(){const p=el('aiPanel');if(!p)return;p.classList.toggle('open');if(p.classList.contains('open')){renderAI();loadAIHistoryV19();setTimeout(()=>document.getElementById('aiInputV19')?.focus(),80)}};
window.aiAskQuickV19=function(text){const p=el('aiPanel');if(!p?.classList.contains('open'))toggleAI();const input=document.getElementById('aiInputV19');if(input){input.value=text;input.focus()}if(aiConfiguredV19!==false)sendInvictoAIV19(new Event('submit',{cancelable:true}))};
window.aiOpenOrderV19=function(id){const sale=state.sales.find(s=>String(s.id).toUpperCase()===String(id).toUpperCase());if(!sale)return toast('Pedido no encontrado');if(currentView!=='sales')switchView('sales');openOrder(sale.id);el('aiPanel')?.classList.remove('open')};

window.sendInvictoAIV19=async function(ev){
  ev?.preventDefault?.();if(aiBusyV19||aiConfiguredV19===false)return;const input=document.getElementById('aiInputV19'),message=String(input?.value||'').trim();if(!message)return;
  if(input)input.value='';aiMessagesV19.push({role:'user',content:message,created_at:new Date().toISOString()});aiBusyV19=true;renderAI();
  try{
    const {data,error}=await invictoSupabaseV12.functions.invoke('invicto-ai-agent',{body:{message}});if(error)throw error;
    if(!data?.ok){if(data?.error==='openai_not_configured'){aiConfiguredV19=false;throw new Error(data?.message||'Falta configurar la API de OpenAI')}throw new Error(data?.message||data?.error||'El agente no respondió')}
    aiConfiguredV19=true;aiModelV19=data.model||aiModelV19;aiMessagesV19.push({role:'assistant',content:data.answer||'Sin respuesta.',created_at:new Date().toISOString()});
  }catch(e){console.error('INVICTO AI',e);aiMessagesV19.push({role:'assistant',content:`No pude completar esa consulta: ${e?.message||e}`})}
  finally{aiBusyV19=false;renderAI()}
};

// El antiguo panel de reglas queda como fuente determinística del agente, no como interfaz principal.
renderAI();
