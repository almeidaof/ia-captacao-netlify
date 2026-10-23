const crypto = require('node:crypto');
const { json, safeEqual, key, saveLead, threadStore, seenStore } = require('./utils/shared');
const { gerarResposta } = require('./utils/gemini');

function validarAssinatura(event) {
  const signature = event.headers?.['x-hub-signature-256'] || event.headers?.['X-Hub-Signature-256'];
  if (!signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  const raw = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
  const secrets = [process.env.META_APP_SECRET, process.env.INSTAGRAM_APP_SECRET].filter(Boolean);
  return secrets.some(secret => safeEqual(signature, 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex')));
}

async function enviarInstagram(psid, message) {
  if (!process.env.IG_PAGE_TOKEN) throw new Error('IG_PAGE_TOKEN não configurado');
  const r = await fetch(`https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v26.0'}/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.IG_PAGE_TOKEN}` },
    body: JSON.stringify({recipient:{id:psid}, messaging_type:'RESPONSE', message:{text:message}})
  });
  if (!r.ok) throw new Error(`Instagram HTTP ${r.status}`);
}
async function enviarWhatsApp(to, message) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) throw new Error('Credenciais WhatsApp incompletas');
  const r = await fetch(`https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v26.0'}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product:'whatsapp', to, type:'text', text:{body:message} })
  });
  if (!r.ok) throw new Error(`WhatsApp HTTP ${r.status}`);
}

async function atender({channel, sender, text, id, name}) {
  if (!sender || typeof text !== 'string' || !text.trim()) return;
  const unique = key(channel, id || `${sender}:${text}`);
  const seen = seenStore();
  if (await seen.get(unique)) return;
  const threads = threadStore();
  const threadKey = key(channel, sender);
  const historico = (await threads.get(threadKey, {type:'json', consistency:'strong'})) || [];
  const resposta = await gerarResposta(historico, text);
  if (channel === 'instagram') await enviarInstagram(sender, resposta);
  else await enviarWhatsApp(sender, resposta);
  await seen.set(unique, new Date().toISOString());
  await Promise.all([
    threads.setJSON(threadKey, [...historico, {role:'user', text}, {role:'model',text:resposta}].slice(-12)),
    saveLead({channel, sender, name, text})
  ]);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const p = event.queryStringParameters || {};
    if (process.env.VERIFY_TOKEN && p['hub.mode'] === 'subscribe' && safeEqual(p['hub.verify_token'], process.env.VERIFY_TOKEN) && p['hub.challenge']) {
      return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: String(p['hub.challenge']) };
    }
    return json(403, { erro: 'Verificação inválida' });
  }
  if (event.httpMethod !== 'POST') return json(405, { erro: 'Método não permitido' });
  if (!validarAssinatura(event)) return json(401, { erro: 'Assinatura inválida' });
  if (!event.body || event.body.length > 100000) return json(413, { erro: 'Evento muito grande' });
  try {
    const dado = JSON.parse(event.body);
    if (dado.object === 'instagram') {
      for (const entry of dado.entry || []) {
        for (const msg of entry.messaging || []) {
          if (msg.message?.is_echo || !msg.message?.text) continue;
          await atender({ channel:'instagram', sender: msg.sender?.id, text: msg.message.text, id: msg.message.mid });
        }
      }
    } else if (dado.object === 'whatsapp_business_account') {
      for (const entry of dado.entry || []) {
        for (const change of entry.changes || []) {
          const name = change.value?.contacts?.[0]?.profile?.name;
          for (const msg of change.value?.messages || []) {
            if (msg.type !== 'text') continue;
            await atender({ channel:'whatsapp', sender:msg.from, text:msg.text?.body, id:msg.id, name });
          }
        }
      }
    }
    return { statusCode:200, body:'EVENT_RECEIVED' };
  } catch (e) {
    console.error('Erro webhook:', e.message);
    return json(503, { erro:'Falha temporária ao processar mensagem' });
  }
};
