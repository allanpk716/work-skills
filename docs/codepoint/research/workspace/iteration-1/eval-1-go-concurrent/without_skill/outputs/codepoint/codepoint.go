package codepoint

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"
)

// enabled is controlled by the CODEPOINT_ENABLED environment variable.
// Set CODEPOINT_ENABLED=true to activate all code points.
var enabled bool

func init() {
	enabled = os.Getenv("CODEPOINT_ENABLED") == "true"
}

// Enabled returns the current code point activation state.
func Enabled() bool {
	return enabled
}

// Point captures a stack trace at the call site. Zero cost when disabled.
func Point(name string) {
	if !enabled {
		return
	}
	buf := make([]byte, 8192)
	n := runtime.Stack(buf, false)
	fmt.Fprintf(os.Stderr, "[CODEPOINT] %s\n%s\n", name, string(buf[:n]))
}

// CollectStack returns the stack as a string for programmatic use.
func CollectStack(name string) string {
	if !enabled {
		return ""
	}
	buf := make([]byte, 8192)
	n := runtime.Stack(buf, false)
	return fmt.Sprintf("[CODEPOINT] %s\n%s", name, string(buf[:n]))
}

// PointJSON emits a structured JSON code point entry.
func PointJSON(name string) {
	if !enabled {
		return
	}
	type Frame struct {
		Function string `json:"function"`
		File     string `json:"file"`
		Line     int    `json:"line"`
	}
	type Entry struct {
		Name      string  `json:"name"`
		Timestamp string  `json:"timestamp"`
		Goroutine int     `json:"goroutine"`
		Frames    []Frame `json:"frames"`
	}

	buf := make([]byte, 8192)
	n := runtime.Stack(buf, false)
	stack := string(buf[:n])

	entry := Entry{
		Name:      name,
		Timestamp: time.Now().Format(time.RFC3339Nano),
		Frames:    parseGoStack(stack),
	}

	data, _ := json.Marshal(entry)
	fmt.Fprintf(os.Stderr, "%s\n", data)
}

// PointWithMeta captures stack + custom metadata.
func PointWithMeta(name string, meta map[string]any) {
	if !enabled {
		return
	}
	buf := make([]byte, 8192)
	n := runtime.Stack(buf, false)

	type output struct {
		Name      string         `json:"name"`
		Timestamp string         `json:"timestamp"`
		Meta      map[string]any `json:"meta"`
		Stack     string         `json:"stack"`
	}

	data, _ := json.Marshal(output{
		Name:      name,
		Timestamp: time.Now().Format(time.RFC3339Nano),
		Meta:      meta,
		Stack:     string(buf[:n]),
	})
	fmt.Fprintf(os.Stderr, "%s\n", data)
}

// AnalyzeOverlap computes stack frame overlap between two captured stacks.
// Returns 0.0 (no overlap) to 1.0 (identical frames).
func AnalyzeOverlap(stack1, stack2 string) float64 {
	f1 := extractFrames(stack1)
	f2 := extractFrames(stack2)
	if len(f1) == 0 {
		return 0
	}
	overlap := 0
	for f := range f1 {
		if f2[f] {
			overlap++
		}
	}
	return float64(overlap) / float64(len(f1))
}

// --- internal ---

func parseGoStack(stack string) []struct {
	Function string `json:"function"`
	File     string `json:"file"`
	Line     int    `json:"line"`
} {
	var frames []struct {
		Function string `json:"function"`
		File     string `json:"file"`
		Line     int    `json:"line"`
	}
	lines := strings.Split(stack, "\n")
	for i := 0; i < len(lines)-1; i++ {
		fn := strings.TrimSpace(lines[i])
		loc := strings.TrimSpace(lines[i+1])
		if strings.HasPrefix(fn, "goroutine") || fn == "" || strings.HasPrefix(fn, "[CODEPOINT]") {
			continue
		}
		if !strings.HasPrefix(loc, "\t") && !strings.HasPrefix(loc, "/") {
			continue
		}
		frames = append(frames, struct {
			Function string `json:"function"`
			File     string `json:"file"`
			Line     int    `json:"line"`
		}{Function: fn, File: loc})
		i++ // skip the file:line pair
	}
	return frames
}

func extractFrames(stack string) map[string]bool {
	frames := make(map[string]bool)
	for _, line := range strings.Split(stack, "\n") {
		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "goroutine") &&
			!strings.HasPrefix(line, "\t") && !strings.HasPrefix(line, "/") &&
			!strings.HasPrefix(line, "[CODEPOINT]") {
			frames[line] = true
		}
	}
	return frames
}
