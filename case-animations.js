/* Decorative case study stories. No dependencies and no work while offscreen. */
(() => {
  'use strict';
  const script = document.currentScript;
  const atlasURL = new URL('images/pixel-wesley/poses.webp', script.src).href;
  const image = new Image();
  const ready = new Promise(resolve => { image.onload = () => resolve(true); image.onerror = () => resolve(false); });
  const detectiveImage = new Image();
  const detectiveURL = new URL('images/pixel-wesley/detective.webp', script.src).href;
  const detectiveReady = new Promise(resolve => { detectiveImage.onload = () => resolve(true); detectiveImage.onerror = () => resolve(false); });
  const detectiveWalkImage = new Image();
  const detectiveWalkURL = new URL('images/pixel-wesley/detective-walk-smooth.webp', script.src).href;
  const detectiveWalkReady = new Promise(resolve => { detectiveWalkImage.onload = () => resolve(true); detectiveWalkImage.onerror = () => resolve(false); });
  const aboutImage = new Image();
  const aboutURL = new URL('images/pixel-wesley/about-wave.webp', script.src).href;
  const aboutReady = new Promise(resolve => { aboutImage.onload = () => resolve(true); aboutImage.onerror = () => resolve(false); });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let cells, detectiveCells, detectiveWalkCells;
  const scenes = {
    // Case studies only. Other work gets no animation.
    'ai-navigation': 'map', icons: 'icons', search: 'search',
    'civil-conflicts': 'dig', 'overlay-app': 'market',
  };

  // Read each cell's transparent bounds once, preserving a consistent body scale.
  function extractCells(sheet = image, columns = 4, rows = 4) {
    const source = document.createElement('canvas');
    source.width = sheet.naturalWidth; source.height = sheet.naturalHeight;
    const g = source.getContext('2d', { willReadFrequently: true });
    g.drawImage(sheet, 0, 0);
    const pixels = g.getImageData(0, 0, source.width, source.height).data;
    const cw = source.width / columns, ch = source.height / rows;
    return Array.from({ length: columns * rows }, (_, n) => {
      const ox = Math.round(n % columns * cw), oy = Math.round(Math.floor(n / columns) * ch);
      let l = cw, r = 0, t = ch, b = 0;
      for (let y = 0; y < Math.floor(ch); y++) for (let x = 0; x < Math.floor(cw); x++) {
        if (pixels[((oy + y) * source.width + ox + x) * 4 + 3] > 96) {
          l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
        }
      }
      const w = r - l + 1, h = b - t + 1;
      const bitmap = document.createElement('canvas');
      bitmap.width = w; bitmap.height = h;
      bitmap.getContext('2d').drawImage(source, ox+l, oy+t, w, h, 0, 0, w, h);
      return { x: ox + l, y: oy + t, w, h, bitmap };
    });
  }

  function mount(host, kind) {
    // The homepage wave only needs its own sheet; skip the case-study poses there.
    const usesAtlas = kind !== 'about';
    if (usesAtlas && !image.src) image.src = atlasURL;
    if (kind === 'search' && !detectiveImage.src) detectiveImage.src = detectiveURL;
    if (kind === 'search' && !detectiveWalkImage.src) detectiveWalkImage.src = detectiveWalkURL;
    if (kind === 'about' && !aboutImage.src) aboutImage.src = aboutURL;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    const g = canvas.getContext('2d');
    let width = 320, height = 138, raf = 0, visible = false, disposed = false;
    // Case scenes get a strip of canvas left of the text edge, so effects like tears can spill past it.
    // Scene x = 0 stays on the text edge; the host's CSS pulls it left by the same amount.
    const bleed = kind === 'about' ? 0 : 24;
    let elapsed = 0, lastTick = performance.now();
    const baseline = kind === 'about' ? 96 : 128;
    const rect = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
    function line(points, color, size = 2) {
      g.strokeStyle = color; g.lineWidth = size; g.lineJoin = 'miter';
      g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(Math.round(x), Math.round(y)) : g.moveTo(Math.round(x), Math.round(y))); g.stroke();
    }
    function sprite(n, x, { flip = false, y = baseline, tilt = 0, scale = 1, detective = false } = {}) {
      const frames = detective === 'walk' ? detectiveWalkCells : detective ? detectiveCells : cells;
      const c = frames[n], h = 90 * scale, w = c.w / c.h * h;
      // Every pose has the same head size. Seated poses keep their shorter stature.
      const seated = !detective && n >= 14, actualH = seated ? h * .76 : h;
      const actualW = seated ? w * .76 : w;
      g.save(); g.translate(x, y);
      if (flip) g.scale(-1, 1);
      g.rotate(tilt);
      g.drawImage(c.bitmap, 0, 0, c.w, c.h, -Math.round(actualW / 2), -Math.round(actualH), Math.round(actualW), Math.round(actualH));
      g.restore();
    }
    // Half the drawn width of a pose, so a scene can put its left edge flush with the text column.
    function half(n) { const c = cells[n], w = c.w / c.h * 90; return Math.round((n >= 14 ? w * .76 : w) / 2); }
    function shadow(x, w = 39) { rect(x - w / 2, baseline + 1, w, 2, '#e9e8e4'); }
    const walk = t => [1, 2, 3, 4][Math.floor(t * 8) % 4];
    const ease = t => t * t * (3 - 2 * t);

    function map(t) {
      const duration = 17, p = t % duration;
      const left = 31, right = Math.max(70, width - 38);
      let x, pose, flip = false;
      if (p < 5) { x = left + (right - left) * ease(p / 5); pose = walk(t); }
      else if (p < 8) { x = right; pose = 5; }
      else if (p < 13) { x = right - (right - left) * ease((p - 8) / 5); pose = walk(t); flip = true; }
      else { x = left; pose = 5; flip = true; }
      shadow(x); sprite(pose, x, { flip });
      if (pose === 5 && Math.floor(p * 2) % 4 < 3) {
        // A little question mark: uncertainty reads without a speech bubble.
        const qx = x + (flip ? -17 : 15), qy = 20 + Math.round(Math.sin(t * 3));
        rect(qx, qy, 6, 2, '#8b927f'); rect(qx + 5, qy + 2, 2, 4, '#8b927f');
        rect(qx + 2, qy + 6, 4, 2, '#8b927f'); rect(qx + 2, qy + 8, 2, 2, '#8b927f'); rect(qx + 2, qy + 13, 2, 2, '#8b927f');
      }
    }

    function icon(x, y, type, selected, t) {
      y += Math.round(Math.sin(t * 1.5 + type) * 2);
      const ink = selected ? '#4e795a' : '#a9aca7';
      if (selected) { rect(x - 12, y - 12, 25, 25, '#f1f5ee'); }
      if (type === 0) {
        line([[x-7,y-1],[x,y-7],[x+7,y-1]],ink); line([[x-5,y],[x-5,y+7],[x+5,y+7],[x+5,y]],ink);
        rect(x-1,y+2,3,5,ink);
      } else if (type === 1) {
        line([[x-7,y-6],[x+7,y-6],[x+7,y+4],[x+2,y+4],[x-3,y+8],[x-3,y+4],[x-7,y+4],[x-7,y-6]],ink);
        for(let i=0;i<3;i++) rect(x-4+i*4,y-2,2,2,ink);
      } else {
        line([[x,y-8],[x+3,y-3],[x+8,y-3],[x+4,y+1],[x+5,y+7],[x,y+4],[x-5,y+7],[x-4,y+1],[x-8,y-3],[x-3,y-3],[x,y-8]],ink);
      }
    }
    function icons(t) {
      const p = t % 12, x = half(9);
      const target = Math.min(width - 28, x + 90);
      let active = -1, pose = 9;
      if (p < 2.5) { pose = 6; active = 0; }
      else if (p < 5) { pose = 7; active = 1; }
      else if (p < 7.5) pose = 9;
      else if (p < 10.5) { pose = 8; active = 2; }
      shadow(x); sprite(pose, half(pose));
      icon(target - 12, 28, 0, active === 0, t);
      icon(target + 12, 64, 1, active === 1, t);
      icon(target - 4, 101, 2, active === 2, t);
    }

    function detective(t) {
      const p = t % 14, left = 38, right = Math.max(80, width - 44);
      const forward = p < 7, q = forward ? p : p - 7;
      const distance = (right - left) * ease(Math.min(q / 5, 1));
      const x = forward ? left + distance : right - distance;
      const walking = q < 5;
      // Advance the gait with distance so his feet slow down with his body.
      const phase = distance / 36;
      const step = Math.floor(phase * 8) % 8;
      const pose = walking ? step : q < 6 ? 2 : 3;
      shadow(x);
      sprite(pose, x, { flip: !forward, detective: walking ? 'walk' : true, y: baseline - (walking ? (1 - Math.cos(phase * Math.PI * 4)) * .6 : 0) });
    }

    function dirt(x, amount) {
      rect(x - 18, baseline - 1, 39, 3, '#aa8960');
      for (let i=0;i<8;i++) {
        const dx = ((i * 17) % 33) - 15;
        rect(x + dx, baseline - 2 - Math.round(amount * (3 + (i%3)*2)), 5, 3, i%2 ? '#94714d' : '#ba9b70');
      }
    }
    function digging(t) {
      const p = t % 17, x = half(10), hole = x + 45;
      const digging = p < 5, spray = p >= 5 && p < 10.5, covering = p >= 10.5 && p < 14;
      let pose = digging ? (Math.floor(p*1.6)%2 ? 11 : 10) : spray ? 12 : covering ? (Math.floor(p*2.4)%2 ? 10 : 11) : 13;
      shadow(x); dirt(hole, p < 5 ? 1 : covering ? 1 - (p-10.5)/3.5 : p >= 14 ? 0 : 1);
      if (p >= 3 && p < 14) { rect(hole-9,123,19,4,'#6e5641'); rect(hole-5,123,12,2,'#78949b'); }
      sprite(pose, half(pose), { tilt: spray ? Math.sin(t*23)*.035 : 0 });
      if (digging && pose === 11) for(let i=0;i<4;i++) {
        const f = (p*1.6)%1;
        rect(hole + 5 + i*4 + f*11, 92 - Math.sin(f*Math.PI)*13+i*3, 3, 3, '#a88b63');
      }
      if (spray) {
        const power = Math.min((p-5)*3,1) * Math.min((10.5-p)*2,1);
        // Water uses a shared two-pixel grid, just like a little game effect.
        const snap = v => Math.round(v / 2) * 2;
        const block = (wx, wy, w, h, color) => rect(snap(wx), snap(wy), w, h, color);
        const clock = Math.floor(t * 10);
        const streams = [ [-38,62], [-22,83], [10,96], [34,79], [60,55] ];
        streams.forEach(([reach, rise], j) => {
          const height = (rise + Math.round(Math.sin(clock*.5+j*1.7)*2)*2) * power;
          const at = u => [hole + (j-2)*2 + reach*u*power, 123 - 4*height*u*(1-u)];
          // Overlapping square tiles form solid stair-stepped ribbons, without strokes.
          for (let k=0; k<35; k++) {
            const u=k/44;
            if (k>26 && (k+clock+j)%6<2) continue;
            const [wx,wy]=at(u), size=k<14?6:4;
            block(wx-size/2,wy,size,size,'#62aecb');
            block(wx-size/2,wy,2,size,j%2?'#99d8e7':'#b6e9f0');
            if ((k+clock+j)%9===0) block(wx,wy,2,2,'#e0f6f8');
          }
          for (let k=0;k<5;k++) {
            const u=.79+((clock*.025+k*.047+j*.09)%.25);
            const [wx,wy]=at(u);
            block(wx,wy,k%2?4:2,k%2?4:6,k%2?'#8bcede':'#b0e3ed');
          }
        });
        // A blocky splash crown, foam, and a spreading puddle at the broken pipe.
        block(hole-8,118,16,6,'#62aecb');
        block(hole-6,114+(clock%3)*2,12,8,'#8dd5e5');
        block(hole-2,112,4,10,'#d1f1f5');
        block(hole-16,126,36,2,'#b2e0e9');
        block(hole-10,124,24,2,'#8acddd');
        for(let i=0;i<10;i++) {
          const f=(clock*.15+i*.173)%1, side=i%2?1:-1;
          const dx=side*(8+f*(17+i%4*5))*power;
          block(hole+dx,124-Math.sin(f*Math.PI)*(10+i%3*4)*power,i%3?2:4,4,'#9fdce8');
        }
      }
      if (covering) for(let i=0;i<5;i++) {
        const f=(p*2.4+i*.19)%1;
        rect(x+16+f*33,104-Math.sin(f*Math.PI)*14,3,3,'#a88b63');
      }
      if (p >= 14 && p < 16.5) {
        const f=(p-14)/2.5;
        rect(x+27+f*8,47+f*16,2,4,'#91c8d5');
        if(p>14.6) line([[x+23,28],[x+27,26],[x+31,28]],'#a1aaa0',1);
      }
    }

    function market(t) {
      const p=t%15, happy=p<7, x=half(14), monitor=x+69;
      const color=happy?'#5b956a':'#c47672';
      // The stool is already in the sprite; the desk uses the same warm wood ramp.
      sprite(happy?14:15,half(happy?14:15),{y:baseline});
      rect(x+16,100,95,6,'#62432e');
      rect(x+17,99,93,3,'#c5945c');
      rect(x+19,99,88,1,'#e2b87c');
      rect(x+19,103,89,2,'#91623d');
      for (const legX of [x+23,x+102]) {
        rect(legX,106,5,22,'#68472f'); rect(legX+1,106,3,21,'#aa7747');
        rect(legX+1,107,1,18,'#cf9a60'); rect(legX-1,127,7,2,'#68472f');
      }
      rect(x+45,100,11,1,'#ac7949'); rect(x+77,101,9,1,'#dfa86b');
      // Stepped corners and a shaded bezel keep the monitor in the sprite palette.
      rect(monitor-25,53,57,41,'#353d3d');
      rect(monitor-27,55,61,37,'#353d3d');
      rect(monitor-25,54,57,2,'#99a39b');
      rect(monitor-26,56,2,34,'#77877e');
      rect(monitor-23,57,53,32,'#edf1e6');
      rect(monitor-23,57,53,2,'#ced9ce');
      rect(monitor-23,59,2,30,'#dce4d7');
      rect(monitor-23,90,53,2,'#63746c'); rect(monitor+2,91,3,1,'#a1c3a7');
      rect(monitor,94,7,4,'#46524e'); rect(monitor+1,94,3,4,'#809186');
      rect(monitor-8,97,24,2,'#46524e'); rect(monitor-6,97,20,1,'#8a9a8d');
      rect(monitor-17,64,1,21,'#d5dfd1'); rect(monitor-17,85,42,1,'#d5dfd1');
      const progress=happy?Math.min(p/4,1):Math.min((p-7)/3,1);
      const values=happy?[81,79,82,75,77,68,71,63]:[64,67,65,73,71,80,78,85];
      const pts=values.slice(0,Math.max(2,Math.ceil(progress*8))).map((y,i)=>[monitor-16+i*5.6,y]);
      // Plot the market in square pixel steps as well.
      for(let i=1;i<pts.length;i++) {
        const [ax,ay]=pts[i-1], [bx,by]=pts[i];
        const steps=Math.ceil(Math.max(Math.abs(bx-ax),Math.abs(by-ay)));
        for(let k=0;k<=steps;k++) {
          rect(Math.round((ax+(bx-ax)*k/steps)/2)*2,Math.round((ay+(by-ay)*k/steps)/2)*2,2,2,color);
        }
      }
      if(!happy) for(let side of [-1,1]) for(let i=0;i<10;i++) {
        const f=(t*1.6+i*.117)%1;
        rect(x+side*(10+f*30),71+f*f*33-Math.sin(f*Math.PI)*16,3,2+(i%2),'#8ec9dc');
      }
    }

    function about(t) {
      // A brief greeting, then five seconds with arms down. Keep eye contact.
      const p = t % 8;
      let frame = 0;
      if (p >= .65 && p < .85) frame = 1;
      else if (p >= .85 && p < 2.45) frame = [2, 3, 4, 5][Math.floor((p - .85) / .2) % 4];
      else if (p >= 2.45 && p < 2.7) frame = 6;
      // Use fixed cells rather than trimmed bounds so the waving hand can't
      // shift the character's body sideways or change its scale.
      const cw = aboutImage.naturalWidth / 4, ch = aboutImage.naturalHeight / 2;
      const h = 96, w = cw / ch * h, x = 46;
      shadow(x, 34);
      g.drawImage(aboutImage, (frame % 4) * cw, Math.floor(frame / 4) * ch, cw, ch,
        Math.round(x - w / 2), baseline - h + 2, Math.round(w), h);
    }

    function paint(t) {
      if (reduced.matches) t = kind === 'market' ? 4 : kind === 'map' ? 6 : 0;
      g.clearRect(-bleed,0,width+bleed,height);
      ({map,icons,search:detective,dig:digging,market,about}[kind] || map)(t);
    }
    function tick(now) {
      raf=0;
      if(disposed || !visible || document.hidden || reduced.matches) return;
      elapsed += Math.min(now-lastTick,100); lastTick=now;
      // Position and effects follow the display refresh; poses keep their own cadence.
      paint(elapsed/1000);
      raf=requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(raf); raf=0;
      if(disposed) return;
      if(reduced.matches) { paint(kind==='market'?4:kind==='map'?6:0); return; }
      if(visible && !document.hidden) { lastTick=performance.now(); raf=requestAnimationFrame(tick); }
    }
    const resize=new ResizeObserver(entries=>{
      width=Math.max(kind === 'about' ? 92 : 150,Math.round(entries[0].contentRect.width)-bleed);
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width=Math.round((width+bleed)*density); canvas.height=Math.round(height*density);
      g.setTransform(density,0,0,density,bleed*density,0); g.imageSmoothingEnabled=false;
      paint(elapsed/1000);
    });
    const observer=new IntersectionObserver(entries=>{ visible=entries[0].isIntersecting; resume(); });
    const visibility=()=>resume();
    Promise.all([usesAtlas ? ready : true, kind === 'search' ? detectiveReady : true, kind === 'search' ? detectiveWalkReady : true, kind === 'about' ? aboutReady : true]).then(results=>{
      const ok = results.every(Boolean);
      if(disposed) return;
      if(!ok) {host.hidden=true;return;}
      if (usesAtlas) cells ||= extractCells();
      if (kind === 'search') {
        detectiveCells ||= extractCells(detectiveImage, 2, 2);
        detectiveWalkCells ||= extractCells(detectiveWalkImage, 4, 2);
      }
      resize.observe(host); observer.observe(host);
      document.addEventListener('visibilitychange',visibility);
      reduced.addEventListener('change',resume);
      paint(0); resume();
    });
    return ()=>{
      disposed=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();
      document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',resume);
    };
  }
  window.CaseAnimations={
    kind: id=>scenes[id],
    mount:(host,id)=>mount(host,scenes[id] || id),
  };
})();
