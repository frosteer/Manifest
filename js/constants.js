const CONSTANTS = {
    START_HOUR: 0,
    END_HOUR: 24, // Midnight
    PIXELS_PER_HOUR: 100,
    get TOTAL_HOURS() { return this.END_HOUR - this.START_HOUR; }
};
