describe('Undo restores piece and board state', () => {
  beforeEach(async () => {
    await import('../zentiles-app.js');
    window.localStorage.clear();
  });

  function placeSingleCell(engine, origin) {
    // Force current piece to be a single cell
    engine.state.currentPiece = new window.Piece(0); // 0 is single-cell
    return engine.placePiece(origin);
  }

  test('first undo restores board and current piece to pre-placement state', () => {
    const engine = new window.GameEngine();
    const board = engine.state.board;
    board.clearBoard();

    // Force current piece to be a single cell, and next piece to a known,
    // guaranteed-different shape, BEFORE capturing initial state. Without
    // pinning nextPiece, its shapeIndex is randomly generated and can also
    // land on 0 (single-cell), making the "piece changed" assertion below
    // flaky (~25% failure rate).
    engine.state.currentPiece = new window.Piece(0);
    engine.state.nextPiece = new window.Piece(1);
    const initialPieceShape = engine.state.currentPiece.shapeIndex;
    const initialPieceCells = JSON.parse(JSON.stringify(engine.state.currentPiece.cells));
    const initialNextPieceShape = engine.state.nextPiece.shapeIndex;
    const initialBoardEmpty = board.isBoardEmpty();

    // Place a piece
    const placed = placeSingleCell(engine, [2, 2]);
    expect(placed).toBeTruthy();

    // After placement, board should not be empty and current piece should have changed
    expect(engine.state.board.isBoardEmpty()).toBe(false);
    expect(engine.state.currentPiece.shapeIndex).not.toBe(initialPieceShape);

    // Undo
    const undoOk = engine.undo();
    expect(undoOk).toBe(true);

    // After undo, board should be empty again and current piece should be restored
    expect(engine.state.board.isBoardEmpty()).toBe(initialBoardEmpty);
    expect(engine.state.currentPiece.shapeIndex).toBe(initialPieceShape);
    expect(JSON.stringify(engine.state.currentPiece.cells)).toBe(JSON.stringify(initialPieceCells));
    // nextPiece should also be restored
    expect(engine.state.nextPiece.shapeIndex).toBe(initialNextPieceShape);
  });
});
