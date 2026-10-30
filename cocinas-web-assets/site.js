(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const all = selector => [...document.querySelectorAll(selector)];
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const motionButton = document.querySelector('.motion-control');
 function motionOff(){ return reduced.matches || document.body.classList.contains('reduce-motion'); }
 motionButton?.addEventListener('click',()=>{
  const off=document.body.classList.toggle('reduce-motion');
  motionButton.setAttribute('aria-pressed',String(off));
  motionButton.textContent=off?'Activar movimiento':'Reducir movimiento';
  if(off)all('.ready').forEach(el=>el.classList.add('visible'));
 });
 if(!motionOff() && 'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});
  all('.reveal,.image-reveal').forEach(el=>{el.classList.add('ready');observer.observe(el);});
 }
 const menuToggle=document.querySelector('.menu-toggle');
 function closeMenu(){ $('site-menu')?.classList.remove('open'); menuToggle?.setAttribute('aria-expanded','false'); if(menuToggle)menuToggle.textContent='Menú +'; }
 menuToggle?.addEventListener('click',()=>{const open=$('site-menu').classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.textContent=open?'Cerrar −':'Menú +';});
 all('.nav-links a').forEach(a=>a.addEventListener('click',closeMenu));
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});

 const rail=document.querySelector('.project-rail');
 if(rail){
  const previous=document.querySelector('[data-rail="-1"]'),next=document.querySelector('[data-rail="1"]');
  const update=()=>{previous.disabled=rail.scrollLeft<3;next.disabled=rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-4;};
  all('[data-rail]').forEach(button=>button.addEventListener('click',()=>rail.scrollBy({left:Number(button.dataset.rail)*(rail.querySelector('.project-item').getBoundingClientRect().width+28),behavior:motionOff()?'instant':'smooth'})));
  rail.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
 }
 const gallery=all('[data-lightbox]');let galleryIndex=0;
 const imageDialog=$('image-dialog');
 function showImage(index){galleryIndex=(index+gallery.length)%gallery.length;const item=gallery[galleryIndex];$('lightbox-image').src=item.dataset.lightbox;$('lightbox-image').alt=item.dataset.caption;$('image-caption').textContent=item.dataset.caption;$('image-count').textContent=(galleryIndex+1)+' / '+gallery.length;}
 gallery.forEach((button,index)=>button.addEventListener('click',()=>{showImage(index);imageDialog.showModal();}));
 $('image-prev')?.addEventListener('click',()=>showImage(galleryIndex-1));
 $('image-next')?.addEventListener('click',()=>showImage(galleryIndex+1));
 imageDialog?.addEventListener('keydown',event=>{if(!gallery.length)return;if(event.key==='ArrowLeft'){event.preventDefault();showImage(galleryIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();showImage(galleryIndex+1);}});
 all('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));

 const intents=[
  {label:'01 / Un nuevo comienzo',title:'Tu primera cocina, pensada contigo.',copy:'Si estás por recibir tu apartamento, podemos empezar por la distribución y los ambientes que quieres amoblar.',list:['Fecha de entrega del inmueble','Ambientes que necesitas diseñar','Referencias de estilo y prioridades'],note:'Voy a estrenar apartamento'},
  {label:'02 / Una nueva etapa',title:'Renovar lo que vives a diario.',copy:'Si tu cocina ya no responde a lo que necesitas, conversemos sobre lo que quieres conservar y lo que te gustaría transformar.',list:['Qué deseas cambiar y qué conservar','Estado actual de la cocina','Fecha aproximada para la renovación'],note:'Quiero renovar mi cocina'},
  {label:'03 / Nuevas posibilidades',title:'Aprovechar mejor lo que tienes.',copy:'El almacenamiento y la distribución pueden cambiar la forma en que usas un espacio. Empecemos por tus prioridades.',list:['Qué necesitas guardar u organizar','Distribución actual y fotos de referencia','Restricciones del inmueble que conozcas'],note:'Necesito aprovechar mejor el espacio'}
 ];let intentNote='';
 all('[data-intent]').forEach(button=>button.addEventListener('click',()=>{
  all('[data-intent]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const item=intents[Number(button.dataset.intent)];intentNote=item.note;
  $('intent-label').textContent=item.label;$('intent-title').textContent=item.title;$('intent-description').textContent=item.copy;
  $('intent-list').replaceChildren(...item.list.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 }));
 const rooms={
  cocina:{kicker:'01 / Cocinas integrales',title:'El centro de tu hogar.',copy:'Una distribución que conecte preparación, almacenamiento y los momentos que compartes en la cocina.',features:['Distribución y electrodomésticos','Almacenamiento y uso diario','Materiales y acabados a definir'],project:'Cocina integral'},
  closet:{kicker:'02 / Closets',title:'Cada cosa, en su lugar.',copy:'Un espacio pensado para lo que guardas, cómo lo organizas y la manera en que lo usas todos los días.',features:['Distribución interior','Apertura y tipo de puertas','Dimensiones verificadas en el espacio'],project:'Closet'},
  bano:{kicker:'03 / Muebles de baño',title:'Orden en los detalles.',copy:'Mobiliario que acompaña el uso del baño y permite conversar sobre almacenamiento, lavamanos y condiciones del lugar.',features:['Medidas y puntos existentes','Almacenamiento que necesitas','Materiales adecuados al alcance acordado'],project:'Mueble de baño'},
  oficina:{kicker:'04 / Mobiliario de oficina',title:'Un lugar para concentrarte.',copy:'Superficies, almacenamiento y distribución para trabajar en casa o en una oficina según las necesidades de tu proyecto.',features:['Puestos y equipos de trabajo','Espacio para guardar','Distribución y conexiones existentes'],project:'Mobiliario de oficina'}
 };
 all('[data-room]').forEach(button=>button.addEventListener('click',()=>{
  all('[data-room]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const key=button.dataset.room,r=rooms[key];$('room-image').src='assets/'+key+'.webp';$('room-image').alt=r.project+' publicado en el sitio de Armohogar';
  $('room-kicker').textContent=r.kicker;$('room-title').textContent=r.title;$('room-copy').textContent=r.copy;
  $('room-features').replaceChildren(...r.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  document.querySelector('.room-result [data-open-request]').dataset.project=r.project;
  if(!motionOff())$('room-image').animate([{opacity:.3,transform:'scale(1.025)'},{opacity:1,transform:'scale(1)'}],{duration:300,easing:'ease-out'});
 }));

 const requestDialog=$('request-dialog'),form=document.querySelector('.request-form');let step=0;
 const fields=all('[data-step]'),previous=$('previous-step'),next=$('next-step'),send=$('send-request');
 const dateField=$('preferred-date');
 if(dateField){const now=new Date();dateField.min=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
 function review(){
  if(!form)return;
  const values=new FormData(form),project=values.get('project')||'Proyecto a medida';
  const date=values.get('date');const dateText=date?new Date(date+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'}):'Por coordinar';
  const rows=['Proyecto: '+project,'Momento: '+values.get('stage'),'Municipio: '+(values.get('municipality')||'Por confirmar'),'Fecha deseada: '+dateText];
  if(intentNote)rows.push('Necesidad: '+intentNote);
  if(String(values.get('note')||'').trim())rows.push('Comentario: '+String(values.get('note')).trim());
  const name=String(values.get('name')||'').trim();
  const message='Hola '+document.body.dataset.brand+'. '+(name?'Soy '+name+'. ':'')+'Quisiera consultar este proyecto:\n\n'+rows.join('\n')+'\n\n¿Podemos confirmar cobertura, condiciones y disponibilidad?';
  $('request-summary').textContent=(name?'Nombre: '+name+'\n':'')+rows.join('\n');
  send.href='https://wa.me/'+document.body.dataset.phone+'?text='+encodeURIComponent(message);
 }
 function renderStep(focus=false){
  fields.forEach((el,i)=>{el.hidden=i!==step;});previous.hidden=step===0;next.hidden=step===2;send.hidden=step!==2;
  all('.form-progress span').forEach((el,i)=>el.classList.toggle('active',i<=step));
  document.querySelector('.form-error').textContent='';review();
  if(focus){requestDialog.scrollTop=0;const first=fields[step].querySelector('input,select,textarea');first?.focus({preventScroll:true});}
 }
 all('[data-open-request]').forEach(button=>button.addEventListener('click',()=>{
  closeMenu();if(button.dataset.project){const radio=all('input[name="project"]').find(input=>input.value===button.dataset.project);if(radio)radio.checked=true;}
  step=0;renderStep();requestDialog.showModal();
 }));
 next?.addEventListener('click',()=>{
  const invalid=[...fields[step].querySelectorAll('input,select,textarea')].find(field=>!field.checkValidity());
  if(invalid){document.querySelector('.form-error').textContent='Revisa el campo señalado para continuar.';invalid.reportValidity();return;}
  step=Math.min(2,step+1);renderStep(true);
 });
 previous?.addEventListener('click',()=>{step=Math.max(0,step-1);renderStep(true);});
 form?.addEventListener('input',review);form?.addEventListener('change',review);
 form?.addEventListener('submit',event=>{event.preventDefault();if(step<2)next.click();});
 renderStep();
})();
