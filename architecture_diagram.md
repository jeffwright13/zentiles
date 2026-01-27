# Urban Ivy - Architecture Documentation

## System Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[UI Controller]
        Input[Input Handler]
        Render[Renderer]
    end
    
    subgraph "Game Logic Layer"
        Engine[GameEngine]
        State[GameState]
        Board[Board]
        Piece[Piece]
    end
    
    subgraph "Data Layer"
        Save[SaveManager]
        Config[Configuration]
    end
    
    UI --> Engine
    Input --> Engine
    Engine --> State
    Engine --> Board
    Engine --> Piece
    State --> Save
    Engine --> Config
    State --> UI
    Engine --> Render
```

## Core Entity Relationships

```mermaid
classDiagram
    class GameEngine {
        +place_piece(origin) bool
        +undo() bool
        +clear_level()
        +clean_clear() bool
        +swap_piece(slot) bool
        +get_valid_placements() list
        +has_valid_moves() bool
    }
    
    class GameState {
        +board: Board
        +current_piece: Piece
        +next_piece: Piece
        +level: int
        +lines_cleared_total: int
        +undo_charges: int
        +clean_clear_charges: int
        +reserve_slots: list
    }
    
    class Board {
        +width: int
        +height: int
        +occupied: bool[][]
        +can_place_piece(piece, origin) bool
        +place_piece(piece, origin)
        +get_full_rows() set
        +get_full_columns() set
        +clear_rows_and_columns(rows, cols) int
    }
    
    class Piece {
        +shape_index: int
        +cells: list[tuple]
        +rotate(times)
        +reflect()
        +get_world_cells(origin) list
    }
    
    GameEngine --> GameState
    GameEngine --> Board
    GameEngine --> Piece
    GameState --> Board
    GameState --> Piece
```

## Game Flow State Machine

```mermaid
stateDiagram-v2
    [*] --> Playing
    Playing --> Placing: Select Cell
    Placing --> Playing: Valid Placement
    Placing --> NoMoves: No Valid Placements
    
    Playing --> Paused: Pause Request
    Paused --> Playing: Resume
    
    NoMoves --> UndoModal: Undo Available
    NoMoves --> SwapModal: Swap Available
    NoMoves --> CleanClearModal: Clean Clear Available
    NoMoves --> Playing: Clear Action
    
    UndoModal --> Playing: Undo Executed
    SwapModal --> Playing: Swap Executed
    CleanClearModal --> Playing: Clean Clear Executed
    
    Playing --> LevelUp: Lines Threshold Reached
    LevelUp --> Playing: Board Updated
    
    Playing --> [*]: Quit Game
```

## Data Flow During Turn

```mermaid
sequenceDiagram
    participant Player
    participant UI
    participant Engine
    participant State
    participant Board
    
    Player->>UI: Select Cell
    UI->>Engine: place_piece(x, y)
    Engine->>Board: can_place_piece()
    Board-->>Engine: true/false
    
    alt Valid Placement
        Engine->>State: Save Undo Snapshot
        Engine->>Board: place_piece()
        Engine->>Board: get_full_rows()
        Engine->>Board: get_full_columns()
        Engine->>Board: clear_rows_and_columns()
        Engine->>State: Update Progression
        Engine->>State: Spawn Next Piece
        Engine-->>UI: Success
        UI-->>Player: Visual Feedback
    else Invalid Placement
        Engine-->>UI: Failure
        UI-->>Player: Error Feedback
    end
```

## API Boundaries

### Game Logic → Presentation Interface
```python
# Core API methods
place_piece(origin: Tuple[int, int]) -> bool
undo() -> bool
clear_level() -> void
clean_clear() -> bool
swap_piece(slot_index: int) -> bool
get_valid_placements() -> List[Tuple[int, int]]
has_valid_moves() -> bool

# State queries
get_board_state() -> Board
get_current_piece() -> Piece
get_game_stats() -> GameStats
```

### Presentation → Game Logic Interface
```python
# Input actions
on_cell_selected(x: int, y: int)
on_undo_requested()
on_clear_requested()
on_clean_clear_requested()
on_swap_requested(slot_index: int)
on_pause_requested()
```

## Component Responsibilities

### GameEngine
- Enforces all game rules
- Manages state transitions
- Handles piece placement and validation
- Coordinates line clearing and progression
- Manages undo/redo functionality

### GameState
- Stores complete game state
- Tracks progression metrics
- Manages power-up charges
- Maintains piece statistics

### Board
- Manages grid occupancy
- Handles piece collision detection
- Tracks full rows/columns
- Manages board resizing

### Piece
- Defines piece shapes and transformations
- Handles rotation and reflection
- Calculates world positions
- Manages piece library

## Separation of Concerns

- **Game Logic**: Pure rules and state management (no rendering)
- **Presentation**: UI, input handling, visual feedback
- **Persistence**: Save/load functionality
- **Configuration**: Difficulty settings, piece weights

This architecture ensures the game logic is completely independent of any rendering framework, making it portable across different platforms and implementations.
