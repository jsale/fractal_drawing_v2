// JavaScript Document

/* ===================== DOM & contexts ===================== */
const controls     = document.querySelector('.controls');
const fernCanvas   = document.getElementById('fernCanvas');
const treeCanvas   = document.getElementById('treeCanvas');
const eraserCanvas = document.getElementById('eraserCanvas');

const fernCtx   = fernCanvas.getContext('2d');
const treeCtx   = treeCanvas.getContext('2d');
const eraserCtx = eraserCanvas.getContext('2d');

/* ===================== STATE ===================== */
const MAX_LEVELS = 10;

// Unified scene graph to hold all drawing operations in chronological order
let scene = [];

// Legacy state arrays, kept for compatibility with UI and selection logic for now
let trees = [];
let ferns = [];
let paths = [];
let snowflakes = [];
let flowers = [];
let vines = [];
let clouds = [];
let eraserStrokes = [];

let selectedTreeIndex = null;
let selectedLevelIndex = null;

let drawing = false, lastP = null, currentStroke = null, captureEl = null;

/* Stamp spacing (px). Set to 0 for maximum frequency while dragging */
let dragSpacing = 4;

let backgroundColor = '#000000'; // bottom canvas
let branchPalette = [];          // global palette used by new trees

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

/* Strong per-stamp RNG for scale / clouds etc. (falls back to LCG) */
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

/* Unique seed per stamp (for color / fern RNG etc.) */
let stampCounter = 0;
function nextStampSeed() {
  const k = (++stampCounter) * 0x9e3779b9;
  return ((Date.now() ^ k) >>> 0);
}

// Simple seeded Perlin noise (2D)
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

/* ==== History ==== */
const history = [];
let histIndex = -1;
function snapshot(){
    // The scene is the single source of truth for history
    const sceneCopy = scene.map(op => {
        // A simple deep copy for the data objects
        const dataCopy = JSON.parse(JSON.stringify(op.data));
        return { type: op.type, data: dataCopy };
    });
    return {
        bg: backgroundColor,
        palette: branchPalette.slice(),
        scene: sceneCopy
    };
}
function pushHistory(){
  history.splice(histIndex+1);
  history.push(snapshot());
  histIndex = history.length-1;
}
function restoreFrom(state){
  backgroundColor = state.bg || '#000000';
  applyBackgroundColor();

  branchPalette = (state.palette && state.palette.length===MAX_LEVELS)
    ? state.palette.slice() : ensureTreeDefaults(MAX_LEVELS);
  refreshPaletteUI();

  scene = state.scene.map(op => ({...op}));

  // Re-populate legacy arrays for UI/selection compatibility
  trees = scene.filter(op => op.type === 'tree').map(op => op.data);
  ferns = scene.filter(op => op.type === 'fern').map(op => op.data);
  paths = scene.filter(op => op.type === 'path').map(op => op.data);
  snowflakes = scene.filter(op => op.type === 'snowflake').map(op => op.data);
  flowers = scene.filter(op => op.type === 'flower').map(op => op.data);
  vines = scene.filter(op => op.type === 'vine').map(op => op.data);
  clouds = scene.filter(op => op.type === 'clouds').map(op => op.data);
  eraserStrokes = scene.filter(op => op.type === 'eraser').map(op => op.data);

  selectedTreeIndex = null; selectedLevelIndex = null;
  if (isAnimating()) { /* next frame draws */ } else { redrawAll(); }
}
function undo(){ if(histIndex>0){ histIndex--; restoreFrom(history[histIndex]); } }
function redo(){ if(histIndex<history.length-1){ histIndex++; restoreFrom(history[histIndex]); } }

/* ===================== Tabs ===================== */
const tabs = document.querySelectorAll('#tabButtons button');
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ===================== UI refs ===================== */
const modeBadge = document.getElementById('modeBadge');
const modeSelect= document.getElementById('modeSelect');

const levelsEl  = document.getElementById('levels');
const baseEl    = document.getElementById('baseLen');
const angleEl   = document.getElementById('angle');
const randEl    = document.getElementById('randomness');
const baseWidthEl = document.getElementById('baseWidth');
const widthScaleEl= document.getElementById('widthScale');

const fernPointsEl = document.getElementById('fernPoints');
const fernSizeEl   = document.getElementById('fernSize');
const fernColorEl  = document.getElementById('fernColor');

const eraserSizeEl = document.getElementById('eraserSize');

// Path controls
const pathWidthEl = document.getElementById('pathWidth');
const pathColorModeEl = document.getElementById('pathColorMode');
const pathSingleColorEl = document.getElementById('pathSingleColor');
const pathSingleColorBoxEl = document.getElementById('pathSingleColorBox');
const pathColorPanelEl = document.getElementById('pathColorPanel');

const levelAlphaEl = document.getElementById('levelAlpha');
const editingLevelText = document.getElementById('editingLevelText');
const levelEditBox = document.getElementById('levelEditBox');
const applyAllEl = document.getElementById('applyAllTrees');

const branchPanel    = document.getElementById('branchColorPanel');
const fernColorPanel = document.getElementById('fernColorPanel');
const backgroundColorEl = document.getElementById('backgroundColor');

// New Object Alpha Controls
const applyNewObjectAlphaEl = document.getElementById('applyNewObjectAlpha');
const newObjectAlphaControlsEl = document.getElementById('newObjectAlphaControls');
const newObjectAlphaSliderEl = document.getElementById('newObjectAlphaSlider');
const newObjectAlphaLabelEl = document.getElementById('newObjectAlphaLabel');

// SVG export options
const svgFernThinEl   = document.getElementById('svgFernThin');
const svgFernThinLabel= document.getElementById('svgFernThinLabel');
const svgGroupByLevelEl = document.getElementById('svgGroupByLevel');

// Snowflake controls
const snowIterEl   = document.getElementById('snowIter');
const snowSizeEl   = document.getElementById('snowSize');
const snowStrokeEl = document.getElementById('snowStroke');
const snowColorEl  = document.getElementById('snowColor');
const snowIterLabel   = document.getElementById('snowIterLabel');
const snowSizeLabel   = document.getElementById('snowSizeLabel');
const snowStrokeLabel = document.getElementById('snowStrokeLabel');

// Flower controls
const flowerIterEl   = document.getElementById('flowerIter');
const flowerAngleEl  = document.getElementById('flowerAngle');
const flowerStepEl   = document.getElementById('flowerStep');
const flowerStrokeEl = document.getElementById('flowerStroke');
const flowerIterLabel   = document.getElementById('flowerIterLabel');
const flowerAngleLabel  = document.getElementById('flowerAngleLabel');
const flowerStepLabel   = document.getElementById('flowerStepLabel');
const flowerStrokeLabel = document.getElementById('flowerStrokeLabel');

// Vine controls
const vineLengthEl  = document.getElementById('vineLength');
const vineNoiseEl   = document.getElementById('vineNoise');
const vineStrokeEl  = document.getElementById('vineStroke');
const vineLengthLabel= document.getElementById('vineLengthLabel');
const vineNoiseLabel = document.getElementById('vineNoiseLabel');
const vineStrokeLabel= document.getElementById('vineStrokeLabel');

// Clouds controls
const cloudCountEl   = document.getElementById('cloudCount');
const cloudMinDEl    = document.getElementById('cloudMinD');
const cloudMaxDEl    = document.getElementById('cloudMaxD');
const cloudMinWEl    = document.getElementById('cloudMinW');
const cloudMaxWEl    = document.getElementById('cloudMaxW');
const cloudBlurEl    = document.getElementById('cloudBlur');
const cloudShadowEl  = document.getElementById('cloudShadowColor');

const cloudCountLabel= document.getElementById('cloudCountLabel');
const cloudMinDLabel = document.getElementById('cloudMinDLabel');
const cloudMaxDLabel = document.getElementById('cloudMaxDLabel');
const cloudMinWLabel = document.getElementById('cloudMinWLabel');
const cloudMaxWLabel = document.getElementById('cloudMaxWLabel');
const cloudBlurLabel = document.getElementById('cloudBlurLabel');

// Non-tree color mode & palette
const otherColorModeEl   = document.getElementById('otherColorMode');
const otherSingleColorEl = document.getElementById('otherSingleColor');
const otherPaletteBox    = document.getElementById('otherPaletteBox');
const otherPalettePickers= document.getElementById('otherPalettePickers');
const otherSingleColorLabel = document.getElementById('otherSingleColorLabel');

let otherPalette = [];
let otherPaletteInputs = [];

/* ===================== Playback controls ===================== */
const playbackBtn = document.getElementById('playbackBtn');
const playbackSpeedEl = document.getElementById('playbackSpeed');
const playbackSpeedLabel = document.getElementById('playbackSpeedLabel');
let isPlaying = false;


/* Non-tree random scale controls */
const otherScaleMinEl = document.getElementById('otherScaleMin');
const otherScaleMaxEl = document.getElementById('otherScaleMax');
const otherScaleMinLabel = document.getElementById('otherScaleMinLabel');
const otherScaleMaxLabel = document.getElementById('otherScaleMaxLabel');

/* Ensure Mode has new options */
(function ensureModeOptions(){
  if (!modeSelect) return;
  const has = val => Array.from(modeSelect.options).some(o=>o.value===val);
  if (!has('path')){
    const opt=document.createElement('option'); opt.value='path'; opt.textContent='Path';
    const eraserOpt = modeSelect.querySelector('option[value="eraser"]');
    if (eraserOpt) modeSelect.insertBefore(opt, eraserOpt); else modeSelect.appendChild(opt);
  }
  if (!has('snowflake')){
    const opt=document.createElement('option'); opt.value='snowflake'; opt.textContent='Snowflake'; modeSelect.appendChild(opt);
  }
  if (!has('flower')){
    const opt=document.createElement('option'); opt.value='flower'; opt.textContent='Flower'; modeSelect.appendChild(opt);
  }
  if (!has('vine')){
    const opt=document.createElement('option'); opt.value='vine'; opt.textContent='Vine'; modeSelect.appendChild(opt);
  }
  if (!has('clouds')){
    const opt=document.createElement('option'); opt.value='clouds'; opt.textContent='Clouds'; modeSelect.appendChild(opt);
  }
})();

/* ===================== Animation controls ===================== */
const animateWindEl  = document.getElementById('animateWind');
const windAmpEl      = document.getElementById('windAmp');
const windSpeedEl    = document.getElementById('windSpeed');
const windAmpLabel   = document.getElementById('windAmpLabel');
const windSpeedLabel = document.getElementById('windSpeedLabel');

let animReq = null;

/* ===================== Sizing ===================== */
function resizeCanvases(){
  const w = window.innerWidth  - (controls ? controls.offsetWidth : 0);
  const h = window.innerHeight - (document.querySelector('header') ? document.querySelector('header').offsetHeight : 0);
  [fernCanvas, treeCanvas, eraserCanvas].forEach(c=>{
    c.width = w; c.height = h;
    c.style.width = w+'px'; c.style.height = h+'px';
  });
  applyBackgroundColor();
  if (!isAnimating()) redrawAll();
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

/* ===================== UI helpers ===================== */
function updateUIValues(){
  const setText = (el, txt)=>{ if (el) el.textContent = txt; };
  setText(levelsLabel, levelsEl ? levelsEl.value : '');
  setText(lenLabel,    baseEl ? baseEl.value : '');
  setText(angleLabel,  angleEl ? angleEl.value : '');
  setText(randLabel,   randEl ? Number(randEl.value).toFixed(2) : '');
  setText(widthLabel,  baseWidthEl ? baseWidthEl.value : '');
  setText(scaleLabel,  widthScaleEl ? Number(widthScaleEl.value).toFixed(2) : '');
  setText(pathWidthLabel, pathWidthEl ? pathWidthEl.value : '');
  setText(fernPointsLabel, fernPointsEl ? fernPointsEl.value : '');
  setText(fernSizeLabel,   fernSizeEl ? Number(fernSizeEl.value).toFixed(2) : '');
  setText(eraserSizeLabel, eraserSizeEl ? eraserSizeEl.value : '');

  if (svgFernThinEl && svgFernThinLabel) svgFernThinLabel.textContent = `${svgFernThinEl.value}×`;
  if (windAmpEl && windAmpLabel)       windAmpLabel.textContent   = Number(windAmpEl.value).toFixed(0);
  if (windSpeedEl && windSpeedLabel)   windSpeedLabel.textContent = Number(windSpeedEl.value).toFixed(2);

  if (snowIterEl && snowIterLabel)     snowIterLabel.textContent  = snowIterEl.value;
  if (snowSizeEl && snowSizeLabel)     snowSizeLabel.textContent  = Number(snowSizeEl.value).toFixed(2);
  if (snowStrokeEl && snowStrokeLabel) snowStrokeLabel.textContent= Number(snowStrokeEl.value).toFixed(1);

  if (flowerIterEl && flowerIterLabel)     flowerIterLabel.textContent   = flowerIterEl.value;
  if (flowerAngleEl && flowerAngleLabel)   flowerAngleLabel.textContent  = Number(flowerAngleEl.value).toFixed(0);
  if (flowerStepEl && flowerStepLabel)     flowerStepLabel.textContent   = Number(flowerStepEl.value).toFixed(2);
  if (flowerStrokeEl && flowerStrokeLabel) flowerStrokeLabel.textContent = Number(flowerStrokeEl.value).toFixed(1);

  if (vineLengthEl && vineLengthLabel) vineLengthLabel.textContent = vineLengthEl.value;
  if (vineNoiseEl && vineNoiseLabel)   vineNoiseLabel.textContent  = Number(vineNoiseEl.value).toFixed(3);
  if (vineStrokeEl && vineStrokeLabel) vineStrokeLabel.textContent = Number(vineStrokeEl.value).toFixed(1);

  if (cloudCountEl && cloudCountLabel) cloudCountLabel.textContent = cloudCountEl.value;
  if (cloudMinDEl && cloudMinDLabel)   cloudMinDLabel.textContent  = cloudMinDEl.value;
  if (cloudMaxDEl && cloudMaxDLabel)   cloudMaxDLabel.textContent  = cloudMaxDEl.value;
  if (cloudMinWEl && cloudMinWLabel)   cloudMinWLabel.textContent  = Number(cloudMinWEl.value).toFixed(1);
  if (cloudMaxWEl && cloudMaxWLabel)   cloudMaxWLabel.textContent  = Number(cloudMaxWEl.value).toFixed(1);
  if (cloudBlurEl && cloudBlurLabel)   cloudBlurLabel.textContent  = cloudBlurEl.value;

  if (otherScaleMinEl && otherScaleMinLabel) otherScaleMinLabel.textContent = `${Number(otherScaleMinEl.value).toFixed(2)}×`;
  if (otherScaleMaxEl && otherScaleMaxLabel) otherScaleMaxLabel.textContent = `${Number(otherScaleMaxEl.value).toFixed(2)}×`;

  if (newObjectAlphaSliderEl && newObjectAlphaLabelEl) newObjectAlphaLabelEl.textContent = Number(newObjectAlphaSliderEl.value).toFixed(2);
}
const levelsLabel = document.getElementById('levelsLabel');
const lenLabel    = document.getElementById('lenLabel');
const angleLabel  = document.getElementById('angleLabel');
const randLabel   = document.getElementById('randLabel');
const widthLabel  = document.getElementById('widthLabel');
const scaleLabel  = document.getElementById('scaleLabel');
const pathWidthLabel = document.getElementById('pathWidthLabel');
const fernPointsLabel = document.getElementById('fernPointsLabel');
const fernSizeLabel   = document.getElementById('fernSizeLabel');
const eraserSizeLabel = document.getElementById('eraserSizeLabel');

[
  levelsEl,baseEl,angleEl,randEl,baseWidthEl,widthScaleEl,pathWidthEl,fernPointsEl,fernSizeEl,eraserSizeEl,
  windAmpEl,windSpeedEl, svgFernThinEl,
  snowIterEl,snowSizeEl,snowStrokeEl,
  flowerIterEl,flowerAngleEl,flowerStepEl,flowerStrokeEl,
  vineLengthEl,vineNoiseEl,vineStrokeEl,
  cloudCountEl,cloudMinDEl,cloudMaxDEl,cloudMinWEl,cloudMaxWEl,cloudBlurEl,
  otherScaleMinEl, otherScaleMaxEl, newObjectAlphaSliderEl
].filter(Boolean).forEach(el=>el.addEventListener('input',updateUIValues));
updateUIValues();

function updateModeUI(){
  const mode = modeSelect ? modeSelect.value : 'tree';
  if (modeBadge) modeBadge.textContent = mode.charAt(0).toUpperCase()+mode.slice(1);
  const show = (id,on)=>{ const n=document.getElementById(id); if(n) n.style.display=on?'block':'none'; };
  show('treeParams',   mode==='tree');
  show('fernParams',   mode==='fern');
  show('pathParams',   mode==='path');
  show('snowParams',   mode==='snowflake');
  show('flowerParams', mode==='flower');
  show('vineParams',   mode==='vine');
  show('cloudParams',  mode==='clouds');
  show('eraserParams', mode==='eraser');
  
  // Color panels
  const showColor = (el, on) => { if(el) el.style.display = on ? 'block' : 'none'; };
  showColor(branchPanel, mode === 'tree');
  if(branchPanel && mode === 'tree') { branchPanel.classList.add('visible'); branchPanel.setAttribute('aria-hidden','false'); }
  else if (branchPanel) { branchPanel.classList.remove('visible'); branchPanel.setAttribute('aria-hidden','true'); }
  
  showColor(fernColorPanel, mode === 'fern');
  showColor(pathColorPanelEl, mode === 'path');

  if(levelEditBox) levelEditBox.style.display = (mode==='tree') ? levelEditBox.style.display : 'none';
}
if (modeSelect) modeSelect.addEventListener('change', updateModeUI);
if (pathColorModeEl) {
    pathColorModeEl.addEventListener('change', () => {
        if (pathSingleColorBoxEl) pathSingleColorBoxEl.style.display = pathColorModeEl.value === 'single' ? 'block' : 'none';
    });
}
updateModeUI();


/* ===== New Object Alpha UI Logic ===== */
if (applyNewObjectAlphaEl) {
    applyNewObjectAlphaEl.addEventListener('change', () => {
        if(newObjectAlphaControlsEl) {
            newObjectAlphaControlsEl.style.display = applyNewObjectAlphaEl.checked ? 'block' : 'none';
        }
    });
}

/* ===== Background color binding ===== */
function applyBackgroundColor(){
  if (fernCanvas) fernCanvas.style.backgroundColor  = backgroundColor;
  if (treeCanvas) treeCanvas.style.backgroundColor  = 'transparent';
  if (eraserCanvas) eraserCanvas.style.backgroundColor= 'transparent';
}
if (backgroundColorEl){
  backgroundColor = backgroundColorEl.value || backgroundColor;
  applyBackgroundColor();
  backgroundColorEl.addEventListener('input', ()=>{
    backgroundColor = backgroundColorEl.value || '#000000';
    applyBackgroundColor();
    pushHistory();
  });
}

/* ===================== Colors & palette UI (GLOBAL TREE) ===================== */
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
function ensureTreeDefaults(levels){
  const arr = [];
  for(let i=0;i<levels;i++){
    const h = (20 + i*20) % 360;
    arr.push(hslToHex(h,60,60));
  }
  return arr;
}
let paletteInputs = [];
function initPaletteUI(){
  if (!branchPanel) return;
  if (branchPalette.length !== MAX_LEVELS) branchPalette = ensureTreeDefaults(MAX_LEVELS);
  branchPanel.innerHTML = '';
  paletteInputs = [];
  for(let i=0;i<MAX_LEVELS;i++){
    const row = document.createElement('div');
    row.className = 'colorRow';
    const lab = document.createElement('div');
    lab.textContent = 'Level '+(i+1);
    const input = document.createElement('input');
    input.type='color';
    input.value = branchPalette[i];
    input.addEventListener('input', ()=>{
      branchPalette[i] = input.value;

      const applyToAll = applyAllEl && applyAllEl.checked;

      if (applyToAll) {
        trees.forEach(t => {
            if (i < t.levels) {
                t.branchColors[i] = input.value;
            }
        });
      } else if (selectedTreeIndex != null) {
        const t = trees[selectedTreeIndex];
        if (i < t.levels) {
            t.branchColors[i] = input.value;
        }
      }

      pushHistory();
      if (!isAnimating()) {
          redrawAll();
      }
    });
    row.appendChild(lab); row.appendChild(input);
    branchPanel.appendChild(row);
    paletteInputs.push(input);
  }
}
function refreshPaletteUI(){
  if (!paletteInputs || paletteInputs.length !== MAX_LEVELS) return;
  for(let i=0;i<MAX_LEVELS;i++){
    paletteInputs[i].value = branchPalette[i];
  }
}
initPaletteUI();

/* ===================== Non-tree palette ===================== */
function rebuildOtherPalettePickers(levelCount){
  if (!otherPalettePickers) return;
  otherPalettePickers.innerHTML = '';
  otherPaletteInputs = [];
  otherPalette = (branchPalette && branchPalette.length)
    ? branchPalette.slice(0, levelCount)
    : ensureTreeDefaults(levelCount);

  for (let i=0;i<levelCount;i++){
    const row = document.createElement('div');
    row.className = 'colorRow';
    const lab = document.createElement('div');
    lab.textContent = 'Palette ' + (i+1);
    const input = document.createElement('input');
    input.type = 'color';
    input.value = otherPalette[i];
    input.addEventListener('input', ()=>{ otherPalette[i] = input.value; });
    row.appendChild(lab); row.appendChild(input);
    otherPalettePickers.appendChild(row);
    otherPaletteInputs.push(input);
  }
}
(function initOtherPaletteUI(){
  const initialLevels = parseInt(levelsEl ? levelsEl.value : 5, 10);
  if (otherPalettePickers) rebuildOtherPalettePickers(initialLevels);
})();
function updateOtherColorUI(){
  if (!otherColorModeEl || !otherSingleColorEl) return;
  const mode = otherColorModeEl.value || 'single';
  const showSingle = (mode === 'single');
  if (otherSingleColorEl) otherSingleColorEl.style.display = showSingle ? '' : 'none';
  if (otherSingleColorLabel) otherSingleColorLabel.style.display = showSingle ? '' : 'none';
}
if (otherColorModeEl) otherColorModeEl.addEventListener('change', updateOtherColorUI);
updateOtherColorUI();

function pickNonTreeColor(seed){
  const mode = (otherColorModeEl && otherColorModeEl.value) || 'single';
  if (mode === 'single'){
    return (otherSingleColorEl && otherSingleColorEl.value) || (fernColorEl && fernColorEl.value) || '#58c470';
  }
  const pal = (otherPalette && otherPalette.length) ? otherPalette : [ '#58c470' ];
  const rng = mulberry32(seed || newSeed());
  const idx = Math.floor(rng() * pal.length) % pal.length;
  return pal[idx];
}

/* Keep non-tree palette count in sync with tree levels */
if (levelsEl){
  levelsEl.addEventListener('input', ()=>{
    const L = parseInt(levelsEl.value,10);
    if (otherPalettePickers) rebuildOtherPalettePickers(L);
  });
}

/* ===================== Get new object alpha ===================== */
function getNewObjectAlpha() {
    if (applyNewObjectAlphaEl && applyNewObjectAlphaEl.checked) {
        return parseFloat(newObjectAlphaSliderEl.value);
    }
    return 1.0; // Default to fully opaque
}

/* ===================== Object Build Functions ===================== */
function buildTreeSegments(tree){
  const rand = mulberry32(tree.rngSeed);
  tree.segments = [];
  let segIndex = -1;

  function pushSeg(obj){
    tree.segments.push(obj);
    return (++segIndex);

  }

  function branch(x,y,len,ang,depth,level,parentIdx){
    if(depth<=0 || len<0.6) return null;

    const x2 = x + len*Math.cos(ang);
    const y2 = y - len*Math.sin(ang);
    const idx = pushSeg({ level, len, baseAng: ang, parent: (parentIdx==null ? -1 : parentIdx), children: [], x1:x, y1:y, x2, y2 });

    const red = 0.68 + (rand()-0.5)*(tree.randomness||0);
    const nl  = len * red;
    const jitter = (rand()-0.5)*(tree.randomness||0)*0.15;
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
  ctx.lineCap='round'; ctx.lineJoin='round';
  for(const seg of tree.segments){
    const width = Math.max(0.1, (tree.baseWidth || 12) * Math.pow(tree.widthScale ?? 0.68, seg.level));
    const stroke = tree.branchColors[seg.level] || '#fff';
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

/* ===================== Global redraw ===================== */
function redrawAll(){
    // Clear canvases
    fernCtx.clearRect(0,0,fernCanvas.width,fernCanvas.height);
    treeCtx.clearRect(0,0,treeCanvas.width,treeCanvas.height);

    // Iterate through the master scene and draw/erase in order
    for (const op of scene) {
        switch(op.type) {
            case 'fern':      drawFernInstance(fernCtx, op.data); break;
            case 'tree':      drawTreeFromSegments(treeCtx, op.data); break;
            case 'path':      drawSinglePath(treeCtx, op.data); break;
            case 'snowflake': drawSnowflakes(treeCtx, op.data); break;
            case 'flower':    drawFlowers(treeCtx, op.data); break;
            case 'vine':      drawVines(treeCtx, op.data); break;
            case 'clouds':    drawClouds(treeCtx, op.data); break;
            case 'eraser':
                applyEraser(fernCtx, op.data);
                applyEraser(treeCtx, op.data);
                break;
        }
    }
    // Reset any lingering canvas state
    treeCtx.globalAlpha = 1.0;
    fernCtx.globalAlpha = 1.0;
}

/* ===================== Wind animation ===================== */
function isAnimating(){ return animateWindEl && animateWindEl.value === 'sway'; }
function startAnimation(){
  if (animReq) return;
  const tick = (now)=>{ redrawAnimatedScene(now/1000); animReq = requestAnimationFrame(tick); };
  animReq = requestAnimationFrame(tick);
}
function stopAnimation(){
  if (animReq){ cancelAnimationFrame(animReq); animReq = null; }
  redrawAll();
}
if (animateWindEl) animateWindEl.addEventListener('change', ()=>{ isAnimating() ? startAnimation() : stopAnimation(); });
[windAmpEl, windSpeedEl].filter(Boolean).forEach(el=> el.addEventListener('input', ()=> { if (isAnimating() && !animReq) startAnimation(); }) );

function drawAnimatedTree(ctx, tree, time) {
    const amp   = windAmpEl ? (parseFloat(windAmpEl.value) * Math.PI/180) : 0;
    const speed = windSpeedEl ? parseFloat(windSpeedEl.value) : 0.2;
    const phase = (tree.rngSeed % 1000) / 1000 * Math.PI * 2;

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
      const stroke = tree.branchColors[seg.level] || '#fff', la = tree.levelAlphas[seg.level] ?? 1;
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

function redrawAnimatedScene(time) {
    fernCtx.clearRect(0,0,fernCanvas.width,fernCanvas.height);
    treeCtx.clearRect(0,0,treeCanvas.width,treeCanvas.height);

    for (const op of scene) {
        switch(op.type) {
            case 'tree':      drawAnimatedTree(treeCtx, op.data, time); break;
            case 'fern':      drawFernInstance(fernCtx, op.data); break;
            case 'path':      drawSinglePath(treeCtx, op.data); break;
            case 'snowflake': drawSnowflakes(treeCtx, op.data); break;
            case 'flower':    drawFlowers(treeCtx, op.data); break;
            case 'vine':      drawVines(treeCtx, op.data); break;
            case 'clouds':    drawClouds(treeCtx, op.data); break;
            case 'eraser':
                applyEraser(fernCtx, op.data);
                applyEraser(treeCtx, op.data);
                break;
        }
    }
    treeCtx.globalAlpha = 1.0;
    fernCtx.globalAlpha = 1.0;
}


/* ===================== Utilities ===================== */
function getP(evt){ const r = evt.currentTarget.getBoundingClientRect(); return { x: evt.clientX - r.left, y: evt.clientY - r.top }; }
function getNonTreeScale(){
  const minDefault = 0.8, maxDefault = 1.2;
  let min = otherScaleMinEl ? parseFloat(otherScaleMinEl.value) : minDefault;
  let max = otherScaleMaxEl ? parseFloat(otherScaleMaxEl.value) : maxDefault;
  if (!isFinite(min)) min = minDefault; if (!isFinite(max)) max = maxDefault;
  if (max < min) [min, max] = [max, min];
  return min + (max - min) * randUnit();
}

function createTreeFromUI(x,y){
  const levels = parseInt(levelsEl.value, 10);
  const t = { x,y, baseLen: parseFloat(baseEl.value), levels, angle: parseFloat(angleEl.value), randomness: parseFloat(randEl.value),
    baseWidth: parseFloat(baseWidthEl.value), widthScale: parseFloat(widthScaleEl.value),
    branchColors: branchPalette.slice(0, levels), levelAlphas: new Array(levels).fill(getNewObjectAlpha()),
    rngSeed: newSeed(), segments: [] };
  buildTreeSegments(t);
  return t;
}
function createSnowflakeFromUI(cx, cy){
  const s = { cx, cy, size: Math.min(treeCanvas.width, treeCanvas.height) * parseFloat(snowSizeEl.value), iter: parseInt(snowIterEl.value, 10),
    color: snowColorEl.value, stroke: parseFloat(snowStrokeEl.value), segments: [], alpha: getNewObjectAlpha() };
  buildKochSnowflake(s); return s;
}
function createFlowerFromUI(cx, cy){
  const fl = { cx, cy, iter: parseInt(flowerIterEl.value, 10), angle: parseFloat(flowerAngleEl.value),
    step: Math.min(treeCanvas.width, treeCanvas.height) * parseFloat(flowerStepEl.value), stroke: parseFloat(flowerStrokeEl.value),
    rngSeed: newSeed(), segments: [], alpha: getNewObjectAlpha() };
  buildFlowerSegments(fl); return fl;
}
function createVineFromUI(cx, cy){
  const v = { cx, cy, length: parseInt(vineLengthEl.value, 10), noise: parseFloat(vineNoiseEl.value), stroke: parseFloat(vineStrokeEl.value),
    rngSeed: newSeed(), points: [], step: 4, alpha: getNewObjectAlpha() };
  buildVinePolyline(v); return v;
}
function createCloudFromUI(cx, cy){
  const count = parseInt(cloudCountEl ? cloudCountEl.value : 10, 10);
  let dmin = parseFloat(cloudMinDEl ? cloudMinDEl.value : 20);
  let dmax = parseFloat(cloudMaxDEl ? cloudMaxDEl.value : 120);
  if (dmax < dmin) [dmin, dmax] = [dmax, dmin];

  let wmin = parseFloat(cloudMinWEl ? cloudMinWEl.value : 1);
  let wmax = parseFloat(cloudMaxWEl ? cloudMaxWEl.value : 4);
  if (wmax < wmin) [wmin, wmax] = [wmax, wmin];

  const blur = parseInt(cloudBlurEl ? cloudBlurEl.value : 8, 10);
  const shadowColor = (cloudShadowEl && cloudShadowEl.value) || '#555555';

  const circles = [];
  const seed = nextStampSeed();
  const colorSeed = seed;
  for (let i=0;i<count;i++){
    const d = dmin + (dmax - dmin)*randUnit();
    const r = d * 0.5;
    const w = wmin + (wmax - wmin)*randUnit();
    const color = pickNonTreeColor(colorSeed + i);
    circles.push({ r, w, color });
  }

  return { cx, cy, circles, blur, shadowColor, alpha: getNewObjectAlpha() };
}

function hitTestBranch(p){
  const tol=6, tol2=tol*tol;
  for(let ti=trees.length-1; ti>=0; ti--){
    const t = trees[ti];
    for(const seg of t.segments){
      const {x1,y1,x2,y2,level}=seg; const vx=x2-x1, vy=y2-y1, wx=p.x-x1, wy=p.y-y1;
      const c1=vx*wx+vy*wy, c2=vx*vx+vy*vy; let b = (c2>0)? c1/c2 : 0; b=Math.max(0,Math.min(1,b));
      const px=x1+b*vx, py=y1+b*vy; const dx=p.x-px, dy=p.y-py;
      if(dx*dx+dy*dy<=tol2) {
          selectedTreeIndex = trees.indexOf(t);
          selectedLevelIndex = level;
          return;
      }
    }
  }
  selectedTreeIndex = null;
  selectedLevelIndex = null;
}

/* ===================== Pointer handlers ===================== */
function onPointerDown(e){
  e.preventDefault();
  if (e.currentTarget.setPointerCapture) { try { e.currentTarget.setPointerCapture(e.pointerId); captureEl = e.currentTarget; } catch {} }
  drawing = true; const p = getP(e); lastP = p;
  const mode = modeSelect.value;
  if (mode === 'eraser' || mode === 'path') {
    eraserCtx.clearRect(0,0,eraserCanvas.width,eraserCanvas.height); spawnAt(p);
  } else if (mode === 'tree') {
    hitTestBranch(p);
    if (selectedTreeIndex !== null) {
      if (levelEditBox){
        levelEditBox.style.display='block'; editingLevelText.textContent = 'Level ' + (selectedLevelIndex+1);
        levelAlphaEl.value = trees[selectedTreeIndex].levelAlphas[selectedLevelIndex] ?? 1;
        const lab = document.getElementById('levelAlphaLabel'); if (lab) lab.textContent = Number(levelAlphaEl.value).toFixed(2);
      }
      if (!isAnimating()) redrawAll();
    } else { spawnAt(p); }
  } else { spawnAt(p); }
}
function onPointerMove(e){
  if (!drawing) return;
  const p = getP(e); const mode = modeSelect.value;
  if (mode === 'eraser' || mode === 'path') {
    if (!currentStroke) return;
    currentStroke.points.push(p);
    eraserCtx.clearRect(0,0,eraserCanvas.width,eraserCanvas.height);
    if (mode === 'eraser') {
      eraserCtx.save();
      eraserCtx.strokeStyle='rgba(255,255,255,.5)'; eraserCtx.lineWidth=currentStroke.size; eraserCtx.lineCap='round'; eraserCtx.lineJoin='round';
      if (currentStroke.points.length > 1) {
          eraserCtx.beginPath();
          eraserCtx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
          for(let i=1; i<currentStroke.points.length; i++){
              eraserCtx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
          }
          eraserCtx.stroke();
      }
      eraserCtx.restore();
    } else { // path preview
        drawSinglePath(eraserCtx, currentStroke);
    }
  } else {
    const dx=p.x-lastP.x, dy=p.y-lastP.y;
    if (dragSpacing <= 0 || (dx*dx + dy*dy >= dragSpacing*dragSpacing)) { lastP=p; spawnAt(p); }
  }
}
function onPointerEnd(e){
  if (!drawing) return;
  drawing = false;
  if (captureEl && captureEl.releasePointerCapture) { try { captureEl.releasePointerCapture(e.pointerId); } catch {} captureEl = null; }
  const mode = modeSelect.value;
  if ((mode === 'eraser' || mode === 'path') && currentStroke){
    const op = { type: mode, data: currentStroke };
    scene.push(op);
    if(mode === 'eraser') eraserStrokes.push(currentStroke);
    else paths.push(currentStroke);
    
    pushHistory();
    eraserCtx.clearRect(0,0,eraserCanvas.width,eraserCanvas.height);
    currentStroke = null;
    redrawAll();
  }
}
[fernCanvas, treeCanvas, eraserCanvas].forEach(c=>{ c.addEventListener('pointerdown', onPointerDown); c.addEventListener('pointermove', onPointerMove); c.addEventListener('pointerup', onPointerEnd); c.addEventListener('pointercancel', onPointerEnd); c.addEventListener('pointerleave', onPointerEnd); });

/* ===================== Spawning ===================== */
function spawnAt(p){
  const mode = modeSelect.value;
  let newOp = null;

  if(mode==='path' || mode==='eraser'){
      if(mode==='path') {
          currentStroke = { points:[p], strokeWidth: parseInt(pathWidthEl.value, 10), alpha: getNewObjectAlpha(), colorMode: pathColorModeEl.value, singleColor: pathSingleColorEl.value };
          drawSinglePath(eraserCtx, currentStroke);
      } else {
          currentStroke = {size: parseInt(eraserSizeEl.value, 10), points:[p]};
      }
      return;
  }

  if(mode==='tree'){
    const t = createTreeFromUI(p.x,p.y);
    trees.push(t);
    selectedTreeIndex = trees.length-1; selectedLevelIndex=null;
    if (levelEditBox) levelEditBox.style.display='none';
    newOp = {type: 'tree', data: t};
  } else if(mode==='fern'){
    const sizeBase = Math.min(fernCanvas.width, fernCanvas.height); const seed = nextStampSeed(); const scale = getNonTreeScale();
    const f = { cx:p.x, cy:p.y, size: sizeBase * parseFloat(fernSizeEl.value) * scale, points: parseInt(fernPointsEl.value, 10),
      color: pickNonTreeColor(seed), rngSeed: seed, alpha: getNewObjectAlpha() };
    ferns.push(f);
    newOp = {type: 'fern', data: f};
  } else if(mode==='snowflake'){
    const s = createSnowflakeFromUI(p.x, p.y); s.rngSeed = nextStampSeed(); s.size *= getNonTreeScale(); s.color = pickNonTreeColor(s.rngSeed); snowflakes.push(s);
    newOp = {type: 'snowflake', data: s};
  } else if(mode==='flower'){
    const fl = createFlowerFromUI(p.x, p.y); fl.rngSeed = nextStampSeed(); fl.step *= getNonTreeScale(); fl.color = pickNonTreeColor(fl.rngSeed); flowers.push(fl);
    newOp = {type: 'flower', data: fl};
  } else if(mode==='vine'){
    const v = createVineFromUI(p.x, p.y); v.rngSeed = nextStampSeed(); const scale = getNonTreeScale(); v.length = Math.max(10, Math.round(v.length * scale)); v.step = 4 * scale; v.color = pickNonTreeColor(v.rngSeed); vines.push(v);
    newOp = {type: 'vine', data: v};
  } else if(mode==='clouds'){
    const c = createCloudFromUI(p.x,p.y);
    clouds.push(c);
    newOp = {type: 'clouds', data: c};
  }
  
  if (newOp) {
      scene.push(newOp);
      pushHistory();
      if (!isAnimating()) {
        redrawAll();
      }
  }
}

/* ===================== Level alpha editing (trees) ===================== */
if (levelAlphaEl){
  levelAlphaEl.addEventListener('input', ()=>{
    if(selectedTreeIndex == null) return;
    const val = Number(levelAlphaEl.value); const lab = document.getElementById('levelAlphaLabel'); if (lab) lab.textContent = val.toFixed(2);
    const applyToAll = applyAllEl && applyAllEl.checked;
    if (applyToAll) { trees.forEach(t => { if (selectedLevelIndex < t.levels) { t.levelAlphas[selectedLevelIndex] = val; } });
    } else if (selectedTreeIndex != null) {
      const t = trees[selectedTreeIndex]; if (selectedLevelIndex < t.levels) { t.levelAlphas[selectedLevelIndex] = val; }
    } else { return; }
    pushHistory(); if (!isAnimating()) redrawAll();
  });
}

/* ===================== Buttons ===================== */
const undoBtn = document.getElementById('undoBtn'); const redoBtn = document.getElementById('redoBtn'); const clearBtn= document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn'); const exportSvgBtn = document.getElementById('exportSvgBtn'); const exportPngLayersBtn = document.getElementById('exportPngLayersBtn');
if (undoBtn) undoBtn.addEventListener('click', undo); if (redoBtn) redoBtn.addEventListener('click', redo);
if (clearBtn) clearBtn.addEventListener('click', ()=>{ scene=[]; trees=[]; ferns=[]; paths=[]; snowflakes=[]; flowers=[]; vines=[]; clouds=[]; eraserStrokes=[]; selectedTreeIndex=null; selectedLevelIndex=null; pushHistory(); if (!isAnimating()) redrawAll(); });
if (saveBtn) saveBtn.addEventListener('click', ()=>{ const out = document.createElement('canvas'); out.width = treeCanvas.width; out.height = treeCanvas.height; const octx = out.getContext('2d'); octx.fillStyle = backgroundColor; octx.fillRect(0,0,out.width,out.height); redrawAll(); octx.drawImage(fernCanvas,0,0); octx.drawImage(treeCanvas,0,0); const link = document.createElement('a'); link.download='fractal-forest.png'; link.href = out.toDataURL('image/png'); link.click(); });
if (playbackBtn) playbackBtn.addEventListener('click', playHistory);

function playHistory() {
    if (isPlaying || history.length < 2) return;
    isPlaying = true;
    playbackBtn.disabled = true;

    let i = 0;
    function nextFrame() {
        if (i >= history.length) {
            isPlaying = false;
            playbackBtn.disabled = false;
            return;
        }
        restoreFrom(history[i]);
        i++;
        const delay = 1001 - parseInt(playbackSpeedEl.value, 10);
        setTimeout(nextFrame, delay);
    }
    
    // Start with a blank slate
    restoreFrom({ bg: backgroundColor, palette: branchPalette, scene: [] });
    setTimeout(nextFrame, 500);
}

/* ===================== EXPORTS (SVG & PNG layers) ===================== */
function download(filename, text) { const a = document.createElement('a'); const blob = new Blob([text], {type: 'image/svg+xml'}); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000); }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }
function buildSVG(){
  // This function would also benefit from the scene graph, but for now we leave it as is.
  const w = treeCanvas.width, h = treeCanvas.height; const thinStep = Math.max(1, parseInt(svgFernThinEl.value, 10));
  const parts = []; parts.push(`<?xml version="1.0" encoding="UTF-8"?>`); parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`); parts.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="${escapeAttr(backgroundColor)}"/>`);
  parts.push(`<g id="ferns">`); for (const f of ferns){ parts.push(`<g fill="${escapeAttr(f.color || '#58c470')}" fill-opacity="${f.alpha ?? 1}" shape-rendering="crispEdges">`); const rand = mulberry32(f.rngSeed); let x=0,y=0; for(let i=0;i<f.points;i++){ const r = rand(); let nx, ny; if (r<0.01){ nx=0; ny=0.16*y; } else if (r<0.86){ nx=0.85*x + 0.04*y; ny=-0.04*x + 0.85*y + 1.6; } else if (r<0.93){ nx=0.2*x - 0.26*y; ny=0.23*x + 0.22*y + 1.6; } else { nx=-0.15*x + 0.28*y; ny=0.26*x + 0.24*y + 0.44; } x=nx; y=ny; if (i % thinStep !== 0) continue; const px = Math.round(f.cx + x*f.size), py = Math.round(f.cy - y*f.size); parts.push(`<rect x="${px}" y="${py}" width="1" height="1"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="paths" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for(const p of paths){ if(p.colorMode === 'single'){ parts.push(`<polyline points="${p.points.map(pt=>`${pt.x},${pt.y}`).join(' ')}" stroke="${escapeAttr(p.singleColor)}" stroke-width="${p.strokeWidth}" stroke-opacity="${p.alpha ?? 1}"/>`); } else { if(!branchPalette || branchPalette.length === 0) continue; parts.push(`<g stroke-width="${p.strokeWidth}" stroke-opacity="${p.alpha ?? 1}">`); for(let i=0; i<p.points.length-1; i++){ parts.push(`<line x1="${p.points[i].x}" y1="${p.points[i].y}" x2="${p.points[i+1].x}" y2="${p.points[i+1].y}" stroke="${escapeAttr(branchPalette[i % branchPalette.length])}"/>`); } parts.push(`</g>`); } } parts.push(`</g>`);
  parts.push(`<g id="snowflakes" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const s of snowflakes){ parts.push(`<g class="snowflake" opacity="${s.alpha ?? 1}" stroke="${escapeAttr(s.color || '#a0d8ff')}" stroke-width="${s.stroke || 1.5}">`); for (const seg of s.segments){ parts.push(`<line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="flowers" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const fl of flowers){ parts.push(`<g class="flower" opacity="${fl.alpha ?? 1}" stroke="${escapeAttr(fl.color || '#ff88cc')}" stroke-width="${fl.stroke || 1.5}">`); for (const seg of fl.segments){ parts.push(`<line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="vines" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const v of vines){ parts.push(`<polyline class="vine" points="${v.points.map(pt=>`${pt.x},${pt.y}`).join(' ')}" stroke="${escapeAttr(v.color || '#8fd18f')}" stroke-width="${v.stroke || 2}" stroke-opacity="${v.alpha ?? 1}" fill="none"/>`); } parts.push(`</g>`);
  parts.push(`<g id="clouds" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const c of clouds){ parts.push(`<g class="cloud" opacity="${c.alpha ?? 1}">`); for (const k of c.circles){ parts.push(`<circle cx="${c.cx}" cy="${c.cy}" r="${Math.max(0.5,k.r)}" stroke="${escapeAttr(k.color || '#ffffff')}" stroke-width="${k.w || 2}"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="trees" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const t of trees){ const buckets = new Map(); for (const seg of t.segments){ if (!buckets.has(seg.level)) buckets.set(seg.level, []); buckets.get(seg.level).push(seg); } parts.push(`<g class="tree">`); for (const [lvl, arr] of buckets){ const stroke = t.branchColors[lvl] || '#ffffff', la = t.levelAlphas[lvl] ?? 1, op = Math.max(0, Math.min(1, la)); parts.push(`<g data-level="${lvl}" stroke="${escapeAttr(stroke)}" stroke-opacity="${op}" fill="none">`); for (const seg of arr){ const width = Math.max(0.1, (t.baseWidth || 12) * Math.pow(t.widthScale ?? 0.68, seg.level)); parts.push(`<line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}" stroke-width="${width}"/>`); } parts.push(`</g>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`</svg>`); return parts.join('\n');
}
if (exportSvgBtn) exportSvgBtn.addEventListener('click', ()=> download('fractal-forest.svg', buildSVG()) );
function saveCanvasToFile(canvas, name){ const link = document.createElement('a'); link.download = name; link.href = canvas.toDataURL('image/png'); link.click(); }
function makeSolidBackgroundCanvas(color){ const c = document.createElement('canvas'); c.width = treeCanvas.width; c.height = treeCanvas.height; const cx = c.getContext('2d'); cx.fillStyle = color; cx.fillRect(0,0,c.width,c.height); return c; }
function makeCombinedCanvas(){ const out = document.createElement('canvas'); out.width = treeCanvas.width; out.height = treeCanvas.height; const octx = out.getContext('2d'); octx.fillStyle = backgroundColor; octx.fillRect(0,0,out.width,out.height); octx.drawImage(fernCanvas,0,0); octx.drawImage(treeCanvas,0,0); return out; }
if (exportPngLayersBtn) exportPngLayersBtn.addEventListener('click', ()=>{ saveCanvasToFile(makeSolidBackgroundCanvas(backgroundColor), 'background.png'); saveCanvasToFile(fernCanvas, 'ferns.png'); saveCanvasToFile(treeCanvas, 'strokes.png'); saveCanvasToFile(makeCombinedCanvas(), 'combined.png'); });

/* ===================== Keyboard shortcuts ===================== */
window.addEventListener('keydown', (e)=>{
  if((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key.toLowerCase()==='z'){ e.preventDefault(); undo(); }
  if((e.ctrlKey||e.metaKey) && (e.key.toLowerCase()==='y' || (e.shiftKey && e.key.toLowerCase()==='z'))){ e.preventDefault(); redo(); }
});

/* ===================== Init ===================== */
(function init(){
  if (branchPalette.length !== MAX_LEVELS) branchPalette = ensureTreeDefaults(MAX_LEVELS);
  initPaletteUI();
  const initialLevels = parseInt(levelsEl ? levelsEl.value : 5, 10);
  if (otherPalettePickers) rebuildOtherPalettePickers(initialLevels);
  if (backgroundColorEl && backgroundColorEl.value) { backgroundColor = backgroundColorEl.value; applyBackgroundColor(); }
  history.length=0; histIndex=-1; pushHistory();
  if (isAnimating()) startAnimation();
})();