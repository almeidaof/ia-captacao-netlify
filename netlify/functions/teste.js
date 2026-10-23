const { json, isAdmin } = require('./utils/shared');
const { gerarResposta } = require('./utils/gemini');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { erro: 'Método não permitido' });
  if (!isAdmin(event)) return json(401, { erro: 'Senha incorreta ou não configurada' });
  if (!event.body || event.body.length > 20000) return json(413, { erro: 'Mensagem muito grande' });
  try {
    const body = JSON.parse(event.body);
    const msg = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';
    if (!msg || msg.length > 2000) return json(400, { erro: 'Informe uma mensagem até 2000 caracteres' });
    const history = Array.isArray(body.historico) ? body.historico.slice(-12).filter(x => ['user','model'].includes(x.role) && typeof x.text === 'string') : [];
    return json(200, { resposta: await gerarResposta(history, msg) });
  } catch (e) {
    console.error('Falha no teste:', e.message);
    return json(503, { erro: 'Falha na IA. Confira a chave, o modelo e a disponibilidade.' });
  }
};
