# Agente comercial no Netlify — versão revisada

## O que existe agora

**Página 1:** `/` — painel de leads protegido por senha, com exportação CSV.
**Página 2:** `/teste.html` — conversa de teste com Gemini, separada do atendimento real e sem gravar leads.
**Integrações:** funções para WhatsApp e Instagram via APIs oficiais da Meta (dependem das contas e permissões na Meta).

**Não está conectado à Meta nem ao Gemini só por subir o ZIP.** As integrações e permissões ainda precisam ser configuradas e validadas com credenciais próprias. Este é um protótipo, não um serviço de produção revisado juridicamente.

## Passo a passo (um por vez)

1. Coloque a **pasta completa** no seu GitHub (repositório privado, se preferir). NÃO coloque nenhuma chave real em arquivos ou no GitHub; `.env.example` é só um exemplo.
2. No [Netlify](https://app.netlify.com/), crie novo projeto via **Import an existing project > GitHub** e selecione o repositório. Publicação: `public`; pasta de funções: `netlify/functions` (definidos em `netlify.toml`).
3. Nas **Environment variables**, cadastre primeiro só `ADMIN_PASSWORD` (pelo menos 12 caracteres aleatórios), `GEMINI_API_KEY` e `OFERTA_DESCRICAO` (descrição real da oferta). `GEMINI_MODEL` é opcional (padrão `gemini-3.8-flash`).
4. Faça deploy. Abra `/teste.html`, digite a senha e experimente uma conversa. O painel `/` estará vazio até uma integração real enviar contatos.
5. Para integrar a Meta, obtenha na plataforma oficial: `VERIFY_TOKEN`, `META_APP_SECRET` e/ou `INSTAGRAM_APP_SECRET` conforme a modalidade, `IG_PAGE_TOKEN`, `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID`. Configure o webhook com `https://SEU-SITE.netlify.app/.netlify/functions/webhook`. A assinatura dos eventos é verificada antes de processar mensagens. Necessário configurar permissões, assinatura de eventos, teste de envio/recebimento, revisão do app quando aplicável.

## Melhorias feitas no projeto original

- O endpoint de leads **não é público**. Só GET com senha; o POST público foi removido.
- O webhook da Meta valida a assinatura `X-Hub-Signature-256`.
- A página de teste é separada e protegida, não grava contatos.
- Somente `public/` é publicado como site estático; o código das funções fica fora da pasta pública.
- Histórico curto de cada conversa para a IA não esquecer imediatamente as últimas mensagens.
- Uma ficha por contato em vez de uma ficha por mensagem (protótipo; atualizações simultâneas ainda podem exigir banco transacional).
- Erros externos não fingem sucesso; os logs omitem segredos.
- Exportação CSV trata células iniciadas por fórmulas.

## Atenção antes de produção

- Política de privacidade, base legal LGPD, retenção/apagamento de dados e aviso aos clientes.
- Painel por senha compartilhada é suficiente para protótipo, mas para equipe use login autenticado e controles de permissão, além de limite de requisições.
- Confirme modalidade da API do Instagram escolhida (Facebook Login/Page Token ou Instagram Login), autorização e endereço de envio. O código usa **Facebook Login/Page Token**, e essa escolha pode exigir ajustes no seu app Meta.
- A IA não infere automaticamente nome/telefone informado em texto nem aplica funil CRM completo; a ficha captura perfil do WhatsApp quando disponível e identificadores dos canais.
- Os testes locais da interface não provam que a Meta aprovará nem que o envio ocorrerá no ambiente real.
- Verifique disponibilidade e custos da API Gemini e da Meta em suas contas antes de liberar clientes.
