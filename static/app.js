const form = document.querySelector('#ask-form');
const workers = document.querySelector('#workers');
const workerValue = document.querySelector('#worker-value');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
workers.addEventListener('input', () => workerValue.textContent = workers.value);
const escapeHtml = text => text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
form.addEventListener('submit', async event => {
  event.preventDefault(); result.hidden = true; status.hidden = false; status.textContent = 'Workers are reading their assigned pages…';
  const button = form.querySelector('button'); button.disabled = true;
  try {
    const response = await fetch('/api/ask', {method: 'POST', body: new FormData(form)});
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unexpected request failure.');
    document.querySelector('#answer').innerHTML = escapeHtml(data.answer).replace(/\n/g, '<br>');
    document.querySelector('#findings').innerHTML = data.findings.map(f => `<article><b>Worker ${f.chunk} · pages ${f.pages}</b><p>${escapeHtml(f.answer)}</p></article>`).join('');
    status.textContent = `${data.workers_used} workers completed.`; result.hidden = false;
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});
