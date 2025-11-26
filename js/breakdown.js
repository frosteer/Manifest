const Breakdown = {
    elements: {
        column: null
    },

    state: {
        focusMode: false,
        allCollapsed: false
    },

    init() {
        this.elements.column = document.getElementById('breakdown-content');

        // Bind Nav Buttons
        const btnCollapse = document.getElementById('bd-btn-collapse-all');
        const btnFocus = document.getElementById('bd-btn-focus');
        const btnDelete = document.getElementById('bd-btn-delete-completed');

        if (btnCollapse) btnCollapse.onclick = () => this.toggleAll();
        if (btnFocus) btnFocus.onclick = () => this.toggleFocusMode();
        if (btnDelete) btnDelete.onclick = () => this.deleteCompletedCards();

        this.render();

        // Update focus mode periodically
        setInterval(() => {
            if (this.state.focusMode) this.render();
        }, 60000);

        // Prevent scroll chaining/bleeding to Timeline
        const container = document.getElementById('breakdown-column');
        if (container) {
            container.addEventListener('wheel', (e) => {
                const content = this.elements.column;
                const delta = e.deltaY;
                const scrollTop = content.scrollTop;
                const scrollHeight = content.scrollHeight;
                const height = content.clientHeight;

                // Determine if we can scroll in the requested direction
                const canScrollDown = delta > 0 && scrollTop + height < scrollHeight - 1;
                const canScrollUp = delta < 0 && scrollTop > 0;

                if (!canScrollDown && !canScrollUp) {
                    // If we can't scroll, prevent default to stop window scrolling
                    e.preventDefault();
                }

                // Always stop propagation to be safe
                e.stopPropagation();
            }, { passive: false });
        }
    },

    render() {
        if (!this.elements.column) return;
        this.elements.column.innerHTML = '';

        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        // Filter tasks that have breakdown enabled or have subtasks
        let breakdownTasks = tasks.filter(t => t.hasBreakdown || (t.subtasks && t.subtasks.length > 0));

        // Sort by start time (Timeline order)
        breakdownTasks.sort((a, b) => a.startHour - b.startHour);

        // Apply Focus Mode Filter
        if (this.state.focusMode) {
            const now = new Date();
            const currentHour = now.getHours() + (now.getMinutes() / 60);

            // Only show task if current time is within its range
            breakdownTasks = breakdownTasks.filter(t => {
                const endHour = t.startHour + (t.durationMinutes / 60);
                return currentHour >= t.startHour && currentHour < endHour;
            });

            // Auto-expand in focus mode
            breakdownTasks.forEach(t => t.isCollapsed = false);
        }

        breakdownTasks.forEach(task => {
            this.elements.column.appendChild(this.createBreakdownCard(task));
        });
    },

    // Nav Actions
    toggleAll() {
        this.state.allCollapsed = !this.state.allCollapsed;
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        tasks.forEach(t => {
            if (t.hasBreakdown || (t.subtasks && t.subtasks.length > 0)) {
                t.isCollapsed = this.state.allCollapsed;
            }
        });

        State.saveTasksForDate(key, tasks);
        this.render();
    },

    toggleFocusMode() {
        this.state.focusMode = !this.state.focusMode;
        const btn = document.getElementById('bd-btn-focus');
        if (btn) {
            if (this.state.focusMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
        this.render();
    },

    deleteCompletedCards() {
        Modal.show("Delete all fully completed breakdown cards?", () => {
            const key = Utils.getDateKey(State.currentDate);
            let tasks = State.getTasksForDate(key);
            let changed = false;

            tasks.forEach(t => {
                if ((t.hasBreakdown || (t.subtasks && t.subtasks.length > 0)) && t.subtasks && t.subtasks.length > 0) {
                    const allCompleted = t.subtasks.every(s => s.completed);
                    if (allCompleted) {
                        t.hasBreakdown = false;
                        t.subtasks = [];
                        changed = true;
                    }
                }
            });

            if (changed) {
                State.saveTasksForDate(key, tasks);
                this.render();
                if (typeof Timeline !== 'undefined') Timeline.renderTasks();
            }
        });
    },

    createBreakdownCard(task) {
        const card = document.createElement('div');
        card.className = `app-card breakdown-card color-${task.color} ${task.isCollapsed ? 'collapsed' : ''}`;
        card.dataset.id = task.id;

        // Header
        const header = document.createElement('div');
        header.className = 'app-card-header bd-header';

        const info = document.createElement('div');
        info.className = 'app-card-info bd-info';
        info.innerHTML = `
            <div class="app-card-title bd-title">${task.title}</div>
            <div class="app-card-subtitle bd-time">${Utils.formatTimeRange(task.startHour, task.durationMinutes)}</div>
        `;

        const controls = document.createElement('div');
        controls.className = 'app-card-controls bd-controls';

        // Expand/Collapse Btn
        const btnCollapse = document.createElement('button');
        btnCollapse.className = 'app-btn bd-btn';
        btnCollapse.innerHTML = task.isCollapsed ? '▼' : '▲';
        btnCollapse.title = task.isCollapsed ? 'Expand' : 'Collapse';
        btnCollapse.onclick = () => this.toggleCollapse(task.id);

        // Delete Btn
        const btnDelete = document.createElement('button');
        btnDelete.className = 'app-btn bd-btn delete';
        btnDelete.innerHTML = '✕';
        btnDelete.title = 'Delete Breakdown';
        btnDelete.onclick = () => this.deleteBreakdown(task.id);

        controls.appendChild(btnCollapse);
        controls.appendChild(btnDelete);

        header.appendChild(info);
        header.appendChild(controls);
        card.appendChild(header);

        // Subtasks Container (Body)
        const subtasksContainer = document.createElement('div');
        subtasksContainer.className = 'app-card-body bd-subtasks';

        if (task.subtasks) {
            task.subtasks.forEach(sub => {
                const subEl = this.createSubtaskElement(task.id, sub);
                subtasksContainer.appendChild(subEl);
            });
        }

        card.appendChild(subtasksContainer);

        // Add Button
        const btnAdd = document.createElement('button');
        btnAdd.className = 'app-add-btn bd-add-btn';
        btnAdd.textContent = '+ Add Subtask';
        btnAdd.onclick = () => this.addSubtask(task.id);
        card.appendChild(btnAdd);

        return card;
    },

    createSubtaskElement(taskId, subtask) {
        const div = document.createElement('div');
        div.className = 'app-list-item subtask-item ' + (subtask.completed ? 'completed' : '');

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'app-checkbox subtask-checkbox';
        checkbox.checked = subtask.completed;
        checkbox.onchange = () => this.toggleSubtask(taskId, subtask.id);

        // Text Input
        const input = document.createElement('textarea');
        input.className = 'app-input-transparent subtask-text';
        input.value = subtask.title;
        input.rows = 1;
        input.placeholder = "Subtask...";

        // Auto-resize
        setTimeout(() => {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        }, 0);

        input.oninput = () => {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
            this.updateSubtaskTitle(taskId, subtask.id, input.value);
        };

        // Delete Btn
        const btnDelete = document.createElement('div');
        btnDelete.className = 'app-btn subtask-delete';
        btnDelete.innerHTML = '✕';
        btnDelete.onclick = () => this.deleteSubtask(taskId, subtask.id);

        div.appendChild(checkbox);
        div.appendChild(input);
        div.appendChild(btnDelete);

        return div;
    },

    // Logic Actions
    toggleCollapse(taskId) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.isCollapsed = !task.isCollapsed;
            State.saveTasksForDate(key, tasks);
            this.render();
        }
    },

    deleteBreakdown(taskId) {
        Modal.show("Delete Sub-task card", () => {
            const key = Utils.getDateKey(State.currentDate);
            const tasks = State.getTasksForDate(key);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.hasBreakdown = false;
                task.subtasks = [];
                State.saveTasksForDate(key, tasks);
                this.render();
                if (typeof Timeline !== 'undefined') Timeline.renderTasks();
            }
        });
    },

    addSubtask(taskId) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            if (!task.subtasks) task.subtasks = [];
            task.subtasks.push({
                id: Utils.generateId(),
                title: '',
                completed: false
            });
            State.saveTasksForDate(key, tasks);
            this.render();

            // Focus new input
            setTimeout(() => {
                const card = document.querySelector(`.breakdown-card[data-id="${taskId}"]`);
                if (card) {
                    const inputs = card.querySelectorAll('.subtask-text');
                    if (inputs.length > 0) inputs[inputs.length - 1].focus();
                }
            }, 0);
        }
    },

    toggleSubtask(taskId, subtaskId) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const sub = task.subtasks.find(s => s.id === subtaskId);
            if (sub) {
                sub.completed = !sub.completed;
                State.saveTasksForDate(key, tasks);
                this.render();
            }
        }
    },

    updateSubtaskTitle(taskId, subtaskId, newTitle) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const sub = task.subtasks.find(s => s.id === subtaskId);
            if (sub) {
                sub.title = newTitle;
                State.saveTasksForDate(key, tasks);
                // No re-render to keep focus
            }
        }
    },

    deleteSubtask(taskId, subtaskId) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
            State.saveTasksForDate(key, tasks);
            this.render();
        }
    }
};
