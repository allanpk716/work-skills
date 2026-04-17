# Go Code Point Implementation Guide

## Table of Contents
1. [Base Library](#base-library)
2. [Placement Patterns](#placement-patterns)
3. [HTTP Service Example](#http-service-example)
4. [Database Example](#database-example)
5. [Concurrency Patterns](#concurrency-patterns)
6. [Frontend Collector (Go+Frontend Projects)](#frontend-collector)
7. [Density Validation](#density-validation)
8. [AI Integration](#ai-integration)

## Toggle & Output Convention

**Enable**: `touch ~/.codepoint/.codepoint-go`
**Disable**: `rm ~/.codepoint/.codepoint-go`
**Output**: `~/.codepoint/<project-dir-name>/cp-go-YYYY-MM-DD_HH-MM-SS_mmm.log`

The base library detects the toggle file at startup and auto-creates the output directory + log file. All code point output goes to the log file automatically — no stderr redirection needed.

## Base Library

Create `codepoint/codepoint.go`:

```go
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

var (
	enabled  bool
	outFile  io.Writer
	closeFn  func()
	initOnce sync.Once
)

func init() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	togglePath := filepath.Join(home, ".codepoint", ".codepoint-go")
	if _, err := os.Stat(togglePath); err != nil {
		return // file doesn't exist → disabled
	}
	enabled = true

	// Project name = current working directory basename
	cwd, _ := os.Getwd()
	projectName := filepath.Base(cwd)

	// Output directory: ~/.codepoint/<project>/
	outDir := filepath.Join(home, ".codepoint", projectName)
	os.MkdirAll(outDir, 0755)

	// Output file: cp-go-YYYY-MM-DD_HH-MM-SS_mmm.log
	now := time.Now()
	ts := now.Format("2006-01-02_15-04-05")
	ms := now.Nanosecond() / 1e6
	filename := fmt.Sprintf("cp-go-%s_%03d.log", ts, ms)

	f, err := os.OpenFile(filepath.Join(outDir, filename), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		// Fallback to stderr if file creation fails
		outFile = os.Stderr
		return
	}
	outFile = f
	closeFn = func() { f.Close() }

	// Write header
	fmt.Fprintf(outFile, "# Code Point Log (Go)\n# Project: %s\n# Started: %s\n# Toggle: %s\n\n",
		projectName, now.Format(time.RFC3339Nano), togglePath)
}

// Close flushes and closes the output file. Call on graceful shutdown.
func Close() {
	if closeFn != nil {
		closeFn()
	}
}

// IsEnabled returns whether code points are active.
func IsEnabled() bool {
	return enabled
}

// OutputPath returns the log file path, or "" if disabled.
func OutputPath() string {
	if !enabled {
		return ""
	}
	if f, ok := outFile.(*os.File); ok {
		return f.Name()
	}
	return ""
}

// Point captures a stack trace at the call site. Zero cost when disabled.
func Point(name string) {
	if !enabled {
		return
	}
	buf := make([]byte, 8192)
	n := runtime.Stack(buf, false)
	fmt.Fprintf(outFile, "[CODEPOINT] %s\n%s\n", name, string(buf[:n]))
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
	fmt.Fprintf(outFile, "%s\n", data)
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
	fmt.Fprintf(outFile, "%s\n", data)
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
```

## Placement Patterns

### 1. HTTP Handler Chain

```go
func (s *Server) HandleRequest(w http.ResponseWriter, r *http.Request) {
	codepoint.Point("http_request_entry")

	// middleware processing
	s.authMiddleware(w, r)

	codepoint.Point("http_after_auth")

	// route to handler
	handler := s.router.Match(r.URL.Path)
	codepoint.Point("http_after_route")

	handler.ServeHTTP(w, r)
	codepoint.Point("http_response_sent")
}
```

### 2. Service Layer

```go
func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderReq) (*Order, error) {
	codepoint.Point("order_create_entry")

	validated, err := s.validate(req)
	codepoint.Point("order_after_validate")

	priced, err := s.pricingEngine.Calculate(ctx, validated)
	codepoint.Point("order_after_price")

	saved, err := s.repo.Save(ctx, priced)
	codepoint.Point("order_after_save")

	s.eventPub.Publish(ctx, OrderCreatedEvent{ID: saved.ID})
	codepoint.Point("order_after_event")
	return saved, nil
}
```

### 3. Goroutine Spawn Points

```go
func (p *Pipeline) Process(ctx context.Context, items []Item) {
	codepoint.Point("pipeline_process_entry")

	var wg sync.WaitGroup
	for _, item := range items {
		wg.Add(1)
		go func(it Item) {
			defer wg.Done()
			codepoint.Point("pipeline_worker_start")
			p.worker.Process(ctx, it)
			codepoint.Point("pipeline_worker_done")
		}(item)
	}
	wg.Wait()
	codepoint.Point("pipeline_process_complete")
}
```

### 4. gRPC Service

```go
func (s *Server) GetUser(ctx context.Context, req *pb.GetUserReq) (*pb.User, error) {
	codepoint.Point("grpc_getuser_entry")

	user, err := s.userService.GetByID(ctx, req.Id)
	if err != nil {
		codepoint.Point("grpc_getuser_error")
		return nil, err
	}

	codepoint.Point("grpc_getuser_success")
	return user, nil
}
```

## HTTP Service Example (Full Chain)

```go
// main.go
package main

import (
	"codepoint"
	"net/http"
)

func main() {
	defer codepoint.Close() // flush output on exit

	mux := http.NewServeMux()
	mux.HandleFunc("/api/users", handleUsers)
	http.ListenAndServe(":8080", mux)
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	codepoint.Point("users_handler_entry")

	switch r.Method {
	case http.MethodGet:
		codepoint.Point("users_list_entry")
		listUsers(w, r)
		codepoint.Point("users_list_done")
	case http.MethodPost:
		codepoint.Point("users_create_entry")
		createUser(w, r)
		codepoint.Point("users_create_done")
	}
}

func listUsers(w http.ResponseWriter, r *http.Request) {
	codepoint.Point("users_list_db_query")
	users := db.QueryUsers(r.Context())
	codepoint.Point("users_list_db_result")
	json.NewEncoder(w).Encode(users)
}
```

## Database Example

```go
func (db *Database) Insert(ctx context.Context, table string, record Record) error {
	codepoint.Point("db_insert_entry")

	parsed, err := db.parser.ParseInsert(table, record)
	codepoint.Point("db_insert_after_parse")

	plan, err := db.optimizer.Plan(ctx, parsed)
	codepoint.Point("db_insert_after_plan")

	txn, err := db.txnMgr.Begin(ctx)
	codepoint.Point("db_insert_txn_begin")

	err = db.executor.Execute(ctx, plan, txn)
	codepoint.Point("db_insert_after_exec")

	err = db.txnMgr.Commit(txn)
	codepoint.Point("db_insert_after_commit")
	return err
}
```

## Concurrency Patterns

### Detecting Race Conditions

```go
func (m *Manager) UpdateState(key string, value any) {
	codepoint.PointWithMeta("state_update_before_lock", map[string]any{"key": key})

	m.mu.Lock()
	codepoint.Point("state_update_lock_acquired")

	m.state[key] = value
	codepoint.Point("state_update_modified")

	m.mu.Unlock()
	codepoint.Point("state_update_lock_released")
}
```

### Channel Communication

```go
func (p *Processor) Start(ctx context.Context) {
	codepoint.Point("processor_start")

	for {
		select {
		case msg := <-p.inputCh:
			codepoint.PointWithMeta("processor_msg_received", map[string]any{"type": msg.Type})
			p.handle(ctx, msg)
			codepoint.Point("processor_msg_handled")
		case <-ctx.Done():
			codepoint.Point("processor_shutdown")
			return
		}
	}
}
```

## Frontend Collector (Go+Frontend Projects)

When the frontend is compiled and embedded into the Go binary (via `go:embed`), the Go backend can act as a collector for browser code points. The frontend `point()` function POSTs stack traces to a backend endpoint, which writes them to `cp-ts-*.log`.

This means:
- **One toggle file** (`~/.codepoint/.codepoint-ts`) controls both Go and frontend code points
- **One process** manages everything — no separate dev server needed
- **Zero build-time config** — frontend doesn't need env variables

### Collector Implementation

Create `codepoint/collector.go`:

```go
package codepoint

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var (
	tsEnabled bool
	tsOutFile *os.File
	tsCloseFn func()
)

func initCollector() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	togglePath := filepath.Join(home, ".codepoint", ".codepoint-ts")
	if _, err := os.Stat(togglePath); err != nil {
		return // no toggle file → frontend code points disabled
	}
	tsEnabled = true

	cwd, _ := os.Getwd()
	projectName := filepath.Base(cwd)
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
	tsCloseFn = func() { f.Close() }

	fmt.Fprintf(f, "# Code Point Log (TypeScript via Go Collector)\n# Project: %s\n# Started: %s\n# Toggle: %s\n\n",
		projectName, now.Format(time.RFC3339Nano), togglePath)
}

func init() {
	initCollector()
}

// CloseCollector flushes and closes the frontend collector output file.
func CloseCollector() {
	if tsCloseFn != nil {
		tsCloseFn()
	}
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
// The frontend library stops sending after one 404 — zero overhead in production.
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
		fmt.Fprintf(tsOutFile, "[CODEPOINT] %s\n%s\n", entry.Name, entry.Stack)
		w.WriteHeader(http.StatusNoContent)
	}
}
```

### Integration with Go Server

```go
// main.go
package main

import (
	"codepoint"
	"embed"
	"net/http"
)

//go:embed dist/*
var frontendDist embed.FS

func main() {
	defer codepoint.Close()        // flush Go code points
	defer codepoint.CloseCollector() // flush frontend code points

	mux := http.NewServeMux()

	// Register the frontend collector endpoint
	mux.HandleFunc("/__codepoint__", codepoint.CollectorHandler())

	// API routes
	mux.HandleFunc("/api/users", handleUsers)

	// Serve embedded frontend (must be last — catches all other routes)
	mux.Handle("/", http.FileServer(http.FS(frontendDist)))

	http.ListenAndServe(":8080", mux)
}
```

### How It Works

1. **Go starts**, checks `~/.codepoint/.codepoint-ts`:
   - Exists → opens `cp-ts-*.log`, enables `/__codepoint__` endpoint
   - Absent → `/__codepoint__` returns 404
2. **Browser loads frontend**, calls `point("some_name")`:
   - POSTs to `/__codepoint__`
   - If 2xx → stack trace written to `cp-ts-*.log`
   - If 404 → stops sending (production or toggle off)
3. **Result**: Both Go and frontend code points in `~/.codepoint/<project>/`:
   ```
   ~/.codepoint/my-project/
   ├── cp-go-2026-04-17_15-30-45_123.log   ← Go backend
   └── cp-ts-2026-04-17_15-30-45_456.log   ← Frontend (via collector)
   ```

## Density Validation

```go
// validation_test.go
// Force-enable code points for testing
func TestMain(m *testing.M) {
	home, _ := os.UserHomeDir()
	toggleDir := filepath.Join(home, ".codepoint")
	os.MkdirAll(toggleDir, 0755)
	toggleFile := filepath.Join(toggleDir, ".codepoint-go")
	os.WriteFile(toggleFile, []byte{}, 0644)
	defer os.Remove(toggleFile)

	m.Run()
}

func TestCodePointDensity(t *testing.T) {
	if !codepoint.IsEnabled() {
		t.Skip("Code points not enabled")
	}

	// Capture stacks from two adjacent code points
	s1 := codepoint.CollectStack("point_a")
	s2 := codepoint.CollectStack("point_b")

	overlap := codepoint.AnalyzeOverlap(s1, s2)

	if overlap > 0.8 {
		t.Logf("Points too dense (overlap=%.2f), consider removing one", overlap)
	}
	if overlap == 0 {
		t.Log("Points too sparse (no overlap), add intermediate points")
	}
	if overlap >= 0.2 && overlap <= 0.6 {
		t.Logf("Good density (overlap=%.2f)", overlap)
	}

	t.Logf("Output written to: %s", codepoint.OutputPath())
}
```

## AI Integration

### Enable / Disable

```bash
# Enable Go code points
mkdir -p ~/.codepoint && touch ~/.codepoint/.codepoint-go

# Disable Go code points
rm ~/.codepoint/.codepoint-go
```

### Capture & Analyze

```bash
# 1. Enable (one-time setup)
touch ~/.codepoint/.codepoint-go

# 2. Run your service — output goes to ~/.codepoint/<project>/cp-go-*.log automatically
go run ./...

# 3. Trigger the business scenario
curl http://localhost:8080/api/users

# 4. Check where the output went
ls ~/.codepoint/<project-name>/

# 5. In Claude Code session, feed the log to AI:
#   "Read ~/.codepoint/my-api/cp-go-2026-04-17_15-30-45_123.log and analyze the execution paths"
```

### Output File Location

```
~/.codepoint/
├── .codepoint-go                          # toggle file (exists = enabled)
├── my-api/                                # Go project
│   ├── cp-go-2026-04-17_15-30-45_123.log  # first debug session
│   └── cp-go-2026-04-17_16-22-10_456.log  # second debug session
```

### Output Format

```
# Code Point Log (Go)
# Project: my-api
# Started: 2026-04-17T15:30:45.123456789+08:00
# Toggle: /home/user/.codepoint/.codepoint-go

[CODEPOINT] users_handler_entry
goroutine 1 [running]:
main.handleUsers(...)
        /app/main.go:15 +0x3a
net/http.HandlerFunc.ServeHTTP(...)
        /usr/local/go/src/net/http/server.go:2136 +0x37
net/http.(*ServeMux).ServeHTTP(...)
        /usr/local/go/src/net/http/server.go:2514 +0x194
...
```

### Graceful Shutdown

```go
// Always call Close() to flush buffered output
defer codepoint.Close()
```
