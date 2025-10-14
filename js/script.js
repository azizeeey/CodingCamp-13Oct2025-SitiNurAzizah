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
    const notificationElement = document.getElementById('notification');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];

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
        showNotification(`${currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'} Activated`, 'info');
    });

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
            row.dataset.id = todo.id;

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
                    <button class="edit-btn" data-id="${todo.id}" title="Edit Task">
                        <i class="fas fa-edit"></i>
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
        
        const progressBarFill = document.getElementById('progress-bar-fill');

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('progress-percent').textContent = `${progress}%`;
        
        progressBarFill.style.width = `${progress}%`;
    }

    // 1. Add To-Do (Form Submission & Validation)
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const text = todoInput.value.trim();
        const date = dateInput.value;

        if (text === "") {
            showNotification("Task input cannot be empty!", 'danger');
            return;
        }
        if (date === "") {
            showNotification("Please select a due date!", 'danger');
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

        showNotification("Task Added Successfully!", 'success');
        
        todoInput.value = '';
        dateInput.value = '';
    });

    // 2. Complete, Edit, or Delete Task
    taskList.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return; 

        const id = parseInt(targetBtn.dataset.id);
        
        if (targetBtn.classList.contains('complete-btn')) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                saveTodos();
                renderTodos();
                showNotification(`Task marked as ${todo.completed ? 'Completed' : 'Pending'}`, 'info');
            }
        } 
        
        else if (targetBtn.classList.contains('delete-btn')) {
            if (confirm("Are you sure you want to delete this task?")) {
                todos = todos.filter(t => t.id !== id);
                saveTodos();
                renderTodos();
                showNotification("Task Deleted!", 'danger');
            }
        }

        else if (targetBtn.classList.contains('edit-btn')) {
            handleEdit(id);
        }
    });
    
    // 3. Edit Handler Function
    function handleEdit(id) {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        
        const newText = prompt("Edit Task Description:", todo.text);

        if (newText === null || newText.trim() === "") {
            if (newText !== null) showNotification("Edit cancelled or description is empty!", 'danger');
            return;
        }
        todo.text = newText.trim();
        
        // Opsional: Jika Anda ingin juga mengedit tanggal
        const newDate = prompt("Edit Due Date (YYYY-MM-DD):", todo.date);
        if (newDate !== null && newDate.trim() !== "") {
            todo.date = newDate.trim();
        }
        
        saveTodos();
        renderTodos();
        showNotification("Task Edited Successfully!", 'info');
    }

    filterStatus.addEventListener('change', renderTodos);

    searchInput.addEventListener('input', renderTodos);

    deleteAllBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete ALL tasks? This cannot be undone.")) {
            todos = [];
            saveTodos();
            renderTodos();
            showNotification("All Tasks Deleted!", 'danger');
        }
    });

    loadTheme();
    renderTodos();
});