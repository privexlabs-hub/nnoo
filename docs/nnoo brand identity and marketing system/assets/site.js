/* Nnọọ website interactions — voice, memory, people, place, transmission. */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- audio: tone hum (pitch shape only, never a fake voice) ---------- */
let AC;const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
const f0=v=>150+v*120;
function hum(curve,dur=.9,vol=.16){try{const a=ac();if(a.state==='suspended')a.resume();const o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();o.type='triangle';lp.type='lowpass';lp.frequency.value=1100;o.connect(lp);lp.connect(g);g.connect(a.destination);const t=a.currentTime+.02;o.frequency.setValueAtTime(f0(curve[0]),t);curve.forEach((v,i)=>o.frequency.linearRampToValueAtTime(f0(v),t+dur*i/(curve.length-1)));g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.06);g.gain.setValueAtTime(vol,t+dur-.14);g.gain.linearRampToValueAtTime(0,t+dur);o.start(t);o.stop(t+dur+.05)}catch(e){}}
const toneCurve=p=>{const m={L:.18,M:.5,H:.86},pts=[];[...p].forEach((c,i)=>{pts.push(m[c],m[c]);if(i<p.length-1)pts.push((m[c]+m[p[i+1]])/2)});return pts};
let unlocked=false;addEventListener('pointerdown',()=>{unlocked=true},{once:true});
$$('[data-tone]').forEach(el=>{const c=toneCurve(el.dataset.tone);el.addEventListener('mouseenter',()=>unlocked&&hum(c,.7,.1));el.addEventListener('click',()=>hum(c,.8))});

/* ---------- the living thread (organic waveform) ---------- */
const threads=[];
class Thread{
 constructor(c,o={}){this.c=c;this.x=c.getContext('2d');this.o=Object.assign({color:'#c85a26',strands:3,amp:.16,rest:.16,width:1.6},o);this.a=this.o.rest;this.speak=0;this.t=Math.random()*9;this.vis=false;threads.push(this);new IntersectionObserver(e=>{this.vis=e[0].isIntersecting}).observe(c)}
 say(ms=6000){this.speak=performance.now()+ms}
 draw(now){const c=this.c,d=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;if(!w)return;if(c.width!==w*d){c.width=w*d;c.height=h*d}const x=this.x;x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);
  const speaking=now<this.speak||this.hover;this.t+=speaking?.045:.012;const syl=speaking?(.35+.65*Math.abs(Math.sin(this.t*2.3))*Math.abs(Math.sin(this.t*.9+1))):0;
  const tgt=speaking?this.o.amp*(1.4+2.6*syl):this.o.rest;this.a+=(tgt-this.a)*.12;
  for(let s=0;s<this.o.strands;s++){x.beginPath();const ph=s*1.7,op=s?.35:.95;x.strokeStyle=this.o.color;x.globalAlpha=op;x.lineWidth=s?1:this.o.width;
   for(let i=0;i<=w;i+=3){const u=i/w,env=Math.pow(Math.sin(Math.PI*u),1.3),y=h/2+h*this.a*env*(Math.sin(u*9+this.t*1.3+ph)*.55+Math.sin(u*23-this.t*1.9+ph*2)*.3+Math.sin(u*4.1+this.t*.6)*.25);i?x.lineTo(i,y):x.moveTo(i,y)}x.stroke()}x.globalAlpha=1}
}
function loop(now){threads.forEach(t=>t.vis&&t.draw(now));requestAnimationFrame(loop)}
$$('canvas[data-thread]').forEach(c=>{const t=new Thread(c,{color:getComputedStyle(c).color||'#c85a26',amp:+(c.dataset.amp||.14),rest:+(c.dataset.rest||.1),strands:+(c.dataset.strands||3)});c._t=t;const host=c.closest('[data-hover-voice]');if(host){host.addEventListener('mouseenter',()=>t.hover=true);host.addEventListener('mouseleave',()=>t.hover=false)}});
requestAnimationFrame(loop);

/* ---------- hear an elder ---------- */
const CAPS=[["Ụlọ bụ ebe obi gị nọ.","House is the place your heart sits."],["Ụlọ. Ụ-lọ́.","Home."],["Lee, anya gị gbadata, ekwu ya nwayọọ.","See, let your eye come down, say it softly."]];
function playVoice(btn){const cap=$(btn.dataset.caps||'#caps'),cv=$(btn.dataset.canvas||'#heroThread'),src=btn.dataset.src;const t=cv&&cv._t;
 if(btn.classList.contains('playing')){btn._a&&btn._a.pause();btn.classList.remove('playing');t&&(t.speak=0);clearTimeout(btn._tm);return}
 btn.classList.add('playing');let a=btn._a;if(!a&&src){a=btn._a=new Audio(src)}let real=false;if(a){a.currentTime=0;a.play().then(()=>{real=true}).catch(()=>{})}
 let i=0;const step=()=>{if(i>=CAPS.length){btn.classList.remove('playing');t&&(t.speak=0);return}t&&t.say(3200);if(cap)cap.innerHTML=`<span class="ig">${CAPS[i][0]}</span><small>${CAPS[i][1]}</small>`;i++;btn._tm=setTimeout(step,3200)};step()}
$$('[data-voice]').forEach(b=>b.addEventListener('click',()=>playVoice(b)));

/* ---------- nav + reveal ---------- */
const nav=$('.nav');addEventListener('scroll',()=>nav.classList.toggle('on',scrollY>40),{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.18});
$$('.rv,.prov').forEach(el=>io.observe(el));

/* ---------- hero topography ---------- */
const topo=$('#topo');if(topo){let g='';const cx=74,cy=38;for(let k=1;k<=11;k++){let d='';const n=64;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=k*5.2+Math.sin(a*3+k)*1.6+Math.cos(a*5-k*.7)*1.1;const x=cx+Math.cos(a)*r*1.35,y=cy+Math.sin(a)*r;d+=(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)}g+=`<path d="${d}Z" fill="none" stroke="#d6c8ad" stroke-width="${k%4?.08:.16}"/>`}topo.innerHTML=g}

/* ---------- journey line ---------- */
const J=$('.journey'),secs=$$('[data-j]');
function journey(){if(!J)return;const max=document.documentElement.scrollHeight-innerHeight,p=Math.min(1,scrollY/max);$('.fill',J).style.height=(p*100)+'%';let cur=secs[0];secs.forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.5)cur=s});
 $$('li',J).forEach(li=>li.classList.toggle('on',li.dataset.k===cur.dataset.j));const b=$('.branch',J);b.textContent=cur.dataset.b||'';b.style.top=(p*100)+'%';J.style.setProperty('--accent',cur.dataset.accent||'var(--clay-500)')}
addEventListener('scroll',journey,{passive:true});journey();

/* ---------- scroll-drawn braid ---------- */
const braid=$('#braid');const bp=braid?$$('path.draw',braid):[];bp.forEach(p=>{const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=L;p._L=L});
function drawBraid(){if(!braid)return;const r=braid.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight*.9)));bp.forEach(x=>x.style.strokeDashoffset=x._L*(1-p));$$('.bl',braid).forEach((t,i)=>t.style.opacity=p>.55+i*.08?1:0)}
addEventListener('scroll',drawBraid,{passive:true});drawBraid();

/* ---------- the word: tone line ---------- */
const TG=[.18,.2,.22,.24,.26,.3,.38,.48,.58,.68,.76,.82,.86,.88,.86,.8],CL=[.22,.24,.26,.28,.32,.38,.46,.54,.62,.66,.68,.68,.66,.64,.62,.6],GD=[.2,.22,.24,.26,.3,.36,.44,.52,.62,.72,.8,.84,.86,.86,.82,.78];
const X0=60,X1=940,Y=v=>250-v*200,px=i=>X0+(X1-X0)*i/(TG.length-1);
const smooth=a=>{const P=a.map((v,i)=>[px(i),Y(v)]);let d=`M${P[0][0]},${P[0][1]}`;for(let i=0;i<P.length-1;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;d+=` C${p1[0]+(p2[0]-p0[0])/6},${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6},${p2[1]-(p3[1]-p1[1])/6} ${p2[0]},${p2[1]}`}return d};
const tone=$('#tone');
if(tone){$('.elder',tone).setAttribute('d',smooth(TG));$('.elder2',tone).setAttribute('d',smooth(TG.map(v=>v+.012)));const you=$('.you',tone),fb=$('#feedback'),cur=$('.cursor',tone);let st=0,cv=CL.map(v=>v-.18);
 const setYou=a=>{cv=a;you.setAttribute('d',smooth(a))};setYou(cv);
 const morph=(from,to,ms=900)=>{const s=performance.now();const f=n=>{const k=Math.min(1,(n-s)/ms),e=1-Math.pow(1-k,3);setYou(from.map((v,i)=>v+(to[i]-v)*e));k<1&&requestAnimationFrame(f)};requestAnimationFrame(f)};
 $('#listenWord').addEventListener('click',()=>hum(TG,1.1));
 $('#tryWord').addEventListener('click',e=>{const b=e.currentTarget;if(st===0){you.classList.add('on');morph(cv,CL);hum(CL,1);fb.innerHTML='Fọdụrụ ntakịrị.<small>A little remains. Your pitch stayed flat where hers rose. Lift the second syllable.</small>';b.textContent='Try once more';st=1}else if(st===1){morph(cv,GD);hum(GD,1);fb.innerHTML='Ọ dị mma.<small>It is good. Your tone rose where hers rose — that is the word for home.</small>';b.textContent='Start again';st=2}else{morph(cv,CL.map(v=>v-.18),600);setTimeout(()=>you.classList.remove('on'),500);fb.innerHTML='';b.textContent='Now you say it';st=0}});
 const wrap=$('.tone-wrap');let osc,gn;
 const at=ev=>{const r=tone.getBoundingClientRect(),u=Math.max(0,Math.min(1,((ev.clientX-r.left)/r.width*1000-X0)/(X1-X0))),f=u*(TG.length-1),i=Math.floor(f),v=TG[i]+(TG[Math.min(i+1,TG.length-1)]-TG[i])*(f-i);return{u,v}};
 wrap.addEventListener('pointerdown',ev=>{if(ev.target.closest('button'))return;const a=ac();a.resume();osc=a.createOscillator();gn=a.createGain();osc.type='triangle';osc.connect(gn);gn.connect(a.destination);gn.gain.value=0;gn.gain.linearRampToValueAtTime(.14,a.currentTime+.05);osc.start();wrap.setPointerCapture(ev.pointerId);move(ev)});
 const move=ev=>{const {u,v}=at(ev);cur.setAttribute('cx',X0+u*(X1-X0));cur.setAttribute('cy',Y(v));cur.style.opacity=1;if(osc)osc.frequency.setTargetAtTime(f0(v),ac().currentTime,.02)};
 wrap.addEventListener('pointermove',ev=>{if(osc)move(ev)});
 const end=()=>{if(!osc)return;gn.gain.setTargetAtTime(0,ac().currentTime,.05);const o=osc;setTimeout(()=>o.stop(),200);osc=null;cur.style.opacity=0};wrap.addEventListener('pointerup',end);wrap.addEventListener('pointercancel',end)}

/* ---------- loop ring ---------- */
const ring=$('#ring');if(ring){const N=8,cx=300,cy=300,R=230,names=['Invite','Consent','Record','Send to Ikpe','Decide','Keep','Teach','Return'];let s=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d6c8ad" stroke-width="1"/><circle id="ringRun" cx="${cx}" cy="${cy-R}" r="6" fill="#c85a26"/>`;
 names.forEach((n,i)=>{const a=-Math.PI/2+i/N*Math.PI*2,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,lx=cx+Math.cos(a)*(R+34),ly=cy+Math.sin(a)*(R+34);s+=`<circle class="node" data-i="${i}" cx="${x}" cy="${y}" r="9"/><text class="lbl" data-i="${i}" x="${lx}" y="${ly+4}" text-anchor="${Math.abs(Math.cos(a))<.2?'middle':Math.cos(a)>0?'start':'end'}">${String(i+1).padStart(2,'0')} ${n.toUpperCase()}</text>`});
 s+=`<text x="${cx}" y="${cy-8}" text-anchor="middle" style="font-family:var(--font-archive);font-size:34px;letter-spacing:0;fill:#1a120b">Remember</text><text x="${cx}" y="${cy+26}" text-anchor="middle" style="font-family:var(--font-archive);font-style:italic;font-size:18px;letter-spacing:0;fill:#6b5945">again</text>`;ring.innerHTML=s;
 const sec=$('#loopSec'),lis=$$('.loop-steps li'),run=$('#ringRun');
 const upd=()=>{const r=sec.getBoundingClientRect(),p=Math.max(0,Math.min(.999,(innerHeight*.55-r.top)/(r.height*.8))),k=Math.floor(p*N),a=-Math.PI/2+p*Math.PI*2;run.setAttribute('cx',cx+Math.cos(a)*R);run.setAttribute('cy',cy+Math.sin(a)*R);$$('.node,.lbl',ring).forEach(n=>n.classList.toggle('on',+n.dataset.i<=k));lis.forEach((l,i)=>l.classList.toggle('on',i<=k))};addEventListener('scroll',upd,{passive:true});upd()}

/* ---------- constellation of hometowns ---------- */
const TOWNS=[['Nnewi',30,58,['Mama Ada Nwosu','Papa Emeka Okafor','Chief Nwachukwu'],12],['Onitsha',14,40,['Mama Nneka','Igwe Obinna'],7],['Awka',36,34,['Papa Chijioke'],6],['Umudioka',24,26,['Custodian of Umudioka'],3],['Owerri',42,76,['Auntie Chinwe'],8],['Orlu',30,82,['Mama Uche'],3],['Oguta',16,72,['Papa Ikenna'],2],['Ihiala',20,86,['Mama Chioma'],2],['Enugu',62,30,['Mama Adaeze'],9],['Nsukka',66,10,['Papa Chijioke'],6],['Udi',54,42,['Papa Obi'],3],['Abakaliki',84,28,['Papa Okoro'],4],['Afikpo',88,56,['Mama Ogbonne'],2],['Okigwe',56,62,['Papa Ezenwa'],2],['Umuahia',64,78,['Mama Ngozi'],3],['Aba',56,92,['Papa Kalu'],2],['Ohafia',78,72,['Mama Ụkwụ'],1],['Asaba',6,52,['Mama Nkechi'],1]];
const TINTS=['var(--clay-50)','var(--marigold-50)','var(--forest-50)','var(--plum-50)'];
const con=$('#constel');if(con){let lines='';TOWNS.forEach((a,i)=>{const nb=TOWNS.map((b,j)=>[j,Math.hypot(a[1]-b[1],a[2]-b[2])]).filter(x=>x[0]!==i).sort((x,y)=>x[1]-y[1]).slice(0,2);nb.forEach(([j])=>{if(j>i||!TOWNS[j])lines+=`<line x1="${a[1]}%" y1="${a[2]}%" x2="${TOWNS[j][1]}%" y2="${TOWNS[j][2]}%"/>`})});
 con.innerHTML=`<svg aria-hidden="true">${lines}</svg>`+TOWNS.map((t,i)=>`<button class="town" style="left:${t[1]}%;top:${t[2]}%;--sz:${6+t[4]}px" data-i="${i}"><i></i><span>${t[0]}</span><span class="pop"><b>${t[4]} ELDER${t[4]>1?'S':''} RECORDED</b>${t[3].join('<br>')}</span></button>`).join('');
 const lbl=$('#townSel');$$('.town',con).forEach(b=>b.addEventListener('click',()=>{const on=b.classList.contains('sel');$$('.town',con).forEach(x=>x.classList.remove('sel'));if(on){document.body.style.setProperty('--tint','transparent');lbl.textContent='Choose a hometown to walk into it.';return}b.classList.add('sel');const t=TOWNS[b.dataset.i];document.body.style.setProperty('--tint',TINTS[b.dataset.i%4]);lbl.innerHTML=`You are in <em>${t[0]}</em>. ${t[4]} of its elders are in Ọbá.`}))}

/* ---------- archive: serendipity ---------- */
const recs=$$('.rec'),ser=$('#serendip');
$$('.cats button').forEach(b=>b.addEventListener('click',()=>{$$('.cats button').forEach(x=>x.classList.toggle('on',x===b));const c=b.dataset.cat;if(c==='all'){recs.forEach(r=>r.classList.remove('hide'));ser.textContent='';return}
 const others=recs.filter(r=>r.dataset.cat!==c),luck=others[Math.floor(Math.random()*others.length)];recs.forEach(r=>r.classList.toggle('hide',r.dataset.cat!==c&&r!==luck));ser.innerHTML=`You came looking for a ${b.textContent.toLowerCase()}. You found “${luck.dataset.title}.”`}));

/* ---------- ikpe ---------- */
let base=51;$$('.choices button').forEach(b=>b.addEventListener('click',()=>{$$('.choices button').forEach(x=>x.classList.toggle('on',x===b));$('#quorumN').textContent=(base+1)+' / 60 kin';$('#quorumBar').style.width=((base+1)/60*100)+'%';$('#voted').textContent='Your voice counts once. You are from Nnewi — it counts toward kin quorum. You can change it until the case closes.'}));
const tr=$('.travel');if(tr){const run=$('.run',tr),lis=$$('li',tr);const up=()=>{const r=tr.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight*.75-r.top)/(innerHeight*.6)));run.style.left=`calc(${p*80}% )`;lis.forEach((l,i)=>l.style.opacity=p>=i/5-.001?1:.45)};addEventListener('scroll',up,{passive:true});up()}

/* ---------- ọha threads ---------- */
const th=$('#threads');if(th){const H=[380,300],C=[['Lagos',250,420,19],['London',520,70,34],['Atlanta',80,150,28],['Toronto',150,40,9],['Houston',40,300,14]];let s='';
 C.forEach((c,i)=>{const mx=(H[0]+c[1])/2,my=Math.min(H[1],c[2])-120;s+=`<path id="t${i}" d="M${H[0]},${H[1]} Q${mx},${my} ${c[1]},${c[2]}"/>`});
 s+=`<g class="city home"><circle cx="${H[0]}" cy="${H[1]}" r="10"/><text x="${H[0]+18}" y="${H[1]+6}">Nnewi</text></g>`;
 C.forEach((c,i)=>{s+=`<g class="city" data-i="${i}"><circle cx="${c[1]}" cy="${c[2]}" r="6"/><text x="${c[1]+12}" y="${c[2]+5}">${c[0]}</text><text class="n" x="${c[1]+12}" y="${c[2]+22}">${c[3]} KIN</text></g>`});th.innerHTML=s;
 $$('.city[data-i]',th).forEach(g=>{g.addEventListener('mouseenter',()=>$('#t'+g.dataset.i).classList.add('hot'));g.addEventListener('mouseleave',()=>$('#t'+g.dataset.i).classList.remove('hot'))})}

/* ---------- a day: proverb reveal ---------- */
const rv=$('#dayReveal');if(rv){let k=0;const rs=$$('.r',rv),b=$('button',rv);b.addEventListener('click',()=>{if(k<rs.length){rs[k].classList.add('on');k++;b.textContent=k===1?'What does it mean?':'Close'}else{rs.forEach(r=>r.classList.remove('on'));k=0;b.textContent='Show translation'}})}

/* ---------- who taught you ---------- */
const tf=$('#tellForm');if(tf){tf.addEventListener('submit',e=>{e.preventDefault();const v=$('input',tf).value.trim();if(!v)return;$('#thanks').textContent='Daalụ. Some words stay with us because of who gave them.';$('input',tf).value=''})}
})();
