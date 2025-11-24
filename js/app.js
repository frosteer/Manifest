const App = {
    init() {
        if (typeof State !== 'undefined') State.loadTasksFromStorage();
        if (typeof Nav !== 'undefined') Nav.init();
        if (typeof Pomodoro !== 'undefined') Pomodoro.init();
        if (typeof Timeline !== 'undefined') Timeline.init();
        if (typeof Breakdown !== 'undefined') Breakdown.init();
        if (typeof Notes !== 'undefined') Notes.init();
        if (typeof Panel !== 'undefined') Panel.init();
        if (typeof Modal !== 'undefined') Modal.init();
        if (typeof Countdown !== 'undefined') Countdown.init();
        if (typeof PerfectDay !== 'undefined') PerfectDay.init();

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

// Start App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
