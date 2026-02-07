/**
 * Test Configuration for ZenTiles
 * Central configuration for all test settings and utilities
 */

window.TestConfig = {
    // Test settings
    timeout: 5000,
    verbose: true,
    
    // Test categories
    categories: {
        unit: {
            name: 'Unit Tests',
            description: 'Individual component testing',
            path: 'unit/'
        },
        integration: {
            name: 'Integration Tests', 
            description: 'End-to-end testing',
            path: 'integration/'
        }
    },
    
    // Test utilities
    utils: {
        // Create a fresh game engine for testing
        createTestEngine: function() {
            return new GameEngine();
        },
        
        // Helper to create test board states
        createEmptyBoard: function(engine) {
            engine.state.board.clearBoard();
            return engine.state.board;
        },
        
        // Helper to create cross pattern for whole field clear tests
        createCrossPattern: function(engine) {
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
        },
        
        // Assert helper
        assert: function(condition, message) {
            if (!condition) {
                throw new Error(`Assertion failed: ${message}`);
            }
        },
        
        // Assert equals helper
        assertEqual: function(actual, expected, message) {
            if (actual !== expected) {
                throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
            }
        }
    }
};
