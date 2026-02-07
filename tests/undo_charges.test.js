describe('Undo charges', () => {
  beforeEach(async () => {
    // Load game module (ESM) and expose classes on window
    await import('../zentiles-app.js');

    // Ensure clean storage between tests
    window.localStorage.clear();
  });

  function placeSingleCell(engine, origin) {
    engine.state.currentPiece = new window.Piece(0);
    return engine.placePiece(origin);
  }

  test('each undo spends 1 charge', () => {
    const engine = new window.GameEngine();
    const initialCharges = engine.state.undoCharges;

    const placed = placeSingleCell(engine, [0, 0]);
    expect(placed).toBeTruthy();

    const ok = engine.undo();
    expect(ok).toBe(true);
    expect(engine.state.undoCharges).toBe(initialCharges - 1);
  });

  test('undo is blocked when charges reach zero even if history remains', () => {
    const engine = new window.GameEngine();
    const initialCharges = engine.state.undoCharges;

    // Create more history than charges
    for (let i = 0; i < initialCharges + 2; i++) {
      const placed = placeSingleCell(engine, [i % engine.state.board.width, Math.floor(i / engine.state.board.width)]);
      expect(placed).toBeTruthy();
    }

    let successfulUndos = 0;
    while (engine.undo()) {
      successfulUndos++;
    }

    expect(successfulUndos).toBe(initialCharges);
    expect(engine.state.undoCharges).toBe(0);
    expect(engine.undoHistory.length).toBeGreaterThan(0);
  });

  test('undo with no history fails without spending a charge', () => {
    const engine = new window.GameEngine();
    const initialCharges = engine.state.undoCharges;

    const ok = engine.undo();
    expect(ok).toBe(false);
    expect(engine.state.undoCharges).toBe(initialCharges);
  });
});
