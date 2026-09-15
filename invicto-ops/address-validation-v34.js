/* INVICTO OPS v34.1 · validación manual de dirección con diagnóstico visible */
(function(){
  const STATE={lastKey:'',busy:false,result:null};

  function esc34(v=''){return typeof esc==='function'?esc(v):String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function fields34(){return {address:document.getElementById('fAddress'),city:document.getElementById('fCity'),department:document.getElementById('fDepartment')}}
  function values34(){const f=fields34();return {address:(f.address?.value||'').trim(),city:(f.city?.value||'').trim(),department:(f.department?.value||'').trim()}}
  function key34(v){return [v.address,v.city,v.department].map(x=>String(x||'').trim().toLowerCase()).join('|')}
  function host34(){return document.getElementById('addressValidationV34')}

  function render34(status='idle',data=null){
    const h=host34();if(!h)return;
    if(status==='busy'){
      h.innerHTML='<span class="tag blue">VALIDANDO…</span><span class="muted">Consultando Google</span>';return;
    }
    if(status==='valid'){
      h.innerHTML='<span class="tag green">✓ DIRECCIÓN VALIDADA</span><span class="muted">Google confirmó la dirección con la ciudad.</span>';return;
    }
    if(status==='review'){
      const suggestion=data?.formattedAddress?`<div class="muted" style="margin-top:5px">Google sugiere: <b>${esc34(data.formattedAddress)}</b></div>`:'';
      h.innerHTML=`<span class="tag amber">⚠ REVISAR DIRECCIÓN</span><span class="muted">Google no pudo confirmarla completamente.</span>${suggestion}`;return;
    }
    if(status==='error'){
      const msg=esc34(data?.message||'No fue posible consultar Google.');
      h.innerHTML=`<span class="tag red">ERROR DE VALIDACIÓN</span><span class="muted">${msg}</span>`;return;
    }
    h.innerHTML='<span class="muted">Completa dirección, ciudad y departamento y pulsa “Validar dirección”.</span>';
  }

  async function validate34(){
    const v=values34(),k=key34(v);
    if(!v.address||!v.city){render34('idle');return null}
    if(STATE.busy)return null;
    STATE.busy=true;render34('busy');
    try{
      const {data,error}=await invictoSupabaseV12.functions.invoke('validate-address',{body:v});
      if(error){
        const detail=error?.context?.body?.message||error?.message||'No fue posible invocar el servicio de validación.';
        throw new Error(detail);
      }
      STATE.lastKey=k;STATE.result=data||{};
      render34(data?.valid?'valid':(data?.status==='service_error'?'error':'review'),data);
      return data;
    }catch(e){
      console.error('Address validation v34.1',e);
      STATE.result=null;
      render34('error',{message:e?.message||String(e)});
      return null;
    }finally{STATE.busy=false}
  }

  function markDirty34(){STATE.result=null;STATE.lastKey='';render34('idle')}

  function install34(){
    const f=fields34();if(!f.address||!f.city)return;
    if(document.getElementById('addressValidationV34'))return;

    const wrap=document.createElement('div');
    wrap.className='field span2';
    wrap.innerHTML='<label>Validación de dirección</label><div id="addressValidationV34" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="muted">Completa dirección, ciudad y departamento y pulsa “Validar dirección”.</span></div><div style="margin-top:8px"><button type="button" class="btn light sm" id="addressValidateBtnV34">Validar dirección</button></div>';

    const addressField=f.address.closest('.field');
    if(addressField&&addressField.parentElement)addressField.insertAdjacentElement('afterend',wrap);
    else f.address.insertAdjacentElement('afterend',wrap);

    document.getElementById('addressValidateBtnV34')?.addEventListener('click',validate34);
    [f.address,f.city,f.department].filter(Boolean).forEach(x=>{
      x.addEventListener('input',markDirty34);
      x.addEventListener('change',markDirty34);
    });
  }

  const mo=new MutationObserver(()=>install34());
  mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',install34);
  window.validateAddressV34=validate34;
  window.getAddressValidationV34=()=>STATE.result;
  console.info('INVICTO OPS v34.1 · validación manual Google con diagnóstico activo');
})();
