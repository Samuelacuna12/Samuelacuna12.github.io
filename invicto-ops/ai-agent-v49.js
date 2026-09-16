/* INVICTO OPS v49 · chat IA privado, efímero por apertura y sin historial viejo */
(function(){
  let conversationV49=null;
  let sessionOwnerV49=null;
  let sessionInfoLoadingV49=false;

  function uuidV49(){
    try{return crypto.randomUUID()}catch(e){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16)})}
  }
  function userIdV49(){return typeof session!=='undefined'&&session?String(session.id||''):''}
  function panelV49(){return document.getElementById('aiPanel')}
  function openedV49(){return !!panelV49()?.classList.contains('open')}

  function beginConversationV49(render=true){
    conversationV49=uuidV49();
    sessionOwnerV49=userIdV49();
    aiMessagesV19=[];
    aiHistoryLoadedV19=true;
    aiBusyV19=false;
    if(render&&typeof window.renderAI==='function')window.renderAI();
    return conversationV49;
  }

  async function loadSessionInfoV49(){
    if(sessionInfoLoadingV49||typeof invictoSupabaseV12==='undefined')return;
    sessionInfoLoadingV49=true;
    try{
      const {data,error}=await invictoSupabaseV12.functions.invoke('invicto-ai-agent',{body:{action:'session',conversation_id:conversationV49}});
      if(error)throw error;
      aiConfiguredV19=!!data?.configured;
      aiModelV19=data?.model||aiModelV19||'';
    }catch(e){console.error('AI session v49',e);}
    finally{sessionInfoLoadingV49=false;if(openedV49()&&typeof window.renderAI==='function')window.renderAI();}
  }

  const renderBaseV49=window.renderAI;
  window.renderAI=function(){
    if(typeof renderBaseV49==='function')renderBaseV49();
    const p=panelV49();if(!p)return;
    const top=p.querySelector('.ai-chat-top-v20');
    if(top){
      const span=top.querySelector('span');if(span)span.textContent='Privado · empieza de cero cada vez que lo abres · datos en vivo';
      if(!top.querySelector('[data-ai-new-v49]')){
        const b=document.createElement('button');b.type='button';b.className='btn light sm';b.dataset.aiNewV49='1';b.textContent='Nuevo chat';b.onclick=()=>window.resetInvictoAIV49();top.appendChild(b);
      }
    }
    const status=p.querySelector('.ai-agent-head-v20 small');
    if(status&&!aiBusyV19)status.textContent=`CHAT PRIVADO · DATOS EN VIVO${aiModelV19?' · '+aiModelV19:''}`;
    const empty=p.querySelector('.ai-empty-v20');
    if(empty&&!aiMessagesV19.length)empty.innerHTML='<b>Conversación nueva.</b> No cargué mensajes anteriores. Pregúntame por la operación actual, una venta, guía, stock, recuperación o prioridades.';
  };

  window.resetInvictoAIV49=function(){
    beginConversationV49(true);
    loadSessionInfoV49();
    setTimeout(()=>document.getElementById('aiInputV19')?.focus(),40);
  };

  window.loadAIHistoryV19=async function(){
    if(!conversationV49||sessionOwnerV49!==userIdV49())beginConversationV49(false);
    aiHistoryLoadedV19=true;
    await loadSessionInfoV49();
    return true;
  };

  window.toggleAI=function(){
    const p=panelV49();if(!p)return;
    const opening=!p.classList.contains('open');
    if(opening){
      p.classList.add('open');
      beginConversationV49(false);
      window.renderAI();
      loadSessionInfoV49();
      setTimeout(()=>document.getElementById('aiInputV19')?.focus(),100);
    }else{
      p.classList.remove('open');
      aiMessagesV19=[];
      conversationV49=null;
      sessionOwnerV49=null;
      aiBusyV19=false;
      aiHistoryLoadedV19=true;
      window.renderAI();
    }
  };

  window.aiAskQuickV19=async function(text){
    const p=panelV49();if(!p)return;
    if(!p.classList.contains('open'))window.toggleAI();
    if(!conversationV49||sessionOwnerV49!==userIdV49())beginConversationV49(false);
    const input=document.getElementById('aiInputV19');if(!input)return;
    input.value=text;
    await window.sendInvictoAIV19({preventDefault(){}});
  };

  window.sendInvictoAIV19=async function(ev){
    ev?.preventDefault?.();
    if(aiBusyV19||aiConfiguredV19===false)return;
    if(!conversationV49||sessionOwnerV49!==userIdV49())beginConversationV49(false);
    const input=document.getElementById('aiInputV19'),message=String(input?.value||'').trim();if(!message)return;
    if(input)input.value='';
    aiMessagesV19.push({role:'user',content:message,created_at:new Date().toISOString()});
    aiBusyV19=true;window.renderAI();
    try{
      const {data,error}=await invictoSupabaseV12.functions.invoke('invicto-ai-agent',{body:{message,conversation_id:conversationV49}});
      if(error)throw error;
      if(!data?.ok){
        if(data?.error==='openai_not_configured'){aiConfiguredV19=false;throw new Error(data?.message||'Falta configurar la API de OpenAI')}
        throw new Error(data?.message||data?.error||'El agente no respondió');
      }
      aiConfiguredV19=true;
      aiModelV19=data.model||aiModelV19;
      if(data.conversation_id)conversationV49=data.conversation_id;
      aiMessagesV19.push({role:'assistant',content:data.answer||'Sin respuesta.',created_at:new Date().toISOString()});
    }catch(e){
      console.error('INVICTO AI v49',e);
      aiMessagesV19.push({role:'assistant',content:`No pude completar esa consulta: ${e?.message||e}`});
    }finally{aiBusyV19=false;window.renderAI();}
  };

  // Nunca reutilizar mensajes que hayan quedado en memoria al cambiar de usuario.
  setInterval(()=>{
    const uid=userIdV49();
    if(sessionOwnerV49&&uid&&sessionOwnerV49!==uid){aiMessagesV19=[];conversationV49=null;sessionOwnerV49=null;aiBusyV19=false;aiHistoryLoadedV19=true;if(openedV49())beginConversationV49(true)}
  },1500);

  aiMessagesV19=[];
  aiHistoryLoadedV19=true;
  console.info('INVICTO OPS v49 · IA privada y conversación fresca activa');
})();
