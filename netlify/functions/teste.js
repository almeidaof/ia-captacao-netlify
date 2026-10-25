import { json } from './utils/shared.js';
// Endpoint anterior encerrado. Astro utiliza exclusivamente a função /astro.
export default async function handler() {
  return json(410, { erro: 'Esta função foi encerrada. Use a página inicial do Astro.' });
}
