import crypto from 'node:crypto';
import { json, safeEqual, key, saveLead, threadStore, seenStore } from './utils/shared.js';
import { gerarResposta } from './utils/gemini.js';

function validarAssinatura(req, rawBody) {
  const signature = req.headers.get('x-hub-signature-256');
  if (!signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  const secrets = [process.env.META_APP_SECRET, process.env.INSTAGRAM_APP_SECRET].filter(Boolean);
  return secrets.some(secret => safeEqual(signature, 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')));
}

async function enviarInstagram(psid, message) {
  if (!process.env.IG_PAGE_TOKEN) throw new Error('IG_PAGE_TOKEN não configurado');
  const r = await fetch(`https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v26.0'}/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.IG_PAGE_TOKEN}` },
    body: JSON.stringify({ recipient: { id: psid }, messaging_type: 'RESPONSE', message: { text: message } })
  });
  if (!r.ok) throw new Error(`Instagram HTTP ${r.status}`);
}
async function enviarWhatsApp(to, message) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) throw new Error('Credenciais WhatsApp incompletas');
  const r = await fetch(`https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v26.0'}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: message } })
  });
  if (!r.ok) throw new Error(`WhatsApp HTTP ${r.status}`);
}

async function atender({ channel, sender, text, id, name }) {
  if (!sender || typeof text !== 'string' || !text.trim()) return;
  const unique = key(channel, id || `${sender}:${text}`);
  const seen = seenStore();
  if (await seen.get(unique)) return;
  const threads = threadStore();
  const threadKey = key(channel, sender);
  const historico = (await threads.get(threadKey, { type: 'json', consistency: 'strong' })) || [];
  const resposta = await gerarResposta(historico, text);
  if (channel === 'instagram') await enviarInstagram(sender, resposta);
  else await enviarWhatsApp(sender, resposta);
  await seen.set(unique, new Date().toISOString());
  await Promise.all([
    threads.setJSON(threadKey, [...historico, { role: 'user', text }, { role: 'model', text: resposta }].slice(-12)),
    saveLead({ channel, sender, name, text })
  ]);
}

export default async function handler(req) {
  if (req.method === 'GET') {
    const params = new URL(req.url).searchParams;
    if (process.env.VERIFY_TOKEN && params.get('hub.mode') === 'subscribe' && safeEqual(params.get('hub.verify_token'), process.env.VERIFY_TOKEN) && params.get('hub.challenge')) {
      return new Response(params.get('hub.challenge'), { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return json(403, { erro: 'Verificação inválida' });
  }
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido' });
  const rawBody = Buffer.from(await req.arrayBuffer());
  if (!rawBody.length || rawBody.length > 100000) return json(413, { erro: 'Evento muito grande' });
  if (!validarAssinatura(req, rawBody)) return json(401, { erro: 'Assinatura inválida' });
  try {
    const dado = JSON.parse(rawBody.toString('utf8'));
    if (dado.object === 'instagram') {
      for (const entry of dado.entry || []) {
        for (const msg of entry.messaging || []) {
          if (msg.message?.is_echo || !msg.message?.text) continue;
          await atender({ channel: 'instagram', sender: msg.sender?.id, text: msg.message.text, id: msg.message.mid });
        }
      }
    } else if (dado.object === 'whatsapp_business_account') {
      for (const entry of dado.entry || []) {
        for (const change of entry.changes || []) {
          const name = change.value?.contacts?.[0]?.profile?.name;
          for (const msg of change.value?.messages || []) {
            if (msg.type !== 'text') continue;
            await atender({ channel: 'whatsapp', sender: msg.from, text: msg.text?.body, id: msg.id, name });
          }
        }
      }
    }
    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (e) {
    console.error('Erro webhook:', e.name, e.message);
    return json(503, { erro: 'Falha temporária ao processar mensagem' });
  }
}
