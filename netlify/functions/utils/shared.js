import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

export function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export function safeEqual(a, b) {
  if (!a || !b) return false;
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export function isAdmin(req) {
  const secret = process.env.ADMIN_PASSWORD;
  return Boolean(secret && secret.length >= 12 && safeEqual(req.headers.get('x-admin-password'), secret));
}

export const key = (channel, sender) => `${channel}-${crypto.createHash('sha256').update(String(sender)).digest('hex')}`;
// Os stores são criados durante a execução das funções Netlify v2, nunca no carregamento do módulo.
export function leadStore() { return getStore('leads'); }
export function threadStore() { return getStore('threads'); }
export function seenStore() { return getStore('processed-messages'); }

export async function saveLead({ channel, sender, name, text }) {
  const store = leadStore();
  const id = key(channel, sender);
  const old = (await store.get(id, { type: 'json', consistency: 'strong' })) || {};
  const now = new Date().toISOString();
  const lead = {
    id,
    nome: (old.nome && old.nome !== 'Não informado' ? old.nome : name) || 'Não informado',
    canal: channel,
    contato: String(sender),
    interesse: old.interesse || String(text).slice(0, 400),
    ultimaMensagem: String(text).slice(0, 400),
    primeiraInteracao: old.primeiraInteracao || now,
    ultimaInteracao: now,
    mensagens: (old.mensagens || 0) + 1
  };
  await store.setJSON(id, lead);
}
