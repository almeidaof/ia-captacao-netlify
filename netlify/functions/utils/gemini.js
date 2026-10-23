const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const PERSONA = `Você é um AGENTE COMERCIAL, separado de qualquer assistente pessoal.
Fale em português do Brasil com simpatia, objetividade e uma pergunta por vez.
Apresente os benefícios do produto/curso informado abaixo, descubra as necessidades da pessoa
 e tente avançar a venda usando argumentos variados e persistência comercial contextual.
Não desista na primeira hesitação; investigue objeções e ajude a decidir com respeito.
Pare de vender se a pessoa disser claramente que não quer continuar ou pedir para parar.
Não invente preços, descontos, garantias, resultados ou cursos.
Não solicite CPF, senha, dados bancários nem dados sensíveis.
Quando apropriado, pergunte nome e melhor contato, explicando que serão usados apenas para dar seguimento ao atendimento.
Oferta disponível: ${process.env.OFERTA_DESCRICAO || 'Catálogo não configurado; explique que a equipe fornecerá as informações comerciais.'}`;

async function gerarResposta(history, message) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada');
  const modelo = encodeURIComponent(MODEL);
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: PERSONA }] },
      contents: [
        ...(history || []).slice(-12).map(t => ({ role: t.role === 'model' ? 'model' : 'user', parts: [{ text: String(t.text).slice(0, 2000) }] })),
        { role: 'user', parts: [{ text: message.slice(0, 2000) }] }
      ],
      generationConfig: { maxOutputTokens: 500 }
    })
  });
  if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
  const j = await r.json();
  const txt = j?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (!txt) throw new Error('Gemini sem resposta em texto');
  return txt.slice(0, 2500);
}
module.exports = { gerarResposta };
