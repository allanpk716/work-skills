package codepoint

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"
)

var enabled bool

func init() {
	enabled = os.Getenv("CODEPOINT_ENABLED") == "true"
}

// Enable turns on code point capture at runtime.
func Enable() {
	enabled = true
}

// Disable turns off code point capture at runtime.
func Disable() {
	enabled = false
}

// IsEnabled reports whether code points are active.
func IsEnabled() bool {
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

// PointWithGoroutineID captures stack and includes goroutine ID in metadata.
// Useful for correlating concurrent execution across goroutines.
func PointWithGoroutineID(name string) {
	if !enabled {
		return
	}
	buf := make([]byte, 8192)
	n := runtime.Stack(buf, false)
	goroutineID := parseGoroutineID(string(buf[:n]))
	PointWithMeta(name, map[string]any{"goroutine_id": goroutineID})
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

// CollectCaptured stores captured stacks for later analysis.
// Thread-safe.
type Collector struct {
	mu      sync.Mutex
	captured []CapturedPoint
}

type CapturedPoint struct {
	Name      string
	Stack     string
	Timestamp time.Time
}

func NewCollector() *Collector {
	return &Collector{}
}

// Collect captures a stack and stores it for later analysis.
func (c *Collector) Collect(name string) {
	if !enabled {
		return
	}
	stack := CollectStack(name)
	c.mu.Lock()
	defer c.mu.Unlock()
	c.captured = append(c.captured, CapturedPoint{
		Name:      name,
		Stack:     stack,
		Timestamp: time.Now(),
	})
}

// GetAll returns all captured points (thread-safe).
func (c *Collector) GetAll() []CapturedPoint {
	c.mu.Lock()
	defer c.mu.Unlock()
	result := make([]CapturedPoint, len(c.captured))
	copy(result, c.captured)
	return result
}

// AnalyzeDensity computes overlap between consecutive captured points.
// Returns overlap ratios; each element i is the overlap between point i and i+1.
func (c *Collector) AnalyzeDensity() []DensityResult {
	c.mu.Lock()
	points := make([]CapturedPoint, len(c.captured))
	copy(points, c.captured)
	c.mu.Unlock()

	var results []DensityResult
	for i := 0; i < len(points)-1; i++ {
		overlap := AnalyzeOverlap(points[i].Stack, points[i+1].Stack)
		results = append(results, DensityResult{
			PointA:     points[i].Name,
			PointB:     points[i+1].Name,
			Overlap:    overlap,
			Density:    classifyDensity(overlap),
			TimestampA: points[i].Timestamp,
			TimestampB: points[i+1].Timestamp,
		})
	}
	return results
}

type DensityResult struct {
	PointA     string
	PointB     string
	Overlap    float64
	Density    string // "too_dense", "good", "too_sparse"
	TimestampA time.Time
	TimestampB time.Time
}

// Reset clears all captured points.
func (c *Collector) Reset() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.captured = nil
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

func parseGoroutineID(stack string) int {
	if idx := strings.Index(stack, "goroutine "); idx != -1 {
		id := ""
		for i := idx + len("goroutine "); i < len(stack) && stack[i] != ' '; i++ {
			id += string(stack[i])
		}
		var goid int
		fmt.Sscanf(id, "%d", &goid)
		return goid
	}
	return -1
}

func classifyDensity(overlap float64) string {
	if overlap > 0.8 {
		return "too_dense"
	}
	if overlap == 0 {
		return "too_sparse"
	}
	return "good"
}
