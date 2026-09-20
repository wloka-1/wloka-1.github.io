/* Local, dependency-free alpine village. The terrain is drawn once; animation reuses sprites. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const canvas = $('#landscape'), ctx = canvas.getContext('2d', {alpha:false});
const W = 1500, H = 1130, OX = 760, OY = 390, NX = 72, NY = 60;
// Frame the visible island, with room above its summit for the skier's backpack.
const sceneFrame={x:826,top:120,bottom:1021};
const intro=$('#village-intro'),welcome=$('#welcome');
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const mix = (a,b,t) => a+(b-a)*t;
const hash = (x,y) => { const n = Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
const project = (x,y,z=0) => ({x:OX+(x-y)*11,y:OY+(x+y)*5.5-z*9});
const heights = new Float32Array(NX*NY);
const riverAt = (x,y) => Math.abs(x+y-(91+Math.sin((x-y)/10)*3.3))<3.2;
const landAt = (x,y) => ((x-35.5)/35.5)**2+((y-29.5)/29.8)**2 < 1+Math.sin(x*.57+y*.23)*.025;
const naturalHeight = (x,y) => {
  const mountain = Math.max(0,1-Math.hypot((x-30)/25,(y-21)/26));
  const left = Math.max(0,1-Math.hypot((x-15)/16,(y-29)/18));
  const right = Math.max(0,1-Math.hypot((x-47)/18,(y-18)/18));
  return 4+Math.pow(mountain,1.42)*54+left*7+right*12;
};
const chalets = [
 {id:'bny',name:'BNY',x:19,y:31,roof:'#547a76',roofLight:'#6c9590',trim:'#d5b56e'},
 {id:'qds',name:'Qualcomm',x:44,y:30,roof:'#ac684c',roofLight:'#c37a56',trim:'#b9cba3'},
 {id:'tmo',name:'T-Mobile',x:13,y:43,roof:'#9b5a5c',roofLight:'#bc7972',trim:'#e1b4b1'},
 {id:'overlay',name:'Overlay',x:38,y:45,roof:'#6d7190',roofLight:'#9396a9',trim:'#e0c982'}
];
for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
 if(!landAt(x,y)){heights[y*NX+x]=-1;continue;}
 let h=riverAt(x,y)?1:Math.floor(naturalHeight(x,y)+hash(x,y)*.7);
 for(const c of chalets)if(Math.abs(x-c.x)<3.5&&Math.abs(y-c.y)<3) h=Math.floor(naturalHeight(c.x,c.y));
 heights[y*NX+x]=h;
}
function height(x,y){const ix=clamp(Math.floor(x),0,NX-1),iy=clamp(Math.floor(y),0,NY-1);return Math.max(0,heights[iy*NX+ix]);}
function smoothHeight(x,y){const ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy;return mix(mix(height(ix,iy),height(ix+1,iy),tx),mix(height(ix,iy+1),height(ix+1,iy+1),tx),ty);}
const point = (x,y) => project(x,y,smoothHeight(x,y));
function poly(g,points,color){g.fillStyle=color;g.beginPath();g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);g.closePath();g.fill();}
function line(g,points,color,width=2){g.strokeStyle=color;g.lineWidth=width;g.lineJoin='bevel';g.lineCap='butt';g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();}
function rect(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);}
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}
function offscreen(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const terrain=offscreen(W,H), ground=terrain.getContext('2d');
const waterTiles=[];
const pathNodes=[[13,43],[20,43],[23,38],[22,33],[19,31],[25,33],[31,36],[37,34],[44,30],[46,36],[42,41],[38,45],[29,48],[21,46],[13,43]];
function pathPoints(nodes,steps=12){const out=[];for(let i=0;i<nodes.length-1;i++)for(let j=0;j<steps;j++){const t=j/steps,x=mix(nodes[i][0],nodes[i+1][0],t),y=mix(nodes[i][1],nodes[i+1][1],t);out.push({...point(x,y),wx:x,wy:y});}return out;}
const road=pathPoints(pathNodes);
const skiTop=point(30,22),skiBottom=point(35,26);
const riverRoute=[];
for(let d=-72;d<=72;d+=.25){
 const sum=91+Math.sin(d/10)*3.3,x=(sum+d)/2,y=(sum-d)/2;
 if(landAt(x,y)&&height(x,y)===1)riverRoute.push({...project(x,y,1),wx:x,wy:y});
}
// Leave room for the board at each shoreline, while using the entire river.
riverRoute.splice(-3);riverRoute.splice(0,3);
function closeToRoad(x,y,d=1.7){return road.some(p=>Math.hypot(p.wx-x,p.wy-y)<d);}
function drawTerrain(){
 ground.clearRect(0,0,W,H);
 waterTiles.length=0;
 for(let sum=0;sum<NX+NY;sum++)for(let x=0;x<NX;x++){
  const y=sum-x;if(y<0||y>=NY)continue;
  const h=heights[y*NX+x];if(h<0)continue;
  const p=project(x,y,h),r=hash(x,y);
  const a=[p.x,p.y],b=[p.x+11,p.y+5.5],c=[p.x,p.y+11],d=[p.x-11,p.y+5.5];
  const snow=h>=38||(h>31&&hash(x+40,y)<(h-31)/14);
  const rock=!snow&&h>27&&(hash(x,y+17)>.3||h>33);
  let top=snow?['#f6fbef','#e6f2e9','#fffef1','#eff7ee'][Math.floor(r*4)]:rock?['#a4b1a0','#b9bca7','#909f94'][Math.floor(r*3)]:['#8fbd6c','#92bf70','#96c373','#87b469','#9ac677'][Math.floor(r*5)];
  if(h===1){top=['#63b1b4','#68b9b9','#71bfbf','#5eadaf'][Math.floor(r*4)];waterTiles.push(p);}
  const nh1=x<NX-1?heights[y*NX+x+1]:-1,nh2=y<NY-1?heights[(y+1)*NX+x]:-1;
  const dz1=(h-Math.max(nh1,-2))*9,dz2=(h-Math.max(nh2,-2))*9;
  if(dz1>0)poly(ground,[b,c,[c[0],c[1]+dz1],[b[0],b[1]+dz1]],nh1<0?'#b1ac81':snow?'#c5d9d1':rock?'#7f9387':h===1?'#4c919b':'#638d51');
  if(dz2>0)poly(ground,[d,c,[c[0],c[1]+dz2],[d[0],d[1]+dz2]],nh2<0?'#c7b792':snow?'#d7e5dc':rock?'#9ca58e':h===1?'#579da1':'#76a159');
  poly(ground,[a,b,c,d],top);
  if(!snow&&!rock&&h>1&&r>.65){rect(ground,p.x-2,p.y+4,3,2,r>.9?'#b3d28b':'#7eac5e');}
  if((nh1<0||nh2<0)&&h>1){rect(ground,p.x-2,p.y+16,3,3,'#9f9e76');}
 }
 const roadPoints=road.map(p=>[p.x,p.y]);
 line(ground,roadPoints,'#7c945b',15);line(ground,roadPoints,'#d8c99b',11);line(ground,roadPoints,'#e8dcb5',5);
 // The dirt trail stops on the bank. A raised timber deck spans the water.
 const foot=pathPoints([[29,48],[30,51],[32,52]],10).map(p=>[p.x,p.y]);
 foot.push([point(32,52).x,point(32,52).y]);line(ground,foot,'#d6caa0',8);
 const farPath=pathPoints([[40,53],[42,54]],8).map(p=>[p.x,p.y]);line(ground,farPath,'#d6caa0',8);
 for(let i=0;i<80;i++){
  const x=8+hash(i,7)*52,y=32+hash(i,19)*22;
  if(!landAt(x,y)||riverAt(x,y)||closeToRoad(x,y,1))continue;
  const p=point(x,y);flower(ground,p.x,p.y,['#fbdf9d','#fff3cc','#dca4a5'][i%3]);
 }
}
const spriteCache=new Map();
function sprite(key,draw,bounds=[-100,-195,100,25]){if(spriteCache.has(key))return spriteCache.get(key);const [left,top,right,bottom]=bounds,img=offscreen(Math.ceil(right-left),Math.ceil(bottom-top)),g=img.getContext('2d');g.translate(-left,-top);draw(g);const v={img,ax:-left,ay:-top};spriteCache.set(key,v);return v;}
function shadow(g,w=16){poly(g,[[-w,-2],[0,-8],[w+6,0],[4,7]],'#38564223');}
function pineSprite(variant=0){return sprite('pine'+variant,g=>{
 shadow(g,16);rect(g,-3,-15,7,18,'#846343');rect(g,2,-13,3,16,'#674e38');
 const rows=[1,1,3,3,5,3,5,7,5,7,9,7,9,11,7,5];
 const unit=3.3,colors=[['#5a8c54','#79a35e','#49794b'],['#477957','#679b65','#3c6850'],['#65975a','#87ad69','#507e4c']][variant%3];
 for(let y=0;y<rows.length;y++){const w=rows[y]*unit,x=-w/2,yy=-65+y*unit;rect(g,x+3,yy+2,w,unit,colors[2]);rect(g,x,yy,w,unit,colors[0]);if(y%3===0)rect(g,x,yy,Math.max(3,w*.4),unit,colors[1]);}
 });}
function broadTree(type='apple'){return sprite(type,g=>{
 shadow(g,24);rect(g,-4,-33,8,35,'#886849');rect(g,3,-32,3,33,'#624e39');line(g,[[-1,-26],[-14,-42]],'#886849',5);line(g,[[1,-24],[16,-40]],'#886849',5);
 const colors=type==='bloom'?['#eed8c1','#f8e9d6','#e0bbab']:['#7aa85d','#94b96b','#608e51'];
 const blocks=[[-21,-59,37,29],[-28,-53,49,22],[-16,-66,30,39],[-29,-41,51,10]];
 for(const [x,y,w,h] of blocks)rect(g,x+4,y+3,w,h,colors[2]);
 for(const [x,y,w,h] of blocks)rect(g,x,y,w,h,colors[0]);
 for(let i=0;i<18;i++){const x=-23+hash(i,2)*43,y=-61+hash(i,7)*29;rect(g,x,y,5,4,colors[i%2+1]);}
 if(type==='apple')for(const [x,y] of [[-18,-45],[9,-50],[-3,-37],[17,-36],[-6,-58]]){rect(g,x,y,4,5,'#b96348');rect(g,x+1,y,2,2,'#e5aa6c');}
 });}
function bushSprite(berries=false){return sprite('bush'+berries,g=>{shadow(g,10);rect(g,-13,-13,26,13,'#577f50');rect(g,-9,-18,17,16,'#6f9856');rect(g,-15,-9,31,8,'#608e50');if(berries)for(let i=0;i<8;i++)rect(g,-11+hash(i,3)*23,-14+hash(i,1)*10,3,3,i%2?'#555878':'#7986a6');});}
function chaletSprite(c){return sprite(c.id,g=>{
 shadow(g,53);
 poly(g,[[-43,-5],[2,17],[56,-10],[8,-33]],'#d8cda4');
 // Two visible wall planes with timber framing and a shallow pitched roof.
 poly(g,[[-36,-21],[4,-1],[4,-43],[-36,-63]],'#e6dfbd');
 poly(g,[[4,-1],[47,-23],[47,-65],[4,-43]],'#c0c39c');
 poly(g,[[-36,-63],[-16,-88],[4,-43]],'#f3e6c3');
 line(g,[[-36,-61],[-36,-21],[4,-1],[47,-23],[47,-65]],'#7c6847',4);
 line(g,[[-36,-43],[4,-23],[47,-45]],'#9c835b',4);
 line(g,[[-16,-53],[-16,-11]],'#9c835b',3);line(g,[[25,-53],[25,-12]],'#8b7952',3);
 // Door and warm, small windows.
 poly(g,[[-14,-12],[-3,-6],[-3,-28],[-14,-34]],'#7b7250');rect(g,-7,-20,2,2,'#e8cf85');
 poly(g,[[-30,-39],[-20,-34],[-20,-46],[-30,-51]],'#dfb968');line(g,[[-25,-48],[-25,-36]],'#fff0b1',2);
 poly(g,[[11,-25],[20,-30],[20,-42],[11,-37]],'#ffe5a2');
 poly(g,[[31,-36],[40,-41],[40,-52],[31,-47]],'#f6d394');
 // Window boxes.
 line(g,[[-32,-36],[-19,-30]],'#7c6847',4);rect(g,-30,-37,4,3,c.trim);rect(g,-23,-34,4,3,'#d99475');
 line(g,[[29,-33],[43,-40]],'#7c6847',4);rect(g,32,-37,4,3,c.trim);rect(g,39,-41,4,3,'#e4c475');
 poly(g,[[-43,-64],[-17,-96],[1,-87],[11,-36]],'#6c5943');
 poly(g,[[-17,-96],[30,-119],[55,-67],[9,-43]],c.roof);
 poly(g,[[-43,-66],[-17,-96],[-13,-90],[-37,-61]],c.roofLight);
 line(g,[[9,-43],[55,-67]],'#6c5943',5);
 for(let k=1;k<6;k++){const t=k/6;line(g,[[mix(-17,9,t),mix(-96,-43,t)],[mix(30,55,t),mix(-119,-67,t)]],c.roofLight,2);}
 for(let k=1;k<5;k++){const t=k/5;line(g,[[mix(-17,30,t),mix(-96,-119,t)],[mix(9,55,t),mix(-43,-67,t)]],rgba('#304534',.16),2);}
 // Chimney, split logs, doorstep, and a tiny planted pot.
 poly(g,[[20,-92],[29,-96],[29,-123],[20,-119]],'#aa9779');poly(g,[[12,-96],[20,-92],[20,-119],[12,-123]],'#cfb898');poly(g,[[12,-123],[20,-127],[29,-123],[20,-119]],'#746d58');
 poly(g,[[-15,-10],[-2,-3],[-10,2],[-23,-5]],'#beb993');
 for(let i=0;i<4;i++){rect(g,35+i*4,-10-i*2,5,5,'#96704c');rect(g,36+i*4,-9-i*2,2,2,'#d7b887');}
 rect(g,-41,-16,8,7,'#ae7952');rect(g,-44,-22,12,8,'#719753');
 });}
function actorSprite(kind,frame=0){return sprite(kind+frame,g=>{
 if(kind==='ski-hiker'){
  shadow(g,12);
  // A pair of skis strapped diagonally to the pack, clear of his walking legs.
  line(g,[[-9,-12],[-18,-51],[-16,-55]],'#ba8256',3);
  line(g,[[-3,-13],[-12,-52],[-10,-56]],'#d8b477',3);
  rect(g,-11,-31,8,19,'#6e8463');line(g,[[-11,-25],[-3,-27]],'#d7ca9a',2);
  rect(g,-5,-29,10,15,'#b5754f');rect(g,-3,-39,8,10,'#d2a16e');rect(g,-5,-42,11,4,'#e4cc88');rect(g,4,-36,2,2,'#4f5646');
  line(g,[[-3,-14],[frame?-6:-1,-6],[frame?-8:0,1]],'#486778',4);
  line(g,[[3,-14],[frame?6:2,-7],[frame?9:1,1]],'#486778',4);
  line(g,[[6,-26],[frame?12:9,-16]],'#d2a16e',3);
  line(g,[[11,-20],[15,2]],'#71847c',1);
  return;
 }
 if(kind==='fox'){shadow(g,12);rect(g,-12,-12,24,9,'#b97943');rect(g,8,-19,10,12,'#c68a4d');rect(g,7,-23,4,6,'#95633f');rect(g,15,-22,3,5,'#95633f');rect(g,16,-14,5,4,'#fff0c9');rect(g,14,-17,2,2,'#344d3d');rect(g,-20,-16,12,7,'#c78d4f');rect(g,-22,-17,6,6,'#f0dfb3');rect(g,-9,-4,3,5,'#70553e');rect(g,6,-4,3,5,'#70553e');return;}
 if(kind==='sheep'){shadow(g,14);rect(g,-14,-17,24,16,'#eee8cd');rect(g,-10,-20,15,21,'#fff9df');rect(g,7,-14,10,9,'#7a826a');rect(g,14,-13,3,3,'#3d5142');rect(g,-10,-2,3,7,'#777a60');rect(g,5,-2,3,7,'#777a60');return;}
 shadow(g,kind==='foiler'?24:12);
 const skin='#d2a16e',dark='#526450',pants='#486778';
 if(kind==='biker'){
  for(const x of [-13,14]){g.strokeStyle='#435950';g.lineWidth=2;g.strokeRect(x-7,-10,13,13);rect(g,x-3,-12,6,2,'#435950');rect(g,x-3,3,6,2,'#435950');}
  line(g,[[-13,-4],[0,-13],[14,-4],[-2,-4],[-13,-4]],'#cb9058',2);line(g,[[14,-4],[10,-22],[16,-22]],'#5b6955',2);
  line(g,[[-5,-23],[5,-14],[frame?3:-2,-4]],pants,4);rect(g,-7,-32,9,12,'#c47c55');rect(g,-2,-39,7,8,skin);rect(g,-4,-42,11,5,'#e1ba6f');line(g,[[0,-27],[12,-22]],skin,3);return;
 }
 if(kind==='foiler'){
  line(g,[[-21,1],[21,-3]],'#eee5c0',4);line(g,[[1,-1],[-1,9]],'#566d6b',2);
  line(g,[[0,-11],[0,-21],[4,-31]],'#52615b',3);
  poly(g,[[4,-33],[-11,-60],[-32,-46],[-22,-24],[4,-30],[31,-36],[17,-55]],'#d78257');
  line(g,[[-32,-46],[-11,-60],[4,-33],[17,-55],[31,-36]],'#edc387',2);
  rect(g,-4,-27,8,11,'#537f82');rect(g,-1,-35,6,7,skin);line(g,[[-1,-16],[-5,-2]],pants,3);line(g,[[2,-16],[9,-3]],pants,3);return;
 }
 const shirt=kind==='skier'?'#b5754f':kind==='picker'?'#6c7eaa':kind==='lan'?'#829bba':kind==='irene'?'#c79073':'#bfac64';
 rect(g,-6,-28,11,15,shirt);rect(g,-4,-38,9,10,skin);rect(g,-5,-40,11,4,kind==='skier'?'#e4cc88':dark);
 rect(g,4,-35,2,2,'#4f5646');
 if(kind==='skier'){
  line(g,[[-4,-13],[-7,-4]],pants,4);line(g,[[3,-13],[7,-5]],pants,4);line(g,[[-17,-2],[2,5]],'#ba8256',2);line(g,[[0,-5],[19,2]],'#ba8256',2);line(g,[[-10,-24],[-16,-4]],'#71847c',1);line(g,[[8,-23],[19,-4]],'#71847c',1);
 }else{
  rect(g,-5,-14,4,13+(frame?2:0),pants);rect(g,2,-14,4,13+(frame?0:2),pants);rect(g,-7,0,6,3,dark);rect(g,2,0,7,3,dark);
  line(g,[[-6,-26],[-9,-15]],skin,3);line(g,[[6,-26],[kind==='picker'?15:9,kind==='picker'?-23:-15]],skin,3);
  if(kind==='picker'){rect(g,10,-9,10,8,'#c2a576');line(g,[[10,-9],[12,-13],[18,-13],[20,-9]],'#8c7754',1);}
 }
 });}
function flower(g,x,y,color){rect(g,x,y-5,2,6,'#629050');rect(g,x-2,y-6,6,2,color);rect(g,x,y-8,2,6,color);}
const props=[];
function addProp(x,y,art,scale=1,id='',sway=false){const p=point(x,y);const o={x:p.x,y:p.y,depth:x+y,art,scale,id,sway};props.push(o);return o;}
const places={};
for(const c of chalets){const o=addProp(c.x,c.y,chaletSprite(c),1,c.id);places[c.id]={x:o.x,y:o.y+31};c.screen=o;}
const bridgeStart=point(32,52),bridgeEnd=point(40,53);
const bridgeArt=sprite('river-bridge',g=>{
 const dx=bridgeEnd.x-bridgeStart.x,dy=bridgeEnd.y-bridgeStart.y,len=Math.hypot(dx,dy),nx=-dy/len*9,ny=dx/len*9;
 const edge=(u,side)=>[dx*u+nx*side,dy*u+ny*side];
 const back0=edge(0,-1),back1=edge(1,-1),front0=edge(0,1),front1=edge(1,1);
 // Deck and fascia stay at bank height instead of following the riverbed.
 poly(g,[back0,back1,front1,front0],'#c4a77b');
 poly(g,[front0,front1,[front1[0],front1[1]+5],[front0[0],front0[1]+5]],'#8c704f');
 for(let i=0;i<=12;i++)line(g,[edge(i/12,-1),edge(i/12,1)],'#967c56',1.5);
 for(const side of [-1,1]){
  for(const u of [0,.25,.5,.75,1]){const p=edge(u,side);line(g,[[p[0],p[1]-14],[p[0],p[1]+3]],'#826b4b',3);}
  const a=edge(0,side),b=edge(1,side);line(g,[[a[0],a[1]-14],[b[0],b[1]-14]],'#b49a70',3);
 }
},[Math.min(0,bridgeEnd.x-bridgeStart.x)-16,Math.min(0,bridgeEnd.y-bridgeStart.y)-28,Math.max(0,bridgeEnd.x-bridgeStart.x)+16,Math.max(0,bridgeEnd.y-bridgeStart.y)+16]);
props.push({x:bridgeStart.x,y:bridgeStart.y,depth:93,art:bridgeArt,scale:1,id:'bridge'});
// Vegetation is deterministic and deliberately kept clear of the paths and doors.
for(let y=7;y<55;y+=1.65)for(let x=5;x<68;x+=1.65){
 if(!landAt(x,y)||riverAt(x,y)||height(x,y)>30||hash(x,y)<.45||closeToRoad(x,y))continue;
 if(chalets.some(c=>Math.hypot(c.x-x,c.y-y)<5))continue;
 if(x+y>84||x+y<40)continue;
 if(x>19&&x<41&&y>36)continue;
 // Keep the fox's entire little patrol visible through the foreground trees.
 const tree=point(x,y),fox=point(16,35),scale=.65+hash(x+1,y)*.65;
 if(x+y>=50&&Math.abs(tree.x-fox.x)<18*scale+32&&tree.y>fox.y-22&&tree.y-65*scale<fox.y+12)continue;
 addProp(x,y,pineSprite(Math.floor(hash(y,x)*3)),.65+hash(x+1,y)*.65,'',true);
}
for(const [x,y,type] of [[23,45,'apple'],[20,49,'bloom'],[25,50,'bloom'],[17,47,'bloom'],[47,38,'bloom'],[48,33,'apple'],[10,36,'bloom']]){
 const o=addProp(x,y,broadTree(type),1,'',true);if(x===23)places.apple={x:o.x,y:o.y-25};
}
for(const [x,y] of [[27,42],[28.5,42],[30,42],[27,43.5],[28.5,43.5],[30,43.5]])addProp(x,y,bushSprite(true),.8);
places.welcome={x:sceneFrame.x,y:sceneFrame.bottom};
places.directory={...point(58,45)};places.directory.y+=9;
places.mail={...point(65,20)};places.mail.y+=24;
const mailbox=sprite('mailbox',g=>{shadow(g,10);rect(g,-2,-20,4,23,'#967149');rect(g,-9,-37,20,19,'#688e79');rect(g,-6,-40,14,3,'#92ae8a');rect(g,-9,-23,20,5,'#4f7561');rect(g,9,-40,2,16,'#76563d');rect(g,11,-39,8,5,'#c77f55');rect(g,-3,-32,8,5,'#f6e6bd');});
addProp(65,20,mailbox,1);
const bench=sprite('bench',g=>{shadow(g,23);poly(g,[[-24,-13],[7,3],[20,-4],[-11,-20]],'#b39a6b');line(g,[[-24,-17],[7,-1]],'#86714d',3);line(g,[[-22,-14],[-22,0]],'#78654b',3);line(g,[[7,1],[7,12]],'#78654b',3);line(g,[[-22,-25],[8,-10]],'#c2a578',7);});
addProp(35,39,bench);
const fixedActors={picker:[27,44],lan:[32,40],irene:[32,34.5],josh:[17,41],fox:[16,35],sheep:[31,44.5]};
for(const [id,xy] of Object.entries(fixedActors)){const p=point(...xy);places[id]={x:p.x,y:p.y-15};}
const conversations={
 skier:{who:'Wesley, on the mountain',text:'There’s snow at the top. You know where to find me.'},
 biker:{who:'Wesley, taking the long way',text:'In a past life, I was an almost-pro cyclist. Still taking the scenic route.'},
 foiler:{who:'Wesley, on the river',text:'A little wind on the Columbia and I’m out wing foiling.'},
 picker:{who:'Wesley, in the berry patch',text:'Blueberry picking. A very good reason to step away from a screen.'},
 lan:{who:'A word from Lan',text:'“Overlay wouldn’t be where it is today without the work we’ve done with Wesley. What sets him apart is his ability to see the bigger picture, understanding our business goals and ensuring the designs align with our overall objectives.”',cite:'Lan Wolfer · CEO, Overlay Foundation'},
 irene:{who:'A word from Irene',text:'“Wesley is a holistic and critical thinker. It was a joy to collaborate with him on intricate design challenges.”',cite:'Irene Barber · Design Director, Blink UX'},
 josh:{who:'A word from Josh',text:'“The quality of his work has been top notch, and his fast turnaround times have kept us ahead in a fast-paced industry. Wesley handled everything with what felt like ease, from design strategy and UX to marketing and branding.”',cite:'Josh Mackanic · CEO & Co-Founder, CivilGrid'}
};
const links='<div class="contact-links"><a href="mailto:wesley.kay@gmail.com">Email me</a><a href="Wesley-Kay-Resume.pdf" target="_blank" rel="noopener">Resume ↗</a><a href="https://linkedin.com/in/wesley-kay" target="_blank" rel="noopener">LinkedIn ↗</a></div>';
const projectMeta={bny:['BNY','Making enterprise AI make sense.'],qds:['Qualcomm','A shared design language, built from scratch.'],tmo:['T-Mobile','Search and navigation at a very big scale.'],overlay:['Overlay','Co-founder. From zero to a DeFi protocol.']};
let vw=innerWidth,vh=innerHeight,baseScale=1,zoom=1,panX=0,panY=0,tx=0,ty=0;
let introHeight=0,welcomeHeight=0,homeLift=24;
let frameId=0,lastPaint=0,sceneTime=0,previousTime=0,dirty=true;
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let paused=motionQuery.matches,musicOn=false,audio=null,musicTimer=0,voiceIndex=0;
let activeSpeech='',speechOrigin=null,activePanel='',panelOrigin=null,requestToken=0;
const speech=$('#speech'),panel=$('#case-panel'),body=$('#panel-body');
const signNodes=$$('[data-place]').filter(el=>el!==welcome),personNodes=$$('[data-person]');
const effects=[];
function toScreen(p){return {x:p.x*baseScale*zoom+tx,y:p.y*baseScale*zoom+ty};}
function transform(){
 const s=baseScale*zoom;
 const maxX=Math.max(0,(W*s-vw)/2)+vw*.16*(zoom-1);
 const maxY=Math.max(0,(H*s-(vh-130))/2)+vh*.13*(zoom-1);
 panX=clamp(panX,-maxX,maxX);panY=clamp(panY,-maxY,maxY);
 tx=vw/2-sceneFrame.x*s+panX;ty=(vh-introHeight-16)/2-homeLift-(sceneFrame.top+sceneFrame.bottom)/2*s+panY;
}
function resize(){vw=innerWidth;vh=innerHeight;introHeight=intro.offsetHeight;welcomeHeight=welcome.offsetHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);baseScale=Math.min((vw-(vw<760?10:90))/W,(vh-130-introHeight-16)/(sceneFrame.bottom-sceneFrame.top));baseScale=Math.max(.18,baseScale);homeLift=clamp((vh-(sceneFrame.bottom-sceneFrame.top)*baseScale-introHeight-16)/2-12,0,24);transform();requestDraw();}
function zoomAt(next,x=vw/2,y=vh/2){const old=baseScale*zoom,px=(x-tx)/old,py=(y-ty)/old;zoom=clamp(next,1,vw<760?4:2.7);const scale=baseScale*zoom;panX=x-px*scale-vw/2+sceneFrame.x*scale;panY=y-py*scale-(vh-introHeight-16)/2+homeLift+(sceneFrame.top+sceneFrame.bottom)/2*scale;transform();closeSpeech(false);requestDraw();}
function resetView(){zoom=1;panX=0;panY=0;transform();closeSpeech(false);requestDraw();}
function positionNodes(){
 const base=toScreen({x:sceneFrame.x,y:sceneFrame.bottom});
 intro.style.left=Math.round(base.x)+'px';intro.style.top=Math.round(base.y+16)+'px';
 places.welcome={x:sceneFrame.x,y:sceneFrame.bottom+(16+welcomeHeight/2)/(baseScale*zoom)};
 for(const el of signNodes){const p=toScreen(places[el.dataset.place]);el.style.left=Math.round(p.x)+'px';el.style.top=Math.round(p.y)+'px';}
 for(const el of personNodes){const p=toScreen(places[el.dataset.person]||{x:-1000,y:-1000});el.style.left=Math.round(p.x)+'px';el.style.top=Math.round(p.y)+'px';}
 $('#zoom-out').disabled=zoom<=1.001;$('#zoom-in').disabled=zoom>=(vw<760?4:2.7)-.001;
 if(activeSpeech)positionSpeech();
}
function drawSprite(g,o,t){const s=o.scale||1,dx=o.sway?Math.round(Math.sin(t*.8+o.depth)*1.2):0;if(o.flip){g.save();g.translate(o.x+dx,o.y);g.scale(-1,1);g.drawImage(o.art.img,-o.art.ax*s,-o.art.ay*s,o.art.img.width*s,o.art.img.height*s);g.restore();}else g.drawImage(o.art.img,o.x-o.art.ax*s+dx,o.y-o.art.ay*s,o.art.img.width*s,o.art.img.height*s);}
function cloud(g,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);rect(g,-36,0,80,12,'#f2f8ec');rect(g,-22,-11,52,20,'#f8fcf2');rect(g,-7,-21,25,25,'#f8fcf2');rect(g,-29,12,65,4,'#ccded7');g.restore();}
function actorsAt(t){
 const list=[];
 for(const [id,xy] of Object.entries(fixedActors)){
  let [x,y]=xy;if(id==='fox'){x+=Math.sin(t*.22)*.8;y+=Math.cos(t*.22)*.2;}
  const p=point(x,y),o={x:p.x,y:p.y,depth:x+y,art:actorSprite(id,Math.floor(t*1.5)%2),scale:1};list.push(o);places[id]={x:p.x,y:p.y-17};
 }
 // Ski down, shoulder the skis, hike back up, and put them on for the next run.
 const phase=t%48;let sp,skierArt='skier',skiDepth;
 if(phase<18){const u=phase/18,sx=mix(30,35,u)+Math.sin(u*Math.PI*4)*.6,sy=mix(22,26,u);sp=point(sx,sy);skiDepth=sx+sy;}
 else if(phase<20){sp=skiBottom;skiDepth=61;skierArt='ski-hiker';}
 else if(phase<46){const u=(phase-20)/26,sx=mix(35,30,u),sy=mix(26,22,u);sp=point(sx,sy);skiDepth=sx+sy;skierArt='ski-hiker';}
 else{sp=skiTop;skiDepth=52;skierArt='ski-hiker';}
 const hiking=skierArt==='ski-hiker',step=hiking&&phase>=20&&phase<46?Math.floor(t*4)%2:0;
 list.push({...sp,depth:skiDepth,art:actorSprite(skierArt,step),scale:1,id:'skier',flip:hiking,phase:hiking?'hike':'ski'});places.skier={x:sp.x,y:sp.y-17};
 const ri=(t*3.3)%road.length,ra=road[Math.floor(ri)],rb=road[(Math.floor(ri)+1)%road.length];
 const bp={x:mix(ra.x,rb.x,ri%1),y:mix(ra.y,rb.y,ri%1)};list.push({...bp,depth:mix(ra.wx+ra.wy,rb.wx+rb.wy,ri%1),art:actorSprite('biker',Math.floor(t*5)%2),scale:1,flip:ri>=8*12,id:'biker'});places.biker={x:bp.x,y:bp.y-15};
 const travel=(1-Math.cos(t*Math.PI/24))/2,fi=travel*(riverRoute.length-1),fa=riverRoute[Math.floor(fi)],fb=riverRoute[Math.min(Math.floor(fi)+1,riverRoute.length-1)];
 const fp={x:mix(fa.x,fb.x,fi%1),y:mix(fa.y,fb.y,fi%1)};
 list.push({...fp,depth:mix(fa.wx+fa.wy,fb.wx+fb.wy,fi%1),art:actorSprite('foiler'),scale:1,flip:Math.sin(t*Math.PI/24)<0,id:'foiler'});places.foiler={x:fp.x,y:fp.y-26};
 return list;
}
function paint(t){
 if(!ctx)return;
 ctx.fillStyle='#daeef0';ctx.fillRect(0,0,vw,vh);
 ctx.save();ctx.translate(tx,ty);ctx.scale(baseScale*zoom,baseScale*zoom);ctx.imageSmoothingEnabled=false;
 cloud(ctx,385+Math.sin(t*.02)*15,226,.85);cloud(ctx,1190+Math.sin(t*.02+2)*20,318,1.05);cloud(ctx,560+Math.sin(t*.017)*12,126,.55);
 ctx.drawImage(terrain,0,0);
 // Sparse moving glints keep the river alive without repainting its geometry.
 for(let i=0;i<waterTiles.length;i+=5){const p=waterTiles[i],a=(Math.sin(t*1.2+i*.7)+1)*.13;rect(ctx,p.x-4+Math.sin(t*.5+i)*3,p.y+4,7,1,rgba('#f0f8d9',a));}
 const actors=actorsAt(t),drawables=props.concat(actors).sort((a,b)=>a.depth-b.depth);
 for(const o of drawables)drawSprite(ctx,o,t);
 // Small square chimney puffs: no images or video to fetch.
 for(const c of chalets)for(let i=0;i<4;i++){
  const age=(t*.24+i/4)%1,sz=4+age*11,x=c.screen.x+20+age*15+Math.sin(t+i)*2,y=c.screen.y-124-age*48;
  rect(ctx,x,y,sz,sz,rgba('#fffbdf',(1-age)*.53));
 }
 // Blossom petals and two tiny birds.
 for(let i=0;i<10;i++){const age=(t*.12+i*.19)%1,p=point(20,49);rect(ctx,p.x-20+i*5+age*15,p.y-55+age*55,2,3,rgba('#fff1d9',.65));}
 for(let i=0;i<2;i++){const x=660+Math.sin(t*.12+i*.4)*180,y=202+Math.cos(t*.16+i)*14;line(ctx,[[x-5,y],[x,y+(Math.sin(t*7+i)>0?-3:2)],[x+5,y]],'#719589',2);}
 for(let i=effects.length-1;i>=0;i--){const e=effects[i],age=t-e.start;if(age>2.4){effects.splice(i,1);continue;}ctx.globalAlpha=1-age/2.4;rect(ctx,e.x+Math.sin(age*3)*4,e.y+Math.min(age*50,37),5,6,e.color);ctx.globalAlpha=1;}
 ctx.restore();positionNodes();
}
function tick(now){frameId=0;if(document.hidden){previousTime=0;return;}if(!previousTime)previousTime=now;const dt=Math.min((now-previousTime)/1000,.05);previousTime=now;if(!paused)sceneTime+=dt;if(dirty||now-lastPaint>=1000/30){paint(sceneTime);lastPaint=now;dirty=false;}if(!paused)frameId=requestAnimationFrame(tick);}
function requestDraw(){dirty=true;if(!frameId)frameId=requestAnimationFrame(tick);}
function closeSpeech(restore=true){speech.hidden=true;activeSpeech='';if(restore&&speechOrigin?.isConnected)speechOrigin.focus({preventScroll:true});}
function positionSpeech(){const p=toScreen(places[activeSpeech]||places.welcome),w=speech.offsetWidth,h=speech.offsetHeight;const right=panel.hidden?vw:vw<760?vw:panel.getBoundingClientRect().left;speech.style.left=clamp(p.x-w/2,12,Math.max(12,right-w-12))+'px';speech.style.top=clamp(p.y-h-32,12,Math.max(12,vh-h-110))+'px';}
function talk(id,origin){
 closePanel(false,true);speechOrigin=origin;activeSpeech=id;
 if(id==='welcome'){
  $('#speech-who').textContent='Hey, I’m Wesley.';
  $('#speech-content').innerHTML='<p>I design products. Before UX, I did architecture. I still like to think in systems.</p><p>Home is White Salmon, Washington. The skiing, cycling, wing foiling, and blueberry picking? That’s me, too.</p><div class="conversation-links"><a href="#directory">Explore the work</a><a href="#contact">Say hello</a></div>';
 }else{
  const c=conversations[id];if(!c)return;$('#speech-who').textContent=c.who;const p=document.createElement('p');p.textContent=c.text;$('#speech-content').replaceChildren(p);if(c.cite){const cite=document.createElement('cite');cite.textContent=c.cite;$('#speech-content').append(cite);}
 }
 speech.hidden=false;positionSpeech();$('.speech-close').focus({preventScroll:true});
}
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function reward(id){const p=places[id];if(id==='apple'){effects.push({x:p.x+8,y:p.y-21,start:sceneTime,color:'#bf7550'});toast('one for the trail.');chime([76,79,83]);}else if(id==='fox'){toast('a little company for the walk.');chime([79,83]);}else{toast('a very good sheep.');chime([72,76]);}requestDraw();}
const cache=new Map();
function routeFor(id){return ['directory','contact',...Object.keys(projectMeta)].includes(id)?id:'';}
function setRoute(id){const h=id?'#'+id:location.pathname+location.search;history.pushState(null,'',h);}
async function openPanel(id,origin=null,changeRoute=true){
 if(!routeFor(id))return;
 if(!origin&&activeSpeech)origin=speechOrigin;
 if(!origin&&panel.hidden)origin=document.activeElement;
 closeSpeech(false);activePanel=id;if(origin)panelOrigin=origin;const token=++requestToken;
 if(changeRoute)setRoute(id);
 panel.hidden=false;syncPanelModal();document.body.classList.add('panel-open');$('#panel-title').textContent=projectMeta[id]?.[0]|| (id==='directory'?'The trail directory':'A note from the village');body.scrollTop=0;body.removeAttribute('aria-busy');$('#close-panel').focus({preventScroll:true});
 if(id==='directory'){
  body.innerHTML='<h1>A few places I’ve been.</h1><p class="directory-intro">Four projects. Different kinds of problems. Make yourself at home.</p><ul class="directory-list">'+Object.entries(projectMeta).map(([k,[n,d]],i)=>`<li><button data-project="${k}"><span>${String(i+1).padStart(2,'0')} · ${n}<small>${d}</small></span><span aria-hidden="true">↗</span></button></li>`).join('')+'</ul><p>Or close this and take the scenic route.</p>';
  return;
 }
 if(id==='contact'){body.innerHTML='<h1>Say hello.</h1><p>Open to senior and staff product design roles. AI-forward teams especially.</p><p>If you enjoyed wandering around here, I’d probably enjoy working with you.</p>'+links;return;}
 body.setAttribute('aria-busy','true');body.innerHTML='<p role="status">Opening the chalet…</p>';
 try{
  let html=cache.get(id);if(!html){const response=await fetch('village/studies/'+id+'.html');if(!response.ok)throw new Error('Could not load study');html=await response.text();cache.set(id,html);}
  if(token!==requestToken||activePanel!==id)return;
  body.innerHTML=html.replaceAll('src="../../images/','src="images/');body.removeAttribute('aria-busy');
 }catch(error){if(token!==requestToken)return;body.removeAttribute('aria-busy');body.innerHTML='<div class="panel-error"><h1>The trail is taking a moment.</h1><p>This case study couldn’t load. Try again, or get in touch.</p><button class="retry-button" data-project="'+id+'">Try again</button>'+links+'</div>';}
}
function closePanel(restore=true,changeRoute=true){if(panel.hidden)return;panel.hidden=true;syncPanelModal();document.body.classList.remove('panel-open');activePanel='';requestToken++;if(changeRoute)setRoute('');if(restore&&panelOrigin?.isConnected)panelOrigin.focus({preventScroll:true});}
function syncPanelModal(){
 const modal=!panel.hidden&&innerWidth>=760;
 world.inert=modal;
 if(modal)panel.setAttribute('aria-modal','true');else panel.removeAttribute('aria-modal');
}
$('#panel-backdrop').addEventListener('click',()=>closePanel());
window.addEventListener('resize',syncPanelModal);
function applyRoute(){const id=routeFor(location.hash.slice(1));if(id&&id===activePanel&&!panel.hidden)return;if(id)openPanel(id,null,false);else closePanel(false,false);}
// All interactions are available as real, keyboard-accessible buttons over the drawing.
let suppressClickUntil=0;
canvas.addEventListener('click',e=>{
 if(performance.now()<suppressClickUntil)return;
 const s=baseScale*zoom,x=(e.clientX-tx)/s,y=(e.clientY-ty)/s;
 const building=[...chalets].sort((a,b)=>(b.x+b.y)-(a.x+a.y)).find(c=>x>=c.screen.x-44&&x<=c.screen.x+56&&y>=c.screen.y-123&&y<=c.screen.y+12);
 if(building){openPanel(building.id,signNodes.find(el=>el.dataset.project===building.id));return;}
 const m=places.mail;
 if(Math.abs(x-m.x)<18&&y>m.y-70&&y<m.y-17){openPanel('contact',signNodes.find(el=>el.dataset.place==='mail'));return;}
 closeSpeech(false);
});
document.addEventListener('click',e=>{
 if(performance.now()<suppressClickUntil&&e.target.closest('#world-signs')){e.preventDefault();return;}
 const projectButton=e.target.closest('[data-project]');if(projectButton){openPanel(projectButton.dataset.project,projectButton);return;}
 const place=e.target.closest('[data-place]');if(place){const id=place.dataset.place;if(id==='welcome')talk(id,place);if(id==='directory')openPanel('directory',place);if(id==='mail')openPanel('contact',place);return;}
 const person=e.target.closest('[data-person]');if(person){const id=person.dataset.person;if(['apple','fox','sheep'].includes(id))reward(id);else talk(id,person);}
});
$('.speech-close').addEventListener('click',()=>closeSpeech());$('#close-panel').addEventListener('click',()=>closePanel());
$('#zoom-in').addEventListener('click',()=>zoomAt(zoom*1.3));$('#zoom-out').addEventListener('click',()=>zoomAt(zoom/1.3));$('#reset-view').addEventListener('click',resetView);
$('#motion').addEventListener('click',()=>{paused=!paused;updateMotion();requestDraw();});
function updateMotion(){$('#motion').innerHTML=paused?'<span aria-hidden="true">▷</span> play':'<span aria-hidden="true">Ⅱ</span> pause';$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').setAttribute('aria-label',paused?'Resume village animation':'Pause village animation');}
motionQuery.addEventListener('change',e=>{paused=e.matches;updateMotion();requestDraw();});
const pointers=new Map();let pointerStart=null,gestureStart=null;
function pointerDistance(){const p=[...pointers.values()];return p.length>=2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;}
const world=$('#world');
world.addEventListener('pointerdown',e=>{
 if(e.target.closest('.speech,.view-controls,.ambience-controls'))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pointerStart={x:e.clientX,y:e.clientY,px:panX,py:panY,moved:false};
 if(pointers.size===2){gestureStart={distance:pointerDistance(),zoom};suppressClickUntil=performance.now()+400;}
 if(e.target===canvas)canvas.setPointerCapture(e.pointerId);
});
window.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size>=2&&gestureStart){const a=[...pointers.values()],x=(a[0].x+a[1].x)/2,y=(a[0].y+a[1].y)/2;zoomAt(gestureStart.zoom*pointerDistance()/Math.max(1,gestureStart.distance),x,y);pointerStart.moved=true;suppressClickUntil=performance.now()+400;return;}
 if(!pointerStart)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;
 if(Math.hypot(dx,dy)>5){pointerStart.moved=true;canvas.classList.add('dragging');panX=pointerStart.px+dx;panY=pointerStart.py+dy;transform();closeSpeech(false);requestDraw();}
});
function endPointer(e){if(!pointers.has(e.pointerId))return;if(pointerStart?.moved)suppressClickUntil=performance.now()+350;pointers.delete(e.pointerId);canvas.classList.remove('dragging');if(pointers.size===1){const p=[...pointers.values()][0];pointerStart={...p,px:panX,py:panY,moved:true};}else if(!pointers.size){pointerStart=null;}gestureStart=null;}
window.addEventListener('pointerup',endPointer);window.addEventListener('pointercancel',endPointer);
world.addEventListener('wheel',e=>{if(e.target.closest('.speech,.view-controls,.ambience-controls'))return;e.preventDefault();zoomAt(zoom*Math.exp(-clamp(e.deltaY,-100,100)*.0018),e.clientX,e.clientY);},{passive:false});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(!speech.hidden)closeSpeech();else closePanel();return;}
 if(!panel.hidden&&innerWidth>=760){
  if(e.key==='Tab'){
   const stops=[...panel.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
   const first=stops[0],last=stops[stops.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
  return;
 }
 if(e.target.closest('#case-panel,#speech'))return;
 if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(zoom*1.2);}if(e.key==='-'){e.preventDefault();zoomAt(zoom/1.2);}if(e.key==='0'){e.preventDefault();resetView();}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')panX+=45;if(e.key==='ArrowRight')panX-=45;if(e.key==='ArrowUp')panY+=45;if(e.key==='ArrowDown')panY-=45;transform();requestDraw();}
});
window.addEventListener('hashchange',applyRoute);window.addEventListener('popstate',applyRoute);window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frameId)cancelAnimationFrame(frameId);frameId=0;previousTime=0;clearTimeout(musicTimer);if(audio)audio.suspend().catch(()=>{});}else{requestDraw();if(audio&&musicOn)audio.resume().then(scheduleMusic).catch(()=>{});}});
// A tiny original pentatonic music loop, synthesized only after an explicit click.
function note(midi,when,duration=1.3,volume=.055){if(!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+.025);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);osc.connect(gain);gain.connect(audio.destination);osc.start(when);osc.stop(when+duration+.05);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
function scheduleMusic(){clearTimeout(musicTimer);if(!audio||!musicOn||document.hidden)return;const melody=[72,76,79,83,79,76,74,0,71,74,79,81,79,74,72,0,69,72,76,79,76,72,74,0,67,71,74,79,74,71,72,0],now=audio.currentTime+.04;note(melody[voiceIndex%melody.length]||72,now,1.8,melody[voiceIndex%melody.length]===0?0:.042);if(voiceIndex%4===0)note([48,55,53,48][Math.floor(voiceIndex/8)%4],now,3.6,.034);voiceIndex++;musicTimer=setTimeout(scheduleMusic,570);}
function chime(notes){if(!musicOn||!audio)return;notes.forEach((n,i)=>note(n,audio.currentTime+i*.12,.8,.035));}
$('#music').addEventListener('click',async()=>{
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){toast('Your browser has the quiet version.');return;}if(!audio)audio=new Audio();musicOn=!musicOn;if(musicOn){await audio.resume();scheduleMusic();}else{clearTimeout(musicTimer);await audio.suspend();}$('#music').innerHTML='<span aria-hidden="true">♫</span> music '+(musicOn?'on':'off');$('#music').setAttribute('aria-pressed',String(musicOn));}catch(error){musicOn=false;toast('Music couldn’t start. Try again in a moment.');}
});
if(ctx){drawTerrain();resize();updateMotion();applyRoute();document.fonts.ready.then(()=>{drawTerrain();resize();});}
else{document.body.classList.add('no-canvas');applyRoute();}
})();
