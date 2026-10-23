const chat=document.querySelector('#chat'); const msg=document.querySelector('#mensagem'); const send=document.querySelector('#enviar'); const status=document.querySelector('#status');const pwd=document.querySelector('#senha');
let historico=[];
function bolha(text,classe){const e=document.createElement('div');e.className='message '+classe;e.textContent=text;chat.append(e);chat.scrollTop=chat.scrollHeight;}
async function enviar(){const texto=msg.value.trim();if(!texto)return;send.disabled=true;status.textContent='Consultando a IA...';
try{const r=await fetch('/.netlify/functions/teste',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':pwd.value},body:JSON.stringify({mensagem:texto,historico})});const j=await r.json();if(!r.ok)throw new Error(j.erro||'Erro');
bolha(texto,'user');bolha(j.resposta,'bot');historico.push({role:'user',text:texto},{role:'model',text:j.resposta});historico=historico.slice(-12);msg.value='';status.textContent='Resposta recebida.';
}catch(e){status.textContent=e.message;}finally{send.disabled=false;}}
send.addEventListener('click',enviar);
msg.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar();}});
document.querySelector('#limpar').addEventListener('click',()=>{historico=[];chat.replaceChildren();status.textContent='Conversa apagada desta aba.';});
