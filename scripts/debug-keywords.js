const https = require('https');
function httpGet(url) {
  return new Promise((res,rej)=>{
    const req = https.get(url,{timeout:12000,headers:{'User-Agent':'Mozilla/5.0 Chrome/122','Accept':'application/rss+xml,*/*'}},r=>{
      const cs=[];
      r.on('data',c=>cs.push(c));
      r.on('end',()=>res(Buffer.concat(cs).toString()));
    });
    req.on('error',e=>rej(e));
    setTimeout(()=>{try{req.destroy();}catch(e){}rej(new Error('to'));},12000);
  });
}
function matchAny(text,patterns){text=text.substring(0,800);for(const p of patterns){try{if(new RegExp(p.replace(/[()]/g,'\\$&'),'i').test(text))return true;}catch(e){}}return false;}
function parseRSS(xml) {
  if(!xml||xml.length<50)return[];
  const items=[];
  const itemRe=/<item>([\s\S]*?)<\/item>/gi;
  let m;
  while((m=itemRe.exec(xml))!==null){
    const b=m[1];
    const gt=tag=>{
      const cd=new RegExp('<'+tag+'[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/'+tag+'>','i').exec(b);
      const pl=new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)<\\/'+tag+'>','i').exec(b);
      return cd?cd[1].trim():(pl?pl[1].trim():'');
    };
    const strip=s=>s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    const title=strip(gt('title'));
    const desc=strip(gt('description'));
    if(title&&title.length>=5)items.push({title,desc});
  }
  return items;
}
async function main() {
  const xml=await httpGet('https://www.j-cast.com/index.xml');
  const items=parseRSS(xml);
  console.log('JCAST total:', items.length);
  for(const item of items.slice(0,10)) {
    const text=item.title+' '+item.desc;
    const ctx=matchAny(text,['中国','China','ASEAN','Southeast Asia','trade','invest','輸出','製造']);
    const ind=matchAny(text,['半導','EV','robot','AI','精密機械','manufacturing','electronics','chemical']);
    console.log((ctx?'Y':'N')+(ind?'Y':'N')+' '+item.title.slice(0,70));
  }
  // Also check what language the titles are in
  console.log('\\nSample titles:');
  items.slice(0,5).forEach(i=>console.log(i.title.slice(0,70)));
}
main().catch(e=>console.error(e.message));
