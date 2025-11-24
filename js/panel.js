const Panel = {
    elements: {
        column: null,
        content: null,
        btnProfile: null,
        btnUltimate: null,
        btnClient: null,
        lockScreen: null,
        lockInput: null
    },

    state: {
        currentView: window.location.pathname.includes('avatar.html') ? 'client' : 'ultimate'
    },

    init() {
        this.elements.column = document.getElementById('panel-column');
        this.elements.content = document.getElementById('panel-content');
        this.elements.btnProfile = document.getElementById('panel-btn-profile');
        this.elements.btnUltimate = document.getElementById('panel-btn-ultimate');
        this.elements.btnCountdown = document.getElementById('panel-btn-countdown');
        this.elements.lockScreen = document.getElementById('lock-screen');
        this.elements.lockInput = document.getElementById('lock-input');

        this.bindEvents();
        this.render();
    },

    bindEvents() {
        this.elements.btnProfile.onclick = () => this.showLockScreen();

        this.elements.btnUltimate.onclick = () => {
            this.switchView('ultimate');
        };

        if (this.elements.btnCountdown) {
            this.elements.btnCountdown.onclick = () => {
                this.switchView('countdown');
            };
        }

        this.elements.lockInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkPassword();
            }
        });

        // Prevent scroll chaining to main timeline
        this.elements.column.addEventListener('wheel', (e) => {
            const content = this.elements.content;
            // If content is not scrollable, prevent default to stop body scroll
            if (content.scrollHeight <= content.clientHeight) {
                e.preventDefault();
            }
        }, { passive: false });
    },

    switchView(view) {
        // switchView is now mostly for internal state updates if needed, 
        // but navigation is handled by page reloads.
        this.state.currentView = view;
        this.render();
    },

    render() {
        if (!this.elements.content) return;

        this.elements.content.innerHTML = '';
        if (this.state.currentView === 'ultimate') {
            if (typeof Ultimate !== 'undefined') Ultimate.render(this.elements.content);
        } else if (this.state.currentView === 'client') {
            if (typeof Client !== 'undefined') Client.render(this.elements.content);
        } else if (this.state.currentView === 'countdown') {
            if (typeof Countdown !== 'undefined') Countdown.render(this.elements.content);
        }

        // Update Buttons active state
        this.elements.btnUltimate.classList.toggle('active', this.state.currentView === 'ultimate');
        if (this.elements.btnCountdown) {
            this.elements.btnCountdown.classList.toggle('active', this.state.currentView === 'countdown');
        }
    },

    // Lock Screen Logic
    showLockScreen() {
        this.elements.lockScreen.classList.add('active');
        this.elements.lockInput.value = '';
        this.elements.lockInput.focus();
    },

    checkPassword() {
        if (this.elements.lockInput.value === '1129') {
            this.elements.lockScreen.classList.remove('active');
        } else {
            // Shake animation or visual feedback could go here
            this.elements.lockInput.style.borderColor = '#ff5252';
            setTimeout(() => {
                this.elements.lockInput.style.borderColor = 'var(--text-secondary)';
            }, 500);
        }
    }
};
