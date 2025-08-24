// JavaScript Document - fractals.js

/* ===================== Color & Noise Utilities ===================== */
function hslToHex(h,s,l){
  s/=100; l/=100;
  const a = s*Math.min(l,1-l);
  const f = n => {
    const k=(n+h/30)%12;
    const col=l - a*Math.max(-1,Math.min(k-3,Math.min(9-k,1)));
    return Math.round(255*col);
  };
  return '#'+[f(0),f(8),f(4)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function generateChromaticPalette(hue) {
    const palette = [];
    for (let i = 0; i < 10; i++) {
        const lightness = 15 + i * 8; // from dark to light
        palette.push(hslToHex(hue, 85, lightness));
    }
    return palette;
}

const colorPresets = {
    "Default": ["#6aa84f", "#a2c499", "#d9ead3", "#fce5cd", "#f4cccc", "#ea9999", "#e06666", "#cc0000", "#990000", "#660000"],
    "Forest": ["#2d572c", "#3e783b", "#50994a", "#63bb5a", "#77dd6a", "#8be37c", "#a0e98f", "#b5efa2", "#caf5b5", "#dffbc8"],
    "Sunset": ["#4c1a25", "#6f2633", "#933242", "#b73e51", "#db4a60", "#ff6b6b", "#ffa07a", "#ffcc66", "#fff2ac", "#ffffff"],
    "Ocean": ["#003f5c", "#2f4b7c", "#665191", "#a05195", "#d45087", "#f95d6a", "#ff7c43", "#ffa600", "#d6e2f0", "#f0f8ff"],
    "Rainbow": ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8b00ff", "#ff1493", "#00ced1", "#ff6347"],
    "Monochrome": ["#1a1a1a", "#333333", "#4d4d4d", "#666666", "#808080", "#999999", "#b3b3b3", "#cccccc", "#e6e6e6", "#ffffff"],
    "Neon": ["#ff00ff", "#00ffff", "#00ff00", "#ffff00", "#ff0000", "#ff69b4", "#7b68ee", "#00bfff", "#32cd32", "#ffd700"],
    "Reds": generateChromaticPalette(0),
    "Greens": generateChromaticPalette(120),
    "Blues": generateChromaticPalette(240),
    "Yellows": generateChromaticPalette(60),
    "Cyans": generateChromaticPalette(180),
    "Magentas": generateChromaticPalette(300),
};

/* ====== Seeded RNG & Perlin noise ====== */
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let seedCounter = 1;
function newSeed() { return (Date.now() + (seedCounter++)) >>> 0; }

let __lcgState = (Date.now() ^ 0x9e3779b9) >>> 0;
function randUnit() {
  if (window.crypto && window.crypto.getRandomValues) {
    const u32 = new Uint32Array(1);
    window.crypto.getRandomValues(u32);
    return u32[0] / 4294967296; // [0,1)
  }
  __lcgState = (1664525 * __lcgState + 1013904223) >>> 0;
  return __lcgState / 4294967296;
}

let stampCounter = 0;
function nextStampSeed() {
  const k = (++stampCounter) * 0x9e3779b9;
  return ((Date.now() ^ k) >>> 0);
}

function Perlin(seed=1){
  const rand = mulberry32(seed);
  const p = new Uint8Array(512);
  const perm = new Uint8Array(256);
  for(let i=0;i<256;i++) perm[i]=i;
  for(let i=255;i>0;i--){
    const j = Math.floor(rand()* (i+1));
    [perm[i],perm[j]]=[perm[j],perm[i]];
  }
  for(let i=0;i<512;i++) p[i]=perm[i&255];
  function fade(t){return t*t*t*(t*(t*6-15)+10);}
  function lerp(a,b,t){return a + t*(b-a);}
  function grad(hash,x,y){
    const h = hash & 3;
    const u = h<2?x:y;
    const v = h<2?y:x;
    return ((h&1)?-u:u) + ((h&2)?-2*v:2*v);
  }
  return function(x,y){
    const X = Math.floor(x)&255, Y=Math.floor(y)&255;
    const xf = x-Math.floor(x), yf=y-Math.floor(y);
    const u=fade(xf), v=fade(yf);
    const aa=p[p[X]+Y], ab=p[p[X]+Y+1], ba=p[p[X+1]+Y], bb=p[p[X+1]+Y+1];
    const x1 = lerp(grad(aa,xf,yf), grad(ba,xf-1,yf), u);
    const x2 = lerp(grad(ab,xf,yf-1), grad(bb,xf-1,yf-1), u);
    return lerp(x1,x2,v);
  };
}

/* ===================== Object Build Functions ===================== */
function buildTreeSegments(tree){
  const rand = mulberry32(tree.rngSeed);
  tree.segments = [];
  let segIndex = -1;
  
  const uniformJitter = tree.uniformAngleRand ? (rand()-0.5)*(tree.angleRand||0)*0.15 : null;

  function pushSeg(obj){
    tree.segments.push(obj);
    return (++segIndex);
  }

  function branch(x,y,len,ang,depth,level,parentIdx){
    if(depth<=0 || len<0.6) return null;

    const x2 = x + len*Math.cos(ang);
    const y2 = y - len*Math.sin(ang);
    const idx = pushSeg({ level, len, baseAng: ang, parent: (parentIdx==null ? -1 : parentIdx), children: [], x1:x, y1:y, x2, y2 });

    const red = (tree.lenScale ?? 0.68) + (rand()-0.5)*(tree.lenRand||0);
    const nl  = len * red;
    const jitter = (uniformJitter !== null) ? uniformJitter : (rand()-0.5)*(tree.angleRand||0)*0.15;
    const spread = (tree.angle||25)*Math.PI/180;

    const leftIdx  = branch(x2,y2,nl, ang - spread + jitter, depth-1, level+1, idx);
    const rightIdx = branch(x2,y2,nl, ang + spread + jitter, depth-1, level+1, idx);
    if (leftIdx!=null)  tree.segments[idx].children.push(leftIdx);
    if (rightIdx!=null) tree.segments[idx].children.push(rightIdx);
    return idx;
  }

  branch(tree.x, tree.y, tree.baseLen, Math.PI/2, tree.levels, 0, null);
}

function buildKochSnowflake(sf){
  const side = sf.size * 2;
  const h = Math.sqrt(3)/2 * side;
  const A = {x: sf.cx,           y: sf.cy - (2/3)*h};
  const B = {x: sf.cx + side/2,  y: sf.cy + (1/3)*h};
  const C = {x: sf.cx - side/2,  y: sf.cy + (1/3)*h};
  let edges = [ {x1:A.x, y1:A.y, x2:B.x, y2:B.y}, {x1:B.x, y1:B.y, x2:C.x, y2:C.y}, {x1:C.x, y1:C.y, x2:A.x, y2:A.y} ];
  function subdivide(e){
    const {x1,y1,x2,y2} = e;
    const dx = x2 - x1, dy = y2 - y1;
    const p1 = {x:x1, y:y1}; const a  = {x:x1 + dx/3, y:y1 + dy/3}; const b  = {x:x1 + 2*dx/3, y:y1 + 2*dy/3}; const p2 = {x:x2, y:y2};
    const ux = (b.x - a.x), uy = (b.y - a.y); const cos = 0.5, sin = -Math.sqrt(3)/2;
    const c  = {x:a.x + (ux * cos - uy * sin), y:a.y + (ux * sin + uy * cos)};
    return [ {x1:p1.x, y1:p1.y, x2:a.x, y2:a.y}, {x1:a.x,  y1:a.y,  x2:c.x, y2:c.y}, {x1:c.x,  y1:c.y,  x2:b.x, y2:b.y}, {x1:b.x,  y1:b.y,  x2:p2.x, y2:p2.y} ];
  }
  for (let i=0; i<sf.iter; i++){
    let next = [];
    for (const e of edges){ next.push(...subdivide(e)); }
    edges = next;
  }
  sf.segments = edges.map(e=>({x1:e.x1, y1:e.y1, x2:e.x2, y2:e.y2}));
}

function buildFlowerSegments(fl){
  const iter = Math.max(0, Math.min(7, fl.iter|0));
  let s = 'F';
  for (let i=0;i<iter;i++){ s = s.replace(/F/g, 'F[+F]F[-F]F'); }
  const stack = []; const segs = [];
  let x=fl.cx, y=fl.cy, ang=-Math.PI/2;
  const step = fl.step;
  for (let i=0;i<s.length;i++){
    const c = s[i];
    if (c==='F'){ const nx = x + step*Math.cos(ang); const ny = y + step*Math.sin(ang); segs.push({x1:x, y1:y, x2:nx, y2:ny}); x = nx; y = ny; }
    else if (c==='+'){ ang += (fl.angle*Math.PI/180); } else if (c==='-'){ ang -= (fl.angle*Math.PI/180); }
    else if (c==='['){ stack.push({x,y,ang}); } else if (c===']'){ const st = stack.pop(); if (st){ x=st.x; y=st.y; ang=st.ang; } }
  }
  fl.segments = segs;
}

function buildVinePolyline(v){
  const N = Math.max(10, v.length|0);
  const scl = Math.max(0.001, parseFloat(v.noise)||0.01);
  const noise = Perlin(v.rngSeed);
  const pts = [{x:v.cx, y:v.cy}];
  let ang = -Math.PI/2, x=v.cx, y=v.cy;
  for (let i=1;i<N;i++){
    const n = noise(x*scl, y*scl); const theta = (n*0.5 + 0.5) * Math.PI*2;
    ang = 0.75*ang + 0.25*theta;
    const step = (typeof v.step === 'number' && isFinite(v.step)) ? v.step : 4;
    x += step*Math.cos(ang); y += step*Math.sin(ang); pts.push({x,y});
  }
  v.points = pts;
}

/* ===================== Draw Functions ===================== */
function drawSinglePath(ctx, p) {
    if (!p || !p.points || p.points.length === 0) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = p.alpha ?? 1.0;
    ctx.lineWidth = p.strokeWidth;
    if (p.colorMode === 'single' || p.points.length < 2) {
        ctx.strokeStyle = p.singleColor;
        ctx.beginPath();
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (let i = 1; i < p.points.length; i++) {
            ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        if (p.points.length === 1) { // Draw a dot
            ctx.lineTo(p.points[0].x + 0.5, p.points[0].y + 0.5);
        }
        ctx.stroke();
    } else { // cycle
        if (!branchPalette || branchPalette.length === 0) return;
        for (let i = 0; i < p.points.length - 1; i++) {
            ctx.strokeStyle = branchPalette[i % branchPalette.length];
            ctx.beginPath();
            ctx.moveTo(p.points[i].x, p.points[i].y);
            ctx.lineTo(p.points[i + 1].x, p.points[i + 1].y);
            ctx.stroke();
        }
    }
}

function drawClouds(ctx, c){
    ctx.save(); ctx.globalAlpha = c.alpha ?? 1.0;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.shadowBlur = c.blur || 0; ctx.shadowOffsetX = c.blur || 8; ctx.shadowOffsetY = c.blur || 8; ctx.shadowColor = c.shadowColor || '#555';
    for (const k of c.circles){
      ctx.strokeStyle = k.color || '#ffffff'; ctx.lineWidth   = k.w || 2;
      ctx.beginPath(); ctx.arc(c.cx, c.cy, Math.max(0.5, k.r), 0, Math.PI*2); ctx.stroke();
    }
    ctx.restore();
}

function drawSnowflakes(ctx, s){
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = s.alpha ?? 1.0; ctx.strokeStyle = s.color || '#a0d8ff'; ctx.lineWidth = s.stroke || 1.5;
  ctx.beginPath();
  for (const seg of s.segments){ ctx.moveTo(seg.x1,seg.y1); ctx.lineTo(seg.x2,seg.y2); }
  ctx.stroke();
}

function drawFlowers(ctx, fl){
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.globalAlpha = fl.alpha ?? 1.0; ctx.strokeStyle = fl.color || '#ff88cc'; ctx.lineWidth = fl.stroke || 1.5;
  ctx.beginPath();
  for (const seg of fl.segments){ ctx.moveTo(seg.x1,seg.y1); ctx.lineTo(seg.x2,seg.y2); }
  ctx.stroke();
}

function drawVines(ctx, v){
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.globalAlpha = v.alpha ?? 1.0; ctx.strokeStyle = v.color || '#8fd18f'; ctx.lineWidth = v.stroke || 2.0;
  ctx.beginPath();
  const pts = v.points;
  if (pts.length>1){ ctx.moveTo(pts[0].x, pts[0].y); for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y); }
  ctx.stroke();
}

function drawTreeFromSegments(ctx, tree){
  const rand = mulberry32(tree.rngSeed); // Use the tree's own seed for consistent random colors
  ctx.lineCap='round'; ctx.lineJoin='round';
  for(const seg of tree.segments){
    const width = Math.max(0.1, (tree.baseWidth || 12) * Math.pow(tree.widthScale ?? 0.68, seg.level));
    let stroke;
    if (tree.randomColor) {
        const colorIndex = Math.floor(rand() * tree.branchColors.length);
        stroke = tree.branchColors[colorIndex];
    } else {
        stroke = tree.branchColors[seg.level] || '#fff';
    }
    const la     = tree.levelAlphas[seg.level] ?? 1;
    ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.globalAlpha = la;
    const isHighlighted = (trees.indexOf(tree) === selectedTreeIndex) && (seg.level === selectedLevelIndex);
    if(isHighlighted){
      ctx.save(); ctx.shadowColor='#fff'; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.moveTo(seg.x1,seg.y1); ctx.lineTo(seg.x2,seg.y2); ctx.stroke(); ctx.restore();
    } else {
      ctx.beginPath(); ctx.moveTo(seg.x1,seg.y1); ctx.lineTo(seg.x2,seg.y2); ctx.stroke();
    }
  }
}

function drawFernInstance(ctx, f){
  const rand = mulberry32(f.rngSeed);
  ctx.fillStyle = f.color || '#58c470'; ctx.globalAlpha = f.alpha ?? 1.0;
  let x=0,y=0;
  for(let i=0;i<f.points;i++){
    const r = rand(); let nx, ny;
    if (r<0.01){ nx=0; ny=0.16*y; } else if (r<0.86){ nx=0.85*x + 0.04*y; ny=-0.04*x + 0.85*y + 1.6; }
    else if (r<0.93){ nx=0.2*x - 0.26*y; ny=0.23*x + 0.22*y + 1.6; } else { nx=-0.15*x + 0.28*y; ny=0.26*x + 0.24*y + 0.44; }
    x=nx; y=ny;
    const px = Math.round(f.cx + x*f.size), py = Math.round(f.cy - y*f.size);
    ctx.fillRect(px,py,1,1);
  }
}

/* ===================== Eraser ===================== */
function applyEraser(ctx, stroke){
  ctx.save(); ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = stroke.size;
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for(let i=1; i<stroke.points.length; i++){
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

/* ===================== Animated Drawing ===================== */
function drawAnimatedTree(ctx, tree, time) {
    const amp   = windAmpEl ? (parseFloat(windAmpEl.value) * Math.PI/180) : 0;
    const speed = windSpeedEl ? parseFloat(windSpeedEl.value) : 0.2;
    const phase = (tree.rngSeed % 1000) / 1000 * Math.PI * 2;
    const rand = mulberry32(tree.rngSeed);

    const swayForLevel = new Map();
    for (let lvl=0; lvl<tree.levels; lvl++){
        const levelFactor = 1 / (1 + lvl*0.6);
        swayForLevel.set(lvl, amp * levelFactor * Math.sin((time*speed*2*Math.PI) + phase));
    }
    const roots = tree.segments.filter(s=>s.parent===-1);

    function drawRec(seg, sx, sy){
      const ang = seg.baseAng + (swayForLevel.get(seg.level) || 0);
      const ex = sx + seg.len*Math.cos(ang), ey = sy - seg.len*Math.sin(ang);
      const width = Math.max(0.1, (tree.baseWidth || 12) * Math.pow(tree.widthScale ?? 0.68, seg.level));
      
      let stroke;
      if (tree.randomColor) {
          const colorIndex = Math.floor(rand() * tree.branchColors.length);
          stroke = tree.branchColors[colorIndex];
      } else {
          stroke = tree.branchColors[seg.level] || '#fff';
      }
      
      const la = tree.levelAlphas[seg.level] ?? 1;
      ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.globalAlpha = la;
      const isHighlighted = (trees.indexOf(tree) === selectedTreeIndex) && (seg.level === selectedLevelIndex);
      if (isHighlighted){
        ctx.save(); ctx.shadowColor='#fff'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke(); ctx.restore();
      } else {
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
      }
      for (const ci of seg.children){ drawRec(tree.segments[ci], ex, ey); }
    }
    for (const root of roots){ drawRec(root, tree.x, tree.y); }
}