// ===== PEGANDO OS ELEMENTOS DA PÁGINA =====
const input = document.querySelector('.login-input');
const select = document.querySelector('.login-select');
const button = document.querySelector('.login-button');
const form = document.querySelector('.login-form');

// Libera o botão só se o nome tiver mais de 2 letras
// (trim() tira os espaços, então "   " não vale como nome)
const validateInput = ({ target }) => {
    if (target.value.trim().length > 2) {
        button.removeAttribute('disabled');
    } else {
        button.setAttribute('disabled', '');
    }
};

// Ao enviar o formulário: guarda nome e dificuldade e vai para o jogo
const handleSubmit = (event) => {
    event.preventDefault();

    localStorage.setItem('player', input.value.trim());
    localStorage.setItem('level', select.value);
    window.location = 'pages/game.html';
};

input.addEventListener('input', validateInput);
form.addEventListener('submit', handleSubmit);