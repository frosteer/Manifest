const ClientApp = {
    data: {
        clients: [],
        sales: {
            targetANP: 0,
            closedANP: 0 // Calculated
        }
    },

    elements: {
        createForm: null,
        salesMonitor: null,
        salesTable: null,
        todayActionContainer: null,
        dueActionContainer: null,
        sortingContainer: null,
        profileSection: null,
        btnUltimate: null
    },

    init() {
        this.loadData();
        this.cacheElements();
        this.bindEvents();
        // Initial render for client.html (no container passed)
        this.render();
    },

    loadData() {
        const storedClients = localStorage.getItem('clients');
        const storedSales = localStorage.getItem('sales');

        if (storedClients) {
            this.data.clients = JSON.parse(storedClients);
        }

        if (storedSales) {
            this.data.sales = JSON.parse(storedSales);
        }

        this.calculateClosedANP();
    },

    saveData() {
        localStorage.setItem('clients', JSON.stringify(this.data.clients));
        localStorage.setItem('sales', JSON.stringify(this.data.sales));
        this.calculateClosedANP();
        this.render();
    },

    calculateClosedANP() {
        this.data.sales.closedANP = this.data.clients
            .filter(c => c.stage === 'Close' || c.stage === 'Client')
            .reduce((sum, c) => sum + (parseFloat(c.anp) || 0), 0);
    },

    cacheElements() {
        this.elements.createForm = document.getElementById('create-client-form');
        this.elements.salesMonitor = document.getElementById('sales-monitor');
        this.elements.salesTable = document.getElementById('sales-table-body');
        this.elements.todayActionContainer = document.getElementById('today-action-container');
        this.elements.dueActionContainer = document.getElementById('due-action-container');
        this.elements.sortingContainer = document.getElementById('sorting-container');
        this.elements.profileSection = document.getElementById('client-profile-section');
        this.elements.btnUltimate = document.getElementById('panel-btn-ultimate');
    },

    bindEvents() {
        // Navigation
        if (this.elements.btnUltimate) {
            this.elements.btnUltimate.onclick = () => {
                window.location.href = 'index.html';
            };
        }

        // Create Client Form (Static elements on client.html)
        const btnSave = document.getElementById('btn-save-client');
        if (btnSave) btnSave.onclick = () => this.handleCreateClient();

        const btnCancel = document.getElementById('btn-cancel-client');
        if (btnCancel) btnCancel.onclick = () => this.resetForm();

        // Sales Target Edit
        const btnEditTarget = document.getElementById('btn-edit-target');
        if (btnEditTarget) {
            btnEditTarget.onclick = () => {
                const newTarget = prompt("Enter Target ANP:", this.data.sales.targetANP);
                if (newTarget !== null) {
                    this.data.sales.targetANP = parseFloat(newTarget) || 0;
                    this.saveData();
                }
            };
        }
    },

    // Main Render Function
    render(container) {
        // If container is provided (Avatar Page Sidebar), render the sidebar content
        if (container) {
            this.renderSidebar(container);
        }

        // Always try to render the main content (Sales Monitor, etc.)
        // This will work on client.html and fail silently/safely on avatar.html if elements don't exist
        if (this.elements.salesMonitor) this.renderSalesMonitor();
        if (this.elements.salesTable) this.renderSalesTable();
        if (this.elements.todayActionContainer) this.renderActions();
        if (this.elements.sortingContainer) this.renderSorting();
    },

    renderSidebar(container) {
        container.innerHTML = `
            <div class="create-client-section">
                <button id="btn-add-client-dynamic" class="btn-add-client">+ Add Client</button>

                <div id="create-client-form-dynamic" class="create-client-form" style="display: none;">
                    <div class="form-group">
                        <label class="form-label">Client Name</label>
                        <input type="text" id="input-name-dynamic" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Stage</label>
                        <select id="input-stage-dynamic" class="form-select">
                            <option value="Lead">Lead</option>
                            <option value="Open">Open</option>
                            <option value="Present">Present</option>
                            <option value="Close">Close</option>
                            <option value="Follow Up">Follow Up</option>
                            <option value="Client">Client</option>
                            <option value="KIV">KIV</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Product Recommended</label>
                        <input type="text" id="input-product-dynamic" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Potential ANP ($)</label>
                        <input type="number" id="input-anp-dynamic" class="form-input" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Payment Mode</label>
                        <select id="input-payment-mode-dynamic" class="form-select">
                            <option value="Monthly" selected>Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Half Yearly">Half Yearly</option>
                            <option value="Yearly">Yearly</option>
                            <option value="Single Premium">Single Premium</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Installment Amount ($)</label>
                        <input type="number" id="input-monthly-dynamic" class="form-input" placeholder="Per payment">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Action Date</label>
                        <input type="date" id="input-date-dynamic" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contact</label>
                        <input type="text" id="input-contact-dynamic" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea id="input-notes-dynamic" class="form-textarea"></textarea>
                    </div>
                    <div class="form-actions">
                        <button id="btn-cancel-client-dynamic" class="btn-cancel">Cancel</button>
                        <button id="btn-save-client-dynamic" class="btn-save">Save</button>
                    </div>
                </div>
            </div>
        `;

        this.bindSidebarEvents(container);
    },

    bindSidebarEvents(container) {
        const btnAdd = container.querySelector('#btn-add-client-dynamic');
        const form = container.querySelector('#create-client-form-dynamic');
        const btnSave = container.querySelector('#btn-save-client-dynamic');
        const btnCancel = container.querySelector('#btn-cancel-client-dynamic');

        if (btnAdd) {
            btnAdd.onclick = () => {
                form.style.display = 'flex';
            };
        }

        if (btnSave) {
            btnSave.onclick = () => this.handleCreateClient(true); // true = dynamic
        }

        if (btnCancel) {
            btnCancel.onclick = () => {
                form.style.display = 'none';
                this.resetForm(true);
            };
        }
    },

    handleCreateClient(isDynamic = false) {
        const suffix = isDynamic ? '-dynamic' : '';
        const nameInput = document.getElementById(`input-name${suffix}`);

        if (!nameInput) return; // Safety check

        const name = nameInput.value;
        if (!name) return alert('Client Name is required');

        const newClient = {
            id: Date.now().toString(),
            name: name,
            stage: document.getElementById(`input-stage${suffix}`).value,
            product: document.getElementById(`input-product${suffix}`).value,
            anp: parseFloat(document.getElementById(`input-anp${suffix}`).value) || 0,
            paymentMode: document.getElementById(`input-payment-mode${suffix}`) ? document.getElementById(`input-payment-mode${suffix}`).value : 'Monthly',
            monthlyAmount: parseFloat(document.getElementById(`input-monthly${suffix}`) ? document.getElementById(`input-monthly${suffix}`).value : 0) || 0,
            actionDate: document.getElementById(`input-date${suffix}`).value,
            contact: document.getElementById(`input-contact${suffix}`).value,
            notes: document.getElementById(`input-notes${suffix}`).value,
            history: []
        };

        this.data.clients.push(newClient);
        this.saveData();
        this.resetForm(isDynamic);

        const form = document.getElementById(isDynamic ? 'create-client-form-dynamic' : 'create-client-form');
        if (form) form.style.display = 'none';
    },

    resetForm(isDynamic = false) {
        const suffix = isDynamic ? '-dynamic' : '';
        const setVal = (id, val) => {
            const el = document.getElementById(id + suffix);
            if (el) el.value = val;
        };

        setVal('input-name', '');
        setVal('input-stage', 'Lead');
        setVal('input-product', '');
        setVal('input-anp', '');
        setVal('input-payment-mode', 'Monthly');
        setVal('input-monthly', '');
        setVal('input-date', '');
        setVal('input-contact', '');
        setVal('input-notes', '');

        const form = document.getElementById(isDynamic ? 'create-client-form-dynamic' : 'create-client-form');
        if (form) form.style.display = 'none';
    },

    renderSalesMonitor() {
        if (!this.elements.salesMonitor) return;
        document.getElementById('display-target-anp').textContent = `$${this.data.sales.targetANP.toLocaleString()}`;
        document.getElementById('display-closed-anp').textContent = `$${this.data.sales.closedANP.toLocaleString()}`;
    },

    renderSalesTable() {
        const tbody = this.elements.salesTable;
        if (!tbody) return;

        tbody.innerHTML = '';

        const closedClients = this.data.clients.filter(c => c.stage === 'Close' || c.stage === 'Client');
        let totals = {
            anp: 0,
            months: Array(12).fill(0),
            forward: 0
        };

        closedClients.forEach(client => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

            const anp = parseFloat(client.anp) || 0;
            const date = new Date(client.actionDate);
            const startMonth = isNaN(date.getTime()) ? 0 : date.getMonth(); // 0-11

            let monthlyData = Array(12).fill(0);
            let collectedThisYear = 0;

            if (client.paymentMode === 'Single Premium' || client.paymentMode === 'Lump Sum') {
                monthlyData[startMonth] = anp;
                collectedThisYear = anp;
            } else {
                const installment = parseFloat(client.monthlyAmount) || 0;
                let interval = 1;
                if (client.paymentMode === 'Quarterly') interval = 3;
                if (client.paymentMode === 'Half Yearly') interval = 6;
                if (client.paymentMode === 'Yearly') interval = 12;

                for (let i = startMonth; i < 12; i += interval) {
                    monthlyData[i] = installment;
                    collectedThisYear += installment;
                }
            }

            const forward = anp - collectedThisYear;

            // Update Totals
            totals.anp += anp;
            totals.forward += forward;
            for (let i = 0; i < 12; i++) {
                totals.months[i] += monthlyData[i];
            }

            let html = `
                <td style="padding: 8px; color: var(--text-primary); font-weight: 500;">${client.name}</td>
                <td style="padding: 8px; text-align: right; color: var(--text-primary);">$${anp.toLocaleString()}</td>
            `;

            for (let i = 0; i < 12; i++) {
                const val = monthlyData[i];
                const color = val > 0 ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)';
                const text = val > 0 ? `$${val.toLocaleString()}` : '-';
                html += `<td style="padding: 8px; text-align: right; color: ${color};">${text}</td>`;
            }

            html += `<td style="padding: 8px; text-align: right; color: var(--accent-orange);">$${forward.toLocaleString()}</td>`;

            row.innerHTML = html;
            tbody.appendChild(row);
        });

        // Totals Row
        const totalRow = document.createElement('tr');
        totalRow.style.fontWeight = 'bold';
        totalRow.style.backgroundColor = 'rgba(255,255,255,0.05)';
        totalRow.style.borderTop = '1px solid var(--border-color)';

        let totalHtml = `
            <td style="padding: 8px; color: var(--text-primary);">TOTAL</td>
            <td style="padding: 8px; text-align: right; color: var(--text-primary);">$${totals.anp.toLocaleString()}</td>
        `;

        for (let i = 0; i < 12; i++) {
            totalHtml += `<td style="padding: 8px; text-align: right; color: var(--text-primary);">$${totals.months[i].toLocaleString()}</td>`;
        }

        totalHtml += `<td style="padding: 8px; text-align: right; color: var(--text-primary);">$${totals.forward.toLocaleString()}</td>`;

        totalRow.innerHTML = totalHtml;
        tbody.appendChild(totalRow);
    },

    renderActions() {
        const today = new Date().toISOString().split('T')[0];
        const todayContainer = this.elements.todayActionContainer;
        const dueContainer = this.elements.dueActionContainer;

        // Render Today
        if (todayContainer) {
            todayContainer.innerHTML = '';
            const todayClients = this.data.clients.filter(c => c.actionDate === today);

            if (todayClients.length === 0) {
                todayContainer.innerHTML = `
                    <div class="empty-state-box" style="padding: 15px; border: 1px dashed var(--border-color); border-radius: 8px; text-align: center; color: var(--text-secondary); font-size: 0.85rem; background: rgba(255,255,255,0.02);">
                        No actions for today
                    </div>
                `;
            } else {
                todayClients.forEach(client => {
                    todayContainer.appendChild(this.createClientCard(client));
                });
            }
        }

        // Render Due
        if (dueContainer) {
            dueContainer.innerHTML = '';
            const dueClients = this.data.clients.filter(c => c.actionDate && c.actionDate < today);
            // Sort Due Clients: Recent first (descending date)
            dueClients.sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate));

            if (dueClients.length === 0) {
                dueContainer.innerHTML = `
                    <div class="empty-state-box" style="padding: 15px; border: 1px dashed var(--border-color); border-radius: 8px; text-align: center; color: var(--text-secondary); font-size: 0.85rem; background: rgba(255,255,255,0.02);">
                        No overdue actions
                    </div>
                `;
            } else {
                dueClients.forEach(client => {
                    dueContainer.appendChild(this.createClientCard(client));
                });
            }
        }
    },

    renderSorting() {
        const container = this.elements.sortingContainer;
        if (!container) return;

        container.innerHTML = '';

        const categories = ['Lead', 'Open', 'Present', 'Close', 'Follow Up', 'Client', 'KIV'];

        categories.forEach(cat => {
            const col = document.createElement('div');
            col.className = 'category-column';
            col.innerHTML = `<div class="category-header">${cat}</div>`;

            // Filter and Sort
            const clientsInCat = this.data.clients
                .filter(c => c.stage === cat)
                .sort((a, b) => {
                    // Sort nearest future date first
                    const dateA = new Date(a.actionDate || '9999-12-31');
                    const dateB = new Date(b.actionDate || '9999-12-31');
                    return dateA - dateB;
                });

            clientsInCat.forEach(client => {
                col.appendChild(this.createClientCard(client));
            });

            container.appendChild(col);
        });
    },

    createClientCard(client) {
        const div = document.createElement('div');
        div.className = 'client-card-collapsed';
        div.innerHTML = `
            <div class="card-left">
                <span class="card-name">${client.name}</span>
                <span class="card-stage">${client.stage}</span>
                <span class="card-date">${client.actionDate}</span>
            </div>
            <div class="card-right">
                $${client.anp}
            </div>
        `;
        div.onclick = () => this.openProfile(client);
        return div;
    },

    openProfile(client) {
        const section = this.elements.profileSection;
        if (!section) return;

        section.innerHTML = `
            <div class="profile-header">
                <div class="profile-name">${client.name}</div>
                <span class="profile-stage">${client.stage}</span>
            </div>
            <div class="profile-details">
                <div class="detail-item">
                    <span class="detail-label">Product</span>
                    <span class="detail-value">${client.product || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Potential ANP</span>
                    <span class="detail-value">$${client.anp}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Action Date</span>
                    <span class="detail-value">${client.actionDate || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Contact</span>
                    <span class="detail-value">${client.contact || '-'}</span>
                </div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Notes</span>
                <div class="detail-value" style="white-space: pre-wrap;">${client.notes || '-'}</div>
            </div>
            
            <div class="history-section">
                <div class="history-header-row">
                    <span class="section-header" style="border:none; padding:0;">History</span>
                    <button class="btn-add-history" id="btn-add-history">+</button>
                </div>
                <div id="history-list"></div>
            </div>
        `;

        // Render History
        const historyList = section.querySelector('#history-list');
        if (client.history && client.history.length > 0) {
            // Sort latest first
            [...client.history].reverse().forEach((h, index) => {
                const hCard = document.createElement('div');
                hCard.className = 'history-card';
                hCard.innerHTML = `
                    <div class="history-date">${h.date}</div>
                    <div class="history-notes">${h.note}</div>
                    <button class="btn-delete-history">×</button>
                `;
                // Delete handler
                hCard.querySelector('.btn-delete-history').onclick = (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this history?')) {
                        // Index is reversed, so we need to find original index
                        const originalIndex = client.history.length - 1 - index;
                        client.history.splice(originalIndex, 1);
                        this.saveData();
                        this.openProfile(client); // Re-render
                    }
                };
                historyList.appendChild(hCard);
            });
        }

        // Add History Handler
        section.querySelector('#btn-add-history').onclick = () => {
            const note = prompt("Enter history note:");
            if (note) {
                const today = new Date().toISOString().split('T')[0];
                if (!client.history) client.history = [];
                client.history.push({ date: today, note: note });
                this.saveData();
                this.openProfile(client);
            }
        };
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    ClientApp.init();
});

// Expose to window for panel.js
window.Client = ClientApp;
