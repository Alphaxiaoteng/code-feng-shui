/**
 * 代码风水罗盘 (CodeFengShui) - 旗舰三幕独立场景核心逻辑架构
 * 
 * 场景 1: 【投喂经卷 (Scene 1: Input)】- 820px 宽敞中央编辑台、文件拖拽秒读、剪贴板读取、经典卷宗药丸
 * 场景 2: 【动盘堪舆 (Scene 2: Inspection)】- 380px 巨幅八卦罗盘、周天 360° 微雕、水银天池颤针、神煞手风琴处方案
 * 场景 3: 【请神化煞 (Scene 3: Delivery)】- 纯阳双栏 Diff 对比、一键复制代码、2K 宣纸神符离屏绘制与下载、PR 战报
 * 
 * 全局准则：零 Emoji（全手绘矢量 SVG）、默认完全静音（彻底剔除持续低频 Drone）、平滑 60fps 动力学
 */

const state = {
  currentScene: 'scene-input', // 'scene-input' | 'scene-inspection' | 'scene-delivery'
  samples: [],
  currentSampleId: 'god_mode',
  merit: 88,
  soundEnabled: false, // 默认彻底静音，绝无扰人嗡鸣
  currentReport: null,
  rawCodeBefore: '',
  purifiedCodeAfter: '',
  currentLang: 'javascript',

  // 罗盘动力学参数
  targetAngle: 180,
  currentNeedleAngle: 180,
  needleVelocity: 0,
  discRotation: 0,
  discVelocity: 0,
  isDraggingDisc: false
};

// ============================================================================
// 1. 全屏太极两仪周天星斗粒子场 (QiParticleUniverse)
// ============================================================================
class QiParticleUniverse {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 140;
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.mode = 'cursed'; // 'cursed' | 'purified'

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.initParticles();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * (Math.max(this.width, this.height) * 0.55);
    return {
      x: this.width * 0.5 + Math.cos(angle) * dist,
      y: this.height * 0.5 + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 1.0 + Math.random() * 2.0,
      alpha: 0.12 + Math.random() * 0.5,
      orbitSpeed: (Math.random() * 0.0008 + 0.0002) * (Math.random() > 0.5 ? 1 : -1),
      angle: angle,
      radius: dist,
      hueVariation: Math.random() * 30 - 15
    };
  }

  setMode(mode) {
    this.mode = mode;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.angle += p.orbitSpeed;
      p.x = cx + Math.cos(p.angle) * p.radius + p.vx * 12;
      p.y = cy + Math.sin(p.angle) * p.radius + p.vy * 12;

      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && dist > 0) {
        const force = (100 - dist) / 100;
        p.x += (dx / dist) * force * 4;
        p.y += (dy / dist) * force * 4;
      }

      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      let r, g, b;
      if (this.mode === 'cursed') {
        r = Math.min(255, 239 + p.hueVariation);
        g = Math.max(0, 68 + p.hueVariation);
        b = Math.max(0, 68 + p.hueVariation);
      } else {
        if (i % 2 === 0) {
          r = 16; g = 185; b = 129;
        } else {
          r = 245; g = 158; b = 11;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
      ctx.fill();
    }
  }
}

let particleUniverse = null;

// ============================================================================
// 2. 清静微音效系统 (默认静音，彻底消除持续低频 Drone，仅保留极短手势触感音)
// ============================================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 极短齿轮微触感 (Tick - 35ms 极短微触)
function playGentleTick() {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
}

// 极短清磬声 (Chime - 300ms 纯净单音)
function playGentleChime() {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch (e) {}
}

// ============================================================================
// 3. 三幕分场景流转控制器 (Scene Flow Controller)
// ============================================================================
function switchScene(sceneId) {
  state.currentScene = sceneId;

  // 1. 隐藏所有场景，显现目标场景
  const scenes = ['scene-input', 'scene-inspection', 'scene-delivery'];
  scenes.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === sceneId) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // 2. 导航 Stepper 高亮切换
  const stepMap = {
    'scene-input': 'nav-step-1',
    'scene-inspection': 'nav-step-2',
    'scene-delivery': 'nav-step-3'
  };

  ['nav-step-1', 'nav-step-2', 'nav-step-3'].forEach(stepId => {
    const btn = document.getElementById(stepId);
    if (!btn) return;
    btn.classList.remove('active');
    if (stepMap[sceneId] === stepId) {
      btn.classList.add('active');
    }
  });

  // 3. 页面视口置顶平滑回弹
  window.scrollTo({ top: 0, behavior: 'smooth' });
  playGentleTick();
}

// ============================================================================
// 4. 周天 360 度精密刻度盘 SVG 渲染与正统二十四山
// ============================================================================
function initDialSVG() {
  const svg = document.getElementById('luopan-ticks-svg');
  if (!svg) return;

  const cx = 190;
  const cy = 190;
  const rOuter = 175;
  let paths = '';

  paths += `<circle cx="${cx}" cy="${cy}" r="175" stroke="rgba(245, 158, 11, 0.45)" stroke-width="1.2" fill="none"/>`;
  paths += `<circle cx="${cx}" cy="${cy}" r="166" stroke="rgba(245, 158, 11, 0.25)" stroke-width="0.8" fill="none"/>`;
  paths += `<circle cx="${cx}" cy="${cy}" r="118" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.0" fill="none"/>`;
  paths += `<circle cx="${cx}" cy="${cy}" r="68" stroke="rgba(245, 158, 11, 0.5)" stroke-width="1.5" fill="none"/>`;

  for (let i = 0; i < 360; i += 2) {
    const rad = (i * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let tickLen = 3.5;
    let strokeColor = 'rgba(245, 158, 11, 0.2)';
    let strokeWidth = 0.6;

    if (i % 15 === 0) {
      tickLen = 9;
      strokeColor = 'rgba(245, 158, 11, 0.85)';
      strokeWidth = 1.4;
      const rx = cx + (rOuter - 11) * cos;
      const ry = cy + (rOuter - 11) * sin;
      paths += `<circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="1.2" fill="#fbbf24"/>`;
    } else if (i % 5 === 0) {
      tickLen = 6;
      strokeColor = 'rgba(245, 158, 11, 0.5)';
      strokeWidth = 1.0;
    }

    const x1 = cx + rOuter * cos;
    const y1 = cy + rOuter * sin;
    const x2 = cx + (rOuter - tickLen) * cos;
    const y2 = cy + (rOuter - tickLen) * sin;

    paths += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
  }

  svg.innerHTML = paths;
}

function initTwentyFourMountains() {
  const container = document.getElementById('ring-twentyfour-disc');
  if (!container) return;
  container.innerHTML = '';

  const mountains = [
    { name: '子', isRed: true },
    { name: '癸', isRed: false },
    { name: '丑', isRed: false },
    { name: '艮', isRed: true },
    { name: '寅', isRed: false },
    { name: '甲', isRed: false },
    { name: '卯', isRed: true },
    { name: '乙', isRed: false },
    { name: '辰', isRed: false },
    { name: '巽', isRed: true },
    { name: '巳', isRed: false },
    { name: '丙', isRed: false },
    { name: '午', isRed: true },
    { name: '丁', isRed: false },
    { name: '未', isRed: false },
    { name: '坤', isRed: true },
    { name: '申', isRed: false },
    { name: '庚', isRed: false },
    { name: '酉', isRed: true },
    { name: '辛', isRed: false },
    { name: '戌', isRed: false },
    { name: '乾', isRed: true },
    { name: '亥', isRed: false },
    { name: '壬', isRed: false }
  ];

  const r = 150;
  mountains.forEach((m, idx) => {
    const angleDeg = idx * 15;
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const x = Math.cos(rad) * r;
    const y = Math.sin(rad) * r;

    const span = document.createElement('span');
    span.className = `mountain-char ${m.isRed ? 'red' : ''}`;
    span.textContent = m.name;
    span.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) rotate(${angleDeg}deg)`;
    container.appendChild(span);
  });
}

// ============================================================================
// 5. 罗盘 3D 景深视差与物理惯性动力学 (Luopan Physics Engine)
// ============================================================================
function initLuopanPhysics() {
  const square = document.getElementById('luopan-square-disc');
  const ringOuter = document.getElementById('ring-twentyfour-disc');
  const needle = document.getElementById('magnetic-needle');
  if (!square) return;

  let currentRotX = 0;
  let currentRotY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  square.addEventListener('mousemove', (e) => {
    if (state.isDraggingDisc) return;
    const rect = square.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetRotX = -((e.clientY - cy) / (rect.height / 2)) * 10;
    targetRotY = ((e.clientX - cx) / (rect.width / 2)) * 10;
  });

  square.addEventListener('mouseleave', () => {
    if (!state.isDraggingDisc) {
      targetRotX = 0;
      targetRotY = 0;
    }
  });

  // 触感式罗盘自由拨动旋转
  let startAngle = 0;
  let lastAngle = 0;
  let lastTime = 0;

  square.addEventListener('mousedown', (e) => {
    state.isDraggingDisc = true;
    square.classList.add('is-dragging');
    const rect = square.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) - state.discRotation;
    lastAngle = state.discRotation;
    lastTime = performance.now();
    playGentleTick();
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.isDraggingDisc) return;
    const rect = square.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const mouseAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const newRotation = mouseAngle - startAngle;

    const now = performance.now();
    const dt = Math.max(16, now - lastTime);
    state.discVelocity = (newRotation - lastAngle) / (dt / 16);

    state.discRotation = newRotation;
    lastAngle = newRotation;
    lastTime = now;
    state.needleVelocity += -state.discVelocity * 0.12;
  });

  window.addEventListener('mouseup', () => {
    if (state.isDraggingDisc) {
      state.isDraggingDisc = false;
      square.classList.remove('is-dragging');
    }
  });

  // 60fps 动力学循环
  function renderLoop() {
    currentRotX += (targetRotX - currentRotX) * 0.1;
    currentRotY += (targetRotY - currentRotY) * 0.1;
    square.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;

    if (!state.isDraggingDisc && Math.abs(state.discVelocity) > 0.02) {
      state.discRotation += state.discVelocity;
      state.discVelocity *= 0.94;
      if (ringOuter) {
        ringOuter.style.transform = `translateZ(16px) rotate(${state.discRotation.toFixed(1)}deg)`;
      }
    } else if (state.isDraggingDisc && ringOuter) {
      ringOuter.style.transform = `translateZ(16px) rotate(${state.discRotation.toFixed(1)}deg)`;
    }

    // 水银天池磁针阻尼振子
    const springK = 0.06;
    const damping = 0.88;
    const angleDiff = state.targetAngle - state.currentNeedleAngle;
    state.needleVelocity += angleDiff * springK;
    state.needleVelocity *= damping;
    state.currentNeedleAngle += state.needleVelocity;

    if (needle) {
      needle.style.transform = `translateZ(52px) rotate(${state.currentNeedleAngle.toFixed(2)}deg)`;
    }

    requestAnimationFrame(renderLoop);
  }
  renderLoop();
}

function triggerCompassBurst() {
  const ringOuter = document.querySelector('.ring-twentyfour');
  const ringInner = document.querySelector('.ring-bagua-core');
  if (ringOuter) {
    ringOuter.classList.remove('spin-burst');
    void ringOuter.offsetWidth;
    ringOuter.classList.add('spin-burst');
  }
  if (ringInner) {
    ringInner.classList.remove('spin-burst');
    void ringInner.offsetWidth;
    ringInner.classList.add('spin-burst');
  }
}

function setNeedleAngle(angle, isQuiver = false) {
  state.targetAngle = angle;
  const needle = document.getElementById('magnetic-needle');
  const statusLabel = document.getElementById('luopan-status-text');

  if (needle) {
    needle.style.setProperty('--target-angle', `${angle}deg`);
    if (isQuiver) {
      needle.classList.add('quiver');
      if (statusLabel) {
        statusLabel.textContent = '阴气暴涨 · 天池针颤';
        statusLabel.style.color = '#ef4444';
      }
    } else {
      needle.classList.remove('quiver');
      if (statusLabel) {
        statusLabel.textContent = '天池气场平顺 · 子午归正';
        statusLabel.style.color = '#f59e0b';
      }
    }
  }
}

// ============================================================================
// 6. 编辑台行号与代码属性同步 (Desk Editor Engine)
// ============================================================================
function updateEditorMetrics() {
  const textarea = document.getElementById('main-code-input');
  const lineNumbers = document.getElementById('desk-line-numbers');
  const statsLabel = document.getElementById('editor-char-stats');
  const langPill = document.getElementById('current-lang-pill');
  if (!textarea || !lineNumbers) return;

  const code = textarea.value || '';
  const lines = code.split('\n');
  const lineCount = lines.length;

  let numsHtml = '';
  for (let i = 1; i <= lineCount; i++) {
    numsHtml += `${i}<br>`;
  }
  lineNumbers.innerHTML = numsHtml;

  if (statsLabel) {
    statsLabel.textContent = `${lineCount} 行 · ${code.length.toLocaleString()} 字符`;
  }

  // 语言启发式检测
  if (code.includes('def ') || code.includes('import ') || (code.includes('class ') && code.includes(':'))) {
    state.currentLang = 'python';
    if (langPill) langPill.textContent = 'Python';
  } else {
    state.currentLang = 'javascript';
    if (langPill) langPill.textContent = 'JavaScript';
  }
}

// ============================================================================
// 7. 核心堪舆业务逻辑与报告渲染 (Analysis & Report Presentation)
// ============================================================================
const TAOIST_PRESCRIPTIONS = {
  'ANCESTRAL_SMOKE': {
    cure: '闭合全局结界：去除 window/global 挂载，改用 ES 模块闭包或上下文依赖注入。',
    tag: '除阴化阳'
  },
  'JIUYIN_PIERCING': {
    cure: '平铺层级龙脉：将 4+ 重深渊回调嵌套拆解为平铺的 async/await 管道。',
    tag: '开渠引流'
  },
  'TRAPPED_DRAGON': {
    cure: '破除死锁绝阵：为定时器或无界循环增设 AbortController 与清理句柄，阻断泄漏。',
    tag: '解困升天'
  },
  'SILENT_TOMB': {
    cure: '揭开死盖暗棺：严禁空 catch 吞噬异常！改用 Result 模式或主动记录错误链路。',
    tag: '明察秋毫'
  },
  'POVERTY_STAR': {
    cure: '收敛金气财运：严禁前端明文暴露密钥，转入服务端反向代理或环境变量保护。',
    tag: '聚财固本'
  },
  'LONGMAI_BLOCKED': {
    cure: '分经疏络断龙：将 60+ 行巨型函数拆解为纯函数微模块，遵循单一职责。',
    tag: '通络活血'
  }
};

async function executeAnalysis() {
  const textarea = document.getElementById('main-code-input');
  const code = textarea ? textarea.value : '';
  state.rawCodeBefore = code;

  playGentleChime();
  triggerCompassBurst();

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, lang: state.currentLang })
    });
    const report = await res.json();
    state.currentReport = report;

    if (particleUniverse) {
      particleUniverse.setMode(report.sha_score === 0 ? 'purified' : 'cursed');
    }

    renderInspectionView(report, code);
    switchScene('scene-inspection');
  } catch (err) {
    console.error('堪舆失败', err);
  }
}

function renderInspectionView(report, code) {
  // 1. 罗盘磁针指示
  const isQuiver = (report.sha_score >= 60);
  setNeedleAngle(report.compass_angle || 0, isQuiver);

  // 2. 八字与吉凶徽章
  const rankBadge = document.getElementById('omen-rank-badge');
  if (rankBadge) {
    rankBadge.textContent = report.rank;
    rankBadge.style.color = report.omen_color || '#ef4444';
    rankBadge.style.borderColor = report.omen_color || '#ef4444';
  }
  const baziEl = document.getElementById('bazi-pillars-text');
  if (baziEl) {
    baziEl.textContent = report.bazi || '庚子 戊子 凶神坐煞 亡劫同临';
  }

  // 3. 统计数字
  const lines = (code || '').split('\n').length;
  document.getElementById('metric-lines-val').textContent = `${lines}`;
  document.getElementById('metric-complexity-val').textContent = `${report.complexity || 1}`;
  document.getElementById('metric-depth-val').textContent = `${report.max_depth || 1}`;
  
  const curSample = state.samples.find(s => s.id === state.currentSampleId);
  document.getElementById('scripture-title-label').textContent = curSample ? curSample.title : '自定义卷宗';

  // 4. 五行横向柱状能量 (按 width 百分比伸缩)
  let fireSha = 15, waterSha = 15, metalSha = 15, woodSha = 15, earthSha = 15;
  (report.shas || []).forEach(sha => {
    if (sha.element === '火') fireSha += 38;
    else if (sha.element === '水') waterSha += 38;
    else if (sha.element === '金') metalSha += 38;
    else if (sha.element === '木') woodSha += 38;
    else if (sha.element === '土') earthSha += 38;
  });

  const barFire = document.getElementById('bar-fire');
  const barWater = document.getElementById('bar-water');
  const barMetal = document.getElementById('bar-metal');
  const barWood = document.getElementById('bar-wood');
  const barEarth = document.getElementById('bar-earth');

  if (barFire) barFire.style.width = `${Math.min(fireSha, 100)}%`;
  if (barWater) barWater.style.width = `${Math.min(waterSha, 100)}%`;
  if (barMetal) barMetal.style.width = `${Math.min(metalSha, 100)}%`;
  if (barWood) barWood.style.width = `${Math.min(woodSha, 100)}%`;
  if (barEarth) barEarth.style.width = `${Math.min(earthSha, 100)}%`;

  // 5. 判词
  const verdictEl = document.getElementById('taoist-verdict-text');
  if (verdictEl) {
    verdictEl.textContent = `“${report.verdict}”`;
  }

  // 6. 神煞手风琴处方案 (匹配 CSS 类名: sha-accordion-card, sha-acc-header, sha-acc-body, expanded)
  const countPill = document.getElementById('inspection-sha-count');
  if (countPill) countPill.textContent = `${report.issues_count || 0} 处煞位`;

  const accordion = document.getElementById('inspection-sha-accordion');
  if (accordion) {
    accordion.innerHTML = '';
    if (!report.shas || !report.shas.length) {
      accordion.innerHTML = `
        <div class="sha-accordion-card auspicious expanded">
          <div class="sha-acc-header">
            <div class="sha-acc-title">
              <span class="sha-element-badge">纯阳</span>
              <span class="sha-acc-name">天心纯正 · 诸神护佑</span>
            </div>
          </div>
          <div class="sha-acc-body">
            <div class="sha-detail-line">
              <span class="sha-lbl cure">道长批注:</span>
              <span>经卷行文清朗纯正，单测全绿，无阴煞暗桩附着，线上永无宕机之虞。</span>
            </div>
          </div>
        </div>
      `;
    } else {
      report.shas.forEach((sha, idx) => {
        const presc = TAOIST_PRESCRIPTIONS[sha.type] || {
          cure: '遵循单一职责与纯函数准则，消除全局副作用。',
          tag: '化煞重构'
        };

        const card = document.createElement('div');
        card.className = `sha-accordion-card ${idx === 0 ? 'expanded' : ''}`;
        const lineText = sha.line ? `L${sha.line}` : (sha.line_no ? `L${sha.line_no}` : `L${idx + 1}`);

        card.innerHTML = `
          <div class="sha-acc-header">
            <div class="sha-acc-title">
              <span class="sha-element-badge">${sha.element || '火'} · ${sha.omen || '凶'}</span>
              <span class="sha-acc-name">${sha.sha_name}</span>
              <span class="sha-acc-line">${lineText}</span>
            </div>
            <span class="sha-acc-chevron">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
          </div>
          <div class="sha-acc-body">
            <div class="sha-detail-line">
              <span class="sha-lbl">病灶根因:</span>
              <span>${sha.detail}</span>
            </div>
            <div class="sha-detail-line">
              <span class="sha-lbl cure">道家处方:</span>
              <span>${presc.cure}</span>
            </div>
          </div>
        `;

        card.querySelector('.sha-acc-header').onclick = () => {
          card.classList.toggle('expanded');
          playGentleTick();
        };

        accordion.appendChild(card);
      });
    }
  }
}

// ============================================================================
// 8. 请神重构 · 交付场景渲染 (Consecration & Delivery)
// ============================================================================
async function executeConsecration() {
  playGentleChime();
  triggerCompassBurst();

  try {
    const res = await fetch('/api/consecrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sample_id: state.currentSampleId })
    });
    const data = await res.json();
    state.purifiedCodeAfter = data.consecrated_code;
    state.merit += (data.merit_gained || 88);

    document.getElementById('merit-counter').textContent = `+${state.merit}`;

    renderDeliveryView(data);
    switchScene('scene-delivery');
  } catch (err) {
    console.error('化煞重构失败', err);
  }
}

function renderDeliveryView(data) {
  // 1. 祝福横幅
  const blessingEl = document.getElementById('delivery-title-blessing');
  if (blessingEl) {
    blessingEl.textContent = data.taoist_blessing || '敕令：天圆地方，律令九章。万虫潜藏，单测全绿！';
  }

  // 2. 双栏 Diff 填充
  const beforeCode = state.rawCodeBefore || '// 原代码未记录';
  const afterCode = state.purifiedCodeAfter || '// 纯阳重构代码';

  const beforePre = document.getElementById('diff-code-before');
  const afterPre = document.getElementById('diff-code-after');
  if (beforePre) {
    const codeTag = beforePre.querySelector('code') || beforePre;
    codeTag.textContent = beforeCode;
  }
  if (afterPre) {
    const codeTag = afterPre.querySelector('code') || afterPre;
    codeTag.textContent = afterCode;
  }

  const beforeStats = document.getElementById('diff-before-stats');
  const afterStats = document.getElementById('diff-after-stats');
  if (beforeStats) beforeStats.textContent = `${beforeCode.split('\n').length} 行 · 阴煞深重`;
  if (afterStats) afterStats.textContent = `${afterCode.split('\n').length} 行 · 纯阳零副作用`;

  if (particleUniverse) {
    particleUniverse.setMode('purified');
  }
}

// ============================================================================
// 9. 2K 故宫宣纸神符壁纸离屏生成器 (Canvas 2K Talisman Poster)
// ============================================================================
function generate2KTalismanPoster() {
  const report = state.currentReport || {
    bazi: '庚子 戊子 纯阳正气 万象咸安',
    rank: '大吉 · 诸神护佑',
    issues_count: 0
  };

  const canvas = document.createElement('canvas');
  const width = 2400;
  const height = 3200;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 宣纸底色与微杂质
  ctx.fillStyle = '#f5eedc';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 30000; i++) {
    const nx = Math.random() * width;
    const ny = Math.random() * height;
    ctx.fillStyle = `rgba(120, 80, 40, ${Math.random() * 0.035})`;
    ctx.fillRect(nx, ny, 2 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // 宣纸暗角与自然过渡
  const vignette = ctx.createRadialGradient(width/2, height/2, width*0.2, width/2, height/2, width*0.75);
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  vignette.addColorStop(1, 'rgba(140, 90, 40, 0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // 传统回字朱砂雷纹框
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 14;
  ctx.strokeRect(100, 100, width - 200, height - 200);

  ctx.lineWidth = 6;
  ctx.strokeRect(130, 130, width - 260, height - 260);

  // 天书云篆
  ctx.fillStyle = '#991b1b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 96px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillText('太 上 老 君 急 急 如 律 令', width / 2, 260);

  ctx.font = '900 210px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillText('敕  令', width / 2, 470);

  ctx.font = 'bold 110px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillText('雷 霆 破 煞 镇 诸 虫', width / 2, 680);

  // 太极八卦天池圈
  ctx.save();
  ctx.translate(width / 2, 1100);
  
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 320, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 300, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 52px "Songti SC", "Noto Serif SC", STSong, serif';
  const yaos = ['☰ 乾', '☴ 巽', '☵ 坎', '☶ 艮', '☷ 坤', '☳ 震', '☲ 离', '☱ 兑'];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rx = Math.cos(a) * 250;
    const ry = Math.sin(a) * 250;
    ctx.fillText(yaos[i], rx, ry);
  }

  // 阴阳双鱼
  ctx.beginPath();
  ctx.arc(0, 0, 140, 0, Math.PI * 2);
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -70, 70, -Math.PI / 2, Math.PI / 2, true);
  ctx.arc(0, 70, 70, -Math.PI / 2, Math.PI / 2, false);
  ctx.stroke();
  ctx.restore();

  // 命格批注
  ctx.font = 'bold 88px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillStyle = '#7f1d1d';
  ctx.fillText(`【代码命格：${report.bazi || '纯阳正气 · 诸神护佑'}】`, width / 2, 1560);

  ctx.font = 'bold 74px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillText(`风水定级：${report.rank || '大吉'}   ·   煞位：${report.issues_count || 0} 处`, width / 2, 1690);

  // 四句七言批命诗
  ctx.font = 'bold 84px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillStyle = '#991b1b';
  const poems = [
    '天圆地方律令章，吾今开光诸虫藏。',
    '全局单例归模块，异常捕获守资损。',
    '深渊嵌套尽消解，圈复杂度归太清。',
    '单测全绿无灾咎，线上千年永不倾！'
  ];
  poems.forEach((line, idx) => {
    ctx.fillText(line, width / 2, 1920 + idx * 125);
  });

  // 朱砂印章
  ctx.save();
  ctx.translate(width / 2 + 560, 2480);
  ctx.rotate(-0.05);

  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 12;
  ctx.strokeRect(-160, -160, 320, 320);

  ctx.lineWidth = 4;
  ctx.strokeRect(-144, -144, 288, 288);

  ctx.fillStyle = '#b91c1c';
  ctx.font = '900 68px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillText('正一玄坛', 0, -50);
  ctx.fillText('代码镇符', 0, 50);
  ctx.restore();

  // 底部落款
  ctx.fillStyle = '#78350f';
  ctx.font = '54px "Songti SC", "Noto Serif SC", STSong, serif';
  ctx.fillText('正一天师 · 赛博代码风水罗盘 (CodeFengShui) 钦赐镇宅神符', width / 2, 2880);
  ctx.font = '42px monospace';
  ctx.fillText(`Generated on ${new Date().toISOString().split('T')[0]}`, width / 2, 2970);

  // 下载
  const link = document.createElement('a');
  link.download = `code_fengshui_talisman_2k_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ============================================================================
// 10. 全局初始化与事件监听绑定 (Initialization & Event Binding)
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  // 1. 初始化星空背景与罗盘 SVG
  particleUniverse = new QiParticleUniverse('bg-canvas');
  initDialSVG();
  initTwentyFourMountains();
  initLuopanPhysics();

  // 2. 场景向导 Stepper 点击监听
  ['nav-step-1', 'nav-step-2', 'nav-step-3'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const targetScene = btn.getAttribute('data-scene');
      if (targetScene) switchScene(targetScene);
    });
  });

  // 3. 拉取后端样例库
  try {
    const res = await fetch('/api/samples');
    state.samples = await res.json();
  } catch (err) {
    console.warn('样本获取失败', err);
  }

  // 4. 渲染场景 1 道藏册府 · 奇煞档案锦匣画廊 (Dossier Cards Gallery)
  const cardsTrack = document.getElementById('dossier-cards-track');
  const textarea = document.getElementById('main-code-input');
  const briefSealMark = document.getElementById('brief-seal-mark');
  const briefTitle = document.getElementById('brief-title');
  const briefLangTag = document.getElementById('brief-lang-tag');
  const briefStory = document.getElementById('brief-story');
  const galleryCountPill = document.getElementById('gallery-count-pill');

  function getDossierSvgIcon(iconType) {
    switch (iconType) {
      case 'coin':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><rect x="9" y="9" width="6" height="6" rx="1"></rect><path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path></svg>`;
      case 'blackhole':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"></circle><path d="M12 2a10 10 0 0 0-7.07 2.93l1.41 1.41A8 8 0 0 1 12 4zM22 12a10 10 0 0 0-2.93-7.07l-1.41 1.41A8 8 0 0 1 20 12zM12 22a10 10 0 0 0 7.07-2.93l-1.41-1.41A8 8 0 0 1 12 20zM2 12a10 10 0 0 0 2.93 7.07l1.41-1.41A8 8 0 0 1 4 12z"></path></svg>`;
      case 'abyss':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m19 5-7 7-7-7"></path><path d="m19 11-7 7-7-7"></path><path d="m19 17-7 7-7-7"></path></svg>`;
      case 'key':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="15" r="4"></circle><path d="m10.85 12.15 7.65-7.65a1.5 1.5 0 0 1 2.12 0l1.41 1.41a1.5 1.5 0 0 1 0 2.12l-7.65 7.65"></path><path d="m14 7 3 3"></path></svg>`;
      case 'lock':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
      case 'wind':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>`;
      case 'coffin':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="8 2 16 2 19 8 16 22 8 22 5 8 8 2"></polygon><line x1="12" y1="7" x2="12" y2="15"></line><line x1="9" y1="10" x2="15" y2="10"></line></svg>`;
      case 'pure_dao':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 0 0 20 5 5 0 0 0 0-10 5 5 0 0 1 0-10z"></path><circle cx="12" cy="7" r="1.5"></circle><circle cx="12" cy="17" r="1.5"></circle></svg>`;
      default:
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
    }
  }

  function loadSample(sample) {
    state.currentSampleId = sample.id;
    if (textarea) textarea.value = sample.code;
    updateEditorMetrics();

    // 更新照壁 Briefing
    if (briefSealMark) {
      briefSealMark.textContent = `【${sample.omen_level || '煞位'}】`;
      briefSealMark.className = `brief-seal-mark ${sample.id === 'daji_clean' ? 'good' : ''}`;
    }
    if (briefTitle) briefTitle.textContent = sample.title;
    if (briefLangTag) briefLangTag.textContent = `${sample.lang.toUpperCase()} · ${sample.element || '五行'}位`;
    if (briefStory) briefStory.textContent = sample.story || sample.desc;

    // 更新卡片激活态
    document.querySelectorAll('.dossier-card').forEach(card => {
      const isActive = card.getAttribute('data-id') === sample.id;
      card.classList.toggle('active', isActive);
      if (isActive) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    if (particleUniverse) {
      particleUniverse.setMode(sample.id === 'daji_clean' ? 'purified' : 'cursed');
    }

    playGentleTick();
  }

  if (cardsTrack && state.samples.length > 0) {
    cardsTrack.innerHTML = '';
    if (galleryCountPill) galleryCountPill.textContent = `${state.samples.length} 卷`;

    state.samples.forEach((sample, idx) => {
      const card = document.createElement('div');
      card.className = `dossier-card ${idx === 0 ? 'active' : ''}`;
      card.setAttribute('data-id', sample.id);

      const isGood = sample.id === 'daji_clean';
      const omenClass = isGood ? 'omen-good' : 'omen-danger';
      const iconHtml = getDossierSvgIcon(sample.icon_type);

      card.innerHTML = `
        <div class="dossier-card-top">
          <div class="dossier-icon-wrap">${iconHtml}</div>
          <span class="dossier-omen-badge ${omenClass}">${sample.omen_level || '凶煞'}</span>
        </div>
        <div class="dossier-card-title">${sample.title}</div>
        <div class="dossier-card-story">${sample.story || sample.desc}</div>
        <div class="dossier-card-meta">
          <span class="dossier-lang-pill">${sample.lang}</span>
          <span class="dossier-element-pill">${sample.element || '煞'}位</span>
        </div>
      `;

      card.onclick = () => loadSample(sample);
      cardsTrack.appendChild(card);
    });

    // 默认载入第一个案卷
    loadSample(state.samples[0]);
  }

  // 左右翻卷按钮绑定
  const btnPrev = document.getElementById('btn-gallery-prev');
  const btnNext = document.getElementById('btn-gallery-next');
  if (btnPrev && cardsTrack) {
    btnPrev.onclick = () => {
      cardsTrack.scrollBy({ left: -260, behavior: 'smooth' });
      playGentleTick();
    };
  }
  if (btnNext && cardsTrack) {
    btnNext.onclick = () => {
      cardsTrack.scrollBy({ left: 260, behavior: 'smooth' });
      playGentleTick();
    };
  }

  // 5. 场景 1 编辑器事件与快捷工具
  if (textarea) {
    textarea.addEventListener('input', () => updateEditorMetrics());
    textarea.addEventListener('scroll', () => {
      const lineNumbers = document.getElementById('desk-line-numbers');
      if (lineNumbers) lineNumbers.scrollTop = textarea.scrollTop;
    });
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeAnalysis();
      }
    });
  }

  // 场景 1 随机布煞按钮 (虚空布煞 · 随机天机)
  const btnRandom = document.getElementById('btn-desk-random');
  if (btnRandom) {
    btnRandom.addEventListener('click', () => {
      if (!state.samples.length) return;
      // 随机选取非当前的另一篇样本
      const otherSamples = state.samples.filter(s => s.id !== state.currentSampleId);
      const chosen = otherSamples.length ? otherSamples[Math.floor(Math.random() * otherSamples.length)] : state.samples[0];
      loadSample(chosen);
      playGentleChime();
    });
  }

  // 场景 1 粘贴按钮 (虚空纳气)
  const btnPaste = document.getElementById('btn-desk-paste');
  if (btnPaste) {
    btnPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && textarea) {
          textarea.value = text;
          updateEditorMetrics();
          playGentleChime();
        }
      } catch (e) {
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }
    });
  }

  // 场景 1 清空按钮 (焚香净砚)
  const btnClear = document.getElementById('btn-desk-clear');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (textarea) {
        textarea.value = '';
        updateEditorMetrics();
        textarea.focus();
        playGentleTick();
      }
    });
  }

  // 场景 1 拖拽代码文件 (Drag and Drop)
  const dropZone = document.getElementById('drop-zone');

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (textarea && evt.target.result) {
            textarea.value = evt.target.result;
            updateEditorMetrics();
            playGentleTick();
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // 场景 1 底部行动按钮【动罗盘·立坛堪舆】
  const btnLaunch = document.getElementById('btn-launch-analyze');
  if (btnLaunch) {
    btnLaunch.addEventListener('click', () => executeAnalysis());
  }

  // 场景 2 交互按钮
  const btnBackInput = document.getElementById('btn-back-to-input');
  if (btnBackInput) {
    btnBackInput.addEventListener('click', () => switchScene('scene-input'));
  }

  const btnTriggerConsecrate = document.getElementById('btn-trigger-consecrate');
  if (btnTriggerConsecrate) {
    btnTriggerConsecrate.addEventListener('click', () => executeConsecration());
  }

  // 场景 3 交付交互按钮
  const btnCopyPurified = document.getElementById('btn-copy-purified-code');
  if (btnCopyPurified) {
    btnCopyPurified.addEventListener('click', () => {
      const code = state.purifiedCodeAfter || '';
      navigator.clipboard.writeText(code).then(() => {
        const orig = btnCopyPurified.innerHTML;
        btnCopyPurified.innerHTML = `<span>✓ 已复制纯阳重构代码到剪贴板！</span>`;
        setTimeout(() => btnCopyPurified.innerHTML = orig, 2000);
      });
    });
  }

  const btnDownloadPoster = document.getElementById('btn-download-talisman-poster');
  if (btnDownloadPoster) {
    btnDownloadPoster.addEventListener('click', () => {
      generate2KTalismanPoster();
      const orig = btnDownloadPoster.innerHTML;
      btnDownloadPoster.innerHTML = `<span>✓ 已生成 2K 故宫宣纸神符并启动下载！</span>`;
      setTimeout(() => btnDownloadPoster.innerHTML = orig, 2500);
    });
  }

  const btnCopyMarkdown = document.getElementById('btn-copy-talisman-text');
  if (btnCopyMarkdown) {
    btnCopyMarkdown.addEventListener('click', () => {
      const report = state.currentReport || {};
      const text = `
### 📜 赛博道藏 · 代码风水罗盘化煞战报
- **生辰八字**: ${report.bazi || '诸邪退避'}
- **风水定级**: ${report.rank || '大吉'}
- **神煞暗桩**: ${report.issues_count || 0} 处
- **天机判词**: ${report.verdict || '代码纯净，永不宕机'}

> ⚡ 敕令：天圆地方，律令九章。吾今重构，万恶潜藏。单测全绿，线上零故障！
      `.trim();
      navigator.clipboard.writeText(text).then(() => {
        const orig = btnCopyMarkdown.innerHTML;
        btnCopyMarkdown.innerHTML = `<span>✓ 战报已复制，可直接粘贴至 GitHub PR！</span>`;
        setTimeout(() => btnCopyMarkdown.innerHTML = orig, 2000);
      });
    });
  }

  const btnRestart = document.getElementById('btn-restart-workflow');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => switchScene('scene-input'));
  }

  // 全局静音/声音开关 (默认静音)
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundLabel = document.getElementById('sound-status-label');
  const soundIconOff = document.querySelector('.sound-icon-off');
  const soundIconOn = document.querySelector('.sound-icon-on');

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      if (state.soundEnabled) {
        btnSoundToggle.classList.remove('muted');
        if (soundLabel) soundLabel.textContent = '有声';
        if (soundIconOff) soundIconOff.style.display = 'none';
        if (soundIconOn) soundIconOn.style.display = 'inline-block';
        playGentleTick();
      } else {
        btnSoundToggle.classList.add('muted');
        if (soundLabel) soundLabel.textContent = '静音';
        if (soundIconOff) soundIconOff.style.display = 'inline-block';
        if (soundIconOn) soundIconOn.style.display = 'none';
      }
    });
  }

  // 全局键盘快捷键
  window.addEventListener('keydown', (e) => {
    const isEditing = document.activeElement === textarea;
    if (isEditing) return;

    if (e.key === 'Enter') {
      if (state.currentScene === 'scene-input') {
        e.preventDefault();
        executeAnalysis();
      }
    } else if (e.key === ' ') {
      if (state.currentScene === 'scene-inspection') {
        e.preventDefault();
        executeConsecration();
      }
    }
  });

  // 初始行号同步
  updateEditorMetrics();
});
