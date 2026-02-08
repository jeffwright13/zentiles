/**
 * ZenTiles - Main Application
 * Integrates game logic with theme system for a contemplative puzzle experience
 */

import { getThemeManager } from './themes/theme-manager.js';

// ============================================================================
// GAME CORE CLASSES
// ============================================================================

class Piece {
    constructor(shapeIndex = 0) {
        this.shapeIndex = shapeIndex;
        this.cells = JSON.parse(JSON.stringify(Piece.BASE_SHAPES[shapeIndex]));
        this.normalize();
    }

    static BASE_SHAPES = [
        [[0, 0]],
        [[0, 0], [1, 0]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 0], [1, 0], [0, 1]],
        [[0, 0], [1, 0], [0, 1], [1, 1]],
        [[0, 0], [1, 0], [2, 0], [1, 1]],
        [[0, 0], [0, 1], [0, 2], [1, 2]],
        [[0, 0], [1, 0], [1, 1], [2, 1]],
        [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
        [[1, 0], [0, 1], [1, 1], [2, 1]],
        [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
        [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]]
    ];

    normalize() {
        if (!this.cells || this.cells.length === 0) return;
        const minX = Math.min(...this.cells.map(([x, y]) => x));
        const minY = Math.min(...this.cells.map(([x, y]) => y));
        this.cells = this.cells
            .map(([x, y]) => [x - minX, y - minY])
            .sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
    }

    rotate(times = 1) {
        for (let i = 0; i < times % 4; i++) {
            this.cells = this.cells.map(([x, y]) => [y, -x]);
        }
        this.normalize();
    }

    reflect() {
        if (!this.cells || this.cells.length === 0) return;
        const maxX = Math.max(...this.cells.map(([x, y]) => x));
        this.cells = this.cells.map(([x, y]) => [maxX - x, y]);
        this.normalize();
    }

    getWorldCells(origin) {
        const [ox, oy] = origin;
        return this.cells.map(([x, y]) => [ox + x, oy + y]);
    }

    getBounds() {
        if (!this.cells || this.cells.length === 0) return [0, 0, 0, 0];
        const xs = this.cells.map(([x, y]) => x);
        const ys = this.cells.map(([x, y]) => y);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
}

class Board {
    constructor(width = 5, height = 5) {
        this.width = width;
        this.height = height;
        this.occupied = Array(width).fill().map(() => Array(height).fill(false));
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    canPlacePiece(piece, origin) {
        for (const [x, y] of piece.getWorldCells(origin)) {
            if (!this.isValidPosition(x, y) || this.occupied[x][y]) {
                return false;
            }
        }
        return true;
    }

    placePiece(piece, origin) {
        for (const [x, y] of piece.getWorldCells(origin)) {
            this.occupied[x][y] = true;
        }
    }

    clearBoard() {
        this.occupied = Array(this.width).fill().map(() => Array(this.height).fill(false));
    }

    getFullRows() {
        const fullRows = new Set();
        for (let y = 0; y < this.height; y++) {
            let rowFull = true;
            for (let x = 0; x < this.width; x++) {
                if (!this.occupied[x][y]) {
                    rowFull = false;
                    break;
                }
            }
            if (rowFull) fullRows.add(y);
        }
        return fullRows;
    }

    getFullColumns() {
        const fullCols = new Set();
        for (let x = 0; x < this.width; x++) {
            if (this.occupied[x].every(cell => cell)) {
                fullCols.add(x);
            }
        }
        return fullCols;
    }

    clearRowsAndColumns(rows, cols) {
        const clearedCount = rows.size + cols.size;
        for (const y of rows) {
            for (let x = 0; x < this.width; x++) {
                this.occupied[x][y] = false;
            }
        }
        for (const x of cols) {
            for (let y = 0; y < this.height; y++) {
                this.occupied[x][y] = false;
            }
        }
        return clearedCount;
    }

    isBoardEmpty() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.occupied[x][y]) {
                    return false;
                }
            }
        }
        return true;
    }

    resize(newWidth, newHeight) {
        const newOccupied = Array(newWidth).fill().map(() => Array(newHeight).fill(false));
        for (let x = 0; x < Math.min(this.width, newWidth); x++) {
            for (let y = 0; y < Math.min(this.height, newHeight); y++) {
                newOccupied[x][y] = this.occupied[x][y];
            }
        }
        this.width = newWidth;
        this.height = newHeight;
        this.occupied = newOccupied;
    }
}

class GameState {
    constructor() {
        this.board = new Board();
        this.currentPiece = new Piece();
        this.nextPiece = new Piece();
        this.level = 1;
        this.linesClearedTotal = 0;
        this.linesAtLevelStart = 0;
        this.linesToNextLevel = 25;
        this.piecesPlaced = 0;
        this.undoCharges = 3;
        this.cleanClearCharges = 1;
        this.reserveSlots = [null, null, null];
        this.reserveUsedThisTurn = false;
        this.pieceSpawnCounts = Array(12).fill(0);
        this.pieceSpawnTotal = 0;
        this.difficulty = 'normal';
        this.useDeterministicRng = false;
        this.rngSeed = (typeof crypto !== 'undefined' && crypto.getRandomValues)
            ? crypto.getRandomValues(new Uint32Array(1))[0]
            : (Date.now() >>> 0);
    }

    getLinesRemaining() {
        return (this.linesAtLevelStart + this.linesToNextLevel) - this.linesClearedTotal;
    }

    getUnlockedPieceCount() {
        return Math.min(5 + Math.floor(this.level / 5), 12);
    }

    getBoardSize() {
        return Math.min(5 + Math.floor(this.level / 5), 12);
    }
}

class GameEngine {
    static SAVE_KEY = 'zentiles-save';

    constructor(state = null) {
        this.state = state || new GameState();
        this.undoHistory = [];
        
        if (!state) {
            this.spawnPieces();
        }
    }

    static loadGame() {
        try {
            const json = localStorage.getItem(GameEngine.SAVE_KEY);
            if (!json) return null;

            const data = JSON.parse(json);

            const state = new GameState();
            state.level = data.level;
            state.linesClearedTotal = data.linesClearedTotal;
            state.linesAtLevelStart = data.linesAtLevelStart;
            state.linesToNextLevel = data.linesToNextLevel;
            state.piecesPlaced = data.piecesPlaced;
            state.undoCharges = data.undoCharges;
            state.cleanClearCharges = data.cleanClearCharges;
            state.reserveUsedThisTurn = data.reserveUsedThisTurn;
            state.pieceSpawnCounts = data.pieceSpawnCounts;
            state.pieceSpawnTotal = data.pieceSpawnTotal;
            state.difficulty = data.difficulty;
            state.useDeterministicRng = data.useDeterministicRng;
            state.rngSeed = data.rngSeed;

            state.board = new Board(data.board.width, data.board.height);
            state.board.occupied = data.board.occupied;

            state.currentPiece = new Piece(data.currentPiece.shapeIndex);
            state.currentPiece.cells = data.currentPiece.cells;

            state.nextPiece = new Piece(data.nextPiece.shapeIndex);
            state.nextPiece.cells = data.nextPiece.cells;

            state.reserveSlots = (data.reserveSlots || []).map(p => {
                if (!p) return null;
                const piece = new Piece(p.shapeIndex);
                piece.cells = p.cells;
                return piece;
            });

            const engine = new GameEngine(state);

            // Restore undo history
            engine.undoHistory = (data.undoHistory || []).map(snap => {
                const s = {};
                Object.assign(s, snap);
                s.board = new Board(snap.board.width, snap.board.height);
                s.board.occupied = snap.board.occupied;
                s.currentPiece = new Piece(snap.currentPiece.shapeIndex);
                s.currentPiece.cells = snap.currentPiece.cells;
                s.nextPiece = new Piece(snap.nextPiece.shapeIndex);
                s.nextPiece.cells = snap.nextPiece.cells;
                s.reserveSlots = (snap.reserveSlots || []).map(p => {
                    if (!p) return null;
                    const piece = new Piece(p.shapeIndex);
                    piece.cells = p.cells;
                    return piece;
                });
                return s;
            });

            return engine;
        } catch (e) {
            console.warn('Failed to load saved game:', e);
            localStorage.removeItem(GameEngine.SAVE_KEY);
            return null;
        }
    }

    saveGame() {
        try {
            const serializePiece = (p) => p ? { shapeIndex: p.shapeIndex, cells: p.cells } : null;
            const serializeSnap = (s) => ({
                level: s.level,
                linesClearedTotal: s.linesClearedTotal,
                linesAtLevelStart: s.linesAtLevelStart,
                linesToNextLevel: s.linesToNextLevel,
                piecesPlaced: s.piecesPlaced,
                undoCharges: s.undoCharges,
                cleanClearCharges: s.cleanClearCharges,
                reserveUsedThisTurn: s.reserveUsedThisTurn,
                pieceSpawnCounts: s.pieceSpawnCounts,
                pieceSpawnTotal: s.pieceSpawnTotal,
                difficulty: s.difficulty,
                useDeterministicRng: s.useDeterministicRng,
                rngSeed: s.rngSeed,
                board: { width: s.board.width, height: s.board.height, occupied: s.board.occupied },
                currentPiece: serializePiece(s.currentPiece),
                nextPiece: serializePiece(s.nextPiece),
                reserveSlots: (s.reserveSlots || []).map(serializePiece),
            });

            const data = serializeSnap(this.state);
            data.undoHistory = this.undoHistory.map(serializeSnap);

            localStorage.setItem(GameEngine.SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save game:', e);
        }
    }

    static clearSavedGame() {
        localStorage.removeItem(GameEngine.SAVE_KEY);
    }

    random() {
        if (!this.state.useDeterministicRng) {
            return Math.random();
        }
        // LCG (deterministic) so undo can restore RNG state and prevent reroll exploits
        this.state.rngSeed = ((this.state.rngSeed * 1664525) + 1013904223) >>> 0;
        return this.state.rngSeed / 4294967296;
    }

    placePiece(origin) {
        if (!this.state.board.canPlacePiece(this.state.currentPiece, origin)) {
            return false;
        }
        // Save undo snapshot BEFORE any board mutations
        this.saveUndoSnapshot();

        this.state.board.placePiece(this.state.currentPiece, origin);
        this.state.piecesPlaced++;
        const rows = this.state.board.getFullRows();
        const cols = this.state.board.getFullColumns();
        const cleared = this.state.board.clearRowsAndColumns(rows, cols);
        this.state.linesClearedTotal += cleared;
        
        // Check if board is completely empty after clearing - award additional Clean Clear
        if (this.state.board.isBoardEmpty() && cleared > 0) {
            this.state.cleanClearCharges++;
        }
        
        this.checkLevelUp();
        this.advancePiece();
        this.state.reserveUsedThisTurn = false;
        
        return cleared > 0 ? { cleared, rows, cols } : true;
    }

    saveUndoSnapshot() {
        const snapshot = JSON.parse(JSON.stringify(this.state));
        snapshot.board = new Board(this.state.board.width, this.state.board.height);
        snapshot.board.occupied = JSON.parse(JSON.stringify(this.state.board.occupied));
        snapshot.currentPiece = new Piece(this.state.currentPiece.shapeIndex);
        snapshot.currentPiece.cells = JSON.parse(JSON.stringify(this.state.currentPiece.cells));
        snapshot.nextPiece = new Piece(this.state.nextPiece.shapeIndex);
        snapshot.nextPiece.cells = JSON.parse(JSON.stringify(this.state.nextPiece.cells));
        snapshot.reserveSlots = (this.state.reserveSlots || []).map((p) => {
            if (!p) return null;
            const piece = new Piece(p.shapeIndex ?? 0);
            piece.cells = JSON.parse(JSON.stringify(p.cells || piece.cells));
            return piece;
        });
        this.undoHistory.push(snapshot);
    }

    undo() {
        if (!this.undoHistory || this.undoHistory.length === 0 || this.state.undoCharges <= 0) {
            return false;
        }
        const chargesBeforeUndo = this.state.undoCharges;
        const snapshot = this.undoHistory.pop();
        this.state.board = snapshot.board;
        this.state.currentPiece = snapshot.currentPiece;
        this.state.nextPiece = snapshot.nextPiece;
        this.state.level = snapshot.level;
        this.state.linesClearedTotal = snapshot.linesClearedTotal;
        this.state.linesAtLevelStart = snapshot.linesAtLevelStart;
        this.state.linesToNextLevel = snapshot.linesToNextLevel;
        this.state.piecesPlaced = snapshot.piecesPlaced;
        this.state.undoCharges = snapshot.undoCharges;
        this.state.cleanClearCharges = snapshot.cleanClearCharges;
        this.state.reserveSlots = snapshot.reserveSlots;
        this.state.reserveUsedThisTurn = snapshot.reserveUsedThisTurn;
        this.state.pieceSpawnCounts = snapshot.pieceSpawnCounts;
        this.state.pieceSpawnTotal = snapshot.pieceSpawnTotal;
        this.state.difficulty = snapshot.difficulty;
        this.state.useDeterministicRng = snapshot.useDeterministicRng;
        this.state.rngSeed = snapshot.rngSeed;
        
        // Spend an undo charge from the current charge pool (not the snapshot's)
        this.state.undoCharges = Math.max(0, chargesBeforeUndo - 1);
        return true;
    }

    clearLevel() {
        this.state.board.clearBoard();
        this.state.piecesPlaced = 0;
        this.state.linesClearedTotal = this.state.linesAtLevelStart;
        this.spawnPieces();
        this.undoHistory = [];
    }

    cleanClear() {
        if (this.state.cleanClearCharges <= 0) {
            return false;
        }
        this.state.board.clearBoard();
        this.state.cleanClearCharges--;
        this.undoHistory = [];
        return true;
    }

    swapPiece(slotIndex) {
        if (this.state.reserveUsedThisTurn) return false;
        if (slotIndex < 0 || slotIndex >= this.state.reserveSlots.length) return false;

        const unlockedSlots = Math.min(3, Math.floor(this.state.level / 5));
        
        if (slotIndex >= unlockedSlots) return false;
        
        const storedPiece = this.state.reserveSlots[slotIndex];
        if (storedPiece === null) {
            this.state.reserveSlots[slotIndex] = this.state.currentPiece;
            this.advancePiece();
        } else {
            this.state.reserveSlots[slotIndex] = this.state.currentPiece;
            this.state.currentPiece = storedPiece;
        }
        this.state.reserveUsedThisTurn = true;
        return true;
    }

    getValidPlacements(piece = null) {
        if (piece === null) piece = this.state.currentPiece;
        const valid = [];
        for (let x = 0; x < this.state.board.width; x++) {
            for (let y = 0; y < this.state.board.height; y++) {
                if (this.state.board.canPlacePiece(piece, [x, y])) {
                    valid.push([x, y]);
                }
            }
        }
        return valid;
    }

    hasValidMoves() {
        return this.getValidPlacements().length > 0;
    }

    checkLevelUp() {
        if (this.state.linesClearedTotal >= this.state.linesAtLevelStart + this.state.linesToNextLevel) {
            this.state.level++;
            this.state.linesAtLevelStart = this.state.linesClearedTotal;
            this.state.linesToNextLevel = Math.round(Math.min(25 * Math.pow(1.02, this.state.level), 50));
            const newSize = this.state.getBoardSize();
            if (newSize !== this.state.board.width) {
                this.state.board.resize(newSize, newSize);
            }
            this.state.undoCharges++;
            if (this.state.level % 5 === 0) {
                this.state.cleanClearCharges++;
            }
            return true;
        }
        return false;
    }

    advancePiece() {
        // Clone nextPiece to ensure currentPiece is a distinct object
        const next = this.state.nextPiece;
        const piece = new Piece(next.shapeIndex);
        piece.cells = JSON.parse(JSON.stringify(next.cells));
        this.state.currentPiece = piece;
        this.spawnNextPiece();
    }

    spawnPieces() {
        // Generate first piece (at least 2 cells)
        const unlockedCount = this.state.getUnlockedPieceCount();
        const pieceIndex = 1 + Math.floor(this.random() * (unlockedCount - 1));
        const firstPiece = new Piece(pieceIndex);
        firstPiece.rotate(Math.floor(this.random() * 4));
        if (this.random() < 0.5) firstPiece.reflect();
        this.state.currentPiece = firstPiece;
        
        // Generate second piece using normal spawn logic
        this.spawnNextPiece();
    }

    spawnNextPiece() {
        const unlockedCount = this.state.getUnlockedPieceCount();
        let pieceIndex;
        if (this.state.difficulty === 'hard') {
            pieceIndex = Math.floor(this.random() * unlockedCount);
        } else {
            const weights = [3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1].slice(0, unlockedCount);
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = this.random() * totalWeight;
            pieceIndex = 0;
            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    pieceIndex = i;
                    break;
                }
            }
        }
        const piece = new Piece(pieceIndex);
        piece.rotate(Math.floor(this.random() * 4));
        if (this.random() < 0.5) piece.reflect();
        this.state.nextPiece = piece;
        this.state.pieceSpawnCounts[pieceIndex]++;
        this.state.pieceSpawnTotal++;
    }
}

// ============================================================================
// ZENTILES WEB APPLICATION
// ============================================================================

class ZenTilesApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentCanvas = document.getElementById('currentPieceCanvas');
        this.currentCtx = this.currentCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPieceCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.engine = GameEngine.loadGame() || new GameEngine();
        this.themeManager = getThemeManager();
        
        this.cellSize = 68;
        this.hoverPos = null;
        this.validPlacements = [];
        this.showHints = false;
        this.isPlaying = false;
        this.isRepeat = false;
        this.useDeterministicRng = false;

        this._messageHideTimeoutId = null;
        this._persistentMessage = null;
        
        this.init();
    }

    init() {
        // Initialize theme system
        this.themeManager.init(document.body);
        
        // Setup game
        this.setupCanvas();
        this.setupEventListeners();
        this.setupThemeUI();
        this.setupAudioUI();
        
        // Initial render
        this.updateUI();
        this.render();
    }

    setupCanvas() {
        const boardSize = this.engine.state.board.width;
        this.canvas.width = boardSize * this.cellSize;
        this.canvas.height = boardSize * this.cellSize;
    }

    setupEventListeners() {
        // Canvas events
        const supportsPointer = 'PointerEvent' in window;
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        if (supportsPointer) {
            this.canvas.addEventListener('pointermove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('pointerdown', (e) => this.handleClick(e));
        } else {
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
        }
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverPos = null;
            this.render();
        });

        // Game control buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearLevel());
        document.getElementById('cleanBtn').addEventListener('click', () => this.cleanClear());
        document.getElementById('newGameBtn').addEventListener('click', () => {
            document.getElementById('settingsPanel')?.classList.remove('active');
            this.newGame();
        });

        // Swap slots
        document.querySelectorAll('.swap-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => this.swapPiece(index));
        });

        // Settings panel
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsPanel = document.getElementById('settingsPanel');
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('active');
        });
        
        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
                settingsPanel.classList.remove('active');
            }
        });

        // Theme button (inside settings)
        document.getElementById('themeBtn').addEventListener('click', () => {
            settingsPanel.classList.remove('active');
            this.openThemeModal();
        });
        document.getElementById('closeThemeModal').addEventListener('click', () => this.closeThemeModal());
        document.getElementById('themeModal').addEventListener('click', (e) => {
            if (e.target.id === 'themeModal') this.closeThemeModal();
        });

        // Tooltips toggle
        const tooltipsToggle = document.getElementById('tooltipsToggle');
        this.tooltipsEnabled = true;
        tooltipsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.tooltipsEnabled = !this.tooltipsEnabled;
            tooltipsToggle.classList.toggle('active', this.tooltipsEnabled);
            this.updateTooltips();
        });

        // Hints toggle
        const hintsToggle = document.getElementById('hintsToggle');
        hintsToggle.classList.toggle('active', this.showHints);
        hintsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleHints();
        });

        // Deterministic piece generation toggle
        const deterministicToggle = document.getElementById('deterministicToggle');
        if (deterministicToggle) {
            deterministicToggle.classList.toggle('active', this.useDeterministicRng);
            deterministicToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.useDeterministicRng = !this.useDeterministicRng;
                deterministicToggle.classList.toggle('active', this.useDeterministicRng);
                this.engine.state.useDeterministicRng = this.useDeterministicRng;
            });
        }

        // Listen for theme changes
        this.themeManager.on('themeChange', () => this.render());
    }

    updateTooltips() {
        const elements = document.querySelectorAll('[title]');
        elements.forEach(el => {
            if (this.tooltipsEnabled) {
                if (el.dataset.originalTitle) {
                    el.title = el.dataset.originalTitle;
                }
            } else {
                el.dataset.originalTitle = el.title;
                el.title = '';
            }
        });
    }

    setupThemeUI() {
        const themeGrid = document.getElementById('themeGrid');
        const themes = this.themeManager.getAvailableThemes();
        const currentTheme = this.themeManager.getCurrentTheme();

        themeGrid.innerHTML = themes.map(theme => `
            <div class="theme-option ${theme.id === currentTheme?.id ? 'active' : ''}" data-theme="${theme.id}">
                <div class="theme-color" style="background-color: ${theme.primaryColor}"></div>
                <div class="theme-name">${theme.name}</div>
                <div class="theme-desc">${theme.description}</div>
            </div>
        `).join('');

        themeGrid.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                this.themeManager.setTheme(themeId);
                
                // Update active state
                themeGrid.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                // Close modal after brief delay
                setTimeout(() => this.closeThemeModal(), 300);
            });
        });
    }

    setupAudioUI() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevTrackBtn = document.getElementById('prevTrackBtn');
        const nextTrackBtn = document.getElementById('nextTrackBtn');
        const repeatBtn = document.getElementById('repeatBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const trackName = document.getElementById('trackName');

        // Guard against missing UI elements (prevents init from failing)
        if (!playPauseBtn || !prevTrackBtn || !nextTrackBtn || !volumeSlider || !trackName) return;

        // Play/Pause
        playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.themeManager.pauseMusic();
                this.isPlaying = false;
                playPauseBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                `;
                trackName.textContent = 'Paused';
            } else {
                this.themeManager.playMusic();
                this.isPlaying = true;
                playPauseBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                `;
                this.updateTrackName();
            }
        });

        // Previous Track
        prevTrackBtn.addEventListener('click', () => {
            this.themeManager.prevTrack();
            if (!this.isPlaying) {
                this.themeManager.playMusic();
                this.isPlaying = true;
                playPauseBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                `;
            }
            this.updateTrackName();
        });

        // Next Track
        nextTrackBtn.addEventListener('click', () => {
            this.themeManager.nextTrack();
            if (!this.isPlaying) {
                this.themeManager.playMusic();
                this.isPlaying = true;
                playPauseBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                `;
            }
            this.updateTrackName();
        });

        // Repeat Toggle
        if (repeatBtn) {
            repeatBtn.classList.toggle('active', this.isRepeat);
            repeatBtn.addEventListener('click', () => {
                this.isRepeat = !this.isRepeat;
                this.themeManager.setRepeat(this.isRepeat);
                repeatBtn.classList.toggle('active', this.isRepeat);
            });
        }

        // Volume
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            this.themeManager.setVolume(volume);
        });

        // Update timeline and track name periodically
        setInterval(() => {
            this.updateAudioDisplay();
        }, 500);
    }

    updateAudioDisplay() {
        const trackInfo = this.themeManager.getAudioState();
        const trackName = document.getElementById('trackName');
        
        if (trackInfo && trackInfo.name && this.isPlaying) {
            trackName.textContent = trackInfo.name;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateTrackName() {
        const trackInfo = this.themeManager.getAudioState();
        const trackName = document.getElementById('trackName');
        if (trackInfo && trackInfo.name) {
            trackName.textContent = trackInfo.name;
        }
    }

    openThemeModal() {
        const modal = document.getElementById('themeModal');
        modal.classList.add('active');
    }

    closeThemeModal() {
        const modal = document.getElementById('themeModal');
        modal.classList.remove('active');
    }

    getBoardCellFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches?.[0]?.clientX ?? e.clientX;
        const clientY = e.touches?.[0]?.clientY ?? e.clientY;
        if (clientX == null || clientY == null) return null;
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = Math.floor(((clientX - rect.left) * scaleX) / this.cellSize);
        const y = Math.floor(((clientY - rect.top) * scaleY) / this.cellSize);
        return [x, y];
    }

    handleMouseMove(e) {
        const cell = this.getBoardCellFromEvent(e);
        if (!cell) return;
        const [x, y] = cell;
        
        if (x !== this.hoverPos?.[0] || y !== this.hoverPos?.[1]) {
            this.hoverPos = [x, y];
            this.render();
        }
    }

    handleClick(e) {
        const cell = this.getBoardCellFromEvent(e);
        if (cell) {
            this.placePiece(cell);
        }
    }

    placePiece(origin) {
        const oldBoardSize = this.engine.state.board.width;
        const result = this.engine.placePiece(origin);
        
        if (result === false) {
            this.showMessage('Cannot place piece there', 'warning');
            return;
        }
        
        // Check if board resized after level up
        if (this.engine.state.board.width !== oldBoardSize) {
            this.setupCanvas();
        }
        
        if (result && result.cleared > 0) {
            this.showMessage(`Cleared ${result.cleared} line${result.cleared > 1 ? 's' : ''}`, 'success');
        }
        
        this.engine.saveGame();
        this.updateUI();
        this.render();
    }

    undo() {
        if (this.engine.undo()) {
            this.engine.saveGame();
            this.showMessage('Move undone', 'info');
            this.updateUI();
            this.render();
        } else {
            this.showMessage('Cannot undo', 'warning');
        }
    }

    clearLevel() {
        this.engine.clearLevel();
        this.engine.saveGame();
        this.showMessage('Level cleared', 'info');
        this.updateUI();
        this.render();
    }

    cleanClear() {
        if (this.engine.cleanClear()) {
            this.engine.saveGame();
            this.showMessage('Board cleaned', 'success');
            this.updateUI();
            this.render();
        } else {
            this.showMessage('No clean clear charges', 'warning');
        }
    }

    swapPiece(slotIndex) {
        if (this.engine.swapPiece(slotIndex)) {
            this.engine.saveGame();
            this.showMessage(`Swapped with slot ${slotIndex + 1}`, 'info');
            this.updateUI();
            this.render();
        } else {
            this.showMessage('Cannot swap', 'warning');
        }
    }

    newGame() {
        GameEngine.clearSavedGame();
        this.engine = new GameEngine();
        this.engine.state.useDeterministicRng = this.useDeterministicRng;
        this.engine.saveGame();
        this.setupCanvas();
        this.showMessage('New game started', 'success');
        this.updateUI();
        this.render();
    }

    toggleHints() {
        this.showHints = !this.showHints;
        const hintsToggle = document.getElementById('hintsToggle');
        if (hintsToggle) {
            hintsToggle.classList.toggle('active', this.showHints);
        }
        this.render();
    }

    updateUI() {
        const state = this.engine.state;
        
        document.getElementById('level').textContent = state.level;
        document.getElementById('remaining').textContent = state.getLinesRemaining();
        
        const undoBtn = document.getElementById('undoBtn');
        const cleanBtn = document.getElementById('cleanBtn');
        undoBtn.disabled = state.undoCharges <= 0 || this.engine.undoHistory.length === 0;
        cleanBtn.disabled = state.cleanClearCharges <= 0;

        undoBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
            Undo (${state.undoCharges})
        `;
        
        cleanBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
            </svg>
            Clean Clear (${state.cleanClearCharges})
        `;
        
        const unlockedSlots = Math.min(3, Math.floor(state.level / 5));
        document.querySelectorAll('.swap-slot').forEach((slot, index) => {
            const unlockLevel = (index + 1) * 5;
            const tooltipText = state.level >= unlockLevel
                ? `Swap slot ${index + 1} (unlocked at level ${unlockLevel}). You can swap once per turn.`
                : `Locked swap slot ${index + 1}. Unlocks at level ${unlockLevel}.`;
            if (this.tooltipsEnabled) {
                slot.title = tooltipText;
            } else {
                slot.dataset.originalTitle = tooltipText;
                slot.title = '';
            }
            slot.classList.toggle('disabled', index >= unlockedSlots);
            slot.innerHTML = '';
            if (state.reserveSlots[index]) {
                slot.classList.add('has-piece');
                this.renderPieceInSlot(slot, state.reserveSlots[index]);
            } else {
                slot.classList.remove('has-piece');
                slot.innerHTML = `<span class="slot-label">${index + 1}</span>`;
            }
        });
        
        this.validPlacements = this.engine.getValidPlacements();

        if (!this.engine.hasValidMoves()) {
            this.showMessage('No valid moves available', 'warning', { persistentKey: 'noValidMoves' });
        } else {
            this.clearMessage('noValidMoves');
        }
    }

    render() {
        this.renderBoard();
        this.renderCurrentPiece();
        this.renderNextPiece();
    }

    renderBoard() {
        const { width, height, occupied } = this.engine.state.board;
        const theme = this.themeManager.getCurrentTheme();
        const colors = theme?.colors || {};
        
        // Use high-contrast theme colors
        const boardBg = colors.boardBg || 'rgba(30, 30, 40, 0.85)';
        const cellEmpty = colors.cellEmpty || 'rgba(255, 255, 255, 0.15)';
        const cellFilled = colors.cellFilled || colors.primary || '#4a5568';
        const cellBorder = colors.cellBorder || 'rgba(255, 255, 255, 0.2)';
        
        // Clear and fill board background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = boardBg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw empty cells with subtle fill
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (!occupied[x][y]) {
                    this.ctx.fillStyle = cellEmpty;
                    this.ctx.fillRect(
                        x * this.cellSize + 2,
                        y * this.cellSize + 2,
                        this.cellSize - 4,
                        this.cellSize - 4
                    );
                }
            }
        }
        
        // Draw grid lines
        this.ctx.strokeStyle = cellBorder;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, height * this.cellSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(width * this.cellSize, y * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw occupied cells with high-contrast filled color
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (occupied[x][y]) {
                    this.drawCell(x, y, cellFilled);
                }
            }
        }
        
        // Draw valid placements hints
        if (this.showHints) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            for (const [x, y] of this.validPlacements) {
                this.ctx.fillRect(
                    x * this.cellSize + 4,
                    y * this.cellSize + 4,
                    this.cellSize - 8,
                    this.cellSize - 8
                );
            }
        }
        
        // Draw hover piece preview
        if (this.hoverPos && 
            this.validPlacements.some(([x, y]) => x === this.hoverPos[0] && y === this.hoverPos[1])) {
            const hoverColor = this.hexToRgba(cellFilled, 0.6);
            this.drawPiece(this.engine.state.currentPiece, this.hoverPos, hoverColor);

            // Anchor highlight (upper-left placement cell)
            const anchorColor = this.hexToRgba(cellFilled, 0.95);
            const [anchorX, anchorY] = this.hoverPos;
            this.ctx.save();
            this.ctx.strokeStyle = anchorColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                anchorX * this.cellSize + 3,
                anchorY * this.cellSize + 3,
                this.cellSize - 6,
                this.cellSize - 6
            );
            this.ctx.restore();
        }
    }

    renderCurrentPiece() {
        this.currentCtx.clearRect(0, 0, this.currentCanvas.width, this.currentCanvas.height);
        
        const piece = this.engine.state.currentPiece;
        const bounds = piece.getBounds();
        const pieceWidth = bounds[2] - bounds[0] + 1;
        const pieceHeight = bounds[3] - bounds[1] + 1;
        
        const cellSize = 16;
        const totalWidth = pieceWidth * cellSize;
        const totalHeight = pieceHeight * cellSize;
        const offsetX = (this.currentCanvas.width - totalWidth) / 2;
        const offsetY = (this.currentCanvas.height - totalHeight) / 2;
        
        const theme = this.themeManager.getCurrentTheme();
        const colors = theme?.colors || {};
        const cellColor = colors.cellFilled || colors.primary || '#667eea';
        
        for (const [dx, dy] of piece.cells) {
            this.currentCtx.fillStyle = cellColor;
            this.currentCtx.fillRect(
                offsetX + dx * cellSize,
                offsetY + dy * cellSize,
                cellSize - 2,
                cellSize - 2
            );
            this.currentCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.currentCtx.lineWidth = 1;
            this.currentCtx.strokeRect(
                offsetX + dx * cellSize,
                offsetY + dy * cellSize,
                cellSize - 2,
                cellSize - 2
            );
        }
    }

    renderNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const piece = this.engine.state.nextPiece;
        const bounds = piece.getBounds();
        const pieceWidth = bounds[2] - bounds[0] + 1;
        const pieceHeight = bounds[3] - bounds[1] + 1;
        
        const cellSize = 16;
        const totalWidth = pieceWidth * cellSize;
        const totalHeight = pieceHeight * cellSize;
        const offsetX = (this.nextCanvas.width - totalWidth) / 2;
        const offsetY = (this.nextCanvas.height - totalHeight) / 2;
        
        const theme = this.themeManager.getCurrentTheme();
        const colors = theme?.colors || {};
        const cellColor = colors.cellFilled || colors.primary || '#667eea';
        
        for (const [dx, dy] of piece.cells) {
            this.nextCtx.fillStyle = cellColor;
            this.nextCtx.fillRect(
                offsetX + dx * cellSize,
                offsetY + dy * cellSize,
                cellSize - 2,
                cellSize - 2
            );
            this.nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.nextCtx.lineWidth = 1;
            this.nextCtx.strokeRect(
                offsetX + dx * cellSize,
                offsetY + dy * cellSize,
                cellSize - 2,
                cellSize - 2
            );
        }
    }

    renderPieceInSlot(slotElement, piece) {
        const canvas = document.createElement('canvas');
        canvas.width = 36;
        canvas.height = 36;
        const ctx = canvas.getContext('2d');
        
        const bounds = typeof piece?.getBounds === 'function'
            ? piece.getBounds()
            : (() => {
                const cells = piece?.cells;
                if (!Array.isArray(cells) || cells.length === 0) return [0, 0, 0, 0];
                const xs = cells.map(([x, y]) => x);
                const ys = cells.map(([x, y]) => y);
                return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
            })();
        const pieceWidth = bounds[2] - bounds[0] + 1;
        const pieceHeight = bounds[3] - bounds[1] + 1;
        
        const cellSize = Math.min(32 / pieceWidth, 32 / pieceHeight);
        const offsetX = (canvas.width - pieceWidth * cellSize) / 2;
        const offsetY = (canvas.height - pieceHeight * cellSize) / 2;
        
        const theme = this.themeManager.getCurrentTheme();
        const colors = theme?.colors || {};
        const cellColor = colors.cellFilled || colors.primary || '#667eea';
        
        for (const [dx, dy] of piece.cells) {
            ctx.fillStyle = cellColor;
            ctx.fillRect(
                offsetX + dx * cellSize,
                offsetY + dy * cellSize,
                cellSize - 1,
                cellSize - 1
            );
        }
        
        slotElement.appendChild(canvas);
    }

    drawCell(x, y, color) {
        const padding = 2;
        const size = this.cellSize - padding * 2;
        const xPos = x * this.cellSize + padding;
        const yPos = y * this.cellSize + padding;
        
        // Fill cell
        this.ctx.fillStyle = color;
        this.ctx.fillRect(xPos, yPos, size, size);
        
        // Add subtle highlight on top-left for depth
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(xPos, yPos, size, 2);
        this.ctx.fillRect(xPos, yPos, 2, size);
        
        // Add subtle shadow on bottom-right
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.fillRect(xPos, yPos + size - 2, size, 2);
        this.ctx.fillRect(xPos + size - 2, yPos, 2, size);
    }

    drawPiece(piece, origin, color) {
        for (const [x, y] of piece.getWorldCells(origin)) {
            this.drawCell(x, y, color);
        }
    }

    hexToRgba(hex, alpha) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return hex;
    }

    clearMessage(persistentKey = null) {
        if (persistentKey && this._persistentMessage?.key !== persistentKey) {
            return;
        }

        this._persistentMessage = null;

        const messageEl = document.getElementById('message');
        if (!messageEl) return;

        if (this._messageHideTimeoutId) {
            clearTimeout(this._messageHideTimeoutId);
            this._messageHideTimeoutId = null;
        }

        messageEl.style.display = 'none';
    }

    showMessage(text, type = 'info', options = null) {
        const messageEl = document.getElementById('message');
        if (!messageEl) return;

        const persistentKey = options?.persistentKey ?? null;
        const durationMs = options?.durationMs ?? 2500;

        if (persistentKey) {
            this._persistentMessage = { key: persistentKey, text, type };
        }

        if (this._messageHideTimeoutId) {
            clearTimeout(this._messageHideTimeoutId);
            this._messageHideTimeoutId = null;
        }

        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        if (!persistentKey) {
            this._messageHideTimeoutId = setTimeout(() => {
                this._messageHideTimeoutId = null;
                if (this._persistentMessage) {
                    messageEl.textContent = this._persistentMessage.text;
                    messageEl.className = `message ${this._persistentMessage.type}`;
                    messageEl.style.display = 'block';
                } else {
                    messageEl.style.display = 'none';
                }
            }, durationMs);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Piece = Piece;
    window.Board = Board;
    window.GameState = GameState;
    window.GameEngine = GameEngine;
    window.ZenTilesApp = ZenTilesApp;
}

// Initialize app when DOM is ready
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', () => {
        const hasGameDom = !!document.getElementById('gameCanvas');
        if (hasGameDom) {
            new ZenTilesApp();
        }
    });
}
