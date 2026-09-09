// Responsive layer
const responsiveCSS=document.createElement('link');
responsiveCSS.rel='stylesheet';
responsiveCSS.href='mobile.css?v=2';
document.head.appendChild(responsiveCSS);
const vp=document.querySelector('meta[name="viewport"]');
if(vp) vp.setAttribute('content','width=device-width,initial-scale=1,viewport-fit=cover');

const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
addEventListener('scroll',()=>{const d=document.documentElement;$('#progress').style.width=(d.scrollTop/(d.scrollHeight-d.clientHeight)*100)+'%'});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.12});
$$('.reveal').forEach(x=>io.observe(x));
let lang='es';
$('#lang').onclick=()=>{lang=lang==='es'?'en':'es';$('#lang').textContent=lang==='es'?'EN':'ES';$$('[data-es]').forEach(el=>el.innerHTML=el.dataset[lang]);renderSystem();renderDiag();};
const systems={
media:{es:['ACQUISITION ENGINE','Comprar tráfico sin entender el negocio es una forma rápida de quemar presupuesto.','Conecto oferta, audiencias, creatividad, atribución y performance para que la inversión tenga una lógica comercial.',['Offer','Creative','Media','Learning']],en:['ACQUISITION ENGINE','Buying traffic without understanding the business is a fast way to burn budget.','I connect offer, audiences, creative, attribution and performance so spend follows commercial logic.',['Offer','Creative','Media','Learning']]},
creative:{es:['CREATIVE ENGINE','El creative no es decoración. Es la primera capa de conversión.','Construyo hooks, ángulos, formatos e iteración para producir aprendizaje y reducir fatiga.',['Hooks','Angles','Formats','Iteration']],en:['CREATIVE ENGINE','Creative is not decoration. It is the first layer of conversion.','I build hooks, angles, formats and iteration to produce learning and reduce fatigue.',['Hooks','Angles','Formats','Iteration']]},
cro:{es:['CONVERSION ENGINE','El clic no vale nada si la experiencia después del clic está rota.','Reviso mensaje, landing, UX, checkout, confianza y CRO para reducir fricción.',['Message','Landing','UX','CRO']],en:['CONVERSION ENGINE','The click means nothing if the post-click experience is broken.','I review message, landing page, UX, checkout, trust and CRO to reduce friction.',['Message','Landing','UX','CRO']]},
sales:{es:['SALES ENGINE','Un lead mal trabajado es dinero pagado para perderlo.','Conecto adquisición con CRM, WhatsApp, velocidad de respuesta, follow-up y remarketing.',['Lead','CRM','Follow-up','Remarketing']],en:['SALES ENGINE','A poorly worked lead is money paid to lose it.','I connect acquisition with CRM, WhatsApp, response speed, follow-up and remarketing.',['Lead','CRM','Follow-up','Remarketing']]},
ai:{es:['AUTOMATION ENGINE','Automatizar no es poner un bot. Es quitar trabajo que no necesita una persona.','Mapeo tareas repetitivas y conecto IA, agentes y CRM para ganar velocidad.',['Process','AI','Agents','Automation']],en:['AUTOMATION ENGINE','Automation is not adding a bot. It is removing work that does not need a human.','I map repetitive work and connect AI, agents and CRM to gain speed.',['Process','AI','Agents','Automation']]}
};
let mode='media';
function renderSystem(){const d=systems[mode][lang];$('#sysK').textContent=d[0];$('#sysT').textContent=d[1];$('#sysP').textContent=d[2];$('#flow').innerHTML=d[3].map((x,i)=>`<div><b>0${i+1}</b><small>${x}</small></div>`).join('')}
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;renderSystem()});
const diags={
cpa:{es:['MEDIA EFFICIENCY','Antes de bajar el CPA, hay que entender por qué está subiendo.','Revisaría oferta, fatiga creativa, atribución, audiencia, landing y calidad de tráfico.',['Signal audit','Offer / creative','Media structure']],en:['MEDIA EFFICIENCY','Before lowering CPA, you need to understand why it is rising.','I would review offer, creative fatigue, attribution, audience, landing page and traffic quality.',['Signal audit','Offer / creative','Media structure']]},
creative:{es:['CREATIVE FATIGUE','Si cada semana necesitas otro anuncio, falta un sistema de aprendizaje creativo.','Construiría una matriz de hooks, ángulos y formatos para entender qué genera respuesta.',['Hooks','Angles','Iteration']],en:['CREATIVE FATIGUE','If you need a new ad every week, you are missing a creative learning system.','I would build a matrix of hooks, angles and formats to understand what creates response.',['Hooks','Angles','Iteration']]},
conversion:{es:['FUNNEL / CRO','Mucho tráfico con pocas ventas rara vez se arregla tocando campañas.','Revisaría congruencia anuncio-landing, oferta, UX, checkout, confianza y fricción.',['Landing audit','Offer clarity','Friction']],en:['FUNNEL / CRO','Lots of traffic with few sales is rarely fixed by changing campaigns.','I would review ad-to-landing congruence, offer, UX, checkout, trust and friction.',['Landing audit','Offer clarity','Friction']]},
lead:{es:['SALES CONVERSION','Si los leads llegan pero no cierran, marketing no terminó su trabajo.','Analizaría calidad del lead, velocidad de respuesta, argumentación, follow-up, CRM y remarketing.',['Lead quality','Follow-up','CRM']],en:['SALES CONVERSION','If leads arrive but do not close, marketing did not finish its job.','I would analyze lead quality, response speed, messaging, follow-up, CRM and remarketing.',['Lead quality','Follow-up','CRM']]}
};
let diag='cpa';
function renderDiag(){const d=diags[diag][lang];$('#dK').textContent=d[0];$('#dT').textContent=d[1];$('#dP').textContent=d[2];$('#dPts').innerHTML=d[3].map((x,i)=>`<div><b>0${i+1}</b><small>${x}</small></div>`).join('')}
$$('.opt').forEach(b=>b.onclick=()=>{$$('.opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');diag=b.dataset.diag;renderDiag()});
const date=$('#date');const t=new Date();t.setDate(t.getDate()+1);date.value=t.toISOString().slice(0,10);let time='10:00';
$$('.slot').forEach(b=>b.onclick=()=>{$$('.slot').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');time=b.dataset.time});
$('#calendar').onclick=()=>{
const [Y,M,D]=date.value.split('-').map(Number),[h,m]=time.split(':').map(Number);
const start=new Date(Date.UTC(Y,M-1,D,h+5,m)),end=new Date(start.getTime()+30*60000);
const fmt=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
const name=$('#name').value||'Visitante web',company=$('#company').value||'Empresa',email=$('#email').value||'No indicado',context=$('#context').value||'Conversación inicial';
const title='Growth Conversation — '+name+' / '+company;
const details=`Solicitud desde samuelacuna12.github.io\nNombre: ${name}\nEmpresa: ${company}\nEmail: ${email}\nContexto: ${context}`;
open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(details)}&add=samuelatuna%40gmail.com`,'_blank');
};
$('#whatsapp').onclick=()=>{const msg=encodeURIComponent(`Hola Samuel, vi tu web. Soy ${$('#name').value||'un visitante'} de ${$('#company').value||'una empresa'}. Quiero hablar sobre: ${$('#context').value||'crecimiento'}.`);open('https://wa.me/573028289997?text='+msg,'_blank')};