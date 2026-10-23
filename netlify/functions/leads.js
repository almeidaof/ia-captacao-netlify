const { json, isAdmin, leadStore } = require('./utils/shared');
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { erro: 'Método não permitido' });
  if (!isAdmin(event)) return json(401, { erro: 'Senha incorreta ou não configurada' });
  try {
    const store = leadStore();
    const { blobs } = await store.list();
    const leads = (await Promise.all(blobs.slice(0, 500).map(x => store.get(x.key, {type:'json'})))).filter(Boolean);
    leads.sort((a,b) => String(b.ultimaInteracao || '').localeCompare(String(a.ultimaInteracao || '')));
    return json(200, { leads, parcial: blobs.length > 500 });
  } catch (e) {
    console.error('Falha ao listar leads:', e.message);
    return json(503, { erro: 'Não foi possível carregar os contatos' });
  }
};
