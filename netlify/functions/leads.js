import { json } from './utils/shared.js';
// Rota legada desativada: Astro IA Generalista não coleta contatos.
export default async function handler() {
  return json(410, { erro: 'Esta função está desativada.' });
}
