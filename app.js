const screens = {
    start: document.getElementById('start-screen'),
    study: document.getElementById('study-screen'),
    settings: document.getElementById('settings-screen'),
    game: document.getElementById('game-screen'),
    analysis: document.getElementById('analysis-screen')
};

const elements = {
    score: document.getElementById('score'),
    streak: document.getElementById('streak'),
    question: document.getElementById('question'),
    finalScore: document.getElementById('final-score'),
    highestStreak: document.getElementById('highest-streak'),
    analysisList: document.getElementById('analysis-list'),
    delayInput: document.getElementById('delay-input'),
    table: document.getElementById('multiplication-table'),
    inspectBadge: document.getElementById('study-inspect-badge'),
    choiceBtns: [
        document.getElementById('choice-0'),
        document.getElementById('choice-1'),
        document.getElementById('choice-2'),
        document.getElementById('choice-3')
    ]
};

let appSettings = {
    transitionDelay: 400
};

let gameState = {
    difficulty: 'plus_minus',
    score: 0,
    streak: 0,
    highestStreak: 0,
    isProcessing: false,
    problemCount: 0,
    problemStats: {},
    scheduledReviews: [],
    currentQuestion: null
};

// UI Navigation
function showScreen(screenName) {
    const container = document.querySelector('.container');
    if (container) {
        if (screenName === 'study') {
            container.classList.add('wide');
        } else {
            container.classList.remove('wide');
        }
    }
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Event Listeners for Start Screen
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        gameState.difficulty = e.target.dataset.diff;
        startGame();
    });
});

document.getElementById('btn-study').addEventListener('click', () => {
    showScreen('study');
});

document.getElementById('btn-back-study').addEventListener('click', () => {
    showScreen('start');
});

const btnStudyAnalysis = document.getElementById('btn-study-analysis');
if (btnStudyAnalysis) {
    btnStudyAnalysis.addEventListener('click', () => {
        showScreen('study');
    });
}

document.getElementById('btn-settings').addEventListener('click', () => {
    elements.delayInput.value = appSettings.transitionDelay;
    showScreen('settings');
});

// Event Listeners for Settings Screen
document.getElementById('btn-save-settings').addEventListener('click', () => {
    let delay = parseInt(elements.delayInput.value, 10);
    if (!isNaN(delay) && delay >= 0) {
        appSettings.transitionDelay = delay;
    }
    showScreen('start');
});

// Event Listeners for Game Screen
document.getElementById('btn-stop').addEventListener('click', () => {
    endGame();
});

// Event Listeners for Analysis Screen
document.getElementById('btn-restart').addEventListener('click', () => {
    showScreen('start');
});

function startGame() {
    gameState = {
        ...gameState,
        score: 0,
        streak: 0,
        highestStreak: 0,
        isProcessing: false,
        problemCount: 0,
        problemStats: {},
        scheduledReviews: [],
        currentQuestion: null
    };
    updateStats();
    showScreen('game');
    generateQuestion();
}

function endGame() {
    elements.finalScore.textContent = gameState.score;
    elements.highestStreak.textContent = gameState.highestStreak;
    populateAnalysis();
    showScreen('analysis');
}

function populateAnalysis() {
    elements.analysisList.innerHTML = '';
    
    let wrongProblems = Object.values(gameState.problemStats).filter(p => p.wrongCount > 0);
    wrongProblems.sort((a, b) => b.wrongCount - a.wrongCount);
    
    if (wrongProblems.length === 0) {
        elements.analysisList.innerHTML = '<div class="analysis-empty">PERFECT RUN — NO MISTAKES MADE</div>';
        return;
    }
    
    wrongProblems.forEach(p => {
        let item = document.createElement('div');
        item.className = 'analysis-item';
        item.innerHTML = `
            <span class="problem">${p.question} = ${p.answer}</span>
            <span class="stats">${p.wrongCount} WRONG</span>
        `;
        elements.analysisList.appendChild(item);
    });
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateChoices(correctAnswer) {
    const choices = new Set([correctAnswer]);
    while (choices.size < 4) {
        let offset = randomInt(-15, 15);
        if (offset === 0) offset = 1;
        
        let wrongAnswer = correctAnswer + offset;
        if (correctAnswer >= 0 && wrongAnswer < 0) {
            wrongAnswer = correctAnswer + Math.abs(offset) + randomInt(1, 5);
        }
        choices.add(wrongAnswer);
    }
    return Array.from(choices).sort(() => Math.random() - 0.5);
}

function generateQuestion() {
    gameState.problemCount++;
    
    // Check if any reviews are due
    let dueReviewIndex = gameState.scheduledReviews.findIndex(r => r.showAtProblemCount <= gameState.problemCount);
    
    let num1, num2, operator, answer, isReview = false, step = 0;
    
    if (dueReviewIndex !== -1) {
        let reviewItem = gameState.scheduledReviews.splice(dueReviewIndex, 1)[0];
        num1 = reviewItem.num1;
        num2 = reviewItem.num2;
        operator = reviewItem.operator;
        answer = reviewItem.answer;
        isReview = true;
        step = reviewItem.step;
    } else {
        const { difficulty } = gameState;
        if (difficulty === 'plus_minus') {
            operator = Math.random() < 0.5 ? '+' : '-';
            if (operator === '+') {
                num1 = randomInt(1, 98);
                num2 = randomInt(1, 99 - num1);
                answer = num1 + num2;
            } else {
                num1 = randomInt(1, 99);
                num2 = randomInt(1, num1);
                answer = num1 - num2;
            }
        } else if (difficulty === 'multiply_beginner') {
            operator = '*';
            num1 = randomInt(2, 12);
            num2 = randomInt(1, 12);
            answer = num1 * num2;
        } else if (difficulty === 'multiply_advanced') {
            operator = '*';
            num1 = randomInt(2, 20);
            num2 = randomInt(1, 12);
            answer = num1 * num2;
        }
    }

    gameState.currentQuestion = { num1, num2, operator, answer, isReview, step };
    const operatorSymbol = operator === '*' ? '×' : operator;
    elements.question.textContent = `${num1} ${operatorSymbol} ${num2}`;

    const choices = generateChoices(answer);
    
    elements.choiceBtns.forEach((btn, index) => {
        btn.textContent = choices[index];
        btn.className = 'choice-btn'; // Reset classes
        btn.onclick = () => checkAnswer(choices[index], btn);
    });
}

function updateStats() {
    elements.score.textContent = gameState.score;
    elements.streak.textContent = gameState.streak;
}

function checkAnswer(selectedAnswer, btnElement) {
    if (gameState.isProcessing) return;
    gameState.isProcessing = true;

    let { num1, num2, operator, answer, isReview, step } = gameState.currentQuestion;
    const operatorSymbol = operator === '*' ? '×' : operator;
    const qKey = `${num1} ${operatorSymbol} ${num2}`;
    
    if (!gameState.problemStats[qKey]) {
        gameState.problemStats[qKey] = { wrongCount: 0, rightCount: 0, question: qKey, answer: answer };
    }

    const isCorrect = (selectedAnswer === answer);

    if (isCorrect) {
        gameState.problemStats[qKey].rightCount++;
        gameState.streak++;
        if (gameState.streak > gameState.highestStreak) {
            gameState.highestStreak = gameState.streak;
        }
        gameState.score += 10 + (gameState.streak * 2);
        btnElement.classList.add('correct');

        if (isReview) {
            let nextStep = step + 1;
            let increment = 0;
            
            if (nextStep === 2) increment = 6;
            else if (nextStep === 3) increment = 8;
            
            if (increment > 0) {
                gameState.scheduledReviews.push({
                    num1, num2, operator, answer,
                    isReview: true,
                    step: nextStep,
                    showAtProblemCount: gameState.problemCount + increment
                });
            }
        }
    } else {
        gameState.problemStats[qKey].wrongCount++;
        gameState.streak = 0;
        btnElement.classList.add('wrong');
        
        elements.choiceBtns.forEach(btn => {
            if (parseInt(btn.textContent, 10) === answer) {
                btn.classList.add('correct');
            }
        });

        // Remove any existing identical scheduled review to prevent duplicates
        gameState.scheduledReviews = gameState.scheduledReviews.filter(r => 
            `${r.num1} ${r.operator === '*' ? '×' : r.operator} ${r.num2}` !== qKey
        );
        
        // Schedule for step 1 (interval 3)
        gameState.scheduledReviews.push({
            num1, num2, operator, answer,
            isReview: true,
            step: 1,
            showAtProblemCount: gameState.problemCount + 3
        });
    }

    setTimeout(() => {
        updateStats();
        generateQuestion();
        gameState.isProcessing = false;
    }, appSettings.transitionDelay);
}

// Multiplication Table Generator
function initMultiplicationTable() {
    if (!elements.table) return;

    let theadHtml = '<thead><tr><th>Multiple</th>';
    for (let c = 1; c <= 12; c++) {
        theadHtml += `<th id="th-col-${c}">${c}</th>`;
    }
    theadHtml += '</tr></thead>';

    let tbodyHtml = '<tbody>';
    for (let r = 1; r <= 20; r++) {
        tbodyHtml += `<tr><th id="th-row-${r}">${r}</th>`;
        for (let c = 1; c <= 12; c++) {
            const product = r * c;
            tbodyHtml += `<td data-row="${r}" data-col="${c}" data-product="${product}">${product}</td>`;
        }
        tbodyHtml += '</tr>';
    }
    tbodyHtml += '</tbody>';

    elements.table.innerHTML = theadHtml + tbodyHtml;

    function highlightCell(td) {
        const row = td.dataset.row;
        const col = td.dataset.col;
        const prod = td.dataset.product;

        elements.table.querySelectorAll('.active-cell').forEach(el => el.classList.remove('active-cell'));
        elements.table.querySelectorAll('.active-header').forEach(el => el.classList.remove('active-header'));

        td.classList.add('active-cell');
        const rowTh = document.getElementById(`th-row-${row}`);
        const colTh = document.getElementById(`th-col-${col}`);
        if (rowTh) rowTh.classList.add('active-header');
        if (colTh) colTh.classList.add('active-header');

        if (elements.inspectBadge) {
            elements.inspectBadge.textContent = `${row} × ${col} = ${prod}`;
        }
    }

    elements.table.querySelectorAll('td').forEach(td => {
        td.addEventListener('pointerenter', () => highlightCell(td));
        td.addEventListener('click', () => highlightCell(td));
    });
}

// Initialize Table on Startup
initMultiplicationTable();
