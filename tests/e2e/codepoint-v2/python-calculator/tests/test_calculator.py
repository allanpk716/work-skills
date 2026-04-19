"""Unit tests for core calculator pipeline: parse, validate, compute, format, evaluate."""

import math
import pytest

from calculator.core import (
    parse_expression,
    validate_tokens,
    compute,
    format_result,
    evaluate,
)


class TestParse:
    def test_simple_addition(self):
        assert parse_expression("2+3") == ["2", "+", "3"]

    def test_multiplication_precedence(self):
        assert parse_expression("2+3*4") == ["2", "+", "3", "*", "4"]

    def test_parentheses(self):
        assert parse_expression("(2+3)*4") == ["(", "2", "+", "3", ")", "*", "4"]

    def test_float_number(self):
        assert parse_expression("3.14+2") == ["3.14", "+", "2"]

    def test_spaces_ignored(self):
        assert parse_expression(" 2 + 3 ") == ["2", "+", "3"]

    def test_empty_returns_empty(self):
        assert parse_expression("") == []

    def test_power_operator(self):
        assert parse_expression("2^3") == ["2", "^", "3"]

    def test_invalid_char_raises(self):
        with pytest.raises(ValueError, match="invalid character"):
            parse_expression("2@3")


class TestValidate:
    def test_valid_simple(self):
        assert validate_tokens(["2", "+", "3"]) is True

    def test_valid_complex(self):
        assert validate_tokens(["(", "2", "+", "3", ")", "*", "4"]) is True

    def test_empty_tokens(self):
        assert validate_tokens([]) is False

    def test_unbalanced_parens(self):
        assert validate_tokens(["(", "2", "+", "3"]) is False

    def test_consecutive_operators(self):
        assert validate_tokens(["2", "+", "*", "3"]) is False

    def test_trailing_operator(self):
        assert validate_tokens(["2", "+"]) is False

    def test_unary_minus(self):
        assert validate_tokens(["-", "2", "+", "3"]) is True


class TestCompute:
    def test_addition(self):
        assert compute(["2", "+", "3"]) == 5.0

    def test_subtraction(self):
        assert compute(["10", "-", "3"]) == 7.0

    def test_multiplication(self):
        assert compute(["3", "*", "4"]) == 12.0

    def test_division(self):
        assert compute(["10", "/", "4"]) == 2.5

    def test_precedence(self):
        assert compute(["2", "+", "3", "*", "4"]) == 14.0

    def test_parentheses(self):
        assert compute(["(", "2", "+", "3", ")", "*", "4"]) == 20.0

    def test_power(self):
        assert compute(["2", "^", "3"]) == 8.0

    def test_unary_minus(self):
        assert compute(["-", "5", "+", "3"]) == -2.0

    def test_division_by_zero(self):
        with pytest.raises(ZeroDivisionError):
            compute(["1", "/", "0"])

    def test_nested_parens(self):
        assert compute(["(", "(", "2", "+", "3", ")", "*", "4", ")"]) == 20.0

    def test_complex_expression(self):
        assert compute(["2", "+", "3", "*", "(", "4", "-", "1", ")"]) == 11.0


class TestFormat:
    def test_integer_result(self):
        assert format_result(5.0) == "5.0"

    def test_float_result(self):
        assert format_result(3.14159) == "3.1416"

    def test_negative_integer(self):
        assert format_result(-7.0) == "-7.0"


class TestEvaluate:
    def test_simple(self):
        result, err = evaluate("2+3")
        assert result == "5.0"
        assert err == ""

    def test_with_flow_id(self):
        result, err = evaluate("2+3", flow_id="flow-test")
        assert result == "5.0"

    def test_empty_expression(self):
        result, err = evaluate("")
        assert err == "empty expression"

    def test_invalid_expression(self):
        result, err = evaluate("2++3")
        assert err != ""

    def test_division_by_zero(self):
        result, err = evaluate("1/0")
        assert "division by zero" in err

    def test_precedence(self):
        result, err = evaluate("2+3*4")
        assert result == "14.0"

    def test_parentheses(self):
        result, err = evaluate("(2+3)*4")
        assert result == "20.0"

    def test_float(self):
        result, err = evaluate("3.14+1")
        assert result == "4.14" or "4.1" in result

    def test_power(self):
        result, err = evaluate("2^10")
        assert result == "1024.0"
