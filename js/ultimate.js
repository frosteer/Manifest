const Ultimate = {
    isCreating: false,
    tempMilestones: [], // Array of { id, title, completed, children: [] }
    tempTitle: '',
    tempDesc: '',
    tempColor: 'grey',

    render(container) {
        if (!State.goals) State.goals = [];

        // Ensure all goals have a color property
        State.goals.forEach(g => {
            if (!g.color) g.color = 'grey';
        });

        container.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid var(--border-color);">
                ${this.isCreating ? this.renderCreationForm() : '<button id="add-goal-btn" class="panel-add-btn-simple">+</button>'}
            </div>
            <div id="goals-list"></div>
        `;

        const list = document.getElementById('goals-list');
        State.goals.forEach(goal => {
            list.appendChild(this.createGoalCard(goal));
        });

        if (!this.isCreating) {
            document.getElementById('add-goal-btn').onclick = () => {
                this.isCreating = true;
                this.tempMilestones = [];
                this.tempTitle = '';
                this.tempDesc = '';
                this.tempColor = 'grey';
                this.render(container);
            };
        } else {
            this.attachFormListeners(container);
            // Auto-resize creation textarea
            const descInput = document.getElementById('new-goal-desc');
            if (descInput) {
                this.autoResize(descInput);
            }
        }
    },

    renderCreationForm() {
        const nextColor = this.tempColor === 'grey' ? 'orange' : (this.tempColor === 'orange' ? 'green' : (this.tempColor === 'green' ? 'blue' : 'grey'));

        return `
            <div class="goal-creation-form app-card goal-card color-${this.tempColor}">
                <div class="app-card-header goal-header">
                    <div class="app-card-info goal-info">
                        <input type="text" id="new-goal-title" class="goal-input-title-inline" placeholder="Goal Title" value="${this.tempTitle}" oninput="Ultimate.tempTitle = this.value">
                    </div>
                </div>
                
                <div class="app-card-body goal-body" style="display: block; margin-top: 10px;">
                    <textarea id="new-goal-desc" class="app-input-transparent goal-desc-input" placeholder="Notes..." rows="1" oninput="Ultimate.tempDesc = this.value; Ultimate.autoResize(this)">${this.tempDesc}</textarea>
                    
                    <div id="new-goal-milestones" class="goal-milestones-list">
                        ${this.renderTempMilestones(this.tempMilestones)}
                    </div>
                    
                    <button id="add-milestone-btn" class="app-add-btn goal-add-btn">+ Add Milestone</button>

                    <div class="form-actions" style="margin-top: 15px; align-items: center;">
                        <button id="cancel-goal-btn" class="modal-btn cancel">Cancel</button>
                        
                        <div class="app-btn goal-btn" onclick="Ultimate.cycleTempColor()" title="Change Color" style="margin: 0 10px; cursor: pointer;">
                            <div style="width:16px;height:16px;background:var(--accent-${nextColor});border-radius:50%; border: 1px solid rgba(255,255,255,0.3);"></div>
                        </div>

                        <button id="save-goal-btn" class="modal-btn confirm">Save</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderTempMilestones(milestones, level = 0) {
        if (!milestones) return '';
        return milestones.map((m, index) => `
            <div class="app-list-item goal-milestone-item" style="margin-left: ${level * 20}px">
                <input type="checkbox" class="app-checkbox goal-checkbox" disabled>
                <input type="text" class="app-input-transparent goal-milestone-input" value="${m.title}" onchange="Ultimate.updateTempMilestone('${m.id}', this.value)" placeholder="Milestone">
                <button onclick="Ultimate.addTempSubMilestone('${m.id}')" class="app-btn goal-sub-btn" title="Add Sub-milestone">+</button>
                <button onclick="Ultimate.removeTempMilestone('${m.id}')" class="app-btn goal-sub-btn danger">×</button>
            </div>
            ${this.renderTempMilestones(m.children, level + 1)}
        `).join('');
    },

    attachFormListeners(container) {
        document.getElementById('cancel-goal-btn').onclick = () => {
            this.isCreating = false;
            this.render(container);
        };

        document.getElementById('save-goal-btn').onclick = () => this.saveNewGoal(container);

        document.getElementById('add-milestone-btn').onclick = () => {
            this.tempMilestones.push({
                id: Utils.generateId(),
                title: '',
                completed: false,
                children: []
            });
            this.render(container);

            setTimeout(() => {
                const inputs = document.querySelectorAll('.goal-milestone-input');
                if (inputs.length > 0) inputs[inputs.length - 1].focus();
            }, 0);
        };
    },

    cycleTempColor() {
        const colors = ['grey', 'orange', 'green', 'blue'];
        const currentIndex = colors.indexOf(this.tempColor);
        this.tempColor = colors[(currentIndex + 1) % colors.length];
        this.render(document.getElementById('panel-content'));
    },

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    },

    updateTempMilestone(id, value) {
        const findAndUpdate = (list) => {
            for (let m of list) {
                if (m.id === id) {
                    m.title = value;
                    return true;
                }
                if (m.children && findAndUpdate(m.children)) return true;
            }
            return false;
        };
        findAndUpdate(this.tempMilestones);
    },

    addTempSubMilestone(parentId) {
        const findAndAdd = (list) => {
            for (let m of list) {
                if (m.id === parentId) {
                    if (!m.children) m.children = [];
                    m.children.push({
                        id: Utils.generateId(),
                        title: '',
                        completed: false,
                        children: []
                    });
                    return true;
                }
                if (m.children && findAndAdd(m.children)) return true;
            }
            return false;
        };
        findAndAdd(this.tempMilestones);
        this.render(document.getElementById('panel-content'));
    },

    removeTempMilestone(id) {
        const findAndRemove = (list) => {
            const idx = list.findIndex(m => m.id === id);
            if (idx !== -1) {
                list.splice(idx, 1);
                return true;
            }
            for (let m of list) {
                if (m.children && findAndRemove(m.children)) return true;
            }
            return false;
        };
        findAndRemove(this.tempMilestones);
        this.render(document.getElementById('panel-content'));
    },

    saveNewGoal(container) {
        this.tempTitle = document.getElementById('new-goal-title').value;
        this.tempDesc = document.getElementById('new-goal-desc').value;

        if (!this.tempTitle) {
            Modal.showAlert("Goal Title is required");
            return;
        }

        const newGoal = {
            id: Utils.generateId(),
            title: this.tempTitle,
            description: this.tempDesc,
            collapsed: true,
            color: this.tempColor,
            milestones: JSON.parse(JSON.stringify(this.tempMilestones))
        };

        State.goals.push(newGoal);
        State.saveGoals(State.goals);
        this.isCreating = false;
        this.render(container);
    },

    createGoalCard(goal) {
        const div = document.createElement('div');
        div.className = `app-card goal-card color-${goal.color} ${goal.collapsed ? 'collapsed' : ''}`;
        div.dataset.id = goal.id;

        const nextColor = goal.color === 'grey' ? 'orange' : (goal.color === 'orange' ? 'green' : (goal.color === 'green' ? 'blue' : 'grey'));

        div.innerHTML = `
            <div class="app-card-header goal-header">
                <div class="app-card-info goal-info">
                    <div class="app-card-title goal-title">${goal.title}</div>
                </div>
                <div class="app-card-controls goal-controls">
                    <button class="app-btn goal-btn" onclick="Ultimate.toggleCollapse('${goal.id}')" title="${goal.collapsed ? 'Expand' : 'Collapse'}">
                        ${goal.collapsed ? '▼' : '▲'}
                    </button>
                    <div class="app-btn goal-btn" onclick="Ultimate.cycleGoalColor('${goal.id}')" title="Change Color">
                        <div style="width:10px;height:10px;background:var(--accent-${nextColor});border-radius:50%"></div>
                    </div>
                    <button class="app-btn goal-btn delete" onclick="Ultimate.deleteGoal('${goal.id}')" title="Delete">✕</button>
                </div>
            </div>
            <div class="app-card-body goal-body">
                <textarea class="app-input-transparent goal-desc-input" oninput="Ultimate.autoResize(this)" onchange="Ultimate.updateGoalDesc('${goal.id}', this.value)" placeholder="Notes...">${goal.description || ''}</textarea>
                <div class="goal-milestones-list">
                    ${this.renderMilestones(goal.milestones, goal.id)}
                </div>
                <button class="app-add-btn goal-add-btn" onclick="Ultimate.addMilestoneToGoal('${goal.id}')">+ Add Milestone</button>
            </div>
        `;

        // Trigger auto-resize after render if expanded
        if (!goal.collapsed) {
            setTimeout(() => {
                const textarea = div.querySelector('.goal-desc-input');
                if (textarea) this.autoResize(textarea);
            }, 0);
        }

        return div;
    },

    renderMilestones(milestones, goalId, level = 0) {
        if (!milestones || milestones.length === 0) return '';
        return milestones.map(m => `
            <div class="app-list-item goal-milestone-item" style="margin-left: ${level * 20}px">
                <input type="checkbox" class="app-checkbox goal-checkbox" ${m.completed ? 'checked' : ''} 
                    onchange="Ultimate.toggleMilestone('${goalId}', '${m.id}')">
                <input type="text" class="app-input-transparent goal-milestone-input ${m.completed ? 'completed' : ''}" 
                    value="${m.title}" 
                    onchange="Ultimate.updateMilestoneTitle('${goalId}', '${m.id}', this.value)">
                <button onclick="Ultimate.deleteMilestone('${goalId}', '${m.id}')" class="app-btn goal-sub-btn danger" title="Delete Subtask">×</button>
            </div>
            ${this.renderMilestones(m.children, goalId, level + 1)}
        `).join('');
    },

    toggleCollapse(id) {
        const goal = State.goals.find(g => g.id === id);
        if (goal) {
            goal.collapsed = !goal.collapsed;
            State.saveGoals(State.goals);
            this.render(document.getElementById('panel-content'));
        }
    },

    cycleGoalColor(id) {
        const goal = State.goals.find(g => g.id === id);
        if (goal) {
            const colors = ['grey', 'orange', 'green', 'blue'];
            const currentIndex = colors.indexOf(goal.color || 'grey');
            goal.color = colors[(currentIndex + 1) % colors.length];
            State.saveGoals(State.goals);
            this.render(document.getElementById('panel-content'));
        }
    },

    deleteGoal(id) {
        Modal.show("Delete this goal?", () => {
            State.goals = State.goals.filter(g => g.id !== id);
            State.saveGoals(State.goals);
            this.render(document.getElementById('panel-content'));
        });
    },

    updateGoalDesc(id, value) {
        const goal = State.goals.find(g => g.id === id);
        if (goal) {
            goal.description = value;
            State.saveGoals(State.goals);
        }
    },

    toggleMilestone(goalId, milestoneId) {
        const goal = State.goals.find(g => g.id === goalId);
        if (goal) {
            const findAndToggle = (list) => {
                for (let m of list) {
                    if (m.id === milestoneId) {
                        m.completed = !m.completed;
                        return true;
                    }
                    if (m.children && findAndToggle(m.children)) return true;
                }
                return false;
            };
            findAndToggle(goal.milestones);
            State.saveGoals(State.goals);
            this.render(document.getElementById('panel-content'));
        }
    },

    updateMilestoneTitle(goalId, milestoneId, value) {
        const goal = State.goals.find(g => g.id === goalId);
        if (goal) {
            const findAndUpdate = (list) => {
                for (let m of list) {
                    if (m.id === milestoneId) {
                        m.title = value;
                        return true;
                    }
                    if (m.children && findAndUpdate(m.children)) return true;
                }
                return false;
            };
            findAndUpdate(goal.milestones);
            State.saveGoals(State.goals);
        }
    },

    deleteMilestone(goalId, milestoneId) {
        const goal = State.goals.find(g => g.id === goalId);
        if (goal) {
            const findAndRemove = (list) => {
                const idx = list.findIndex(m => m.id === milestoneId);
                if (idx !== -1) {
                    list.splice(idx, 1);
                    return true;
                }
                for (let m of list) {
                    if (m.children && findAndRemove(m.children)) return true;
                }
                return false;
            };
            findAndRemove(goal.milestones);
            State.saveGoals(State.goals);
            this.render(document.getElementById('panel-content'));
        }
    },

    addMilestoneToGoal(goalId) {
        const goal = State.goals.find(g => g.id === goalId);
        if (goal) {
            if (!goal.milestones) goal.milestones = [];
            goal.milestones.push({
                id: Utils.generateId(),
                title: '',
                completed: false,
                children: []
            });
            State.saveGoals(State.goals);
            this.render(document.getElementById('panel-content'));

            // Focus new input
            setTimeout(() => {
                const card = document.querySelector(`.goal-card[data-id="${goalId}"]`);
                if (card) {
                    const inputs = card.querySelectorAll('.goal-milestone-input');
                    if (inputs.length > 0) inputs[inputs.length - 1].focus();
                }
            }, 0);
        }
    }
};
