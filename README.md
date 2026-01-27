# ZenTiles - Contemplative Puzzle Game

A meditative tile-placement puzzle game featuring contemplative themes inspired by India, Japan, Celtic, and Native American traditions.

## Overview

ZenTiles is a tile placement puzzle game where players place pieces on an N×N grid, clearing completed rows and columns to progress through levels. The game features a calming atmosphere with ambient backgrounds and music.

## Files

### Web Application
- `index.html` - Main HTML with modern glassmorphism UI
- `zentiles-app.js` - Main application integrating game logic and themes

### Theme System (`/themes`)
- `theme-config.js` - Theme definitions (colors, backgrounds, audio)
- `theme-manager.js` - Central theme controller
- `audio-controller.js` - Ambient music playback with crossfading
- `background-controller.js` - Background image transitions and dog companion

### Legacy/Reference
- `urban_ivy_game.py` - Python reference implementation
- `urban_ivy_web.js` - Original web implementation
- `test_game.py` - Comprehensive test suite
- `game_rules.md` - Complete game rules documentation
- `architecture_diagram.md` - System architecture and design

## Quick Start

### Running the Web Game
```bash
# Start a local server
python3 -m http.server 8080

# Open http://localhost:8080 in your browser
```

### Running the Python Reference
```bash
python urban_ivy_game.py
```

### Running Tests
```bash
python test_game.py
```

## Theme System

ZenTiles features four contemplative themes, each with:
- **High-resolution backgrounds** that gently transition every 15-20 seconds
- **Ambient music** with smooth crossfading between tracks
- **Walker hound companion** sitting peacefully in the corner
- **Theme-appropriate color palette** for UI elements

### Available Themes
| Theme | Tradition | Atmosphere |
|-------|-----------|------------|
| **Sacred India** | Indian | Temples, Himalayas, warm earth tones |
| **Zen Japan** | Japanese | Zen gardens, bamboo forests, serene reds |
| **Celtic Mist** | Celtic | Stone circles, misty hills, forest greens |
| **Spirit Plains** | Native American | Canyons, prairies, sunset ochres |

Click the sun icon (☀) in the header to switch themes. Your preference is saved locally.

## Game Controls (Web)

- **Click** on the board to place pieces
- **Theme button** (☀) - Open theme selector
- **Music button** (♪) - Toggle ambient music
- **Undo** - Revert last move
- **Clear Level** - Reset current level
- **Clean Clear** - Clear board without penalty
- **Hints** - Toggle valid placement highlights

## Game Controls (Python CLI)

- `place x y` - Place current piece at coordinates (x, y)
- `undo` - Undo last move (consumes undo charge)
- `clear` - Reset current level progress
- `clean` - Clean clear board (consumes clean clear charge)
- `swap N` - Swap current piece with reserve slot N
- `quit` - Exit game

## Game Rules

### Core Mechanics
- **Board**: Starts at 5×5, grows to 12×12 (every 5 levels)
- **Pieces**: 12 shapes, unlock progressively (5 + level/5, max 12)
- **Objective**: Place pieces to clear rows and columns
- **Progression**: Clear lines to advance levels

### Line Clearing
- Fully occupied rows are cleared
- Fully occupied columns are cleared
- Multiple lines can clear simultaneously
- Each cleared line contributes to level progression

### Power Actions
- **Undo**: Revert last move (limited charges)
- **Clear**: Reset level progress, keep level
- **Clean Clear**: Clear board without resetting progress
- **Swap**: Store/swap pieces in reserve slots

### Level Progression
- Lines required: Starts at 25, grows ~2% per level (max 50)
- Board size: 5 + floor(level/5), capped at 12
- Piece unlock: 5 + floor(level/5), capped at 12
- Power-up rewards: Undo charges every level, clean clear every 5 levels

## Code Architecture

### Core Classes

#### GameEngine
- Main game logic controller
- Handles piece placement, validation, and state transitions
- Manages undo/redo and power actions

#### GameState
- Complete game state representation
- Tracks progression, scores, and resources
- Serializable for save/load functionality

#### Board
- Grid management and collision detection
- Line clearing and board resizing
- Occupancy tracking

#### Piece
- Shape definitions and transformations
- Rotation and reflection logic
- World position calculation

### Key Features
- **Pure Logic**: No rendering or UI dependencies
- **Testable**: Comprehensive unit test coverage
- **Extensible**: Clean separation of concerns
- **Portable**: Platform-agnostic implementation

## Testing

The test suite covers:
- Piece transformation logic
- Board operations and line clearing
- Game state management
- Engine functionality
- Integration scenarios
- Edge cases and error handling

Run tests with:
```bash
python -m unittest test_game.py
```

## Implementation Notes

### Design Decisions
- **Simplicity**: Used basic data structures (lists, tuples) for clarity
- **Immutability**: Piece transformations create new normalized states
- **Efficiency**: Valid placement checking uses early termination
- **Extensibility**: Clear interfaces for UI layer integration

### Differences from Original
- Removed Unity-specific dependencies
- Simplified piece shape definitions
- Added comprehensive error handling
- Included detailed test coverage

## Usage as Library

The game logic can be imported and used independently:

```python
from urban_ivy_game import GameEngine, GameState

# Create new game
engine = GameEngine()

# Place piece
if engine.place_piece((2, 3)):
    print("Piece placed successfully!")

# Check game state
print(f"Level: {engine.state.level}")
print(f"Lines cleared: {engine.state.lines_cleared_total}")
```

## Future Enhancements

Potential extensions:
- AI player implementation
- Additional difficulty modes
- Network multiplayer support
- Custom piece shapes
- Advanced scoring systems

## License

This reference implementation is provided for educational and development purposes.
