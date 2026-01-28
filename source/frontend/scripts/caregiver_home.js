// Buttons
const tasksBtn = document.getElementById('tasksBtn');
const monitorBtn = document.getElementById('monitorBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Content
const content = document.getElementById('content');
const tasks = document.getElementById('tasks');
const notifs = document.getElementById('notifs');

tasksBtn.addEventListener('click', async () => {
    tasks.classList.remove('hidden');
    notifs.classList.add('hidden');
    content.classList.add('hidden');
});

monitorBtn.addEventListener('click', async () => {
    tasks.classList.add('hidden');
    notifs.classList.remove('hidden');
    content.classList.add('hidden');
});

logoutBtn.addEventListener('click', async () => {

    // Temporary until backend resolved
    window.location.href = "home.html";
})

