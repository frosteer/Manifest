const Countdown = {
    state: {
        intervalId: null,
        settings: {
            showHours: true,
            showMinutes: true,
            showSeconds: true
        },
        domElements: {}
    },

    init() {
        this.loadSettings();
        this.startTimer();
    },

    render(container) {
        container.innerHTML = `
            <div class="countdown-panel">
                <div class="countdown-header-row">
                    <h2 class="panel-title">Countdown</h2>
                    <button id="cd-settings-toggle" class="icon-btn" title="Settings">⚙️</button>
                </div>
                
                <div id="cd-settings-panel" class="countdown-settings-panel" style="display: none;">
                    <label class="countdown-option">
                        <input type="checkbox" id="cd-opt-hours"> Total Hours
                    </label>
                    <label class="countdown-option">
                        <input type="checkbox" id="cd-opt-minutes"> Total Minutes
                    </label>
                    <label class="countdown-option">
                        <input type="checkbox" id="cd-opt-seconds"> Total Seconds
                    </label>
                </div>

                <div class="countdown-content">
                    <div class="countdown-main-display">
                        <div class="cd-label">Time Remaining</div>
                        <div id="cd-display-standard" class="cd-value-large">--:--:--</div>
                    </div>

                    <div id="cd-extra-stats" class="countdown-extra-stats">
                        <!-- Injected by JS -->
                    </div>
                </div>
            </div>
        `;

        this.state.domElements = {
            settingsPanel: document.getElementById('cd-settings-panel'),
            displayStandard: document.getElementById('cd-display-standard'),
            extraStats: document.getElementById('cd-extra-stats'),
            optHours: document.getElementById('cd-opt-hours'),
            optMinutes: document.getElementById('cd-opt-minutes'),
            optSeconds: document.getElementById('cd-opt-seconds')
        };

        this.bindViewEvents();
        this.updateView(); // Initial render
    },

    bindViewEvents() {
        const toggleBtn = document.getElementById('cd-settings-toggle');
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                const panel = this.state.domElements.settingsPanel;
                panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            };
        }

        const { optHours, optMinutes, optSeconds } = this.state.domElements;

        if (optHours) {
            optHours.checked = this.state.settings.showHours;
            optHours.onchange = () => {
                this.state.settings.showHours = optHours.checked;
                this.saveSettings();
                this.updateView();
            };
        }

        if (optMinutes) {
            optMinutes.checked = this.state.settings.showMinutes;
            optMinutes.onchange = () => {
                this.state.settings.showMinutes = optMinutes.checked;
                this.saveSettings();
                this.updateView();
            };
        }

        if (optSeconds) {
            optSeconds.checked = this.state.settings.showSeconds;
            optSeconds.onchange = () => {
                this.state.settings.showSeconds = optSeconds.checked;
                this.saveSettings();
                this.updateView();
            };
        }
    },

    startTimer() {
        if (this.state.intervalId) clearInterval(this.state.intervalId);

        const update = () => {
            this.updateView();
        };

        update();
        this.state.intervalId = setInterval(update, 1000);
    },

    updateView() {
        // Only update if DOM elements exist (view is active)
        if (!this.state.domElements.displayStandard) return;

        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        let diff = endOfDay - now;
        if (diff < 0) diff = 0;

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Standard Display
        this.state.domElements.displayStandard.textContent =
            `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

        // Extra Stats
        let extraHtml = '';

        if (this.state.settings.showHours) {
            const totalHours = (totalSeconds / 3600).toFixed(1);
            extraHtml += `
                <div class="cd-stat-item">
                    <span class="cd-stat-value">${totalHours}</span>
                    <span class="cd-stat-label">Hours Left</span>
                </div>
            `;
        }

        if (this.state.settings.showMinutes) {
            const totalMinutes = Math.floor(totalSeconds / 60);
            extraHtml += `
                <div class="cd-stat-item">
                    <span class="cd-stat-value">${totalMinutes}</span>
                    <span class="cd-stat-label">Minutes Left</span>
                </div>
            `;
        }

        if (this.state.settings.showSeconds) {
            extraHtml += `
                <div class="cd-stat-item">
                    <span class="cd-stat-value">${totalSeconds}</span>
                    <span class="cd-stat-label">Seconds Left</span>
                </div>
            `;
        }

        this.state.domElements.extraStats.innerHTML = extraHtml;
    },

    saveSettings() {
        localStorage.setItem('minimal_countdown_settings', JSON.stringify(this.state.settings));
    },

    loadSettings() {
        const saved = localStorage.getItem('minimal_countdown_settings');
        if (saved) {
            try {
                this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to load countdown settings', e);
            }
        }
    }
};
