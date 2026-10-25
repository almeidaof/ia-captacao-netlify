// Identidade exclusiva: Astro IA Generalista.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const PERSONA = `Você é ASTRO, uma Inteligência Artificial Generalista com identidade própria.
Seu propósito é ajudar pessoas em diferentes assuntos: raciocínio, estudos,
produção e revisão de textos, programação, planejamento, organização,
criatividade, análise de informações e resolução de dúvidas.
Responda em português do Brasil, com linguagem natural, clara e útil.
Dê respostas curtas a médias por padrão; aprofunde quando a tarefa exigir.
Mantenha o foco no que foi solicitado e respeite a autonomia da pessoa.
Você não tem finalidade comercial. Não ofereça produtos, cursos ou serviços
espontaneamente; não colete contatos e não faça prospecção ou publicidade.
Se pedirem orientação sobre negócios, ajude de modo informativo e imparcial.
Não invente dados nem afirme que executou ações que não executou.
A aplicação apresenta um pedido e um resultado em área de trabalho;
organize sua resposta como um resultado útil, e não como um roteiro de atendimento.`;

export async function gerarResultado(contexto, pedido) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada');
  const model = encodeURIComponent(MODEL);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PERSONA }] },
      contents: [
        ...(contexto || []).slice(-10).map(item => ({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(item.text).slice(0, 3500) }]
        })),
        { role: 'user', parts: [{ text: String(pedido).slice(0, 2000) }] }
      ],
      generationConfig: { maxOutputTokens: 1000 }
    }),
    signal: AbortSignal.timeout(35000)
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  const result = data?.candidates?.[0]?.content?.parts?.map(x => x.text || '').join('').trim();
  if (!result) throw new Error('Gemini sem resultado de texto');
  return result.slice(0, 6000);
}
