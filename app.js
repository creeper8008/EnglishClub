/**
 * Vocab Studio - Core Logic
 * Powered by Together AI style aesthetics
 */

let currentLevel = null;
let words = [];
let index = 0;
let showBack = false;
let mode = null;

const STORAGE_KEY = "vocabProgress";
let progress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

// View Helper: 画面を書き換える関数
function setView(html) {
  document.getElementById("app").innerHTML = html;
}

// 1. Home Screen
function home() {
  mode = null;
  setView(`
    <div class="fade-in">
      <h1>Vocab Studio</h1>
      <p style="text-align:center; color:#94a3b8; margin-bottom:2rem;">Select your challenge level</p>
      
      <div class="level-list">
        <div class='level-card' onclick='loadLevel(1)'>Level 1<span>Beginner</span></div>
        <div class='level-card' onclick='loadLevel(2)'>Level 2<span>Intermediate</span></div>
        <div class='level-card' onclick='loadLevel(3)'>Level 3<span>Upper-Intermediate</span></div>
        <div class='level-card' onclick='loadLevel(4)'>Level 4<span>Advanced</span></div>
        <div class='level-card' onclick='loadLevel(5)'>Level 5<span>Master</span></div>
      </div>

      <div class="utility-grid">
        <button class="util-btn" onclick="reviewWords()">🔁 Review List</button>
        <button class="util-btn" onclick="wrongWords()">❌ Mistake List</button>
      </div>
    </div>
  `);
}

// 2. Load Data
async function loadLevel(lv) {
  currentLevel = lv;
  try {
    const res = await fetch(`words/level_${lv}.json`);
    words = await res.json();
    
    // 全単語のプログレスを初期化
    words.forEach(w => {
      if (!progress[w.word]) getProgress(w.word);
    });
    
    index = 0;
    modeSelect();
  } catch (e) {
    alert("データの読み込みに失敗しました。ファイルパスを確認してください。");
  }
}

// 3. Mode Selection
function modeSelect() {
  setView(`
    <div class="mode-card fade-in">
      <div class="level-badge">Level ${currentLevel}</div>
      <h2>Choose your mode</h2>
      <button class="mode-btn flash-btn" onclick="flashMode()">🃏 Flashcards</button>
      <button class="mode-btn quiz-btn" onclick="quizMode()">✏️ 4-Choice Quiz</button>
      <button class="back-link" onclick="home()">← Back to Home</button>
    </div>
  `);
}

// --- Flashcards ---
function flashMode() {
  mode = "flash";
  index = 0;
  showFlash();
}

function showFlash() {
  const w = words[index];
  const content = showBack 
    ? `<div class="card-back"><h2>${w.meaning}</h2><p class="example-text">${w.example}</p></div>` 
    : `<div class="card-front"><h1>${w.word}</h1><p class="pos-tag">${w.pos}</p></div>`;

  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">Flashcards</span>
        <span class="counter">${index + 1} / ${words.length}</span>
      </div>
      <div class='flashcard' onclick='toggleFlash()'>${content}</div>
      <div class="action-grid">
        <button class="primary-btn" onclick='nextFlash()'>Next Word →</button>
        <button class="secondary-btn" onclick="markReview()">🔁 Mark for Review</button>
      </div>
      <button class="back-link" onclick="modeSelect()">← Back</button>
    </div>
  `);
}

function toggleFlash() {
  showBack = !showBack;
  showFlash();
}

function nextFlash() {
  index = (index + 1) % words.length;
  showBack = false;
  showFlash();
}

function markReview() {
  const p = getProgress(words[index].word);
  p.review = true;
  saveProgress();
  // 小さな通知を表示（オプション）
  nextFlash();
}

// --- Quiz ---
let quizIndex = 0;
let score = 0;

function quizMode() {
  mode = "quiz";
  quizIndex = 0;
  score = 0;
  nextQuiz();
}

function nextQuiz() {
  if (quizIndex >= words.length) return quizResult();
  
  const q = words[quizIndex];
  // 正解1つ + ランダムに3つ
  const options = shuffle([q.meaning, ...getRandomMeanings(q.meaning, 3)]);

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
      <button class="back-link" onclick="modeSelect()">← Quit Quiz</button>
    </div>
  `);
}

function selectQuiz(opt) {
  const currentWord = words[quizIndex];
  const p = getProgress(currentWord.word);

  if (opt === currentWord.meaning) {
    score++;
    p.correctCount++;
    p.wrong = false; // 正解したら間違えリストから外す（お好みで）
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
      <div class="result-title">🎉 Finish!</div>
      <div class="result-score">${score} / ${words.length} correct</div>
      <div class="result-rate">${rate}%</div>
      <button class="primary-btn" onclick="quizMode()">Retry</button>
      <button class="secondary-btn" onclick="home()">Home</button>
    </div>
  `);
}

// --- Special Lists ---
function reviewWords() {
  const list = Object.keys(progress)
    .filter(key => progress[key].review)
    .map(key => ({ word: key, ...progress[key], ...findInJSON(key) }))
    .filter(w => w.meaning); // JSONデータが存在するもののみ

  if (list.length === 0) return alert("見直す単語はありません");
  words = list;
  flashMode();
}

function wrongWords() {
  const list = Object.keys(progress)
    .filter(key => progress[key].wrong)
    .map(key => ({ word: key, ...progress[key], ...findInJSON(key) }))
    .filter(w => w.meaning);

  if (list.length === 0) return alert("間違えた単語はありません");
  words = list;
  quizMode();
}

// --- Utilities ---
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

function getRandomMeanings(correct, count) {
  const allMeanings = words.filter(w => w.meaning !== correct).map(w => w.meaning);
  return shuffle(allMeanings).slice(0, count);
}

function getProgress(word) {
  if (!progress[word]) {
    progress[word] = { review: false, wrong: false, correctCount: 0, wrongCount: 0 };
  }
  return progress[word];
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// 現在のwordsリストから単語を探す補助関数
function findInJSON(wordText) {
  // 全レベルを横断的に探すのは重いため、現在読み込まれているwordsから探す
  // もし全レベルから探したい場合はJSONを統合する必要がありますが、
  // 今は簡易的に現在のセッションで読み込まれた中から補完します。
  return words.find(w => w.word === wordText) || {};
}

// Start
home();
