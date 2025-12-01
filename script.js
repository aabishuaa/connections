/**
 * Connections Lab - Puzzle Game
 * For Abishua & Chrisanne
 */

// Main application object
const app = {
    // Current state
    currentPuzzleId: null,
    editingPuzzleId: null,
    gameState: null,

    // Initialize the app
    init() {
        this.renderPuzzlesList();
        this.renderGroupsForm();
        this.setupInputListeners();
    },

    // ==================== NAVIGATION ====================

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    },

    showHomeScreen() {
        this.showScreen('home-screen');
        this.renderPuzzlesList();
        this.editingPuzzleId = null;
    },

    showCreateScreen(puzzleId = null) {
        this.editingPuzzleId = puzzleId;
        this.showScreen('create-screen');

        if (puzzleId) {
            // Load existing puzzle for editing
            const puzzle = this.getPuzzle(puzzleId);
            if (puzzle) {
                this.loadPuzzleIntoForm(puzzle);
            }
        } else {
            // Clear form for new puzzle
            this.clearForm();
        }
        this.updatePreview();
    },

    showImportScreen() {
        this.showScreen('import-screen');
        document.getElementById('import-json').value = '';
        document.getElementById('import-preview').style.display = 'none';
    },

    showPlayScreen(puzzleId) {
        this.currentPuzzleId = puzzleId;
        const puzzle = this.getPuzzle(puzzleId);
        if (!puzzle) {
            alert('Puzzle not found!');
            return;
        }

        this.showScreen('play-screen');
        this.initGame(puzzle);
    },

    // ==================== LOCAL STORAGE ====================

    getPuzzles() {
        const puzzles = localStorage.getItem('connections-puzzles');
        return puzzles ? JSON.parse(puzzles) : [];
    },

    savePuzzles(puzzles) {
        localStorage.setItem('connections-puzzles', JSON.stringify(puzzles));
    },

    getPuzzle(id) {
        const puzzles = this.getPuzzles();
        return puzzles.find(p => p.id === id);
    },

    addOrUpdatePuzzle(puzzle) {
        const puzzles = this.getPuzzles();
        const index = puzzles.findIndex(p => p.id === puzzle.id);

        if (index >= 0) {
            puzzles[index] = puzzle;
        } else {
            puzzles.push(puzzle);
        }

        this.savePuzzles(puzzles);
    },

    deletePuzzleById(id) {
        if (confirm('Are you sure you want to delete this puzzle?')) {
            const puzzles = this.getPuzzles().filter(p => p.id !== id);
            this.savePuzzles(puzzles);
            this.renderPuzzlesList();
        }
    },

    // ==================== PUZZLE CREATION/EDITING ====================

    renderGroupsForm() {
        const container = document.getElementById('groups-form');
        const colors = ['yellow', 'green', 'blue', 'purple'];
        const colorLabels = {
            yellow: 'Yellow (Easiest)',
            green: 'Green (Medium)',
            blue: 'Blue (Harder)',
            purple: 'Purple (Hardest)'
        };

        container.innerHTML = colors.map((color, index) => `
            <div class="group-editor ${color}">
                <h3>
                    <span class="color-indicator ${color}"></span>
                    Group ${index + 1}
                    <select id="group-${index}-color" onchange="app.updatePreview()">
                        ${colors.map(c => `<option value="${c}" ${c === color ? 'selected' : ''}>${colorLabels[c]}</option>`).join('')}
                    </select>
                </h3>
                <div class="form-group">
                    <label>Category Name</label>
                    <input type="text" id="group-${index}-category" placeholder="e.g., Caribbean Islands" oninput="app.updatePreview()">
                </div>
                <div class="words-inputs">
                    ${[0, 1, 2, 3].map(wordIndex => `
                        <input type="text" id="group-${index}-word-${wordIndex}" placeholder="Word ${wordIndex + 1}" oninput="app.updatePreview()">
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    setupInputListeners() {
        // Listen to title and description changes
        const titleInput = document.getElementById('puzzle-title');
        const descInput = document.getElementById('puzzle-description');

        if (titleInput) titleInput.addEventListener('input', () => this.updatePreview());
        if (descInput) descInput.addEventListener('input', () => this.updatePreview());
    },

    clearForm() {
        document.getElementById('puzzle-title').value = '';
        document.getElementById('puzzle-description').value = '';

        for (let i = 0; i < 4; i++) {
            document.getElementById(`group-${i}-category`).value = '';
            for (let j = 0; j < 4; j++) {
                document.getElementById(`group-${i}-word-${j}`).value = '';
            }
        }
    },

    loadPuzzleIntoForm(puzzle) {
        document.getElementById('puzzle-title').value = puzzle.title || '';
        document.getElementById('puzzle-description').value = puzzle.description || '';

        puzzle.groups.forEach((group, i) => {
            document.getElementById(`group-${i}-category`).value = group.categoryName || '';
            document.getElementById(`group-${i}-color`).value = group.color || '';
            group.words.forEach((word, j) => {
                document.getElementById(`group-${i}-word-${j}`).value = word || '';
            });
        });
    },

    getPuzzleFromForm() {
        const title = document.getElementById('puzzle-title').value.trim();
        if (!title) {
            alert('Please enter a puzzle title!');
            return null;
        }

        const groups = [];
        for (let i = 0; i < 4; i++) {
            const category = document.getElementById(`group-${i}-category`).value.trim();
            const color = document.getElementById(`group-${i}-color`).value;
            const words = [];

            for (let j = 0; j < 4; j++) {
                const word = document.getElementById(`group-${i}-word-${j}`).value.trim();
                if (!word) {
                    alert(`Please fill in all words for Group ${i + 1}!`);
                    return null;
                }
                words.push(word);
            }

            if (!category) {
                alert(`Please enter a category name for Group ${i + 1}!`);
                return null;
            }

            groups.push({ categoryName: category, color, words });
        }

        return {
            id: this.editingPuzzleId || this.generateId(),
            title,
            description: document.getElementById('puzzle-description').value.trim(),
            groups,
            createdAt: this.editingPuzzleId ? this.getPuzzle(this.editingPuzzleId).createdAt : Date.now()
        };
    },

    savePuzzle() {
        const puzzle = this.getPuzzleFromForm();
        if (!puzzle) return;

        this.addOrUpdatePuzzle(puzzle);
        alert('Puzzle saved successfully!');
        this.showHomeScreen();
    },

    updatePreview() {
        const previewGrid = document.getElementById('preview-grid');
        const words = [];

        // Collect all words from the form
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const word = document.getElementById(`group-${i}-word-${j}`).value.trim();
                words.push(word || '...');
            }
        }

        // Shuffle for preview (Fisher-Yates shuffle)
        const shuffled = [...words];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        previewGrid.innerHTML = shuffled.map(word =>
            `<div class="word-tile">${word}</div>`
        ).join('');
    },

    // ==================== EXPORT/IMPORT ====================

    exportPuzzle() {
        const puzzle = this.getPuzzleFromForm();
        if (!puzzle) return;

        // Create export object (without internal id and createdAt)
        const exportData = {
            title: puzzle.title,
            description: puzzle.description,
            groups: puzzle.groups
        };

        const json = JSON.stringify(exportData, null, 2);
        document.getElementById('export-json').value = json;
        document.getElementById('export-modal').classList.add('active');
    },

    closeExportModal() {
        document.getElementById('export-modal').classList.remove('active');
    },

    copyExportJson() {
        const textarea = document.getElementById('export-json');
        textarea.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    },

    previewImport() {
        const json = document.getElementById('import-json').value.trim();
        if (!json) {
            alert('Please paste puzzle JSON first!');
            return;
        }

        try {
            const puzzle = JSON.parse(json);
            this.validatePuzzleData(puzzle);

            // Show preview
            const previewDiv = document.getElementById('import-preview');
            const contentDiv = document.getElementById('import-preview-content');

            const allWords = puzzle.groups.flatMap(g => g.words);
            const shuffled = this.shuffleArray([...allWords]);

            contentDiv.innerHTML = `
                <h4>${puzzle.title}</h4>
                ${puzzle.description ? `<p>${puzzle.description}</p>` : ''}
                <div class="word-grid preview">
                    ${shuffled.map(word => `<div class="word-tile">${word}</div>`).join('')}
                </div>
                <div style="margin-top: 15px;">
                    <strong>Groups:</strong>
                    ${puzzle.groups.map(g => `
                        <div style="margin: 8px 0; padding: 8px; background: var(--${g.color}); border-radius: 4px;">
                            <strong>${g.categoryName}</strong> (${g.color}): ${g.words.join(', ')}
                        </div>
                    `).join('')}
                </div>
            `;

            previewDiv.style.display = 'block';
        } catch (error) {
            alert('Invalid JSON: ' + error.message);
        }
    },

    importPuzzle() {
        const json = document.getElementById('import-json').value.trim();
        if (!json) {
            alert('Please paste puzzle JSON first!');
            return;
        }

        try {
            const puzzleData = JSON.parse(json);
            this.validatePuzzleData(puzzleData);

            // Add ID and timestamp
            const puzzle = {
                ...puzzleData,
                id: this.generateId(),
                createdAt: Date.now()
            };

            this.addOrUpdatePuzzle(puzzle);
            alert('Puzzle imported successfully!');
            this.showHomeScreen();
        } catch (error) {
            alert('Import failed: ' + error.message);
        }
    },

    validatePuzzleData(puzzle) {
        if (!puzzle.title || typeof puzzle.title !== 'string') {
            throw new Error('Puzzle must have a title');
        }
        if (!Array.isArray(puzzle.groups) || puzzle.groups.length !== 4) {
            throw new Error('Puzzle must have exactly 4 groups');
        }

        puzzle.groups.forEach((group, i) => {
            if (!group.categoryName || typeof group.categoryName !== 'string') {
                throw new Error(`Group ${i + 1} must have a category name`);
            }
            if (!group.color || !['yellow', 'green', 'blue', 'purple'].includes(group.color)) {
                throw new Error(`Group ${i + 1} must have a valid color`);
            }
            if (!Array.isArray(group.words) || group.words.length !== 4) {
                throw new Error(`Group ${i + 1} must have exactly 4 words`);
            }
            group.words.forEach((word, j) => {
                if (!word || typeof word !== 'string') {
                    throw new Error(`Group ${i + 1}, word ${j + 1} is invalid`);
                }
            });
        });
    },

    // ==================== GAME LOGIC ====================

    initGame(puzzle) {
        // Set up game state
        this.gameState = {
            puzzle: puzzle,
            selectedWords: [],
            solvedGroups: [],
            strikes: 0,
            maxStrikes: 4,
            availableWords: []
        };

        // Shuffle all words
        const allWords = puzzle.groups.flatMap((group, groupIndex) =>
            group.words.map(word => ({ word, groupIndex }))
        );
        this.gameState.availableWords = this.shuffleArray(allWords);

        // Render game UI
        document.getElementById('play-title').textContent = puzzle.title;
        document.getElementById('play-description').textContent = puzzle.description || '';
        this.renderGameGrid();
        this.updateStrikesDisplay();

        document.getElementById('solved-groups').innerHTML = '';
    },

    renderGameGrid() {
        const grid = document.getElementById('game-grid');
        const { availableWords, selectedWords } = this.gameState;

        grid.innerHTML = availableWords.map(({ word }) => {
            const isSelected = selectedWords.includes(word);
            return `
                <div class="word-tile ${isSelected ? 'selected' : ''}"
                     onclick="app.toggleWord('${word.replace(/'/g, "\\'")}')">
                    ${word}
                </div>
            `;
        }).join('');
    },

    toggleWord(word) {
        const { selectedWords } = this.gameState;
        const index = selectedWords.indexOf(word);

        if (index >= 0) {
            selectedWords.splice(index, 1);
        } else {
            if (selectedWords.length < 4) {
                selectedWords.push(word);
            } else {
                return; // Max 4 words
            }
        }

        this.renderGameGrid();
        this.updateSubmitButton();
    },

    clearSelection() {
        this.gameState.selectedWords = [];
        this.renderGameGrid();
        this.updateSubmitButton();
    },

    updateSubmitButton() {
        const btn = document.getElementById('submit-btn');
        btn.disabled = this.gameState.selectedWords.length !== 4;
    },

    submitSelection() {
        const { selectedWords, puzzle, solvedGroups, strikes, maxStrikes } = this.gameState;

        if (selectedWords.length !== 4) return;

        // Check if selection matches any unsolved group
        const matchedGroupIndex = puzzle.groups.findIndex((group, index) => {
            if (solvedGroups.includes(index)) return false;
            return this.arraysEqual(
                group.words.sort(),
                [...selectedWords].sort()
            );
        });

        if (matchedGroupIndex >= 0) {
            // Correct! Mark as solved
            this.gameState.solvedGroups.push(matchedGroupIndex);
            this.gameState.selectedWords = [];

            // Remove solved words from available words
            const solvedWords = puzzle.groups[matchedGroupIndex].words;
            this.gameState.availableWords = this.gameState.availableWords.filter(
                ({ word }) => !solvedWords.includes(word)
            );

            this.renderSolvedGroup(matchedGroupIndex);
            this.renderGameGrid();
            this.updateSubmitButton();

            // Check for win
            if (this.gameState.solvedGroups.length === 4) {
                setTimeout(() => this.showWinModal(), 500);
            }
        } else {
            // Wrong! Add strike
            this.gameState.strikes++;
            this.gameState.selectedWords = [];
            this.updateStrikesDisplay();
            this.renderGameGrid();
            this.updateSubmitButton();

            // Shake animation (simple feedback)
            const grid = document.getElementById('game-grid');
            grid.style.animation = 'none';
            setTimeout(() => {
                grid.style.animation = '';
            }, 10);

            // Check for loss
            if (this.gameState.strikes >= maxStrikes) {
                setTimeout(() => {
                    this.showGameOverModal();
                }, 500);
            }
        }
    },

    renderSolvedGroup(groupIndex) {
        const group = this.gameState.puzzle.groups[groupIndex];
        const container = document.getElementById('solved-groups');

        const groupDiv = document.createElement('div');
        groupDiv.className = `solved-group ${group.color}`;
        groupDiv.innerHTML = `
            <h3>${group.categoryName}</h3>
            <div class="words">${group.words.join(', ')}</div>
        `;
        container.appendChild(groupDiv);
    },

    updateStrikesDisplay() {
        const { strikes, maxStrikes } = this.gameState;
        document.getElementById('strikes-display').textContent = `Strikes: ${strikes} / ${maxStrikes}`;
    },

    resetPuzzle() {
        const puzzle = this.getPuzzle(this.currentPuzzleId);
        if (puzzle) {
            this.initGame(puzzle);
        }
    },

    showWinModal() {
        const modal = document.getElementById('win-modal');
        const summary = document.getElementById('win-summary');

        summary.innerHTML = this.gameState.puzzle.groups.map(group => `
            <div class="solved-group ${group.color}">
                <h3>${group.categoryName}</h3>
                <div class="words">${group.words.join(', ')}</div>
            </div>
        `).join('');

        modal.classList.add('active');
    },

    closeWinModal() {
        document.getElementById('win-modal').classList.remove('active');
    },

    showGameOverModal() {
        const modal = document.getElementById('gameover-modal');
        const summary = document.getElementById('gameover-summary');

        // Show all groups with their answers
        summary.innerHTML = this.gameState.puzzle.groups.map((group, index) => {
            const isSolved = this.gameState.solvedGroups.includes(index);
            return `
                <div class="solved-group ${group.color}">
                    <h3>${group.categoryName} ${isSolved ? '✓' : ''}</h3>
                    <div class="words">${group.words.join(', ')}</div>
                </div>
            `;
        }).join('');

        modal.classList.add('active');
    },

    closeGameOverModal() {
        document.getElementById('gameover-modal').classList.remove('active');
    },

    // ==================== UI RENDERING ====================

    renderPuzzlesList() {
        const container = document.getElementById('puzzles-list');
        const puzzles = this.getPuzzles();

        if (puzzles.length === 0) {
            container.innerHTML = '<div class="empty-state">No puzzles yet. Create your first puzzle!</div>';
            return;
        }

        container.innerHTML = puzzles
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(puzzle => `
                <div class="puzzle-card">
                    <h3>${puzzle.title}</h3>
                    <p>${puzzle.description || 'No description'}</p>
                    <p style="font-size: 0.85em; color: #999;">Created: ${new Date(puzzle.createdAt).toLocaleDateString()}</p>
                    <div class="puzzle-card-actions">
                        <button onclick="app.showPlayScreen('${puzzle.id}')" class="btn btn-primary">Play</button>
                        <button onclick="app.showCreateScreen('${puzzle.id}')" class="btn btn-secondary">Edit</button>
                        <button onclick="app.deletePuzzleById('${puzzle.id}')" class="btn btn-danger">Delete</button>
                    </div>
                </div>
            `).join('');
    },

    // ==================== UTILITY FUNCTIONS ====================

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
