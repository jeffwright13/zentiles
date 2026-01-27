// Urban Ivy - Web Implementation
// Ported from Python reference implementation

class Piece {
    constructor(shapeIndex = 0) {
        this.shapeIndex = shapeIndex;
        this.cells = JSON.parse(JSON.stringify(Piece.BASE_SHAPES[shapeIndex]));
        this.normalize();
    }

    // 12 base piece shapes (normalized coordinates)
    static BASE_SHAPES = [
        // Single square
        [[0, 0]],
        // Horizontal line of 2
        [[0, 0], [1, 0]],
        // Horizontal line of 3
        [[0, 0], [1, 0], [2, 0]],
        // L-shape (2x2 missing one)
        [[0, 0], [1, 0], [0, 1]],
        // 2x2 square
        [[0, 0], [1, 0], [0, 1], [1, 1]],
        // T-shape (3 wide, 1 tall middle)
        [[0, 0], [1, 0], [2, 0], [1, 1]],
        // L-shape tall (3 tall, 1 wide bottom)
        [[0, 0], [0, 1], [0, 2], [1, 2]],
        // Z-shape
        [[0, 0], [1, 0], [1, 1], [2, 1]],
        // Plus shape
        [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
        // L-shape mirrored
        [[1, 0], [0, 1], [1, 1], [2, 1]],
        // U-shape
        [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
        // Large L (3x3 missing corner)
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
            if (this.occupied.every((col, x) => this.occupied[x][y])) {
                fullRows.add(y);
            }
        }
        return fullRows;
    }

    getFullColumns() {
        const fullCols = new Set();
        for (let x = 0; x < this.width; x++) {
            if (this.occupied.every((col, y) => this.occupied[x][y])) {
                fullCols.add(x);
            }
        }
        return fullCols;
    }

    clearRowsAndColumns(rows, cols) {
        const clearedCount = rows.size + cols.size;
        
        // Clear rows
        for (const y of rows) {
            for (let x = 0; x < this.width; x++) {
                this.occupied[x][y] = false;
            }
        }
        
        // Clear columns
        for (const x of cols) {
            for (let y = 0; y < this.height; y++) {
                this.occupied[x][y] = false;
            }
        }
        
        return clearedCount;
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
        
        // Progression
        this.level = 1;
        this.linesClearedTotal = 0;
        this.linesAtLevelStart = 0;
        this.linesToNextLevel = 25;
        this.piecesPlaced = 0;
        
        // Power actions
        this.undoCharges = 3;
        this.cleanClearCharges = 1;
        
        // Swap slots
        this.reserveSlots = [null, null, null];
        this.reserveUsedThisTurn = false;
        
        // Statistics
        this.pieceSpawnCounts = Array(12).fill(0);
        this.pieceSpawnTotal = 0;
        
        // Settings
        this.difficulty = 'normal';
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
    constructor(state = null) {
        this.state = state || new GameState();
        this.undoHistory = [];
    }

    placePiece(origin) {
        if (!this.state.board.canPlacePiece(this.state.currentPiece, origin)) {
            return false;
        }
        
        // Save state for undo
        this.saveUndoSnapshot();
        
        // Place piece
        this.state.board.placePiece(this.state.currentPiece, origin);
        this.state.piecesPlaced++;
        
        // Clear lines
        const rows = this.state.board.getFullRows();
        const cols = this.state.board.getFullColumns();
        const cleared = this.state.board.clearRowsAndColumns(rows, cols);
        
        // Update progression
        this.state.linesClearedTotal += cleared;
        this.checkLevelUp();
        
        // Spawn next piece
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
        
        this.undoHistory.push(snapshot);
        
        // Limit history size
        if (this.undoHistory.length > 10) {
            this.undoHistory.shift();
        }
    }

    undo() {
        if (!this.undoHistory || this.undoHistory.length === 0 || this.state.undoCharges <= 0) {
            return false;
        }
        
        const snapshot = this.undoHistory.pop();
        
        // Restore state
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
        
        this.state.undoCharges--;
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
        if (this.state.reserveUsedThisTurn) {
            return false;
        }
        
        if (slotIndex < 0 || slotIndex >= this.state.reserveSlots.length) {
            return false;
        }
        
        // Check if slot is unlocked
        let unlockedSlots = 0;
        if (this.state.level >= 10) unlockedSlots = 1;
        if (this.state.level >= 20) unlockedSlots = 2;
        if (this.state.level >= 30) unlockedSlots = 3;
        
        if (slotIndex >= unlockedSlots) {
            return false;
        }
        
        const storedPiece = this.state.reserveSlots[slotIndex];
        
        if (storedPiece === null) {
            // Store current piece
            this.state.reserveSlots[slotIndex] = this.state.currentPiece;
            this.advancePiece();
        } else {
            // Swap pieces
            this.state.reserveSlots[slotIndex] = this.state.currentPiece;
            this.state.currentPiece = storedPiece;
        }
        
        this.state.reserveUsedThisTurn = true;
        return true;
    }

    getValidPlacements(piece = null) {
        if (piece === null) {
            piece = this.state.currentPiece;
        }
        
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
            this.state.linesToNextLevel = Math.min(25 * Math.pow(1.02, this.state.level), 50);
            
            // Check board growth
            const newSize = this.state.getBoardSize();
            if (newSize !== this.state.board.width) {
                this.state.board.resize(newSize, newSize);
            }
            
            // Award power-ups
            this.state.undoCharges++;
            if (this.state.level % 5 === 0) {
                this.state.cleanClearCharges++;
            }
            
            return true;
        }
        return false;
    }

    advancePiece() {
        this.state.currentPiece = this.state.nextPiece;
        this.spawnNextPiece();
    }

    spawnPieces() {
        this.spawnNextPiece();
        this.state.currentPiece = this.state.nextPiece;
        this.spawnNextPiece();
    }

    spawnNextPiece() {
        const unlockedCount = this.state.getUnlockedPieceCount();
        
        // Select piece index
        let pieceIndex;
        if (this.state.difficulty === 'hard') {
            pieceIndex = Math.floor(Math.random() * unlockedCount);
        } else {
            // Weighted selection (favor simpler pieces)
            const weights = [3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1].slice(0, unlockedCount);
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;
            
            pieceIndex = 0;
            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    pieceIndex = i;
                    break;
                }
            }
        }
        
        // Create and transform piece
        const piece = new Piece(pieceIndex);
        piece.rotate(Math.floor(Math.random() * 4));
        if (Math.random() < 0.5) {
            piece.reflect();
        }
        
        this.state.nextPiece = piece;
        this.state.pieceSpawnCounts[pieceIndex]++;
        this.state.pieceSpawnTotal++;
    }
}

// Web Game Implementation
class UrbanIvyWeb {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPieceCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.engine = new GameEngine();
        this.cellSize = 40;
        this.hoverPos = null;
        this.validPlacements = [];
        this.showHints = true;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.updateUI();
        this.render();
    }

    setupCanvas() {
        const boardSize = this.engine.state.board.width;
        this.canvas.width = boardSize * this.cellSize;
        this.canvas.height = boardSize * this.cellSize;
    }

    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverPos = null;
            this.render();
        });

        // Button events
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearLevel());
        document.getElementById('cleanBtn').addEventListener('click', () => this.cleanClear());
        document.getElementById('hintsBtn').addEventListener('click', () => this.toggleHints());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());

        // Swap slot events
        document.querySelectorAll('.swap-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => this.swapPiece(index));
        });
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        
        if (x !== this.hoverPos?.[0] || y !== this.hoverPos?.[1]) {
            this.hoverPos = [x, y];
            this.render();
        }
    }

    handleClick(e) {
        if (this.hoverPos) {
            this.placePiece(this.hoverPos);
        }
    }

    placePiece(origin) {
        const result = this.engine.placePiece(origin);
        
        if (result === false) {
            this.showMessage('Cannot place piece there!', 'warning');
            return;
        }
        
        if (result && result.cleared > 0) {
            this.showMessage(`Cleared ${result.cleared} line${result.cleared > 1 ? 's' : ''}!`, 'success');
        }
        
        // Check for no moves
        if (!this.engine.hasValidMoves()) {
            this.showMessage('No valid moves! Use power actions.', 'warning');
        }
        
        this.updateUI();
        this.render();
    }

    undo() {
        if (this.engine.undo()) {
            this.showMessage('Move undone!', 'info');
            this.updateUI();
            this.render();
        } else {
            this.showMessage('Cannot undo!', 'warning');
        }
    }

    clearLevel() {
        this.engine.clearLevel();
        this.showMessage('Level cleared!', 'info');
        this.updateUI();
        this.render();
    }

    cleanClear() {
        if (this.engine.cleanClear()) {
            this.showMessage('Board cleaned!', 'success');
            this.updateUI();
            this.render();
        } else {
            this.showMessage('No clean clear charges!', 'warning');
        }
    }

    swapPiece(slotIndex) {
        if (this.engine.swapPiece(slotIndex)) {
            this.showMessage(`Swapped with slot ${slotIndex + 1}!`, 'info');
            this.updateUI();
            this.render();
        } else {
            this.showMessage('Cannot swap!', 'warning');
        }
    }

    newGame() {
        this.engine = new GameEngine();
        this.setupCanvas();
        this.showMessage('New game started!', 'success');
        this.updateUI();
        this.render();
    }

    toggleHints() {
        this.showHints = !this.showHints;
        const hintsBtn = document.getElementById('hintsBtn');
        hintsBtn.textContent = this.showHints ? '💡 Hints: ON' : '💡 Hints: OFF';
        hintsBtn.style.background = this.showHints ? 
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
            'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
        this.render();
    }

    updateUI() {
        const state = this.engine.state;
        
        document.getElementById('level').textContent = state.level;
        document.getElementById('lines').textContent = state.linesClearedTotal;
        document.getElementById('remaining').textContent = state.getLinesRemaining();
        document.getElementById('placed').textContent = state.piecesPlaced;
        document.getElementById('undo').textContent = state.undoCharges;
        document.getElementById('clean').textContent = state.cleanClearCharges;
        
        // Update button states
        document.getElementById('undoBtn').disabled = state.undoCharges <= 0;
        document.getElementById('cleanBtn').disabled = state.cleanClearCharges <= 0;
        
        // Update swap slots
        const unlockedSlots = Math.floor(state.level / 10);
        document.querySelectorAll('.swap-slot').forEach((slot, index) => {
            slot.classList.toggle('disabled', index >= unlockedSlots);
            slot.innerHTML = '';
            
            if (state.reserveSlots[index]) {
                this.renderPieceInSlot(slot, state.reserveSlots[index]);
            }
        });
        
        // Update valid placements
        this.validPlacements = this.engine.getValidPlacements();
    }

    render() {
        this.renderBoard();
        this.renderNextPiece();
    }

    renderBoard() {
        const { width, height, occupied } = this.engine.state.board;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#ddd';
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
        
        // Draw occupied cells
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (occupied[x][y]) {
                    this.drawCell(x, y, '#4a5568');
                }
            }
        }
        
        // Draw valid placements
        if (this.showHints) {
            this.ctx.fillStyle = 'rgba(72, 187, 120, 0.3)';
            for (const [x, y] of this.validPlacements) {
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
        
        // Draw hover piece
        if (this.hoverPos && 
            this.validPlacements.some(([x, y]) => x === this.hoverPos[0] && y === this.hoverPos[1])) {
            this.drawPiece(this.engine.state.currentPiece, this.hoverPos, 'rgba(102, 126, 234, 0.7)');
        }
    }

    renderNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const piece = this.engine.state.nextPiece;
        const bounds = piece.getBounds();
        const pieceWidth = bounds[2] - bounds[0] + 1;
        const pieceHeight = bounds[3] - bounds[1] + 1;
        
        const cellSize = Math.min(100 / pieceWidth, 100 / pieceHeight);
        const offsetX = (this.nextCanvas.width - pieceWidth * cellSize) / 2;
        const offsetY = (this.nextCanvas.height - pieceHeight * cellSize) / 2;
        
        for (const [dx, dy] of piece.cells) {
            this.nextCtx.fillStyle = '#667eea';
            this.nextCtx.fillRect(
                offsetX + dx * cellSize,
                offsetY + dy * cellSize,
                cellSize - 2,
                cellSize - 2
            );
        }
    }

    renderPieceInSlot(slotElement, piece) {
        const canvas = document.createElement('canvas');
        canvas.width = 56;
        canvas.height = 56;
        const ctx = canvas.getContext('2d');
        
        const bounds = piece.getBounds();
        const pieceWidth = bounds[2] - bounds[0] + 1;
        const pieceHeight = bounds[3] - bounds[1] + 1;
        
        const cellSize = Math.min(50 / pieceWidth, 50 / pieceHeight);
        const offsetX = (canvas.width - pieceWidth * cellSize) / 2;
        const offsetY = (canvas.height - pieceHeight * cellSize) / 2;
        
        for (const [dx, dy] of piece.cells) {
            ctx.fillStyle = '#667eea';
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
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.cellSize + 2,
            y * this.cellSize + 2,
            this.cellSize - 4,
            this.cellSize - 4
        );
    }

    drawPiece(piece, origin, color) {
        for (const [x, y] of piece.getWorldCells(origin)) {
            this.drawCell(x, y, color);
        }
    }

    showMessage(text, type = 'info') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new UrbanIvyWeb();
});
