class Task {
    id;
    title;
    description;
    status;
    constructor(id, title, description, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
    }
}
class KanbanBoard {
    tasks = [];
    constructor() {
        this.loadFromLocalStorage();
        this.renderBoard();
    }
    addTask(title, description) {
        if (!title) {
            throw new Error('Task title cannot be empty!!!');
        }
        const id = this.tasks.length ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        const task = new Task(id, title, description, 'todo');
        this.tasks.push(task);
        this.saveToLocalStorage();
        this.renderBoard();
    }
    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            this.saveToLocalStorage();
            this.renderBoard();
        }
    }
    updateTaskDetails(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) {
            throw new Error('Task not found!');
        }
        Object.assign(task, updates);
    }
    getTasksByStatus(status) {
        return this.tasks.filter(t => t.status === status);
    }
    getAllTasks() {
        return this.tasks;
    }
    deleteTaskById(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToLocalStorage();
        this.renderBoard();
    }
    renderTask(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
        `;
        return card;
    }
    saveToLocalStorage() {
        try {
            localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks));
        }
        catch (e) {
            console.warn('localStorage save failed', e);
        }
    }
    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem('kanbanTasks');
            if (raw) {
                const parsed = JSON.parse(raw);
                this.tasks = parsed.map(p => new Task(p.id, p.title, p.description, p.status));
            }
        }
        catch (e) {
            console.warn('localStorage load failed', e);
            this.tasks = [];
        }
    }
    renderBoard() {
        const map = [
            { id: 'todo-section', status: 'todo' },
            { id: 'in-progress-section', status: 'in-progress' },
            { id: 'review-section', status: 'review' },
            { id: 'done-section', status: 'done' }
        ];
        map.forEach(m => {
            const el = document.getElementById(m.id);
            if (!el)
                return;
            const cardsContainer = el.querySelector('.column-cards');
            if (!cardsContainer)
                return;
            cardsContainer.innerHTML = '';
            this.tasks.filter(t => t.status === m.status).forEach(t => cardsContainer.appendChild(this.renderTask(t)));
        });
    }
}
const addTaskBtn = document.getElementById('addTaskBtn');
const taskForm = document.getElementById('taskForm');
const saveBtn = document.getElementById('saveBtn');
const closeTaskFormBtn = document.getElementById('closeTaskForm');
const board = new KanbanBoard();
addTaskBtn?.addEventListener('click', () => {
    if (taskForm instanceof HTMLElement) {
        taskForm.classList.toggle('visible');
    }
});
closeTaskFormBtn?.addEventListener('click', () => {
    if (taskForm instanceof HTMLElement) {
        taskForm.classList.remove('visible');
    }
});
closeTaskFormBtn?.addEventListener('click', () => {
    if (taskForm instanceof HTMLElement) {
        taskForm.classList.remove('visible');
    }
});
taskForm?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const fd = new FormData(form);
    const title = fd.get('title') || '';
    const description = fd.get('description') || '';
    try {
        board.addTask(title.trim(), description.trim());
        form.reset();
        if (taskForm instanceof HTMLElement)
            taskForm.classList.remove('visible');
    }
    catch (e) {
        alert(e.message);
    }
});
saveBtn?.addEventListener('click', () => {
    try {
        const data = JSON.stringify(board.getAllTasks(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kanban-tasks.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    catch (e) {
        console.warn('export failed', e);
    }
});
export {};
//# sourceMappingURL=app.js.map