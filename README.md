# ASTRO — IA GENERALISTA

Esta versão transforma o projeto existente **almeidaof/ia-captacao-netlify** em **Astro IA Generalista**. Não é um novo repositório.

## Identidade e experiência

- Nome exclusivo: **Astro IA Generalista**.
- Apresentação como inteligência artificial de propósito geral, sem papéis comerciais.
- Interface de área de trabalho: campo para tarefas/dúvidas/ideias e painel de resultado. **Não utiliza tela de mensagens em bolhas.**
- Ações gerais: explicar, criar textos, programar, organizar e outros temas livres.
- Pedidos podem considerar contexto temporário da aba; a opção **Nova tarefa** o apaga.
- Nenhum dado é salvo pelo código do projeto em banco ou no navegador. A API externa processa os pedidos conforme as políticas do provedor.

## Instalar no projeto existente

1. Extraia este ZIP e **substitua os arquivos correspondentes** no repositório `almeidaof/ia-captacao-netlify`, preservando as pastas.
2. Na Netlify, configure as variáveis `ADMIN_PASSWORD` (mínimo 12 caracteres), `GEMINI_API_KEY` e, se desejar, `GEMINI_MODEL` (padrão `gemini-3.8-flash`). Não coloque valores secretos no GitHub.
3. Deixe o deploy atualizar e acesse a página inicial do **mesmo site**.
4. Informe a senha e faça uma solicitação. O resultado aparecerá na área **Resultado do Astro**.
5. Se houver falha 503, confira Netlify > Logs & Metrics > Functions > astro.

## Desativações

- As rotas anteriores de contatos e integração de canais retornam HTTP 410, sem executar ações.
- A antiga rota de teste também retorna HTTP 410.
- Páginas de acesso antigo redirecionam para a página do Astro.
- Se existirem webhooks configurados em serviços externos, desconecte-os no próprio serviço.

## Segurança e validação

A senha é conferida no servidor e a chave Gemini fica apenas nas variáveis do Netlify. Não publique credenciais.
Os testes sintáticos e simulados não garantem que a chave ou o modelo funcionem no seu deploy; confirme com uma solicitação real.
