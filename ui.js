// JavaScript Document - ui.js

/* ===================== UI refs ===================== */
const controls     = document.querySelector('.controls');
const modeBadge = document.getElementById('modeBadge');
const modeSelect= document.getElementById('modeSelect');

const helpBtn = document.getElementById('helpBtn');
const helpDisplay = document.getElementById('helpDisplay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');

const levelsEl  = document.getElementById('levels');
const levelsValueEl = document.getElementById('levelsValue');
const baseEl    = document.getElementById('baseLen');
const baseLenValueEl = document.getElementById('baseLenValue');
const lenScaleEl  = document.getElementById('lenScale');
const lenScaleValueEl = document.getElementById('lenScaleValue');
const angleEl   = document.getElementById('angle');
const angleValueEl = document.getElementById('angleValue');
const lenRandEl = document.getElementById('lenRand');
const lenRandValueEl = document.getElementById('lenRandValue');
const angleRandEl = document.getElementById('angleRand');
const angleRandValueEl = document.getElementById('angleRandValue');
const uniformAngleRandEl = document.getElementById('uniformAngleRand');
const baseWidthEl = document.getElementById('baseWidth');
const baseWidthValueEl = document.getElementById('baseWidthValue');
const widthScaleEl= document.getElementById('widthScale');
const widthScaleValueEl = document.getElementById('widthScaleValue');
const randomBranchColorEl = document.getElementById('randomBranchColor');

const addTreeBlossomsEl = document.getElementById('addTreeBlossoms');
const treeBlossomControlsEl = document.getElementById('treeBlossomControls');
const treeBlossomSizeEl = document.getElementById('treeBlossomSize');
const treeBlossomSizeValueEl = document.getElementById('treeBlossomSizeValue');
const treeBlossomColorEl = document.getElementById('treeBlossomColor');

const fernPointsEl = document.getElementById('fernPoints');
const fernPointsValueEl = document.getElementById('fernPointsValue');
const fernSizeEl   = document.getElementById('fernSize');
const fernSizeValueEl = document.getElementById('fernSizeValue');
const spaceFernsEl = document.getElementById('spaceFerns');

const pathWidthEl = document.getElementById('pathWidth');
const pathWidthValueEl = document.getElementById('pathWidthValue');
const pathAirbrushEl = document.getElementById('pathAirbrush');
const airbrushControlsEl = document.getElementById('airbrushControls');
const airbrushSizeEl = document.getElementById('airbrushSize');
const airbrushSizeValueEl = document.getElementById('airbrushSizeValue');

const mountainParamsEl = document.getElementById('mountainParams');
const mountainDetailEl = document.getElementById('mountainDetail');
const mountainDetailValueEl = document.getElementById('mountainDetailValue');
const mountainHeightEl = document.getElementById('mountainHeight');
const mountainHeightValueEl = document.getElementById('mountainHeightValue');
const mountainJaggednessEl = document.getElementById('mountainJaggedness');
const mountainJaggednessValueEl = document.getElementById('mountainJaggednessValue');
const mountainSmoothEl = document.getElementById('mountainSmooth');

const celestialParamsEl = document.getElementById('celestialParams');
const celestialSizeEl = document.getElementById('celestialSize');
const celestialSizeValueEl = document.getElementById('celestialSizeValue');
const celestialGlowEl = document.getElementById('celestialGlow');
const celestialGlowValueEl = document.getElementById('celestialGlowValue');

const eraserSizeEl = document.getElementById('eraserSize');
const eraserSizeValueEl = document.getElementById('eraserSizeValue');

const levelAlphaEl = document.getElementById('levelAlpha');
const levelAlphaValueEl = document.getElementById('levelAlphaValue');
const editingLevelText = document.getElementById('editingLevelText');
const levelEditBox = document.getElementById('levelEditBox');
const applyAllEl = document.getElementById('applyAllTrees');

const branchPanel    = document.getElementById('branchColorPanel');
const backgroundColorEl = document.getElementById('backgroundColor');

const enableGradientEl = document.getElementById('enableGradient');
const gradientControlsEl = document.getElementById('gradientControls');
const backgroundColor2El = document.getElementById('backgroundColor2');

const applyNewObjectAlphaEl = document.getElementById('applyNewObjectAlpha');
const newObjectAlphaControlsEl = document.getElementById('newObjectAlphaControls');
const newObjectAlphaSliderEl = document.getElementById('newObjectAlphaSlider');
const newObjectAlphaValueEl = document.getElementById('newObjectAlphaValue');

const svgFernThinEl   = document.getElementById('svgFernThin');
const svgFernThinValueEl = document.getElementById('svgFernThinValue');
const svgGroupByLevelEl = document.getElementById('svgGroupByLevel');

const snowIterEl   = document.getElementById('snowIter');
const snowIterValueEl = document.getElementById('snowIterValue');
const snowSizeEl   = document.getElementById('snowSize');
const snowSizeValueEl = document.getElementById('snowSizeValue');
const snowStrokeEl = document.getElementById('snowStroke');
const snowStrokeValueEl = document.getElementById('snowStrokeValue');

const flowerIterEl   = document.getElementById('flowerIter');
const flowerIterValueEl = document.getElementById('flowerIterValue');
const flowerAngleEl  = document.getElementById('flowerAngle');
const flowerAngleValueEl = document.getElementById('flowerAngleValue');
const flowerStepEl   = document.getElementById('flowerStep');
const flowerStepValueEl = document.getElementById('flowerStepValue');
const flowerStrokeEl = document.getElementById('flowerStroke');
const flowerStrokeValueEl = document.getElementById('flowerStrokeValue');

const addFlowerBlossomsEl = document.getElementById('addFlowerBlossoms');
const flowerBlossomControlsEl = document.getElementById('flowerBlossomControls');
const flowerBlossomSizeEl = document.getElementById('flowerBlossomSize');
const flowerBlossomSizeValueEl = document.getElementById('flowerBlossomSizeValue');
const flowerBlossomColorEl = document.getElementById('flowerBlossomColor');

const vineLengthEl  = document.getElementById('vineLength');
const vineLengthValueEl = document.getElementById('vineLengthValue');
const vineNoiseEl   = document.getElementById('vineNoise');
const vineNoiseValueEl = document.getElementById('vineNoiseValue');
const vineStrokeEl  = document.getElementById('vineStroke');
const vineStrokeValueEl = document.getElementById('vineStrokeValue');

const cloudCountEl   = document.getElementById('cloudCount');
const cloudCountValueEl = document.getElementById('cloudCountValue');
const cloudMinDEl    = document.getElementById('cloudMinD');
const cloudMinDValueEl = document.getElementById('cloudMinDValue');
const cloudMaxDEl    = document.getElementById('cloudMaxD');
const cloudMaxDValueEl = document.getElementById('cloudMaxDValue');
const cloudMinWEl    = document.getElementById('cloudMinW');
const cloudMinWValueEl = document.getElementById('cloudMinWValue');
const cloudMaxWEl    = document.getElementById('cloudMaxW');
const cloudMaxWValueEl = document.getElementById('cloudMaxWValue');
const cloudBlurEl    = document.getElementById('cloudBlur');
const cloudBlurValueEl = document.getElementById('cloudBlurValue');
const cloudShadowEl  = document.getElementById('cloudShadowColor');
const cloudShadowXEl = document.getElementById('cloudShadowX');
const cloudShadowXValueEl = document.getElementById('cloudShadowXValue');
const cloudShadowYEl = document.getElementById('cloudShadowY');
const cloudShadowYValueEl = document.getElementById('cloudShadowYValue');
const cloudShadowAlphaEl = document.getElementById('cloudShadowAlpha');
const cloudShadowAlphaValueEl = document.getElementById('cloudShadowAlphaValue');
const animateCloudsEl = document.getElementById('animateClouds');
const cloudAnimControlsEl = document.getElementById('cloudAnimControls');
const cloudSpeedEl = document.getElementById('cloudSpeed');
const cloudSpeedValueEl = document.getElementById('cloudSpeedValue');
const cloudDriftEl = document.getElementById('cloudDrift');
const cloudDriftValueEl = document.getElementById('cloudDriftValue');

const nonTreeColorModeEl = document.getElementById('nonTreeColorMode');
const singleColorBoxEl = document.getElementById('singleColorBox');
const singleColorEl = document.getElementById('singleColor');

const playbackBtn = document.getElementById('playbackBtn');
const playbackSpeedEl = document.getElementById('playbackSpeed');
const playbackSpeedValueEl = document.getElementById('playbackSpeedValue');
const sessionWarningEl = document.getElementById('sessionWarning');
let isPlaying = false;

const otherScaleMinEl = document.getElementById('otherScaleMin');
const otherScaleMinValueEl = document.getElementById('otherScaleMinValue');
const otherScaleMaxEl = document.getElementById('otherScaleMax');
const otherScaleMaxValueEl = document.getElementById('otherScaleMaxValue');

const animateWindEl  = document.getElementById('animateWind');
const windAmpEl      = document.getElementById('windAmp');
const windAmpValueEl = document.getElementById('windAmpValue');
const windSpeedEl    = document.getElementById('windSpeed');
const windSpeedValueEl = document.getElementById('windSpeedValue');

/* ===================== Mobile Menu Toggle ===================== */
function toggleMenu() {
    controls.classList.toggle('is-visible');
}
if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);

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

/* ===================== UI helpers ===================== */
function bindSliderToInput(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);
    if (!slider || !input) return;

    slider.addEventListener('input', () => input.value = slider.value);
    input.addEventListener('change', () => {
        let value = parseFloat(input.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        if (value < min) value = min;
        // Do not clamp to max, to allow user override
        slider.value = Math.min(value, max);
    });
}

const bindings = [
    ['levels', 'levelsValue'], ['baseLen', 'baseLenValue'], ['lenScale', 'lenScaleValue'],
    ['angle', 'angleValue'], ['lenRand', 'lenRandValue'], ['angleRand', 'angleRandValue'],
    ['baseWidth', 'baseWidthValue'], ['widthScale', 'widthScaleValue'], ['treeBlossomSize', 'treeBlossomSizeValue'],
    ['fernPoints', 'fernPointsValue'], ['fernSize', 'fernSizeValue'],
    ['pathWidth', 'pathWidthValue'], ['airbrushSize', 'airbrushSizeValue'],
    ['mountainDetail', 'mountainDetailValue'], ['mountainHeight', 'mountainHeightValue'], ['mountainJaggedness', 'mountainJaggednessValue'],
    ['celestialSize', 'celestialSizeValue'], ['celestialGlow', 'celestialGlowValue'],
    ['snowIter', 'snowIterValue'], ['snowSize', 'snowSizeValue'], ['snowStroke', 'snowStrokeValue'],
    ['flowerIter', 'flowerIterValue'], ['flowerAngle', 'flowerAngleValue'], ['flowerStep', 'flowerStepValue'], ['flowerStroke', 'flowerStrokeValue'],
    ['flowerBlossomSize', 'flowerBlossomSizeValue'],
    ['vineLength', 'vineLengthValue'], ['vineNoise', 'vineNoiseValue'], ['vineStroke', 'vineStrokeValue'],
    ['cloudCount', 'cloudCountValue'], ['cloudMinD', 'cloudMinDValue'], ['cloudMaxD', 'cloudMaxDValue'],
    ['cloudMinW', 'cloudMinWValue'], ['cloudMaxW', 'cloudMaxWValue'], ['cloudBlur', 'cloudBlurValue'],
    ['cloudShadowX', 'cloudShadowXValue'], ['cloudShadowY', 'cloudShadowYValue'], ['cloudShadowAlpha', 'cloudShadowAlphaValue'],
    ['cloudSpeed', 'cloudSpeedValue'], ['cloudDrift', 'cloudDriftValue'],
    ['otherScaleMin', 'otherScaleMinValue'], ['otherScaleMax', 'otherScaleMaxValue'],
    ['eraserSize', 'eraserSizeValue'],
    ['newObjectAlphaSlider', 'newObjectAlphaValue'], ['levelAlpha', 'levelAlphaValue'],
    ['playbackSpeed', 'playbackSpeedValue'], ['svgFernThin', 'svgFernThinValue'],
    ['windAmp', 'windAmpValue'], ['windSpeed', 'windSpeedValue']
];

bindings.forEach(([sliderId, inputId]) => bindSliderToInput(sliderId, inputId));

// This new function is called by the history (undo/redo) to sync the UI
function syncInputsFromSliders() {
    bindings.forEach(([sliderId, inputId]) => {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);
        if (slider && input) {
            input.value = slider.value;
        }
    });
}

function updateModeUI(){
  const mode = modeSelect ? modeSelect.value : 'tree';
  if (modeBadge) modeBadge.textContent = mode.charAt(0).toUpperCase()+mode.slice(1);
  const show = (id,on)=>{ const n=document.getElementById(id); if(n) n.style.display=on?'block':'none'; };
  show('treeParams',   mode==='tree');
  show('fernParams',   mode==='fern');
  show('pathParams',   mode==='path');
  show('mountainParams', mode === 'mountain');
  show('celestialParams', mode === 'celestial');
  show('snowParams',   mode==='snowflake');
  show('flowerParams', mode==='flower');
  show('vineParams',   mode==='vine');
  show('cloudParams',  mode==='clouds');
  show('eraserParams', mode==='eraser');
  
  if(levelEditBox) levelEditBox.style.display = (mode==='tree') ? levelEditBox.style.display : 'none';
}
if (modeSelect) modeSelect.addEventListener('change', updateModeUI);
updateModeUI();

if (addTreeBlossomsEl) {
    addTreeBlossomsEl.addEventListener('change', () => {
        if(treeBlossomControlsEl) treeBlossomControlsEl.style.display = addTreeBlossomsEl.checked ? 'block' : 'none';
    });
}
if (addFlowerBlossomsEl) {
    addFlowerBlossomsEl.addEventListener('change', () => {
        if(flowerBlossomControlsEl) flowerBlossomControlsEl.style.display = addFlowerBlossomsEl.checked ? 'block' : 'none';
    });
}
if (pathAirbrushEl) {
    pathAirbrushEl.addEventListener('change', () => {
        if(airbrushControlsEl) airbrushControlsEl.style.display = pathAirbrushEl.checked ? 'block' : 'none';
    });
}

if (enableGradientEl) {
    enableGradientEl.addEventListener('change', () => {
        if(gradientControlsEl) gradientControlsEl.style.display = enableGradientEl.checked ? 'block' : 'none';
        if (!isAnimating()) redrawAll();
    });
}
[backgroundColorEl, backgroundColor2El].filter(Boolean).forEach(el => {
    el.addEventListener('input', () => {
        if (!isAnimating()) redrawAll();
    });
    el.addEventListener('change', () => {
        pushHistory();
    });
});


if (applyNewObjectAlphaEl) {
    applyNewObjectAlphaEl.addEventListener('change', () => {
        if(newObjectAlphaControlsEl) {
            newObjectAlphaControlsEl.style.display = applyNewObjectAlphaEl.checked ? 'block' : 'none';
        }
    });
}

if (animateCloudsEl) {
    animateCloudsEl.addEventListener('change', () => {
        if (cloudAnimControlsEl) cloudAnimControlsEl.style.display = animateCloudsEl.checked ? 'block' : 'none';
        if (isAnimating() && !animReq) startAnimation();
        else if (!isAnimating()) redrawAll();
    });
}

if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        const isHelpActive = controls.classList.toggle('help-mode');
        if (isHelpActive) {
            helpDisplay.textContent = 'Help Mode Activated: Tap any control to see its description here.';
            helpDisplay.style.display = 'block';
        } else {
            helpDisplay.style.display = 'none';
        }

    });

    controls.addEventListener('click', (e) => {
        if (controls.classList.contains('help-mode')) {
            const target = e.target.closest('[title]');
            if (target && target.title) {
                e.preventDefault();
                e.stopPropagation();
                helpDisplay.textContent = target.title;
            }
        }
    }, true);
}

function checkSessionSize() {
    if (!sessionWarningEl) return;
    const sizeThreshold = 500;
    if (scene.length > sizeThreshold) {
        sessionWarningEl.textContent = `Warning: This session contains ${scene.length} objects and may be slow to save or reload on some devices.`;
        sessionWarningEl.style.display = 'block';
    } else {
        sessionWarningEl.style.display = 'none';
    }
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

    const updateTreeColors = () => {
        branchPalette[i] = input.value;
        const applyToAll = applyAllEl && applyAllEl.checked;
        if (applyToAll) {
            trees.forEach(t => { if (i < t.levels) t.branchColors[i] = input.value; });
        } else if (selectedTreeIndex != null) {
            const t = trees[selectedTreeIndex];
            if (i < t.levels) t.branchColors[i] = input.value;
        }
    };

    input.addEventListener('input', () => {
        updateTreeColors();
        if (!isAnimating()) redrawAll();
    });

    input.addEventListener('change', () => {
        updateTreeColors();
        pushHistory();
        if (typeof gtag === 'function') gtag('event', 'change_color', { 'target': 'palette_manual' });
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

function initPresetsUI() {
    const container = document.getElementById('palettePresetsContainer');
    if (!container) return;
    container.innerHTML = '';
    for (const name in colorPresets) {
        const presetDiv = document.createElement('div');
        presetDiv.className = 'preset-btn';
        presetDiv.setAttribute('role', 'button');
        presetDiv.setAttribute('tabindex', '0');
        
        const text = document.createElement('span');
        text.textContent = name;
        
        const swatches = document.createElement('div');
        swatches.className = 'preset-swatches';
        
        colorPresets[name].slice(0, 5).forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'preset-swatch';
            swatch.style.backgroundColor = color;
            swatches.appendChild(swatch);
        });
        
        presetDiv.appendChild(text);
        presetDiv.appendChild(swatches);
        
        presetDiv.addEventListener('click', () => {
            applyPalettePreset(colorPresets[name]);
            if (typeof gtag === 'function') gtag('event', 'change_preset', { 'preset_name': name });
        });
        presetDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                presetDiv.click();
            }
        });
        
        container.appendChild(presetDiv);
    }
}

function applyPalettePreset(colors) {
    for (let i = 0; i < MAX_LEVELS; i++) {
        branchPalette[i] = colors[i % colors.length];
    }
    refreshPaletteUI();
    
    if (selectedTreeIndex !== null) {
        const t = trees[selectedTreeIndex];
        for (let i = 0; i < t.levels; i++) {
            t.branchColors[i] = branchPalette[i];
        }
    }
    pushHistory();
    redrawAll();
}

function updateNonTreeColorUI(){
  if (!nonTreeColorModeEl || !singleColorBoxEl) return;
  const isSingleColor = nonTreeColorModeEl.value === 'single';
  singleColorBoxEl.style.display = isSingleColor ? 'block' : 'none';
}
if (nonTreeColorModeEl) nonTreeColorModeEl.addEventListener('change', updateNonTreeColorUI);

function pickNonTreeColor(seed){
  const isCycleMode = nonTreeColorModeEl && nonTreeColorModeEl.value === 'cycle';
  if (!isCycleMode){
    return (singleColorEl && singleColorEl.value) || '#58c470';
  }
  const pal = (branchPalette && branchPalette.length) ? branchPalette : [ '#58c440' ];
  const rng = mulberry32(seed || newSeed());
  const idx = Math.floor(rng() * pal.length) % pal.length;
  return pal[idx];
}

if (levelAlphaEl){
  levelAlphaEl.addEventListener('input', ()=>{
    if(selectedTreeIndex == null) return;
    const val = Number(levelAlphaEl.value);
    const applyToAll = applyAllEl && applyAllEl.checked;
    if (applyToAll) { trees.forEach(t => { if (selectedLevelIndex < t.levels) { t.levelAlphas[selectedLevelIndex] = val; } });
    } else if (selectedTreeIndex != null) {
      const t = trees[selectedTreeIndex]; if (selectedLevelIndex < t.levels) { t.levelAlphas[selectedLevelIndex] = val; }
    } else { return; }
    if (!isAnimating()) redrawAll();
  });
  levelAlphaEl.addEventListener('change', () => {
      pushHistory();
  });
}