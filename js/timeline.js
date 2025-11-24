const Timeline = {
    elements: {
        timeColumn: document.getElementById('time-column'),
        gridBackground: document.getElementById('grid-background'),
        tasksContainer: document.getElementById('tasks-container'),
        currentTimeLine: document.getElementById('current-time-line'),
        timelineColumn: document.getElementById('timeline-column')
    },

    init() {
        this.renderGrid();
        this.renderTasks();
        this.updateTimeLine();
        this.bindEvents();
        setInterval(() => this.updateTimeLine(), 60000);
    },

    bindEvents() {
        this.elements.timelineColumn.addEventListener('click', (e) => {
            if (e.target.closest('.task-card')) return;
            this.handleTimelineClick(e);
        });

        // Global drag events are handled in App to ensure continuity
    },

    renderGrid() {
        this.elements.timeColumn.innerHTML = '';
        this.elements.gridBackground.innerHTML = '';

        for (let i = 0; i <= CONSTANTS.TOTAL_HOURS; i++) {
            const hour = CONSTANTS.START_HOUR + i;

            // Label
            const label = document.createElement('div');
            label.className = 'time-label';
            if (i === CONSTANTS.TOTAL_HOURS) label.style.height = '20px';

            let displayHour = hour;
            let ampm = 'am';
            if (hour >= 24) {
                displayHour = hour - 24;
                if (displayHour === 0) displayHour = 12;
                ampm = 'am';
            } else if (hour >= 12) {
                ampm = 'pm';
                if (hour > 12) displayHour = hour - 12;
            } else {
                // AM hours (0-11)
                if (displayHour === 0) displayHour = 12;
            }

            label.innerHTML = `<span>${displayHour}${ampm}</span>`;
            this.elements.timeColumn.appendChild(label);

            // Line
            const line = document.createElement('div');
            line.className = 'grid-line-hour';
            if (i === CONSTANTS.TOTAL_HOURS) {
                line.style.height = '0';
                line.style.borderTop = '1px solid var(--line-hour)';
            } else {
                const halfLine = document.createElement('div');
                halfLine.className = 'grid-line-half';
                line.appendChild(halfLine);
            }
            this.elements.gridBackground.appendChild(line);
        }

        const totalHeight = CONSTANTS.TOTAL_HOURS * CONSTANTS.PIXELS_PER_HOUR;
        this.elements.timelineColumn.style.height = `${totalHeight + 20}px`;
        this.elements.gridBackground.style.height = `${totalHeight}px`;
        this.elements.tasksContainer.style.height = `${totalHeight}px`;
    },

    renderTasks() {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        this.elements.tasksContainer.innerHTML = '';
        tasks.forEach(task => {
            const el = document.createElement('div');
            el.className = `task-card color-${task.color}`;
            el.dataset.id = task.id;

            const top = (task.startHour - CONSTANTS.START_HOUR) * CONSTANTS.PIXELS_PER_HOUR;
            const height = (task.durationMinutes / 60) * CONSTANTS.PIXELS_PER_HOUR;
            el.style.top = `${top}px`;
            el.style.height = `${height}px`;

            el.innerHTML = `
                <div class="resize-handle resize-top"></div>
                <div class="drag-handle">⋮</div>
                <div class="task-content">
                    <div class="task-time">${Utils.formatTimeRange(task.startHour, task.durationMinutes)}</div>
                    <input type="text" class="task-title-input" value="${task.title}" spellcheck="false">
                </div>
                <div class="task-controls">
                    <div class="control-btn" onclick="Timeline.toggleBreakdown('${task.id}')" title="Breakdown">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </div>
                    <div class="control-btn" onclick="Timeline.cycleTaskColor('${task.id}')" title="Change Color">
                        <div style="width:10px;height:10px;background:var(--accent-${task.color === 'grey' ? 'orange' : (task.color === 'orange' ? 'green' : (task.color === 'green' ? 'blue' : 'grey'))});border-radius:50%"></div>
                    </div>
                    <div class="control-btn" onclick="Timeline.deleteTask('${task.id}')" title="Delete">✕</div>
                </div>
                ${(task.hasBreakdown || (task.subtasks && task.subtasks.length > 0)) ? `
                <div class="task-right-border" title="View Subtasks" onclick="Timeline.highlightBreakdownCard('${task.id}'); event.stopPropagation();"></div>
                ` : ''}
                <div class="resize-handle resize-bottom"></div>
            `;

            const input = el.querySelector('.task-title-input');
            input.addEventListener('change', (e) => this.updateTaskTitle(task.id, e.target.value));
            input.addEventListener('click', (e) => e.stopPropagation());

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });

            el.querySelector('.resize-top').addEventListener('mousedown', (e) => this.startInteraction(e, task, 'top'));
            el.querySelector('.resize-bottom').addEventListener('mousedown', (e) => this.startInteraction(e, task, 'bottom'));
            el.querySelector('.drag-handle').addEventListener('mousedown', (e) => this.startInteraction(e, task, 'move'));

            this.elements.tasksContainer.appendChild(el);
        });
    },

    highlightBreakdownCard(id) {
        // Expand the card first
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.isCollapsed = false;
            State.saveTasksForDate(key, tasks);
            if (typeof Breakdown !== 'undefined') Breakdown.render();
        }

        // Then highlight
        setTimeout(() => {
            const card = document.querySelector(`.breakdown-card[data-id="${id}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.remove('highlight-effect');
                void card.offsetWidth; // Trigger reflow
                card.classList.add('highlight-effect');
            }
        }, 50); // Small delay to allow render
    },

    updateTimeLine() {
        const now = new Date();
        if (Utils.getDateKey(now) !== Utils.getDateKey(State.currentDate)) {
            this.elements.currentTimeLine.style.display = 'none';
            return;
        }

        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        if (currentHour < CONSTANTS.START_HOUR) {
            this.elements.currentTimeLine.style.display = 'none';
            return;
        }

        const hoursPastStart = (currentHour - CONSTANTS.START_HOUR) + (currentMin / 60);
        const topPos = hoursPastStart * CONSTANTS.PIXELS_PER_HOUR + 20;

        if (topPos > (CONSTANTS.TOTAL_HOURS * CONSTANTS.PIXELS_PER_HOUR + 20)) {
            this.elements.currentTimeLine.style.display = 'none';
        } else {
            this.elements.currentTimeLine.style.display = 'block';
            this.elements.currentTimeLine.style.top = `${topPos}px`;
        }
    },

    scrollToCurrentTime() {
        const now = new Date();
        // Only scroll if we are actually viewing today
        if (Utils.getDateKey(now) !== Utils.getDateKey(State.currentDate)) {
            return;
        }

        this.updateTimeLine();

        // If the line is visible, scroll to it
        if (this.elements.currentTimeLine.style.display !== 'none') {
            this.elements.currentTimeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    // Task Actions
    createTask(startHourFloat, durationMinutes = 30) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        const id = Date.now().toString();
        const task = {
            id,
            startHour: startHourFloat,
            durationMinutes,
            title: 'New Task',
            color: 'grey'
        };

        tasks.push(task);
        State.saveTasksForDate(key, tasks);
        this.renderTasks();

        // Auto-focus and select the new task title
        setTimeout(() => {
            const input = document.querySelector(`.task-card[data-id="${id}"] .task-title-input`);
            if (input) {
                input.focus();
                input.select();
            }
        }, 0);
    },

    updateTaskTitle(id, newTitle) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.title = newTitle;
            State.saveTasksForDate(key, tasks);

            // Real-time sync to breakdown
            const bdTitle = document.querySelector(`.breakdown-card[data-id="${id}"] .bd-title`);
            if (bdTitle) {
                bdTitle.textContent = newTitle;
            }
        }
    },

    cycleTaskColor(id) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === id);
        if (task) {
            const colors = ['grey', 'orange', 'green', 'blue'];
            const idx = colors.indexOf(task.color);
            task.color = colors[(idx + 1) % colors.length];
            State.saveTasksForDate(key, tasks);
            this.renderTasks();
            if (typeof Breakdown !== 'undefined') Breakdown.render();
        }
    },

    deleteTask(id) {
        const key = Utils.getDateKey(State.currentDate);
        let tasks = State.getTasksForDate(key);
        tasks = tasks.filter(t => t.id !== id);
        State.saveTasksForDate(key, tasks);
        this.renderTasks();
        if (typeof Breakdown !== 'undefined') Breakdown.render();
    },

    toggleBreakdown(id) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.hasBreakdown = true;
            if (!task.subtasks) task.subtasks = [];
            task.isCollapsed = false; // Expand when created
            State.saveTasksForDate(key, tasks);
            this.renderTasks();
            if (typeof Breakdown !== 'undefined') Breakdown.render();
        }
    },

    // Interaction
    handleTimelineClick(e) {
        const rect = this.elements.tasksContainer.getBoundingClientRect();
        const clickY = e.clientY - rect.top + this.elements.tasksContainer.scrollTop;
        const rawHours = clickY / CONSTANTS.PIXELS_PER_HOUR;
        const snappedHours = Math.floor(rawHours * 2) / 2;
        const absoluteStartHour = CONSTANTS.START_HOUR + snappedHours;

        if (absoluteStartHour < CONSTANTS.START_HOUR || absoluteStartHour >= CONSTANTS.END_HOUR) return;

        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        // Clicked inside?
        if (tasks.some(t => {
            const tEnd = t.startHour + (t.durationMinutes / 60);
            return absoluteStartHour >= t.startHour && absoluteStartHour < tEnd;
        })) return;

        // Find max duration
        let maxDuration = 30;
        const nextTask = tasks
            .filter(t => t.startHour > absoluteStartHour)
            .sort((a, b) => a.startHour - b.startHour)[0];

        if (nextTask) {
            const timeToNext = (nextTask.startHour - absoluteStartHour) * 60;
            if (timeToNext < maxDuration) maxDuration = timeToNext;
        }

        if (maxDuration <= 0) return;
        this.createTask(absoluteStartHour, maxDuration);
    },

    startInteraction(e, task, mode) {
        e.preventDefault();
        e.stopPropagation();

        const startY = e.clientY;
        const startTop = (task.startHour - CONSTANTS.START_HOUR) * CONSTANTS.PIXELS_PER_HOUR;
        const startHeight = (task.durationMinutes / 60) * CONSTANTS.PIXELS_PER_HOUR;
        const startHour = task.startHour;
        const startDuration = task.durationMinutes;

        const onMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const deltaHours = deltaY / CONSTANTS.PIXELS_PER_HOUR;

            if (mode === 'move') {
                let newStartHour = startHour + deltaHours;
                // Snap to 15 mins (0.25 hours)
                newStartHour = Math.round(newStartHour * 4) / 4;

                if (newStartHour < CONSTANTS.START_HOUR) newStartHour = CONSTANTS.START_HOUR;
                if (newStartHour + (startDuration / 60) > CONSTANTS.END_HOUR) {
                    newStartHour = CONSTANTS.END_HOUR - (startDuration / 60);
                }

                // Check collision
                const key = Utils.getDateKey(State.currentDate);
                const tasks = State.getTasksForDate(key);
                const collision = tasks.some(t => {
                    if (t.id === task.id) return false;
                    const tEnd = t.startHour + (t.durationMinutes / 60);
                    const newEnd = newStartHour + (startDuration / 60);
                    return (newStartHour < tEnd && newEnd > t.startHour);
                });

                if (!collision) {
                    task.startHour = newStartHour;
                    this.renderTasks();
                }

            } else if (mode === 'bottom') {
                let newDuration = startDuration + (deltaHours * 60);
                // Snap to 15 mins
                newDuration = Math.round(newDuration / 15) * 15;
                if (newDuration < 15) newDuration = 15;

                const newEndHour = startHour + (newDuration / 60);
                if (newEndHour > CONSTANTS.END_HOUR) {
                    newDuration = (CONSTANTS.END_HOUR - startHour) * 60;
                }

                // Check collision
                const key = Utils.getDateKey(State.currentDate);
                const tasks = State.getTasksForDate(key);
                const collision = tasks.some(t => {
                    if (t.id === task.id) return false;
                    const tEnd = t.startHour + (t.durationMinutes / 60);
                    return (startHour < tEnd && newEndHour > t.startHour);
                });

                if (!collision) {
                    task.durationMinutes = newDuration;
                    this.renderTasks();
                }
            } else if (mode === 'top') {
                // Resizing from top affects start time and duration
                let newStartHour = startHour + deltaHours;
                newStartHour = Math.round(newStartHour * 4) / 4;

                if (newStartHour < CONSTANTS.START_HOUR) newStartHour = CONSTANTS.START_HOUR;

                let newDuration = startDuration - ((newStartHour - startHour) * 60);
                if (newDuration < 15) {
                    newStartHour = startHour + (startDuration / 60) - (15 / 60);
                    newDuration = 15;
                }

                // Check collision
                const key = Utils.getDateKey(State.currentDate);
                const tasks = State.getTasksForDate(key);
                const collision = tasks.some(t => {
                    if (t.id === task.id) return false;
                    const tEnd = t.startHour + (t.durationMinutes / 60);
                    const newEnd = newStartHour + (newDuration / 60);
                    return (newStartHour < tEnd && newEnd > t.startHour);
                });

                if (!collision) {
                    task.startHour = newStartHour;
                    task.durationMinutes = newDuration;
                    this.renderTasks();
                }
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const key = Utils.getDateKey(State.currentDate);
            State.saveTasksForDate(key, State.getTasksForDate(key));
            if (typeof Breakdown !== 'undefined') Breakdown.render();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
};
