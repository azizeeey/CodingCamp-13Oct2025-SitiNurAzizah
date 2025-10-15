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
    const notificationElement = document.getElementById('notification');
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
        
        let actionButtonsHTML = '';
        let taskTextContent = task.text;

        // Tampilan jumlah sub-task (Hanya untuk Task Parent)
        if (!isSubtask && task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(st => st.completed).length;
            const totalSubtasks = task.subtasks.length;
            taskTextContent += ` <span class="subtask-count">(${completedSubtasks}/${totalSubtasks})</span>`;
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
        const filterText = searchInput.value.toLowerCase();
        
        const filteredTodos = todos.filter(todo => {
            const matchesText = todo.text.toLowerCase().includes(filterText);
            
            // Filter Status hanya berlaku untuk Task Parent (Task Utama)
            const matchesStatus = currentFilter === 'all' || 
                                  (currentFilter === 'completed' && todo.completed) || 
                                  (currentFilter === 'pending' && !todo.completed);
            
            // Cek subtask match (hanya text search, untuk menampilkan parent di mode search)
            const subtaskMatchesSearch = todo.subtasks && todo.subtasks.some(st => st.text.toLowerCase().includes(filterText));
            
            // Task parent ditampilkan jika (match text dan status filter) ATAU (subtasknya match text search)
            return (matchesText && matchesStatus) || subtaskMatchesSearch;
        });

        filteredTodos.forEach(todo => {
            
            // Logic Display Task Parent
            const taskMatchesStatus = currentFilter === 'all' || 
                                      (currentFilter === 'completed' && todo.completed) || 
                                      (currentFilter === 'pending' && !todo.completed);
            
            if (taskMatchesStatus && todo.text.toLowerCase().includes(filterText)) {
                taskList.appendChild(createTaskRow(todo, false));
            }

            // Logic Display Sub-Tasks
            if (todo.subtasks && todo.subtasks.length > 0) {
                todo.subtasks.forEach(subtask => {
                    // Subtask harus memenuhi filter status global
                    const matchesStatus = currentFilter === 'all' || 
                                          (currentFilter === 'completed' && subtask.completed) || 
                                          (currentFilter === 'pending' && !subtask.completed);
                    
                    const matchesText = subtask.text.toLowerCase().includes(filterText);
                    
                    // Render subtask jika memenuhi filter status DAN filter text
                    if (matchesStatus && matchesText) {
                        taskList.appendChild(createTaskRow(subtask, true, todo.id));
                    }
                });
            }
        });

        updateSummary();
        updateFilterButton();
    }
    
    // Fungsi untuk memperbarui Summary (HANYA HITUNG TASK PARENT)
    function updateSummary() {
        
        const parentTasks = todos; // Hanya task utama

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

        if (hasSubtasks) {
            // Jika ada subtask yang pending, parent harus pending
            if (anySubtaskPending && parentTask.completed) {
                parentTask.completed = false;
                showNotification(`Parent task un-completed because a sub-task is pending.`, 'pending');
            } 
            // Jika semua subtask selesai, parent harus complete
            else if (!anySubtaskPending && !parentTask.completed) {
                parentTask.completed = true;
                showNotification(`Task "${parentTask.text}" auto-completed!`, 'success');
            }
        }
        // Pastikan render ulang untuk update hitungan subtask di parent row
        renderTodos(); 
    }
    
    // Logika Completed Manual
    function completeTask(id, parentId = null) {
        const { task } = findTaskById(id, parentId);
        if (!task) return;

        // Toggle status
        task.completed = !task.completed;
        
        if (task.completed) {
            showNotification(`Task marked as Completed`, 'success');
        } else {
            showNotification(`Task marked as Pending`, 'pending');
        }

        // Jika task utama diklik:
        if (!parentId) {
            if (task.subtasks) {
                // Semua subtask ikut status parent
                const subtasksChanged = task.subtasks.some(st => st.completed !== task.completed);
                task.subtasks.forEach(st => st.completed = task.completed);
                if(subtasksChanged) {
                     showNotification(`All sub-tasks marked as ${task.completed ? 'Completed' : 'Pending'}.`, 'info');
                }
            }
        }
        
        // Jika yang di-klik adalah sub-task, cek parent-nya
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
                subtasks: []
            };
            todos.push(newTodo);
            showNotification("Task Added Successfully!", 'success');

        } else if (mode === 'edit') {
            const { task } = findTaskById(id, parentId);
            if (task) {
                task.text = text;
                task.date = date; // Subtask juga bisa ganti tanggal
                showNotification("Task/Sub-Task Edited Successfully!", 'info');
                
                if (parentId) {
                    checkParentCompletion(parentId);
                }
            }
            
        } else if (mode === 'subtask') {
            const parent = todos.find(t => t.id === id);
            if (parent) {
                const newSubtask = {
                    id: Date.now(),
                    text: text,
                    date: date, // Subtask memiliki deadline sendiri
                    completed: false
                };
                parent.subtasks.push(newSubtask);
                
                // Jika parent sebelumnya complete, set ke pending
                if (parent.completed) {
                    parent.completed = false;
                    showNotification(`Parent task un-completed, new sub-task added.`, 'pending');
                } 
                
                showNotification("Sub-Task Added!", 'success');
            }
        }
        
        resetInputMode();
        saveTodos();
        renderTodos();
    });

    // --- Task List Click Handler (Action Buttons) ---
    taskList.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button');
        
        // Cek disabled (kecuali untuk delete button, karena delete tetap harus berfungsi)
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
    function updateFilterButton() {
        const filterTextMap = {
            'all': 'ALL',
            'pending': 'PENDING',
            'completed': 'COMPLETED'
        };
        filterBtn.innerHTML = `<i class="fas fa-filter"></i> <span>${filterTextMap[currentFilter]}</span>`;
        filterBtn.className = `filter-btn ${currentFilter}`; 
    }

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