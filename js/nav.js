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
        clearDay: document.getElementById('clear-day'),
        exportBtn: document.getElementById('export-data'),
        importBtn: document.getElementById('import-data'),
        importFile: document.getElementById('import-file')
    },

    init() {
        console.log('Nav initializing...');
        this.loadTheme();
        this.renderDateDisplay();
        this.bindEvents();
    },

    bindEvents() {
        this.elements.prevBtn.addEventListener('click', () => this.changeDay(-1));
        this.elements.nextBtn.addEventListener('click', () => this.changeDay(1));
        this.elements.todayBtn.addEventListener('click', () => this.goToToday());

        this.elements.perfectDayBtn.addEventListener('click', (e) => {
            console.log('Perfect Day clicked');
            this.toggleDropdown(e, 'perfect-day-menu');
        });
        this.elements.settingsBtn.addEventListener('click', (e) => {
            console.log('Settings clicked');
            this.toggleDropdown(e, 'settings-menu');
        });

        document.addEventListener('click', () => this.closeDropdowns());

        this.elements.pdSave.addEventListener('click', () => PerfectDay.save());
        this.elements.pdLoad.addEventListener('click', () => PerfectDay.load());
        this.elements.pdDelete.addEventListener('click', () => PerfectDay.delete());
        this.elements.clearDay.addEventListener('click', () => PerfectDay.clearDay());

        // Export/Import
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.exportData());
        }
        if (this.elements.importBtn) {
            this.elements.importBtn.addEventListener('click', () => this.elements.importFile.click());
        }
        if (this.elements.importFile) {
            this.elements.importFile.addEventListener('change', (e) => this.importData(e));
        }

        // Color Pickers
        const colors = ['grey', 'orange', 'green', 'blue'];
        colors.forEach(color => {
            const picker = document.getElementById(`color-picker-${color}`);
            if (picker) {
                picker.addEventListener('input', (e) => {
                    document.documentElement.style.setProperty(`--accent-${color}`, e.target.value);
                    this.saveTheme();
                });
            }
        });
    },

    loadTheme() {
        const theme = localStorage.getItem('theme');
        if (theme) {
            const colors = JSON.parse(theme);
            Object.keys(colors).forEach(key => {
                document.documentElement.style.setProperty(`--accent-${key}`, colors[key]);
                const picker = document.getElementById(`color-picker-${key}`);
                if (picker) picker.value = colors[key];
            });
        }
    },

    saveTheme() {
        const colors = {};
        ['grey', 'orange', 'green', 'blue'].forEach(color => {
            colors[color] = getComputedStyle(document.documentElement).getPropertyValue(`--accent-${color}`).trim();
        });
        localStorage.setItem('theme', JSON.stringify(colors));
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
        if (typeof Breakdown !== 'undefined') Breakdown.render();
    },

    goToToday() {
        State.currentDate = new Date();
        this.renderDateDisplay();
        Timeline.renderTasks();
        Timeline.updateTimeLine();
        if (typeof Breakdown !== 'undefined') Breakdown.render();
        setTimeout(() => Timeline.scrollToCurrentTime(), 100); // Small delay to ensure render
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
    },

    exportData() {
        const data = {
            allTasks: localStorage.getItem('allTasks'),
            allNotes: localStorage.getItem('allNotes'),
            goals: localStorage.getItem('goals'),
            clients: localStorage.getItem('clients'),
            sales: localStorage.getItem('sales'),
            perfectDay: localStorage.getItem('perfectDay')
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `minimal_timeline_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('WARNING: Importing data will OVERWRITE all your current data. This cannot be undone. Are you sure?')) {
            e.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                // Basic validation
                if (!data.allTasks && !data.clients) {
                    throw new Error('Invalid backup file format');
                }

                // Clear and Restore
                localStorage.clear();
                if (data.allTasks) localStorage.setItem('allTasks', data.allTasks);
                if (data.allNotes) localStorage.setItem('allNotes', data.allNotes);
                if (data.goals) localStorage.setItem('goals', data.goals);
                if (data.clients) localStorage.setItem('clients', data.clients);
                if (data.sales) localStorage.setItem('sales', data.sales);
                if (data.perfectDay) localStorage.setItem('perfectDay', data.perfectDay);

                alert('Data imported successfully! The page will now reload.');
                location.reload();
            } catch (err) {
                console.error(err);
                alert('Error importing data: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
};
