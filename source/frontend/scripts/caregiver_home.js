// Buttons
const homeBtn = document.getElementById('homeBtn');
const tasksBtn = document.getElementById('tasksBtn');
const monitorBtn = document.getElementById('monitorBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Content
const content = document.getElementById('content');
const tasks = document.getElementById('tasks');
const notifs = document.getElementById('notifs');

// Display username in dashboard
const username = localStorage.getItem('username');
if (username) {
    document.getElementById('dashboardLabel').innerText = username + "'s Dashboard";
}

// Home button
homeBtn.addEventListener('click', async () => {
    tasks.classList.add('hidden');
    notifs.classList.add('hidden');
    content.classList.remove('hidden');
});

// Tasks button
tasksBtn.addEventListener('click', async () => {
    tasks.classList.remove('hidden');
    notifs.classList.add('hidden');
    content.classList.add('hidden');
});

// Notifications button
monitorBtn.addEventListener('click', async () => {
    tasks.classList.add('hidden');
    notifs.classList.remove('hidden');
    content.classList.add('hidden');
});

// Logout button
logoutBtn.addEventListener('click', async () => {

    // Temporary until backend resolved
    window.location.href = "home.html";
})

