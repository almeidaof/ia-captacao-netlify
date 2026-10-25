import { json } from './utils/shared.js';
// Rota legada desativada: não há integração de atendimento comercial.
export default async function handler() {
  return json(410, { erro: 'Esta função está desativada.' });
}
