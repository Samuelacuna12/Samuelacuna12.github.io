(() => {
  const methodRows = [...document.querySelectorAll('.method-row')];
  methodRows.forEach(row => {
    row.addEventListener('click', () => {
      methodRows.forEach(r => {
        r.classList.remove('active');
        r.setAttribute('aria-expanded','false');
      });
      row.classList.add('active');
      row.setAttribute('aria-expanded','true');
    });
  });

  const errors = [
    {
      n:'01',
      title:'Cero conexión emocional',
      text:'El cliente no necesita un monólogo. Necesita una conversación que lo haga pensar y que te permita entender qué está intentando resolver.',
      list:['Condiciona pequeñas respuestas afirmativas.','Usa preguntas orientativas.','Abre la conversación con intención.']
    },
    {
      n:'02',
      title:'Vender características',
      text:'Las características explican qué tiene tu oferta; el valor explica por qué eso importa. El cierre mejora cuando el cliente ve con claridad qué problema estás resolviendo.',
      list:['Detecta el problema que sí reconoce.','Conecta tu solución con ese problema.','Explica el beneficio en términos concretos.']
    },
    {
      n:'03',
      title:'Falsa modestia al cerrar',
      text:'Si ya diagnosticamos bien, cerrar no debería sentirse agresivo. La conclusión correcta es simplemente definir con claridad qué ocurre después.',
      list:['Resume problema, objetivo y solución.','Marca un siguiente paso concreto.','Pide una decisión sin volver a sembrar dudas.']
    }
  ];

  const cards = [...document.querySelectorAll('.error-card')];
  const n = document.getElementById('errorNumber');
  const title = document.getElementById('errorTitle');
  const text = document.getElementById('errorText');
  const list = document.getElementById('errorList');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const item = errors[Number(card.dataset.error)];
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      n.textContent = item.n;
      title.textContent = item.title;
      text.textContent = item.text;
      list.innerHTML = item.list.map(x => '<li>'+x+'</li>').join('');
    });
  });

  const phrases = [
    '“Por lo que me contaste, esto sí encaja. Para avanzar, el siguiente paso es definir la implementación.”',
    '“Con lo que ya validamos, el siguiente paso es comenzar por aquí.”',
    '“En este momento solo necesitamos confirmar este punto para ponerlo en marcha.”'
  ];
  const phraseButtons = [...document.querySelectorAll('.phrase-list button')];
  const output = document.getElementById('phraseOutput');

  phraseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      phraseButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      output.innerHTML = '<small>VERSIÓN ESTRUCTURADA</small><p>'+phrases[Number(btn.dataset.phrase)]+'</p>';
    });
  });
})();