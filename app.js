let currentLevel = null;
let words = [];
let index = 0;
let showBack = false;
let mode = null;

const STORAGE_KEY = "vocabProgress";

let progress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};


function setView(html){ document.getElementById("app").innerHTML = html; }

function home(){
  mode = null;
  setView(`
    <h1>Vocabulary Trainer</h1>
    <h2>レベル選択</h2>
    <div class='level-card' style='background:#b3e5fc' onclick='loadLevel(1)'>Level 1（初級）</div>
    <div class='level-card' style='background:#f8bbd0' onclick='loadLevel(2)'>Level 2（中級）</div>
    <div class='level-card' style='background:#c8e6c9' onclick='loadLevel(3)'>Level 3（中上級）</div>
    <div class='level-card' style='background:#fff9c4' onclick='loadLevel(4)'>Level 4（上級）</div>
    <div class='level-card' style='background:#e1bee7' onclick='loadLevel(5)'>Level 5（最上級）</div>
    <button onclick="reviewWords()">🔁 見直す単語</button>
    <button onclick="wrongWords()">❌ 間違えた単語</button>
  `);
}

async function loadLevel(lv){
  currentLevel = lv;
  const res = await fetch(`words/level_${lv}.json`);
  words = await res.json();
words.forEach(w => {
  if (w.review === undefined) w.review = false;
  if (w.wrong === undefined) w.wrong = false;
  });
  index = 0;
  modeSelect();
}
 
function modeSelect(){
  setView(`
    <div class="mode-card">
      <div class="level-badge">
        Level ${currentLevel}
      </div>

      <h2>今日は何をしますか?</h2>

      <button class="mode-btn flash-btn" onclick="flashMode()">
        🃏 フラッシュカード
      </button>

      <button class="mode-btn quiz-btn" onclick="quizMode()">
        ✏️ 4択クイズ
      </button>

      <button class="back-btn" onclick="home()">
        ← ホームに戻る
      </button>
    </div>
  `);
}

// Flashcards
function flashMode(){ mode = "flash"; index = 0; showFlash(); }
function showFlash(){
  const w = words[index];
  const content = showBack ? `<h2>${w.meaning}</h2><p>${w.example}</p>` : `<h1>${w.word}</h1><p>${w.pos}</p>`;
  setView(`
    <h2>Flashcards</h2>
    <div class='flashcard' onclick='toggleFlash()'>${content}</div>
    <button onclick='nextFlash()'>次へ</button>
     <button onclick="markReview()">🔁 見直す</button>
    ${homeBar()}
  `);
  }
function markReview(){
  const p = getProgress(words[index].word);
  p.review = true;
  saveProgress();
  nextFlash();
}
function toggleFlash(){ showBack = !showBack; showFlash(); }
function nextFlash(){ index = (index+1)%words.length; showBack=false; showFlash(); }

function reviewWords(){
  const list = words.filter(w => {
    const p = progress[w.word];
    return p && p.review === true;
  });

  if(list.length === 0){
    alert("見直す単語はありません");
    return;
  }

  startFlashWith(list);
}

function wrongWords(){
  const list = words.filter(w => {
    const p = progress[w.word];
    return p && p.wrong === true;
  });

  if(list.length === 0){
    alert("間違えた単語はありません");
    return;
  }

  startQuizWith(list);
}

function startFlashWith(list){
  words = list;
  index = 0;
  showBack = false;
  flashMode();
}
function startQuizWith(list){
  words = list;
  quizIndex = 0;
  score = 0;
  quizMode();
}





// Quiz
let quizIndex = 0;
let score = 0;
function quizMode(){
  mode = "quiz";
  quizIndex = 0;
  score = 0;
  nextQuiz();
}
function nextQuiz(){
  if(quizIndex >= words.length){ return quizResult(); }
  const q = words[quizIndex];
  const options = shuffle([q.meaning, ...getRandomMeanings(q.meaning,3)]);
  setView(`
    <h2>Quiz ${quizIndex+1}/${words.length}</h2>
    <h3>${q.word}</h3>
    ${options.map(o=>`<div class='quiz-option' onclick='selectQuiz("${o}")'>${o}</div>`).join("")}
    ${homeBar()}
  `);
}
function selectQuiz(opt){
  const word = words[quizIndex].word;
  const p = getProgress(word);

  if(opt === words[quizIndex].meaning){
    score++;
    p.correctCount++;
  } else {
    p.wrong = true;
    p.wrongCount++;
  }

  saveProgress();
  quizIndex++;
  nextQuiz();
}
function quizResult(){
  const rate = Math.round((score / words.length) * 100);
  setView(`
    <div class="result-card">
      <div class="result-title">🎉 Good Job!</div>

      <div class="result-score">
        ${score} / ${words.length} correct
      </div>

      <div class="result-rate">
        ${rate}%
      </div>

      <button class="result-btn retry-btn" onclick="quizMode()">
        もう一度チャレンジ
      </button>

      <button class="result-btn home-btn" onclick="home()">
        🏠 ホームに戻る
      </button>
    </div>
  `);
}
  function homeBar(){
  return `
    <div style="margin-top:24px;">
      <button class="home-btn" onclick="home()">
        🏠 ホームに戻る
      </button>
    </div>
  `;
}
function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }
function getRandomMeanings(correct, count){
  const arr = words.filter(w=>w.meaning!==correct).map(w=>w.meaning);
  return shuffle(arr).slice(0,count);
  }


//単語保存関連のコード
function getProgress(word){
  if(!progress[word]){
    progress[word] = {
      review: false,
      wrong: false,
      correctCount: 0,
      wrongCount: 0
    };
  }
  return progress[word];
}

function saveProgress(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}




home();
