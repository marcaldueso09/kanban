type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';

class Task {
    constructor(
        public id: number,
        public title: string,
        public description: string,
        public status: ColumnStatus
    ) {}
}

class KanbanBoard{
    private tasks: Task[] = [];

    constructor() {
        this.loadFromLocalStorage();
        this.renderBoard();
        this.setupDropZones();
    }

    addTask(title: string, description: string): void {
        if (!title) {
            throw new Error('Task title cannot be empty!!!');
        }
        const id = this.tasks.length ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        const task = new Task(id, title, description, 'todo');
        this.tasks.push(task);
        this.saveToLocalStorage();
        this.renderBoard();
    }

    updateTaskStatus(taskId: number, newStatus: ColumnStatus): void {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            this.saveToLocalStorage();
            this.renderBoard();
        }
    }

    updateTaskDetails(id: number, updates: Partial<Task>): void {
        const task = this.tasks.find(t => t.id === id);
        if (!task) {
            throw new Error('Task not found!');
        }
        Object.assign(task, updates);
    }

    getTasksByStatus(status: ColumnStatus): ReadonlyArray<Task> {
        return this.tasks.filter(t => t.status === status);
    }

    getAllTasks(): ReadonlyArray<Task> {
        return this.tasks
    }

    deleteTaskById(id: number): void {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToLocalStorage();
        this.renderBoard();
    }

    renderTask(task: Task): HTMLDivElement {
    const template = document.getElementById('task-card-template') as HTMLTemplateElement;
    const cloneFragment = template.content.cloneNode(true) as DocumentFragment;
    const card = cloneFragment.querySelector('.task-card') as HTMLDivElement;
    
    const moreBtn = card.querySelector('.more') as HTMLElement;
    const menu = card.querySelector('.task-options-menu') as HTMLDivElement;
    const editBtn = card.querySelector('.edit-opt-btn') as HTMLButtonElement;
    const deleteBtn = card.querySelector('.delete-opt-btn') as HTMLButtonElement;

    moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => menu.classList.add('hidden'));

    deleteBtn.addEventListener('click', () => {
        this.deleteTaskById(task.id)
    });

    editBtn.addEventListener('click', () => {
        const newTitle = prompt("Edit title", task.title);
        const newDesc = prompt("Edit description", task.description);

        if(newTitle !== null && newDesc !== null){
            this.updateTaskDetails(task.id, {title: newTitle, description: newDesc})
            this.renderBoard();
        }
        
    })

        card.id = `task-${task.id}`;
        card.querySelector('.task-title')!.textContent = task.title;
        card.querySelector('.task-desc')!.textContent = task.description;


        card.addEventListener('dragstart', (event: DragEvent) => {
            if (event.dataTransfer) {
                event.dataTransfer.setData('text/plain', card.id);
                event.dataTransfer.effectAllowed = 'move';
            }
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        return card;
        
    }

    private setupDropZones(): void {
        const columns = document.querySelectorAll<HTMLElement>('.column-cards, [id$="-section"]');

        columns.forEach(column => {
            column.addEventListener('dragover', (event: DragEvent) => {
                event.preventDefault();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'move';
                }
                column.classList.add('column-hover');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('column-hover');
            });

            column.addEventListener('drop', (event: DragEvent) => {
                event.preventDefault();
                column.classList.remove('column-hover');

                if (event.dataTransfer) {
                    const draggedId = event.dataTransfer.getData('text/plain');
                    const targetContainer = (event.target as HTMLElement).closest('.column-cards') as HTMLElement || column;
                    const newStatus = targetContainer.dataset.status as ColumnStatus;
                    const taskId = parseInt(draggedId.replace('task-', ''), 10);

                    if (newStatus && !isNaN(taskId)) {
                        this.updateTaskStatus(taskId, newStatus);
                    }
                }
            });
        });
    }


    private saveToLocalStorage(): void {
        try {
            localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.warn('localStorage save failed', e);
        }
    }

    private loadFromLocalStorage(): void {
        try {
            const raw = localStorage.getItem('kanbanTasks');
            if (raw) {
                const parsed = JSON.parse(raw) as Task[];
                this.tasks = parsed.map(p => new Task(p.id, p.title, p.description, p.status));
            }
        } catch (e) {
            console.warn('localStorage load failed', e);
            this.tasks = [];
        }
    }

    renderBoard(): void {
        const map = [
            { id: 'todo-section', status: 'todo' as ColumnStatus },
            { id: 'in-progress-section', status: 'in-progress' as ColumnStatus },
            { id: 'review-section', status: 'review' as ColumnStatus },
            { id: 'done-section', status: 'done' as ColumnStatus }
        ];

        map.forEach(m => {
            const el = document.getElementById(m.id);
            if (!el) return;
            const cardsContainer = el.querySelector('.column-cards');
            if (!cardsContainer) return;
            cardsContainer.innerHTML = '';
            this.tasks.filter(t => t.status === m.status).forEach(t => cardsContainer.appendChild(this.renderTask(t)));
        });
    }
}

const addTaskBtn = document.getElementById('addTaskBtn');
const taskForm = document.getElementById('taskForm');
const saveBtn = document.getElementById('saveBtn');

const board = new KanbanBoard();

addTaskBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
   if (taskForm) {
        taskForm.classList.toggle('visible');
        console.log("Form classes after span click:", taskForm.className);
    }
});

taskForm?.addEventListener('click', (e) => {
    if (e.target === taskForm) {
        taskForm.classList.remove('visible');
    }
});


taskForm?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const fd = new FormData(form);
    const title = (fd.get('title') as string) || '';
    const description = (fd.get('description') as string) || '';
    try {
        board.addTask(title.trim(), description.trim());
        form.reset();
        if (taskForm instanceof HTMLElement) taskForm.classList.remove('visible');
    } catch (e) {
        alert((e as Error).message);
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
    } catch (e) {
        console.warn('export failed', e);
    }
});
