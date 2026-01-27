1) Script inventory + categorization (first‑party)
Core game logic (rules + state)

    GardenBoardController.cs

        The authoritative rule engine today (board state, placing, clearing, progression, undo, clear, clean clear, swap slots, no‑moves detection, save/restore snapshots).

    GardenPiece.cs

        Piece representation + the entire piece library (12 base pieces) + rotate/reflect/normalize + unlocking rules by level.

    UrbanIvyPieceSpawnConfig.cs

        Difficulty + weighted spawn configuration (Easy/Normal/Hard weights).

    UrbanIvyWorldProgression.cs

        “Day/time/location” progression rules derived from level number (8 steps/day).

    UrbanIvySaveData.cs

        Pure data container describing persisted game state.

Persistence (serialization glue; logic-adjacent)

    UrbanIvySaveManager.cs

        Owns save slots + wiring to board’s “commit” events; uses ES3; calls board to create/load save data.

        Not core rules itself, but defines what is considered game state for persistence.

UI / presentation / input mapping (Unity-specific)

    UrbanIvyControlsUI.cs

        Buttons/counters/swap UI + overlays. (Rules are not here, but it exposes what actions exist.)

    UrbanIvyNoMovesDialogUI.cs, 
    UrbanIvyLevelUI.cs, 
    UrbanIvyLandingUI.cs, 
    UrbanIvySettingsUI.cs, 
    UrbanIvyAreaCompleteUI.cs

        Presentation and menus/modals.

Audio / environment / platform utilities

    UrbanIvyAudioController.cs, 
    UrbanIvyEnvironmentRigAdapter.cs, 
    CherryBlossomAmbient.cs

        Feedback, not rules.

    SteamDeckUtils.cs

        Platform detection and Deck control preference.

    UrbanIvySteamAchievements.cs, 
    UrbanIvySteamBootstrap.cs

        Achievement/reporting; not rules.

Bootstrap / wiring (Unity scene composition)

    UrbanIvyBootstrap.cs

        Creates required objects and UI if missing.

2) Main game mechanics observed

From 
GardenBoardController + 
GardenPiece:

Grid placement puzzle loop

    Board is an N×N grid, starting at 5×5, growing over time.

    You have a Current piece and a Next piece.

    A move is: choose a hover cell → compute an “origin” → if piece fits (in-bounds + empty cells), commit placement.

Line clearing (rows and columns)

    After each placement, clear any fully occupied rows and fully occupied columns.

    A move can clear multiple rows and columns simultaneously.

    Clearing updates progression and awards powerups.

Progression (Level + “Lines Remaining”)

    Progress is measured in linesCleared (count of cleared rows+cols over lifetime).

    Each level has a lines-to-next-level threshold:

        Default: starts at 25, then grows by ~2% each level, capped at 50.

        Optional flat mode: constant flatLinesToNextLevel.

    UI “Lines Remaining” is:

        (linesAtLevelStart + linesToNextLevel) - linesCleared.

Board growth

    Board size increases every 5 levels:

        targetSize = 5 + floor(level/5) capped at 12.

Piece unlocking + randomization

    There are 12 base pieces.

    Unlocked piece count:

        StartingPieceCount = 5

        unlocked = clamp(5 + floor(level/5), 5..12)

    Random piece selection:

        Choose index from unlocked set (weighted if not Hard, per 
        UrbanIvyPieceSpawnConfig)

        Apply random rotation (0–3) and random reflection

        Normalize to min (x,y)=0.

Power actions

    Undo

        Consumes 1 undo charge.

        Restores a snapshot of: board occupancy, current/next piece, reserve slots, counts, progression state.

    Clear

        Resets progress within the current level:

            clears board occupancy

            resets piecesPlaced

            resets linesCleared back to linesAtLevelStart

            keeps current level number

            spawns new current+next pieces

    Clean Clear

        Consumes 1 clean-clear charge.

        Clears board occupancy but does NOT reset level progress (linesCleared not reset).

        Clears undo history.

Swap slots (“Reserve”)

    Unlock count by max level reached:

        ≥10 ⇒ 1 slot

        ≥20 ⇒ 2 slots

        ≥30 ⇒ 3 slots

    You can use swap once per piece (reserveUsedThisTurn).

    Slot behavior:

        If empty: store current piece there, then advance piece.

        If full: swap current piece with slot piece.

    Additional rule: slot containing a piece with no valid placements is disabled and cannot be swapped in.

No-moves handling (not a “loss” state)

    If current piece has no valid placements, the game presents a modal offering:

        Undo (if available)

        Swap (if available and a valid slot exists)

        Clean Clear (if charges exist)

        Clear (always)

    Swap from this dialog can be:

        Auto-swap if exactly one valid slot exists

        Forced “pick a slot” mode if multiple valid slots exist

3) Core entities (platform-agnostic)

These are the objects you’d send to someone to implement the game without Unity:
Piece

    cells: List[(dx,dy)] (relative coords, normalized)

    Derived:

        world_cells(origin) = origin + cell for each cell

    Library:

        fixed set of 12 shapes

        transformations: rotate/reflect/normalize

Board

    width, height

    occupied: bool[width][height]

GameState

Minimal persistent state (matches save data closely):

    Board: width, height, occupied

    Current/Next piece: current_piece, next_piece, plus their piece_index if tracked

    Progression:

        level

        lines_cleared_total

        lines_at_level_start

        lines_to_next_level

    Counters:

        pieces_placed

        undo_charges

        clean_clear_charges

    Swap system:

        reserve_slots[3] each: (has_piece, piece, piece_index)

        reserve_used_this_turn

    Spawn stats (optional but present in saves):

        piece_spawn_counts[12]

        piece_spawn_total

    Difficulty / RNG:

        difficulty

        (RNG seed is not currently persisted in saves; the system uses runtime RNG)

HistorySnapshot (for Undo)

    Essentially a copy of GameState fields needed to fully restore.

4) Game “state machine” (high level)

This game is mostly continuous play with modal interruptions:

mermaid

Where:

    “SwapSelectionModal” corresponds to _swapSelectionMode in 
    GardenBoardController.

    There is no explicit “GameOver”; “no moves” is resolved via Undo/Clear/CleanClear/Swap.