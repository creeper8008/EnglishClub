/**
 * 単語トレーナー 5.5 - Bug Fix Edition
 */

let allWords = []; 
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

// --- Home ---
function home() {
  sessionType = null;
  setView(`
    <div class="fade-in">
      <h1>単語トレーナー</h1>
      <p class="subtitle">TOEICスコア目標を選んでトレーニング！</p>
      
      <div class="level-list">
        <div class='level-card card-1' onclick='loadLevel(1)'>Level 1<span>600点突破・基礎</span></div>
        <div class='level-card card-2' onclick='loadLevel(2)'>Level 2<span>730点・実務</span></div>
        <div class='level-card card-3' onclick='loadLevel(3)'>Level 3<span>860点・上級</span></div>
        <div class='level-card card-4' onclick='loadLevel(4)'>Level 4<span>900点越え</span></div>
        <div class='level-card card-5' onclick='loadLevel(5)'>Level 5<span>マスター</span></div>
      </div>

      <div class="utility-grid">
        <button class="neon-btn-outline" onclick="showCheckedWords()">🔁 チェック済</button>
        <button class="neon-btn-outline" onclick="showMistakenWords()">❌ 間違えた単語</button>
      </div>

      <footer class="app-footer">
        <p>Presented by Nagaoka University English Circle</p>
      </footer>
    </div>
  `);
}

// --- List Views ---
function showCheckedWords() {
  const list = Object.keys(progress).filter(k => progress[k].review && progress[k].wordData).map(k => progress[k].wordData);
  if (list.length === 0) { alert("チェックした単語はありません。"); home(); return; }
  sessionType = "review"; allWords = list;
  setView(`
    <div class="fade-in">
      <div class="header-flex"><span>Review List</span><span>合計: ${list.length}語</span></div>
      <h2 class="section-title">チェックした単語</h2>
      <button class="neon-btn-primary main-glow action-spacing" onclick="modeSelect()">🚀 トレーニングを開始</button>
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

function removeReviewItem(wordText) {
  if (confirm(`「${wordText}」をリストから削除しますか？`)) {
    progress[wordText].review = false; saveProgress(); showCheckedWords();
  }
}

function showMistakenWords() {
  const list = Object.keys(progress).filter(k => progress[k].wrong && progress[k].wordData).map(k => progress[k].wordData);
  if (list.length === 0) { alert("間違えた単語はありません！"); home(); return; }
  sessionType = "wrong"; allWords = list;
  setView(`
    <div class="fade-in">
      <div class="header-flex"><span>Wrong List</span><span>合計: ${list.length}語</span></div>
      <h2 class="section-title">間違えた単語</h2>
      <button class="neon-btn-primary main-glow action-spacing" onclick="modeSelect()">🚀 弱点を克服する</button>
      <div class="overview-list custom-scrollbar">
        ${list.map(w => `
          <div class="overview-item">
            <div class="item-info"><span class="item-word">${w.word}</span><span class="item-meaning">${w.meaning}</span></div>
          </div>
        `).join("")}
      </div>
      <button class="back-link-btn" onclick="home()">← ホームに戻る</button>
    </div>
  `);
}

// --- Session Logic ---
async function loadLevel(lv) {
  currentLevel = lv; sessionType = "level";
  try {
    const res = await fetch(`words/level_${lv}.json`);
    allWords = await res.json(); modeSelect();
  } catch (e) { alert("データの読み込みに失敗しました。"); }
}

function modeSelect() {
  let backOp = sessionType === "level" ? "home()" : (sessionType === "review" ? "showCheckedWords()" : "showMistakenWords()");
  setView(`
    <div class="mode-container fade-in">
      <div class="level-badge">${sessionType==='level'?'Level '+currentLevel:'復習モード'}</div>
      <h2 class="section-title">トレーニング設定</h2>
      <div class="mode-selection-grid">
        <button class="mode-main-btn" onclick="prepareSession('flash')">
          <span class="icon">🃏</span><span class="text">カード</span>
        </button>
        <button class="mode-main-btn" onclick="prepareSession('quiz')">
          <span class="icon">✏️</span><span class="text">クイズ</span>
        </button>
      </div>
      <div class="count-selector-area">
        <p class="small-label">出題数を選択（全${allWords.length}単語）</p>
        <div class="count-grid">
          <button class="count-btn active" id="btn-5" onclick="selectCount(5)">5</button>
          <button class="count-btn" id="btn-10" onclick="selectCount(10)">10</button>
          <button class="count-btn" id="btn-20" onclick="selectCount(20)">20</button>
          <button class="count-btn" id="btn-all" onclick="selectCount(0)">ALL</button>
        </div>
      </div>
      <button class="back-link-btn" onclick="${backOp}">← 戻る</button>
    </div>
  `);
  window.selectedCount = 5;
}

function selectCount(n) {
  window.selectedCount = n;
  document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(n===0?'btn-all':`btn-${n}`).classList.add('active');
}

function prepareSession(t) {
  let s = [...allWords].sort(()=>Math.random()-0.5);
  let l = window.selectedCount === 0 ? s.length : Math.min(window.selectedCount, s.length);
  words = s.slice(0, l);
  if(t==='flash') flashMode(); else quizMode();
}

// --- Flashcard ---
function flashMode() { index = 0; showFlash(); }
function showFlash() {
  const w = words[index]; const p = getProgress(w.word);
  const content = showBack 
    ? `<div class="card-back"><h2>${w.meaning}</h2><p class="example-text">${w.example}</p></div>` 
    : `<div class="card-front"><h1>${w.word}</h1><p class="pos-tag">${w.pos}</p></div>`;

  setView(`
    <div class="fade-in">
      <div class="header-flex"><span>Card</span><span>${index+1} / ${words.length}</span></div>
      <div class='flashcard-glass' onclick='toggleFlash()'>${content}</div>
      <div class="control-stack">
        <button class="neon-btn-primary main-glow" onclick='nextFlash()'>${index+1===words.length?'トレーニング終了':'次へ →'}</button>
        ${p.review 
          ? `<button class="glass-btn-danger" onclick="unmarkReview()">➖ リストから削除</button>` 
          : `<button class="glass-btn-secondary" onclick="markReview()">🔁 リストに追加</button>`}
      </div>
      <button class="back-link-btn" onclick="modeSelect()">← 設定に戻る</button>
    </div>
  `);
}
function nextFlash(){ if(index+1>=words.length) modeSelect(); else { index++; showBack=false; showFlash(); } }
function toggleFlash(){ showBack=!showBack; showFlash(); }

// --- Quiz ---
let quizIndex=0; let score=0;
function quizMode(){ quizIndex=0; score=0; nextQuiz(); }
function nextQuiz() {
  if(quizIndex>=words.length) return quizResult();
  const q = words[quizIndex];
  
  // 修正：必ず正解を含めるロジック
  const correct = q.meaning;
  const others = allWords
    .map(w => w.meaning)
    .filter(m => m !== correct);
  const shuffledOthers = others.sort(() => Math.random() - 0.5);
  const finalOptions = [correct, ...shuffledOthers.slice(0, 3)].sort(() => Math.random() - 0.5);

  setView(`
    <div class="fade-in">
      <div class="header-flex"><span>Quiz</span><span>${quizIndex+1} / ${words.length}</span></div>
      <h3 class="quiz-question-text">${q.word}</h3>
      <div class="options-container">
        ${finalOptions.map(o=>`<div class='quiz-option-glass' onclick='selectQuiz("${o}")'>${o}</div>`).join("")}
      </div>
      <button class="back-link-btn" onclick="modeSelect()">← 設定に戻る</button>
    </div>
  `);
}
function selectQuiz(o){
  const q=words[quizIndex]; const p=getProgress(q.word);
  if(o===q.meaning){ score++; p.wrong=false; } else { p.wrong=true; p.wordData=q; }
  saveProgress(); quizIndex++; nextQuiz();
}
function quizResult() {
  const r = Math.round((score/words.length)*100);
  setView(`
    <div class="result-glass fade-in">
      <div class="result-title">Finish!</div>
      <div class="result-rate-display">${r}%</div>
      <p>${words.length}問中 ${score}問 正解</p>
      <button class="neon-btn-primary main-glow" onclick="modeSelect()">もう一度</button>
      <button class="back-link-btn" onclick="home()">ホームに戻る</button>
    </div>
  `);
}

function getProgress(w){ if(!progress[w]) progress[w]={review:false,wrong:false,wordData:null}; return progress[w]; }
function saveProgress(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
function markReview(){ const w=words[index]; const p=getProgress(w.word); p.review=true; p.wordData=w; saveProgress(); showFlash(); }
function unmarkReview(){ getProgress(words[index].word).review=false; saveProgress(); showFlash(); }

home();
