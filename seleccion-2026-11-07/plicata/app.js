const items={
 wide:{label:'BOTA ANCHA',name:'Jean bota ancha azul oscuro',price:'$83.993*',url:'https://plicata.com.co/products/jean-bota-ancha-azul-claro-2',note:'Corte amplio · índigo 100% algodón'},
 mom:{label:'MOM FIT',name:'Jean mom fit',price:'$83.993*',url:'https://plicata.com.co/products/jean-mom-fit-4',note:'Fit clásico · índigo 100% algodón'},
 baggy:{label:'BAGGY',name:'Jean baggy con lavado',price:'$83.993*',url:'https://plicata.com.co/collections/all',note:'Volumen relajado · algodón 100%'}
};
let selected='wide';let count=0;
const rec=document.querySelector('#recommendation');
function recommend(key){selected=key;const p=items[key];rec.innerHTML=`<div><small>SELECCIÓN · ${p.label}</small><h3>${p.name}</h3><div class="product-note">${p.note} · ${p.price}</div></div><a href="${p.url}" target="_blank" rel="noreferrer">ABRIR PRODUCTO OFICIAL ↗</a>`;document.querySelectorAll('.fit-option').forEach(b=>b.classList.toggle('selected',b.dataset.fit===key));}
document.querySelectorAll('.fit-option').forEach(b=>b.addEventListener('click',()=>recommend(b.dataset.fit)));
recommend(selected);
const chat=document.querySelector('#chatBody');
function addBubble(text,kind){const p=document.createElement('p');p.className=`bubble ${kind==='user'?'user-bubble':'bot-bubble'}`;p.textContent=text;chat.append(p);}
function choices(){const wrap=document.createElement('div');wrap.className='quick-replies';[['wide','Bota ancha'],['mom','Mom fit'],['baggy','Baggy']].forEach(([key,label])=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{addBubble(label,'user');count++;document.querySelector('#bagCount').textContent=count;const it=items[key];addBubble(`Mira esta opción: ${it.name} (${it.price}). ${it.note}. Las tallas y existencias se confirman en Plicata.`, 'bot');const link=document.createElement('a');link.href=it.url;link.target='_blank';link.rel='noreferrer';link.className='chat-link';link.textContent='VER EN LA TIENDA OFICIAL ↗';chat.append(link);if(count<3){addBubble('¿Quieres explorar otro corte?', 'bot');choices()}else addBubble('Listo. Este prototipo no envía pedidos ni guarda tus respuestas.', 'bot');};wrap.append(b)});chat.append(wrap)}
choices();
document.querySelector('#resetChat').addEventListener('click',()=>{count=0;document.querySelector('#bagCount').textContent='0';chat.innerHTML='<p class="bubble bot-bubble">¡Hola! ¿Qué tipo de jean quieres explorar?</p>';choices()});
