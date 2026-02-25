// Buttons
const homeBtn = document.getElementById('homeBtn');
const tasksBtn = document.getElementById('tasksBtn');
const monitorBtn = document.getElementById('monitorBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addElderBtn = document.getElementById('addElderBtn');

// Content
const success = document.getElementById('success');
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

//Add/remove Elder form
const addElderForm = document.getElementById('addElderForm');
const elderInput = document.getElementById('elderInput');
const elderSelect2 = document.getElementById('elderSelect2');
const removeBtn = document.getElementById('removeBtn');

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
        const response = await fetch(`http://localhost:3002/api/caregivers/${caregiverId}/elders`);
        if (!response.ok) return;

        const elders = await response.json();

        // Remove any existing options except the default one
        elderSelect.innerHTML = '<option value="">Select Elder to Manage</option>';

        elderSelect2.innerHTML = '<option value="">Select Elder to Remove</option>';

        elders.forEach(name => {
            const option1 = document.createElement('option');
            option1.value = name;
            option1.textContent = name;
            elderSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = name;
            option2.textContent = name;
            elderSelect2.appendChild(option2);
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
        const response = await fetch(`http://localhost:3002/api/tasks/${caregiverId}/${encodeURIComponent(elderName)}`);
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
                <strong class="task-title">${task.task_name} <span class="task-status"> - ${task.is_complete ? 'Completed' : 'Pending'}</span></strong>
                ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

//Add new elder to the API
addElderForm.addEventListener('submit', async (event)=> {
    event.preventDefault();

    const newElder = elderInput.value.trim();
    const userId = localStorage.getItem('userId')

    if (!newElder) return;

    try {
        const response = await fetch('http://localhost:3002/api/addElder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                newElder: newElder
            })
        });

        if (response.ok) {
            const data = await response.json();

            showSuccess("Elder added successfully!");

            elderInput.value = '';
            await loadElders();

        } else {
            const data = await response.json();
            showError(data.error || "Failed to add elder");
        }

    }

    catch(error) {
        console.error('Network error:', error);
        alert('Unable to connect to server');
        return;
    }
});

// Helper functions for add elder
function showSuccess(message) {
    success.style.cssText = 'color: #097969; background-color: #c8e6c9; border-left: 5px solid #097969;';
    success.classList.remove('hidden', 'fade-out');
    success.classList.add('fade-in');
    success.innerText = message;
    setTimeout(hideNotification, 4000);
}

function showError(message) {
    success.style.cssText = 'color: #c60a00; background-color: #e6c8c8; border-left: 5px solid #790909;';
    success.classList.remove('hidden', 'fade-out');
    success.classList.add('fade-in');
    success.innerText = message;
    setTimeout(hideNotification, 4000);
}

removeBtn.addEventListener('click', async () => {
    const elderName = elderSelect2.value;

    if (!elderName) {
        showError("Please select an elder to remove.");
        return;
    }
    try {
        const response = await fetch('http://localhost:3002/api/removeElder', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                caregiverId,
                elderToRemove: elderName
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess("Elder removed successfully!");
            await loadElders();
        } else {
            showError(data.error || "Failed to remove elder.");
        }

    } catch (err) {
        showError("Unable to connect to server.");
    }
});

// Notification hider
function hideNotification() {
    const notification = document.getElementById('success');
    if (notification) {
        notification.classList.add('fade-out');
    }
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
        const response = await fetch('http://localhost:3002/api/tasks', {
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
        const response = await fetch(`http://localhost:3002/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            return;
        }

        const task = document.getElementById(`task-${taskId}`);

        if (task) {
            task.classList.add('fade-out');

            // Wait for animation to finish before removing
            setTimeout(() => {
                task.remove();
            }, 300); // match CSS duration
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
            <p>Check-ins and completed tasks will appear here.</p>
        </div>`;
        return;
    }

    notificationList.innerHTML = items.map(item => `
        <div class="notification-box">
            <h3>${item.elder_name}</h3>
            <p>${item.message || 'Just checked in'}</p>
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
        const response = await fetch(`http://localhost:3002/api/caregivers/${caregiverId}/notifications`);
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
    loadElders();
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

    const emptyMsg = tasksList.querySelector('.empty-message');
    if (emptyMsg) {
        emptyMsg.remove();
    }

    addTaskForm.reset();
})

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
