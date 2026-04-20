let questions = [], currentQ = 0, answers = [];
let timerInterval = null, timeLeft = 30, totalTime = 30;
let quizStartTime = 0, questionStartTime = 0;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSelectedTypes() {
  return Array.from(document.querySelectorAll('.check-list input[type=checkbox]:checked'))
    .map(cb => parseInt(cb.value));
}

function makeQuestions() {
  const selected = getSelectedTypes();
  const pool = [];
  // 選んだ種類を均等に8問分配
  for (let i = 0; i < 8; i++) {
    pool.push(selected[i % selected.length]);
  }
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
  } else {
    const a = rand(10, 99), b = rand(10, 99), c = rand(10, 99);
    return { type: 'F', label: '二桁×二桁×二桁', text: `${a} × ${b} × ${c}`, answer: a * b * c, hint: '' };
  }
}

function startQuiz() {
  const selected = getSelectedTypes();
  const errEl = document.getElementById('check-error');
  if (selected.length === 0) { errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  totalTime = Math.max(5, parseInt(document.getElementById('time-limit-input').value) || 30);
  questions = makeQuestions();
  currentQ = 0;
  answers = [];
  quizStartTime = Date.now();
  showScreen('quiz-screen');
  showQuestion();
}

function showQuestion() {
  const q = questions[currentQ];
  document.getElementById('q-counter').textContent = `問題 ${currentQ + 1} / 8`;
  const cls = { A: 'badge-a', B: 'badge-b', C: 'badge-c', D: 'badge-d', E: 'badge-e', F: 'badge-f' }[q.type];
  document.getElementById('q-type-badge').innerHTML = `<span class="badge ${cls}">${q.type}: ${q.label}</span>`;
  document.getElementById('question-text').textContent = q.text + ' = ?';
  document.getElementById('hint-text').textContent = q.hint;
  document.getElementById('answer-input').value = '';
  document.getElementById('feedback-msg').textContent = '';
  document.getElementById('feedback-msg').className = 'feedback';
  document.getElementById('answer-input').focus();
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
  const val = document.getElementById('answer-input').value.trim();
  if (val === '') return;
  clearInterval(timerInterval);
  recordAnswer(parseFloat(val), false);
}

function recordAnswer(userVal, timeout) {
  const q = questions[currentQ];
  const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
  let isCorrect = false;
  if (!timeout && userVal !== null) {
    const needsDecimal = ['C','D','E'].includes(q.type);
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
    currentQ < 8 ? showQuestion() : showResult();
  }, 700);
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
  if (newMP >= 50) {
    document.getElementById('slot-btn').style.display = 'block';
  } else {
    document.getElementById('slot-btn').style.display = 'none';
  }

  const wrongs = answers.filter(a => !a.isCorrect);
  if (wrongs.length > 0) {
    document.getElementById('wrong-section').style.display = 'block';
    document.getElementById('all-correct-section').style.display = 'none';
    document.getElementById('wrong-list').innerHTML = wrongs.map(a => {
      const ua = a.timeout ? '（時間切れ）' : a.userVal === null ? '（未回答）' : a.userVal;
      const needsDecimal = ['C','D','E'].includes(a.q.type);
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

function openSlot() {
  document.getElementById('slot-modal').style.display = 'flex';
  document.getElementById('slot-result-msg').textContent = '';
  document.getElementById('bingo-bottle').style.display = 'none';
  document.getElementById('slot-spin-btn').style.display = 'inline-block';
  document.getElementById('slot-close-btn').style.display = 'none';
  for (let i = 0; i < 3; i++) {
    const inner = document.getElementById('reel-inner' + i);
    inner.style.transition = 'none';
    inner.style.transform = 'translateY(0)';
    inner.innerHTML = '';
    for (let n = 1; n <= 5; n++) {
      const d = document.createElement('div');
      d.className = 'slot-digit';
      d.textContent = n;
      inner.appendChild(d);
    }
  }
}

function closeSlot() {
  document.getElementById('slot-modal').style.display = 'none';
}

function spinSlot() {
  const mpKey = 'mathQuizMP';
  const curMP = parseInt(localStorage.getItem(mpKey) || '0');
  if (curMP < 50) { alert('MPが足りません'); return; }
  const newMP = curMP - 50;
  localStorage.setItem(mpKey, newMP);
  document.getElementById('mp-total').textContent = newMP;
  document.getElementById('mp-bar').style.width = Math.min((newMP % 50) / 50 * 100, 100) + '%';
  if (newMP < 50) document.getElementById('slot-btn').style.display = 'none';

  document.getElementById('slot-spin-btn').style.display = 'none';
  document.getElementById('slot-result-msg').textContent = '';
  document.getElementById('bingo-bottle').style.display = 'none';

  const results = [rand(1,5), rand(1,5), rand(1,5)];
  const delays = [1200, 1800, 2400];

  for (let i = 0; i < 3; i++) {
    const inner = document.getElementById('reel-inner' + i);
    // build long strip ending on result
    inner.innerHTML = '';
    const spins = 20;
    for (let s = 0; s < spins; s++) {
      const d = document.createElement('div');
      d.className = 'slot-digit';
      d.textContent = ((s % 5) + 1);
      inner.appendChild(d);
    }
    // final digit
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
    if (results[0] === results[1] && results[1] === results[2]) {
      bottle.style.display = 'block';
      msg.textContent = 'ビンゴ！！🎉';
      msg.className = 'slot-result-msg bingo';
    } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
      msg.textContent = 'リーチ！';
      msg.className = 'slot-result-msg reach';
      bottle.style.display = 'none';
    } else {
      msg.textContent = 'はずれ…';
      msg.className = 'slot-result-msg';
      bottle.style.display = 'none';
    }
    document.getElementById('slot-close-btn').style.display = 'inline-block';
  }, delays[2] + 200);
}

function quitQuiz() {
  if (!confirm('途中でやめますか？\n※ポイントや記録は反映されません。')) return;
  clearInterval(timerInterval);
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
  document.getElementById('s-slot-btn').style.display = mp >= 50 ? 'block' : 'none';
}

function goSetup() { showScreen('setup-screen'); updateSetupStats(); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
document.addEventListener('DOMContentLoaded', updateSetupStats);
