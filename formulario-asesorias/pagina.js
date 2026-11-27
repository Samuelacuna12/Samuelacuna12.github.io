'use strict';
(() => {
  const form = document.querySelector('#diagnostico');
  const steps = Array.from(form.querySelectorAll('.step'));
  const nav = Array.from(document.querySelectorAll('.steps-nav li'));
  const back = document.querySelector('#back');
  const next = document.querySelector('#next');
  const note = document.querySelector('#feedback');
  const progress = document.querySelector('.progress');
  const controls = Array.from(form.querySelectorAll('.field input, .field select, .field textarea'));
  let index = 0;
  let receiptId = '';
  let signature = '';
  let pending = false;
  let timeout;
  let frame;

  function render(focus) {
    steps.forEach((step, i) => {
      step.hidden = i !== index;
      nav[i].classList.toggle('past', i < index);
      if (i === index) nav[i].setAttribute('aria-current', 'step');
      else nav[i].removeAttribute('aria-current');
    });
    back.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? 'Enviar' : 'Continuar';
    progress.setAttribute('aria-valuenow', String(index + 1));
    progress.firstElementChild.style.width = String((index + 1) * 25) + '%';
    note.textContent = '';
    if (focus) steps[index].querySelector('h3').focus();
  }

  function validate(step) {
    for (const el of step.querySelectorAll('[required]')) {
      let message = '';
      if (el.type === 'checkbox' && !el.checked) message = 'Confirma que podemos contactarte sobre esta solicitud.';
      else if (!el.value.trim()) message = el.tagName === 'SELECT' ? 'Elige una opción para continuar.' : 'Completa este campo para continuar.';
      else if (el.type === 'tel' && (!/^\+?[\d\s().-]+$/.test(el.value.trim()) || !/^\d{7,15}$/.test(el.value.replace(/\D/g, '')))) message = 'Escribe un WhatsApp válido con el indicativo de tu país.';
      el.setCustomValidity(message);
      if (!el.reportValidity()) return false;
    }
    return true;
  }

  function release() {
    clearTimeout(timeout);
    pending = false;
    back.disabled = next.disabled = false;
    form.removeAttribute('aria-busy');
    next.textContent = 'Enviar';
    frame?.remove();
    frame = undefined;
  }

  window.addEventListener('message', (event) => {
    if (!pending || !event.data || event.data.type !== 'asesoria-receipt' || event.data.id !== receiptId) return;
    if (!/^https:\/\/(?:[a-z0-9-]+\.)*googleusercontent\.com$/.test(event.origin) && event.origin !== 'https://script.google.com') return;
    release();
    if (event.data.ok !== true) {
      note.textContent = 'No pudimos registrar la solicitud. Tus respuestas siguen aquí. Intenta enviarla otra vez.';
      return;
    }
    form.hidden = true;
    progress.hidden = true;
    nav.forEach(el => { el.removeAttribute('aria-current'); el.classList.add('past'); });
    const done = document.querySelector('#done');
    done.hidden = false;
    done.querySelector('h3').focus();
    form.reset();
  });

  back.addEventListener('click', () => {
    if (!pending && index > 0) { index--; render(true); }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pending || !validate(steps[index])) return;
    if (index < steps.length - 1) { index++; render(true); return; }

    const url = window.ASESORIAS_RECEPCION;
    if (!url) {
      note.textContent = 'La recepción de solicitudes aún no está habilitada. Vuelve en unos minutos.';
      return;
    }
    const answers = controls.map(input => input.value.trim());
    answers.push('Sí, autorizo el contacto sobre mi solicitud.');
    const payload = JSON.stringify(answers);
    if (payload !== signature) {
      receiptId = crypto.randomUUID();
      signature = payload;
    }
    pending = true;
    next.disabled = back.disabled = true;
    next.textContent = 'Enviando…';
    note.textContent = '';
    form.setAttribute('aria-busy', 'true');
    frame = document.createElement('iframe');
    frame.name = 'recibo-' + crypto.randomUUID();
    frame.hidden = true;
    frame.title = 'Confirmación de recepción';
    document.body.append(frame);
    const request = document.createElement('form');
    request.hidden = true;
    request.action = url;
    request.method = 'POST';
    request.target = frame.name;
    for (const [name, value] of Object.entries({id:receiptId, answers:payload, website:form.elements.website.value})) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      request.append(input);
    }
    document.body.append(request);
    timeout = setTimeout(() => {
      release();
      note.textContent = 'No alcanzamos a confirmar la recepción. Puedes reintentar con las mismas respuestas.';
    }, 50000);
    request.submit();
    request.remove();
  });
  render(false);
})();
