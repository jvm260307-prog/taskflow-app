/**
 * ==========================================================================
 * TaskFlow - JavaScript Application Logic
 * Comprehensive Task Management App with LocalStorage, Dark Mode, Filters,
 * Search, Sorting, Modal Editing, and Real-time Clock.
 * ==========================================================================
 */

// Strict Mode Execution
'use strict';

/* ==========================================================================
   1. GLOBAL STATE & CONSTANTS
   ========================================================================== */
const STORAGE_KEY_TASKS = 'taskflow_tasks_v1';
const STORAGE_KEY_THEME = 'taskflow_theme_v1';

// Initial Application State
let tasks = [];
let currentFilter = 'all'; // Options: 'all', 'pending', 'completed'
let searchQuery = '';
let currentSort = 'newest'; // Options: 'newest', 'oldest', 'priority', 'dueDate'

/* ==========================================================================
   2. DOM ELEMENTS REGISTRY
   ========================================================================== */
const dom = {
    // Clock & Theme Elements
    clockDate: document.getElementById('currentDate'),
    clockTime: document.getElementById('currentTime'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Progress Elements
    completedCount: document.getElementById('completedCount'),
    totalCount: document.getElementById('totalCount'),
    progressBar: document.getElementById('progressBar'),
    progressSubtitle: document.getElementById('progressSubtitle'),

    // Task Creation Form
    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    priorityInput: document.getElementById('priorityInput'),
    categoryInput: document.getElementById('categoryInput'),
    dueDateInput: document.getElementById('dueDateInput'),

    // Search & Filters
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    sortSelect: document.getElementById('sortSelect'),

    // Filter Badges
    badgeAll: document.getElementById('badgeAll'),
    badgePending: document.getElementById('badgePending'),
    badgeCompleted: document.getElementById('badgeCompleted'),

    // List & Empty State
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),

    // Footer & Actions
    itemsLeftCount: document.getElementById('itemsLeftCount'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),

    // Edit Modal Elements
    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskText: document.getElementById('editTaskText'),
    editPriorityInput: document.getElementById('editPriorityInput'),
    editCategoryInput: document.getElementById('editCategoryInput'),
    editDueDateInput: document.getElementById('editDueDateInput'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
};

/* ==========================================================================
   3. APPLICATION INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    startLiveClock();
    loadTasksFromStorage();
    setupEventListeners();
    renderApp();
});

/**
 * Attaches all event listeners for user interactions
 */
function setupEventListeners() {
    // Theme Toggle Event
    dom.themeToggleBtn.addEventListener('click', toggleTheme);

    // Form Submission for New Task
    dom.taskForm.addEventListener('submit', handleAddTask);

    // Dynamic Search Input
    dom.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        dom.clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
        renderApp();
    });

    // Clear Search Input Button
    dom.clearSearchBtn.addEventListener('click', () => {
        dom.searchInput.value = '';
        searchQuery = '';
        dom.clearSearchBtn.classList.add('hidden');
        renderApp();
    });

    // Filter Tabs Click Events
    dom.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dom.filterTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            currentFilter = tab.dataset.filter;
            renderApp();
        });
    });

    // Sort Dropdown Change
    dom.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderApp();
    });

    // Bulk Action Buttons
    dom.clearCompletedBtn.addEventListener('click', handleClearCompleted);
    dom.clearAllBtn.addEventListener('click', handleClearAll);

    // Modal Close Events
    dom.closeModalBtn.addEventListener('click', closeEditModal);
    dom.cancelEditBtn.addEventListener('click', closeEditModal);
    dom.editModal.addEventListener('click', (e) => {
        if (e.target === dom.editModal) closeEditModal();
    });

    // Modal Form Submission (Save Edits)
    dom.editForm.addEventListener('submit', handleSaveEditTask);

    // Keyboard ESC to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !dom.editModal.classList.contains('hidden')) {
            closeEditModal();
        }
    });
}

/* ==========================================================================
   4. LIVE DATE & TIME CLOCK
   ========================================================================== */
/**
 * Updates the current date and time header dynamically every second
 */
function startLiveClock() {
    function updateClock() {
        const now = new Date();

        // Format Date: e.g. "Tuesday, Aug 4, 2026"
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        const dateString = now.toLocaleDateString('en-US', dateOptions);

        // Format Time: e.g. "04:05:26 PM"
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        dom.clockDate.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${dateString}`;
        dom.clockTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${timeString}`;
    }

    updateClock(); // Run immediately on load
    setInterval(updateClock, 1000); // Update every 1000ms
}

/* ==========================================================================
   5. LOCAL STORAGE MANAGEMENT & THEME SWITCHER
   ========================================================================== */
/**
 * Loads tasks array from Browser Local Storage
 */
function loadTasksFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_TASKS);
        tasks = stored ? JSON.parse(stored) : getSampleTasks();
    } catch (err) {
        console.error('Error loading tasks from localStorage:', err);
        tasks = [];
    }
}

/**
 * Saves current tasks array to Local Storage
 */
function saveTasksToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (err) {
        console.error('Error saving tasks to localStorage:', err);
        showToast('Failed to save tasks to local storage.', 'danger');
    }
}

/**
 * Provides default sample tasks when app is first opened
 */
function getSampleTasks() {
    return [
        {
            id: 'sample-1',
            text: 'Welcome to TaskFlow! Mark this task as completed',
            completed: false,
            priority: 'high',
            category: 'General',
            dueDate: new Date().toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 'sample-2',
            text: 'Try creating a new task using the input form above',
            completed: false,
            priority: 'medium',
            category: 'Work',
            dueDate: '',
            createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 'sample-3',
            text: 'Switch between Light & Dark themes using the header toggle',
            completed: true,
            priority: 'low',
            category: 'Personal',
            dueDate: '',
            createdAt: new Date(Date.now() - 86400000).toISOString()
        }
    ];
}

/**
 * Initializes Theme based on stored preference or system default
 */
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', defaultTheme);
    }
}

/**
 * Toggles theme between Dark and Light mode
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    showToast(`Switched to ${newTheme.toUpperCase()} theme`, 'info');
}

/* ==========================================================================
   6. TASK CRUD OPERATIONS
   ========================================================================== */

/**
 * Handles adding a new task from the form input
 */
function handleAddTask(e) {
    e.preventDefault();

    const text = dom.taskInput.value.trim();
    if (!text) {
        showToast('Please enter a task description.', 'danger');
        return;
    }

    const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text: text,
        completed: false,
        priority: dom.priorityInput.value,
        category: dom.categoryInput.value,
        dueDate: dom.dueDateInput.value,
        createdAt: new Date().toISOString()
    };

    // Prepend to tasks array (newest first)
    tasks.unshift(newTask);
    saveTasksToStorage();

    // Reset input fields
    dom.taskInput.value = '';
    dom.dueDateInput.value = '';
    dom.taskInput.focus();

    showToast('Task added successfully!', 'success');
    renderApp();
}

/**
 * Toggles a task's completed state
 */
function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        showToast(task.completed ? 'Task completed! 🎉' : 'Task marked pending.', 'info');
        renderApp();
    }
}

/**
 * Deletes a single task by ID with animation
 */
function deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
        taskElement.style.animation = 'slideOut 0.25s ease-forward';
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasksToStorage();
            showToast('Task deleted.', 'danger');
            renderApp();
        }, 200);
    } else {
        tasks = tasks.filter(t => t.id !== id);
        saveTasksToStorage();
        renderApp();
    }
}

/**
 * Opens the Edit Task Modal pre-populated with task data
 */
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    dom.editTaskId.value = task.id;
    dom.editTaskText.value = task.text;
    dom.editPriorityInput.value = task.priority;
    dom.editCategoryInput.value = task.category;
    dom.editDueDateInput.value = task.dueDate || '';

    dom.editModal.classList.remove('hidden');
    dom.editTaskText.focus();
}

/**
 * Closes the Edit Task Modal
 */
function closeEditModal() {
    dom.editModal.classList.add('hidden');
    dom.editForm.reset();
}

/**
 * Saves edited task details
 */
function handleSaveEditTask(e) {
    e.preventDefault();

    const id = dom.editTaskId.value;
    const task = tasks.find(t => t.id === id);

    if (task) {
        const newText = dom.editTaskText.value.trim();
        if (!newText) {
            showToast('Task title cannot be empty.', 'danger');
            return;
        }

        task.text = newText;
        task.priority = dom.editPriorityInput.value;
        task.category = dom.editCategoryInput.value;
        task.dueDate = dom.editDueDateInput.value;

        saveTasksToStorage();
        closeEditModal();
        showToast('Task updated successfully!', 'success');
        renderApp();
    }
}

/**
 * Clears all completed tasks
 */
function handleClearCompleted() {
    const completedTasksCount = tasks.filter(t => t.completed).length;
    if (completedTasksCount === 0) {
        showToast('No completed tasks to clear.', 'info');
        return;
    }

    if (confirm(`Are you sure you want to remove ${completedTasksCount} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasksToStorage();
        showToast(`Cleared ${completedTasksCount} completed task(s).`, 'success');
        renderApp();
    }
}

/**
 * Clears all tasks in the list
 */
function handleClearAll() {
    if (tasks.length === 0) {
        showToast('Your task list is already empty.', 'info');
        return;
    }

    if (confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) {
        tasks = [];
        saveTasksToStorage();
        showToast('All tasks cleared.', 'danger');
        renderApp();
    }
}

/* ==========================================================================
   7. FILTERING, SEARCHING & SORTING ALGORITHMS
   ========================================================================== */

/**
 * Filters and sorts tasks based on active controls
 */
function getFilteredAndSortedTasks() {
    return tasks
        .filter(task => {
            // Apply Status Filter
            if (currentFilter === 'pending' && task.completed) return false;
            if (currentFilter === 'completed' && !task.completed) return false;

            // Apply Search Filter
            if (searchQuery) {
                const matchText = task.text.toLowerCase().includes(searchQuery);
                const matchCategory = task.category.toLowerCase().includes(searchQuery);
                const matchPriority = task.priority.toLowerCase().includes(searchQuery);
                return matchText || matchCategory || matchPriority;
            }

            return true;
        })
        .sort((a, b) => {
            // Apply Sorting Algorithm
            if (currentSort === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (currentSort === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            } else if (currentSort === 'priority') {
                const priorityWeight = { high: 3, medium: 2, low: 1 };
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            } else if (currentSort === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            return 0;
        });
}

/* ==========================================================================
   8. UI RENDERING & DOM UPDATES
   ========================================================================== */

/**
 * Main render function triggered whenever state changes
 */
function renderApp() {
    updateBadgesAndProgress();
    renderTaskList();
}

/**
 * Updates stats counters, progress bar, and badge indicators
 */
function updateBadgesAndProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    // Update Badges
    dom.badgeAll.textContent = total;
    dom.badgePending.textContent = pending;
    dom.badgeCompleted.textContent = completed;

    // Update Progress Bar & Subtitle
    dom.totalCount.textContent = total;
    dom.completedCount.textContent = completed;
    
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    dom.progressBar.style.width = `${percentage}%`;

    if (total === 0) {
        dom.progressSubtitle.textContent = 'Add your first task below to get started!';
    } else if (percentage === 100) {
        dom.progressSubtitle.textContent = 'Awesome! All tasks are completed! 🚀';
    } else {
        dom.progressSubtitle.textContent = `${percentage}% of your tasks completed`;
    }

    // Update Footer Count
    dom.itemsLeftCount.textContent = `${pending} task${pending === 1 ? '' : 's'} pending`;
}

/**
 * Renders task cards into the DOM list
 */
function renderTaskList() {
    const filteredTasks = getFilteredAndSortedTasks();

    dom.taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        dom.emptyState.classList.remove('hidden');
    } else {
        dom.emptyState.classList.add('hidden');
        
        filteredTasks.forEach(task => {
            const li = createTaskElement(task);
            dom.taskList.appendChild(li);
        });
    }
}

/**
 * Creates individual task list item DOM element
 */
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-task-id', task.id);

    // Format Due Date Display
    let dateBadgeHTML = '';
    if (task.dueDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = !task.completed && task.dueDate < todayStr;
        const formattedDate = formatDateDisplay(task.dueDate);
        
        dateBadgeHTML = `
            <span class="badge badge-date ${isOverdue ? 'overdue' : ''}" title="${isOverdue ? 'Overdue Task!' : 'Due Date'}">
                <i class="fa-regular fa-calendar"></i> ${formattedDate}${isOverdue ? ' (Overdue)' : ''}
            </span>
        `;
    }

    li.innerHTML = `
        <div class="task-left">
            <label class="custom-checkbox" title="${task.completed ? 'Mark pending' : 'Mark completed'}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
                <span class="checkmark"><i class="fa-solid fa-check"></i></span>
            </label>
            <div class="task-content">
                <span class="task-title">${escapeHTML(task.text)}</span>
                <div class="task-meta">
                    <span class="badge badge-priority-${task.priority}">
                        <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> ${task.priority} Priority
                    </span>
                    <span class="badge badge-category">
                        <i class="fa-solid fa-tag"></i> ${escapeHTML(task.category)}
                    </span>
                    ${dateBadgeHTML}
                </div>
            </div>
        </div>
        <div class="task-actions">
            <button class="action-btn edit-btn" title="Edit Task" onclick="openEditModal('${task.id}')" aria-label="Edit Task">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn delete-btn" title="Delete Task" onclick="deleteTask('${task.id}')" aria-label="Delete Task">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `;

    return li;
}

/**
 * Converts YYYY-MM-DD date string to localized readable format
 */
function formatDateDisplay(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Sanitizes input text to prevent XSS attacks
 */
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ==========================================================================
   9. TOAST NOTIFICATION SYSTEM
   ========================================================================== */

/**
 * Displays dynamic toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;

    dom.toastContainer.appendChild(toast);

    // Auto remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}
