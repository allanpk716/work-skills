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

**Output structure** (per-flow file separation):

```
~/.codepoint/<project>/
├── cp-go-2026-04-18_17-22-46_982.log                        ← general (no flow_id)
├── cp-go-flow-api-calculate-2026-04-18_17-22-46_982.log     ← flow-api-calculate
├── cp-go-flow-batch-process-2026-04-18_17-22-46_982.log     ← flow-batch-process
└── cp-go-flow-history-query-2026-04-18_17-22-46_982.log     ← flow-history-query
```

- Directory name: derived from `go.mod` module name (falls back to CWD basename)
- General file: entries without `flow_id` (`Point()`, `PointJSON()`, `PointWithMeta` without flow_id)
- Flow file: entries with matching `flow_id`, created lazily on first occurrence
- All files in same session share the same timestamp for correlation

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
```

## Quick Compile Check

After copying the base library to your project, verify it compiles:

```bash
cd your-project
go build ./codepoint/...
go vet ./codepoint/...
```

Expected: zero errors.

This catches type mismatches (e.g., `Frame` not being package-level) before you start adding probes.

> **Note:** The base library requires **Go 1.22+** (uses `http.NewServeMux` routing patterns). Verify your `go.mod` declares at least `go 1.22`.

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
	tsCloseFn = func() { f.Close() }

	fmt.Fprintf(f, "# Code Point Log (TypeScript via Go Collector)\n# Project: %s\n# Session: %s\n# Toggle: %s\n\n",
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
   - Exists -> opens `cp-ts-*.log`, enables `/__codepoint__` endpoint
   - Absent -> `/__codepoint__` returns 404
2. **Browser loads frontend**, calls `point("some_name")`:
   - POSTs to `/__codepoint__`
   - If 2xx -> stack trace written to `cp-ts-*.log`
   - If 404 -> stops sending (production or toggle off)
3. **Result**: Both Go and frontend code points in `~/.codepoint/<project>/`:
   ```
   ~/.codepoint/my-api/
   ├── cp-go-2026-04-17_15-30-45_123.log                        <- Go backend (general)
   ├── cp-go-flow-user-login-2026-04-17_15-30-45_123.log        <- Go flow-specific
   └── cp-ts-2026-04-17_15-30-45_456.log                        <- Frontend (via collector)
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

# 2. Run your service — output goes to ~/.codepoint/<project>/ per-flow files
go run ./...

# 3. Trigger the business scenario
curl http://localhost:8080/api/users

# 4. Check where the output went
ls ~/.codepoint/<project-name>/

# 5. Read a specific flow's log:
#   cat ~/.codepoint/my-api/cp-go-flow-user-login-2026-04-17_15-30-45_123.log

# 6. Or read all flows combined:
#   cat ~/.codepoint/my-api/cp-go-*.log
```

### Output File Location

```
~/.codepoint/
├── .codepoint-go                                               # toggle file (exists = enabled)
├── my-api/                                                     # Go project (from go.mod module name)
│   ├── cp-go-2026-04-17_15-30-45_123.log                      # general (no flow_id)
│   ├── cp-go-flow-user-login-2026-04-17_15-30-45_123.log      # user login flow
│   ├── cp-go-flow-user-register-2026-04-17_15-30-45_123.log   # user register flow
│   └── cp-go-flow-order-create-2026-04-17_15-30-45_123.log    # order create flow
```

### Flow File Format

```
# Code Point Log (Go) - Flow: flow-user-login
# Project: my-api
# Session: 2026-04-17T15:30:45.123456789+08:00
# Flow ID: flow-user-login

{"name":"cp-login-entry","timestamp":"2026-04-17T15:30:45.2Z","meta":{"point_id":"cp-login-entry","flow_id":"flow-user-login"},"stack":"..."}
{"name":"cp-auth-check","timestamp":"2026-04-17T15:30:45.3Z","meta":{"point_id":"cp-auth-check","flow_id":"flow-user-login"},"stack":"..."}
```

### Graceful Shutdown

```go
// Always call Close() to flush buffered output
defer codepoint.Close()
```

---

## V2 Probe Templates (with point_id and flow_id)

V2 probes include `point_id` and `flow_id` in metadata, enabling collection-based querying.

### Updated PointWithMeta Pattern

```go
// V2 probe: includes point_id and flow_id for collection indexing
codepoint.PointWithMeta("cp-auth-check", map[string]any{
    "point_id": "cp-auth-check",
    "flow_id":  "flow-user-login",
})

// V2 probe with additional context
codepoint.PointWithMeta("cp-order-validate-after", map[string]any{
    "point_id": "cp-order-validate-after",
    "flow_id":  "flow-order-create",
    "order_id": order.ID,
    "status":   "validated",
})
```

### Full Flow Example (V2)

```go
func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderReq) (*Order, error) {
    codepoint.PointWithMeta("cp-order-create-entry", map[string]any{
        "point_id": "cp-order-create-entry",
        "flow_id":  "flow-order-create",
    })

    validated, err := s.validate(req)
    codepoint.PointWithMeta("cp-order-after-validate", map[string]any{
        "point_id": "cp-order-after-validate",
        "flow_id":  "flow-order-create",
    })
    if err != nil {
        codepoint.PointWithMeta("cp-order-validate-error", map[string]any{
            "point_id": "cp-order-validate-error",
            "flow_id":  "flow-order-create",
            "error":    err.Error(),
        })
        return nil, err
    }

    priced, err := s.pricingEngine.Calculate(ctx, validated)
    codepoint.PointWithMeta("cp-order-after-price", map[string]any{
        "point_id": "cp-order-after-price",
        "flow_id":  "flow-order-create",
    })

    saved, err := s.repo.Save(ctx, priced)
    codepoint.PointWithMeta("cp-order-after-save", map[string]any{
        "point_id": "cp-order-after-save",
        "flow_id":  "flow-order-create",
        "order_id": saved.ID,
    })

    return saved, nil
}
```
