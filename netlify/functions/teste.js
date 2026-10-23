import { json, isAdmin } from './utils/shared.js';
import { gerarResposta } from './utils/gemini.js';

export default async function handler(req) {
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido' });
  if (!isAdmin(req)) return json(401, { erro: 'Senha incorreta ou não configurada' });
  const raw = await req.text();
  if (!raw || raw.length > 20000) return json(413, { erro: 'Mensagem muito grande' });
  let body;
  try { body = JSON.parse(raw); }
  catch { return json(400, { erro: 'JSON inválido' }); }
  const msg = typeof body?.mensagem === 'string' ? body.mensagem.trim() : '';
  if (!msg || msg.length > 2000) return json(400, { erro: 'Informe uma mensagem até 2000 caracteres' });
  const history = Array.isArray(body.historico)
    ? body.historico.slice(-12).filter(x => ['user', 'model'].includes(x?.role) && typeof x?.text === 'string')
    : [];
  try {
    return json(200, { resposta: await gerarResposta(history, msg) });
  } catch (e) {
    console.error('Falha no teste:', e.name, e.message);
    return json(503, { erro: 'Falha na IA. Confira a chave, o modelo e a disponibilidade.' });
  }
}
