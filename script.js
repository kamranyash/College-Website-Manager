// College Essay Manager JavaScript

class EssayManager {
    constructor() {
        this.essays = this.loadEssays();
        this.colleges = this.loadColleges();
        this.currentEditingId = null;
        this.currentEditingCollegeId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayEssays();
        this.displayColleges();
        this.updateStatistics();
        this.setupWordCount();
        this.updateCollegeFilters();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Essay form
        document.getElementById('essayForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEssay();
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterEssays();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterEssays();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortEssays();
        });

        // Word count for textarea
        document.getElementById('essayContent').addEventListener('input', (e) => {
            this.updateWordCount();
        });

        // Modal close on outside click
        document.getElementById('essayModal').addEventListener('click', (e) => {
            if (e.target.id === 'essayModal') {
                this.closeModal();
            }
        });

        // Add college modal close
        document.getElementById('addCollegeModal').addEventListener('click', (e) => {
            if (e.target.id === 'addCollegeModal') {
                this.closeAddCollegeModal();
            }
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterCollegesByStatus();
        });

        // Drag and drop for essays
        this.setupDragAndDrop();
        
        // AI Assistant
        this.setupAIAssistant();
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Update statistics when viewing stats
        if (sectionName === 'stats') {
            this.updateStatistics();
        }
    }

    saveEssay() {
        const title = document.getElementById('essayTitle').value.trim();
        const category = document.getElementById('essayCategory').value;
        const deadline = document.getElementById('essayDeadline').value;
        const content = document.getElementById('essayContent').value.trim();

        if (!title || !category || !content) {
            alert('Please fill in all required fields.');
            return;
        }

        const essay = {
            id: this.currentEditingId || Date.now().toString(),
            title,
            category,
            deadline,
            content,
            collegeId: document.getElementById('essayCollege').value || '',
            wordCount: this.countWords(content),
            createdAt: this.currentEditingId ? 
                this.essays.find(e => e.id === this.currentEditingId).createdAt : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditingId) {
            // Update existing essay
            const index = this.essays.findIndex(e => e.id === this.currentEditingId);
            this.essays[index] = essay;
            this.currentEditingId = null;
        } else {
            // Add new essay
            this.essays.push(essay);
        }

        this.saveEssays();
        this.displayEssays();
        this.displayColleges();
        this.updateStatistics();
        this.clearForm();
        this.showSection('essays');
        
        // Show success message
        this.showNotification('Essay saved successfully!', 'success');
    }

    deleteEssay() {
        if (!this.currentEditingId) return;

        if (confirm('Are you sure you want to delete this essay? This action cannot be undone.')) {
            this.essays = this.essays.filter(e => e.id !== this.currentEditingId);
            this.saveEssays();
            this.displayEssays();
            this.updateStatistics();
            this.closeModal();
            this.showNotification('Essay deleted successfully!', 'success');
        }
    }

    editEssay() {
        if (!this.currentEditingId) return;

        const essay = this.essays.find(e => e.id === this.currentEditingId);
        if (!essay) return;

        // Fill form with essay data
        document.getElementById('essayTitle').value = essay.title;
        document.getElementById('essayCategory').value = essay.category;
        document.getElementById('essayDeadline').value = essay.deadline || '';
        document.getElementById('essayContent').value = essay.content;
        document.getElementById('essayCollege').value = essay.collegeId || '';

        this.updateWordCount();
        this.closeModal();
        this.showSection('new');
    }

    displayEssays() {
        const grid = document.getElementById('essaysGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.essays.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = this.essays.map(essay => `
            <div class="essay-card" onclick="essayManager.openEssay('${essay.id}')" draggable="true" data-essay-id="${essay.id}">
                <h3>${this.escapeHtml(essay.title)}</h3>
                <div class="essay-preview">${this.escapeHtml(essay.content.substring(0, 150))}${essay.content.length > 150 ? '...' : ''}</div>
                <div class="essay-meta">
                    <span class="category-badge">${this.getCategoryDisplayName(essay.category)}</span>
                    ${essay.collegeId ? `<span class="college-badge">${this.escapeHtml(this.colleges.find(c => c.id === essay.collegeId)?.name || 'Unknown College')}</span>` : ''}
                    <span class="word-count-badge">${essay.wordCount} words</span>
                    <span class="date-badge">${this.formatDate(essay.updatedAt)}</span>
                </div>
            </div>
        `).join('');
    }

    openEssay(id) {
        const essay = this.essays.find(e => e.id === id);
        if (!essay) return;

        this.currentEditingId = id;
        
        document.getElementById('modalTitle').textContent = essay.title;
        document.getElementById('modalCategory').textContent = this.getCategoryDisplayName(essay.category);
        document.getElementById('modalWordCount').textContent = `${essay.wordCount} words`;
        document.getElementById('modalDate').textContent = `Updated: ${this.formatDate(essay.updatedAt)}`;
        document.getElementById('modalContent').textContent = essay.content;

        document.getElementById('essayModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('essayModal').classList.remove('show');
        this.currentEditingId = null;
    }

    filterEssays() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const collegeFilter = document.getElementById('collegeFilter').value;

        let filteredEssays = this.essays.filter(essay => {
            const matchesSearch = essay.title.toLowerCase().includes(searchTerm) || 
                                essay.content.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || essay.category === categoryFilter;
            const matchesCollege = !collegeFilter || essay.collegeId === collegeFilter;
            return matchesSearch && matchesCategory && matchesCollege;
        });

        this.displayFilteredEssays(filteredEssays);
    }

    sortEssays() {
        const sortBy = document.getElementById('sortBy').value;
        let sortedEssays = [...this.essays];

        switch (sortBy) {
            case 'title':
                sortedEssays.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'wordCount':
                sortedEssays.sort((a, b) => b.wordCount - a.wordCount);
                break;
            case 'date':
            default:
                sortedEssays.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
        }

        this.displayFilteredEssays(sortedEssays);
    }

    displayFilteredEssays(essays) {
        const grid = document.getElementById('essaysGrid');
        const emptyState = document.getElementById('emptyState');

        if (essays.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No essays found</h3>
                <p>Try adjusting your search or filter criteria.</p>
            `;
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = essays.map(essay => `
            <div class="essay-card" onclick="essayManager.openEssay('${essay.id}')">
                <h3>${this.escapeHtml(essay.title)}</h3>
                <div class="essay-preview">${this.escapeHtml(essay.content.substring(0, 150))}${essay.content.length > 150 ? '...' : ''}</div>
                <div class="essay-meta">
                    <span class="category-badge">${this.getCategoryDisplayName(essay.category)}</span>
                    <span class="word-count-badge">${essay.wordCount} words</span>
                    <span class="date-badge">${this.formatDate(essay.updatedAt)}</span>
                </div>
            </div>
        `).join('');
    }

    updateStatistics() {
        const totalEssays = this.essays.length;
        const totalWords = this.essays.reduce((sum, essay) => sum + essay.wordCount, 0);
        const completedEssays = this.essays.filter(essay => essay.content.length > 100).length;
        const avgWords = totalEssays > 0 ? Math.round(totalWords / totalEssays) : 0;

        document.getElementById('totalEssays').textContent = totalEssays;
        document.getElementById('totalWords').textContent = totalWords.toLocaleString();
        document.getElementById('completedEssays').textContent = completedEssays;
        document.getElementById('avgWords').textContent = avgWords;

        this.updateCategoryChart();
        this.updateCollegeChart();
    }

    updateCategoryChart() {
        const categoryCounts = {};
        this.essays.forEach(essay => {
            categoryCounts[essay.category] = (categoryCounts[essay.category] || 0) + 1;
        });

        const chartContainer = document.getElementById('categoryChart');
        chartContainer.innerHTML = Object.entries(categoryCounts).map(([category, count]) => `
            <div class="category-item">
                <span class="category-name">${this.getCategoryDisplayName(category)}</span>
                <span class="category-count">${count}</span>
            </div>
        `).join('');

        if (Object.keys(categoryCounts).length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 2rem;">No essays yet</p>';
        }
    }

    updateCollegeChart() {
        const collegeCounts = {};
        this.essays.forEach(essay => {
            if (essay.collegeId) {
                const college = this.colleges.find(c => c.id === essay.collegeId);
                const collegeName = college ? college.name : 'Unknown College';
                collegeCounts[collegeName] = (collegeCounts[collegeName] || 0) + 1;
            }
        });

        const chartContainer = document.getElementById('collegeChart');
        chartContainer.innerHTML = Object.entries(collegeCounts).map(([collegeName, count]) => `
            <div class="college-item">
                <span class="college-name">${this.escapeHtml(collegeName)}</span>
                <span class="college-count">${count}</span>
            </div>
        `).join('');

        if (Object.keys(collegeCounts).length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 2rem;">No essays assigned to colleges yet</p>';
        }
    }

    setupWordCount() {
        this.updateWordCount();
    }

    updateWordCount() {
        const content = document.getElementById('essayContent').value;
        const wordCount = this.countWords(content);
        document.getElementById('wordCount').textContent = `${wordCount} words`;
    }

    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    clearForm() {
        document.getElementById('essayForm').reset();
        document.getElementById('essayContent').value = '';
        this.updateWordCount();
        this.currentEditingId = null;
    }

    saveDraft() {
        const title = document.getElementById('essayTitle').value.trim();
        const category = document.getElementById('essayCategory').value;
        const deadline = document.getElementById('essayDeadline').value;
        const content = document.getElementById('essayContent').value.trim();

        if (!title || !content) {
            alert('Please enter at least a title and some content to save as draft.');
            return;
        }

        const draft = {
            id: `draft_${Date.now()}`,
            title: title || 'Untitled Draft',
            category: category || 'other',
            deadline,
            content,
            wordCount: this.countWords(content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDraft: true
        };

        this.essays.push(draft);
        this.saveEssays();
        this.displayEssays();
        this.showNotification('Draft saved successfully!', 'success');
    }

    clearEssay() {
        if (confirm('Are you sure you want to clear the essay content? This action cannot be undone.')) {
            document.getElementById('essayContent').value = '';
            this.updateWordCount();
        }
    }

    // Utility functions
    getCategoryDisplayName(category) {
        const categoryNames = {
            'personal': 'Personal Statement',
            'supplemental': 'Supplemental',
            'scholarship': 'Scholarship',
            'other': 'Other'
        };
        return categoryNames[category] || category;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#667eea'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // College Management Methods
    displayColleges() {
        const grid = document.getElementById('collegesGrid');
        const emptyState = document.getElementById('collegesEmptyState');

        if (this.colleges.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = this.colleges.map(college => {
            const collegeEssays = this.essays.filter(essay => essay.collegeId === college.id);
            return `
                <div class="college-card">
                    <div class="college-header">
                        <div>
                            <div class="college-name">${this.escapeHtml(college.name)}</div>
                            <div class="college-location">${this.escapeHtml(college.location || '')}</div>
                        </div>
                        <div class="college-actions">
                            <button class="btn btn-secondary btn-small" onclick="essayManager.editCollege('${college.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-small" onclick="essayManager.deleteCollege('${college.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="college-status-section">
                        <div class="college-status-info">
                            <span class="college-status-label">Application Status</span>
                            <span class="status-badge status-${college.status || 'not-started'}">${this.getStatusDisplayName(college.status || 'not-started')}</span>
                        </div>
                        <div class="college-status-actions">
                            ${this.getStatusUpdateButtons(college.status || 'not-started', college.id)}
                        </div>
                    </div>
                    
                    <div class="status-progress">
                        <div class="status-progress-bar status-progress-${college.status || 'not-started'}"></div>
                    </div>
                    
                    <div class="college-info">
                        ${college.deadline ? `<div class="college-deadline">Deadline: ${this.formatDate(college.deadline)}</div>` : ''}
                        ${college.notes ? `<div class="college-notes">${this.escapeHtml(college.notes)}</div>` : ''}
                    </div>
                    
                    <div class="college-essays">
                        <h4><i class="fas fa-file-alt"></i> Essays (${collegeEssays.length})</h4>
                        <div class="essay-drop-zone" data-college-id="${college.id}" ondrop="essayManager.dropEssay(event)" ondragover="essayManager.allowDrop(event)" ondragleave="essayManager.removeDragOver(event)">
                            <i class="fas fa-plus"></i>
                            <div>Drop essays here or click to assign</div>
                        </div>
                        ${collegeEssays.map(essay => `
                            <div class="college-essay-item" draggable="true" data-essay-id="${essay.id}" ondragstart="essayManager.dragEssay(event)">
                                <div class="essay-item-info">
                                    <div class="essay-item-title">${this.escapeHtml(essay.title)}</div>
                                    <div class="essay-item-meta">${this.getCategoryDisplayName(essay.category)} • ${essay.wordCount} words</div>
                                </div>
                                <div class="essay-item-actions">
                                    <button class="btn-icon" onclick="essayManager.openEssay('${essay.id}')" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="essayManager.removeEssayFromCollege('${essay.id}')" title="Remove">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    showAddCollegeModal() {
        document.getElementById('addCollegeModal').classList.add('show');
        document.getElementById('collegeName').focus();
    }

    closeAddCollegeModal() {
        document.getElementById('addCollegeModal').classList.remove('show');
        document.getElementById('addCollegeForm').reset();
        this.currentEditingCollegeId = null;
    }

    saveCollege() {
        const name = document.getElementById('collegeName').value.trim();
        const location = document.getElementById('collegeLocation').value.trim();
        const deadline = document.getElementById('collegeDeadline').value;
        const status = document.getElementById('collegeStatus').value;
        const notes = document.getElementById('collegeNotes').value.trim();

        if (!name) {
            alert('Please enter a college name.');
            return;
        }

        if (!status) {
            alert('Please select an application status.');
            return;
        }

        const college = {
            id: this.currentEditingCollegeId || Date.now().toString(),
            name,
            location,
            deadline,
            status,
            notes,
            createdAt: this.currentEditingCollegeId ? 
                this.colleges.find(c => c.id === this.currentEditingCollegeId).createdAt : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditingCollegeId) {
            // Update existing college
            const index = this.colleges.findIndex(c => c.id === this.currentEditingCollegeId);
            this.colleges[index] = college;
            this.currentEditingCollegeId = null;
        } else {
            // Add new college
            this.colleges.push(college);
        }

        this.saveColleges();
        this.displayColleges();
        this.updateCollegeFilters();
        this.closeAddCollegeModal();
        this.showNotification('College saved successfully!', 'success');
    }

    editCollege(collegeId) {
        const college = this.colleges.find(c => c.id === collegeId);
        if (!college) return;

        this.currentEditingCollegeId = collegeId;
        document.getElementById('collegeName').value = college.name;
        document.getElementById('collegeLocation').value = college.location || '';
        document.getElementById('collegeDeadline').value = college.deadline || '';
        document.getElementById('collegeStatus').value = college.status || '';
        document.getElementById('collegeNotes').value = college.notes || '';

        this.showAddCollegeModal();
    }

    deleteCollege(collegeId) {
        const college = this.colleges.find(c => c.id === collegeId);
        if (!college) return;

        const collegeEssays = this.essays.filter(essay => essay.collegeId === collegeId);
        
        if (collegeEssays.length > 0) {
            if (!confirm(`This college has ${collegeEssays.length} essay(s) assigned to it. Are you sure you want to delete it? The essays will be unassigned.`)) {
                return;
            }
            
            // Remove college assignment from essays
            collegeEssays.forEach(essay => {
                essay.collegeId = '';
            });
            this.saveEssays();
        }

        this.colleges = this.colleges.filter(c => c.id !== collegeId);
        this.saveColleges();
        this.displayColleges();
        this.updateCollegeFilters();
        this.updateStatistics();
        this.showNotification('College deleted successfully!', 'success');
    }

    updateCollegeFilters() {
        const collegeFilter = document.getElementById('collegeFilter');
        const essayCollege = document.getElementById('essayCollege');
        
        // Update college filter in essays section
        collegeFilter.innerHTML = '<option value="">All Colleges</option>' + 
            this.colleges.map(college => 
                `<option value="${college.id}">${this.escapeHtml(college.name)}</option>`
            ).join('');
        
        // Update college select in new essay form
        essayCollege.innerHTML = '<option value="">Select college...</option>' + 
            this.colleges.map(college => 
                `<option value="${college.id}">${this.escapeHtml(college.name)}</option>`
            ).join('');
    }

    // Drag and Drop functionality
    setupDragAndDrop() {
        // Make essay cards draggable
        this.updateEssayDragAndDrop();
    }

    updateEssayDragAndDrop() {
        document.querySelectorAll('.essay-card').forEach(card => {
            card.draggable = true;
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.essayId || '');
            });
        });
    }

    allowDrop(ev) {
        ev.preventDefault();
        ev.currentTarget.classList.add('drag-over');
    }

    removeDragOver(ev) {
        ev.currentTarget.classList.remove('drag-over');
    }

    dropEssay(ev) {
        ev.preventDefault();
        ev.currentTarget.classList.remove('drag-over');
        
        const collegeId = ev.currentTarget.dataset.collegeId;
        const essayId = ev.dataTransfer.getData('text/plain');
        
        if (essayId && collegeId) {
            this.assignEssayToCollege(essayId, collegeId);
        }
    }

    dragEssay(ev) {
        ev.dataTransfer.setData('text/plain', ev.target.dataset.essayId);
    }

    assignEssayToCollege(essayId, collegeId) {
        const essay = this.essays.find(e => e.id === essayId);
        if (!essay) return;

        essay.collegeId = collegeId;
        essay.updatedAt = new Date().toISOString();
        
        this.saveEssays();
        this.displayEssays();
        this.displayColleges();
        this.updateStatistics();
        this.showNotification('Essay assigned to college!', 'success');
    }

    removeEssayFromCollege(essayId) {
        const essay = this.essays.find(e => e.id === essayId);
        if (!essay) return;

        essay.collegeId = '';
        essay.updatedAt = new Date().toISOString();
        
        this.saveEssays();
        this.displayEssays();
        this.displayColleges();
        this.updateStatistics();
        this.showNotification('Essay removed from college!', 'success');
    }

    // Status Management Methods
    getStatusDisplayName(status) {
        const statusNames = {
            'not-started': 'Not Started',
            'in-progress': 'In Progress',
            'submitted': 'Submitted',
            'accepted': 'Accepted',
            'waitlisted': 'Waitlisted',
            'rejected': 'Rejected'
        };
        return statusNames[status] || 'Not Started';
    }

    getStatusUpdateButtons(currentStatus, collegeId) {
        const buttons = [];
        
        switch (currentStatus) {
            case 'not-started':
                buttons.push(`<button class="status-update-btn warning" onclick="essayManager.updateCollegeStatus('${collegeId}', 'in-progress')">
                    <i class="fas fa-play"></i> Start Application
                </button>`);
                break;
            case 'in-progress':
                buttons.push(`<button class="status-update-btn success" onclick="essayManager.updateCollegeStatus('${collegeId}', 'submitted')">
                    <i class="fas fa-check"></i> Mark Submitted
                </button>`);
                break;
            case 'submitted':
                buttons.push(`<button class="status-update-btn success" onclick="essayManager.updateCollegeStatus('${collegeId}', 'accepted')">
                    <i class="fas fa-trophy"></i> Accepted
                </button>`);
                buttons.push(`<button class="status-update-btn warning" onclick="essayManager.updateCollegeStatus('${collegeId}', 'waitlisted')">
                    <i class="fas fa-clock"></i> Waitlisted
                </button>`);
                buttons.push(`<button class="status-update-btn danger" onclick="essayManager.updateCollegeStatus('${collegeId}', 'rejected')">
                    <i class="fas fa-times"></i> Rejected
                </button>`);
                break;
            case 'accepted':
                buttons.push(`<button class="status-update-btn" onclick="essayManager.updateCollegeStatus('${collegeId}', 'submitted')">
                    <i class="fas fa-undo"></i> Back to Submitted
                </button>`);
                break;
            case 'waitlisted':
                buttons.push(`<button class="status-update-btn success" onclick="essayManager.updateCollegeStatus('${collegeId}', 'accepted')">
                    <i class="fas fa-trophy"></i> Accepted
                </button>`);
                buttons.push(`<button class="status-update-btn danger" onclick="essayManager.updateCollegeStatus('${collegeId}', 'rejected')">
                    <i class="fas fa-times"></i> Rejected
                </button>`);
                break;
            case 'rejected':
                buttons.push(`<button class="status-update-btn" onclick="essayManager.updateCollegeStatus('${collegeId}', 'submitted')">
                    <i class="fas fa-undo"></i> Back to Submitted
                </button>`);
                break;
        }
        
        return buttons.join('');
    }

    updateCollegeStatus(collegeId, newStatus) {
        const college = this.colleges.find(c => c.id === collegeId);
        if (!college) return;

        college.status = newStatus;
        college.updatedAt = new Date().toISOString();
        
        this.saveColleges();
        this.displayColleges();
        this.updateStatistics();
        
        const statusName = this.getStatusDisplayName(newStatus);
        this.showNotification(`Updated ${college.name} status to: ${statusName}`, 'success');
    }

    filterCollegesByStatus() {
        const statusFilter = document.getElementById('statusFilter').value;
        let filteredColleges = this.colleges;

        if (statusFilter) {
            filteredColleges = this.colleges.filter(college => college.status === statusFilter);
        }

        this.displayFilteredColleges(filteredColleges);
    }

    displayFilteredColleges(colleges) {
        const grid = document.getElementById('collegesGrid');
        const emptyState = document.getElementById('collegesEmptyState');

        if (colleges.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-filter"></i>
                <h3>No colleges found</h3>
                <p>Try adjusting your status filter or add more colleges.</p>
            `;
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = colleges.map(college => {
            const collegeEssays = this.essays.filter(essay => essay.collegeId === college.id);
            return `
                <div class="college-card">
                    <div class="college-header">
                        <div>
                            <div class="college-name">${this.escapeHtml(college.name)}</div>
                            <div class="college-location">${this.escapeHtml(college.location || '')}</div>
                        </div>
                        <div class="college-actions">
                            <button class="btn btn-secondary btn-small" onclick="essayManager.editCollege('${college.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-small" onclick="essayManager.deleteCollege('${college.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="college-status-section">
                        <div class="college-status-info">
                            <span class="college-status-label">Application Status</span>
                            <span class="status-badge status-${college.status || 'not-started'}">${this.getStatusDisplayName(college.status || 'not-started')}</span>
                        </div>
                        <div class="college-status-actions">
                            ${this.getStatusUpdateButtons(college.status || 'not-started', college.id)}
                        </div>
                    </div>
                    
                    <div class="status-progress">
                        <div class="status-progress-bar status-progress-${college.status || 'not-started'}"></div>
                    </div>
                    
                    <div class="college-info">
                        ${college.deadline ? `<div class="college-deadline">Deadline: ${this.formatDate(college.deadline)}</div>` : ''}
                        ${college.notes ? `<div class="college-notes">${this.escapeHtml(college.notes)}</div>` : ''}
                    </div>
                    
                    <div class="college-essays">
                        <h4><i class="fas fa-file-alt"></i> Essays (${collegeEssays.length})</h4>
                        <div class="essay-drop-zone" data-college-id="${college.id}" ondrop="essayManager.dropEssay(event)" ondragover="essayManager.allowDrop(event)" ondragleave="essayManager.removeDragOver(event)">
                            <i class="fas fa-plus"></i>
                            <div>Drop essays here or click to assign</div>
                        </div>
                        ${collegeEssays.map(essay => `
                            <div class="college-essay-item" draggable="true" data-essay-id="${essay.id}" ondragstart="essayManager.dragEssay(event)">
                                <div class="essay-item-info">
                                    <div class="essay-item-title">${this.escapeHtml(essay.title)}</div>
                                    <div class="essay-item-meta">${this.getCategoryDisplayName(essay.category)} • ${essay.wordCount} words</div>
                                </div>
                                <div class="essay-item-actions">
                                    <button class="btn-icon" onclick="essayManager.openEssay('${essay.id}')" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="essayManager.removeEssayFromCollege('${essay.id}')" title="Remove">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Export functionality
    exportEssays() {
        const dataStr = JSON.stringify(this.essays, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `college-essays-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showNotification('Essays exported successfully!', 'success');
    }

    importEssays(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedEssays = JSON.parse(e.target.result);
                if (Array.isArray(importedEssays)) {
                    this.essays = [...this.essays, ...importedEssays];
                    this.saveEssays();
                    this.displayEssays();
                    this.updateStatistics();
                    this.showNotification('Essays imported successfully!', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing essays. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Local storage functions
    saveEssays() {
        localStorage.setItem('collegeEssays', JSON.stringify(this.essays));
    }

    loadEssays() {
        const saved = localStorage.getItem('collegeEssays');
        return saved ? JSON.parse(saved) : [];
    }

    saveColleges() {
        localStorage.setItem('collegeColleges', JSON.stringify(this.colleges));
    }

    loadColleges() {
        const saved = localStorage.getItem('collegeColleges');
        return saved ? JSON.parse(saved) : [];
    }

    // AI Writing Assistant Methods
    setupAIAssistant() {
        // Handle Enter key in AI input
        document.getElementById('aiInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAIMessage();
            }
        });
    }

    toggleAIAssistant() {
        const assistant = document.getElementById('aiAssistant');
        assistant.classList.toggle('show');
    }

    sendAIMessage(message = null) {
        const input = document.getElementById('aiInput');
        const chat = document.getElementById('aiChat');
        const messageText = message || input.value.trim();
        
        if (!messageText) return;

        // Add user message
        this.addUserMessage(messageText);
        
        // Clear input if not using predefined message
        if (!message) {
            input.value = '';
        }

        // Show typing indicator
        this.showTypingIndicator();

        // Simulate AI response after a delay
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateAIResponse(messageText);
            this.addAIMessage(response);
        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
    }

    addUserMessage(message) {
        const chat = document.getElementById('aiChat');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    addAIMessage(message) {
        const chat = document.getElementById('aiChat');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message';
        
        // Check if message contains HTML
        if (message.includes('<div') || message.includes('<button')) {
            messageDiv.innerHTML = `
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-content">
                    ${message}
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-content">
                    <p>${message}</p>
                </div>
            `;
        }
        
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    showTypingIndicator() {
        const chat = document.getElementById('aiChat');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="ai-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chat.appendChild(typingDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();
        const essayContent = document.getElementById('essayContent').value;
        const essayTitle = document.getElementById('essayTitle').value;
        const essayCategory = document.getElementById('essayCategory').value;

        // Essay analysis responses
        if (message.includes('analyze') || message.includes('analysis')) {
            return this.getEssayAnalysisResponse(essayContent, essayTitle, essayCategory);
        }

        // Grammar and style check responses
        if (message.includes('grammar') || message.includes('style') || message.includes('check')) {
            return this.getGrammarCheckResponse(essayContent);
        }

        // Writing enhancement responses
        if (message.includes('enhance') || message.includes('engaging') || message.includes('specific')) {
            return this.getWritingEnhancementResponse(essayContent);
        }

        // Brainstorming responses
        if (message.includes('brainstorm') || message.includes('ideas')) {
            return this.getBrainstormingResponse(essayCategory);
        }

        // Writing improvement responses
        if (message.includes('improve') || message.includes('better')) {
            return this.getWritingImprovementResponse(essayContent);
        }

        // Essay tips responses
        if (message.includes('tips') || message.includes('strong') || message.includes('good')) {
            return this.getEssayTipsResponse(essayCategory);
        }

        // Opening paragraph responses
        if (message.includes('opening') || message.includes('beginning') || message.includes('start')) {
            return this.getOpeningResponse(essayCategory);
        }

        // Conclusion responses
        if (message.includes('conclusion') || message.includes('ending') || message.includes('conclude')) {
            return this.getConclusionResponse(essayCategory);
        }

        // Essay review responses
        if (message.includes('review') || message.includes('clarity')) {
            return this.getEssayReviewResponse(essayContent);
        }

        // General help responses
        if (message.includes('help') || message.includes('what') || message.includes('how')) {
            return this.getGeneralHelpResponse();
        }

        // Default response
        return this.getDefaultResponse();
    }

    getBrainstormingResponse(category) {
        const responses = {
            'personal': `Here are some brainstorming ideas for your personal statement:

• Reflect on a significant challenge you've overcome
• Describe a moment that changed your perspective
• Share how a hobby or interest has shaped your character
• Discuss a person who has influenced your values
• Write about a failure that taught you important lessons
• Explore how your background has shaped your worldview

Remember: Choose a topic that genuinely matters to you and shows your unique perspective!`,
            
            'supplemental': `Great! For supplemental essays, consider these approaches:

• Answer the specific prompt directly and authentically
• Use concrete examples and specific details
• Show, don't tell - use stories and anecdotes
• Connect your experiences to the college's values
• Be specific about why this college appeals to you
• Keep it focused and concise

What specific supplemental prompt are you working on?`,
            
            'scholarship': `For scholarship essays, focus on these key elements:

• Clearly state your academic and career goals
• Explain how the scholarship will help you achieve them
• Demonstrate financial need (if applicable)
• Highlight your community service and leadership
• Show how you'll give back after graduation
• Be specific about your future plans

What scholarship are you applying for?`,
            
            'other': `Here are some general brainstorming techniques:

• Free-write for 10 minutes without stopping
• Create a mind map of your experiences
• List your proudest achievements
• Think about what makes you unique
• Consider challenges you've overcome
• Reflect on your values and beliefs

What type of essay are you working on?`
        };
        
        return responses[category] || responses['other'];
    }

    getWritingImprovementResponse(content) {
        if (!content || content.length < 50) {
            return `I'd be happy to help improve your writing! However, I don't see much content in your essay yet. Try writing a few paragraphs first, then ask me to review it. 

Here are some general tips for engaging writing:
• Use specific examples and details
• Show emotions and reactions
• Include dialogue when appropriate
• Use varied sentence structures
• Write in your authentic voice

Keep writing, and I'll help you polish it!`;
        }

        const wordCount = this.countWords(content);
        let response = `I can see you have ${wordCount} words so far. Here are some ways to make your writing more engaging:\n\n`;

        if (content.includes('I think') || content.includes('I believe')) {
            response += `• Try removing "I think" and "I believe" - be more direct\n`;
        }
        
        if (content.split('.').length < 3) {
            response += `• Vary your sentence lengths - mix short and long sentences\n`;
        }
        
        if (!content.includes('"') && !content.includes("'")) {
            response += `• Consider adding dialogue or quotes to bring your story to life\n`;
        }

        response += `• Use specific, concrete details instead of general statements
• Show your emotions and reactions
• Include sensory details (what you saw, heard, felt)
• Make sure each paragraph has a clear purpose

Would you like me to review a specific section of your essay?`;

        return response;
    }

    getEssayTipsResponse(category) {
        const tips = {
            'personal': `Strong personal statements typically include:

✓ A compelling opening that draws readers in
✓ A clear narrative arc with beginning, middle, and end
✓ Specific examples and concrete details
✓ Reflection on what you learned or how you grew
✓ Your authentic voice and personality
✓ A strong conclusion that ties everything together

Focus on showing, not telling. Let your experiences speak for themselves!`,
            
            'supplemental': `Effective supplemental essays should:

✓ Answer the specific prompt completely
✓ Be authentic and personal
✓ Show knowledge of the college
✓ Connect your experiences to the school's values
✓ Be concise and well-organized
✓ Demonstrate fit with the institution

Make sure you're answering what they're actually asking!`,
            
            'scholarship': `Strong scholarship essays include:

✓ Clear statement of your goals
✓ Explanation of financial need (if applicable)
✓ Examples of leadership and service
✓ Specific plans for the future
✓ How you'll give back to others
✓ Professional yet personal tone

Be specific about your plans and how the scholarship helps achieve them.`,
            
            'other': `General tips for strong essays:

✓ Start with a compelling hook
✓ Use specific examples and details
✓ Show your personality and voice
✓ Organize ideas logically
✓ Proofread carefully
✓ Stay within word limits
✓ Be authentic and honest

What specific aspect would you like help with?`
        };
        
        return tips[category] || tips['other'];
    }

    getOpeningResponse(category) {
        return `Here are some strategies for strong opening paragraphs:

**For ${this.getCategoryDisplayName(category)} essays:**

• Start with a specific moment or scene
• Use dialogue or a quote
• Begin with a surprising statement or fact
• Describe a sensory detail
• Ask a thought-provoking question
• Start in the middle of action

**Example approaches:**
- "The sound of the buzzer echoed through the gymnasium as I realized I had just made the biggest mistake of my basketball career."
- "Three words changed my perspective on failure: 'Try again tomorrow.'"
- "The smell of old books and coffee filled the library as I discovered my passion for research."

What's your essay about? I can help you craft a specific opening!`;
    }

    getConclusionResponse(category) {
        return `Here are effective ways to conclude your ${this.getCategoryDisplayName(category)} essay:

• Circle back to your opening (full circle ending)
• Reflect on what you learned or how you grew
• Connect to your future goals
• End with a powerful image or metaphor
• Ask a forward-looking question
• End with a strong, memorable statement

**Avoid:**
- Summarizing your entire essay
- Introducing new information
- Generic statements like "In conclusion"
- Overly dramatic or clichéd endings

**Example endings:**
- "That day taught me that failure isn't the opposite of success—it's a stepping stone to it."
- "Now, as I prepare for college, I carry that lesson with me: sometimes the best path forward is the one you never planned to take."

What's the main message you want to leave readers with?`;
    }

    getEssayReviewResponse(content) {
        if (!content || content.length < 50) {
            return `I'd love to review your essay! However, I don't see much content yet. Try writing a few paragraphs first, then I can help you check for:

• Clarity and flow
• Grammar and style
• Organization
• Specificity and detail
• Authentic voice

Keep writing, and I'll be here to help you polish it!`;
        }

        const wordCount = this.countWords(content);
        let response = `I've reviewed your ${wordCount}-word essay. Here's my feedback:\n\n`;

        // Check for common issues
        if (content.includes('I think') || content.includes('I believe')) {
            response += `⚠️ Remove "I think" and "I believe" - be more direct\n`;
        }
        
        if (content.split('.').length < 5) {
            response += `⚠️ Vary your sentence lengths for better flow\n`;
        }
        
        if (!content.includes('"') && !content.includes("'")) {
            response += `💡 Consider adding dialogue or quotes\n`;
        }

        response += `\n**Strengths I noticed:**\n`;
        response += `✓ You have a good foundation to build on\n`;
        response += `✓ The content shows your personal experience\n\n`;
        
        response += `**Suggestions for improvement:**\n`;
        response += `• Add more specific details and examples\n`;
        response += `• Show emotions and reactions\n`;
        response += `• Use sensory details (sights, sounds, feelings)\n`;
        response += `• Make sure each paragraph has a clear purpose\n\n`;
        
        response += `Would you like me to focus on a specific section or aspect?`;

        return response;
    }

    getGeneralHelpResponse() {
        return `I'm here to help with your college essays! I can assist with:

**Brainstorming & Planning:**
• Generating topic ideas
• Outlining your essay structure
• Finding your unique angle

**Writing & Style:**
• Improving clarity and flow
• Making your writing more engaging
• Strengthening your voice

**Specific Elements:**
• Crafting strong openings
• Writing effective conclusions
• Adding specific details

**Review & Feedback:**
• Checking organization
• Identifying areas for improvement
• Ensuring authenticity

What would you like help with today?`;
    }

    getDefaultResponse() {
        const responses = [
            "That's an interesting question! Could you tell me more about what specific aspect of essay writing you'd like help with?",
            "I'd be happy to help! What part of your essay are you working on right now?",
            "Great question! Are you looking for help with brainstorming, writing, or reviewing your essay?",
            "I'm here to help with your college essays! What would you like to focus on today?",
            "That's a good point! Could you be more specific about what you'd like assistance with?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Enhanced AI Analysis Methods
    getEssayAnalysisResponse(content, title, category) {
        if (!content || content.length < 50) {
            return `I'd love to analyze your essay! However, I don't see much content yet. Try writing a few paragraphs first, then I can provide a comprehensive analysis.

Here's what I can analyze once you have content:
• Overall structure and organization
• Word count and readability
• Specificity and detail level
• Voice and authenticity
• Areas for improvement

Keep writing, and I'll give you detailed feedback!`;
        }

        const wordCount = this.countWords(content);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        const avgWordsPerSentence = Math.round(wordCount / sentences.length);
        
        let analysisHTML = `
            <div class="ai-analysis-summary">
                <h4>📊 Essay Analysis Summary</h4>
                <div class="ai-analysis-stats">
                    <div class="ai-stat-item">
                        <span class="ai-stat-value">${wordCount}</span>
                        <span class="ai-stat-label">Words</span>
                    </div>
                    <div class="ai-stat-item">
                        <span class="ai-stat-value">${sentences.length}</span>
                        <span class="ai-stat-label">Sentences</span>
                    </div>
                    <div class="ai-stat-item">
                        <span class="ai-stat-value">${paragraphs.length}</span>
                        <span class="ai-stat-label">Paragraphs</span>
                    </div>
                    <div class="ai-stat-item">
                        <span class="ai-stat-value">${avgWordsPerSentence}</span>
                        <span class="ai-stat-label">Avg/Sentence</span>
                    </div>
                </div>
            </div>
        `;

        // Add specific suggestions
        const suggestions = this.generateEssaySuggestions(content, category);
        suggestions.forEach(suggestion => {
            analysisHTML += this.createSuggestionHTML(suggestion);
        });

        return analysisHTML;
    }

    getGrammarCheckResponse(content) {
        if (!content || content.length < 50) {
            return `I'd be happy to check your grammar and style! However, I don't see much content yet. Try writing a few paragraphs first, then I can help you with:

• Grammar and punctuation
• Sentence structure
• Word choice and clarity
• Style consistency
• Common writing mistakes

Keep writing, and I'll help you polish it!`;
        }

        const issues = this.findGrammarIssues(content);
        let response = `I've analyzed your essay for grammar and style issues. Here's what I found:\n\n`;

        if (issues.length === 0) {
            response += `✅ **Great news!** Your essay looks good from a grammar and style perspective. I didn't find any major issues.\n\n`;
            response += `**Strengths I noticed:**\n`;
            response += `• Good sentence variety\n`;
            response += `• Proper punctuation usage\n`;
            response += `• Clear and readable style\n\n`;
            response += `Keep up the excellent work!`;
        } else {
            response += `I found ${issues.length} area(s) that could be improved:\n\n`;
            
            issues.forEach((issue, index) => {
                response += `${index + 1}. **${issue.type}**: ${issue.description}\n`;
                if (issue.suggestion) {
                    response += `   💡 Suggestion: ${issue.suggestion}\n`;
                }
                response += `\n`;
            });
        }

        return response;
    }

    getWritingEnhancementResponse(content) {
        if (!content || content.length < 50) {
            return `I'd love to help enhance your writing! However, I don't see much content yet. Try writing a few paragraphs first, then I can help you with:

• Making your writing more engaging
• Adding specific details and examples
• Improving clarity and flow
• Strengthening your voice
• Creating more vivid descriptions

Keep writing, and I'll help you make it shine!`;
        }

        const enhancements = this.generateWritingEnhancements(content);
        let response = `I've analyzed your essay and found several ways to make it more engaging and specific:\n\n`;

        enhancements.forEach((enhancement, index) => {
            response += `**${index + 1}. ${enhancement.title}**\n`;
            response += `${enhancement.description}\n`;
            if (enhancement.example) {
                response += `Example: ${enhancement.example}\n`;
            }
            response += `\n`;
        });

        return response;
    }

    generateEssaySuggestions(content, category) {
        const suggestions = [];
        
        // Check for weak words
        const weakWords = ['very', 'really', 'quite', 'somewhat', 'rather', 'pretty'];
        const foundWeakWords = weakWords.filter(word => content.toLowerCase().includes(word));
        
        if (foundWeakWords.length > 0) {
            suggestions.push({
                type: 'Style',
                title: 'Replace Weak Words',
                description: `Consider replacing weak words like "${foundWeakWords.join(', ')}" with stronger, more specific alternatives.`,
                suggestion: 'Instead of "very good," try "excellent" or "outstanding"',
                action: 'enhance'
            });
        }

        // Check for repetitive sentence starts
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const sentenceStarts = sentences.map(s => s.trim().split(' ')[0].toLowerCase());
        const startCounts = {};
        sentenceStarts.forEach(start => {
            startCounts[start] = (startCounts[start] || 0) + 1;
        });
        
        const repetitiveStarts = Object.entries(startCounts).filter(([word, count]) => count > 2);
        if (repetitiveStarts.length > 0) {
            suggestions.push({
                type: 'Flow',
                title: 'Vary Sentence Beginnings',
                description: `You start multiple sentences with "${repetitiveStarts[0][0]}". Try varying your sentence openings for better flow.`,
                suggestion: 'Use different sentence starters like "Additionally," "Furthermore," "However," etc.',
                action: 'enhance'
            });
        }

        // Check for specificity
        if (!content.includes('"') && !content.includes("'")) {
            suggestions.push({
                type: 'Detail',
                title: 'Add Specific Details',
                description: 'Your essay could benefit from more specific examples, dialogue, or concrete details.',
                suggestion: 'Include quotes, specific names, dates, or sensory details to bring your story to life',
                action: 'enhance'
            });
        }

        // Check for emotional content
        const emotionalWords = ['felt', 'emotion', 'excited', 'nervous', 'proud', 'disappointed', 'happy', 'sad'];
        const hasEmotion = emotionalWords.some(word => content.toLowerCase().includes(word));
        
        if (!hasEmotion) {
            suggestions.push({
                type: 'Voice',
                title: 'Add Emotional Depth',
                description: 'Consider adding more emotional content to help readers connect with your experiences.',
                suggestion: 'Describe how you felt, what you learned, or how the experience changed you',
                action: 'enhance'
            });
        }

        return suggestions;
    }

    findGrammarIssues(content) {
        const issues = [];
        
        // Check for common grammar issues
        if (content.includes('its ') && content.includes("it's")) {
            issues.push({
                type: 'Grammar',
                description: 'Check usage of "its" vs "it\'s" - "its" is possessive, "it\'s" means "it is"',
                suggestion: 'Review each instance to ensure correct usage'
            });
        }

        if (content.includes('there ') && content.includes('their')) {
            issues.push({
                type: 'Grammar',
                description: 'Check usage of "there" vs "their" - "there" indicates location, "their" is possessive',
                suggestion: 'Review each instance to ensure correct usage'
            });
        }

        // Check for run-on sentences
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const longSentences = sentences.filter(s => s.split(' ').length > 30);
        
        if (longSentences.length > 0) {
            issues.push({
                type: 'Style',
                description: `You have ${longSentences.length} sentence(s) that might be too long and could be split for clarity`,
                suggestion: 'Consider breaking long sentences into shorter, clearer ones'
            });
        }

        // Check for sentence fragments
        const fragments = sentences.filter(s => {
            const words = s.trim().split(' ');
            return words.length < 5 && !words[0].match(/^[A-Z]/);
        });
        
        if (fragments.length > 0) {
            issues.push({
                type: 'Grammar',
                description: `You have ${fragments.length} potential sentence fragment(s)`,
                suggestion: 'Make sure each sentence is complete with a subject and verb'
            });
        }

        return issues;
    }

    generateWritingEnhancements(content) {
        const enhancements = [];
        
        // Check for vague language
        const vagueWords = ['thing', 'stuff', 'something', 'anything', 'everything'];
        const foundVague = vagueWords.filter(word => content.toLowerCase().includes(word));
        
        if (foundVague.length > 0) {
            enhancements.push({
                title: 'Replace Vague Language',
                description: `Replace vague words like "${foundVague.join(', ')}" with specific, concrete terms.`,
                example: 'Instead of "I learned many things," try "I learned problem-solving, teamwork, and leadership skills"'
            });
        }

        // Check for passive voice
        const passiveIndicators = ['was', 'were', 'been', 'being'];
        const hasPassive = passiveIndicators.some(indicator => content.toLowerCase().includes(indicator));
        
        if (hasPassive) {
            enhancements.push({
                title: 'Use Active Voice',
                description: 'Try to use active voice instead of passive voice for stronger, more direct writing.',
                example: 'Instead of "The project was completed by me," try "I completed the project"'
            });
        }

        // Check for sensory details
        const sensoryWords = ['saw', 'heard', 'felt', 'smelled', 'tasted'];
        const hasSensory = sensoryWords.some(word => content.toLowerCase().includes(word));
        
        if (!hasSensory) {
            enhancements.push({
                title: 'Add Sensory Details',
                description: 'Include sensory details to help readers visualize and connect with your experiences.',
                example: 'Describe what you saw, heard, felt, smelled, or tasted in key moments'
            });
        }

        return enhancements;
    }

    createSuggestionHTML(suggestion) {
        return `
            <div class="ai-suggestion">
                <div class="ai-suggestion-header">
                    <span class="ai-suggestion-title">${suggestion.title}</span>
                    <span class="ai-suggestion-type">${suggestion.type}</span>
                </div>
                <div class="ai-suggestion-content">
                    ${suggestion.description}
                    ${suggestion.suggestion ? `<br><br><strong>Suggestion:</strong> ${suggestion.suggestion}` : ''}
                </div>
                <div class="ai-suggestion-actions">
                    <button class="ai-suggestion-btn" onclick="essayManager.applySuggestion('${suggestion.action}', '${suggestion.title}')">
                        <i class="fas fa-magic"></i> Apply Suggestion
                    </button>
                    <button class="ai-suggestion-btn secondary" onclick="essayManager.explainSuggestion('${suggestion.title}')">
                        <i class="fas fa-info-circle"></i> Learn More
                    </button>
                </div>
            </div>
        `;
    }

    applySuggestion(action, title) {
        const content = document.getElementById('essayContent').value;
        let newContent = content;

        switch (action) {
            case 'enhance':
                // Apply basic enhancements
                newContent = content
                    .replace(/\bvery\b/gi, 'extremely')
                    .replace(/\breally\b/gi, 'truly')
                    .replace(/\bquite\b/gi, 'rather')
                    .replace(/\bsomewhat\b/gi, 'somewhat');
                break;
        }

        if (newContent !== content) {
            document.getElementById('essayContent').value = newContent;
            this.updateWordCount();
            this.showNotification(`Applied suggestion: ${title}`, 'success');
        }
    }

    explainSuggestion(title) {
        const explanations = {
            'Replace Weak Words': 'Weak words like "very," "really," and "quite" don\'t add much meaning. Stronger alternatives make your writing more impactful and professional.',
            'Vary Sentence Beginnings': 'Starting multiple sentences the same way creates monotony. Varying your openings keeps readers engaged and shows sophisticated writing skills.',
            'Add Specific Details': 'Specific details help readers visualize your experiences and make your essay more memorable and authentic.',
            'Add Emotional Depth': 'Sharing your emotions helps admissions officers connect with you as a person and understand your growth and character.'
        };

        const explanation = explanations[title] || 'This suggestion will help improve your essay\'s clarity, engagement, and overall impact.';
        this.addAIMessage(`**${title}**\n\n${explanation}\n\nWould you like me to help you implement this suggestion?`);
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    essayManager.showSection(sectionName);
}

function clearEssay() {
    essayManager.clearEssay();
}

function saveDraft() {
    essayManager.saveDraft();
}

function closeModal() {
    essayManager.closeModal();
}

function editEssay() {
    essayManager.editEssay();
}

function deleteEssay() {
    essayManager.deleteEssay();
}

function showAddCollegeModal() {
    essayManager.showAddCollegeModal();
}

function closeAddCollegeModal() {
    essayManager.closeAddCollegeModal();
}

function saveCollege() {
    essayManager.saveCollege();
}

function toggleAIAssistant() {
    essayManager.toggleAIAssistant();
}

function sendAIMessage(message) {
    essayManager.sendAIMessage(message);
}

function updateCollegeStatus(collegeId, newStatus) {
    essayManager.updateCollegeStatus(collegeId, newStatus);
}

// Initialize the application
let essayManager;
document.addEventListener('DOMContentLoaded', () => {
    essayManager = new EssayManager();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
