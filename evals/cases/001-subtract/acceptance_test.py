import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from app import subtract


class TestSubtractAcceptance(unittest.TestCase):
    def test_positive(self) -> None:
        self.assertEqual(subtract(5, 3), 2)

    def test_negative_result(self) -> None:
        self.assertEqual(subtract(3, 5), -2)

    def test_zero(self) -> None:
        self.assertEqual(subtract(0, 0), 0)
