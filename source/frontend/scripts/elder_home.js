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
    const elderId = localStorage.getItem('elderId');
    if (!elderId) {
        success.classList.remove('hidden');
        success.innerText = "Missing elder account. Please log in again.";
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/checkins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ elderId })
        });

        if (!response.ok) {
            success.classList.remove('hidden');
            success.innerText = "Unable to check in. Try again.";
            return;
        }

        success.classList.remove('hidden');
        games.classList.add('hidden');
    } catch (error) {
        success.classList.remove('hidden');
        success.innerText = "Unable to connect to server.";
    }
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

