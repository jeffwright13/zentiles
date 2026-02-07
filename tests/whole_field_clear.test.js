describe('Whole field clear Clean Clear bonus', () => {
  beforeEach(async () => {
    await import('../zentiles-app.js');
    window.localStorage.clear();
  });

  function createCrossPattern(engine) {
    const board = engine.state.board;
    board.clearBoard();

    // Fill row 0 except for (0,0)
    for (let x = 1; x < board.width; x++) {
      board.occupied[x][0] = true;
    }

    // Fill column 0 except for (0,0)
    for (let y = 1; y < board.height; y++) {
      board.occupied[0][y] = true;
    }

    return board;
  }

  test('clearing entire board by placement awards +1 clean clear charge', () => {
    const engine = new window.GameEngine();
    const board = createCrossPattern(engine);

    const initialCharges = engine.state.cleanClearCharges;

    engine.state.currentPiece = new window.Piece(0);
    const result = engine.placePiece([0, 0]);

    expect(result).toBeTruthy();
    expect(board.isBoardEmpty()).toBe(true);
    expect(engine.state.cleanClearCharges).toBe(initialCharges + 1);
  });

  test('partial clear does not award additional charge', () => {
    const engine = new window.GameEngine();
    const board = engine.state.board;
    board.clearBoard();

    // Fill one row except one cell
    for (let x = 1; x < board.width; x++) {
      board.occupied[x][2] = true;
    }

    // Ensure the board will NOT be empty after the clear
    board.occupied[0][0] = true;

    const initialCharges = engine.state.cleanClearCharges;

    engine.state.currentPiece = new window.Piece(0);
    const result = engine.placePiece([0, 2]);

    expect(result).toBeTruthy();
    expect(engine.state.cleanClearCharges).toBe(initialCharges);
  });
});
