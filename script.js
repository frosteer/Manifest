// --- Constants ---
const CONSTANTS = {
    START_HOUR: 5,
    END_HOUR: 25, // 1am next day
    PIXELS_PER_HOUR: 100,
    get TOTAL_HOURS() { return this.END_HOUR - this.START_HOUR; }
};

// --- State Management ---
const State = {
    currentDate: new Date(),
    allTasks: {}, // { "YYYY-MM-DD": [tasks] }
    draggedTask: null,
    resizeMode: null,
    interaction: {
        initialY: 0,
        initialHeight: 0,
        initialTop: 0
    },

    getTasksForDate(dateKey) {
        return this.allTasks[dateKey] || [];
    },

    saveTasksForDate(dateKey, tasks) {
        if (tasks.length === 0) {
            delete this.allTasks[dateKey];
        } else {
            this.allTasks[dateKey] = tasks;
        }
        localStorage.setItem('allTasks', JSON.stringify(this.allTasks));
    },

    loadTasksFromStorage() {
        const data = localStorage.getItem('allTasks');
        if (data) {
            this.allTasks = JSON.parse(data);
        }
    }
};

// --- Utils ---
const Utils = {
    getDateKey(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    formatTimeRange(startHour, durationMinutes) {
        const format = (h) => {
            const m = Math.round((h % 1) * 60);
            let hr = Math.floor(h);
            if (hr >= 24) hr -= 24;
            const ampm = hr >= 12 ? 'pm' : 'am';
            const displayHr = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr);
            const minStr = m === 0 ? '00' : String(m).padStart(2, '0');
            return `${displayHr}.${minStr}${ampm}`;
        };
        const endHour = startHour + (durationMinutes / 60);
        return `${format(startHour)} - ${format(endHour)}`;
    }
};

// --- Navigation Section ---
const Nav = {
    elements: {
        dateDisplay: document.getElementById('current-date-display'),
        prevBtn: document.getElementById('prev-day'),
        nextBtn: document.getElementById('next-day'),
        todayBtn: document.getElementById('today-btn'),
        perfectDayBtn: document.getElementById('perfect-day-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        perfectDayMenu: document.getElementById('perfect-day-menu'),
        settingsMenu: document.getElementById('settings-menu'),
        pdSave: document.getElementById('pd-save'),
        pdLoad: document.getElementById('pd-load'),
        pdDelete: document.getElementById('pd-delete'),
        clearDay: document.getElementById('clear-day')
    },

    init() {
        this.renderDateDisplay();
        this.bindEvents();
    },

    bindEvents() {
        this.elements.prevBtn.addEventListener('click', () => this.changeDay(-1));
        this.elements.nextBtn.addEventListener('click', () => this.changeDay(1));
        this.elements.todayBtn.addEventListener('click', () => this.goToToday());

        this.elements.perfectDayBtn.addEventListener('click', (e) => this.toggleDropdown(e, 'perfect-day-menu'));
        this.elements.settingsBtn.addEventListener('click', (e) => this.toggleDropdown(e, 'settings-menu'));

        document.addEventListener('click', () => this.closeDropdowns());

        this.elements.pdSave.addEventListener('click', () => PerfectDay.save());
        this.elements.pdLoad.addEventListener('click', () => PerfectDay.load());
        this.elements.pdDelete.addEventListener('click', () => PerfectDay.delete());
        this.elements.clearDay.addEventListener('click', () => PerfectDay.clearDay());
    },

    renderDateDisplay() {
        const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' };
        const day = State.currentDate.getDate();
        const month = State.currentDate.toLocaleString('default', { month: 'short' });
        const year = State.currentDate.getFullYear();
        const weekday = State.currentDate.toLocaleString('default', { weekday: 'long' });
        this.elements.dateDisplay.textContent = `${day} ${month} ${year}, ${weekday}`;
    },

    changeDay(offset) {
        State.currentDate.setDate(State.currentDate.getDate() + offset);
        this.renderDateDisplay();
        Timeline.renderTasks();
        Timeline.updateTimeLine();
    },

    goToToday() {
        State.currentDate = new Date();
        this.renderDateDisplay();
        Timeline.renderTasks();
        Timeline.updateTimeLine();
    },

    toggleDropdown(e, menuId) {
        e.stopPropagation();
        const menu = document.getElementById(menuId);
        const isVisible = menu.classList.contains('show');
        this.closeDropdowns();
        if (!isVisible) {
            menu.classList.add('show');
        }
    },

    closeDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    }
};

// --- Pomodoro Section ---
const Pomodoro = {
    state: {
        mode: 'standard', // 'standard' | 'smart'
        session: 'work', // 'work' | 'break'
        isRunning: false,
        autoStart: true,
        timeLeft: 25 * 60, // seconds
        workDuration: 25, // minutes
        breakDuration: 5, // minutes
        currentTask: null,
        lastTick: Date.now()
    },

    elements: {
        tabStandard: document.getElementById('pomo-tab-standard'),
        tabSmart: document.getElementById('pomo-tab-smart'),
        display: document.getElementById('timer-display'),
        taskTitle: document.getElementById('timer-task-title'),
        controlsContainer: document.getElementById('timer-controls'),
        btnToggle: document.getElementById('pomo-btn-toggle'),
        btnReset: document.getElementById('pomo-btn-reset'),
        btnSwitch: document.getElementById('pomo-btn-switch'),
        btnSettings: document.getElementById('pomo-btn-settings'),
        settingsModal: document.getElementById('pomo-settings-modal'),
        inputWork: document.getElementById('pomo-setting-work'),
        inputBreak: document.getElementById('pomo-setting-break'),
        inputAuto: document.getElementById('pomo-setting-auto'),
        btnSettingsSave: document.getElementById('pomo-settings-save'),
        btnSettingsCancel: document.getElementById('pomo-settings-cancel')
    },

    init() {
        this.bindEvents();
        this.switchMode(this.state.mode); // Initialize UI state
        this.updateDisplay();

        // Main loop for timer updates
        setInterval(() => this.tick(), 1000);
    },

    bindEvents() {
        this.elements.tabStandard.addEventListener('click', () => this.switchMode('standard'));
        this.elements.tabSmart.addEventListener('click', () => this.switchMode('smart'));

        this.elements.btnToggle.addEventListener('click', () => this.toggleTimer());
        this.elements.btnReset.addEventListener('click', () => this.resetTimer());
        this.elements.btnSwitch.addEventListener('click', () => this.toggleSession());
        this.elements.btnSettings.addEventListener('click', () => this.openSettings());

        this.elements.btnSettingsSave.addEventListener('click', () => this.saveSettings());
        this.elements.btnSettingsCancel.addEventListener('click', () => this.closeSettings());
    },

    toggleSession() {
        this.state.session = this.state.session === 'work' ? 'break' : 'work';
        this.resetTimer();
        // Removed alert as requested
    },

    switchMode(mode) {
        this.state.mode = mode;
        this.state.isRunning = false; // Stop timer on switch

        // Update Tabs
        this.elements.tabStandard.classList.toggle('active', mode === 'standard');
        this.elements.tabSmart.classList.toggle('active', mode === 'smart');

        // Update Controls Visibility
        if (mode === 'smart') {
            this.elements.controlsContainer.style.display = 'none';
            this.elements.taskTitle.style.display = 'flex'; // flex to align center
            this.updateSmartTimer(); // Immediate update
        } else {
            this.elements.controlsContainer.style.display = 'flex';
            this.elements.taskTitle.style.display = 'none';
            this.resetTimer(); // Reset to default standard time
        }
        this.updateDisplay();
    },

    tick() {
        if (this.state.mode === 'standard') {
            if (this.state.isRunning) {
                if (this.state.timeLeft > 0) {
                    this.state.timeLeft--;
                    this.updateDisplay();
                } else {
                    // Timer Finished
                    if (this.state.autoStart) {
                        this.toggleSession();
                        this.state.isRunning = true; // Auto-start next session
                        this.updateIcon();
                        // Optional: Play sound here
                    } else {
                        this.state.isRunning = false;
                        this.updateIcon();
                        Modal.showAlert("Timer Finished!");
                    }
                }
            }
        } else {
            // Smart Mode: Update every second to sync with real time
            this.updateSmartTimer();
        }
    },

    updateSmartTimer() {
        const now = new Date();
        const currentHour = now.getHours() + (now.getMinutes() / 60) + (now.getSeconds() / 3600);

        // Adjust for 5am start (if needed for logic, but tasks are stored with absolute hours)
        // Tasks store startHour (e.g., 9.5) and durationMinutes

        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        // Find active task
        const activeTask = tasks.find(t => {
            const endHour = t.startHour + (t.durationMinutes / 60);
            return currentHour >= t.startHour && currentHour < endHour;
        });

        if (activeTask) {
            const endHour = activeTask.startHour + (activeTask.durationMinutes / 60);
            const remainingHours = endHour - currentHour;
            this.state.timeLeft = Math.max(0, Math.floor(remainingHours * 3600));
            this.elements.taskTitle.textContent = activeTask.title;
            this.elements.taskTitle.style.color = 'var(--text-primary)';
        } else {
            this.state.timeLeft = 0;
            this.elements.taskTitle.textContent = "No active task";
            this.elements.taskTitle.style.color = 'var(--text-secondary)';
        }
        this.updateDisplay();
    },

    toggleTimer() {
        this.state.isRunning = !this.state.isRunning;
        this.updateIcon();
    },

    updateIcon() {
        const icon = this.state.isRunning
            ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>' // Pause
            : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'; // Play
        this.elements.btnToggle.innerHTML = icon;
    },

    resetTimer() {
        this.state.isRunning = false;
        const duration = this.state.session === 'work' ? this.state.workDuration : this.state.breakDuration;
        this.state.timeLeft = duration * 60;
        this.updateIcon();
        this.updateDisplay();
    },

    updateDisplay() {
        const m = Math.floor(this.state.timeLeft / 60);
        const s = this.state.timeLeft % 60;
        this.elements.display.textContent = `${m}m ${String(s).padStart(2, '0')}s`;
    },

    // Settings
    openSettings() {
        this.elements.inputWork.value = this.state.workDuration;
        this.elements.inputBreak.value = this.state.breakDuration;
        this.elements.inputAuto.checked = this.state.autoStart;
        this.elements.settingsModal.classList.add('show');
    },

    closeSettings() {
        this.elements.settingsModal.classList.remove('show');
    },

    saveSettings() {
        const work = parseInt(this.elements.inputWork.value);
        const brk = parseInt(this.elements.inputBreak.value);
        const auto = this.elements.inputAuto.checked;

        if (work > 0) this.state.workDuration = work;
        if (brk > 0) this.state.breakDuration = brk;
        this.state.autoStart = auto;

        this.resetTimer(); // Apply new settings
        this.closeSettings();
    }
};

// --- Timeline Section ---
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
                    <span class="task-time">${Utils.formatTimeRange(task.startHour, task.durationMinutes)}</span>
                    <input type="text" class="task-title-input" value="${task.title}">
                </div>
                <div class="task-controls">
                    <div class="control-btn" onclick="Timeline.cycleTaskColor('${task.id}')" title="Change Color">
                        <div style="width:10px;height:10px;background:var(--accent-${task.color === 'grey' ? 'orange' : (task.color === 'orange' ? 'green' : (task.color === 'green' ? 'blue' : 'grey'))});border-radius:50%"></div>
                    </div>
                    <div class="control-btn" onclick="Timeline.deleteTask('${task.id}')" title="Delete">✕</div>
                </div>
                <div class="resize-handle resize-bottom"></div>
            `;

            const input = el.querySelector('.task-title-input');
            input.addEventListener('change', (e) => this.updateTaskTitle(task.id, e.target.value));
            input.addEventListener('click', (e) => e.stopPropagation());

            el.querySelector('.resize-top').addEventListener('mousedown', (e) => this.startInteraction(e, task, 'top'));
            el.querySelector('.resize-bottom').addEventListener('mousedown', (e) => this.startInteraction(e, task, 'bottom'));
            el.querySelector('.drag-handle').addEventListener('mousedown', (e) => this.startInteraction(e, task, 'move'));

            this.elements.tasksContainer.appendChild(el);
        });
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
    },

    updateTaskTitle(id, newTitle) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.title = newTitle;
            State.saveTasksForDate(key, tasks);
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
        }
    },

    deleteTask(id) {
        const key = Utils.getDateKey(State.currentDate);
        let tasks = State.getTasksForDate(key);
        tasks = tasks.filter(t => t.id !== id);
        State.saveTasksForDate(key, tasks);
        this.renderTasks();
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
        e.stopPropagation();
        e.preventDefault();
        State.draggedTask = JSON.parse(JSON.stringify(task));
        State.resizeMode = mode;
        State.interaction.initialY = e.clientY;

        const el = document.querySelector(`.task-card[data-id="${task.id}"]`);
        State.interaction.initialTop = parseFloat(el.style.top);
        State.interaction.initialHeight = parseFloat(el.style.height);
        el.style.zIndex = 100;
    },

    checkOverlap(start, duration, excludeTaskId = null) {
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const end = start + (duration / 60);
        return tasks.some(t => {
            if (t.id === excludeTaskId) return false;
            const tEnd = t.startHour + (t.durationMinutes / 60);
            return (start < tEnd && end > t.startHour);
        });
    }
};

// --- Notes Section ---
const Notes = {
    init() {
        // Placeholder
        console.log("Notes initialized");
    }
};

// --- Perfect Day Logic ---
const PerfectDay = {
    save() {
        const currentTasks = State.getTasksForDate(Utils.getDateKey(State.currentDate));
        const existingTemplate = localStorage.getItem('perfectDayTemplate');

        const doSave = () => {
            localStorage.setItem('perfectDayTemplate', JSON.stringify(currentTasks));
            Modal.showAlert('Perfect Day saved!');
        };

        if (existingTemplate) {
            Modal.show('Overwrite existing Perfect Day template?', doSave);
        } else {
            doSave();
        }
    },

    load() {
        const template = localStorage.getItem('perfectDayTemplate');
        if (!template) {
            Modal.showAlert('No Perfect Day template found.');
            return;
        }

        const currentTasks = State.getTasksForDate(Utils.getDateKey(State.currentDate));

        const doLoad = () => {
            const newTasks = JSON.parse(template).map(t => ({ ...t, id: Date.now().toString() + Math.random() }));
            State.saveTasksForDate(Utils.getDateKey(State.currentDate), newTasks);
            Timeline.renderTasks();
            Modal.showAlert('Perfect Day loaded!');
        };

        if (currentTasks.length > 0) {
            Modal.show('Replace today\'s tasks with Perfect Day?', doLoad);
        } else {
            doLoad();
        }
    },

    delete() {
        const existingTemplate = localStorage.getItem('perfectDayTemplate');
        if (!existingTemplate) {
            Modal.showAlert('No template to delete.');
            return;
        }

        Modal.show('Are you sure you want to delete the Perfect Day template?', () => {
            localStorage.removeItem('perfectDayTemplate');
            Modal.showAlert('Template deleted.');
        });
    },

    clearDay() {
        Modal.show('Delete all tasks for today?', () => {
            State.saveTasksForDate(Utils.getDateKey(State.currentDate), []);
            Timeline.renderTasks();
            Modal.showAlert('All tasks deleted.');
        });
    }
};

// --- Modal ---
const Modal = {
    elements: {
        modal: document.getElementById('confirm-modal'),
        message: document.getElementById('modal-message'),
        confirmBtn: document.getElementById('modal-confirm'),
        cancelBtn: document.getElementById('modal-cancel')
    },
    confirmCallback: null,

    init() {
        this.elements.cancelBtn.addEventListener('click', () => this.close());
        this.elements.confirmBtn.addEventListener('click', () => {
            if (this.confirmCallback) this.confirmCallback();
            this.close();
        });
    },

    show(message, onConfirm) {
        this.elements.message.textContent = message;
        this.confirmCallback = onConfirm;
        this.elements.cancelBtn.style.display = 'block';
        this.elements.confirmBtn.textContent = 'Confirm';
        this.elements.modal.classList.add('show');
    },

    showAlert(message) {
        this.elements.message.textContent = message;
        this.confirmCallback = null;
        this.elements.cancelBtn.style.display = 'none';
        this.elements.confirmBtn.textContent = 'OK';
        this.elements.modal.classList.add('show');
    },

    close() {
        this.elements.modal.classList.remove('show');
        this.confirmCallback = null;
    }
};

// --- App Entry Point ---
const App = {
    init() {
        State.loadTasksFromStorage();
        Nav.init();
        Pomodoro.init();
        Timeline.init();
        Notes.init();
        Modal.init();

        // Global Mouse Events (Delegated to Timeline/App)
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    },

    handleMouseMove(e) {
        if (!State.draggedTask) return;
        const deltaY = e.clientY - State.interaction.initialY;
        const step = CONSTANTS.PIXELS_PER_HOUR / 2;
        const snappedDelta = Math.round(deltaY / step) * step;
        const el = document.querySelector(`.task-card[data-id="${State.draggedTask.id}"]`);

        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        if (State.resizeMode === 'move') {
            let newTop = State.interaction.initialTop + snappedDelta;
            if (newTop < 0) newTop = 0;
            const maxTop = (CONSTANTS.TOTAL_HOURS * CONSTANTS.PIXELS_PER_HOUR) - State.interaction.initialHeight;
            if (newTop > maxTop) newTop = maxTop;
            el.style.top = `${newTop}px`;

        } else if (State.resizeMode === 'bottom') {
            let newHeight = State.interaction.initialHeight + snappedDelta;
            if (newHeight < step) newHeight = step;

            // Bounds next task
            const currentStart = State.draggedTask.startHour;
            const currentTop = (currentStart - CONSTANTS.START_HOUR) * CONSTANTS.PIXELS_PER_HOUR;
            const nextTask = tasks
                .filter(t => t.id !== State.draggedTask.id && t.startHour >= currentStart)
                .sort((a, b) => a.startHour - b.startHour)[0];

            if (nextTask) {
                const nextTaskTop = (nextTask.startHour - CONSTANTS.START_HOUR) * CONSTANTS.PIXELS_PER_HOUR;
                const maxH = nextTaskTop - currentTop;
                if (newHeight > maxH) newHeight = maxH;
            }

            const maxTotalHeight = (CONSTANTS.TOTAL_HOURS * CONSTANTS.PIXELS_PER_HOUR) - currentTop;
            if (newHeight > maxTotalHeight) newHeight = maxTotalHeight;
            el.style.height = `${newHeight}px`;

        } else if (State.resizeMode === 'top') {
            let newTop = State.interaction.initialTop + snappedDelta;
            let newHeight = State.interaction.initialHeight - snappedDelta;
            if (newHeight < step) return;

            // Bounds prev task
            const currentEnd = State.draggedTask.startHour + (State.draggedTask.durationMinutes / 60);
            const currentBottom = (currentEnd - CONSTANTS.START_HOUR) * CONSTANTS.PIXELS_PER_HOUR;
            const prevTask = tasks
                .filter(t => t.id !== State.draggedTask.id && t.startHour < State.draggedTask.startHour)
                .sort((a, b) => b.startHour - a.startHour)[0];

            if (prevTask) {
                const prevTaskEnd = prevTask.startHour + (prevTask.durationMinutes / 60);
                const prevTaskBottom = (prevTaskEnd - CONSTANTS.START_HOUR) * CONSTANTS.PIXELS_PER_HOUR;
                if (newTop < prevTaskBottom) {
                    newTop = prevTaskBottom;
                    newHeight = currentBottom - newTop;
                }
            }

            if (newTop < 0) {
                newTop = 0;
                newHeight = State.interaction.initialTop + State.interaction.initialHeight;
            }
            el.style.top = `${newTop}px`;
            el.style.height = `${newHeight}px`;
        }
    },

    handleMouseUp(e) {
        if (!State.draggedTask) return;
        const el = document.querySelector(`.task-card[data-id="${State.draggedTask.id}"]`);
        const finalHeight = parseFloat(el.style.height);
        const finalTop = parseFloat(el.style.top);

        const durationHours = finalHeight / CONSTANTS.PIXELS_PER_HOUR;
        const startOffsetHours = finalTop / CONSTANTS.PIXELS_PER_HOUR;

        const newStart = Math.round((CONSTANTS.START_HOUR + startOffsetHours) * 2) / 2;
        const newDuration = Math.round(durationHours * 60);

        // Validate Overlap for Move
        if (State.resizeMode === 'move') {
            if (Timeline.checkOverlap(newStart, State.draggedTask.durationMinutes, State.draggedTask.id)) {
                State.draggedTask = null;
                State.resizeMode = null;
                Timeline.renderTasks(); // Revert
                return;
            }
        }

        // Update real task
        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);
        const task = tasks.find(t => t.id === State.draggedTask.id);
        if (task) {
            task.startHour = newStart;
            task.durationMinutes = newDuration;
            State.saveTasksForDate(key, tasks);
        }

        State.draggedTask = null;
        State.resizeMode = null;
        Timeline.renderTasks();
    }
};

// Initialize
App.init();
