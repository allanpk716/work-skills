package codepoint

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var (
	tsEnabled   bool
	tsOutFile   *os.File
	tsOutDir    string
	tsTimestamp string
	tsMillis    int
	tsProject   string
	tsFlowFiles map[string]*os.File
	tsMu        sync.Mutex
	tsCloseFns  []func()
)

func initCollector() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	togglePath := filepath.Join(home, ".codepoint", ".codepoint-ts")
	if _, err := os.Stat(togglePath); err != nil {
		return // no toggle file -> frontend code points disabled
	}
	tsEnabled = true

	projectName := detectModuleName()
	outDir := filepath.Join(home, ".codepoint", projectName)
	os.MkdirAll(outDir, 0755)

	now := time.Now()
	ts := now.Format("2006-01-02_15-04-05")
	ms := now.Nanosecond() / 1e6
	filename := fmt.Sprintf("cp-ts-%s_%03d.log", ts, ms)

	f, err := os.OpenFile(filepath.Join(outDir, filename), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return
	}

	tsOutFile = f
	tsOutDir = outDir
	tsTimestamp = ts
	tsMillis = ms
	tsProject = projectName
	tsFlowFiles = make(map[string]*os.File)

	fmt.Fprintf(f, "# Code Point Log (TypeScript via Go Collector)\n# Project: %s\n# Session: %s\n# Toggle: %s\n\n",
		projectName, now.Format(time.RFC3339Nano), togglePath)

	tsCloseFns = append(tsCloseFns, func() { f.Close() })
}

func init() {
	initCollector()
}

// CloseCollector flushes and closes the frontend collector output file and all flow files.
func CloseCollector() {
	tsMu.Lock()
	defer tsMu.Unlock()

	if tsOutFile != nil {
		tsOutFile.Close()
		tsOutFile = nil
	}
	for id, f := range tsFlowFiles {
		f.Close()
		delete(tsFlowFiles, id)
	}
	for _, fn := range tsCloseFns {
		fn()
	}
	tsCloseFns = nil
}

// FrontendEntry is the JSON payload sent from the browser.
type FrontendEntry struct {
	Name      string                 `json:"name"`
	Stack     string                 `json:"stack"`
	Timestamp string                 `json:"timestamp"`
	Meta      map[string]interface{} `json:"meta,omitempty"`
}

// CollectorHandler returns an http.HandlerFunc that receives frontend code points.
// Register it at POST /__codepoint__.
//
// When the toggle file (~/.codepoint/.codepoint-ts) is absent, returns 404.
// The frontend library stops sending after one 404 -- zero overhead in production.
//
// Enhanced: routes entries with flow_id to per-flow log files and writes JSON
// for meta-bearing entries (matching Go-side PointWithMeta output format).
func CollectorHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !tsEnabled || tsOutFile == nil {
			http.NotFound(w, r)
			return
		}
		var entry FrontendEntry
		if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		// Extract flow_id from meta
		flowID := ""
		if entry.Meta != nil {
			if v, ok := entry.Meta["flow_id"]; ok {
				if s, ok := v.(string); ok && s != "" {
					flowID = s
				}
			}
		}

		tsMu.Lock()
		defer tsMu.Unlock()

		if flowID != "" {
			// Route to flow-specific file (matching Go side behavior)
			fw := getOrCreateTsFlowFile(flowID)
			// Write structured JSON (not raw text) for parseable output
			data, _ := json.Marshal(map[string]any{
				"name":      entry.Name,
				"timestamp": entry.Timestamp,
				"meta":      entry.Meta,
				"stack":     entry.Stack,
			})
			fmt.Fprintf(fw, "%s\n", data)
		} else if entry.Meta != nil && len(entry.Meta) > 0 {
			// Has meta but no flow_id -> general file, JSON format
			data, _ := json.Marshal(map[string]any{
				"name":      entry.Name,
				"timestamp": entry.Timestamp,
				"meta":      entry.Meta,
				"stack":     entry.Stack,
			})
			fmt.Fprintf(tsOutFile, "%s\n", data)
		} else {
			// No meta at all -> plain text format (backward compatible)
			fmt.Fprintf(tsOutFile, "[CODEPOINT] %s\n%s\n", entry.Name, entry.Stack)
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// getOrCreateTsFlowFile returns (or creates) the flow-specific log file for the given flowID.
// Caller MUST hold tsMu before calling this function.
func getOrCreateTsFlowFile(flowID string) *os.File {
	if f, ok := tsFlowFiles[flowID]; ok {
		return f
	}

	safeName := sanitizeFlowID(flowID)
	filename := fmt.Sprintf("cp-ts-%s-%s_%03d.log", safeName, tsTimestamp, tsMillis)
	f, err := os.OpenFile(filepath.Join(tsOutDir, filename), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		if tsOutFile != nil {
			return tsOutFile
		}
		return nil
	}

	fmt.Fprintf(f, "# Code Point Log (TypeScript via Go Collector) - Flow: %s\n# Project: %s\n# Session: %s\n# Flow ID: %s\n\n",
		safeName, tsProject, time.Now().Format(time.RFC3339Nano), flowID)

	tsFlowFiles[flowID] = f
	return f
}
