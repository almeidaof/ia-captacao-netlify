import crypto from 'node:crypto';

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

function safeEqual(a, b) {
  if (!a || !b) return false;
  const aHash = crypto.createHash('sha256').update(String(a)).digest();
  const bHash = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

export function isAdmin(req) {
  const secret = process.env.ADMIN_PASSWORD;
  return Boolean(secret && secret.length >= 12 && safeEqual(req.headers.get('x-admin-password'), secret));
}
