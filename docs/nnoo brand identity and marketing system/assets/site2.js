/* Nnọọ marketing site v2 — interactions. DS components from _ds_bundle.js (window.NnooButton etc). */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const h=(...a)=>React.createElement(...a);

/* ---------- design-system mounts ---------- */
const DS={button:window.NnooButton,chip:window.NnooChip,eyebrow:window.Eyebrow,icon:window.Icon,waveform:window.Waveform};
$$('[data-ds]').forEach(el=>{const C=DS[el.dataset.ds];if(!C)return;const d=el.dataset,txt=el.textContent.trim(),href=d.href;
 const props={variant:d.variant,size:d.size,tone:d.tone,name:d.name,color:d.color,bars:d.bars?+d.bars:undefined,progress:d.progress?+d.progress:undefined,icon:d.iconName&&DS.icon?h(DS.icon,{name:d.iconName,size:16,color:'currentColor'}):undefined};
 if(href)props.onClick=()=>{location.href=href};Object.keys(props).forEach(k=>props[k]===undefined&&delete props[k]);
 ReactDOM.createRoot(el).render(h(C,props,txt||undefined))});

/* phone preview composed from DS components */
const ph=$('#phone');if(ph&&window.IOSDevice){const {NnooCard,NnooButton,NnooChip,Eyebrow,Waveform,Icon,NnooTheme:T}=window;
 const serif={fontFamily:T.fontArchive};
 ph.__r=ReactDOM.createRoot(ph);ph.__r.render(h(window.IOSDevice,null,h('div',{style:{background:T.bg,minHeight:'100%',padding:'70px 20px 40px'}},
  h(Eyebrow,null,'Nnọọ, Chinyere.'),h('div',{style:{fontFamily:T.fontDisplay,fontWeight:700,fontSize:26,letterSpacing:'-0.02em',color:T.ink900,margin:'2px 0 18px'}},'Welcome home'),
  h('div',{style:{background:'radial-gradient(500px 260px at 0% 0%, #fbe4d4 0%, transparent 60%), #f3ead8',borderRadius:24,padding:20}},
   h(Eyebrow,null,"Today's lesson · 2 of 3"),h('div',{style:{fontFamily:T.fontDisplay,fontWeight:700,fontSize:28,letterSpacing:'-0.02em',margin:'6px 0 4px'}},'Words for home'),
   h('div',{style:{fontSize:14,color:T.ink700,marginBottom:14}},'ụlọ · ezi · ọnụ ụzọ'),h('div',{style:{marginBottom:14}},h(NnooChip,{tone:'clay',icon:h(Icon,{name:'mic',size:12,color:T.claySoftFg})},'Mama Ada · Nnewi')),h(NnooButton,{fullWidth:true,size:'lg'},"Gaa n'ihu · continue")),
  h('div',{style:{marginTop:16}},h(NnooCard,{tone:'archive',padding:16},h(Eyebrow,null,'Ilu ụbọchị · proverb today'),h('div',{style:{...serif,fontStyle:'italic',fontSize:21,lineHeight:1.3,margin:'8px 0 10px'}},'“Otu onye anaghị azụ nwata.”'),h(NnooChip,{tone:'forest'},'Nnewi dialect'))),
  h('div',{style:{marginTop:16,background:T.plum,color:'#faf5ec',borderRadius:18,padding:16,display:'flex',gap:12,alignItems:'center'}},h(Icon,{name:'users',size:20,color:'#faf5ec'}),h('div',null,h('div',{style:{fontFamily:T.fontDisplay,fontWeight:600,fontSize:15}},'2 recordings need your voice'),h('div',{style:{...serif,fontStyle:'italic',fontSize:13,opacity:.85}},'Ikpe · the people decide'))),
  h('div',{style:{marginTop:16}},h(NnooCard,{padding:14},h(Eyebrow,null,'From Ọbá · Nnewi'),h('div',{style:{...serif,fontSize:17,margin:'6px 0 10px'}},'The story of ọjị — the kola nut'),h(Waveform,{progress:.35,bars:36})))
 )))}

/* ---------- audio: tone hum (pitch shape only) ---------- */
let AC;const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());const f0=v=>150+v*120;
function hum(c,dur=.9,vol=.15){try{const a=ac();a.resume();const o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();o.type='triangle';lp.type='lowpass';lp.frequency.value=1100;o.connect(lp);lp.connect(g);g.connect(a.destination);const t=a.currentTime+.02;o.frequency.setValueAtTime(f0(c[0]),t);c.forEach((v,i)=>o.frequency.linearRampToValueAtTime(f0(v),t+dur*i/(c.length-1)));g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.06);g.gain.setValueAtTime(vol,t+dur-.14);g.gain.linearRampToValueAtTime(0,t+dur);o.start(t);o.stop(t+dur+.05)}catch(e){}}

/* ---------- living thread ---------- */
const threads=[];
class Thread{constructor(c,o){this.c=c;this.x=c.getContext('2d');this.o=o;this.a=o.rest;this.t=Math.random()*9;this.speak=0;threads.push(this);new IntersectionObserver(e=>this.vis=e[0].isIntersecting).observe(c)}
 say(ms){this.speak=performance.now()+ms}
 draw(n){const c=this.c,d=devicePixelRatio||1,w=c.clientWidth,H=c.clientHeight;if(!w)return;if(c.width!==Math.round(w*d)){c.width=w*d;c.height=H*d}const x=this.x;x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,H);
  const sp=n<this.speak||this.hover;this.t+=sp?.045:.01;const syl=sp?.35+.65*Math.abs(Math.sin(this.t*2.3))*Math.abs(Math.sin(this.t*.9+1)):0;this.a+=((sp?this.o.amp*(1.3+2.4*syl):this.o.rest)-this.a)*.1;
  for(let s=0;s<this.o.strands;s++){x.beginPath();x.strokeStyle=this.o.color;x.globalAlpha=s?.32:.95;x.lineWidth=s?1:1.7;const ph=s*1.7;
   for(let i=0;i<=w;i+=3){const u=i/w,e=Math.pow(Math.sin(Math.PI*u),1.3),y=H/2+H*this.a*e*(Math.sin(u*9+this.t*1.3+ph)*.55+Math.sin(u*23-this.t*1.9+ph*2)*.3+Math.sin(u*4.1+this.t*.6)*.25);i?x.lineTo(i,y):x.moveTo(i,y)}x.stroke()}x.globalAlpha=1}}
$$('canvas[data-thread]').forEach(c=>{const t=new Thread(c,{color:getComputedStyle(c).color,amp:+(c.dataset.amp||.14),rest:+(c.dataset.rest||.06),strands:+(c.dataset.strands||3)});c._t=t;const host=c.closest('[data-hover-voice]');if(host){host.addEventListener('mouseenter',()=>t.hover=1);host.addEventListener('mouseleave',()=>t.hover=0)}});
(function loop(n){threads.forEach(t=>t.vis&&t.draw(n));requestAnimationFrame(loop)})(0);

/* ---------- hear an elder ---------- */
const CAPS=[["Ụlọ bụ ebe obi gị nọ.","House is the place your heart sits."],["Ụlọ. Ụ-lọ́.","Home."],["Lee, anya gị gbadata, ekwu ya nwayọọ.","See, let your eye come down, say it softly."]];
$$('[data-voice]').forEach(b=>b.addEventListener('click',()=>{const cap=$(b.dataset.caps),t=$(b.dataset.canvas)?._t;
 if(b.classList.contains('playing')){b._a&&b._a.pause();b.classList.remove('playing');t&&(t.speak=0);clearTimeout(b._tm);return}
 b.classList.add('playing');if(b.dataset.src){b._a=b._a||new Audio(b.dataset.src);b._a.currentTime=0;b._a.play().catch(()=>{})}
 let i=0;const step=()=>{if(i>=CAPS.length){b.classList.remove('playing');t&&(t.speak=0);return}t&&t.say(3300);cap.innerHTML=`<div class="ln"><span>${CAPS[i][0]}</span><small>${CAPS[i][1]}</small></div>`;i++;b._tm=setTimeout(step,3300)};step()}));

/* ---------- word-by-word headline reveal ---------- */
$$('.split').forEach(el=>{const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(p));return}const w=document.createElement('span');w.className='w';const i=document.createElement('span');i.textContent=p;w.appendChild(i);f.appendChild(w)});c.replaceWith(f)}else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})};walk(el);$$('.w>span',el).forEach((s,i)=>s.style.transitionDelay=(i*55)+'ms')});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
$$('.rv,.split,.portrait,.case,.phone').forEach(el=>io.observe(el));

/* ---------- nav ---------- */
const nav=$('.nav');let ly=0;addEventListener('scroll',()=>{const y=scrollY;nav.classList.toggle('on',y>30);nav.classList.toggle('hide',y>600&&y>ly&&!nav.classList.contains('open'));ly=y},{passive:true});
$('.menu-btn')?.addEventListener('click',()=>nav.classList.toggle('open'));$$('.nav nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

/* ---------- topography ---------- */
const topo=$('#topo');if(topo){let g='<g>';for(let k=1;k<=12;k++){let d='';for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,r=k*5+Math.sin(a*3+k)*1.6+Math.cos(a*5-k*.7)*1.1;d+=(i?'L':'M')+(74+Math.cos(a)*r*1.35).toFixed(2)+' '+(40+Math.sin(a)*r).toFixed(2)}g+=`<path d="${d}Z" fill="none" stroke="#d6c8ad" stroke-width="${k%4?.07:.14}" vector-effect="non-scaling-stroke"/>`}topo.innerHTML=g+'</g>'}

/* ---------- scroll-driven: parallax, braid, ikpe path ---------- */
const imgs=$$('[data-parallax]'),braid=$('#braid'),bp=braid?$$('path.draw',braid):[],path=$('.path'),run=path&&$('.run',path);
bp.forEach(p=>{p._L=p.getTotalLength();p.style.strokeDasharray=p._L;p.style.strokeDashoffset=p._L});
function onScroll(){const vh=innerHeight;
 if(!RM)imgs.forEach(el=>{const r=el.parentElement.getBoundingClientRect();el.style.transform=`translateY(${((r.top+r.height/2)-vh/2)*-.06}px)`});
 if(braid){const r=braid.getBoundingClientRect(),p=Math.max(0,Math.min(1,(vh-r.top)/(vh*.85)));bp.forEach(x=>x.style.strokeDashoffset=x._L*(1-p));$$('.bl',braid).forEach((t,i)=>t.style.opacity=p>.6+i*.08?1:0)}
 if(run){const r=path.getBoundingClientRect(),p=Math.max(0,Math.min(1,(vh*.8-r.top)/(vh*.5)));run.style.left=`calc(${p*80}%)`;$$('div',path).forEach((d,i)=>d.style.opacity=p>=i/5?1:.45)}}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* ---------- the word: tone line ---------- */
const TG=[.18,.2,.22,.24,.26,.3,.38,.48,.58,.68,.76,.82,.86,.88,.86,.8],CL=[.22,.24,.26,.28,.32,.38,.46,.54,.62,.66,.68,.68,.66,.64,.62,.6],GD=[.2,.22,.24,.26,.3,.36,.44,.52,.62,.72,.8,.84,.86,.86,.82,.78];
const X0=30,X1=970,Y=v=>230-v*190,px=i=>X0+(X1-X0)*i/(TG.length-1);
const smooth=a=>{const P=a.map((v,i)=>[px(i),Y(v)]);let d=`M${P[0]}`;for(let i=0;i<P.length-1;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;d+=` C${p1[0]+(p2[0]-p0[0])/6},${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6},${p2[1]-(p3[1]-p1[1])/6} ${p2}`}return d};
const tone=$('#tone');if(tone){const el=$('.elder-l',tone),you=$('.you',tone),fb=$('#feedback'),cur=$('.cursor',tone);el.setAttribute('d',smooth(TG));
 if(!RM){const L=el.getTotalLength();el.style.strokeDasharray=L;el.style.strokeDashoffset=L;new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){el.style.transition='stroke-dashoffset 1800ms cubic-bezier(.2,.8,.2,1)';el.style.strokeDashoffset=0;o.disconnect()}},{threshold:.5}).observe(tone)}
 let st=0,cv=CL.map(v=>v-.2);const setY=a=>{cv=a;you.setAttribute('d',smooth(a))};setY(cv);
 const morph=to=>{const from=cv.slice(),s=performance.now();const f=n=>{const k=Math.min(1,(n-s)/900),e=1-Math.pow(1-k,3);setY(from.map((v,i)=>v+(to[i]-v)*e));k<1&&requestAnimationFrame(f)};requestAnimationFrame(f)};
 $('#listenWord').addEventListener('click',()=>hum(TG,1.1));$('.word').addEventListener('click',()=>hum(TG,1));
 $('#tryWord').addEventListener('click',()=>{const lbl=$('#tryWord').querySelector('button')||$('#tryWord');
  if(st===0){you.classList.add('on');morph(CL);hum(CL,1);fb.innerHTML='Fọdụrụ ntakịrị.<small>A little remains — your pitch stayed flat where hers rose. Try again.</small>';st=1}
  else if(st===1){morph(GD);hum(GD,1);fb.innerHTML='Ọ dị mma.<small>It is good. Your tone rose where hers rose.</small>';st=2}
  else{morph(CL.map(v=>v-.2));you.classList.remove('on');fb.innerHTML='';st=0}});
 const wrap=$('.tone-wrap');let osc,gn;const at=ev=>{const r=tone.getBoundingClientRect(),u=Math.max(0,Math.min(1,((ev.clientX-r.left)/r.width*1000-X0)/(X1-X0))),f=u*(TG.length-1),i=Math.floor(f);return{u,v:TG[i]+((TG[i+1]??TG[i])-TG[i])*(f-i)}};
 const mv=ev=>{const{u,v}=at(ev);cur.setAttribute('cx',X0+u*(X1-X0));cur.setAttribute('cy',Y(v));cur.style.opacity=1;osc&&osc.frequency.setTargetAtTime(f0(v),ac().currentTime,.02)};
 wrap.addEventListener('pointerdown',ev=>{const a=ac();a.resume();osc=a.createOscillator();gn=a.createGain();osc.type='triangle';osc.connect(gn);gn.connect(a.destination);gn.gain.value=0;gn.gain.linearRampToValueAtTime(.13,a.currentTime+.05);osc.start();wrap.setPointerCapture(ev.pointerId);mv(ev)});
 wrap.addEventListener('pointermove',ev=>osc&&mv(ev));const end=()=>{if(!osc)return;gn.gain.setTargetAtTime(0,ac().currentTime,.05);const o=osc;setTimeout(()=>o.stop(),200);osc=null;cur.style.opacity=0};wrap.addEventListener('pointerup',end);wrap.addEventListener('pointercancel',end)}

/* ---------- ikpe vote ---------- */
$$('.choices button').forEach(b=>b.addEventListener('click',()=>{$$('.choices button').forEach(x=>x.classList.toggle('on',x===b));$('#qn').textContent='52 / 60 KIN';$('#voted').textContent='Your voice counts once. You can change it until the case closes.'}));

/* ---------- ọha: threads + hometown finder ---------- */
const HOME={Nnewi:[214,{London:34,Atlanta:28,Lagos:19,Houston:14,Toronto:9}],Owerri:[168,{Houston:22,London:18,Lagos:31,Atlanta:9,Toronto:6}],Enugu:[152,{Lagos:27,London:15,Toronto:12,Houston:8,Atlanta:7}],Onitsha:[131,{London:21,Lagos:24,Atlanta:11,Houston:6,Toronto:5}],Nsukka:[96,{Lagos:18,Houston:12,London:9,Toronto:4,Atlanta:3}],Awka:[74,{Lagos:14,London:8,Atlanta:6,Houston:4,Toronto:2}],Aba:[61,{Lagos:12,London:7,Houston:5,Atlanta:3,Toronto:2}],Umuahia:[48,{Lagos:9,London:6,Houston:3,Toronto:2,Atlanta:2}],Abakaliki:[37,{Lagos:8,London:4,Houston:2,Atlanta:1,Toronto:1}]};
const CITY=[['Lagos',250,420],['London',520,70],['Atlanta',80,150],['Toronto',150,40],['Houston',40,300]];
const th=$('#threads');function drawThreads(town){const [n,c]=HOME[town]||HOME.Nnewi,Hx=380,Hy=300;let s='';CITY.forEach((k,i)=>{s+=`<path id="t${i}" d="M${Hx},${Hy} Q${(Hx+k[1])/2},${Math.min(Hy,k[2])-120} ${k[1]},${k[2]}"/>`});
 s+=`<g class="home"><circle cx="${Hx}" cy="${Hy}" r="10"/><text x="${Hx+18}" y="${Hy+6}">${town}</text></g>`;CITY.forEach((k,i)=>{s+=`<g class="city" data-i="${i}"><circle cx="${k[1]}" cy="${k[2]}" r="6"/><text x="${k[1]+12}" y="${k[2]+5}">${k[0]}</text><text class="n" x="${k[1]+12}" y="${k[2]+22}">${c[k[0]]} KIN</text></g>`});th.innerHTML=s;
 $$('.city',th).forEach(g=>{g.addEventListener('mouseenter',()=>$('#t'+g.dataset.i).classList.add('hot'));g.addEventListener('mouseleave',()=>$('#t'+g.dataset.i).classList.remove('hot'))});
 $('#found').innerHTML=`<b>${town}</b><span>${n} people from ${town} are already in Ọha.</span>`}
if(th){drawThreads('Nnewi');const inp=$('#findTown');inp.addEventListener('input',()=>{const v=inp.value.trim().toLowerCase();const m=Object.keys(HOME).find(k=>k.toLowerCase().startsWith(v));if(v&&m)drawThreads(m);else if(v)$('#found').innerHTML=`<b style="font-size:32px">Not yet.</b><span>Be the first from ${inp.value.trim()} — invite your family.</span>`})}

/* ---------- small forms ---------- */
$$('form[data-thanks]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const i=$('input',f);if(!i.value.trim())return;i.value='';i.placeholder=f.dataset.thanks}));
})();
