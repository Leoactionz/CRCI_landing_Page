(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var root=document.documentElement;
var HAS_GSAP=!!(window.gsap&&window.ScrollTrigger);
if(HAS_GSAP) gsap.registerPlugin(ScrollTrigger);
function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }
function esc(t){ return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }

/* ================= PREFERENCES: motion + theme ================= */
var osReduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var motionPref=null;
var motion=true;
function applyMotion(){
  root.classList.toggle("calm",!motion);
  $$(".motion-btn").forEach(function(b){ b.setAttribute("aria-pressed",motion); b.title=motion?"Turn animations off":"Turn animations on"; var l=$(".mlabel",b); if(l) l.textContent="Animations: "+(motion?"on":"off"); });
}
applyMotion();
$$(".motion-btn").forEach(function(b){ b.addEventListener("click",function(){ motion=!motion; store("crci-motion",motion?"on":"off"); applyMotion(); toast(motion?"Animations on":"Animations off"); setTimeout(function(){ location.reload(); },500); }); });

var themePref=store("crci-theme");
if(themePref==="dark"||themePref==="light") root.setAttribute("data-theme",themePref);
function isDark(){ var t=root.getAttribute("data-theme"); if(t) return t==="dark"; return window.matchMedia("(prefers-color-scheme: dark)").matches; }
function applyTheme(){
  var d=isDark();
  $$(".theme-btn").forEach(function(b){ b.setAttribute("aria-pressed",d); b.title=d?"Switch to light mode":"Switch to dark mode"; var l=$(".tlabel",b); if(l) l.textContent="Dark mode: "+(d?"on":"off"); });
  if(window.__shaderTheme) window.__shaderTheme(d);
}
$$(".theme-btn").forEach(function(b){ b.addEventListener("click",function(){ var d=!isDark(); root.setAttribute("data-theme",d?"dark":"light"); store("crci-theme",d?"dark":"light"); applyTheme(); }); });
try{ window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme); }catch(e){}

/* ================= TOAST + MODAL ================= */
var toastT=null;
function toast(msg){ var t=$("#toast"); $("#toastMsg").textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove("show")},2600); }
var modal=$("#modal"), lastFocus=null;
function openModal(html){ lastFocus=document.activeElement; $("#modalBody").innerHTML=html; modal.dataset.open="true"; modal.setAttribute("aria-hidden","false"); setTimeout(function(){ var f=$("#modalBody button, #modalBody input, #modalBody a",modal)||$(".modal-x",modal); if(f) f.focus(); },60); }
function closeModal(){ modal.dataset.open="false"; modal.setAttribute("aria-hidden","true"); if(lastFocus) try{lastFocus.focus()}catch(e){} }
$$("[data-mclose]",modal).forEach(function(el){ el.addEventListener("click",closeModal); });
document.addEventListener("keydown",function(e){ if(e.key==="Escape"){ closeModal(); setSheet(false); } });
document.addEventListener("click",function(e){
  var c=e.target.closest("[data-copy]"); if(!c) return;
  var v=c.getAttribute("data-copy");
  var done=function(){ toast("Copied "+v); };
  try{ navigator.clipboard.writeText(v).then(done,function(){ selectText(c.previousElementSibling); toast("Press Ctrl+C or Cmd+C to copy"); }); }catch(err){ selectText(c.previousElementSibling); }
});
function selectText(el){ if(!el) return; var r=document.createRange(); r.selectNodeContents(el); var s=getSelection(); s.removeAllRanges(); s.addRange(r); }

/* ================= MOBILE SHEET ================= */
var sheet=$("#sheet"), openBtn=$("#menuOpen");
function setSheet(o){ sheet.dataset.open=o; sheet.setAttribute("aria-hidden",!o); openBtn.setAttribute("aria-expanded",o); }
openBtn.addEventListener("click",function(){setSheet(true)});
$$("[data-close]",sheet).forEach(function(el){el.addEventListener("click",function(){setSheet(false)})});

/* ================= SHARED STATE + DATA ================= */
var S={ role:"guardian", user:null, pending:{}, enroll:null, demo:{flags:[],score:0,answered:[],signed:false} };
var LEVELS={
  1:{name:"Early phonics & sounding out",ages:"Ages 5-7",why:"Your child will start with letter sounds, sight words and short picture stories."},
  2:{name:"Fluency & vocabulary expansion",ages:"Ages 8-10",why:"Your child is ready to move from learning to read to reading to learn."},
  3:{name:"Critical analysis & expression",ages:"Ages 11-14",why:"Your child can go deeper: character analysis, essays and opinions on nonfiction."}
};
function levelFor(age,read,comp){
  var l=age<=7?1:age<=10?2:3;
  if(read===0) l=1; else if(read===1&&l===3) l=2;
  if(comp===2&&read===2&&age>=10) l=3;
  if(comp===0&&l===3) l=2;
  return l;
}
var Q=[
  {q:'My 8-year-old son struggled with phonics and hated reading aloud. After <span class="serif">six weeks</span> with his mentor, his teacher called to praise his progress.',n:"Bisi Adebayo",r:"Guardian, Ikeja, Lagos",i:"BA",c:""},
  {q:'The Guardian Dashboard is fantastic. I review session recordings and <span class="serif">approve finished books</span> from my phone at work.',n:"Chidi Okonkwo",r:"Parent, Abuja",i:"CO",c:"plum"},
  {q:'Clear lesson plans and reading materials let me spend each session on the child and make a <span class="serif">direct impact.</span>',n:"Fatima Kalu",r:"Literacy mentor",i:"FK",c:""}
];
var F=[
  {c:"mentors",q:"How are CRCi Hub mentors vetted?",a:"Every mentor passes a background check and education credential verification, then completes 15+ hours of specialised child literacy training before hosting a session."},
  {c:"sessions",q:"What equipment does my child need?",a:"A smartphone, tablet or laptop with a working microphone, and a stable internet connection for the 30-minute live session. Headphones help in busy homes."},
  {c:"guardians",q:"Can guardians monitor live or recorded sessions?",a:"Yes. Every session is recorded and appears in the Guardian portal with the mentor's notes, so you can watch it back and sign off book milestones."},
  {c:"sessions",q:"How long is each session?",a:"Sessions are 30 minutes, once a week, live with your child's mentor."},
  {c:"guardians",q:"How is my child's starting level chosen?",a:"A 10-minute diagnostic reading test sets the baseline. You can also try the level finder on the Tracks page before you enroll."},
  {c:"guardians",q:"Which ages do you support?",a:"Learners aged 5 to 14, across three tracks: Early Phonics (5-7), Fluency and Vocabulary (8-10) and Critical Analysis and Expression (11-14)."},
  {c:"mentors",q:"Can I become a mentor?",a:"Yes. Community volunteers apply through the Volunteer portal and complete the same vetting and training as every CRCi mentor."},
  {c:"schools",q:"How do schools partner with CRCi Hub?",a:"Schools can enrol whole classes and track them in the Teacher portal. Write to support@crcihub.org to start a partnership."}
];
function ava(i,c){ return '<span class="ava '+(c||"")+'">'+i+'</span>'; }

/* ================= CLOCK-FREE STATIC RENDERS ================= */
var terms=[["Phonics","font-family:var(--f-read);font-size:22px"],["SIGHT WORDS","font-family:var(--f-mono);font-size:12px;letter-spacing:.14em"],["Fluency","font-family:var(--f-display);font-weight:600;font-size:18px;letter-spacing:-.02em"],["Vocabulary","font-family:var(--f-read);font-size:21px;font-style:italic"],["COMPREHENSION","font-weight:600;font-size:12px;letter-spacing:.2em"],["Storytelling","font-family:var(--f-read);font-size:22px"],["Essay outlining","font-family:var(--f-display);font-weight:500;font-size:17px"],["PUBLIC SPEAKING","font-family:var(--f-mono);font-size:12px;letter-spacing:.14em"],["Read-aloud","font-family:var(--f-display);font-weight:600;font-size:18px;letter-spacing:-.03em"]];
var mq=$("#mq"), mh="";
for(var r=0;r<2;r++) terms.forEach(function(t){ mh+='<span style="'+t[1]+'">'+t[0]+'</span><span style="margin:0;color:var(--hl)">✳</span>'; });
mq.innerHTML=mh;
var dh=""; for(var i=0;i<45;i++) dh+='<i class="on"></i>'; $("#dots").innerHTML=dh;
var crowd=$("#crowd"); if(crowd){ var ch=""; for(var k=0;k<36;k++) ch+="<i></i>"; crowd.innerHTML=ch; }
var fd=$("#fieldDots"); if(fd){ var fh="", lit={}; var seed=7; while(Object.keys(lit).length<45){ seed=(seed*9301+49297)%233280; lit[Math.floor(seed/233280*120)]=1; } for(var j=0;j<120;j++) fh+='<i'+(lit[j]?' class="c"':'')+'></i>'; fd.innerHTML=fh; }
var st=$("#stories"); if(st) st.innerHTML=Q.map(function(t){ return '<article class="story" data-a="card"><blockquote>“'+t.q+'”</blockquote><div class="q-who">'+ava(t.i,t.c)+'<div><strong>'+t.n+'</strong><small>'+t.r+'</small></div></div></article>'; }).join("");

function faqHTML(list,prefix,openFirst){
  return list.map(function(f,k){ var o=openFirst&&k===0; return '<div class="qa" data-open="'+o+'" data-c="'+f.c+'"><button id="'+prefix+'q'+k+'" aria-expanded="'+o+'" aria-controls="'+prefix+'a'+k+'">'+f.q+'<span class="pm"><svg><use href="#i-plus"/></svg></span></button><div class="ans" id="'+prefix+'a'+k+'" role="region" aria-labelledby="'+prefix+'q'+k+'"><div><p>'+f.a+'</p></div></div></div>'; }).join("");
}
function wireFaq(box){
  box.addEventListener("click",function(e){
    var b=e.target.closest(".qa > button"); if(!b) return;
    var qa=b.parentNode, o=qa.dataset.open!=="true";
    $$(".qa",box).forEach(function(x){ x.dataset.open="false"; $("button",x).setAttribute("aria-expanded","false"); });
    qa.dataset.open=o; b.setAttribute("aria-expanded",o);
  });
}
$("#faqList").innerHTML=faqHTML(F.slice(0,3),"h",true); wireFaq($("#faqList"));
$("#faqFull").innerHTML=faqHTML(F,"f",true); wireFaq($("#faqFull"));
(function faqFilter(){
  var input=$("#faqSearch"), cat="all", box=$("#faqFull");
  function run(){
    var q=input.value.trim().toLowerCase(), shown=0;
    $$(".qa",box).forEach(function(el,k){ var f=F[k]; var ok=(cat==="all"||f.c===cat)&&(!q||(f.q+" "+f.a).toLowerCase().indexOf(q)>-1); el.hidden=!ok; if(ok) shown++; });
    var em=$(".faq-empty",box); if(!shown&&!em){ em=document.createElement("p"); em.className="faq-empty"; box.appendChild(em); }
    if(em){ em.hidden=!!shown; em.textContent='No questions match "'+input.value+'". Try another word, or write to support@crcihub.org.'; }
  }
  input.addEventListener("input",run);
  $$("#faqCats button").forEach(function(b){ b.addEventListener("click",function(){ cat=b.dataset.c; $$("#faqCats button").forEach(function(x){x.setAttribute("aria-pressed",x===b)}); run(); }); });
})();

/* ================= HOME: reader karaoke + testimonials ================= */
var syl={Ada:["A","da"],carried:["car","ried"],clay:["clay"],pot:["pot"],down:["down"],river:["ri","ver"],before:["be","fore"],sun:["sun"],was:["was"],high:["high"],the:["the"],to:["to"],water:["wa","ter"],cool:["cool"],and:["and"],clear:["clear"],small:["small"],blue:["blue"],bird:["bird"],sat:["sat"],on:["on"],a:["a"],stone:["stone"],sang:["sang"],filled:["filled"],her:["her"],lifted:["lift","ed"],it:["it"],onto:["on","to"],head:["head"],walked:["walked"],home:["home"],slowly:["slow","ly"],smiling:["smil","ing"],The:["The"],A:["A"]};
function sylOf(w){ var c=w.replace(/[^A-Za-z]/g,""); return syl[c]||syl[c.toLowerCase()]||[c]; }
var rt=$("#readerText"), rWords=rt.textContent.trim().split(/\s+/);
rt.innerHTML=rWords.map(function(w,k){return '<span class="w" data-k="'+k+'">'+w+'</span>'}).join(" ");
var rEls=$$(".w",rt), syllEl=$("#syll"), ri=0;
function readerShow(k){ rEls.forEach(function(el,n){ el.classList.toggle("done",n<k); el.classList.toggle("now",n===k); }); syllEl.innerHTML=sylOf(rWords[k]).map(function(p,n){return (n?'<span>·</span>':'')+'<span class="hl">'+p+'</span>'}).join(""); }
var wave=$("#wave"), wv=""; for(var b2=0;b2<26;b2++) wv+='<i style="animation-delay:-'+(Math.random()*1.1).toFixed(2)+'s;animation-duration:'+(0.8+Math.random()*0.7).toFixed(2)+'s"></i>'; wave.innerHTML=wv;

var quote=$("#quote"), qWho=$("#qWho"), qList=$("#qList"), qi=0, qTween=null;
qList.innerHTML=Q.map(function(t,k){return '<button class="q-item" role="tab" aria-selected="false" data-k="'+k+'">'+ava(t.i,t.c)+'<span><strong>'+t.n+'</strong><small>'+t.r+'</small></span><span class="pb"></span></button>'}).join("");
var qBtns=$$(".q-item",qList);
function setQ(k,anim){
  qi=k; var t=Q[k];
  var render=function(){ quote.innerHTML="“"+t.q+"”"; qWho.innerHTML=ava(t.i,t.c)+'<div><strong>'+t.n+'</strong><small>'+t.r+'</small></div>'; };
  qBtns.forEach(function(b,n){ b.setAttribute("aria-selected",n===k); $(".pb",b).style.width="0"; });
  if(HAS_GSAP&&anim&&motion){ gsap.to([quote,qWho],{opacity:0,y:-10,duration:.3,ease:"power2.in",onComplete:function(){ render(); gsap.fromTo([quote,qWho],{opacity:0,y:14},{opacity:1,y:0,duration:.6,ease:"power3.out",stagger:.06}); }}); }
  else render();
  if(qTween) qTween.kill();
  if(HAS_GSAP&&motion&&current==="home") qTween=gsap.fromTo($(".pb",qBtns[k]),{width:"0%"},{width:"100%",duration:7,ease:"none",onComplete:function(){ setQ((qi+1)%Q.length,true); }});
}
qBtns.forEach(function(b){ b.addEventListener("click",function(){ setQ(+b.dataset.k,true); }); });

/* ================= WEBGL HERO SHADER ================= */
var shader=(function(){
  var cv=$("#shader"), gl=cv.getContext("webgl",{antialias:false,premultipliedAlpha:true,alpha:true});
  if(!gl){ cv.style.background="radial-gradient(40% 50% at 75% 30%,rgba(22,163,74,.35),transparent 70%)"; return {resize:function(){},start:function(){},stop:function(){}}; }
  var vs="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var fs=[
  "precision highp float;",
  "uniform vec2 R;uniform float T;uniform vec3 P[6];uniform vec3 B1;uniform vec3 B2;uniform float DK;",
  "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
  "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
  "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+7.1;a*=.5;}return v;}",
  "vec3 field(vec2 uv){",
  "  vec2 q=uv*1.7;",
  "  float r=length(q-vec2(1.1,.5));",
  "  float a=fbm(q+vec2(T*.03,-T*.02))*6.2832*.35+r*.6;",
  "  q=mat2(cos(a),-sin(a),sin(a),cos(a))*q;",
  "  float s=fbm(q*1.3+T*.04);",
  "  vec3 base=mix(B1,B2,smoothstep(.3,.75,s));",
  "  float o=0.;",
  "  for(int i=0;i<6;i++){vec2 d=uv-P[i].xy;o+=P[i].z*exp(-dot(d,d)/(.055));}",
  "  vec2 w=uv+.12*vec2(fbm(uv*2.+T*.05),fbm(uv*2.-T*.05));",
  "  vec2 c1=vec2(.95+.18*sin(T*.21),.85+.08*cos(T*.17));",
  "  vec2 c2=vec2(1.35+.12*cos(T*.13),.25+.1*sin(T*.19));",
  "  o+=.75*exp(-dot(w-c1,w-c1)/.08)+.5*exp(-dot(w-c2,w-c2)/.05);",
  "  o=clamp(o,0.,1.4);",
  "  vec3 g=mix(vec3(.086,.639,.29),vec3(.29,.871,.502),fbm(w*3.+T*.1));",
  "  g=mix(g,g*.55,DK);",
  "  return mix(base,g,smoothstep(.05,1.,o)*.9);",
  "}",
  "void main(){",
  "  vec2 uv=gl_FragCoord.xy/R.y;",
  "  float ang=radians(31.);vec2 dir=vec2(cos(ang),sin(ang));",
  "  float x=dot(uv,dir)*8.;",
  "  float s=fract(x)*2.-1.;",
  "  float bulge=s*sqrt(max(0.,1.-s*s*.92));",
  "  vec2 off=dir*bulge*.022;",
  "  float ab=.61*.012;",
  "  vec3 col;",
  "  col.r=field(uv+off*1.61+dir*ab).r;",
  "  col.g=field(uv+off).g;",
  "  col.b=field(uv+off*.39-dir*ab).b;",
  "  col+=pow(max(0.,-s),6.)*mix(.12,.05,DK);",
  "  col-=pow(max(0.,s),10.)*.035;",
  "  col+=(h(gl_FragCoord.xy+fract(T)*100.)-.5)*.05;",
  "  gl_FragColor=vec4(col,1.);",
  "}"].join("\n");
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ cv.style.display="none"; return {resize:function(){},start:function(){},stop:function(){}}; }
  gl.useProgram(pr);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var U={R:gl.getUniformLocation(pr,"R"),T:gl.getUniformLocation(pr,"T"),P:gl.getUniformLocation(pr,"P"),B1:gl.getUniformLocation(pr,"B1"),B2:gl.getUniformLocation(pr,"B2"),DK:gl.getUniformLocation(pr,"DK")};
  var W=2,H=2, dark=isDark();
  function resize(){ var dpr=Math.min(window.devicePixelRatio||1,2); W=Math.max(2,Math.round(cv.clientWidth*dpr*.55)); H=Math.max(2,Math.round(cv.clientHeight*dpr*.55)); cv.width=W; cv.height=H; gl.viewport(0,0,W,H); draw(performance.now()); }
  var hero=$(".hero"), target={x:-9,y:-9}, pts=[], energy=0, lastMove=0, running=false, visible=true, t0=performance.now(), arr=new Float32Array(18);
  for(var k=0;k<6;k++) pts.push({x:1.3,y:.7});
  hero.addEventListener("pointermove",function(e){ var rc=cv.getBoundingClientRect(); target.x=(e.clientX-rc.left)/rc.height; target.y=(rc.bottom-e.clientY)/rc.height; if(energy<0.05) pts.forEach(function(p){p.x=target.x;p.y=target.y}); energy=Math.min(1,energy+0.08); lastMove=performance.now(); });
  function draw(now){
    var t=(now-t0)/1000;
    if(now-lastMove>120) energy*=0.965;
    for(var i=0;i<pts.length;i++){ var lead=i===0?target:pts[i-1], m=i===0?.13:.22; pts[i].x+=(lead.x-pts[i].x)*m; pts[i].y+=(lead.y-pts[i].y)*m; arr[i*3]=pts[i].x; arr[i*3+1]=pts[i].y; arr[i*3+2]=energy*(1-i*.11)*.9; }
    if(dark){ gl.uniform3f(U.B1,.016,.082,.059); gl.uniform3f(U.B2,.031,.12,.09); } else { gl.uniform3f(U.B1,1,1,1); gl.uniform3f(U.B2,.93,.965,.945); }
    gl.uniform1f(U.DK,dark?1:0); gl.uniform2f(U.R,W,H); gl.uniform1f(U.T,t*.6); gl.uniform3fv(U.P,arr);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  function loop(now){ if(!running) return; if(visible) draw(now); requestAnimationFrame(loop); }
  if("IntersectionObserver" in window) new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(hero);
  window.addEventListener("resize",resize);
  window.__shaderTheme=function(d){ dark=d; draw(performance.now()); };
  return { resize:resize, start:function(){ resize(); if(motion&&!running){ running=true; requestAnimationFrame(loop); } }, stop:function(){ running=false; } };
})();

/* ================= SMOOTH SCROLL ================= */
var lenis=null;
if(HAS_GSAP&&motion&&window.Lenis){
  try{ lenis=new Lenis({duration:1.1,smoothWheel:true}); lenis.on("scroll",ScrollTrigger.update); gsap.ticker.add(function(t){lenis.raf(t*1000)}); gsap.ticker.lagSmoothing(0); }catch(e){ lenis=null; }
}
function toTop(){ if(lenis) lenis.scrollTo(0,{immediate:true,force:true}); window.scrollTo(0,0); }
function scrollToEl(el){ if(!el) return; if(lenis) lenis.scrollTo(el,{offset:-90}); else el.scrollIntoView({behavior:motion?"smooth":"auto",block:"start"}); }

/* nav hides on scroll down (ScrollTrigger, no scroll listener) */
var navShell=$("#navShell");
if(HAS_GSAP) ScrollTrigger.create({start:0,end:"max",onUpdate:function(self){ var y=self.scroll(); navShell.classList.toggle("hide",self.direction===1&&y>240); }});

/* ================= REVEAL HELPERS ================= */
function splitWords(h){
  if(h.dataset.split) return; h.dataset.split="1";
  (function walk(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(c){
      if(c.nodeType===3){
        var frag=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function(p){
          if(!p) return;
          if(/^\s+$/.test(p)){ frag.appendChild(document.createTextNode(p)); return; }
          var o=document.createElement("span"); o.className="wo"; o.style.cssText="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em";
          var i=document.createElement("span"); i.className="wi"; i.style.display="inline-block"; i.textContent=p; o.appendChild(i); frag.appendChild(o);
        });
        node.replaceChild(frag,c);
      } else if(c.nodeType===1) walk(c);
    });
  })(h);
}
function counter(el,trigger){
  var to=parseFloat(el.dataset.to), dec=+(el.dataset.dec||0), sep=el.dataset.sep, o={v:0};
  var fmt=function(v){ var s=v.toFixed(dec); return sep?Number(s).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec}):s; };
  gsap.to(o,{v:to,duration:1.8,ease:"power3.out",onUpdate:function(){el.textContent=fmt(o.v)},onComplete:function(){el.textContent=fmt(to)},scrollTrigger:{trigger:trigger||el,start:"top 95%",once:true}});
}
function reveals(el){
  $$("[data-a=words],[data-a=ph]",el).forEach(function(h){
    splitWords(h);
    gsap.from($$(".wi",h),{yPercent:105,duration:1.05,ease:"expo.out",stagger:.03,scrollTrigger:{trigger:h,start:"top 90%",once:true}});
  });
  $$("[data-a=up],[data-a=fade]",el).forEach(function(x){ if(x.closest(".hero")) return; gsap.from(x,{y:24,opacity:0,duration:.9,ease:"power3.out",scrollTrigger:{trigger:x,start:"top 92%",once:true}}); });
  var cards=$$("[data-a=card]",el);
  if(cards.length) ScrollTrigger.batch(cards,{start:"top 92%",once:true,onEnter:function(b){ gsap.from(b,{y:40,opacity:0,duration:1,ease:"expo.out",stagger:.08}); }});
  $$(".count",el).forEach(function(c){ counter(c); });
  $$(".ring-arc",el).forEach(function(c){ var full=parseFloat(c.getAttribute("stroke-dasharray")), v=parseFloat(c.dataset.v); gsap.fromTo(c,{attr:{"stroke-dashoffset":full}},{attr:{"stroke-dashoffset":full*(1-v/100)},duration:1.8,ease:"power3.out",delay:c.closest(".hero")?.7:0,scrollTrigger:{trigger:c,start:"top 95%",once:true}}); });
  $$(".ph",el).forEach(function(ph){ gsap.to($(".ph-blob.a",ph),{yPercent:30,xPercent:-8,ease:"none",scrollTrigger:{trigger:ph,start:"top top",end:"bottom top",scrub:true}}); });
}

/* ================= PAGE MODULES ================= */
var timers=[];
function every(fn,ms){ timers.push(setInterval(fn,ms)); }
var M={};

M.home={enter:function(el){
  shader.start();
  if(motion){
    var w=0; readerShow(0);
    every(function(){ w=(w+1)%(rWords.length+3); if(w<rWords.length) readerShow(w); else rEls.forEach(function(x){x.classList.add("done");x.classList.remove("now")}); },520);
    var tArc=$("#timerArc"), tTxt=$("#timerTxt"), tSec=450;
    every(function(){ tSec=(tSec+1)%601; var left=600-tSec; tTxt.textContent=("0"+Math.floor(left/60)).slice(-2)+":"+("0"+left%60).slice(-2); tArc.setAttribute("stroke-dashoffset",(289*(1-tSec/600)).toFixed(1)); },1000);
  } else { rEls.forEach(function(x){x.classList.add("done")}); readerShow(4); }
  setQ(qi,false);
  if(!HAS_GSAP||!motion) return;
  var tl=gsap.timeline({defaults:{ease:"expo.out"}});
  tl.from("#heroTitle .ln>span",{yPercent:110,duration:1.25,stagger:.09})
    .from(".hero [data-a=fade]",{y:22,opacity:0,duration:1,stagger:.08},"-=.95")
    .fromTo(".hero-photo",{clipPath:"inset(14% 10% 14% 10% round 20px)"},{clipPath:"inset(0% 0% 0% 0% round 20px)",duration:1.5,ease:"expo.inOut",clearProps:"clipPath"},0)
    .from(".hero-photo img",{scale:1.18,duration:1.8,ease:"expo.out"},0)
    .from("[data-a=spot]",{y:50,opacity:0,duration:1.2},"-=1.1");
  gsap.to(".hero-photo img",{yPercent:8,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
  gsap.to(".hero-media .spot",{y:-50,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
  gsap.to("#shader",{yPercent:16,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
  gsap.from("#dots i",{scale:0,opacity:0,duration:.5,ease:"back.out(3)",stagger:{each:.018,from:"random"},scrollTrigger:{trigger:"#dots",start:"top 92%",once:true}});
  var mm=gsap.matchMedia(); this.mm=mm;
  var steps=$("#steps"), bar=$("#howBar"), num=$("#howNum");
  mm.add("(min-width:768px)",function(){
    var dist=function(){ return Math.max(0,steps.scrollWidth-steps.parentElement.clientWidth); };
    var tw=gsap.to(steps,{x:function(){return -dist()},ease:"none",scrollTrigger:{trigger:"#howPin",start:"top top",end:function(){return "+="+dist()},pin:true,scrub:1,invalidateOnRefresh:true,
      onUpdate:function(self){ bar.style.transform="scaleX("+(1+self.progress*3)+")"; num.textContent="0"+Math.min(4,1+Math.floor(self.progress*3.999)); }}});
    $$(".step",steps).forEach(function(s){ gsap.from($(".step-art",s),{scale:.92,opacity:.4,ease:"none",scrollTrigger:{trigger:s,containerAnimation:tw,start:"left 95%",end:"left 55%",scrub:true}}); });
    return function(){ bar.style.transform=""; };
  });
  mm.add("(max-width:767px)",function(){ $$(".step",steps).forEach(function(s){ gsap.from(s,{y:36,opacity:0,duration:1,ease:"power3.out",scrollTrigger:{trigger:s,start:"top 90%",once:true}}); }); });
  gsap.from("[data-a=tk]",{y:110,opacity:0,duration:1.2,ease:"expo.out",stagger:.13,scrollTrigger:{trigger:".stair",start:"top 85%",once:true}});
  gsap.from(".axis .line",{scaleX:0,transformOrigin:"left",duration:1.5,ease:"expo.out",scrollTrigger:{trigger:".axis",start:"top 95%",once:true}});
  if(window.matchMedia("(hover:hover)").matches){
    var spot=$(".hero-media .spot"), hero=$(".hero");
    this.onMove=function(e){ var cx=e.clientX/innerWidth-.5, cy=e.clientY/innerHeight-.5; gsap.to(spot,{rotateY:cx*7,rotateX:-cy*7,duration:1,ease:"power3.out",transformPerspective:900}); gsap.to(".hero-photo img",{x:-cx*14,duration:1.2,ease:"power3.out"}); };
    hero.addEventListener("pointermove",this.onMove);
  }
}, leave:function(){ shader.stop(); if(this.mm) this.mm.revert(); if(this.onMove) $(".hero").removeEventListener("pointermove",this.onMove); if(qTween) qTween.kill(); }};

M.about={enter:function(el){
  var info={
    learner:["The learner","At the centre of everything","Every session, note and milestone is organised around one child's reading journey."],
    mentor:["The mentor","Reads with the learner","A vetted, trained literacy coach who reads live with your child every week and flags words to practise."],
    guardian:["The guardian","Watches and signs off","Parents and guardians watch recordings, read mentor notes and approve each book milestone."],
    school:["The school","Enrols and tracks","Partner schools enrol classes and follow every learner's level and comprehension in the Teacher portal."]
  };
  var box=$("#netInfo",el);
  function show(k){
    var d=info[k]; box.innerHTML='<span class="mono">'+d[1]+'</span><h3>'+d[0]+'</h3><p>'+d[2]+'</p>';
    $$(".net-node",el).forEach(function(n){ n.classList.toggle("active",n.dataset.node===k); });
    $$("#netTabs button",el).forEach(function(b){ b.setAttribute("aria-pressed",b.dataset.node===k); });
    if(HAS_GSAP&&motion) gsap.fromTo(box.children,{y:12,opacity:0},{y:0,opacity:1,duration:.5,stagger:.05,ease:"power3.out"});
  }
  show("learner");
  this.h=function(e){ var t=e.target.closest("[data-node]"); if(t) show(t.dataset.node); };
  this.k=function(e){ if((e.key==="Enter"||e.key===" ")&&e.target.closest(".net-node")){ e.preventDefault(); show(e.target.closest(".net-node").dataset.node); } };
  el.addEventListener("click",this.h); el.addEventListener("keydown",this.k);
  if(HAS_GSAP&&motion){
    gsap.fromTo($(".pipe-line i",el),{scaleX:0},{scaleX:1,ease:"none",scrollTrigger:{trigger:"#pipe",start:"top 80%",end:"bottom 60%",scrub:true}});
    gsap.from($$(".pipe-step",el),{y:30,opacity:0,duration:.9,stagger:.12,ease:"power3.out",scrollTrigger:{trigger:"#pipe",start:"top 85%",once:true}});
    gsap.from($$("#crowd i",el),{scale:0,duration:.4,stagger:{each:.012,from:"random"},ease:"back.out(2)",scrollTrigger:{trigger:"#crowd",start:"top 90%",once:true}});
  }
}, leave:function(el){ el.removeEventListener("click",this.h); el.removeEventListener("keydown",this.k); }};

M["how-it-works"]={enter:function(el){
  var steps=$$(".sc-step",el), screens=$$(".screen",el);
  function act(i){ steps.forEach(function(s,n){ s.classList.toggle("active",n===i); }); screens.forEach(function(s,n){ s.classList.toggle("on",n===i); }); }
  act(0);
  if(HAS_GSAP){ steps.forEach(function(s,i){ ScrollTrigger.create({trigger:s,start:"top 55%",end:"bottom 55%",onToggle:function(self){ if(self.isActive) act(i); }}); }); }
  if(HAS_GSAP&&motion) gsap.from($$(".seg",el),{scaleX:0,transformOrigin:"left",duration:1,stagger:.12,ease:"expo.out",scrollTrigger:{trigger:"#segbar",start:"top 88%",once:true}});
}};

M.tracks={enter:function(el){
  var age=$("#fAge",el), out=$("#fAgeOut",el), ans={read:1,comp:0};
  function upd(anim){
    var a=+age.value; out.textContent=a;
    var l=levelFor(a,ans.read,ans.comp), L=LEVELS[l];
    $("#fLvl",el).textContent="Level "+l; $("#fTitle",el).textContent=L.name; $("#fWhy",el).textContent=L.ages+". "+L.why;
    $("#fGo",el).dataset.level=l;
    if(anim&&HAS_GSAP&&motion) gsap.fromTo(["#fLvl","#fTitle","#fWhy"],{y:10,opacity:.2},{y:0,opacity:1,duration:.45,stagger:.05,ease:"power3.out"});
  }
  age.addEventListener("input",function(){upd(true)});
  $$("[data-q]",el).forEach(function(g){ $$(".opt",g).forEach(function(b){ b.addEventListener("click",function(){ ans[g.dataset.q]=+b.dataset.v; $$(".opt",g).forEach(function(x){x.setAttribute("aria-pressed",x===b)}); upd(true); }); }); });
  upd(false);
  var p=S.pending; S.pending={};
  setTimeout(function(){ if(p.finder) scrollToEl($("#finder",el)); else if(p.track) scrollToEl($("#track-"+p.track,el)); },motion?650:60);
}};

M.impact={enter:function(el){ if(HAS_GSAP&&motion) gsap.from($$("#fieldDots i.c",el),{scale:0,opacity:0,duration:.6,ease:"back.out(3)",stagger:{each:.02,from:"random"},scrollTrigger:{trigger:"#fieldDots",start:"top 88%",once:true}}); }};

/* ---------- DEMO ---------- */
var STORY=["Ada carried the clay pot down to the river before the sun was high.","The water was cool and clear. A small blue bird sat on a stone and sang.","Ada filled her pot, lifted it onto her head, and walked home slowly, smiling."];
var QUIZ=[
  {q:"Where did Ada take the clay pot?",o:["To the market","Down to the river","To school"],a:1,why:"Page 1: she carried the pot down to the river."},
  {q:"What sat on the stone?",o:["A small blue bird","A goat","A fish"],a:0,why:"Page 2: a small blue bird sat on a stone and sang."},
  {q:"How did Ada walk home?",o:["Running fast","Slowly, smiling","Crying"],a:1,why:"Page 3: she walked home slowly, smiling."}
];
M.demo={enter:function(el){
  var self=this, page=0, word=0, playing=false, speed=600, sel="river", t=null;
  var txt=$("#storyText",el), dots=$("#pageDots",el), play=$("#readPlay",el), live=$("#readLive",el);
  var canSpeak=("speechSynthesis" in window);
  if(!canSpeak) $("#wSay",el).hidden=true;
  function words(){ return STORY[page].split(/\s+/); }
  function renderPage(){
    txt.innerHTML=words().map(function(w,k){ var c=w.replace(/[^A-Za-z]/g,""); return '<button type="button" class="word'+(S.demo.flags.indexOf(c.toLowerCase())>-1?" flag":"")+'" data-k="'+k+'">'+esc(w)+'</button>'; }).join(" ");
    $("#pgLabel",el).textContent="Page "+(page+1)+" of "+STORY.length;
    dots.innerHTML=STORY.map(function(_,k){ return '<button aria-label="Page '+(k+1)+'" aria-current="'+(k===page)+'" data-p="'+k+'">'+(k+1)+'</button>'; }).join("");
    word=0;
  }
  function mark(k){ $$(".word",txt).forEach(function(b,n){ b.classList.toggle("done",n<k); b.classList.toggle("now",n===k); }); }
  function pick(w){
    sel=w.replace(/[^A-Za-z]/g,"");
    $("#wBig",el).textContent=sel; $("#wSyll",el).innerHTML=sylOf(sel).map(function(p,n){return (n?'<span>·</span>':'')+'<span class="hl">'+p+'</span>'}).join("");
    var parts=sylOf(sel).length; $("#wTip",el).textContent=parts>1?"Say it in "+parts+" parts, then blend them together.":"One sound group. Say it clearly, then reread the sentence.";
    var flagged=S.demo.flags.indexOf(sel.toLowerCase())>-1; $("#wFlag span",el).lastChild.textContent=flagged?"Remove from practice":"Practise this word";
    if(HAS_GSAP&&motion) gsap.fromTo("#wBig",{y:12,opacity:0},{y:0,opacity:1,duration:.4,ease:"power3.out"});
  }
  function say(w){ if(!canSpeak) return; try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(w); u.rate=.8; u.lang="en-GB"; speechSynthesis.speak(u); }catch(e){} }
  function stop(){ playing=false; clearInterval(t); play.innerHTML='<svg><use href="#i-play"/></svg>'; play.setAttribute("aria-label","Play read-along"); live.hidden=true; }
  function start(){
    playing=true; live.hidden=false; play.innerHTML='<svg><use href="#i-pause"/></svg>'; play.setAttribute("aria-label","Pause read-along");
    clearInterval(t);
    t=setInterval(function(){
      var ws=words();
      if(word<ws.length){ mark(word); pick(ws[word]); word++; }
      else if(page<STORY.length-1){ page++; renderPage(); }
      else { mark(ws.length); stop(); toast("Story finished. Try the questions next."); }
    },speed);
  }
  self.stop=stop;
  play.addEventListener("click",function(){ playing?stop():start(); });
  $$("#speed .opt",el).forEach(function(b){ b.addEventListener("click",function(){ speed=+b.dataset.s; $$("#speed .opt",el).forEach(function(x){x.setAttribute("aria-pressed",x===b)}); if(playing) start(); }); });
  dots.addEventListener("click",function(e){ var b=e.target.closest("[data-p]"); if(!b) return; stop(); page=+b.dataset.p; renderPage(); });
  txt.addEventListener("click",function(e){ var b=e.target.closest(".word"); if(!b) return; pick(b.textContent); say(sel); $$(".word",txt).forEach(function(x){x.classList.toggle("now",x===b)}); });
  $("#wSay",el).addEventListener("click",function(){ say(sel); });
  $("#wFlag",el).addEventListener("click",function(){
    var w=sel.toLowerCase(), i=S.demo.flags.indexOf(w);
    if(i>-1){ S.demo.flags.splice(i,1); toast('Removed "'+sel+'"'); } else { S.demo.flags.push(w); toast('Added "'+sel+'" to practice'); }
    renderFlags(); renderPage(); pick(sel);
  });
  function renderFlags(){ var f=$("#flags",el); f.innerHTML=S.demo.flags.length?S.demo.flags.map(function(w){return '<span>'+esc(w)+'</span>'}).join(""):'<span style="opacity:.6">None yet</span>'; }
  /* tabs */
  var tabs=$$("#demoTabs [role=tab]",el), ind=$("#demoInd",el);
  function moveInd(b){ ind.style.width=b.offsetWidth+"px"; ind.style.transform="translateX("+(b.offsetLeft-5)+"px)"; }
  function tab(name){
    tabs.forEach(function(b){ var on=b.dataset.t===name; b.setAttribute("aria-selected",on); b.tabIndex=on?0:-1; if(on) moveInd(b); });
    $$("[data-panel]",el).forEach(function(p){ p.hidden=p.dataset.panel!==name; });
    if(name!=="read") stop();
    if(name==="quiz") renderQuiz(); if(name==="report") renderReport();
    if(HAS_GSAP&&motion) gsap.from($('[data-panel="'+name+'"] .demo-grid > *',el),{y:24,opacity:0,duration:.7,stagger:.08,ease:"power3.out"});
  }
  self.tab=tab;
  ind.style.transition="transform .5s var(--ease),width .5s var(--ease)";
  tabs.forEach(function(b){ b.addEventListener("click",function(){ tab(b.dataset.t); }); b.addEventListener("keydown",function(e){ var i=tabs.indexOf(b); if(e.key==="ArrowRight"||e.key==="ArrowLeft"){ var n=tabs[(i+(e.key==="ArrowRight"?1:tabs.length-1))%tabs.length]; n.focus(); tab(n.dataset.t); } }); });
  /* quiz */
  var qn=0;
  function renderQuiz(){
    var box=$("#quiz",el);
    if(qn>=QUIZ.length){
      box.innerHTML='<span class="mono" style="color:var(--ink-3)">All done</span><h3>You answered '+S.demo.score+' of 3 correctly.</h3><p style="color:var(--ink-2)">'+(S.demo.score===3?"Full marks. A mentor would move on to a longer story next week.":"A mentor would reread the tricky page together before moving on.")+'</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-orange" id="toReport"><span class="roll"><span>See the guardian report</span><span aria-hidden="true">See the guardian report</span></span><span class="ic"><svg><use href="#i-arrow"/></svg></span></button><button class="btn-ghost" id="qAgain">Try again</button></div>';
      $("#toReport",box).addEventListener("click",function(){ tab("report"); });
      $("#qAgain",box).addEventListener("click",function(){ qn=0; S.demo.score=0; S.demo.answered=[]; ring(); renderQuiz(); });
      return;
    }
    var it=QUIZ[qn];
    box.innerHTML='<div class="qdots">'+QUIZ.map(function(_,k){return '<i class="'+(k<=qn?"on":"")+'"></i>'}).join("")+'</div><span class="mono" style="color:var(--ink-3)">Question '+(qn+1)+' of 3</span><h3>'+it.q+'</h3><div class="qopts">'+it.o.map(function(o,k){return '<button class="qopt" data-k="'+k+'">'+o+'</button>'}).join("")+'</div><p class="qfb" aria-live="polite"></p>';
    $$(".qopt",box).forEach(function(b){ b.addEventListener("click",function(){
      var k=+b.dataset.k, ok=k===it.a;
      $$(".qopt",box).forEach(function(x,n){ x.disabled=true; if(n===it.a){ x.classList.add("right"); x.insertAdjacentHTML("beforeend",'<svg><use href="#i-check"/></svg>'); } });
      if(!ok){ b.classList.add("wrong"); b.insertAdjacentHTML("beforeend",'<svg><use href="#i-x"/></svg>'); }
      if(ok) S.demo.score++; S.demo.answered.push(ok); ring();
      $(".qfb",box).textContent=(ok?"Correct. ":"Not quite. ")+it.why;
      if(HAS_GSAP&&motion) gsap.fromTo(b,{scale:.98},{scale:1,duration:.4,ease:"back.out(3)"});
      setTimeout(function(){ qn++; renderQuiz(); },1500);
    }); });
  }
  function ring(){ $("#qScore",el).textContent=S.demo.score; $("#qRing",el).setAttribute("stroke-dashoffset",(251.33*(1-S.demo.score/3)).toFixed(2)); }
  /* report */
  function renderReport(){
    var flags=S.demo.flags, sc=S.demo.answered.length?S.demo.score+"/3":"Not taken";
    $("#repKpis",el).innerHTML='<div class="kpi" style="background:var(--ground)"><span>Pages read</span><b>3</b></div><div class="kpi" style="background:var(--ground)"><span>Comprehension</span><b>'+sc+'</b></div><div class="kpi" style="background:var(--ground)"><span>Words flagged</span><b>'+flags.length+'</b></div>';
    $("#repNote",el).innerHTML='<b>Mentor note</b>'+(flags.length?"Good effort today. We will practise "+flags.slice(0,3).map(function(w){return '"'+esc(w)+'"'}).join(", ")+" next week.":"Read the whole story with confidence. Ready for a longer story next week.");
    $("#repWords",el).innerHTML=flags.length?flags.map(function(w){return '<span class="opt" aria-pressed="true">'+esc(w)+'</span>'}).join(""):'<span style="color:var(--ink-2);font-size:14px">No words flagged. Tap "Practise this word" while reading to add some.</span>';
    var sign=$("#repSign",el); sign.disabled=S.demo.signed; $(".roll",sign).innerHTML=S.demo.signed?'<span>Signed off</span><span aria-hidden="true">Signed off</span>':'<span>Sign off this session</span><span aria-hidden="true">Sign off this session</span>';
  }
  $("#repSign",el).addEventListener("click",function(){ if(S.demo.signed) return; S.demo.signed=true; renderReport(); toast("Session signed off"); burst($("#repSign",el)); });
  $("#repRestart",el).addEventListener("click",function(){ S.demo={flags:[],score:0,answered:[],signed:false}; qn=0; page=0; renderPage(); renderFlags(); ring(); pick("river"); tab("read"); });
  renderPage(); renderFlags(); pick("river"); ring();
  requestAnimationFrame(function(){ tab(S.pending.tab||"read"); S.pending={}; });
}, leave:function(){ if(this.stop) this.stop(); try{ speechSynthesis.cancel(); }catch(e){} }};

/* ---------- celebration burst ---------- */
function burst(anchor,host){
  if(!HAS_GSAP||!motion) return;
  var r=anchor.getBoundingClientRect(), layer=document.createElement("div");
  layer.style.cssText="position:fixed;left:0;top:0;width:0;height:0;z-index:75;pointer-events:none";
  document.body.appendChild(layer);
  var cols=["#15803D","#4ADE80","#22C55E","#BBF7D0","#064E3B"];
  for(var i=0;i<34;i++){
    var p=document.createElement("i"); p.style.cssText="position:absolute;width:8px;height:12px;border-radius:2px;background:"+cols[i%5]+";left:"+(r.left+r.width/2)+"px;top:"+(r.top+r.height/2)+"px";
    layer.appendChild(p);
    gsap.to(p,{x:(Math.random()-.5)*420,y:-(80+Math.random()*260),rotate:Math.random()*540,duration:.9,ease:"power3.out"});
    gsap.to(p,{y:"+=320",opacity:0,duration:1.1,delay:.85,ease:"power2.in"});
  }
  setTimeout(function(){ layer.remove(); },2300);
}

/* ---------- ENROLL ---------- */
M.enroll={enter:function(el){
  var step=0, form=$("#wiz",el), steps=$$(".wstep",el), rail=$$("#wizRail li",el), bar=$("#wizBar",el), back=$("#wizBack",el), next=$("#wizNext",el), nav=$("#wizNav",el);
  var data=S.enroll||{conf:"Reads short sentences",day:"Saturday",time:"10:00",age:8};
  var age=$("#cAge",el);
  if(S.pending.level){ data.forced=+S.pending.level; } S.pending={};
  age.textContent=data.age;
  function lvl(){ var c={"Just starting":[0,0],"Reads short sentences":[1,1],"Reads chapter books":[2,2]}[data.conf]; return data.forced||levelFor(+age.textContent,c[0],c[1]); }
  function chip(){ var l=lvl(); $("#wLevelChip",el).innerHTML='<b>Level '+l+'</b>'+LEVELS[l].name; }
  $$(".stepper button",el).forEach(function(b){ b.addEventListener("click",function(){ var v=Math.min(14,Math.max(5,+age.textContent+ +b.dataset.d)); age.textContent=v; data.age=v; data.forced=null; chip(); }); });
  $$("[data-group]",el).forEach(function(g){ var key=g.dataset.group; $$(".opt",g).forEach(function(b){ if(data[key]) b.setAttribute("aria-pressed",b.dataset.v===data[key]); b.addEventListener("click",function(){ data[key]=b.dataset.v; if(key==="conf") data.forced=null; $$(".opt",g).forEach(function(x){x.setAttribute("aria-pressed",x===b)}); chip(); }); }); });
  chip();
  function field(id){ return $("#"+id,el); }
  function err(id,bad){ var f=field(id).closest(".field"); f.classList.toggle("err",bad); field(id).setAttribute("aria-invalid",bad); return bad; }
  function validate(n){
    var bad=false;
    if(n===0){
      bad=err("gName",field("gName").value.trim().length<3)|bad;
      bad=err("gEmail",!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field("gEmail").value.trim()))|bad;
      bad=err("gPhone",field("gPhone").value.replace(/\D/g,"").length<10)|bad;
      bad=err("gCity",!field("gCity").value)|bad;
    }
    if(n===1) bad=err("cName",field("cName").value.trim().length<2)|bad;
    if(n===3){ var ok=$("#consent",el).checked; $("#consentF",el).classList.toggle("err",!ok); bad=!ok; }
    if(bad){ var first=$(".field.err input, .field.err select",el); if(first) first.focus(); if(HAS_GSAP&&motion) gsap.fromTo(form,{x:-6},{x:0,duration:.5,ease:"elastic.out(1,.3)"}); }
    return !bad;
  }
  $$(".inp",el).forEach(function(i){ i.addEventListener("input",function(){ var f=i.closest(".field"); if(f) f.classList.remove("err"); }); });
  function review(){
    var l=lvl(), rows=[["Guardian",field("gName").value+" ("+field("gRel").value+")",0],["Contact",field("gEmail").value+", "+field("gPhone").value,0],["City",field("gCity").value,0],["Ward",field("cName").value+", age "+age.textContent,1],["Starting level","Level "+l+": "+LEVELS[l].name,1],["Sessions",data.day+"s at "+data.time+", 30 minutes",2],["Mentor language",field("sLang").value,2],["Device",field("sDev").value,2]];
    $("#review",el).innerHTML=rows.map(function(r){ return '<div><dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd><button type="button" data-go="'+r[2]+'">Edit</button></div>'; }).join("");
  }
  $("#review",el).addEventListener("click",function(e){ var b=e.target.closest("[data-go]"); if(b) go(+b.dataset.go); });
  function go(n){
    var prev=steps[step]; step=n;
    rail.forEach(function(li,i){ li.classList.toggle("cur",i===Math.min(n,3)); li.classList.toggle("done",i<n); });
    bar.style.width=(Math.min(n+1,4)*25)+"%";
    back.style.visibility=n===0||n===4?"hidden":"visible";
    nav.hidden=n===4;
    $$(".nl",next).forEach(function(s){ s.textContent=n===3?"Submit enrollment":"Continue"; });
    if(n===3) review();
    var show=function(){ steps.forEach(function(s,i){ s.hidden=i!==n; }); if(HAS_GSAP&&motion) gsap.from(steps[n],{x:30,opacity:0,duration:.5,ease:"power3.out"}); var f=$("input,select,button",steps[n]); if(f&&n<4) f.focus({preventScroll:true}); };
    if(HAS_GSAP&&motion&&prev&&prev!==steps[n]) gsap.to(prev,{x:-30,opacity:0,duration:.25,ease:"power2.in",onComplete:function(){ gsap.set(prev,{clearProps:"all"}); show(); }}); else show();
    if(prev!==steps[n]) scrollToEl(form);
  }
  form.addEventListener("submit",function(e){
    e.preventDefault();
    if(!validate(step)) return;
    if(step<3){ go(step+1); return; }
    next.disabled=true; $$(".nl",next).forEach(function(s){ s.innerHTML='<span class="spin"></span>'; });
    setTimeout(function(){
      next.disabled=false;
      S.enroll={guardian:field("gName").value.trim(),email:field("gEmail").value.trim(),child:field("cName").value.trim(),age:+age.textContent,level:lvl(),day:data.day,time:data.time,conf:data.conf};
      $("#sucTitle",el).textContent="Welcome, "+S.enroll.child+".";
      $("#sucText",el).textContent="We'll email "+S.enroll.email+" to book the 10-minute diagnostic test. "+S.enroll.child+" will start on Level "+S.enroll.level+" with sessions on "+data.day+"s at "+data.time+".";
      go(4); burst($(".success .tick",el));
    },900);
  });
  back.addEventListener("click",function(){ if(step>0) go(step-1); });
  $("#toPortal",el).addEventListener("click",function(){ S.user={name:S.enroll.guardian,email:S.enroll.email}; S.role="guardian"; location.hash="#portal"; });
  steps.forEach(function(s,i){ s.hidden=i!==0; }); go(0);
}};

/* ---------- SIGN IN ---------- */
M.signin={enter:function(el){
  var role=S.pending.role||S.role||"guardian"; S.pending={};
  var roles=$$("#roles .opt",el);
  function setRole(r){ role=r; roles.forEach(function(b){ b.setAttribute("aria-pressed",b.dataset.r===r); }); }
  setRole(role);
  roles.forEach(function(b){ b.addEventListener("click",function(){ setRole(b.dataset.r); }); });
  var pw=$("#siPw",el); $("#siShow",el).addEventListener("click",function(){ var t=pw.type==="password"; pw.type=t?"text":"password"; this.textContent=t?"Hide":"Show"; });
  var form=$("#signinForm",el);
  this.sub=function(e){
    e.preventDefault();
    var em=$("#siEmail",el), bad1=!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim()), bad2=pw.value.length<6;
    em.closest(".field").classList.toggle("err",bad1); pw.closest(".field").classList.toggle("err",bad2);
    if(bad1||bad2){ (bad1?em:pw).focus(); return; }
    var btn=$("#siBtn",el); btn.disabled=true; $(".roll",btn).innerHTML='<span>Signing in</span><span aria-hidden="true">Signing in</span>'; $(".ic",btn).innerHTML='<span class="spin" style="border-color:rgba(2,44,34,.2);border-top-color:var(--orange)"></span>';
    setTimeout(function(){
      btn.disabled=false; $(".roll",btn).innerHTML='<span>Sign in</span><span aria-hidden="true">Sign in</span>'; $(".ic",btn).innerHTML='<svg><use href="#i-arrow"/></svg>';
      var local=em.value.split("@")[0].replace(/[._-]+/g," ").replace(/\b\w/g,function(c){return c.toUpperCase()});
      S.user={name:local||"Guest",email:em.value.trim()}; S.role=role; location.hash="#portal";
    },850);
  };
  form.addEventListener("submit",this.sub);
  $$(".inp",el).forEach(function(i){ i.addEventListener("input",function(){ i.closest(".field").classList.remove("err"); }); });
}, leave:function(el){ $("#signinForm",el).removeEventListener("submit",this.sub); }};

/* ---------- PORTAL ---------- */
function nextSat(){ var now=new Date(), lag=new Date(now.toLocaleString("en-US",{timeZone:"Africa/Lagos"})); var d=new Date(lag); var add=(6-d.getDay()+7)%7; d.setDate(d.getDate()+add); d.setHours(10,0,0,0); if(d<=lag) d.setDate(d.getDate()+7); return d-lag; }
function initials(n){ return n.split(/\s+/).filter(Boolean).slice(0,2).map(function(w){return w[0].toUpperCase()}).join("")||"CR"; }
var ROLES={guardian:"Guardian",student:"Student",teacher:"Teacher / Educator",volunteer:"Community Volunteer",sponsor:"Sponsor",donor:"Donor"};
var NAV={
  guardian:[["overview","Overview","home"],["sessions","Sessions","play"],["milestones","Milestones","award"],["notes","Mentor notes","file"]],
  student:[["overview","Today","home"],["shelf","My books","book"],["badges","Badges","award"]],
  teacher:[["overview","Class","users"],["roster","Roster","school"]],
  volunteer:[["overview","Schedule","cal"],["plan","Lesson plan","file"]],
  sponsor:[["overview","My readers","heart"],["report","Impact","chart"]],
  donor:[["overview","Give","gift"],["history","History","file"]]
};
var ROSTER=[["Amara Okafor",9,2,88,14,"Sat 10:00"],["Tunde Bello",7,1,79,9,"Fri 16:00"],["Zainab Musa",12,3,93,22,"Wed 17:30"],["Chinedu Eze",10,2,84,17,"Sat 09:00"],["Ife Adeyemi",6,1,72,6,"Tue 16:00"],["Kemi Lawal",13,3,90,26,"Thu 17:30"],["Musa Ibrahim",8,2,81,11,"Sat 14:00"],["Ngozi Uche",11,3,86,19,"Mon 16:00"],["Bolu Ajayi",5,1,68,4,"Sun 10:00"],["Halima Yusuf",9,2,91,16,"Wed 16:00"]];
M.portal={enter:function(el){
  var self=this;
  if(!S.user){ S.user={name:"Bisi Adebayo",email:"guest@example.com"}; }
  var role=S.role in ROLES?S.role:"guardian";
  var main=$("#pMain",el), nav=$("#pNav",el);
  function renderShell(){
    $("#pAva",el).textContent=initials(S.user.name); $("#pName",el).textContent=S.user.name; $("#pRole",el).textContent=ROLES[role];
    $("#pSwitch",el).value=role;
    nav.innerHTML=NAV[role].map(function(n,k){ return '<button data-sec="'+n[0]+'" aria-current="'+(k===0)+'"><svg><use href="#i-'+n[2]+'"/></svg>'+n[1]+'</button>'; }).join("");
    main.innerHTML=R[role]();
    if(R[role+"Wire"]) R[role+"Wire"](main);
    if(HAS_GSAP&&motion) gsap.from($$(":scope > *",main),{y:28,opacity:0,duration:.7,stagger:.07,ease:"power3.out"});
    $$(".count",main).forEach(function(c){ if(HAS_GSAP&&motion) counter(c); });
  }
  nav.addEventListener("click",function(e){ var b=e.target.closest("[data-sec]"); if(!b) return; $$("button",nav).forEach(function(x){x.setAttribute("aria-current",x===b)}); scrollToEl($('[data-sec-id="'+b.dataset.sec+'"]',main)); });
  $("#pSwitch",el).addEventListener("change",function(){ role=this.value; S.role=role; renderShell(); toast("Switched to the "+ROLES[role]+" portal"); });
  $("#pOut",el).addEventListener("click",function(){ S.user=null; toast("Signed out"); location.hash="#home"; });
  var R={};
  var hello=function(t,sub){ return '<div class="dash-h" data-sec-id="overview"><div><h2>'+t+'</h2><p>'+sub+'</p></div><span class="proto"><b>Preview</b> Sample data</span></div>'; };
  /* guardian */
  R.guardian=function(){
    var child=(S.enroll&&S.enroll.child)||"Ada", lvl=(S.enroll&&S.enroll.level)||3;
    var weeks=[78,80,83,82,86,88,91,93,94.8];
    return hello('Good to see you, <span class="serif">'+esc(S.user.name.split(" ")[0])+'.</span>',esc(child)+' is on Level '+lvl+'. Next session in <b class="tnum" id="cd">--</b>.')+
    '<div class="kpis"><div class="kpi"><span>Comprehension</span><b><span class="count" data-to="94.8" data-dec="1">94.8</span>%</b><small>+1.8 this week</small></div><div class="kpi"><span>Books signed off</span><b class="count" data-to="24">24</b><small>1 waiting for you</small></div><div class="kpi"><span>Hours read</span><b class="count" data-to="18">18</b><small>This term</small></div><div class="kpi"><span>Sessions attended</span><b class="count" data-to="36">36</b><small>Of 37 booked</small></div></div>'+
    '<div class="cards2"><div class="card"><div class="card-h"><h3>Comprehension by week</h3><span class="tag">Last 9 weeks</span></div>'+chart(weeks)+'</div>'+
    '<div class="card" data-sec-id="milestones"><div class="card-h"><h3>Milestones to sign off</h3><span class="tag g" id="msCount">2 waiting</span></div><div class="list" id="ms">'+
      '<div class="row"><div class="grow"><strong>Book 24: Ada and the River</strong><small>Finished Sat 10 Oct</small></div><button class="btn-mini" data-sign>Sign off</button></div>'+
      '<div class="row"><div class="grow"><strong>Level 3 checkpoint quiz</strong><small>Scored 9 of 10</small></div><button class="btn-mini" data-sign>Sign off</button></div></div></div></div>'+
    '<div class="card" data-sec-id="sessions"><div class="card-h"><h3>Session recordings</h3><span class="tag">30 min each</span></div><div class="list">'+
      [["Sat 10 Oct","Ada and the River","Read with expression. Practise \"-tion\" words."],["Sat 3 Oct","Market Day","Great progress on long vowels."],["Sat 26 Sep","The Rainy Season","Needed help with context clues on page 4."],["Sat 19 Sep","Kite Festival","Answered every recap question."]].map(function(s,k){ return '<div class="row"><button class="play" data-play="'+k+'" aria-label="Play recording from '+s[0]+'"><svg><use href="#i-play"/></svg></button><div class="grow"><strong>'+s[1]+'</strong><small>'+s[0]+', mentor Sarah Jenkins</small><div class="prog"><i></i></div></div><button class="btn-mini ghost" data-note="'+esc(s[2])+'">Mentor note</button></div>'; }).join("")+'</div></div>'+
    '<div class="card" data-sec-id="notes"><div class="card-h"><h3>Latest mentor note</h3></div><div class="note"><b>Sarah Jenkins, Sat 10 Oct</b>'+esc(child)+' read the whole story with expression and answered all three recap questions. This week, practise words ending in "-tion" for five minutes a day.</div></div>';
  };
  R.guardianWire=function(m){
    var cd=$("#cd",m); var tick=function(){ var ms=nextSat(), d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5), mi=Math.floor(ms%36e5/6e4); cd.textContent=(d?d+"d ":"")+h+"h "+mi+"m"; }; tick(); every(tick,30000);
    m.addEventListener("click",function(e){
      var s=e.target.closest("[data-sign]");
      if(s){ var row=s.closest(".row"); s.outerHTML='<span class="btn-mini ok">Signed off</span>'; burst(row); var left=$$("[data-sign]",m).length; $("#msCount",m).textContent=left?left+" waiting":"All signed off"; toast("Milestone signed off"); }
      var p=e.target.closest("[data-play]");
      if(p){ var bar=$(".prog i",p.closest(".row")); var on=p.dataset.on==="1"; p.dataset.on=on?"0":"1"; p.innerHTML='<svg><use href="#i-'+(on?"play":"pause")+'"/></svg>';
        if(HAS_GSAP){ if(on){ gsap.killTweensOf(bar); } else gsap.to(bar,{width:"100%",duration:12,ease:"none",onComplete:function(){ p.dataset.on="0"; p.innerHTML='<svg><use href="#i-play"/></svg>'; }}); } else bar.style.width="100%"; }
      var n=e.target.closest("[data-note]"); if(n) openModal('<h3 id="modalTitle">Mentor note</h3><p>'+n.dataset.note+'</p><button class="btn-mini" data-mclose2>Close</button>');
    });
  };
  /* student */
  R.student=function(){
    var name=esc(S.user.name.split(" ")[0]);
    var books=[["Ada and the River","#15803D",100],["Market Day","#064E3B",100],["Kite Festival","#22C55E",100],["The Rainy Season","#022C22",100],["Night Market","#116A32",60],["The Lost Goat","#0B3A2C",20],["Songs of the Savannah","#15803D",0],["Mama's Garden","#064E3B",0]];
    var badges=[["First book","book",1],["5-day streak","flame",1],["Word detective","search",1],["Brave reader","award",1],["Story teller","users",1],["10 books","book",0],["Quiz master","star",0],["Level up","sparkles",0]];
    return hello('Hi, <span class="serif">'+name+'!</span>','Your next session starts in <b class="tnum" id="cd">--</b>.')+
    '<div class="cards2"><div class="card"><div class="card-h"><h3>Reading streak</h3><span class="tag g">5 days</span></div><div class="streak">'+["M","T","W","T","F","S","S"].map(function(d,k){ return '<div><span class="'+(k<5?"y":"")+'">'+(k<5?'<svg><use href="#i-flame"/></svg>':'')+'</span>'+d+'</div>'; }).join("")+'</div><p style="color:var(--ink-2);font-size:14px;margin-top:14px">Read for 10 minutes today to keep your streak going.</p><button class="btn-mini" id="readToday" style="margin-top:12px">I read today</button></div>'+
    '<div class="card"><div class="card-h"><h3>Next session</h3></div><div class="count-big" id="cd2">--</div><p style="color:var(--ink-2);margin-top:10px">Saturday at 10:00 with Sarah Jenkins</p><a href="#demo" class="btn-mini" style="display:inline-block;margin-top:14px">Practise with a story</a></div></div>'+
    '<div class="card" data-sec-id="shelf"><div class="card-h"><h3>My bookshelf</h3><span class="tag">Tap a book</span></div><div class="shelf" id="shelf">'+books.map(function(b,k){ return '<button class="spine" style="background:'+b[1]+';height:'+(110+((k*37)%50))+'px;opacity:'+(b[2]?1:.35)+'" aria-pressed="false" data-b="'+k+'">'+b[0]+'</button>'; }).join("")+'</div><div class="note" id="bookInfo" style="margin-top:16px"><b>Pick a book</b>See how far you have read.</div></div>'+
    '<div class="card" data-sec-id="badges"><div class="card-h"><h3>Badges</h3><span class="tag g">5 of 8</span></div><div class="badges">'+badges.map(function(b){ return '<div class="badge'+(b[2]?"":" lock")+'"><i><svg><use href="#i-'+(b[2]?b[1]:"lock")+'"/></svg></i>'+b[0]+'</div>'; }).join("")+'</div></div>';
    R._books=books;
  };
  R.studentWire=function(m){
    var cd=$("#cd",m), cd2=$("#cd2",m); var tick=function(){ var ms=nextSat(), d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5), mi=Math.floor(ms%36e5/6e4); var t=(d?d+"d ":"")+h+"h "+mi+"m"; cd.textContent=t; cd2.textContent=t; }; tick(); every(tick,30000);
    $("#readToday",m).addEventListener("click",function(){ var s=$$(".streak span",m)[5]; if(s.classList.contains("y")) return; s.classList.add("y"); s.innerHTML='<svg><use href="#i-flame"/></svg>'; $(".card-h .tag",m).textContent="6 days"; this.textContent="Streak saved"; burst(this); toast("6-day streak"); });
    $("#shelf",m).addEventListener("click",function(e){ var b=e.target.closest(".spine"); if(!b) return; var bk=R._books[+b.dataset.b]; $$(".spine",m).forEach(function(x){x.setAttribute("aria-pressed",x===b)}); $("#bookInfo",m).innerHTML='<b>'+bk[0]+'</b>'+(bk[2]===100?"Finished and signed off.":bk[2]?bk[2]+"% read. Keep going.":"Not started yet. Ask your mentor to begin it."); });
  };
  /* teacher */
  R.teacher=function(){
    return hello('Your class, <span class="serif">at a glance.</span>','Ten learners across three levels.')+
    '<div class="kpis"><div class="kpi"><span>Learners</span><b>10</b></div><div class="kpi"><span>Average comprehension</span><b>84%</b></div><div class="kpi"><span>Books this term</span><b>144</b></div><div class="kpi"><span>Sessions this week</span><b>10</b></div></div>'+
    '<div class="card" data-sec-id="roster"><div class="card-h"><h3>Roster</h3><div class="chipset" id="lvF"><button aria-pressed="true" data-l="0">All</button><button aria-pressed="false" data-l="1">Level 1</button><button aria-pressed="false" data-l="2">Level 2</button><button aria-pressed="false" data-l="3">Level 3</button></div></div>'+
    '<label class="search" style="margin-bottom:14px"><svg><use href="#i-search"/></svg><input type="search" id="rSearch" placeholder="Search learners" aria-label="Search learners"></label>'+
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th><button data-s="0">Learner <svg width="12" height="12"><use href="#i-sort"/></svg></button></th><th><button data-s="1">Age <svg width="12" height="12"><use href="#i-sort"/></svg></button></th><th>Level</th><th><button data-s="3">Comprehension <svg width="12" height="12"><use href="#i-sort"/></svg></button></th><th><button data-s="4">Books <svg width="12" height="12"><use href="#i-sort"/></svg></button></th><th>Next session</th></tr></thead><tbody id="rBody"></tbody></table></div></div>';
  };
  R.teacherWire=function(m){
    var lf=0, sk=3, dir=-1, body=$("#rBody",m), q=$("#rSearch",m);
    function draw(){
      var rows=ROSTER.filter(function(r){ return (!lf||r[2]===lf)&&(!q.value||r[0].toLowerCase().indexOf(q.value.toLowerCase())>-1); }).sort(function(a,b){ return (a[sk]>b[sk]?1:-1)*dir; });
      body.innerHTML=rows.length?rows.map(function(r){ return '<tr tabindex="0" data-n="'+r[0]+'"><td><strong style="font-weight:500">'+r[0]+'</strong></td><td>'+r[1]+'</td><td><span class="lv l'+r[2]+'">L'+r[2]+'</span></td><td><div class="minibar"><span><i style="width:'+r[3]+'%"></i></span>'+r[3]+'%</div></td><td>'+r[4]+'</td><td>'+r[5]+'</td></tr>'; }).join(""):'<tr><td colspan="6" style="color:var(--ink-2);padding:24px 12px">No learners match. Clear the search or pick another level.</td></tr>';
    }
    $$("#lvF button",m).forEach(function(b){ b.addEventListener("click",function(){ lf=+b.dataset.l; $$("#lvF button",m).forEach(function(x){x.setAttribute("aria-pressed",x===b)}); draw(); }); });
    $$("th button",m).forEach(function(b){ b.addEventListener("click",function(){ var k=+b.dataset.s; dir=sk===k?-dir:1; sk=k; draw(); }); });
    q.addEventListener("input",draw);
    var open=function(tr){ var r=ROSTER.filter(function(x){return x[0]===tr.dataset.n})[0]; if(!r) return; openModal('<h3 id="modalTitle">'+r[0]+'</h3><p>Age '+r[1]+', Level '+r[2]+': '+LEVELS[r[2]].name+'.</p><div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="kpi" style="background:var(--ground)"><span>Comprehension</span><b>'+r[3]+'%</b></div><div class="kpi" style="background:var(--ground)"><span>Books</span><b>'+r[4]+'</b></div></div><p>Next session: '+r[5]+'.</p><button class="btn-mini" data-mclose2>Close</button>'); };
    body.addEventListener("click",function(e){ var tr=e.target.closest("tr[data-n]"); if(tr) open(tr); });
    body.addEventListener("keydown",function(e){ if(e.key==="Enter"){ var tr=e.target.closest("tr[data-n]"); if(tr) open(tr); } });
    draw();
  };
  /* volunteer */
  R.volunteer=function(){
    var plan=["Warm-up: reread last week's favourite page","Guided reading: Night Market, pages 4-6","Word work: practise \"-tion\" endings","Recap: three quick questions","Write the guardian note"];
    return hello('Thank you for <span class="serif">mentoring.</span>','You have three sessions coming up and 42 hours logged this term.')+
    '<div class="cards2"><div class="card"><div class="card-h"><h3>Upcoming sessions</h3></div><div class="list">'+[["Amara Okafor","Sat 10:00","Level 2"],["Musa Ibrahim","Sat 14:00","Level 2"],["Bolu Ajayi","Sun 10:00","Level 1"]].map(function(s){ return '<div class="row">'+ava(initials(s[0]))+'<div class="grow"><strong>'+s[0]+'</strong><small>'+s[1]+', '+s[2]+'</small></div><a href="#demo" class="btn-mini">Open session</a></div>'; }).join("")+'</div></div>'+
    '<div class="card"><div class="card-h"><h3>Hours logged</h3><span class="tag g">This term</span></div><div class="count-big"><span class="count" data-to="42">42</span></div><p style="color:var(--ink-2);margin-top:10px">Across 84 sessions with 6 learners.</p></div></div>'+
    '<div class="card" data-sec-id="plan"><div class="card-h"><h3>Lesson plan: Saturday</h3><span class="tag" id="planTag">0 of 5 ready</span></div><div class="list" id="plan">'+plan.map(function(p,k){ return '<label class="row check" style="cursor:pointer"><input type="checkbox" data-p="'+k+'"> <span class="grow" style="color:var(--ink)">'+p+'</span></label>'; }).join("")+'</div></div>';
  };
  R.volunteerWire=function(m){ $("#plan",m).addEventListener("change",function(){ var n=$$("#plan input:checked",m).length; $("#planTag",m).textContent=n+" of 5 ready"; if(n===5){ toast("Lesson plan ready"); burst($("#planTag",m)); } }); };
  /* sponsor */
  R.sponsor=function(){
    return hello('The readers you <span class="serif">support.</span>','Three learners are reading this term because of you.')+
    '<div class="card"><div class="card-h"><h3>My readers</h3><button class="btn-mini" id="addReader">Sponsor another reader</button></div><div class="list" id="readers">'+[["Zainab M.","Level 3",22],["Ife A.","Level 1",6],["Chinedu E.","Level 2",17]].map(rd).join("")+'</div></div>'+
    '<div class="card" data-sec-id="report"><div class="card-h"><h3>This term</h3><span class="tag">Sample data</span></div><div class="kpis"><div class="kpi" style="background:var(--ground)"><span>Books signed off</span><b>45</b></div><div class="kpi" style="background:var(--ground)"><span>Hours read</span><b>51</b></div><div class="kpi" style="background:var(--ground)"><span>Average comprehension</span><b>87%</b></div><div class="kpi" style="background:var(--ground)"><span>Sessions</span><b>102</b></div></div></div>';
  };
  function rd(r){ return '<div class="row">'+ava(initials(r[0]),"plum")+'<div class="grow"><strong>'+r[0]+'</strong><small>'+r[1]+', '+r[2]+' books signed off</small></div><span class="tag g">Reading</span></div>'; }
  R.sponsorWire=function(m){ $("#addReader",m).addEventListener("click",function(){ openModal('<h3 id="modalTitle">Sponsor another reader</h3><p>Choose a level. Our team will match you with a learner on the waiting list.</p><div class="opts" id="spLv"><button class="opt" aria-pressed="true" data-v="Level 1">Level 1</button><button class="opt" aria-pressed="false" data-v="Level 2">Level 2</button><button class="opt" aria-pressed="false" data-v="Level 3">Level 3</button></div><button class="btn btn-orange" id="spGo" style="justify-self:start"><span class="roll"><span>Confirm sponsorship</span><span aria-hidden="true">Confirm sponsorship</span></span><span class="ic"><svg><use href="#i-check"/></svg></span></button><span class="proto"><b>Preview</b> No payment is taken.</span>');
    var lv="Level 1"; $$("#spLv .opt").forEach(function(b){ b.addEventListener("click",function(){ lv=b.dataset.v; $$("#spLv .opt").forEach(function(x){x.setAttribute("aria-pressed",x===b)}); }); });
    $("#spGo").addEventListener("click",function(){ closeModal(); $("#readers",m).insertAdjacentHTML("beforeend",rd(["New reader",lv,0])); var row=$("#readers",m).lastElementChild; if(HAS_GSAP&&motion) gsap.from(row,{y:20,opacity:0,duration:.6,ease:"power3.out"}); burst(row); toast("Matched with a new "+lv+" reader"); }); }); };
  /* donor */
  R.donor=function(){
    return hello('Help a child <span class="serif">read.</span>','Every pledge funds weekly mentor sessions for learners on the waiting list.')+
    '<div class="cards2"><div class="card"><div class="card-h"><h3>Make a pledge</h3><span class="proto"><b>Preview</b> No payment is taken.</span></div>'+
      '<div class="field" style="margin-bottom:16px"><span class="lab" id="frqL">Frequency</span><div class="opts" role="group" aria-labelledby="frqL" id="frq"><button class="opt" aria-pressed="true" data-v="monthly">Monthly</button><button class="opt" aria-pressed="false" data-v="once">One time</button></div></div>'+
      '<div class="field"><span class="lab" id="amtL">Amount</span><div class="amounts" role="group" aria-labelledby="amtL" id="amt"><button class="opt" aria-pressed="false" data-v="10000">₦10,000</button><button class="opt" aria-pressed="true" data-v="25000">₦25,000</button><button class="opt" aria-pressed="false" data-v="50000">₦50,000</button><button class="opt" aria-pressed="false" data-v="other">Other</button></div></div>'+
      '<div class="field" id="otherF" hidden style="margin-top:12px"><label for="otherAmt">Other amount (₦)</label><input class="inp" id="otherAmt" inputmode="numeric" placeholder="e.g. 15000"><span class="emsg">Enter at least ₦1,000.</span></div>'+
      '<button class="btn btn-orange" id="pledge" style="margin-top:20px"><span class="roll"><span>Pledge ₦25,000 monthly</span><span aria-hidden="true">Pledge ₦25,000 monthly</span></span><span class="ic"><svg><use href="#i-heart"/></svg></span></button></div>'+
    '<div class="card" data-sec-id="history"><div class="card-h"><h3>Your giving</h3></div><div class="list" id="gifts"><div class="row"><div class="grow"><strong>₦25,000, monthly</strong><small>Since June 2026</small></div><span class="tag g">Active</span></div><div class="row"><div class="grow"><strong>₦50,000, one time</strong><small>March 2026</small></div><span class="tag">Complete</span></div></div></div></div>';
  };
  R.donorWire=function(m){
    var amt=25000, frq="monthly", other=false;
    function label(){ var t="Pledge ₦"+Number(amt||0).toLocaleString("en-US")+(frq==="monthly"?" monthly":""); $("#pledge .roll",m).innerHTML='<span>'+t+'</span><span aria-hidden="true">'+t+'</span>'; }
    $$("#amt .opt",m).forEach(function(b){ b.addEventListener("click",function(){ $$("#amt .opt",m).forEach(function(x){x.setAttribute("aria-pressed",x===b)}); other=b.dataset.v==="other"; $("#otherF",m).hidden=!other; if(other){ amt=+$("#otherAmt",m).value.replace(/\D/g,"")||0; $("#otherAmt",m).focus(); } else amt=+b.dataset.v; label(); }); });
    $$("#frq .opt",m).forEach(function(b){ b.addEventListener("click",function(){ frq=b.dataset.v; $$("#frq .opt",m).forEach(function(x){x.setAttribute("aria-pressed",x===b)}); label(); }); });
    $("#otherAmt",m).addEventListener("input",function(){ amt=+this.value.replace(/\D/g,"")||0; this.closest(".field").classList.remove("err"); label(); });
    $("#pledge",m).addEventListener("click",function(){
      if(other&&amt<1000){ $("#otherF",m).classList.add("err"); $("#otherAmt",m).focus(); return; }
      var txt="₦"+Number(amt).toLocaleString("en-US")+(frq==="monthly"?", monthly":", one time");
      $("#gifts",m).insertAdjacentHTML("afterbegin",'<div class="row"><div class="grow"><strong>'+txt+'</strong><small>Pledged today</small></div><span class="tag g">New</span></div>');
      burst(this); toast("Thank you. Pledge recorded in this preview.");
    });
  };
  self.R=R;
  renderShell();
  document.addEventListener("click",self.mc=function(e){ if(e.target.closest("[data-mclose2]")) closeModal(); });
}, leave:function(){ document.removeEventListener("click",this.mc); }};

function chart(v){
  var W=520,H=200,p={l:34,r:14,t:16,b:26}, min=70, max=100;
  var x=function(i){return p.l+i*(W-p.l-p.r)/(v.length-1)}, y=function(n){return p.t+(1-(n-min)/(max-min))*(H-p.t-p.b)};
  var line=v.map(function(n,i){return (i?"L":"M")+x(i).toFixed(1)+" "+y(n).toFixed(1)}).join(" ");
  var area=line+" L"+x(v.length-1)+" "+(H-p.b)+" L"+x(0)+" "+(H-p.b)+" Z";
  var grid=[70,80,90,100].map(function(g){return '<line x1="'+p.l+'" x2="'+(W-p.r)+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="var(--line)" stroke-width="1"/><text x="'+(p.l-8)+'" y="'+(y(g)+3)+'" text-anchor="end">'+g+'</text>'}).join("");
  var lab=v.map(function(_,i){return '<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">W'+(i+1)+'</text>'}).join("");
  var pts=v.map(function(n,i){return '<circle cx="'+x(i)+'" cy="'+y(n)+'" r="'+(i===v.length-1?5:3)+'" fill="'+(i===v.length-1?"var(--orange)":"var(--card)")+'" stroke="var(--orange)" stroke-width="2"><title>Week '+(i+1)+': '+n+'%</title></circle>'}).join("");
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Comprehension rose from 78% in week 1 to 94.8% in week 9"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--coral)" stop-opacity=".28"/><stop offset="1" stop-color="var(--coral)" stop-opacity="0"/></linearGradient></defs>'+grid+'<path d="'+area+'" fill="url(#ag)"/><path class="cl" d="'+line+'" fill="none" stroke="var(--orange)" stroke-width="2.5" stroke-linejoin="round"/>'+pts+lab+'</svg>';
}

/* ================= ROUTER ================= */
var pages={}; $$(".page").forEach(function(p){ pages[p.dataset.page]=p; });
var current=null, ctx=null, busy=false;
var navLinks=$$("#navLinks a"), navInd=$("#navInd"), sheetLinks=$$("#sheetLinks a");
var closing=$("#closing"), closeCta=$("#closeCta");
function parse(){ var h=decodeURIComponent(location.hash.slice(1))||"home"; if(h==="main") return null; return pages[h]?h:"home"; }
function setNav(name){
  var key=name==="portal"?"":name;
  var active=null;
  navLinks.forEach(function(a){ var on=a.getAttribute("href")==="#"+key; a.toggleAttribute("aria-current",false); if(on){ a.setAttribute("aria-current","page"); active=a; } });
  sheetLinks.forEach(function(a){ if(a.getAttribute("href")==="#"+name) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  if(active&&active.offsetParent){ var x=active.offsetLeft, w=active.offsetWidth; if(HAS_GSAP&&motion) gsap.to(navInd,{x:x,width:w,opacity:1,duration:.6,ease:"expo.out"}); else { navInd.style.transform="translateX("+x+"px)"; navInd.style.width=w+"px"; navInd.style.opacity=1; } }
  else if(HAS_GSAP) gsap.to(navInd,{opacity:0,duration:.3}); else navInd.style.opacity=0;
  $("#navSignin").textContent=S.user?"My portal":"Sign in";
  $("#navSignin").setAttribute("href",S.user?"#portal":"#signin");
}
function swap(name){
  if(current){ timers.forEach(clearInterval); timers=[]; if(M[current]&&M[current].leave) M[current].leave(pages[current]); if(ctx) ctx.revert(); pages[current].hidden=true; }
  current=name; var el=pages[name]; el.hidden=false;
  document.title=el.dataset.title||"CRCi Hub";
  var flow=!!el.dataset.flow; closeCta.hidden=flow;
  toTop(); setNav(name);
  if(HAS_GSAP){ ctx=gsap.context(function(){ if(motion) reveals(el); if(M[name]) M[name].enter(el); },el); }
  else if(M[name]) M[name].enter(el);
  if(HAS_GSAP) requestAnimationFrame(function(){ ScrollTrigger.refresh(); });
  var h1=$("h1, h2",el); if(h1&&!first){ h1.setAttribute("tabindex","-1"); h1.focus({preventScroll:true}); }
}
var first=true;
function go(name){
  if(name===current||busy) return;
  if(!HAS_GSAP||!motion||first){ swap(name); first=false; return; }
  busy=true;
  var cur=$("#curtain");
  gsap.timeline({onComplete:function(){ busy=false; var n=parse(); if(n&&n!==current) go(n); }})
    .set(cur,{y:0,yPercent:100,borderRadius:"40% 40% 0 0 / 12% 12% 0 0"})
    .to(cur,{yPercent:0,borderRadius:"0",duration:.55,ease:"expo.inOut"})
    .add(function(){ swap(name); })
    .to(cur,{yPercent:-100,borderRadius:"0 0 40% 40% / 0 0 12% 12%",duration:.7,ease:"expo.inOut"},"+=.05");
}
document.addEventListener("click",function(e){
  var a=e.target.closest('a[href^="#"]'); if(!a) return;
  var d=a.dataset, target=a.getAttribute("href").slice(1)||"home";
  if(d.role) S.pending.role=d.role;
  if(d.level) S.pending.level=d.level;
  if(d.finder) S.pending.finder=1;
  if(d.track) S.pending.track=d.track;
  if(a.id==="fGo") S.pending.level=a.dataset.level;
  if(target===current&&pages[target]){ e.preventDefault(); if(target==="tracks"&&(d.finder||d.track)) M.tracks.enter&&setTimeout(function(){ scrollToEl(d.finder?$("#finder"):$("#track-"+d.track)); S.pending={}; },10); else if(target==="signin"&&d.role){ $$("#roles .opt").forEach(function(b){ b.setAttribute("aria-pressed",b.dataset.r===d.role); }); S.pending={}; } else { if(lenis) lenis.scrollTo(0); else window.scrollTo({top:0,behavior:"smooth"}); } }
});
window.addEventListener("hashchange",function(){ var n=parse(); if(n) go(n); });
window.addEventListener("resize",function(){ if(current) setNav(current); });

/* magnetic CTAs (pointer devices only) */
if(HAS_GSAP&&motion&&window.matchMedia("(hover:hover)").matches){
  document.addEventListener("pointerover",function(e){
    var b=e.target.closest(".btn"); if(!b||b._mag) return; b._mag=1;
    var xt=gsap.quickTo(b,"x",{duration:.5,ease:"power3.out"}), yt=gsap.quickTo(b,"y",{duration:.5,ease:"power3.out"});
    b.addEventListener("pointermove",function(ev){ var r=b.getBoundingClientRect(); xt((ev.clientX-r.left-r.width/2)*.16); yt((ev.clientY-r.top-r.height/2)*.28); });
    b.addEventListener("pointerleave",function(){ xt(0); yt(0); });
  });
}
if(HAS_GSAP&&motion){
  gsap.from("[data-a=nav]",{y:-30,opacity:0,duration:1.1,ease:"expo.out"});
  gsap.to("#closeGlow",{xPercent:-10,yPercent:8,rotate:12,ease:"none",scrollTrigger:{trigger:"#closing",start:"top bottom",end:"bottom bottom",scrub:true}});
  ScrollTrigger.create({trigger:"#closing",start:"top 85%",once:true,onEnter:function(){ var h=$("#closeCta h2"); if(h&&!closeCta.hidden){ splitWords(h); gsap.from($$(".wi",h),{yPercent:105,duration:1.05,ease:"expo.out",stagger:.03}); } }});
}

applyTheme();
var start=parse()||"home";
go(start);
window.addEventListener("load",function(){ if(HAS_GSAP) ScrollTrigger.refresh(); });
})();
