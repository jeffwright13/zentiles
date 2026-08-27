# Urban Ivy - Game Rules Documentation

## Overview
Urban Ivy is a grid-based tile placement puzzle game where players place pieces on an N×N board, clearing completed rows and columns to progress through levels.

## Core Game Entities

### Piece
- **Shape**: Defined by relative cell coordinates (dx, dy) from origin
- **Library**: 12 base piece shapes
- **Transformations**: Can be rotated (0-3 times) and reflected
- **Normalization**: Pieces are normalized so minimum (x,y) = (0,0)
- **Grip corner**: The tile that tracks the cursor/finger while placing a
  piece is configurable (Upper-Left, Upper-Right, Lower-Left, Lower-Right)
  via Settings → Piece Grip. Default is Upper-Left; Upper-Right matches
  Rockwell's Zentiles (Steam). Persisted per-browser independent of game save.

### Board
- **Grid**: N×N boolean occupancy matrix
- **Size**: Starts at 5×5, grows with level (max 12×12)
- **Growth Rule**: `size = 5 + floor(level/5)`, capped at 12

### GameState
Contains all persistent game state:
- Board state (width, height, occupied cells)
- Current and next pieces
- Progression data (level, lines cleared, etc.)
- Power-up charges and usage
- Swap slots and piece statistics

## Game Mechanics

### Piece Placement
1. Player selects a hover cell as origin
2. System checks if piece fits (in bounds + empty cells)
3. If valid, piece is placed and board updates

### Line Clearing
- After each placement, clear any fully occupied rows
- After each placement, clear any fully occupied columns
- Multiple rows/columns can clear simultaneously
- Clearing updates progression and awards power-ups

### Level Progression
- **Metric**: Total lines cleared (rows + columns)
- **Threshold**: Starts at 25 lines, grows ~2% per level (max 50)
- **Formula**: `lines_to_next = min(25 * 1.02^level, 50)`
- **Board Growth**: Every 5 levels increases board size

### Piece Unlocking
- **Starting**: 5 pieces available
- **Unlock Rule**: `unlocked_count = clamp(5 + floor(level/5), 5, 12)`
- **Selection**: Random from unlocked set (weighted by difficulty)
- **Transformations**: Random rotation (0-3) and reflection applied

## Power Actions

### Undo
- **Cost**: 1 undo charge
- **Effect**: Restores previous game state snapshot
- **Scope**: Board, pieces, reserves, counters, progression

### Clear
- **Cost**: Free action
- **Effect**: Resets current level progress
- **Changes**: Clears board, resets pieces placed and lines cleared
- **Preserves**: Current level number

### Clean Clear
- **Cost**: 1 clean-clear charge
- **Effect**: Clears board without resetting level progress
- **Additional**: Clears undo history

### Rotate
- **Cost**: 1 rotate charge to unlock rotation for the current piece; once
  unlocked, further rotations of that same piece are free until it is
  placed or swapped away (the next piece requires another charge)
- **Effect**: Rotates the current piece 90° per press, cycling through its
  available orientations (up to 4; fewer for symmetric shapes such as a
  single tile or 2×2 square, which simply look unchanged when rotated)
- **Earn rate**: +1 charge every 3 levels, capped at 5 charges
- Mirrors the "Rotate card" mechanic from Rockwell's Zentiles (Steam),
  implemented here as a charge/button like Undo and Clean Clear rather than
  a literal drawn card

### Swap Slots (Reserve)
- **Unlock**: Based on max level reached
  - Level ≥10: 1 slot
  - Level ≥20: 2 slots  
  - Level ≥30: 3 slots
- **Usage**: Once per piece (reserve_used_this_turn flag)
- **Behavior**:
  - Empty slot: Store current piece, advance to next
  - Full slot: Swap current with stored piece
- **Restriction**: Slots with unplaceable pieces are disabled

## No-Moves Handling
When current piece has no valid placements:
1. Show modal offering options
2. Available: Undo (if charges), Swap (if valid slot), Clean Clear (if charges), Clear (always)
3. Auto-swap if exactly one valid slot exists
4. Force selection if multiple valid slots

## Difficulty Settings
- **Easy/Normal**: Weighted piece selection
- **Hard**: Uniform random selection from unlocked pieces

## Win/Loss Conditions
- **No explicit loss state** - game continues indefinitely
- **Progression**: Measured by level and lines cleared
- **Goal**: Maximize score and reach higher levels

## Scoring
- Primary metric: Lines cleared
- Secondary: Pieces placed
- Progression tied to line count thresholds
