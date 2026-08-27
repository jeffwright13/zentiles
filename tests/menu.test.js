describe('Menu / Settings interactions', () => {
  beforeEach(async () => {
    // Minimal DOM required by ZenTilesApp.setupEventListeners()
    document.body.innerHTML = `
      <button id="undoBtn"></button>
      <button id="rotateBtn"></button>
      <button id="clearBtn"></button>
      <button id="cleanBtn"></button>
      <button id="newGameBtn"></button>

      <div class="swap-slot" data-slot="0"></div>
      <div class="swap-slot" data-slot="1"></div>
      <div class="swap-slot" data-slot="2"></div>

      <button id="settingsBtn"></button>
      <div id="settingsPanel"></div>

      <button id="themeBtn"></button>
      <button id="closeThemeModal"></button>
      <div id="themeModal"></div>

      <div id="tooltipsToggle" class="toggle-switch active"></div>
      <div id="hintsToggle" class="toggle-switch"></div>
      <div id="deterministicToggle" class="toggle-switch"></div>
    `;

    await import('../zentiles-app.js');

    // Create a lightweight "app" instance without running constructor/init
    const app = Object.create(window.ZenTilesApp.prototype);
    app.canvas = { addEventListener: jest.fn() };
    app.render = jest.fn();
    app.handleMouseMove = jest.fn();
    app.handleClick = jest.fn();
    app.swapPiece = jest.fn();
    app.undo = jest.fn();
    app.rotatePiece = jest.fn();
    app.clearLevel = jest.fn();
    app.cleanClear = jest.fn();
    app.newGame = jest.fn();
    app.openThemeModal = jest.fn();
    app.closeThemeModal = jest.fn();
    app.toggleHints = jest.fn();
    app.updateTooltips = jest.fn();
    app.showHints = false;
    app.useDeterministicRng = false;
    app.tooltipsEnabled = true;
    app.engine = { state: { useDeterministicRng: false } };
    app.themeManager = { on: jest.fn() };

    // Store for tests
    this.app = app;

    // Install listeners
    app.setupEventListeners();
  });

  test('settings button toggles panel active class', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');

    expect(settingsPanel.classList.contains('active')).toBe(false);

    settingsBtn.click();
    expect(settingsPanel.classList.contains('active')).toBe(true);

    settingsBtn.click();
    expect(settingsPanel.classList.contains('active')).toBe(false);
  });

  test('clicking outside closes the menu', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');

    settingsBtn.click();
    expect(settingsPanel.classList.contains('active')).toBe(true);

    // Click outside: body (document click handler should close)
    document.body.click();
    expect(settingsPanel.classList.contains('active')).toBe(false);
  });

  test('tooltips toggle flips active class and calls updateTooltips()', () => {
    const tooltipsToggle = document.getElementById('tooltipsToggle');

    expect(tooltipsToggle.classList.contains('active')).toBe(true);
    tooltipsToggle.click();

    expect(this.app.updateTooltips).toHaveBeenCalledTimes(1);
    expect(tooltipsToggle.classList.contains('active')).toBe(false);

    tooltipsToggle.click();
    expect(this.app.updateTooltips).toHaveBeenCalledTimes(2);
    expect(tooltipsToggle.classList.contains('active')).toBe(true);
  });

  test('hints toggle calls toggleHints()', () => {
    const hintsToggle = document.getElementById('hintsToggle');

    hintsToggle.click();
    expect(this.app.toggleHints).toHaveBeenCalledTimes(1);
  });

  test('theme button closes menu and opens theme modal', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const themeBtn = document.getElementById('themeBtn');

    settingsBtn.click();
    expect(settingsPanel.classList.contains('active')).toBe(true);

    themeBtn.click();

    expect(settingsPanel.classList.contains('active')).toBe(false);
    expect(this.app.openThemeModal).toHaveBeenCalledTimes(1);
  });

  test('new game button closes menu and triggers newGame()', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const newGameBtn = document.getElementById('newGameBtn');

    settingsBtn.click();
    expect(settingsPanel.classList.contains('active')).toBe(true);

    newGameBtn.click();

    expect(settingsPanel.classList.contains('active')).toBe(false);
    expect(this.app.newGame).toHaveBeenCalledTimes(1);
  });

  test('deterministic toggle flips class and updates engine state', () => {
    const deterministicToggle = document.getElementById('deterministicToggle');

    expect(deterministicToggle.classList.contains('active')).toBe(false);
    expect(this.app.engine.state.useDeterministicRng).toBe(false);

    deterministicToggle.click();

    expect(deterministicToggle.classList.contains('active')).toBe(true);
    expect(this.app.engine.state.useDeterministicRng).toBe(true);
  });
});
