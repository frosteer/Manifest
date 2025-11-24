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
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
};
