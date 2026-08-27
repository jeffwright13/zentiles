describe('Rotate charges', () => {
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

  test('first rotate on a piece spends 1 charge and unlocks free re-rotation', () => {
    const engine = new window.GameEngine();
    engine.state.rotateCharges = 3;

    const ok1 = engine.rotateCurrentPiece();
    expect(ok1).toBe(true);
    expect(engine.state.rotateCharges).toBe(2);
    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(true);

    const ok2 = engine.rotateCurrentPiece();
    expect(ok2).toBe(true);
    expect(engine.state.rotateCharges).toBe(2);
  });

  test('rotate is blocked when charges are zero', () => {
    const engine = new window.GameEngine();
    engine.state.rotateCharges = 0;

    const ok = engine.rotateCurrentPiece();
    expect(ok).toBe(false);
    expect(engine.state.rotateCharges).toBe(0);
    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(false);
  });

  test('rotate unlock resets once the current piece changes', () => {
    const engine = new window.GameEngine();
    engine.state.rotateCharges = 1;

    expect(engine.rotateCurrentPiece()).toBe(true);
    expect(engine.state.rotateCharges).toBe(0);
    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(true);

    const placed = placeSingleCell(engine, [0, 0]);
    expect(placed).toBeTruthy();
    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(false);

    // No charges left, and the new piece isn't unlocked, so rotate fails again
    expect(engine.rotateCurrentPiece()).toBe(false);
  });

  test('rotate charges earned on level-up are capped at MAX_ROTATE_CHARGES', () => {
    const engine = new window.GameEngine();
    engine.state.level = 2;
    engine.state.rotateCharges = window.GameEngine.MAX_ROTATE_CHARGES;
    engine.state.linesClearedTotal = engine.state.linesAtLevelStart + engine.state.linesToNextLevel;

    engine.checkLevelUp();

    expect(engine.state.level).toBe(3);
    expect(engine.state.rotateCharges).toBe(window.GameEngine.MAX_ROTATE_CHARGES);
  });

  test('rotate charge is awarded every 3 levels, below the cap', () => {
    const engine = new window.GameEngine();
    engine.state.level = 2;
    engine.state.rotateCharges = 1;
    engine.state.linesClearedTotal = engine.state.linesAtLevelStart + engine.state.linesToNextLevel;

    engine.checkLevelUp();

    expect(engine.state.level).toBe(3);
    expect(engine.state.rotateCharges).toBe(2);
  });

  test('undo restores rotateCharges and rotateUnlockedForCurrentPiece', () => {
    const engine = new window.GameEngine();
    engine.state.rotateCharges = 2;

    const placed = placeSingleCell(engine, [0, 0]);
    expect(placed).toBeTruthy();

    expect(engine.rotateCurrentPiece()).toBe(true);
    expect(engine.state.rotateCharges).toBe(1);
    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(true);

    const ok = engine.undo();
    expect(ok).toBe(true);
    expect(engine.state.rotateCharges).toBe(2);
    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(false);
  });

  test('clearLevel resets rotateUnlockedForCurrentPiece so the fresh piece is not free to rotate', () => {
    const engine = new window.GameEngine();
    engine.state.rotateCharges = 1;

    expect(engine.rotateCurrentPiece()).toBe(true);
    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(true);

    engine.clearLevel();

    expect(engine.state.rotateUnlockedForCurrentPiece).toBe(false);
    // No charges left, and the new piece isn't unlocked, so rotate fails
    expect(engine.rotateCurrentPiece()).toBe(false);
  });

  test('loading a pre-Rotate-feature save defaults missing rotate fields instead of corrupting to NaN', () => {
    // Build a real save, then strip the rotate fields to simulate a save
    // written before this feature existed (both top-level and in an undo
    // history snapshot, which is restored via a separate code path).
    const engine = new window.GameEngine();
    engine.state.rotateCharges = 3;
    const placed = placeSingleCell(engine, [0, 0]);
    expect(placed).toBeTruthy();
    engine.saveGame();

    const data = JSON.parse(window.localStorage.getItem(window.GameEngine.SAVE_KEY));
    delete data.rotateCharges;
    delete data.rotateUnlockedForCurrentPiece;
    data.undoHistory.forEach((snap) => {
      delete snap.rotateCharges;
      delete snap.rotateUnlockedForCurrentPiece;
    });
    window.localStorage.setItem(window.GameEngine.SAVE_KEY, JSON.stringify(data));

    const loaded = window.GameEngine.loadGame();
    expect(loaded.state.rotateCharges).toBe(0);
    expect(loaded.state.rotateUnlockedForCurrentPiece).toBe(false);

    // Rotating without charges must be blocked, not silently allowed via NaN
    expect(loaded.rotateCurrentPiece()).toBe(false);
    expect(loaded.state.rotateCharges).toBe(0);

    // Undoing into the legacy snapshot must also default cleanly, not to NaN/undefined
    const ok = loaded.undo();
    expect(ok).toBe(true);
    expect(loaded.state.rotateCharges).toBe(0);
    expect(loaded.state.rotateUnlockedForCurrentPiece).toBe(false);
    expect(loaded.rotateCurrentPiece()).toBe(false);
  });
});
