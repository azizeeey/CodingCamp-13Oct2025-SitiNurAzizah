document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const dateInput = document.getElementById('date-input');
    const taskList = document.getElementById('task-list');
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;

    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // --- Theme Logic ---

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>'; // Icon Matahari
        } else {
            body.classList.remove('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>'; // Icon Bulan
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        loadTheme(); // Perbarui ikon
    });

    // --- Core To-Do Functions ---

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function renderTodos() {
        taskList.innerHTML = '';
        const filterText = searchInput.value.toLowerCase();
        const filterValue = filterStatus.value;

        const filteredTodos = todos.filter(todo => {
            const matchesText = todo.text.toLowerCase().includes(filterText);
            const matchesStatus = filterValue === 'all' || 
                                  (filterValue === 'completed' && todo.completed) || 
                                  (filterValue === 'pending' && !todo.completed);
            return matchesText && matchesStatus;
        });

        filteredTodos.forEach(todo => {
            const row = document.createElement('tr');
            row.className = todo.completed ? 'task-completed' : '';
            
            // Format due date to 'YYYY-MM-DD'
            const dueDateFormatted = todo.date; 

            row.innerHTML = `
                <td class="task-text">${todo.text}</td>
                <td>${dueDateFormatted}</td>
                <td>
                    <span class="status-badge ${todo.completed ? 'completed-status' : 'pending-status'}">
                        ${todo.completed ? 'Completed' : 'Pending'}
                    </span>
                </td>
                <td class="action-buttons">
                    <button class="complete-btn" data-id="${todo.id}" title="Mark as Completed">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="delete-btn" data-id="${todo.id}" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            taskList.appendChild(row);
        });

        updateSummary();
    }

    function updateSummary() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const pending = total - completed;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('progress-percent').textContent = `${progress}%`;
    }

    // --- Event Handlers ---

    // 1. Add To-Do (Form Submission & Validation)
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const text = todoInput.value.trim();
        const date = dateInput.value;

        // Validation
        if (text === "") {
            alert("Task input cannot be empty!");
            return;
        }
        if (date === "") {
            alert("Please select a due date!");
            return;
        }

        const newTodo = {
            id: Date.now(),
            text: text,
            date: date,
            completed: false
        };

        todos.push(newTodo);
        saveTodos();
        renderTodos();

        // Clear input
        todoInput.value = '';
        dateInput.value = '';
    });

    // 2. Complete or Delete Task
    taskList.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button')?.dataset.id);

        if (e.target.closest('.complete-btn')) {
            const todoIndex = todos.findIndex(t => t.id === id);
            if (todoIndex > -1) {
                todos[todoIndex].completed = !todos[todoIndex].completed;
                saveTodos();
                renderTodos();
            }
        } 
        
        else if (e.target.closest('.delete-btn')) {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
        }
    });

    // 3. Filter Tasks by Status
    filterStatus.addEventListener('change', renderTodos);

    // 4. Search Tasks by Text
    searchInput.addEventListener('input', renderTodos);

    // 5. Delete All Tasks
    deleteAllBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete ALL tasks? This cannot be undone.")) {
            todos = [];
            saveTodos();
            renderTodos();
        }
    });

    // Initial load
    loadTheme();
    renderTodos();
});