
const CORR={sea:{n:'Chattogram sea',d:28},land:{n:'Benapole land',d:15},air:{n:'Air (urgent)',d:7}};
const S={fx:{usd:122,rmb:16.8},risk:6,margin:15,buffer:3,tiers:[{m:2,p:6},{m:4,p:12}],dep:40,user:null,corr:{sea:28,land:15,air:7},skus:[],orders:[]};
const STAGES=['Deposit locked','Phase 1: Port hanger','Phase 2: Customs & cargo deck','Phase 3: Delivered'];
const $=id=>document.getElementById(id),f=(n,d=0)=>Number(n).toLocaleString('en-BD',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function wkg(k){return k.gsm*(k.w*0.0254)*0.9144/1000}
function landed(k){const mill=k.usd*0.9144*S.fx.usd;return{mill,frt:k.frt,duty:mill*k.duty/100,lm:k.lm,tot:mill+k.frt+mill*k.duty/100+k.lm}}
function disc(k,q){const m=k.mode==='bay'?k.bay:k.imp;let d=0;S.tiers.forEach(t=>{if(q>=m*t.m)d=Math.max(d,t.p)});return d}
function price(k,q){const L=landed(k),d=disc(k,q);return{L,d,u:L.tot*(1+(S.risk+S.margin)/100)*(1-d/100)}}
function eta(k){if(k.mode==='bay')return '2–4 days from the cargo deck';const l=S.corr[k.c]+S.buffer;return `${l}–${l+7} days (${CORR[k.c].n})`}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}
function num(label,path,step){return `<div><label>${label}</label><input type="number" step="${step||1}" value="${path.o[path.k]}" onchange="setv(${path.i},'${path.k}',this.value)"></div>`}
let G={};function setv(i,k,v){(i===-1?G.o:S.skus[i])[k]=isNaN(+v)||v===''?v:+v;admin()}
function adminView(){
 const g=(o,k,l,s)=>`<div><label>${l}</label><input type="number" step="${s||1}" value="${o[k]}" onchange="(${'o'in{}?'':''}function(v){G.t.${'x'}})" data-k="${k}"></div>`;
 let h=`<h2>Admin control panel</h2><div class="panel"><h3>FX and risk</h3><div class="row">
 ${[['USD/BDT',S.fx,'usd'],['RMB/BDT',S.fx,'rmb'],['Risk buffer % (5–8)',S,'risk'],['Target margin % (12–20)',S,'margin'],['Deposit %',S,'dep'],['Delay buffer (days)',S,'buffer']].map(([l,o,k],i)=>`<div><label>${l}</label><input type="number" step="0.1" value="${o[k]}" onchange="G=${'{'}o:null${'}'};ad(${i},this.value)"></div>`).join('')}</div></div>
 <div class="panel"><h3>Corridor scheduler (lead days)</h3><div class="row">${Object.keys(CORR).map(c=>`<div><label>${CORR[c].n}</label><input type="number" value="${S.corr[c]}" onchange="S.corr['${c}']=+this.value;admin()"></div>`).join('')}</div></div>
 <div class="panel"><h3>Volume discount tiers</h3><div class="row">${S.tiers.map((t,i)=>`<div><label>Tier ${i+1}: from × MOQ</label><input type="number" step="0.5" value="${t.m}" onchange="S.tiers[${i}].m=+this.value;admin()"></div><div><label>Tier ${i+1}: discount %</label><input type="number" value="${t.p}" onchange="S.tiers[${i}].p=+this.value;admin()"></div>`).join('')}</div></div>
 <div class="panel"><h3>Catalog, pools and MOQ</h3><div class="scroll"><table><tr><th>SKU</th><th>Mode</th><th>Corridor</th><th>Bay MOQ</th><th>Import MOQ</th><th>Step</th><th>Pooled yd</th><th>Pool target</th><th>Mill $/m</th><th>Landed ৳/yd</th><th>Price ৳/yd</th></tr>
 ${S.skus.map((k,i)=>{const p=price(k,k.mode==='bay'?k.bay:k.imp);const ni=(key)=>`<td><input style="width:80px" type="number" value="${k[key]}" onchange="setv(${i},'${key}',this.value)"></td>`;
 return `<tr><td>${esc(k.name)} ${k.gsm}gsm</td><td><select onchange="setv(${i},'mode',this.value)">${[['bay','In bay stock'],['pool','Open import pool'],['paused','Paused']].map(o=>`<option value="${o[0]}" ${k.mode===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></td>
 <td><select onchange="setv(${i},'c',this.value)">${Object.keys(CORR).map(c=>`<option value="${c}" ${k.c===c?'selected':''}>${CORR[c].n}</option>`).join('')}</select></td>${ni('bay')}${ni('imp')}${ni('step')}${ni('fill')}${ni('tgt')}<td><input style="width:80px" type="number" step="0.05" value="${k.usd}" onchange="setv(${i},'usd',this.value)"></td><td>${f(p.L.tot,1)}</td><td><b>${f(p.u,1)}</b></td></tr>`}).join('')}</table></div></div>
 <div class="panel"><h3>3-phase order pipeline</h3><div class="scroll"><table><tr><th>Order</th><th>Buyer</th><th>Fabric</th><th>Yards</th><th>Stage</th><th></th></tr>
 ${S.orders.map((o,i)=>`<tr><td>${o.id}</td><td>${esc(o.buyer)}</td><td>${esc(o.sku)}</td><td>${f(o.yd)}</td><td><span class="tag ${o.st===3?'g':''}">${STAGES[o.st]}</span></td><td>${o.st<3?`<button onclick="S.orders[${i}].st++;admin()">Advance</button>`:''}</td></tr>`).join('')}</table></div></div>`;
 $('app').innerHTML=h}
function ad(i,v){v=+v;[()=>S.fx.usd=v,()=>S.fx.rmb=v,()=>S.risk=v,()=>S.margin=v,()=>S.dep=v,()=>S.buffer=v][i]();admin()}
S.cart=[];S.F={cat:'all',av:'all',q:'',sort:'name'};S.cfg={};S.co={step:1,f:{div:'Dhaka',win:'Morning',pm:'bKash'}};S.last=null;
try{const c=JSON.parse(localStorage.getItem('zp-cart')||'[]');if(Array.isArray(c))S.cart=c}catch(e){}
function save(){try{localStorage.setItem('zp-cart',JSON.stringify(S.cart))}catch(e){}}
const sku=id=>S.skus.find(k=>k.id===id),moq=k=>k.mode==='bay'?k.bay:k.imp;
const minN=(k,u)=>u==='roll'?Math.ceil(moq(k)/k.roll):moq(k);
const yds=(k,c)=>c.u==='roll'?c.n*k.roll:c.n;
const pct=(a,n)=>(a.find(x=>x[0]===n)||[0,0])[1];
const sur=(k,c)=>k.mode==='bay'?0:pct(k.dyes,c.dye)+pct(k.fins,c.fin)+(c.custom?4:0);
const up=(k,c)=>price(k,yds(k,c)).u*(1+sur(k,c)/100),lt=(k,c)=>up(k,c)*yds(k,c);
const cname=c=>c.custom?'Custom match: '+c.custom:c.col;
const cartT=()=>S.cart.reduce((s,c)=>s+lt(sku(c.id),c),0);
function cf(id){const k=sku(id);if(!S.cfg[id])S.cfg[id]={col:k.pal[0][0],custom:'',dye:k.dyes[0][0],fin:k.fins[0][0],u:k.mode==='bay'?'yd':'roll',n:minN(k,k.mode==='bay'?'yd':'roll'),note:''};return S.cfg[id]}
function sc(id,key,v){const k=sku(id),c=cf(id);c[key]=key==='n'?+v:v;if(key==='u')c.n=minN(k,v);if(key==='n'){const s=c.u==='roll'?1:k.step;c.n=Math.max(minN(k,c.u),Math.round(c.n/s)*s)}product(id)}
function nav0(){const h=(location.hash||'#home').slice(1),a=[['home','Home'],['market','Marketplace'],['about','About'],['orders','My orders'],['cart','Cart ('+S.cart.length+')']];
 $('nav').innerHTML=a.map(x=>`<a href="#${x[0]}" class="${h===x[0]||(x[0]==='market'&&h.startsWith('product-'))?'on':''}">${x[1]}</a>`).join('')+(S.user?` <span class="mu">${esc(S.user)}</span> <button onclick="out()">Sign out</button>`:` <span class="gsi"></span>`)}
function nav(){nav0();gsiRender()}
function gsiRender(){const els=document.querySelectorAll('.gsi');if(!els.length)return;const g=S.gcfg;
 if(!g){setTimeout(gsiRender,300);return}
 if(g.devLogin&&!g.googleClientId){els.forEach(e=>e.innerHTML='<button onclick="gin()">Dev sign-in</button>');return}
 if(!g.googleClientId){els.forEach(e=>e.innerHTML='<span class="mu">Sign-in is not configured yet</span>');return}
 if(!(window.google&&google.accounts)){gsiRender.n=(gsiRender.n||0)+1;if(gsiRender.n<30)setTimeout(gsiRender,300);return}
 google.accounts.id.initialize({client_id:g.googleClientId,callback:onGoogle});
 els.forEach(e=>{e.innerHTML='';google.accounts.id.renderButton(e,{theme:'filled_black',size:'medium',text:'signup_with'})})}
async function post(u,b){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})})}
async function refreshMe(){const m=await (await fetch('/api/me')).json();S.user=m.email?(m.name||m.email):null;S.email=m.email||null;S.admin=!!m.admin}
async function onGoogle(r){const x=await post('/api/auth/google',{credential:r.credential});if(!x.ok){toast('Google sign-in failed. Please try again.');return}await refreshMe();route();toast('Signed in')}
async function gin(){const email=prompt('Dev sign-in. Enter an email:');if(!email)return;const x=await post('/api/auth/dev',{email,name:email.split('@')[0]});if(!x.ok){toast('Dev login is off.');return}await refreshMe();route()}
async function out(){await post('/api/auth/logout');S.user=null;S.email=null;S.admin=false;route()}
function route(){const h=location.pathname.replace(/\/+$/,'')==='/admin'?'admin':(location.hash||'#home').slice(1);nav();const Rt={home,market,about,orders,cart,checkout,confirmation,admin:adminGate};
 if(h.startsWith('product-'))product(+h.slice(8));else(Rt[h]||home)();scrollTo(0,0);gsiRender()}
function dots(k){return `<div class="dots">${k.pal.slice(0,k.mode==='bay'?5:8).map(p=>`<i title="${p[0]}" style="background:${p[1]}"></i>`).join('')}</div>`}
function card(k){const p=price(k,moq(k)),pc=Math.min(100,k.fill/k.tgt*100);
 return `<div class="card"><div class="sw" style="background:${k.col}"></div><h3>${esc(k.name)}</h3><div class="mu">${esc(k.cat)}<br>${esc(k.comp)} · ${k.gsm} GSM · ${k.w}" wide</div>${dots(k)}
 <div><span class="tag ${k.mode==='bay'?'g':k.mode==='pool'?'':'x'}">${k.mode==='bay'?'Ready on cargo deck':k.mode==='pool'?'Open import pool':'Paused'}</span></div>
 ${k.mode==='pool'?`<div class="bar"><i style="width:${pc}%"></i></div><div class="mu">${f(k.fill)} of ${f(k.tgt)} yd pooled</div>`:''}
 <div class="mu">${k.mode==='paused'?'Not taking orders':'Delivery: '+eta(k)}</div><div class="price">৳${f(p.u)} <span class="mu" style="font:14px 'IBM Plex Sans'">per yd · MOQ ${moq(k)} yd (${minN(k,'roll')} roll${minN(k,'roll')>1?'s':''})</span></div>
 <button class="p" onclick="location.hash='product-${k.id}'">Configure and order</button></div>`}
function home(){$('app').innerHTML=`<section class="hero"><div><h1>Fabric sourcing and import for Bangladesh’s clothing trade.</h1><p>For tailors, boutiques and small clothing makers. Order by the roll or by the yard, request your own colour, see how every price is built, and track your cloth from the mill to your shop.</p><div class="btns"><button class="p" onclick="location.hash='market'">Browse the marketplace</button><button onclick="location.hash='about'">About us</button></div></div><figure class="frame"><img src="/img/hero.webp" alt="Portrait rendered in red halftone dots"></figure></section>
 <div class="facts"><div><b>From 80 yd</b><span>Ready stock MOQ</span></div><div><b>2–4 days</b><span>Ready stock delivery</span></div><div><b>15–35 days</b><span>Import pool, by corridor</span></div><div><b>1 yd = 3 ft</b><span>Never 3 ft = 1 m</span></div></div>
 <h2>How an order moves</h2><div class="steps"><div><h3>1. Port handover</h3><p>Scouts lock supplier terms. The mill delivers rolls to a port or terminal bay.</p></div><div><h3>2. Customs and cargo deck</h3><p>A licensed C&F partner clears goods duty-paid into a reserved godown slot.</p></div><div><h3>3. Last-mile dispatch</h3><p>Vetted local transport delivers to your shop. You verify, then settle the balance.</p></div></div>
 <h2>Popular fabrics</h2><div class="grid">${[1,7,12].map(i=>card(sku(i))).join('')}</div>`}
function market(){const F=S.F,cats=[...new Set(S.skus.map(k=>k.cat))];
 const L=S.skus.filter(k=>(F.cat==='all'||k.cat===F.cat)&&(F.av==='all'||k.mode===F.av)&&(k.name+k.comp+k.cat).toLowerCase().includes(F.q.toLowerCase())).sort((a,b)=>F.sort==='price'?price(a,moq(a)).u-price(b,moq(b)).u:F.sort==='gsm'?a.gsm-b.gsm:a.name.localeCompare(b.name));
 $('app').innerHTML=`<h2>Marketplace</h2><div class="panel row"><div><label for="q">Search</label><input id="q" value="${esc(F.q)}" onchange="S.F.q=this.value;market()"></div>
 <div><label>Category</label><select onchange="S.F.cat=this.value;market()"><option value="all">All (${S.skus.length})</option>${cats.map(c=>`<option ${F.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
 <div><label>Availability</label><select onchange="S.F.av=this.value;market()">${[['all','All'],['bay','Ready stock'],['pool','Import pool'],['paused','Paused']].map(o=>`<option value="${o[0]}" ${F.av===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
 <div><label>Sort by</label><select onchange="S.F.sort=this.value;market()">${[['name','Name'],['price','Lowest price'],['gsm','Lightest first']].map(o=>`<option value="${o[0]}" ${F.sort===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div></div>
 <p class="mu">${L.length} fabric${L.length===1?'':'s'}</p><div class="grid">${L.map(card).join('')||'<p>No fabrics match. Clear a filter to see more.</p>'}</div>`}
function product(id){const k=sku(id);if(!k)return market();const c=cf(id),bay=k.mode==='bay',y=yds(k,c),p=price(k,y),L=p.L,w=wkg(k),u=up(k,c),m=minN(k,c.u),pal=bay?k.pal.slice(0,5):k.pal;
 $('app').innerHTML=`<div class="crumb"><a href="#market">Marketplace</a> / ${esc(k.name)}</div><div class="two"><div><div class="sw" style="height:170px;background:${c.custom?'repeating-linear-gradient(45deg,#222,#222 8px,#2c2c2c 8px,#2c2c2c 16px)':(pal.find(x=>x[0]===c.col)||pal[0])[1]};border-radius:4px;margin-bottom:6px"></div><p class="mu">${esc(cname(c))}. Screen colour is a guide only; ask for a physical swatch before a large order.</p><h2>${esc(k.name)}</h2><p class="mu">${esc(k.cat)}</p>
 <table>${[['Composition',k.comp],['GSM',k.gsm],['Width',k.w+'"'],['Fulfillment',k.mode==='bay'?'Ready stock, as stocked: '+k.dyes[0][0]+', '+k.fins[0][0]:k.mode==='pool'?'Pooled import, '+CORR[k.c].n:'Paused'],['Roll',`about ${k.roll} yd (${f(k.roll*.9144)} m, ${f(k.roll*wkg(k),1)} kg)`],['MOQ',moq(k)+' yd'],['Delivery',k.mode==='paused'?'n/a':eta(k)+(c.custom?', plus about 7 days for lab-dip approval':'')]].map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>
 <p class="mu" style="margin-top:12px">Dye-lot notice: repeat orders from different dye batches can show slight shade differences. Buy your full need in one lot where possible.</p></div>
 <div class="panel"><h3>Configure your order</h3><label>Colour: ${esc(c.custom?'Custom request':c.col)}</label><div class="dots big">${pal.map(x=>`<button class="dot ${!c.custom&&c.col===x[0]?'on':''}" title="${x[0]}" style="background:${x[1]}" onclick="S.cfg[${id}].custom='';sc(${id},'col','${x[0]}')"></button>`).join('')}</div>
 ${bay?`<p class="mu">Ready stock is sold in the colours and finish already on the cargo deck.</p>`:`<label for="cu">Need a different colour? Request a match</label><input id="cu" placeholder="Pantone TCX code or description" value="${esc(c.custom)}" onchange="sc(${id},'custom',this.value.trim())"><p class="mu">We send a lab dip for your approval before dyeing. Adds about 7 days and 4%.</p>
 <label>Dye or print type</label><select onchange="sc(${id},'dye',this.value)">${k.dyes.map(d=>`<option ${c.dye===d[0]?'selected':''}>${d[0]}</option>`).join('')}</select><label>Finish</label><select onchange="sc(${id},'fin',this.value)">${k.fins.map(d=>`<option ${c.fin===d[0]?'selected':''}>${d[0]}</option>`).join('')}</select>`}
 <div class="row"><div><label>Sold by</label><select onchange="sc(${id},'u',this.value)">${(bay?['yd','roll']:['roll']).map(x=>`<option value="${x}" ${c.u===x?'selected':''}>${x==='roll'?'Full rolls (about '+k.roll+' yd)':'Cut yards (3 ft)'}</option>`).join('')}</select></div>
 <div><label for="qq">${c.u==='roll'?'Number of rolls (min '+m+')':'Yards (min '+m+', step '+k.step+')'}</label><input id="qq" type="number" min="${m}" value="${c.n}" onchange="sc(${id},'n',this.value)"></div></div>
 <p class="mu">${f(y)} yd · ${f(y*.9144,1)} m · about ${f(y*w)} kg · makes about ${f(y/k.yld)} ${k.y}s</p>
 <label for="nt">Notes for the scout (optional)</label><input id="nt" value="${esc(c.note)}" onchange="S.cfg[${id}].note=this.value">
 <div class="price" style="margin-top:12px">৳${f(u,1)} <span class="mu" style="font:14px 'IBM Plex Sans'">per yd${p.d?`, ${p.d}% volume discount`:''}${sur(k,c)?`, ${sur(k,c)>0?'+':''}${sur(k,c)}% options`:''}</span></div>
 <p>Total <b>৳${f(u*y)}</b><br><span class="mu">Deposit ${S.dep}%: ৳${f(u*y*S.dep/100)}. Balance on dispatch.</span></p>
 <button class="p" ${k.mode==='paused'?'disabled':''} onclick="add(${id})">Add to cart</button>
 <details><summary class="mu" style="margin-top:12px">Show the price math</summary><div class="math">Weight/yd = ${k.gsm} × (${k.w}" × 0.0254) × 0.9144 / 1000 = ${f(w,3)} kg
Mill $${k.usd}/m × 0.9144 × ${S.fx.usd} = ৳${f(L.mill,1)}/yd
Landed = ${f(L.mill,1)} + ${k.frt} + ${f(L.duty,1)} + ${k.lm} = ৳${f(L.tot,1)}/yd
Base = ${f(L.tot,1)} × (1 + ${S.risk}% + ${S.margin}%) × (1 − ${p.d}%) = ৳${f(p.u,1)}</div></details></div></div>`}
function add(id){const k=sku(id),c=cf(id);S.cart.push({id,u:c.u,n:c.n,col:c.col,custom:c.custom,dye:c.dye,fin:c.fin,note:c.note});save();nav();toast('Added to cart');location.hash='cart'}
const desc=(k,c)=>`${cname(c)} · ${k.mode==='bay'?'as stocked':c.dye+', '+c.fin}`;
function cart(){$('app').innerHTML=`<h2>Cart</h2>`+(S.cart.length?`<div class="panel scroll"><table><tr><th>Fabric and options</th><th>Quantity</th><th>Price/yd</th><th>Line total</th><th></th></tr>${S.cart.map((c,i)=>{const k=sku(c.id);return `<tr><td><a href="#product-${k.id}">${esc(k.name)}</a><br><span class="mu">${esc(desc(k,c))}</span></td><td>${f(c.n)} ${c.u==='roll'?'roll'+(c.n>1?'s':''):'yd'}<br><span class="mu">${f(yds(k,c))} yd</span></td><td>৳${f(up(k,c),1)}</td><td>৳${f(lt(k,c))}</td><td><button onclick="S.cart.splice(${i},1);save();nav();cart()">Remove</button></td></tr>`}).join('')}</table></div>
 <div class="panel"><p>Total <b>৳${f(cartT())}</b> · Deposit now (${S.dep}%) <b>৳${f(cartT()*S.dep/100)}</b> · Balance on dispatch ৳${f(cartT()*(1-S.dep/100))}</p><button class="p" onclick="S.co.step=1;location.hash='checkout'">Checkout</button> <button onclick="location.hash='market'">Keep browsing</button></div>`:`<p>Your cart is empty. <a href="#market">Browse the marketplace</a> to add fabric.</p>`)}
const STEPN=['Contact','Delivery','Payment','Review'];
function fi(key,label,type){return `<div><label for="f-${key}">${label}</label><input id="f-${key}" type="${type||'text'}" value="${esc(S.co.f[key]||'')}" onchange="S.co.f['${key}']=this.value.trim()"></div>`}
function checkout(){if(!S.cart.length)return cart();
 if(!S.user){$('app').innerHTML=`<h2>Checkout</h2><div class="panel"><p>Sign up or sign in to place your order. We use your account to keep your order history and quotes.</p><span class="gsi"></span></div>`;return}
 const s=S.co.step,F=S.co.f,T=cartT();let b='';
 if(s===1)b=`<div class="row">${fi('name','Full name')}${fi('phone','Mobile number','tel')}${fi('email','Email','email')}${fi('biz','Shop or business name')}${fi('tin','Trade licence or BIN (optional)')}</div>`;
 if(s===2)b=`<div class="row"><div><label>Division</label><select onchange="S.co.f.div=this.value">${['Dhaka','Chattogram','Khulna','Rajshahi','Sylhet','Barishal','Rangpur','Mymensingh'].map(d=>`<option ${F.div===d?'selected':''}>${d}</option>`).join('')}</select></div>${fi('dist','District and area')}${fi('addr','Street address and landmark')}${fi('rcv','Receiver name and phone at delivery')}<div><label>Preferred delivery window</label><select onchange="S.co.f.win=this.value">${['Morning','Afternoon','Evening'].map(d=>`<option ${F.win===d?'selected':''}>${d}</option>`).join('')}</select></div></div><p class="mu">Delivery to your shop is included in the price. Remote areas may need an extra day or a small freight quote, which we confirm before dispatch.</p>`;
 if(s===3)b=`<label>Deposit payment method</label><select onchange="S.co.f.pm=this.value;checkout()">${['bKash','Nagad','Bank transfer'].map(d=>`<option ${F.pm===d?'selected':''}>${d}</option>`).join('')}</select><div class="panel" style="margin-top:12px"><p>Deposit due now: <b>৳${f(T*S.dep/100)}</b> (${S.dep}%). Balance ৳${f(T*(1-S.dep/100))} is paid when your goods are dispatched and handed over.</p><p class="mu">After you place the order we send ${esc(F.pm)} payment details to your phone and email within one business day. Your quantity is reserved for 24 hours.</p></div>`;
 if(s===4)b=`<p><b>Contact:</b> ${esc(F.name)}, ${esc(F.phone)}${F.email?', '+esc(F.email):''}<br><b>Business:</b> ${esc(F.biz)}<br><b>Deliver to:</b> ${esc(F.addr)}, ${esc(F.dist)}, ${esc(F.div)} (${esc(F.win)})<br><b>Deposit:</b> ${esc(F.pm)}</p><label style="display:flex;gap:8px;align-items:flex-start;color:var(--tx)"><input type="checkbox" style="width:auto;margin-top:5px" ${F.terms?'checked':''} onchange="S.co.f.terms=this.checked">I accept that shade can vary between dye lots, that custom-colour and import orders are made for me once the deposit is confirmed, and that the balance is due at dispatch.</label>`;
 $('app').innerHTML=`<h2>Checkout</h2><div class="trk" style="margin-bottom:6px">${STEPN.map((n,i)=>`<i class="${i<s?'d':''}"></i>`).join('')}</div><p class="mu">Step ${s} of 4: ${STEPN[s-1]}</p><div class="two"><div class="panel">${b}<div class="btns" style="margin-top:14px">${s>1?`<button onclick="S.co.step--;checkout()">Back</button>`:`<button onclick="location.hash='cart'">Back to cart</button>`}<button class="p" onclick="nextStep()">${s===4?'Place order':'Continue'}</button></div></div>
 <div class="panel"><h3>Order summary</h3>${S.cart.map(c=>{const k=sku(c.id);return `<p class="mu">${esc(k.name)}<br>${esc(desc(k,c))}<br>${f(yds(k,c))} yd · ৳${f(lt(k,c))}</p>`}).join('')}<p>Total <b>৳${f(T)}</b><br>Deposit now <b>৳${f(T*S.dep/100)}</b></p></div></div>`}
function nextStep(){const F=S.co.f,s=S.co.step,need={1:['name','phone','biz'],2:['dist','addr','rcv']}[s]||[];
 if(need.some(k=>!F[k])){toast('Please fill in the required fields.');return}
 if(s===1&&!/^(\+?88)?01\d{9}$/.test((F.phone||'').replace(/[\s-]/g,''))){toast('Enter a valid Bangladesh mobile number, like 01XXXXXXXXX.');return}
 if(s===4){if(!F.terms){toast('Please accept the terms to place your order.');return}return place()}
 S.co.step++;checkout()}
async function place(){const F=S.co.f;
 const r=await post('/api/orders',{items:S.cart,cust:F}),d=await r.json().catch(()=>({}));
 if(!r.ok){toast(d.error||'Could not place the order. Please try again.');return}
 S.last={ids:d.ids,T:d.total,pm:F.pm,phone:F.phone};S.cart=[];S.co.step=1;save();await loadCatalog();location.hash='confirmation';route()}
function confirmation(){const L=S.last;if(!L)return home();$('app').innerHTML=`<h2>Order received</h2><div class="panel"><p>Thank you. Your order reference${L.ids.length>1?'s are':' is'} <b>${L.ids.join(', ')}</b>.</p><p>Deposit due: <b>৳${f(L.T*S.dep/100)}</b> via ${esc(L.pm)}. We will send payment details to ${esc(L.phone)} within one business day and keep your quantity reserved for 24 hours. Use your order reference as the payment reference.</p><div class="btns"><button class="p" onclick="location.hash='orders'">Track my orders</button><button onclick="location.hash='market'">Continue shopping</button></div></div>`}
async function orders(){
 if(!S.user){$('app').innerHTML=`<h2>My orders</h2><p>Sign in to see your orders.</p><span class="gsi"></span>`;gsiRender();return}
 const r=await fetch('/api/orders');if(!r.ok){$('app').innerHTML='<h2>My orders</h2><p>Could not load your orders. Please sign in again.</p>';return}
 const O=(await r.json()).orders;
 $('app').innerHTML=`<h2>My orders</h2>`+(O.length?O.map(o=>`<div class="panel"><b>${esc(o.id)}</b> · ${esc(o.sku_name)} · ${f(o.yards)} yd · ৳${f(o.amount)}<br><span class="mu">${esc(o.descr)}</span><div class="trk">${STAGES.map((s,i)=>`<i class="${i<=o.stage?'d':''}"></i>`).join('')}</div><span class="mu">${STAGES[o.stage]}</span></div>`).join(''):`<p>No orders yet. <a href="#market">Browse the marketplace</a>.</p>`)}
function about(){$('app').innerHTML=`<h2>About ZeroPoint LTD</h2><div class="two"><div><p>ZeroPoint LTD sources and imports fabric for Bangladesh’s local clothing trade: shops, boutiques, tailors and small cloth makers.</p><p>We run no warehouses and no trucks. Our scouts compare mills and routes, calculate duty, freight and clearance costs, and lock supplier terms. A licensed C&F partner clears goods, and vetted local carriers deliver.</p><p><b>ZeroPoint LTD is a wing of HighGrounds, by projectAdnan.</b></p></div><figure class="frame"><img src="/img/about.webp" alt="Portrait rendered in red halftone dots"></figure></div>`}
async function loadCatalog(){const d=await (await fetch('/api/catalog')).json();Object.assign(S,d.settings);S.skus=d.skus}
const snap=()=>JSON.stringify({s:{fx:S.fx,risk:S.risk,margin:S.margin,buffer:S.buffer,tiers:S.tiers,dep:S.dep,corr:S.corr},k:S.skus.map(({id,mode,c,bay,imp,step,fill,tgt,usd})=>({id,mode,c,bay,imp,step,fill,tgt,usd})),o:S.orders.map(o=>({id:o.id,st:o.st}))});
let lastSnap='';
async function loadAdmin(){const r=await fetch('/api/admin/orders');if(!r.ok){toast('Not authorised');return false}
 S.orders=(await r.json()).orders.map(o=>({id:o.id,buyer:o.business+' ('+o.name+')',sku:o.sku_name+' / '+o.descr,yd:o.yards,st:o.stage}));lastSnap=snap();return true}
async function persist(){const s=snap();if(s===lastSnap)return;lastSnap=s;const r=await fetch('/api/admin/config',{method:'PUT',headers:{'Content-Type':'application/json'},body:s});toast(r.ok?'Saved':'Save failed')}
function admin(){adminView();persist()}
async function adminGate(){if(!S.admin){$('app').innerHTML='<h2>Admin</h2><p>Sign in with an authorised Google account to continue.</p><span class="gsi"></span>';gsiRender();return}
 if(await loadAdmin())adminView()}
async function boot(){try{const[c]=await Promise.all([fetch('/api/config').then(r=>r.json()),refreshMe(),loadCatalog()]);S.gcfg=c}
 catch(e){$('app').innerHTML='<p>Could not load the catalog. Please refresh.</p>';return}
 S.cart=S.cart.filter(x=>S.skus.some(k=>k.id===x.id));addEventListener('hashchange',route);route()}
boot();
