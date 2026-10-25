import { json, isAdmin } from './utils/shared.js';
import { gerarResultado } from './utils/gemini.js';

export default async function handler(req) {
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });
  if (!isAdmin(req)) return json(401, { erro: 'Senha incorreta ou não configurada.' });
  const raw = await req.text();
  if (!raw || raw.length > 20000) return json(413, { erro: 'Solicitação muito grande.' });
  let body;
  try { body = JSON.parse(raw); }
  catch { return json(400, { erro: 'Dados inválidos.' }); }
  const pedido = typeof body?.pedido === 'string' ? body.pedido.trim() : '';
  if (!pedido || pedido.length > 2000) return json(400, { erro: 'Escreva sua solicitação (máximo 2000 caracteres).' });
  const contexto = Array.isArray(body.contexto) ? body.contexto.slice(-10)
    .filter(x => x && ['user', 'model'].includes(x.role) && typeof x.text === 'string' && x.text.length <= 3500)
    .map(x => ({ role: x.role, text: x.text })) : [];
  try {
    return json(200, { resultado: await gerarResultado(contexto, pedido) });
  } catch (e) {
    console.error('Falha Astro IA:', e.name, e.message);
    if (e.message === 'GEMINI_API_KEY não configurada') return json(503, { erro: 'A chave Gemini não está configurada na Netlify.' });
    if (/Gemini HTTP 429/.test(e.message)) return json(503, { erro: 'O Gemini está ocupado. Tente novamente.' });
    if (/Gemini HTTP 404/.test(e.message)) return json(503, { erro: 'Modelo Gemini não encontrado. Confira GEMINI_MODEL na Netlify.' });
    return json(503, { erro: 'Não foi possível conectar ao Gemini. Confira a chave, o modelo e a disponibilidade.' });
  }
}
