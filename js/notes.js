const Notes = {
    elements: {
        input: null
    },

    init() {
        this.elements.input = document.getElementById('notes-input');
        if (this.elements.input) {
            this.bindEvents();
            this.render();
        }
    },

    bindEvents() {
        this.elements.input.addEventListener('input', (e) => {
            this.autoResize(e.target);
            this.saveNote(e.target.value);
        });
    },

    render() {
        const key = Utils.getDateKey(State.currentDate);
        const noteContent = State.getNoteForDate(key);
        this.elements.input.value = noteContent;
        this.autoResize(this.elements.input);
    },

    saveNote(content) {
        const key = Utils.getDateKey(State.currentDate);
        State.saveNoteForDate(key, content);
    },

    autoResize(el) {
        el.style.height = 'auto';
        const minHeight = parseFloat(getComputedStyle(el).lineHeight) * 10;
        const newHeight = Math.max(minHeight, el.scrollHeight);
        el.style.height = `${newHeight}px`;
    }
};
