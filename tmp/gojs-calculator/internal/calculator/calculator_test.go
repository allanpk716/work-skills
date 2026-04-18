package calculator

import (
	"context"
	"math"
	"testing"
)

func TestMain(m *testing.M) {
	m.Run()
}

func TestParse(t *testing.T) {
	tests := []struct {
		name    string
		expr    string
		want    []string
		wantErr bool
	}{
		{"simple addition", "2+3", []string{"2", "+", "3"}, false},
		{"with spaces", " 2 + 3 ", []string{"2", "+", "3"}, false},
		{"multiplication", "2*3+4", []string{"2", "*", "3", "+", "4"}, false},
		{"parentheses", "(2+3)*4", []string{"(", "2", "+", "3", ")", "*", "4"}, false},
		{"float", "2.5+3.1", []string{"2.5", "+", "3.1"}, false},
		{"power operator", "2^3", []string{"2", "^", "3"}, false},
		{"empty", "", nil, true},
		{"invalid char", "2&a", nil, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Parse(tt.expr)
			if (err != nil) != tt.wantErr {
				t.Errorf("Parse() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && !sliceEqual(got, tt.want) {
				t.Errorf("Parse() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		expr    string
		wantErr bool
	}{
		{"valid add", "2+3", false},
		{"valid paren", "(2+3)*4", false},
		{"valid float", "2.5*3.1", false},
		{"empty", "", true},
		{"consecutive ops", "2++3", true},
		{"unbalanced", "(2+3", true},
		{"ends with op", "2+", true},
		{"division by zero expr ok", "2/0", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tokens, err := Parse(tt.expr)
			if err != nil {
				if tt.wantErr {
					return
				}
				t.Fatalf("Parse failed: %v", err)
			}
			err = Validate(tokens)
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestCompute(t *testing.T) {
	tests := []struct {
		name    string
		expr    string
		want    float64
		wantErr bool
	}{
		{"add", "2+3", 5, false},
		{"subtract", "10-3", 7, false},
		{"multiply", "4*5", 20, false},
		{"divide", "10/2", 5, false},
		{"power", "2^3", 8, false},
		{"complex", "2+3*4", 14, false},
		{"paren", "(2+3)*4", 20, false},
		{"float", "2.5+3.5", 6, false},
		{"div by zero", "10/0", 0, true},
		{"negative power", "2^-3", 0.125, false},
		{"nested paren", "((2+3)*(4-1))^2", 225, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tokens, err := Parse(tt.expr)
			if err != nil {
				t.Fatalf("Parse failed: %v", err)
			}
			if err := Validate(tokens); err != nil {
				t.Fatalf("Validate failed: %v", err)
			}
			got, err := Compute(tokens)
			if (err != nil) != tt.wantErr {
				t.Errorf("Compute() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && math.Abs(got-tt.want) > 1e-9 {
				t.Errorf("Compute() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFormat(t *testing.T) {
	tests := []struct {
		input  float64
		output string
	}{
		{5.0, "5.0"},
		{3.14159, "3.1416"},
		{0, "0.0"},
		{-2.5, "-2.5000"},
	}
	for _, tt := range tests {
		got := Format(tt.input)
		if got != tt.output {
			t.Errorf("Format(%v) = %v, want %v", tt.input, got, tt.output)
		}
	}
}

func TestEvaluateFullPipeline(t *testing.T) {
	tests := []struct {
		name    string
		expr    string
		want    string
		wantErr bool
	}{
		{"simple", "2+3", "5.0", false},
		{"complex", "(2+3)*4-10/2", "15.0", false},
		{"div by zero", "10/0", "", true},
		{"invalid syntax", "2++3", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Evaluate(context.Background(), tt.expr)
			if (err != nil) != tt.wantErr {
				t.Errorf("Evaluate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("Evaluate() = %s, want %s", got, tt.want)
			}
		})
	}
}

func sliceEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
