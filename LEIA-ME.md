# IA captação Netlify — correção das Functions v2

**Correção:** `leads.js`, `teste.js` e `webhook.js` agora usam a API de Functions v2 (`export default`), compatível com a configuração automática do Netlify Blobs. A versão anterior usava `exports.handler` (API v1), que pode provocar erro 503 ao consultar os leads.

## Atualizar a implantação GitHub + Netlify

1. Extraia este ZIP.
2. No GitHub, **substitua os arquivos existentes** do repositório pelos arquivos extraídos, mantendo a estrutura (`netlify/`, `public/`, `package.json`, `netlify.toml`). Confirme que `netlify/functions/leads.js` começa com `import { json, isAdmin, leadStore }` e contém `export default` — NÃO deixe a função antiga no GitHub.
3. Aguarde o deploy automático em Netlify > Deploys. Se não houver deploy automático, use Trigger deploy > Deploy project.
4. Abra o painel e teste a senha (mesma senha `ADMIN_PASSWORD` que já configurou). Como ainda não conectamos os canais Meta, o resultado esperado é `Nenhum contato captado ainda.` — isto é normal.
5. `GEMINI_API_KEY` não é necessária para listar leads. A integração com Gemini requer chave e disponibilidade do modelo em sua conta. Teste o agente em `/teste.html` usando a senha de admin.

## Segurança

- Mantenha a senha e chaves SOMENTE em Netlify Environment variables, nunca nos arquivos ou GitHub.
- A página de testes exige a senha do painel. Não abra o armazenamento de contatos sem autenticação.
- Sem integração Meta, ainda não há leads reais.
- Testes sintáticos locais não substituem o teste do deploy e logs das Functions na conta Netlify.
- Se persistir erro 503: Netlify > Logs & Metrics > Functions > leads e consulte a mensagem exata do erro; nunca envie segredos.

## O que o projeto contém

- `public/index.html`: painel de leads.
- `public/teste.html`: teste da IA de vendas.
- `netlify/functions/`: três funções Netlify v2, com checagem de senha e validação de webhook da Meta.
- `netlify/functions/utils/`: biblioteca Gemini e utilitários do armazenamento.

**Observação:** o serviço continua um protótipo. WhatsApp e Instagram dependem de integração, permissões e credenciais da Meta. Contatos pessoais exigem política de privacidade e conformidade com a LGPD.
