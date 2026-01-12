/**
 * Vocab Studio 5.0 - Professional Workflow Edition
 */

let words = [];
let index = 0;
let showBack = false;
let sessionType = null; 
let currentLevel = null;

const STORAGE_KEY = "vocabProgress";
let progress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

function setView(html) {
  document.getElementById("app").innerHTML = html;
}

// --- Home Screen ---
function home() {
  sessionType = null;
  setView(`
    <div class="fade-in">
      <h1>Vocab Studio</h1>
      <p class="subtitle">挑戦するレベルを選んでください</p>
      
      <div class="level-list">
        <div class='level-card card-1' onclick='loadLevel(1)'>Level 1<span>初級・Beginner</span></div>
        <div class='level-card card-2' onclick='loadLevel(2)'>Level 2<span>中級・Intermediate</span></div>
        <div class='level-card card-3' onclick='loadLevel(3)'>Level 3<span>中上級・Upper-Intermediate</span></div>
        <div class='level-card card-4' onclick='loadLevel(4)'>Level 4<span>上級・Advanced</span></div>
        <div class='level-card card-5' onclick='loadLevel(5)'>Level 5<span>最上級・Master</span></div>
      </div>

      <div class="utility-grid">
        <button class="neon-btn-outline" onclick="showCheckedWords()">🔁 チェックした単語</button>
        <button class="neon-btn-outline" onclick="showMistakenWords()">❌ 間違えた単語</button>
      </div>

      <footer class="app-footer">
        <p>Presented by Nagaoka University English Circle</p>
        <p class="footer-sub">長岡大学 英語サークル 制作</p>
      </footer>
    </div>
  `);
}

// --- ① チェックした単語リスト ---
function showCheckedWords() {
  const list = Object.keys(progress)
    .filter(key => progress[key].review && progress[key].wordData)
    .map(key => progress[key].wordData);

  if (list.length === 0) return alert("チェックした単語はありません。");

  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">Checked Words List</span>
        <span class="counter">Total: ${list.length}</span>
      </div>
      <h2 class="section-title">チェックした単語</h2>
      
      <button class="neon-btn-primary main-glow action-spacing" onclick="startReviewFlash()">
         🃏 このリストをカードで復習
      </button>

      <div class="overview-list custom-scrollbar">
        ${list.map(w => `
          <div class="overview-item">
            <div class="item-info">
              <span class="item-word">${w.word}</span>
              <span class="item-meaning">${w.meaning}</span>
            </div>
            <button class="icon-btn-delete" onclick="removeReviewItem('${w.word}')">🗑️</button>
          </div>
        `).join("")}
      </div>

      <button class="back-link-btn" onclick="home()">← ホームに戻る</button>
    </div>
  `);
}

function startReviewFlash() {
  const list = Object.keys(progress)
    .filter(key => progress[key].review && progress[key].wordData)
    .map(key => progress[key].wordData);
  words = list;
  sessionType = "review";
  flashMode();
}

function removeReviewItem(wordText) {
  if (confirm(`「${wordText}」をリストから削除しますか？`)) {
    progress[wordText].review = false;
    saveProgress();
    showCheckedWords();
  }
}

// --- ② 間違えた単語リスト ---
function showMistakenWords() {
  const list = Object.keys(progress)
    .filter(key => progress[key].wrong && progress[key].wordData)
    .map(key => progress[key].wordData);

  if (list.length === 0) return alert("間違えた単語はありません。");

  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">Mistaken Words List</span>
        <span class="counter">Total: ${list.length}</span>
      </div>
      <h2 class="section-title">間違えた単語</h2>
      
      <button class="neon-btn-primary main-glow action-spacing" onclick="startMistakenQuiz()">
         ✏️ このリストをクイズで復習
      </button>

      <div class="overview-list custom-scrollbar">
        ${list.map(w => `
          <div class="overview-item">
            <div class="item-info">
              <span class="item-word">${w.word}</span>
              <span class="item-meaning">${w.meaning}</span>
            </div>
          </div>
        `).join("")}
      </div>

      <button class="back-link-btn" onclick="home()">← ホームに戻る</button>
    </div>
  `);
}

function startMistakenQuiz() {
  const list = Object.keys(progress)
    .filter(key => progress[key].wrong && progress[key].wordData)
    .map(key => progress[key].wordData);
  words = list;
  sessionType = "wrong";
  quizMode();
}

// --- 以下、既存の学習ロジックの改善・維持 ---

async function loadLevel(lv) {
  currentLevel = lv;
  sessionType = "level";
  try {
    const res = await fetch(`words/level_${lv}.json`);
    words = await res.json();
    index = 0;
    modeSelect();
  } catch (e) { alert("読み込み失敗"); }
}

function modeSelect() {
  setView(`
    <div class="mode-container fade-in">
      <div class="level-badge">Level ${currentLevel}</div>
      <h2 class="section-title">学習モードを選択</h2>
      <div class="mode-selection-grid">
        <button class="mode-main-btn" onclick="flashMode()">
          <span class="icon">🃏</span>
          <span class="text">フラッシュカード</span>
        </button>
        <button class="mode-main-btn" onclick="quizMode()">
          <span class="icon">✏️</span>
          <span class="text">4択クイズ</span>
        </button>
      </div>
      <button class="back-link-btn" onclick="home()">← ホームに戻る</button>
    </div>
  `);
}

function flashMode() { index = 0; showFlash(); }
function showFlash() {
  if (words.length === 0) return home();
  const w = words[index];
  const p = getProgress(w.word);
  const content = showBack 
    ? `<div class="card-back"><h2>${w.meaning}</h2><p class="example-text">${w.example}</p></div>` 
    : `<div class="card-front"><h1>${w.word}</h1><p class="pos-tag">${w.pos}</p></div>`;

  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">${sessionType === 'review' ? '復習カード' : 'Flashcards'}</span>
        <span class="counter">${index + 1} / ${words.length}</span>
      </div>
      <div class='flashcard-glass' onclick='toggleFlash()'>${content}</div>
      <div class="control-stack">
        <button class="neon-btn-primary main-glow" onclick='nextFlash()'>次の単語へ →</button>
        ${p.review 
          ? `<button class="neon-btn-danger" onclick="unmarkReview()">➖ リストから削除</button>`
          : `<button class="neon-btn-secondary" onclick="markReview()">🔁 リストに追加</button>`
        }
      </div>
      <button class="back-link-btn" onclick="${sessionType === 'level' ? 'modeSelect()' : (sessionType === 'review' ? 'showCheckedWords()' : 'home()')}">← 戻る</button>
    </div>
  `);
}

function toggleFlash() { showBack = !showBack; showFlash(); }
function nextFlash() { index = (index + 1) % words.length; showBack = false; showFlash(); }

function markReview() {
  const w = words[index];
  const p = getProgress(w.word);
  p.review = true; p.wordData = w;
  saveProgress(); showFlash();
}

function unmarkReview() {
  getProgress(words[index].word).review = false;
  saveProgress();
  if (sessionType === "review") {
      words = words.filter(w => w.word !== words[index].word);
      if (words.length === 0) { alert("完了！"); showCheckedWords(); } 
      else { index = index % words.length; showFlash(); }
  } else { showFlash(); }
}

function quizMode() { quizIndex = 0; score = 0; nextQuiz(); }
let quizIndex = 0; let score = 0;
function nextQuiz() {
  if (quizIndex >= words.length) return quizResult();
  const q = words[quizIndex];
  const options = shuffle([q.meaning, ...getRandomMeanings(q.meaning, 3)]);
  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">${sessionType === 'wrong' ? '弱点クイズ' : 'Quiz'}</span>
        <span class="counter">${quizIndex + 1} / ${words.length}</span>
      </div>
      <h3 class="quiz-question-text">${q.word}</h3>
      <div class="options-container">
        ${options.map(o => `<div class='quiz-option-glass' onclick='selectQuiz("${o}")'>${o}</div>`).join("")}
      </div>
      <button class="back-link-btn" onclick="${sessionType === 'level' ? 'modeSelect()' : (sessionType === 'wrong' ? 'showMistakenWords()' : 'home()')}">← 戻る</button>
    </div>
  `);
}

function selectQuiz(opt) {
  const q = words[quizIndex];
  const p = getProgress(q.word);
  if (opt === q.meaning) { score++; p.correctCount++; p.wrong = false; } 
  else { p.wrong = true; p.wrongCount++; p.wordData = q; }
  saveProgress(); quizIndex++; nextQuiz();
}

function quizResult() {
  const rate = Math.round((score / words.length) * 100);
  setView(`
    <div class="result-glass fade-in">
      <div class="result-title">Finish!</div>
      <div class="result-rate-display">${rate}%</div>
      <p>${words.length}問中 ${score}問 正解</p>
      <button class="neon-btn-primary main-glow" onclick="quizMode()">Retry</button>
      <button class="back-link-btn" onclick="${sessionType === 'wrong' ? 'showMistakenWords()' : 'home()'}">リストに戻る</button>
    </div>
  `);
}

function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
function getRandomMeanings(correct, count) {
  const all = words.map(w => w.meaning).filter(m => m !== correct);
  return shuffle(all).slice(0, count);
}
function getProgress(word) {
  if (!progress[word]) progress[word] = { review: false, wrong: false, correctCount: 0, wrongCount: 0, wordData: null };
  return progress[word];
}
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

home();
