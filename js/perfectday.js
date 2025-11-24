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
            const newTasks = JSON.parse(template).map(t => ({
                ...t,
                id: Date.now().toString() + Math.random(),
                isCollapsed: true // Always collapse on load
            }));
            State.saveTasksForDate(Utils.getDateKey(State.currentDate), newTasks);
            Timeline.renderTasks();
            if (typeof Breakdown !== 'undefined') Breakdown.render();
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
            // Safe Clear: Reload from storage to ensure we have the latest data and no in-memory corruption
            const storedTasks = localStorage.getItem('allTasks');
            let allTasks = storedTasks ? JSON.parse(storedTasks) : {};

            const key = Utils.getDateKey(State.currentDate);

            // Delete only the specific key for today
            if (allTasks[key]) {
                delete allTasks[key];
                localStorage.setItem('allTasks', JSON.stringify(allTasks));

                // Update in-memory state to match
                State.allTasks = allTasks;

                Timeline.renderTasks();
                if (typeof Breakdown !== 'undefined') Breakdown.render();
                Modal.showAlert('All tasks deleted.');
            } else {
                Modal.showAlert('No tasks to delete.');
            }
        });
    }
};
