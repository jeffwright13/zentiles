/**
 * Test suite for Undo functionality
 * Tests that undo charges are properly decremented and restored
 */

class UndoTests {
    constructor() {
        this.testResults = [];
    }

    // Test that undo charges are properly decremented
    testUndoChargeDecrement() {
        console.log("Testing undo charge decrement...");
        
        try {
            const engine = new GameEngine();
            const initialCharges = engine.state.undoCharges;
            console.log(`Initial undo charges: ${initialCharges}`);
            
            // Place a piece to create a save state
            const result = engine.placePiece([0, 0]);
            console.log(`Piece placed: ${result}`);
            
            // Charges should be the same after placing (only decremented on undo)
            const chargesAfterPlace = engine.state.undoCharges;
            console.log(`Charges after placing: ${chargesAfterPlace}`);
            
            // Undo the move
            const undoResult = engine.undo();
            console.log(`Undo result: ${undoResult}`);
            
            // Charges should be decremented by 1
            const chargesAfterUndo = engine.state.undoCharges;
            console.log(`Charges after undo: ${chargesAfterUndo}`);
            
            const expectedCharges = initialCharges - 1;
            const success = undoResult && chargesAfterUndo === expectedCharges;
            
            if (success) {
                console.log("✅ SUCCESS: Undo charges properly decremented");
                this.testResults.push({ name: "Undo Charge Decrement", passed: true });
            } else {
                console.log(`❌ FAILURE: Expected ${expectedCharges} charges, got ${chargesAfterUndo}`);
                this.testResults.push({ 
                    name: "Undo Charge Decrement", 
                    passed: false, 
                    error: `Expected ${expectedCharges} charges, got ${chargesAfterUndo}` 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo charge test:", error);
            this.testResults.push({ 
                name: "Undo Charge Decrement", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test multiple undos
    testMultipleUndos() {
        console.log("\nTesting multiple undos...");
        
        try {
            const engine = new GameEngine();
            const initialCharges = engine.state.undoCharges;
            console.log(`Initial undo charges: ${initialCharges}`);
            
            // Place multiple pieces
            const moves = [[0, 0], [1, 1], [2, 2]];
            for (const move of moves) {
                engine.placePiece(move);
            }
            console.log(`Placed ${moves.length} pieces`);
            
            // Undo all moves
            let undoCount = 0;
            for (let i = 0; i < moves.length; i++) {
                const result = engine.undo();
                if (result) {
                    undoCount++;
                } else {
                    break;
                }
            }
            
            const finalCharges = engine.state.undoCharges;
            const expectedCharges = initialCharges - undoCount;
            console.log(`Undid ${undoCount} moves`);
            console.log(`Final charges: ${finalCharges}, expected: ${expectedCharges}`);
            
            const success = undoCount === moves.length && finalCharges === expectedCharges;
            
            if (success) {
                console.log("✅ SUCCESS: Multiple undos work correctly");
                this.testResults.push({ name: "Multiple Undos", passed: true });
            } else {
                console.log(`❌ FAILURE: Expected to undo ${moves.length} moves, actually undid ${undoCount}`);
                this.testResults.push({ 
                    name: "Multiple Undos", 
                    passed: false, 
                    error: `Expected to undo ${moves.length} moves, actually undid ${undoCount}` 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in multiple undos test:", error);
            this.testResults.push({ 
                name: "Multiple Undos", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo with no charges
    testUndoWithNoCharges() {
        console.log("\nTesting undo with no charges...");
        
        try {
            const engine = new GameEngine();
            
            // Use all undo charges
            while (engine.state.undoCharges > 0) {
                engine.placePiece([0, 0]);
                engine.undo();
            }
            
            const chargesBefore = engine.state.undoCharges;
            console.log(`Charges before attempting undo: ${chargesBefore}`);
            
            // Try to undo with no charges
            const undoResult = engine.undo();
            const chargesAfter = engine.state.undoCharges;
            
            console.log(`Undo result: ${undoResult}`);
            console.log(`Charges after: ${chargesAfter}`);
            
            const success = !undoResult && chargesBefore === chargesAfter && chargesBefore === 0;
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly fails with no charges");
                this.testResults.push({ name: "Undo No Charges", passed: true });
            } else {
                console.log(`❌ FAILURE: Undo should have failed but didn't`);
                this.testResults.push({ 
                    name: "Undo No Charges", 
                    passed: false, 
                    error: "Undo should have failed with no charges" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo no charges test:", error);
            this.testResults.push({ 
                name: "Undo No Charges", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo restores game state correctly
    testUndoRestoresState() {
        console.log("\nTesting undo restores game state...");
        
        try {
            const engine = new GameEngine();
            
            // Get initial state
            const initialPiecesPlaced = engine.state.piecesPlaced;
            const initialLinesCleared = engine.state.linesClearedTotal;
            const initialBoardEmpty = engine.state.board.isBoardEmpty();
            
            console.log(`Initial state - Pieces: ${initialPiecesPlaced}, Lines: ${initialLinesCleared}, Board empty: ${initialBoardEmpty}`);
            
            // Place a piece
            const placeResult = engine.placePiece([0, 0]);
            const afterPlacePieces = engine.state.piecesPlaced;
            const afterPlaceBoardEmpty = engine.state.board.isBoardEmpty();
            
            console.log(`After place - Pieces: ${afterPlacePieces}, Board empty: ${afterPlaceBoardEmpty}`);
            
            // Undo the move
            const undoResult = engine.undo();
            const afterUndoPieces = engine.state.piecesPlaced;
            const afterUndoLines = engine.state.linesClearedTotal;
            const afterUndoBoardEmpty = engine.state.board.isBoardEmpty();
            
            console.log(`After undo - Pieces: ${afterUndoPieces}, Lines: ${afterUndoLines}, Board empty: ${afterUndoBoardEmpty}`);
            
            const success = placeResult && undoResult && 
                           afterUndoPieces === initialPiecesPlaced &&
                           afterUndoLines === initialLinesCleared &&
                           afterUndoBoardEmpty === initialBoardEmpty;
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly restores game state");
                this.testResults.push({ name: "Undo Restore State", passed: true });
            } else {
                console.log(`❌ FAILURE: State not properly restored`);
                this.testResults.push({ 
                    name: "Undo Restore State", 
                    passed: false, 
                    error: "Game state not properly restored after undo" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo restore state test:", error);
            this.testResults.push({ 
                name: "Undo Restore State", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo after level progression
    testUndoAfterLevelUp() {
        console.log("\nTesting undo after level progression...");
        
        try {
            const engine = new GameEngine();
            const initialLevel = engine.state.level;
            const initialCharges = engine.state.undoCharges;
            
            console.log(`Initial level: ${initialLevel}, charges: ${initialCharges}`);
            
            // Manipulate state to trigger level up
            engine.state.linesClearedTotal = engine.state.linesAtLevelStart + 25;
            engine.state.linesToNextLevel = 25;
            
            // Place a piece that should trigger level up
            const placeResult = engine.placePiece([0, 0]);
            const afterPlaceLevel = engine.state.level;
            const afterPlaceCharges = engine.state.undoCharges;
            
            console.log(`After place - Level: ${afterPlaceLevel}, charges: ${afterPlaceCharges}`);
            
            // Undo the level up
            const undoResult = engine.undo();
            const afterUndoLevel = engine.state.level;
            const afterUndoCharges = engine.state.undoCharges;
            
            console.log(`After undo - Level: ${afterUndoLevel}, charges: ${afterUndoCharges}`);
            
            const success = placeResult && undoResult &&
                           afterUndoLevel === initialLevel &&
                           afterUndoCharges === initialCharges - 1; // Should lose 1 charge for the undo
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly handles level progression");
                this.testResults.push({ name: "Undo After Level Up", passed: true });
            } else {
                console.log(`❌ FAILURE: Level progression not properly handled in undo`);
                this.testResults.push({ 
                    name: "Undo After Level Up", 
                    passed: false, 
                    error: "Level progression state not properly restored" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo after level up test:", error);
            this.testResults.push({ 
                name: "Undo After Level Up", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo with clean clear charges
    testUndoWithCleanClearCharges() {
        console.log("\nTesting undo with clean clear charges...");
        
        try {
            const engine = new GameEngine();
            const initialCleanClearCharges = engine.state.cleanClearCharges;
            
            console.log(`Initial clean clear charges: ${initialCleanClearCharges}`);
            
            // Award an additional clean clear charge by manipulating state
            engine.state.cleanClearCharges = initialCleanClearCharges + 1;
            
            // Place a piece
            const placeResult = engine.placePiece([0, 0]);
            const afterPlaceCharges = engine.state.cleanClearCharges;
            
            console.log(`After place - Clean clear charges: ${afterPlaceCharges}`);
            
            // Undo the move
            const undoResult = engine.undo();
            const afterUndoCharges = engine.state.cleanClearCharges;
            
            console.log(`After undo - Clean clear charges: ${afterUndoCharges}`);
            
            const success = placeResult && undoResult &&
                           afterUndoCharges === initialCleanClearCharges;
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly restores clean clear charges");
                this.testResults.push({ name: "Undo Clean Clear Charges", passed: true });
            } else {
                console.log(`❌ FAILURE: Clean clear charges not properly restored`);
                this.testResults.push({ 
                    name: "Undo Clean Clear Charges", 
                    passed: false, 
                    error: "Clean clear charges not properly restored after undo" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo clean clear charges test:", error);
            this.testResults.push({ 
                name: "Undo Clean Clear Charges", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo after whole field clear (bonus charge scenario)
    testUndoAfterWholeFieldClear() {
        console.log("\nTesting undo after whole field clear bonus...");
        
        try {
            const engine = new GameEngine();
            const initialCleanClearCharges = engine.state.cleanClearCharges;
            
            console.log(`Initial clean clear charges: ${initialCleanClearCharges}`);
            
            // Create a scenario that will trigger whole field clear
            const board = engine.state.board;
            
            // Fill row 0 except for (0,0)
            for (let x = 1; x < board.width; x++) {
                board.occupied[x][0] = true;
            }
            
            // Fill column 0 except for (0,0)
            for (let y = 1; y < board.height; y++) {
                board.occupied[0][y] = true;
            }
            
            // Use single cell piece to complete the cross
            engine.state.currentPiece = new Piece(0);
            
            // Place piece that should clear whole field and award bonus
            const placeResult = engine.placePiece([0, 0]);
            const afterPlaceCharges = engine.state.cleanClearCharges;
            const afterPlaceUndoCharges = engine.state.undoCharges;
            
            console.log(`After place - Clean clear charges: ${afterPlaceCharges}, Undo charges: ${afterPlaceUndoCharges}`);
            
            // Undo the move
            const undoResult = engine.undo();
            const afterUndoCharges = engine.state.cleanClearCharges;
            const afterUndoUndoCharges = engine.state.undoCharges;
            
            console.log(`After undo - Clean clear charges: ${afterUndoCharges}, Undo charges: ${afterUndoUndoCharges}`);
            
            const success = placeResult && undoResult &&
                           afterUndoCharges === initialCleanClearCharges &&
                           afterUndoUndoCharges === afterPlaceUndoCharges - 1;
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly handles whole field clear bonus");
                this.testResults.push({ name: "Undo After Whole Field Clear", passed: true });
            } else {
                console.log(`❌ FAILURE: Whole field clear bonus not properly handled in undo`);
                this.testResults.push({ 
                    name: "Undo After Whole Field Clear", 
                    passed: false, 
                    error: "Whole field clear bonus state not properly restored" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo after whole field clear test:", error);
            this.testResults.push({ 
                name: "Undo After Whole Field Clear", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo with swap slots
    testUndoWithSwapSlots() {
        console.log("\nTesting undo with swap slots...");
        
        try {
            const engine = new GameEngine();
            
            // Set level high enough to unlock swap slots
            engine.state.level = 10;
            const initialPiece = engine.state.currentPiece;
            
            console.log(`Initial piece shape: ${initialPiece.shapeIndex}`);
            
            // Swap current piece to slot 0
            const swapResult = engine.swapPiece(0);
            const afterSwapPiece = engine.state.currentPiece;
            const afterSwapSlot = engine.state.reserveSlots[0];
            
            console.log(`After swap - Current piece: ${afterSwapPiece.shapeIndex}, Slot 0: ${afterSwapSlot.shapeIndex}`);
            
            // Place a piece (to create undo state after swap)
            const placeResult = engine.placePiece([0, 0]);
            
            // Undo the move
            const undoResult = engine.undo();
            const afterUndoPiece = engine.state.currentPiece;
            const afterUndoSlot = engine.state.reserveSlots[0];
            
            console.log(`After undo - Current piece: ${afterUndoPiece.shapeIndex}, Slot 0: ${afterUndoSlot.shapeIndex}`);
            
            const success = swapResult && placeResult && undoResult &&
                           afterUndoPiece.shapeIndex === afterSwapPiece.shapeIndex &&
                           afterUndoSlot.shapeIndex === afterSwapSlot.shapeIndex;
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly handles swap slots");
                this.testResults.push({ name: "Undo Swap Slots", passed: true });
            } else {
                console.log(`❌ FAILURE: Swap slots not properly restored in undo`);
                this.testResults.push({ 
                    name: "Undo Swap Slots", 
                    passed: false, 
                    error: "Swap slots state not properly restored after undo" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo swap slots test:", error);
            this.testResults.push({ 
                name: "Undo Swap Slots", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo with no history (empty undo history)
    testUndoWithNoHistory() {
        console.log("\nTesting undo with no history...");
        
        try {
            const engine = new GameEngine();
            const initialCharges = engine.state.undoCharges;
            
            console.log(`Initial undo charges: ${initialCharges}`);
            console.log(`Undo history length: ${engine.undoHistory.length}`);
            
            // Try to undo without any moves made
            const undoResult = engine.undo();
            const finalCharges = engine.state.undoCharges;
            
            console.log(`Undo result: ${undoResult}`);
            console.log(`Final charges: ${finalCharges}`);
            
            const success = !undoResult && finalCharges === initialCharges;
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly fails with no history");
                this.testResults.push({ name: "Undo No History", passed: true });
            } else {
                console.log(`❌ FAILURE: Undo should have failed with no history`);
                this.testResults.push({ 
                    name: "Undo No History", 
                    passed: false, 
                    error: "Undo should have failed with no history" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo no history test:", error);
            this.testResults.push({ 
                name: "Undo No History", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test undo preserves deterministic RNG state
    testUndoPreservesRNGState() {
        console.log("\nTesting undo preserves RNG state...");
        
        try {
            const engine = new GameEngine();
            engine.state.useDeterministicRng = true;
            const initialSeed = engine.state.rngSeed;
            
            console.log(`Initial RNG seed: ${initialSeed}`);
            
            // Place a piece (this advances RNG)
            const placeResult = engine.placePiece([0, 0]);
            const afterPlaceSeed = engine.state.rngSeed;
            
            console.log(`After place RNG seed: ${afterPlaceSeed}`);
            
            // Undo the move
            const undoResult = engine.undo();
            const afterUndoSeed = engine.state.rngSeed;
            
            console.log(`After undo RNG seed: ${afterUndoSeed}`);
            
            const success = placeResult && undoResult && afterUndoSeed === initialSeed;
            
            if (success) {
                console.log("✅ SUCCESS: Undo properly preserves RNG state");
                this.testResults.push({ name: "Undo Preserve RNG", passed: true });
            } else {
                console.log(`❌ FAILURE: RNG state not properly preserved`);
                this.testResults.push({ 
                    name: "Undo Preserve RNG", 
                    passed: false, 
                    error: "RNG state not properly restored after undo" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in undo RNG test:", error);
            this.testResults.push({ 
                name: "Undo Preserve RNG", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Run all undo tests
    runAllTests() {
        console.log("Running Undo functionality tests...");
        console.log("=".repeat(60));
        
        this.testResults = [];
        
        const test1 = this.testUndoChargeDecrement();
        const test2 = this.testMultipleUndos();
        const test3 = this.testUndoWithNoCharges();
        const test4 = this.testUndoRestoresState();
        const test5 = this.testUndoAfterLevelUp();
        const test6 = this.testUndoWithCleanClearCharges();
        const test7 = this.testUndoAfterWholeFieldClear();
        const test8 = this.testUndoWithSwapSlots();
        const test9 = this.testUndoWithNoHistory();
        const test10 = this.testUndoPreservesRNGState();
        
        console.log("\n" + "=".repeat(50));
        
        const passedTests = this.testResults.filter(t => t.passed).length;
        const totalTests = this.testResults.length;
        const allPassed = passedTests === totalTests;
        
        if (allPassed) {
            console.log("🎉 ALL UNDO TESTS PASSED!");
        } else {
            console.log(`💥 ${totalTests - passedTests} UNDO TESTS FAILED!`);
        }
        
        // Store results globally for test runner
        window.undoTestResults = this.testResults;
        
        // Print summary
        console.log("\nUndo Test Summary:");
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

// Function to run undo tests when the page loads
function runUndoTests() {
    // Wait for the game classes to be available
    if (typeof GameEngine === 'undefined') {
        console.log("Waiting for game classes to load...");
        setTimeout(runUndoTests, 100);
        return;
    }
    
    const tester = new UndoTests();
    return tester.runAllTests();
}

// Export for use in browser console or testing framework
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UndoTests;
} else {
    // Browser environment - attach to window
    window.UndoTests = UndoTests;
    window.runUndoTests = runUndoTests;
}
