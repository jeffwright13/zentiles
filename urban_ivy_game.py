"""
Urban Ivy - Reference Implementation
Grid-based tile placement puzzle game
"""

import random
import copy
from typing import List, Tuple, Optional, Set
from enum import Enum


class Difficulty(Enum):
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"


class Piece:
    """Represents a game piece with shape and transformations"""
    
    # 12 base piece shapes (normalized coordinates)
    BASE_SHAPES = [
        # Single square
        [(0, 0)],
        # Horizontal line of 2
        [(0, 0), (1, 0)],
        # Horizontal line of 3
        [(0, 0), (1, 0), (2, 0)],
        # L-shape (2x2 missing one)
        [(0, 0), (1, 0), (0, 1)],
        # 2x2 square
        [(0, 0), (1, 0), (0, 1), (1, 1)],
        # T-shape (3 wide, 1 tall middle)
        [(0, 0), (1, 0), (2, 0), (1, 1)],
        # L-shape tall (3 tall, 1 wide bottom)
        [(0, 0), (0, 1), (0, 2), (1, 2)],
        # Z-shape
        [(0, 0), (1, 0), (1, 1), (2, 1)],
        # Plus shape
        [(0, 1), (1, 0), (1, 1), (1, 2), (2, 1)],
        # L-shape mirrored
        [(1, 0), (0, 1), (1, 1), (2, 1)],
        # U-shape
        [(0, 0), (0, 1), (1, 0), (1, 1), (2, 0), (2, 1)],
        # Large L (3x3 missing corner)
        [(0, 0), (0, 1), (0, 2), (1, 0), (2, 0)]
    ]
    
    def __init__(self, shape_index: int = 0):
        self.shape_index = shape_index
        self.cells = copy.deepcopy(self.BASE_SHAPES[shape_index])
        self._normalize()
    
    def _normalize(self):
        """Normalize piece so min(x,y) = (0,0)"""
        if not self.cells:
            return
        
        min_x = min(x for x, y in self.cells)
        min_y = min(y for x, y in self.cells)
        
        self.cells = sorted([(x - min_x, y - min_y) for x, y in self.cells])
    
    def rotate(self, times: int = 1):
        """Rotate piece 90 degrees clockwise"""
        for _ in range(times % 4):
            self.cells = [(y, -x) for x, y in self.cells]
        self._normalize()
    
    def reflect(self):
        """Reflect piece horizontally"""
        max_x = max(x for x, y in self.cells) if self.cells else 0
        self.cells = [(max_x - x, y) for x, y in self.cells]
        self._normalize()
    
    def get_world_cells(self, origin: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Get absolute cell positions for given origin"""
        ox, oy = origin
        return [(ox + x, oy + y) for x, y in self.cells]
    
    def get_bounds(self) -> Tuple[int, int, int, int]:
        """Get bounding box (min_x, min_y, max_x, max_y)"""
        if not self.cells:
            return 0, 0, 0, 0
        
        xs = [x for x, y in self.cells]
        ys = [y for x, y in self.cells]
        return min(xs), min(ys), max(xs), max(ys)


class Board:
    """Game board with occupancy tracking"""
    
    def __init__(self, width: int = 5, height: int = 5):
        self.width = width
        self.height = height
        self.occupied = [[False for _ in range(height)] for _ in range(width)]
    
    def is_valid_position(self, x: int, y: int) -> bool:
        """Check if position is within bounds"""
        return 0 <= x < self.width and 0 <= y < self.height
    
    def can_place_piece(self, piece: Piece, origin: Tuple[int, int]) -> bool:
        """Check if piece can be placed at origin"""
        for x, y in piece.get_world_cells(origin):
            if not self.is_valid_position(x, y) or self.occupied[x][y]:
                return False
        return True
    
    def place_piece(self, piece: Piece, origin: Tuple[int, int]):
        """Place piece on board"""
        for x, y in piece.get_world_cells(origin):
            self.occupied[x][y] = True
    
    def clear_board(self):
        """Clear all occupied cells"""
        self.occupied = [[False for _ in range(self.height)] for _ in range(self.width)]
    
    def get_full_rows(self) -> Set[int]:
        """Get indices of completely filled rows"""
        full_rows = set()
        for y in range(self.height):
            if all(self.occupied[x][y] for x in range(self.width)):
                full_rows.add(y)
        return full_rows
    
    def get_full_columns(self) -> Set[int]:
        """Get indices of completely filled columns"""
        full_cols = set()
        for x in range(self.width):
            if all(self.occupied[x][y] for y in range(self.height)):
                full_cols.add(x)
        return full_cols
    
    def clear_rows_and_columns(self, rows: Set[int], cols: Set[int]) -> int:
        """Clear specified rows and columns, return count of cleared lines"""
        cleared_count = len(rows) + len(cols)
        
        # Clear rows
        for y in rows:
            for x in range(self.width):
                self.occupied[x][y] = False
        
        # Clear columns
        for x in cols:
            for y in range(self.height):
                self.occupied[x][y] = False
        
        return cleared_count
    
    def resize(self, new_width: int, new_height: int):
        """Resize board, preserving existing occupied cells"""
        new_occupied = [[False for _ in range(new_height)] for _ in range(new_width)]
        
        for x in range(min(self.width, new_width)):
            for y in range(min(self.height, new_height)):
                new_occupied[x][y] = self.occupied[x][y]
        
        self.width = new_width
        self.height = new_height
        self.occupied = new_occupied


class GameState:
    """Complete game state"""
    
    def __init__(self):
        self.board = Board()
        self.current_piece = Piece()
        self.next_piece = Piece()
        
        # Progression
        self.level = 1
        self.lines_cleared_total = 0
        self.lines_at_level_start = 0
        self.lines_to_next_level = 25
        self.pieces_placed = 0
        
        # Power actions
        self.undo_charges = 3
        self.clean_clear_charges = 1
        
        # Swap slots
        self.reserve_slots = [None, None, None]  # Can store Piece objects
        self.reserve_used_this_turn = False
        
        # Statistics
        self.piece_spawn_counts = [0] * 12
        self.piece_spawn_total = 0
        
        # Settings
        self.difficulty = Difficulty.NORMAL
    
    def get_lines_remaining(self) -> int:
        """Calculate lines remaining until next level"""
        return (self.lines_at_level_start + self.lines_to_next_level) - self.lines_cleared_total
    
    def get_unlocked_piece_count(self) -> int:
        """Get number of unlocked pieces based on level"""
        return min(5 + self.level // 5, 12)
    
    def get_board_size(self) -> int:
        """Get current board size"""
        return min(5 + self.level // 5, 12)


class GameEngine:
    """Core game logic engine"""
    
    def __init__(self, state: Optional[GameState] = None):
        self.state = state or GameState()
        self.undo_history = []
    
    def place_piece(self, origin: Tuple[int, int]) -> bool:
        """Place current piece at origin"""
        if not self.state.board.can_place_piece(self.state.current_piece, origin):
            return False
        
        # Save state for undo
        self._save_undo_snapshot()
        
        # Place piece
        self.state.board.place_piece(self.state.current_piece, origin)
        self.state.pieces_placed += 1
        
        # Clear lines
        rows = self.state.board.get_full_rows()
        cols = self.state.board.get_full_columns()
        cleared = self.state.board.clear_rows_and_columns(rows, cols)
        
        # Update progression
        self.state.lines_cleared_total += cleared
        self._check_level_up()
        
        # Spawn next piece
        self._advance_piece()
        self.state.reserve_used_this_turn = False
        
        return True
    
    def _save_undo_snapshot(self):
        """Save current state for undo"""
        snapshot = copy.deepcopy(self.state)
        self.undo_history.append(snapshot)
        
        # Limit history size
        if len(self.undo_history) > 10:
            self.undo_history.pop(0)
    
    def undo(self) -> bool:
        """Undo last move"""
        if not self.undo_history or self.state.undo_charges <= 0:
            return False
        
        self.state = self.undo_history.pop()
        self.state.undo_charges -= 1
        return True
    
    def clear_level(self):
        """Clear current level progress"""
        self.state.board.clear_board()
        self.state.pieces_placed = 0
        self.state.lines_cleared_total = self.state.lines_at_level_start
        self._spawn_pieces()
        self.undo_history.clear()
    
    def clean_clear(self) -> bool:
        """Clean clear board without resetting progress"""
        if self.state.clean_clear_charges <= 0:
            return False
        
        self.state.board.clear_board()
        self.state.clean_clear_charges -= 1
        self.undo_history.clear()
        return True
    
    def swap_piece(self, slot_index: int) -> bool:
        """Swap current piece with reserve slot"""
        if self.state.reserve_used_this_turn:
            return False
        
        if slot_index < 0 or slot_index >= len(self.state.reserve_slots):
            return False
        
        # Check if slot is unlocked (based on max level reached, not current level)
        unlocked_slots = 0
        if self.state.level >= 10: unlocked_slots = 1
        if self.state.level >= 20: unlocked_slots = 2
        if self.state.level >= 30: unlocked_slots = 3
        
        if slot_index >= unlocked_slots:
            return False
        
        stored_piece = self.state.reserve_slots[slot_index]
        
        if stored_piece is None:
            # Store current piece
            self.state.reserve_slots[slot_index] = self.state.current_piece
            self._advance_piece()
        else:
            # Swap pieces
            self.state.reserve_slots[slot_index] = self.state.current_piece
            self.state.current_piece = stored_piece
        
        self.state.reserve_used_this_turn = True
        return True
    
    def get_valid_placements(self, piece: Optional[Piece] = None) -> List[Tuple[int, int]]:
        """Get all valid placements for current or specified piece"""
        if piece is None:
            piece = self.state.current_piece
        
        valid = []
        for x in range(self.state.board.width):
            for y in range(self.state.board.height):
                if self.state.board.can_place_piece(piece, (x, y)):
                    valid.append((x, y))
        return valid
    
    def has_valid_moves(self) -> bool:
        """Check if current piece has any valid placements"""
        return len(self.get_valid_placements()) > 0
    
    def _check_level_up(self):
        """Check and handle level progression"""
        if self.state.lines_cleared_total >= self.state.lines_at_level_start + self.state.lines_to_next_level:
            self.state.level += 1
            self.state.lines_at_level_start = self.state.lines_cleared_total
            self.state.lines_to_next_level = min(25 * (1.02 ** self.state.level), 50)
            
            # Check board growth
            new_size = self.state.get_board_size()
            if new_size != self.state.board.width:
                self.state.board.resize(new_size, new_size)
            
            # Award power-ups
            self.state.undo_charges += 1
            if self.state.level % 5 == 0:
                self.state.clean_clear_charges += 1
    
    def _advance_piece(self):
        """Move to next piece"""
        self.state.current_piece = self.state.next_piece
        self._spawn_next_piece()
    
    def _spawn_pieces(self):
        """Spawn current and next pieces"""
        self._spawn_next_piece()
        self.state.current_piece = self.state.next_piece
        self._spawn_next_piece()
    
    def _spawn_next_piece(self):
        """Spawn a new random piece"""
        unlocked_count = self.state.get_unlocked_piece_count()
        
        # Select piece index
        if self.state.difficulty == Difficulty.HARD:
            piece_index = random.randint(0, unlocked_count - 1)
        else:
            # Weighted selection (favor simpler pieces)
            weights = [3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1][:unlocked_count]
            piece_index = random.choices(range(unlocked_count), weights=weights)[0]
        
        # Create and transform piece
        piece = Piece(piece_index)
        piece.rotate(random.randint(0, 3))
        if random.random() < 0.5:
            piece.reflect()
        
        self.state.next_piece = piece
        self.state.piece_spawn_counts[piece_index] += 1
        self.state.piece_spawn_total += 1


def print_board_state(state: GameState):
    """Print current board state to console"""
    print(f"\nLevel {state.level} | Lines: {state.lines_cleared_total} | Remaining: {state.get_lines_remaining()}")
    print(f"Board: {state.board.width}x{state.board.height} | Placed: {state.pieces_placed}")
    print(f"Undo: {state.undo_charges} | Clean Clear: {state.clean_clear_charges}")
    
    # Print board
    print("\nBoard:")
    for y in range(state.board.height - 1, -1, -1):
        row = ""
        for x in range(state.board.width):
            row += "█" if state.board.occupied[x][y] else "·"
        print(row)
    
    # Print current piece
    print(f"\nCurrent piece (shape {state.current_piece.shape_index}): {state.current_piece.cells}")
    print(f"Valid placements: {len(GameEngine(state).get_valid_placements())}")


if __name__ == "__main__":
    """Simple CLI demo"""
    engine = GameEngine()
    
    print("=== Urban Ivy Reference Implementation ===")
    print("Type 'help' for commands")
    
    while True:
        print_board_state(engine.state)
        print("\nCommands: place x y, undo, clear, clean, swap N, quit")
        
        try:
            cmd = input("> ").strip().lower().split()
            
            if not cmd:
                continue
            
            if cmd[0] == "quit":
                break
            elif cmd[0] == "help":
                print("place x y - Place piece at coordinates")
                print("undo - Undo last move")
                print("clear - Reset level progress")
                print("clean - Clean clear board")
                print("swap N - Swap with reserve slot N")
                print("quit - Exit game")
            elif cmd[0] == "place" and len(cmd) == 3:
                x, y = int(cmd[1]), int(cmd[2])
                if engine.place_piece((x, y)):
                    print("Piece placed!")
                else:
                    print("Invalid placement!")
            elif cmd[0] == "undo":
                if engine.undo():
                    print("Move undone!")
                else:
                    print("Cannot undo!")
            elif cmd[0] == "clear":
                engine.clear_level()
                print("Level cleared!")
            elif cmd[0] == "clean":
                if engine.clean_clear():
                    print("Board cleaned!")
                else:
                    print("No clean clear charges!")
            elif cmd[0] == "swap" and len(cmd) == 2:
                slot = int(cmd[1])
                if engine.swap_piece(slot):
                    print(f"Swapped with slot {slot}!")
                else:
                    print("Cannot swap!")
            else:
                print("Unknown command")
        
        except (ValueError, IndexError):
            print("Invalid command format")
