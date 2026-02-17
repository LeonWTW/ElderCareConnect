/*
 * Games Registry
 * ──────────────
 * To add a new game, just push an object to this array:
 *   { id: "unique-id", name: "Display Name", thumbnail: "images/games/thumb.png", url: "games/my-game.html" }
 *
 * Best scores are stored in localStorage under the key: game-best-<id>
 * Each game is responsible for saving its own score via:
 *   localStorage.setItem('game-best-<id>', score)
 */
const GAMES = [
    { id: "pinball-recall", name: "Pinball Recall", thumbnail: "images/games/pinball-recall.png", url: "games/pinball-recall/intro.html" },
    { id: "game-2", name: "Coming Soon", thumbnail: "images/placeholder.png", url: "#" },
    { id: "game-3", name: "Coming Soon", thumbnail: "images/placeholder.png", url: "#" },
    { id: "game-4", name: "Coming Soon", thumbnail: "images/placeholder.png", url: "#" },
];

const GAMES_PER_PAGE = 4;
let currentPage = 0;
let showScores = false;

const gamesGrid = document.getElementById('gamesGrid');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageIndicator = document.getElementById('pageIndicator');
const homeBtn = document.getElementById('homeBtn');
const showScoresToggle = document.getElementById('showScores');

function getBestScore(gameId) {
    return localStorage.getItem('game-best-' + gameId);
}

function totalPages() {
    return Math.max(1, Math.ceil(GAMES.length / GAMES_PER_PAGE));
}

function renderPage() {
    const start = currentPage * GAMES_PER_PAGE;
    const pageGames = GAMES.slice(start, start + GAMES_PER_PAGE);

    gamesGrid.innerHTML = pageGames.map(game => {
        const best = getBestScore(game.id);
        const scoreHTML = showScores
            ? `<span class="game-score ${best ? 'has-score' : ''}">${best ? 'Best: ' + best : 'No record yet'}</span>`
            : '';
        return `
            <div class="game-card" data-url="${game.url}">
                <img src="${game.thumbnail}" alt="${game.name}">
                <span class="game-name">${game.name}</span>
                ${scoreHTML}
            </div>
        `;
    }).join('');

    // Attach click handlers
    gamesGrid.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const url = card.dataset.url;
            if (url && url !== '#') {
                window.location.href = url;
            }
        });
    });

    // Update arrows
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages() - 1;

    // Update page indicator
    pageIndicator.textContent = `${currentPage + 1} / ${totalPages()}`;
}

// Toggle best scores display
showScoresToggle.addEventListener('change', () => {
    showScores = showScoresToggle.checked;
    renderPage();
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        renderPage();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages() - 1) {
        currentPage++;
        renderPage();
    }
});

homeBtn.addEventListener('click', () => {
    window.location.href = "elder_home.html";
});

// Initial render
renderPage();
