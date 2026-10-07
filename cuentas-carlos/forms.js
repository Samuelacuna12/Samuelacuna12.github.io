function modal(body){document.body.insertAdjacentHTML('beforeend','<div class="modalback" id="modal" onclick="if(event.target===this)closeModal()"><div class="modal">'+body+'</div></div>')}
function closeModal(){document.getElementById('modal')?.remove();state.draft=[];state.file=null}

function paymentModal(){
  modal('<button class="close" onclick="closeModal()">×</button><h2>Nueva consignación</h2><p>Registra dinero entregado por Invicto a Carlos.</p><form class="form" onsubmit="savePayment(event)"><div class="field"><label>FECHA</label><input id="pd" type="date" value="'+today()+'" required></div><div class="field"><label>VALOR CONSIGNADO</label><input id="pa" type="number" min="1" required></div><div class="field span2"><label>REFERENCIA / COMPROBANTE</label><input id="pr"></div><div class="field span2"><label>NOTA</label><textarea id="pn"></textarea></div><div class="span2 row"><button class="primary">Guardar consignación</button><button class="secondary" type="button" onclick="closeModal()">Cancelar</button></div></form>');
}
async function savePayment(e){
  e.preventDefault();
  const r=await sb.rpc('carlos_public_add_payment',{
    p_date:$('#pd').value,
    p_amount:Number($('#pa').value),
    p_reference:$('#pr').value.trim()||null,
    p_notes:$('#pn').value.trim()||null
  });
  if(r.error)return toast(r.error.message);
  toast('Consignación registrada');closeModal();await loadData();render();
}
function rateFor(p,d,m,s){
  const r=state.rates.find(x=>x.product_type===p&&x.design_type===d&&x.material===m&&x.size===s)||state.rates.find(x=>x.product_type===p&&x.design_type===d&&x.material===m&&x.size==='TODAS');
  return Number(r?.unit_cost||0);
}
function deliveryModal(){
  state.draft=[];state.file=null;
  modal('<button class="close" onclick="closeModal()">×</button><h2>Nueva entrega</h2><p>Sube Excel/CSV para reconocer talla y cantidad. PDF también puede guardarse como soporte.</p><div class="form"><div class="field"><label>FECHA</label><input id="dd" type="date" value="'+today()+'"></div><div class="field"><label>REFERENCIA / REMISIÓN</label><input id="dr"></div><div class="field span2"><label>DOCUMENTO SOPORTE</label><input type="file" accept=".xlsx,.xls,.csv,.pdf" onchange="readFile(this.files[0])"></div></div><div class="linebox"><div class="form"><div class="field"><label>PRODUCTO</label><select id="dp"><option>Boxer</option><option>Brief</option></select></div><div class="field"><label>DISEÑO</label><select id="dg"><option>Unicolor</option><option>Estampado</option></select></div><div class="field"><label>MATERIAL</label><select id="dm"><option>Algodón</option><option>Licra</option><option>Otro</option></select></div><div class="field"><label>TALLA</label><select id="ds">'+SIZES.map(s=>'<option>'+s+'</option>').join('')+'</select></div><div class="field"><label>CANTIDAD</label><input id="dq" type="number" min="1"></div><div class="field"><label>COSTO / UNIDAD</label><input id="dc" type="number" min="0" placeholder="Usa tarifa si está vacío"></div><div class="span2 row"><button class="secondary" type="button" onclick="addDraft()">Agregar línea</button></div></div><div id="draft" class="draft"></div><div class="row" style="margin-top:16px"><button class="primary" type="button" onclick="saveDelivery()">Guardar entrega completa</button><button class="secondary" type="button" onclick="closeModal()">Cancelar</button></div></div>');
  drawDraft();
}
function addDraft(){
  const p=$('#dp').value,d=$('#dg').value,m=$('#dm').value,s=$('#ds').value,q=Number($('#dq').value||0),c=Number($('#dc').value||0)||rateFor(p,d,m,s);
  if(q<=0)return toast('Ingresa una cantidad válida');
  state.draft.push({product_type:p,design_type:d,material:m,size:s,quantity:q,unit_cost:c});
  $('#dq').value='';$('#dc').value='';drawDraft();
}
function drawDraft(){
  const h=$('#draft');if(!h)return;
  if(!state.draft.length){h.innerHTML='<div class="empty">Agrega líneas o importa un archivo.</div>';return}
  h.innerHTML=state.draft.map((x,i)=>'<div class="draftrow"><b>'+esc(x.product_type)+'</b><span>'+esc(x.design_type)+'</span><span>'+esc(x.material)+'</span><b>'+esc(x.size)+'</b><span>'+x.quantity+' und.</span><input type="number" min="0" value="'+(x.unit_cost||'')+'" onchange="state.draft['+i+'].unit_cost=Number(this.value||0);drawDraft()"><button class="mini danger" onclick="state.draft.splice('+i+',1);drawDraft()">Quitar</button></div>').join('')+'<div style="text-align:right;margin-top:12px;font-weight:800">Total entrega: '+money(state.draft.reduce((a,x)=>a+x.quantity*x.unit_cost,0))+'</div>';
}
function key(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function pick(r,w){for(const k of Object.keys(r)){const z=key(k);if(w.some(x=>z===x||z.includes(x)))return r[k]}}
function pSize(v){let z=String(v||'').toUpperCase().replace(/\s+/g,'').replace('XXXXL','4XL').replace('XXXL','3XL').replace('XXL','2XL');return SIZES.includes(z)?z:null}
async function readFile(f){
  state.file=f||null;if(!f)return;
  if(f.name.toLowerCase().endsWith('.pdf'))return toast('PDF adjunto como soporte. Agrega el detalle manualmente.');
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}),a=[];
    for(const r of rows){
      const s=pSize(pick(r,['talla','size'])),q=Number(pick(r,['cantidad','unidades','unidad','und','qty'])||0);if(!s||q<=0)continue;
      const raw=pick(r,['producto','prenda','referencia'])||'',
        p=key(raw).includes('brief')?'Brief':'Boxer',
        des=key(pick(r,['diseno','estampado','tipo'])||raw).includes('estamp')?'Estampado':'Unicolor',
        mat=key(pick(r,['material','tela'])||raw).includes('licra')?'Licra':'Algodón',
        c=Number(pick(r,['costo unitario','costo unidad','precio unitario','valor unidad','costo','precio'])||0)||rateFor(p,des,mat,s);
      a.push({product_type:p,design_type:des,material:mat,size:s,quantity:q,unit_cost:c});
    }
    if(!a.length)throw Error('No encontré filas con talla y cantidad');
    state.draft.push(...a);drawDraft();toast('Archivo leído: '+a.length+' líneas');
  }catch(e){toast('No pude reconocer el archivo: '+e.message)}
}
async function fileToBase64(file){
  if(!file)return null;
  if(file.size>8*1024*1024)throw Error('El soporte supera 8 MB.');
  const buf=new Uint8Array(await file.arrayBuffer());
  let bin='',step=0x8000;
  for(let i=0;i<buf.length;i+=step)bin+=String.fromCharCode(...buf.subarray(i,i+step));
  return btoa(bin);
}
async function saveDelivery(){
  if(!state.draft.length)return toast('Agrega al menos una línea');
  if(state.draft.some(x=>Number(x.unit_cost)<=0))return toast('Hay líneas sin costo unitario');
  try{
    const amount=state.draft.reduce((a,x)=>a+x.quantity*x.unit_cost,0);
    const b64=state.file?await fileToBase64(state.file):null;
    const r=await sb.rpc('carlos_public_add_delivery',{
      p_date:$('#dd').value||today(),
      p_amount:amount,
      p_reference:$('#dr').value.trim()||null,
      p_document_name:state.file?.name||null,
      p_document_mime:state.file?.type||null,
      p_document_base64:b64,
      p_items:state.draft
    });
    if(r.error)throw r.error;
    toast('Entrega registrada');closeModal();await loadData();render();
  }catch(e){toast(e.message||'No se pudo guardar')}
}
function rateModal(){
  modal('<button class="close" onclick="closeModal()">×</button><h2>Nueva tarifa</h2><p>Configura cuánto cobra Carlos por unidad.</p><form class="form" onsubmit="saveRate(event)"><div class="field"><label>PRODUCTO</label><select id="rp"><option>Boxer</option><option>Brief</option></select></div><div class="field"><label>DISEÑO</label><select id="rg"><option>Unicolor</option><option>Estampado</option></select></div><div class="field"><label>MATERIAL</label><select id="rm"><option>Algodón</option><option>Licra</option><option>Otro</option></select></div><div class="field"><label>TALLA</label><select id="rs"><option>TODAS</option>'+SIZES.map(s=>'<option>'+s+'</option>').join('')+'</select></div><div class="field"><label>COSTO / UNIDAD</label><input id="rc" type="number" min="0" required></div><div class="span2 row"><button class="primary">Guardar tarifa</button><button class="secondary" type="button" onclick="closeModal()">Cancelar</button></div></form>');
}
async function saveRate(e){
  e.preventDefault();
  const r=await sb.rpc('carlos_public_upsert_rate',{
    p_product_type:$('#rp').value,
    p_design_type:$('#rg').value,
    p_material:$('#rm').value,
    p_size:$('#rs').value,
    p_unit_cost:Number($('#rc').value)
  });
  if(r.error)return toast(r.error.message);
  toast('Tarifa guardada');closeModal();await loadData();render();
}