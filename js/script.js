// ==================== 齿轮模拟引擎 ====================

const canvas = document.getElementById('gearCanvas');
const ctx = canvas.getContext('2d');

// 齿数
let bigTeeth = 24;
let smallTeeth = 12;
let bigRotations = 1;       // 大齿轮转动圈数（用户控制）
let smallRotations = 2;     // 小齿轮转动圈数（自动计算）

// 动画状态
let animAngleBig = 0;
let animAngleSmall = 0;
let animSpeed = 0.02;
let isAnimating = true;
let targetBigAngle = 0;
let targetSmallAngle = 0;

// 触摸/拖拽
let isDragging = false;
let dragGear = null;  // 'big' | 'small'
let dragPrevAngle = 0;
let dragStartAngle = 0;

// 齿轮位置
const bigGearX = 280, bigGearY = 260, bigGearR = 130;
const smallGearX = 630, smallGearY = 260, smallGearR = 90;

function calcSmallRotations() {
  // Z1 * R1 = Z2 * R2  =>  R2 = Z1 * R1 / Z2
  smallRotations = (bigTeeth * bigRotations) / smallTeeth;
  // 取合理精度
  smallRotations = Math.round(smallRotations * 100) / 100;
  return smallRotations;
}

function drawGear(cx, cy, radius, teethCount, rotation, color) {
  const outerR = radius;
  const innerR = radius * 0.78;
  const toothAngle = Math.PI / teethCount;
  const toothWidth = toothAngle * 0.55;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // 齿轮主体
  const gradient = ctx.createRadialGradient(0, 0, innerR * 0.3, 0, 0, outerR);
  if (color === 'orange') {
    gradient.addColorStop(0, '#5a4a3a');
    gradient.addColorStop(0.5, '#8b6914');
    gradient.addColorStop(1, '#5a3e1b');
  } else {
    gradient.addColorStop(0, '#3a4a5a');
    gradient.addColorStop(0.5, '#2b5f8a');
    gradient.addColorStop(1, '#1a3a5a');
  }

  ctx.beginPath();
  for (let i = 0; i < teethCount; i++) {
    const a0 = i * 2 * toothAngle - toothAngle;
    const a1 = a0 + toothWidth;
    const a2 = a0 + toothAngle;
    const a3 = a2 + toothWidth;

    // 齿顶
    ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    // 齿根
    ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
    ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
  }
  ctx.closePath();

  // 填充
  ctx.fillStyle = gradient;
  ctx.fill();

  // 边框
  ctx.strokeStyle = color === 'orange' ? '#8b6914' : '#1e5488';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 中心圆
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = color === 'orange' ? '#c49a2a' : '#4a8ac4';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 中心孔
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // 辐条
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + rotation;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 0.25, Math.sin(a) * radius * 0.25);
    ctx.lineTo(Math.cos(a) * radius * 0.7, Math.sin(a) * radius * 0.7);
    ctx.strokeStyle = color === 'orange' ? 'rgba(180,140,60,0.5)' : 'rgba(100,150,200,0.5)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.restore();

  // 齿数标签
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(teethCount + '齿', cx, cy - radius - 16);

  // 转向箭头
  const arrowR = radius * 0.86;
  const arrowA = rotation + 0.8;
  drawArrow(cx + Math.cos(arrowA) * arrowR, cy + Math.sin(arrowA) * arrowR, arrowA + Math.PI / 2, color === 'orange' ? '#f7971e' : '#4fc3f7');
}

function drawArrow(x, y, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(14, 0);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // 背景网格
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 连接线
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bigGearX + bigGearR, bigGearY);
  ctx.lineTo(smallGearX - smallGearR, smallGearY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 啮合提示
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('← 啮合 →', (bigGearX + bigGearR + smallGearX - smallGearR) / 2, bigGearY - 60);

  drawGear(bigGearX, bigGearY, bigGearR, bigTeeth, animAngleBig, 'orange');
  drawGear(smallGearX, smallGearY, smallGearR, smallTeeth, animAngleSmall, 'blue');

  // 标签
  ctx.fillStyle = '#f7971e';
  ctx.font = 'bold 15px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('大齿轮（主动轮）', bigGearX, bigGearY + bigGearR + 30);

  ctx.fillStyle = '#4fc3f7';
  ctx.fillText('小齿轮（从动轮）', smallGearX, smallGearY + smallGearR + 30);

  // 转动方向文字
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(bigRotations >= 0 ? '顺时针 ↻' : '逆时针 ↺', bigGearX, bigGearY + bigGearR + 48);
  ctx.fillText(smallRotations >= 0 ? '逆时针 ↺' : '顺时针 ↻', smallGearX, smallGearY + smallGearR + 48);
}

function updateAnimation() {
  if (!isAnimating) return;

  // 目标角度：大齿轮转 bigRotations 圈
  targetBigAngle = bigRotations * Math.PI * 2;
  // 小齿轮反向转动，圈数由齿数比决定
  targetSmallAngle = -smallRotations * Math.PI * 2;

  // 平滑过渡
  const lerp = 0.08;
  animAngleBig += (targetBigAngle - animAngleBig) * lerp;
  animAngleSmall += (targetSmallAngle - animAngleSmall) * lerp;

  // 当精度足够时直接设为目标值
  if (Math.abs(targetBigAngle - animAngleBig) < 0.001) animAngleBig = targetBigAngle;
  if (Math.abs(targetSmallAngle - animAngleSmall) < 0.001) animAngleSmall = targetSmallAngle;
}

function updateDisplay() {
  const sr = calcSmallRotations();
  document.getElementById('bigRotations').textContent = bigRotations.toFixed(2);
  document.getElementById('smallRotations').textContent = sr.toFixed(2);
  document.getElementById('productBig').textContent = (bigTeeth * bigRotations).toFixed(2);
  document.getElementById('productSmall').textContent = (smallTeeth * sr).toFixed(2);
  document.getElementById('smallRotDisplay').textContent = sr.toFixed(2) + ' 圈';
}

function syncSliders(source) {
  if (source === 'big') {
    document.getElementById('bigTeethSlider').value = bigTeeth;
    document.getElementById('bigTeethInput').value = bigTeeth;
    document.getElementById('bigRotSlider').value = bigRotations;
    document.getElementById('bigRotInput').value = bigRotations;
  } else {
    document.getElementById('smallTeethSlider').value = smallTeeth;
    document.getElementById('smallTeethInput').value = smallTeeth;
  }
}

function updateFromSlider(source) {
  if (source === 'big') {
    bigTeeth = parseInt(document.getElementById('bigTeethSlider').value);
    bigRotations = parseFloat(document.getElementById('bigRotSlider').value);
  } else {
    smallTeeth = parseInt(document.getElementById('smallTeethSlider').value);
  }
  syncSliders(source);
  updateDisplay();
}

function updateFromInput(source) {
  if (source === 'big') {
    let v = parseInt(document.getElementById('bigTeethInput').value);
    if (isNaN(v) || v < 8) v = 8;
    if (v > 48) v = 48;
    bigTeeth = v;

    let r = parseFloat(document.getElementById('bigRotInput').value);
    if (isNaN(r) || r < 0.1) r = 0.1;
    if (r > 10) r = 10;
    bigRotations = r;
  } else {
    let v = parseInt(document.getElementById('smallTeethInput').value);
    if (isNaN(v) || v < 8) v = 8;
    if (v > 48) v = 48;
    smallTeeth = v;
  }
  syncSliders(source);
  updateDisplay();
}

// ==================== 拖拽旋转齿轮 ====================
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  dragPrevAngle = 0;
  dragStartAngle = animAngleBig;

  const distBig = Math.hypot(mx - bigGearX, my - bigGearY);
  const distSmall = Math.hypot(mx - smallGearX, my - smallGearY);

  if (distBig < bigGearR + 20) {
    isDragging = true;
    dragGear = 'big';
    dragPrevAngle = Math.atan2(my - bigGearY, mx - bigGearX);
  } else if (distSmall < smallGearR + 20) {
    isDragging = true;
    dragGear = 'small';
    dragPrevAngle = Math.atan2(my - smallGearY, mx - smallGearX);
  }
  if (isDragging) e.preventDefault();
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  if (dragGear === 'big') {
    const curAngle = Math.atan2(my - bigGearY, mx - bigGearX);
    let delta = curAngle - dragPrevAngle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    animAngleBig += delta;
    dragPrevAngle = curAngle;

    // 同步更新圈数
    const fullRotations = animAngleBig / (2 * Math.PI);
    bigRotations = Math.max(0.1, Math.round(Math.abs(fullRotations) * 100) / 100);
    syncSliders('big');
    updateDisplay();
  } else if (dragGear === 'small') {
    const curAngle = Math.atan2(my - smallGearY, mx - smallGearX);
    let delta = curAngle - dragPrevAngle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    animAngleSmall += delta;
    dragPrevAngle = curAngle;

    // 反向推算大齿轮圈数
    const fullRotations = animAngleSmall / (2 * Math.PI);
    const sr = Math.abs(fullRotations);
    bigRotations = Math.max(0.1, Math.round((sr * smallTeeth / bigTeeth) * 100) / 100);
    smallRotations = sr;
    syncSliders('big');
    updateDisplay();
  }
});

canvas.addEventListener('mouseup', () => { isDragging = false; dragGear = null; });
canvas.addEventListener('mouseleave', () => { isDragging = false; dragGear = null; });

// 触摸事件
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY });
    canvas.dispatchEvent(mouseEvent);
    e.preventDefault();
  }
});
canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY });
    canvas.dispatchEvent(mouseEvent);
  }
});
canvas.addEventListener('touchend', () => {
  const mouseEvent = new MouseEvent('mouseup');
  canvas.dispatchEvent(mouseEvent);
});

function animate() {
  updateAnimation();
  draw();
  requestAnimationFrame(animate);
}

// ==================== 标签页 ====================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab-btn:nth-child(${tab === 'explore' ? 1 : tab === 'record' ? 2 : 3})`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');
}

// ==================== 数据记录 ====================
let records = [];

function addRecord() {
  const sr = calcSmallRotations();
  records.push({
    z1: bigTeeth, z2: smallTeeth,
    r1: bigRotations, r2: sr,
    p1: bigTeeth * bigRotations,
    p2: smallTeeth * sr,
    ratioZ: (bigTeeth / smallTeeth).toFixed(2),
    ratioR: (sr / bigRotations).toFixed(2)
  });
  renderRecords();
}

function renderRecords() {
  const tbody = document.querySelector('#recordTable tbody');
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:#666;padding:30px;">还未记录数据，请先在"探究实验"中调整齿轮参数，然后点击"记录当前数据"</td></tr>';
    return;
  }
  tbody.innerHTML = records.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.z1}</td><td>${r.z2}</td>
      <td>${r.r1.toFixed(2)}</td><td>${r.r2.toFixed(2)}</td>
      <td style="color:#ffd200;">${r.p1.toFixed(2)}</td>
      <td style="color:#ffd200;">${r.p2.toFixed(2)}</td>
      <td>${r.ratioZ}</td><td>${r.ratioR}</td>
    </tr>
  `).join('');
}

function clearRecords() {
  records = [];
  renderRecords();
}

function revealKnowledge() {
  const el = document.getElementById('knowledgeReveal');
  el.style.display = 'block';
  document.getElementById('revealBtn').style.display = 'none';
}

// ==================== 闯关游戏 ====================
let gameScore = 0;
let gameTotal = 0;
let currentQuestion = null;
let answered = false;

function uniqueNumbers(existing, count, min, max, answer) {
  const result = [];
  const used = new Set(existing);
  used.add(answer);
  let tries = 0;
  while (result.length < count && tries < 50) {
    tries++;
    const v = min + Math.floor(Math.random() * (max - min + 1));
    if (!used.has(v) && v > 0 && v !== answer) {
      used.add(v);
      result.push(v);
    }
  }
  return result;
}

function generateQuestion() {
  const types = [1, 2, 3, 4];
  let tries = 0;
  while (tries < 100) {
    tries++;
    const t = types[Math.floor(Math.random() * types.length)];
    let q = null;

    if (t === 1) {
      // 已知两齿轮齿数和主动轮圈数，求从动轮圈数
      const z1 = randInt(10, 40);
      const z2 = randInt(8, 30);
      const r1 = randInt(1, 8);
      const answer = Math.round((z1 * r1 / z2) * 100) / 100;
      if (answer <= 0 || answer > 40) continue;
      const wrongs = uniqueNumbers([], 3, 1, 40, answer);
      if (wrongs.length < 3) continue;
      q = {
        text: `大齿轮有 <b>${z1}</b> 个齿，小齿轮有 <b>${z2}</b> 个齿。大齿轮转动 <b>${r1}</b> 圈时，小齿轮转动多少圈？`,
        answer, type: 'number',
        options: shuffle([answer, ...wrongs])
      };
    } else if (t === 2) {
      // 已知从动轮圈数，反推主动轮圈数
      const z1 = randInt(12, 40);
      const z2 = randInt(8, 24);
      const r2 = randInt(2, 10);
      const answer = Math.round((z2 * r2 / z1) * 100) / 100;
      if (answer <= 0 || answer > 20) continue;
      const wrongs = uniqueNumbers([], 3, 1, 20, answer);
      if (wrongs.length < 3) continue;
      q = {
        text: `大齿轮有 <b>${z1}</b> 个齿，小齿轮有 <b>${z2}</b> 个齿。如果小齿轮转动了 <b>${r2}</b> 圈，大齿轮转动了多少圈？`,
        answer, type: 'number',
        options: shuffle([answer, ...wrongs])
      };
    } else if (t === 3) {
      // 已知总齿数相等，求未知齿数（保证整数答案）
      let z1, r1, r2, answer;
      for (let j = 0; j < 30; j++) {
        z1 = randInt(10, 30);
        r1 = randInt(2, 8);
        r2 = randInt(2, 8);
        if (r1 === r2) continue;
        answer = Math.round((z1 * r1 / r2) * 100) / 100;
        if (answer === Math.floor(answer) && answer >= 8 && answer <= 48) break;
      }
      if (!answer || answer !== Math.floor(answer) || answer < 8 || answer > 48) continue;
      const wrongs = uniqueNumbers([], 3, 8, 48, answer);
      if (wrongs.length < 3) continue;
      q = {
        text: `大齿轮有 <b>${z1}</b> 个齿，转了 <b>${r1}</b> 圈。小齿轮转了 <b>${r2}</b> 圈。小齿轮有多少个齿？`,
        answer, type: 'int',
        options: shuffle([answer, ...wrongs])
      };
    } else if (t === 4) {
      // 判断题：齿数与圈数的关系
      const z1 = randInt(12, 36);
      const z2 = randInt(8, 24);
      if (z1 === z2) continue;
      const correct = z1 > z2 ? '多' : '少';
      const wrong = z1 > z2 ? '少' : '多';
      q = {
        text: `大齿轮 ${z1} 齿，小齿轮 ${z2} 齿。大齿轮转 1 圈，小齿轮转的圈数比 1 圈__？`,
        answer: correct, type: 'text',
        options: shuffle([correct, wrong])
      };
    }

    if (q) return q;
  }
  // 兜底
  return {
    text: '大齿轮有 <b>20</b> 个齿，小齿轮有 <b>10</b> 个齿。大齿轮转动 <b>1</b> 圈时，小齿轮转动多少圈？',
    answer: 2, type: 'number',
    options: shuffle([2, 3, 5, 1])
  };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startGame() {
  gameScore = 0;
  gameTotal = 0;
  answered = false;
  document.getElementById('gameScore').textContent = '0';
  document.getElementById('gameTotal').textContent = '0';
  document.getElementById('startGameBtn').style.display = 'none';
  document.getElementById('nextGameBtn').style.display = 'inline-block';
  nextQuestion();
}

function nextQuestion() {
  answered = false;
  currentQuestion = generateQuestion();
  document.getElementById('gameQuestion').innerHTML = currentQuestion.text;
  document.getElementById('gameFeedback').innerHTML = '';

  const optsDiv = document.getElementById('gameOptions');
  optsDiv.innerHTML = currentQuestion.options.map((opt, i) => {
    let label;
    if (typeof opt === 'number') {
      const unit = currentQuestion.type === 'int' ? ' 齿' : ' 圈';
      label = (opt === Math.floor(opt)) ? opt.toString() + unit : opt.toFixed(2).replace(/\.?0+$/, '') + unit;
    } else {
      label = opt;
    }
    return `<button class="game-option" onclick="answerQuestion(${i}, this)">${label}</button>`;
  }).join('');
}

function answerQuestion(idx, btnEl) {
  if (answered) return;
  answered = true;
  gameTotal++;

  const answer = currentQuestion.answer;
  const userAnswer = currentQuestion.options[idx];

  let isCorrect = false;
  if (currentQuestion.type === 'text') {
    isCorrect = userAnswer === answer;
  } else {
    isCorrect = Math.abs(userAnswer - answer) < 0.01;
  }

  if (isCorrect) {
    gameScore++;
    btnEl.classList.add('correct');
    document.getElementById('gameFeedback').innerHTML = '✅ 正确！' + getExplanation();
  } else {
    btnEl.classList.add('wrong');
    document.querySelectorAll('.game-option').forEach((b, i) => {
      const bVal = currentQuestion.options[i];
      const cVal = answer;
      if ((currentQuestion.type === 'text' && bVal === cVal) || (currentQuestion.type !== 'text' && Math.abs(bVal - cVal) < 0.01)) {
        b.classList.add('correct');
      }
    });
    document.getElementById('gameFeedback').innerHTML = '❌ 再想想！' + getExplanation();
  }

  document.getElementById('gameScore').textContent = gameScore;
  document.getElementById('gameTotal').textContent = gameTotal;

  document.querySelectorAll('.game-option').forEach(b => b.style.pointerEvents = 'none');
}

function getExplanation() {
  return '<br><span style="font-size:13px;color:#888;">💡 规律：齿数 × 圈数 = 齿数 × 圈数（转过的总齿数相等）</span>';
}

// ==================== 自适应 Canvas ====================
function resizeCanvas() {
  const container = canvas.parentElement;
  const maxW = Math.min(container.clientWidth - 40, 900);
  const scale = maxW / 900;
  canvas.style.width = maxW + 'px';
  canvas.style.height = (520 * scale) + 'px';
}
window.addEventListener('resize', resizeCanvas);

// ==================== 启动 ====================
function init() {
  updateDisplay();
  resizeCanvas();
  animate();
}

init();
