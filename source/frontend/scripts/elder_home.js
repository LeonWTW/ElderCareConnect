const tasksBtn = document.getElementById('tasksBtn');
const checkinBtn = document.getElementById('checkinBtn');
const gamesBtn = document.getElementById('gamesBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Content
const success = document.getElementById('success');
const games = document.getElementById('games');

// Tasks
tasksBtn.addEventListener('click', async () => {
    window.location.href = "elder_tasks.html";
});

// Check in
const CHECKIN_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CHECKIN_COOLDOWN_TEMP = 10 * 1000; // 10 Second temporary test

checkinBtn.addEventListener('click', async () => {
    success.classList.remove('fade-out');
    success.classList.add("fade-in");

    const elderId = localStorage.getItem('elderId');
    if (!elderId) {
        success.classList.remove('hidden');
        success.innerText = "Missing elder account. Please log in again.";
        return;
    }
    
    // Check if clicked before
    const lastCheckinTime = Number(localStorage.getItem('lastCheckinTime'));
    const now = Date.now();

    if (lastCheckinTime && (now - lastCheckinTime) < CHECKIN_COOLDOWN_TEMP) {
        success.style.cssText = 'color: #c60a00; background-color: #e6c8c8; border-left: 5px solid #790909; max-width: 800px;';
        success.classList.remove('hidden');
        success.innerText = "You've already been checked in for today, please wait until the next day to check in again";
        success.classList.remove('hidden');
        setTimeout(hideNotification, 4000);
        games.classList.add('hidden');
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

        // Reset style
        success.style.cssText = 'color: #097969; background-color: #c8e6c9; border-left: 5px solid #097969;';
        success.innerText = "You've checked in! We'll notify your caregiver shortly.";
        localStorage.setItem('lastCheckinTime', Date.now()); // Save the timestamp
        success.classList.remove('hidden');

    } catch (error) {
        success.classList.remove('hidden');
        success.innerText = "Unable to connect to server.";
        return;
    }

    setTimeout(hideNotification, 4000);
    games.classList.add('hidden');
});

// Function to hide the check in notification
function hideNotification() {
    const notification = document.getElementById('success');
    if (notification) {
        notification.classList.add('fade-out');
    }
}

// Games
gamesBtn.addEventListener('click', async () => {
    games.classList.remove('fade-out');
    games.classList.add('fade-in');
    games.classList.remove('hidden');
    setTimeout(hideNotification2, 4000);
    success.classList.add('hidden');
});

function hideNotification2() {
    const notification = document.getElementById('games');
    if (notification) {
        notification.classList.add('fade-out');
    }
}

// Logout
logoutBtn.addEventListener('click', async () => {
    localStorage.clear();
    window.location.href = "home.html";
});
