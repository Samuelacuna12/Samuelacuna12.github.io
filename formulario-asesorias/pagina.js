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
  const receiver = 'https://script.google.com/macros/s/AKfycbxDpRSOnC61ceyar6UIv7VvwrN1ShKbsckMYofui8e3063odAa3dKXsbQgecJZlotI5/exec';
  const whatsapp = 'https://wa.me/573028289997';
  const consentText = 'Sí, autorizo el contacto sobre mi solicitud.';
  // Build the recovery controls here so visitors with an older copy of the HTML can use them too.
  note.insertAdjacentHTML('afterend', `
    <section id="alternativas" aria-label="Opciones de envío" hidden>
      <p id="ayuda-envio"></p>
      <div class="alternativas-acciones">
        <button type="button" id="descargar-txt">Descargar mis preguntas en TXT</button>
        <a id="enviar-whatsapp" target="_blank" rel="noopener noreferrer">Enviar a Samuel por WhatsApp</a>
      </div>
    </section>`);
  const fallback = document.querySelector('#alternativas');
  const chatLink = document.querySelector('#enviar-whatsapp');
  const fallbackHelp = document.querySelector('#ayuda-envio');
  let index = 0;
  let receiptId = '';
  let signature = '';
  let pending = false;
  let timeout;
  let frame;

  function newReceiptId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-');
  }

  function questionsAndAnswers() {
    return controls.map((field, i) =>
      (i + 1) + '. ' + field.labels[0].textContent.trim() + '\r\n' + field.value.trim()
    ).join('\r\n\r\n');
  }

  function updateChat() {
    const text = 'Hola, Samuel. Te envío mi solicitud de asesoría ecommerce.\n\n' + questionsAndAnswers();
    const fullLink = whatsapp + '?text=' + encodeURIComponent(text);
    if (fullLink.length <= 3800) {
      chatLink.href = fullLink;
      fallbackHelp.textContent = 'Puedes guardar una copia o abrir WhatsApp con tus respuestas listas. En el chat, toca Enviar.';
    } else {
      chatLink.href = whatsapp + '?text=' + encodeURIComponent('Hola, Samuel. Te envío el TXT con mis respuestas para la asesoría ecommerce.');
      fallbackHelp.textContent = 'Descarga el TXT con todas tus respuestas. Luego abre WhatsApp, adjunta el archivo y toca Enviar.';
    }
  }

  function showFallback(message) {
    release();
    note.textContent = message;
    next.textContent = 'Reintentar envío';
    fallback.hidden = false;
    updateChat();
  }

  document.querySelector('#descargar-txt').addEventListener('click', () => {
    const text = 'Solicitud de asesoría ecommerce — Samuel Acuña\r\n\r\n' + questionsAndAnswers()
      + '\r\n\r\n' + form.elements.consent.labels[0].textContent.trim() + ' ' + (form.elements.consent.checked ? 'Sí.' : 'No.') + '\r\n';
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob(['\uFEFF', text], {type:'text/plain;charset=utf-8'}));
    link.href = url;
    link.download = 'Mis-preguntas-y-respuestas-asesoria.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  });

  chatLink.addEventListener('click', (event) => {
    if (!validate(steps[index])) { event.preventDefault(); return; }
    updateChat();
  });

  form.addEventListener('input', () => {
    if (!fallback.hidden) updateChat();
  });

  function render(focus) {
    fallback.hidden = true;
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
    if (event.data.ok !== true) {
      showFallback('No pudimos guardar tu solicitud. Tus respuestas siguen aquí.');
      return;
    }
    release();
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

    fallback.hidden = true;
    if (navigator.onLine === false) {
      showFallback('Parece que estás sin conexión. Puedes descargar tus respuestas ahora y enviarlas cuando vuelvas a tener internet.');
      return;
    }
    const answers = controls.map(input => input.value.trim());
    answers.push(consentText);
    const payload = JSON.stringify(answers);
    if (payload !== signature) {
      receiptId = newReceiptId();
      signature = payload;
    }
    pending = true;
    next.disabled = back.disabled = true;
    next.textContent = 'Enviando…';
    note.textContent = '';
    form.setAttribute('aria-busy', 'true');
    frame = document.createElement('iframe');
    frame.name = 'recibo-' + receiptId;
    frame.hidden = true;
    frame.title = 'Confirmación de recepción';
    document.body.append(frame);
    const request = document.createElement('form');
    request.hidden = true;
    request.action = receiver;
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
      showFallback('No pudimos confirmar si llegó tu solicitud. Puedes reintentar el envío o enviármela por WhatsApp.');
    }, 50000);
    try {
      request.submit();
    } catch {
      showFallback('El navegador no pudo completar el envío. Tus respuestas siguen aquí.');
    } finally {
      request.remove();
    }
  });
  render(false);
})();
