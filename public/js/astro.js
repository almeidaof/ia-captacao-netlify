const pedido = document.querySelector('#pedido');
const senha = document.querySelector('#senha');
const enviarBtn = document.querySelector('#enviar');
const novoBtn = document.querySelector('#novo');
const copiarBtn = document.querySelector('#copiar');
const status = document.querySelector('#status');
const resultado = document.querySelector('#resultado');
let contexto = [];
let ocupado = false;
let ultimaResposta = '';

function mostrarResultado(texto) {
  resultado.textContent = texto;
  resultado.classList.remove('empty', 'busy');
  ultimaResposta = texto;
  copiarBtn.disabled = !texto;
}
async function solicitar() {
  const texto = pedido.value.trim();
  if (!texto || ocupado) return;
  if (!senha.value) {
    status.textContent = 'Informe a senha de acesso.';
    senha.focus();
    return;
  }
  ocupado = true;
  enviarBtn.disabled = true;
  copiarBtn.disabled = true;
  resultado.classList.add('busy');
  status.textContent = 'O Astro está preparando o resultado...';
  try {
    const response = await fetch('/.netlify/functions/astro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': senha.value },
      body: JSON.stringify({ pedido: texto, contexto }),
      cache: 'no-store'
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.erro || `Não foi possível concluir (HTTP ${response.status}).`);
    if (typeof data?.resultado !== 'string' || !data.resultado.trim()) throw new Error('O Astro não retornou um resultado válido.');
    mostrarResultado(data.resultado);
    contexto.push({ role: 'user', text: texto }, { role: 'model', text: data.resultado });
    contexto = contexto.slice(-10);
    status.textContent = 'Resultado pronto.';
  } catch (e) {
    status.textContent = e.message || 'Ocorreu uma falha. Tente novamente.';
    resultado.classList.remove('busy');
    copiarBtn.disabled = !ultimaResposta;
  } finally {
    ocupado = false;
    enviarBtn.disabled = false;
  }
}
enviarBtn.addEventListener('click', solicitar);
pedido.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); solicitar(); } });
novoBtn.addEventListener('click', () => {
  contexto = [];
  pedido.value = '';
  resultado.textContent = 'O resultado da sua solicitação aparecerá aqui.';
  resultado.classList.add('empty');
  resultado.classList.remove('busy');
  ultimaResposta = '';
  copiarBtn.disabled = true;
  status.textContent = 'Pronto para uma nova tarefa.';
  pedido.focus();
});
document.querySelector('#mostrar').addEventListener('click', () => {
  const visivel = senha.type === 'password';
  senha.type = visivel ? 'text' : 'password';
  document.querySelector('#mostrar').textContent = visivel ? 'Ocultar' : 'Mostrar';
});
document.querySelectorAll('[data-idea]').forEach(btn => btn.addEventListener('click', () => {
  pedido.value = btn.dataset.idea;
  pedido.focus();
  pedido.setSelectionRange(pedido.value.length, pedido.value.length);
}));
copiarBtn.addEventListener('click', async () => {
  if (!ultimaResposta) return;
  try {
    await navigator.clipboard.writeText(ultimaResposta);
    status.textContent = 'Resultado copiado.';
  } catch {
    status.textContent = 'Não foi possível copiar automaticamente. Selecione o resultado para copiar.';
  }
});
