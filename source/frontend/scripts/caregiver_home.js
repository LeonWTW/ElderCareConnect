// Buttons
const homeBtn = document.getElementById('homeBtn');
const tasksBtn = document.getElementById('tasksBtn');
const monitorBtn = document.getElementById('monitorBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Content
const content = document.getElementById('content');
const tasks = document.getElementById('tasks');
const notifs = document.getElementById('notifs');
const notificationList = document.querySelector('.notification-list');

const caregiverId = localStorage.getItem('userId') || localStorage.getItem('caregiverId');

//Task buttons
const addTaskForm = document.getElementById('addTaskForm')
const tasksList = document.getElementById('TasksList');

// Display username in dashboard
const username = localStorage.getItem('username');
if (username) {
    document.getElementById('dashboardLabel').innerText = username + "'s Dashboard";
}

function renderNotifications(items) {
    if (!notificationList) {
        return;
    }

    if (!items || items.length === 0) {
        notificationList.innerHTML = `<div class="notification-box">
            <h3>No notifications</h3>
            <p>Check-ins will appear here.</p>
        </div>`;
        return;
    }

    notificationList.innerHTML = items.map(item => `
        <div class="notification-box">
            <h3>${item.elder_name}</h3>
            <p>Just checked in</p>
            <span class="time">${new Date(item.created_at).toLocaleString()}</span>
        </div>
    `).join("");
}

async function loadNotifications() {
    if (!caregiverId) {
        renderNotifications([]);
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/caregivers/${caregiverId}/notifications`);
        if (!response.ok) {
            renderNotifications([]);
            return;
        }
        const data = await response.json();
        renderNotifications(data);
    } catch (error) {
        renderNotifications([]);
    }
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
//Add task button
addTaskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const taskName = document.getElementById('taskInput').value
    const taskDetails = document.getElementById('taskDetails')

    const emptyMsg = tasksList.querySelector('.empty-message');
    if (emptyMsg) {
        emptyMsg.remove();
    }

    const newTask = document.createElement('div');
    const newId = `task-${taskName}`;

    newTask.className = 'task-item';
    newTask.id = newId;
    newTask.textContent = taskName;
    
    tasksList.appendChild(newTask);
    addTaskForm.reset();

})



// Notifications button
monitorBtn.addEventListener('click', async () => {
    tasks.classList.add('hidden');
    notifs.classList.remove('hidden');
    content.classList.add('hidden');
    loadNotifications();
});




// Logout button
logoutBtn.addEventListener('click', async () => {

    // Temporary until backend resolved
    localStorage.clear();
    window.location.href = "home.html";
})

