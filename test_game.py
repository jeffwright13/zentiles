"""
Test cases for Urban Ivy game logic
"""

import unittest
from urban_ivy_game import GameEngine, GameState, Piece, Board, Difficulty


class TestPiece(unittest.TestCase):
    
    def test_piece_creation(self):
        piece = Piece(0)
        self.assertEqual(piece.cells, [(0, 0)])
    
    def test_piece_rotation(self):
        piece = Piece(1)  # Horizontal line of 2
        original = piece.cells.copy()
        piece.rotate(1)
        self.assertEqual(piece.cells, [(0, 0), (0, 1)])  # Should become vertical
        piece.rotate(3)  # Rotate back
        self.assertEqual(piece.cells, original)
    
    def test_piece_reflection(self):
        piece = Piece(1)  # Horizontal line of 2
        piece.reflect()
        self.assertEqual(piece.cells, [(0, 0), (1, 0)])  # Should be same for symmetric piece
    
    def test_piece_normalization(self):
        piece = Piece()
        piece.cells = [(1, 1), (2, 1), (1, 2)]
        piece._normalize()
        self.assertEqual(piece.cells, [(0, 0), (0, 1), (1, 0)])  # Sorted order


class TestBoard(unittest.TestCase):
    
    def setUp(self):
        self.board = Board(5, 5)
    
    def test_board_creation(self):
        self.assertEqual(self.board.width, 5)
        self.assertEqual(self.board.height, 5)
        self.assertEqual(len(self.board.occupied), 5)
        self.assertEqual(len(self.board.occupied[0]), 5)
    
    def test_valid_position(self):
        self.assertTrue(self.board.is_valid_position(0, 0))
        self.assertTrue(self.board.is_valid_position(4, 4))
        self.assertFalse(self.board.is_valid_position(-1, 0))
        self.assertFalse(self.board.is_valid_position(5, 0))
    
    def test_piece_placement(self):
        piece = Piece(0)  # Single square
        self.assertTrue(self.board.can_place_piece(piece, (2, 2)))
        self.board.place_piece(piece, (2, 2))
        self.assertTrue(self.board.occupied[2][2])
        self.assertFalse(self.board.can_place_piece(piece, (2, 2)))
    
    def test_line_detection(self):
        # Fill first row
        for x in range(5):
            self.board.occupied[x][0] = True
        
        full_rows = self.board.get_full_rows()
        self.assertEqual(full_rows, {0})
        
        # Fill first column
        for y in range(5):
            self.board.occupied[0][y] = True
        
        full_cols = self.board.get_full_columns()
        self.assertEqual(full_cols, {0})
    
    def test_line_clearing(self):
        # Fill first row and column
        for x in range(5):
            self.board.occupied[x][0] = True
        for y in range(5):
            self.board.occupied[0][y] = True
        
        cleared = self.board.clear_rows_and_columns({0}, {0})
        self.assertEqual(cleared, 2)  # 1 row + 1 column
        
        # Check everything is cleared
        for x in range(5):
            for y in range(5):
                self.assertFalse(self.board.occupied[x][y])
    
    def test_board_resize(self):
        self.board.occupied[1][1] = True
        
        self.board.resize(7, 7)
        self.assertEqual(self.board.width, 7)
        self.assertEqual(self.board.height, 7)
        self.assertTrue(self.board.occupied[1][1])


class TestGameState(unittest.TestCase):
    
    def setUp(self):
        self.state = GameState()
    
    def test_initial_state(self):
        self.assertEqual(self.state.level, 1)
        self.assertEqual(self.state.lines_cleared_total, 0)
        self.assertEqual(self.state.pieces_placed, 0)
        self.assertEqual(self.state.undo_charges, 3)
        self.assertEqual(self.state.clean_clear_charges, 1)
    
    def test_level_progression(self):
        self.state.level = 10
        self.assertEqual(self.state.get_unlocked_piece_count(), 7)  # 5 + floor(10/5)
        self.assertEqual(self.state.get_board_size(), 7)  # 5 + floor(10/5)
    
    def test_lines_remaining(self):
        self.assertEqual(self.state.get_lines_remaining(), 25)
        self.state.lines_cleared_total = 10
        self.assertEqual(self.state.get_lines_remaining(), 15)
    
    def test_max_board_size(self):
        self.state.level = 50
        self.assertEqual(self.state.get_board_size(), 12)  # Capped at 12


class TestGameEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = GameEngine()
    
    def test_piece_placement(self):
        result = self.engine.place_piece((2, 2))
        self.assertTrue(result)
        self.assertEqual(self.engine.state.pieces_placed, 1)
        self.assertTrue(self.engine.state.board.occupied[2][2])
    
    def test_invalid_placement(self):
        result = self.engine.place_piece((10, 10))  # Out of bounds
        self.assertFalse(result)
        self.assertEqual(self.engine.state.pieces_placed, 0)
    
    def test_undo(self):
        # Place a piece
        self.engine.place_piece((1, 1))
        pieces_placed = self.engine.state.pieces_placed
        
        # Undo
        result = self.engine.undo()
        self.assertTrue(result)
        self.assertEqual(self.engine.state.pieces_placed, pieces_placed - 1)
        self.assertEqual(self.engine.state.undo_charges, 2)  # Used one charge
    
    def test_clear_level(self):
        # Place some pieces and clear lines
        self.engine.state.pieces_placed = 5
        self.engine.state.lines_cleared_total = 10
        
        self.engine.clear_level()
        
        self.assertEqual(self.engine.state.pieces_placed, 0)
        self.assertEqual(self.engine.state.lines_cleared_total, 0)  # Reset to level start
        self.assertEqual(self.engine.state.level, 1)  # Level preserved
    
    def test_clean_clear(self):
        # Place a piece
        self.engine.place_piece((1, 1))
        
        # Clean clear
        result = self.engine.clean_clear()
        self.assertTrue(result)
        self.assertEqual(self.engine.state.clean_clear_charges, 0)
        
        # Board should be empty but progress preserved
        self.assertTrue(all(all(not cell for cell in row) for row in self.engine.state.board.occupied))
        self.assertEqual(self.engine.state.pieces_placed, 1)  # Progress preserved
    
    def test_swap_piece(self):
        # Swap with empty slot - should work at level 10
        self.engine.state.level = 10  # Unlock first slot
        original_piece = self.engine.state.current_piece
        result = self.engine.swap_piece(0)
        self.assertTrue(result)
        self.assertEqual(self.engine.state.reserve_slots[0], original_piece)
        self.assertNotEqual(self.engine.state.current_piece, original_piece)
    
    def test_swap_used_this_turn(self):
        self.engine.swap_piece(0)
        result = self.engine.swap_piece(0)  # Try to swap again
        self.assertFalse(result)
    
    def test_valid_placements(self):
        placements = self.engine.get_valid_placements()
        self.assertIsInstance(placements, list)
        self.assertGreater(len(placements), 0)
    
    def test_no_moves_detection(self):
        # Fill entire board except one cell
        for x in range(5):
            for y in range(5):
                if x != 2 or y != 2:  # Leave center empty
                    self.engine.state.board.occupied[x][y] = True
        
        # Use a piece that won't fit in the single empty cell
        self.engine.state.current_piece = Piece(1)  # 2-cell piece
        
        # Current piece should have no valid placements
        self.assertFalse(self.engine.has_valid_moves())
    
    def test_level_up(self):
        # Set up for level up
        self.engine.state.lines_cleared_total = 24
        self.engine.state.lines_at_level_start = 0
        self.engine.state.lines_to_next_level = 25
        
        # Place piece that clears a line
        for x in range(5):
            self.engine.state.board.occupied[x][0] = True
        
        self.engine.place_piece((2, 1))  # This should trigger level up
        
        self.assertEqual(self.engine.state.level, 2)
        self.assertGreater(self.engine.state.undo_charges, 3)  # Should gain undo charge


class TestIntegration(unittest.TestCase):
    
    def test_basic_gameplay_loop(self):
        engine = GameEngine()
        
        # Play a few moves
        moves = [(0, 0), (1, 1), (2, 2), (3, 3)]
        
        for move in moves:
            result = engine.place_piece(move)
            self.assertTrue(result, f"Failed to place piece at {move}")
        
        # Check game progressed
        self.assertGreater(engine.state.pieces_placed, 0)
        self.assertEqual(engine.state.level, 1)
    
    def test_line_clearing_progression(self):
        engine = GameEngine()
        
        # Fill a row manually
        for x in range(5):
            engine.state.board.occupied[x][0] = True
        
        # Place piece to trigger clear
        engine.place_piece((0, 1))
        
        # Should have cleared a line
        self.assertGreater(engine.state.lines_cleared_total, 0)
    
    def test_board_growth(self):
        state = GameState()
        state.level = 5  # Should trigger board growth to 6x6
        
        engine = GameEngine(state)
        
        # Manually trigger board resize since level up happens during gameplay
        new_size = state.get_board_size()
        state.board.resize(new_size, new_size)
        
        # Check board size
        self.assertEqual(engine.state.board.width, 6)
        self.assertEqual(engine.state.board.height, 6)


if __name__ == "__main__":
    unittest.main()
