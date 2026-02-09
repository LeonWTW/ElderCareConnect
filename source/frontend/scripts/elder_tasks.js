const homeBtn = document.getElementById('homeBtn');
const taskList = document.getElementById('taskList');

const elderName = localStorage.getItem('elderName');
const caregiverId = localStorage.getItem('caregiverId');

// Load tasks from the API on page load
async function loadTasks() {
    if (!elderName || !caregiverId) {
        taskList.innerHTML = '<p class="empty-message">Please log in first</p>';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/tasks/${caregiverId}/${encodeURIComponent(elderName)}`);
        if (!response.ok) {
            taskList.innerHTML = '<p class="empty-message">Failed to load tasks</p>';
            return;
        }

        const tasks = await response.json();

        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="empty-message">No tasks assigned yet</p>';
            return;
        }

        taskList.innerHTML = tasks.map(task => `
            <div class="task-item ${task.is_complete ? 'completed' : ''}" id="task-${task.id}">
                <div class="task-info">
                    <strong>${task.task_name}</strong>
                    ${task.description ? `<p>${task.description}</p>` : ''}
                </div>
                <button
                    class="complete-btn ${task.is_complete ? 'done' : ''}"
                    onclick="toggleTask(${task.id}, ${!task.is_complete})"
                    ${task.is_complete ? 'disabled' : ''}
                >
                    ${task.is_complete ? 'Completed' : 'Mark Done'}
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load tasks:', error);
        taskList.innerHTML = '<p class="empty-message">Unable to connect to server</p>';
    }
}

// Toggle task completion status via the API
async function toggleTask(taskId, isComplete) {
    try {
        const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isComplete: isComplete })
        });

        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('Failed to update task:', error);
    }
}

// Load tasks on page load
loadTasks();

homeBtn.addEventListener('click', async () => {
    window.location.href = "elder_home.html";
});
