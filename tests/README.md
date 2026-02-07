# ZenTiles Test Suite

This directory contains the test suite for the ZenTiles game.

## Directory Structure

```
tests/
├── README.md                # This file
├── package.json             # Test configuration
├── test-config.js           # Shared test utilities and configuration
├── test_runner.html         # HTML test runner for browser testing
├── unit/                    # Unit tests
│   ├── test_whole_field_clear.js  # Tests for whole field clear functionality
│   └── test_menu_functionality.js # Tests for Menu/Settings button functionality
└── integration/             # Integration tests (future)
```

## Test Categories

### Unit Tests (`tests/unit/`)
- Individual component testing
- Core game logic testing
- UI interaction testing
- Currently contains:
  - `test_whole_field_clear.js` - Tests the whole field clear Clean Clear bonus feature
  - `test_menu_functionality.js` - Tests Menu/Settings button and all menu interactions

### Integration Tests (`tests/integration/`)
- End-to-end testing
- Multi-component interaction testing
- (Planned for future implementation)

## Running Tests

### Browser Testing
1. Open `tests/test_runner.html` in a web browser
2. Click "Run Tests" to execute the test suite
3. View results in the browser interface

### Console Testing
1. Open the main game (`index.html`) in a browser
2. Open browser developer console
3. Run `runWholeFieldClearTests()` to execute whole field clear tests
4. Run `runMenuTests()` to execute menu functionality tests

## Test Coverage

### Current Tests
- ✅ Whole field clear awards additional Clean Clear charge
- ✅ Partial clear doesn't award additional charge
- ✅ No clear doesn't award additional charge
- ✅ Menu button toggles settings panel
- ✅ Click outside closes menu
- ✅ Tooltips toggle functionality
- ✅ Hints toggle functionality
- ✅ Deterministic toggle functionality
- ✅ Theme modal open/close
- ✅ New game button functionality
- ✅ Audio controls functionality
- ✅ Undo charge decrement (1 charge per undo)
- ✅ Multiple consecutive undos
- ✅ Undo fails with no charges available
- ✅ Undo restores complete game state
- ✅ Undo after level progression
- ✅ Undo with clean clear charges
- ✅ Undo after whole field clear bonus
- ✅ Undo with swap slots state
- ✅ Undo with no history (empty undo stack)
- ✅ Undo preserves deterministic RNG state

### Future Tests
- Board resize functionality
- Piece placement validation
- Level progression logic
- Swap slot functionality
- Undo/redo functionality
- Theme system integration

## Adding New Tests

1. Create new test files in appropriate subdirectory (`unit/` or `integration/`)
2. Follow the existing test pattern in `test_whole_field_clear.js`
3. Update `test_runner.html` to include new test files
4. Update this README with new test descriptions

## Test Framework

The tests use a custom lightweight JavaScript testing framework designed specifically for the ZenTiles game engine. The framework provides:

- Test result tracking
- Console output capture
- Pass/fail status reporting
- Error handling and reporting

## Notes

- Tests require the main game classes (`GameEngine`, `Piece`, `Board`) to be loaded
- All tests are designed to run in browser environment
- Tests are independent and can be run individually or as a suite
