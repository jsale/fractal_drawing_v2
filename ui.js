// JavaScript Document - ui.js

/* ===================== UI refs ===================== */
const controls     = document.querySelector('.controls');
const modeBadge = document.getElementById('modeBadge');
const modeSelect= document.getElementById('modeSelect');

const helpBtn = document.getElementById('helpBtn');
const helpDisplay = document.getElementById('helpDisplay');

const levelsEl  = document.getElementById('levels');
const baseEl    = document.getElementById('baseLen');
const lenScaleEl  = document.getElementById('lenScale');
const angleEl   = document.getElementById('angle');
const lenRandEl = document.getElementById('lenRand');
const angleRandEl = document.getElementById('angleRand');
const uniformAngleRandEl = document.getElementById('uniformAngleRand');
const baseWidthEl = document.getElementById('baseWidth');
const widthScaleEl= document.getElementById('widthScale');
const randomBranchColorEl = document.getElementById('randomBranchColor');

const addTreeBlossomsEl = document.getElementById('addTreeBlossoms');
const treeBlossomControlsEl = document.getElementById('treeBlossomControls');
const treeBlossomSizeEl = document.getElementById('treeBlossomSize');
const treeBlossomSizeLabel = document.getElementById('treeBlossomSizeLabel');
const treeBlossomColorEl = document.getElementById('treeBlossomColor');

const fernPointsEl = document.getElementById('fernPoints');
const fernSizeEl   = document.getElementById('fernSize');

const eraserSizeEl = document.getElementById('eraserSize');
const pathWidthEl = document.getElementById('pathWidth');

const levelAlphaEl = document.getElementById('levelAlpha');
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
const newObjectAlphaLabelEl = document.getElementById('newObjectAlphaLabel');

const svgFernThinEl   = document.getElementById('svgFernThin');
const svgFernThinLabel= document.getElementById('svgFernThinLabel');
const svgGroupByLevelEl = document.getElementById('svgGroupByLevel');

const snowIterEl   = document.getElementById('snowIter');
const snowSizeEl   = document.getElementById('snowSize');
const snowStrokeEl = document.getElementById('snowStroke');
const snowIterLabel   = document.getElementById('snowIterLabel');
const snowSizeLabel   = document.getElementById('snowSizeLabel');
const snowStrokeLabel = document.getElementById('snowStrokeLabel');

const flowerIterEl   = document.getElementById('flowerIter');
const flowerAngleEl  = document.getElementById('flowerAngle');
const flowerStepEl   = document.getElementById('flowerStep');
const flowerStrokeEl = document.getElementById('flowerStroke');
const flowerIterLabel   = document.getElementById('flowerIterLabel');
const flowerAngleLabel  = document.getElementById('flowerAngleLabel');
const flowerStepLabel   = document.getElementById('flowerStepLabel');
const flowerStrokeLabel = document.getElementById('flowerStrokeLabel');

const addFlowerBlossomsEl = document.getElementById('addFlowerBlossoms');
const flowerBlossomControlsEl = document.getElementById('flowerBlossomControls');
const flowerBlossomSizeEl = document.getElementById('flowerBlossomSize');
const flowerBlossomSizeLabel = document.getElementById('flowerBlossomSizeLabel');
const flowerBlossomColorEl = document.getElementById('flowerBlossomColor');

const vineLengthEl  = document.getElementById('vineLength');
const vineNoiseEl   = document.getElementById('vineNoise');
const vineStrokeEl  = document.getElementById('vineStroke');
const vineLengthLabel= document.getElementById('vineLengthLabel');
const vineNoiseLabel = document.getElementById('vineNoiseLabel');
const vineStrokeLabel= document.getElementById('vineStrokeLabel');

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

const nonTreeColorModeEl = document.getElementById('nonTreeColorMode');
const singleColorBoxEl = document.getElementById('singleColorBox');
const singleColorEl = document.getElementById('singleColor');

const playbackBtn = document.getElementById('playbackBtn');
const playbackSpeedEl = document.getElementById('playbackSpeed');
const playbackSpeedLabel = document.getElementById('playbackSpeedLabel');
let isPlaying = false;

const otherScaleMinEl = document.getElementById('otherScaleMin');
const otherScaleMaxEl = document.getElementById('otherScaleMax');
const otherScaleMinLabel = document.getElementById('otherScaleMinLabel');
const otherScaleMaxLabel = document.getElementById('otherScaleMaxLabel');

const animateWindEl  = document.getElementById('animateWind');
const windAmpEl      = document.getElementById('windAmp');
const windSpeedEl    = document.getElementById('windSpeed');
const windAmpLabel   = document.getElementById('windAmpLabel');
const windSpeedLabel = document.getElementById('windSpeedLabel');

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
function updateUIValues(){
  const setText = (el, txt)=>{ if (el) el.textContent = txt; };
  setText(levelsLabel, levelsEl ? levelsEl.value : '');
  setText(lenLabel,    baseEl ? baseEl.value : '');
  setText(lenScaleLabel, lenScaleEl ? Number(lenScaleEl.value).toFixed(2) : '');
  setText(angleLabel,  angleEl ? angleEl.value : '');
  setText(lenRandLabel,   lenRandEl ? Number(lenRandEl.value).toFixed(2) : '');
  setText(angleRandLabel,   angleRandEl ? Number(angleRandEl.value).toFixed(2) : '');
  setText(widthLabel,  baseWidthEl ? baseWidthEl.value : '');
  setText(scaleLabel,  widthScaleEl ? Number(widthScaleEl.value).toFixed(2) : '');
  setText(treeBlossomSizeLabel, treeBlossomSizeEl ? treeBlossomSizeEl.value : '');
  setText(pathWidthLabel, pathWidthEl ? pathWidthEl.value : '');
  setText(fernPointsLabel, fernPointsEl ? fernPointsEl.value : '');
  setText(fernSizeLabel,   fernSizeEl ? Number(fernSizeEl.value).toFixed(2) : '');
  setText(eraserSizeLabel, eraserSizeEl ? eraserSizeEl.value : '');
  setText(flowerBlossomSizeLabel, flowerBlossomSizeEl ? flowerBlossomSizeEl.value : '');

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
  
  if (playbackSpeedEl && playbackSpeedLabel) {
      const speed = parseInt(playbackSpeedEl.value, 10);
      let label = 'Medium';
      if (speed > 800) label = 'Fast';
      else if (speed < 200) label = 'Slow';
      playbackSpeedLabel.textContent = label;
  }
}
const levelsLabel = document.getElementById('levelsLabel');
const lenLabel    = document.getElementById('lenLabel');
const lenScaleLabel = document.getElementById('lenScaleLabel');
const angleLabel  = document.getElementById('angleLabel');
const lenRandLabel   = document.getElementById('lenRandLabel');
const angleRandLabel   = document.getElementById('angleRandLabel');
const widthLabel  = document.getElementById('widthLabel');
const scaleLabel  = document.getElementById('scaleLabel');
const pathWidthLabel = document.getElementById('pathWidthLabel');
const fernPointsLabel = document.getElementById('fernPointsLabel');
const fernSizeLabel   = document.getElementById('fernSizeLabel');
const eraserSizeLabel = document.getElementById('eraserSizeLabel');

[
  levelsEl,baseEl,lenScaleEl,angleEl,lenRandEl,angleRandEl,baseWidthEl,widthScaleEl,pathWidthEl,fernPointsEl,fernSizeEl,eraserSizeEl,
  treeBlossomSizeEl, flowerBlossomSizeEl,
  windAmpEl,windSpeedEl, svgFernThinEl,
  snowIterEl,snowSizeEl,snowStrokeEl,
  flowerIterEl,flowerAngleEl,flowerStepEl,flowerStrokeEl,
  vineLengthEl,vineNoiseEl,vineStrokeEl,
  cloudCountEl,cloudMinDEl,cloudMaxDEl,cloudMinWEl,cloudMaxWEl,cloudBlurEl,
  otherScaleMinEl, otherScaleMaxEl, newObjectAlphaSliderEl, playbackSpeedEl
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

if (enableGradientEl) {
    enableGradientEl.addEventListener('change', () => {
        if(gradientControlsEl) gradientControlsEl.style.display = enableGradientEl.checked ? 'block' : 'none';
        if (!isAnimating()) redrawAll();
    });
}
[backgroundColorEl, backgroundColor2El].filter(Boolean).forEach(el => {
    el.addEventListener('input', () => {
        if (!isAnimating()) redrawAll();
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
    const val = Number(levelAlphaEl.value); const lab = document.getElementById('levelAlphaLabel'); if (lab) lab.textContent = val.toFixed(2);
    const applyToAll = applyAllEl && applyAllEl.checked;
    if (applyToAll) { trees.forEach(t => { if (selectedLevelIndex < t.levels) { t.levelAlphas[selectedLevelIndex] = val; } });
    } else if (selectedTreeIndex != null) {
      const t = trees[selectedTreeIndex]; if (selectedLevelIndex < t.levels) { t.levelAlphas[selectedLevelIndex] = val; }
    } else { return; }
    pushHistory(); if (!isAnimating()) redrawAll();
  });
}