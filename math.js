let questions = [], currentQ = 0, answers = [];
let timerInterval = null, timeLeft = 30, totalTime = 30;
let quizStartTime = 0, questionStartTime = 0;
let answerLocked = false;
let hardMode = false;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSelectedTypes() {
  return Array.from(document.querySelectorAll('.check-list input[type=checkbox]:checked'))
    .map(cb => parseInt(cb.value));
}

function makeQuestions() {
  if (hardMode) {
    const pool = [6,7,8,6,7,8,6,7];
    pool.sort(() => Math.random() - 0.5);
    return pool.map(t => genQByType(t));
  }
  const selected = getSelectedTypes();
  const pool = [];
  for (let i = 0; i < 8; i++) pool.push(selected[i % selected.length]);
  pool.sort(() => Math.random() - 0.5);
  return pool.map(t => genQByType(t));
}

function genQByType(type) {
  if (type === 0) {
    const a = rand(100, 999), b = rand(10, 99);
    return { type: 'A', label: '三桁×二桁', text: `${a} × ${b}`, answer: a * b, hint: '' };
  } else if (type === 1) {
    const a = rand(100, 999), c = rand(100, 999);
    const b = rand(100, Math.min(999, a + c));
    return { type: 'B', label: '三桁－三桁＋三桁', text: `${a} − ${b} + ${c}`, answer: a - b + c, hint: '' };
  } else if (type === 2) {
    const divisor = (rand(1, 9) / 10).toFixed(1);
    const ans = rand(10, 99) / 100;
    const dividend = parseFloat((ans * parseFloat(divisor)).toFixed(4));
    const dStr = dividend.toFixed(2);
    const correct = Math.round(parseFloat(dStr) / parseFloat(divisor) * 100) / 100;
    return { type: 'C', label: '小数÷小数', text: `${dStr} ÷ ${divisor}`, answer: correct, hint: '小数点以下2桁まで（概数）' };
  } else if (type === 3) {
    const divisor = (rand(1, 9) / 10).toFixed(1);
    let a = rand(10, 99), b = rand(10, 99);
    if (a < b) [a, b] = [b, a];
    if (a === b) a = Math.min(99, a + rand(1, 5));
    const diff = a - b;
    const correct = Math.round(diff / parseFloat(divisor) * 100) / 100;
    return { type: 'D', label: '(二桁−二桁)÷小数', text: `(${a} − ${b}) ÷ ${divisor}`, answer: correct, hint: '小数点以下2桁まで（概数）' };
  } else if (type === 4) {
    const p = rand(1, 9), q = rand(1, 9), r = rand(2, 6);
    const correct = Math.round(p * q * 3.14 / r * 100) / 100;
    return { type: 'E', label: '×3.14÷整数', text: `${p} × ${q} × 3.14 ÷ ${r}`, answer: correct, hint: '小数点以下2桁まで（概数）' };
  } else if (type === 5) {
    const a = rand(10, 99), b = rand(10, 99), c = rand(10, 99);
    return { type: 'F', label: '二桁×二桁×二桁', text: `${a} × ${b} × ${c}`, answer: a * b * c, hint: '' };
  } else if (type === 6) {
    const a = rand(1000,9999), b = rand(1000,9999), c = rand(1,9);
    return { type: 'G', label: '四桁×四桁×一桁', text: `${a} × ${b} × ${c}`, answer: a * b * c, hint: '' };
  } else if (type === 7) {
    const divisor = rand(100, 999);
    const ans = rand(10,99) * 100 + rand(0,99);
    const dividend = parseFloat((ans / 100).toFixed(2));
    const correct = Math.round(dividend / divisor * 100) / 100;
    return { type: 'H', label: '二桁.○○÷三桁', text: `${dividend.toFixed(2)} ÷ ${divisor}`, answer: correct, hint: '小数点以下2桁まで（概数）' };
  } else {
    let a, b, c, d, ans;
    do {
      a = rand(100,999); b = rand(1000,9999); c = rand(10000,99999); d = rand(1000,9999);
      ans = a + b + c - d;
    } while (ans < 0);
    return { type: 'I', label: '三桁＋四桁＋五桁－四桁', text: `${a} + ${b} + ${c} − ${d}`, answer: ans, hint: '' };
  }
}

function onHardToggle() {
  const on = document.getElementById('hard-mode-toggle').checked;
  document.getElementById('time-limit-input').disabled = on;
  document.getElementById('time-limit-input').style.opacity = on ? '0.4' : '1';
  document.getElementById('check-list') && (document.querySelector('.check-list').style.opacity = on ? '0.4' : '1');
  document.querySelectorAll('.check-list input').forEach(cb => cb.disabled = on);
}

function startQuiz() {
  hardMode = document.getElementById('hard-mode-toggle').checked;
  if (!hardMode) {
    const selected = getSelectedTypes();
    const errEl = document.getElementById('check-error');
    if (selected.length === 0) { errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
  }
  totalTime = hardMode ? 40 : Math.max(5, parseInt(document.getElementById('time-limit-input').value) || 30);
  questions = makeQuestions();
  currentQ = 0;
  answers = [];
  answerLocked = false;
  quizStartTime = Date.now();
  showScreen('quiz-screen');
  showQuestion();
}

function showQuestion() {
  const q = questions[currentQ];
  document.getElementById('q-counter').textContent = `問題 ${currentQ + 1} / 8`;
  const cls = { A: 'badge-a', B: 'badge-b', C: 'badge-c', D: 'badge-d', E: 'badge-e', F: 'badge-f', G: 'badge-g', H: 'badge-h', I: 'badge-i' }[q.type];
  document.getElementById('q-type-badge').innerHTML = `<span class="badge ${cls}">${q.type}: ${q.label}</span>`;
  document.getElementById('question-text').textContent = q.text + ' = ?';
  document.getElementById('hint-text').textContent = q.hint;
  document.getElementById('answer-input').value = '';
  document.getElementById('feedback-msg').textContent = '';
  document.getElementById('feedback-msg').className = 'feedback';
  document.getElementById('quit-confirm').style.display = 'none';
  document.getElementById('hard-banner').style.display = hardMode ? 'block' : 'none';
  document.getElementById('answer-input').focus();
  answerLocked = false;
  questionStartTime = Date.now();
  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = totalTime;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      recordAnswer(null, true);
    }
  }, 1000);
}

function updateTimerUI() {
  document.getElementById('timer-sec').textContent = timeLeft;
  const pct = (timeLeft / totalTime) * 100;
  const bar = document.getElementById('timer-bar');
  bar.style.width = pct + '%';
  bar.style.background = pct > 40 ? '#1d9e75' : pct > 20 ? '#ef9f27' : '#e24b4a';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('quiz-screen').classList.contains('active')) {
    submitAnswer();
  }
});

function submitAnswer() {
  if (answerLocked) return;
  const val = document.getElementById('answer-input').value.trim();
  if (val === '') return;
  clearInterval(timerInterval);
  recordAnswer(parseFloat(val), false);
}

function recordAnswer(userVal, timeout) {
  if (answerLocked) return;
  answerLocked = true;
  const q = questions[currentQ];
  if (!q) return;
  const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
  let isCorrect = false;
  if (!timeout && userVal !== null) {
    const needsDecimal = ['C','D','E','H'].includes(q.type);
    isCorrect = needsDecimal
      ? Math.abs(userVal - q.answer) < 0.005
      : userVal === q.answer;
  }
  answers.push({ q, userVal, isCorrect, timeout, timeSpent });

  const fb = document.getElementById('feedback-msg');
  if (isCorrect) {
    fb.textContent = '正解！'; fb.className = 'feedback correct';
  } else if (timeout) {
    fb.textContent = '時間切れ！'; fb.className = 'feedback wrong';
  } else {
    fb.textContent = '不正解…'; fb.className = 'feedback wrong';
  }

  setTimeout(() => {
    currentQ++;
    currentQ < questions.length ? showQuestion() : showResult();
  }, 700);
}

// ─── バッジ定義 ───────────────────────────────────────────
const BADGES = [
  { id:'first_clear',   icon:'🎯', name:'はじめの一歩', rarity:'N',   cond:'初めてクリア',              check: s => s.playCount >= 1 },
  { id:'first_reach',   icon:'🍀', name:'初リーチ',     rarity:'N',   cond:'スロットで初リーチ',        check: s => s.reachCount >= 1 },
  { id:'perfect',       icon:'⚡', name:'全問正解',      rarity:'R',   cond:'8問全問正解',               check: s => s.perfectCount >= 1 },
  { id:'first_bingo',   icon:'🍾', name:'初ビンゴ',     rarity:'R',   cond:'スロットで初ビンゴ',        check: s => s.bingoCount >= 1 },
  { id:'triple_perfect',icon:'🔥', name:'三連正解',      rarity:'SR',  cond:'3回連続で全問正解',         check: s => s.consecutivePerfect >= 3 },
  { id:'speedstar',     icon:'⏱️', name:'スピードスター', rarity:'SR',  cond:'合計30秒以内でクリア',     check: s => s.bestTime > 0 && s.bestTime <= 30 },
  { id:'bingo5',        icon:'💎', name:'ビンゴ５回',   rarity:'SR',  cond:'ビンゴ累計5回',             check: s => s.bingoCount >= 5 },
  { id:'ss_rank',       icon:'👑', name:'SSランク',      rarity:'SSR', cond:'SSランクを獲得',            check: s => s.gotSS },
  { id:'big_bingo',     icon:'🌟', name:'豪華ビンゴ',   rarity:'SSR', cond:'豪華スロットでビンゴ',      check: s => s.bigBingoCount >= 1 },
  { id:'hard_clear',    icon:'💀', name:'難問クリア',   rarity:'R',   cond:'難問コースをクリア',          check: s => s.hardClear >= 1 },
  { id:'hard_perfect',  icon:'🧠', name:'難問全問正解', rarity:'SR',  cond:'難問コースで全問正解',        check: s => s.hardPerfect >= 1 },
  { id:'hard_triple',   icon:'👹', name:'難問三連覇',   rarity:'SSR', cond:'難問コースで3回連続全問正解', check: s => s.hardConsecutivePerfect >= 3 },
];

function getBadgeStats() {
  const hist = JSON.parse(localStorage.getItem('mathQuizRankHistory') || '[]');
  const playCount = hist.length;
  const perfectCount = parseInt(localStorage.getItem('badgePerfectCount') || '0');
  const consecutivePerfect = parseInt(localStorage.getItem('badgeConsecutivePerfect') || '0');
  const bestTime = parseFloat(localStorage.getItem('mathQuizBestTime') || '0');
  const reachCount = parseInt(localStorage.getItem('badgeReachCount') || '0');
  const bingoCount = parseInt(localStorage.getItem('badgeBingoCount') || '0');
  const bigBingoCount = parseInt(localStorage.getItem('badgeBigBingoCount') || '0');
  const gotSS = hist.includes(11);
  const hardClear = parseInt(localStorage.getItem('badgeHardClear') || '0');
  const hardPerfect = parseInt(localStorage.getItem('badgeHardPerfect') || '0');
  const hardConsecutivePerfect = parseInt(localStorage.getItem('badgeHardConsecutivePerfect') || '0');
  return { playCount, perfectCount, consecutivePerfect, bestTime, reachCount, bingoCount, bigBingoCount, gotSS, hardClear, hardPerfect, hardConsecutivePerfect };
}

function getUnlocked() {
  return JSON.parse(localStorage.getItem('badgeUnlocked') || '[]');
}

function checkAndUnlockBadges() {
  const stats = getBadgeStats();
  const unlocked = getUnlocked();
  const newlyUnlocked = [];
  for (const b of BADGES) {
    if (!unlocked.includes(b.id) && b.check(stats)) {
      unlocked.push(b.id);
      newlyUnlocked.push(b);
    }
  }
  if (newlyUnlocked.length > 0) localStorage.setItem('badgeUnlocked', JSON.stringify(unlocked));
  return newlyUnlocked;
}

function makeBadgeSVG(b, unlocked) {
  const cfg = {
    N:   { outer:'#b8bfc8', stroke:'#8a9099', inner:'#d4dae3', iStroke:'#a0a8b0', label:'#2a3240', lbg:'#b8bfc8', ltxt:'#ffffff', spikes:false },
    R:   { outer:'#3a7bd5', stroke:'#1a4fa0', inner:'#6aa0f0', iStroke:'#3a7bd5', label:'#ffffff', lbg:'#3a7bd5', ltxt:'#ffffff', spikes:false },
    SR:  { outer:'#9b3ccc', stroke:'#6a1a99', inner:'#c070f0', iStroke:'#9b3ccc', label:'#ffffff', lbg:'#9b3ccc', ltxt:'#ffffff', spikes:false },
    SSR: { outer:'#c8922a', stroke:'#8a5c00', inner:'#f0c050', iStroke:'#c8922a', label:'#5c3800', lbg:'#c8922a', ltxt:'#fff8cc', spikes:true  },
  }[b.rarity];
  const sz = b.rarity === 'SSR' ? 52 : 48;
  const sz2 = sz - 10;
  const sz3 = sz - 18;
  const pts = (r) => Array.from({length:6},(_,i)=>{const a=Math.PI/180*(i*60-90);return `${Math.round(r*Math.cos(a))},${Math.round(r*Math.sin(a))}`}).join(' ');
  const spikeSVG = cfg.spikes ? [0,60,120,180,240,300].map(a=>{
    const r=Math.PI/180*a, x1=Math.round(sz*Math.cos(r)), y1=Math.round(sz*Math.sin(r));
    const x2=Math.round((sz-9)*Math.cos(r)), y2=Math.round((sz-9)*Math.sin(r));
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff8cc" stroke-width="2"/>`;
  }).join('') : '';
  const innerRing = (b.rarity === 'SR' || b.rarity === 'SSR')
    ? `<polygon points="${pts(sz3)}" fill="none" stroke="${b.rarity==='SSR'?'#fff8cc':'#e0a0ff'}" stroke-width="0.8" opacity="0.7"/>`
    : '';
  const emojiY = b.name.length > 4 ? -12 : -8;
  const nameLines = b.name.length > 4
    ? `<text x="0" y="${emojiY+22}" font-family="sans-serif" font-size="9" font-weight="500" text-anchor="middle" fill="${cfg.label}">${b.name.slice(0,4)}</text>
       <text x="0" y="${emojiY+33}" font-family="sans-serif" font-size="9" font-weight="500" text-anchor="middle" fill="${cfg.label}">${b.name.slice(4)}</text>`
    : `<text x="0" y="${emojiY+22}" font-family="sans-serif" font-size="10" font-weight="500" text-anchor="middle" fill="${cfg.label}">${b.name}</text>`;
  const locked = !unlocked;
  return `<svg viewBox="${-sz-6} ${-sz-6} ${(sz+6)*2} ${(sz+6)*2+30}" width="80" height="90" style="${locked?'filter:grayscale(1);opacity:0.35':''}">
    <polygon points="${pts(sz)}" fill="${cfg.outer}" stroke="${cfg.stroke}" stroke-width="3"/>
    <polygon points="${pts(sz2)}" fill="${cfg.inner}" stroke="${cfg.iStroke}" stroke-width="1.5"/>
    ${innerRing}${spikeSVG}
    <text x="0" y="${emojiY+6}" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">${b.icon}</text>
    ${nameLines}
  </svg>`;
}

function renderBadgeGrid() {
  const unlocked = getUnlocked();
  const grid = document.getElementById('badge-grid');
  if (!grid) return;
  grid.innerHTML = BADGES.map(b => {
    const isUnlocked = unlocked.includes(b.id);
    return `<div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}" style="padding:8px 4px;">
      ${makeBadgeSVG(b, isUnlocked)}
      <div class="badge-name" style="margin-top:2px;">${isUnlocked ? b.name : '???'}</div>
      <div class="badge-cond">${isUnlocked ? b.cond : '???'}</div>
    </div>`;
  }).join('');
}

function showUnlockToast(badges) {
  if (badges.length === 0) return;
  const toast = document.getElementById('unlock-toast');
  toast.textContent = `🏅 新バッジ解禁！${badges.map(b=>b.icon+b.name).join(' ')}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showNewBadgesInResult(badges) {
  const area = document.getElementById('new-badges-area');
  if (!area) return;
  if (badges.length === 0) { area.style.display = 'none'; return; }
  area.style.display = 'block';
  area.innerHTML = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px;">🏅 新バッジ解禁！</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">' +
    badges.map(b => `<div style="text-align:center;">${makeBadgeSVG(b,true)}<div style="font-size:10px;color:var(--text-sub);margin-top:2px;">${b.name}</div></div>`).join('') + '</div>';
}

function showResult() {
  showScreen('result-screen');
  const correct = answers.filter(a => a.isCorrect).length;
  const num = document.getElementById('score-correct');
  num.innerHTML = `${correct}<span class="score-denom"> / 8</span>`;
  const grades = [
    { rank: 'C-', msg: 'まずは基礎から！' },
    { rank: 'C',  msg: '少しずつ慣れていこう' },
    { rank: 'C+', msg: 'もう少しで次のランク！' },
    { rank: 'B-', msg: 'いい調子になってきた' },
    { rank: 'B',  msg: '平均以上！この調子で' },
    { rank: 'B+', msg: 'なかなかやるね！' },
    { rank: 'A-', msg: '上位クラス入り！' },
    { rank: 'A',  msg: 'すごい！ほぼ完璧' },
    { rank: 'A+', msg: '超高精度！' },
    { rank: 'S',  msg: '達人の域に達した' },
    { rank: 'S+', msg: '満点でも秒で解いた？' },
    { rank: 'SS', msg: '伝説！' },
  ];
  const totalSec2 = Math.round((Date.now() - quizStartTime) / 1000);
  let gradeIdx;
  if (correct <= 2) gradeIdx = correct === 0 ? 0 : correct === 1 ? 1 : 2;
  else if (correct <= 5) gradeIdx = correct + 0;
  else if (correct === 6) gradeIdx = 6;
  else if (correct === 7) gradeIdx = 7;
  else {
    // 全問正解: 時間で S / S+ / SS を分ける
    const perQ = totalSec2 / 8;
    gradeIdx = perQ <= 10 ? 11 : perQ <= 20 ? 10 : 9;
  }
  const grade = grades[gradeIdx];
  const rankEl = document.getElementById('result-rank');
  rankEl.textContent = grade.rank;
  const rankColors = { 'C-':'#888780','C':'#888780','C+':'#888780','B-':'#185fa5','B':'#185fa5','B+':'#185fa5','A-':'#1d9e75','A':'#1d9e75','A+':'#1d9e75','S':'#ba7517','S+':'#993c1d','SS':'#a32d2d' };
  rankEl.style.color = rankColors[grade.rank] || 'var(--text)';
  document.getElementById('result-msg').textContent = grade.msg;

  const totalSec = Math.round((Date.now() - quizStartTime) / 1000);
  const fmtTime = sec => { const m = Math.floor(sec/60), s = sec%60; return m > 0 ? `${m}分${s}秒` : `${s}秒`; };
  document.getElementById('total-time-display').textContent = fmtTime(totalSec);

  const avgSec = answers.length > 0 ? Math.round(answers.reduce((s,a) => s + a.timeSpent, 0) / answers.length * 10) / 10 : 0;
  document.getElementById('avg-time-display').textContent = avgSec + '秒';

  const bestKey = 'mathQuizBestTime';
  const prevBest = parseFloat(localStorage.getItem(bestKey) || '0');
  let bestSec = prevBest;
  const isBest = correct >= 5 && totalSec > 0 && (prevBest === 0 || totalSec < prevBest);
  if (isBest) { bestSec = totalSec; localStorage.setItem(bestKey, totalSec); }
  const bestEl = document.getElementById('best-time-display');
  bestEl.textContent = bestSec > 0 ? fmtTime(bestSec) : '-';
  if (isBest) { bestEl.style.color = '#ba7517'; bestEl.title = '新記録！'; }
  else { bestEl.style.color = 'var(--text)'; }

  const rankOrder = ['C-','C','C+','B-','B','B+','A-','A','A+','S','S+','SS'];
  const rankColors2 = { 'C-':'#888780','C':'#888780','C+':'#888780','B-':'#185fa5','B':'#185fa5','B+':'#185fa5','A-':'#1d9e75','A':'#1d9e75','A+':'#1d9e75','S':'#ba7517','S+':'#993c1d','SS':'#a32d2d' };
  const histKey = 'mathQuizRankHistory';
  const hist = JSON.parse(localStorage.getItem(histKey) || '[]');
  hist.push(rankOrder.indexOf(grade.rank));
  localStorage.setItem(histKey, JSON.stringify(hist));

  const bestRankIdx = Math.max(...hist);
  const bestRank = rankOrder[bestRankIdx];
  const bestRankEl = document.getElementById('best-rank-display');
  bestRankEl.textContent = bestRank;
  bestRankEl.style.color = rankColors2[bestRank] || 'var(--text)';

  const avgRankIdx = Math.round(hist.reduce((a,b) => a+b, 0) / hist.length);
  const avgRank = rankOrder[Math.min(avgRankIdx, 11)];
  const avgRankEl = document.getElementById('avg-rank-display');
  avgRankEl.textContent = avgRank;
  avgRankEl.style.color = rankColors2[avgRank] || 'var(--text)';

  document.getElementById('play-count-display').textContent = hist.length + '回';

  // MP
  const earned = correct * 10;
  const mpKey = 'mathQuizMP';
  const prevMP = parseInt(localStorage.getItem(mpKey) || '0');
  const newMP = prevMP + earned;
  localStorage.setItem(mpKey, newMP);
  document.getElementById('mp-total').textContent = newMP;
  document.getElementById('mp-earn').textContent = earned > 0 ? `+${earned} MP 獲得！` : '0 MP';
  const barPct = Math.min((newMP % 50) / 50 * 100, 100);
  document.getElementById('mp-bar').style.width = barPct + '%';
  document.getElementById('slot-btn').style.display = (newMP >= 50 || getGP() >= 100) ? 'block' : 'none';

  // バッジ統計更新
  if (hardMode) {
    const hc = parseInt(localStorage.getItem('badgeHardClear') || '0') + 1;
    localStorage.setItem('badgeHardClear', hc);
    if (correct === 8) {
      const hp = parseInt(localStorage.getItem('badgeHardPerfect') || '0') + 1;
      localStorage.setItem('badgeHardPerfect', hp);
      const hcp = parseInt(localStorage.getItem('badgeHardConsecutivePerfect') || '0') + 1;
      localStorage.setItem('badgeHardConsecutivePerfect', hcp);
    } else {
      localStorage.setItem('badgeHardConsecutivePerfect', '0');
    }
  }
  if (correct === 8) {
    const pc = parseInt(localStorage.getItem('badgePerfectCount') || '0') + 1;
    localStorage.setItem('badgePerfectCount', pc);
    const cp = parseInt(localStorage.getItem('badgeConsecutivePerfect') || '0') + 1;
    localStorage.setItem('badgeConsecutivePerfect', cp);
  } else {
    localStorage.setItem('badgeConsecutivePerfect', '0');
  }
  const newBadges = checkAndUnlockBadges();
  showNewBadgesInResult(newBadges);
  setTimeout(() => showUnlockToast(newBadges), 800);

  const wrongs = answers.filter(a => !a.isCorrect);
  if (wrongs.length > 0) {
    document.getElementById('wrong-section').style.display = 'block';
    document.getElementById('all-correct-section').style.display = 'none';
    document.getElementById('wrong-list').innerHTML = wrongs.map(a => {
      const ua = a.timeout ? '（時間切れ）' : a.userVal === null ? '（未回答）' : a.userVal;
      const needsDecimal = ['C','D','E','H'].includes(a.q.type);
      const ca = needsDecimal ? a.q.answer.toFixed(2) : a.q.answer;
      return `<div class="wrong-item">
        <div class="wrong-q">${a.q.text} = ?</div>
        <div class="wrong-detail">あなた: <span class="wrong-ua">${ua}</span>　正解: <span class="wrong-ca">${ca}</span></div>
      </div>`;
    }).join('');
  } else {
    document.getElementById('wrong-section').style.display = 'none';
    document.getElementById('all-correct-section').style.display = 'block';
  }
}

function confirmReset() {
  if (confirm('記録をリセットしますか？\nベストタイム・最高ランク・ランク平均・挑戦回数がすべて消えます。')) {
    localStorage.removeItem('mathQuizBestTime');
    localStorage.removeItem('mathQuizRankHistory');
    localStorage.removeItem('mathQuizMP');
    localStorage.removeItem('mathQuizGP');
    localStorage.removeItem('badgeUnlocked');
    localStorage.removeItem('badgePerfectCount');
    localStorage.removeItem('badgeConsecutivePerfect');
    localStorage.removeItem('badgeReachCount');
    localStorage.removeItem('badgeBingoCount');
    localStorage.removeItem('badgeBigBingoCount');
    localStorage.removeItem('badgeHardClear');
    localStorage.removeItem('badgeHardPerfect');
    localStorage.removeItem('badgeHardConsecutivePerfect');
    document.getElementById('best-time-display').textContent = '-';
    document.getElementById('best-rank-display').textContent = '-';
    document.getElementById('avg-rank-display').textContent = '-';
    document.getElementById('play-count-display').textContent = '-';
    document.getElementById('best-time-display').style.color = 'var(--text)';
    document.getElementById('best-rank-display').style.color = 'var(--text)';
    document.getElementById('avg-rank-display').style.color = 'var(--text)';
    updateSetupStats();
  }
}

let currentSlotMode = 'small'; // 'small'=通常 / 'big'=豪華

function getGP() { return parseInt(localStorage.getItem('mathQuizGP') || '0'); }
function setGP(v) {
  localStorage.setItem('mathQuizGP', v);
  ['slot-gp-total','s-gp-total'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=v; });
  const bigTab = document.getElementById('tab-big');
  if (bigTab) bigTab.disabled = v < 100;
}
function addGP(v) { setGP(getGP() + v); }

function switchSlotTab(mode) {
  currentSlotMode = mode;
  document.getElementById('tab-small').classList.toggle('active', mode === 'small');
  document.getElementById('tab-big').classList.toggle('active', mode === 'big');
  document.getElementById('slot-title-label').textContent = mode === 'small' ? '1〜5 × 3' : '1〜8 × 3';
  resetReels(mode === 'small' ? 5 : 8);
  document.getElementById('slot-result-msg').textContent = '';
  document.getElementById('slot-gp-earn').textContent = '';
  document.getElementById('bingo-bottle').style.display = 'none';
  document.getElementById('slot-spin-btn').style.display = 'inline-block';
  document.getElementById('slot-close-btn').style.display = 'none';
}

function resetReels(maxN) {
  for (let i = 0; i < 3; i++) {
    const inner = document.getElementById('reel-inner' + i);
    inner.style.transition = 'none';
    inner.style.transform = 'translateY(0)';
    inner.innerHTML = '';
    for (let n = 1; n <= maxN; n++) {
      const d = document.createElement('div');
      d.className = 'slot-digit';
      d.textContent = n;
      inner.appendChild(d);
    }
  }
}

function openSlot() {
  currentSlotMode = 'small';
  const gp = getGP();
  document.getElementById('slot-gp-total').textContent = gp;
  document.getElementById('slot-gp-earn').textContent = '';
  document.getElementById('tab-small').classList.add('active');
  document.getElementById('tab-big').classList.remove('active');
  document.getElementById('tab-big').disabled = gp < 100;
  document.getElementById('slot-title-label').textContent = '1〜5 × 3';
  document.getElementById('slot-result-msg').textContent = '';
  document.getElementById('bingo-bottle').style.display = 'none';
  document.getElementById('slot-spin-btn').style.display = 'inline-block';
  document.getElementById('slot-close-btn').style.display = 'none';
  document.getElementById('slot-modal').style.display = 'flex';
  resetReels(5);
}

function closeSlot() {
  document.getElementById('slot-modal').style.display = 'none';
  updateSetupStats();
}

function spinSlot() {
  const isBig = currentSlotMode === 'big';
  const maxN = isBig ? 8 : 5;
  const cost = isBig ? 100 : 50;
  const costKey = isBig ? 'mathQuizGP' : 'mathQuizMP';

  const cur = parseInt(localStorage.getItem(costKey) || '0');
  if (cur < cost) { alert(isBig ? 'GPが足りません' : 'MPが足りません'); return; }
  const newVal = cur - cost;
  localStorage.setItem(costKey, newVal);

  if (!isBig) {
    document.getElementById('mp-total').textContent = newVal;
    document.getElementById('mp-bar').style.width = Math.min((newVal % 50) / 50 * 100, 100) + '%';
    document.getElementById('slot-btn').style.display = (parseInt(localStorage.getItem('mathQuizMP')||'0') >= 50 || getGP() >= 100) ? 'block' : 'none';
  } else {
    setGP(newVal);
  }
  document.getElementById('slot-gp-total').textContent = getGP();
  document.getElementById('slot-spin-btn').style.display = 'none';
  document.getElementById('slot-result-msg').textContent = '';
  document.getElementById('slot-gp-earn').textContent = '';
  document.getElementById('bingo-bottle').style.display = 'none';

  const results = [rand(1,maxN), rand(1,maxN), rand(1,maxN)];
  const delays = [1200, 1800, 2400];
  const spins = 20;

  for (let i = 0; i < 3; i++) {
    const inner = document.getElementById('reel-inner' + i);
    inner.innerHTML = '';
    for (let s = 0; s < spins; s++) {
      const d = document.createElement('div');
      d.className = 'slot-digit';
      d.textContent = ((s % maxN) + 1);
      inner.appendChild(d);
    }
    const fin = document.createElement('div');
    fin.className = 'slot-digit';
    fin.textContent = results[i];
    inner.appendChild(fin);
    inner.style.transition = 'none';
    inner.style.transform = 'translateY(0)';
    const totalH = 88 * spins;
    setTimeout(() => {
      inner.style.transition = `transform ${delays[i]*0.8}ms cubic-bezier(0.17,0.67,0.3,1)`;
      inner.style.transform = `translateY(-${totalH}px)`;
    }, 50 + i * 100);
  }

  setTimeout(() => {
    const msg = document.getElementById('slot-result-msg');
    const bottle = document.getElementById('bingo-bottle');
    const earnEl = document.getElementById('slot-gp-earn');
    const isBingo = results[0] === results[1] && results[1] === results[2];
    const isReach = !isBingo && (results[0]===results[1] || results[1]===results[2] || results[0]===results[2]);

    if (isBingo) {
      const gain = isBig ? 200 : 80;
      addGP(gain);
      document.getElementById('slot-gp-total').textContent = getGP();
      bottle.style.display = 'block';
      msg.textContent = 'ビンゴ！！🎉';
      msg.className = 'slot-result-msg bingo';
      earnEl.textContent = `+${gain} GP 獲得！`;
      const bc = parseInt(localStorage.getItem('badgeBingoCount') || '0') + 1;
      localStorage.setItem('badgeBingoCount', bc);
      if (isBig) { const bb = parseInt(localStorage.getItem('badgeBigBingoCount') || '0') + 1; localStorage.setItem('badgeBigBingoCount', bb); }
      const nb = checkAndUnlockBadges(); showUnlockToast(nb);
    } else if (isReach) {
      const gain = isBig ? 60 : 30;
      addGP(gain);
      document.getElementById('slot-gp-total').textContent = getGP();
      bottle.style.display = 'none';
      msg.textContent = 'リーチ！';
      msg.className = 'slot-result-msg reach';
      earnEl.textContent = `+${gain} GP 獲得！`;
      const rc = parseInt(localStorage.getItem('badgeReachCount') || '0') + 1;
      localStorage.setItem('badgeReachCount', rc);
      const nr = checkAndUnlockBadges(); showUnlockToast(nr);
    } else {
      bottle.style.display = 'none';
      msg.textContent = 'はずれ…';
      msg.className = 'slot-result-msg';
      earnEl.textContent = '';
    }
    // 豪華タブ解放チェック
    document.getElementById('tab-big').disabled = getGP() < 100;
    document.getElementById('slot-close-btn').style.display = 'inline-block';
  }, delays[2] + 200);
}

function showQuitConfirm() {
  clearInterval(timerInterval);
  document.getElementById('quit-confirm').style.display = 'block';
}

function hideQuitConfirm() {
  document.getElementById('quit-confirm').style.display = 'none';
  document.getElementById('hard-banner').style.display = hardMode ? 'block' : 'none';
  startTimer();
}

function doQuit() {
  hideQuitConfirm();
  clearInterval(timerInterval);
  answerLocked = false;
  goSetup();
}

function updateSetupStats() {
  const rankColors2 = { 'C-':'#888780','C':'#888780','C+':'#888780','B-':'#185fa5','B':'#185fa5','B+':'#185fa5','A-':'#1d9e75','A':'#1d9e75','A+':'#1d9e75','S':'#ba7517','S+':'#993c1d','SS':'#a32d2d' };
  const rankOrder = ['C-','C','C+','B-','B','B+','A-','A','A+','S','S+','SS'];
  const fmtTime = sec => { const m = Math.floor(sec/60), s = sec%60; return m > 0 ? `${m}分${s}秒` : `${s}秒`; };

  const bestSec = parseFloat(localStorage.getItem('mathQuizBestTime') || '0');
  document.getElementById('s-best-time').textContent = bestSec > 0 ? fmtTime(bestSec) : '-';

  const hist = JSON.parse(localStorage.getItem('mathQuizRankHistory') || '[]');
  if (hist.length > 0) {
    const bestRank = rankOrder[Math.max(...hist)];
    const avgRank = rankOrder[Math.min(Math.round(hist.reduce((a,b)=>a+b,0)/hist.length), 11)];
    const bestRankEl = document.getElementById('s-best-rank');
    const avgRankEl = document.getElementById('s-avg-rank');
    bestRankEl.textContent = bestRank;
    bestRankEl.style.color = rankColors2[bestRank] || 'var(--text)';
    avgRankEl.textContent = avgRank;
    avgRankEl.style.color = rankColors2[avgRank] || 'var(--text)';
    document.getElementById('s-play-count').textContent = hist.length + '回';
  } else {
    ['s-best-rank','s-avg-rank'].forEach(id => { document.getElementById(id).textContent = '-'; document.getElementById(id).style.color = 'var(--text)'; });
    document.getElementById('s-play-count').textContent = '-';
  }

  const mp = parseInt(localStorage.getItem('mathQuizMP') || '0');
  document.getElementById('s-mp-total').textContent = mp;
  document.getElementById('s-mp-bar').style.width = Math.min((mp % 50) / 50 * 100, 100) + '%';
  document.getElementById('s-slot-btn').style.display = (mp >= 50 || getGP() >= 100) ? 'block' : 'none';
  const gp = getGP();
  const gpEl = document.getElementById('s-gp-total');
  if (gpEl) gpEl.textContent = gp;
}

function goSetup() { showScreen('setup-screen'); updateSetupStats(); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'collection-screen') renderBadgeGrid();
}
document.addEventListener('DOMContentLoaded', () => {
  setGP(getGP()); // GP表示初期化
  updateSetupStats();
});