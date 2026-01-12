/**
 * Vocab Studio 2.5 - Localization & Credit Edition
 */

let currentLevel = null;
let words = [];
let index = 0;
let showBack = false;
let sessionType = null; // "level", "review", "wrong"

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
        <button class="neon-btn-outline" onclick="reviewWords()">🔁 見直す単語リスト</button>
        <button class="neon-btn-outline" onclick="wrongWords()">❌ 間違えた単語リスト</button>
      </div>

      <footer class="app-footer">
        <p>Presented by Nagaoka University English Circle</p>
        <p class="footer-sub">長岡大学 英語サークル 制作</p>
      </footer>
    </div>
  `);
}

// --- Data Loading ---
async function loadLevel(lv) {
  currentLevel = lv;
  sessionType = "level";
  try {
    const res = await fetch(`words/level_${lv}.json`);
    words = await res.json();
    index = 0;
    modeSelect();
  } catch (e) {
    alert("データの読み込みに失敗しました。");
  }
}

// --- Mode Selection ---
function modeSelect() {
  setView(`
    <div class="mode-container fade-in">
      <div class="level-badge">Level ${currentLevel}</div>
      <h2>学習モードを選択してください</h2>
      
      <div class="mode-selection-grid">
        <button class="mode-main-btn flash-trigger" onclick="flashMode()">
          <span class="icon">🃏</span>
          <span class="text">フラッシュカード</span>
          <span class="sub-text">Flashcards</span>
        </button>
        
        <button class="mode-main-btn quiz-trigger" onclick="quizMode()">
          <span class="icon">✏️</span>
          <span class="text">4択クイズ</span>
          <span class="sub-text">4-Choice Quiz</span>
        </button>
      </div>

      <button class="back-link" onclick="home()">← ホームに戻る</button>
    </div>
  `);
}

// --- Flashcards ---
function flashMode() {
  index = 0;
  showFlash();
}

function showFlash() {
  const w = words[index];
  const p = getProgress(w.word);
  
  const content = showBack 
    ? `<div class="card-back"><h2>${w.meaning}</h2><p class="example-text">${w.example}</p></div>` 
    : `<div class="card-front"><h1>${w.word}</h1><p class="pos-tag">${w.pos}</p></div>`;

  const backTarget = (sessionType === "level") ? "modeSelect()" : "home()";

  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">Flashcards</span>
        <span class="counter">${index + 1} / ${words.length}</span>
      </div>

      <div class='flashcard' onclick='toggleFlash()'>${content}</div>

      <div class="control-area">
        <button class="neon-btn-primary" onclick='nextFlash()'>次の単語へ →</button>
        
        <div class="sub-controls">
          ${p.review 
            ? `<button class="neon-btn-danger" onclick="unmarkReview()">➖ 見直しリストから削除</button>`
            : `<button class="neon-btn-secondary" onclick="markReview()">🔁 見直しリストに追加</button>`
          }
        </div>
      </div>

      <button class="back-link" onclick="${backTarget}">← 戻る</button>
    </div>
  `);
}

function toggleFlash() { showBack = !showBack; showFlash(); }
function nextFlash() { index = (index + 1) % words.length; showBack = false; showFlash(); }

function markReview() {
  getProgress(words[index].word).review = true;
  saveProgress();
  showFlash();
}

function unmarkReview() {
  getProgress(words[index].word).review = false;
  saveProgress();
  if (sessionType === "review") {
      words = words.filter(w => w.word !== words[index].word);
      if (words.length === 0) {
          alert("見直す単語がなくなりました！");
          home();
      } else {
          index = index % words.length;
          showFlash();
      }
  } else {
      showFlash();
  }
}

// --- Quiz ---
let quizIndex = 0;
let score = 0;

function quizMode() {
  quizIndex = 0;
  score = 0;
  nextQuiz();
}

function nextQuiz() {
  if (quizIndex >= words.length) return quizResult();
  const q = words[quizIndex];
  const options = shuffle([q.meaning, ...getRandomMeanings(q.meaning, 3)]);
  const backTarget = (sessionType === "level") ? "modeSelect()" : "home()";

  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">Quiz</span>
        <span class="counter">${quizIndex + 1} / ${words.length}</span>
      </div>
      <h3 class="quiz-question">${q.word}</h3>
      <div class="options-list">
        ${options.map(o => `<div class='quiz-option' onclick='selectQuiz("${o}")'>${o}</div>`).join("")}
      </div>
      <button class="back-link" onclick="${backTarget}">← クイズを中断</button>
    </div>
  `);
}

function selectQuiz(opt) {
  const currentWord = words[quizIndex];
  const p = getProgress(currentWord.word);
  if (opt === currentWord.meaning) {
    score++;
    p.correctCount++;
    p.wrong = false;
  } else {
    p.wrong = true;
    p.wrongCount++;
  }
  saveProgress();
  quizIndex++;
  nextQuiz();
}

function quizResult() {
  const rate = Math.round((score / words.length) * 100);
  setView(`
    <div class="result-card fade-in">
      <div class="result-title">クイズ終了！</div>
      <div class="result-rate">${rate}%</div>
      <div class="result-score">${words.length}問中 ${score}問 正解</div>
      <button class="neon-btn-primary" onclick="quizMode()">もう一度挑戦する</button>
      <button class="back-link" onclick="home()">ホームに戻る</button>
    </div>
  `);
}

// --- List Logic ---
function reviewWords() {
  const list = Object.keys(progress)
    .filter(key => progress[key].review)
    .map(key => ({ word: key, ...progress[key], ...findInJSON(key) }))
    .filter(w => w.meaning);

  if (list.length === 0) return alert("見直す単語はありません");
  words = list;
  sessionType = "review";
  flashMode();
}

function wrongWords() {
  const list = Object.keys(progress)
    .filter(key => progress[key].wrong)
    .map(key => ({ word: key, ...progress[key], ...findInJSON(key) }))
    .filter(w => w.meaning);

  if (list.length === 0) return alert("間違えた単語はありません");
  words = list;
  sessionType = "wrong";
  quizMode();
}

// --- Helpers ---
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
function getRandomMeanings(correct, count) {
  const allMeanings = words.filter(w => w.meaning !== correct).map(w => w.meaning);
  return shuffle(allMeanings).slice(0, count);
}
function getProgress(word) {
  if (!progress[word]) progress[word] = { review: false, wrong: false, correctCount: 0, wrongCount: 0 };
  return progress[word];
}
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
function findInJSON(wordText) { return words.find(w => w.word === wordText) || {}; }

home();
