package codepoint

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

type sessionState struct {
	mu        sync.Mutex
	outDir    string
	timestamp string
	millis    int
	startTime time.Time
	project   string

	general   *os.File
	flowFiles map[string]*os.File
}

var (
	enabled  bool
	session  *sessionState
	initOnce sync.Once
)

func init() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	togglePath := filepath.Join(home, ".codepoint", ".codepoint-go")
	if _, err := os.Stat(togglePath); err != nil {
		return // file doesn't exist -> disabled
	}
	enabled = true

	projectName := detectModuleName()

	outDir := filepath.Join(home, ".codepoint", projectName)
	os.MkdirAll(outDir, 0755)

	now := time.Now()
	ts := now.Format("2006-01-02_15-04-05")
	ms := now.Nanosecond() / 1e6
	filename := fmt.Sprintf("cp-go-%s_%03d.log", ts, ms)

	f, err := os.OpenFile(filepath.Join(outDir, filename), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		// Fallback: disable if file creation fails
		return
	}

	session = &sessionState{
		outDir:    outDir,
		timestamp: ts,
		millis:    ms,
		startTime: now,
		project:   projectName,
		general:   f,
		flowFiles: make(map[string]*os.File),
	}

	fmt.Fprintf(f, "# Code Point Log (Go)\n# Project: %s\n# Session: %s\n# Toggle: %s\n\n",
		projectName, now.Format(time.RFC3339Nano), togglePath)
}

// detectModuleName walks up from CWD to find go.mod and extract the module name.
// Falls back to CWD basename if go.mod not found.
func detectModuleName() string {
	dir, err := os.Getwd()
	if err != nil {
		return "unknown"
	}
	for {
		modPath := filepath.Join(dir, "go.mod")
		data, err := os.ReadFile(modPath)
		if err == nil {
			for _, line := range strings.Split(string(data), "\n") {
				line = strings.TrimSpace(line)
				if strings.HasPrefix(line, "module ") {
					return strings.TrimSpace(strings.TrimPrefix(line, "module"))
				}
			}
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break // filesystem root
		}
		dir = parent
	}
	return filepath.Base(dir)
}

// Close flushes and closes all output files. Call on graceful shutdown.
func Close() {
	if session == nil {
		return
	}
	session.mu.Lock()
	defer session.mu.Unlock()

	if session.general != nil {
		session.general.Close()
		session.general = nil
	}
	for id, f := range session.flowFiles {
		f.Close()
		delete(session.flowFiles, id)
	}
}

// IsEnabled returns whether code points are active.
func IsEnabled() bool {
	return enabled
}

// OutputPath returns the general log file path, or "" if disabled.
func OutputPath() string {
	if !enabled || session == nil {
		return ""
	}
	session.mu.Lock()
	defer session.mu.Unlock()
	if session.general == nil {
		return ""
	}
	return session.general.Name()
}

// OutputPaths returns all log file paths (general + all flow files).
func OutputPaths() []string {
	if !enabled || session == nil {
		return nil
	}
	session.mu.Lock()
	defer session.mu.Unlock()

	var paths []string
	if session.general != nil {
		paths = append(paths, session.general.Name())
	}
	for _, f := range session.flowFiles {
		paths = append(paths, f.Name())
	}
	return paths
}

// Point captures a stack trace at the call site. Zero cost when disabled.
func Point(name string) {
	if !enabled || session == nil {
		return
	}
	buf := make([]byte, 8192)
	n := runtime.Stack(buf, false)

	session.mu.Lock()
	defer session.mu.Unlock()
	if session.general != nil {
		fmt.Fprintf(session.general, "[CODEPOINT] %s\n%s\n", name, string(buf[:n]))
	}
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

// Frame represents a single stack frame.
type Frame struct {
	Function string `json:"function"`
	File     string `json:"file"`
	Line     int    `json:"line"`
}

// PointJSON emits a structured JSON code point entry.
func PointJSON(name string) {
	if !enabled || session == nil {
		return
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

	session.mu.Lock()
	defer session.mu.Unlock()
	if session.general != nil {
		fmt.Fprintf(session.general, "%s\n", data)
	}
}

// PointWithMeta captures stack + custom metadata.
// If meta contains a non-empty "flow_id" string, the entry is routed to a
// flow-specific log file. Otherwise it goes to the general file.
func PointWithMeta(name string, meta map[string]any) {
	if !enabled || session == nil {
		return
	}

	// Extract flow_id before lock (meta is caller-owned)
	flowID := ""
	if meta != nil {
		if v, ok := meta["flow_id"]; ok {
			if s, ok := v.(string); ok && s != "" {
				flowID = s
			}
		}
	}

	// Capture stack outside lock (expensive ~8KB copy)
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

	session.mu.Lock()
	defer session.mu.Unlock()

	if flowID != "" {
		w := session.getOrCreateFlowFile(flowID)
		fmt.Fprintf(w, "%s\n", data)
	} else if session.general != nil {
		fmt.Fprintf(session.general, "%s\n", data)
	}
}

// getOrCreateFlowFile returns the file handle for a flow, creating it lazily.
// Must be called with session.mu held.
func (s *sessionState) getOrCreateFlowFile(flowID string) io.Writer {
	if f, ok := s.flowFiles[flowID]; ok {
		return f
	}

	safeName := sanitizeFlowID(flowID)
	filename := fmt.Sprintf("cp-go-%s-%s_%03d.log", safeName, s.timestamp, s.millis)
	f, err := os.OpenFile(filepath.Join(s.outDir, filename), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		// Fallback to general file on error
		if s.general != nil {
			return s.general
		}
		return io.Discard
	}

	fmt.Fprintf(f, "# Code Point Log (Go) - Flow: %s\n# Project: %s\n# Session: %s\n# Flow ID: %s\n\n",
		safeName, s.project, s.startTime.Format(time.RFC3339Nano), flowID)

	s.flowFiles[flowID] = f
	return f
}

// sanitizeFlowID replaces characters unsafe for filenames with '-'.
func sanitizeFlowID(flowID string) string {
	safe := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') || r == '.' || r == '-' || r == '_' {
			return r
		}
		return '-'
	}, flowID)
	for strings.Contains(safe, "--") {
		safe = strings.ReplaceAll(safe, "--", "-")
	}
	return safe
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

func parseGoStack(stack string) []Frame {
	var frames []Frame
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
		frames = append(frames, Frame{Function: fn, File: loc})
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