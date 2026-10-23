const senha = document.querySelector('#senha');
const status = document.querySelector('#status');
const cards = document.querySelector('#cards');
const resumo = document.querySelector('#summary');
const csvBtn = document.querySelector('#csv');
let leads = [];
function node(tag, text, classname) { const e = document.createElement(tag); if(classname)e.className=classname; e.textContent=String(text??''); return e; }
async function carregar() {
  cards.replaceChildren(); resumo.textContent=''; csvBtn.disabled=true; leads=[];
  status.textContent='Carregando...';
  try {
    const r=await fetch('/.netlify/functions/leads',{headers:{'x-admin-password':senha.value},cache:'no-store'});
    const data=await r.json();
    if(!r.ok)throw new Error(data.erro||'Erro no servidor');
    leads = data.leads||[];
    resumo.textContent=`${leads.length} contato(s)${data.parcial?' (lista parcial)':''}`;
    status.textContent=leads.length?'Contatos carregados.':'Nenhum contato captado ainda.';
    for(const l of leads){
      const c=node('article','','card'); c.append(node('h2',l.nome||'Não informado'),node('span',l.canal||'','tag'));
      c.append(node('p','Contato: '+(l.contato||'—')),node('p','Interesse inicial: '+(l.interesse||'—')),
      node('p','Última mensagem: '+(l.ultimaMensagem||'—')),
      node('small',l.ultimaInteracao?new Date(l.ultimaInteracao).toLocaleString('pt-BR'):'Data indisponível'));
      cards.append(c);
    }
    csvBtn.disabled=leads.length===0;
  }catch(e){status.textContent=e.message+' — confira a senha e o deploy do site.';}
}
function cell(v){let s=String(v??'');if(/^[\s]*[=+\-@\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function exportar(){if(!leads.length)return;const keys=['nome','canal','contato','interesse','ultimaMensagem','primeiraInteracao','ultimaInteracao','mensagens'];
 const csv='\ufeff'+keys.map(cell).join(',')+'\r\n'+leads.map(l=>keys.map(k=>cell(l[k])).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download='leads.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
document.querySelector('#btn').addEventListener('click',carregar);
csvBtn.addEventListener('click',exportar);
senha.addEventListener('keydown',e=>{if(e.key==='Enter')carregar();});
