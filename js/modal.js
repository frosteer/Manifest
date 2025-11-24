const Modal = {
    elements: {
        modal: document.getElementById('confirm-modal'),
        message: document.getElementById('modal-message'),
        confirmBtn: document.getElementById('modal-confirm'),
        cancelBtn: document.getElementById('modal-cancel')
    },
    confirmCallback: null,

    init() {
        this.elements.cancelBtn.addEventListener('click', () => this.close());
        this.elements.confirmBtn.addEventListener('click', () => {
            if (this.confirmCallback) this.confirmCallback();
            this.close();
        });
    },

    show(message, onConfirm) {
        this.elements.message.textContent = message;
        this.confirmCallback = onConfirm;
        this.elements.cancelBtn.style.display = 'block';
        this.elements.confirmBtn.textContent = 'Confirm';
        this.elements.modal.classList.add('show');
    },

    showAlert(message) {
        this.elements.message.textContent = message;
        this.confirmCallback = null;
        this.elements.cancelBtn.style.display = 'none';
        this.elements.confirmBtn.textContent = 'OK';
        this.elements.modal.classList.add('show');
    },

    close() {
        this.elements.modal.classList.remove('show');
        this.confirmCallback = null;
    }
};
