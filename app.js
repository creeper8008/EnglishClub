/**
 * Vocab Studio 5.2 - Smart Random Edition
 */

let allWords = []; // 読み込んだ全単語のバックアップ
let words = [];    // 現在学習中の単語（抽出済み）
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
      <p class="subtitle">TOEIC目標スコアを選択</p>
      
      <div class="level-list">
        <div class='level-card card-1' onclick='loadLevel(1)'>Level 1<span>600点突破・基礎</span></div>
        <div class='level-card card-2' onclick='loadLevel(2)'>Level 2<span>730点・実務</span></div>
        <div class='level-card card-3' onclick='loadLevel(3)'>Level 3<span>860点・上級</span></div>
        <div class='level-card card-4' onclick='loadLevel(4)'>Level 4<span>900点越え</span></div>
        <div class='level-card card-5' onclick='loadLevel(5)'>Level 5<span>マスター</span></div>
      </div>

      <div class="utility-grid">
        <button class="neon-btn-outline" onclick="showCheckedWords()">🔁 チェックした単語</button>
        <button class="neon-btn-outline" onclick="showMistakenWords()">❌ 間違えた単語</button>
      </div>

      <footer class="app-footer">
        <p>Presented by Nagaoka University English Circle</p>
      </footer>
    </div>
  `);
}

// --- Mode & Count Selection ---
async function loadLevel(lv) {
  currentLevel = lv;
  sessionType = "level";
  try {
    const res = await fetch(`words/level_${lv}.json`);
    allWords = await res.json(); // 全データを一旦バックアップに保存
    modeSelect();
  } catch (e) { alert("データの読み込みに失敗しました。"); }
}

function modeSelect() {
  setView(`
    <div class="mode-container fade-in">
      <div class="level-badge">Level ${currentLevel}</div>
      <h2 class="section-title">学習モードと問題数</h2>
      
      <div class="mode-selection-grid">
        <button class="mode-main-btn" onclick="prepareSession('flash')">
          <span class="icon">🃏</span>
          <span class="text">フラッシュカード</span>
        </button>
        <button class="mode-main-btn" onclick="prepareSession('quiz')">
          <span class="icon">✏️</span>
          <span class="text">4択クイズ</span>
        </button>
      </div>

      <div class="count-selector-area">
        <p class="small-label">出題数を選択してください</p>
        <div class="count-grid">
          <button class="count-btn active" id="btn-5" onclick="selectCount(5)">5</button>
          <button class="count-btn" id="btn-10" onclick="selectCount(10)">10</button>
          <button class="count-btn" id="btn-20" onclick="selectCount(20)">20</button>
          <button class="count-btn" id="btn-all" onclick="selectCount(0)">ALL</button>
        </div>
      </div>

      <button class="back-link-btn" onclick="home()">← ホームに戻る</button>
    </div>
  `);
  window.selectedCount = 5; // デフォルト5問
}

function selectCount(num) {
  window.selectedCount = num;
  document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
  const targetId = num === 0 ? 'btn-all' : `btn-${num}`;
  document.getElementById(targetId).classList.add('active');
}

function prepareSession(type) {
  // ランダムに並び替えて、指定数だけ抽出
  let shuffled = shuffle([...allWords]);
  let limit = window.selectedCount === 0 ? shuffled.length : window.selectedCount;
  words = shuffled.slice(0, limit);
  
  if (type === 'flash') flashMode();
  else quizMode();
}

// --- Flashcards ---
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
        <span class="mode-title">${sessionType === 'review' ? '復習' : 'Flash'}</span>
        <span class="counter">${index + 1} / ${words.length}</span>
      </div>
      <div class='flashcard-glass' onclick='toggleFlash()'>${content}</div>
      <div class="control-stack">
        <button class="neon-btn-primary main-glow" onclick='nextFlash()'>${index + 1 === words.length ? '終了' : '次の単語へ →'}</button>
        ${p.review 
          ? `<button class="neon-btn-danger" onclick="unmarkReview()">➖ リストから削除</button>`
          : `<button class="neon-btn-secondary" onclick="markReview()">🔁 リストに追加</button>`
        }
      </div>
      <button class="back-link-btn" onclick="modeSelect()">← 戻る</button>
    </div>
  `);
}

function nextFlash() {
  if (index + 1 >= words.length) return modeSelect();
  index++; showBack = false; showFlash();
}
function toggleFlash() { showBack = !showBack; showFlash(); }

// --- Quiz ---
let quizIndex = 0; let score = 0;
function quizMode() { quizIndex = 0; score = 0; nextQuiz(); }
function nextQuiz() {
  if (quizIndex >= words.length) return quizResult();
  const q = words[quizIndex];
  // 全単語(allWords)からダミー選択肢を抽出
  const options = shuffle([q.meaning, ...getRandomMeanings(q.meaning, 3)]);
  
  setView(`
    <div class="fade-in">
      <div class="header-flex">
        <span class="mode-title">Quiz</span>
        <span class="counter">${quizIndex + 1} / ${words.length}</span>
      </div>
      <h3 class="quiz-question-text">${q.word}</h3>
      <div class="options-container">
        ${options.map(o => `<div class='quiz-option-glass' onclick='selectQuiz("${o}")'>${o}</div>`).join("")}
      </div>
      <button class="back-link-btn" onclick="modeSelect()">← 戻る</button>
    </div>
  `);
}

function selectQuiz(opt) {
  const q = words[quizIndex];
  const p = getProgress(q.word);
  if (opt === q.meaning) { score++; p.correctCount++; p.wrong = false; } 
  else { p.wrong = true; p.wordData = q; }
  saveProgress(); quizIndex++; nextQuiz();
}

function quizResult() {
  const rate = Math.round((score / words.length) * 100);
  setView(`
    <div class="result-glass fade-in">
      <div class="result-title">Result</div>
      <div class="result-rate-display">${rate}%</div>
      <p>${words.length}問中 ${score}問 正解</p>
      <button class="neon-btn-primary main-glow" onclick="modeSelect()">もう一度</button>
      <button class="back-link-btn" onclick="home()">ホームに戻る</button>
    </div>
  `);
}

// --- Review/Wrong Lists Logic ---
function showCheckedWords() {
  const list = Object.keys(progress).filter(k => progress[k].review).map(k => progress[k].wordData);
  if (list.length === 0) { alert("リストは空です"); return home(); }
  allWords = list; // 復習リストを現在の母集団にする
  modeSelect();
  sessionType = "review";
}

function showMistakenWords() {
  const list = Object.keys(progress).filter(k => progress[k].wrong).map(k => progress[k].wordData);
  if (list.length === 0) { alert("間違いはありません！"); return home(); }
  allWords = list; // 間違いリストを現在の母集団にする
  modeSelect();
  sessionType = "wrong";
}

// --- Utils ---
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
function getRandomMeanings(correct, count) {
  const all = allWords.map(w => w.meaning).filter(m => m !== correct);
  return shuffle(all).slice(0, count);
}
function getProgress(word) {
  if (!progress[word]) progress[word] = { review: false, wrong: false, wordData: null };
  return progress[word];
}
function markReview() {
  const w = words[index];
  const p = getProgress(w.word);
  p.review = true; p.wordData = w;
  saveProgress(); showFlash();
}
function unmarkReview() {
  getProgress(words[index].word).review = false;
  saveProgress(); showFlash();
}
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

home();
