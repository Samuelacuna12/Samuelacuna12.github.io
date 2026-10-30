(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  const select = (buttons, active) => buttons.forEach(button => button.setAttribute('aria-pressed', String(button === active)));

  const visitExamples = {
    'Cocina': ['Visita para una cocina', 'Fotos del espacio, distribución actual y referencias de estilo.', 'Verificar medidas, puntos de agua y energía, electrodomésticos y necesidades de almacenamiento.', 'Preparar el diseño 3D y definir alcance de la cotización.'],
    'Closet': ['Visita para un closet', 'Fotos del espacio disponible y una lista de necesidades de almacenamiento.', 'Verificar ancho, alto, profundidad, apertura de puertas y distribución interior.', 'Preparar el diseño interior y definir materiales y alcance para cotizar.'],
    'Varios espacios': ['Visita para varios espacios', 'Ambientes a intervenir, prioridades y referencias de cada uno.', 'Verificar medidas y condiciones por ambiente, dependencias y orden de ejecución.', 'Organizar el diseño y la cotización por ambientes o fases acordadas.']
  };
  const visitButtons = [...document.querySelectorAll('[data-visit]')];
  visitButtons.forEach(button => button.addEventListener('click', () => {
    select(visitButtons, button);
    const values = visitExamples[button.dataset.visit];
    ['visit-title','visit-prep','visit-check','visit-next'].forEach((id,i) => setText(id,values[i]));
  }));

  const stages = $('stage-data');
  if (stages) {
    const data = JSON.parse(stages.textContent);
    const buttons = [...document.querySelectorAll('[data-stage]')];
    buttons.forEach(button => button.addEventListener('click', () => {
      select(buttons, button);
      const stage = data[Number(button.dataset.stage)];
      setText('stage-number','Etapa ' + stage.n);
      ['title','owner','action','done'].forEach(key => setText('stage-'+key,stage[key]));
    }));
  }

  const intents = [
    ['01.','La cocina de un nuevo comienzo.','Un caso real puede mostrar cómo un apartamento recién entregado se convierte en un espacio listo para vivir. La invitación sería preparar juntos la valoración del inmueble.','Apartamento nuevo','Municipio, fecha de entrega, estado del inmueble y ambientes que necesita amoblar.','Un proyecto autorizado de apartamento, con distribución, materiales y decisiones de diseño.','Validar fecha de entrega y coordinar la valoración cuando haya acceso al espacio.'],
    ['02.','Más posibilidades en el mismo espacio.','Un proyecto puede explicar cómo se aprovechó una cocina pequeña sin convertir el tamaño en una limitación para conversar sobre diseño.','Aprovechamiento del espacio','Dimensiones aproximadas, fotos autorizadas, almacenamiento que necesita y aspectos de la distribución actual que desea mejorar.','Un caso real de organización y aprovechamiento del espacio, con decisiones explicadas por el equipo.','Revisar restricciones del inmueble y coordinar la valoración para verificar medidas.'],
    ['03.','Una cocina para otra etapa de la vida.','El contenido puede acompañar a quien quiere renovar: qué se conserva, qué cambia y cómo se organiza la intervención.','Renovación de cocina','Qué desea cambiar, estado actual, uso diario del espacio, fecha deseada y referencias.','Un proyecto autorizado de renovación, explicando alcance, materiales y secuencia del trabajo.','Validar condiciones actuales, coordinar la valoración y definir el alcance de la renovación.']
  ];
  const intentButtons = [...document.querySelectorAll('[data-intent]')];
  intentButtons.forEach(button => button.addEventListener('click', () => {
    select(intentButtons, button);
    const values = intents[Number(button.dataset.intent)];
    ['intent-number','intent-title','intent-copy','intent-brief','intent-ask','intent-show','intent-next'].forEach((id,i) => setText(id,values[i]));
  }));

  const rooms = {
    cocina:['Cocina integral','Distribución, puntos de agua y energía, electrodomésticos, almacenamiento y referencias de materiales.'],
    closet:['Closet','Ancho, alto y profundidad aproximados, tipo de puertas, almacenamiento y distribución interior deseada.'],
    bano:['Mueble de baño','Espacio disponible, lavamanos, ubicación de tuberías, condiciones de humedad y almacenamiento necesario.'],
    oficina:['Mobiliario de oficina','Número de puestos, distribución, equipos, conexiones, almacenamiento y condiciones del lugar de trabajo.']
  };
  const readiness = {
    idea:'Conversar sobre la necesidad y solicitar fotos autorizadas del espacio antes de definir una visita.',
    references:'Revisar referencias y medidas aproximadas; registrar preguntas pendientes para la verificación técnica.',
    visit:'Validar cobertura y disponibilidad, y proponer una visita que el cliente y el equipo deben confirmar.'
  };
  function updateQuote() {
    if (!$('room')) return;
    const room = rooms[$('room').value];
    setText('quote-title',room[0]); setText('quote-info',room[1]);
    setText('quote-next',readiness[$('readiness').value]);
  }
  ['room','readiness'].forEach(id => $(id)?.addEventListener('change',updateQuote));

  let meetingText = '';
  function updateMeeting() {
    if (!$('meeting-link')) return;
    const company = document.body.dataset.company;
    const selected = [...document.querySelectorAll('input[name="priority"]:checked')].map(input => input.value);
    const topics = selected.length ? selected.join('; ') : 'revisar el proceso actual y elegir un primer flujo';
    const url = 'https://samuelacuna12.github.io/propuestas/' + document.body.dataset.slug + '/';
    meetingText = 'Hola Samuel, soy del equipo de ' + company + '. Revisé tu propuesta y me gustaría coordinar una reunión de 30 minutos.\n\nTemas: ' + topics + '.\n\nPodemos conversar sobre prioridades, alcance e inversión.\n' + url;
    $('meeting-link').href = 'https://wa.me/573028289997?text=' + encodeURIComponent(meetingText);
    setText('meeting-brief','Para la reunión: ' + topics + '.');
    setText('copy-status','');
  }
  document.querySelectorAll('input[name="priority"]').forEach(input => input.addEventListener('change',updateMeeting));
  updateMeeting();
  $('copy-brief')?.addEventListener('click',async () => {
    try {
      await navigator.clipboard.writeText(meetingText);
      setText('copy-status','Resumen copiado. Puede pegarlo en la conversación con Samuel.');
    } catch {
      setText('meeting-brief',meetingText);
      setText('copy-status','Seleccione y copie el resumen de arriba, o use el enlace de WhatsApp.');
    }
  });

  let printDetails = [];
  window.addEventListener('beforeprint',() => {
    printDetails = [...document.querySelectorAll('details')].filter(detail => !detail.open);
    printDetails.forEach(detail => { detail.open = true; });
  });
  window.addEventListener('afterprint',() => printDetails.forEach(detail => { detail.open = false; }));
  $('print-proposal')?.addEventListener('click',() => window.print());
})();
