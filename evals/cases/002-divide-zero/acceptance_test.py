import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from app import divide


class TestDivideAcceptance(unittest.TestCase):
    def test_float_result(self) -> None:
        self.assertEqual(divide(10, 4), 2.5)

    def test_zero_raises_with_message(self) -> None:
        with self.assertRaises(ValueError) as ctx:
            divide(1, 0)
        self.assertEqual(str(ctx.exception), "division by zero")
