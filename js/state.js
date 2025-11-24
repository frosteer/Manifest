const State = {
    currentDate: new Date(),
    allTasks: {}, // { "YYYY-MM-DD": [tasks] }
    allNotes: {}, // { "YYYY-MM-DD": "content" }
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

    getNoteForDate(dateKey) {
        return this.allNotes[dateKey] || "";
    },

    saveNoteForDate(dateKey, content) {
        if (!content) {
            delete this.allNotes[dateKey];
        } else {
            this.allNotes[dateKey] = content;
        }
        localStorage.setItem('allNotes', JSON.stringify(this.allNotes));
    },

    loadTasksFromStorage() {
        try {
            const tasksData = localStorage.getItem('allTasks');
            if (tasksData) this.allTasks = JSON.parse(tasksData);

            const notesData = localStorage.getItem('allNotes');
            if (notesData) this.allNotes = JSON.parse(notesData);

            const goalsData = localStorage.getItem('goals');
            if (goalsData) this.goals = JSON.parse(goalsData);

            const clientsData = localStorage.getItem('clients');
            if (clientsData) this.clients = JSON.parse(clientsData);
        } catch (e) {
            console.error('Error loading state from storage:', e);
            // Fallback to defaults if corrupted
            this.allTasks = {};
            this.allNotes = {};
            this.goals = [];
            this.clients = [];
        }
    },

    // Goals
    goals: [],
    saveGoals(goals) {
        this.goals = goals;
        localStorage.setItem('goals', JSON.stringify(this.goals));
    },

    // Clients
    clients: [],
    saveClients(clients) {
        this.clients = clients;
        localStorage.setItem('clients', JSON.stringify(this.clients));
    }
};
