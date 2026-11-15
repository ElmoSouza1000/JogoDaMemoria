// ===== PEGANDO OS ELEMENTOS DA PÁGINA =====
const grid = document.querySelector('.grid');
const spanPlayer = document.querySelector('.player');
const timer = document.querySelector('.timer');
const movesSpan = document.querySelector('.moves');
const pairsSpan = document.querySelector('.pairs');
const recordSpan = document.querySelector('.record');
const statusText = document.querySelector('.status');
const levelSelect = document.querySelector('.level-select');
const restartButton = document.querySelector('.restart-button');
const exitButton = document.querySelector('.exit-button');
const modal = document.querySelector('.modal');
const modalText = document.querySelector('.modal-text');
const rankingList = document.querySelector('.ranking-list');
const playAgainButton = document.querySelector('.play-again-button');

// ===== PERSONAGENS (cada um vira um par de cartas) =====
const characters = [
    'douma',
    'inosuke',
    'mitsuri',
    'nezuko',
    'obanai',
    'shinobu',
    'tanjiro',
    'tokito',
    'tomioka',
    'zenitsu',
];

// ===== NÍVEIS: quantos pares cada um tem =====
// (o número de colunas é definido no CSS, para funcionar também no celular)
const levels = {
    facil:   { name: 'Fácil',   pairs: 6 },
    medio:   { name: 'Médio',   pairs: 8 },
    dificil: { name: 'Difícil', pairs: 10 },
};

// ===== DADOS GUARDADOS NA TELA DE LOGIN =====
const player = localStorage.getItem('player');

// "let" porque o jogador pode trocar o nível durante o jogo
let levelKey = localStorage.getItem('level');
if (!levels[levelKey]) {
    levelKey = 'facil'; // se não tiver nível salvo, usa o fácil
}
let level = levels[levelKey];

// Se alguém abrir o jogo sem passar pelo login, volta para o login
if (!player) {
    window.location = '../index.html';
}

// ===== VARIÁVEIS DA PARTIDA =====
let firstCard = '';
let secondCard = '';
let moves = 0;            // número de jogadas
let pairsFound = 0;       // pares já encontrados
let seconds = 0;          // tempo em segundos
let gameStarted = false;  // false = o cronômetro ainda não começou
let startTime = 0;        // hora em que o jogador clicou na primeira carta
let loop = null;          // guarda o cronômetro
let mismatchTimeout = null; // guarda a espera após errar um par
let endTimeout = null;      // guarda a espera para mostrar a vitória

// ===== FUNÇÕES AUXILIARES =====

// Cria um elemento HTML com uma classe
const createElement = (tag, className) => {
    const element = document.createElement(tag);
    element.className = className;
    return element;
};

// Transforma segundos em "mm:ss" (ex.: 75 vira "01:15")
const formatTime = (total) => {
    const minutes = String(Math.floor(total / 60)).padStart(2, '0');
    const secs = String(total % 60).padStart(2, '0');
    return `${minutes}:${secs}`;
};

// Embaralha uma lista (método Fisher-Yates, embaralha de forma justa)
const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
};

// ===== CRONÔMETRO =====
// Calcula o tempo comparando a hora de início com a hora de agora.
// Assim o tempo nunca "atrasa", nem se a aba ficar em segundo plano.
const updateTimer = () => {
    seconds = Math.floor((Date.now() - startTime) / 1000);
    timer.textContent = formatTime(seconds);
};

const startTimer = () => {
    startTime = Date.now();
    loop = setInterval(updateTimer, 200);
};

const stopTimer = () => {
    clearInterval(loop);
    updateTimer(); // calcula o tempo final uma última vez
};

// ===== RANKING (salvo no navegador com localStorage) =====
const getRanking = () => {
    return JSON.parse(localStorage.getItem('ranking')) || [];
};

// Melhor resultado do nível atual (ou undefined se ainda não existe)
const getBest = () => {
    return getRanking().filter((result) => result.level === levelKey)[0];
};

// Mostra o recorde no painel
const showRecord = () => {
    const best = getBest();
    recordSpan.textContent = best ? formatTime(best.time) : '--:--';
};

// Guarda o resultado desta partida
const saveResult = () => {
    const ranking = getRanking();
    ranking.push({ name: player, time: seconds, moves: moves, level: levelKey });

    // Ordena: menor tempo primeiro; se empatar, menos jogadas
    ranking.sort((a, b) => a.time - b.time || a.moves - b.moves);

    localStorage.setItem('ranking', JSON.stringify(ranking));
};

// Mostra o top 5 do nível atual dentro do modal
const showRanking = () => {
    const top5 = getRanking()
        .filter((result) => result.level === levelKey)
        .slice(0, 5);

    const items = top5.map((result, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${result.name} - ${formatTime(result.time)} (${result.moves} jogadas)`;
        return li;
    });

    rankingList.replaceChildren(...items);
};

// ===== FIM DE JOGO =====
const checkEndGame = () => {
    // Terminou quando achou todos os pares do nível
    if (pairsFound === level.pairs) {
        stopTimer();

        // Vê se bateu o recorde ANTES de salvar este resultado
        const best = getBest();
        const isRecord = !best || seconds < best.time;

        saveResult();
        showRecord();

        let message = `${player}, seu tempo foi ${formatTime(seconds)} em ${moves} jogadas.`;
        if (isRecord) {
            message = message + ' NOVO RECORDE!';
        }
        modalText.textContent = message;
        statusText.textContent = 'Você completou o jogo!';
        showRanking();

        // Espera a última carta terminar de virar antes de mostrar a tela de vitória
        endTimeout = setTimeout(() => {
            modal.classList.remove('escondido');
        }, 700);
    }
};

// ===== VERIFICA SE AS DUAS CARTAS FORMAM UM PAR =====
const checkCards = () => {
    // Guardamos as cartas em constantes para o temporizador
    // continuar funcionando mesmo que as variáveis sejam zeradas
    const cardA = firstCard;
    const cardB = secondCard;

    const characterA = cardA.getAttribute('data-character');
    const characterB = cardB.getAttribute('data-character');

    if (characterA === characterB) {
        // ACERTOU: deixa as cartas "apagadas" e dá um efeito de crescer
        cardA.firstChild.classList.add('desativarCard');
        cardB.firstChild.classList.add('desativarCard');
        cardA.classList.add('acertou');
        cardB.classList.add('acertou');

        setTimeout(() => {
            cardA.classList.remove('acertou');
            cardB.classList.remove('acertou');
        }, 500);

        pairsFound = pairsFound + 1;
        pairsSpan.textContent = `${pairsFound}/${level.pairs}`;
        statusText.textContent = 'Par encontrado!';

        firstCard = '';
        secondCard = '';

        checkEndGame();
    } else {
        // ERROU: borda vermelha, espera um pouco e desvira as duas
        cardA.classList.add('errou');
        cardB.classList.add('errou');
        statusText.textContent = 'Não foi dessa vez... tente de novo!';

        mismatchTimeout = setTimeout(() => {
            cardA.classList.remove('revelar');
            cardB.classList.remove('revelar');
            cardA.classList.remove('errou');
            cardB.classList.remove('errou');

            firstCard = '';
            secondCard = '';
        }, 800);
    }
};

// ===== QUANDO O JOGADOR CLICA EM UMA CARTA =====
const revelar = (event) => {
    // currentTarget = a carta inteira que recebeu o clique
    const card = event.currentTarget;

    // Ignora se a carta já está virada
    if (card.classList.contains('revelar')) {
        return;
    }

    // Ignora se já há duas cartas viradas esperando a verificação
    if (secondCard !== '') {
        return;
    }

    // Primeiro clique do jogo: liga o cronômetro
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
        statusText.textContent = 'Valendo! Encontre todos os pares.';
    }

    card.classList.add('revelar');

    if (firstCard === '') {
        firstCard = card;
    } else {
        secondCard = card;

        // Cada par de cartas viradas conta como uma jogada
        moves = moves + 1;
        movesSpan.textContent = moves;

        checkCards();
    }
};

// ===== CRIA UMA CARTA =====
const createCard = (character) => {
    const card = createElement('div', 'card');
    const front = createElement('div', 'face front');
    const back = createElement('div', 'face back');

    // Caminho relativo à página game.html (que está dentro da pasta "pages")
    front.style.backgroundImage = `url('../imagens/${character}.jpg')`;

    card.appendChild(front);
    card.appendChild(back);

    card.addEventListener('click', revelar);
    card.setAttribute('data-character', character);

    return card;
};

// ===== COMEÇA (OU RECOMEÇA) UMA PARTIDA =====
// Esta função zera tudo, então serve para o início e para o "Reiniciar"
const startGame = () => {
    // 1) Cancela cronômetro e esperas que ainda estejam rodando
    clearInterval(loop);
    clearTimeout(mismatchTimeout);
    clearTimeout(endTimeout);

    // 2) Zera as variáveis
    gameStarted = false;
    firstCard = '';
    secondCard = '';
    moves = 0;
    pairsFound = 0;
    seconds = 0;

    // 3) Zera o que aparece na tela
    spanPlayer.textContent = player;
    levelSelect.value = levelKey;
    timer.textContent = '00:00';
    movesSpan.textContent = 0;
    pairsSpan.textContent = `0/${level.pairs}`;
    statusText.textContent = 'Clique em uma carta para começar!';
    modal.classList.add('escondido');
    showRecord();

    // 4) Coloca no tabuleiro a classe do nível ("facil", "medio" ou "dificil").
    //    O CSS usa essa classe para decidir quantas colunas mostrar,
    //    e muda sozinho se a tela for de celular.
    grid.className = `grid ${levelKey}`;

    // 5) Sorteia os personagens, pega a quantidade do nível e duplica (formando os pares)
    const chosen = shuffle(characters).slice(0, level.pairs);
    const pairs = [...chosen, ...chosen];

    // 6) Embaralha as cartas, cria cada uma e troca o tabuleiro antigo pelo novo
    const cards = shuffle(pairs).map((character) => createCard(character));
    grid.replaceChildren(...cards);
};

// ===== BOTÕES =====

// Reiniciar e Jogar de novo: começam uma partida nova SEM recarregar a página
restartButton.addEventListener('click', startGame);
playAgainButton.addEventListener('click', startGame);

// Trocar o nível: salva a escolha e começa uma partida nova
levelSelect.addEventListener('change', () => {
    levelKey = levelSelect.value;
    level = levels[levelKey];
    localStorage.setItem('level', levelKey);
    startGame();
});

// Sair: volta para a tela de login
exitButton.addEventListener('click', () => {
    window.location = '../index.html';
});

// ===== COMEÇAR =====
startGame();