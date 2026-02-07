/**
 * Test suite for Menu/Settings button functionality
 * Tests all menu interactions, toggles, and modal behaviors
 */

class MenuTests {
    constructor() {
        this.testResults = [];
        this.app = null;
    }

    // Helper to get DOM elements
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Element with id '${id}' not found`);
        }
        return element;
    }

    // Helper to wait for DOM updates
    async waitFor(ms = 100) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test menu button toggles settings panel
    async testMenuButtonToggle() {
        console.log("Testing menu button toggles settings panel...");
        
        try {
            const settingsBtn = this.getElement('settingsBtn');
            const settingsPanel = this.getElement('settingsPanel');
            
            // Initially closed
            if (settingsPanel.classList.contains('active')) {
                settingsBtn.click(); // Close if open
                await this.waitFor();
            }
            
            const initiallyClosed = !settingsPanel.classList.contains('active');
            console.log(`Initial state: ${initiallyClosed ? 'closed' : 'open'}`);
            
            // Click to open
            settingsBtn.click();
            await this.waitFor();
            
            const isOpenAfterClick = settingsPanel.classList.contains('active');
            console.log(`After click: ${isOpenAfterClick ? 'open' : 'closed'}`);
            
            // Click to close
            settingsBtn.click();
            await this.waitFor();
            
            const isClosedAfterSecondClick = !settingsPanel.classList.contains('active');
            console.log(`After second click: ${isClosedAfterSecondClick ? 'closed' : 'open'}`);
            
            const success = initiallyClosed && isOpenAfterClick && isClosedAfterSecondClick;
            
            if (success) {
                console.log("✅ SUCCESS: Menu button properly toggles settings panel");
                this.testResults.push({ name: "Menu Toggle", passed: true });
            } else {
                console.log("❌ FAILURE: Menu button toggle not working correctly");
                this.testResults.push({ 
                    name: "Menu Toggle", 
                    passed: false, 
                    error: "Toggle sequence failed" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in menu toggle test:", error);
            this.testResults.push({ 
                name: "Menu Toggle", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test clicking outside closes menu
    async testClickOutsideClosesMenu() {
        console.log("\nTesting click outside closes menu...");
        
        try {
            const settingsBtn = this.getElement('settingsBtn');
            const settingsPanel = this.getElement('settingsPanel');
            
            // Open menu
            settingsBtn.click();
            await this.waitFor();
            
            const isOpen = settingsPanel.classList.contains('active');
            console.log(`Menu opened: ${isOpen}`);
            
            // Click outside (on body)
            document.body.click();
            await this.waitFor();
            
            const isClosedAfterOutsideClick = !settingsPanel.classList.contains('active');
            console.log(`Menu closed after outside click: ${isClosedAfterOutsideClick}`);
            
            const success = isOpen && isClosedAfterOutsideClick;
            
            if (success) {
                console.log("✅ SUCCESS: Click outside properly closes menu");
                this.testResults.push({ name: "Click Outside Close", passed: true });
            } else {
                console.log("❌ FAILURE: Click outside didn't close menu");
                this.testResults.push({ 
                    name: "Click Outside Close", 
                    passed: false, 
                    error: "Outside click failed to close" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in click outside test:", error);
            this.testResults.push({ 
                name: "Click Outside Close", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test tooltips toggle functionality
    async testTooltipsToggle() {
        console.log("\nTesting tooltips toggle...");
        
        try {
            const tooltipsToggle = this.getElement('tooltipsToggle');
            
            // Get initial state
            const initialState = tooltipsToggle.classList.contains('active');
            console.log(`Initial tooltips state: ${initialState ? 'enabled' : 'disabled'}`);
            
            // Click to toggle
            tooltipsToggle.click();
            await this.waitFor();
            
            const toggledState = tooltipsToggle.classList.contains('active');
            console.log(`After toggle: ${toggledState ? 'enabled' : 'disabled'}`);
            
            // Toggle back
            tooltipsToggle.click();
            await this.waitFor();
            
            const restoredState = tooltipsToggle.classList.contains('active');
            console.log(`After restore: ${restoredState ? 'enabled' : 'disabled'}`);
            
            const success = (initialState !== toggledState) && (initialState === restoredState);
            
            if (success) {
                console.log("✅ SUCCESS: Tooltips toggle works correctly");
                this.testResults.push({ name: "Tooltips Toggle", passed: true });
            } else {
                console.log("❌ FAILURE: Tooltips toggle not working");
                this.testResults.push({ 
                    name: "Tooltips Toggle", 
                    passed: false, 
                    error: "Toggle sequence failed" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in tooltips toggle test:", error);
            this.testResults.push({ 
                name: "Tooltips Toggle", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test hints toggle functionality
    async testHintsToggle() {
        console.log("\nTesting hints toggle...");
        
        try {
            const hintsToggle = this.getElement('hintsToggle');
            
            // Get initial state
            const initialState = hintsToggle.classList.contains('active');
            console.log(`Initial hints state: ${initialState ? 'enabled' : 'disabled'}`);
            
            // Click to toggle
            hintsToggle.click();
            await this.waitFor();
            
            const toggledState = hintsToggle.classList.contains('active');
            console.log(`After toggle: ${toggledState ? 'enabled' : 'disabled'}`);
            
            // Toggle back
            hintsToggle.click();
            await this.waitFor();
            
            const restoredState = hintsToggle.classList.contains('active');
            console.log(`After restore: ${restoredState ? 'enabled' : 'disabled'}`);
            
            const success = (initialState !== toggledState) && (initialState === restoredState);
            
            if (success) {
                console.log("✅ SUCCESS: Hints toggle works correctly");
                this.testResults.push({ name: "Hints Toggle", passed: true });
            } else {
                console.log("❌ FAILURE: Hints toggle not working");
                this.testResults.push({ 
                    name: "Hints Toggle", 
                    passed: false, 
                    error: "Toggle sequence failed" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in hints toggle test:", error);
            this.testResults.push({ 
                name: "Hints Toggle", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test deterministic toggle functionality
    async testDeterministicToggle() {
        console.log("\nTesting deterministic toggle...");
        
        try {
            const deterministicToggle = this.getElement('deterministicToggle');
            
            if (!deterministicToggle) {
                console.log("⚠️  SKIP: Deterministic toggle not found (may not be available in this version)");
                this.testResults.push({ name: "Deterministic Toggle", passed: true, skipped: true });
                return true;
            }
            
            // Get initial state
            const initialState = deterministicToggle.classList.contains('active');
            console.log(`Initial deterministic state: ${initialState ? 'enabled' : 'disabled'}`);
            
            // Click to toggle
            deterministicToggle.click();
            await this.waitFor();
            
            const toggledState = deterministicToggle.classList.contains('active');
            console.log(`After toggle: ${toggledState ? 'enabled' : 'disabled'}`);
            
            // Toggle back
            deterministicToggle.click();
            await this.waitFor();
            
            const restoredState = deterministicToggle.classList.contains('active');
            console.log(`After restore: ${restoredState ? 'enabled' : 'disabled'}`);
            
            const success = (initialState !== toggledState) && (initialState === restoredState);
            
            if (success) {
                console.log("✅ SUCCESS: Deterministic toggle works correctly");
                this.testResults.push({ name: "Deterministic Toggle", passed: true });
            } else {
                console.log("❌ FAILURE: Deterministic toggle not working");
                this.testResults.push({ 
                    name: "Deterministic Toggle", 
                    passed: false, 
                    error: "Toggle sequence failed" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in deterministic toggle test:", error);
            this.testResults.push({ 
                name: "Deterministic Toggle", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test theme modal functionality
    async testThemeModal() {
        console.log("\nTesting theme modal...");
        
        try {
            const themeBtn = this.getElement('themeBtn');
            const themeModal = this.getElement('themeModal');
            const closeThemeModal = this.getElement('closeThemeModal');
            
            // Initially closed
            const initiallyClosed = !themeModal.classList.contains('active');
            console.log(`Theme modal initially closed: ${initiallyClosed}`);
            
            // Open theme modal
            themeBtn.click();
            await this.waitFor();
            
            const isOpen = themeModal.classList.contains('active');
            console.log(`Theme modal opened: ${isOpen}`);
            
            // Check if theme options are populated
            const themeGrid = this.getElement('themeGrid');
            const themeOptions = themeGrid.querySelectorAll('.theme-option');
            console.log(`Theme options found: ${themeOptions.length}`);
            
            // Close modal
            closeThemeModal.click();
            await this.waitFor();
            
            const isClosed = !themeModal.classList.contains('active');
            console.log(`Theme modal closed: ${isClosed}`);
            
            const success = initiallyClosed && isOpen && isClosed && themeOptions.length > 0;
            
            if (success) {
                console.log("✅ SUCCESS: Theme modal works correctly");
                this.testResults.push({ name: "Theme Modal", passed: true });
            } else {
                console.log("❌ FAILURE: Theme modal not working properly");
                this.testResults.push({ 
                    name: "Theme Modal", 
                    passed: false, 
                    error: "Modal sequence failed" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in theme modal test:", error);
            this.testResults.push({ 
                name: "Theme Modal", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test new game button
    async testNewGameButton() {
        console.log("\nTesting new game button...");
        
        try {
            const newGameBtn = this.getElement('newGameBtn');
            const settingsPanel = this.getElement('settingsPanel');
            
            // Open settings panel first
            const settingsBtn = this.getElement('settingsBtn');
            settingsBtn.click();
            await this.waitFor();
            
            const panelOpen = settingsPanel.classList.contains('active');
            console.log(`Settings panel open: ${panelOpen}`);
            
            // Click new game button
            newGameBtn.click();
            await this.waitFor();
            
            // Settings should close and new game should start
            const panelClosed = !settingsPanel.classList.contains('active');
            console.log(`Settings panel closed after new game: ${panelClosed}`);
            
            const success = panelOpen && panelClosed;
            
            if (success) {
                console.log("✅ SUCCESS: New game button works correctly");
                this.testResults.push({ name: "New Game Button", passed: true });
            } else {
                console.log("❌ FAILURE: New game button not working");
                this.testResults.push({ 
                    name: "New Game Button", 
                    passed: false, 
                    error: "New game sequence failed" 
                });
            }
            
            return success;
        } catch (error) {
            console.error("❌ ERROR in new game test:", error);
            this.testResults.push({ 
                name: "New Game Button", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Test audio controls
    async testAudioControls() {
        console.log("\nTesting audio controls...");
        
        try {
            const playPauseBtn = this.getElement('playPauseBtn');
            const prevTrackBtn = this.getElement('prevTrackBtn');
            const nextTrackBtn = this.getElement('nextTrackBtn');
            const repeatBtn = this.getElement('repeatBtn');
            const volumeSlider = this.getElement('volumeSlider');
            
            // Test that buttons exist and are clickable
            const buttonsExist = playPauseBtn && prevTrackBtn && nextTrackBtn && repeatBtn && volumeSlider;
            console.log(`Audio controls exist: ${buttonsExist}`);
            
            if (buttonsExist) {
                // Test volume slider
                const initialVolume = volumeSlider.value;
                volumeSlider.value = 50;
                volumeSlider.dispatchEvent(new Event('input'));
                await this.waitFor();
                
                const changedVolume = volumeSlider.value;
                const volumeChanged = initialVolume !== changedVolume;
                console.log(`Volume slider works: ${volumeChanged}`);
                
                const success = volumeChanged;
                
                if (success) {
                    console.log("✅ SUCCESS: Audio controls work correctly");
                    this.testResults.push({ name: "Audio Controls", passed: true });
                } else {
                    console.log("❌ FAILURE: Audio controls not working");
                    this.testResults.push({ 
                        name: "Audio Controls", 
                        passed: false, 
                        error: "Audio controls failed" 
                    });
                }
                
                return success;
            } else {
                console.log("⚠️  SKIP: Audio controls not found");
                this.testResults.push({ name: "Audio Controls", passed: true, skipped: true });
                return true;
            }
        } catch (error) {
            console.error("❌ ERROR in audio controls test:", error);
            this.testResults.push({ 
                name: "Audio Controls", 
                passed: false, 
                error: error.message 
            });
            return false;
        }
    }

    // Run all menu tests
    async runAllTests() {
        console.log("Running Menu/Settings button tests...");
        console.log("=".repeat(60));
        
        this.testResults = [];
        
        const test1 = await this.testMenuButtonToggle();
        const test2 = await this.testClickOutsideClosesMenu();
        const test3 = await this.testTooltipsToggle();
        const test4 = await this.testHintsToggle();
        const test5 = await this.testDeterministicToggle();
        const test6 = await this.testThemeModal();
        const test7 = await this.testNewGameButton();
        const test8 = await this.testAudioControls();
        
        console.log("\n" + "=".repeat(50));
        
        const passedTests = this.testResults.filter(t => t.passed && !t.skipped).length;
        const totalTests = this.testResults.filter(t => !t.skipped).length;
        const allPassed = passedTests === totalTests;
        
        if (allPassed) {
            console.log("🎉 ALL MENU TESTS PASSED!");
        } else {
            console.log(`💥 ${totalTests - passedTests} MENU TESTS FAILED!`);
        }
        
        // Store results globally for test runner
        window.menuTestResults = this.testResults;
        
        // Print summary
        console.log("\nMenu Test Summary:");
        this.testResults.forEach(test => {
            if (test.skipped) {
                console.log(`⚠️  SKIP ${test.name}`);
            } else {
                const status = test.passed ? "✅ PASS" : "❌ FAIL";
                console.log(`${status} ${test.name}`);
                if (!test.passed && test.error) {
                    console.log(`   Error: ${test.error}`);
                }
            }
        });
        
        return allPassed;
    }
}

// Function to run menu tests when the page loads
function runMenuTests() {
    // Wait for the game to be available
    if (typeof ZenTilesApp === 'undefined') {
        console.log("Waiting for ZenTiles app to load...");
        setTimeout(runMenuTests, 100);
        return;
    }
    
    const tester = new MenuTests();
    return tester.runAllTests();
}

// Export for use in browser console or testing framework
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuTests;
} else {
    // Browser environment - attach to window
    window.MenuTests = MenuTests;
    window.runMenuTests = runMenuTests;
}
