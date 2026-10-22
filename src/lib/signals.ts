import { createHash } from 'node:crypto';
import { extractAliases, clamp } from './engine';
import { skills } from './catalogue';
import type { Signal, Snapshot } from './types';
const plain=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#\d+;/g,' ').replace(/\s+/g,' ').trim();
const safeUrl=(value:unknown,host:string)=>{try{const url=new URL(String(value));return url.protocol==='https:'&&(url.hostname===host||url.hostname.endsWith('.'+host))?url.href:'';}catch{return '';}};
async function read(url:string){const r=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'ArcTalent-hackathon/0.1 (public-source demo)'},cache:'no-store'});if(!r.ok)throw new Error(`Source returned ${r.status}`);const text=await r.text();if(text.length>3_000_000)throw new Error('Source too large');return text;}
export async function fetchJobSignals():Promise<{signals:Signal[];count:number}> {
  const body=JSON.parse(await read('https://www.arbeitnow.com/api/job-board-api'));
  if(!Array.isArray(body.data))throw new Error('Unexpected job feed');
  const now=new Date().toISOString(); const seen=new Set<string>();const signals:Signal[]=[];
  for(const row of body.data.slice(0,100)) {const url=safeUrl(row.url,'arbeitnow.com');if(!url||seen.has(url)||typeof row.title!=='string')continue;seen.add(url);const text=plain(row.title+' '+String(row.description??''));const timestamp=typeof row.created_at==='number'?new Date(row.created_at*1000):null;
    signals.push({id:url,title:plain(row.title).slice(0,300),url,publishedAt:timestamp&&!Number.isNaN(+timestamp)?timestamp.toISOString():null,collectedAt:now,kind:'jobs',geography:'Arbeitnow Europe sample; not Malaysian demand',skills:extractAliases(text).map(x=>x.id)});
  }
  if(!signals.length)throw new Error('No valid job records');return {signals,count:signals.length};
}
export async function fetchResearchSignals():Promise<Signal[]> {
  const xml=await read('https://rss.arxiv.org/rss/cs.AI');
  const items=[...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)].slice(0,12);
  const field=(xml:string,key:string)=>plain((xml.match(new RegExp(`<${key}[^>]*>([\\s\\S]*?)<\\/${key}>`))?.[1]??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1'));
  const now=new Date().toISOString();
  return items.flatMap(item=>{const title=field(item[1],'title');const url=safeUrl(field(item[1],'link'),'arxiv.org');const rawDate=field(item[1],'pubDate')||field(item[1],'dc:date');const date=rawDate?new Date(rawDate):null;if(!title||!url)return [];return [{id:url,title,url,publishedAt:date&&!Number.isNaN(+date)?date.toISOString():null,collectedAt:now,kind:'research' as const,geography:'Global research; not adoption evidence',skills:extractAliases(title+' '+field(item[1],'description')).map(x=>x.id)}]});
}
export function liveSnapshot(jobSignals:Signal[],research:Signal[]):Snapshot {
  const hash=createHash('sha256').update(JSON.stringify(jobSignals.map(s=>({id:s.id,skills:s.skills})).sort((a,b)=>a.id.localeCompare(b.id)))).digest('hex').slice(0,12);
  const n=jobSignals.length;
  const market=Object.fromEntries(skills.map(s=>[s.id,n>=30?clamp(.5+jobSignals.filter(x=>x.skills.includes(s.id)).length/n):.5]));
  return {id:`live-${hash}`,label:'Public evidence snapshot',asOf:new Date().toISOString(),kind:'live',market,signals:[...research,...jobSignals],sampleSize:n,note:n>=30?'Current skill-mention share in a small Europe-focused sample. Ranking uses a documented visibility heuristic (0.5 + share). This is not growth, a forecast or Malaysian vacancy demand. Research is contextual and does not automatically alter exposure assumptions.':'Fewer than 30 job records: market component is neutral. Insufficient evidence for comparison.'};
}
