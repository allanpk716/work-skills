package calculator

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"unicode"

	"gojs-calculator/codepoint"
)

type FlowIDKey struct{}

func GetFlowID(ctx context.Context) string {
	if v, ok := ctx.Value(FlowIDKey{}).(string); ok {
		return v
	}
	return "unknown"
}

// Parse splits a simple arithmetic expression into tokens.
// Supports: numbers (int and float), operators +, -, *, /, ^, parentheses.
// Returns tokens as string slice, or error for invalid input.
func Parse(expr string) ([]string, error) {
	expr = strings.TrimSpace(expr)
	if expr == "" {
		return nil, errors.New("empty expression")
	}

	var tokens []string
	i := 0
	for i < len(expr) {
		ch := expr[i]
		if unicode.IsSpace(rune(ch)) {
			i++
			continue
		}
		if ch == '(' || ch == ')' {
			tokens = append(tokens, string(ch))
			i++
		} else if ch == '+' || ch == '-' || ch == '*' || ch == '/' || ch == '^' {
			tokens = append(tokens, string(ch))
			i++
		} else if (ch >= '0' && ch <= '9') || ch == '.' {
			j := i
			for j < len(expr) && ((expr[j] >= '0' && expr[j] <= '9') || expr[j] == '.') {
				j++
			}
			tokens = append(tokens, expr[i:j])
			i = j
		} else {
			return nil, fmt.Errorf("invalid character '%c' at position %d", ch, i)
		}
	}
	return tokens, nil
}

// Validate checks if tokens form a syntactically valid expression.
// Rules: balanced parentheses, no consecutive operators, starts/ends with number or parenthesis.
func Validate(tokens []string) error {
	if len(tokens) == 0 {
		return errors.New("no tokens to validate")
	}

	depth := 0
	expectOperand := true

	for _, tok := range tokens {
		if tok == "(" {
			if !expectOperand {
				return fmt.Errorf("unexpected '(' after operand")
			}
			depth++
		} else if tok == ")" {
			if expectOperand {
				return fmt.Errorf("unexpected ')' without operand")
			}
			depth--
			if depth < 0 {
				return errors.New("unbalanced parentheses: too many ')'")
			}
		} else if isOperator(tok) {
			if expectOperand {
				if tok != "-" {
					return fmt.Errorf("unexpected operator '%s' at start", tok)
				}
			} else {
				expectOperand = true
			}
		} else {
			if _, err := strconv.ParseFloat(tok, 64); err != nil {
				return fmt.Errorf("invalid number '%s'", tok)
			}
			if !expectOperand {
				return fmt.Errorf("unexpected number '%s' without operator", tok)
			}
			expectOperand = false
		}
	}

	if depth != 0 {
		return errors.New("unbalanced parentheses: missing ')'")
	}
	if expectOperand {
		return errors.New("expression ends with operator")
	}
	return nil
}

// Compute evaluates the parsed and validated expression using recursive descent.
func Compute(tokens []string) (float64, error) {
	pos := 0
	result, err := parseExpression(tokens, &pos)
	if err != nil {
		return 0, err
	}
	if pos != len(tokens) {
		return 0, fmt.Errorf("unexpected token '%s' at position %d", tokens[pos], pos)
	}
	return result, nil
}

// Format formats the computation result for display.
func Format(result float64) string {
	if result == float64(int64(result)) {
		return fmt.Sprintf("%.1f", result)
	}
	return fmt.Sprintf("%.4f", result)
}

// Evaluate runs the full pipeline: Parse -> Validate -> Compute -> Format.
// Accepts context.Context for flow_id propagation (via context values) in future probe insertion.
func Evaluate(ctx context.Context, expr string) (string, error) {
	flowID := GetFlowID(ctx)

	codepoint.PointWithMeta("cp-calc-parse", map[string]any{
		"point_id": "cp-calc-parse",
		"flow_id":  flowID,
		"expr":     expr,
	})

	tokens, err := Parse(expr)
	if err != nil {
		return "", err
	}

	codepoint.PointWithMeta("cp-calc-validate", map[string]any{
		"point_id": "cp-calc-validate",
		"flow_id":  flowID,
	})

	if err := Validate(tokens); err != nil {
		return "", err
	}

	codepoint.PointWithMeta("cp-calc-compute", map[string]any{
		"point_id": "cp-calc-compute",
		"flow_id":  flowID,
		"expr":     expr,
	})

	result, err := Compute(tokens)
	if err != nil {
		return "", err
	}

	codepoint.PointWithMeta("cp-calc-format", map[string]any{
		"point_id": "cp-calc-format",
		"flow_id":  flowID,
		"result":   result,
	})

	return Format(result), nil
}

func isOperator(tok string) bool {
	return tok == "+" || tok == "-" || tok == "*" || tok == "/" || tok == "^"
}

// --- recursive descent parser ---

func parseExpression(tokens []string, pos *int) (float64, error) {
	left, err := parseTerm(tokens, pos)
	if err != nil {
		return 0, err
	}
	for *pos < len(tokens) && (tokens[*pos] == "+" || tokens[*pos] == "-") {
		op := tokens[*pos]
		(*pos)++
		right, err := parseTerm(tokens, pos)
		if err != nil {
			return 0, err
		}
		if op == "+" {
			left += right
		} else {
			left -= right
		}
	}
	return left, nil
}

func parseTerm(tokens []string, pos *int) (float64, error) {
	left, err := parsePower(tokens, pos)
	if err != nil {
		return 0, err
	}
	for *pos < len(tokens) && (tokens[*pos] == "*" || tokens[*pos] == "/") {
		op := tokens[*pos]
		(*pos)++
		right, err := parsePower(tokens, pos)
		if err != nil {
			return 0, err
		}
		if op == "*" {
			left *= right
		} else {
			if right == 0 {
				return 0, errors.New("division by zero")
			}
			left /= right
		}
	}
	return left, nil
}

func parsePower(tokens []string, pos *int) (float64, error) {
	base, err := parseUnary(tokens, pos)
	if err != nil {
		return 0, err
	}
	if *pos < len(tokens) && tokens[*pos] == "^" {
		(*pos)++
		exp, err := parseUnary(tokens, pos)
		if err != nil {
			return 0, err
		}
		return math.Pow(base, exp), nil
	}
	return base, nil
}

func parseUnary(tokens []string, pos *int) (float64, error) {
	if *pos < len(tokens) && tokens[*pos] == "-" {
		(*pos)++
		val, err := parseFactor(tokens, pos)
		if err != nil {
			return 0, err
		}
		return -val, nil
	}
	return parseFactor(tokens, pos)
}

func parseFactor(tokens []string, pos *int) (float64, error) {
	if *pos >= len(tokens) {
		return 0, errors.New("unexpected end of expression")
	}
	tok := tokens[*pos]
	if tok == "(" {
		(*pos)++
		val, err := parseExpression(tokens, pos)
		if err != nil {
			return 0, err
		}
		if *pos >= len(tokens) || tokens[*pos] != ")" {
			return 0, errors.New("missing closing parenthesis")
		}
		(*pos)++
		return val, nil
	}
	val, err := strconv.ParseFloat(tok, 64)
	if err != nil {
		return 0, fmt.Errorf("expected number, got '%s'", tok)
	}
	(*pos)++
	return val, nil
}
