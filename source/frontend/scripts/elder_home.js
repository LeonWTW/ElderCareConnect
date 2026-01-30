const tasksBtn = document.getElementById('tasksBtn');
const checkinBtn = document.getElementById('checkinBtn');
const gamesBtn = document.getElementById('gamesBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Content
const success = document.getElementById('success');
const games = document.getElementById('games');

tasksBtn.addEventListener('click', async () => {
    window.location.href = "elder_tasks.html";
});

checkinBtn.addEventListener('click', async () => {
    success.classList.remove('hidden');
    games.classList.add('hidden');
});

gamesBtn.addEventListener('click', async () => {
    games.classList.remove('hidden');
    success.classList.add('hidden');
});

logoutBtn.addEventListener('click', async () => {

    // Temporary until backend resolved
    localStorage.clear();
    window.location.href = "home.html";
});

