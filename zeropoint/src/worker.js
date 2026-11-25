// ZeroPoint LTD API: Cloudflare Worker + D1. Static files are served from /public.
const J=(o,s=200,h={})=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...h}});
const pct=(a,n)=>((a.find(x=>x[0]===n)||[0,0])[1]);
const isAdmin=(env,e)=>(env.ADMIN_EMAILS||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean).includes(String(e).toLowerCase());
function cookie(req,n){const m=(req.headers.get('Cookie')||'').match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?m[1]:null}
async function me(req,env){const t=cookie(req,'zp_session');if(!t)return null;
 const r=await env.DB.prepare('SELECT email,name FROM sessions WHERE token=? AND exp>?').bind(t,Date.now()).first();
 return r?{email:r.email,name:r.name,admin:isAdmin(env,r.email)}:null}
async function newSession(env,email,name){const b=crypto.getRandomValues(new Uint8Array(32)),t=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
 await env.DB.prepare('DELETE FROM sessions WHERE exp<?').bind(Date.now()).run();
 await env.DB.prepare('INSERT INTO sessions(token,email,name,exp) VALUES(?,?,?,?)').bind(t,email,name,Date.now()+7*864e5).run();
 return `zp_session=${t}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7*86400}`}
async function verifyGoogle(env,cred){if(!cred||!env.GOOGLE_CLIENT_ID)return null;
 const r=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(cred));if(!r.ok)return null;const p=await r.json();
 const okIss=['accounts.google.com','https://accounts.google.com'].includes(p.iss),ver=p.email_verified===true||p.email_verified==='true';
 return(p.aud===env.GOOGLE_CLIENT_ID&&okIss&&ver&&p.email)?p:null}
async function catalog(env){const s=await env.DB.prepare("SELECT value FROM settings WHERE key='main'").first();
 const {results}=await env.DB.prepare('SELECT * FROM skus ORDER BY id').all();
 return{settings:JSON.parse(s.value),skus:results.map(r=>{const pal=JSON.parse(r.pal),dyes=JSON.parse(r.dyes);
  return{id:r.id,name:r.name,cat:r.cat,comp:r.comp,gsm:r.gsm,w:r.w,usd:r.usd,mode:r.mode,c:r.corr,bay:r.bay,imp:r.imp,fill:r.fill,tgt:r.tgt,yld:r.yld,y:r.y,roll:r.roll,pal,dyes,fins:JSON.parse(r.fins),frt:r.frt,duty:r.duty,lm:r.lm,step:r.step,fin:dyes[0][0],col:pal[1][1]}})}}
// Price is always recomputed here. The browser's numbers are never trusted.
function calc(st,k,yd,o){const mill=k.usd*.9144*st.fx.usd,land=mill+k.frt+mill*k.duty/100+k.lm,m=k.mode==='bay'?k.bay:k.imp;let d=0;
 st.tiers.forEach(t=>{if(yd>=m*t.m)d=Math.max(d,t.p)});
 const base=land*(1+(st.risk+st.margin)/100)*(1-d/100),s=k.mode==='bay'?0:pct(k.dyes,o.dye)+pct(k.fins,o.fin)+(o.custom?4:0);return base*(1+s/100)}
async function createOrder(req,env,u){const b=await req.json().catch(()=>null);
 if(!b||!Array.isArray(b.items)||!b.items.length||b.items.length>20)return J({error:'Your cart is empty or invalid.'},400);
 const c=b.cust||{};for(const k of['name','phone','biz','dist','addr','rcv'])if(!String(c[k]||'').trim())return J({error:'Please complete all required fields.'},400);
 if(!/^(\+?88)?01\d{9}$/.test(String(c.phone).replace(/[\s-]/g,'')))return J({error:'Enter a valid Bangladesh mobile number.'},400);
 const pm=['bKash','Nagad','Bank transfer'].includes(c.pm)?c.pm:'bKash',cat=await catalog(env),st=cat.settings,L=[];let total=0;
 for(const it of b.items){const k=cat.skus.find(x=>x.id===it.id);if(!k||k.mode==='paused')return J({error:'A fabric in your cart is no longer available.'},400);
  const bay=k.mode==='bay',un=(it.u==='yd'&&bay)?'yd':'roll',m=bay?k.bay:k.imp,n=Math.round(+it.n);
  if(!(n>0))return J({error:'Invalid quantity.'},400);
  const yd=un==='roll'?n*k.roll:Math.round(n/k.step)*k.step;if(yd<m)return J({error:`${k.name}: the minimum order is ${m} yd.`},400);
  const pal=bay?k.pal.slice(0,5):k.pal,custom=bay?'':String(it.custom||'').trim().slice(0,80),col=custom?'Custom':(pal.find(p=>p[0]===it.col)||pal[0])[0];
  const dye=bay?k.dyes[0][0]:(k.dyes.find(d=>d[0]===it.dye)||k.dyes[0])[0],fin=bay?k.fins[0][0]:(k.fins.find(d=>d[0]===it.fin)||k.fins[0])[0];
  const amt=Math.round(calc(st,k,yd,{dye,fin,custom})*yd);total+=amt;
  L.push({k,un,n,yd,amt,note:String(it.note||'').slice(0,200),descr:(custom?'Custom match: '+custom:col)+' · '+(bay?'as stocked':dye+', '+fin)})}
 const cols='id,email,business,name,phone,contact_email,tin,division,district,address,receiver,win,pay_method,sku_id,sku_name,descr,unit,qty,yards,amount,note,stage,created',ids=[];
 for(const l of L){const v=['pending',u.email,c.biz,c.name,c.phone,c.email||'',c.tin||'',c.div||'',c.dist,c.addr,c.rcv,c.win||'',pm,l.k.id,l.k.name,l.descr,l.un,l.n,l.yd,l.amt,l.note,0,Date.now()].map(x=>typeof x==='string'?x.slice(0,300):x);
  const r=await env.DB.prepare(`INSERT INTO orders(${cols}) VALUES(${v.map(()=>'?').join(',')})`).bind(...v).run(),seq=r.meta.last_row_id,id='ZP-'+(1000+seq);
  await env.DB.prepare('UPDATE orders SET id=? WHERE seq=?').bind(id,seq).run();ids.push(id);
  if(l.k.mode==='pool')await env.DB.prepare('UPDATE skus SET fill=MIN(tgt,fill+?) WHERE id=?').bind(l.yd,l.k.id).run()}
 return J({ids,total,deposit:Math.round(total*st.dep/100)})}
async function adminSave(req,env){const b=await req.json().catch(()=>null),s=b&&b.s,num=x=>Number.isFinite(+x);
 if(!s||!s.fx||!s.corr||![s.fx.usd,s.fx.rmb,s.risk,s.margin,s.buffer,s.dep,s.corr.sea,s.corr.land,s.corr.air].every(num))return J({error:'Invalid settings'},400);
 const val=JSON.stringify({fx:{usd:+s.fx.usd,rmb:+s.fx.rmb},risk:+s.risk,margin:+s.margin,buffer:+s.buffer,dep:+s.dep,tiers:(s.tiers||[]).map(t=>({m:+t.m,p:+t.p})),corr:{sea:+s.corr.sea,land:+s.corr.land,air:+s.corr.air}});
 const q=[env.DB.prepare("UPDATE settings SET value=? WHERE key='main'").bind(val)];
 for(const k of b.k||[]){if(!['bay','pool','paused'].includes(k.mode)||!['sea','land','air'].includes(k.c))continue;
  q.push(env.DB.prepare('UPDATE skus SET mode=?,corr=?,bay=?,imp=?,step=?,fill=?,tgt=?,usd=? WHERE id=?').bind(k.mode,k.c,+k.bay,+k.imp,Math.max(1,+k.step),+k.fill,+k.tgt,+k.usd,+k.id))}
 for(const o of b.o||[])if([0,1,2,3].includes(+o.st))q.push(env.DB.prepare('UPDATE orders SET stage=? WHERE id=?').bind(+o.st,String(o.id)));
 await env.DB.batch(q);return J({ok:true})}
async function api(req,env,url){const p=url.pathname,M=req.method;
 if(M!=='GET'&&!(req.headers.get('Content-Type')||'').includes('application/json'))return J({error:'Bad request'},400);
 if(p==='/api/config')return J({googleClientId:env.GOOGLE_CLIENT_ID||'',devLogin:env.DEV_LOGIN==='1'});
 if(p==='/api/catalog')return J(await catalog(env));
 if(p==='/api/me'){const u=await me(req,env);return J(u||{})}
 if(p==='/api/auth/google'&&M==='POST'){const b=await req.json().catch(()=>({})),g=await verifyGoogle(env,b.credential);if(!g)return J({error:'Google sign-in failed'},401);
  return J({ok:true},200,{'Set-Cookie':await newSession(env,g.email,g.name||g.email)})}
 if(p==='/api/auth/dev'&&M==='POST'){if(env.DEV_LOGIN!=='1')return J({error:'Not found'},404);const b=await req.json().catch(()=>({}));
  if(!b.email)return J({error:'Email required'},400);return J({ok:true},200,{'Set-Cookie':await newSession(env,b.email,b.name||b.email)})}
 if(p==='/api/auth/logout'&&M==='POST'){const t=cookie(req,'zp_session');if(t)await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(t).run();
  return J({ok:true},200,{'Set-Cookie':'zp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'})}
 const u=await me(req,env);if(!u)return J({error:'Please sign in.'},401);
 if(p==='/api/orders'&&M==='GET'){const {results}=await env.DB.prepare('SELECT id,sku_name,descr,yards,amount,stage,created FROM orders WHERE email=? ORDER BY seq DESC LIMIT 100').bind(u.email).all();return J({orders:results})}
 if(p==='/api/orders'&&M==='POST')return createOrder(req,env,u);
 if(p.startsWith('/api/admin/')){if(!u.admin)return J({error:'Not authorised'},403);
  if(p==='/api/admin/orders'&&M==='GET'){const {results}=await env.DB.prepare('SELECT id,business,name,sku_name,descr,yards,stage FROM orders ORDER BY seq DESC LIMIT 200').all();return J({orders:results})}
  if(p==='/api/admin/config'&&M==='PUT')return adminSave(req,env)}
 return J({error:'Not found'},404)}
export default{async fetch(req,env){const url=new URL(req.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);
 try{return await api(req,env,url)}catch(e){console.error(e);return J({error:'Server error'},500)}}};
