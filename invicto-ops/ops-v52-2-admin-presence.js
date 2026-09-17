/* INVICTO OPS v52.2 · presencia solo administracion + control de redistribucion */
(function(){
  function hideAdvisorPresence(){
    const styleId='opsV522PresenceStyle';
    if(!document.getElementById(styleId)){
      const s=document.createElement('style');
      s.id=styleId;
      s.textContent='#presenceV46{display:none!important}';
      document.head.appendChild(s);
    }
    document.getElementById('presenceV46')?.remove();
  }

  // Aunque un asesor intente invocar la funcion desde consola, el backend v52.2 tambien lo bloquea.
  window.togglePresenceV46=function(){
    if(typeof toast==='function')toast('Solo administración puede activar o pausar asesores.');
    hideAdvisorPresence();
  };

  const baseShell=window.renderShell;
  if(typeof baseShell==='function'&&!baseShell.__v522){
    const wrapped=function(){const r=baseShell.apply(this,arguments);setTimeout(hideAdvisorPresence,0);setTimeout(hideAdvisorPresence,300);return r};
    wrapped.__v522=true;
    window.renderShell=wrapped;
  }

  hideAdvisorPresence();
  setTimeout(hideAdvisorPresence,300);
  setTimeout(hideAdvisorPresence,1200);
  console.info('INVICTO OPS v52.2 · presencia de asesores controlada exclusivamente por administración');
})();
