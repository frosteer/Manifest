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

        // Main loop for timer updates (100ms for smoother smart timer)
        setInterval(() => this.tick(), 100);
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
        const now = Date.now();
        if (this.state.mode === 'standard') {
            if (this.state.isRunning) {
                // Only update if at least 1 second has passed
                if (now - this.state.lastTick >= 1000) {
                    this.state.lastTick = now;
                    if (this.state.timeLeft > 0) {
                        this.state.timeLeft--;
                        this.updateDisplay();
                    } else {
                        // Timer Finished
                        if (this.state.autoStart) {
                            this.toggleSession();
                            this.state.isRunning = true; // Auto-start next session
                            this.state.lastTick = Date.now(); // Reset tick for new session
                            this.updateIcon();
                        } else {
                            this.state.isRunning = false;
                            this.updateIcon();
                            Modal.showAlert("Timer Finished!");
                        }
                    }
                }
            } else {
                this.state.lastTick = now; // Keep syncing while paused
            }
        } else {
            // Smart Mode: Update frequently
            this.updateSmartTimer();
        }
        this.updateDisplay(); // Ensure display is updated every tick
    },

    updateSmartTimer() {
        const now = new Date();

        // Smart Timer only works if we are viewing "Today"
        if (Utils.getDateKey(State.currentDate) !== Utils.getDateKey(now)) {
            this.state.timeLeft = 0;
            this.elements.taskTitle.textContent = "Viewing other date";
            this.elements.taskTitle.style.color = 'var(--text-secondary)';
            this.updateDisplay();
            return;
        }

        const currentHour = now.getHours() + (now.getMinutes() / 60) + (now.getSeconds() / 3600);

        const key = Utils.getDateKey(State.currentDate);
        const tasks = State.getTasksForDate(key);

        // Find active task
        const activeTask = tasks.find(t => {
            const endHour = t.startHour + (t.durationMinutes / 60);
            return currentHour >= t.startHour && currentHour < endHour;
        });

        if (activeTask) {
            const endTime = new Date(now);
            const endHourFloat = activeTask.startHour + (activeTask.durationMinutes / 60);

            const endH = Math.floor(endHourFloat);
            const endM = Math.floor((endHourFloat - endH) * 60);
            const endS = Math.round(((endHourFloat - endH) * 60 - endM) * 60);

            // Simple setHours since we don't go past 24
            endTime.setHours(endH, endM, endS, 0);

            const diffMs = endTime - now;
            this.state.timeLeft = Math.max(0, Math.ceil(diffMs / 1000));

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
