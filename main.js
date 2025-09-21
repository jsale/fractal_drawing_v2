// JavaScript Document - main.js

/* ===================== DOM & contexts ===================== */
const treeCanvas   = document.getElementById('treeCanvas');
const eraserCanvas = document.getElementById('eraserCanvas');

const treeCtx   = treeCanvas.getContext('2d');
const eraserCtx = eraserCanvas.getContext('2d');

/* ===================== STATE ===================== */
const MAX_LEVELS = 10;
let scene = [];
let trees = [];
let ferns = [];
let paths = [];
let mountains = [];
let celestials = [];
let snowflakes = [];
let flowers = [];
let vines = [];
let clouds = [];
let eraserStrokes = [];
let selectedTreeIndex = null;
let selectedLevelIndex = null;
let drawing = false, lastP = null, currentStroke = null, captureEl = null, dragStartPoint = null;
let dragSpacing = 4;
let branchPalette = [];

/* ==== History ==== */
const history = [];
let histIndex = -1;
function snapshot(){
    const sceneCopy = scene.map(op => {
        const dataCopy = JSON.parse(JSON.stringify(op.data));
        // Optimize paths and vines by rounding coordinates
        if (op.type === 'path' || op.type === 'vine' || op.type === 'eraser') {
            if (dataCopy.points) {
                dataCopy.points = dataCopy.points.map(pt => ({
                    x: Math.round(pt.x),
                    y: Math.round(pt.y)
                }));
            }
        }
        return { type: op.type, data: dataCopy };
    });

    return {
        bg1: backgroundColorEl.value,
        bg2: backgroundColor2El.value,
        gradient: enableGradientEl.checked,
        palette: branchPalette.slice(),
        scene: sceneCopy,
        cloudAnim: animateCloudsEl.checked,
        cloudSpeed: cloudSpeedEl.value,
        cloudDrift: cloudDriftEl.value,
    };
}
function pushHistory(){
  history.splice(histIndex+1);
  history.push(snapshot());
  histIndex = history.length-1;
}
function restoreFrom(state){
  backgroundColorEl.value = state.bg1 || '#000000';
  backgroundColor2El.value = state.bg2 || '#071022';
  enableGradientEl.checked = state.gradient || false;
  
  animateCloudsEl.checked = state.cloudAnim || false;
  cloudSpeedEl.value = state.cloudSpeed || '0.1';
  cloudDriftEl.value = state.cloudDrift || '20';

  if(gradientControlsEl) gradientControlsEl.style.display = enableGradientEl.checked ? 'block' : 'none';
  if(cloudAnimControlsEl) cloudAnimControlsEl.style.display = animateCloudsEl.checked ? 'block' : 'none';

  branchPalette = (state.palette && state.palette.length===MAX_LEVELS)
    ? state.palette.slice() : ensureTreeDefaults(MAX_LEVELS);
  refreshPaletteUI();
  updateUIValues();

  scene = state.scene.map(op => ({...op}));

  trees = scene.filter(op => op.type === 'tree').map(op => op.data);
  ferns = scene.filter(op => op.type === 'fern').map(op => op.data);
  paths = scene.filter(op => op.type === 'path').map(op => op.data);
  mountains = scene.filter(op => op.type === 'mountain').map(op => op.data);
  celestials = scene.filter(op => op.type === 'celestial').map(op => op.data);
  snowflakes = scene.filter(op => op.type === 'snowflake').map(op => op.data);
  flowers = scene.filter(op => op.type === 'flower').map(op => op.data);
  vines = scene.filter(op => op.type === 'vine').map(op => op.data);
  clouds = scene.filter(op => op.type === 'clouds').map(op => op.data);
  eraserStrokes = scene.filter(op => op.type === 'eraser').map(op => op.data);

  selectedTreeIndex = null; selectedLevelIndex = null;
  if (isAnimating()) { /* next frame draws */ } else { redrawAll(); }
  checkSessionSize();
}
function undo(){ if(histIndex>0){ histIndex--; restoreFrom(history[histIndex]); } }
function redo(){ if(histIndex<history.length-1){ histIndex++; restoreFrom(history[histIndex]); } }

/* ===================== Sizing ===================== */
function resizeCanvases(){
  let w;
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    w = window.innerWidth;
  } else {
    w = window.innerWidth - (controls ? controls.offsetWidth : 0);
  }

  const h = window.innerHeight - (document.querySelector('header') ? document.querySelector('header').offsetHeight : 0);
  
  [treeCanvas, eraserCanvas].forEach(c=>{
    c.width = w; c.height = h;
    c.style.width = w+'px'; c.style.height = h+'px';
  });
  if (!isAnimating()) redrawAll();
}
window.addEventListener('resize', resizeCanvases);

function drawBackground(ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any transformations
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (enableGradientEl && enableGradientEl.checked) {
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, backgroundColorEl.value);
        gradient.addColorStop(1, backgroundColor2El.value);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
        ctx.fillStyle = backgroundColorEl.value;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.restore();
}

/* ===================== Get new object alpha ===================== */
function getNewObjectAlpha() {
    if (applyNewObjectAlphaEl && applyNewObjectAlphaEl.checked) {
        return parseFloat(newObjectAlphaSliderEl.value);
    }
    return 1.0;
}

/* ===================== Global redraw ===================== */
function redrawAll(){
    drawBackground(treeCtx);

    for (const op of scene) {
        switch(op.type) {
            case 'fern':      drawFernInstance(treeCtx, op.data); break;
            case 'tree':      drawTreeFromSegments(treeCtx, op.data); break;
            case 'path':      drawSinglePath(treeCtx, op.data); break;
            case 'mountain':  drawMountainRange(treeCtx, op.data); break;
            case 'celestial': drawCelestialBody(treeCtx, op.data); break;
            case 'snowflake': drawSnowflakes(treeCtx, op.data); break;
            case 'flower':    drawFlowers(treeCtx, op.data); break;
            case 'vine':      drawVines(treeCtx, op.data); break;
            case 'clouds':    drawClouds(treeCtx, op.data); break;
            case 'eraser':
                applyEraser(treeCtx, op.data);
                break;
        }
    }
    treeCtx.globalAlpha = 1.0;
}

/* ===================== Wind animation ===================== */
let animReq = null;
function isAnimating(){ return (animateWindEl && animateWindEl.checked) || (animateCloudsEl && animateCloudsEl.checked); }
function startAnimation(){
  if (animReq) return;
  const tick = (now)=>{ redrawAnimatedScene(now/1000); animReq = requestAnimationFrame(tick); };
  animReq = requestAnimationFrame(tick);
}
function stopAnimation(){
  if (animReq){ cancelAnimationFrame(animReq); animReq = null; }
  redrawAll();
}

function redrawAnimatedScene(time) {
    drawBackground(treeCtx);

    for (const op of scene) {
        switch(op.type) {
            case 'tree':      
                (animateWindEl && animateWindEl.checked) ? drawAnimatedTree(treeCtx, op.data, time) : drawTreeFromSegments(treeCtx, op.data);
                break;
            case 'clouds':    
                (animateCloudsEl && animateCloudsEl.checked) ? drawAnimatedClouds(treeCtx, op.data, time) : drawClouds(treeCtx, op.data);
                break;
            case 'fern':      drawFernInstance(treeCtx, op.data); break;
            case 'path':      drawSinglePath(treeCtx, op.data); break;
            case 'mountain':  drawMountainRange(treeCtx, op.data); break;
            case 'celestial': drawCelestialBody(treeCtx, op.data); break;
            case 'snowflake': drawSnowflakes(treeCtx, op.data); break;
            case 'flower':    drawFlowers(treeCtx, op.data); break;
            case 'vine':      drawVines(treeCtx, op.data); break;
            case 'eraser':
                applyEraser(treeCtx, op.data);
                break;
        }
    }
    treeCtx.globalAlpha = 1.0;
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

function getDateTimeStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}_${month}_${day}_${hour}_${minute}_${second}`;
}

function createMountainFromUI(start, end) {
    const mtn = {
        start: start,
        end: end,
        detail: parseInt(mountainDetailEl.value, 10),
        height: parseFloat(mountainHeightEl.value),
        jaggedness: parseFloat(mountainJaggednessEl.value),
        isSmooth: mountainSmoothEl.checked,
        color: pickNonTreeColor(nextStampSeed()),
        alpha: getNewObjectAlpha(),
        points: []
    };
    buildMountainRange(mtn);
    return mtn;
}

function createCelestialFromUI(cx, cy) {
    const body = {
        cx: cx,
        cy: cy,
        size: parseFloat(celestialSizeEl.value),
        glow: parseFloat(celestialGlowEl.value),
        color: pickNonTreeColor(nextStampSeed()),
        alpha: getNewObjectAlpha()
    };
    return body;
}

function createTreeFromUI(x,y){
  const levels = parseInt(levelsEl.value, 10);
  const t = { 
    x, y, 
    baseLen: parseFloat(baseEl.value), 
    levels, 
    lenScale: parseFloat(lenScaleEl.value),
    angle: parseFloat(angleEl.value), 
    lenRand: parseFloat(lenRandEl.value),
    angleRand: parseFloat(angleRandEl.value),
    uniformAngleRand: uniformAngleRandEl.checked,
    baseWidth: parseFloat(baseWidthEl.value), 
    widthScale: parseFloat(widthScaleEl.value),
    branchColors: branchPalette.slice(0, levels), 
    levelAlphas: new Array(levels).fill(getNewObjectAlpha()),
    randomColor: randomBranchColorEl.checked,
    rngSeed: newSeed(), 
    segments: [],
    hasBlossoms: addTreeBlossomsEl.checked,
    blossomSize: parseFloat(treeBlossomSizeEl.value),
    blossomColor: treeBlossomColorEl.value
  };
  buildTreeSegments(t);
  return t;
}
function createSnowflakeFromUI(cx, cy){
  const s = { cx, cy, size: Math.min(treeCanvas.width, treeCanvas.height) * parseFloat(snowSizeEl.value), iter: parseInt(snowIterEl.value, 10),
    stroke: parseFloat(snowStrokeEl.value), segments: [], alpha: getNewObjectAlpha() };
  buildKochSnowflake(s); return s;
}
function createFlowerFromUI(cx, cy){
  const scale = getNonTreeScale();
  const fl = { 
    cx, cy, 
    iter: parseInt(flowerIterEl.value, 10), 
    angle: parseFloat(flowerAngleEl.value) * scale,
    step: Math.min(treeCanvas.width, treeCanvas.height) * parseFloat(flowerStepEl.value) * scale, 
    stroke: parseFloat(flowerStrokeEl.value),
    rngSeed: newSeed(), 
    segments: [], 
    tips: [],
    alpha: getNewObjectAlpha(),
    hasBlossoms: addFlowerBlossomsEl.checked,
    blossomSize: parseFloat(flowerBlossomSizeEl.value) * scale,
    blossomColor: flowerBlossomColorEl.value
  };
  buildFlowerSegments(fl);
  findFlowerTips(fl);
  return fl;
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

function createFernFromUI(cx, cy) {
    const sizeBase = Math.min(treeCanvas.width, treeCanvas.height);
    const scale = getNonTreeScale();
    const f = { 
        cx: cx, 
        cy: cy, 
        size: sizeBase * parseFloat(fernSizeEl.value) * scale, 
        points: parseInt(fernPointsEl.value, 10),
        color: pickNonTreeColor(nextStampSeed()), 
        rngSeed: nextStampSeed(), 
        alpha: getNewObjectAlpha(),
        isSpaceFern: spaceFernsEl.checked
    };
    if (f.isSpaceFern && typeof gtag === 'function') gtag('event', 'use_feature', { 'feature_name': 'space_ferns' });
    return f;
}

function hitTestBranch(p){
  const tol=6, tol2=tol*tol;
  for(let ti=trees.length-1; ti>=0; ti--){
    const t = trees[ti];
    for(const seg of t.segments){
      const {x1,y1,x2,y2,level}=seg; 
      const vx=x2-x1, vy=y2-y1, wx=p.x-x1, wy=p.y-y1;
      const c1=vx*wx+vy*wy, c2=vx*vx+vy*vy; 
      let b = (c2>0)? c1/c2 : 0; 
      b=Math.max(0,Math.min(1,b));
      const px=x1+b*vx, py=y1+b*vy; 
      const dx=p.x-px, dy=p.y-py;
      if(dx*dx+dy*dy<=tol2) {
          selectedTreeIndex = trees.indexOf(t);
          selectedLevelIndex = level;
          if (typeof gtag === 'function') gtag('event', 'select_branch');
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
  const p = getP(e);
  lastP = p;
  const mode = modeSelect.value;
  
  if (mode === 'mountain') {
    drawing = true;
    dragStartPoint = p;
    return;
  }
  
  drawing = true;
  if (mode === 'eraser' || mode === 'path') {
    eraserCtx.clearRect(0,0,eraserCanvas.width,eraserCanvas.height); 
    spawnAt(p);
  } else if (mode === 'tree') {
    hitTestBranch(p);
    if (selectedTreeIndex === null) { 
        spawnAt(p); 
    } else {
        if (levelEditBox){
            levelEditBox.style.display='block'; editingLevelText.textContent = 'Level ' + (selectedLevelIndex+1);
            levelAlphaEl.value = trees[selectedTreeIndex].levelAlphas[selectedLevelIndex] ?? 1;
            const lab = document.getElementById('levelAlphaLabel'); if (lab) lab.textContent = Number(levelAlphaEl.value).toFixed(2);
        }
        if (!isAnimating()) redrawAll();
        drawing = false;
    }
  } else { 
    spawnAt(p); 
  }
}
function onPointerMove(e){
  if (!drawing) return;
  const p = getP(e); 
  const mode = modeSelect.value;

  if (mode === 'mountain' && dragStartPoint) {
      eraserCtx.clearRect(0,0,eraserCanvas.width, eraserCanvas.height);
      eraserCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      eraserCtx.lineWidth = 1;
      eraserCtx.beginPath();
      eraserCtx.moveTo(dragStartPoint.x, dragStartPoint.y);
      eraserCtx.lineTo(p.x, p.y);
      eraserCtx.stroke();
      return;
  }

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
    } else {
        drawSinglePath(eraserCtx, currentStroke);
    }
  } else {
    const dx=p.x-lastP.x, dy=p.y-lastP.y;
    if (dragSpacing <= 0 || (dx*dx + dy*dy >= dragSpacing*dragSpacing)) { lastP=p; spawnAt(p); }
  }
}
function onPointerEnd(e){
  if (!drawing) return;
  const p = getP(e);
  const mode = modeSelect.value;
  
  if (mode === 'mountain' && dragStartPoint) {
      const mtn = createMountainFromUI(dragStartPoint, p);
      mountains.push(mtn);
      scene.push({type: 'mountain', data: mtn});
      pushHistory();
      checkSessionSize();
      if (!isAnimating()) redrawAll();
      eraserCtx.clearRect(0,0,eraserCanvas.width, eraserCanvas.height);
      dragStartPoint = null;
      if (typeof gtag === 'function') gtag('event', 'create_object', { 'type': 'mountain' });
  }
  
  drawing = false;
  if (captureEl && captureEl.releasePointerCapture) { try { captureEl.releasePointerCapture(e.pointerId); } catch {} captureEl = null; }
  
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
[treeCanvas, eraserCanvas].forEach(c=>{ c.addEventListener('pointerdown', onPointerDown); c.addEventListener('pointermove', onPointerMove); c.addEventListener('pointerup', onPointerEnd); c.addEventListener('pointercancel', onPointerEnd); c.addEventListener('pointerleave', onPointerEnd); });

/* ===================== Spawning ===================== */
function spawnAt(p){
  const mode = modeSelect.value;
  let newOp = null;

  if(mode==='path'){
      currentStroke = { 
        points:[p], 
        strokeWidth: parseInt(pathWidthEl.value, 10), 
        alpha: getNewObjectAlpha(),
        singleColor: singleColorEl.value,
        isAirbrush: pathAirbrushEl.checked,
        airbrushSize: parseInt(airbrushSizeEl.value, 10)
      };
      drawSinglePath(eraserCtx, currentStroke);
      return;
  } else if(mode==='eraser') {
      currentStroke = {size: parseInt(eraserSizeEl.value, 10), points:[p]};
      return;
  }

  if (typeof gtag === 'function') gtag('event', 'create_object', { 'type': mode });

  if(mode==='tree'){
    const t = createTreeFromUI(p.x,p.y);
    trees.push(t);
    selectedTreeIndex = trees.length-1; selectedLevelIndex=null;
    if (levelEditBox) levelEditBox.style.display='none';
    newOp = {type: 'tree', data: t};
  } else if(mode==='fern'){
    const f = createFernFromUI(p.x, p.y);
    ferns.push(f);
    newOp = {type: 'fern', data: f};
  } else if(mode==='snowflake'){
    const s = createSnowflakeFromUI(p.x, p.y); s.rngSeed = nextStampSeed(); s.size *= getNonTreeScale(); s.color = pickNonTreeColor(s.rngSeed); snowflakes.push(s);
    newOp = {type: 'snowflake', data: s};
  } else if(mode==='flower'){
    const fl = createFlowerFromUI(p.x, p.y); 
    fl.rngSeed = nextStampSeed(); 
    fl.color = pickNonTreeColor(fl.rngSeed); 
    flowers.push(fl);
    newOp = {type: 'flower', data: fl};
  } else if(mode==='vine'){
    const v = createVineFromUI(p.x, p.y); v.rngSeed = nextStampSeed(); const scale = getNonTreeScale(); v.length = Math.max(10, Math.round(v.length * scale)); v.step = 4 * scale; v.color = pickNonTreeColor(v.rngSeed); vines.push(v);
    newOp = {type: 'vine', data: v};
  } else if(mode==='clouds'){
    const c = createCloudFromUI(p.x,p.y);
    clouds.push(c);
    newOp = {type: 'clouds', data: c};
  } else if(mode==='celestial'){
    const body = createCelestialFromUI(p.x, p.y);
    celestials.push(body);
    newOp = {type: 'celestial', data: body};
  }
  
  if (newOp) {
      scene.push(newOp);
      pushHistory();
      if (!isAnimating()) {
        redrawAll();
      }
      checkSessionSize();
  }
}

/* ===================== Buttons ===================== */
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearBtn= document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const exportSvgBtn = document.getElementById('exportSvgBtn');
const exportSessionBtn = document.getElementById('exportSessionBtn');
const loadSessionBtn = document.getElementById('loadSessionBtn');
const sessionFileInput = document.getElementById('sessionFileInput');
const randomizeTreeBtn = document.getElementById('randomizeTreeBtn');

if (undoBtn) undoBtn.addEventListener('click', undo);
if (redoBtn) redoBtn.addEventListener('click', redo);
if (clearBtn) clearBtn.addEventListener('click', ()=>{ scene=[]; trees=[]; ferns=[]; paths=[]; mountains=[]; celestials=[]; snowflakes=[]; flowers=[]; vines=[]; clouds=[]; eraserStrokes=[]; selectedTreeIndex=null; selectedLevelIndex=null; pushHistory(); if (!isAnimating()) redrawAll(); checkSessionSize(); if (typeof gtag === 'function') gtag('event', 'clear_canvas'); });
if (saveBtn) saveBtn.addEventListener('click', ()=>{ const out = document.createElement('canvas'); out.width = treeCanvas.width; out.height = treeCanvas.height; const octx = out.getContext('2d'); drawBackground(octx); octx.drawImage(treeCanvas,0,0); const link = document.createElement('a'); link.download=`fractal-forest_${getDateTimeStamp()}.png`; link.href = out.toDataURL('image/png'); link.click(); if (typeof gtag === 'function') gtag('event', 'save_artwork', { 'format': 'png' }); });
if (playbackBtn) playbackBtn.addEventListener('click', playHistory);
if (exportSessionBtn) exportSessionBtn.addEventListener('click', exportSession);
if (loadSessionBtn) loadSessionBtn.addEventListener('click', () => sessionFileInput.click());
if (sessionFileInput) sessionFileInput.addEventListener('change', loadSession);

function randomizeSlider(el) {
    if (!el) return;
    const min = parseFloat(el.min);
    const max = parseFloat(el.max);
    el.value = min + Math.random() * (max - min);
}

if (randomizeTreeBtn) {
    randomizeTreeBtn.addEventListener('click', () => {
        randomizeSlider(lenScaleEl);
        randomizeSlider(angleEl);
        randomizeSlider(lenRandEl);
        randomizeSlider(angleRandEl);
        randomizeSlider(widthScaleEl);
        updateUIValues();
        if (typeof gtag === 'function') gtag('event', 'use_feature', { 'feature_name': 'randomize_tree' });
    });
}

function playHistory() {
    if (isPlaying || history.length < 2) return;
    isPlaying = true;
    playbackBtn.disabled = true;

    if (typeof gtag === 'function') gtag('event', 'playback_history');

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
    
    restoreFrom({ bg1: '#000000', bg2: '#071022', gradient: false, palette: branchPalette, scene: [], cloudAnim: false, cloudSpeed: '0.1', cloudDrift: '20' });
    setTimeout(nextFrame, 500);
}

function exportSession() {
    try {
        if (typeof gtag === 'function') gtag('event', 'save_session');
        if (typeof pako === 'undefined') {
            alert('Compression library (pako) is not available. Please check your internet connection.');
            return;
        }

        const deflate = new pako.Deflate({ gzip: true });

        deflate.push('{\n  "history": [\n');
        history.forEach((state, index) => {
            deflate.push(JSON.stringify(state, null, 2));
            if (index < history.length - 1) {
                deflate.push(',\n');
            }
        });
        deflate.push('\n  ],\n  "histIndex": ');
        deflate.push(histIndex.toString());
        deflate.push('\n}');

        deflate.push([], true); // Finalize the stream

        if (deflate.err) {
            throw new Error(deflate.msg);
        }
        const compressed = deflate.result;

        const blob = new Blob([compressed], { type: "application/gzip" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fractal-session_${getDateTimeStamp()}.json.gz`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert("Error compressing session file: " + err.message);
    }
}

function loadSession(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (typeof gtag === 'function') gtag('event', 'load_session');
            if (typeof pako === 'undefined') {
                alert('Compression library (pako) is not loaded. Cannot load compressed session.');
                return;
            }
            let jsonString;
            
            if (file.name.endsWith('.gz')) {
                const compressed = new Uint8Array(e.target.result);
                const decompressed = pako.ungzip(compressed, { to: 'string' });
                jsonString = decompressed;
            } else {
                jsonString = e.target.result;
            }
            
            const sessionData = JSON.parse(jsonString);
            if (sessionData.history && typeof sessionData.histIndex === 'number') {
                history.length = 0;
                Array.prototype.push.apply(history, sessionData.history);
                histIndex = sessionData.histIndex;
                restoreFrom(history[histIndex]);
            } else {
                alert('Invalid session file format.');
            }
        } catch (err) {
            alert('Error parsing or decompressing session file: ' + err.message);
        }
    };

    if (file.name.endsWith('.gz') || file.type === "application/gzip") {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
    event.target.value = '';
}

/* ===================== EXPORTS (SVG & PNG layers) ===================== */
function download(filename, text) { const a = document.createElement('a'); const blob = new Blob([text], {type: 'image/svg+xml'}); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000); }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }
function buildSVG(){
  const w = treeCanvas.width, h = treeCanvas.height; const thinStep = Math.max(1, parseInt(svgFernThinEl.value, 10));
  const parts = []; parts.push(`<?xml version="1.0" encoding="UTF-8"?>`); parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`); 
  if (enableGradientEl.checked) {
    parts.push(`<defs><linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${escapeAttr(backgroundColorEl.value)};" /><stop offset="100%" style="stop-color:${escapeAttr(backgroundColor2El.value)};" /></linearGradient></defs>`);
    parts.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="url(#bg-grad)"/>`);
  } else {
    parts.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="${escapeAttr(backgroundColorEl.value)}"/>`);
  }
  parts.push(`<g id="ferns">`); for (const f of ferns){ parts.push(`<g fill="${escapeAttr(f.color || '#58c470')}" fill-opacity="${f.alpha ?? 1}" shape-rendering="crispEdges">`); const rand = mulberry32(f.rngSeed); let x=0,y=0; for(let i=0;i<f.points;i++){ const r = rand(); let nx, ny; if (r<0.01){ nx=0; ny=0.16*y; } else if (r<0.86){ nx=0.85*x + 0.04*y; ny=-0.04*x + 0.85*y + 1.6; } else if (r<0.93){ nx=0.2*x - 0.26*y; ny=0.23*x + 0.22*y + 1.6; } else { nx=-0.15*x + 0.28*y; ny=0.26*x + 0.24*y + 0.44; } x=nx; y=ny; if (i % thinStep !== 0) continue; const px = Math.round(f.cx + x*f.size), py = Math.round(f.cy - y*f.size); parts.push(`<rect x="${px}" y="${py}" width="1" height="1"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="paths" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for(const p of paths){ if(p.colorMode === 'single'){ parts.push(`<polyline points="${p.points.map(pt=>`${pt.x},${pt.y}`).join(' ')}" stroke="${escapeAttr(p.singleColor)}" stroke-width="${p.strokeWidth}" stroke-opacity="${p.alpha ?? 1}"/>`); } else { if(!branchPalette || branchPalette.length === 0) continue; parts.push(`<g stroke-width="${p.strokeWidth}" stroke-opacity="${p.alpha ?? 1}">`); for(let i=0; i<p.points.length-1; i++){ parts.push(`<line x1="${p.points[i].x}" y1="${p.points[i].y}" x2="${p.points[i+1].x}" y2="${p.points[i+1].y}" stroke="${escapeAttr(branchPalette[i % branchPalette.length])}"/>`); } parts.push(`</g>`); } } parts.push(`</g>`);
  parts.push(`<g id="snowflakes" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const s of snowflakes){ parts.push(`<g class="snowflake" opacity="${s.alpha ?? 1}" stroke="${escapeAttr(s.color || '#a0d8ff')}" stroke-width="${s.stroke || 1.5}">`); for (const seg of s.segments){ parts.push(`<line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="flowers" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const fl of flowers){ parts.push(`<g class="flower" opacity="${fl.alpha ?? 1}" stroke="${escapeAttr(fl.color || '#ff88cc')}" stroke-width="${fl.stroke || 1.5}">`); for (const seg of fl.segments){ parts.push(`<line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="vines" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const v of vines){ parts.push(`<polyline class="vine" points="${v.points.map(pt=>`${pt.x},${pt.y}`).join(' ')}" stroke="${escapeAttr(v.color || '#8fd18f')}" stroke-width="${v.stroke || 2}" stroke-opacity="${v.alpha ?? 1}" fill="none"/>`); } parts.push(`</g>`);
  parts.push(`<g id="clouds" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const c of clouds){ parts.push(`<g class="cloud" opacity="${c.alpha ?? 1}">`); for (const k of c.circles){ parts.push(`<circle cx="${c.cx}" cy="${c.cy}" r="${Math.max(0.5,k.r)}" stroke="${escapeAttr(k.color || '#ffffff')}" stroke-width="${k.w || 2}"/>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`<g id="trees" stroke-linecap="round" stroke-linejoin="round" fill="none">`); for (const t of trees){ const buckets = new Map(); for (const seg of t.segments){ if (!buckets.has(seg.level)) buckets.set(seg.level, []); buckets.get(seg.level).push(seg); } parts.push(`<g class="tree">`); for (const [lvl, arr] of buckets){ const stroke = t.branchColors[lvl] || '#ffffff', la = t.levelAlphas[lvl] ?? 1, op = Math.max(0, Math.min(1, la)); parts.push(`<g data-level="${lvl}" stroke="${escapeAttr(stroke)}" stroke-opacity="${op}" fill="none">`); for (const seg of arr){ const width = Math.max(0.1, (t.baseWidth || 12) * Math.pow(t.widthScale ?? 0.68, seg.level)); parts.push(`<line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}" stroke-width="${width}"/>`); } parts.push(`</g>`); } parts.push(`</g>`); } parts.push(`</g>`);
  parts.push(`</svg>`); return parts.join('\n');
}
if (exportSvgBtn) exportSvgBtn.addEventListener('click', ()=> { download(`fractal-forest_${getDateTimeStamp()}.svg`, buildSVG()); if (typeof gtag === 'function') gtag('event', 'save_artwork', { 'format': 'svg' }); });
function saveCanvasToFile(canvas, name){ const link = document.createElement('a'); link.download = name; link.href = canvas.toDataURL('image/png'); link.click(); }
function makeSolidBackgroundCanvas(color){ const c = document.createElement('canvas'); c.width = treeCanvas.width; c.height = treeCanvas.height; const cx = c.getContext('2d'); drawBackground(cx); return c; }
function makeCombinedCanvas(){ const out = document.createElement('canvas'); out.width = treeCanvas.width; out.height = treeCanvas.height; const octx = out.getContext('2d'); drawBackground(octx); octx.drawImage(treeCanvas,0,0); return out; }
if (exportPngLayersBtn) exportPngLayersBtn.addEventListener('click', ()=>{ 
    const stamp = getDateTimeStamp();
    saveCanvasToFile(makeSolidBackgroundCanvas(backgroundColorEl.value), `background_${stamp}.png`); 
    saveCanvasToFile(treeCanvas, `artwork_layer_${stamp}.png`); 
    saveCanvasToFile(makeCombinedCanvas(), `combined_${stamp}.png`);
    if (typeof gtag === 'function') gtag('event', 'save_artwork', { 'format': 'layers' });
});

/* ===================== Keyboard shortcuts ===================== */
window.addEventListener('keydown', (e)=>{
  if((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key.toLowerCase()==='z'){ e.preventDefault(); undo(); }
  if((e.ctrlKey||e.metaKey) && (e.key.toLowerCase()==='y' || (e.shiftKey && e.key.toLowerCase()==='z'))){ e.preventDefault(); redo(); }
});

/* ===================== Init ===================== */
(function init(){
  initPaletteUI();
  initPresetsUI();
  updateNonTreeColorUI();
  resizeCanvases();
  
  const animControls = [animateWindEl, windAmpEl, windSpeedEl, animateCloudsEl, cloudSpeedEl, cloudDriftEl];
  animControls.filter(Boolean).forEach(el => {
      el.addEventListener('change', () => { isAnimating() ? startAnimation() : stopAnimation(); });
      el.addEventListener('input', () => { if (isAnimating() && !animReq) startAnimation(); });
  });

  history.length=0; 
  histIndex=-1; 
  pushHistory();
  if (isAnimating()) startAnimation();
})();