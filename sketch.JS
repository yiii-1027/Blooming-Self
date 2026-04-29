// ======================================================
//   Whispers of Seasons  -  sketch.js
// ======================================================

let colorsSpring = ["#FF1493", "#FF6347", "#FF8C00", "#32CD32", "#FFFF00"];
let colorsSummer = ["#00FFFF", "#4682B4", "#32CD32", "#FFD700", "#FF4500"];
let colorsAutumn = ["#FF6347", "#B22222", "#FF8C00", "#DAA520", "#FF4500"];
let colorsWinter = ["#00BFFF", "#ADD8E6", "#5F9EA0", "#FFFFFF", "#D3D3D3"];

let activeSeason;
let treeData = {};
let overAllTexture;

// 音樂改用原生 Audio，完全不會卡 preload
let musicTracks = [];
let currentTrackIndex = 0;
let currentMusic = null;
let audioStarted = false;
// 季節 → 音樂檔對照：春=track1, 夏=track2, 秋=track3, 冬=track4
const MUSIC_FILES = ['track1.mp3', 'track2.mp3', 'track3.mp3', 'track4.mp3'];

let mouseXprev = 0;
let mouseYprev = 0;

// ---------- preload ----------
function preload() {
  // 不再用 p5 的 loadSound（檔案缺失會卡住整個 preload）
  // 音樂改在 setup 用原生 Audio 處理
}

// ---------- setup ----------
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-container');
  pixelDensity(1);

  // 小張 texture 放大填畫面，減少迭代次數
  const texSize = 400;
  overAllTexture = createGraphics(texSize, texSize);
  overAllTexture.loadPixels();
  for (let i = 0; i < texSize; i++) {
    for (let j = 0; j < texSize; j++) {
      overAllTexture.set(
        i,
        j,
        color(100, noise(i / 3, j / 3, (i * j) / 50) * random([0, 20, 40]))
      );
    }
  }
  overAllTexture.updatePixels();

  activeSeason = new Spring();
  rebuildTree();
  updateSeasonIndicator();

  background(0);

  mouseXprev = mouseX;
  mouseYprev = mouseY;

  createMenu();
  setupInfoBoxes();
  setupAudio();
  setupAudioHint();
}

function rebuildTree() {
  const activeColors = getSeasonColors();
  treeData = {
    color: color(random(activeColors)),
    z: 0,
    xspan: width / 20,
    yspan: height / 10,
    next: []
  };
  generateBranch(10, activeColors, treeData);
}

// ---------- audio（原生 Audio 版本） ----------
function setupAudio() {
  musicTracks = MUSIC_FILES.map(src => {
    const a = new Audio(src);
    a.loop = true;       // 循環播放：當前歌曲播完自動從頭播
    a.volume = 0.7;
    a.preload = 'none';  // 檔案缺失時不浪費資源嘗試載入
    a.addEventListener('error', () => {}); // 靜默忽略錯誤
    return a;
  });

  // 整個畫面任何地方點擊都能啟動音樂
  window.addEventListener('pointerdown', startFirstTrackOnce);
  window.addEventListener('keydown', startFirstTrackOnce);
}

function startFirstTrackOnce() {
  if (audioStarted) return;
  audioStarted = true;
  hideAudioHint();
  playSeasonMusic();
}

// 根據當前季節播放對應音樂
function playSeasonMusic() {
  if (!audioStarted || musicTracks.length === 0) return;

  const idx = getSeasonIndex();
  const next = musicTracks[idx];
  if (!next) return;

  if (currentMusic === next && !currentMusic.paused) return;

  if (currentMusic && currentMusic !== next) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }

  currentTrackIndex = idx;
  currentMusic = next;
  currentMusic.play().catch(() => {});
}

// 「切換音樂」按鈕已移除，所以不再需要 changeMusic 函式

function getSeasonIndex() {
  if (activeSeason instanceof Spring) return 0;
  if (activeSeason instanceof Summer) return 1;
  if (activeSeason instanceof Autumn) return 2;
  if (activeSeason instanceof Winter) return 3;
  return 0;
}

// ---------- 音樂提示 ----------
function setupAudioHint() {
  const hint = document.getElementById('audio-hint');
  if (!hint) return;

  // 點提示本身也能啟動音樂
  hint.addEventListener('click', () => {
    startFirstTrackOnce();
  });
}

function hideAudioHint() {
  const hint = document.getElementById('audio-hint');
  if (hint) hint.classList.add('hidden');
}

// ---------- UI ----------
function createMenu() {
  const hamburgerButton = select('#hamburger-menu');
  const menuOptions = select('#menu-options');
  const aboutWorkBtn = select('#show-about-work');
  const aboutMeBtn = select('#show-about-me');

  if (hamburgerButton && menuOptions) {
    hamburgerButton.mousePressed(() => {
      menuOptions.elt.classList.toggle('open');
    });
  }

  if (aboutWorkBtn) {
    aboutWorkBtn.elt.addEventListener('click', (e) => {
      e.stopPropagation();
      openBox('about-work-box');
    });
  }

  if (aboutMeBtn) {
    aboutMeBtn.elt.addEventListener('click', (e) => {
      e.stopPropagation();
      openBox('about-me-box');
    });
  }
}

function setupInfoBoxes() {
  document.addEventListener('click', (e) => {
    const boxes = document.querySelectorAll('.info-box');
    const clickedInsideBox = Array.from(boxes).some(b => b.contains(e.target));
    const clickedOpenButton =
      e.target.id === 'show-about-work' ||
      e.target.id === 'show-about-me';

    if (!clickedInsideBox && !clickedOpenButton) {
      boxes.forEach(b => b.classList.remove('open'));
    }
  });
}

function openBox(id) {
  document.querySelectorAll('.info-box').forEach(b => b.classList.remove('open'));
  const target = document.getElementById(id);
  if (target) target.classList.add('open');
}

// ---------- 季節指示點同步 ----------
function updateSeasonIndicator() {
  const dots = document.querySelectorAll('#season-indicator .dot');
  if (!dots.length) return;
  const idx = getSeasonIndex();
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

// ---------- seasons ----------
function getSeasonColors() {
  if (activeSeason instanceof Spring) return colorsSpring;
  if (activeSeason instanceof Summer) return colorsSummer;
  if (activeSeason instanceof Autumn) return colorsAutumn;
  if (activeSeason instanceof Winter) return colorsWinter;
  return [color(255)];
}

function toggleSeason() {
  clearSeason();

  if (activeSeason instanceof Summer)       activeSeason = new Autumn();
  else if (activeSeason instanceof Autumn)  activeSeason = new Winter();
  else if (activeSeason instanceof Winter)  activeSeason = new Spring();
  else if (activeSeason instanceof Spring)  activeSeason = new Summer();

  rebuildTree();
  updateSeasonIndicator();
  playSeasonMusic();
}

function clearSeason() {
  clear();
  background(0);
}

// ---------- draw ----------
function draw() {
  blendMode(BLEND);
  background(0, 20);

  activeSeason.update();
  activeSeason.draw();

  blendMode(BLEND);

  push();
  translate(width / 2, height - 20);
  rotate(PI);
  drawTreeByData(treeData);
  pop();

  blendMode(MULTIPLY);
  image(overAllTexture, 0, 0, width, height);
  blendMode(BLEND);
}

// ---------- tree ----------
function generateBranch(d, colorScheme, node = {}, z = 0) {
  const xspan = random(5, 9) * random() * (width / 1000);
  const yspan = random(40, 200) * random(0.2, 1) * (height / 1000);
  const c = color(random(colorScheme));
  const exp = random(2.5, 5);

  c.setRed(red(c) + random(-10, 10));
  c.setGreen(green(c) + random(-10, 10));
  c.setBlue(blue(c) + random(-10, 10));

  const sc = random(0.91, 0.99);

  node.color = c;
  node.z = z;
  node.xspan = xspan;
  node.yspan = yspan;
  node.randomId = int(random(10000));
  node.next = [];

  if (d > 0) {
    let ang;

    push();
    translate(-xspan, yspan);
    ang = sin(d / 10) / exp + noise(d / 50 - 0.5) / exp;
    rotate(ang);
    scale(sc);
    const obj = { sc, xspan, yspan, ang };
    node.next.push(obj);
    generateBranch(d - 1, colorScheme, obj, z + 1);
    pop();

    push();
    translate(xspan, yspan);
    ang = -sin(d / 10) / exp - noise(d / 50 - 0.5) / exp;
    rotate(ang);
    scale(sc);
    const obj2 = { sc, xspan, yspan, ang };
    node.next.push(obj2);
    generateBranch(d - 1, colorScheme, obj2, z + 1);
    pop();
  }
}

function drawTreeByData(node) {
  const timeFactor = easeInOutCubic(
    map(frameCount - node.z * 50, 0, 100, 0, 1, true)
  );

  push();

  const c = node.color || color(255, 255, 255);
  const xspan = node.xspan || 0;
  const yspan = node.yspan || 0;
  const ang = node.ang || 0;
  const sc = (node.sc || 1) * timeFactor;

  c.setAlpha(200);
  stroke(c);
  noFill();
  triangle(0, 0, -xspan, yspan, xspan, yspan);

  if (node.next) {
    translate(xspan / 2, yspan);
    rotate(ang + sin(frameCount / 50 + node.randomId) / 20);
    scale(sc);
    node.next.forEach(child => drawTreeByData(child));
  }

  pop();
}

function easeInOutCubic(x) {
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// ---------- input ----------
function keyPressed() {
  if (keyCode === 32) toggleSeason();
  if (key === 's' || key === 'S') {
    save("img_" + year() + month() + day() + ".png");
  }
}

function mousePressed() {
  mouseXprev = mouseX;
  mouseYprev = mouseY;
}

function mouseDragged() {
  // 在資訊框或選單上拖曳不影響樹
  const target = (window.event && window.event.target) || null;
  if (target && target.closest && (target.closest('.info-box') || target.closest('#menu-container') || target.closest('#audio-hint'))) {
    return;
  }
  treeData.xspan += (mouseX - mouseXprev) * 0.3;
  treeData.yspan += (mouseY - mouseYprev) * 0.3;
  mouseXprev = mouseX;
  mouseYprev = mouseY;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ---------- season classes ----------
class Spring {
  constructor() {
    this.elements = [];
    for (let i = 0; i < 100; i++) {
      this.elements.push({
        pos: createVector(random(width), random(height)),
        size: random(20, 50),
        color: color(random(colorsSpring))
      });
    }
  }
  update() {
    this.elements.forEach(el => {
      el.pos.y += random(-3, 3);
      el.pos.x += random(-3, 3);
    });
  }
  draw() {
    blendMode(ADD);
    noStroke();
    this.elements.forEach(el => {
      fill(el.color);
      ellipse(el.pos.x, el.pos.y, el.size);
    });
  }
}

class Summer {
  constructor() {
    this.elements = [];
    for (let i = 0; i < 100; i++) {
      this.elements.push({
        pos: createVector(random(width), random(height)),
        size: random(20, 50),
        color: color(random(colorsSummer))
      });
    }
  }
  update() {
    this.elements.forEach(el => {
      el.size *= 0.99;
      if (el.size < 5) el.size = random(10, 40);
    });
  }
  draw() {
    blendMode(ADD);
    noStroke();
    this.elements.forEach(el => {
      fill(el.color);
      rect(el.pos.x, el.pos.y, el.size, el.size);
    });
  }
}

class Autumn {
  constructor() {
    this.elements = [];
    for (let i = 0; i < 100; i++) {
      this.elements.push({
        pos: createVector(random(width), random(height)),
        size: random(30, 60),
        angle: random(TWO_PI),
        color: color(random(colorsAutumn))
      });
    }
  }
  update() {
    this.elements.forEach(el => {
      el.pos.y += 3;
      if (el.pos.y > height) el.pos.y = 0;
    });
  }
  draw() {
    blendMode(ADD);
    noStroke();
    this.elements.forEach(el => {
      fill(el.color);
      push();
      translate(el.pos.x, el.pos.y);
      rotate(el.angle);
      triangle(-el.size / 2, el.size / 2, el.size / 2, el.size / 2, 0, -el.size);
      pop();
    });
  }
}

class Winter {
  constructor() {
    this.elements = [];
    for (let i = 0; i < 300; i++) {
      this.elements.push({
        pos: createVector(random(width), random(height)),
        size: random(10, 30),
        color: color(random(colorsWinter))
      });
    }
  }
  update() {
    this.elements.forEach(el => {
      el.pos.y += random(2, 3);
      if (el.pos.y > height) el.pos.y = 0;
    });
  }
  draw() {
    blendMode(SCREEN);
    noStroke();
    this.elements.forEach(el => {
      fill(el.color);
      ellipse(el.pos.x, el.pos.y, el.size);
    });
  }
}