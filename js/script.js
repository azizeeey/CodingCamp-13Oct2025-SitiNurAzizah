document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const dateInput = document.getElementById('date-input');
    const taskList = document.getElementById('task-list');
    const searchInput = document.getElementById('search-input');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    const addTaskBtn = document.getElementById('add-task-btn'); 

    // Filter Dropdown Elements
    const filterBtn = document.getElementById('filter-btn');
    const filterMenu = document.getElementById('filter-menu');
    let currentFilter = 'all'; 
    
    // Input Mode Elements
    const currentTaskId = document.getElementById('current-task-id');
    const currentParentId = document.getElementById('current-parent-id');
    const inputMode = document.getElementById('input-mode');
    const inputStatusIndicator = document.getElementById('input-status-indicator');
    const statusTargetName = document.getElementById('status-target-name');
    const statusModeName = document.getElementById('status-mode-name'); 
    const cancelInputModeBtn = document.getElementById('cancel-input-mode');

    const notificationElement = document.getElementById('notification');
    // Modal Elements
    const confirmModal = document.getElementById('confirm-modal');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    const modalCancelBtns = document.querySelectorAll('.modal-cancel');
    let actionTarget = null;

    // Ambil data dari Local Storage
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // --- Utility Functions ---

    function showNotification(message, type = 'info') {
        notificationElement.className = 'notification-popup'; 
        notificationElement.classList.add('notification-popup', 'show', type);
        notificationElement.textContent = message;

        setTimeout(() => {
            notificationElement.classList.remove('show');
        }, 3000);
    }
    
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    function closeModal() {
        confirmModal.classList.remove('show');
        actionTarget = null;
    }

    function findTaskById(id, parentId = null) {
        if (parentId) {
            const parent = todos.find(t => t.id === parentId);
            if (parent && parent.subtasks) {
                return { task: parent.subtasks.find(st => st.id === id), parent };
            }
        }
        return { task: todos.find(t => t.id === id), parent: null };
    }

    // --- Input Mode Management ---
    function resetInputMode() {
        inputMode.value = 'add';
        currentTaskId.value = '';
        currentParentId.value = '';
        todoInput.value = '';
        dateInput.value = '';
        todoInput.placeholder = "Add a todo . . .";
        addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
        inputStatusIndicator.style.display = 'none';
        dateInput.disabled = false;
        todoInput.focus();
    }
    
    cancelInputModeBtn.addEventListener('click', resetInputMode);


    // --- Theme Logic ---
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        loadTheme();
    });


    // --- Core Rendering and Logic ---

    function createTaskRow(task, isSubtask = false, parentId = null) {
        const row = document.createElement('tr');
        row.className = task.completed ? 'task-completed' : '';
        if (isSubtask) {
            row.classList.add('sub-task-row');
        }
        row.dataset.id = task.id;
        row.dataset.parentId = parentId;
        
        // Tombol yang harus disabled jika task selesai
        const disableIfCompleted = task.completed ? 'disabled' : '';
        const disableComplete = task.completed ? 'disabled' : ''; 
        
        // Add a class for parent tasks to handle clicks for collapsing
        if (!isSubtask) {
            row.classList.add('task-parent-row');
            // If the task is expanded, add the class on creation
            if (task.isExpanded) {
                row.classList.add('expanded');
            }
        }

        let actionButtonsHTML = '';
        let taskTextContent = task.text;

        // Tampilan jumlah sub-task (Hanya untuk Task Parent)
        if (!isSubtask && task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(st => st.completed).length;
            const totalSubtasks = task.subtasks.length;
            // Add a toggle icon for parent tasks with subtasks
            taskTextContent = `
                <i class="fas fa-chevron-right task-toggle-icon"></i> 
                ${task.text} 
                <span class="subtask-count">(${completedSubtasks}/${totalSubtasks})</span>
            `;
        }
        
        if (isSubtask) {
             actionButtonsHTML = `
                <button class="complete-btn" data-id="${task.id}" data-parent-id="${parentId}" ${disableComplete} title="Mark as Completed">
                    <i class="fas fa-check"></i>
                </button>
                <button class="edit-btn" data-id="${task.id}" data-parent-id="${parentId}" ${disableIfCompleted} title="Edit Sub-Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${task.id}" data-parent-id="${parentId}" title="Delete Sub-Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
        } else {
            actionButtonsHTML = `
                <button class="subtask-btn" data-id="${task.id}" ${disableIfCompleted} title="Add Sub-Task">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="complete-btn" data-id="${task.id}" ${disableComplete} title="Mark as Completed">
                    <i class="fas fa-check"></i>
                </button>
                <button class="edit-btn" data-id="${task.id}" ${disableIfCompleted} title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${task.id}" title="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
        }


        row.innerHTML = `
            <td class="task-text">${isSubtask ? '<i class="fas fa-level-up-alt subtask-icon"></i>' : ''} ${taskTextContent}</td>
            <td>${task.date}</td>
            <td>
                <span class="status-badge ${task.completed ? 'completed-status' : 'pending-status'}">
                    ${task.completed ? 'Completed' : 'Pending'}
                </span>
            </td>
            <td class="action-buttons">${actionButtonsHTML}</td>
        `;
        return row;
    }

    function renderTodos() {
        taskList.innerHTML = '';
        
        // Sort before filtering
        let currentSort = 'asc'; // or 'desc'
        todos.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return currentSort === 'asc' ? dateA - dateB : dateB - dateA;
        });

        const filterText = searchInput.value.toLowerCase();
        
        todos.forEach(todo => {
            const parentMatchesSearch = todo.text.toLowerCase().includes(filterText);
            const subtasksMatchingSearch = todo.subtasks ? todo.subtasks.filter(st => st.text.toLowerCase().includes(filterText)) : [];

            const parentMatchesStatus = currentFilter === 'all' || 
                                        (currentFilter === 'completed' && todo.completed) ||
                                        (currentFilter === 'pending' && !todo.completed);

            // Show parent if it matches search and status, OR if any of its subtasks match search and status
            let shouldShowParent = parentMatchesSearch && parentMatchesStatus;

            const visibleSubtasks = subtasksMatchingSearch.filter(st => {
                const subtaskMatchesStatus = currentFilter === 'all' ||
                                             (currentFilter === 'completed' && st.completed) ||
                                             (currentFilter === 'pending' && !st.completed);
                return subtaskMatchesStatus;
            });

            if (visibleSubtasks.length > 0) {
                shouldShowParent = true; // Always show parent if subtasks are visible
            }

            if (shouldShowParent) {
                const parentRow = createTaskRow(todo);
                taskList.appendChild(parentRow);

                // Render only the subtasks that should be visible
                if (todo.subtasks) {
                    visibleSubtasks.forEach(subtask => {
                        const subtaskRow = createTaskRow(subtask, true, todo.id);
                        if (todo.isExpanded) {
                            subtaskRow.classList.add('parent-expanded');
                        }
                        taskList.appendChild(subtaskRow);
                    });
                }
            }
        });

        updateSummary();
    }
    
    function updateSummary() {
        const parentTasks = todos;

        const total = parentTasks.length;
        const completed = parentTasks.filter(t => t.completed).length;
        const pending = total - completed;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        const progressBarFill = document.getElementById('progress-bar-fill');

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('progress-percent').textContent = `${progress}%`;
        
        progressBarFill.style.width = `${progress}%`;
    }

    // Logika Completed Otomatis (Menggunakan subtask untuk menentukan status parent)
    function checkParentCompletion(parentId) {
        const parentTask = todos.find(t => t.id === parentId);
        if (!parentTask || !parentTask.subtasks) return;

        // Cek apakah ada subtask yang pending
        const anySubtaskPending = parentTask.subtasks.some(st => !st.completed);
        const hasSubtasks = parentTask.subtasks.length > 0;

        if (hasSubtasks && !anySubtaskPending && !parentTask.completed) {
            parentTask.completed = true;
            showNotification(`Task "${parentTask.text}" auto-completed!`, 'success');
        } else if (anySubtaskPending && parentTask.completed) {
            parentTask.completed = false;
            showNotification(`Task "${parentTask.text}" marked as pending as a sub-task is not complete.`, 'info');
        }

        saveTodos();
        renderTodos();
    }
    
    // Logika Completed Manual
    function completeTask(id, parentId = null) {
        const { task } = findTaskById(id, parentId);
        if (!task) return;

        task.completed = !task.completed;
        
        if (task.completed) {
            showNotification(`Task marked as Completed`, 'success');
        } else {
            showNotification(`Task marked as Pending`, 'info');
        }

        if (!parentId) {
            if (task.subtasks) {
                const subtasksChanged = task.subtasks.some(st => st.completed !== task.completed);
                task.subtasks.forEach(st => st.completed = task.completed);
                if(subtasksChanged) {
                     showNotification(`All sub-tasks marked as ${task.completed ? 'Completed' : 'Pending'}.`, 'info');
                }
            }
        }
        
        if (parentId) {
            checkParentCompletion(parentId);
        }
        
        saveTodos();
        renderTodos();
    }
    
    // --- Input Form Handler (Add, Edit, Subtask) ---
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const text = todoInput.value.trim();
        const date = dateInput.value;
        const mode = inputMode.value;
        const id = parseInt(currentTaskId.value);
        const parentId = currentParentId.value ? parseInt(currentParentId.value) : null;

        if (text === "" || date === "") {
            showNotification("Description and Due Date cannot be empty!", 'danger');
            return;
        }

        if (mode === 'add') {
            const newTodo = {
                id: Date.now(),
                text: text,
                date: date,
                completed: false,
                isExpanded: false, // Add isExpanded property
                subtasks: []
            };
            todos.push(newTodo);
            showNotification("Task Added Successfully!", 'success');
        } else if (mode === 'subtask') {
            const parent = todos.find(t => t.id === id);
            if (parent) {
                const newSubtask = {
                    id: Date.now(),
                    text: text,
                    date: date,
                    completed: false
                };
                parent.subtasks.push(newSubtask);
                showNotification("Sub-Task Added!", 'success');
            }
        } else if (mode === 'edit') {
            const { task: taskToEdit } = findTaskById(id, parentId);
            if (taskToEdit) {
                taskToEdit.text = text;
                taskToEdit.date = date;
                showNotification("Task Updated Successfully!", 'success');
            } else {
                showNotification("Error: Task not found for editing.", 'danger');
            }
        }

        resetInputMode();
        saveTodos();
        renderTodos();
    });

    // --- Task List Click Handler (Action Buttons) ---
    taskList.addEventListener('click', (e) => {
        // Handle clicks on the chevron icon for collapsing/expanding subtasks FIRST
        if (e.target.classList.contains('task-toggle-icon')) {
            const parentRow = e.target.closest('.task-parent-row');
            const parentId = parentRow ? parseInt(parentRow.dataset.id) : null;
            
            if (parentId) {
                const parentTask = todos.find(t => t.id === parentId);
                if (parentTask) {
                    parentTask.isExpanded = !parentTask.isExpanded; // Toggle the state in the data
                    saveTodos(); // Save the new state
                    renderTodos(); // Re-render to reflect the change
                }
            }
            return; // Stop further execution after handling the toggle
        }

        // THEN, handle action buttons
        const targetBtn = e.target.closest('button');
        if (!targetBtn || (targetBtn.disabled && !targetBtn.classList.contains('delete-btn'))) return; 
        
        const id = parseInt(targetBtn.dataset.id);
        const parentId = targetBtn.dataset.parentId ? parseInt(targetBtn.dataset.parentId) : null;
        
        if (targetBtn.classList.contains('complete-btn')) {
            completeTask(id, parentId);
        } 
        
        else if (targetBtn.classList.contains('delete-btn')) {
            openConfirmModal(id, parentId);
        }

        else if (targetBtn.classList.contains('edit-btn')) {
            handleEdit(id, parentId); 
        }
        
        else if (targetBtn.classList.contains('subtask-btn')) {
            handleAddSubtask(id);
        }
    });
    
    // --- Specific Action Handlers ---

    function handleEdit(id, parentId = null) {
        const { task } = findTaskById(id, parentId);
        if (!task) return;
        
        resetInputMode();
        
        inputMode.value = 'edit';
        currentTaskId.value = id;
        currentParentId.value = parentId || '';
        
        // Isi input
        todoInput.value = task.text;
        dateInput.value = task.date;

        // Update UI
        const isSubtask = parentId !== null;
        const parentTask = isSubtask ? findTaskById(parentId).task : null;
        const targetName = isSubtask ? parentTask.text : task.text;

        todoInput.placeholder = "Edit Task/Sub-Task Text";
        addTaskBtn.innerHTML = '<i class="fas fa-save"></i>';
        
        inputStatusIndicator.style.display = 'flex';
        statusModeName.textContent = "Edit";
        statusTargetName.textContent = isSubtask ? `Sub-Task of: ${targetName}` : targetName;
        
        todoInput.focus();
    }

    function handleAddSubtask(parentId) {
        const parentTask = todos.find(t => t.id === parentId);
        if (!parentTask) return;
        
        resetInputMode();
        
        inputMode.value = 'subtask';
        currentTaskId.value = parentId; 
        currentParentId.value = '';
        
        // Update UI
        todoInput.value = '';
        dateInput.value = ''; 
        dateInput.disabled = false; // Subtask punya deadline sendiri
        
        todoInput.placeholder = "Enter Sub-Task description . . .";
        addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>'; 

        inputStatusIndicator.style.display = 'flex';
        statusModeName.textContent = "Add Sub-Task";
        statusTargetName.textContent = parentTask.text;
        
        todoInput.focus();
    }
    
    // --- Modal Confirm Logic (DELETE / DELETE ALL) ---
    function openConfirmModal(id, parentId = null) {
        actionTarget = { id, parentId, mode: 'delete' }; 
        confirmModal.classList.add('show');
        
        const isSubtask = parentId !== null;
        const { task } = findTaskById(id, parentId);
        if (!task) { 
            closeModal();
            return;
        }

        document.getElementById('confirm-title').textContent = isSubtask ? "Delete Sub-Task" : "Delete Task";
        document.getElementById('confirm-message').textContent = `Are you sure you want to delete "${task.text}"? This action cannot be undone.`;
        document.getElementById('modal-delete-btn').textContent = "DELETE";
    }

    // Handler untuk tombol DELETE di Modal
    modalDeleteBtn.addEventListener('click', () => {
        if (!actionTarget) return;
        const { id, parentId, mode } = actionTarget;
        
        if (mode === 'deleteAll') {
            todos = [];
            showNotification("All Tasks Deleted!", 'danger');
        } else if (mode === 'delete') {
            if (parentId) {
                // Hapus Sub-Task
                const parentIndex = todos.findIndex(t => t.id === parentId);
                if (parentIndex !== -1) {
                    const subtaskName = findTaskById(id, parentId).task.text;
                    todos[parentIndex].subtasks = todos[parentIndex].subtasks.filter(st => st.id !== id);
                    checkParentCompletion(parentId); 
                    showNotification(`Sub-Task "${subtaskName}" Deleted!`, 'danger');
                }
            } else {
                // Hapus Task Utama (dan semua subtasknya)
                const taskName = findTaskById(id).task.text;
                todos = todos.filter(t => t.id !== id);
                showNotification(`Task "${taskName}" Deleted!`, 'danger');
            }
        }

        saveTodos();
        renderTodos();
        closeModal();
    });

    // Delete All Tasks
    deleteAllBtn.addEventListener('click', () => {
        actionTarget = { mode: 'deleteAll' };
        confirmModal.classList.add('show');
        
        // Hitungan total task (parent + subtask) untuk pesan konfirmasi
        const totalTaskCount = todos.length + todos.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0);
        document.getElementById('confirm-title').textContent = "Delete All Tasks";
        document.getElementById('confirm-message').textContent = `Are you sure you want to delete all ${totalTaskCount} tasks (including sub-tasks)? This action cannot be undone.`;
        document.getElementById('modal-delete-btn').textContent = "DELETE ALL";
    });

    // --- Filter & Search Logic ---

    filterBtn.addEventListener('click', () => {
        filterMenu.classList.toggle('show-dropdown');
    });

    filterMenu.addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (link) {
            currentFilter = link.dataset.filter;

            filterMenu.querySelectorAll('a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            const filterTextMap = {
                'all': 'All',
                'pending': 'Pending',
                'completed': 'Completed'
            };

            const filterClassMap = {
                'all': 'all',
                'pending': 'pending',
                'completed': 'completed'
            };

            filterBtn.innerHTML = `<i class="fas fa-filter"></i> <span>${filterTextMap[currentFilter]}</span>`;
            filterBtn.className = `filter-btn ${filterClassMap[currentFilter]}`;

            filterMenu.classList.remove('show-dropdown');
            renderTodos();
        }
    });

    // Tutup dropdown/modal jika klik di luar
    document.addEventListener('click', (e) => {
        if (!filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
            filterMenu.classList.remove('show-dropdown');
        }
    });
    
    modalCancelBtns.forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', (event) => {
        if (event.target === confirmModal) {
            closeModal();
        }
    });


    // Search
    searchInput.addEventListener('input', renderTodos);

    // Initial load
    loadTheme();
    renderTodos();
    resetInputMode();
    
    filterMenu.querySelector('a[data-filter="all"]').classList.add('active');
});