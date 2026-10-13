let words = [];
let filteredWords = [];
let currentIndex = 0;
let studyLog = {};
let answerShown = false;
let currentLevel = "all";

const wordEl = document.getElementById("word");
const meaningEl = document.getElementById("meaning");
const progressTextEl = document.getElementById("progressText");

const showMeaningBtn = document.getElementById("showMeaningBtn");
const correctBtn = document.getElementById("correctBtn");
const wrongBtn = document.getElementById("wrongBtn");
const nextBtn = document.getElementById("nextBtn");
const levelSelect = document.getElementById("levelSelect");

const correctCountEl = document.getElementById("correctCount");
const wrongCountEl = document.getElementById("wrongCount");
const weakWordCountEl = document.getElementById("weakWordCount");

const wrongRankingListEl = document.getElementById("wrongRankingList");
async function loadWords() {
    try {
        const response = await fetch("words.json");
        if (!response.ok) {
            throw new Error("words.json の読み込みに失敗しました。");
        }

        words = await response.json();

        if (!Array.isArray(words) || words.length === 0) {
            throw new Error("単語データが空です。");
        }

        loadStudyLog();
        applyLevelFilter();
        updateStats();
        updateWrongRanking();
    } catch (error) {
        console.error(error);
        wordEl.textContent = "エラー";
        meaningEl.classList.remove("hidden");
        meaningEl.textContent = error.message;
        showMeaningBtn.disabled = true;
        correctBtn.disabled = true;
        wrongBtn.disabled = true;
        nextBtn.disabled = true;
    }
}

function loadStudyLog() {
    const savedLog = localStorage.getItem("toeicStudyLog");
    if (savedLog) {
        studyLog = JSON.parse(savedLog);
    }
}

function saveStudyLog() {
    localStorage.setItem("toeicStudyLog", JSON.stringify(studyLog));
}

function applyLevelFilter() {
    if (currentLevel === "all") {
        filteredWords = [...words];
    } else {
        filteredWords = words.filter(word => String(word.level) === currentLevel);
    }

    currentIndex = 0;

    if (filteredWords.length === 0) {
        wordEl.textContent = "単語がありません";
        meaningEl.textContent = "このレベルの単語は未登録です。";
        meaningEl.classList.remove("hidden");
        progressTextEl.textContent = "0 / 0";
        correctBtn.disabled = true;
        wrongBtn.disabled = true;
        showMeaningBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    shuffleFilteredWords(); //ランダム
    showMeaningBtn.disabled = false;
    nextBtn.disabled = false;
    showWord();
}

function showWord() {
    if (filteredWords.length === 0) return;

    const currentWord = filteredWords[currentIndex];
    wordEl.textContent = currentWord.word;
    meaningEl.textContent = currentWord.meaning;
    meaningEl.classList.add("hidden");

    progressTextEl.textContent = `${currentIndex + 1} / ${filteredWords.length}`;

    answerShown = false;
    correctBtn.disabled = true;
    wrongBtn.disabled = true;
}

function showMeaning() {
    if (filteredWords.length === 0) return;

    meaningEl.classList.remove("hidden");
    answerShown = true;
    correctBtn.disabled = false;
    wrongBtn.disabled = false;
}

function recordAnswer(type) {
    if (!answerShown || filteredWords.length === 0) return;

    const currentWord = filteredWords[currentIndex];
    const wordId = currentWord.id;

    if (!studyLog[wordId]) {
        studyLog[wordId] = {
            correct: 0,
            wrong: 0
        };
    }

    if (type === "correct") {
        studyLog[wordId].correct += 1;
    } else if (type === "wrong") {
        studyLog[wordId].wrong += 1;
    }

    saveStudyLog();
    updateStats();
    updateWrongRanking();
    nextWord();
}

function updateStats() {
    let totalCorrect = 0;
    let totalWrong = 0;
    let weakWords = 0;

    for (const wordId in studyLog) {
        totalCorrect += studyLog[wordId].correct;
        totalWrong += studyLog[wordId].wrong;

        if (studyLog[wordId].wrong > studyLog[wordId].correct) {
            weakWords += 1;
        }
    }

    correctCountEl.textContent = totalCorrect;
    wrongCountEl.textContent = totalWrong;
    weakWordCountEl.textContent = weakWords;
}

function updateWrongRanking() {
    wrongRankingListEl.innerHTML = "";

    const rankingData = words
        .map(word => {
            const log = studyLog[word.id] || { correct: 0, wrong: 0 };
            return {
                word: word.word,
                meaning: word.meaning,
                wrong: log.wrong
            };
        })
        .filter(item => item.wrong > 0)
        .sort((a, b) => b.wrong - a.wrong);

    if (rankingData.length === 0) {
        wrongRankingListEl.innerHTML = "<li>まだ間違えた単語はありません。</li>";
        return;
    }

    rankingData.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
      <div class="ranking-word">${index + 1}. ${item.word}
        <span class="ranking-meaning">（${item.meaning}）</span>
      </div>
      <div class="ranking-count">間違えた回数: ${item.wrong}回</div>
    `;
        wrongRankingListEl.appendChild(li);
    });
}

function nextWord() {
    if (filteredWords.length === 0) return;

    currentIndex += 1;

    if (currentIndex >= filteredWords.length) {
        currentIndex = 0;
        shuffleFilteredWords();
        alert("このレベルを一周しました。単語をシャッフルしてもう一度始めます。");
    }

    showWord();
}

function shuffleFilteredWords() {
    for (let i = filteredWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredWords[i], filteredWords[j]] = [filteredWords[j], filteredWords[i]];
    }
}

showMeaningBtn.addEventListener("click", showMeaning);
correctBtn.addEventListener("click", () => recordAnswer("correct"));
wrongBtn.addEventListener("click", () => recordAnswer("wrong"));
nextBtn.addEventListener("click", nextWord);

levelSelect.addEventListener("change", (event) => {
    currentLevel = event.target.value;
    applyLevelFilter();
});

loadWords();