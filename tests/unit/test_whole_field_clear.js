/**
 * Test suite for whole field clear Clean Clear bonus functionality
 * Tests that clearing the entire board with a shape placement awards an additional Clean Clear charge
 */

// Import the game classes (would need to be adapted for actual module system)
// For now, we'll test by loading the HTML page and accessing the global app

class WholeFieldClearTests {
    constructor() {
        this.testResults = [];
    }

    // Helper method to create a test board state
    createCrossPattern(engine) {
        const board = engine.state.board;
        board.clearBoard();
        
        // Create a cross pattern where filling one cell will complete a full row and column
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

    // Test that clearing the entire board awards an additional Clean Clear charge
    testWholeFieldClearAwardsCleanClear() {
        console.log("Testing whole field clear awards additional Clean Clear...");
        
        try {
            // Create a fresh game engine
            const engine = new GameEngine();
            const board = this.createCrossPattern(engine);
            
            console.log("Cross pattern created - missing only (0,0)");
            console.log(`Full rows before: ${[...board.getFullRows()]}`);
            console.log(`Full columns before: ${[...board.getFullColumns()]}`);
            
            // Get initial clean clear charges
            const initialCharges = engine.state.cleanClearCharges;
            console.log(`Initial Clean Clear charges: ${initialCharges}`);
            
            // Use a single cell piece to fill the missing (0,0)
            engine.state.currentPiece = new Piece(0); // Single cell piece
            
            // Place the piece at (0,0) - this should complete row 0 and column 0, clearing everything
            const result = engine.placePiece([0, 0]);
            
            console.log(`Piece placement result: ${result}`);
            console.log(`Full rows after: ${[...board.getFullRows()]}`);
            console.log(`Full columns after: ${[...board.getFullColumns()]}`);
            console.log(`Board is empty: ${board.isBoardEmpty()}`);
            console.log(`Final Clean Clear charges: ${engine.state.cleanClearCharges}`);
            
            // Check that we got an additional charge
            const expectedCharges = initialCharges + 1;
            const success = engine.state.cleanClearCharges === expectedCharges;
            
            if (success) {
                console.log("✅ SUCCESS: Additional Clean Clear charge awarded!");
                this.testResults.push({ name: "Whole Field Clear", passed: true });
            } else {
                console.log(`❌ FAILURE: Expected ${expectedCharges} charges, got ${engine.state.cleanClearCharges}`);
                this.testResults.push({ 
                    name: "Whole Field Clear", 
                    passed: false, 
                    error: `Expected ${expectedCharges} charges, got ${engine.state.cleanClearCharges}` 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in whole field clear test:", error);
            this.testResults.push({ 
                name: "Whole Field Clear", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test that partial clears don't award additional Clean Clear charges
    testPartialClearNoAdditionalCharge() {
        console.log("\nTesting partial clear doesn't award additional Clean Clear...");
        
        try {
            // Create a fresh game engine
            const engine = new GameEngine();
            const board = engine.state.board;
            
            // Set up a scenario where only one row is cleared
            board.clearBoard();
            
            // Fill one complete row except for one cell
            for (let x = 1; x < board.width; x++) {
                board.occupied[x][2] = true;
            }
            
            // Get initial clean clear charges
            const initialCharges = engine.state.cleanClearCharges;
            console.log(`Initial Clean Clear charges: ${initialCharges}`);
            
            // Place a piece that completes the row but doesn't clear the whole board
            engine.state.currentPiece = new Piece(0); // Single cell piece
            
            // Place piece to complete the row
            const result = engine.placePiece([0, 2]);
            
            console.log(`Piece placement result: ${result}`);
            console.log(`Board is empty: ${board.isBoardEmpty()}`);
            console.log(`Final Clean Clear charges: ${engine.state.cleanClearCharges}`);
            
            // Check that we didn't get an additional charge
            const success = engine.state.cleanClearCharges === initialCharges;
            
            if (success) {
                console.log("✅ SUCCESS: No additional Clean Clear charge awarded for partial clear!");
                this.testResults.push({ name: "Partial Clear", passed: true });
            } else {
                console.log(`❌ FAILURE: Expected ${initialCharges} charges, got ${engine.state.cleanClearCharges}`);
                this.testResults.push({ 
                    name: "Partial Clear", 
                    passed: false, 
                    error: `Expected ${initialCharges} charges, got ${engine.state.cleanClearCharges}` 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in partial clear test:", error);
            this.testResults.push({ 
                name: "Partial Clear", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test that placements with no clears don't award additional charges
    testNoClearNoAdditionalCharge() {
        console.log("\nTesting no clear doesn't award additional Clean Clear...");
        
        try {
            // Create a fresh game engine
            const engine = new GameEngine();
            
            // Get initial clean clear charges
            const initialCharges = engine.state.cleanClearCharges;
            console.log(`Initial Clean Clear charges: ${initialCharges}`);
            
            // Place a piece that doesn't clear anything
            const result = engine.placePiece([0, 0]);
            
            console.log(`Piece placement result: ${result}`);
            console.log(`Board is empty: ${engine.state.board.isBoardEmpty()}`);
            console.log(`Final Clean Clear charges: ${engine.state.cleanClearCharges}`);
            
            // Check that we didn't get an additional charge
            const success = engine.state.cleanClearCharges === initialCharges;
            
            if (success) {
                console.log("✅ SUCCESS: No additional Clean Clear charge awarded for no clear!");
                this.testResults.push({ name: "No Clear", passed: true });
            } else {
                console.log(`❌ FAILURE: Expected ${initialCharges} charges, got ${engine.state.cleanClearCharges}`);
                this.testResults.push({ 
                    name: "No Clear", 
                    passed: false, 
                    error: `Expected ${initialCharges} charges, got ${engine.state.cleanClearCharges}` 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in no clear test:", error);
            this.testResults.push({ 
                name: "No Clear", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Run all tests
    runAllTests() {
        console.log("Running JavaScript tests for whole field clear Clean Clear bonus...");
        console.log("=" * 60);
        
        this.testResults = [];
        
        const test1 = this.testWholeFieldClearAwardsCleanClear();
        const test2 = this.testPartialClearNoAdditionalCharge();
        const test3 = this.testNoClearNoAdditionalCharge();
        
        console.log("\n" + "=".repeat(50));
        
        const allPassed = test1 && test2 && test3;
        
        if (allPassed) {
            console.log("🎉 ALL TESTS PASSED! The fix is working correctly.");
        } else {
            console.log("💥 SOME TESTS FAILED! The fix needs more work.");
        }
        
        // Print summary
        console.log("\nTest Summary:");
        this.testResults.forEach(test => {
            const status = test.passed ? "✅ PASS" : "❌ FAIL";
            console.log(`${status} ${test.name}`);
            if (!test.passed && test.error) {
                console.log(`   Error: ${test.error}`);
            }
        });
        
        return allPassed;
    }
}

// Function to run tests when the page loads
function runWholeFieldClearTests() {
    // Wait for the game classes to be available
    if (typeof GameEngine === 'undefined' || typeof Piece === 'undefined') {
        console.log("Waiting for game classes to load...");
        setTimeout(runWholeFieldClearTests, 100);
        return;
    }
    
    const tester = new WholeFieldClearTests();
    return tester.runAllTests();
}

// Export for use in browser console or testing framework
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WholeFieldClearTests;
} else {
    // Browser environment - attach to window
    window.WholeFieldClearTests = WholeFieldClearTests;
    window.runWholeFieldClearTests = runWholeFieldClearTests;
}
