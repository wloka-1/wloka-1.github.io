const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..')+'/';
const noop=()=>{};
// Record actual drawing commands per canvas, including stroke extents. A shared
// no-op context cannot detect a sprite clipped by its own backing canvas.
function makeContext(){
 let tx=0,ty=0,path=[];const marks=[];
 const mark=(points,pad=0)=>{if(!points.length)return;marks.push({left:Math.min(...points.map(p=>p[0]))-pad,top:Math.min(...points.map(p=>p[1]))-pad,right:Math.max(...points.map(p=>p[0]))+pad,bottom:Math.max(...points.map(p=>p[1]))+pad});};
 const g={marks,lineWidth:1,translate(x,y){tx+=x;ty+=y;},beginPath(){path=[];},moveTo(x,y){path.push([x+tx,y+ty]);},lineTo(x,y){path.push([x+tx,y+ty]);},closePath:noop,fill(){mark(path);},stroke(){mark(path,this.lineWidth/2);},fillRect(x,y,w,h){mark([[x+tx,y+ty],[x+w+tx,y+h+ty]]);},strokeRect(x,y,w,h){mark([[x+tx,y+ty],[x+w+tx,y+h+ty]],this.lineWidth/2);}};
 return new Proxy(g,{get:(o,k)=>k in o?o[k]:(...args)=>{if(args.some(x=>typeof x==='number'&&!Number.isFinite(x)))throw Error('Non-finite canvas coordinate: '+String(k));},set:(o,k,v)=>(o[k]=v,true)});
}
function assertDrawableFits(art,label){
 const marks=art.img.getContext('2d').marks;assert(marks.length,label+' has drawing operations');
 for(const b of marks)assert(b.left>=0&&b.top>=0&&b.right<=art.img.width&&b.bottom<=art.img.height,label+' clips drawing: '+JSON.stringify({bounds:b,width:art.img.width,height:art.img.height}));
}
class Element{
 constructor(tag,attrs={}){this.tagName=tag;this.attrs=attrs;this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;this.style={};this.hidden='hidden'in attrs;this.isConnected=true;this.events={};this.classList={add:noop,remove:noop,contains:()=>false};this.offsetWidth=290;this.offsetHeight=attrs.id==='village-intro'?190:attrs.id==='welcome'?108:200;this.innerHTML='';this.textContent='';}
 getContext(){return this.context??=makeContext();}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}focus(){document.activeElement=this;}replaceChildren(){this.innerHTML='';}append(){}getBoundingClientRect(){return {left:800,width:600};}setPointerCapture(){}closest(){return null;}
}
const html=fs.readFileSync(root+'index.html','utf8'),els=[];
for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]||'';els.push(new Element(m[1],attrs));}
const query=s=>els.filter(e=>s[0]==='#'?e.attrs.id===s.slice(1):s[0]==='.'?(e.attrs.class||'').split(' ').includes(s.slice(1)):s[0]==='['?s.slice(1,-1)in e.attrs:false);
const documentEvents={};
const document={querySelector:s=>query(s)[0],querySelectorAll:query,body:els.find(e=>e.tagName==='body'),createElement:tag=>new Element(tag),addEventListener:(k,fn)=>{(documentEvents[k]??=[]).push(fn);},fonts:{ready:Promise.resolve()},hidden:false};
let fetchCount=0,pending=[];let slow=false;
const sandbox={document,console,performance,Float32Array,Math,Map,Promise,setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:()=>1,cancelAnimationFrame:noop,innerWidth:1440,innerHeight:900,devicePixelRatio:2,location:{hash:'',pathname:'/',search:''},history:{pushState:(a,b,url)=>{sandbox.location.hash=url.startsWith('#')?url:'';}},matchMedia:()=>({matches:false,addEventListener:noop}),addEventListener:noop,fetch:async path=>{fetchCount++;if(slow)await new Promise(resolve=>pending.push({path,resolve}));return {ok:true,text:async()=>fs.readFileSync(root+path,'utf8')};}};sandbox.window=sandbox;
let source=fs.readFileSync(root+'village/village.js','utf8');const ix=source.lastIndexOf('})();');source=source.slice(0,ix)+`globalThis.api={point,road,riverRoute,bridgeStart,bridgeEnd,bridgeArt,spriteCache,sceneFrame,drawSprite,skiTop,skiBottom,resize,cache,openPanel,closePanel,zoomAt,resetView,actorsAt,paint,drawTerrain,places,heights,riverAt,height,project,toScreen,positionNodes,props,waterTiles,transform,getState:()=>({zoom,panX,panY,tx,ty,activePanel,activeSpeech}),body,panel};`+source.slice(ix);
vm.runInNewContext(source,sandbox,{timeout:5000});const a=sandbox.api;
(async()=>{
 await Promise.resolve();assert.equal(fetchCount,0,'No case studies load with the scene');
 a.paint(1);const water=a.waterTiles.length;a.drawTerrain();assert.equal(a.waterTiles.length,water,'Redrawing the terrain does not duplicate water');
 for(let t=0;t<120;t+=.5){for(const actor of a.actorsAt(t)){assert(Number.isFinite(actor.x)&&Number.isFinite(actor.y));assert(actor.x>=0&&actor.x<=1500&&actor.y>=0&&actor.y<=1130,'Actors stay inside the scene');}}
 a.zoomAt(99);assert.equal(a.getState().zoom,2.7);a.zoomAt(.01);assert.equal(a.getState().zoom,1);
 a.zoomAt(1.8,500,400);const view=JSON.stringify(a.getState());await a.openPanel('bny');assert.equal(a.getState().tx,JSON.parse(view).tx);assert.equal(a.getState().ty,JSON.parse(view).ty);assert(a.body.innerHTML.includes('id="page-bny"'));assert(!a.body.innerHTML.includes('src="../../images/'));
 for(const id of ['qds','tmo','overlay']){await a.openPanel(id);assert(a.body.innerHTML.includes('loading="lazy"'));assert(!a.body.innerHTML.includes('back-btn'));}
 const before=fetchCount;await a.openPanel('qds');assert.equal(fetchCount,before,'Opened studies are cached');
 await a.openPanel('directory');assert(a.body.innerHTML.includes('data-project="bny"'));assert(a.body.innerHTML.includes('data-project="overlay"'));assert(!a.body.innerHTML.includes('Iona'));await a.openPanel('contact');assert(a.body.innerHTML.includes('Wesley-Kay-Resume.pdf'));assert(a.body.innerHTML.includes('mailto:'));
 a.closePanel(false);assert(a.panel.hidden);a.resetView();a.positionNodes();
 const target=a.toScreen({x:a.places.bny.x,y:a.places.bny.y-75});
 for(const fn of query('#landscape')[0].events.click) fn({clientX:target.x,clientY:target.y});
 await Promise.resolve();assert.equal(a.getState().activePanel,'bny','The chalet artwork itself is clickable');
 a.closePanel(false);
 const welcome=query('#welcome')[0];for(const fn of documentEvents.click)fn({target:{closest:s=>s==='[data-place]'?welcome:null}});
 assert.equal(a.getState().activeSpeech,'welcome','Centered name sign still opens its introduction');
 a.cache.clear();slow=true;
 const oldRequest=a.openPanel('bny');const newRequest=a.openPanel('qds');
 pending.find(p=>p.path.endsWith('qds.html')).resolve();await newRequest;
 pending.find(p=>p.path.endsWith('bny.html')).resolve();await oldRequest;
 assert.equal(a.getState().activePanel,'qds');assert(a.body.innerHTML.includes('Qualcomm'));
 a.closePanel(false);slow=false;
 sandbox.innerWidth=390;sandbox.innerHeight=844;a.resize();a.zoomAt(99);assert.equal(a.getState().zoom,4);a.resetView();
 for(const id of ['bny','qds','tmo','overlay']){const p=a.toScreen(a.places[id]);assert(p.x>0&&p.x<390&&p.y>0&&p.y<844,'Project sign fits mobile initial view');}
 sandbox.innerWidth=1440;sandbox.innerHeight=900;a.resize();a.positionNodes();
 console.log('PASS: chalet artwork hit targets, stale request protection, mobile zoom limits, and mobile project positions.');
 console.log('PASS: scene coordinates, loading separation, camera limits, panel camera invariance, 4 case studies, cache, directory, contact, and close/reset.');
 console.log('World sign centers at 1440 × 900:');for(const [id,p]of Object.entries(a.places))if(['bny','qds','tmo','overlay','welcome','directory','mail'].includes(id))console.log(id,a.toScreen(p));
 console.log('Terrain water tiles:',water,'cached scene props:',a.props.length);

 const actor=(id,t)=>a.actorsAt(t).find(o=>o.id===id);
 const qualcommTime=96/3.3,lap=a.road.length/3.3;
 assert.equal(actor('biker',qualcommTime-.001).flip,false);
 assert.equal(actor('biker',qualcommTime+.001).flip,true);
 assert.equal(actor('biker',lap-.001).flip,true);
 assert.equal(actor('biker',lap+.001).flip,false);
 for(let t=0;t<17.95;t+=.05)assert(actor('skier',t+.05).y>=actor('skier',t).y-.001,'Skier only descends on snow');
 assert.equal(actor('skier',30).phase,'hike');
 for(let t=20;t<45.95;t+=.05)assert(actor('skier',t+.05).y<=actor('skier',t).y+.001,'Skier walks uphill');
 for(const t of [18,19,20]){const p=actor('skier',t);assert.equal(p.x,a.skiBottom.x);assert.equal(p.y,a.skiBottom.y);assert(p.flip,'Hiker faces back uphill');}
 for(const t of [46,47,47.999]){const p=actor('skier',t);assert.equal(p.x,a.skiTop.x);assert.equal(p.y,a.skiTop.y);}
 const walk0=actor('skier',30).art,walk1=actor('skier',30.25).art;
 assert.notEqual(walk0,walk1,'Walking legs alternate');assert.equal(walk0,actor('skier',30.5).art,'Walking frames are cached');
 assert.equal(actor('skier',18).art,actor('skier',19.25).art,'Bottom pause has still legs');
 assert.equal(actor('skier',46).art,actor('skier',47.25).art,'Top pause has still legs');
 assertDrawableFits(walk0,'Hiker frame 0');assertDrawableFits(walk1,'Hiker frame 1');
 assert.notDeepEqual(walk0.img.context.marks,walk1.img.context.marks,'Walking frames draw different legs');
 for(const t of [0,10,18,25,46]){const p=actor('skier',t),q=actor('skier',t+48);assert.equal(p.x,q.x);assert.equal(p.y,q.y);assert.equal(p.art,q.art);}
 assert.equal(actor('skier',48).phase,'ski');assert.equal(actor('skier',48).flip,false);
 assert(![...a.spriteCache.keys()].some(key=>key.startsWith('lift')),'No lift sprites remain');
 for(const boundary of [18,20,46,48,96]){const p=actor('skier',boundary-.001),q=actor('skier',boundary+.001);assert(Math.hypot(q.x-p.x,q.y-p.y)<.1,'Skier does not teleport between phases');}
 assert.equal(actor('foiler',0).x,a.riverRoute[0].x);assert.equal(actor('foiler',24).x,a.riverRoute.at(-1).x);assert.equal(actor('foiler',48).x,a.riverRoute[0].x);
 for(let i=0;i<=100;i++){const u=i/100,x=32+8*u,y=52+u,deck={x:a.bridgeStart.x+(a.bridgeEnd.x-a.bridgeStart.x)*u,y:a.bridgeStart.y+(a.bridgeEnd.y-a.bridgeStart.y)*u};if(a.riverAt(x,y))assert(deck.y<a.project(x,y,1).y-20,'Bridge deck stays above water');}
 assertDrawableFits(a.bridgeArt,'Entire bridge deck, fascia, planks, and rails');
 const bridge=a.props.find(p=>p.id==='bridge'),calls=[];
 a.drawSprite({drawImage:(...args)=>calls.push(args)},bridge,0);
 assert.equal(calls.length,1);const [,drawX,drawY,drawW,drawH]=calls[0];
 assert.equal(drawW,a.bridgeArt.img.width);assert.equal(drawH,a.bridgeArt.img.height);
 for(const p of [a.bridgeStart,a.bridgeEnd])assert(p.x>=drawX&&p.x<=drawX+drawW&&p.y>=drawY&&p.y<=drawY+drawH,'Both banks are inside the drawn bridge');
 assert(a.places.lan.y+17 < a.props.find(p=>p.id==='overlay').y-123,'Lan is clear of the chalet roof');
 assert(a.places.sheep.x+20 < a.props.find(p=>p.id==='overlay').x-44,'Sheep is clear of the chalet');
 assert(!fs.readFileSync(root+'index.html','utf8').includes('class="location"'));
 assert(!fs.readFileSync(root+'village/village.js','utf8').includes("fillText('take the scenic route'"));
 for(const [w,h,introHeight,welcomeHeight]of [[1440,900,190,108],[1024,768,190,108],[390,844,145,76],[375,667,145,76],[844,390,190,108]]){
  sandbox.innerWidth=w;sandbox.innerHeight=h;query('#village-intro')[0].offsetHeight=introHeight;query('#welcome')[0].offsetHeight=welcomeHeight;
  a.resize();a.resetView();a.positionNodes();const intro=query('#village-intro')[0],base=a.toScreen({x:a.sceneFrame.x,y:a.sceneFrame.bottom});
  assert(Math.abs(parseFloat(intro.style.left)-w/2)<=.5,'Island and name sign centered');
  assert(Math.abs(parseFloat(intro.style.top)-base.y-16)<=.5,'Name sign clears the island');
  assert(a.toScreen({x:a.sceneFrame.x,y:a.sceneFrame.top}).y>=0,'Summit and skier fit above the sign');
  assert(parseFloat(intro.style.top)+introHeight<h,'Name and instructions fit the viewport');
  const focus={x:800,y:600},screen=a.toScreen(focus);a.zoomAt(1.25,screen.x,screen.y);const after=a.toScreen(focus);
  assert(Math.hypot(after.x-screen.x,after.y-screen.y)<.001,'Zoom keeps the pointer anchor fixed');
 }
 console.log('PASS: centered composition, intro clearance, viewport fit, and zoom anchors at desktop/mobile sizes (mock DOM dimensions).');
 console.log('PASS: cyclist turn points, downhill skiing, hiking frames, pauses, seamless repeat, full river route, raised bridge, visible Lan/sheep, and removed captions.');

})().catch(e=>{console.error(e);process.exitCode=1;});
