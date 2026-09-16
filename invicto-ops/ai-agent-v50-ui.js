/* INVICTO OPS v50 · presentación del chat IA tipo mensajería */
(function(){
  const baseV50=window.renderAI;
  window.renderAI=function(){
    if(typeof baseV50==='function')baseV50();
    const p=document.getElementById('aiPanel');if(!p)return;
    p.classList.add('ai-v50');
    const side=p.querySelector('.ai-side-v20');
    if(side&&!side.querySelector('.ai-v50-profile')){
      const name=session?.name||'Usuario';
      const role=session?.role||'';
      const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'IA';
      side.insertAdjacentHTML('afterbegin',`<div class="ai-v50-profile"><div class="ai-v50-avatar">${esc(initials)}</div><div><b>${esc(name)}</b><small>${esc(role)} · chat privado</small></div></div>`);
    }
    const top=p.querySelector('.ai-chat-top-v20');
    if(top){const b=top.querySelector('b');if(b)b.textContent='INVICTO I.A. · conversación privada';}
    const empty=p.querySelector('.ai-empty-v20');
    if(empty&&!aiMessagesV19.length)empty.innerHTML='<b>¿Qué necesitas revisar?</b>Esta conversación empieza desde cero. Los datos operativos se consultan nuevamente en cada pregunta.';
  };
  if(typeof window.renderAI==='function')window.renderAI();
  console.info('INVICTO OPS v50 · chat visual actualizado');
})();
