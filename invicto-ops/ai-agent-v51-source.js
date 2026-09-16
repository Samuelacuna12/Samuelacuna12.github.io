/* INVICTO OPS v51 · IA usa exactamente la misma fuente oficial de tareas */
(function(){
  function install(){
    if(typeof invictoSupabaseV12==='undefined'||!invictoSupabaseV12.functions||invictoSupabaseV12.functions.__v51Wrapped)return false;
    const base=invictoSupabaseV12.functions.invoke.bind(invictoSupabaseV12.functions);
    invictoSupabaseV12.functions.invoke=function(name,options){
      if(name==='invicto-ai-agent')name='invicto-ai-agent-v51';
      return base(name,options);
    };
    invictoSupabaseV12.functions.__v51Wrapped=true;
    console.info('INVICTO OPS v51 · IA conectada a fuente canónica');
    return true;
  }
  if(!install()){let n=0;const t=setInterval(()=>{if(install()||++n>40)clearInterval(t)},100)}
})();