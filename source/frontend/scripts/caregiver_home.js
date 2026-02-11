// Buttons
const homeBtn = document.getElementById('homeBtn');
const tasksBtn = document.getElementById('tasksBtn');
const monitorBtn = document.getElementById('monitorBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addElderBtn = document.getElementById('addElderBtn');

// Content
const content = document.getElementById('content');
const tasks = document.getElementById('tasks');
const notifs = document.getElementById('notifs');
const addElder = document.getElementById('addElder');
const notificationList = document.querySelector('.notification-list');

const caregiverId = localStorage.getItem('userId') || localStorage.getItem('caregiverId');

//Task buttons
const addTaskForm = document.getElementById('addTaskForm');
const tasksList = document.getElementById('TasksList');
const elderSelect = document.getElementById('elderSelect');

// Display username in dashboard
const username = localStorage.getItem('username');
if (username) {
    document.getElementById('dashboardLabel').innerText = username + "'s Dashboard";
}

// ==================== Elder List ====================

// Load elder names from the API and populate the dropdown
async function loadElders() {
    if (!caregiverId) return;

    try {
        const response = await fetch(`http://localhost:3001/api/caregivers/${caregiverId}/elders`);
        if (!response.ok) return;

        const elders = await response.json();

        // Remove any existing options except the default one
        elderSelect.innerHTML = '<option value="">Select Elder to Manage</option>';

        elders.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            elderSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load elders:', error);
    }
}

// When an elder is selected, load their tasks
elderSelect.addEventListener('change', () => {
    const selectedElder = elderSelect.value;
    if (selectedElder) {
        loadTasks(selectedElder);
    } else {
        tasksList.innerHTML = '<p class="empty-message">No tasks yet</p>';
    }
});

// ==================== Task Management ====================

// Fetch and render tasks for a specific elder
async function loadTasks(elderName) {
    if (!caregiverId) return;

    try {
        const response = await fetch(`http://localhost:3001/api/tasks/${caregiverId}/${encodeURIComponent(elderName)}`);
        if (!response.ok) return;

        const taskData = await response.json();
        renderTasks(taskData);
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
}

// Render the task list in the DOM
function renderTasks(taskData) {
    if (!taskData || taskData.length === 0) {
        tasksList.innerHTML = '<p class="empty-message">No tasks yet</p>';
        return;
    }

    tasksList.innerHTML = taskData.map(task => `
        <div class="task-item ${task.is_complete ? 'completed' : ''}" id="task-${task.id}">
            <div class="task-info">
                <strong>${task.task_name}</strong>
                ${task.description ? `<p>${task.description}</p>` : ''}
                <span class="task-status">${task.is_complete ? 'Completed' : 'Pending'}</span>
            </div>
            <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `).join('');
}

// Submit new task to the API
addTaskForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const elderName = elderSelect.value;
    if (!elderName) {
        alert('Please select an elder first');
        return;
    }

    const taskName = document.getElementById('taskInput').value.trim();
    const description = document.getElementById('taskDetails').value.trim();

    if (!taskName) return;

    try {
        const response = await fetch('http://localhost:3001/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caregiverId: caregiverId,
                elderName: elderName,
                taskName: taskName,
                description: description || null
            })
        });

        if (response.ok) {
            addTaskForm.reset();
            loadTasks(elderName);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to add task');
        }
    } catch (error) {
        console.error('Failed to create task:', error);
        alert('Unable to connect to server');
    }
});

// Delete a task via the API
async function deleteTask(taskId) {
    const elderName = elderSelect.value;

    try {
        const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok && elderName) {
            loadTasks(elderName);
        }
    } catch (error) {
        console.error('Failed to delete task:', error);
    }
}

// ==================== Notifications ====================

function renderNotifications(items) {
    if (!notificationList) return;

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

// ==================== Navigation ====================

// Home button
homeBtn.addEventListener('click', async () => {
    tasks.classList.add('hidden');
    notifs.classList.add('hidden');
    addElder.classList.add('hidden');
    content.classList.remove('hidden');
});

//Add Elder
addElderBtn.addEventListener('click', async () => {
    tasks.classList.add('hidden');
    notifs.classList.add('hidden');
    content.classList.add('hidden');
    addElder.classList.remove('hidden');
});

// Tasks button - load elders when switching to task view
tasksBtn.addEventListener('click', async () => {
    notifs.classList.add('hidden');
    content.classList.add('hidden');
    addElder.classList.add('hidden');
    tasks.classList.remove('hidden');
    loadElders();
});
//Add task button
addTaskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const taskName = document.getElementById('taskInput').value;
    const taskDetails = document.getElementById('taskDetails').value;

    const emptyMsg = tasksList.querySelector('.empty-message');
    if (emptyMsg) {
        emptyMsg.remove();
    }

    // Create new task with description
    const newTask = document.createElement('div');
    const newTitle = document.createElement('p');
    const newDesc = document.createElement('p');

    newTask.className = 'task-item';
    newTitle.className = 'task-title';
    newDesc.className = 'task-details';

    newTitle.textContent = taskName;
    newDesc.textContent = taskDetails;
    newTask.appendChild(newTitle);
    newTask.appendChild(newDesc);

    tasksList.appendChild(newTask);
    addTaskForm.reset();

})
// Elder Selection





// Notifications button
monitorBtn.addEventListener('click', async () => {
    tasks.classList.add('hidden');
    addElder.classList.add('hidden');
    content.classList.add('hidden');
    notifs.classList.remove('hidden');
    loadNotifications();
});

// Logout button
logoutBtn.addEventListener('click', async () => {
    localStorage.clear();
    window.location.href = "home.html";
});
