import 'server-only';
import {isIP} from 'node:net';
import sanitizeHtml from 'sanitize-html';
function publicIPv4(value:string){if(isIP(value)!==4)return false;const [a,b]=value.split('.').map(Number);return a!==undefined&&b!==undefined&&a!==0&&a!==10&&a!==127&&a<224&&!(a===169&&b===254)&&!(a===172&&b>=16&&b<=31)&&!(a===192&&b===168)&&!(a===100&&b>=64&&b<=127)&&!(a===198&&(b===18||b===19));}
async function publicHost(host:string){
 if(isIP(host)||!host.includes('.')||/localhost|\.local$|\.internal$|\.test$/.test(host))throw new Error('Informe um site público HTTPS.');
 const r=await fetch('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(host)+'&type=A',{headers:{Accept:'application/dns-json'},signal:AbortSignal.timeout(5000),cache:'no-store'});
 if(!r.ok)throw new Error('Não foi possível conferir o domínio.');
 const data:unknown=await r.json();const schema=data as {Answer?:{type:number;data:string}[]};const ips=schema.Answer?.filter(a=>a.type===1).map(a=>a.data)??[];
 if(!ips.length||ips.some(ip=>!publicIPv4(ip)))throw new Error('O domínio precisa apontar para um site público.');
}
export async function checkBadgeLink(website:string,page:string,profile:string,code:string){
 const origin=new URL(website);const target=new URL(page||website);
 if(target.protocol!=='https:'||target.username||target.password||target.port&&target.port!=='443'||target.hostname.toLowerCase()!==origin.hostname.toLowerCase())throw new Error('Use uma página HTTPS no mesmo domínio do site cadastrado.');
 await publicHost(target.hostname);
 const response=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'Selletive-Link-Verification/1.0','Accept':'text/html'},cache:'no-store'});
 if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Não foi possível ler a página. Informe a URL final, sem redirecionamentos.');
 const reader=response.body?.getReader();if(!reader)throw new Error('Página vazia.');const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>524288){await reader.cancel();throw new Error('Página muito grande. Use uma página menor com o selo.');}chunks.push(value);}
 const html=new TextDecoder().decode(Buffer.concat(chunks));let found=false;
 sanitizeHtml(html,{allowedTags:['a'],allowedAttributes:{a:['href','data-selletive-code']},nonTextTags:['script','style','textarea','option','noscript'],transformTags:{a:(tag,attrs)=>{try{const u=new URL(attrs.href??'',target);if(u.origin===new URL(profile).origin&&u.pathname===new URL(profile).pathname&&attrs['data-selletive-code']===code)found=true;}catch{}return {tagName:tag,attribs:attrs};}}});
 return found;
}
