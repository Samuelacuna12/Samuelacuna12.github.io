(() => {
  const progressBar = document.getElementById('progressBar');
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    progressBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
  };
  document.addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
  }, {threshold:0.12});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const errors = [
    {
      kicker:'ERROR 01', title:'Cero conexión emocional', text:'Hablar en lugar de preguntar convierte una conversación comercial en un monólogo. El cliente necesita sentir que la decisión también le pertenece.',
      detail:'Pregunta para guiar, no para interrogar.', intro:'La estructura correcta usa preguntas en tres niveles para mover al cliente desde respuestas automáticas hacia una decisión consciente.',
      items:[['1','Condiciona el “sí”','Construye pequeñas afirmaciones y reduce fricción.'],['2','Orienta la decisión','Da elecciones claras en lugar de preguntas vagas.'],['3','Abre la conversación','Rompe respuestas automáticas y descubre la razón real.']]
    },
    {
      kicker:'ERROR 02', title:'Vender características', text:'El cliente rara vez compra una característica aislada. Compra una mejora concreta en su vida, su trabajo o su negocio.',
      detail:'Traduce cada función en un problema resuelto.', intro:'El mapa de valor conecta lo que tu oferta hace con el resultado que el cliente realmente quiere conseguir.',
      items:[['1','Detecta el dolor','Identifica el problema que el cliente sí reconoce.'],['2','Conecta el mecanismo','Explica por qué tu solución cambia ese problema.'],['3','Aterriza el beneficio','Describe el resultado en términos concretos y útiles.']]
    },
    {
      kicker:'ERROR 03', title:'Falsa modestia al cerrar', text:'Cerrar con inseguridad transmite inseguridad. Si el diagnóstico fue correcto, avanzar debe sentirse como una conclusión natural.',
      detail:'Cierra por conclusión.', intro:'Sustituye frases condicionadas por instrucciones claras, profesionales y fáciles de seguir.',
      items:[['1','Resume la lógica','Repite brevemente problema, objetivo y solución.'],['2','Marca el siguiente paso','Explica exactamente qué debe ocurrir ahora.'],['3','Pide una decisión','Haz una pregunta concreta, sin presión ni ambigüedad.']]
    }
  ];
  const detailGrid = document.getElementById('detailGrid');
  const renderError = (i) => {
    const e = errors[i];
    document.getElementById('errorKicker').textContent=e.kicker;
    document.getElementById('errorTitle').textContent=e.title;
    document.getElementById('errorText').textContent=e.text;
    document.getElementById('detailTitle').textContent=e.detail;
    document.getElementById('detailIntro').textContent=e.intro;
    detailGrid.innerHTML=e.items.map(it=>`<div class="detail-card"><div class="detail-icon">${it[0]}</div><div><b>${it[1]}</b><small>${it[2]}</small></div></div>`).join('');
  };
  document.querySelectorAll('.error-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.error-tab').forEach(b => {b.classList.remove('active');b.setAttribute('aria-selected','false')});
    btn.classList.add('active');btn.setAttribute('aria-selected','true');renderError(Number(btn.dataset.error));
  }));
  renderError(0);

  const lab = [
    ['Construir hábito de afirmación','En ventas, encadenar pequeñas afirmaciones reduce fricción y ayuda a mantener una conversación colaborativa.','Ejemplo: “Si esto te permitiera cerrar más sin perseguir clientes, ¿tendría sentido para ti?”'],
    ['Dar elecciones claras','Una mente confundida suele responder “no”. Reduce la ambigüedad ofreciendo rutas simples que ayuden a elegir.','Ejemplo: “¿Te interesa más mejorar la captación o el cierre de los leads que ya tienes?”'],
    ['Romper respuestas automáticas','Las preguntas abiertas bien formuladas hacen que el cliente piense y revelan información que no aparece con un simple sí o no.','Ejemplo: “¿Qué crees que está haciendo que tus oportunidades se enfríen antes del cierre?”']
  ];
  document.querySelectorAll('.funnel-step').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.funnel-step').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); const d=lab[Number(btn.dataset.level)];
    document.getElementById('labTitle').textContent=d[0];document.getElementById('labText').textContent=d[1];document.getElementById('labExample').textContent=d[2];
  }));

  const conversions = {
    '¿Será que te gustaría?':'“Por lo que me contaste, esto sí encaja. Para avanzar, el siguiente paso es definir la implementación.”',
    'Si puedes...':'“En este momento solo necesitamos confirmar el siguiente paso para ponerlo en marcha.”',
    'Si quieres...':'“Con lo que ya validamos, el siguiente paso es comenzar por aquí.”',
    'Si tienes...':'“Para avanzar, solo falta confirmar este punto y seguimos con el proceso.”'
  };
  document.querySelectorAll('.phrase-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.phrase-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    document.getElementById('phraseResult').textContent=conversions[btn.dataset.phrase];
  }));

  document.getElementById('matchForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const vals = ['q1','q2','q3'].map(k=>data.get(k));
    const out = document.getElementById('matchResult');
    out.classList.add('show');
    if(vals.some(v=>v===null)){out.textContent='Responde las tres preguntas para evaluar tu encaje.';return;}
    const score = vals.reduce((a,v)=>a+Number(v),0);
    if(score===3) out.textContent='Match alto: tienes una oferta activa, reconoces el problema y estás dispuesto a cambiar el proceso. El diagnóstico es el siguiente paso lógico.';
    else if(score===2) out.textContent='Match medio: hay una buena base, pero conviene revisar qué parte del proceso necesita estructura antes de avanzar.';
    else out.textContent='Match bajo por ahora: antes de entrar al sistema, necesitas una oferta activa y disposición real para implementar cambios.';
  });
})();
