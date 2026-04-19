"""Core calculator with shared pipeline: parse -> validate -> compute -> format."""

import math
import re
from typing import Tuple

from codepoint import point_json


def parse_expression(expr: str) -> list:
    """Parse expression string into tokens (numbers, operators, parentheses)."""
    expr = expr.strip()
    if not expr:
        return []

    tokens = []
    i = 0
    while i < len(expr):
        ch = expr[i]
        if ch.isspace():
            i += 1
        elif ch in "()+-*/^":
            tokens.append(ch)
            i += 1
        elif ch.isdigit() or ch == ".":
            j = i
            while j < len(expr) and (expr[j].isdigit() or expr[j] == "."):
                j += 1
            tokens.append(expr[i:j])
            i = j
        else:
            raise ValueError(f"invalid character '{ch}' at position {i}")
    return tokens


def validate_tokens(tokens: list) -> bool:
    """Validate token sequence is a syntactically valid expression."""
    if not tokens:
        return False

    depth = 0
    expect_operand = True

    for tok in tokens:
        if tok == "(":
            if not expect_operand:
                return False
            depth += 1
        elif tok == ")":
            if expect_operand:
                return False
            depth -= 1
            if depth < 0:
                return False
        elif tok in "+-*/^":
            if expect_operand and tok != "-":
                return False
            if expect_operand and tok == "-":
                depth = depth  # unary minus ok
            else:
                expect_operand = True
        else:
            try:
                float(tok)
            except ValueError:
                return False
            if not expect_operand:
                return False
            expect_operand = False

    return depth == 0 and not expect_operand


def _is_operator(tok: str) -> bool:
    return tok in "+-*/^"


# --- Recursive descent parser ---

class _Parser:
    def __init__(self, tokens: list):
        self.tokens = tokens
        self.pos = 0

    def _peek(self) -> str:
        if self.pos < len(self.tokens):
            return self.tokens[self.pos]
        return None

    def _consume(self) -> str:
        tok = self.tokens[self.pos]
        self.pos += 1
        return tok

    def parse_expression(self) -> float:
        left = self.parse_term()
        while self._peek() in ("+", "-"):
            op = self._consume()
            right = self.parse_term()
            if op == "+":
                left += right
            else:
                left -= right
        return left

    def parse_term(self) -> float:
        left = self.parse_power()
        while self._peek() in ("*", "/"):
            op = self._consume()
            right = self.parse_power()
            if op == "*":
                left *= right
            else:
                if right == 0:
                    raise ZeroDivisionError("division by zero")
                left /= right
        return left

    def parse_power(self) -> float:
        base = self.parse_unary()
        if self._peek() == "^":
            self._consume()
            exp = self.parse_unary()
            return math.pow(base, exp)
        return base

    def parse_unary(self) -> float:
        if self._peek() == "-":
            self._consume()
            val = self.parse_factor()
            return -val
        return self.parse_factor()

    def parse_factor(self) -> float:
        tok = self._peek()
        if tok is None:
            raise ValueError("unexpected end of expression")
        if tok == "(":
            self._consume()
            val = self.parse_expression()
            if self._peek() != ")":
                raise ValueError("missing closing parenthesis")
            self._consume()
            return val
        self._consume()
        try:
            return float(tok)
        except ValueError:
            raise ValueError(f"expected number, got '{tok}'")


def compute(tokens: list) -> float:
    """Evaluate expression tokens using recursive descent parser."""
    parser = _Parser(tokens)
    result = parser.parse_expression()
    if parser.pos != len(tokens):
        raise ValueError(f"unexpected token '{tokens[parser.pos]}' at position {parser.pos}")
    return result


def format_result(result: float) -> str:
    """Format computation result."""
    if result == int(result) and not math.isinf(result):
        return f"{int(result)}.0"
    return f"{result:.4f}"


def evaluate(expr: str, flow_id: str = "") -> Tuple[str, str]:
    """Full evaluation pipeline: parse -> validate -> compute -> format.

    Returns (result_string, error_string).
    flow_id identifies the calling business flow for probe tracing.
    """
    # Stage 1: Parse
    point_json("cp-calc-parse", {
        "point_id": "cp-calc-parse",
        "flow_id": flow_id,
        "expr": expr,
    })
    try:
        tokens = parse_expression(expr)
    except ValueError as e:
        return "", str(e)
    if not tokens:
        return "", "empty expression"

    # Stage 2: Validate
    point_json("cp-calc-validate", {
        "point_id": "cp-calc-validate",
        "flow_id": flow_id,
    })
    if not validate_tokens(tokens):
        return "", "invalid expression"

    # Stage 3: Compute
    point_json("cp-calc-compute", {
        "point_id": "cp-calc-compute",
        "flow_id": flow_id,
        "expr": expr,
    })
    try:
        result = compute(tokens)
    except (ValueError, ZeroDivisionError) as e:
        return "", str(e)

    # Stage 4: Format
    point_json("cp-calc-format", {
        "point_id": "cp-calc-format",
        "flow_id": flow_id,
        "result": result,
    })
    return format_result(result), ""
