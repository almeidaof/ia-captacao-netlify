const crypto = require('node:crypto');
const { getStore } = require('@netlify/blobs');

const json = (statusCode, data) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  body: JSON.stringify(data)
});

function safeEqual(a, b) {
  if (!a || !b) return false;
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function isAdmin(event) {
  const secret = process.env.ADMIN_PASSWORD;
  return Boolean(secret && secret.length >= 12 && safeEqual(event.headers?.['x-admin-password'] || event.headers?.['X-Admin-Password'], secret));
}

const key = (channel, sender) => `${channel}-${crypto.createHash('sha256').update(String(sender)).digest('hex')}`;
function leadStore() { return getStore('leads'); }
function threadStore() { return getStore('threads'); }
function seenStore() { return getStore('processed-messages'); }

async function saveLead({ channel, sender, name, text }) {
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
module.exports = { json, safeEqual, isAdmin, key, saveLead, leadStore, threadStore, seenStore };
