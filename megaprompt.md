I need you to analyze this Unity game project and extract the core game logic/rules, completely separated from Unity-specific rendering and framework code.

## Phase 1: Initial Analysis

Start by:
1. Identifying all C# scripts in the project and categorizing them by purpose (game logic, UI, rendering, utilities, etc.)
2. Listing the main game mechanics you observe
3. Identifying the core game objects/entities and their properties
4. Mapping out the game's state machine (menu, playing, paused, game over, etc.)

Focus on understanding WHAT the game does, not HOW Unity renders it.

## Phase 2: Extract Pure Game Logic

Extract the pure game logic into a platform-agnostic specification:

1. **Game Rules Document**: Write a comprehensive markdown document describing:
   - Core game entities (pieces, board, player state, etc.) and their properties
   - All game rules and constraints
   - Win/loss conditions
   - Scoring mechanics
   - Timing/speed progression if applicable

2. **Data Structures**: Define the minimal data structures needed to represent:
   - Game state
   - Game pieces/objects
   - Board/playing field
   - Score/progress tracking

3. **Core Algorithms**: Extract the key algorithms as pseudocode:
   - Piece movement/rotation logic
   - Collision detection
   - Line clearing (or equivalent mechanic)
   - Score calculation
   - Game progression/difficulty

4. **State Transitions**: Document all state transitions:
   - Game initialization
   - Turn/move processing
   - Game over detection
   - Level/speed changes

Ignore all Unity-specific code (MonoBehaviour, GameObject, Transform, Renderer, etc.). Focus only on the pure logic.

## Phase 3: Reference Implementation

Create a reference implementation of the game logic in plain Python (or JavaScript) that:

1. Implements all core game mechanics with NO rendering/UI code
2. Uses simple data structures (arrays, objects, primitives)
3. Provides a clean API that a UI layer could call
4. Includes basic test cases demonstrating the rules work correctly

Structure it with clear separation:
- GameState class (holds all game data)
- GameEngine class (implements rules and state transitions)
- Simple CLI demo showing it works (text output only)

This should be runnable independently to verify the logic is correct.

## Phase 4: Verification

Compare the extracted logic against the original Unity code to ensure:
1. All game mechanics are captured
2. Edge cases are handled
3. Scoring rules match exactly
4. Timing/speed progression is accurate
5. Win/loss conditions are complete

Document any assumptions made or areas where the original code was ambiguous.

## Phase 5: Architecture Documentation

Create a visual architecture diagram (using mermaid or ASCII art) showing:
1. Core game entities and their relationships
2. Data flow during a typical game turn
3. State machine transitions
4. API boundaries between game logic and presentation layer

## Deliverables

Provide:
1. Game Rules markdown document
2. Reference implementation (Python or JavaScript)
3. Architecture diagram
4. Verification report comparing extracted logic to original Unity code